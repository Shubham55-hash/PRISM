import React from 'react';

export function TrustIndex() {
  const score = 92;
  const circumference = 2 * Math.PI * 88;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="bg-surface-container-lowest rounded-xl p-8 flex flex-col items-center shadow-2xl shadow-prism-sidebar/5 border border-outline-variant/10">
      <span className="text-xs font-bold uppercase tracking-widest text-primary mb-6">Trust Index</span>
      <div className="relative w-48 h-48 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90">
          <circle 
            className="text-surface-container" 
            cx="96" cy="96" fill="transparent" r="88" 
            stroke="currentColor" strokeWidth="12" 
          />
          <circle 
            className="text-prism-accent" 
            cx="96" cy="96" fill="transparent" r="88" 
            stroke="currentColor" strokeWidth="12" 
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-extrabold font-headline text-on-surface">{score}</span>
          <span className="text-[10px] font-bold text-on-secondary-fixed-variant tracking-tighter">SECURE</span>
        </div>
      </div>
      <p className="mt-8 text-sm text-center text-on-surface-variant font-medium">
        Your identity health is in the top 5% of PRISM users.
      </p>
    </div>
  );
}
