import React, { useState } from 'react';
import { Globe, RefreshCw, Sparkles, Home as HomeIcon } from 'lucide-react';
import { triggerDatabaseSeed } from '../services/api';

interface HeaderProps {
  lang: 'en' | 'hi';
  onToggleLang: () => void;
  onRefreshData?: () => void;
  onOpenLanding?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  lang,
  onToggleLang,
  onRefreshData,
  onOpenLanding,
}) => {
  const [isResetting, setIsResetting] = useState(false);

  const handleReset = async () => {
    if (
      confirm(
        lang === 'hi'
          ? 'क्या आप डेमो डेटा रीसेट करना चाहते हैं?'
          : 'Reset demo data to 40 customers and 250 transactions?'
      )
    ) {
      try {
        setIsResetting(true);
        await triggerDatabaseSeed();
        if (onRefreshData) onRefreshData();
      } catch (err) {
        alert('Failed to reset: ' + err);
      } finally {
        setIsResetting(false);
      }
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-black/35 backdrop-blur-[16px] border-b border-white/10 transition-all">
      <div className="max-w-xl md:max-w-4xl lg:max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand with Black Square Logo Tile */}
        <button
          type="button"
          onClick={onOpenLanding}
          className="flex items-center gap-3.5 group text-left cursor-pointer"
          title="Return to Landing Hero"
        >
          <div className="w-10 h-10 bg-black rounded-lg border border-white/20 flex items-center justify-center shadow-2xl group-hover:border-[#bc7363]/80 transition-colors">
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5 stroke-white fill-none stroke-[2] stroke-linecap-round stroke-linejoin-round"
            >
              <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
              <path d="m9 13 2 2 4-4" />
            </svg>
          </div>

          <div>
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-serif text-base tracking-[0.2em] font-bold text-[#ece8e4] group-hover:text-white transition-colors">
                VYAPAR
              </span>
            </div>
            <p className="text-[9px] text-[#b6bcc5]/70 font-sans tracking-wide mt-1 leading-none uppercase">
              PULSE • FINTECH
            </p>
          </div>
        </button>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Landing / Intro button */}
          {onOpenLanding && (
            <button
              type="button"
              onClick={onOpenLanding}
              title={lang === 'hi' ? 'मुख्य पृष्ठ' : 'Landing Hero'}
              className="flex items-center gap-1 text-[11px] font-sans font-medium text-[#b6bcc5] hover:text-[#ece8e4] bg-black/45 hover:bg-black/60 border border-white/20 hover:border-white/40 px-3 py-1.5 rounded-full transition-all cursor-pointer"
            >
              <HomeIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Intro</span>
            </button>
          )}

          {/* Reset Demo Data Button */}
          <button
            type="button"
            onClick={handleReset}
            disabled={isResetting}
            title={lang === 'hi' ? 'डेमो डेटा रीसेट' : 'Reset sample dataset'}
            className="flex items-center gap-1.5 text-[11px] font-sans font-medium text-[#b6bcc5] hover:text-[#ece8e4] bg-black/45 hover:bg-black/60 px-3 py-1.5 rounded-full border border-white/20 hover:border-white/40 transition-all cursor-pointer"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-[#bc7363] ${isResetting ? 'animate-spin' : ''}`}
            />
            <span className="hidden sm:inline">
              {isResetting ? '...' : lang === 'hi' ? 'रीसेट' : 'Reset'}
            </span>
          </button>

          {/* Language Toggle */}
          <button
            type="button"
            onClick={onToggleLang}
            className="flex items-center gap-1.5 text-[11px] font-serif font-bold text-[#ece8e4] hover:text-white bg-black/45 hover:bg-black/60 border border-white/20 hover:border-white/40 px-3 py-1.5 rounded-full transition-all cursor-pointer shadow-xs"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{lang === 'en' ? 'हिन्दी' : 'English'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};



