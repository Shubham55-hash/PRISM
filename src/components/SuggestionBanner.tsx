import React from 'react';
import { Sparkles } from 'lucide-react';

export function SuggestionBanner() {
  return (
    <div className="bg-gradient-to-r from-primary to-primary-container p-1 rounded-xl shadow-lg">
      <div className="bg-surface-container-lowest rounded-lg p-6 flex items-center gap-6">
        <div className="w-14 h-14 rounded-full bg-primary-fixed flex items-center justify-center text-primary flex-shrink-0">
          <Sparkles className="w-8 h-8 fill-current" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-headline font-bold text-on-surface">
            You may be starting a new job — prepare your bundle.
          </p>
          <p className="text-xs text-secondary mt-1">
            PRISM noticed recent activity. We can pre-package your references and ID for faster onboarding.
          </p>
        </div>
        <button className="bg-primary text-on-primary px-6 py-3 rounded-md font-bold text-xs uppercase tracking-widest hover:translate-y-[-2px] transition-all shadow-md">
          Prepare Now
        </button>
      </div>
    </div>
  );
}
