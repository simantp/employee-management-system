'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store';
import { getOnboardingProgress } from '@/lib/onboarding';
import EditPersonalInfoModal from './EditPersonalInfoModal';
import EditWorkRightsModal from './EditWorkRightsModal';
import EditEmergencyContactModal from './EditEmergencyContactModal';
import BankDetailsModal from './BankDetailsModal';
import UploadDocumentModal from './UploadDocumentModal';

export default function StaffOnboardingBanner() {
  const { currentStaff, documentTypes } = useApp();

  const [activeModal, setActiveModal] = useState<'PERSONAL' | 'WORK_RIGHTS' | 'EMERGENCY' | 'BANK' | 'DOCUMENTS' | null>(null);

  if (!currentStaff) return null;

  const isPending = currentStaff.status === 'Pending';
  const progress = getOnboardingProgress(currentStaff, documentTypes);

  const steps = [
    {
      id: 'PERSONAL',
      title: 'Personal Information',
      desc: 'Mobile number, date of birth & residential address',
      isDone: progress.sections.find(s => s.id === 'PERSONAL')?.isDone ?? false,
      buttonLabel: (progress.sections.find(s => s.id === 'PERSONAL')?.isDone) ? 'Update Details' : 'Fill Personal Info',
    },
    {
      id: 'WORK_RIGHTS',
      title: 'Legal Work Rights',
      desc: 'Australian citizenship or VEVO visa declaration',
      isDone: progress.sections.find(s => s.id === 'WORK_RIGHTS')?.isDone ?? false,
      buttonLabel: (progress.sections.find(s => s.id === 'WORK_RIGHTS')?.isDone) ? 'Update Work Rights' : 'Declare Work Rights',
    },
    {
      id: 'EMERGENCY',
      title: 'Emergency Contact',
      desc: 'Primary next of kin name, relationship & mobile',
      isDone: progress.sections.find(s => s.id === 'EMERGENCY')?.isDone ?? false,
      buttonLabel: (progress.sections.find(s => s.id === 'EMERGENCY')?.isDone) ? 'Update Contact' : 'Add Emergency Contact',
    },
    {
      id: 'BANK',
      title: 'Banking & TFN',
      desc: 'Bank BSB, account number & superannuation choice',
      isDone: progress.sections.find(s => s.id === 'BANKING')?.isDone ?? false,
      buttonLabel: (progress.sections.find(s => s.id === 'BANKING')?.isDone) ? 'Update Banking' : 'Provide Bank Details',
    },
  ];

  if (progress.requiredDocumentTypes.length > 0) {
    const docProgress = progress.sections.find(s => s.id === 'DOCUMENTS');
    steps.push({
      id: 'DOCUMENTS',
      title: 'Compulsory Documents',
      desc: docProgress?.isDone
        ? 'All mandatory compliance documents uploaded'
        : `Required: ${progress.missingDocuments.join(', ')}`,
      isDone: docProgress?.isDone ?? false,
      buttonLabel: docProgress?.isDone ? 'Upload More / View' : 'Upload Documents',
    });
  }

  const completedCount = progress.completedCount;
  const totalSections = progress.totalSections;
  const progressPercent = progress.percent;

  const hasPendingDocs = progress.missingDocuments.length > 0;
  if (!isPending && !hasPendingDocs) return null;

  const isProfileInfoDone = progress.isProfileInfoComplete;

  return (
    <>
      <div className="rounded-3xl bg-gradient-to-br from-amber-50/90 via-white to-orange-50/60 border-2 border-amber-300 p-5 sm:p-7 shadow-lg text-slate-800 space-y-5 animate-in fade-in duration-200">
        
        {/* Banner Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-200/80 pb-4">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  {isProfileInfoDone && hasPendingDocs
                    ? 'Account Status: Active • Pending Required Documents'
                    : 'Account Status: Pending Profile Setup'}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-extrabold text-[10px] border border-amber-300 animate-pulse">
                  {completedCount} of {totalSections} Completed
                </span>
                {hasPendingDocs && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-extrabold text-[10px] border border-rose-200">
                    {progress.missingDocuments.length} Required Doc{progress.missingDocuments.length > 1 ? 's' : ''} Pending
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                {isProfileInfoDone && hasPendingDocs
                  ? 'Your profile information is completed! Please upload your pending required document(s) below to activate every tab across your portal.'
                  : 'Welcome to HsCreations! Please complete the onboarding sections and upload all compulsory compliance documents below to activate your staff profile.'}
              </p>
            </div>
          </div>

          <div className="text-right flex-shrink-0">
            <span className="text-xl sm:text-2xl font-black font-mono text-amber-600">
              {progressPercent}%
            </span>
            <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">
              Profile Ready
            </span>
          </div>
        </div>

        {/* Compulsory Documents Notice */}
        {hasPendingDocs && (
          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-amber-50/90 border border-amber-300 text-amber-950 text-xs shadow-xs">
            <div className="px-2 py-0.5 rounded-md bg-amber-200 text-amber-950 font-extrabold text-[10px] tracking-wide shrink-0 uppercase mt-0.5">
              Action Required
            </div>
            <div className="space-y-0.5">
              <p className="font-extrabold text-slate-900">
                Pending Compulsory Documents to Upload Before All Tabs Are Active
              </p>
              <p className="text-slate-600 leading-relaxed">
                You have pending required document{progress.missingDocuments.length > 1 ? 's' : ''} to upload: <span className="font-bold text-amber-900">{progress.missingDocuments.join(', ')}</span>.
                All operational tabs (Timesheet records, Leave management, etc.) will unlock once these documents are uploaded.
              </p>
            </div>
          </div>
        )}

        {/* Dynamic Visual Progress Bar */}
        <div className="space-y-1.5">
          <div className="w-full h-2.5 rounded-full bg-slate-200 overflow-hidden p-0.5 border border-slate-300">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-500 transition-all duration-500 shadow-md shadow-amber-500/30"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-500 font-semibold px-1">
            <span>Stage 1: Profile Entry</span>
            <span>{completedCount === totalSections ? 'All Complete! Transitioning to Active...' : `${totalSections - completedCount} section${totalSections - completedCount > 1 ? 's' : ''} remaining`}</span>
          </div>
        </div>

        {/* Interactive Checklist Step Tiles */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 ${steps.length > 4 ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-3.5 pt-1`}>
          {steps.map((step, idx) => (
            <div 
              key={step.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                step.isDone 
                  ? 'bg-emerald-50/70 border-emerald-300 shadow-xs' 
                  : 'bg-white border-amber-300/90 hover:border-amber-400 shadow-xs'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono font-bold text-slate-400">
                    STEP 0{idx + 1}
                  </span>
                  {step.isDone ? (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px] border border-emerald-300 flex items-center gap-1">
                      Done
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold text-[10px] border border-amber-300">
                      Required
                    </span>
                  )}
                </div>

                <h4 className="font-extrabold text-slate-900 text-xs">
                  {step.title}
                </h4>
                <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                  {step.desc}
                </p>
              </div>

              <button
                type="button"
                data-onboarding-cta={!step.isDone ? "true" : undefined}
                onClick={() => setActiveModal(step.id as any)}
                className={`w-full py-2 px-3 rounded-xl font-bold text-xs transition cursor-pointer ${
                  step.isDone
                    ? 'bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs'
                    : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                }`}
              >
                {step.buttonLabel} →
              </button>
            </div>
          ))}
        </div>

      </div>

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
    </>
  );
}
