import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { DashboardPage } from './pages/DashboardPage';
import { IdentityPage } from './pages/IdentityPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { ConsentsPage } from './pages/ConsentsPage';
import { SettingsPage } from './pages/SettingsPage';
import { ActivityPage } from './pages/ActivityPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { Plus } from 'lucide-react';
import { motion } from 'motion/react';

export default function App() {
  return (
    <Router>
      <div className="min-h-screen relative">
        {/* Global Background Layer */}
        <div 
          className="fixed inset-0 opacity-10 pointer-events-none bg-center bg-cover" 
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=1920)' }}
        />
        <div className="fixed inset-0 bg-[#F5F0E8]/82 pointer-events-none" />

        <div className="flex relative z-10">
          <Sidebar />

          <main className="ml-64 flex-1 flex flex-col min-w-0">
            <TopBar />

            <div className="mt-20 px-12 py-10 max-w-[1440px] mx-auto w-full">
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/activity" element={<ActivityPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/identity" element={<IdentityPage />} />
                <Route path="/documents" element={<DocumentsPage />} />
                <Route path="/consents" element={<ConsentsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Routes>
            </div>
          </main>

          {/* FAB */}
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="fixed bottom-10 right-10 w-16 h-16 rounded-full bg-primary text-on-primary shadow-2xl flex items-center justify-center z-50"
          >
            <Plus className="w-8 h-8" />
          </motion.button>
        </div>
      </div>
    </Router>
  );
}
