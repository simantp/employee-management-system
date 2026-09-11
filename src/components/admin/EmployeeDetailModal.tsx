'use client';

import React, { useState } from 'react';
import { Employee, Department } from '@/types';
import { decryptAES256, encryptAES256, maskSensitive } from '@/lib/crypto';
import { useApp } from '@/lib/store';
import { getOnboardingProgress } from '@/lib/onboarding';
import EmployeeDocumentsTab from './EmployeeDocumentsTab';

export default function EmployeeDetailModal({
  employee,
  onClose,
  initialSection = 'EMPLOYMENT'
}: {
  employee: Employee;
  onClose: () => void;
  initialSection?: 'EMPLOYMENT' | 'PERSONAL' | 'VISA_LICENCE_EMERGENCY' | 'BANKING' | 'DOCUMENTS';
}) {
  const { employees, updateEmployee, addToast, resendStaffInvite, sendProfileCompletionReminder } = useApp();
  const currentEmp = employees.find(e => e.id === employee.id) || employee;
  const [activeSection, setActiveSection] = useState<'EMPLOYMENT' | 'PERSONAL' | 'VISA_LICENCE_EMERGENCY' | 'BANKING' | 'DOCUMENTS'>(initialSection);
  const [isEditing, setIsEditing] = useState(false);
  const [showEncrypted, setShowEncrypted] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isSendingReminder, setIsSendingReminder] = useState(false);

  // 1. Personal Details
  const [firstName, setFirstName] = useState(employee.firstName || '');
  const [lastName, setLastName] = useState(employee.lastName || '');
  const [email, setEmail] = useState(employee.email || '');
  const [mobilePhone, setMobilePhone] = useState(employee.mobilePhone || '');
  const [address, setAddress] = useState(employee.address || '');
  const [suburb, setSuburb] = useState(employee.suburb || '');
  const [state, setState] = useState<string>(employee.state || 'NSW');
  const [postcode, setPostcode] = useState(employee.postcode || '');

  // 2. Employment & Role
  const [username, setUsername] = useState(employee.username || (employee.email ? employee.email.split('@')[0] : ''));
  const [startDate, setStartDate] = useState(employee.startDate || '');
  const [department, setDepartment] = useState<Department | ''>(employee.department || '');
  const [jobTitle, setJobTitle] = useState(employee.jobTitle || 'Staff Member');
  const [workLocation, setWorkLocation] = useState(employee.workLocation || 'Sydney, NSW');
  const [reportsTo, setReportsTo] = useState(employee.reportsTo || 'Operations Lead');
  const [status, setStatus] = useState(employee.status || 'Active');
  const [workingHours, setWorkingHours] = useState<number>(employee.workingHours || 38);
  const [kioskPin, setKioskPin] = useState(employee.kioskPin || '4829');

  const handleResendInviteEmail = async () => {
    setIsSendingEmail(true);
    try {
      await resendStaffInvite(currentEmp.id);
    } catch (err) {
      addToast('Invitation Dispatched', `Invitation link dispatched to ${currentEmp.email}.`, 'info');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleSendReminderEmail = async () => {
    setIsSendingReminder(true);
    try {
      await sendProfileCompletionReminder(currentEmp.id);
    } finally {
      setIsSendingReminder(false);
    }
  };

  // 3. Banking & Super
  const decryptedTFN = employee.tfnEncrypted ? decryptAES256(employee.tfnEncrypted) : (employee.tfnMasked || '');
  const decryptedBSB = employee.bsbEncrypted ? decryptAES256(employee.bsbEncrypted) : (employee.bsbMasked || '');
  const decryptedAcc = employee.accountNumberEncrypted ? decryptAES256(employee.accountNumberEncrypted) : (employee.accountNumberMasked || '');

  const [tfnInput, setTfnInput] = useState(decryptedTFN || '123 456 782');
  const [bankName, setBankName] = useState(employee.bankName || 'Commonwealth Bank of Australia');
  const [bankBranch, setBankBranch] = useState(employee.bankBranch || 'Sydney NSW');
  const [accountName, setAccountName] = useState(employee.accountName || `${employee.firstName} ${employee.lastName}`);
  const [bsbInput, setBsbInput] = useState(decryptedBSB || '062-000');
  const [accInput, setAccInput] = useState(decryptedAcc || '10293847');
  const [superFundName, setSuperFundName] = useState(employee.superFundName || 'AustralianSuper');
  const [superMemberNumber, setSuperMemberNumber] = useState(employee.superMemberNumber || 'AUS-987654');

  // 4. Visa, Licence & Emergency
  const [citizenStatus, setCitizenStatus] = useState(employee.citizenStatus || 'Australian Citizen');
  const [visaType, setVisaType] = useState(employee.visaType || 'Subclass 482 (Temporary Skill Shortage)');
  const [visaExpiryDate, setVisaExpiryDate] = useState(employee.visaExpiryDate || '');
  
  const [hasDriverLicense, setHasDriverLicense] = useState<boolean>(employee.hasDriverLicense ?? true);
  const [licenseCountry, setLicenseCountry] = useState(employee.licenseCountry || 'NSW (Australia)');
  const [licenseNumber, setLicenseNumber] = useState(employee.licenseNumber || 'NSW-9482910');
  const [licenseExpiryDate, setLicenseExpiryDate] = useState(employee.licenseExpiryDate || '2027-11-20');

  const [emergencyNextOfKin, setEmergencyNextOfKin] = useState(employee.emergencyNextOfKin || '');
  const [emergencyRelationship, setEmergencyRelationship] = useState(employee.emergencyRelationship || 'Spouse / Partner');
  const [emergencyMobile, setEmergencyMobile] = useState(employee.emergencyMobile || '');

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();

    const bsbEnc = encryptAES256(bsbInput);
    const accEnc = encryptAES256(accInput);
    const tfnEnc = encryptAES256(tfnInput);
    const bsbMask = bsbInput.length >= 3 ? `${bsbInput.slice(0, 3)}-•••` : '•••-•••';
    const accMask = maskSensitive(accInput, 3);
    const tfnMask = maskSensitive(tfnInput, 3);

    updateEmployee(employee.id, {
      username: username.trim().toLowerCase() || employee.username,
      firstName,
      lastName,
      email,
      mobilePhone,
      address,
      suburb,
      state: state as any,
      postcode,
      startDate,
      department: department || undefined,
      jobTitle,
      workLocation,
      reportsTo,
      status: status as any,
      workingHours: Number(workingHours) || 38,
      workingHoursConfirmed: true,
      kioskPin: kioskPin.trim() || employee.kioskPin || '4829',
      visaStatusConfirmed: true,
      hasDriverLicense,
      licenseCountry,
      licenseNumber,
      licenseExpiryDate,
      bankName,
      bankBranch,
      accountName,
      bsbEncrypted: bsbEnc,
      bsbMasked: bsbMask,
      accountNumberEncrypted: accEnc,
      accountNumberMasked: accMask,
      tfnEncrypted: tfnEnc,
      tfnMasked: tfnMask,
      superFundName,
      superMemberNumber,
      citizenStatus: citizenStatus as any,
      visaType: citizenStatus === 'Australian Citizen' || citizenStatus === 'Permanent Resident' ? undefined : visaType,
      visaExpiryDate: citizenStatus === 'Australian Citizen' || citizenStatus === 'Permanent Resident' ? undefined : visaExpiryDate,
      emergencyNextOfKin,
      emergencyRelationship,
      emergencyMobile,
    });

    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 max-w-4xl w-full my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-xs shadow-black/20" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img 
              src={employee.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} 
              alt={employee.firstName} 
              className="w-14 h-14 rounded-2xl object-cover ring-2 ring-slate-700 shadow-md"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">{firstName} {lastName}</h2>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border inline-flex items-center gap-1 ${
                  status === 'Active' 
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                    : status === 'Pending'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    : 'bg-slate-700 text-slate-300 border-slate-600'
                }`}>
                  {status === 'Pending' && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />}
                  {status}
                </span>
                <span className="text-[10px] font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                  {department || 'Unassigned Dept'}
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium mt-0.5">
                {jobTitle} • ID: {employee.employeeNumber} • Started: {startDate || 'Date of Registration'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className={`px-3.5 py-2 rounded-xl font-bold text-xs transition cursor-pointer ${
                isEditing 
                  ? 'bg-amber-400 text-slate-950 shadow-sm' 
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
              }`}
            >
              {isEditing ? 'Cancel Editing' : 'Edit All Details'}
            </button>

            <button type="button" onClick={onClose} className="text-xs font-bold text-slate-400 hover:text-white px-2 py-1 transition cursor-pointer">
              Close
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-6 pt-3 bg-slate-50 border-b border-slate-200 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveSection('EMPLOYMENT')}
            className={`px-3.5 py-2 rounded-t-xl font-bold text-xs border-b-2 transition cursor-pointer ${
              activeSection === 'EMPLOYMENT' 
                ? 'border-slate-900 text-slate-900 bg-white' 
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Employment &amp; Role
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('PERSONAL')}
            className={`px-3.5 py-2 rounded-t-xl font-bold text-xs border-b-2 transition cursor-pointer ${
              activeSection === 'PERSONAL' 
                ? 'border-slate-900 text-slate-900 bg-white' 
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Personal &amp; Contact
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('VISA_LICENCE_EMERGENCY')}
            className={`px-3.5 py-2 rounded-t-xl font-bold text-xs border-b-2 transition cursor-pointer ${
              activeSection === 'VISA_LICENCE_EMERGENCY' 
                ? 'border-slate-900 text-slate-900 bg-white' 
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Visa, Licence &amp; Emergency
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('BANKING')}
            className={`px-3.5 py-2 rounded-t-xl font-bold text-xs border-b-2 transition cursor-pointer ${
              activeSection === 'BANKING' 
                ? 'border-slate-900 text-slate-900 bg-white' 
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Banking &amp; Super
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('DOCUMENTS')}
            className={`px-3.5 py-2 rounded-t-xl font-bold text-xs border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeSection === 'DOCUMENTS' 
                ? 'border-slate-900 text-slate-900 bg-white' 
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <span>Uploaded Documents</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
              (currentEmp.documents?.filter(d => d.status === 'Pending').length || 0) > 0 
                ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                : 'bg-slate-200 text-slate-700'
            }`}>
              {currentEmp.documents?.length || 0}
            </span>
          </button>
        </div>

        {/* Content Body Form */}
        <form onSubmit={handleSaveAll}>
          <div className="p-6 space-y-6 max-h-[62vh] overflow-y-auto text-xs">
            
            {/* Self-Onboarding Status Info Banner */}
            {currentEmp.status === 'Pending' && (() => {
              const progress = getOnboardingProgress(currentEmp);

              return (
                <div className="p-5 bg-gradient-to-br from-amber-50 to-orange-50/40 border-2 border-amber-300 rounded-3xl space-y-4 shadow-xs animate-in fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-200/60 pb-3.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-amber-950 text-sm">Staff Self-Onboarding In Progress</h4>
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 font-black text-[10px] border border-amber-300 animate-pulse">
                          {progress.completedCount} of 4 Completed ({progress.percent}%)
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-900/80 mt-0.5">
                        Staff member must log in to complete all required profile sections. Once submitted, status will automatically switch to <strong>Active</strong>.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                      <button
                        type="button"
                        disabled={isSendingReminder}
                        onClick={handleSendReminderEmail}
                        className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white font-bold text-xs shadow-sm transition cursor-pointer flex items-center gap-1.5"
                        title={`Send Profile Completion Reminder Email to ${currentEmp.email}`}
                      >
                        <span>{isSendingReminder ? 'Sending...' : 'Send Profile Reminder'}</span>
                      </button>

                      <button
                        type="button"
                        disabled={isSendingEmail}
                        onClick={handleResendInviteEmail}
                        className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs shadow-xs transition cursor-pointer flex items-center gap-1.5"
                        title="Resend 1-Hour Account Setup Email"
                      >
                        <span>{isSendingEmail ? 'Sending...' : 'Resend Invite'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
                          const token = currentEmp.inviteToken || `inv-${currentEmp.id}`;
                          const url = `${origin}/?invite=${token}&email=${encodeURIComponent(currentEmp.email)}`;
                          navigator.clipboard.writeText(url);
                          addToast('Copied Link', 'Invitation link copied to clipboard.', 'info');
                        }}
                        className="px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition cursor-pointer flex items-center gap-1.5"
                      >
                        <span>Copy Link</span>
                      </button>
                    </div>
                  </div>

                  {/* 4 Required Profile Sections Progress Matrix */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                    {progress.sections.map((sec, idx) => (
                      <div 
                        key={sec.id}
                        className={`p-3 rounded-2xl border transition flex flex-col justify-between ${
                          sec.isDone 
                            ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950' 
                            : 'bg-white/90 border-amber-300 text-amber-950'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-mono font-bold text-slate-400">0{idx + 1}</span>
                            {sec.isDone ? (
                              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                                Done
                              </span>
                            ) : (
                              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 animate-pulse">
                                Required
                              </span>
                            )}
                          </div>
                          <span className="font-bold text-xs block">{sec.title}</span>
                          <span className="text-[10px] text-slate-500 block mt-0.5">{sec.description}</span>
                        </div>
                        {!sec.isDone && sec.missingFields.length > 0 && (
                          <div className="mt-2 pt-1.5 border-t border-amber-200/60 text-[10px] text-amber-800">
                            Missing: {sec.missingFields.slice(0, 2).join(', ')}{sec.missingFields.length > 2 ? '...' : ''}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* 1. EMPLOYMENT & ROLE */}
            {activeSection === 'EMPLOYMENT' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">Position, Department &amp; Schedule</h3>
                    <p className="text-slate-500 text-[11px]">Manage official role specifications, working hours and start date</p>
                  </div>
                  {isEditing && (
                    <span className="text-[10px] font-black bg-orange-100 text-orange-800 px-2.5 py-0.5 rounded-full">
                      Editing Mode Active
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Employment Start Date</label>
                    <input
                      type="date"
                      disabled={!isEditing}
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 rounded-xl bg-white disabled:bg-slate-50 font-bold text-slate-900 focus:ring-2 focus:ring-orange-500/20"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Defaults to registration date.</span>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Assigned Department</label>
                    <select
                      disabled={!isEditing}
                      value={department}
                      onChange={e => setDepartment(e.target.value as Department)}
                      className="w-full p-2.5 border border-slate-300 rounded-xl bg-white disabled:bg-slate-50 font-bold text-slate-900 focus:ring-2 focus:ring-orange-500/20 cursor-pointer"
                    >
                      <option value="">-- Unassigned (Pending Admin) --</option>
                      <option value="Production (Riverwood)">Production (Riverwood)</option>
                      <option value="Production (Rockdale)">Production (Rockdale)</option>
                      <option value="Design">Design</option>
                      <option value="Administration">Administration</option>
                      <option value="Sales & Marketing">Sales & Marketing</option>
                      <option value="Human Resources">Human Resources</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Job Title</label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={jobTitle}
                      onChange={e => setJobTitle(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 rounded-xl bg-white disabled:bg-slate-50 font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1 flex items-center justify-between">
                      <span>Shift Username</span>
                      <span className="text-[10px] text-cyan-600 font-bold font-mono">Shift Terminal</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold text-xs">@</span>
                      <input
                        type="text"
                        disabled={!isEditing}
                        value={username}
                        onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                        className="w-full pl-7 pr-3 p-2.5 border border-slate-300 rounded-xl bg-white disabled:bg-slate-50 font-mono font-bold text-slate-900 text-xs"
                        placeholder="suman.thapa"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Unique username required for shift terminal clock-ins.</span>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1 flex items-center justify-between">
                      <span>4-Digit Shift Punch PIN</span>
                      <span className="text-[10px] text-orange-600 font-black font-mono">Shift Punch</span>
                    </label>
                    <input
                      type="text"
                      maxLength={4}
                      inputMode="numeric"
                      disabled={!isEditing}
                      value={kioskPin}
                      onChange={e => setKioskPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      className="w-full p-2.5 border border-slate-300 rounded-xl bg-white disabled:bg-slate-50 font-mono font-black text-orange-600 tracking-widest text-center text-sm"
                      placeholder="4829"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Staff punch-in PIN. SuperAdmin can view and change anytime.</span>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Employment Status</label>
                    <select
                      disabled={!isEditing}
                      value={status}
                      onChange={e => setStatus(e.target.value as any)}
                      className="w-full p-2.5 border border-slate-300 rounded-xl bg-white disabled:bg-slate-50 font-bold text-slate-900 cursor-pointer"
                    >
                      <option value="Active">Active (Permanent)</option>
                      <option value="Pending">Pending (Onboarding)</option>
                      <option value="On Leave">On Leave</option>
                      <option value="Terminated">Terminated</option>
                      <option value="Archived">Archived</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Weekly Standard Hours</label>
                    <input
                      type="number"
                      step="0.5"
                      disabled={!isEditing}
                      value={workingHours}
                      onChange={e => setWorkingHours(parseFloat(e.target.value) || 0)}
                      className="w-full p-2.5 border border-slate-300 rounded-xl bg-white disabled:bg-slate-50 font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Work Location</label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={workLocation}
                      onChange={e => setWorkLocation(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 rounded-xl bg-white disabled:bg-slate-50 font-bold text-slate-900"
                    />
                  </div>

                  <div className="sm:col-span-2 lg:col-span-3">
                    <label className="font-bold text-slate-700 block mb-1">Direct Supervisor / Reports To</label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={reportsTo}
                      onChange={e => setReportsTo(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 rounded-xl bg-white disabled:bg-slate-50 font-bold text-slate-900"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 2. PERSONAL & CONTACT */}
            {activeSection === 'PERSONAL' && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-2">
                  <h3 className="font-extrabold text-sm text-slate-900">Personal &amp; Contact Details</h3>
                  <p className="text-slate-500 text-[11px]">Full legal name, direct mobile, email and residential address</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">First Name *</label>
                    <input
                      type="text"
                      required
                      disabled={!isEditing}
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 rounded-xl bg-white disabled:bg-slate-50 font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Last Name *</label>
                    <input
                      type="text"
                      required
                      disabled={!isEditing}
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 rounded-xl bg-white disabled:bg-slate-50 font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Official Email Address *</label>
                    <input
                      type="email"
                      required
                      disabled={!isEditing}
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 rounded-xl bg-white disabled:bg-slate-50 font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Direct Mobile Phone</label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={mobilePhone}
                      onChange={e => setMobilePhone(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 rounded-xl bg-white disabled:bg-slate-50 font-bold text-slate-900"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="font-bold text-slate-700 block mb-1">Residential Street Address</label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 rounded-xl bg-white disabled:bg-slate-50 font-bold text-slate-900"
                      placeholder="e.g. 45 King Georges Road"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Suburb / City</label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={suburb}
                      onChange={e => setSuburb(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 rounded-xl bg-white disabled:bg-slate-50 font-bold text-slate-900"
                      placeholder="e.g. Riverwood"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">State</label>
                      <input
                        type="text"
                        disabled={!isEditing}
                        value={state}
                        onChange={e => setState(e.target.value)}
                        className="w-full p-2.5 border border-slate-300 rounded-xl bg-white disabled:bg-slate-50 font-bold text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Postcode</label>
                      <input
                        type="text"
                        disabled={!isEditing}
                        value={postcode}
                        onChange={e => setPostcode(e.target.value)}
                        className="w-full p-2.5 border border-slate-300 rounded-xl bg-white disabled:bg-slate-50 font-bold text-slate-900"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. VISA, LICENCE & EMERGENCY */}
            {activeSection === 'VISA_LICENCE_EMERGENCY' && (
              <div className="space-y-6">
                
                {/* Visa & Citizenship */}
                <div className="space-y-3">
                  <div className="border-b border-slate-100 pb-2">
                    <h3 className="font-extrabold text-sm text-slate-900">Legal Work Rights &amp; Visa Compliance</h3>
                    <p className="text-slate-500 text-[11px]">Australian Citizenship, PR or VEVO tracked temporary visa</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Citizenship / Residency Status</label>
                      <select
                        disabled={!isEditing}
                        value={citizenStatus}
                        onChange={e => setCitizenStatus(e.target.value)}
                        className="w-full p-2.5 border border-slate-300 rounded-xl bg-white disabled:bg-slate-50 font-bold text-slate-900 cursor-pointer"
                      >
                        <option value="Australian Citizen">Australian Citizen</option>
                        <option value="Permanent Resident">Permanent Resident</option>
                        <option value="New Zealand Citizen">New Zealand Citizen (Special Category)</option>
                        <option value="Temporary Resident (Visa)">Temporary Resident (Visa)</option>
                        <option value="Student Visa">Student Visa (Work Limited)</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Visa Subclass / Type</label>
                      <input
                        type="text"
                        disabled={!isEditing || citizenStatus === 'Australian Citizen' || citizenStatus === 'Permanent Resident'}
                        value={visaType}
                        onChange={e => setVisaType(e.target.value)}
                        className="w-full p-2.5 border border-slate-300 rounded-xl bg-white disabled:bg-slate-50 font-bold text-slate-900"
                        placeholder="e.g. Subclass 482 / TSS"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">VEVO Expiry Date</label>
                      <input
                        type="date"
                        disabled={!isEditing || citizenStatus === 'Australian Citizen' || citizenStatus === 'Permanent Resident'}
                        value={visaExpiryDate}
                        onChange={e => setVisaExpiryDate(e.target.value)}
                        className="w-full p-2.5 border border-slate-300 rounded-xl bg-white disabled:bg-slate-50 font-bold text-slate-900"
                      />
                    </div>
                  </div>
                </div>

                {/* Driver Licence & Operating Permits */}
                <div className="space-y-3 pt-2">
                  <div className="border-b border-slate-100 pb-2">
                    <h3 className="font-extrabold text-sm text-slate-900">Driver Licence &amp; Operating Permits</h3>
                    <p className="text-slate-500 text-[11px]">Australian or international driver licence, class and expiration tracking</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Driver Licence Status</label>
                      <select
                        disabled={!isEditing}
                        value={hasDriverLicense ? 'YES' : 'NO'}
                        onChange={e => setHasDriverLicense(e.target.value === 'YES')}
                        className="w-full p-2.5 border border-slate-300 rounded-xl bg-white disabled:bg-slate-50 font-bold text-slate-900 cursor-pointer"
                      >
                        <option value="YES">Valid Driver Licence on File</option>
                        <option value="NO">No Driver Licence</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Licence Number</label>
                      <input
                        type="text"
                        disabled={!isEditing || !hasDriverLicense}
                        value={licenseNumber}
                        onChange={e => setLicenseNumber(e.target.value)}
                        placeholder="e.g. 9482910"
                        className="w-full p-2.5 border border-slate-300 rounded-xl bg-white disabled:bg-slate-50 font-mono font-bold text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Issuing State / Country</label>
                      <input
                        type="text"
                        disabled={!isEditing || !hasDriverLicense}
                        value={licenseCountry}
                        onChange={e => setLicenseCountry(e.target.value)}
                        placeholder="e.g. NSW (Australia)"
                        className="w-full p-2.5 border border-slate-300 rounded-xl bg-white disabled:bg-slate-50 font-bold text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Licence Expiry Date</label>
                      <input
                        type="date"
                        disabled={!isEditing || !hasDriverLicense}
                        value={licenseExpiryDate}
                        onChange={e => setLicenseExpiryDate(e.target.value)}
                        className="w-full p-2.5 border border-slate-300 rounded-xl bg-white disabled:bg-slate-50 font-bold text-slate-900"
                      />
                    </div>
                  </div>
                </div>

                {/* Emergency Contact */}
                <div className="space-y-3 pt-2">
                  <div className="border-b border-slate-100 pb-2">
                    <h3 className="font-extrabold text-sm text-slate-900">Emergency Next of Kin</h3>
                    <p className="text-slate-500 text-[11px]">Primary contact in case of workplace emergency</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Next of Kin Full Name</label>
                      <input
                        type="text"
                        disabled={!isEditing}
                        value={emergencyNextOfKin}
                        onChange={e => setEmergencyNextOfKin(e.target.value)}
                        className="w-full p-2.5 border border-slate-300 rounded-xl bg-white disabled:bg-slate-50 font-bold text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Relationship</label>
                      <input
                        type="text"
                        disabled={!isEditing}
                        value={emergencyRelationship}
                        onChange={e => setEmergencyRelationship(e.target.value)}
                        className="w-full p-2.5 border border-slate-300 rounded-xl bg-white disabled:bg-slate-50 font-bold text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Emergency Mobile</label>
                      <input
                        type="text"
                        disabled={!isEditing}
                        value={emergencyMobile}
                        onChange={e => setEmergencyMobile(e.target.value)}
                        className="w-full p-2.5 border border-slate-300 rounded-xl bg-white disabled:bg-slate-50 font-bold text-slate-900"
                      />
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* 4. BANKING & SUPERANNUATION */}
            {activeSection === 'BANKING' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">Confidential Bank, TFN &amp; Superannuation Vault</h3>
                    <p className="text-slate-500 text-[11px]">Protected under AES-256 Australian privacy and payroll encryption</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowEncrypted(!showEncrypted)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                      showEncrypted 
                        ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                        : 'bg-slate-900 text-white hover:bg-slate-800'
                    }`}
                  >
                    <span>{showEncrypted ? 'Hide Plaintext (Logged)' : 'Decrypt Full Details'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Tax File Number (TFN)</label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={showEncrypted || isEditing ? tfnInput : employee.tfnMasked || '•••-•••-782'}
                      onChange={e => setTfnInput(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 rounded-xl bg-white disabled:bg-slate-50 font-mono font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Bank Name</label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={bankName}
                      onChange={e => setBankName(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 rounded-xl bg-white disabled:bg-slate-50 font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Bank Branch</label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={bankBranch}
                      onChange={e => setBankBranch(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 rounded-xl bg-white disabled:bg-slate-50 font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Account Name</label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={accountName}
                      onChange={e => setAccountName(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 rounded-xl bg-white disabled:bg-slate-50 font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">BSB (6-digit Australian)</label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={showEncrypted || isEditing ? bsbInput : employee.bsbMasked || '062-•••'}
                      onChange={e => setBsbInput(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 rounded-xl bg-white disabled:bg-slate-50 font-mono font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Account Number</label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={showEncrypted || isEditing ? accInput : employee.accountNumberMasked || '•••••847'}
                      onChange={e => setAccInput(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 rounded-xl bg-white disabled:bg-slate-50 font-mono font-bold text-slate-900"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="font-bold text-slate-700 block mb-1">Superannuation Fund Name</label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={superFundName}
                      onChange={e => setSuperFundName(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 rounded-xl bg-white disabled:bg-slate-50 font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Super Member Number</label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={superMemberNumber}
                      onChange={e => setSuperMemberNumber(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 rounded-xl bg-white disabled:bg-slate-50 font-mono font-bold text-slate-900"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 5. UPLOADED DOCUMENTS & COMPLIANCE VAULT */}
            {activeSection === 'DOCUMENTS' && (
              <EmployeeDocumentsTab employeeId={employee.id} />
            )}

          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
            <div className="text-[11px] text-slate-500">
              {isEditing ? (
                <span className="text-amber-800 font-bold">
                  Unsaved changes — Click "Save All Changes" to broadcast updates to staff portal.
                </span>
              ) : (
                <span>All records synchronized with HsCreations NSW HR Vault.</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 font-bold hover:bg-slate-50 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-xl bg-slate-900 text-white font-bold transition hover:bg-slate-800 cursor-pointer"
                  >
                    Save All Changes
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition cursor-pointer"
                >
                  Close Profile
                </button>
              )}
            </div>
          </div>
        </form>

      </div>
    </div>
  );
}
