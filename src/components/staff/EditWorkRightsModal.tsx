'use client';

import React, { useState } from 'react';
import { X, ShieldCheck, Save, Award, AlertCircle, FileCheck, Check } from 'lucide-react';
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
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150" onClick={(e) => e.stopPropagation()}>
        
        {/* Modal Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50/50 via-teal-50/30 to-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Legal Work Rights, Visa & Working Hours</h3>
              <p className="text-[11px] text-slate-500">Australian VEVO residency status, visa conditions & weekly working hours</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          
          {/* Citizenship Status Selector */}
          <div>
            <label className="font-bold text-slate-800 block mb-1.5">Australian Citizenship / Residency Status *</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {[
                { id: 'CITIZEN', label: '🇦🇺 AU Citizen', desc: 'Full Australian passport' },
                { id: 'PERMANENT_RESIDENT', label: '🪪 Permanent Resident', desc: 'Australian PR status' },
                { id: 'VISA_HOLDER', label: '✈️ Visa Holder', desc: 'VEVO verified work visa' },
              ].map(opt => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => setForm({...form, citizenStatus: opt.id as CitizenStatus})}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    form.citizenStatus === opt.id
                      ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 text-slate-900 font-bold shadow-xs'
                      : 'bg-slate-50/50 border-slate-200 text-slate-600 hover:bg-white'
                  }`}
                >
                  <span className="block text-xs font-bold text-slate-900 mb-0.5">{opt.label}</span>
                  <span className="block text-[10px] text-slate-500 leading-tight">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Working Hours Input */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 block">Weekly Working Hours (Roster Hours) *</label>
              <span className="text-[10px] font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Sydney Standard: 38 hrs</span>
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
                  className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <div className="flex items-center text-[11px] text-slate-500">
                <span>{form.workingHours >= 38 ? 'Full-Time permanent allocation' : 'Part-Time / Student allocation'}</span>
              </div>
            </div>
          </div>

          {/* Conditional Visa Details */}
          {isVisaHolder && (
            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-3.5 animate-in fade-in duration-150">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                <FileCheck className="w-4 h-4 text-amber-600" />
                <span>Australian Visa Subclass & VEVO Specifications</span>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Visa Subclass & Category *</label>
                <select
                  value={form.visaType}
                  onChange={e => setForm({...form, visaType: e.target.value})}
                  className="w-full p-2.5 border border-amber-300 rounded-xl bg-white focus:ring-2 focus:ring-amber-500/20 font-medium"
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
                  <label className="font-bold text-slate-700 block mb-1">Visa Expiry Date *</label>
                  <input
                    type="date"
                    required={isVisaHolder}
                    value={form.visaExpiryDate}
                    onChange={e => setForm({...form, visaExpiryDate: e.target.value})}
                    className="w-full p-2.5 border border-amber-300 rounded-xl bg-white focus:ring-2 focus:ring-amber-500/20 font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Work Rights Condition</label>
                  <select
                    value={form.workRestrictions}
                    onChange={e => setForm({...form, workRestrictions: e.target.value})}
                    className="w-full p-2.5 border border-amber-300 rounded-xl bg-white focus:ring-2 focus:ring-amber-500/20 font-medium"
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
              <div className="flex items-center gap-1.5 text-slate-800 font-bold">
                <Award className="w-3.5 h-3.5 text-emerald-600" />
                <span>Driver's License (Forklift & Plant Transport)</span>
              </div>
              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={form.hasDriverLicense}
                  onChange={e => setForm({...form, hasDriverLicense: e.target.checked})}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                />
                <span>Hold Valid Driver License</span>
              </label>
            </div>

            {form.hasDriverLicense && (
              <div className="grid grid-cols-3 gap-3 p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 animate-in fade-in duration-150">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">State Issued</label>
                  <select
                    value={form.licenseState}
                    onChange={e => setForm({...form, licenseState: e.target.value as AUState})}
                    className="w-full p-2.2 border border-slate-200 rounded-xl bg-white font-medium"
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
                  <label className="font-bold text-slate-700 block mb-1">License Number</label>
                  <input
                    type="text"
                    placeholder="e.g. DL-8849201"
                    value={form.licenseNumber}
                    onChange={e => setForm({...form, licenseNumber: e.target.value})}
                    className="w-full p-2.2 border border-slate-200 rounded-xl bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">License Expiry Date</label>
                  <input
                    type="date"
                    value={form.licenseExpiryDate}
                    onChange={e => setForm({...form, licenseExpiryDate: e.target.value})}
                    className="w-full p-2.2 border border-slate-200 rounded-xl bg-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-5 py-3 rounded-2xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 transition-all text-xs">Cancel</button>
            <button type="submit" className="flex items-center gap-2.5 px-7 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-lg shadow-emerald-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"><Save className="w-4 h-4" /><span>Save Work Rights & Visa</span></button>
          </div>

        </form>

      </div>
    </div>
  );
}
