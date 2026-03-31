import React from 'react';
import { ArrowRight, CheckCircle2, File, UserCheck, History, Shield, Key } from 'lucide-react';
import { cn } from '../lib/utils';
import { useApi } from '../hooks/useApi';
import { activityApi, Activity } from '../api/activity';

const ICONS: Record<string, React.ElementType> = {
  verification: UserCheck,
  document: File,
  consent: Shield,
  security: Key,
  api_access: History,
  access: History,
};

export function VerificationHistory() {
  const { data, loading } = useApi(() => activityApi.list({ type: 'verification', limit: 4 }), []);
  const logs = data?.activities || [];

  return (
    <div className="bg-surface-container-lowest rounded-xl p-10 shadow-2xl shadow-prism-sidebar/5 border border-outline-variant/10">
      <div className="flex justify-between items-center mb-10">
        <h3 className="font-headline text-2xl font-bold text-on-surface">Verification History</h3>
        <button 
          onClick={() => window.location.href = '/activity?type=verification'}
          className="text-sm font-bold text-primary flex items-center gap-2 hover:opacity-70"
        >
          View Archive <ArrowRight className="w-4 h-4" />
        </button>
      </div>
      
      {loading ? (
        <div className="py-10 text-center text-sm font-medium text-secondary animate-pulse">
          Loading history...
        </div>
      ) : logs.length === 0 ? (
        <div className="py-10 text-center text-sm font-medium text-secondary">
          No verification history found.
        </div>
      ) : (
        <div className="space-y-0 relative">
          {/* Vertical Line */}
          <div className="absolute left-[19px] top-2 bottom-8 w-px bg-outline-variant/30" />
          
          {logs.map((item: Activity, index: number) => {
            const Icon = ICONS[item.eventType] || History;
            return (
              <div key={item.id} className={cn("relative flex gap-6", index !== logs.length - 1 && "pb-10")}>
                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center z-10", item.iconStyle.bg, item.iconStyle.color)}>
                  <Icon className={cn("w-5 h-5", item.eventType === 'verification' && "fill-current")} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-on-surface text-base">{item.title}</h4>
                    <span className="text-xs font-medium text-outline whitespace-nowrap pl-2">{item.timeAgo}</span>
                  </div>
                  <p className="text-sm text-secondary mt-1 leading-relaxed">
                    {item.description}
                    {item.entityName && (
                      <>
                        {' — '}
                        <span className="font-semibold text-primary">{item.entityName}</span>
                      </>
                    )}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
