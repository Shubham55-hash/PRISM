import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Eye, EyeOff, Loader, User, Mail, Phone, Lock, Calendar, MapPin } from 'lucide-react';
import { motion } from 'motion/react';

export function LoginPage() {
  const { login, register } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('arjun.v@prism.io');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('prism2024');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [dob, setDob] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegistering && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError('');
    try {
      if (isRegistering) {
        await register({ fullName, email, phone: phoneNumber, password, dateOfBirth: dob, city, state });
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      if (err.message === 'Network Error' || err.message === 'Failed to fetch' || err.message.includes('fetch')) {
        setError('Cannot connect to the server. Please ensure the backend is running.');
      } else {
        setError(err.message || 'Authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: '#F5F0E8' }}>
      {/* Background */}
      <div className="absolute inset-0 opacity-10 bg-center bg-cover pointer-events-none"
        style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=1920)' }} />
      <div className="absolute inset-0 bg-[#F5F0E8]/85 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-lg"
      >
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl shadow-[#705831]/10 border border-[#705831]/10 overflow-hidden">
          {/* Header */}
          <div className="bg-[#3D2E1A] p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#A0855A]/20 rounded-bl-full" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#A0855A]/20 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-[#A0855A] fill-current" />
                </div>
                <span className="text-xl font-bold font-headline tracking-widest">PRISM</span>
              </div>
              <h1 className="text-3xl font-headline font-extrabold leading-tight">
                {isRegistering ? 'Create your Digital Identity' : 'Welcome back'}
              </h1>
              <p className="text-[#A0855A]/80 text-sm mt-2">
                {isRegistering ? 'Secure, sovereign, and always yours.' : 'Sign in to your digital identity ecosystem'}
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegistering ? (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#705831]">Full Name</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-4 w-4 text-[#705831]/40" />
                      </div>
                      <input
                        type="text"
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        className="w-full bg-[#fef9f1] border border-[#705831]/10 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 ring-[#705831]/20 transition-all"
                        placeholder="Arjun Verma"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-[#705831]">Email Address</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail className="h-4 w-4 text-[#705831]/40" />
                        </div>
                        <input
                          type="email"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          className="w-full bg-[#fef9f1] border border-[#705831]/10 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 ring-[#705831]/20 transition-all"
                          placeholder="your@email.com"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-[#705831]">Phone Number</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Phone className="h-4 w-4 text-[#705831]/40" />
                        </div>
                        <input
                          type="tel"
                          value={phoneNumber}
                          onChange={e => setPhoneNumber(e.target.value)}
                          className="w-full bg-[#fef9f1] border border-[#705831]/10 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 ring-[#705831]/20 transition-all"
                          placeholder="9876543210"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-[#705831]">Password</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock className="h-4 w-4 text-[#705831]/40" />
                        </div>
                        <input
                          type={showPass ? 'text' : 'password'}
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          className="w-full bg-[#fef9f1] border border-[#705831]/10 rounded-xl pl-10 pr-10 py-2.5 text-sm outline-none focus:ring-2 ring-[#705831]/20 transition-all"
                          placeholder="••••••••"
                          autoComplete="new-password"
                          required
                        />
                        <button type="button" onClick={() => setShowPass(!showPass)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#705831]/50 hover:text-[#705831] transition-colors">
                          {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-[#705831]">Confirm Password</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock className="h-4 w-4 text-[#705831]/40" />
                        </div>
                        <input
                          type={showConfirmPass ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={e => setConfirmPassword(e.target.value)}
                          className="w-full bg-[#fef9f1] border border-[#705831]/10 rounded-xl pl-10 pr-10 py-2.5 text-sm outline-none focus:ring-2 ring-[#705831]/20 transition-all"
                          placeholder="Repeat password"
                          autoComplete="new-password"
                          required
                        />
                        <button type="button" onClick={() => setShowConfirmPass(!showConfirmPass)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#705831]/50 hover:text-[#705831] transition-colors">
                          {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-[#705831]">Date of Birth</label>
                      <div className="relative">
                        <input
                          type="date"
                          value={dob}
                          onChange={e => setDob(e.target.value)}
                          className="w-full bg-[#fef9f1] border border-[#705831]/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 ring-[#705831]/20 transition-all text-[#705831]"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-[#705831]">City</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <MapPin className="h-4 w-4 text-[#705831]/40" />
                        </div>
                        <input
                          type="text"
                          value={city}
                          onChange={e => setCity(e.target.value)}
                          className="w-full bg-[#fef9f1] border border-[#705831]/10 rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none focus:ring-2 ring-[#705831]/20 transition-all"
                          placeholder="Mumbai"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-[#705831]">State</label>
                      <select
                        value={state}
                        onChange={e => setState(e.target.value)}
                        className="w-full bg-[#fef9f1] border border-[#705831]/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 ring-[#705831]/20 transition-all text-[#705831]"
                        required
                      >
                        <option value="">Select...</option>
                        <option value="Maharashtra">Maharashtra</option>
                        <option value="Delhi">Delhi</option>
                        <option value="Karnataka">Karnataka</option>
                        <option value="Gujarat">Gujarat</option>
                        <option value="Tamil Nadu">Tamil Nadu</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#705831]">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full bg-[#fef9f1] border border-[#705831]/10 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 ring-[#705831]/20 transition-all"
                      placeholder="your@email.com"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#705831]">Password</label>
                    <div className="relative">
                      <input
                        type={showPass ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full bg-[#fef9f1] border border-[#705831]/10 rounded-xl px-4 py-3 pr-12 text-sm outline-none focus:ring-2 ring-[#705831]/20 transition-all"
                        placeholder="••••••••"
                        autoComplete="current-password"
                        required
                      />
                      <button type="button" onClick={() => setShowPass(!showPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#705831]/50 hover:text-[#705831] transition-colors">
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {error && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-xs text-red-600 font-medium">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#705831] text-white py-3.5 mt-2 rounded-xl font-bold text-sm tracking-wide hover:bg-[#5d4828] transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {loading ? <Loader className="w-4 h-4 animate-spin" /> : null}
                {isRegistering ? (
                  <>
                    <Shield className="w-4 h-4" /> Create PRISM Identity
                  </>
                ) : (
                  loading ? 'Processing…' : 'Sign In to PRISM'
                )}
              </button>
            </form>

            <div className="mt-5 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsRegistering(!isRegistering);
                  setError('');
                }}
                className="text-sm text-[#705831] font-medium hover:underline focus:outline-none"
              >
                {isRegistering ? 'Already have an account? Sign in' : "Don't have an account? Create one"}
              </button>
            </div>

            {!isRegistering && (
              <div className="mt-5 p-4 bg-[#fef9f1] rounded-xl border border-[#705831]/10">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#705831]/60 mb-2">Demo Credentials</p>
                <p className="text-xs text-[#705831]/80 font-medium">arjun.v@prism.io / prism2024</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

