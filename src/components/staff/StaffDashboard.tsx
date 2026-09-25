'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store';
import { getOnboardingProgress } from '@/lib/onboarding';
import CompanyLatestAnnouncementBanner from './CompanyLatestAnnouncementBanner';
import StaffOnboardingBanner from './StaffOnboardingBanner';
import ResignationModal from './ResignationModal';
import EditPersonalInfoModal from './EditPersonalInfoModal';
import EditWorkRightsModal from './EditWorkRightsModal';
import EditEmergencyContactModal from './EditEmergencyContactModal';
import BankDetailsModal from './BankDetailsModal';
import UploadDocumentModal from './UploadDocumentModal';

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
  activeTab = 'dashboard',
  onNavigateTab,
}: {
  activeTab?: string;
  onNavigateTab?: (tab: string) => void;
}) {
  const { announcements, currentStaff, documentTypes } = useApp();
  const [showResignModal, setShowResignModal] = useState(false);
  const [activeModal, setActiveModal] = useState<'PERSONAL' | 'WORK_RIGHTS' | 'EMERGENCY' | 'BANK' | 'DOCUMENTS' | null>(null);

  const onboardingProgress = getOnboardingProgress(currentStaff, documentTypes);
  const isProfileIncomplete = currentStaff?.status === 'Pending' || onboardingProgress.missingDocuments.length > 0 || !onboardingProgress.isComplete;

  const handleOpenNextIncompleteModal = () => {
    const firstIncomplete = onboardingProgress.sections.find(s => !s.isDone);
    if (!firstIncomplete) {
      if (onNavigateTab) onNavigateTab('profile');
      return;
    }
    if (firstIncomplete.id === 'PERSONAL') setActiveModal('PERSONAL');
    else if (firstIncomplete.id === 'WORK_RIGHTS') setActiveModal('WORK_RIGHTS');
    else if (firstIncomplete.id === 'EMERGENCY') setActiveModal('EMERGENCY');
    else if (firstIncomplete.id === 'BANKING') setActiveModal('BANK');
    else if (firstIncomplete.id === 'DOCUMENTS') setActiveModal('DOCUMENTS');
  };

  // Profile management views: ALWAYS accessible so the staff member can complete their profile
  if (activeTab === 'profile' || activeTab === 'personal') {
    return <StaffFullProfileView initialTab="profile" />;
  }

  if (activeTab === 'documents') {
    return <StaffFullProfileView initialTab="documents" />;
  }

  if (activeTab === 'emergency') {
    return <StaffEmergencyView />;
  }

  // RESTRICTED TABS: If profile is not 100% complete, block all operational activity views
  if (isProfileIncomplete && (activeTab === 'leave' || activeTab === 'timesheet' || activeTab === 'employment' || activeTab === 'directory' || activeTab === 'support' || activeTab === 'resignation')) {
    const tabLabels: Record<string, string> = {
      leave: 'Leave Management Center',
      timesheet: 'Timesheet & Shift Records',
      employment: 'Employment Agreement & Details',
      directory: 'Company Staff Directory',
      support: 'Help Desk & Support Requests',
      resignation: 'Notice & Resignation Workflow',
    };

    return (
      <div className="p-6 lg:p-8 space-y-6 max-w-4xl mx-auto animate-in fade-in duration-150 text-xs font-sans">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-amber-300 shadow-md space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-2xl flex-shrink-0">
              🔒
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  Feature Restricted: {tabLabels[activeTab] || 'Staff Activity'}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-extrabold text-[10px]">
                  {onboardingProgress.percent}% Completed
                </span>
              </div>
              <p className="text-slate-600 text-xs leading-relaxed">
                All operational activities (including clocking in/out, viewing shift timesheets, requesting leave, and directory access) are strictly locked until your employee profile is <strong>100% complete</strong>.
              </p>
            </div>
          </div>

          {/* Missing Sections Checklist */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2.5">
            <h4 className="font-bold text-xs text-amber-950 uppercase tracking-wider">
              Required to Unlock Your Staff Portal ({onboardingProgress.completedCount} of {onboardingProgress.totalSections} Done):
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {onboardingProgress.sections.map(sec => (
                <div 
                  key={sec.id}
                  onClick={() => {
                    if (sec.id === 'PERSONAL') setActiveModal('PERSONAL');
                    else if (sec.id === 'WORK_RIGHTS') setActiveModal('WORK_RIGHTS');
                    else if (sec.id === 'EMERGENCY') setActiveModal('EMERGENCY');
                    else if (sec.id === 'BANKING') setActiveModal('BANK');
                    else if (sec.id === 'DOCUMENTS') setActiveModal('DOCUMENTS');
                  }}
                  className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-semibold cursor-pointer hover:shadow-xs transition ${
                    sec.isDone 
                      ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900' 
                      : 'bg-white border-amber-200 text-amber-950 shadow-xs hover:border-amber-400'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span>{sec.isDone ? '✅' : '⏳'}</span>
                    <span>{sec.title}</span>
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    sec.isDone ? 'bg-emerald-200/80 text-emerald-950' : 'bg-amber-100 text-amber-900'
                  }`}>
                    {sec.isDone ? 'Complete' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Onboarding Wizard Action */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            {onboardingProgress.isProfileInfoComplete && onboardingProgress.missingDocuments.length > 0 ? (
              <>
                <button
                  onClick={() => setActiveModal('DOCUMENTS')}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold shadow-md shadow-rose-600/25 transition cursor-pointer text-center"
                >
                  Upload Required Documents ({onboardingProgress.missingDocuments.length} Pending) →
                </button>
                <p className="text-[11px] text-slate-500 text-center sm:text-left">
                  Upload all compulsory documents above to unlock all tabs and operational features.
                </p>
              </>
            ) : (
              <>
                <button
                  onClick={handleOpenNextIncompleteModal}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold shadow-md shadow-amber-600/25 transition cursor-pointer text-center"
                >
                  Complete Profile Setup ({onboardingProgress.percent}%) →
                </button>
                <p className="text-[11px] text-slate-500 text-center sm:text-left">
                  Complete all required profile information and upload compulsory documents to unlock full portal access.
                </p>
              </>
            )}
          </div>
        </div>

        {/* Embedded Onboarding Form Banner */}
        <StaffOnboardingBanner />

        {/* Direct Action Modals */}
        {activeModal === 'PERSONAL' && (
          <EditPersonalInfoModal onClose={() => setActiveModal(null)} />
        )}
        {activeModal === 'WORK_RIGHTS' && (
          <EditWorkRightsModal onClose={() => setActiveModal(null)} />
        )}
        {activeModal === 'EMERGENCY' && (
          <EditEmergencyContactModal onClose={() => setActiveModal(null)} />
        )}
        {activeModal === 'BANK' && (
          <BankDetailsModal onClose={() => setActiveModal(null)} />
        )}
        {activeModal === 'DOCUMENTS' && (
          <UploadDocumentModal onClose={() => setActiveModal(null)} />
        )}
      </div>
    );
  }

  // Active / Completed Staff Views
  if (activeTab === 'leave') {
    return <StaffLeaveView />;
  }

  if (activeTab === 'employment') {
    return <StaffEmploymentView />;
  }

  if (activeTab === 'timesheet') {
    return <StaffTimesheetView />;
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

  // DEFAULT TAB ('dashboard'):
  // If profile is incomplete: show Onboarding Banner prominently and lock operational features
  if (isProfileIncomplete) {
    return (
      <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200 text-xs font-sans">
        {/* Prominent Alert Card when Profile Info is complete but Compulsory Documents are pending */}
        {onboardingProgress.isProfileInfoComplete && onboardingProgress.missingDocuments.length > 0 && (
          <div className="rounded-3xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 p-5 sm:p-6 text-white shadow-lg space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center text-2xl shrink-0 shadow-inner">
                  📄
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-black tracking-tight text-white">
                      Action Required: Pending Compulsory Document{onboardingProgress.missingDocuments.length > 1 ? 's' : ''} to Upload
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-white text-amber-900 font-black text-[10px] shadow-xs">
                      {onboardingProgress.missingDocuments.length} Required
                    </span>
                  </div>
                  <p className="text-amber-100 text-xs leading-relaxed max-w-2xl">
                    Your 4 profile sections are complete and your account is <strong>Active</strong>. However, operational features (Timesheets, Shift punch, Leave Requests, and Resignation) will remain locked until your compulsory documents are uploaded.
                  </p>
                  <p className="text-white font-bold text-xs pt-0.5">
                    Pending upload: <span className="underline decoration-amber-200">{onboardingProgress.missingDocuments.join(', ')}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal('DOCUMENTS')}
                className="px-5 py-3 rounded-2xl bg-white hover:bg-amber-50 text-amber-900 font-extrabold text-xs shadow-md transition cursor-pointer shrink-0 text-center"
              >
                Upload Required Documents →
              </button>
            </div>
          </div>
        )}

        {/* Onboarding Profile Completion Banner */}
        <StaffOnboardingBanner />

        {/* Locked Portal Features Notice for Incomplete Profile Setup */}
        {!onboardingProgress.isProfileInfoComplete && (
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-amber-200 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-xl">🔒</span>
              <div>
                <h3 className="text-sm font-black text-slate-800 tracking-tight">
                  Staff Portal Features Locked (Profile Setup in Progress)
                </h3>
                <p className="text-slate-500 text-xs mt-0.5">
                  Shift Clock punch, timesheet records, leave applications, and company activities are locked until you complete all 4 onboarding sections and upload required documents.
                </p>
              </div>
            </div>
            
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-slate-700">
                <span className="font-bold">Current Status:</span> {onboardingProgress.percent}% completed ({onboardingProgress.totalSections - onboardingProgress.completedCount} remaining)
              </div>
              <button
                onClick={handleOpenNextIncompleteModal}
                className="text-[11px] text-amber-800 font-bold bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-xl border border-amber-300 transition cursor-pointer"
              >
                Continue Setup →
              </button>
            </div>
          </div>
        )}

        {/* Direct Action Modals */}
        {activeModal === 'PERSONAL' && (
          <EditPersonalInfoModal onClose={() => setActiveModal(null)} />
        )}
        {activeModal === 'WORK_RIGHTS' && (
          <EditWorkRightsModal onClose={() => setActiveModal(null)} />
        )}
        {activeModal === 'EMERGENCY' && (
          <EditEmergencyContactModal onClose={() => setActiveModal(null)} />
        )}
        {activeModal === 'BANK' && (
          <BankDetailsModal onClose={() => setActiveModal(null)} />
        )}
        {activeModal === 'DOCUMENTS' && (
          <UploadDocumentModal onClose={() => setActiveModal(null)} />
        )}
      </div>
    );
  }

  // Fully completed profile: Normal dashboard with activities
  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200 text-xs font-sans">
      {/* Spotlight: Company's Latest Announcement */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/70 shadow-sm space-y-4">
        <h3 className="text-sm font-black text-slate-800 tracking-tight">Activities &amp; Company Bulletins</h3>
        <CompanyLatestAnnouncementBanner />
      </div>

      {/* Modals */}
      {showResignModal && <ResignationModal onClose={() => setShowResignModal(false)} />}
    </div>
  );
}
