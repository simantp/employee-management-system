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
    <aside className="w-64 bg-white text-slate-700 flex flex-col h-screen sticky top-0 flex-shrink-0 border-r border-slate-200 select-none z-20 font-sans shadow-xs">
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
                ADMIN
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium tracking-tight">
              Sydney Plant Operations
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-200">
        {navItems.map(item => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-all duration-150 relative cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-semibold'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  isActive 
                    ? 'bg-white/20 text-white' 
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Settings, Leave Approval Records & Audit Log Section */}
      <div className="p-3 border-t border-slate-100 space-y-1.5">
        <button
          onClick={() => handleNav('settings')}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-all duration-150 cursor-pointer ${
            activeTab === 'settings'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-semibold'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {activeTab === 'settings' && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
            <span>Settings</span>
          </div>
        </button>

        <button
          onClick={() => handleNav('approvals')}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-all duration-150 relative cursor-pointer ${
            activeTab === 'approvals'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-semibold'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {activeTab === 'approvals' && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
            <span>Leave Approval Records</span>
          </div>
          {pendingApprovals > 0 && (
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              activeTab === 'approvals'
                ? 'bg-white/20 text-white'
                : 'bg-amber-500/10 text-amber-700 border border-amber-500/30 animate-pulse'
            }`}>
              {pendingApprovals}
            </span>
          )}
        </button>

        <button
          onClick={() => handleNav('audit-log')}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-all duration-150 cursor-pointer ${
            activeTab === 'audit-log'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-semibold'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {activeTab === 'audit-log' && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
            <span>Audit Log</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Live
          </span>
        </button>
      </div>

      <div className="p-3 border-t border-slate-100 bg-slate-50/80">
        <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200/80 shadow-xs hover:border-slate-300 transition">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-xs">
              AU
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold text-slate-900">Admin User</span>
              <span className="text-[11px] text-blue-600 font-semibold">Super Admin</span>
            </div>
          </div>
          <button 
            onClick={() => logout()}
            className="text-[11px] font-bold text-slate-400 hover:text-rose-600 px-2 py-1 rounded transition cursor-pointer" 
            title="Sign Out"
          >
            Sign Out
          </button>
        </div>
      </div>
    </aside>
  );
}
