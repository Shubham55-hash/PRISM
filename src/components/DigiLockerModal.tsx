import React, { useState } from 'react';
import { X, ExternalLink, Info, CheckCircle2, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { initiateDigiLockerAuth } from '../api/documents';

interface DigiLockerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DigiLockerModal({ isOpen, onClose }: DigiLockerModalProps) {
  const [step, setStep] = useState<'info' | 'redirected'>('info');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleOpenPortal = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await initiateDigiLockerAuth();
      // Open DigiLocker in a new tab
      window.open(result.authUrl, '_blank');
      setStep('redirected');
    } catch (err: any) {
      setError(err?.message || 'Failed to get portal link');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          exit={{ opacity: 0, translateY: 20 }}
          className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-2xl relative overflow-hidden"
        >
          {/* Decorative background element */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-amber-50" />
          
          <div className="relative z-10">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                  <ExternalLink size={24} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Official Portal Access</h2>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {step === 'info' ? (
              <div className="space-y-6">
                <div className="rounded-xl bg-amber-50 p-5 border border-amber-100">
                  <div className="flex gap-3">
                    <Info className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-amber-900 font-medium">
                      Privacy-First Document Import
                    </p>
                  </div>
                  <p className="mt-2 text-sm text-amber-800 leading-relaxed">
                    PRISM prioritizes your privacy. Instead of linking accounts, we guide you to 
                    manually download your documents from the official portal and upload them 
                    locally to your vault.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">How it works:</h3>
                    <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded">Offline Flow</span>
                  </div>
                  <ol className="space-y-3 text-sm text-gray-600">
                    <li className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">1</span>
                      <span>Open the official DigiLocker portal.</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">2</span>
                      <span>Download your documents as PDF or Image.</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">3</span>
                      <span>Upload them here for AI extraction.</span>
                    </li>
                  </ol>
                </div>

                {error && (
                  <p className="text-sm font-medium text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
                    {error}
                  </p>
                )}

                <button
                  onClick={handleOpenPortal}
                  disabled={loading}
                  className="w-full group flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-6 py-4 font-bold text-white shadow-lg shadow-amber-200 transition-all hover:bg-amber-700 hover:shadow-amber-300 disabled:opacity-50 active:scale-[0.98]"
                >
                  {loading ? (
                    <>
                      <Loader className="h-5 w-5 animate-spin mr-2" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      Open DigiLocker Portal
                      <ExternalLink className="h-5 w-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-8 py-4 text-center">
                <div className="relative mx-auto h-24 w-24">
                  <div className="absolute inset-0 animate-ping rounded-full bg-green-100 opacity-75" />
                  <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-green-100 text-green-600">
                    <CheckCircle2 size={48} />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700 uppercase tracking-widest">
                    Portal Active / Connected
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Success!</h3>
                  <p className="text-gray-600 max-w-xs mx-auto">
                    You are now connected to the official portal in the other tab.
                  </p>
                </div>
                
                <div className="rounded-2xl border-2 border-dashed border-amber-200 bg-amber-50/50 p-6 flex flex-col items-center">
                  <div className="p-3 rounded-full bg-amber-100 text-amber-600 mb-3">
                    <Upload size={24} />
                  </div>
                  <p className="text-sm font-bold text-amber-900">
                    Ready for your documents
                  </p>
                  <p className="text-xs text-amber-600 mt-1">
                    Once you've downloaded your files, close this window and use the "Upload" button.
                  </p>
                </div>

                <button
                  onClick={onClose}
                  className="w-full rounded-xl bg-gray-900 px-6 py-4 font-bold text-white transition-all hover:bg-black active:scale-[0.98] shadow-lg shadow-gray-200"
                >
                  Return to Vault
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

const Loader = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
  </svg>
);
