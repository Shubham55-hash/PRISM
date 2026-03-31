import React from 'react';
import { ShieldCheck, ExternalLink, Revoke, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { motion } from 'motion/react';

const consents = [
  { name: 'Zenith Corp HR', purpose: 'Employment Onboarding', date: 'Mar 12, 2024', status: 'Active', icon: 'https://logo.clearbit.com/zenith.com' },
  { name: 'Global Heritage Bank', purpose: 'KYC Verification', date: 'Mar 10, 2024', status: 'Active', icon: 'https://logo.clearbit.com/hsbc.com' },
  { name: 'SafeRent Properties', purpose: 'Rental Application', date: 'Feb 15, 2024', status: 'Expired', icon: 'https://logo.clearbit.com/zillow.com' },
  { name: 'HealthFirst Insurance', purpose: 'Policy Issuance', date: 'Jan 20, 2024', status: 'Active', icon: 'https://logo.clearbit.com/aetna.com' },
];

export function ConsentsPage() {
  return (
    <div className="space-y-8">
      <header>
        <h2 className="font-headline text-4xl font-extrabold text-on-surface tracking-tight">Data Consents</h2>
        <p className="text-secondary font-medium mt-2">Control which organizations have access to your digital identity.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {consents.map((item, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/10 shadow-sm flex flex-col"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="flex gap-4 items-center">
                <div className="w-12 h-12 rounded-xl bg-surface-container overflow-hidden p-2">
                  <img src={item.icon} alt={item.name} className="w-full h-full object-contain" onError={(e) => e.currentTarget.src = 'https://ui-avatars.com/api/?name=' + item.name} />
                </div>
                <div>
                  <h3 className="font-bold text-on-surface">{item.name}</h3>
                  <p className="text-xs text-secondary">{item.purpose}</p>
                </div>
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${item.status === 'Active' ? 'bg-primary/10 text-primary' : 'bg-outline-variant/20 text-outline'}`}>
                {item.status}
              </span>
            </div>

            <div className="space-y-3 mb-8">
              <div className="flex items-center gap-2 text-xs text-secondary">
                <Clock className="w-3 h-3" />
                <span>Granted on {item.date}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-secondary">
                <ShieldCheck className="w-3 h-3" />
                <span>Full Identity Access (Tier 2)</span>
              </div>
            </div>

            <div className="mt-auto flex gap-3">
              <button className="flex-1 py-2 bg-background border border-outline-variant/10 rounded-lg text-xs font-bold text-secondary hover:bg-surface-container transition-colors flex items-center justify-center gap-2">
                <ExternalLink className="w-3 h-3" /> Details
              </button>
              {item.status === 'Active' && (
                <button className="flex-1 py-2 bg-error/5 text-error border border-error/10 rounded-lg text-xs font-bold hover:bg-error/10 transition-colors flex items-center justify-center gap-2">
                  Revoke Access
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
