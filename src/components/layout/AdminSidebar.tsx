'use client';

import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  UserCheck, 
  Briefcase, 
  FileText, 
  ShieldCheck, 
  CreditCard, 
  PhoneCall, 
  BarChart3, 
  Bell, 
  KeyRound, 
  History, 
  Settings, 
  ChevronDown, 
  ChevronRight,
  LogOut,
  Building2,
  CalendarCheck2,
  Clock
} from 'lucide-react';
import { useApp } from '@/lib/store';

export default function AdminSidebar({ 
  activeTab = 'dashboard', 
  onSelectTab 
}: { 
  activeTab?: string; 
  onSelectTab?: (tab: string) => void;
}) {
  const { alerts, leaveRequests, employees, activeWorkingStaffCount } = useApp();
  const [complianceOpen, setComplianceOpen] = useState(true);

  const pendingApprovals = leaveRequests.filter(r => r.status === 'PENDING').length;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null },
    { id: 'timecards', label: 'Timecard & Shifts', icon: Clock, badge: activeWorkingStaffCount > 0 ? `${activeWorkingStaffCount} Active` : null },
    { id: 'employees', label: 'Employees', icon: Users, badge: String(employees.length) },
    { id: 'approvals', label: 'Leave Approvals', icon: CalendarCheck2, badge: pendingApprovals > 0 ? String(pendingApprovals) : null },
    { id: 'personal-details', label: 'Personal Details', icon: UserCheck, badge: null },
    { id: 'employment', label: 'Employment', icon: Briefcase, badge: null },
    { id: 'documents', label: 'Documents', icon: FileText, badge: null },
  ];

  const complianceSubItems = [
    { id: 'visa-alerts', label: 'Visa Tracking', count: '3 Expiring' },
    { id: 'license-alerts', label: 'Driver Licenses', count: '45d' },
    { id: 'whs-policies', label: 'WHS Policies', count: null },
  ];

  const bottomNavItems = [
    { id: 'payroll', label: 'Payroll & Banking', icon: CreditCard, badge: 'Encrypted' },
    { id: 'emergency', label: 'Emergency Contacts', icon: PhoneCall, badge: null },
    { id: 'reports', label: 'Reports', icon: BarChart3, badge: null },
    { id: 'alerts', label: 'Alerts & Reminders', icon: Bell, badge: String(alerts.length) },
    { id: 'roles', label: 'Roles & Permissions', icon: KeyRound, badge: null },
    { id: 'audit-log', label: 'Audit Log', icon: History, badge: 'Live' },
    { id: 'settings', label: 'Settings', icon: Settings, badge: null },
  ];

  const handleNav = (id: string) => {
    if (onSelectTab) onSelectTab(id);
  };

  return (
    <aside className="w-64 bg-navy-950 text-slate-300 flex flex-col h-screen sticky top-0 flex-shrink-0 border-r border-slate-800 select-none z-20">
      <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-white px-2 py-1 rounded-xl shadow-md border border-slate-700/60 flex items-center justify-center">
            <img 
              src="/images/hs-creations-logo.png" 
              alt="HsCreations" 
              className="h-6 object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-white font-bold text-xs tracking-wide">HSCREATIONS</h2>
              <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
                ADMIN
              </span>
            </div>
            <span className="text-[10px] font-semibold text-orange-400 tracking-wider uppercase">
              Sydney Command Center
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-thin scrollbar-thumb-slate-800">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  isActive 
                    ? 'bg-white/20 text-white' 
                    : item.id === 'approvals' 
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
                    : 'bg-slate-800 text-slate-300'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        <div className="pt-2">
          <button
            onClick={() => setComplianceOpen(!complianceOpen)}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/60 transition"
          >
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>Compliance</span>
            </div>
            {complianceOpen ? (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>

          {complianceOpen && (
            <div className="ml-7 pl-3 border-l border-slate-800 space-y-1 mt-1">
              {complianceSubItems.map(sub => (
                <button
                  key={sub.id}
                  onClick={() => handleNav(sub.id)}
                  className={`w-full flex items-center justify-between py-1.5 px-2.5 rounded-lg text-[11px] font-medium transition ${
                    activeTab === sub.id
                      ? 'text-cyan-400 bg-cyan-950/40 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <span>{sub.label}</span>
                  {sub.count && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {sub.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="pt-2 border-t border-slate-800/60 space-y-1">
          {bottomNavItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    item.badge === 'Live'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse'
                      : item.badge === 'Encrypted'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'bg-slate-800 text-slate-300'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-3.5 border-t border-slate-800/80 bg-navy-900/60">
        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/40 hover:bg-slate-800/80 transition cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-xs shadow">
              AU
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold text-white">Admin User</span>
              <span className="text-[11px] text-cyan-400 font-medium">Super Admin</span>
            </div>
          </div>
          <button className="text-slate-400 hover:text-rose-400 p-1 transition" title="Logout">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
