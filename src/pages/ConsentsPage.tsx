import React, { useState } from 'react';
import {
  ShieldCheck, Eye, Clock, Loader, CheckCircle2, XCircle,
  AlertTriangle, Plus, Copy, X, Calendar, Hash, Database,
  Building2, Lock, Unlock, Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApi } from '../hooks/useApi';
import { getConsents, revokeConsent, createConsent, Consent } from '../api/consents';
import { Skeleton } from '../components/Skeleton';

const TIER_LABEL: Record<number, string> = {
  1: 'Partial Access (Tier 1)',
  2: 'Full Identity (Tier 2)',
  3: 'Medical Access (Tier 3)',
};

const TIER_DESC: Record<number, string> = {
  1: 'Basic profile fields only',
  2: 'Full identity including address & documents',
  3: 'Includes medical records & health data',
};

const FIELD_OPTIONS = [
  { value: 'fullName', label: 'Full Name' },
  { value: 'email', label: 'Email Address' },
  { value: 'phone', label: 'Phone Number' },
  { value: 'address', label: 'Verified Address' },
  { value: 'finances', label: 'Financial Records' },
];

const FIELD_LABEL: Record<string, string> = {
  fullName: 'Full Name',
  email: 'Email Address',
  phone: 'Phone Number',
  address: 'Verified Address',
  finances: 'Financial Records',
};

// ─── View Details Modal ────────────────────────────────────────────────────────
function ConsentDetailModal({
  consent,
  onClose,
  onRevoke,
  isRevoking,
}: {
  consent: Consent;
  onClose: () => void;
  onRevoke: (id: string, name: string) => void;
  isRevoking: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const isExpiredOrRevoked = consent.status === 'expired' || consent.status === 'revoked' || consent.isExpired;
  const expiresAtDate = new Date(consent.expiresAt);
  const daysLeft = Math.ceil((expiresAtDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const fields: string[] = Array.isArray(consent.allowedFields)
    ? consent.allowedFields
    : typeof consent.allowedFields === 'string'
    ? consent.allowedFields.split(',').filter(Boolean)
    : [];

  const handleCopy = () => {
    if (!consent.consentToken) return;
    navigator.clipboard.writeText(consent.consentToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const statusColor =
    consent.status === 'active' && !consent.isExpired
      ? { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' }
      : consent.status === 'revoked'
      ? { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' }
      : { bg: 'bg-gray-100', text: 'text-gray-500', border: 'border-gray-200', dot: 'bg-gray-400' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 16 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="bg-[#FAF7F2] rounded-2xl max-w-lg w-full shadow-2xl border border-primary/10 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-transparent px-8 pt-8 pb-6 border-b border-outline-variant/10">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-primary/10 text-secondary hover:text-primary transition-all"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-white border border-outline-variant/20 shadow-sm flex items-center justify-center flex-shrink-0 overflow-hidden">
              {consent.institutionLogoUrl ? (
                <img src={consent.institutionLogoUrl} alt={consent.institutionName} className="w-10 h-10 object-contain" />
              ) : (
                <span className="text-xl font-black text-primary">{consent.institutionName.charAt(0)}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-headline text-xl font-bold text-on-surface truncate">{consent.institutionName}</h3>
              <p className="text-sm text-secondary mt-0.5 line-clamp-2">{consent.purpose}</p>
            </div>
          </div>

          {/* Status Badge */}
          <div className={`mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold uppercase tracking-widest ${statusColor.bg} ${statusColor.text} ${statusColor.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${statusColor.dot} ${consent.status === 'active' && !consent.isExpired ? 'animate-pulse' : ''}`} />
            {consent.status === 'revoked' ? 'Revoked' : consent.isExpired ? 'Expired' : 'Active'}
          </div>
        </div>

        {/* Body */}
        <div className="px-8 py-6 space-y-5 max-h-[60vh] overflow-y-auto">

          {/* Consent Token */}
          {consent.consentToken && (
            <div className="bg-primary/5 rounded-xl border border-primary/15 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Hash className="w-3.5 h-3.5 text-primary" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Consent Token</span>
                </div>
                <button
                  onClick={handleCopy}
                  className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md transition-all ${copied ? 'bg-emerald-100 text-emerald-700' : 'bg-primary/10 text-primary hover:bg-primary/20'}`}
                >
                  <Copy className="w-3 h-3" />
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <code className="text-xs font-mono text-on-surface break-all bg-white px-3 py-2 rounded-lg border border-outline-variant/20 block">
                {consent.consentToken}
              </code>
            </div>
          )}

          {/* Allowed Data Fields */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Database className="w-3.5 h-3.5 text-secondary" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-secondary">Authorized Data Fields</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {fields.length > 0 ? fields.map(f => (
                <span key={f} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20">
                  {FIELD_LABEL[f] || f}
                </span>
              )) : (
                <span className="text-xs text-secondary italic">No specific fields defined</span>
              )}
            </div>
          </div>

          {/* Access Tier */}
          <div className="flex items-start gap-3 bg-surface-container rounded-xl p-4 border border-outline-variant/10">
            <ShieldCheck className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-on-surface">{TIER_LABEL[consent.accessTier] || 'Standard Access'}</p>
              <p className="text-xs text-secondary mt-0.5">{TIER_DESC[consent.accessTier] || 'Standard data access permissions'}</p>
            </div>
          </div>

          {/* Date Info Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-surface-container rounded-xl p-3 border border-outline-variant/10">
              <div className="flex items-center gap-1.5 mb-1">
                <Calendar className="w-3 h-3 text-secondary" />
                <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">Granted</span>
              </div>
              <p className="text-sm font-bold text-on-surface">
                {new Date(consent.grantedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
            <div className={`rounded-xl p-3 border ${isExpiredOrRevoked ? 'bg-surface-container border-outline-variant/10' : daysLeft <= 7 ? 'bg-red-50 border-red-200' : daysLeft <= 30 ? 'bg-amber-50 border-amber-200' : 'bg-surface-container border-outline-variant/10'}`}>
              <div className="flex items-center gap-1.5 mb-1">
                <Clock className={`w-3 h-3 ${isExpiredOrRevoked ? 'text-secondary' : daysLeft <= 7 ? 'text-red-500' : daysLeft <= 30 ? 'text-amber-600' : 'text-secondary'}`} />
                <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">Expires</span>
              </div>
              <p className={`text-sm font-bold ${isExpiredOrRevoked ? 'text-secondary' : daysLeft <= 7 ? 'text-red-600' : daysLeft <= 30 ? 'text-amber-700' : 'text-on-surface'}`}>
                {expiresAtDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
              {!isExpiredOrRevoked && daysLeft > 0 && (
                <p className={`text-[10px] font-bold mt-0.5 ${daysLeft <= 7 ? 'text-red-500' : daysLeft <= 30 ? 'text-amber-600' : 'text-secondary'}`}>
                  {daysLeft} day{daysLeft !== 1 ? 's' : ''} remaining
                </p>
              )}
            </div>
          </div>

          {/* Access Count */}
          <div className="flex items-center gap-3 bg-surface-container rounded-xl p-3 border border-outline-variant/10">
            <Activity className="w-3.5 h-3.5 text-secondary flex-shrink-0" />
            <div>
              <span className="text-xs text-secondary">This institution has accessed your data </span>
              <span className="text-xs font-bold text-on-surface">{consent.accessCount} time{consent.accessCount !== 1 ? 's' : ''}</span>
            </div>
          </div>

          {/* Revoked At */}
          {consent.revokedAt && (
            <div className="flex items-center gap-3 bg-error/5 rounded-xl p-3 border border-error/10">
              <XCircle className="w-3.5 h-3.5 text-error flex-shrink-0" />
              <p className="text-xs text-error font-medium">
                Revoked on {new Date(consent.revokedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
          )}

          {/* Expiry warnings */}
          {!isExpiredOrRevoked && daysLeft <= 0 && (
            <div className="flex items-center gap-2 bg-amber-50 rounded-xl p-3 border border-amber-200">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
              <p className="text-xs font-medium text-amber-700">This consent has expired and access is automatically blocked.</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-8 pb-6 pt-2 border-t border-outline-variant/10 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-surface-container border border-outline-variant/20 rounded-xl text-xs font-bold text-secondary hover:bg-surface-container-highest transition-colors"
          >
            Close
          </button>
          {consent.status === 'active' && !consent.isExpired && (
            <button
              onClick={() => { onRevoke(consent.id, consent.institutionName); onClose(); }}
              disabled={isRevoking}
              className="flex-1 py-2.5 bg-error/10 text-error border border-error/20 rounded-xl text-xs font-bold hover:bg-error/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isRevoking ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
              Revoke Access
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export function ConsentsPage() {
  const { data: consents, loading, refetch } = useApi(() => getConsents(), []);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [viewConsent, setViewConsent] = useState<Consent | null>(null);

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
        expiresAt: new Date(expiresAt).toISOString(),
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
  };

  const activeCount = consents?.filter(c => c.status === 'active' && !c.isExpired).length || 0;
  const expiredCount = consents?.filter(c => c.status === 'expired' || c.isExpired).length || 0;

  return (
    <div className="space-y-8">
      {/* View Detail Modal */}
      <AnimatePresence>
        {viewConsent && (
          <ConsentDetailModal
            consent={viewConsent}
            onClose={() => setViewConsent(null)}
            onRevoke={handleRevoke}
            isRevoking={revokingId === viewConsent.id}
          />
        )}
      </AnimatePresence>

      {/* Create Consent Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#FAF7F2] rounded-2xl p-8 max-w-lg w-full shadow-2xl relative border border-primary/20"
              onClick={e => e.stopPropagation()}
            >
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
      </AnimatePresence>

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
            {(consents || []).map((item: Consent, i) => {
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
                  className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/10 shadow-sm flex flex-col group hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex gap-4 items-center">
                      <div className="w-12 h-12 rounded-xl bg-surface-container overflow-hidden p-2 flex-shrink-0 flex items-center justify-center">
                        {item.institutionLogoUrl ? (
                          <img
                            src={item.institutionLogoUrl}
                            alt={item.institutionName}
                            className="w-full h-full object-contain"
                            onError={e => { e.currentTarget.style.display = 'none'; }}
                          />
                        ) : (
                          <span className="text-sm font-black text-primary">{item.institutionName.charAt(0)}</span>
                        )}
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

                  <div className="space-y-2.5 mb-6">
                    {/* Token preview */}
                    {!isExpiredOrRevoked && item.consentToken && (
                      <div className="bg-primary/5 rounded-lg border border-primary/20 p-2 flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-primary tracking-widest">Token Auth</span>
                        <div className="flex gap-2 items-center">
                          <code className="text-xs bg-white px-2 py-0.5 rounded text-on-surface font-mono">{item.consentToken.substring(0, 8)}…</code>
                          <button onClick={() => handleCopyToken(item.consentToken)} className="text-primary hover:text-on-surface transition-colors" title="Copy token">
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
                    {/* ← Working View button */}
                    <button
                      onClick={() => setViewConsent(item)}
                      className="flex-1 py-2 bg-background border border-outline-variant/10 rounded-lg text-xs font-bold text-secondary hover:bg-surface-container hover:text-primary transition-colors flex items-center justify-center gap-2"
                    >
                      <Eye className="w-3.5 h-3.5" /> View Details
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

          {/* Empty state */}
          {!loading && (!consents || consents.length === 0) && (
            <div className="col-span-2 flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Lock className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-bold text-on-surface text-lg mb-2">No Consents Yet</h3>
              <p className="text-secondary text-sm max-w-sm">You haven't authorized any institutions yet. Click "New Consent" to get started.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
