import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2 } from 'lucide-react';

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  lang: 'en' | 'hi';
}

export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({ onTranscript, lang }) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [speechLang, setSpeechLang] = useState<'hi-IN' | 'en-IN'>('hi-IN');
  const [liveTranscript, setLiveTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = speechLang;

    recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          const finalTranscript = event.results[i][0].transcript;
          setLiveTranscript(finalTranscript);
          onTranscript(finalTranscript);
          setIsListening(false);
        } else {
          interim += event.results[i][0].transcript;
          setLiveTranscript(interim);
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.warn('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
  }, [speechLang, onTranscript]);

  const toggleListen = () => {
    if (!isSupported) {
      alert(
        lang === 'hi'
          ? 'आपके ब्राउज़र में आवाज़ पहचान उपलब्ध नहीं है।'
          : 'Web Speech API is not supported in this browser. Please type your entry.'
      );
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        setLiveTranscript('');
        if (recognitionRef.current) {
          recognitionRef.current.lang = speechLang;
          recognitionRef.current.start();
          setIsListening(true);
        }
      } catch (err) {
        console.error('Failed to start speech recognition', err);
        setIsListening(false);
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center my-3">
      {/* Visual pulse & mic button */}
      <div className="relative flex items-center justify-center">
        {isListening && (
          <>
            <div className="absolute w-32 h-32 rounded-full bg-[#bc7363]/30 animate-ping pointer-events-none" />
            <div className="absolute w-28 h-28 rounded-full bg-[#bc7363]/25 animate-pulse pointer-events-none" />
          </>
        )}

        <button
          type="button"
          onClick={toggleListen}
          id="voice-mic-button"
          className={`relative z-10 w-22 h-22 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl cursor-pointer ${
            isListening
              ? 'bg-[#d9604f] text-white ring-4 ring-[#d9604f]/40 scale-105 animate-mic-copper'
              : 'bg-black text-[#ece8e4] border-2 border-white/75 hover:border-white hover:bg-white hover:text-black hover:scale-105 active:scale-95 shadow-copper-glow'
          }`}
          title={isListening ? 'Stop listening' : 'Tap and speak'}
        >
          {isListening ? (
            <MicOff className="w-9 h-9 animate-pulse" />
          ) : (
            <Mic className="w-9 h-9" />
          )}
        </button>
      </div>

      {/* Helper text */}
      <p className="font-heading font-semibold text-sm mt-3.5 text-[#ece8e4] flex items-center gap-1.5">
        {isListening ? (
          <span className="text-[#d9604f] animate-pulse flex items-center gap-1.5">
            <Volume2 className="w-4 h-4" />
            <span>{lang === 'hi' ? 'सुन रहे हैं... बोलिए' : 'Listening... Speak now'}</span>
          </span>
        ) : (
          <span>{lang === 'hi' ? 'बोलने के लिए माइक दबाएं' : 'Tap mic to speak in Hinglish'}</span>
        )}
      </p>

      {/* Live Transcript Preview while speaking */}
      {isListening && liveTranscript && (
        <div className="mt-2 px-4 py-2 rounded-xl bg-black/60 border border-[#bc7363]/40 text-xs text-[#d9a45b] italic max-w-sm text-center animate-pulse">
          "{liveTranscript}"
        </div>
      )}

      {/* Voice Language Switcher */}
      <div className="mt-2.5 flex items-center gap-1 bg-black/60 p-1 rounded-full border border-white/15">
        <button
          type="button"
          onClick={() => setSpeechLang('hi-IN')}
          className={`text-[11px] font-sans font-semibold px-3 py-0.5 rounded-full transition-all cursor-pointer ${
            speechLang === 'hi-IN'
              ? 'bg-[#bc7363] text-white shadow-xs'
              : 'text-[#b6bcc5] hover:text-white'
          }`}
        >
          हिन्दी (hi-IN)
        </button>
        <button
          type="button"
          onClick={() => setSpeechLang('en-IN')}
          className={`text-[11px] font-sans font-semibold px-3 py-0.5 rounded-full transition-all cursor-pointer ${
            speechLang === 'en-IN'
              ? 'bg-[#bc7363] text-white shadow-xs'
              : 'text-[#b6bcc5] hover:text-white'
          }`}
        >
          English (en-IN)
        </button>
      </div>
    </div>
  );
};

