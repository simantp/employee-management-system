'use client';

import React from 'react';
import { User, Mail, Phone, MapPin, UserCheck, ShieldCheck, Edit3 } from 'lucide-react';
import { useApp } from '@/lib/store';

export default function StaffProfileSummary({ onEditProfile }: { onEditProfile?: () => void }) {
  const { currentStaff } = useApp();

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-900">My Profile Summary</h3>
        <button
          onClick={onEditProfile}
          className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1"
        >
          <span>View Full Profile</span>
          <span>→</span>
        </button>
      </div>

      <div className="flex items-center gap-4 mb-4 pb-4 border-b border-slate-100">
        {currentStaff.avatarUrl ? (
          <img
            src={currentStaff.avatarUrl}
            alt={currentStaff.firstName}
            className="w-14 h-14 rounded-full object-cover ring-2 ring-cyan-400 shadow-md flex-shrink-0"
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-slate-100 border-2 border-dashed border-cyan-400 flex items-center justify-center text-cyan-600 font-bold text-xs flex-shrink-0">
            {currentStaff.firstName ? currentStaff.firstName.charAt(0) : 'U'}
          </div>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-base font-extrabold text-slate-900 truncate">
              {currentStaff.firstName} {currentStaff.lastName}
            </h4>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
              Active
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
            {currentStaff.department || currentStaff.jobTitle || 'HsCreations Staff'}
          </p>
        </div>
      </div>

      <div className="space-y-2.5 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-slate-400 font-medium flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" /> Employee ID
          </span>
          <span className="font-mono font-bold text-slate-900">{currentStaff.employeeNumber}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-400 font-medium flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5" /> Email
          </span>
          <span className="font-semibold text-slate-700 truncate max-w-[180px]">{currentStaff.email}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-400 font-medium flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5" /> Mobile
          </span>
          <span className="font-semibold text-slate-700">{currentStaff.mobilePhone}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-400 font-medium flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" /> Work Location
          </span>
          <span className="font-semibold text-slate-700">{currentStaff.workLocation}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-400 font-medium flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5" /> Reports To
          </span>
          <span className="font-semibold text-slate-700">{currentStaff.reportsTo}</span>
        </div>
      </div>
    </div>
  );
}
