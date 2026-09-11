'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store';
import CompanyLatestAnnouncementBanner from './CompanyLatestAnnouncementBanner';
import StaffOnboardingBanner from './StaffOnboardingBanner';
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
  const { announcements, currentStaff } = useApp();
  const [showResignModal, setShowResignModal] = useState(false);

  // Dedicated Detailed Workspace Views for Sidebar Navigation
  if (activeTab === 'profile' || activeTab === 'personal') {
    return <StaffFullProfileView initialTab="profile" />;
  }

  if (activeTab === 'documents') {
    return <StaffFullProfileView initialTab="documents" />;
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

  // DEFAULT TAB ('dashboard'): Shows Onboarding Banner (if pending) + Latest Announcement
  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200 text-xs font-sans">
      
      {/* Onboarding Profile Completion Banner (renders only when Pending) */}
      <StaffOnboardingBanner />

      {/* Spotlight: Company's Latest Announcement */}
      <CompanyLatestAnnouncementBanner />

      {/* Modals */}
      {showResignModal && <ResignationModal onClose={() => setShowResignModal(false)} />}
    </div>
  );
}
