'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store';
import { CitizenStatus, AUState } from '@/types';

export default function EditWorkRightsModal({ onClose }: { onClose: () => void }) {
  const { currentStaff, updateEmployee } = useApp();

  const [form, setForm] = useState({
    citizenStatus: (currentStaff.citizenStatus || 'CITIZEN') as CitizenStatus,
    visaType: currentStaff.visaType || 'Temporary Skill Shortage (Subclass 482)',
    visaExpiryDate: currentStaff.visaExpiryDate || '',
    workingHours: currentStaff.workingHours || 38,
    workRestrictions: currentStaff.workRestrictions || 'Standard full-time employment rights (38 hours/week)',
    hasDriverLicense: currentStaff.hasDriverLicense ?? false,
    licenseCountry: currentStaff.licenseCountry || 'Australia',
    licenseState: (currentStaff.licenseCountry === 'Australia' ? 'NSW' : 'NSW') as AUState,
    licenseNumber: currentStaff.licenseNumber || '',
    licenseExpiryDate: currentStaff.licenseExpiryDate || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // If Citizen or PR, clear visa expiry requirement
    const finalData = {
      ...form,
      workingHours: Number(form.workingHours) || 38,
      workingHoursConfirmed: true,
      visaStatusConfirmed: true,
      visaType: form.citizenStatus === 'VISA_HOLDER' ? form.visaType : undefined,
      visaExpiryDate: form.citizenStatus === 'VISA_HOLDER' ? form.visaExpiryDate : undefined,
      workRestrictions: form.citizenStatus === 'CITIZEN' || form.citizenStatus === 'PERMANENT_RESIDENT' 
        ? `Unlimited Australian work rights (${form.workingHours || 38} hrs/week)` 
        : form.workRestrictions,
    };

    updateEmployee(currentStaff.id, finalData);
    onClose();
  };

  const isVisaHolder = form.citizenStatus === 'VISA_HOLDER';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-xl w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Legal Work Rights, Visa & Working Hours</h3>
            <p className="text-xs text-slate-500">Australian VEVO residency status, visa conditions & weekly working hours</p>
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
          
          {/* Citizenship Status Selector */}
          <div>
            <label className="font-semibold text-slate-800 block mb-1.5">Australian Citizenship / Residency Status *</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {[
                { id: 'CITIZEN', label: 'AU Citizen', desc: 'Full Australian passport' },
                { id: 'PERMANENT_RESIDENT', label: 'Permanent Resident', desc: 'Australian PR status' },
                { id: 'VISA_HOLDER', label: 'Visa Holder', desc: 'VEVO verified work visa' },
              ].map(opt => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => setForm({...form, citizenStatus: opt.id as CitizenStatus})}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                    form.citizenStatus === opt.id
                      ? 'bg-slate-900 border-slate-900 text-white font-semibold'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-white'
                  }`}
                >
                  <span className={`block text-xs font-bold mb-0.5 ${form.citizenStatus === opt.id ? 'text-white' : 'text-slate-900'}`}>{opt.label}</span>
                  <span className={`block text-[10px] leading-tight ${form.citizenStatus === opt.id ? 'text-slate-300' : 'text-slate-500'}`}>{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Working Hours Input */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-800 block">Weekly Working Hours (Roster Hours) *</label>
              <span className="text-[10px] font-semibold text-slate-600 bg-slate-200/70 px-2 py-0.5 rounded">Standard: 38 hrs</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <input
                  type="number"
                  min="1"
                  max="60"
                  step="0.5"
                  required
                  value={form.workingHours}
                  onChange={e => setForm({...form, workingHours: parseFloat(e.target.value) || 0})}
                  placeholder="e.g. 38.0"
                  className="w-full p-2.5 border border-slate-300 rounded-lg bg-white font-semibold text-slate-900 focus:ring-2 focus:ring-slate-900/10"
                />
              </div>
              <div className="flex items-center text-xs text-slate-500">
                <span>{form.workingHours >= 38 ? 'Full-Time permanent allocation' : 'Part-Time / Student allocation'}</span>
              </div>
            </div>
          </div>

          {/* Conditional Visa Details */}
          {isVisaHolder && (
            <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200 space-y-3.5">
              <div className="text-amber-900 font-bold text-xs uppercase tracking-wider">
                Australian Visa Subclass & VEVO Specifications
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Visa Subclass & Category *</label>
                <select
                  value={form.visaType}
                  onChange={e => setForm({...form, visaType: e.target.value})}
                  className="w-full p-2.5 border border-amber-300 rounded-lg bg-white focus:ring-2 focus:ring-amber-500/20 font-medium"
                >
                  <option value="Temporary Skill Shortage (Subclass 482)">Temporary Skill Shortage (Subclass 482)</option>
                  <option value="Temporary Graduate (Subclass 485)">Temporary Graduate (Subclass 485)</option>
                  <option value="Working Holiday (Subclass 417)">Working Holiday (Subclass 417)</option>
                  <option value="Work and Holiday (Subclass 462)">Work and Holiday (Subclass 462)</option>
                  <option value="Student Visa (Subclass 500)">Student Visa (Subclass 500)</option>
                  <option value="Partner Visa (Subclass 820/801)">Partner Visa (Subclass 820/801)</option>
                  <option value="Training Visa (Subclass 407)">Training Visa (Subclass 407)</option>
                  <option value="Bridging Visa A (Subclass 010)">Bridging Visa A (Subclass 010)</option>
                  <option value="Other Australian Visa Subclass">Other Australian Visa Subclass</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Visa Expiry Date *</label>
                  <input
                    type="date"
                    required={isVisaHolder}
                    value={form.visaExpiryDate}
                    onChange={e => setForm({...form, visaExpiryDate: e.target.value})}
                    className="w-full p-2.5 border border-amber-300 rounded-lg bg-white focus:ring-2 focus:ring-amber-500/20 font-medium"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Work Rights Condition</label>
                  <select
                    value={form.workRestrictions}
                    onChange={e => setForm({...form, workRestrictions: e.target.value})}
                    className="w-full p-2.5 border border-amber-300 rounded-lg bg-white focus:ring-2 focus:ring-amber-500/20 font-medium"
                  >
                    <option value="Full-time unrestricted work rights">Full-time unrestricted (38h/week)</option>
                    <option value="48 hours per fortnight during study term">48h / Fortnight (Student Visa)</option>
                    <option value="6 months maximum with single employer (Condition 8547)">6 Months Employer Cap (417/462)</option>
                    <option value="Standard plant roster shifts">Standard plant roster shifts</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Driver's License Section */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-slate-800 font-bold text-xs uppercase tracking-wider">
                Driver's License (Forklift & Plant Transport)
              </div>
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={form.hasDriverLicense}
                  onChange={e => setForm({...form, hasDriverLicense: e.target.checked})}
                  className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900 border-slate-300"
                />
                <span>Hold Valid Driver License</span>
              </label>
            </div>

            {form.hasDriverLicense && (
              <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">State Issued</label>
                  <select
                    value={form.licenseState}
                    onChange={e => setForm({...form, licenseState: e.target.value as AUState})}
                    className="w-full p-2 border border-slate-200 rounded-lg bg-white font-medium"
                  >
                    <option value="NSW">NSW (Transport for NSW)</option>
                    <option value="VIC">VIC (VicRoads)</option>
                    <option value="QLD">QLD (TMR)</option>
                    <option value="WA">WA (DoT)</option>
                    <option value="SA">SA (Service SA)</option>
                    <option value="TAS">TAS (State Growth)</option>
                    <option value="ACT">ACT (Access Canberra)</option>
                    <option value="NT">NT (MVR)</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">License Number</label>
                  <input
                    type="text"
                    placeholder="e.g. DL-8849201"
                    value={form.licenseNumber}
                    onChange={e => setForm({...form, licenseNumber: e.target.value})}
                    className="w-full p-2 border border-slate-200 rounded-lg bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">License Expiry Date</label>
                  <input
                    type="date"
                    value={form.licenseExpiryDate}
                    onChange={e => setForm({...form, licenseExpiryDate: e.target.value})}
                    className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 font-semibold hover:bg-slate-100 transition text-xs cursor-pointer">Cancel</button>
            <button type="submit" className="px-5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition cursor-pointer">Save Work Rights & Visa</button>
          </div>

        </form>

      </div>
    </div>
  );
}
