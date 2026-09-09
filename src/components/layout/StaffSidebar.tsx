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
  const { currentStaff, logout } = useApp();

  const sections = [
    {
      title: 'OVERVIEW',
      items: [
        { id: 'dashboard', label: 'Dashboard', badge: null },
        { id: 'profile', label: 'My Profile', badge: null },
        { id: 'documents', label: 'Documents', badge: currentStaff.documents.length > 0 ? String(currentStaff.documents.length) : null },
      ]
    },
    {
      title: 'TIME & WORKPLACE',
      items: [
        { id: 'leave', label: 'Leave Management', badge: `${currentStaff.leaveBalance.annual}d` },
        { id: 'timesheet', label: 'Timesheet & Roster', badge: '38h' },
        { id: 'employment', label: 'Employment Details', badge: null },
      ]
    },
    {
      title: 'PEOPLE & DIRECTORY',
      items: [
        { id: 'emergency', label: 'Emergency Contacts', badge: null },
        { id: 'directory', label: 'Company Directory', badge: null },
      ]
    },
    {
      title: 'LIFECYCLE',
      items: [
        { id: 'resignation', label: 'Resignation Notice', badge: null },
        { id: 'support', label: 'HR Helpdesk', badge: null },
      ]
    }
  ];

  const handleNav = (id: string) => {
    if (onSelectTab) onSelectTab(id);
  };

  return (
    <aside className="w-64 bg-[#090d16] text-slate-300 flex flex-col h-screen sticky top-0 flex-shrink-0 border-r border-slate-800/60 select-none z-20 font-sans">
      
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800/60 flex items-center justify-between">
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
              <h2 className="text-white font-black text-xs tracking-wider">HSCREATIONS</h2>
              <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
                STAFF
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium tracking-tight">
              Sydney Printing &amp; Design
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Grouped Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
        {sections.map((section, sIndex) => (
          <div key={sIndex} className="space-y-1">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1.5">
              {section.title}
            </h3>

            {section.items.map(item => {
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs transition-all duration-150 group relative ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600/20 to-cyan-600/10 text-cyan-300 border border-cyan-500/30 font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 font-semibold'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0 animate-pulse" />}
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-mono font-bold flex-shrink-0 ${
                      isActive 
                        ? 'bg-cyan-400/20 text-cyan-300 border border-cyan-400/30' 
                        : 'bg-slate-800/80 text-slate-400 border border-slate-700/50'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Bottom Sleek User Bar */}
      <div className="p-3 border-t border-slate-800/60 bg-[#070b12]">
        <div 
          onClick={() => handleNav('profile')}
          className="p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800/80 flex items-center justify-between gap-3 cursor-pointer transition group"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {currentStaff.avatarUrl ? (
              <img 
                src={currentStaff.avatarUrl} 
                alt={currentStaff.firstName} 
                className="w-8 h-8 rounded-lg object-cover ring-1 ring-cyan-400/50 flex-shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-300 font-bold text-xs flex-shrink-0">
                {currentStaff.firstName ? currentStaff.firstName.charAt(0) : 'U'}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h4 className="text-white font-bold text-xs truncate group-hover:text-cyan-300 transition">
                {currentStaff.firstName} {currentStaff.lastName}
              </h4>
              <p className="text-[10px] text-slate-400 truncate">
                {currentStaff.jobTitle || 'Staff Member'}
              </p>
            </div>
          </div>

          <div className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-emerald-400/20 animate-pulse flex-shrink-0" title="Active on shift" />
        </div>
      </div>

    </aside>
  );
}
