import React from 'react';
import { CheckCircle2, UserCheck, Calendar, ShoppingBag, ArrowRight, Phone, MessageCircle } from 'lucide-react';
import { ParseResultData } from '../services/api';
import { formatINR } from '../utils/formatters';

interface ConfirmationCardProps {
  parsedData: ParseResultData;
  onUpdate: (updated: ParseResultData) => void;
  onSave: () => void;
  isSaving: boolean;
  lang: 'en' | 'hi';
}

export const ConfirmationCard: React.FC<ConfirmationCardProps> = ({
  parsedData,
  onUpdate,
  onSave,
  isSaving,
  lang,
}) => {
  const isPayment = parsedData.type === 'payment';

  return (
    <div className="glass-panel p-5 sm:p-6 mt-4 shadow-glass border border-[#bc7363]/40 transition-all">
      {/* Header Match Status */}
      <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-black/60 border border-[#bc7363]/50 flex items-center justify-center text-[#bc7363]">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-sm text-[#ece8e4]">
              {lang === 'hi' ? 'पहचाना गया विवरण' : 'Parsed Entry Confirmation'}
            </h3>
            <p className="text-[11px] text-[#b6bcc5]">
              {lang === 'hi' ? 'जांचें और 1-क्लिक में सुरक्षित करें' : 'Verify & tap Save to record'}
            </p>
          </div>
        </div>

        {parsedData.matched_customer_name ? (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-[#5fb49c] bg-[#5fb49c]/15 border border-[#5fb49c]/30 px-2.5 py-1 rounded-full">
            <UserCheck className="w-3 h-3" />
            {Math.round(parsedData.match_score)}% Match
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-[#d9a45b] bg-[#d9a45b]/15 border border-[#d9a45b]/30 px-2.5 py-1 rounded-full">
            {lang === 'hi' ? 'नया ग्राहक खाता' : 'New Customer'}
          </span>
        )}
      </div>

      {/* Form Fields (Editable in 1 tap) */}
      <div className="space-y-4">
        {/* Customer Name */}
        <div>
          <label className="block text-xs font-semibold text-[#b6bcc5] mb-1">
            {lang === 'hi' ? 'ग्राहक का नाम' : 'Customer Name'}
          </label>
          <input
            type="text"
            value={parsedData.customer_name}
            onChange={(e) => onUpdate({ ...parsedData, customer_name: e.target.value })}
            className="w-full glass-panel-subtle text-sm font-medium px-3.5 py-2.5 outline-none text-[#ece8e4] focus:border-[#bc7363] focus:shadow-[0_0_0_2px_rgba(188,115,99,0.6)] transition-all"
            placeholder="e.g. Sharma Ji"
          />
          {parsedData.matched_customer_name && parsedData.matched_customer_name !== parsedData.customer_name && (
            <p className="text-[11px] text-[#bc7363] mt-1 font-medium">
              {lang === 'hi' ? 'खाता लिंक है:' : 'Linked to existing ledger:'} <strong>{parsedData.matched_customer_name}</strong>
            </p>
          )}
        </div>

        {/* Customer Mobile Number (WhatsApp) */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-[#b6bcc5] flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-[#5fb49c]" />
              <span>{lang === 'hi' ? 'मोबाइल नंबर (व्हाट्सएप तकाजे के लिए)' : 'Mobile Number (for WhatsApp)'}</span>
            </label>
            {!parsedData.matched_customer_id && (
              <span className="text-[10px] font-bold text-[#5fb49c] bg-[#5fb49c]/20 border border-[#5fb49c]/40 px-2 py-0.5 rounded">
                WhatsApp
              </span>
            )}
          </div>
          <input
            type="tel"
            value={parsedData.customer_phone || ''}
            onChange={(e) => onUpdate({ ...parsedData, customer_phone: e.target.value })}
            className="w-full glass-panel-subtle text-sm font-medium px-3.5 py-2.5 outline-none text-[#ece8e4] focus:border-[#bc7363] focus:shadow-[0_0_0_2px_rgba(188,115,99,0.6)] transition-all"
            placeholder="+91 98765 43210"
          />
          <p className="text-[11px] text-[#b6bcc5]/70 mt-1 flex items-center gap-1.5">
            <MessageCircle className="w-3.5 h-3.5 text-[#5fb49c] shrink-0" />
            <span>
              {parsedData.matched_customer_id
                ? (lang === 'hi' ? 'मौजूदा नंबर लिंक है' : 'Linked to customer profile (editable if needed)')
                : (lang === 'hi' ? 'नंबर दर्ज करें ताकि बाद में 1-क्लिक में व्हाट्सएप तकाजा भेजा जा सके' : 'Enter mobile number for instant 1-click WhatsApp reminders')}
            </span>
          </p>
        </div>

        {/* Amount & Type Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-[#b6bcc5] mb-1">
              {lang === 'hi' ? 'रकम (₹)' : 'Amount (₹)'}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-[#b6bcc5] font-bold">₹</span>
              <input
                type="number"
                value={parsedData.amount || ''}
                onChange={(e) => onUpdate({ ...parsedData, amount: parseFloat(e.target.value) || 0 })}
                className="w-full glass-panel-subtle text-base font-bold pl-7 pr-3 py-2 outline-none text-[#ece8e4] tabular-nums focus:border-[#bc7363] focus:shadow-[0_0_0_2px_rgba(188,115,99,0.6)] transition-all"
                placeholder="2400"
              />
            </div>
          </div>

          {/* Transaction Type */}
          <div>
            <label className="block text-xs font-semibold text-[#b6bcc5] mb-1">
              {lang === 'hi' ? 'प्रकार' : 'Entry Type'}
            </label>
            <div className="grid grid-cols-2 gap-1 bg-black/60 p-1 rounded-xl border border-white/15">
              <button
                type="button"
                onClick={() => onUpdate({ ...parsedData, type: 'credit_sale' })}
                className={`text-xs py-2 rounded-lg font-serif font-bold transition-all cursor-pointer ${
                  !isPayment
                    ? 'bg-[#d9604f] text-white shadow-xs'
                    : 'text-[#b6bcc5] hover:text-[#ece8e4]'
                }`}
              >
                {lang === 'hi' ? 'उधार' : 'Credit'}
              </button>
              <button
                type="button"
                onClick={() => onUpdate({ ...parsedData, type: 'payment' })}
                className={`text-xs py-2 rounded-lg font-serif font-bold transition-all cursor-pointer ${
                  isPayment
                    ? 'bg-[#5fb49c] text-white shadow-xs'
                    : 'text-[#b6bcc5] hover:text-[#ece8e4]'
                }`}
              >
                {lang === 'hi' ? 'जमा' : 'Payment'}
              </button>
            </div>
          </div>
        </div>

        {/* Credit Days (Only for credit sales) */}
        {!isPayment && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-[#b6bcc5] flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#bc7363]" />
                {lang === 'hi' ? 'उधार अवधि (दिन)' : 'Credit Days (Due Term)'}
              </label>
              <span className="text-xs font-bold text-[#bc7363]">
                {parsedData.credit_days} {lang === 'hi' ? 'दिन' : 'days'}
              </span>
            </div>

            {/* Quick chips for days */}
            <div className="flex items-center gap-1.5 mt-1">
              {[3, 7, 10, 15, 30].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => onUpdate({ ...parsedData, credit_days: days })}
                  className={`flex-1 text-xs py-1.5 rounded-lg font-semibold border transition-all cursor-pointer ${
                    parsedData.credit_days === days
                      ? 'bg-white text-black border-white shadow-xs'
                      : 'bg-black/60 text-[#b6bcc5] border-white/10 hover:border-white/30'
                  }`}
                >
                  {days}d
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Items / Grocery Note */}
        <div>
          <label className="block text-xs font-semibold text-[#b6bcc5] mb-1 flex items-center gap-1">
            <ShoppingBag className="w-3.5 h-3.5 text-[#bc7363]" />
            {lang === 'hi' ? 'सामान का विवरण' : 'Items / Notes'}
          </label>
          <input
            type="text"
            value={parsedData.items || ''}
            onChange={(e) => onUpdate({ ...parsedData, items: e.target.value })}
            className="w-full glass-panel-subtle text-xs font-medium px-3 py-2 outline-none text-[#ece8e4] focus:border-[#bc7363] focus:shadow-[0_0_0_2px_rgba(188,115,99,0.6)] transition-all"
            placeholder="e.g. Atta 10kg, Mustard Oil, Sugar"
          />
        </div>
      </div>

      {/* Validation alert if amount missing */}
      {parsedData.error && (
        <div className="mt-3 p-2.5 bg-[#d9a45b]/20 border border-[#d9a45b]/40 rounded-xl text-xs text-[#d9a45b] font-medium">
          {parsedData.error}
        </div>
      )}

      {/* Primary Action Button (Save) with Invert Hover */}
      <button
        type="button"
        onClick={onSave}
        disabled={isSaving || parsedData.amount <= 0 || !parsedData.customer_name.trim()}
        id="save-confirmed-entry-button"
        className="btn-cinematic w-full mt-5 py-3.5 px-4 text-sm sm:text-base font-bold shadow-2xl disabled:opacity-40"
      >
        {isSaving ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            {lang === 'hi' ? 'सुरक्षित कर रहे हैं...' : 'Recording to Ledger...'}
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <span>
              {lang === 'hi'
                ? `${formatINR(parsedData.amount)} खाता दर्ज करें`
                : `Save ${formatINR(parsedData.amount)} to Ledger`}
            </span>
            <ArrowRight className="w-4 h-4" />
          </span>
        )}
      </button>
    </div>
  );
};

