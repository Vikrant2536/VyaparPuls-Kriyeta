import React, { useEffect } from 'react';
import { CheckCircle2, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error';
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 3200);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed top-16 inset-x-0 flex justify-center z-50 pointer-events-none px-4 animate-slide-up">
      <div className={`pointer-events-auto flex items-center gap-2.5 pl-3.5 pr-2.5 py-3 rounded-2xl shadow-2xl border text-sm font-semibold max-w-sm w-full ${
        type === 'success'
          ? 'bg-slate-900 text-white border-slate-800'
          : 'bg-rose-600 text-white border-rose-700'
      }`}>
        <CheckCircle2 className="w-4.5 h-4.5 text-teal-400 shrink-0" />
        <span className="flex-1 text-xs font-medium">{message}</span>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
