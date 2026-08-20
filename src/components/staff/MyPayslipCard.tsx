'use client';

import React, { useState } from 'react';
import { FileSpreadsheet, Eye, X, Clock } from 'lucide-react';
import { useApp } from '@/lib/store';
import { formatCurrency } from '@/lib/utils';

export default function MyPayslipCard() {
  const { currentStaff } = useApp();
  const [showSlipModal, setShowSlipModal] = useState(false);

  // If new staff has no payslips generated yet -> Show clean empty state!
  if (!currentStaff.payslips || currentStaff.payslips.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between text-xs">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">My Payslip</h3>
            <p className="text-[11px] text-slate-500">Australian PAYG & Super Breakdown</p>
          </div>
          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            Pending Cycle
          </span>
        </div>

        <div className="my-3 py-4 text-center border-y border-slate-100 space-y-1.5 bg-slate-50/50 rounded-xl">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-1">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <p className="font-bold text-slate-800 text-xs">No Payslips Generated Yet</p>
          <p className="text-[11px] text-slate-400 max-w-xs mx-auto px-2">
            Your official payslip will be generated and made available here once processed by Payroll.
          </p>
        </div>

        <div className="pt-2 text-center text-[10px] text-slate-400 font-medium">
          Next Sydney Payroll Run: 26 Aug 2026
        </div>
      </div>
    );
  }

  const latestPayslip = currentStaff.payslips[0];

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between text-xs">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900">My Payslip</h3>
          <p className="text-[11px] text-slate-500">Australian PAYG & Super Breakdown</p>
        </div>
        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
          Paid
        </span>
      </div>

      <div className="my-2">
        <div className="flex items-baseline justify-between mb-1">
          <span className="text-xs text-slate-400 font-semibold">Latest Take-Home Pay</span>
          <span className="text-[11px] text-slate-500">{latestPayslip.payDate}</span>
        </div>
        <div className="text-2xl font-black text-emerald-600 tracking-tight">
          {formatCurrency(latestPayslip.netPay)}
        </div>
      </div>

      <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs my-2">
        <div className="flex justify-between text-slate-600">
          <span>Gross Earnings:</span>
          <span className="font-bold text-slate-900">{formatCurrency(latestPayslip.grossPay)}</span>
        </div>
        <div className="flex justify-between text-slate-600">
          <span>PAYG Tax Withheld:</span>
          <span className="font-bold text-rose-600">-{formatCurrency(latestPayslip.taxDeductions)}</span>
        </div>
        <div className="flex justify-between text-slate-600 pt-1 border-t border-slate-200/60">
          <span>Super Guarantee (11%):</span>
          <span className="font-bold text-cyan-700">{formatCurrency(latestPayslip.superannuation)}</span>
        </div>
      </div>

      <button
        onClick={() => setShowSlipModal(true)}
        className="w-full py-2 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition flex items-center justify-center gap-2 mt-1"
      >
        <Eye className="w-3.5 h-3.5 text-slate-500" />
        <span>View Full Payslip</span>
      </button>

      {showSlipModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 p-4" onClick={() => setShowSlipModal(false)}>
      <div className="bg-white rounded-2xl shadow-2xl border max-w-md w-full p-6 text-xs animate-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center pb-3 border-b">
              <div>
                <h4 className="font-bold text-base text-slate-900">Official Payslip Statement</h4>
                <p className="text-slate-500">{latestPayslip.payPeriod}</p>
              </div>
              <button onClick={() => setShowSlipModal(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="py-4 space-y-2">
              <div className="flex justify-between"><span>Employee:</span><strong className="text-slate-900">{currentStaff.firstName} {currentStaff.lastName}</strong></div>
              <div className="flex justify-between"><span>Employee Number:</span><strong>{currentStaff.employeeNumber}</strong></div>
              <div className="flex justify-between"><span>Bank Account:</span><strong>{currentStaff.bankName || 'Direct Credit'} ({currentStaff.bsbMasked || '062-•••'})</strong></div>
              <div className="flex justify-between"><span>Superannuation:</span><strong>{currentStaff.superFundName || 'AustralianSuper'}</strong></div>
              <div className="p-3 bg-emerald-50 rounded-xl my-2 flex justify-between font-bold text-emerald-800 text-sm">
                <span>Net Transfer Amount:</span>
                <span>{formatCurrency(latestPayslip.netPay)}</span>
              </div>
            </div>
            <button
              onClick={() => setShowSlipModal(false)}
              className="w-full py-2 bg-slate-900 text-white rounded-xl font-bold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
