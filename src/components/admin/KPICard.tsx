'use client';

import React from 'react';

interface KPICardProps {
  icon?: any;
  value: string | number;
  label: string;
  sublabel: string;
  colorScheme: 'blue' | 'green' | 'amber' | 'rose' | 'purple';
  onClick?: () => void;
}

const colorStyles = {
  blue: {
    accent: 'bg-blue-500',
    text: 'text-blue-600',
    border: 'border-slate-200/80 hover:border-blue-300',
  },
  green: {
    accent: 'bg-emerald-500',
    text: 'text-emerald-600',
    border: 'border-slate-200/80 hover:border-emerald-300',
  },
  amber: {
    accent: 'bg-amber-500',
    text: 'text-amber-600',
    border: 'border-slate-200/80 hover:border-amber-300',
  },
  rose: {
    accent: 'bg-rose-500',
    text: 'text-rose-600',
    border: 'border-slate-200/80 hover:border-rose-300',
  },
  purple: {
    accent: 'bg-purple-500',
    text: 'text-purple-600',
    border: 'border-slate-200/80 hover:border-purple-300',
  }
};

export default function KPICard({
  value,
  label,
  sublabel,
  colorScheme,
  onClick
}: KPICardProps) {
  const styles = colorStyles[colorScheme];

  return (
    <div 
      onClick={onClick}
      className={`bg-white rounded-2xl p-5 border shadow-xs transition-all duration-200 cursor-pointer group hover:shadow-md hover:-translate-y-0.5 ${styles.border} relative overflow-hidden`}
    >
      <div className={`absolute top-0 left-0 right-0 h-1 ${styles.accent}`} />
      
      <div className="mb-2">
        <span className="text-2xl font-black text-slate-900 tracking-tight block">
          {value}
        </span>
      </div>

      <div className="space-y-0.5">
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
          {label}
        </h4>
        <div className="text-[11px] font-semibold text-slate-400 group-hover:text-slate-600 transition">
          {sublabel}
        </div>
      </div>
    </div>
  );
}
