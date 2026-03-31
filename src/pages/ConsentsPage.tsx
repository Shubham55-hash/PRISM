import React, { useState } from 'react';
import { ShieldCheck, ExternalLink, Clock, Loader, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApi } from '../hooks/useApi';
import { consentsApi, Consent } from '../api/consents';

const TIER_LABEL: Record<number, string> = {
  1: 'Partial Access (Tier 1)',
  2: 'Full Identity (Tier 2)',
  3: 'Medical Access (Tier 3)',
};

export function ConsentsPage() {
  const { data: consents, loading, refetch } = useApi(() => consentsApi.list(), []);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const handleRevoke = async (id: string, name: string) => {
    if (!confirm(`Revoke access for ${name}? This is immediate and cannot be undone.`)) return;
    setRevokingId(id);
    try {
      await consentsApi.revoke(id);
      refetch();
    } finally {
      setRevokingId(null);
    }
  };

  const activeCount = consents?.filter(c => c.status === 'active').length || 0;
  const expiredCount = consents?.filter(c => c.status === 'expired' || c.isExpired).length || 0;

  return (
    <div className="space-y-8">
      <header>
        <h2 className="font-headline text-4xl font-extrabold text-on-surface tracking-tight">Data Consents</h2>
        <p className="text-secondary font-medium mt-2">
          Control which organizations have access to your digital identity.
          {!loading && (
            <span className="ml-2">
              <span className="text-primary font-bold">{activeCount} active</span>
              {expiredCount > 0 && <span className="text-outline ml-2">{expiredCount} expired</span>}
            </span>
          )}
        </p>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence>
            {(consents || []).map((item: Consent, i) => {
              const isExpiredOrRevoked = item.status === 'expired' || item.status === 'revoked' || item.isExpired;
              const expiresAt = new Date(item.expiresAt);
              const daysLeft = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/10 shadow-sm flex flex-col"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex gap-4 items-center">
                      <div className="w-12 h-12 rounded-xl bg-surface-container overflow-hidden p-2 flex-shrink-0">
                        {item.institutionLogoUrl ? (
                          <img
                            src={item.institutionLogoUrl}
                            alt={item.institutionName}
                            className="w-full h-full object-contain"
                            onError={e => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <span className={`text-xs font-bold text-secondary ${item.institutionLogoUrl ? 'hidden' : ''}`}>
                          {item.institutionName.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-bold text-on-surface">{item.institutionName}</h3>
                        <p className="text-xs text-secondary">{item.purpose}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded flex-shrink-0 ${
                      item.status === 'active' && !item.isExpired
                        ? 'bg-primary/10 text-primary'
                        : item.status === 'revoked'
                        ? 'bg-error/10 text-error'
                        : 'bg-outline-variant/20 text-outline'
                    }`}>
                      {item.status === 'revoked' ? 'Revoked' : item.isExpired ? 'Expired' : 'Active'}
                    </span>
                  </div>

                  <div className="space-y-3 mb-8">
                    <div className="flex items-center gap-2 text-xs text-secondary">
                      <Clock className="w-3 h-3" />
                      <span>Granted {new Date(item.grantedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-secondary">
                      <ShieldCheck className="w-3 h-3" />
                      <span>{TIER_LABEL[item.accessTier] || 'Standard Access'}</span>
                    </div>
                    {!isExpiredOrRevoked && daysLeft > 0 && daysLeft <= 30 && (
                      <div className="flex items-center gap-2 text-xs text-amber-600">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Expires in {daysLeft} day{daysLeft !== 1 ? 's' : ''}</span>
                      </div>
                    )}
                    {item.accessCount > 0 && (
                      <div className="flex items-center gap-2 text-xs text-secondary">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Accessed {item.accessCount} time{item.accessCount !== 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-auto flex gap-3">
                    <button className="flex-1 py-2 bg-background border border-outline-variant/10 rounded-lg text-xs font-bold text-secondary hover:bg-surface-container transition-colors flex items-center justify-center gap-2">
                      <ExternalLink className="w-3 h-3" /> Details
                    </button>
                    {item.status === 'active' && !item.isExpired && (
                      <button
                        onClick={() => handleRevoke(item.id, item.institutionName)}
                        disabled={revokingId === item.id}
                        className="flex-1 py-2 bg-error/5 text-error border border-error/10 rounded-lg text-xs font-bold hover:bg-error/10 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                      >
                        {revokingId === item.id ? <Loader className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
                        {revokingId === item.id ? 'Revoking…' : 'Revoke Access'}
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
