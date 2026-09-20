import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Header } from './components/Header';
import { BottomNav, TabType } from './components/BottomNav';
import { Toast } from './components/Toast';
import { LandingHero } from './components/LandingHero';
import { Home } from './pages/Home';
import { QuickEntry } from './pages/QuickEntry';
import { Customers } from './pages/Customers';
import { CustomerLedger } from './pages/CustomerLedger';
import { CashflowView } from './pages/CashflowView';

export function App() {
  // Support landing vs app routing
  const [showLanding, setShowLanding] = useState<boolean>(() => {
    return window.location.pathname === '/' && !window.location.hash.includes('app');
  });

  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [lang, setLang] = useState<'en' | 'hi'>('en');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  // Sync route on Explore
  const handleExploreApp = () => {
    setShowLanding(false);
    window.location.hash = '#/app';
  };

  const handleNavigate = (tab: TabType, customerId?: number) => {
    if (customerId) {
      setSelectedCustomerId(customerId);
      setActiveTab('customers');
    } else {
      setSelectedCustomerId(null);
      setActiveTab(tab);
    }
  };

  const handleSelectCustomer = (customerId: number) => {
    setSelectedCustomerId(customerId);
  };

  const handleQuickEntrySuccess = (customerId?: number) => {
    setToastMessage(lang === 'hi' ? 'खाता सफलतापूर्वक सुरक्षित किया गया!' : 'Entry saved to ledger!');
    setRefreshKey((k) => k + 1);
    if (customerId) {
      setSelectedCustomerId(customerId);
      setActiveTab('customers');
    } else {
      setActiveTab('home');
    }
  };

  const handleRefreshAll = () => {
    setToastMessage(lang === 'hi' ? 'डेमो डेटा रीसेट हो गया!' : 'Demo data reset successfully!');
    setRefreshKey((k) => k + 1);
    setSelectedCustomerId(null);
    setActiveTab('home');
  };

  return (
    <div className="min-h-screen bg-black text-[#ece8e4] relative overflow-x-hidden selection:bg-[#bc7363]/30 selection:text-white border-[12px] sm:border-[16px] border-black rounded-[28px]">
      {/* Cinematic Dark Blurred Hero Background for App */}
      <div className="fixed inset-3 sm:inset-4 pointer-events-none z-0 overflow-hidden rounded-[16px]">
        <img
          src="/hero.jpg"
          alt=""
          className="w-full h-full object-cover object-center scale-110 animate-slow-scale"
          style={{ filter: 'blur(16px) brightness(0.55) saturate(1.05)' }}
        />
        {/* Layered dark gradients for WCAG AA readability */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.55) 40%, rgba(0,0,0,0.85) 100%)' }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(188,115,99,0.12),_transparent_60%)]" />
      </div>

      {/* Landing Hero Screen (Animated Presence) */}
      <AnimatePresence>
        {showLanding && (
          <LandingHero onExplore={handleExploreApp} />
        )}
      </AnimatePresence>

      {/* Toast notifications */}
      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
      )}

      {/* Main Application Shell */}
      <div className="relative z-10 flex flex-col min-h-[calc(100vh-24px)] sm:min-h-[calc(100vh-32px)]">
        <Header
          lang={lang}
          onToggleLang={() => setLang((l) => (l === 'en' ? 'hi' : 'en'))}
          onRefreshData={handleRefreshAll}
          onOpenLanding={() => setShowLanding(true)}
        />

        <main className="flex-1 max-w-xl md:max-w-4xl lg:max-w-5xl w-full mx-auto px-3.5 sm:px-5 pt-4 pb-[100px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${activeTab}-${selectedCustomerId}-${refreshKey}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              {activeTab === 'home' && (
                <Home key={refreshKey} onNavigate={handleNavigate} lang={lang} />
              )}
              {activeTab === 'entry' && (
                <QuickEntry onSuccess={handleQuickEntrySuccess} lang={lang} />
              )}
              {activeTab === 'customers' && (
                selectedCustomerId ? (
                  <CustomerLedger
                    key={`${selectedCustomerId}-${refreshKey}`}
                    customerId={selectedCustomerId}
                    onBack={() => setSelectedCustomerId(null)}
                    lang={lang}
                  />
                ) : (
                  <Customers key={refreshKey} onSelectCustomer={handleSelectCustomer} lang={lang} />
                )
              )}
              {activeTab === 'cashflow' && (
                <CashflowView key={refreshKey} lang={lang} />
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        <BottomNav
          activeTab={selectedCustomerId ? 'customers' : activeTab}
          onChangeTab={(tab) => {
            setSelectedCustomerId(null);
            setActiveTab(tab);
          }}
          lang={lang}
        />
      </div>
    </div>
  );
}

export default App;

