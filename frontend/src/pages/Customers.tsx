import React, { useState, useEffect } from 'react';
import { Search, ChevronRight, CheckCircle2, Clock, AlertTriangle, User } from 'lucide-react';
import { Customer, fetchCustomers } from '../services/api';
import { formatINR, getReliabilityInfo } from '../utils/formatters';

interface CustomersProps {
  onSelectCustomer: (customerId: number) => void;
  lang: 'en' | 'hi';
}

type FilterType = 'all' | 'overdue' | 'due_soon' | 'paid';

const FILTERS: { id: FilterType; en: string; hi: string; dot: string }[] = [
  { id: 'all',      en: 'All',       hi: 'सभी',        dot: 'bg-[#b6bcc5]' },
  { id: 'overdue',  en: 'Overdue',   hi: 'अतिदेय',     dot: 'bg-[#d9604f]' },
  { id: 'due_soon', en: 'Due Soon',  hi: 'जल्द देय',   dot: 'bg-[#d9a45b]' },
  { id: 'paid',     en: 'Paid',      hi: 'चुकता',       dot: 'bg-[#5fb49c]' },
];

export const Customers: React.FC<CustomersProps> = ({ onSelectCustomer, lang }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        setIsLoading(true);
        const data = await fetchCustomers(searchQuery);
        setCustomers(data);
      } catch (err) {
        console.error('Failed to load customers', err);
      } finally {
        setIsLoading(false);
      }
    };
    const t = setTimeout(loadCustomers, 200);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const filtered = filter === 'all' ? customers : customers.filter(c => c.status === filter);

  // Tuned status badge with icon + label
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
            <User className="w-3 h-3" />
            <span>{lang === 'hi' ? 'सक्रिय' : 'Open'}</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 pb-20 pt-1">
      {/* Title row */}
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-[#ece8e4] tracking-tight">
          {lang === 'hi' ? 'ग्राहक खाता सूची' : 'Customer Directory'}
        </h2>
        <span className="text-[11px] font-sans font-semibold text-[#b6bcc5] bg-black/60 border border-white/15 px-3 py-1 rounded-full shadow-xs">
          {customers.length} {lang === 'hi' ? 'ग्राहक' : 'total'}
        </span>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#b6bcc5] pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={lang === 'hi' ? 'नाम या फ़ोन नंबर से खोजें…' : 'Search by name or phone…'}
          className="w-full glass-panel-subtle text-sm font-medium pl-10 pr-9 py-2.5 outline-none text-[#ece8e4] placeholder:text-[#b6bcc5]/40 focus:border-[#bc7363] focus:shadow-[0_0_0_2px_rgba(188,115,99,0.6)] transition-all"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-[#b6bcc5] hover:text-white transition-colors"
          >
            <span className="text-xs font-bold">✕</span>
          </button>
        )}
      </div>

      {/* Filter chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
        {FILTERS.map((f) => {
          const isActive = filter === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`flex items-center gap-1.5 text-xs font-serif font-bold px-3.5 py-1.5 rounded-full border whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-white text-black border-white shadow-xs'
                  : 'bg-black/50 text-[#b6bcc5] border-white/15 hover:border-white/40'
              }`}
            >
              {isActive && <span className={`w-1.5 h-1.5 rounded-full ${f.dot}`} />}
              {lang === 'hi' ? f.hi : f.en}
            </button>
          );
        })}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-2.5 animate-pulse">
          {[1,2,3,4,5].map(i => <div key={i} className="h-20 glass-panel" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-panel p-10 text-center shadow-glass border border-white/10">
          <p className="text-sm font-medium text-[#b6bcc5]">
            {lang === 'hi' ? 'कोई ग्राहक नहीं मिला' : 'No customers found'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((customer) => {
            const relInfo = getReliabilityInfo(customer.reliability_score, customer.reliability_tier);
            const initials = customer.name.split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase();

            return (
              <button
                key={customer.id}
                onClick={() => onSelectCustomer(customer.id)}
                className="w-full glass-panel hover:bg-black/70 active:scale-[0.99] p-4 shadow-glass hover:border-[#bc7363]/50 cursor-pointer transition-all flex items-center justify-between gap-3 group text-left"
              >
                {/* Avatar + info */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-black/60 border border-white/15 group-hover:border-[#bc7363]/60 flex items-center justify-center text-[#ece8e4] font-heading font-extrabold text-xs shrink-0 transition-colors shadow-sm">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="font-heading font-bold text-sm text-[#ece8e4] group-hover:text-white truncate">
                      {customer.name}
                    </p>
                    <p className="text-[11px] text-[#b6bcc5]/70 font-sans truncate">
                      {customer.phone || 'No phone registered'}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md border ${relInfo.badgeColor}`}>
                        <span className={`w-1 h-1 rounded-full ${relInfo.dotColor}`} />
                        <span>{customer.reliability_tier} • {customer.reliability_score}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Balance + status */}
                <div className="text-right shrink-0 flex items-center gap-2.5">
                  <div>
                    <p className="font-heading font-extrabold text-base text-[#ece8e4] tabular-nums">
                      {formatINR(customer.balance)}
                    </p>
                    <div className="mt-1 flex justify-end">
                      {renderStatusBadge(customer.status)}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#b6bcc5]/50 group-hover:text-[#bc7363] group-hover:translate-x-0.5 transition-all" />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

