import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, MessageSquare, ArrowDownLeft, ArrowUpRight,
  Pencil, Check, X, Loader2, Phone, CheckCircle2, Clock, AlertTriangle
} from 'lucide-react';
import {
  LedgerData, fetchCustomerLedger, recordPayment,
  generateReminder, updateCustomer, ReminderResponseData
} from '../services/api';
import { formatINR, formatDate, getReliabilityInfo } from '../utils/formatters';
import { PaymentModal } from '../components/PaymentModal';
import { ReminderModal } from '../components/ReminderModal';

interface CustomerLedgerProps {
  customerId: number;
  onBack: () => void;
  lang: 'en' | 'hi';
}

export const CustomerLedger: React.FC<CustomerLedgerProps> = ({ customerId, onBack, lang }) => {
  const [ledger, setLedger]               = useState<LedgerData | null>(null);
  const [isLoading, setIsLoading]         = useState(true);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const [reminderData, setReminderData]   = useState<ReminderResponseData | null>(null);
  const [isEditingPhone, setIsEditingPhone]   = useState(false);
  const [editPhoneValue, setEditPhoneValue]   = useState('');
  const [isUpdatingPhone, setIsUpdatingPhone] = useState(false);

  const loadLedger = async () => {
    try {
      setIsLoading(true);
      const data = await fetchCustomerLedger(customerId);
      setLedger(data);
    } catch (err) {
      console.error('Failed to load ledger', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadLedger(); }, [customerId]);

  const handleSavePhone = async () => {
    if (!editPhoneValue.trim()) return;
    try {
      setIsUpdatingPhone(true);
      const updated = await updateCustomer(customerId, { phone: editPhoneValue.trim() });
      if (ledger) setLedger({ ...ledger, customer: { ...ledger.customer, phone: updated.phone } });
      setIsEditingPhone(false);
    } catch (err: any) {
      alert('Failed to update phone number: ' + err.message);
    } finally {
      setIsUpdatingPhone(false);
    }
  };

  const handleRecordPayment = async (amount: number, note: string) => {
    await recordPayment({ customer_id: customerId, amount, payment_note: note });
    await loadLedger();
  };

  const handleGenerateReminder = async (transactionId?: number) => {
    try {
      const data = await generateReminder(customerId, transactionId);
      setReminderData(data);
      setIsReminderOpen(true);
    } catch (err: any) {
      alert('Failed to generate reminder: ' + err.message);
    }
  };

  if (isLoading || !ledger) {
    return (
      <div className="space-y-4 animate-pulse pt-2">
        <div className="h-8 w-28 glass-panel" />
        <div className="h-44 glass-panel" />
        <div className="h-64 glass-panel" />
      </div>
    );
  }

  const { customer, running_balance, timeline } = ledger;
  const relInfo  = getReliabilityInfo(customer.reliability_score, customer.reliability_tier);
  const initials = customer.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();

  // Render status badge with icon + label
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#5fb49c]/30 bg-[#5fb49c]/15 text-[#5fb49c]">
            <CheckCircle2 className="w-3 h-3" />
            <span>{lang === 'hi' ? 'चुकता' : 'Paid'}</span>
          </span>
        );
      case 'due_soon':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#d9a45b]/30 bg-[#d9a45b]/15 text-[#d9a45b]">
            <Clock className="w-3 h-3" />
            <span>{lang === 'hi' ? 'जल्द देय' : 'Due Soon'}</span>
          </span>
        );
      case 'overdue':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#d9604f]/30 bg-[#d9604f]/15 text-[#d9604f]">
            <AlertTriangle className="w-3 h-3" />
            <span>{lang === 'hi' ? 'अतिदेय' : 'Overdue'}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/20 bg-white/10 text-[#ece8e4]">
            <span>{lang === 'hi' ? 'सक्रिय' : 'Open'}</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 pb-20 pt-1">
      {/* Back Button */}
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs font-serif font-bold text-[#b6bcc5] hover:text-[#ece8e4] bg-black/60 border border-white/15 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer shadow-sm"
      >
        <ArrowLeft className="w-3.5 h-3.5 text-[#bc7363]" />
        <span>{lang === 'hi' ? 'वापस ग्राहक सूची' : 'Back to Customers'}</span>
      </button>

      {/* ── Customer Header Card ── */}
      <div className="glass-panel shadow-glass border border-white/12 overflow-hidden">
        {/* Top copper accent bar */}
        <div className="h-1 bg-gradient-to-r from-[#bc7363] via-[#d9a45b] to-[#895c47]" />

        <div className="p-5">
          {/* Name row */}
          <div className="flex items-start gap-3.5">
            {/* Avatar Tile */}
            <div className="w-12 h-12 rounded-xl bg-black/70 border border-[#bc7363]/50 text-[#ece8e4] font-heading font-extrabold text-sm flex items-center justify-center shrink-0 shadow-sm">
              {initials}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-heading font-extrabold text-base sm:text-lg text-[#ece8e4] leading-tight">
                  {customer.name}
                </h2>
                <div className="shrink-0">
                  {renderStatusBadge(customer.status)}
                </div>
              </div>

              {/* Phone inline edit */}
              {isEditingPhone ? (
                <div className="flex items-center gap-1.5 mt-2">
                  <input
                    type="tel"
                    autoFocus
                    value={editPhoneValue}
                    onChange={(e) => setEditPhoneValue(e.target.value)}
                    id="edit-phone-input"
                    className="glass-panel-subtle text-xs font-semibold px-2.5 py-1.5 outline-none text-[#ece8e4] w-44 focus:border-[#bc7363] focus:shadow-[0_0_0_2px_rgba(188,115,99,0.6)]"
                    placeholder="+91 98765 43210"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSavePhone();
                      if (e.key === 'Escape') setIsEditingPhone(false);
                    }}
                  />
                  <button
                    type="button"
                    id="save-phone-button"
                    onClick={handleSavePhone}
                    disabled={isUpdatingPhone}
                    className="p-1.5 rounded-lg bg-[#bc7363] hover:bg-[#895c47] text-white transition-colors cursor-pointer"
                  >
                    {isUpdatingPhone ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingPhone(false)}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-[#b6bcc5] transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <div className="inline-flex items-center gap-1 text-[11px] text-[#b6bcc5] font-sans bg-black/60 border border-white/10 px-2 py-0.5 rounded-md">
                    <Phone className="w-3 h-3 text-[#5fb49c]" />
                    <span>{customer.phone || (lang === 'hi' ? 'कोई नंबर नहीं' : 'No phone')}</span>
                  </div>
                  <button
                    type="button"
                    id="edit-phone-pencil-button"
                    onClick={() => { setEditPhoneValue(customer.phone); setIsEditingPhone(true); }}
                    className="inline-flex items-center gap-1 text-[10px] font-sans font-bold text-[#ece8e4] bg-white/10 hover:bg-white/20 border border-white/15 px-2 py-0.5 rounded-md transition-all cursor-pointer"
                    title={lang === 'hi' ? 'फ़ोन नंबर बदलें' : 'Edit phone number'}
                  >
                    <Pencil className="w-2.5 h-2.5 text-[#bc7363]" />
                    <span>{lang === 'hi' ? 'बदलें' : 'Edit'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Balance + reliability */}
          <div className="mt-5 pt-4 border-t border-white/10 flex items-end justify-between">
            <div>
              <p className="text-[11px] text-[#b6bcc5] font-semibold uppercase tracking-wider">
                {lang === 'hi' ? 'कुल बकाया उधारी' : 'Udhaar Balance'}
              </p>
              <p className="font-heading font-extrabold text-2xl sm:text-3xl text-[#ece8e4] tracking-tight mt-0.5 tabular-nums">
                {formatINR(running_balance)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-[#b6bcc5]/60 mb-0.5 uppercase tracking-wider font-sans">
                {lang === 'hi' ? 'विश्वसनीयता' : 'Reliability'}
              </p>
              <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg border ${relInfo.badgeColor}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${relInfo.dotColor}`} />
                <span>{customer.reliability_tier} • {customer.reliability_score}/100</span>
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-2.5 mt-5">
            <button
              type="button"
              onClick={() => setIsPaymentOpen(true)}
              id="ledger-record-payment-button"
              className="btn-cinematic py-3 text-xs sm:text-sm font-bold"
            >
              <ArrowDownLeft className="w-3.5 h-3.5 text-[#5fb49c]" />
              <span>{lang === 'hi' ? 'जमा दर्ज करें' : 'Record Payment'}</span>
            </button>
            <button
              type="button"
              onClick={() => handleGenerateReminder()}
              id="ledger-send-reminder-button"
              className="btn-cinematic py-3 text-xs sm:text-sm font-bold"
            >
              <MessageSquare className="w-3.5 h-3.5 text-[#bc7363]" />
              <span>{lang === 'hi' ? 'WhatsApp तकाजा' : 'Send Reminder'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Transaction Timeline ── */}
      <div className="glass-panel shadow-glass border border-white/12 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between">
          <h3 className="font-heading font-bold text-sm text-[#ece8e4]">
            {lang === 'hi' ? 'लेन-देन इतिहास' : 'Transaction Timeline'}
          </h3>
          <span className="text-[11px] font-sans font-semibold text-[#b6bcc5]/70">
            {timeline.length} {lang === 'hi' ? 'प्रविष्टियां' : 'records'}
          </span>
        </div>

        {timeline.length === 0 ? (
          <p className="text-xs text-[#b6bcc5]/50 italic text-center py-10">
            {lang === 'hi' ? 'कोई लेन-देन नहीं' : 'No transactions yet.'}
          </p>
        ) : (
          <div className="divide-y divide-white/10">
            {timeline.map((t) => {
              const isSale     = t.type === 'credit_sale';
              const pct        = isSale && t.amount > 0 ? Math.min(100, Math.round((t.amount_settled / t.amount) * 100)) : 100;

              return (
                <div key={t.id} className="p-4 hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border ${
                      isSale
                        ? 'bg-[#d9604f]/20 border-[#d9604f]/40 text-[#d9604f]'
                        : 'bg-[#5fb49c]/20 border-[#5fb49c]/40 text-[#5fb49c]'
                    }`}>
                      {isSale
                        ? <ArrowUpRight className="w-4 h-4" />
                        : <ArrowDownLeft className="w-4 h-4" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Title + badge */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-heading font-bold text-xs text-[#ece8e4]">
                          {isSale
                            ? (lang === 'hi' ? 'उधार बिक्री' : 'Credit Sale')
                            : (lang === 'hi' ? 'भुगतान प्राप्त' : 'Payment Received')}
                        </span>
                        {renderStatusBadge(t.status)}
                      </div>

                      {/* Items note */}
                      {t.items_note && (
                        <p className="text-[11px] text-[#b6bcc5] mt-0.5 truncate">{t.items_note}</p>
                      )}

                      {/* Dates */}
                      <div className="flex items-center gap-2 text-[10px] text-[#b6bcc5]/60 mt-1">
                        <span>{formatDate(t.txn_date)}</span>
                        {t.due_date && (
                          <span>• {lang === 'hi' ? 'देय:' : 'Due:'} {formatDate(t.due_date)}</span>
                        )}
                      </div>

                      {/* FIFO progress bar */}
                      {isSale && (
                        <div className="mt-2.5">
                          <div className="flex items-center justify-between text-[10px] font-sans font-medium text-[#b6bcc5]/80 mb-1">
                            <span>{formatINR(t.amount_settled)} / {formatINR(t.amount)}</span>
                            <span className={t.remaining_amount > 0 ? 'text-[#d9604f] font-bold' : 'text-[#5fb49c] font-bold'}>
                              {t.remaining_amount > 0
                                ? `${formatINR(t.remaining_amount)} ${lang === 'hi' ? 'बाकी' : 'left'}`
                                : (lang === 'hi' ? '✓ चुकता' : '✓ Settled')}
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-black/80 rounded-full overflow-hidden border border-white/10">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                pct === 100 ? 'bg-[#5fb49c]' : 'bg-[#bc7363]'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Amount + remind */}
                    <div className="text-right shrink-0">
                      <span className={`font-heading font-extrabold text-sm block tabular-nums ${
                        isSale ? 'text-[#ece8e4]' : 'text-[#5fb49c]'
                      }`}>
                        {isSale ? formatINR(t.amount) : `+${formatINR(t.amount)}`}
                      </span>
                      {isSale && t.remaining_amount > 0 && (
                        <button
                          type="button"
                          onClick={() => handleGenerateReminder(t.id)}
                          className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-serif font-bold text-[#bc7363] hover:text-white transition-colors cursor-pointer"
                        >
                          <MessageSquare className="w-2.5 h-2.5" />
                          <span>{lang === 'hi' ? 'तकाजा' : 'Remind'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <PaymentModal
        customer={customer}
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        onSubmitPayment={handleRecordPayment}
        lang={lang}
      />
      <ReminderModal
        reminderData={reminderData}
        isOpen={isReminderOpen}
        onClose={() => setIsReminderOpen(false)}
        lang={lang}
      />
    </div>
  );
};

