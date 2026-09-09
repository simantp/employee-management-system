'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store';
import { AUState, CitizenStatus, Department } from '@/types';
import { formatBSB } from '@/lib/utils';
import { encryptAES256 } from '@/lib/crypto';

export default function AddEmployeeModal({ onClose }: { onClose: () => void }) {
  const { addEmployee } = useApp();

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.email) {
      alert('Please fill out required fields');
      return;
    }

    const tfnEnc = encryptAES256(form.tfn);
    const bsbEnc = encryptAES256(form.bsb);
    const accEnc = encryptAES256(form.accountNumber);

    addEmployee({
      employeeNumber: `EMP-00${Math.floor(Math.random() * 900 + 100)}`,
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      mobilePhone: form.mobilePhone,
      dateOfBirth: form.dateOfBirth,
      startDate: form.startDate,
      gender: form.gender,
      address: form.address,
      suburb: form.suburb,
      state: form.state,
      postcode: form.postcode,
      department: form.department,
      jobTitle: form.jobTitle,
      workLocation: form.workLocation,
      reportsTo: form.reportsTo,
      status: form.status,
      avatarUrl: `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random() * 40)}?w=150`,
      citizenStatus: form.citizenStatus,
      visaType: form.visaType,
      visaExpiryDate: form.visaExpiryDate,
      workRestrictions: form.workRestrictions,
      hasDriverLicense: form.hasDriverLicense,
      licenseCountry: form.licenseCountry,
      licenseNumber: form.licenseNumber,
      licenseExpiryDate: form.licenseExpiryDate,
      emergencyNextOfKin: form.emergencyNextOfKin,
      emergencyRelationship: form.emergencyRelationship,
      emergencyAddress: form.emergencyAddress,
      emergencySuburb: form.emergencySuburb,
      emergencyState: form.emergencyState,
      emergencyPostcode: form.emergencyPostcode,
      emergencyMobile: form.emergencyMobile,
      tfnMasked: form.tfn ? `•••-•••-${form.tfn.slice(-3)}` : '•••-•••-•••',
      tfnEncrypted: tfnEnc,
      superFundName: form.superFundName,
      superMemberNumber: form.superMemberNumber,
      bankName: form.bankName,
      bankBranch: form.bankBranch,
      accountName: form.accountName || `${form.firstName} ${form.lastName}`,
      bsbMasked: form.bsb ? formatBSB(form.bsb) : '•••-•••',
      bsbEncrypted: bsbEnc,
      accountNumberMasked: form.accountNumber ? `••••••${form.accountNumber.slice(-3)}` : '••••••••',
      accountNumberEncrypted: accEnc,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full my-8 overflow-hidden animate-in fade-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Add New Australian Employee</h3>
            <p className="text-[11px] text-slate-500">Intake Form matching System Specification</p>
          </div>
          <button onClick={onClose} className="text-xs font-bold text-slate-400 hover:text-slate-700 px-2 py-1 transition cursor-pointer">
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs">
          <div>
            <h4 className="font-bold text-slate-900 border-b pb-1 mb-3 text-xs uppercase tracking-wider text-blue-600">
              1. Personal & Identity
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">First Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Liam"
                  value={form.firstName}
                  onChange={e => setForm({...form, firstName: e.target.value})}
                  className="w-full p-2 border rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Last Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Wilson"
                  value={form.lastName}
                  onChange={e => setForm({...form, lastName: e.target.value})}
                  className="w-full p-2 border rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Work Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="liam.wilson@company.com"
                  value={form.email}
                  onChange={e => setForm({...form, email: e.target.value})}
                  className="w-full p-2 border rounded-lg bg-slate-50 focus:bg-white focus:outline-none"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Australian Mobile *</label>
                <input
                  type="text"
                  placeholder="0412 345 678"
                  value={form.mobilePhone}
                  onChange={e => setForm({...form, mobilePhone: e.target.value})}
                  className="w-full p-2 border rounded-lg bg-slate-50 focus:bg-white"
                />
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 border-b pb-1 mb-3 text-xs uppercase tracking-wider text-blue-600">
              2. Residential Address & Department
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="font-bold text-slate-700 block mb-1">Street Address</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={e => setForm({...form, address: e.target.value})}
                  className="w-full p-2 border rounded-lg bg-slate-50"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Suburb</label>
                <input
                  type="text"
                  value={form.suburb}
                  onChange={e => setForm({...form, suburb: e.target.value})}
                  className="w-full p-2 border rounded-lg bg-slate-50"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Department</label>
                <select
                  value={form.department}
                  onChange={e => setForm({...form, department: e.target.value as any})}
                  className="w-full p-2 border rounded-lg bg-slate-50"
                >
                  <option value="Production (Riverwood)">Production (Riverwood)</option>
                  <option value="Production (Rockdale)">Production (Rockdale)</option>
                  <option value="Design">Design</option>
                  <option value="Administration">Administration</option>
                  <option value="Sales & Marketing">Sales & Marketing</option>
                </select>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">State (AU)</label>
                <select
                  value={form.state}
                  onChange={e => setForm({...form, state: e.target.value as any})}
                  className="w-full p-2 border rounded-lg bg-slate-50"
                >
                  <option value="NSW">NSW</option>
                  <option value="VIC">VIC</option>
                  <option value="QLD">QLD</option>
                  <option value="WA">WA</option>
                </select>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Postcode</label>
                <input
                  type="text"
                  value={form.postcode}
                  onChange={e => setForm({...form, postcode: e.target.value})}
                  className="w-full p-2 border rounded-lg bg-slate-50"
                />
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 text-white space-y-3">
            <div className="flex items-center gap-2 text-cyan-400">
              <h4 className="font-bold text-xs uppercase tracking-wider">
                3. Bank Details & TFN (Encrypted with AES-256-GCM)
              </h4>
            </div>
            <div className="grid grid-cols-2 gap-3 text-slate-800">
              <div>
                <label className="font-bold text-slate-200 block mb-1">Tax File Number (TFN)</label>
                <input
                  type="password"
                  placeholder="9-digit TFN"
                  value={form.tfn}
                  onChange={e => setForm({...form, tfn: e.target.value})}
                  className="w-full p-2 border rounded-lg bg-white"
                />
              </div>
              <div>
                <label className="font-bold text-slate-200 block mb-1">BSB Number (XXX-XXX)</label>
                <input
                  type="text"
                  placeholder="062-000"
                  value={form.bsb}
                  onChange={e => setForm({...form, bsb: e.target.value})}
                  className="w-full p-2 border rounded-lg bg-white"
                />
              </div>
              <div>
                <label className="font-bold text-slate-200 block mb-1">Bank Name</label>
                <input
                  type="text"
                  value={form.bankName}
                  onChange={e => setForm({...form, bankName: e.target.value})}
                  className="w-full p-2 border rounded-lg bg-white"
                />
              </div>
              <div>
                <label className="font-bold text-slate-200 block mb-1">Account Number</label>
                <input
                  type="password"
                  value={form.accountNumber}
                  onChange={e => setForm({...form, accountNumber: e.target.value})}
                  className="w-full p-2 border rounded-lg bg-white"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
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
              Register Employee
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
