import React, { useState } from 'react';
import {
  Zap, Plus, Copy, XCircle, CheckCircle2, Clock, Eye, EyeOff,
  Loader, X, Shield, Database, ExternalLink, AlertTriangle, RefreshCw,
  User, Mail, Phone, Calendar, MapPin, CreditCard, Briefcase, GraduationCap,
  Heart, FileText, ChevronDown, ChevronUp, Info,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApi } from '../hooks/useApi';
import {
  getAutofillProfile, getAutofillTokens, createAutofillToken, revokeAutofillToken,
  AutofillToken, AutofillProfile,
} from '../api/autofill';
import { identityApi } from '../api/identity';
import { Skeleton } from '../components/Skeleton';

// ─── Field definitions ────────────────────────────────────────────────────────
const FIELD_GROUPS = [
  {
    group: 'Personal',
    icon: User,
    fields: [
      { value: 'fullName', label: 'Full Name' },
      { value: 'dateOfBirth', label: 'Date of Birth' },
      { value: 'gender', label: 'Gender' },
    ],
  },
  {
    group: 'Address',
    icon: MapPin,
    fields: [
      { value: 'address', label: 'Street Address' },
      { value: 'city', label: 'City' },
      { value: 'state', label: 'State' },
      { value: 'pincode', label: 'Pincode' },
    ],
  },
  {
    group: 'Identity',
    icon: CreditCard,
    fields: [
      { value: 'aadhaarNumber', label: 'Aadhaar Number' },
      { value: 'abhaId', label: 'ABHA ID' },
    ],
  },
  {
    group: 'Financial',
    icon: CreditCard,
    fields: [
      { value: 'bankAccountNumber', label: 'Bank Account No.' },
      { value: 'ifscCode', label: 'IFSC Code' },
      { value: 'annualIncome', label: 'Annual Income' },
    ],
  },
  {
    group: 'Education',
    icon: GraduationCap,
    fields: [
      { value: 'educationInstitution', label: 'Institution' },
      { value: 'degree', label: 'Degree' },
      { value: 'graduationYear', label: 'Graduation Year' },
    ],
  },
  {
    group: 'Employment',
    icon: Briefcase,
    fields: [
      { value: 'employer', label: 'Employer' },
      { value: 'designation', label: 'Designation' },
    ],
  },
  {
    group: 'Medical',
    icon: Heart,
    fields: [
      { value: 'bloodGroup', label: 'Blood Group' },
    ],
  },
];

const ALL_FIELDS = FIELD_GROUPS.flatMap(g => g.fields);

// ─── Field icon map ───────────────────────────────────────────────────────────
const FIELD_ICONS: Record<string, React.ElementType> = {
  fullName: User, email: Mail, phone: Phone, dateOfBirth: Calendar,
  gender: User, address: MapPin, city: MapPin, state: MapPin, pincode: MapPin,
  aadhaarNumber: Shield, panNumber: FileText, passportNumber: FileText, abhaId: Heart,
  bankAccountNumber: CreditCard, ifscCode: CreditCard, annualIncome: CreditCard,
  educationInstitution: GraduationCap, degree: GraduationCap, graduationYear: GraduationCap,
  employer: Briefcase, designation: Briefcase, bloodGroup: Heart,
  digilockerLinked: Shield, aadhaarVerified: Shield,
};

const FIELD_LABELS: Record<string, string> = Object.fromEntries(ALL_FIELDS.map(f => [f.value, f.label]));

// ─── ProfileCard ─────────────────────────────────────────────────────────────
function ProfileDataCard({ profile, onUpdate }: { profile: AutofillProfile; onUpdate: () => void }) {
  const [showSensitive, setShowSensitive] = useState(false);
  const [expanded, setExpanded] = useState(false);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<AutofillProfile>>({});
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await identityApi.updateIdentity({
        email: editForm.email,
        phone: editForm.phone,
        city: editForm.city,
        state: editForm.state,
        dateOfBirth: editForm.dateOfBirth ? new Date(editForm.dateOfBirth).toISOString() : undefined,
      });
      await onUpdate();
      setIsEditing(false);
    } catch (err: any) {
      alert('Failed to save: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const sensitiveFields = ['aadhaarNumber', 'panNumber', 'passportNumber', 'bankAccountNumber', 'ifscCode'];
  const entries = Object.entries(profile).filter(([, v]) => v !== undefined && v !== null && v !== false);
  const visible = expanded ? entries : entries.slice(0, 8);

  if (entries.length === 0) {
    return (
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 p-8 text-center">
        <Database className="w-10 h-10 text-secondary/30 mx-auto mb-3" />
        <p className="text-secondary font-medium text-sm">No data extracted yet.</p>
        <p className="text-secondary/60 text-xs mt-1">Upload and verify documents to populate your autofill profile.</p>
      </div>
    );
  }

  return (
    <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/10">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-primary" />
          <span className="font-bold text-sm text-on-surface uppercase tracking-widest">Available Data</span>
          <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">{entries.length} fields</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              if (!isEditing) setEditForm({ email: profile.email, phone: profile.phone, city: profile.city, state: profile.state, dateOfBirth: profile.dateOfBirth });
              setIsEditing(!isEditing);
            }}
            className="text-primary hover:text-primary/80 font-bold text-xs uppercase tracking-widest bg-primary/10 hover:bg-primary/20 transition-colors px-3 py-1.5 rounded-lg"
          >
            {isEditing ? 'Cancel' : 'Edit Info'}
          </button>
          <button
            onClick={() => setShowSensitive(s => !s)}
            className="flex items-center gap-1.5 text-xs font-bold text-secondary hover:text-primary transition-colors"
          >
            {showSensitive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {showSensitive ? 'Hide Sensitive' : 'Show Sensitive'}
          </button>
        </div>
      </div>

      <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-2">
        {isEditing ? (
          <div className="col-span-2 md:col-span-3 space-y-4 p-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase text-secondary font-bold tracking-wider mb-1">Email Address</label>
                <input type="email" value={editForm.email || ''} onChange={e => setEditForm({ ...editForm, email: e.target.value })} className="w-full bg-background border border-outline-variant/30 rounded-lg p-3 text-sm focus:border-primary focus:ring-1 outline-none" />
              </div>
              <div>
                <label className="block text-[10px] uppercase text-secondary font-bold tracking-wider mb-1">Phone Number</label>
                <input type="text" value={editForm.phone || ''} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} className="w-full bg-background border border-outline-variant/30 rounded-lg p-3 text-sm focus:border-primary focus:ring-1 outline-none" />
              </div>
              <div>
                <label className="block text-[10px] uppercase text-secondary font-bold tracking-wider mb-1">City</label>
                <input type="text" value={editForm.city || ''} onChange={e => setEditForm({ ...editForm, city: e.target.value })} className="w-full bg-background border border-outline-variant/30 rounded-lg p-3 text-sm focus:border-primary focus:ring-1 outline-none" />
              </div>
              <div>
                <label className="block text-[10px] uppercase text-secondary font-bold tracking-wider mb-1">State</label>
                <input type="text" value={editForm.state || ''} onChange={e => setEditForm({ ...editForm, state: e.target.value })} className="w-full bg-background border border-outline-variant/30 rounded-lg p-3 text-sm focus:border-primary focus:ring-1 outline-none" />
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] uppercase text-secondary font-bold tracking-wider mb-1">Date of Birth</label>
                <input type="date" value={editForm.dateOfBirth?.split('T')[0] || ''} onChange={e => setEditForm({ ...editForm, dateOfBirth: e.target.value })} className="w-full bg-background border border-outline-variant/30 rounded-lg p-3 text-sm focus:border-primary focus:ring-1 outline-none" />
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-primary text-on-primary font-bold tracking-widest text-xs uppercase py-3 rounded-lg flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 transition-all mt-4"
            >
              {saving ? <Loader className="w-4 h-4 animate-spin" /> : 'Save Changes'}
            </button>
          </div>
        ) : (
          visible.map(([key, value]) => {
            const Icon = FIELD_ICONS[key] || FileText;
            const isSensitive = sensitiveFields.includes(key);
            const display = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value);

            return (
              <div key={key} className="flex items-start gap-2 bg-background rounded-lg px-3 py-2.5 border border-outline-variant/10">
                <Icon className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-secondary uppercase tracking-wider truncate">
                    {FIELD_LABELS[key] || key}
                  </p>
                  <p className="text-xs font-medium text-on-surface mt-0.5 truncate">
                    {isSensitive && !showSensitive
                      ? '•'.repeat(Math.min(display.length, 8))
                      : display}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {!isEditing && entries.length > 8 && (
        <button
          onClick={() => setExpanded(e => !e)}
          className="w-full py-3 text-xs font-bold text-secondary hover:text-primary transition-colors border-t border-outline-variant/10 flex items-center justify-center gap-1"
        >
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {expanded ? 'Show less' : `Show ${entries.length - 8} more fields`}
        </button>
      )}
    </div>
  );
}

// ─── TokenCard ────────────────────────────────────────────────────────────────
function TokenCard({ token, onRevoke }: { token: AutofillToken; onRevoke: (id: string) => void }) {
  const [copied, setCopied] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [showToken, setShowToken] = useState(false);

  const isExpired = new Date(token.expiresAt) < new Date();
  const isActive = token.status === 'active' && !isExpired;
  const daysLeft = Math.ceil((new Date(token.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const fields = typeof token.allowedFields === 'string'
    ? token.allowedFields.split(',')
    : token.allowedFields || [];
  const appLabel = token.institutionName;
  const purposeLabel = token.purpose.replace('[AUTOFILL] ', '');

  const handleCopy = async () => {
    await navigator.clipboard.writeText(token.consentToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRevoke = async () => {
    if (!confirm(`Revoke autofill access for "${appLabel}"? The app will immediately lose access.`)) return;
    setRevoking(true);
    try { await onRevoke(token.id); } finally { setRevoking(false); }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 shadow-sm p-5 flex flex-col gap-4"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-on-surface text-sm">{appLabel}</h3>
            <p className="text-xs text-secondary">{purposeLabel}</p>
          </div>
        </div>
        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded flex-shrink-0 ${
          isActive ? 'bg-primary/10 text-primary' :
          token.status === 'revoked' ? 'bg-error/10 text-error' :
          'bg-outline-variant/20 text-outline'
        }`}>
          {token.status === 'revoked' ? 'Revoked' : isExpired ? 'Expired' : 'Active'}
        </span>
      </div>

      {/* Token display */}
      {isActive && (
        <div className="bg-primary/5 border border-primary/15 rounded-xl p-3 flex items-center gap-2">
          <code className="flex-1 text-xs font-mono text-on-surface truncate">
            {showToken ? token.consentToken : `${token.consentToken.substring(0, 12)}••••••••••••••••••••`}
          </code>
          <button onClick={() => setShowToken(s => !s)} className="text-secondary hover:text-primary transition-colors flex-shrink-0">
            {showToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
          <button onClick={handleCopy} className="text-secondary hover:text-primary transition-colors flex-shrink-0">
            {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      )}

      {/* Fields */}
      <div className="flex flex-wrap gap-1">
        {fields.slice(0, 5).map(f => (
          <span key={f} className="text-[10px] font-bold bg-surface-container px-2 py-0.5 rounded-full text-secondary uppercase tracking-wider">
            {FIELD_LABELS[f] || f}
          </span>
        ))}
        {fields.length > 5 && (
          <span className="text-[10px] font-bold bg-surface-container px-2 py-0.5 rounded-full text-secondary">
            +{fields.length - 5} more
          </span>
        )}
      </div>

      {/* Meta */}
      <div className="flex items-center gap-4 text-xs text-secondary">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {token.accessCount} use{token.accessCount !== 1 ? 's' : ''}
        </span>
        {isActive && daysLeft > 0 && (
          <span className={`flex items-center gap-1 ${daysLeft <= 7 ? 'text-amber-500 font-bold' : ''}`}>
            {daysLeft <= 7 && <AlertTriangle className="w-3 h-3" />}
            Expires in {daysLeft}d
          </span>
        )}
        {token.lastAccessedAt && (
          <span className="flex items-center gap-1">
            <RefreshCw className="w-3 h-3" />
            Last used {new Date(token.lastAccessedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </span>
        )}
      </div>

      {/* Actions */}
      {isActive && (
        <button
          onClick={handleRevoke}
          disabled={revoking}
          className="w-full py-2 bg-error/5 text-error border border-error/10 rounded-lg text-xs font-bold hover:bg-error/10 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {revoking ? <Loader className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
          {revoking ? 'Revoking…' : 'Revoke Access'}
        </button>
      )}
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function AutofillPage() {
  const { data: profile, loading: profileLoading, refetch: refetchProfile } = useApi(() => getAutofillProfile(), []);
  const { data: tokens, loading: tokensLoading, refetch } = useApi(() => getAutofillTokens(), []);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [appName, setAppName] = useState('');
  const [purpose, setPurpose] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [newToken, setNewToken] = useState<string | null>(null);
  const [copiedNew, setCopiedNew] = useState(false);

  const toggleField = (val: string) =>
    setSelectedFields(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);

  const selectGroup = (fields: string[]) => {
    const vals = fields.map(f => f);
    const allSelected = vals.every(v => selectedFields.includes(v));
    if (allSelected) {
      setSelectedFields(prev => prev.filter(v => !vals.includes(v)));
    } else {
      setSelectedFields(prev => [...new Set([...prev, ...vals])]);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    if (!appName || !purpose || !expiresAt || selectedFields.length === 0) {
      setCreateError('Fill all fields and select at least one data field.');
      return;
    }
    setIsCreating(true);
    try {
      const result = await createAutofillToken({ appName, purpose, allowedFields: selectedFields, expiresAt: new Date(expiresAt).toISOString() });
      setNewToken(result.consentToken);
      setAppName(''); setPurpose(''); setExpiresAt(''); setSelectedFields([]);
      refetch();
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create token');
    } finally {
      setIsCreating(false);
    }
  };

  const handleRevoke = async (id: string) => {
    await revokeAutofillToken(id);
    refetch();
  };

  const handleCopyNew = async () => {
    if (!newToken) return;
    await navigator.clipboard.writeText(newToken);
    setCopiedNew(true);
    setTimeout(() => setCopiedNew(false), 2000);
  };

  const activeTokens = tokens?.filter(t => t.status === 'active' && new Date(t.expiresAt) > new Date()) || [];
  const inactiveTokens = tokens?.filter(t => t.status !== 'active' || new Date(t.expiresAt) <= new Date()) || [];

  return (
    <div className="space-y-8">
      {/* Success Modal — show new token */}
      <AnimatePresence>
        {newToken && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#FAF7F2] rounded-2xl p-8 max-w-md w-full shadow-2xl border border-primary/20"
            >
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold font-headline text-on-surface">Token Created!</h3>
                  <p className="text-secondary text-sm mt-1">Share this token with your external app. It will not be shown again.</p>
                </div>
                <div className="w-full bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center gap-3">
                  <code className="flex-1 text-xs font-mono text-on-surface break-all">{newToken}</code>
                  <button onClick={handleCopyNew} className="flex-shrink-0 text-primary hover:text-on-surface transition-colors">
                    {copiedNew ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700 font-medium">
                  ⚠️ Copy this token now. For security, it won't be fully visible again.
                </div>
                <button
                  onClick={() => { setNewToken(null); setIsModalOpen(false); }}
                  className="w-full bg-primary text-on-primary py-3 rounded-lg font-bold uppercase tracking-widest text-xs"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create Token Modal */}
      <AnimatePresence>
        {isModalOpen && !newToken && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#FAF7F2] rounded-2xl p-8 max-w-xl w-full shadow-2xl relative border border-primary/20 max-h-[90vh] overflow-y-auto"
            >
              <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-secondary hover:text-primary">
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-2xl font-bold font-headline text-on-surface mb-1">New Autofill Token</h3>
              <p className="text-secondary text-sm mb-6">Generate a secure token so an external app or form can fetch your PRISM data with one click.</p>

              <form onSubmit={handleCreate} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-secondary uppercase tracking-widest mb-1.5">App / Website Name</label>
                  <input
                    required type="text" value={appName} onChange={e => setAppName(e.target.value)}
                    placeholder="e.g. LIC Portal, HDFC Loan Form, College Application"
                    className="w-full bg-white border border-outline-variant/30 rounded-lg p-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-secondary uppercase tracking-widest mb-1.5">Purpose</label>
                  <input
                    required type="text" value={purpose} onChange={e => setPurpose(e.target.value)}
                    placeholder="e.g. KYC for home loan application"
                    className="w-full bg-white border border-outline-variant/30 rounded-lg p-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-secondary uppercase tracking-widest mb-2">
                    Fields to Share
                    <span className="ml-2 text-primary normal-case font-medium">{selectedFields.length} selected</span>
                  </label>
                  <div className="space-y-3">
                    {FIELD_GROUPS.map(group => {
                      const groupVals = group.fields.map(f => f.value);
                      const allSelected = groupVals.every(v => selectedFields.includes(v));
                      const someSelected = groupVals.some(v => selectedFields.includes(v));
                      const Icon = group.icon;
                      return (
                        <div key={group.group} className="border border-outline-variant/20 rounded-xl overflow-hidden">
                          <button
                            type="button"
                            onClick={() => selectGroup(groupVals)}
                            className={`w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-widest transition-colors ${
                              allSelected ? 'bg-primary text-on-primary' :
                              someSelected ? 'bg-primary/10 text-primary' :
                              'bg-surface-container text-secondary hover:bg-surface-container/80'
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            {group.group}
                            {someSelected && !allSelected && <span className="ml-auto text-[10px] opacity-70">partial</span>}
                          </button>
                          <div className="flex flex-wrap gap-2 p-3">
                            {group.fields.map(f => (
                              <button
                                key={f.value}
                                type="button"
                                onClick={() => toggleField(f.value)}
                                className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all border ${
                                  selectedFields.includes(f.value)
                                    ? 'bg-primary border-primary text-on-primary'
                                    : 'bg-white border-outline-variant/30 text-secondary hover:border-primary/50'
                                }`}
                              >
                                {f.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-secondary uppercase tracking-widest mb-1.5">Token Expiry</label>
                  <input
                    required type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full bg-white border border-outline-variant/30 rounded-lg p-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>

                {createError && <p className="text-xs font-bold text-error bg-error/10 px-3 py-2 rounded-lg">{createError}</p>}

                <button
                  disabled={isCreating} type="submit"
                  className="w-full bg-primary text-on-primary py-3 rounded-lg font-bold uppercase tracking-widest text-xs shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                >
                  {isCreating ? <Loader className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  {isCreating ? 'Generating…' : 'Generate Autofill Token'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Page Header */}
      <header className="flex justify-between items-end">
        <div>
          <h2 className="font-headline text-4xl font-extrabold text-on-surface tracking-tight">Smart Autofill</h2>
          <p className="text-secondary font-medium mt-2">
            Let external apps and forms pull your verified data from PRISM — with your consent.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-on-primary px-6 py-3 rounded-md font-bold text-xs uppercase tracking-widest shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> New Token
        </button>
      </header>

      {/* How it works banner */}
      <div className="bg-primary/5 border border-primary/15 rounded-2xl p-5 flex gap-4 items-start">
        <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-on-surface mb-1">How Smart Autofill Works</p>
          <p className="text-xs text-secondary leading-relaxed">
            Generate a secure token and paste it into any compatible app or form. The app calls PRISM's API with your token and receives only the fields you've authorised — no manual typing, no re-uploading documents. You can revoke access instantly at any time.
          </p>
          <div className="flex items-center gap-6 mt-3">
            {[
              { icon: Shield, label: 'You control which fields are shared' },
              { icon: Clock, label: 'Tokens auto-expire' },
              { icon: ExternalLink, label: 'Works with any app that supports PRISM' },
            ].map(({ icon: Icon, label }) => (
              <span key={label} className="flex items-center gap-1.5 text-xs font-bold text-primary">
                <Icon className="w-3.5 h-3.5" /> {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Your Data Profile */}
      <section>
        <h3 className="font-bold text-on-surface uppercase tracking-widest text-xs mb-3 flex items-center gap-2">
          <Database className="w-4 h-4 text-primary" /> Your Autofill Data Vault
        </h3>
        {profileLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
          </div>
        ) : (
          <ProfileDataCard profile={profile || {}} onUpdate={refetchProfile} />
        )}
      </section>

      {/* Active Tokens */}
      <section>
        <h3 className="font-bold text-on-surface uppercase tracking-widest text-xs mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" /> Active Tokens
          <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">{activeTokens.length}</span>
        </h3>
        {tokensLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map(i => <Skeleton key={i} className="h-48 rounded-2xl" />)}
          </div>
        ) : activeTokens.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 p-10 text-center">
            <Zap className="w-10 h-10 text-secondary/20 mx-auto mb-3" />
            <p className="text-secondary font-medium text-sm">No active autofill tokens.</p>
            <p className="text-secondary/60 text-xs mt-1">Create a token to let an external app fetch your data.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeTokens.map(t => <TokenCard key={t.id} token={t} onRevoke={handleRevoke} />)}
          </div>
        )}
      </section>

      {/* Inactive Tokens */}
      {inactiveTokens.length > 0 && (
        <section>
          <h3 className="font-bold text-secondary uppercase tracking-widest text-xs mb-3 flex items-center gap-2">
            <XCircle className="w-4 h-4" /> Revoked / Expired
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {inactiveTokens.map(t => <TokenCard key={t.id} token={t} onRevoke={handleRevoke} />)}
          </div>
        </section>
      )}


    </div>
  );
}
