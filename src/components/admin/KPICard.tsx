'use client';

import React from 'react';
import { ArrowRight, LucideIcon } from 'lucide-react';

interface KPICardProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
  sublabel: string;
  colorScheme: 'blue' | 'green' | 'amber' | 'rose' | 'purple';
  onClick?: () => void;
}

const colorStyles = {
  blue: {
    iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
    hoverText: 'text-blue-600',
    border: 'border-slate-200/80 hover:border-blue-300',
  },
  green: {
    iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    hoverText: 'text-emerald-600',
    border: 'border-slate-200/80 hover:border-emerald-300',
  },
  amber: {
    iconBg: 'bg-amber-50 text-amber-600 border-amber-100',
    hoverText: 'text-amber-600',
    border: 'border-slate-200/80 hover:border-amber-300',
  },
  rose: {
    iconBg: 'bg-rose-50 text-rose-600 border-rose-100',
    hoverText: 'text-rose-600',
    border: 'border-slate-200/80 hover:border-rose-300',
  },
  purple: {
    iconBg: 'bg-purple-50 text-purple-600 border-purple-100',
    hoverText: 'text-purple-600',
    border: 'border-slate-200/80 hover:border-purple-300',
  }
};

export default function KPICard({
  icon: Icon,
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
      className={`bg-white rounded-2xl p-5 border shadow-sm transition-all duration-200 cursor-pointer group hover:shadow-md hover:-translate-y-0.5 ${styles.border}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border ${styles.iconBg} transition-transform group-hover:scale-105 shadow-xs`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-2xl font-black text-slate-900 tracking-tight">
          {value}
        </span>
      </div>

      <div className="space-y-1">
        <h4 className="text-xs font-bold text-slate-700">
          {label}
        </h4>
        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 group-hover:text-slate-600 transition">
          <span>{sublabel}</span>
          <ArrowRight className={`w-3.5 h-3.5 transition-transform group-hover:translate-x-1 ${styles.hoverText}`} />
        </div>
      </div>
    </div>
  );
}
