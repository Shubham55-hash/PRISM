import React from 'react';
import { User, Shield, Bell, Globe, Moon, Lock } from 'lucide-react';
import { motion } from 'motion/react';

export function SettingsPage() {
  return (
    <div className="space-y-8">
      <header>
        <h2 className="font-headline text-4xl font-extrabold text-on-surface tracking-tight">Settings</h2>
        <p className="text-secondary font-medium mt-2">Configure your PRISM experience and security protocols.</p>
      </header>

      <div className="grid grid-cols-12 gap-8">
        {/* Navigation */}
        <div className="col-span-12 lg:col-span-4 space-y-2">
          {[
            { icon: User, label: 'Profile Settings', active: true },
            { icon: Shield, label: 'Security & Privacy' },
            { icon: Bell, label: 'Notifications' },
            { icon: Globe, label: 'Language & Region' },
            { icon: Moon, label: 'Appearance' },
            { icon: Lock, label: 'Connected Devices' },
          ].map((item, i) => (
            <button 
              key={i}
              className={`w-full flex items-center gap-3 px-6 py-4 rounded-xl text-sm font-bold transition-all ${item.active ? 'bg-primary text-on-primary shadow-lg' : 'text-secondary hover:bg-surface-container'}`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="col-span-12 lg:col-span-8 bg-surface-container-lowest rounded-2xl p-8 border border-outline-variant/10 shadow-sm"
        >
          <h3 className="font-headline text-xl font-bold mb-8">Profile Settings</h3>
          
          <div className="space-y-8">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-surface-container overflow-hidden border-2 border-primary">
                <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200" alt="Avatar" className="w-full h-full object-cover" />
              </div>
              <div className="flex gap-3">
                <button className="px-4 py-2 bg-primary text-on-primary rounded-lg text-xs font-bold">Change Photo</button>
                <button className="px-4 py-2 bg-background border border-outline-variant/10 rounded-lg text-xs font-bold text-secondary">Remove</button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-secondary tracking-widest">Full Name</label>
                <input type="text" defaultValue="Arjun Varma" className="w-full bg-background border border-outline-variant/10 rounded-lg px-4 py-3 text-sm outline-none focus:ring-1 ring-primary/20" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-secondary tracking-widest">Display Name</label>
                <input type="text" defaultValue="Arjun" className="w-full bg-background border border-outline-variant/10 rounded-lg px-4 py-3 text-sm outline-none focus:ring-1 ring-primary/20" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-secondary tracking-widest">Email Address</label>
                <input type="email" defaultValue="arjun.v@prism.io" className="w-full bg-background border border-outline-variant/10 rounded-lg px-4 py-3 text-sm outline-none focus:ring-1 ring-primary/20" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-secondary tracking-widest">Phone Number</label>
                <input type="text" defaultValue="+91 98765 43210" className="w-full bg-background border border-outline-variant/10 rounded-lg px-4 py-3 text-sm outline-none focus:ring-1 ring-primary/20" />
              </div>
            </div>

            <div className="pt-8 border-t border-outline-variant/10 flex justify-end gap-4">
              <button className="px-6 py-3 text-sm font-bold text-secondary">Discard Changes</button>
              <button className="px-6 py-3 bg-primary text-on-primary rounded-lg text-sm font-bold shadow-md">Save Settings</button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
