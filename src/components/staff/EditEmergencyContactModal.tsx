'use client';

import React, { useState } from 'react';
import { X, HeartHandshake, Save, Phone, MapPin, AlertCircle } from 'lucide-react';
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
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150" onClick={(e) => e.stopPropagation()}>
        
        {/* Modal Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-rose-50/50 via-pink-50/30 to-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold shadow-xs">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Emergency Next of Kin</h3>
              <p className="text-[11px] text-slate-500">Critical primary emergency contact and address in Australia</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          
          {/* Kin Name & Relationship */}
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Next of Kin Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Sarah Jenkins"
                value={form.emergencyNextOfKin}
                onChange={e => setForm({...form, emergencyNextOfKin: e.target.value})}
                className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Relationship *</label>
              <select
                value={form.emergencyRelationship}
                onChange={e => setForm({...form, emergencyRelationship: e.target.value})}
                className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition font-medium"
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
              <label className="font-bold text-slate-700 block mb-1">Emergency Mobile Phone *</label>
              <input
                type="text"
                required
                placeholder="0412 999 888"
                value={form.emergencyMobile}
                onChange={e => setForm({...form, emergencyMobile: e.target.value})}
                className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Home / Work Phone (Optional)</label>
              <input
                type="text"
                placeholder="02 9123 4567"
                value={form.emergencyHomePhone}
                onChange={e => setForm({...form, emergencyHomePhone: e.target.value})}
                className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition"
              />
            </div>
          </div>

          {/* Next of Kin Address */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <div className="flex items-center gap-1.5 text-slate-800 font-bold">
              <MapPin className="w-3.5 h-3.5 text-rose-600" />
              <span>Next of Kin Residential Address</span>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Street Address</label>
              <input
                type="text"
                placeholder="e.g. 58 Canterbury Road"
                value={form.emergencyAddress}
                onChange={e => setForm({...form, emergencyAddress: e.target.value})}
                className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Suburb</label>
                <input
                  type="text"
                  placeholder="Canterbury"
                  value={form.emergencySuburb}
                  onChange={e => setForm({...form, emergencySuburb: e.target.value})}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">State</label>
                <select
                  value={form.emergencyState}
                  onChange={e => setForm({...form, emergencyState: e.target.value as AUState})}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white font-medium"
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
                <label className="font-bold text-slate-700 block mb-1">Postcode</label>
                <input
                  type="text"
                  maxLength={4}
                  placeholder="2193"
                  value={form.emergencyPostcode}
                  onChange={e => setForm({...form, emergencyPostcode: e.target.value})}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-5 py-3 rounded-2xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 transition-all text-xs">Cancel</button>
            <button type="submit" className="flex items-center gap-2.5 px-7 py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-black text-xs shadow-lg shadow-rose-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"><Save className="w-4 h-4" /><span>Save Emergency Contact</span></button>
          </div>

        </form>

      </div>
    </div>
  );
}
