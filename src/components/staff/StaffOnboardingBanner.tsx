'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store';
import { getOnboardingProgress } from '@/lib/onboarding';
import EditPersonalInfoModal from './EditPersonalInfoModal';
import EditWorkRightsModal from './EditWorkRightsModal';
import EditEmergencyContactModal from './EditEmergencyContactModal';
import BankDetailsModal from './BankDetailsModal';

export default function StaffOnboardingBanner() {
  const { currentStaff } = useApp();

  const [activeModal, setActiveModal] = useState<'PERSONAL' | 'WORK_RIGHTS' | 'EMERGENCY' | 'BANK' | null>(null);

  if (!currentStaff) return null;

  const isPending = currentStaff.status === 'Pending';
  const progress = getOnboardingProgress(currentStaff);

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

  const completedCount = progress.completedCount;
  const progressPercent = progress.percent;

  if (!isPending || progress.isComplete) return null;

  return (
    <>
      <div className="rounded-3xl bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 border-2 border-amber-500/50 p-5 sm:p-7 shadow-2xl text-slate-100 space-y-5 animate-in fade-in duration-200">
        
        {/* Banner Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Account Status: Pending Profile Setup
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-extrabold text-[10px] border border-amber-500/40 animate-pulse">
                  {completedCount} of 4 Completed
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Welcome to HsCreations! Please complete the 4 onboarding sections below to activate your staff profile.
              </p>
            </div>
          </div>

          <div className="text-right flex-shrink-0">
            <span className="text-xl sm:text-2xl font-black font-mono text-amber-400">
              {progressPercent}%
            </span>
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
              Profile Ready
            </span>
          </div>
        </div>

        {/* Dynamic Visual Progress Bar */}
        <div className="space-y-1.5">
          <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden p-0.5 border border-slate-700">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-500 transition-all duration-500 shadow-lg shadow-amber-500/30"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 font-semibold px-1">
            <span>Stage 1: Profile Entry</span>
            <span>{completedCount === 4 ? 'All Complete! Transitioning to Active...' : `${4 - completedCount} sections remaining`}</span>
          </div>
        </div>

        {/* 4 Interactive Checklist Step Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-1">
          {steps.map((step, idx) => (
            <div 
              key={step.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                step.isDone 
                  ? 'bg-slate-900/90 border-emerald-500/40 shadow-sm shadow-emerald-950/20' 
                  : 'bg-slate-950/80 border-amber-500/40 hover:border-amber-400 shadow-inner'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono font-bold text-slate-500">
                    STEP 0{idx + 1}
                  </span>
                  {step.isDone ? (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold text-[10px] border border-emerald-500/30 flex items-center gap-1">
                      Done
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold text-[10px] border border-amber-500/30">
                      Required
                    </span>
                  )}
                </div>

                <h4 className="font-extrabold text-white text-xs">
                  {step.title}
                </h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                  {step.desc}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveModal(step.id as any)}
                className={`w-full py-2 px-3 rounded-xl font-bold text-[11px] transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  step.isDone
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                    : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-md shadow-amber-500/20 hover:scale-[1.02]'
                }`}
              >
                <span>{step.buttonLabel}</span>
                <span>→</span>
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
    </>
  );
}
