'use client';

import React from 'react';
import { useApp } from '@/lib/store';
import { getOnboardingProgress } from '@/lib/onboarding';

export default function StaffSidebar({ 
  activeTab = 'dashboard', 
  onSelectTab 
}: { 
  activeTab?: string; 
  onSelectTab?: (tab: string) => void;
}) {
  const { currentStaff, documentTypes } = useApp();

  const progress = getOnboardingProgress(currentStaff, documentTypes);
  const isIncomplete = currentStaff?.status === 'Pending' || progress.missingDocuments.length > 0 || !progress.isComplete;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'timesheet', label: 'Timesheet Records' },
  ];

  const handleNav = (id: string) => {
    if (onSelectTab) onSelectTab(id);
  };

  return (
    <aside className="w-60 bg-[#453a6a] text-purple-100 flex flex-col h-screen sticky top-0 flex-shrink-0 select-none z-20 font-sans shadow-xl">
      
      {/* Brand Header */}
      <div className="p-5 pb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center p-1.5 shadow-md flex-shrink-0">
            <img 
              src="/images/hs-creations-logo.png" 
              alt="HsCreations" 
              className="h-7 w-7 object-contain"
            />
          </div>
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-1.5">
              <h2 className="text-white font-black text-xs tracking-wider">HSCREATIONS</h2>
              <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-cyan-400/20 text-cyan-300 border border-cyan-400/30">
                STAFF
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation with Curved Active Tab */}
      <div className="flex-1 overflow-y-auto pt-2 space-y-1 scrollbar-none">
        {navItems.map(item => {
          const isActive = activeTab === item.id;
          const isItemLocked = isIncomplete && item.id === 'timesheet';
          
          return (
            <div key={item.id} className="relative pl-3">
              <button
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3 text-xs transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'curved-active-tab font-bold text-[#453a6a]'
                    : isItemLocked
                    ? 'rounded-2xl text-purple-200/50 hover:text-purple-200 hover:bg-white/5 font-medium pr-4'
                    : 'rounded-2xl text-purple-200/75 hover:text-white hover:bg-white/10 font-medium pr-4'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {isActive && <span className="w-2 h-2 rounded-full bg-[#453a6a] flex-shrink-0 animate-pulse" />}
                  <span className="truncate">{item.label}</span>
                </div>
                {isItemLocked && (
                  <span className="text-[10px] text-amber-300 font-bold px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-400/30 flex items-center gap-1">
                    🔒 Locked
                  </span>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Lower Navigation Section: My Profile, Leave Management, Emergency Contacts, Resignation */}
      <div className="pt-3 pb-2 space-y-1 border-t border-white/10">
        <div className="relative pl-3">
          <button
            onClick={() => handleNav('profile')}
            className={`w-full flex items-center justify-between px-4 py-2.5 text-xs transition-all duration-150 cursor-pointer ${
              activeTab === 'profile'
                ? 'curved-active-tab font-bold text-[#453a6a]'
                : 'rounded-2xl text-purple-200/75 hover:text-white hover:bg-white/10 font-medium pr-4'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              {activeTab === 'profile' && <span className="w-2 h-2 rounded-full bg-[#453a6a] flex-shrink-0 animate-pulse" />}
              <span className="truncate">My Profile</span>
            </div>
            {isIncomplete && (
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                {progress.percent}%
              </span>
            )}
          </button>
        </div>

        <div className="relative pl-3">
          <button
            onClick={() => handleNav('leave')}
            className={`w-full flex items-center justify-between px-4 py-2.5 text-xs transition-all duration-150 cursor-pointer ${
              activeTab === 'leave'
                ? 'curved-active-tab font-bold text-[#453a6a]'
                : isIncomplete
                ? 'rounded-2xl text-purple-200/50 hover:text-purple-200 hover:bg-white/5 font-medium pr-4'
                : 'rounded-2xl text-purple-200/75 hover:text-white hover:bg-white/10 font-medium pr-4'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              {activeTab === 'leave' && <span className="w-2 h-2 rounded-full bg-[#453a6a] flex-shrink-0 animate-pulse" />}
              <span className="truncate">Leave Management</span>
            </div>
            {isIncomplete && (
              <span className="text-[10px] text-amber-300 font-bold px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-400/30 flex items-center gap-1">
                🔒
              </span>
            )}
          </button>
        </div>

        <div className="relative pl-3">
          <button
            onClick={() => handleNav('emergency')}
            className={`w-full flex items-center justify-between px-4 py-2.5 text-xs transition-all duration-150 cursor-pointer ${
              activeTab === 'emergency'
                ? 'curved-active-tab font-bold text-[#453a6a]'
                : 'rounded-2xl text-purple-200/75 hover:text-white hover:bg-white/10 font-medium pr-4'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              {activeTab === 'emergency' && <span className="w-2 h-2 rounded-full bg-[#453a6a] flex-shrink-0 animate-pulse" />}
              <span className="truncate">Emergency Contacts</span>
            </div>
          </button>
        </div>

        <div className="relative pl-3">
          <button
            onClick={() => handleNav('resignation')}
            className={`w-full flex items-center justify-between px-4 py-2.5 text-xs transition-all duration-150 cursor-pointer ${
              activeTab === 'resignation'
                ? 'curved-active-tab font-bold text-[#453a6a]'
                : isIncomplete
                ? 'rounded-2xl text-purple-200/50 hover:text-purple-200 hover:bg-white/5 font-medium pr-4'
                : 'rounded-2xl text-purple-200/75 hover:text-rose-300 hover:bg-rose-500/10 font-medium pr-4'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              {activeTab === 'resignation' && <span className="w-2 h-2 rounded-full bg-rose-600 flex-shrink-0 animate-pulse" />}
              <span className="truncate">Resignation Notice</span>
            </div>
            {isIncomplete && (
              <span className="text-[10px] text-amber-300 font-bold px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-400/30 flex items-center gap-1">
                🔒
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Bottom Sleek User Bar */}
      <div className="p-3 bg-[#3a3059]/90 border-t border-white/10 m-2 rounded-2xl">
        <div 
          onClick={() => handleNav('profile')}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-between gap-3 cursor-pointer transition group"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {currentStaff.avatarUrl ? (
              <img 
                src={currentStaff.avatarUrl} 
                alt={currentStaff.firstName} 
                className="w-8 h-8 rounded-lg object-cover ring-1 ring-cyan-400/40 flex-shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-cyan-400/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300 font-bold text-xs flex-shrink-0">
                {currentStaff.firstName ? currentStaff.firstName.charAt(0) : 'U'}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h4 className="text-white font-bold text-xs truncate group-hover:text-cyan-300 transition">
                {currentStaff.firstName} {currentStaff.lastName}
              </h4>
              <p className="text-[10px] text-purple-200/60 truncate">
                {currentStaff.jobTitle || 'Staff Member'}
              </p>
            </div>
          </div>

          <div 
            className={`w-2 h-2 rounded-full ${isIncomplete ? 'bg-amber-400 ring-2 ring-amber-400/30 animate-pulse' : 'bg-emerald-400 ring-2 ring-emerald-400/30 animate-pulse'} flex-shrink-0`} 
            title={isIncomplete ? `Profile Incomplete (${progress.percent}%)` : 'Active Staff'} 
          />
        </div>
      </div>

    </aside>
  );
}
