import React, { useState, useEffect } from 'react';
import { User, Shield, Bell, Globe, Moon, Lock, Loader } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { useApi, useApiMutation } from '../hooks/useApi';
import { identityApi, Identity } from '../api/identity';

export function SettingsPage() {
  const { logout } = useAuth();
  const { data: identity, loading } = useApi(() => identityApi.getIdentity(), []);
  const { mutate: updateProfile, loading: updating } = useApiMutation((data: Partial<Identity>) => identityApi.updateIdentity(data));
  const [activeTab, setActiveTab] = useState('profile');
  
  const [formData, setFormData] = useState({
    fullName: '',
    displayName: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    if (identity) {
      setFormData({
        fullName: identity.fullName || '',
        displayName: identity.displayName || '',
        email: identity.email || '',
        phone: identity.phone || '',
      });
    }
  }, [identity]);

  const handleSave = async () => {
    try {
      await updateProfile(formData);
      alert('Settings saved successfully');
    } catch (e: any) {
      alert(e.message || 'Failed to save');
    }
  };

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
            { id: 'profile', icon: User, label: 'Profile Settings' },
            { id: 'security', icon: Shield, label: 'Security & Privacy' },
            { id: 'notifications', icon: Bell, label: 'Notifications' },
            { id: 'region', icon: Globe, label: 'Language & Region' },
            { id: 'appearance', icon: Moon, label: 'Appearance' },
            { id: 'devices', icon: Lock, label: 'Connected Devices' },
          ].map((item) => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-6 py-4 rounded-xl text-sm font-bold transition-all ${activeTab === item.id ? 'bg-primary text-on-primary shadow-lg' : 'text-secondary hover:bg-surface-container'}`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
          
          <button 
            onClick={logout}
            className="w-full flex items-center gap-3 px-6 py-4 rounded-xl text-sm font-bold text-error border border-error/20 hover:bg-error/10 transition-all mt-8"
          >
            Log Out of PRISM
          </button>
        </div>

        {/* Content */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          key={activeTab}
          className="col-span-12 lg:col-span-8 bg-surface-container-lowest rounded-2xl p-8 border border-outline-variant/10 shadow-sm"
        >
          {activeTab === 'profile' && (
            <>
              <h3 className="font-headline text-xl font-bold mb-8">Profile Settings</h3>
              
              {loading ? (
                <div className="h-48 flex items-center justify-center">
                  <Loader className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-full bg-surface-container overflow-hidden border-2 border-primary">
                      <img src={identity?.profilePhotoUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200"} alt="Avatar" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex gap-3">
                      <button className="px-4 py-2 bg-primary text-on-primary rounded-lg text-xs font-bold">Change Photo</button>
                      <button className="px-4 py-2 bg-background border border-outline-variant/10 rounded-lg text-xs font-bold text-secondary">Remove</button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-secondary tracking-widest">Full Name</label>
                      <input 
                        type="text" 
                        value={formData.fullName} 
                        onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                        className="w-full bg-background border border-outline-variant/10 rounded-lg px-4 py-3 text-sm outline-none focus:ring-1 ring-primary/20" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-secondary tracking-widest">Display Name</label>
                      <input 
                        type="text" 
                        value={formData.displayName} 
                        onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                        className="w-full bg-background border border-outline-variant/10 rounded-lg px-4 py-3 text-sm outline-none focus:ring-1 ring-primary/20" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-secondary tracking-widest">Email Address</label>
                      <input 
                        type="email" 
                        value={formData.email} 
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full bg-background border border-outline-variant/10 rounded-lg px-4 py-3 text-sm outline-none focus:ring-1 ring-primary/20" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-secondary tracking-widest">Phone Number</label>
                      <input 
                        type="text" 
                        value={formData.phone} 
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="w-full bg-background border border-outline-variant/10 rounded-lg px-4 py-3 text-sm outline-none focus:ring-1 ring-primary/20" 
                      />
                    </div>
                  </div>

                  <div className="pt-8 border-t border-outline-variant/10 flex justify-end gap-4">
                    <button className="px-6 py-3 text-sm font-bold text-secondary">Discard Changes</button>
                    <button 
                      onClick={handleSave}
                      disabled={updating}
                      className="px-6 py-3 bg-primary text-on-primary rounded-lg text-sm font-bold shadow-md flex items-center justify-center gap-2 min-w-[140px]"
                    >
                      {updating ? <Loader className="w-4 h-4 animate-spin" /> : 'Save Settings'}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
          {activeTab !== 'profile' && (
            <div className="h-64 flex flex-col items-center justify-center text-secondary">
              <Shield className="w-12 h-12 mb-4 text-outline" />
              <h3 className="font-bold text-lg">Under Construction</h3>
              <p className="text-sm">This section is coming soon.</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
