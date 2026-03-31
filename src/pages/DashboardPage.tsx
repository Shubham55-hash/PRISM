import React, { useState } from 'react';
import { TrustIndex } from '../components/TrustIndex';
import { StatCard } from '../components/StatCard';
import { VerificationHistory } from '../components/VerificationHistory';
import { SuggestionBanner } from '../components/SuggestionBanner';
import { Folder, Key, CircleAlert } from 'lucide-react';
import { motion } from 'motion/react';
import { useApi } from '../hooks/useApi';
import { identityApi } from '../api/identity';
import { analyticsApi } from '../api/analytics';
import { useAuth } from '../context/AuthContext';

export function DashboardPage() {
  const { user } = useAuth();
  const { data: identity } = useApi(() => identityApi.getIdentity(), []);
  const { data: stats } = useApi(() => analyticsApi.getDashboardStats(), []);
  const { data: trustScore } = useApi(() => identityApi.getTrustScore(), []);

  const displayName = identity?.displayName || user?.displayName || 'there';
  const pendingCount = stats?.pendingRequests ?? identity?.pendingRequests ?? 3;

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
            <span className="text-primary">{displayName}</span>
          </h2>
          <p className="mt-4 text-secondary font-medium max-w-md leading-relaxed">
            Your digital identity is secure.{' '}
            {pendingCount > 0
              ? `You have ${pendingCount} pending verification request${pendingCount !== 1 ? 's' : ''} that require your attention today.`
              : 'All verification requests are up to date.'}
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
          <TrustIndex score={trustScore?.score} label={trustScore?.label} />

          <div className="grid grid-cols-1 gap-4">
            <StatCard
              label="Total Documents"
              value={stats ? String(stats.totalDocuments).padStart(2, '0') : '—'}
              icon={Folder}
              iconBg="bg-surface-container"
              iconColor="text-primary"
            />
            <StatCard
              label="Active Consents"
              value={stats ? String(stats.activeConsents).padStart(2, '0') : '—'}
              icon={Key}
              iconBg="bg-secondary-container"
              iconColor="text-on-secondary-container"
            />
            <StatCard
              label="Pending Requests"
              value={stats ? String(stats.pendingRequests).padStart(2, '0') : '—'}
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
