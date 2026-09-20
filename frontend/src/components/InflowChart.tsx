import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import { CashFlowItem } from '../services/api';
import { formatINR } from '../utils/formatters';

interface InflowChartProps {
  data: CashFlowItem[];
  days: number;
  onSelectDays: (days: number) => void;
  lang: 'en' | 'hi';
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const item: CashFlowItem = payload[0].payload;
    return (
      <div className="glass-panel p-3.5 rounded-2xl shadow-2xl text-xs max-w-xs">
        <div className="flex items-center justify-between gap-4 font-semibold pb-2 border-b border-white/10">
          <span className="font-heading text-[#ece8e4] tracking-tight">{item.day_name} <span className="font-mono text-[10px] text-[rgba(236,232,228,0.5)]">({item.date})</span></span>
          <span className="text-[#bc7363] font-bold font-mono text-sm">{formatINR(item.expected_inflow)}</span>
        </div>
        <div className="mt-2 text-[11px] text-[#b6bcc5]">
          <p className="font-medium text-[rgba(236,232,228,0.7)]">
            {item.customer_count} {item.customer_count === 1 ? 'Customer' : 'Customers'} due:
          </p>
          {item.customer_names.length > 0 ? (
            <p className="mt-1 text-[#ece8e4] line-clamp-2 leading-relaxed">
              {item.customer_names.join(', ')}
            </p>
          ) : (
            <p className="italic text-[rgba(236,232,228,0.3)] mt-1">No scheduled collections</p>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export const InflowChart: React.FC<InflowChartProps> = ({ data, days, onSelectDays, lang }) => {
  return (
    <div className="glass-panel p-4 sm:p-5 relative overflow-hidden">
      {/* Card Header & Day Filter */}
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div>
          <h3 className="font-heading font-extrabold text-sm text-[#ece8e4] tracking-tight">
            {lang === 'hi' ? 'आगामी संभावित नकदी आवक' : 'Expected Cash Inflow'}
          </h3>
          <p className="text-[11px] text-[rgba(236,232,228,0.5)] font-normal mt-0.5">
            {lang === 'hi' ? 'उधार देय तिथि पर आधारित' : 'Based on credit terms'}
          </p>
        </div>

        {/* 7d vs 14d Segmented Control */}
        <div className="flex items-center gap-1 bg-black/40 backdrop-blur-md p-1 rounded-[14px] border border-white/10 shadow-inner">
          <button
            type="button"
            onClick={() => onSelectDays(7)}
            className={`text-xs font-serif font-bold px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
              days === 7
                ? 'bg-white text-black shadow-lg scale-100'
                : 'text-[#b6bcc5] hover:text-[#ece8e4] scale-95 hover:scale-100'
            }`}
          >
            7 {lang === 'hi' ? 'दिन' : 'Days'}
          </button>
          <button
            type="button"
            onClick={() => onSelectDays(14)}
            className={`text-xs font-serif font-bold px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
              days === 14
                ? 'bg-white text-black shadow-lg scale-100'
                : 'text-[#b6bcc5] hover:text-[#ece8e4] scale-95 hover:scale-100'
            }`}
          >
            14 {lang === 'hi' ? 'दिन' : 'Days'}
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="h-56 w-full -ml-2 relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <defs>
              <linearGradient id="copperGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#bc7363" stopOpacity={1} />
                <stop offset="100%" stopColor="#895c47" stopOpacity={1} />
              </linearGradient>
              <linearGradient id="amberGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f5d08f" stopOpacity={1} />
                <stop offset="100%" stopColor="#d9a45b" stopOpacity={1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="rgba(255, 255, 255, 0.08)" />
            <XAxis
              dataKey="day_name"
              stroke="rgba(236,232,228,0.6)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              stroke="rgba(236,232,228,0.6)"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => `₹${val >= 1000 ? `${Math.round(val / 1000)}k` : val}`}
              tickMargin={8}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Bar dataKey="expected_inflow" radius={[8, 8, 0, 0]} animationDuration={800}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    entry.expected_inflow > 0
                      ? index === 0
                        ? 'url(#amberGrad)'
                        : 'url(#copperGrad)'
                      : 'rgba(255, 255, 255, 0.05)'
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};


