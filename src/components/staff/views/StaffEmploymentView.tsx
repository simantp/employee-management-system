'use client';

import React from 'react';
import { Briefcase, Clock, Calendar, ShieldCheck, MapPin, User } from 'lucide-react';
import { useApp } from '@/lib/store';

export default function StaffEmploymentView() {
  const { currentStaff } = useApp();

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-150 text-xs font-sans">
      <div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight">Employment &amp; Role Details</h2>
        <p className="text-slate-500 mt-0.5">
          HsCreations official contract specifications, department, supervisor &amp; start date
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="font-extrabold text-sm text-slate-900 border-b border-slate-100 pb-2.5 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-orange-600" />
            <span>Position &amp; Department Specifications</span>
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-slate-400 font-bold text-[10px] uppercase block">Job Title</span>
              <span className="font-bold text-slate-900 text-xs">{currentStaff.jobTitle || 'Staff Member'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold text-[10px] uppercase block">Department</span>
              {currentStaff.department ? (
                <span className="font-black text-orange-600 text-xs">{currentStaff.department}</span>
              ) : (
                <span className="font-bold text-slate-500 text-xs italic bg-slate-100 px-2 py-0.5 rounded">
                  Pending Admin Assignment
                </span>
              )}
            </div>
            <div>
              <span className="text-slate-400 font-bold text-[10px] uppercase block">Employment Start Date</span>
              <span className="font-mono font-black text-slate-900 text-xs">{currentStaff.startDate || 'Date of Registration'}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Managed by HsCreations HR Admin</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold text-[10px] uppercase block">Employment Status</span>
              <span className="font-bold text-emerald-600 text-xs bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 inline-block">
                {currentStaff.status || 'Active'} Permanent
              </span>
            </div>
            <div>
              <span className="text-slate-400 font-bold text-[10px] uppercase block">Work Location</span>
              <span className="font-bold text-slate-900 text-xs">{currentStaff.workLocation || 'Sydney, NSW'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold text-[10px] uppercase block">Direct Supervisor</span>
              <span className="font-bold text-slate-900 text-xs">{currentStaff.reportsTo || 'Operations Lead'}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="font-extrabold text-sm text-slate-900 border-b border-slate-100 pb-2.5 flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-600" />
            <span>Hours &amp; Work Guidelines</span>
          </h3>

          <div className="space-y-3">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Weekly Allocated Hours:</span>
              <span className="font-black text-slate-900">
                {currentStaff.workingHours ? `${currentStaff.workingHours} Hours / Week` : 'Pending Profile Confirmation'}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Operating Shifts:</span>
              <span className="font-bold text-slate-900">Sydney Plant Schedule (Mon–Fri)</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Probation Period:</span>
              <span className="font-bold text-emerald-600">Standard 3-Month Australian Review</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">WHS Compliance:</span>
              <span className="font-bold text-orange-600">SafeWork NSW Certified</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
