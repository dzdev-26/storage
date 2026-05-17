import React from 'react';
import { motion } from 'motion/react';

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`relative overflow-hidden bg-[var(--surface-variant)] rounded-xl ${className}`}>
    <motion.div
      animate={{ x: ['-100%', '100%'] }}
      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--bg-main)]/30 to-transparent w-full h-full"
    />
  </div>
);

export const MessageSkeleton: React.FC = () => (
  <div className="flex flex-col space-y-3 p-4 bg-[var(--surface)] rounded-2xl border border-[var(--surface-border)] max-w-[85%]">
    <div className="flex items-center gap-2">
      <Skeleton className="w-5 h-5 rounded-full" />
      <Skeleton className="w-24 h-3" />
    </div>
    <div className="space-y-2">
      <Skeleton className="w-full h-4" />
      <Skeleton className="w-[90%] h-4" />
      <Skeleton className="w-[40%] h-4" />
    </div>
  </div>
);
