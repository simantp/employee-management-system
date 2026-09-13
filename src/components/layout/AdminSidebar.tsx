'use client';

import React from 'react';
import { useApp } from '@/lib/store';

export default function AdminSidebar({ 
  activeTab = 'dashboard', 
  onSelectTab 
}: { 
  activeTab?: string; 
  onSelectTab?: (tab: string) => void;
}) {
  const { alerts, leaveRequests, employees, activeWorkingStaffCount, announcements, logout } = useApp();

  const pendingApprovals = leaveRequests.filter(r => r.status === 'PENDING').length;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', badge: null },
    { id: 'timecards', label: 'Timecard & Shifts', badge: activeWorkingStaffCount > 0 ? `${activeWorkingStaffCount} Active` : null },
    { id: 'employees', label: 'Employees', badge: null },
    { id: 'alerts', label: 'Visa and License Alerts', badge: null },
    { id: 'announcements', label: 'Announcements', badge: null },
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
              <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                ADMIN
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation with Curved Active Tab */}
      <div className="flex-1 overflow-y-auto pt-2 space-y-1 scrollbar-none">
        {navItems.map(item => {
          const isActive = activeTab === item.id;
          return (
            <div key={item.id} className="relative pl-3">
              <button
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3 text-xs transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'curved-active-tab font-bold text-[#453a6a]'
                    : 'rounded-2xl text-purple-200/75 hover:text-white hover:bg-white/10 font-medium pr-4'
                }`}
              >
                <div className="flex items-center gap-3">
                  {isActive && <span className="w-2 h-2 rounded-full bg-[#453a6a] animate-pulse" />}
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    isActive 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Settings, Leave Approval Records & Audit Log Section */}
      <div className="pt-3 pb-2 space-y-1 border-t border-white/10">
        <div className="relative pl-3">
          <button
            onClick={() => handleNav('settings')}
            className={`w-full flex items-center justify-between px-4 py-2.5 text-xs transition-all duration-150 cursor-pointer ${
              activeTab === 'settings'
                ? 'curved-active-tab font-bold text-[#453a6a]'
                : 'rounded-2xl text-purple-200/75 hover:text-white hover:bg-white/10 font-medium pr-4'
            }`}
          >
            <div className="flex items-center gap-3">
              {activeTab === 'settings' && <span className="w-2 h-2 rounded-full bg-[#453a6a] animate-pulse" />}
              <span>Settings</span>
            </div>
          </button>
        </div>

        <div className="relative pl-3">
          <button
            onClick={() => handleNav('approvals')}
            className={`w-full flex items-center justify-between px-4 py-2.5 text-xs transition-all duration-150 cursor-pointer ${
              activeTab === 'approvals'
                ? 'curved-active-tab font-bold text-[#453a6a]'
                : 'rounded-2xl text-purple-200/75 hover:text-white hover:bg-white/10 font-medium pr-4'
            }`}
          >
            <div className="flex items-center gap-3">
              {activeTab === 'approvals' && <span className="w-2 h-2 rounded-full bg-[#453a6a] animate-pulse" />}
              <span>Leave Approvals</span>
            </div>
            {pendingApprovals > 0 && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                activeTab === 'approvals'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-amber-400/20 text-amber-300 border border-amber-400/30 animate-pulse'
              }`}>
                {pendingApprovals}
              </span>
            )}
          </button>
        </div>

        <div className="relative pl-3">
          <button
            onClick={() => handleNav('audit-log')}
            className={`w-full flex items-center justify-between px-4 py-2.5 text-xs transition-all duration-150 cursor-pointer ${
              activeTab === 'audit-log'
                ? 'curved-active-tab font-bold text-[#453a6a]'
                : 'rounded-2xl text-purple-200/75 hover:text-white hover:bg-white/10 font-medium pr-4'
            }`}
          >
            <div className="flex items-center gap-3">
              {activeTab === 'audit-log' && <span className="w-2 h-2 rounded-full bg-[#453a6a] animate-pulse" />}
              <span>Audit Log</span>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              activeTab === 'audit-log' ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-400/20 text-emerald-300'
            }`}>
              Live
            </span>
          </button>
        </div>
      </div>

      {/* User Footer Profile */}
      <div className="p-3 bg-[#3a3059]/90 border-t border-white/10 m-2 rounded-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-slate-950 font-bold text-xs shadow-sm">
              AU
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold text-white">Admin User</span>
              <span className="text-[10px] text-purple-300/80 font-medium">Super Admin</span>
            </div>
          </div>
          <button 
            onClick={() => logout()}
            className="text-[10px] font-bold text-purple-300 hover:text-rose-300 px-2 py-1 rounded bg-white/5 hover:bg-white/10 transition cursor-pointer" 
            title="Sign Out"
          >
            Exit
          </button>
        </div>
      </div>
    </aside>
  );
}
