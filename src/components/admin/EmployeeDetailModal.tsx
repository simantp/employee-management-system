'use client';

import React, { useState } from 'react';
import { 
  X, 
  Lock, 
  Unlock, 
  ShieldAlert, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  FileText, 
  CheckCircle2, 
  ShieldCheck,
  Edit3,
  Save,
  Check,
  Briefcase,
  UserCheck,
  Palmtree,
  CreditCard,
  User,
  HeartHandshake
} from 'lucide-react';
import { Employee, Department, LeaveBalance } from '@/types';
import { decryptAES256, encryptAES256, maskSensitive } from '@/lib/crypto';
import { useApp } from '@/lib/store';

export default function EmployeeDetailModal({
  employee,
  onClose
}: {
  employee: Employee;
  onClose: () => void;
}) {
  const { updateEmployee } = useApp();
  const [activeSection, setActiveSection] = useState<'EMPLOYMENT' | 'LEAVE' | 'PERSONAL' | 'BANKING' | 'VISA_EMERGENCY'>('EMPLOYMENT');
  const [isEditing, setIsEditing] = useState(false);
  const [showEncrypted, setShowEncrypted] = useState(false);

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
  const [startDate, setStartDate] = useState(employee.startDate || '');
  const [department, setDepartment] = useState<Department | ''>(employee.department || '');
  const [jobTitle, setJobTitle] = useState(employee.jobTitle || 'Staff Member');
  const [workLocation, setWorkLocation] = useState(employee.workLocation || 'Sydney, NSW');
  const [reportsTo, setReportsTo] = useState(employee.reportsTo || 'Operations Lead');
  const [status, setStatus] = useState(employee.status || 'Active');
  const [workingHours, setWorkingHours] = useState<number>(employee.workingHours || 38);
  const [kioskPin, setKioskPin] = useState(employee.kioskPin || '4829');

  // 3. Leave Balances Management
  const [annualLeave, setAnnualLeave] = useState<number>(employee.leaveBalance?.annual ?? 20);
  const [sickLeave, setSickLeave] = useState<number>(employee.leaveBalance?.sick ?? 10);
  const [carersLeave, setCarersLeave] = useState<number>(employee.leaveBalance?.carers ?? 5);
  const [longServiceLeave, setLongServiceLeave] = useState<number>(employee.leaveBalance?.longService ?? 0);

  // 4. Banking & Super
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

  // 5. Visa & Emergency
  const [citizenStatus, setCitizenStatus] = useState(employee.citizenStatus || 'Australian Citizen');
  const [visaType, setVisaType] = useState(employee.visaType || 'Subclass 482 (Temporary Skill Shortage)');
  const [visaExpiryDate, setVisaExpiryDate] = useState(employee.visaExpiryDate || '');
  const [emergencyNextOfKin, setEmergencyNextOfKin] = useState(employee.emergencyNextOfKin || '');
  const [emergencyRelationship, setEmergencyRelationship] = useState(employee.emergencyRelationship || 'Spouse / Partner');
  const [emergencyMobile, setEmergencyMobile] = useState(employee.emergencyMobile || '');

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedLeaveBalance: LeaveBalance = {
      annual: Number(annualLeave) || 0,
      sick: Number(sickLeave) || 0,
      carers: Number(carersLeave) || 0,
      longService: Number(longServiceLeave) || 0,
    };

    const bsbEnc = encryptAES256(bsbInput);
    const accEnc = encryptAES256(accInput);
    const tfnEnc = encryptAES256(tfnInput);
    const bsbMask = bsbInput.length >= 3 ? `${bsbInput.slice(0, 3)}-•••` : '•••-•••';
    const accMask = maskSensitive(accInput, 3);
    const tfnMask = maskSensitive(tfnInput, 3);

    updateEmployee(employee.id, {
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
      leaveBalance: updatedLeaveBalance,
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
        <div className="p-6 bg-gradient-to-r from-slate-950 via-slate-900 to-navy-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img 
              src={employee.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} 
              alt={employee.firstName} 
              className="w-14 h-14 rounded-2xl object-cover ring-2 ring-orange-400 shadow-md"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">{firstName} {lastName}</h2>
                <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                  status === 'Active' 
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                }`}>
                  {status}
                </span>
                <span className="text-[10px] font-bold text-orange-400 bg-orange-950/60 px-2 py-0.5 rounded border border-orange-800/40">
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
              className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer ${
                isEditing 
                  ? 'bg-amber-500 text-slate-950 font-black shadow-lg' 
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditing ? 'Cancel Editing' : 'Edit All Details'}</span>
            </button>

            <button type="button" onClick={onClose} className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-6 pt-3 bg-slate-50 border-b border-slate-200 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveSection('EMPLOYMENT')}
            className={`px-3.5 py-2 rounded-t-xl font-bold text-xs flex items-center gap-1.5 border-b-2 transition cursor-pointer ${
              activeSection === 'EMPLOYMENT' 
                ? 'border-orange-500 text-orange-600 bg-white shadow-xs' 
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Employment &amp; Role</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('LEAVE')}
            className={`px-3.5 py-2 rounded-t-xl font-bold text-xs flex items-center gap-1.5 border-b-2 transition cursor-pointer ${
              activeSection === 'LEAVE' 
                ? 'border-orange-500 text-orange-600 bg-white shadow-xs' 
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Palmtree className="w-3.5 h-3.5" />
            <span>Leave Balances ({annualLeave + sickLeave + carersLeave + longServiceLeave}d)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('PERSONAL')}
            className={`px-3.5 py-2 rounded-t-xl font-bold text-xs flex items-center gap-1.5 border-b-2 transition cursor-pointer ${
              activeSection === 'PERSONAL' 
                ? 'border-orange-500 text-orange-600 bg-white shadow-xs' 
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Personal &amp; Contact</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('VISA_EMERGENCY')}
            className={`px-3.5 py-2 rounded-t-xl font-bold text-xs flex items-center gap-1.5 border-b-2 transition cursor-pointer ${
              activeSection === 'VISA_EMERGENCY' 
                ? 'border-orange-500 text-orange-600 bg-white shadow-xs' 
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Visa &amp; Emergency</span>
          </button>
        </div>

        {/* Content Body Form */}
        <form onSubmit={handleSaveAll}>
          <div className="p-6 space-y-6 max-h-[62vh] overflow-y-auto text-xs">
            
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
                      <span>4-Digit Kiosk Punch PIN</span>
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

            {/* 2. LEAVE BALANCES MANAGEMENT */}
            {activeSection === 'LEAVE' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">Fair Work Australia Statutory Leave Balances</h3>
                    <p className="text-slate-500 text-[11px]">Adjusting these balances updates the staff member's live leave portal instantly</p>
                  </div>
                  <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                    Total: {annualLeave + sickLeave + carersLeave + longServiceLeave} Accrued Days
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  
                  {/* Annual Leave */}
                  <div className="p-4 rounded-2xl bg-orange-50/60 border border-orange-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-orange-950 text-xs">Annual Leave</span>
                      <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                    </div>
                    <div>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        disabled={!isEditing}
                        value={annualLeave}
                        onChange={e => setAnnualLeave(parseFloat(e.target.value) || 0)}
                        className="w-full p-2.5 text-lg font-black border border-orange-300 rounded-xl bg-white disabled:bg-orange-50/50 text-orange-950 focus:ring-2 focus:ring-orange-500/20"
                      />
                      <span className="text-[10px] text-orange-800 font-semibold block mt-1">Days accrued (NES 20 days/yr)</span>
                    </div>
                  </div>

                  {/* Sick Leave */}
                  <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-950 text-xs">Sick Leave</span>
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    </div>
                    <div>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        disabled={!isEditing}
                        value={sickLeave}
                        onChange={e => setSickLeave(parseFloat(e.target.value) || 0)}
                        className="w-full p-2.5 text-lg font-black border border-amber-300 rounded-xl bg-white disabled:bg-amber-50/50 text-amber-950 focus:ring-2 focus:ring-amber-500/20"
                      />
                      <span className="text-[10px] text-amber-800 font-semibold block mt-1">Days accrued (NES 10 days/yr)</span>
                    </div>
                  </div>

                  {/* Personal / Carer's Leave */}
                  <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-950 text-xs">Personal / Carers</span>
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    </div>
                    <div>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        disabled={!isEditing}
                        value={carersLeave}
                        onChange={e => setCarersLeave(parseFloat(e.target.value) || 0)}
                        className="w-full p-2.5 text-lg font-black border border-emerald-300 rounded-xl bg-white disabled:bg-emerald-50/50 text-emerald-950 focus:ring-2 focus:ring-emerald-500/20"
                      />
                      <span className="text-[10px] text-emerald-800 font-semibold block mt-1">Days accrued (Fair Work NSW)</span>
                    </div>
                  </div>

                  {/* Long Service Leave */}
                  <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-indigo-950 text-xs">Long Service Leave</span>
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                    </div>
                    <div>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        disabled={!isEditing}
                        value={longServiceLeave}
                        onChange={e => setLongServiceLeave(parseFloat(e.target.value) || 0)}
                        className="w-full p-2.5 text-lg font-black border border-indigo-300 rounded-xl bg-white disabled:bg-indigo-50/50 text-indigo-950 focus:ring-2 focus:ring-indigo-500/20"
                      />
                      <span className="text-[10px] text-indigo-800 font-semibold block mt-1">NSW 10-year tenure accrual</span>
                    </div>
                  </div>

                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-slate-600 text-[11px]">
                  💡 <strong>Sync Guarantee:</strong> Saving changes here directly updates the staff member's live leave balances in their Staff Portal under the <strong>Leave Management</strong> section.
                </div>
              </div>
            )}

            {/* 3. PERSONAL & CONTACT */}
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
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer ${
                      showEncrypted 
                        ? 'bg-rose-500/20 text-rose-700 border border-rose-300' 
                        : 'bg-orange-500 text-slate-950 font-black hover:bg-orange-400'
                    }`}
                  >
                    {showEncrypted ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
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

            {/* 5. VISA & EMERGENCY */}
            {activeSection === 'VISA_EMERGENCY' && (
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

          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
            <div className="text-[11px] text-slate-500">
              {isEditing ? (
                <span className="text-orange-700 font-bold flex items-center gap-1">
                  <span>⚠️ Unsaved changes</span> — Click "Save All Changes" to broadcast updates to staff portal.
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
                    className="px-6 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-black flex items-center gap-2 shadow-lg shadow-orange-500/20 hover:from-orange-400 hover:to-amber-400 transition cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save All Changes &amp; Notify Staff</span>
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
