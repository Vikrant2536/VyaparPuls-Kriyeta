import React, { useState, useEffect } from 'react';
import { TrendingUp, Calendar, AlertCircle } from 'lucide-react';
import { CashFlowResponseData, fetchCashflow } from '../services/api';
import { formatINR } from '../utils/formatters';
import { InflowChart } from '../components/InflowChart';

interface CashflowViewProps {
  lang: 'en' | 'hi';
}

export const CashflowView: React.FC<CashflowViewProps> = ({ lang }) => {
  const [days, setDays] = useState<number>(7);
  const [cashflow, setCashflow] = useState<CashFlowResponseData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const data = await fetchCashflow(days);
        setCashflow(data);
      } catch (err) {
        console.error('Failed to load cashflow', err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [days]);

  const total = cashflow?.items.reduce((s, i) => s + i.expected_inflow, 0) ?? 0;

  return (
    <div className="space-y-4 pb-28 pt-1 animate-slide-up">
      {/* Title */}
      <div>
        <h2 className="text-xl font-heading font-extrabold text-[#ece8e4] tracking-tight drop-shadow-sm">
          {lang === 'hi' ? 'नकदी आवक पूर्वानुमान' : 'Cashflow Forecast'}
        </h2>
        <p className="text-xs text-[#b6bcc5] mt-1">
          {lang === 'hi' ? 'बकाया तारीखों के अनुसार अनुमानित आवक' : 'Expected inflow bucketed by scheduled due dates'}
        </p>
      </div>

      {/* Insight banner */}
      {cashflow && (
        <div className="glass-panel p-5 relative overflow-hidden border border-white/15">
          <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-[#bc7363]/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-[#bc7363]/20 border border-[#bc7363]/40 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5 text-[#bc7363]" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#bc7363]">
              {lang === 'hi' ? 'स्मार्ट पूर्वानुमान' : 'Forecast Insight'}
            </span>
          </div>
          <p className="text-sm font-medium text-[#ece8e4] leading-relaxed">
            {cashflow.insight}
          </p>
          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
            <span className="text-xs text-[#b6bcc5]">
              {lang === 'hi' ? `${days} दिन में कुल अपेक्षित आवक` : `Total expected in ${days} days`}
            </span>
            <span className="text-lg font-heading font-extrabold text-[#5fb49c]">
              {formatINR(total)}
            </span>
          </div>
        </div>
      )}

      {/* Chart */}
      {cashflow && (
        <InflowChart
          data={cashflow.items}
          days={days}
          onSelectDays={(d) => setDays(d)}
          lang={lang}
        />
      )}

      {/* Daily breakdown */}
      <div className="glass-panel overflow-hidden border border-white/15">
        <div className="px-4 py-3.5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#bc7363]" />
            <h3 className="text-sm font-heading font-bold text-[#ece8e4]">
              {lang === 'hi' ? 'दैनिक वसूली विवरण' : 'Daily Collection Schedule'}
            </h3>
          </div>
          <span className="text-[11px] text-[#b6bcc5] font-mono">
            {cashflow?.items.length || 0} {lang === 'hi' ? 'दिन' : 'Days'}
          </span>
        </div>

        {isLoading || !cashflow ? (
          <div className="p-4 space-y-2.5 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-white/5 rounded-xl border border-white/5" />
            ))}
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {cashflow.items.map((item, idx) => (
              <div
                key={idx}
                className="px-4 py-3.5 flex items-start justify-between gap-3 hover:bg-white/[0.03] transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#ece8e4] font-heading">
                      {item.day_name}
                    </span>
                    <span className="text-[10px] text-[#b6bcc5]/70 font-mono">
                      {item.date}
                    </span>
                  </div>
                  <p
                    className={`text-xs mt-1 truncate ${
                      item.customer_count > 0 ? 'text-[#b6bcc5]' : 'text-[#b6bcc5]/40 italic'
                    }`}
                  >
                    {item.customer_count > 0
                      ? `${item.customer_count} ${
                          lang === 'hi' ? 'ग्राहक' : 'customer(s)'
                        }: ${item.customer_names.join(', ')}`
                      : lang === 'hi'
                      ? 'कोई देयता नहीं'
                      : 'No bills due'}
                  </p>
                </div>
                <span
                  className={`text-sm font-extrabold font-heading shrink-0 ${
                    item.expected_inflow > 0 ? 'text-[#5fb49c]' : 'text-white/20'
                  }`}
                >
                  {formatINR(item.expected_inflow)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

