import React, { useState } from 'react';
import { X, Send, Copy, Check, MessageSquare } from 'lucide-react';
import { ReminderResponseData } from '../services/api';

interface ReminderModalProps {
  reminderData: ReminderResponseData | null;
  isOpen: boolean;
  onClose: () => void;
  lang: 'en' | 'hi';
}

export const ReminderModal: React.FC<ReminderModalProps> = ({
  reminderData,
  isOpen,
  onClose,
  lang,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !reminderData) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(reminderData.message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenWhatsApp = () => {
    window.open(reminderData.wa_link, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="glass-panel max-w-md w-full p-6 shadow-2xl border border-white/20 text-[#ece8e4] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#5fb49c]/20 border border-[#5fb49c]/40 text-[#5fb49c] flex items-center justify-center shadow-inner">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-heading font-extrabold text-[#ece8e4]">
                {lang === 'hi' ? 'व्हाट्सएप तकाजा संदेश' : 'WhatsApp Payment Reminder'}
              </h3>
              <p className="text-xs text-[#b6bcc5] font-medium mt-0.5">
                {reminderData.customer_name} • <span className="font-mono">{reminderData.phone}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#b6bcc5] hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Bubble Preview */}
        <div className="mt-4">
          <label className="block text-xs font-semibold text-[#b6bcc5] mb-1.5">
            {lang === 'hi' ? 'भेजे जाने वाला संदेश:' : 'Pre-drafted Message Preview:'}
          </label>
          <div className="bg-black/50 border border-white/15 rounded-2xl p-4 font-mono text-xs text-[#ece8e4] whitespace-pre-wrap leading-relaxed relative">
            {reminderData.message}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 space-y-2.5">
          {/* Primary 1-Click WhatsApp Button */}
          <button
            type="button"
            onClick={handleOpenWhatsApp}
            id="open-whatsapp-link-button"
            className="w-full py-3.5 px-4 rounded-full bg-[#5fb49c] hover:bg-[#4ea08a] active:scale-[0.99] text-[#000000] font-heading font-extrabold text-sm shadow-lg shadow-[#5fb49c]/20 flex items-center justify-center gap-2 transition-all min-h-[44px]"
          >
            <Send className="w-4 h-4" />
            <span>{lang === 'hi' ? 'व्हाट्सएप पर भेजें (1-क्लिक)' : 'Send via WhatsApp (1-Click)'}</span>
          </button>

          {/* Secondary Copy Button */}
          <button
            type="button"
            onClick={handleCopy}
            className="w-full py-3 px-4 rounded-full border border-white/20 hover:border-white/40 bg-black/30 hover:bg-black/60 text-[#b6bcc5] hover:text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors min-h-[44px]"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-[#5fb49c]" />
                <span className="text-[#5fb49c] font-bold">
                  {lang === 'hi' ? 'कॉपी हो गया!' : 'Copied to Clipboard!'}
                </span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-[#b6bcc5]" />
                <span>{lang === 'hi' ? 'संदेश कॉपी करें' : 'Copy Message Text'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

