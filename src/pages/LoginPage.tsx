import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Eye, EyeOff, Loader } from 'lucide-react';
import { motion } from 'motion/react';

export function LoginPage() {
  const { login, register } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('arjun.v@prism.io');
  const [password, setPassword] = useState('prism2024');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isRegistering) {
        await register({ fullName, email, password });
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
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
        className="relative z-10 w-full max-w-md"
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
                {isRegistering ? 'Create Account' : 'Welcome back'}
              </h1>
              <p className="text-[#A0855A]/80 text-sm mt-2">
                {isRegistering ? 'Join the digital identity ecosystem' : 'Sign in to your digital identity ecosystem'}
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {isRegistering && (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#705831]">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="w-full bg-[#fef9f1] border border-[#705831]/10 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 ring-[#705831]/20 transition-all"
                    placeholder="Arjun V"
                    required={isRegistering}
                  />
                </div>
              )}

              <div className="space-y-2">
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

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#705831]">Password</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-[#fef9f1] border border-[#705831]/10 rounded-xl px-4 py-3 pr-12 text-sm outline-none focus:ring-2 ring-[#705831]/20 transition-all"
                    placeholder="••••••••"
                    required
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#705831]/50 hover:text-[#705831] transition-colors">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-xs text-red-600 font-medium">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#705831] text-white py-4 rounded-xl font-bold text-sm tracking-wide hover:bg-[#5d4828] transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {loading ? <Loader className="w-4 h-4 animate-spin" /> : null}
                {loading ? 'Processing…' : (isRegistering ? 'Create Account' : 'Sign In to PRISM')}
              </button>
            </form>

            <div className="mt-6 text-center">
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
              <div className="mt-6 p-4 bg-[#fef9f1] rounded-xl border border-[#705831]/10">
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
