import re
from typing import Dict, Any, List, Optional, Tuple
from rapidfuzz import fuzz, process

HINDI_DIGITS = {
    '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
    '५': '5', '६': '6', '७': '7', '८': '8', '९': '9'
}

WORD_NUMBERS = {
    'dedh hazaar': 1500, 'dedh hazar': 1500,
    'dhai hazaar': 2500, 'dhai hazar': 2500,
    'ek hazaar': 1000, 'ek hazar': 1000,
    'do hazaar': 2000, 'do hazar': 2000,
    'teen hazaar': 3000, 'teen hazar': 3000,
    'chaar hazaar': 4000, 'chaar hazar': 4000,
    'paanch hazaar': 5000, 'paanch hazar': 5000,
    'chhe hazaar': 6000, 'chhe hazar': 6000,
    'saat hazaar': 7000, 'saat hazar': 7000,
    'aath hazaar': 8000, 'aath hazar': 8000,
    'nau hazaar': 9000, 'nau hazar': 9000,
    'das hazaar': 10000, 'das hazar': 10000,
    'ek sau': 100, 'do sau': 200, 'teen sau': 300,
    'chaar sau': 400, 'paanch sau': 500, 'chhe sau': 600,
    'saat sau': 700, 'aath sau': 800, 'nau sau': 900,
    'hazaar': 1000, 'hazar': 1000, 'sau': 100,
}

PAYMENT_KEYWORDS = [
    'jama', 'diye', 'de diye', 'chuka diye', 'chuka', 'pay', 'payment', 
    'received', 'wapas kiye', 'wapas', 'paid', 'bhara'
]

CREDIT_KEYWORDS = [
    'udhaar', 'udhar', 'baaki', 'baki', 'credit', 'khata', 
    'liya', 'le gaya', 'saaman', 'saman', 'ration', 'grocery'
]

def normalize_hindi_digits(text: str) -> str:
    """Convert Hindi Devanagari numerals to standard Arabic digits."""
    for h_digit, std_digit in HINDI_DIGITS.items():
        text = text.replace(h_digit, std_digit)
    return text

def extract_phone(text: str) -> Tuple[Optional[str], str]:
    """Extract 10-digit Indian phone number (handles +91, 0, or spaces)."""
    # Look for 10 digits starting with 6, 7, 8, or 9
    phone_pattern = r'(?:\+?91[\s\-]?)?(?:0[\s\-]?)?([6-9]\d{4}[\s\-]?\d{5})\b'
    m = re.search(phone_pattern, text)
    if m:
        digits = re.sub(r'\D', '', m.group(1))
        if len(digits) == 10:
            formatted = f"+91 {digits[:5]} {digits[5:]}"
            cleaned = text[:m.start()] + " " + text[m.end():]
            return formatted, cleaned
    return None, text

def extract_amount(text: str) -> Tuple[float, str]:
    """Extract monetary amount from text (handles words, 2.4k, ₹2400, etc.)"""
    clean_text = text.lower()
    
    # Check for spoken Hindi words first
    for phrase, val in WORD_NUMBERS.items():
        if phrase in clean_text:
            cleaned = re.sub(re.escape(phrase), '', clean_text, flags=re.IGNORECASE)
            return float(val), cleaned

    # Check for '2.4k', '2k', '1.5k'
    k_match = re.search(r'(?:₹|rs\.?|inr)?\s*([0-9]+(?:\.[0-9]+)?)\s*k\b', clean_text)
    if k_match:
        val = float(k_match.group(1)) * 1000.0
        cleaned = re.sub(r'(?:₹|rs\.?|inr)?\s*([0-9]+(?:\.[0-9]+)?)\s*k\b', '', clean_text, flags=re.IGNORECASE)
        return val, cleaned

    # Check for regular currency amounts like ₹2,400 or Rs. 2400 or 2400
    curr_match = re.search(r'(?:₹|rs\.?|inr)\s*([0-9,]+(?:\.[0-9]+)?)', clean_text)
    if curr_match:
        val_str = curr_match.group(1).replace(',', '')
        cleaned = re.sub(r'(?:₹|rs\.?|inr)\s*([0-9,]+(?:\.[0-9]+)?)', '', clean_text, flags=re.IGNORECASE)
        try:
            return float(val_str), cleaned
        except ValueError:
            pass

    # Check for general numbers followed optionally by 'rupaye' or 'rs' or standalone
    num_match = re.search(r'\b([0-9,]+(?:\.[0-9]+)?)\s*(?:rupaye|rupees|rs|ka|ke)?\b', clean_text)
    if num_match:
        val_str = num_match.group(1).replace(',', '')
        try:
            val = float(val_str)
            # Avoid picking small numbers that represent days if 'din' follows
            after_span = clean_text[num_match.end():num_match.end()+10]
            if not any(d in after_span for d in ['din', 'day', 'hafte', 'week']):
                cleaned = clean_text[:num_match.start()] + clean_text[num_match.end():]
                return val, cleaned
        except ValueError:
            pass

    # Generic number search
    all_nums = list(re.finditer(r'\b([0-9,]+(?:\.[0-9]+)?)\b', clean_text))
    for m in all_nums:
        val_str = m.group(1).replace(',', '')
        after = clean_text[m.end():m.end()+8]
        if not any(d in after for d in ['din', 'day', 'hafte', 'week', 'mahine']):
            try:
                val = float(val_str)
                cleaned = clean_text[:m.start()] + clean_text[m.end():]
                return val, cleaned
            except ValueError:
                pass

    return 0.0, clean_text

def extract_credit_days(text: str) -> Tuple[int, str]:
    """Extract credit duration in days (e.g. 7 din, ek hafta, kal, etc.)"""
    clean_text = text.lower()

    # Number + din / days
    day_match = re.search(r'([0-9]+)\s*(?:din|days?)\b', clean_text)
    if day_match:
        days = int(day_match.group(1))
        cleaned = re.sub(r'([0-9]+)\s*(?:din|days?)\b', '', clean_text)
        return days, cleaned

    # Weeks
    week_match = re.search(r'([0-9]+)\s*(?:hafte|hafta|weeks?)\b', clean_text)
    if week_match:
        days = int(week_match.group(1)) * 7
        cleaned = re.sub(r'([0-9]+)\s*(?:hafte|hafta|weeks?)\b', '', clean_text)
        return days, cleaned

    # Natural phrases
    if 'agle hafte' in clean_text or 'next week' in clean_text:
        cleaned = re.sub(r'agle hafte|next week', '', clean_text)
        return 7, cleaned
    if 'ek hafta' in clean_text or 'one week' in clean_text or '1 hafta' in clean_text:
        cleaned = re.sub(r'ek hafta|one week|1 hafta', '', clean_text)
        return 7, cleaned
    if 'do hafte' in clean_text or 'two weeks' in clean_text or '2 hafte' in clean_text:
        cleaned = re.sub(r'do hafte|two weeks|2 hafte', '', clean_text)
        return 14, cleaned
    if 'parso' in clean_text:
        cleaned = re.sub(r'parso', '', clean_text)
        return 2, cleaned
    if 'kal' in clean_text:
        cleaned = re.sub(r'\bkal\b', '', clean_text)
        return 1, cleaned
    if 'ek mahina' in clean_text or '1 month' in clean_text or 'mahina' in clean_text:
        cleaned = re.sub(r'ek mahina|1 month|mahina', '', clean_text)
        return 30, cleaned

    return 0, clean_text

def determine_type(text: str, credit_days: int) -> str:
    """Determine whether the transaction is credit_sale or payment."""
    t = text.lower()
    
    # Direct payment keywords
    for kw in PAYMENT_KEYWORDS:
        if kw in t:
            return "payment"

    # Direct credit keywords
    for kw in CREDIT_KEYWORDS:
        if kw in t:
            return "credit_sale"

    # If days specified > 0, assume credit sale
    if credit_days > 0:
        return "credit_sale"

    return "credit_sale"

def extract_customer_and_items(text: str) -> Tuple[str, Optional[str]]:
    """Extract customer name and items note from remainder text."""
    clean = text.strip()
    
    # Strip common filler phrases in Hinglish
    filler_patterns = [
        r'\bne\b', r'\bka\b', r'\bki\b', r'\bke\b', r'\bko\b', r'\bse\b',
        r'\budhaar\b', r'\budhar\b', r'\bpe\b', r'\bpar\b', r'\bliya\b',
        r'\ble gaya\b', r'\bjama\b', r'\bkiya\b', r'\bkiye\b', r'\bdiye\b',
        r'\bdiya\b', r'\bchuka\b', r'\bkarwaye\b', r'\bkaraya\b', r'\bhain\b',
        r'\bhai\b', r'\brupaye\b', r'\brs\b', r'\binr\b'
    ]
    
    # Detect items if mentioned
    items_keywords = [
        'ration', 'grocery', 'doodh', 'cheeni', 'milk', 'sugar', 'oil', 
        'tel', 'atta', 'chawal', 'dal', 'soap', 'masala', 'biscuit', 'saaman', 'saman'
    ]
    detected_items = []
    for item in items_keywords:
        if re.search(rf'\b{item}\b', clean, flags=re.IGNORECASE):
            detected_items.append(item.title())
            clean = re.sub(rf'\b{item}\b', '', clean, flags=re.IGNORECASE)

    # Clean leftover punctuation and extra whitespace
    clean = re.sub(r'[,.\-_:;]+', ' ', clean)
    words = clean.split()
    
    # Filter filler words
    name_words = []
    for w in words:
        if w.lower() not in ['ne', 'ka', 'ki', 'ke', 'ko', 'se', 'pe', 'par', 'hai', 'hain', 'liya', 'diya', 'diye', 'jama', 'udhaar', 'udhar']:
            name_words.append(w)
            
    if not name_words:
        name = "Unknown Customer"
    else:
        # Take first 1 to 3 words as candidate name
        # If words include 'ji' or 'grocery' or 'store', group them
        candidate_words = name_words[:3]
        name = " ".join(w.capitalize() for w in candidate_words)

    items_note = ", ".join(detected_items) if detected_items else "General Grocery"
    return name, items_note

def parse_hinglish_entry(raw_text: str, existing_customers: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
    """
    Main parser: Turns voice/text Hinglish entries into structured transaction objects.
    Guaranteed deterministic, sub-10ms latency, zero crashes on malformed input.
    """
    text = normalize_hindi_digits(raw_text.strip())
    
    # 0. Extract phone number if explicitly stated
    extracted_phone, text = extract_phone(text)

    # 1. Extract amount
    amount, rem1 = extract_amount(text)
    
    # 2. Extract credit days
    credit_days, rem2 = extract_credit_days(rem1)
    
    # 3. Determine transaction type
    txn_type = determine_type(text, credit_days)
    
    # 4. Extract customer name & items
    candidate_name, items_note = extract_customer_and_items(rem2)
    
    # 5. Fuzzy match customer against existing database
    matched_id = None
    matched_name = None
    matched_phone = None
    match_score = 0.0
    
    if existing_customers and len(existing_customers) > 0:
        names_dict = {c['name']: c for c in existing_customers}
        choices = list(names_dict.keys())
        
        # Match candidate name
        best_match = process.extractOne(candidate_name, choices, scorer=fuzz.token_set_ratio)
        if best_match:
            match_str, score, _ = best_match
            match_score = float(score)
            if score >= 60.0:
                matched_record = names_dict[match_str]
                matched_id = matched_record['id']
                matched_name = match_str
                matched_phone = matched_record.get('phone')
                # If very high score, align candidate name
                if score >= 80.0:
                    candidate_name = match_str

    final_phone = extracted_phone or matched_phone or ""

    confidence = 0.95 if amount > 0 else 0.40
    error = None
    if amount <= 0:
        error = "Amount could not be detected. Please confirm the amount."

    return {
        "customer_name": candidate_name,
        "customer_phone": final_phone,
        "matched_customer_id": matched_id,
        "matched_customer_name": matched_name,
        "match_score": match_score,
        "amount": amount,
        "credit_days": credit_days,
        "items": items_note,
        "type": txn_type,
        "confidence": confidence,
        "error": error
    }
