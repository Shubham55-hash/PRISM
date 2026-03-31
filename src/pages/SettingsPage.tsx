import React, { useState, useEffect } from 'react';
import { User, Shield, Bell, Globe, Moon, Lock, AlertTriangle, Key, Smartphone, Loader } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { useApi, useApiMutation } from '../hooks/useApi';
import { identityApi, Identity } from '../api/identity';
import { Skeleton } from '../components/Skeleton';

export function SettingsPage() {
  const { logout } = useAuth();
  const { data: identity, loading } = useApi(() => identityApi.getIdentity(), []);
  
  const { mutate: updateProfile, loading: updating } = useApiMutation((data: Partial<Identity>) => identityApi.updateIdentity(data));
  const { mutate: updatePassword, loading: passwordUpdating } = useApiMutation((data: any) => identityApi.changePassword(data));
  const { mutate: deleteAccount } = useApiMutation(() => identityApi.deleteAccount());

  const [activeTab, setActiveTab] = useState('profile');

  // Profile Form
  const [formData, setFormData] = useState({
    fullName: '',
    displayName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    city: '',
    state: '',
    bloodGroup: '',
    allergies: '',
    medicalConditions: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: '',
  });

  // Security Form
  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
  });

  useEffect(() => {
    if (identity) {
      setFormData({
        fullName: identity.fullName || '',
        displayName: identity.displayName || '',
        email: identity.email || '',
        phone: identity.phone || '',
        dateOfBirth: identity.dateOfBirth?.split('T')[0] || '',
        city: identity.city || '',
        state: identity.state || '',
        bloodGroup: identity.bloodGroup || '',
        allergies: identity.allergies || '',
        medicalConditions: identity.medicalConditions || '',
        emergencyContactName: identity.emergencyContactName || '',
        emergencyContactPhone: identity.emergencyContactPhone || '',
        emergencyContactRelation: identity.emergencyContactRelation || '',
      });
    }
  }, [identity]);

  const handleSaveProfile = async () => {
    try {
      await updateProfile(formData);
      alert('Profile updated successfully');
    } catch (e: any) {
      alert(e.message || 'Failed to save profile');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!securityData.currentPassword || !securityData.newPassword) return;
    try {
      await updatePassword(securityData);
      alert('Password updated safely');
      setSecurityData({ currentPassword: '', newPassword: '' });
    } catch (e: any) {
      alert(e.message || 'Password change failed');
    }
  };

  const handleDeleteAccount = async () => {
    const confirmation = window.prompt('Type "DELETE" to permanently remove your PRISM account and all data.');
    if (confirmation === 'DELETE') {
      try {
        await deleteAccount({});
        logout();
      } catch (e: any) {
        alert(e.message || 'Account deletion failed');
      }
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h2 className="font-headline text-4xl font-extrabold text-on-surface tracking-tight">Settings</h2>
        <p className="text-secondary font-medium mt-2">Configure your PRISM experience and security protocols.</p>
      </header>

      <div className="grid grid-cols-12 gap-8">
        {/* Navigation Sidebar */}
        <div className="col-span-12 lg:col-span-4 space-y-2">
          {[
            { id: 'profile', icon: User, label: 'Profile Settings' },
            { id: 'security', icon: Shield, label: 'Security & Privacy' },
            { id: 'notifications', icon: Bell, label: 'Notifications' },
            { id: 'region', icon: Globe, label: 'Language & Region' },
            { id: 'emergency', icon: AlertTriangle, label: 'Emergency Profile' },
            { id: 'appearance', icon: Moon, label: 'Appearance' },
            { id: 'devices', icon: Lock, label: 'Connected Devices' },
          ].map((item) => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-6 py-4 rounded-xl text-sm font-bold transition-all ${
                activeTab === item.id ? 'bg-primary text-on-primary shadow-lg' : 'text-secondary hover:bg-surface-container'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
          
          <button 
            onClick={logout}
            className="w-full flex items-center gap-3 px-6 py-4 rounded-xl text-sm font-bold text-[#b44131] border border-[#b44131]/20 hover:bg-[#b44131]/10 transition-all mt-8"
          >
            Log Out of PRISM
          </button>
        </div>

        {/* Content Box */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          key={activeTab}
          className="col-span-12 lg:col-span-8 bg-surface-container-lowest rounded-2xl p-8 border border-outline-variant/10 shadow-sm"
        >
          {loading ? (
            <div className="space-y-8">
              <Skeleton className="w-48 h-8" />
              <div className="flex items-center gap-6">
                <Skeleton className="w-20 h-20 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="w-32 h-4" />
                  <Skeleton className="w-24 h-4" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="w-20 h-3" />
                    <Skeleton className="w-full h-12" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* === PROFILE TAB === */}
              {activeTab === 'profile' && (
                <div className="space-y-8">
                  <h3 className="font-headline text-xl font-bold mb-8">Personal Information</h3>
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-full bg-surface-container overflow-hidden border-2 border-primary">
                      <img src={identity?.profilePhotoUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200"} alt="Avatar" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex gap-3">
                      <button className="px-4 py-2 bg-primary text-on-primary rounded-lg text-xs font-bold shadow-sm">Change Photo</button>
                      <button className="px-4 py-2 bg-background border border-outline-variant/10 rounded-lg text-xs font-bold text-secondary">Remove</button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-secondary tracking-widest">Full Name</label>
                      <input type="text" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full bg-background border border-outline-variant/20 rounded-lg px-4 py-3 text-sm outline-none focus:ring-1 ring-primary/40" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-secondary tracking-widest">Display Name</label>
                      <input type="text" value={formData.displayName} onChange={e => setFormData({...formData, displayName: e.target.value})} className="w-full bg-background border border-outline-variant/20 rounded-lg px-4 py-3 text-sm outline-none focus:ring-1 ring-primary/40" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-secondary tracking-widest">Email Address</label>
                      <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-background border border-outline-variant/20 rounded-lg px-4 py-3 text-sm outline-none focus:ring-1 ring-primary/40" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-secondary tracking-widest">Phone Number</label>
                      <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-background border border-outline-variant/20 rounded-lg px-4 py-3 text-sm outline-none focus:ring-1 ring-primary/40" />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[10px] font-bold uppercase text-secondary tracking-widest">Date of Birth</label>
                      <input type="date" value={formData.dateOfBirth} onChange={e => setFormData({...formData, dateOfBirth: e.target.value})} className="w-full md:w-1/2 bg-background border border-outline-variant/20 rounded-lg px-4 py-3 text-sm outline-none focus:ring-1 ring-primary/40" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-secondary tracking-widest">City</label>
                      <input type="text" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="w-full bg-background border border-outline-variant/20 rounded-lg px-4 py-3 text-sm outline-none focus:ring-1 ring-primary/40" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-secondary tracking-widest">State / Province</label>
                      <input type="text" value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} className="w-full bg-background border border-outline-variant/20 rounded-lg px-4 py-3 text-sm outline-none focus:ring-1 ring-primary/40" />
                    </div>
                  </div>

                  <div className="pt-8 border-t border-outline-variant/10 flex justify-end gap-4">
                    <button className="px-6 py-3 text-sm font-bold text-secondary hover:text-primary transition-colors">Discard</button>
                    <button 
                      onClick={handleSaveProfile}
                      disabled={updating}
                      className="px-6 py-3 bg-primary text-on-primary rounded-lg text-sm font-bold shadow-md flex items-center justify-center gap-2 min-w-[140px]"
                    >
                      {updating ? <Loader className="w-4 h-4 animate-spin" /> : 'Save Settings'}
                    </button>
                  </div>
                </div>
              )}

              {/* === SECURITY TAB === */}
              {activeTab === 'security' && (
                <div className="space-y-10">
                  <div>
                    <h3 className="font-headline text-xl font-bold mb-2">Vault Security</h3>
                    <p className="text-secondary text-sm mb-6">Manage authentication and intrinsic PRISM security status.</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-[#FAF7F2] border border-primary/20 p-5 rounded-xl flex items-center justify-between">
                        <div>
                          <p className="text-[10px] uppercase font-bold text-primary tracking-widest mb-1">Security Tier</p>
                          <p className="text-xl font-headline font-black text-on-surface">Tier {identity?.securityTier}</p>
                        </div>
                        <Shield className="w-8 h-8 text-primary opacity-50" />
                      </div>
                      <div className="bg-[#FAF7F2] border border-primary/20 p-5 rounded-xl flex items-center justify-between">
                        <div>
                          <p className="text-[10px] uppercase font-bold text-primary tracking-widest mb-1">Biometric Status</p>
                          <p className="text-xl font-headline font-black text-on-surface capitalize">
                            {identity?.biometricStatus || 'Inactive'}
                          </p>
                        </div>
                        <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleChangePassword} className="border-t border-outline-variant/10 pt-8">
                    <h3 className="font-headline text-lg font-bold mb-4 flex items-center gap-2">
                      <Key className="w-5 h-5 text-secondary" /> Change Password
                    </h3>
                    <div className="space-y-4 max-w-md">
                      <div>
                         <label className="text-[10px] font-bold uppercase text-secondary tracking-widest">Current Password</label>
                         <input required type="password" value={securityData.currentPassword} onChange={e => setSecurityData({...securityData, currentPassword: e.target.value})} className="w-full bg-background border border-outline-variant/20 rounded-lg px-4 py-3 text-sm mt-1 outline-none focus:ring-1 focus:ring-primary/40" />
                      </div>
                      <div>
                         <label className="text-[10px] font-bold uppercase text-secondary tracking-widest">New Password</label>
                         <input required type="password" value={securityData.newPassword} onChange={e => setSecurityData({...securityData, newPassword: e.target.value})} className="w-full bg-background border border-outline-variant/20 rounded-lg px-4 py-3 text-sm mt-1 outline-none focus:ring-1 focus:ring-primary/40" />
                      </div>
                      <button disabled={passwordUpdating} type="submit" className="w-full bg-primary text-on-primary font-bold text-xs uppercase tracking-widest py-3 rounded-lg shadow min-h-[44px]">
                        {passwordUpdating ? <Loader className="w-5 h-5 animate-spin mx-auto" /> : 'Update Password'}
                      </button>
                    </div>
                  </form>

                  {/* Danger Zone */}
                  <div className="border-t border-error/20 pt-8">
                    <h3 className="font-headline text-lg font-bold mb-2 text-[#b44131] flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" /> Danger Zone
                    </h3>
                    <div className="bg-[#b44131]/5 border border-[#b44131]/20 rounded-xl p-6">
                      <h4 className="font-bold text-on-surface text-sm mb-2">Permanently Delete Account</h4>
                      <p className="text-xs text-secondary/80 mb-6 max-w-lg leading-relaxed">
                        Once you delete your account, there is no going back. All identity vectors, documents, and historical logs will be completely eradicated from the PRISM network.
                      </p>
                      <button 
                        onClick={handleDeleteAccount}
                        className="bg-[#b44131] text-white px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-[#913224] transition-colors shadow-sm"
                      >
                        Delete PRISM Account
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* === EMERGENCY TAB === */}
              {activeTab === 'emergency' && (
                <div className="space-y-8">
                  <div>
                    <h3 className="font-headline text-xl font-bold mb-2">Emergency Medical Profile</h3>
                    <p className="text-secondary text-sm mb-8">This information will be accessible to emergency responders when Crisis Mode is activated.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-secondary tracking-widest">Blood Group</label>
                      <select 
                        value={formData.bloodGroup} 
                        onChange={e => setFormData({...formData, bloodGroup: e.target.value})}
                        className="w-full bg-background border border-outline-variant/20 rounded-lg px-4 py-3 text-sm outline-none focus:ring-1 ring-primary/40 appearance-none"
                      >
                        <option value="">Select Blood Group</option>
                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                          <option key={bg} value={bg}>{bg}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-secondary tracking-widest">Allergies</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Penicillin, Peanuts"
                        value={formData.allergies} 
                        onChange={e => setFormData({...formData, allergies: e.target.value})} 
                        className="w-full bg-background border border-outline-variant/20 rounded-lg px-4 py-3 text-sm outline-none focus:ring-1 ring-primary/40" 
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[10px] font-bold uppercase text-secondary tracking-widest">Medical Conditions</label>
                      <textarea 
                        rows={3}
                        placeholder="List any chronic conditions or important medical history..."
                        value={formData.medicalConditions} 
                        onChange={e => setFormData({...formData, medicalConditions: e.target.value})} 
                        className="w-full bg-background border border-outline-variant/20 rounded-lg px-4 py-3 text-sm outline-none focus:ring-1 ring-primary/40 resize-none" 
                      />
                    </div>
                  </div>

                  <div className="pt-8 border-t border-outline-variant/10">
                    <h3 className="font-headline text-lg font-bold mb-6">Emergency Contact</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase text-secondary tracking-widest">Contact Name</label>
                        <input 
                          type="text" 
                          value={formData.emergencyContactName} 
                          onChange={e => setFormData({...formData, emergencyContactName: e.target.value})} 
                          className="w-full bg-background border border-outline-variant/20 rounded-lg px-4 py-3 text-sm outline-none focus:ring-1 ring-primary/40" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase text-secondary tracking-widest">Relationship</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Spouse, Parent"
                          value={formData.emergencyContactRelation} 
                          onChange={e => setFormData({...formData, emergencyContactRelation: e.target.value})} 
                          className="w-full bg-background border border-outline-variant/20 rounded-lg px-4 py-3 text-sm outline-none focus:ring-1 ring-primary/40" 
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-[10px] font-bold uppercase text-secondary tracking-widest">Contact Phone</label>
                        <input 
                          type="text" 
                          value={formData.emergencyContactPhone} 
                          onChange={e => setFormData({...formData, emergencyContactPhone: e.target.value})} 
                          className="w-full bg-background border border-outline-variant/20 rounded-lg px-4 py-3 text-sm outline-none focus:ring-1 ring-primary/40" 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-8 border-t border-outline-variant/10 flex justify-end gap-4">
                    <button 
                      onClick={handleSaveProfile}
                      disabled={updating}
                      className="px-6 py-3 bg-primary text-on-primary rounded-lg text-sm font-bold shadow-md flex items-center justify-center gap-2 min-w-[140px]"
                    >
                      {updating ? <Loader className="w-4 h-4 animate-spin" /> : 'Save Emergency Info'}
                    </button>
                  </div>
                </div>
              )}

              {/* Fallback for other tabs */}
              {activeTab !== 'profile' && activeTab !== 'security' && activeTab !== 'emergency' && (
                <div className="h-64 flex flex-col items-center justify-center text-secondary">
                  <Shield className="w-12 h-12 mb-4 text-outline" />
                  <h3 className="font-bold text-lg">Under Construction</h3>
                  <p className="text-sm">This section is coming soon.</p>
                </div>
              )}
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
