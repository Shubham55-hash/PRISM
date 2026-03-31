import React from 'react';
import { TrustIndex } from '../components/TrustIndex';
import { StatCard } from '../components/StatCard';
import { VerificationHistory } from '../components/VerificationHistory';
import { SuggestionBanner } from '../components/SuggestionBanner';
import { Folder, Key, CircleAlert } from 'lucide-react';
import { motion } from 'motion/react';

export function DashboardPage() {
  return (
    <>
      {/* Hero Section */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-xl overflow-hidden mb-12 h-64 flex items-center p-12 group"
      >
        <div className="absolute inset-0 z-0">
          <img 
            className="w-full h-full object-cover opacity-20 group-hover:scale-105 transition-transform duration-700" 
            src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1920" 
            alt="Architecture"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#F5F0E8] via-[#F5F0E8]/90 to-transparent z-10" />
        <div className="relative z-20 max-w-2xl">
          <h2 className="font-headline text-5xl font-extrabold text-on-surface tracking-tight leading-tight">
            Welcome back,<br />
            <span className="text-primary">Arjun</span>
          </h2>
          <p className="mt-4 text-secondary font-medium max-w-md leading-relaxed">
            Your digital identity is secure. You have 3 pending verification requests that require your attention today.
          </p>
        </div>
      </motion.section>

      <div className="grid grid-cols-12 gap-8 items-start">
        {/* Left Column */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="col-span-12 lg:col-span-4 space-y-8"
        >
          <TrustIndex />
          
          <div className="grid grid-cols-1 gap-4">
            <StatCard 
              label="Total Documents" 
              value="24" 
              icon={Folder} 
              iconBg="bg-surface-container" 
              iconColor="text-primary" 
            />
            <StatCard 
              label="Active Consents" 
              value="08" 
              icon={Key} 
              iconBg="bg-secondary-container" 
              iconColor="text-on-secondary-container" 
            />
            <StatCard 
              label="Pending Requests" 
              value="03" 
              icon={CircleAlert} 
              iconBg="bg-error-container/30" 
              iconColor="text-error" 
              valueColor="text-error"
            />
          </div>
        </motion.div>

        {/* Right Column */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="col-span-12 lg:col-span-8 space-y-8"
        >
          <VerificationHistory />
          <SuggestionBanner />
        </motion.div>
      </div>
    </>
  );
}
