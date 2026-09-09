'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store';
import { AUState } from '@/types';

export default function EditEmergencyContactModal({ onClose }: { onClose: () => void }) {
  const { currentStaff, updateEmployee } = useApp();

  const [form, setForm] = useState({
    emergencyNextOfKin: currentStaff.emergencyNextOfKin || '',
    emergencyRelationship: currentStaff.emergencyRelationship || 'Spouse / Partner',
    emergencyMobile: currentStaff.emergencyMobile || '',
    emergencyHomePhone: currentStaff.emergencyHomePhone || '',
    emergencyAddress: currentStaff.emergencyAddress || '',
    emergencySuburb: currentStaff.emergencySuburb || '',
    emergencyState: (currentStaff.emergencyState || 'NSW') as AUState,
    emergencyPostcode: currentStaff.emergencyPostcode || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateEmployee(currentStaff.id, form);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-xl w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Emergency Next of Kin</h3>
            <p className="text-xs text-slate-500">Critical primary emergency contact and address in Australia</p>
          </div>
          <button 
            onClick={onClose} 
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-2 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 transition cursor-pointer"
          >
            Close
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          
          {/* Kin Name & Relationship */}
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Next of Kin Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Sarah Jenkins"
                value={form.emergencyNextOfKin}
                onChange={e => setForm({...form, emergencyNextOfKin: e.target.value})}
                className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Relationship *</label>
              <select
                value={form.emergencyRelationship}
                onChange={e => setForm({...form, emergencyRelationship: e.target.value})}
                className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition font-medium"
              >
                <option value="Spouse / Partner">Spouse / Partner</option>
                <option value="Parent / Guardian">Parent / Guardian</option>
                <option value="Sibling (Brother / Sister)">Sibling (Brother / Sister)</option>
                <option value="Adult Child">Adult Child</option>
                <option value="Close Relative">Close Relative</option>
                <option value="Friend / Housemate">Friend / Housemate</option>
                <option value="Other Legal Guardian">Other Legal Guardian</option>
              </select>
            </div>
          </div>

          {/* Contact Numbers */}
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Emergency Mobile Phone *</label>
              <input
                type="text"
                required
                placeholder="0412 999 888"
                value={form.emergencyMobile}
                onChange={e => setForm({...form, emergencyMobile: e.target.value})}
                className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Home / Work Phone (Optional)</label>
              <input
                type="text"
                placeholder="02 9123 4567"
                value={form.emergencyHomePhone}
                onChange={e => setForm({...form, emergencyHomePhone: e.target.value})}
                className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition"
              />
            </div>
          </div>

          {/* Next of Kin Address */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <div className="text-slate-800 font-bold text-xs uppercase tracking-wider">
              Next of Kin Residential Address
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Street Address</label>
              <input
                type="text"
                placeholder="e.g. 58 Canterbury Road"
                value={form.emergencyAddress}
                onChange={e => setForm({...form, emergencyAddress: e.target.value})}
                className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Suburb</label>
                <input
                  type="text"
                  placeholder="Canterbury"
                  value={form.emergencySuburb}
                  onChange={e => setForm({...form, emergencySuburb: e.target.value})}
                  className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">State</label>
                <select
                  value={form.emergencyState}
                  onChange={e => setForm({...form, emergencyState: e.target.value as AUState})}
                  className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50/50 focus:bg-white font-medium"
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
                <label className="font-semibold text-slate-700 block mb-1">Postcode</label>
                <input
                  type="text"
                  maxLength={4}
                  placeholder="2193"
                  value={form.emergencyPostcode}
                  onChange={e => setForm({...form, emergencyPostcode: e.target.value})}
                  className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50/50 focus:bg-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 font-semibold hover:bg-slate-100 transition text-xs cursor-pointer">Cancel</button>
            <button type="submit" className="px-5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition cursor-pointer">Save Emergency Contact</button>
          </div>

        </form>

      </div>
    </div>
  );
}
