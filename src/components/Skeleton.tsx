import React from 'react';
import { cn } from '../lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={cn("animate-pulse bg-surface-container rounded-md", className)} />
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/10 shadow-sm space-y-4">
      <div className="flex justify-between items-start">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <Skeleton className="w-16 h-4" />
      </div>
      <div className="space-y-2">
        <Skeleton className="w-24 h-8" />
        <Skeleton className="w-32 h-4" />
      </div>
    </div>
  );
}

export function DocumentRowSkeleton() {
  return (
    <tr className="border-b border-outline-variant/5">
      <td className="px-6 py-4"><Skeleton className="w-48 h-5" /></td>
      <td className="px-6 py-4"><Skeleton className="w-24 h-5" /></td>
      <td className="px-6 py-4"><Skeleton className="w-16 h-5" /></td>
      <td className="px-6 py-4"><Skeleton className="w-24 h-5" /></td>
      <td className="px-6 py-4"><Skeleton className="w-20 h-5" /></td>
      <td className="px-6 py-4 text-right"><Skeleton className="w-24 h-8 ml-auto" /></td>
    </tr>
  );
}
