from backend.app.parser import parse_hinglish_entry

SAMPLE_CUSTOMERS = [
    {"id": 1, "name": "Sharma Ji (Ramesh)"},
    {"id": 2, "name": "Verma Ji (Anand)"},
    {"id": 3, "name": "Gupta Ji (Suresh)"},
]

def test_parse_standard_credit_sale():
    text = "Sharma ji ne ₹2,400 ka saaman 7 din udhaar pe liya."
    res = parse_hinglish_entry(text, SAMPLE_CUSTOMERS)
    
    assert res["amount"] == 2400.0
    assert res["credit_days"] == 7
    assert res["type"] == "credit_sale"
    assert res["matched_customer_id"] == 1
    assert "Sharma" in res["customer_name"]

def test_parse_payment_entry():
    text = "Verma ji ne ₹1,500 jama karwaye"
    res = parse_hinglish_entry(text, SAMPLE_CUSTOMERS)

    assert res["amount"] == 1500.0
    assert res["type"] == "payment"
    assert res["matched_customer_id"] == 2

def test_parse_hindi_numerals():
    text = "Gupta ji ne २४०० ka ration 10 din udhaar liya"
    res = parse_hinglish_entry(text, SAMPLE_CUSTOMERS)

    assert res["amount"] == 2400.0
    assert res["credit_days"] == 10
    assert res["type"] == "credit_sale"
    assert res["matched_customer_id"] == 3

def test_parse_colloquial_dhai_hazaar():
    text = "Sharma ji dhai hazaar ek hafta udhaar"
    res = parse_hinglish_entry(text, SAMPLE_CUSTOMERS)

    assert res["amount"] == 2500.0
    assert res["credit_days"] == 7
    assert res["type"] == "credit_sale"

def test_parse_k_notation():
    text = "Verma ji 2.4k udhar 7 days"
    res = parse_hinglish_entry(text, SAMPLE_CUSTOMERS)

    assert res["amount"] == 2400.0
    assert res["credit_days"] == 7

def test_parse_missing_amount_handling():
    text = "Sharma ji ne saaman liya"
    res = parse_hinglish_entry(text, SAMPLE_CUSTOMERS)

    assert res["amount"] == 0.0
    assert res["error"] is not None
    assert "confirm the amount" in res["error"]

def test_parse_with_phone_number():
    text = "Kunal Sharma 9876543210 ne 1200 ka ration liya"
    res = parse_hinglish_entry(text, SAMPLE_CUSTOMERS)
    assert res["amount"] == 1200.0
    assert res["customer_phone"] == "+91 98765 43210"

