'use client';

import React, { useState, useEffect } from 'react';
import { UserCheck } from 'lucide-react';
import { useApp } from '@/lib/store';
import CompanyLatestAnnouncementBanner from './CompanyLatestAnnouncementBanner';
import BankDetailsModal from './BankDetailsModal';
import EditProfileModal from './EditProfileModal';
import EditWorkRightsModal from './EditWorkRightsModal';
import ResignationModal from './ResignationModal';

// Dedicated Detailed Views
import StaffFullProfileView from './views/StaffFullProfileView';
import StaffDocumentsView from './views/StaffDocumentsView';
import StaffLeaveView from './views/StaffLeaveView';
import StaffPayrollView from './views/StaffPayrollView';
import StaffEmploymentView from './views/StaffEmploymentView';
import StaffTimesheetView from './views/StaffTimesheetView';
import StaffTrainingView from './views/StaffTrainingView';
import StaffEmergencyView from './views/StaffEmergencyView';
import StaffDirectoryView from './views/StaffDirectoryView';
import StaffAnnouncementsView from './views/StaffAnnouncementsView';
import StaffSupportView from './views/StaffSupportView';

export default function StaffDashboard({
  activeTab = 'dashboard'
}: {
  activeTab?: string;
}) {
  const { currentStaff } = useApp();
  
  const [showBankModal, setShowBankModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showWorkRightsModal, setShowWorkRightsModal] = useState(false);
  const [showResignModal, setShowResignModal] = useState(false);
  const [sydneyTimeStr, setSydneyTimeStr] = useState('');
  const [greeting, setGreeting] = useState('Good day');

  useEffect(() => {
    const updateTime = () => {
      try {
        const now = new Date();
        const sydneyHours = parseInt(now.toLocaleTimeString('en-AU', { timeZone: 'Australia/Sydney', hour: '2-digit', hour12: false }));
        if (sydneyHours < 12) setGreeting('Good morning');
        else if (sydneyHours < 17) setGreeting('Good afternoon');
        else setGreeting('Good evening');

        setSydneyTimeStr(now.toLocaleTimeString('en-AU', { timeZone: 'Australia/Sydney', hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      } catch (e) {}
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Check if staff has updated working hours & visa status in profile
  const hasHoursConfirmed = Boolean(
    currentStaff.workingHoursConfirmed || 
    (currentStaff.workingHours && currentStaff.workingHours > 0)
  );

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

  if (activeTab === 'training') {
    return <StaffTrainingView />;
  }

  if (activeTab === 'emergency') {
    return <StaffEmergencyView />;
  }

  if (activeTab === 'directory') {
    return <StaffDirectoryView />;
  }

  if (activeTab === 'announcements') {
    return <StaffAnnouncementsView />;
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

  // DEFAULT TAB ('dashboard'): Clean Dynamic Hero & Latest Announcement
  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200 text-xs font-sans">
      
      {/* Dynamic Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden p-6 sm:p-8 border border-slate-800 shadow-xl mesh-gradient-dark text-white">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold bg-orange-500/20 text-orange-300 border border-orange-500/30 backdrop-blur-md">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse"></span>
                <span>Sydney Live • {sydneyTimeStr || 'AEST'}</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-slate-300 border border-white/10">
                {currentStaff.workLocation || 'Sydney, NSW'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
              <span>{greeting}, {currentStaff.firstName}</span>
              <span className="text-2xl animate-bounce">👋</span>
            </h1>

            {/* Subtitle below greeting: ONLY show assigned department and confirmed hours */}
            <p className="text-xs text-slate-300 font-medium max-w-xl flex flex-wrap items-center gap-1.5">
              <span>{currentStaff.jobTitle || 'Staff Member'}</span>
              {currentStaff.department ? (
                <>
                  <span className="text-slate-500">•</span>
                  <strong className="text-orange-400">{currentStaff.department}</strong>
                </>
              ) : null}
              {hasHoursConfirmed && currentStaff.workingHours ? (
                <>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-300 font-bold">{currentStaff.workingHours} Hours / Week</span>
                </>
              ) : null}
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-shrink-0">
            <button
              onClick={() => setShowWorkRightsModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 px-4 py-2.5 rounded-2xl text-xs font-black shadow-lg shadow-orange-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <UserCheck className="w-4 h-4" />
              <span>Update Visa &amp; Working Hours</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top Banner: Company's Latest Announcement (Posted by Admin/Super Admin) */}
      <CompanyLatestAnnouncementBanner />

      {/* Modals */}
      {showWorkRightsModal && <EditWorkRightsModal onClose={() => setShowWorkRightsModal(false)} />}
      {showBankModal && <BankDetailsModal onClose={() => setShowBankModal(false)} />}
      {showEditModal && <EditProfileModal onClose={() => setShowEditModal(false)} />}
      {showResignModal && <ResignationModal onClose={() => setShowResignModal(false)} />}
    </div>
  );
}
