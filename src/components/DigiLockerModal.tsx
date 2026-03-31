import React, { useState, useEffect } from 'react';
import { X, Download, Loader, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { initiateDigiLockerAuth, fetchDigiLockerDocuments, importSelectedDigiLockerDocs, DigiLockerDocument } from '../api/documents';

interface DigiLockerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (count: number) => void;
  isConnected: boolean;
}

export function DigiLockerModal({ isOpen, onClose, onSuccess, isConnected }: DigiLockerModalProps) {
  const [step, setStep] = useState<'auth' | 'select' | 'importing'>(isConnected ? 'select' : 'auth');
  const [documents, setDocuments] = useState<DigiLockerDocument[]>([]);
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [authUrl, setAuthUrl] = useState<string>('');

  // Fetch documents when modal opens and user is connected
  useEffect(() => {
    if (isOpen && isConnected && step === 'select') {
      fetchAvailableDocs();
    }
  }, [isOpen, isConnected, step]);

  const fetchAvailableDocs = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('prism_token');
      if (!token) {
        setError('Session expired. Please log in again.');
        setLoading(false);
        return;
      }

      const result = await fetchDigiLockerDocuments();
      if (result.success) {
        setDocuments(result.documents);
        if (result.documents.length === 0) {
          setError('No documents available in your DigiLocker account');
        }
      } else {
        setError('Failed to fetch documents from DigiLocker');
      }
    } catch (err: any) {
      const errorMsg = err?.message || 'Error fetching documents';
      if (errorMsg.includes('401') || errorMsg.includes('Invalid') || errorMsg.includes('token')) {
        setError('Session expired. Please log in again.');
      } else {
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAuthorize = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('prism_token');
      if (!token) {
        setError('Please log in first to connect DigiLocker');
        setLoading(false);
        return;
      }

      const result = await initiateDigiLockerAuth();
      setAuthUrl(result.authUrl);
      // Open DigiLocker in new window
      const popup = window.open(result.authUrl, 'DigiLockerAuth', 'width=500,height=600');
      
      if (!popup) {
        setError('Pop-up blocked. Please allow pop-ups and try again.');
        setLoading(false);
        return;
      }

      // Check if authorization completed
      const checkInterval = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkInterval);
          setLoading(false);
          // Try to fetch documents after returning from DigiLocker
          setTimeout(() => {
            setStep('select');
            fetchAvailableDocs();
          }, 1000);
        }
      }, 1000);
    } catch (err: any) {
      const errorMsg = err?.message || 'Authorization failed';
      console.error('[DigiLocker] Authorization error:', {
        message: errorMsg,
        status: err?.status,
        statusText: err?.statusText,
        fullError: err
      });
      if (errorMsg.includes('401') || errorMsg.includes('Invalid') || errorMsg.includes('token')) {
        setError('Session expired. Please log in again.');
      } else {
        setError(errorMsg);
      }
      setLoading(false);
    }
  };

  const toggleDocument = (docId: string) => {
    const newSelected = new Set(selectedDocs);
    if (newSelected.has(docId)) {
      newSelected.delete(docId);
    } else {
      newSelected.add(docId);
    }
    setSelectedDocs(newSelected);
  };

  const handleImport = async () => {
    if (selectedDocs.size === 0) {
      setError('Please select at least one document');
      return;
    }

    setStep('importing');
    setLoading(true);
    setError('');

    try {
      const result = await importSelectedDigiLockerDocs(Array.from(selectedDocs));
      if (result.success) {
        onSuccess(result.data.length);
        onClose();
      } else {
        setError('Import failed');
        setStep('select');
      }
    } catch (err: any) {
      setError(err.message || 'Import failed');
      setStep('select');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setDocuments([]);
    setSelectedDocs(new Set());
    fetchAvailableDocs();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl"
        >
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-900">DigiLocker Import</h2>
            <button
              onClick={onClose}
              className="rounded-lg p-2 hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Error Alert */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 flex items-start gap-3 rounded-lg bg-red-50 p-4 text-red-700"
            >
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium">Error</p>
                <p className="text-sm">{error}</p>
                {error.includes('Session expired') && (
                  <button
                    onClick={() => {
                      localStorage.removeItem('prism_token');
                      localStorage.removeItem('prism_refresh');
                      window.location.href = '/login';
                    }}
                    className="mt-2 inline-block text-sm font-semibold underline hover:no-underline"
                  >
                    Log In Again
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {/* Authorization Step */}
          {step === 'auth' && (
            <div className="space-y-4">
              <p className="text-gray-600">
                Connect your DigiLocker account to import official documents directly. You'll be asked to provide your credentials on the DigiLocker website.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800 text-sm italic">
                "Login to DigiLocker and download your documents, then upload here for secure import."
              </div>
              <button
                onClick={handleAuthorize}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-3 font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader className="h-5 w-5 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Download className="h-5 w-5" />
                    Connect DigiLocker
                  </>
                )}
              </button>
              <p className="text-xs text-gray-500">
                A popup window will open where you can log in with your credentials.
              </p>
            </div>
          )}

          {/* Document Selection Step */}
          {step === 'select' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-gray-600">
                  Select documents to import from your DigiLocker account:
                </p>
                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  className="text-sm text-amber-600 hover:text-amber-700 disabled:opacity-50"
                >
                  Refresh
                </button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader className="h-6 w-6 animate-spin text-amber-600" />
                </div>
              ) : documents.length === 0 ? (
                <div className="rounded-lg bg-gray-50 p-8 text-center">
                  <p className="text-gray-600">No documents available in your DigiLocker account</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {documents.map(doc => (
                    <label
                      key={doc.id}
                      className="flex items-start gap-3 rounded-lg border border-gray-200 p-4 hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedDocs.has(doc.id)}
                        onChange={() => toggleDocument(doc.id)}
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-amber-600"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900">{doc.name}</p>
                        <p className="text-sm text-gray-500">
                          {doc.issuer} {doc.issuedDate && `• Issued: ${new Date(doc.issuedDate).toLocaleDateString()}`}
                        </p>
                        {doc.expiryDate && (
                          <p className="text-xs text-gray-400">
                            Expires: {new Date(doc.expiryDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <span className="ml-2 inline-block rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                        {doc.type}
                      </span>
                    </label>
                  ))}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={onClose}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  disabled={loading || selectedDocs.size === 0}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2 font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Import {selectedDocs.size > 0 ? `(${selectedDocs.size})` : ''}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Importing Step */}
          {step === 'importing' && (
            <div className="space-y-4 text-center py-8">
              <Loader className="h-12 w-12 animate-spin text-amber-600 mx-auto" />
              <p className="text-gray-600 font-medium">Importing documents...</p>
              <p className="text-sm text-gray-500">This may take a few moments</p>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
