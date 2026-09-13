'use client';

import React from 'react';
import { useApp } from '@/lib/store';

export default function StaffSidebar({ 
  activeTab = 'dashboard', 
  onSelectTab 
}: { 
  activeTab?: string; 
  onSelectTab?: (tab: string) => void;
}) {
  const { currentStaff } = useApp();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'timesheet', label: 'Timesheet Records' },
    { id: 'profile', label: 'My Profile' },
    { id: 'leave', label: 'Leave Management' },
  ];

  const handleNav = (id: string) => {
    if (onSelectTab) onSelectTab(id);
  };

  return (
    <aside className="w-64 bg-white text-slate-700 flex flex-col h-screen sticky top-0 flex-shrink-0 border-r border-slate-200 select-none z-20 font-sans shadow-xs">
      
      {/* Brand Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-slate-50 px-2 py-1 rounded-xl shadow-xs border border-slate-200 flex items-center justify-center">
            <img 
              src="/images/hs-creations-logo.png" 
              alt="HsCreations" 
              className="h-6 object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-slate-900 font-extrabold text-xs tracking-wide">HSCREATIONS</h2>
              <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-600 border border-orange-500/20">
                STAFF
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium tracking-tight">
              Sydney Printing &amp; Design
            </span>
          </div>
        </div>
      </div>

      {/* Flat List of Clickable Tabs */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-200">
        {navItems.map(item => {
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-all duration-150 group relative cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold shadow-md shadow-blue-500/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-semibold'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white flex-shrink-0 animate-pulse" />}
                <span className="truncate">{item.label}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Bottom Section: Emergency Contacts, Company Directory, Resignation Notice */}
      <div className="p-3 border-t border-slate-100 space-y-1">
        <button
          onClick={() => handleNav('emergency')}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-all duration-150 group relative cursor-pointer ${
            activeTab === 'emergency'
              ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold shadow-md shadow-blue-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-semibold'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {activeTab === 'emergency' && <span className="w-1.5 h-1.5 rounded-full bg-white flex-shrink-0 animate-pulse" />}
            <span className="truncate">Emergency Contacts</span>
          </div>
        </button>

        <button
          onClick={() => handleNav('directory')}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-all duration-150 group relative cursor-pointer ${
            activeTab === 'directory'
              ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold shadow-md shadow-blue-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-semibold'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {activeTab === 'directory' && <span className="w-1.5 h-1.5 rounded-full bg-white flex-shrink-0 animate-pulse" />}
            <span className="truncate">Company Directory</span>
          </div>
        </button>

        <button
          onClick={() => handleNav('resignation')}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-all duration-150 group relative cursor-pointer ${
            activeTab === 'resignation'
              ? 'bg-gradient-to-r from-rose-600 to-amber-600 text-white font-bold shadow-md shadow-rose-500/20'
              : 'text-slate-600 hover:text-rose-600 hover:bg-rose-50 font-semibold'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {activeTab === 'resignation' && <span className="w-1.5 h-1.5 rounded-full bg-white flex-shrink-0 animate-pulse" />}
            <span className="truncate">Resignation Notice</span>
          </div>
        </button>
      </div>

      {/* Bottom Sleek User Bar */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/80">
        <div 
          onClick={() => handleNav('profile')}
          className="p-2.5 rounded-xl bg-white hover:bg-slate-100/80 border border-slate-200/80 shadow-xs flex items-center justify-between gap-3 cursor-pointer transition group"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {currentStaff.avatarUrl ? (
              <img 
                src={currentStaff.avatarUrl} 
                alt={currentStaff.firstName} 
                className="w-8 h-8 rounded-lg object-cover ring-1 ring-blue-500/30 flex-shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-xs flex-shrink-0">
                {currentStaff.firstName ? currentStaff.firstName.charAt(0) : 'U'}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h4 className="text-slate-900 font-bold text-xs truncate group-hover:text-blue-600 transition">
                {currentStaff.firstName} {currentStaff.lastName}
              </h4>
              <p className="text-[10px] text-slate-500 truncate">
                {currentStaff.jobTitle || 'Staff Member'}
              </p>
            </div>
          </div>

          <div className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20 animate-pulse flex-shrink-0" title="Active on shift" />
        </div>
      </div>

    </aside>
  );
}
