import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../lib/utils';

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  valueColor?: string;
}

export function StatCard({ label, value, icon: Icon, iconBg, iconColor, valueColor }: StatCardProps) {
  return (
    <div className="bg-[#FAF7F2] p-6 rounded-xl shadow-sm flex items-center justify-between group hover:translate-y-[-2px] transition-transform">
      <div>
        <p className={cn("text-xs font-bold uppercase tracking-wider mb-1", valueColor ? valueColor : "text-secondary")}>
          {label}
        </p>
        <p className={cn("text-3xl font-headline font-bold", valueColor ? valueColor : "text-on-surface")}>
          {value}
        </p>
      </div>
      <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", iconBg, iconColor)}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );
}
