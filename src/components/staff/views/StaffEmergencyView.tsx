'use client';

import React, { useState } from 'react';
import { PhoneCall, HeartHandshake, MapPin, Edit3, ShieldAlert } from 'lucide-react';
import { useApp } from '@/lib/store';
import EditProfileModal from '../EditProfileModal';

export default function StaffEmergencyView() {
  const { currentStaff } = useApp();
  const [showEdit, setShowEdit] = useState(false);

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-150 text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Emergency Contacts & Medical Info</h2>
          <p className="text-slate-500 mt-0.5">
            Designated Next of Kin contacts for on-site workplace safety incidents
          </p>
        </div>

        <button
          onClick={() => setShowEdit(true)}
          className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 rounded-xl font-bold shadow-md shadow-rose-600/25"
        >
          <Edit3 className="w-4 h-4" />
          <span>Update Emergency Contact</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <HeartHandshake className="w-4 h-4 text-rose-500" />
              <span>Primary Next of Kin</span>
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800">Primary</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-slate-400 uppercase text-[10px] font-semibold block">Contact Name</span>
              <span className="font-bold text-slate-900 text-sm">{currentStaff.emergencyNextOfKin}</span>
            </div>
            <div>
              <span className="text-slate-400 uppercase text-[10px] font-semibold block">Relationship</span>
              <span className="font-bold text-slate-900 text-sm">{currentStaff.emergencyRelationship}</span>
            </div>
            <div>
              <span className="text-slate-400 uppercase text-[10px] font-semibold block">Emergency Mobile</span>
              <span className="font-bold text-slate-900 text-sm">{currentStaff.emergencyMobile}</span>
            </div>
            <div>
              <span className="text-slate-400 uppercase text-[10px] font-semibold block">Home Phone</span>
              <span className="font-bold text-slate-900 text-sm">{currentStaff.emergencyHomePhone || 'N/A'}</span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-400 uppercase text-[10px] font-semibold block">Address</span>
              <span className="font-bold text-slate-900">{currentStaff.emergencyAddress}, {currentStaff.emergencySuburb} {currentStaff.emergencyState} {currentStaff.emergencyPostcode}</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>Workplace Incident Protocol</span>
          </h3>

          <div className="space-y-3 text-slate-300">
            <p>
              In the event of an on-site medical emergency or plant evacuation, our designated safety officers will immediately notify the primary emergency contact above.
            </p>
            <div className="p-3 rounded-xl bg-slate-800 border border-slate-700 space-y-1">
              <span className="font-bold text-cyan-300 block">Plant First Aid Officer:</span>
              <span>Binod Gurung (Riverwood Operations) • Ext: 402</span>
            </div>
          </div>
        </div>
      </div>

      {showEdit && <EditProfileModal onClose={() => setShowEdit(false)} />}
    </div>
  );
}
