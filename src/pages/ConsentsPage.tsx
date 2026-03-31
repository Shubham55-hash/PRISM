import React, { useState } from 'react';
import { ShieldCheck, ExternalLink, Clock, Loader, CheckCircle2, XCircle, AlertTriangle, Plus, Copy, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApi } from '../hooks/useApi';
import { getConsents, revokeConsent, createConsent, Consent } from '../api/consents';
import { Skeleton } from '../components/Skeleton';

const TIER_LABEL: Record<number, string> = {
  1: 'Partial Access (Tier 1)',
  2: 'Full Identity (Tier 2)',
  3: 'Medical Access (Tier 3)',
};

const FIELD_OPTIONS = [
  { value: 'fullName', label: 'Full Name' },
  { value: 'email', label: 'Email Address' },
  { value: 'phone', label: 'Phone Number' },
  { value: 'address', label: 'Verified Address' },
  { value: 'finances', label: 'Financial Records' },
];

export function ConsentsPage() {
  const { data: consents, loading, refetch } = useApi(() => getConsents(), []);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  
  // Create Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [institutionName, setInstitutionName] = useState('');
  const [purpose, setPurpose] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const handleRevoke = async (id: string, name: string) => {
    if (!confirm(`Revoke access for ${name}? This is immediate and cannot be undone.`)) return;
    setRevokingId(id);
    try {
      await revokeConsent(id);
      refetch();
    } finally {
      setRevokingId(null);
    }
  };

  const toggleField = (val: string) => {
    setSelectedFields(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
  };

  const handleCreateConsent = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    if (!institutionName || !purpose || !expiresAt || selectedFields.length === 0) {
      setCreateError('Please fill out all fields and select at least one data field.');
      return;
    }
    
    setIsCreating(true);
    try {
      await createConsent({
        institutionName,
        purpose,
        allowedFields: selectedFields,
        // Calculate days to expiry for the backend or just use the date
        // Note: Backend takes `expiresAt` directly or `expiryDays` depending on API refactor.
        // Assuming backend handles either, or we manually supply `expiresAt` natively:
        ...{ expiresAt: new Date(expiresAt).toISOString() }
      } as any);
      setIsModalOpen(false);
      setInstitutionName('');
      setPurpose('');
      setExpiresAt('');
      setSelectedFields([]);
      refetch();
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create consent');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyToken = (token: string) => {
    if (!token) return;
    navigator.clipboard.writeText(token);
    alert('Consent token copied to clipboard!');
  };

  const activeCount = consents?.filter(c => c.status === 'active').length || 0;
  const expiredCount = consents?.filter(c => c.status === 'expired' || c.isExpired).length || 0;

  return (
    <div className="space-y-8">
      {/* Create Consent Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#FAF7F2] rounded-2xl p-8 max-w-lg w-full shadow-2xl relative border border-primary/20">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-secondary hover:text-primary transition-colors">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-2xl font-bold font-headline text-on-surface mb-2">New Data Consent</h3>
            <p className="text-secondary text-sm mb-6">Authorize an institution to access specific fields from your digital identity vault.</p>
            
            <form onSubmit={handleCreateConsent} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-secondary uppercase tracking-widest mb-1.5">Institution Name</label>
                <input required type="text" value={institutionName} onChange={e => setInstitutionName(e.target.value)} placeholder="e.g. HDFC Bank, Global Health" className="w-full bg-white border border-outline-variant/30 rounded-lg p-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-secondary uppercase tracking-widest mb-1.5">Purpose of Access</label>
                <input required type="text" value={purpose} onChange={e => setPurpose(e.target.value)} placeholder="e.g. KYC Verification for Home Loan" className="w-full bg-white border border-outline-variant/30 rounded-lg p-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
              </div>

              <div>
                <label className="block text-xs font-bold text-secondary uppercase tracking-widest mb-1.5">Allowed Fields</label>
                <div className="flex flex-wrap gap-2">
                  {FIELD_OPTIONS.map(field => (
                    <button type="button" key={field.value} onClick={() => toggleField(field.value)} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${selectedFields.includes(field.value) ? 'bg-primary border-primary text-on-primary shadow-sm' : 'bg-white border-outline-variant/30 text-secondary hover:border-primary/50'}`}>
                      {field.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-secondary uppercase tracking-widest mb-1.5">Expiry Date</label>
                <input required type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} className="w-full bg-white border border-outline-variant/30 rounded-lg p-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
              </div>

              {createError && <p className="text-xs font-bold text-error bg-error/10 px-3 py-2 rounded-lg">{createError}</p>}

              <button disabled={isCreating} type="submit" className="w-full bg-primary text-on-primary py-3 rounded-lg font-bold uppercase tracking-widest text-xs shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all mt-4 flex items-center justify-center gap-2">
                {isCreating ? <Loader className="w-4 h-4 animate-spin" /> : null}
                {isCreating ? 'Authorizing...' : 'Generate Consent Token'}
              </button>
            </form>
          </motion.div>
        </div>
      )}

      <header className="flex justify-between items-end">
        <div>
          <h2 className="font-headline text-4xl font-extrabold text-on-surface tracking-tight">Data Consents</h2>
          <p className="text-secondary font-medium mt-2">
            Control which organizations have access to your digital identity.
            {loading ? (
              <span className="ml-2 inline-flex gap-2">
                <Skeleton className="w-16 h-4" />
                <Skeleton className="w-16 h-4" />
              </span>
            ) : (
              <span className="ml-2">
                <span className="text-primary font-bold">{activeCount} active</span>
                {expiredCount > 0 && <span className="text-outline ml-2">{expiredCount} expired</span>}
              </span>
            )}
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-on-primary px-6 py-3 rounded-md font-bold text-xs uppercase tracking-widest shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> New Consent
        </button>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/10 shadow-sm flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div className="flex gap-4 items-center">
                  <Skeleton className="w-12 h-12 rounded-xl" />
                  <div className="space-y-2">
                    <Skeleton className="w-32 h-5" />
                    <Skeleton className="w-48 h-3" />
                  </div>
                </div>
                <Skeleton className="w-16 h-4" />
              </div>
              <div className="space-y-3">
                <Skeleton className="w-full h-8" />
                <Skeleton className="w-40 h-3" />
                <Skeleton className="w-48 h-3" />
              </div>
              <div className="flex gap-3 mt-4">
                <Skeleton className="flex-1 h-10" />
                <Skeleton className="flex-1 h-10" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence>
            {(consents || []).map((item: Consent & { consentToken?: string }, i) => {
              const isExpiredOrRevoked = item.status === 'expired' || item.status === 'revoked' || item.isExpired;
              const expiresAtDate = new Date(item.expiresAt);
              const daysLeft = Math.ceil((expiresAtDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/10 shadow-sm flex flex-col group"
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
                        <p className="text-xs text-secondary line-clamp-1">{item.purpose}</p>
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

                  <div className="space-y-3 mb-6">
                    {/* Access Token Banner if active */}
                    {!isExpiredOrRevoked && item.consentToken && (
                      <div className="bg-primary/5 rounded-lg border border-primary/20 p-2 flex items-center justify-between mb-2">
                        <span className="text-[10px] uppercase font-bold text-primary tracking-widest">Token Auth</span>
                        <div className="flex gap-2 items-center">
                          <code className="text-xs bg-white px-2 py-0.5 rounded text-on-surface font-mono">{item.consentToken.substring(0, 8)}...</code>
                          <button onClick={() => handleCopyToken(item.consentToken!)} className="text-primary hover:text-on-surface transition-colors" title="Copy exact token">
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 text-xs text-secondary">
                      <Clock className="w-3 h-3" />
                      <span>Granted {new Date(item.grantedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-secondary">
                      <ShieldCheck className="w-3 h-3" />
                      <span>{TIER_LABEL[item.accessTier] || 'Standard Access'}</span>
                    </div>
                    {!isExpiredOrRevoked && daysLeft > 0 && daysLeft <= 30 && (
                      <div className="flex items-center gap-2 text-xs text-amber-600 font-medium">
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
