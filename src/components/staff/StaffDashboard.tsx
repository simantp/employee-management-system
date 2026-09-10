'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store';
import CompanyLatestAnnouncementBanner from './CompanyLatestAnnouncementBanner';
import ResignationModal from './ResignationModal';

// Dedicated Detailed Views
import StaffFullProfileView from './views/StaffFullProfileView';
import StaffDocumentsView from './views/StaffDocumentsView';
import StaffLeaveView from './views/StaffLeaveView';
import StaffEmploymentView from './views/StaffEmploymentView';
import StaffTimesheetView from './views/StaffTimesheetView';
import StaffEmergencyView from './views/StaffEmergencyView';
import StaffDirectoryView from './views/StaffDirectoryView';
import StaffSupportView from './views/StaffSupportView';

export default function StaffDashboard({
  activeTab = 'dashboard'
}: {
  activeTab?: string;
}) {
  const { announcements } = useApp();
  const [showResignModal, setShowResignModal] = useState(false);

  // Dedicated Detailed Workspace Views for Sidebar Navigation
  if (activeTab === 'profile' || activeTab === 'personal') {
    return <StaffFullProfileView />;
  }

  if (activeTab === 'documents') {
    return <StaffDocumentsView />;
  }

  if (activeTab === 'leave') {
    return <StaffLeaveView />;
  }

  if (activeTab === 'employment') {
    return <StaffEmploymentView />;
  }

  if (activeTab === 'timesheet') {
    return <StaffTimesheetView />;
  }

  if (activeTab === 'emergency') {
    return <StaffEmergencyView />;
  }

  if (activeTab === 'directory') {
    return <StaffDirectoryView />;
  }

  if (activeTab === 'support') {
    return <StaffSupportView />;
  }

  if (activeTab === 'resignation') {
    return (
      <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-150 text-xs font-sans">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Notice &amp; Resignation</h2>
          <p className="text-slate-500 mt-0.5">
            Official 4-week Australian notice workflow &amp; handover checklist
          </p>
        </div>
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4 max-w-xl">
          <p className="text-slate-600">
            Under your employment agreement, a minimum of <strong>4 weeks advance written notice</strong> is required prior to departure.
          </p>
          <button
            onClick={() => setShowResignModal(true)}
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-md shadow-rose-600/20 cursor-pointer"
          >
            Submit Formal 4-Week Notice
          </button>
        </div>
        {showResignModal && <ResignationModal onClose={() => setShowResignModal(false)} />}
      </div>
    );
  }

  // DEFAULT TAB ('dashboard'): Clean View Showing ONLY Company Announcements (Greeting section removed)
  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200 text-xs font-sans">
      
      {/* Spotlight: Company's Latest Announcement */}
      <CompanyLatestAnnouncementBanner />

      {/* Full Announcements Feed */}
      {announcements && announcements.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 tracking-tight">
              All Company Announcements &amp; Workplace Notices
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              {announcements.length} {announcements.length === 1 ? 'Notice' : 'Notices'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {announcements.map((a) => (
              <div 
                key={a.id} 
                className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-3 flex flex-col justify-between hover:border-slate-300 transition"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-800 border border-orange-200">
                      {a.category || 'Company Notice'}
                    </span>
                    <span className="text-slate-400 text-[10px] font-medium font-mono">
                      {a.date}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-900 leading-snug">
                    {a.title}
                  </h4>
                  <p className="text-slate-600 leading-relaxed text-xs">
                    {a.content}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Author: <strong className="text-slate-700 font-semibold">{a.author}</strong></span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-50 text-slate-500 font-bold border border-slate-200">
                    {a.authorRole || 'Management'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(!announcements || announcements.length === 0) && (
        <div className="bg-white rounded-3xl p-12 border border-slate-200/80 text-center space-y-2 shadow-xs">
          <span className="text-3xl block mb-2">📢</span>
          <h3 className="text-sm font-bold text-slate-900">No Announcements at this time</h3>
          <p className="text-slate-500 text-xs max-w-sm mx-auto">
            When management posts new bulletins or policy updates, they will appear here automatically.
          </p>
        </div>
      )}

      {/* Modals */}
      {showResignModal && <ResignationModal onClose={() => setShowResignModal(false)} />}
    </div>
  );
}
