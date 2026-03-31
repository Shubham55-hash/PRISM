import React, { useState } from 'react';
import {
  Send, AlertCircle, CheckCircle2, Loader, Info, Copy, Eye, EyeOff,
  User, Mail, Phone, MapPin, FileText, Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  employer: string;
  designation: string;
}

interface FetchResult {
  success: boolean;
  appName?: string;
  data?: Record<string, any>;
  meta?: { fieldsCount: number; expiresAt: string };
  message?: string;
}

export function AutofillTestPage() {
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    employer: '',
    designation: '',
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<FetchResult | null>(null);
  const [error, setError] = useState('');
  const [copiedToken, setCopiedToken] = useState(false);

  const handleFetchAutofill = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResult(null);

    if (!token.trim()) {
      setError('Please paste your autofill token from PRISM dashboard');
      return;
    }

    setIsLoading(true);
    try {
      // Call the public autofill endpoint
      const response = await fetch(`/api/autofill/fetch/${token.trim()}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const data: FetchResult = await response.json();

      if (!response.ok) {
        setError(data.message || 'Failed to fetch autofill data');
        return;
      }

      // Populate form with fetched data
      if (data.data) {
        setFormData(prev => ({
          ...prev,
          ...(data.data as Partial<FormData>)
        }));
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Error fetching autofill data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCopyToken = () => {
    navigator.clipboard.writeText(token);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const handleClearForm = () => {
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      employer: '',
      designation: '',
    });
    setToken('');
    setResult(null);
    setError('');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <header>
        <h2 className="font-headline text-4xl font-extrabold text-on-surface tracking-tight">
          Autofill Test Form
        </h2>
        <p className="text-secondary font-medium mt-2">
          Try the autofill feature by pasting your token from the Smart Autofill page.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Token Section */}
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 p-6">
            <h3 className="font-bold text-on-surface uppercase tracking-widest text-xs mb-4 flex items-center gap-2">
              <Send className="w-4 h-4 text-primary" />
              Step 1: Paste Your Token
            </h3>
            <div className="space-y-3">
              <p className="text-xs text-secondary">
                Go to <span className="font-bold">Smart Autofill</span> → Create a token → Paste it below:
              </p>
              <div className="relative">
                <input
                  type={showToken ? 'text' : 'password'}
                  value={token}
                  onChange={e => setToken(e.target.value)}
                  placeholder="Paste your autofill token here (UUID format)"
                  className="w-full bg-white border border-outline-variant/30 rounded-lg px-4 py-3 text-sm font-mono focus:border-primary focus:ring-2 focus:ring-primary/30 outline-none pr-20"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-12 top-1/2 -translate-y-1/2 text-secondary hover:text-primary transition-colors"
                >
                  {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={handleCopyToken}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-primary transition-colors"
                  disabled={!token}
                >
                  {copiedToken ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Fetch Button */}
          <button
            onClick={handleFetchAutofill}
            disabled={isLoading || !token.trim()}
            className="w-full bg-primary text-on-primary py-3 rounded-lg font-bold uppercase tracking-widest text-xs shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Fetching your data…
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Fetch & Autofill
              </>
            )}
          </button>

          {/* Error Display */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-error/10 border border-error/30 rounded-lg p-4 flex gap-3"
              >
                <AlertCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-sm text-error">Error</p>
                  <p className="text-xs text-error/80">{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Success Display */}
          <AnimatePresence>
            {result?.success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-green-50 border border-green-200/50 rounded-lg p-4 flex gap-3"
              >
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-sm text-green-800">Success!</p>
                  <p className="text-xs text-green-700">
                    Fetched {result.meta?.fieldsCount || 0} field(s) from {result.appName || 'PRISM'}.
                  </p>
                  <p className="text-[10px] text-green-600 mt-1">
                    Token expires: {new Date(result.meta?.expiresAt || '').toLocaleDateString()}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form Fields */}
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 p-6">
            <h3 className="font-bold text-on-surface uppercase tracking-widest text-xs mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Step 2: Review & Edit Prefilled Data
            </h3>
            
            <form className="space-y-4">
              {/* Personal Info */}
              <div>
                <label className="block text-xs font-bold text-secondary uppercase tracking-widest mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={e => handleInputChange('fullName', e.target.value)}
                    placeholder="Enter full name"
                    className="w-full bg-white border border-outline-variant/30 rounded-lg pl-10 pr-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/30 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-secondary uppercase tracking-widest mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={e => handleInputChange('email', e.target.value)}
                      placeholder="Enter email"
                      className="w-full bg-white border border-outline-variant/30 rounded-lg pl-10 pr-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/30 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-secondary uppercase tracking-widest mb-2">
                    Phone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={e => handleInputChange('phone', e.target.value)}
                      placeholder="Enter phone"
                      className="w-full bg-white border border-outline-variant/30 rounded-lg pl-10 pr-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/30 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Address Info */}
              <div>
                <label className="block text-xs font-bold text-secondary uppercase tracking-widest mb-2">
                  Street Address
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
                  <input
                    type="text"
                    value={formData.address}
                    onChange={e => handleInputChange('address', e.target.value)}
                    placeholder="Enter street address"
                    className="w-full bg-white border border-outline-variant/30 rounded-lg pl-10 pr-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/30 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-secondary uppercase tracking-widest mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={e => handleInputChange('city', e.target.value)}
                    placeholder="City"
                    className="w-full bg-white border border-outline-variant/30 rounded-lg px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/30 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-secondary uppercase tracking-widest mb-2">
                    State
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={e => handleInputChange('state', e.target.value)}
                    placeholder="State"
                    className="w-full bg-white border border-outline-variant/30 rounded-lg px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/30 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-secondary uppercase tracking-widest mb-2">
                    Pincode
                  </label>
                  <input
                    type="text"
                    value={formData.pincode}
                    onChange={e => handleInputChange('pincode', e.target.value)}
                    placeholder="Pincode"
                    className="w-full bg-white border border-outline-variant/30 rounded-lg px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/30 outline-none"
                  />
                </div>
              </div>

              {/* Employment Info */}
              <div className="border-t border-outline-variant/10 pt-4 mt-4">
                <h4 className="text-xs font-bold text-secondary uppercase tracking-widest mb-3">Employment (Optional)</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-secondary uppercase tracking-widest mb-2">
                      Employer
                    </label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
                      <input
                        type="text"
                        value={formData.employer}
                        onChange={e => handleInputChange('employer', e.target.value)}
                        placeholder="Employer name"
                        className="w-full bg-white border border-outline-variant/30 rounded-lg pl-10 pr-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/30 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-secondary uppercase tracking-widest mb-2">
                      Designation
                    </label>
                    <input
                      type="text"
                      value={formData.designation}
                      onChange={e => handleInputChange('designation', e.target.value)}
                      placeholder="Job title"
                      className="w-full bg-white border border-outline-variant/30 rounded-lg px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/30 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="border-t border-outline-variant/10 pt-4 mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={handleClearForm}
                  className="flex-1 bg-secondary/10 text-secondary border border-secondary/20 py-3 rounded-lg font-bold uppercase tracking-widest text-xs hover:bg-secondary/20 transition-colors"
                >
                  Clear Form
                </button>
                <button
                  type="button"
                  className="flex-1 bg-primary text-on-primary py-3 rounded-lg font-bold uppercase tracking-widest text-xs shadow-md hover:shadow-lg transition-shadow"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Info Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* How It Works */}
          <div className="bg-primary/5 border border-primary/15 rounded-2xl p-5 space-y-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm text-on-surface">How This Works</h4>
                <p className="text-xs text-secondary mt-2 leading-relaxed">
                  This test form simulates an external app (like a loan portal or job application) requesting your data via autofill.
                </p>
              </div>
            </div>
          </div>

          {/* Steps */}
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 p-5 space-y-4">
            <h4 className="font-bold text-xs text-on-surface uppercase tracking-widest">Testing Steps</h4>
            
            <div className="space-y-3">
              {[
                { num: 1, text: 'Go to Smart Autofill page' },
                { num: 2, text: 'Click "New Token"' },
                { num: 3, text: 'Select fields to share' },
                { num: 4, text: 'Set expiry date & create' },
                { num: 5, text: 'Copy the token' },
                { num: 6, text: 'Paste it above and click "Fetch"' },
              ].map((step, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {step.num}
                  </div>
                  <p className="text-xs text-secondary pt-0.5">{step.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Results Display */}
          {result && (
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 p-5 space-y-3">
              <h4 className="font-bold text-xs text-on-surface uppercase tracking-widest">Fetched Fields</h4>
              <div className="space-y-2">
                {result.data && Object.entries(result.data).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between text-xs">
                    <span className="text-secondary font-medium">{key}</span>
                    <span className="text-on-surface font-bold truncate max-w-[120px]">
                      {String(value).substring(0, 20)}
                      {String(value).length > 20 ? '…' : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* API Reference */}
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 p-5 space-y-3">
            <h4 className="font-bold text-xs text-on-surface uppercase tracking-widest">API Call Being Made</h4>
            <pre className="bg-background rounded-lg p-3 text-[10px] font-mono text-secondary overflow-x-auto">
{`GET /api/autofill/fetch/<token>

Response:
{
  "success": true,
  "data": {
    "fullName": "John Doe",
    "email": "john@example.com",
    ...
  }
}`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
