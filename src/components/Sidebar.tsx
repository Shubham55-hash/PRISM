import React from 'react';
import { 
  LayoutDashboard, 
  Fingerprint, 
  FileText, 
  ShieldCheck, 
  Settings, 
  CircleHelp, 
  LogOut 
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Fingerprint, label: 'Identity', path: '/identity' },
  { icon: FileText, label: 'Documents', path: '/documents' },
  { icon: ShieldCheck, label: 'Consents', path: '/consents' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="h-screen w-64 fixed left-0 top-0 overflow-y-auto bg-prism-sidebar shadow-2xl shadow-prism-sidebar/20 flex flex-col py-8 z-50">
      <div className="px-6 mb-10">
        <h1 className="text-2xl font-bold text-inverse-on-surface tracking-widest font-headline">PRISM</h1>
        <p className="text-[10px] text-prism-accent font-medium tracking-[0.2em] uppercase mt-1">Digital Curator</p>
      </div>
      
      <nav className="flex-1 flex flex-col gap-1 pr-4">
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.label}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-6 py-3 transition-all duration-300 group rounded-r-full",
                active 
                  ? "bg-prism-accent text-inverse-on-surface" 
                  : "text-inverse-on-surface/70 hover:text-inverse-on-surface hover:bg-prism-accent/10"
              )}
            >
              <item.icon className={cn("w-5 h-5", active && "fill-current")} />
              <span className="font-headline text-sm font-medium tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-6 pt-6 border-t border-inverse-on-surface/10 flex flex-col gap-1">
        <a href="#" className="flex items-center gap-3 py-2 text-inverse-on-surface/50 hover:text-inverse-on-surface transition-colors">
          <CircleHelp className="w-4 h-4" />
          <span className="font-headline text-xs font-medium tracking-tight">Help</span>
        </a>
        <a href="#" className="flex items-center gap-3 py-2 text-inverse-on-surface/50 hover:text-inverse-on-surface transition-colors">
          <LogOut className="w-4 h-4" />
          <span className="font-headline text-xs font-medium tracking-tight">Logout</span>
        </a>
      </div>
    </aside>
  );
}
