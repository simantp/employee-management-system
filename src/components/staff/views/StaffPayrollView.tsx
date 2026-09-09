'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store';
import BankDetailsModal from '../BankDetailsModal';
import MyPayslipCard from '../MyPayslipCard';

export default function StaffPayrollView() {
  const { currentStaff } = useApp();
  const [showBankModal, setShowBankModal] = useState(false);

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-150 text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Payroll &amp; Encrypted Banking</h2>
          <p className="text-slate-500 mt-0.5">
            Australian PAYG withholding, Superannuation &amp; bank disbursement details
          </p>
        </div>

        <button
          onClick={() => setShowBankModal(true)}
          className="flex items-center gap-2 bg-navy-950 hover:bg-slate-900 text-white px-4 py-2.5 rounded-xl font-bold shadow-md transition hover:-translate-y-0.5 cursor-pointer"
        >
          <span>Update Bank Details (Encrypted)</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MyPayslipCard />

        <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
              <span>Current Banking &amp; Superannuation</span>
            </h3>
            <span className="text-[10px] font-mono text-cyan-300 font-bold">AES-256</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-semibold block">Bank Name</span>
              <span className="font-bold text-white">{currentStaff.bankName || 'Not provided yet'}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-semibold block">Branch</span>
              <span className="font-bold text-white">{currentStaff.bankBranch || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-semibold block">BSB Number</span>
              <span className="font-mono text-cyan-300 font-bold text-sm">{currentStaff.bsbMasked || 'Pending setup'}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-semibold block">Account Number</span>
              <span className="font-mono text-cyan-300 font-bold text-sm">{currentStaff.accountNumberMasked || 'Pending setup'}</span>
            </div>
            <div className="col-span-2 pt-2 border-t border-slate-800">
              <span className="text-slate-400 text-[10px] uppercase font-semibold block">Superannuation Fund</span>
              <span className="font-bold text-white">{currentStaff.superFundName ? `${currentStaff.superFundName} (${currentStaff.superMemberNumber || ''})` : 'Pending super choice'}</span>
            </div>
          </div>
        </div>
      </div>

      {showBankModal && <BankDetailsModal onClose={() => setShowBankModal(false)} />}
    </div>
  );
}
