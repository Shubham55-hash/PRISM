import React from 'react';
import { motion } from 'motion/react';
import { Clock, Shield, Key, FileText, UserCheck, Search, Filter } from 'lucide-react';
import { cn } from '../lib/utils';

const activities = [
  { id: 1, type: 'verification', title: 'Employment Verification Complete', entity: 'Zenith Corp HR', time: '2h ago', icon: UserCheck, color: 'text-primary', bg: 'bg-surface-container' },
  { id: 2, type: 'document', title: 'New Document Uploaded', entity: 'Financial Vault', time: 'Yesterday', icon: FileText, color: 'text-primary', bg: 'bg-surface-container' },
  { id: 3, type: 'consent', title: 'KYC Refresh Request', entity: 'Global Heritage Bank', time: '3 days ago', icon: Shield, color: 'text-on-secondary-container', bg: 'bg-secondary-container' },
  { id: 4, type: 'verification', title: 'Address Verified', entity: 'Decentralised Node', time: '1 week ago', icon: Clock, color: 'text-primary', bg: 'bg-surface-container' },
  { id: 5, type: 'security', title: 'New Device Authorized', entity: 'iPhone 15 Pro', time: '2 weeks ago', icon: Key, color: 'text-tertiary', bg: 'bg-tertiary-fixed/20' },
  { id: 6, type: 'consent', title: 'Consent Revoked', entity: 'SafeRent Properties', time: '1 month ago', icon: Shield, color: 'text-error', bg: 'bg-error-container/30' },
];

export function ActivityPage() {
  return (
    <div className="space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="font-headline text-4xl font-extrabold text-on-surface tracking-tight">Activity Log</h2>
          <p className="text-secondary font-medium mt-2">A comprehensive history of your digital identity interactions.</p>
        </div>
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
            <input 
              type="text" 
              placeholder="Search activity..." 
              className="bg-surface-container-lowest border border-outline-variant/10 rounded-lg pl-10 pr-4 py-2 text-sm outline-none focus:ring-1 ring-primary/20"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-surface-container-lowest rounded-lg text-sm font-bold text-secondary border border-outline-variant/10">
            <Filter className="w-4 h-4" /> Filter
          </button>
        </div>
      </header>

      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/10 overflow-hidden">
        <div className="p-8 space-y-0 relative">
          {/* Vertical Line */}
          <div className="absolute left-[47px] top-8 bottom-8 w-px bg-outline-variant/30" />

          {activities.map((activity, i) => (
            <motion.div 
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={cn("relative flex gap-8", i !== activities.length - 1 && "pb-12")}
            >
              <div className={cn("w-12 h-12 rounded-full flex items-center justify-center z-10 shadow-sm", activity.bg, activity.color)}>
                <activity.icon className="w-6 h-6" />
              </div>
              <div className="flex-1 pt-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-on-surface text-lg">{activity.title}</h4>
                    <p className="text-sm text-secondary mt-1">
                      Action performed on <span className="font-semibold text-primary">{activity.entity}</span>
                    </p>
                  </div>
                  <span className="text-xs font-medium text-outline bg-surface-container px-3 py-1 rounded-full">
                    {activity.time}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        <div className="p-6 bg-surface-container/30 border-t border-outline-variant/10 text-center">
          <button className="text-sm font-bold text-primary hover:underline">Load More Activity</button>
        </div>
      </div>
    </div>
  );
}
