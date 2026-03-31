import React from 'react';
import { Search, Bell } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';

export function TopBar() {
  const location = useLocation();

  return (
    <header className="flex justify-between items-center h-20 px-12 fixed top-0 right-0 w-[calc(100%-16rem)] z-40 bg-inverse-on-surface/82 backdrop-blur-xl">
      <div className="flex items-center gap-8">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
          <input 
            className="bg-transparent border-none focus:ring-0 text-sm font-body pl-10 pr-4 py-2 w-64 placeholder:text-outline-variant outline-none" 
            placeholder="Search archives..." 
            type="text"
          />
        </div>
        <nav className="hidden md:flex gap-8">
          <Link 
            to="/" 
            className={cn(
              "pb-1 text-sm font-body transition-all",
              location.pathname === '/' ? "text-primary font-bold border-b-2 border-primary" : "text-secondary hover:text-primary"
            )}
          >
            Overview
          </Link>
          <Link 
            to="/activity" 
            className={cn(
              "pb-1 text-sm font-body transition-all",
              location.pathname === '/activity' ? "text-primary font-bold border-b-2 border-primary" : "text-secondary hover:text-primary"
            )}
          >
            Activity
          </Link>
          <Link 
            to="/analytics" 
            className={cn(
              "pb-1 text-sm font-body transition-all",
              location.pathname === '/analytics' ? "text-primary font-bold border-b-2 border-primary" : "text-secondary hover:text-primary"
            )}
          >
            Analytics
          </Link>
        </nav>
      </div>
      
      <div className="flex items-center gap-6">
        <button className="text-primary hover:opacity-80 transition-opacity">
          <Bell className="w-6 h-6" />
        </button>
        <div className="w-10 h-10 rounded-full border-2 border-primary overflow-hidden">
          <img 
            className="w-full h-full object-cover" 
            src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100" 
            alt="Profile"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>
    </header>
  );
}
