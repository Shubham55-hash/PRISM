import React, { useState } from 'react';
import { AlertTriangle, Phone, Droplets, Heart, FileText, Lock, Copy, Loader, X } from 'lucide-react';
import { motion } from 'motion/react';
import { useApi } from '../hooks/useApi';
import { getCrisisProfile, activateCrisisMode, deactivateCrisisMode } from '../api/crisis';
import { Skeleton } from '../components/Skeleton';

export function CrisisPage() {
  const [crisisToken, setCrisisToken] = useState<{ token: string; expiresAt: string } | null>(null);
  const [activatingCrisis, setActivatingCrisis] = useState(false);
  const [deactivatingCrisis, setDeactivatingCrisis] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  const { data: profile, loading, refetch } = useApi(() => getCrisisProfile(), []);

  const handleActivateCrisis = async () => {
    setActivatingCrisis(true);
    try {
      const result = await activateCrisisMode();
      setCrisisToken(result);
    } catch (err: any) {
      alert('Failed to activate crisis mode: ' + err.message);
    } finally {
      setActivatingCrisis(false);
    }
  };

  const handleDeactivateCrisis = async () => {
    if (!crisisToken) return;
    setDeactivatingCrisis(true);
    try {
      await deactivateCrisisMode(crisisToken.token);
      setCrisisToken(null);
    } catch (err: any) {
      alert('Failed to deactivate: ' + err.message);
    } finally {
      setDeactivatingCrisis(false);
    }
  };

  const handleCopyToken = () => {
    if (crisisToken?.token) {
      navigator.clipboard.writeText(crisisToken.token);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  const timeRemaining = crisisToken
    ? Math.ceil((new Date(crisisToken.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60))
    : 0;

  return (
    <div className="space-y-8">
      {/* Crisis Header */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-2xl overflow-hidden h-48 flex items-center p-8 bg-gradient-to-br from-error/20 via-error/5 to-transparent border-2 border-error/30"
      >
        <div className="absolute top-4 right-4">
          <AlertTriangle className="w-12 h-12 text-error/40 animate-pulse" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-6 h-6 text-error" />
            <h1 className="text-3xl md:text-4xl font-extrabold text-error">Emergency Access Profile</h1>
          </div>
          <p className="text-on-surface/70 font-medium max-w-2xl">
            This profile contains critical medical and identification information accessible during emergencies. Activate to generate a time-limited access token for emergency responders.
          </p>
        </div>
      </motion.section>

      <div className="grid grid-cols-12 gap-8">
        {/* Left Column - Crisis Info */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="col-span-12 lg:col-span-7 space-y-6"
        >
          {/* Emergency Contact */}
          <div className="bg-surface-container-lowest rounded-2xl p-8 border border-outline-variant/10 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center">
                <Phone className="w-6 h-6 text-error" />
              </div>
              <h2 className="text-xl font-bold text-on-surface">Emergency Contact</h2>
            </div>

            {loading ? (
              <div className="space-y-3">
                <Skeleton className="w-32 h-4" />
                <Skeleton className="w-48 h-4" />
                <Skeleton className="w-40 h-4" />
              </div>
            ) : profile ? (
              <div className="space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-widest font-bold text-outline mb-1">Contact Name</p>
                  <p className="text-lg font-bold text-on-surface">{profile.emergencyContact.name}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest font-bold text-outline mb-1">Relationship</p>
                  <p className="text-lg font-bold text-on-surface">{profile.emergencyContact.relation}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest font-bold text-outline mb-1">Phone Number</p>
                  <p className="text-lg font-bold text-on-surface font-mono">{profile.emergencyContact.phone}</p>
                </div>
              </div>
            ) : null}
          </div>

          {/* Medical Information */}
          <div className="bg-surface-container-lowest rounded-2xl p-8 border border-outline-variant/10 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center">
                <Heart className="w-6 h-6 text-error" />
              </div>
              <h2 className="text-xl font-bold text-on-surface">Medical Profile</h2>
            </div>

            {loading ? (
              <div className="space-y-3">
                <Skeleton className="w-full h-4" />
                <Skeleton className="w-full h-4" />
                <Skeleton className="w-full h-4" />
              </div>
            ) : profile ? (
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs uppercase tracking-widest font-bold text-outline mb-2">Blood Group</p>
                  <div className="bg-error/10 rounded-lg p-4 flex items-center gap-2">
                    <Droplets className="w-6 h-6 text-error" />
                    <span className="text-2xl font-extrabold text-error">{profile.bloodGroup}</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest font-bold text-outline mb-2">Age</p>
                  <p className="text-2xl font-extrabold text-on-surface">{profile.age || '—'} years</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs uppercase tracking-widest font-bold text-outline mb-2">Allergies</p>
                  <p className="text-on-surface bg-error/5 rounded px-3 py-2 font-medium">{profile.allergies}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs uppercase tracking-widest font-bold text-outline mb-2">Medical Conditions</p>
                  <p className="text-on-surface bg-error/5 rounded px-3 py-2 font-medium">{profile.medicalConditions}</p>
                </div>
              </div>
            ) : null}
          </div>

          {/* Medical Documents */}
          {profile?.medicalDocuments && profile.medicalDocuments.length > 0 && (
            <div className="bg-surface-container-lowest rounded-2xl p-8 border border-outline-variant/10 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-on-surface">Medical Documents</h2>
              </div>

              <div className="space-y-3">
                {profile.medicalDocuments.map((doc: any, i: number) => (
                  <div key={i} className="bg-background rounded px-4 py-3 border border-outline-variant/10 flex items-center gap-3">
                    <FileText className="w-5 h-5 text-secondary flex-shrink-0" />
                    <span className="text-sm font-medium text-on-surface">{doc.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Right Column - Crisis Activation */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="col-span-12 lg:col-span-5"
        >
          {/* Credentials */}
          <div className="bg-surface-container-lowest rounded-2xl p-8 border border-outline-variant/10 shadow-sm mb-6">
            <h2 className="text-lg font-bold text-on-surface mb-4">Identifiers</h2>
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="w-full h-4" />
                <Skeleton className="w-full h-4" />
              </div>
            ) : profile ? (
              <div className="space-y-4">
                {profile.abhaId && (
                  <div>
                    <p className="text-xs uppercase tracking-widest font-bold text-outline mb-1">ABHA ID</p>
                    <p className="font-mono text-sm p-2 bg-background rounded border border-outline-variant/10">{profile.abhaId}</p>
                  </div>
                )}
                {profile.aadhaarHash && (
                  <div>
                    <p className="text-xs uppercase tracking-widest font-bold text-outline mb-1">Aadhaar</p>
                    <p className="font-mono text-sm p-2 bg-background rounded border border-outline-variant/10 truncate">{profile.aadhaarHash.substring(0, 20)}...</p>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {/* Crisis Mode Controls */}
          <div className="bg-gradient-to-br from-error/10 to-error/5 rounded-2xl p-8 border-2 border-error/20 shadow-sm">
            <h2 className="text-lg font-bold text-on-surface mb-6">Emergency Access Token</h2>

            {crisisToken ? (
              <>
                <div className="bg-background rounded-xl p-4 mb-6 border-2 border-error/20">
                  <p className="text-xs uppercase tracking-widest font-bold text-outline mb-2">Active Token (Valid for {timeRemaining}h)</p>
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-sm text-on-surface truncate flex-1">{crisisToken.token}</p>
                    <button
                      onClick={handleCopyToken}
                      className="p-2 hover:bg-surface-container rounded text-secondary hover:text-primary transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  {copiedToken && <p className="text-xs text-primary font-bold mt-2">✓ Copied!</p>}
                </div>

                <div className="bg-error/10 rounded p-4 mb-6 border border-error/20">
                  <p className="text-sm text-on-surface">
                    <strong>Expires:</strong> {new Date(crisisToken.expiresAt).toLocaleString()}
                  </p>
                </div>

                <button
                  onClick={handleDeactivateCrisis}
                  disabled={deactivatingCrisis}
                  className="w-full px-4 py-3 rounded-lg border-2 border-error/30 bg-error/5 text-error font-bold text-sm uppercase tracking-widest hover:bg-error/10 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {deactivatingCrisis ? <Loader className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                  Deactivate Access
                </button>
              </>
            ) : (
              <>
                <p className="text-sm text-secondary mb-6 leading-relaxed">
                  Generate a 24-hour time-limited token that emergency responders can use to access your critical medical information and identifiers.
                </p>
                <button
                  onClick={handleActivateCrisis}
                  disabled={activatingCrisis}
                  className="w-full px-4 py-3 rounded-lg bg-error text-on-primary font-bold text-sm uppercase tracking-widest hover:shadow-lg hover:translate-y-[-2px] disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  {activatingCrisis ? <Loader className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
                  {activatingCrisis ? 'Activating...' : 'Activate Emergency Access'}
                </button>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
