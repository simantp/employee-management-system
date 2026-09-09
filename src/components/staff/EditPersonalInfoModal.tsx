'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store';
import { AUState } from '@/types';

export default function EditPersonalInfoModal({ onClose }: { onClose: () => void }) {
  const { currentStaff, updateEmployee } = useApp();

  const [form, setForm] = useState({
    firstName: currentStaff.firstName || '',
    lastName: currentStaff.lastName || '',
    dateOfBirth: currentStaff.dateOfBirth || '',
    gender: currentStaff.gender || 'Prefer not to say',
    mobilePhone: currentStaff.mobilePhone || '',
    homePhone: currentStaff.homePhone || '',
    address: currentStaff.address || '',
    suburb: currentStaff.suburb || '',
    state: (currentStaff.state || 'NSW') as AUState,
    postcode: currentStaff.postcode || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateEmployee(currentStaff.id, form);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150" onClick={(e) => e.stopPropagation()}>
        
        {/* Modal Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-blue-50/30">
          <div>
            <h3 className="text-sm font-black text-slate-900">Edit Personal &amp; Residential Information</h3>
            <p className="text-[11px] text-slate-500">Update your official contact and residential address</p>
          </div>
          <button 
            onClick={onClose} 
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-2 py-1 rounded-lg border border-slate-200 transition cursor-pointer"
          >
            Close
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          
          {/* Names */}
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="font-bold text-slate-700 block mb-1">First Name *</label>
              <input
                type="text"
                required
                value={form.firstName}
                onChange={e => setForm({...form, firstName: e.target.value})}
                className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Last Name *</label>
              <input
                type="text"
                required
                value={form.lastName}
                onChange={e => setForm({...form, lastName: e.target.value})}
                className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              />
            </div>
          </div>

          {/* DOB & Gender */}
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Date of Birth</label>
              <input
                type="date"
                value={form.dateOfBirth}
                onChange={e => setForm({...form, dateOfBirth: e.target.value})}
                className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Gender</label>
              <select
                value={form.gender}
                onChange={e => setForm({...form, gender: e.target.value as any})}
                className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-medium"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Non-Binary / Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
          </div>

          {/* Contact Numbers */}
          <div className="grid grid-cols-2 gap-3.5 pt-1">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Mobile Phone (Primary) *</label>
              <input
                type="text"
                required
                placeholder="0412 345 678"
                value={form.mobilePhone}
                onChange={e => setForm({...form, mobilePhone: e.target.value})}
                className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Home Phone (Optional)</label>
              <input
                type="text"
                placeholder="02 9876 5432"
                value={form.homePhone}
                onChange={e => setForm({...form, homePhone: e.target.value})}
                className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              />
            </div>
          </div>

          {/* Address Section */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <div className="flex items-center gap-1.5 text-slate-800 font-bold">
              <span>Australian Residential Address</span>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Street Address *</label>
              <input
                type="text"
                required
                placeholder="e.g. 142 Belmore Road"
                value={form.address}
                onChange={e => setForm({...form, address: e.target.value})}
                className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Suburb *</label>
                <input
                  type="text"
                  required
                  placeholder="Riverwood"
                  value={form.suburb}
                  onChange={e => setForm({...form, suburb: e.target.value})}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">State *</label>
                <select
                  value={form.state}
                  onChange={e => setForm({...form, state: e.target.value as AUState})}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-medium"
                >
                  <option value="NSW">NSW</option>
                  <option value="VIC">VIC</option>
                  <option value="QLD">QLD</option>
                  <option value="WA">WA</option>
                  <option value="SA">SA</option>
                  <option value="TAS">TAS</option>
                  <option value="ACT">ACT</option>
                  <option value="NT">NT</option>
                </select>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Postcode *</label>
                <input
                  type="text"
                  required
                  maxLength={4}
                  placeholder="2210"
                  value={form.postcode}
                  onChange={e => setForm({...form, postcode: e.target.value})}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-mono"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-5 py-3 rounded-2xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 transition-all text-xs cursor-pointer">Cancel</button>
            <button type="submit" className="flex items-center gap-2.5 px-7 py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-black text-xs shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"><span>Save Personal Information</span></button>
          </div>

        </form>

      </div>
    </div>
  );
}
