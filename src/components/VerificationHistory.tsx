import React from 'react';
import { ArrowRight, CheckCircle2, File, UserCheck, History } from 'lucide-react';
import { cn } from '../lib/utils';

const history = [
  {
    title: 'Employment Verification Complete',
    time: '2h ago',
    description: <>A digital signature was provided to <span className="font-semibold text-primary">Zenith Corp HR</span> for onboarding.</>,
    icon: CheckCircle2,
    iconColor: 'text-primary',
    iconBg: 'bg-surface-container',
    fill: true,
  },
  {
    title: 'New Document Uploaded',
    time: 'Yesterday',
    description: <>Tax Statement 2023.pdf was added to your 'Financial' vault.</>,
    icon: File,
    iconColor: 'text-primary',
    iconBg: 'bg-surface-container',
  },
  {
    title: 'KYC Refresh Request',
    time: '3 days ago',
    description: <>Identity verification requested by <span className="font-semibold text-primary">Global Heritage Bank</span>.</>,
    icon: UserCheck,
    iconColor: 'text-on-secondary-container',
    iconBg: 'bg-secondary-container',
  },
  {
    title: 'Address Verified',
    time: '1 week ago',
    description: <>Physical residency confirmation was issued via decentralised node.</>,
    icon: History,
    iconColor: 'text-primary',
    iconBg: 'bg-surface-container',
  },
];

export function VerificationHistory() {
  return (
    <div className="bg-surface-container-lowest rounded-xl p-10 shadow-2xl shadow-prism-sidebar/5 border border-outline-variant/10">
      <div className="flex justify-between items-center mb-10">
        <h3 className="font-headline text-2xl font-bold text-on-surface">Verification History</h3>
        <button className="text-sm font-bold text-primary flex items-center gap-2 hover:opacity-70">
          View Archive <ArrowRight className="w-4 h-4" />
        </button>
      </div>
      
      <div className="space-y-0 relative">
        {/* Vertical Line */}
        <div className="absolute left-[19px] top-2 bottom-8 w-px bg-outline-variant/30" />
        
        {history.map((item, index) => (
          <div key={index} className={cn("relative flex gap-6", index !== history.length - 1 && "pb-10")}>
            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center z-10", item.iconBg, item.iconColor)}>
              <item.icon className={cn("w-5 h-5", item.fill && "fill-current")} />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <h4 className="font-bold text-on-surface">{item.title}</h4>
                <span className="text-xs font-medium text-outline">{item.time}</span>
              </div>
              <p className="text-sm text-secondary mt-1 leading-relaxed">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
