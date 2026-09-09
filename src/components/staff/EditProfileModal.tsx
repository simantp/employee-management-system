'use client';

import React, { useState } from 'react';
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
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Update Profile Details</h3>
            <p className="text-xs text-slate-500">Editable employee fields per specifications</p>
          </div>
          <button 
            onClick={onClose} 
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-2 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 transition cursor-pointer"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Mobile Phone *</label>
              <input
                type="text"
                required
                value={form.mobilePhone}
                onChange={e => setForm({...form, mobilePhone: e.target.value})}
                className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Home Phone (Optional)</label>
              <input
                type="text"
                value={form.homePhone}
                onChange={e => setForm({...form, homePhone: e.target.value})}
                className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Residential Street Address</label>
            <input
              type="text"
              required
              value={form.address}
              onChange={e => setForm({...form, address: e.target.value})}
              className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Suburb</label>
              <input
                type="text"
                value={form.suburb}
                onChange={e => setForm({...form, suburb: e.target.value})}
                className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">State</label>
              <select
                value={form.state}
                onChange={e => setForm({...form, state: e.target.value as AUState})}
                className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50/50 focus:bg-white font-medium"
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
              <label className="font-semibold text-slate-700 block mb-1">Postcode</label>
              <input
                type="text"
                value={form.postcode}
                onChange={e => setForm({...form, postcode: e.target.value})}
                className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50/50 focus:bg-white font-mono"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2">Emergency Contact</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Contact Name</label>
                <input
                  type="text"
                  value={form.emergencyNextOfKin}
                  onChange={e => setForm({...form, emergencyNextOfKin: e.target.value})}
                  className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Emergency Mobile</label>
                <input
                  type="text"
                  value={form.emergencyMobile}
                  onChange={e => setForm({...form, emergencyMobile: e.target.value})}
                  className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 font-semibold hover:bg-slate-100 transition text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition cursor-pointer"
            >
              Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
