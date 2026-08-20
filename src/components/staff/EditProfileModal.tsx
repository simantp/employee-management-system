'use client';

import React, { useState } from 'react';
import { X, UserCheck, CheckCircle2 } from 'lucide-react';
import { useApp } from '@/lib/store';
import { AUState } from '@/types';

export default function EditProfileModal({ onClose }: { onClose: () => void }) {
  const { currentStaff, updateEmployee } = useApp();

  const [form, setForm] = useState({
    mobilePhone: currentStaff.mobilePhone,
    homePhone: currentStaff.homePhone || '',
    address: currentStaff.address,
    suburb: currentStaff.suburb,
    state: currentStaff.state,
    postcode: currentStaff.postcode,
    emergencyNextOfKin: currentStaff.emergencyNextOfKin,
    emergencyRelationship: currentStaff.emergencyRelationship,
    emergencyMobile: currentStaff.emergencyMobile,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateEmployee(currentStaff.id, form);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Update Profile Details</h3>
              <p className="text-[11px] text-slate-500">Editable employee fields per specifications</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Mobile Phone *</label>
              <input
                type="text"
                required
                value={form.mobilePhone}
                onChange={e => setForm({...form, mobilePhone: e.target.value})}
                className="w-full p-2.5 border rounded-xl bg-slate-50"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Home Phone (Optional)</label>
              <input
                type="text"
                value={form.homePhone}
                onChange={e => setForm({...form, homePhone: e.target.value})}
                className="w-full p-2.5 border rounded-xl bg-slate-50"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Residential Street Address</label>
            <input
              type="text"
              required
              value={form.address}
              onChange={e => setForm({...form, address: e.target.value})}
              className="w-full p-2.5 border rounded-xl bg-slate-50"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Suburb</label>
              <input
                type="text"
                value={form.suburb}
                onChange={e => setForm({...form, suburb: e.target.value})}
                className="w-full p-2.5 border rounded-xl bg-slate-50"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">State</label>
              <select
                value={form.state}
                onChange={e => setForm({...form, state: e.target.value as AUState})}
                className="w-full p-2.5 border rounded-xl bg-slate-50"
              >
                <option value="NSW">NSW</option>
                <option value="VIC">VIC</option>
                <option value="QLD">QLD</option>
                <option value="WA">WA</option>
                <option value="SA">SA</option>
                <option value="TAS">TAS</option>
              </select>
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Postcode</label>
              <input
                type="text"
                value={form.postcode}
                onChange={e => setForm({...form, postcode: e.target.value})}
                className="w-full p-2.5 border rounded-xl bg-slate-50"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <h4 className="font-bold text-slate-900 mb-2">Emergency Contact</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Contact Name</label>
                <input
                  type="text"
                  value={form.emergencyNextOfKin}
                  onChange={e => setForm({...form, emergencyNextOfKin: e.target.value})}
                  className="w-full p-2.5 border rounded-xl bg-slate-50"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Emergency Mobile</label>
                <input
                  type="text"
                  value={form.emergencyMobile}
                  onChange={e => setForm({...form, emergencyMobile: e.target.value})}
                  className="w-full p-2.5 border rounded-xl bg-slate-50"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-600/25 transition"
            >
              Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
