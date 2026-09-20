import React, { useState, useEffect } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface LandingHeroProps {
  onExplore: () => void;
}

const MESSAGES = [
  'Hi, Welcome to VyaparPulse',
  'Thank you for exploring',
];

export const LandingHero: React.FC<LandingHeroProps> = ({ onExplore }) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  // Typewriter effect loop
  useEffect(() => {
    const fullText = MESSAGES[currentMessageIndex];
    const typingSpeed = isDeleting ? 40 : 80;
    const pauseDelay = 2200;

    let timeout: any;

    if (!isDeleting && displayedText === fullText) {
      timeout = setTimeout(() => setIsDeleting(true), pauseDelay);
    } else if (isDeleting && displayedText === '') {
      setIsDeleting(false);
      setCurrentMessageIndex((prev) => (prev + 1) % MESSAGES.length);
    } else {
      timeout = setTimeout(() => {
        const nextLength = displayedText.length + (isDeleting ? -1 : 1);
        setDisplayedText(fullText.substring(0, nextLength));
      }, typingSpeed);
    }

    return () => clearTimeout(timeout);
  }, [displayedText, isDeleting, currentMessageIndex]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } }}
      className="fixed inset-0 z-50 overflow-hidden bg-black select-none border-[12px] border-black"
    >
      {/* Background Image Container */}
      <div className="relative w-full h-full overflow-hidden rounded-xl">
        <img
          src="/hero.jpg"
          alt="Market Atmosphere"
          onLoad={() => setIsImageLoaded(true)}
          className={`absolute inset-0 w-full h-full object-cover object-center transition-all duration-1000 ${
            isImageLoaded ? 'scale-100 filter-none opacity-100' : 'scale-105 blur-lg opacity-0'
          }`}
        />

        {/* Cinematic dark gradient overlay: rgba(0,0,0,.35) -> rgba(0,0,0,.60) with teal/copper tint */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(135deg, rgba(15, 42, 46, 0.45) 0%, rgba(0, 0, 0, 0.40) 40%, rgba(0, 0, 0, 0.75) 100%), radial-gradient(circle at top right, rgba(188, 115, 99, 0.25) 0%, transparent 60%)',
          }}
        />

        {/* Top-Left: Black Square Logo Tile + Spaced Serif Wordmark */}
        <div className="absolute top-6 left-6 sm:top-8 sm:left-10 z-20 flex items-center gap-3.5">
          <div className="w-11 h-11 bg-black rounded-lg border border-white/20 flex items-center justify-center shadow-2xl">
            {/* White cloud with checkmark */}
            <div className="relative flex items-center justify-center text-white">
              <svg
                viewBox="0 0 24 24"
                className="w-6 h-6 stroke-current fill-none stroke-[2] stroke-linecap-round stroke-linejoin-round"
              >
                <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
                <path d="m9 13 2 2 4-4" />
              </svg>
            </div>
          </div>

          <div>
            <span className="font-serif text-lg tracking-[0.25em] font-bold text-[#ece8e4] uppercase drop-shadow-md">
              VYAPAR
            </span>
            <span className="block text-[10px] tracking-[0.3em] text-[#b6bcc5] font-sans uppercase -mt-0.5">
              PULSE • FINTECH
            </span>
          </div>
        </div>

        {/* Center-Left Content Area */}
        <div className="absolute inset-y-0 left-6 sm:left-12 md:left-20 max-w-2xl flex flex-col justify-center z-20 pr-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="space-y-6"
          >
            {/* Tag badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/60 border border-white/15 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-[#bc7363]" />
              <span className="text-xs font-semibold uppercase tracking-wider text-[#b6bcc5]">
                Smart Supermarket Ledger
              </span>
            </div>

            {/* Typewriter headline */}
            <div className="min-h-[110px] sm:min-h-[140px] flex items-center">
              <h1
                className="font-heading font-extrabold text-3xl sm:text-5xl md:text-6xl text-[#ece8e4] tracking-[-0.02em] leading-[1.12]"
                style={{
                  textShadow: '0 4px 20px rgba(0, 0, 0, 0.8), 0 1px 3px rgba(0, 0, 0, 0.9)',
                }}
              >
                <span>{displayedText}</span>
                <span className="typewriter-caret inline-block w-[3px] sm:w-[4px] h-[0.85em] bg-[#bc7363] ml-1 align-baseline" />
              </h1>
            </div>

            {/* Sub-headline / context */}
            <p className="text-sm sm:text-base text-[#b6bcc5] max-w-lg font-normal leading-relaxed drop-shadow">
              Instant Hinglish voice transactions, 7-day automated cashflow forecasting, and 1-click WhatsApp payment reminders.
            </p>

            {/* Explore Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={onExplore}
                id="landing-explore-button"
                className="btn-cinematic px-8 py-3.5 text-base sm:text-lg group"
              >
                <span>Explore</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </motion.div>
        </div>

        {/* Bottom subtle copyright / info */}
        <div className="absolute bottom-6 left-6 sm:left-10 z-20 text-[11px] text-[#b6bcc5]/60 font-sans tracking-wide">
          HACK IT BROS ’26 • Track 2: FinTech & Local Commerce
        </div>
      </div>
    </motion.div>
  );
};
