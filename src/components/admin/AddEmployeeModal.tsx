'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store';
import { AUState, CitizenStatus, Department, Employee } from '@/types';
import { formatBSB } from '@/lib/utils';
import { encryptAES256 } from '@/lib/crypto';

export default function AddEmployeeModal({ onClose }: { onClose: () => void }) {
  const { addEmployee, inviteEmployee } = useApp();

  // Mode: 'QUICK_INVITE' (Default) | 'FULL_ENTRY'
  const [mode, setMode] = useState<'QUICK_INVITE' | 'FULL_ENTRY'>('QUICK_INVITE');

  // Quick Invite State (Basic Info)
  const [quickForm, setQuickForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    department: 'Production (Riverwood)' as Department,
    jobTitle: 'Production Associate',
  });

  // Generated Invitation Result popup
  const [inviteResult, setInviteResult] = useState<{
    employee: Employee;
    inviteUrl: string;
    inviteToken: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Full Manual Entry Form State
  const [fullForm, setFullForm] = useState({
    firstName: '',
    lastName: '',
    username: '',
    kioskPin: '',
    email: '',
    mobilePhone: '',
    dateOfBirth: '15/06/1995',
    startDate: '19/08/2026',
    gender: 'Male' as const,
    address: '24 Railway Parade',
    suburb: 'Riverwood',
    state: 'NSW' as AUState,
    postcode: '2210',
    department: 'Production (Riverwood)' as Department,
    jobTitle: 'Production Associate',
    workLocation: 'Riverwood, NSW',
    reportsTo: 'Binod Gurung',
    status: 'Active' as const,
    citizenStatus: 'CITIZEN' as CitizenStatus,
    visaType: '',
    visaExpiryDate: '',
    workRestrictions: '',
    hasDriverLicense: true,
    licenseCountry: 'Australia',
    licenseNumber: 'DL-884920',
    licenseExpiryDate: '15/05/2028',
    emergencyNextOfKin: 'Sarah Wilson',
    emergencyRelationship: 'Partner',
    emergencyAddress: '24 Railway Parade',
    emergencySuburb: 'Riverwood',
    emergencyState: 'NSW' as AUState,
    emergencyPostcode: '2210',
    emergencyMobile: '0412 999 888',
    tfn: '849102941',
    superFundName: 'AustralianSuper',
    superMemberNumber: 'AUS-491029',
    bankName: 'Commonwealth Bank',
    bankBranch: 'Riverwood',
    accountName: '',
    bsb: '062-184',
    accountNumber: '10482910',
  });

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickForm.firstName.trim() || !quickForm.lastName.trim() || !quickForm.email.trim()) {
      alert('Please fill out First Name, Last Name, and Email.');
      return;
    }

    const res = inviteEmployee({
      firstName: quickForm.firstName,
      lastName: quickForm.lastName,
      email: quickForm.email,
      department: quickForm.department,
      jobTitle: quickForm.jobTitle,
    });

    setInviteResult(res);
  };

  const handleFullSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullForm.firstName || !fullForm.lastName || !fullForm.email) {
      alert('Please fill out required fields');
      return;
    }

    const cleanUsername = fullForm.username.trim().toLowerCase() || (fullForm.email ? fullForm.email.split('@')[0].toLowerCase() : `${fullForm.firstName}.${fullForm.lastName}`.toLowerCase().replace(/[^a-z0-9._-]/g, ''));
    const generatedPin = fullForm.kioskPin.trim() || Math.floor(1000 + Math.random() * 9000).toString();

    const tfnEnc = encryptAES256(fullForm.tfn);
    const bsbEnc = encryptAES256(fullForm.bsb);
    const accEnc = encryptAES256(fullForm.accountNumber);

    addEmployee({
      employeeNumber: `EMP-00${Math.floor(Math.random() * 900 + 100)}`,
      username: cleanUsername,
      kioskPin: generatedPin,
      clockState: 'CLOCKED_OUT',
      firstName: fullForm.firstName,
      lastName: fullForm.lastName,
      email: fullForm.email,
      mobilePhone: fullForm.mobilePhone,
      dateOfBirth: fullForm.dateOfBirth,
      startDate: fullForm.startDate,
      gender: fullForm.gender,
      address: fullForm.address,
      suburb: fullForm.suburb,
      state: fullForm.state,
      postcode: fullForm.postcode,
      department: fullForm.department,
      jobTitle: fullForm.jobTitle,
      workLocation: fullForm.workLocation,
      reportsTo: fullForm.reportsTo,
      status: fullForm.status,
      avatarUrl: `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random() * 40)}?w=150`,
      citizenStatus: fullForm.citizenStatus,
      visaType: fullForm.visaType,
      visaExpiryDate: fullForm.visaExpiryDate,
      workRestrictions: fullForm.workRestrictions,
      hasDriverLicense: fullForm.hasDriverLicense,
      licenseCountry: fullForm.licenseCountry,
      licenseNumber: fullForm.licenseNumber,
      licenseExpiryDate: fullForm.licenseExpiryDate,
      emergencyNextOfKin: fullForm.emergencyNextOfKin,
      emergencyRelationship: fullForm.emergencyRelationship,
      emergencyAddress: fullForm.emergencyAddress,
      emergencySuburb: fullForm.emergencySuburb,
      emergencyState: fullForm.emergencyState,
      emergencyPostcode: fullForm.emergencyPostcode,
      emergencyMobile: fullForm.emergencyMobile,
      tfnMasked: fullForm.tfn ? `•••-•••-${fullForm.tfn.slice(-3)}` : '•••-•••-•••',
      tfnEncrypted: tfnEnc,
      superFundName: fullForm.superFundName,
      superMemberNumber: fullForm.superMemberNumber,
      bankName: fullForm.bankName,
      bankBranch: fullForm.bankBranch,
      accountName: fullForm.accountName || `${fullForm.firstName} ${fullForm.lastName}`,
      bsbMasked: fullForm.bsb ? formatBSB(fullForm.bsb) : '•••-•••',
      bsbEncrypted: bsbEnc,
      accountNumberMasked: fullForm.accountNumber ? `••••••${fullForm.accountNumber.slice(-3)}` : '••••••••',
      accountNumberEncrypted: accEnc,
    });

    onClose();
  };

  const handleCopyLink = () => {
    if (inviteResult?.inviteUrl) {
      navigator.clipboard.writeText(inviteResult.inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-xl w-full my-8 overflow-hidden animate-in fade-in zoom-in-95 font-sans text-xs" onClick={(e) => e.stopPropagation()}>
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div>
            <h3 className="text-sm font-black text-slate-900 tracking-tight">Add &amp; Onboard Employee</h3>
            <p className="text-[11px] text-slate-500">Add with basic information and send self-onboarding invite</p>
          </div>
          <button onClick={onClose} className="text-xs font-bold text-slate-400 hover:text-slate-700 px-2 py-1 rounded-lg transition cursor-pointer">
            Close
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        {!inviteResult && (
          <div className="px-6 pt-4 pb-2 border-b border-slate-100 flex gap-2">
            <button
              type="button"
              onClick={() => setMode('QUICK_INVITE')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'QUICK_INVITE'
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>Quick Add &amp; Send Invite</span>
              <span className="text-[9px] bg-white/20 px-1.5 py-0.5 rounded font-black uppercase">Recommended</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('FULL_ENTRY')}
              className={`py-2 px-4 rounded-xl text-xs font-bold transition cursor-pointer ${
                mode === 'FULL_ENTRY'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Full Manual Entry
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* INVITATION SUCCESS CONFIRMATION DIALOG */}
        {/* ========================================================================= */}
        {inviteResult ? (
          <div className="p-6 space-y-5 text-center">
            <div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200 inline-block mb-1.5">
                Staff Status: Pending Onboarding
              </span>
              <h3 className="text-base font-black text-slate-900">
                Invitation Generated for {inviteResult.employee.firstName} {inviteResult.employee.lastName}
              </h3>
              <p className="text-slate-500 text-xs mt-1 max-w-md mx-auto">
                The employee is now registered in the system as <strong className="text-amber-600 font-bold">Pending</strong>. When they open the invitation link, they will set their account password and fill out their blank profile to become fully active.
              </p>
            </div>

            {/* Invite Link Box */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-left space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-slate-700">Staff Invitation Link:</span>
                <span className="text-slate-400 font-mono text-[10px]">Token: {inviteResult.inviteToken}</span>
              </div>
              <div className="p-2.5 bg-white border border-slate-200 rounded-xl font-mono text-[11px] text-slate-700 break-all select-all shadow-inner">
                {inviteResult.inviteUrl}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Invitation Link'}</span>
              </button>

              <a
                href={inviteResult.inviteUrl}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-black text-xs shadow-md shadow-orange-500/25 transition flex items-center justify-center gap-2 text-center cursor-pointer"
              >
                <span>Test Invite Link (New Tab)</span>
              </a>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer"
              >
                Back to Staff Directory
              </button>
            </div>
          </div>
        ) : mode === 'QUICK_INVITE' ? (
          /* ========================================================================= */
          /* 1. QUICK INVITE FORM (FIRST NAME, LAST NAME, EMAIL) */
          /* ========================================================================= */
          <form onSubmit={handleQuickSubmit} className="p-6 space-y-4">
            <div className="p-3.5 bg-orange-50 border border-orange-200 rounded-2xl flex items-start gap-3">
              <div className="text-[11px] text-orange-950 leading-relaxed">
                <strong>Self-Onboarding Workflow:</strong> Enter the staff member&apos;s basic information. They will be added as <strong className="text-amber-800">Pending</strong> in your employee directory. An invitation link will be created for the staff to set their password and complete their profile in the Staff Portal.
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="font-bold text-slate-700 block mb-1">First Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh"
                  value={quickForm.firstName}
                  onChange={e => setQuickForm({ ...quickForm, firstName: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Last Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sharma"
                  value={quickForm.lastName}
                  onChange={e => setQuickForm({ ...quickForm, lastName: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition font-medium"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Work / Personal Email Address *</label>
              <input
                type="email"
                required
                placeholder="ramesh.sharma@company.com"
                value={quickForm.email}
                onChange={e => setQuickForm({ ...quickForm, email: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Department</label>
                <select
                  value={quickForm.department}
                  onChange={e => setQuickForm({ ...quickForm, department: e.target.value as Department })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none font-medium cursor-pointer"
                >
                  <option value="Production (Riverwood)">Production (Riverwood)</option>
                  <option value="Production (Rockdale)">Production (Rockdale)</option>
                  <option value="Design">Design</option>
                  <option value="Administration">Administration</option>
                  <option value="Sales & Marketing">Sales & Marketing</option>
                  <option value="Human Resources">Human Resources</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Job Title</label>
                <input
                  type="text"
                  placeholder="e.g. Production Associate"
                  value={quickForm.jobTitle}
                  onChange={e => setQuickForm({ ...quickForm, jobTitle: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition font-medium"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-orange-500/25 transition-all hover:scale-[1.02] cursor-pointer"
              >
                Add Pending Staff &amp; Generate Invite Link
              </button>
            </div>
          </form>
        ) : (
          /* ========================================================================= */
          /* 2. FULL MANUAL ENTRY FORM */
          /* ========================================================================= */
          <form onSubmit={handleFullSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
            <div>
              <h4 className="font-bold text-slate-900 border-b pb-1 mb-3 uppercase tracking-wider text-blue-600">
                1. Personal &amp; Identity
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Liam"
                    value={fullForm.firstName}
                    onChange={e => setFullForm({...fullForm, firstName: e.target.value})}
                    className="w-full p-2 border rounded-lg bg-slate-50 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Wilson"
                    value={fullForm.lastName}
                    onChange={e => setFullForm({...fullForm, lastName: e.target.value})}
                    className="w-full p-2 border rounded-lg bg-slate-50 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Work Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="liam.wilson@company.com"
                    value={fullForm.email}
                    onChange={e => setFullForm({...fullForm, email: e.target.value})}
                    className="w-full p-2 border rounded-lg bg-slate-50 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Mobile *</label>
                  <input
                    type="text"
                    placeholder="0412 345 678"
                    value={fullForm.mobilePhone}
                    onChange={e => setFullForm({...fullForm, mobilePhone: e.target.value})}
                    className="w-full p-2 border rounded-lg bg-slate-50 focus:bg-white"
                  />
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 border-b pb-1 mb-3 uppercase tracking-wider text-blue-600">
                2. Residential Address &amp; Department
              </h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">Street Address</label>
                  <input
                    type="text"
                    value={fullForm.address}
                    onChange={e => setFullForm({...fullForm, address: e.target.value})}
                    className="w-full p-2 border rounded-lg bg-slate-50"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Suburb</label>
                  <input
                    type="text"
                    value={fullForm.suburb}
                    onChange={e => setFullForm({...fullForm, suburb: e.target.value})}
                    className="w-full p-2 border rounded-lg bg-slate-50"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Department</label>
                  <select
                    value={fullForm.department}
                    onChange={e => setFullForm({...fullForm, department: e.target.value as any})}
                    className="w-full p-2 border rounded-lg bg-slate-50 cursor-pointer"
                  >
                    <option value="Production (Riverwood)">Production (Riverwood)</option>
                    <option value="Production (Rockdale)">Production (Rockdale)</option>
                    <option value="Design">Design</option>
                    <option value="Administration">Administration</option>
                    <option value="Sales & Marketing">Sales & Marketing</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">State</label>
                  <select
                    value={fullForm.state}
                    onChange={e => setFullForm({...fullForm, state: e.target.value as AUState})}
                    className="w-full p-2 border rounded-lg bg-slate-50"
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
                    value={fullForm.postcode}
                    onChange={e => setFullForm({...fullForm, postcode: e.target.value})}
                    className="w-full p-2 border rounded-lg bg-slate-50"
                  />
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 border-b pb-1 mb-3 uppercase tracking-wider text-blue-600">
                3. Emergency Contact &amp; Banking
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Emergency Next of Kin</label>
                  <input
                    type="text"
                    value={fullForm.emergencyNextOfKin}
                    onChange={e => setFullForm({...fullForm, emergencyNextOfKin: e.target.value})}
                    className="w-full p-2 border rounded-lg bg-slate-50"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Emergency Mobile</label>
                  <input
                    type="text"
                    value={fullForm.emergencyMobile}
                    onChange={e => setFullForm({...fullForm, emergencyMobile: e.target.value})}
                    className="w-full p-2 border rounded-lg bg-slate-50"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={fullForm.bankName}
                    onChange={e => setFullForm({...fullForm, bankName: e.target.value})}
                    className="w-full p-2 border rounded-lg bg-slate-50"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">BSB &amp; Account Number</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="062-184"
                      value={fullForm.bsb}
                      onChange={e => setFullForm({...fullForm, bsb: e.target.value})}
                      className="w-full p-2 border rounded-lg bg-slate-50 font-mono"
                    />
                    <input
                      type="text"
                      placeholder="10482910"
                      value={fullForm.accountNumber}
                      onChange={e => setFullForm({...fullForm, accountNumber: e.target.value})}
                      className="w-full p-2 border rounded-lg bg-slate-50 font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
              <button type="button" onClick={onClose} className="px-4 py-2.5 border rounded-xl font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer">
                Cancel
              </button>
              <button type="submit" className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md cursor-pointer">
                Register &amp; Save Employee Directly
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
