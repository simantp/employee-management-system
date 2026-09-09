'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store';
import { validateAUBSB, formatBSB } from '@/lib/utils';
import { encryptAES256 } from '@/lib/crypto';

export default function BankDetailsModal({ onClose }: { onClose: () => void }) {
  const { currentStaff, updateBankDetails } = useApp();

  const [form, setForm] = useState({
    bankName: currentStaff.bankName || 'Commonwealth Bank of Australia',
    bankBranch: currentStaff.bankBranch || 'Riverwood Branch',
    accountName: currentStaff.accountName || `${currentStaff.firstName} ${currentStaff.lastName}`,
    bsb: '062-184',
    accountNumber: '104856789',
    superFund: currentStaff.superFundName || 'AustralianSuper',
    superNumber: currentStaff.superMemberNumber || 'AUS-998241',
  });

  const isBsbValid = validateAUBSB(form.bsb);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBsbValid) {
      alert('Please enter a valid 6-digit Australian BSB number (e.g. 062-184)');
      return;
    }

    updateBankDetails(currentStaff.id, {
      bankName: form.bankName,
      bankBranch: form.bankBranch,
      accountName: form.accountName,
      bsb: formatBSB(form.bsb),
      accountNumber: form.accountNumber,
      superFund: form.superFund,
      superNumber: form.superNumber,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 bg-gradient-to-r from-navy-950 to-navy-900 text-white flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Self-Service Banking &amp; Super</h3>
            <p className="text-[11px] text-cyan-300">Protected with AES-256 Application-Level Encryption</p>
          </div>
          <button onClick={onClose} className="text-xs font-semibold text-slate-400 hover:text-white px-2 py-1 rounded-lg hover:bg-white/10 transition cursor-pointer">
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="p-3.5 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-900 flex items-start gap-2.5">
            <p className="text-[11px] leading-relaxed">
              Your banking details are encrypted on the server before being saved into the database. Updates trigger an instant real-time notification to the Payroll Admin.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Bank Name</label>
              <input
                type="text"
                required
                value={form.bankName}
                onChange={e => setForm({...form, bankName: e.target.value})}
                className="w-full p-2.5 border rounded-xl bg-slate-50 font-semibold focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Bank Branch</label>
              <input
                type="text"
                value={form.bankBranch}
                onChange={e => setForm({...form, bankBranch: e.target.value})}
                className="w-full p-2.5 border rounded-xl bg-slate-50 font-semibold focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Account Name</label>
            <input
              type="text"
              required
              value={form.accountName}
              onChange={e => setForm({...form, accountName: e.target.value})}
              className="w-full p-2.5 border rounded-xl bg-slate-50 font-semibold focus:bg-white focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">BSB Number (XXX-XXX)</label>
              <input
                type="text"
                required
                placeholder="062-184"
                value={form.bsb}
                onChange={e => setForm({...form, bsb: e.target.value})}
                className={`w-full p-2.5 border rounded-xl font-mono font-bold focus:bg-white focus:outline-none ${
                  isBsbValid ? 'border-emerald-300 bg-emerald-50/30' : 'border-slate-300 bg-slate-50'
                }`}
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Account Number</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={form.accountNumber}
                onChange={e => setForm({...form, accountNumber: e.target.value})}
                className="w-full p-2.5 border rounded-xl bg-slate-50 font-mono font-bold focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <h4 className="font-bold text-slate-800 mb-2 text-xs uppercase tracking-wider">Superannuation Fund</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Super Fund Name</label>
                <input
                  type="text"
                  value={form.superFund}
                  onChange={e => setForm({...form, superFund: e.target.value})}
                  className="w-full p-2.5 border rounded-xl bg-slate-50 font-semibold"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Member Number</label>
                <input
                  type="text"
                  value={form.superNumber}
                  onChange={e => setForm({...form, superNumber: e.target.value})}
                  className="w-full p-2.5 border rounded-xl bg-slate-50 font-semibold"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-5 py-3 rounded-2xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 transition-all text-xs cursor-pointer">Cancel</button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-600/25 transition cursor-pointer"
            >
              Encrypt &amp; Save Bank Details
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
