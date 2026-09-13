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
    strip: 'bg-blue-500',
    iconBg: 'bg-blue-50',
    iconText: 'text-blue-500',
    border: 'border-l-4 border-l-blue-500',
  },
  green: {
    strip: 'bg-emerald-500',
    iconBg: 'bg-emerald-50',
    iconText: 'text-emerald-500',
    border: 'border-l-4 border-l-emerald-500',
  },
  amber: {
    strip: 'bg-amber-400',
    iconBg: 'bg-amber-50',
    iconText: 'text-amber-500',
    border: 'border-l-4 border-l-amber-400',
  },
  rose: {
    strip: 'bg-rose-400',
    iconBg: 'bg-rose-50',
    iconText: 'text-rose-500',
    border: 'border-l-4 border-l-rose-400',
  },
  purple: {
    strip: 'bg-[#453a6a]',
    iconBg: 'bg-purple-50',
    iconText: 'text-[#453a6a]',
    border: 'border-l-4 border-l-[#453a6a]',
  }
};

export default function KPICard({
  icon,
  value,
  label,
  sublabel,
  colorScheme = 'blue',
  onClick
}: KPICardProps) {
  const styles = colorStyles[colorScheme] || colorStyles.blue;

  // Default icons matching the style if not passed
  const renderIcon = () => {
    if (icon) return icon;
    if (colorScheme === 'rose') {
      return (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      );
    }
    if (colorScheme === 'purple') {
      return (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      );
    }
    if (colorScheme === 'amber') {
      return (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      );
    }
    return (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  };

  return (
    <div 
      onClick={onClick}
      className={`bg-white rounded-2xl p-5 shadow-sm border border-slate-100 ${styles.border} transition-all duration-200 cursor-pointer group hover:shadow-md hover:-translate-y-0.5 flex items-center justify-between gap-4`}
    >
      <div className="flex items-center gap-4 min-w-0">
        {/* Left Icon Area */}
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${styles.iconBg} ${styles.iconText} transition-transform group-hover:scale-105`}>
          {renderIcon()}
        </div>

        {/* Thin Vertical Divider */}
        <div className="w-[1px] h-10 bg-slate-200/80 shrink-0" />

        {/* Metric Label and Value */}
        <div className="min-w-0">
          <span className="text-[11px] font-semibold text-slate-400 block tracking-tight truncate">
            {label}
          </span>
          <span className="text-2xl font-black text-slate-800 tracking-tight block leading-tight">
            {value}
          </span>
        </div>
      </div>

      {sublabel && (
        <span className="text-[10px] text-slate-400 hidden xl:block shrink-0 max-w-[120px] text-right truncate">
          {sublabel}
        </span>
      )}
    </div>
  );
}
