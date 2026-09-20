import React, { useState } from 'react';
import { X, ArrowDownCircle, Info } from 'lucide-react';
import { Customer } from '../services/api';
import { formatINR } from '../utils/formatters';

interface PaymentModalProps {
  customer: Customer;
  isOpen: boolean;
  onClose: () => void;
  onSubmitPayment: (amount: number, note: string) => Promise<void>;
  lang: 'en' | 'hi';
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  customer,
  isOpen,
  onClose,
  onSubmitPayment,
  lang,
}) => {
  const [amount, setAmount] = useState<string>(customer.balance ? customer.balance.toString() : '');
  const [note, setNote] = useState<string>('UPI / Cash Payment');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      setError(lang === 'hi' ? 'कृपया सही राशि दर्ज करें' : 'Please enter a valid payment amount');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmitPayment(num, note);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to record payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="glass-panel max-w-md w-full p-6 shadow-2xl border border-white/20 text-[#ece8e4] animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#5fb49c]/20 border border-[#5fb49c]/40 text-[#5fb49c] flex items-center justify-center shadow-inner">
              <ArrowDownCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-heading font-extrabold text-[#ece8e4]">
                {lang === 'hi' ? 'भुगतान दर्ज करें (जमा)' : 'Record Payment (Jama)'}
              </h3>
              <p className="text-xs text-[#b6bcc5] font-medium mt-0.5">
                {customer.name} • {lang === 'hi' ? 'बकाया:' : 'Balance:'}{' '}
                <span className="text-[#d9604f] font-bold">{formatINR(customer.balance)}</span>
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

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Quick Pay Full Balance */}
          {customer.balance > 0 && (
            <div className="flex items-center justify-between bg-black/40 p-3.5 rounded-xl border border-white/10">
              <span className="text-xs text-[#b6bcc5] font-medium">
                {lang === 'hi' ? 'पूरा बकाया चुकता करें:' : 'Pay full balance:'}
              </span>
              <button
                type="button"
                onClick={() => setAmount(customer.balance.toString())}
                className="text-xs font-bold text-[#5fb49c] bg-[#5fb49c]/15 hover:bg-[#5fb49c]/25 px-3 py-1.5 rounded-lg border border-[#5fb49c]/30 transition-all font-mono"
              >
                {formatINR(customer.balance)}
              </button>
            </div>
          )}

          {/* Amount input */}
          <div>
            <label className="block text-xs font-semibold text-[#b6bcc5] mb-1.5">
              {lang === 'hi' ? 'जमा की गई राशि (₹)' : 'Payment Amount (₹)'}
            </label>
            <div className="relative">
              <span className="absolute left-4 top-3 text-[#b6bcc5] font-bold text-lg">₹</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                step="any"
                min="1"
                className="w-full glass-panel-subtle text-xl font-bold pl-9 pr-4 py-2.5 outline-none text-[#ece8e4] placeholder-white/20 focus:border-[#bc7363] focus:shadow-[0_0_0_2px_rgba(188,115,99,0.6)] font-mono transition-all"
                placeholder="e.g. 1500"
              />
            </div>
          </div>

          {/* FIFO Info Banner */}
          <div className="flex items-start gap-2.5 bg-[#0f2a2e]/60 border border-[#305050] p-3.5 rounded-xl text-xs text-[#b6bcc5]">
            <Info className="w-4 h-4 text-[#5fb49c] shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              {lang === 'hi'
                ? 'FIFO नियम: यह राशि ग्राहक के सबसे पुराने खुले बिलों में क्रमबद्ध तरीके से अपने आप जमा हो जाएगी।'
                : 'FIFO Allocation: This payment will automatically settle the oldest open credit bills first.'}
            </p>
          </div>

          {/* Note input */}
          <div>
            <label className="block text-xs font-semibold text-[#b6bcc5] mb-1.5">
              {lang === 'hi' ? 'भुगतान विवरण' : 'Payment Note'}
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full glass-panel-subtle text-xs font-medium px-4 py-2.5 outline-none text-[#ece8e4] placeholder-white/30 focus:border-[#bc7363] focus:shadow-[0_0_0_2px_rgba(188,115,99,0.6)] transition-all"
              placeholder="e.g. UPI GooglePay, Cash at counter"
            />
          </div>

          {error && (
            <p className="text-xs text-[#d9604f] font-semibold bg-[#d9604f]/10 p-2.5 rounded-lg border border-[#d9604f]/20">
              {error}
            </p>
          )}

          {/* Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-full border border-white/20 text-[#b6bcc5] font-semibold text-sm hover:text-white hover:border-white/40 transition-colors min-h-[44px]"
            >
              {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              id="confirm-record-payment-button"
              className="flex-1 py-3 rounded-full btn-cinematic text-sm shadow-xl disabled:opacity-50 transition-all flex items-center justify-center gap-2 min-h-[44px]"
            >
              {isSubmitting ? (
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>{lang === 'hi' ? 'जमा दर्ज करें' : 'Record Payment'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

