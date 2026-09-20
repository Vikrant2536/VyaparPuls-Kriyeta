import React, { useState, useEffect } from 'react';
import {
  TrendingUp, PhoneCall, ArrowRight, Mic, Sparkles, AlertTriangle, Clock, Wallet
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  DashboardSummaryData,
  CashFlowResponseData,
  fetchDashboardSummary,
  fetchCashflow,
  generateReminder,
  ReminderResponseData
} from '../services/api';
import { formatINR } from '../utils/formatters';
import { InflowChart } from '../components/InflowChart';
import { ReminderModal } from '../components/ReminderModal';

interface HomeProps {
  onNavigate: (tab: 'home' | 'entry' | 'customers' | 'cashflow', customerId?: number) => void;
  lang: 'en' | 'hi';
}

const CountUp: React.FC<{ value: number }> = ({ value }) => {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = Math.round(value || 0);
    if (end === 0) {
      setDisplay(0);
      return;
    }
    const duration = 800;
    const stepTime = 20;
    const steps = duration / stepTime;
    const increment = end / steps;
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setDisplay(end);
        clearInterval(timer);
      } else {
        setDisplay(Math.round(start));
      }
    }, stepTime);
    return () => clearInterval(timer);
  }, [value]);

  return <span>{formatINR(display)}</span>;
};

export const Home: React.FC<HomeProps> = ({ onNavigate, lang }) => {
  const [summary, setSummary] = useState<DashboardSummaryData | null>(null);
  const [cashflow, setCashflow] = useState<CashFlowResponseData | null>(null);
  const [chartDays, setChartDays] = useState<number>(7);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [reminderModalData, setReminderModalData] = useState<ReminderResponseData | null>(null);
  const [isReminderOpen, setIsReminderOpen] = useState<boolean>(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [sumData, cfData] = await Promise.all([
        fetchDashboardSummary(),
        fetchCashflow(chartDays)
      ]);
      setSummary(sumData);
      setCashflow(cfData);
    } catch (err) {
      console.error('Error loading home data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [chartDays]);

  const handlePriorityAction = async () => {
    if (!summary?.today_insight.priority_customer_id) return;
    try {
      const data = await generateReminder(summary.today_insight.priority_customer_id);
      setReminderModalData(data);
      setIsReminderOpen(true);
    } catch (err) {
      alert('Could not generate reminder: ' + err);
    }
  };

  if (isLoading && !summary) {
    return (
      <div className="space-y-4 animate-pulse pt-2">
        <div className="h-32 glass-panel" />
        <div className="grid grid-cols-3 gap-3">
          {[1,2,3].map(i => <div key={i} className="h-28 glass-panel" />)}
        </div>
        <div className="h-64 glass-panel" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20 pt-1">
      {/* Today's Insight Banner - Cinematic Glass Panel */}
      {summary?.today_insight && (
        <div className="glass-panel p-5 relative overflow-hidden">
          {/* Subtle copper accent glow */}
          <div className="absolute -top-10 -right-10 w-36 h-36 bg-[#bc7363]/20 rounded-full blur-3xl pointer-events-none" />

          {/* Tag badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-3 rounded-full bg-black/60 border border-white/15 backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-[#bc7363]" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#b6bcc5]">
              {lang === 'hi' ? 'आज का सुझाव' : "Today's Insight"}
            </span>
          </div>

          <p className="font-heading font-extrabold text-lg sm:text-xl text-[#ece8e4] tracking-tight leading-snug drop-shadow-md">
            {summary.today_insight.headline}
          </p>

          <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-white/10">
            <div className="flex items-center gap-2 text-xs text-[#b6bcc5]">
              <PhoneCall className="w-3.5 h-3.5 text-[#bc7363] shrink-0" />
              <span className="truncate">{summary.today_insight.action_text}</span>
            </div>
            {summary.today_insight.priority_customer_id && (
              <button
                type="button"
                onClick={handlePriorityAction}
                id="priority-reminder-button"
                className="btn-cinematic px-5 py-2.5 text-[13px] self-start sm:self-auto shrink-0"
              >
                <span>{lang === 'hi' ? 'तकाजा भेजें' : 'Send Reminder'}</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* KPI Grid - 3 Glass Panels with Count-Up */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5">
        <KpiGlassCard
          label={lang === 'hi' ? 'कुल बकाया' : 'Total Udhaar'}
          rawNum={summary?.total_receivable || 0}
          sub={`${summary?.active_customers_count ?? 0} ${lang === 'hi' ? 'खाते' : 'active'}`}
          icon={Wallet}
          accentColor="#ece8e4"
        />
        <KpiGlassCard
          label={lang === 'hi' ? '7 दिन में देय' : 'Due This Week'}
          rawNum={summary?.due_this_week || 0}
          sub={lang === 'hi' ? 'संभावित आवक' : 'expected'}
          icon={Clock}
          accentColor="#e6ba7c"
        />
        <KpiGlassCard
          label={lang === 'hi' ? 'अतिदेय' : 'Overdue'}
          rawNum={summary?.overdue_amount || 0}
          sub={`${summary?.overdue_customers_count ?? 0} ${lang === 'hi' ? 'ग्राहक' : 'accounts'}`}
          icon={AlertTriangle}
          accentColor="#e67f70"
        />
      </div>

      {/* 7-Day Inflow Chart */}
      {cashflow && (
        <InflowChart
          data={cashflow.items}
          days={chartDays}
          onSelectDays={(d) => setChartDays(d)}
          lang={lang}
        />
      )}

      {/* Large Floating Mic CTA Panel */}
      <div className="glass-panel p-5 flex items-center justify-between relative overflow-hidden">
        <div className="pr-3">
          <div className="flex items-center gap-1.5 text-xs text-[#bc7363] font-semibold mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{lang === 'hi' ? 'स्मार्ट वॉइस एंट्री' : 'Smart Voice Entry'}</span>
          </div>
          <p className="font-heading font-extrabold tracking-tight text-lg text-[#ece8e4]">
            {lang === 'hi' ? 'नया लेन-देन दर्ज करें' : 'Record New Entry'}
          </p>
          <p className="text-xs text-[#b6bcc5] mt-0.5">
            {lang === 'hi' ? 'हिंग्लिश में बोलें, 2 क्लिक में सुरक्षित' : 'Voice or Hinglish — 2 taps to save'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('entry')}
          id="home-quick-entry-cta"
          className="btn-cinematic px-6 py-3.5 text-sm shrink-0 group"
        >
          <Mic className="w-4 h-4 text-[#bc7363] group-hover:text-black transition-colors" />
          <span>{lang === 'hi' ? 'बोलें' : 'Speak'}</span>
        </button>
      </div>

      <ReminderModal
        reminderData={reminderModalData}
        isOpen={isReminderOpen}
        onClose={() => setIsReminderOpen(false)}
        lang={lang}
      />
    </div>
  );
};

/* ── KPI Glass Card Subcomponent ── */
interface KpiGlassCardProps {
  label: string;
  rawNum: number;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
}

const KpiGlassCard: React.FC<KpiGlassCardProps> = ({
  label,
  rawNum,
  sub,
  icon: Icon,
  accentColor,
}) => {
  return (
    <div className="glass-panel p-4 flex flex-col justify-between relative overflow-hidden">
      {/* 1px top highlight gradient */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[9px] font-sans font-semibold uppercase tracking-wider text-[rgba(236,232,228,0.65)] truncate">
            {label}
          </span>
          <Icon className="w-3.5 h-3.5 text-white/30 shrink-0" />
        </div>
        <p
          className="font-heading font-extrabold text-lg sm:text-xl tracking-tight tabular-nums drop-shadow-sm"
          style={{ color: accentColor }}
        >
          <CountUp value={rawNum} />
        </p>
      </div>
      <p className="text-[10px] text-[rgba(236,232,228,0.5)] mt-1 truncate font-sans">
        {sub}
      </p>
    </div>
  );
};

