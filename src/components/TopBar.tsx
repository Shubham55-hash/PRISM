import { Search, Bell, Menu } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useApi } from '../hooks/useApi';
import { identityApi } from '../api/identity';

interface TopBarProps {
  onMenuClick: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const location = useLocation();
  const { data: identity } = useApi(() => identityApi.getIdentity(), []);

  return (
    <header className="flex justify-between items-center h-20 px-4 md:px-12 fixed top-0 right-0 w-full md:w-[calc(100%-16rem)] z-40 bg-inverse-on-surface/82 backdrop-blur-xl transition-all duration-300">
      <div className="flex items-center gap-4 md:gap-8">
        <button 
          onClick={onMenuClick}
          className="md:hidden p-2 -ml-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div className="relative group hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
          <input 
            className="bg-transparent border-none focus:ring-0 text-sm font-body pl-10 pr-4 py-2 w-48 md:w-64 placeholder:text-outline-variant outline-none" 
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
        <div className="w-10 h-10 rounded-full border-2 border-primary overflow-hidden flex items-center justify-center bg-surface-container shadow-sm">
          <span className="text-sm font-bold text-primary">
            {(identity?.fullName || 'abc').charAt(0).toUpperCase()}
          </span>
        </div>
      </div>
    </header>
  );
}

