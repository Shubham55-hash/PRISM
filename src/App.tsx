import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { DashboardPage } from './pages/DashboardPage';
import { IdentityPage } from './pages/IdentityPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { ConsentsPage } from './pages/ConsentsPage';
import { SettingsPage } from './pages/SettingsPage';
import { ActivityPage } from './pages/ActivityPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { AutofillPage } from './pages/AutofillPage';
import { AutofillTestPage } from './pages/AutofillTestPage';
import { CrisisPage } from './pages/CrisisPage';
import { LoginPage } from './pages/LoginPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Plus, Loader } from 'lucide-react';
import { motion } from 'motion/react';

import { ToastProvider, useToast } from './components/Toast';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useWebSocket } from './hooks/useWebSocket';

function AppLayout() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { showToast } = useToast();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  // WebSocket Handlers
  useWebSocket(user?.id, {
    document_uploaded: (data: any) => {
      showToast('success', 'Document Uploaded', `${data.name} is now encrypted in your vault.`);
    },
    document_verified: (data: any) => {
      showToast('success', 'Identity Verified', `W3C Verifiable Credential issued for ${data.name}.`);
    },
    consent_granted: (data: any) => {
      showToast('info', 'Consent Active', `You've authorized ${data.institutionName} to access your data.`);
    },
    consent_revoked: (data: any) => {
      showToast('error', 'Consent Revoked', `Access for ${data.institutionName} has been immediately terminated.`);
    },
    crisis_activated: () => {
      showToast('error', 'CRISIS MODE ACTIVE', 'Your digital identity is now locked. All active consents are suspended.');
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F0E8]">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-8 h-8 text-[#705831] animate-spin" />
          <p className="text-sm font-bold text-[#705831]/60 tracking-widest uppercase">Loading PRISM…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen relative flex">
      {/* Global Background Layer */}
      <div
        className="fixed inset-0 opacity-10 pointer-events-none bg-center bg-cover"
        style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=1920)' }}
      />
      <div className="fixed inset-0 bg-[#F5F0E8]/82 pointer-events-none" />

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 flex flex-col min-w-0 min-h-screen md:ml-64 relative z-10 transition-all duration-300">
        <TopBar onMenuClick={() => setSidebarOpen(true)} />

        <div className="mt-20 px-4 md:px-12 py-10 max-w-[1440px] mx-auto w-full">
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/activity" element={<ActivityPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/identity" element={<IdentityPage />} />
              <Route path="/documents" element={<DocumentsPage />} />
              <Route path="/consents" element={<ConsentsPage />} />
              <Route path="/autofill" element={<AutofillPage />} />
              <Route path="/autofill-test" element={<AutofillTestPage />} />
              <Route path="/crisis" element={<CrisisPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ErrorBoundary>
        </div>
      </main>

      {/* FAB */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-10 right-10 w-16 h-16 rounded-full bg-primary text-on-primary shadow-2xl flex items-center justify-center z-40 hidden sm:flex"
        onClick={() => window.location.href = '/documents'}
      >
        <Plus className="w-8 h-8" />
      </motion.button>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <AppLayout />
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}
