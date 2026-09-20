import React, { useState } from 'react';
import { Send, Sparkles, AlertCircle } from 'lucide-react';
import { VoiceInputButton } from '../components/VoiceInputButton';
import { ConfirmationCard } from '../components/ConfirmationCard';
import { parseHinglishEntry, saveTransaction, ParseResultData } from '../services/api';

interface QuickEntryProps {
  onSuccess: (customerId?: number) => void;
  lang: 'en' | 'hi';
}

const PRESETS = [
  { label: 'Sharma ji (₹2,400 udhaar)',     text: 'Sharma ji ne ₹2,400 ka saaman 7 din udhaar pe liya.' },
  { label: 'Verma ji (₹1,500 payment)',     text: 'Verma ji ne ₹1,500 jama karwaye' },
  { label: 'Gupta ji (Hindi numerals)',     text: 'Gupta ji ne २४०० ka ration 10 din udhaar liya' },
  { label: 'Sharma ji (colloquial)',        text: 'Sharma ji dhai hazaar ek hafta udhaar' },
];

export const QuickEntry: React.FC<QuickEntryProps> = ({ onSuccess, lang }) => {
  const [inputText, setInputText]   = useState('');
  const [isParsing, setIsParsing]   = useState(false);
  const [parsedData, setParsedData] = useState<ParseResultData | null>(null);
  const [isSaving, setIsSaving]     = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  const handleParse = async (text: string) => {
    if (!text.trim()) return;
    try {
      setIsParsing(true);
      setParseError(null);
      setParsedData(null);
      const res = await parseHinglishEntry(text);
      setParsedData(res);
    } catch (err: any) {
      setParseError(err.message || 'Failed to parse entry');
    } finally {
      setIsParsing(false);
    }
  };

  const handleSave = async () => {
    if (!parsedData) return;
    try {
      setIsSaving(true);
      const saved = await saveTransaction({
        customer_id: parsedData.matched_customer_id,
        customer_name: parsedData.customer_name,
        customer_phone: parsedData.customer_phone,
        type: parsedData.type,
        amount: parsedData.amount,
        items_note: parsedData.items,
        credit_days: parsedData.credit_days,
      });
      onSuccess(saved.customer_id);
    } catch (err: any) {
      alert('Error saving: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4 pb-20 pt-1">
      {/* Title */}
      <div className="text-center py-1">
        <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-[#ece8e4] tracking-tight">
          {lang === 'hi' ? 'त्वरित खाता प्रविष्टि' : 'Quick Ledger Entry'}
        </h2>
        <p className="text-xs text-[#b6bcc5] mt-1 font-normal">
          {lang === 'hi' ? 'आवाज़ या हिंग्लिश में बोलें / लिखें (2 क्लिक में दर्ज)' : 'Speak or type in Hinglish — parsed in 2 taps'}
        </p>
      </div>

      {/* Voice + text card */}
      <div className="glass-panel p-5 sm:p-6 shadow-glass border border-white/12 space-y-4">
        {/* Big Hero Mic */}
        <div className="flex justify-center">
          <VoiceInputButton
            onTranscript={(t) => { setInputText(t); handleParse(t); }}
            lang={lang}
          />
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 text-[10px] font-mono font-bold text-[#b6bcc5]/50 uppercase tracking-widest">
          <div className="flex-1 h-px bg-white/10" />
          <span>{lang === 'hi' ? 'या टाइप करें' : 'or type below'}</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Textarea Input */}
        <div className="relative">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleParse(inputText); }
            }}
            placeholder={
              lang === 'hi'
                ? '"Sharma ji ne ₹2,400 ka saaman 7 din udhaar pe liya"'
                : '"Sharma ji ne ₹2,400 ka saaman 7 din udhaar pe liya"'
            }
            rows={2}
            className="w-full glass-panel-subtle text-sm font-medium p-3.5 pr-12 outline-none text-[#ece8e4] resize-none placeholder:text-[#b6bcc5]/40 focus:border-[#bc7363] focus:shadow-[0_0_0_2px_rgba(188,115,99,0.6)] transition-all"
          />
          <button
            type="button"
            onClick={() => handleParse(inputText)}
            disabled={isParsing || !inputText.trim()}
            id="parse-entry-button"
            className="absolute right-2.5 bottom-2.5 w-8 h-8 rounded-lg bg-[#bc7363] hover:bg-[#895c47] active:scale-95 disabled:opacity-30 text-white flex items-center justify-center transition-all cursor-pointer shadow-xs"
          >
            {isParsing
              ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <Send className="w-3.5 h-3.5" />
            }
          </button>
        </div>

        {/* Demo presets */}
        <div className="pt-2 border-t border-white/10">
          <div className="flex items-center gap-1.5 text-[10px] font-heading font-extrabold text-[#bc7363] uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{lang === 'hi' ? 'त्वरित उदाहरण (1-टैप परीक्षण)' : 'Quick Presets (1-Tap Test)'}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {PRESETS.map((p, i) => (
              <button
                key={i}
                type="button"
                onClick={() => { setInputText(p.text); handleParse(p.text); }}
                className="text-left text-xs font-sans font-medium bg-black/50 hover:bg-white hover:text-black border border-white/15 text-[#ece8e4] px-3 py-2 rounded-xl transition-all cursor-pointer truncate active:scale-98"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {parseError && (
        <div className="flex items-center gap-2 p-3.5 bg-[#d9604f]/20 border border-[#d9604f]/40 rounded-xl text-xs text-[#ece8e4] font-medium">
          <AlertCircle className="w-4 h-4 text-[#d9604f] shrink-0" />
          <span>{parseError}</span>
        </div>
      )}

      {/* Editable Confirmation Card */}
      {parsedData && (
        <ConfirmationCard
          parsedData={parsedData}
          onUpdate={(u) => setParsedData(u)}
          onSave={handleSave}
          isSaving={isSaving}
          lang={lang}
        />
      )}
    </div>
  );
};

