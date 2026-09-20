import React from 'react';
import { LayoutDashboard, Mic, Users, TrendingUp } from 'lucide-react';

export type TabType = 'home' | 'entry' | 'customers' | 'cashflow';

interface BottomNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  lang: 'en' | 'hi';
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onChangeTab, lang }) => {
  const tabs = [
    { id: 'home' as TabType,      label: lang === 'hi' ? 'डैशबोर्ड' : 'Home',       icon: LayoutDashboard },
    { id: 'entry' as TabType,     label: lang === 'hi' ? 'एंट्री' : 'Quick Entry',   icon: Mic, isCTA: true },
    { id: 'customers' as TabType, label: lang === 'hi' ? 'ग्राहक' : 'Customers',    icon: Users },
    { id: 'cashflow' as TabType,  label: lang === 'hi' ? 'कैश-फ्लो' : 'Cashflow',   icon: TrendingUp },
  ];

  return (
    <nav className="fixed bottom-3 sm:bottom-6 left-0 right-0 z-40 px-3 pointer-events-none safe-bottom">
      <div className="max-w-xl md:max-w-4xl lg:max-w-5xl mx-auto">
        <div className="mx-auto max-w-[560px] md:max-w-2xl lg:max-w-3xl flex items-center justify-around bg-black/55 backdrop-blur-[20px] rounded-[28px] border border-white/15 px-2 py-1 shadow-[0_20px_50px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.08)] pointer-events-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            if (tab.isCTA) {
              return (
                <button
                  key={tab.id}
                  onClick={() => onChangeTab(tab.id)}
                  id="nav-quick-entry-button"
                  className="flex flex-col items-center justify-center px-4 py-1 group relative cursor-pointer"
                >
                  <div
                    className={`w-[52px] h-[52px] -mt-7 rounded-full flex items-center justify-center transition-all duration-300 active:scale-90 relative ${
                      isActive
                        ? 'bg-gradient-to-tr from-[#895c47] to-[#bc7363] text-white shadow-[0_0_24px_rgba(188,115,99,0.5)] ring-2 ring-[#bc7363]/80 scale-105'
                        : 'bg-black text-[#ece8e4] border-[1.5px] border-white/40 hover:border-white hover:bg-white hover:text-black shadow-2xl'
                    }`}
                  >
                    {!isActive && <div className="absolute inset-0 rounded-full animate-mic-copper pointer-events-none" />}
                    <Icon className="w-5 h-5 relative z-10" />
                  </div>
                  <span
                    className={`text-[10px] font-sans font-semibold mt-1 transition-colors ${
                      isActive ? 'text-[#bc7363]' : 'text-[#b6bcc5] group-hover:text-[#ece8e4]'
                    }`}
                  >
                    {tab.label}
                  </span>
                </button>
              );
            }

            return (
              <button
                key={tab.id}
                onClick={() => onChangeTab(tab.id)}
                id={`nav-${tab.id}-tab`}
                className="flex-1 min-h-[56px] flex flex-col items-center justify-center transition-all cursor-pointer relative group"
              >
                <div
                  className={`p-2 rounded-[16px] transition-all duration-300 ${
                    isActive ? 'bg-[#bc7363]/15 text-[#bc7363] shadow-inner' : 'text-[#b6bcc5]/80 group-hover:text-[#ece8e4]'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 transition-transform ${
                      isActive ? 'stroke-[2.5] scale-105' : 'stroke-[1.8]'
                    }`}
                  />
                </div>
                <span
                  className={`text-[10px] font-sans transition-colors mt-0.5 ${
                    isActive ? 'text-[#ece8e4] font-bold' : 'text-[#b6bcc5]/80 group-hover:text-[#ece8e4]'
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};



