import React from 'react';
import { Shield, Fingerprint, Mail, Phone, MapPin, Calendar } from 'lucide-react';
import { motion } from 'motion/react';

export function IdentityPage() {
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
                <img 
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200" 
                  alt="Avatar" 
                  className="w-full h-full object-cover grayscale"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <p className="text-2xl font-headline font-bold">Arjun Varma</p>
                <p className="text-sm text-prism-accent/80">ID: PR-992-001-X</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-auto">
              <div>
                <p className="text-[10px] uppercase text-prism-accent/60 tracking-wider">Issued On</p>
                <p className="text-sm font-medium">12 MAR 2024</p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-prism-accent/60 tracking-wider">Expires</p>
                <p className="text-sm font-medium">11 MAR 2029</p>
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
            {[
              { icon: Mail, label: 'Email Address', value: 'arjun.v@prism.io' },
              { icon: Phone, label: 'Phone Number', value: '+91 98765 43210' },
              { icon: MapPin, label: 'Primary Residence', value: 'Bandra West, Mumbai, MH' },
              { icon: Calendar, label: 'Date of Birth', value: '17 OCT 1992' },
              { icon: Fingerprint, label: 'Biometric Status', value: 'Active / Encrypted' },
              { icon: Shield, label: 'Security Level', value: 'Tier 3 (Highest)' },
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
            ))}
          </div>
          
          <button className="mt-8 w-full py-4 border-2 border-dashed border-outline-variant rounded-xl text-secondary font-bold text-sm hover:bg-surface-container transition-colors">
            + Add New Verified Attribute
          </button>
        </motion.div>
      </div>
    </div>
  );
}
