import React, { useState } from 'react';
import { Shield, Fingerprint, Mail, Phone, MapPin, Calendar, Loader } from 'lucide-react';
import { motion } from 'motion/react';
import { useApi } from '../hooks/useApi';
import { identityApi } from '../api/identity';
import { Skeleton } from '../components/Skeleton';

export function IdentityPage() {
  const { data: identity, loading: idLoading, refetch: refetchIdentity } = useApi(() => identityApi.getIdentity(), []);
  const { data: prismId, loading: cardLoading } = useApi(() => identityApi.getPrismId(), []);

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<typeof identity>>({});
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await identityApi.updateIdentity(editForm);
      await refetchIdentity();
      setIsEditing(false);
    } catch (err: any) {
      alert('Failed to save: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const tierLabel = identity?.securityTier === 3 ? 'Tier 3 (Highest)' : identity?.securityTier === 2 ? 'Tier 2 (Standard)' : 'Tier 1 (Basic)';
  const cityState = [identity?.city, identity?.state].filter(Boolean).join(', ') || 'Not provided';
  const dob = identity?.dateOfBirth
    ? new Date(identity.dateOfBirth).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()
    : 'Not provided';

  return (
    <div className="space-y-8">
      <header>
        <h2 className="font-headline text-4xl font-extrabold text-on-surface tracking-tight">Digital Identity</h2>
        <p className="text-secondary font-medium mt-2">Manage your verified personal credentials and biometric data.</p>
      </header>

      <div className="grid grid-cols-12 gap-8">
        {/* ID Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="col-span-12 lg:col-span-5 bg-prism-sidebar rounded-2xl p-8 text-inverse-on-surface relative overflow-hidden shadow-2xl"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-prism-accent/20 rounded-bl-full" />
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex justify-between items-start mb-12">
              <div>
                <h3 className="text-xl font-bold font-headline tracking-widest">PRISM ID</h3>
                <p className="text-[10px] text-prism-accent uppercase tracking-[0.2em]">Verified Citizen</p>
              </div>
              <Shield className="w-8 h-8 text-prism-accent fill-current" />
            </div>

            <div className="flex gap-6 items-center mb-12">
              <div className="w-24 h-24 rounded-xl border-2 border-prism-accent/30 overflow-hidden">
                {cardLoading ? (
                  <Skeleton className="w-full h-full bg-white/10" />
                ) : (
                  <div className="w-full h-full bg-prism-accent/20 flex items-center justify-center">
                    <span className="text-3xl font-bold text-prism-accent/80">
                      {(prismId?.fullName || identity?.fullName || 'abc').charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1">
                {cardLoading ? (
                  <>
                    <Skeleton className="w-40 h-8 mb-2 bg-white/10" />
                    <Skeleton className="w-32 h-4 bg-white/10" />
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-headline font-bold">{prismId?.fullName || identity?.fullName || 'Loading…'}</p>
                    <p className="text-sm text-prism-accent/80">ID: {prismId?.prismId || identity?.prismId || 'PR-XXX-XXX-X'}</p>
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-auto">
              <div>
                <p className="text-[10px] uppercase text-prism-accent/60 tracking-wider">Issued On</p>
                {cardLoading ? <Skeleton className="w-16 h-4 bg-white/10" /> : <p className="text-sm font-medium">{prismId?.issuedOn || '—'}</p>}
              </div>
              <div>
                <p className="text-[10px] uppercase text-prism-accent/60 tracking-wider">Expires</p>
                {cardLoading ? <Skeleton className="w-16 h-4 bg-white/10" /> : <p className="text-sm font-medium">{prismId?.expiresOn || '—'}</p>}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Personal Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="col-span-12 lg:col-span-7 bg-surface-container-lowest rounded-2xl p-8 border border-outline-variant/10 shadow-sm flex flex-col"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-headline text-xl font-bold">Verified Attributes</h3>
            <button
              onClick={() => {
                if (!isEditing) {
                  setEditForm({ email: identity?.email, phone: identity?.phone, city: identity?.city, state: identity?.state, dateOfBirth: identity?.dateOfBirth });
                }
                setIsEditing(!isEditing);
              }}
              className="text-primary hover:text-primary/80 font-bold text-xs uppercase tracking-widest bg-primary/10 hover:bg-primary/20 transition-colors px-3 py-1.5 rounded-lg"
            >
              {isEditing ? 'Cancel Edit' : 'Edit Info'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
            {idLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-background border border-outline-variant/5">
                  <Skeleton className="w-10 h-10 rounded-lg" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="w-20 h-3" />
                    <Skeleton className="w-32 h-4" />
                  </div>
                </div>
              ))
            ) : isEditing ? (
              <div className="col-span-1 md:col-span-2 space-y-4">
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
                    <input type="date" value={editForm.dateOfBirth?.split('T')[0] || ''} onChange={e => setEditForm({ ...editForm, dateOfBirth: new Date(e.target.value).toISOString() })} className="w-full bg-background border border-outline-variant/30 rounded-lg p-3 text-sm focus:border-primary focus:ring-1 outline-none" />
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
              [
                { icon: Mail, label: 'Email Address', value: identity?.email || '—' },
                { icon: Phone, label: 'Phone Number', value: identity?.phone || '—' },
                { icon: MapPin, label: 'Primary Residence', value: cityState },
                { icon: Calendar, label: 'Date of Birth', value: dob },
                { icon: Fingerprint, label: 'Biometric Status', value: identity?.biometricStatus === 'active' ? 'Active / Encrypted' : identity?.biometricStatus || '—' },
                { icon: Shield, label: 'Security Level', value: tierLabel },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-background border border-outline-variant/5">
                  <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-secondary font-bold tracking-wider">{item.label}</p>
                    <p className="text-sm font-semibold text-on-surface">{item.value}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <button className="mt-8 w-full py-4 border-2 border-dashed border-outline-variant rounded-xl text-secondary font-bold text-sm hover:bg-surface-container transition-colors">
            + Link New Credential via DigiLocker
          </button>
        </motion.div>
      </div>
    </div>
  );
}
