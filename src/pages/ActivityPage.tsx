import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, Shield, Key, FileText, UserCheck, Search, Filter, Loader } from 'lucide-react';
import { cn } from '../lib/utils';
import { useApi } from '../hooks/useApi';
import { getActivity, Activity } from '../api/activity';

const ICONS: Record<string, React.ElementType> = {
  verification: UserCheck,
  document: FileText,
  consent: Shield,
  security: Key,
  api_access: Clock,
  access: Clock,
};

export function ActivityPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  
  const { data, loading } = useApi(
    () => getActivity({ type: typeFilter || undefined, page, search: search || undefined }),
    [typeFilter, page, search]
  );
  
  const activities = data?.activities || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="font-headline text-4xl font-extrabold text-on-surface tracking-tight">Activity Log</h2>
          <p className="text-secondary font-medium mt-2">
            A comprehensive history of your digital identity interactions.
            {pagination && <span className="ml-2 text-primary font-bold">{pagination.total} events</span>}
          </p>
        </div>
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
            <input 
              type="text" 
              placeholder="Search activity..." 
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="bg-surface-container-lowest border border-outline-variant/10 rounded-lg pl-10 pr-4 py-2 text-sm outline-none focus:ring-1 ring-primary/20"
            />
          </div>
          <select 
            value={typeFilter}
            onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
            className="bg-surface-container-lowest border border-outline-variant/10 rounded-lg px-4 py-2 text-sm font-bold text-secondary outline-none focus:ring-1 ring-primary/20"
          >
            <option value="">All Events</option>
            <option value="verification">Verifications</option>
            <option value="document">Documents</option>
            <option value="consent">Consents</option>
            <option value="security">Security</option>
          </select>
        </div>
      </header>

      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/10 overflow-hidden">
        {loading && activities.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <Loader className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-20 text-secondary">
            <Clock className="w-12 h-12 mx-auto mb-3 text-outline" />
            <p className="font-bold">No activity found</p>
          </div>
        ) : (
          <div className="p-8 space-y-0 relative">
            {/* Vertical Line */}
            <div className="absolute left-[47px] top-8 bottom-8 w-px bg-outline-variant/30" />

            <AnimatePresence>
              {activities.map((activity: Activity, i) => {
                const Icon = ICONS[activity.eventType] || Clock;
                return (
                  <motion.div 
                    key={activity.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={cn("relative flex gap-8", i !== activities.length - 1 && "pb-12")}
                  >
                    <div className={cn("w-12 h-12 rounded-full flex items-center justify-center z-10 shadow-sm", activity.iconStyle.bg, activity.iconStyle.color)}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1 pt-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-on-surface text-lg">{activity.title}</h4>
                          <p className="text-sm text-secondary mt-1">
                            {activity.description}
                            {activity.entityName && (
                              <>
                                {' — '}
                                <span className="font-semibold text-primary">{activity.entityName}</span>
                              </>
                            )}
                          </p>
                        </div>
                        <span className="text-xs font-medium text-outline bg-surface-container px-3 py-1 rounded-full whitespace-nowrap">
                          {activity.timeAgo}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
        
        {pagination && pagination.pages > 1 && (
          <div className="p-6 bg-surface-container/30 border-t border-outline-variant/10 flex justify-between items-center">
            <span className="text-xs text-secondary font-bold">
              Showing {activities.length} of {pagination.total}
            </span>
            <div className="flex gap-3">
              <button 
                onClick={() => setPage(p => p - 1)} disabled={page === 1}
                className="text-sm font-bold text-primary hover:underline disabled:opacity-40 disabled:hover:no-underline"
              >
                ← Newer
              </button>
              <button 
                onClick={() => setPage(p => p + 1)} disabled={page === pagination.pages}
                className="text-sm font-bold text-primary hover:underline disabled:opacity-40 disabled:hover:no-underline"
              >
                Older →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
