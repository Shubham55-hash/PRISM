import { Shield, Fingerprint, Mail, Phone, MapPin, Calendar, Loader } from 'lucide-react';
import { motion } from 'motion/react';
import { useApi } from '../hooks/useApi';
import { identityApi } from '../api/identity';
import { Skeleton } from '../components/Skeleton';

export function IdentityPage() {
  const { data: identity, loading: idLoading } = useApi(() => identityApi.getIdentity(), []);
  const { data: prismId, loading: cardLoading } = useApi(() => identityApi.getPrismId(), []);

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
                  <img
                    src={prismId?.profilePhotoUrl || identity?.profilePhotoUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200'}
                    alt="Avatar"
                    className="w-full h-full object-cover grayscale"
                    referrerPolicy="no-referrer"
                  />
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
          className="col-span-12 lg:col-span-7 bg-surface-container-lowest rounded-2xl p-8 border border-outline-variant/10 shadow-sm"
        >
          <h3 className="font-headline text-xl font-bold mb-6">Verified Attributes</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
