'use client';

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Car, 
  Search, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Send, 
  HardHat, 
  UserCheck, 
  AlertTriangle,
  Award,
  RefreshCw
} from 'lucide-react';
import { useApp } from '@/lib/store';
import { Employee } from '@/types';
import EmployeeDetailModal from './EmployeeDetailModal';

export default function AdminComplianceManagement({
  defaultSubTab = 'visa'
}: {
  defaultSubTab?: 'visa' | 'license' | 'whs';
}) {
  const { employees, alerts, addToast, addAudit } = useApp();
  
  const [subTab, setSubTab] = useState<'visa' | 'license' | 'whs'>(defaultSubTab);
  const [search, setSearch] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [vevoCheckingId, setVevoCheckingId] = useState<string | null>(null);

  // Visa holders list
  const visaHolders = employees.filter(e => {
    const isVisa = e.citizenStatus === 'VISA_HOLDER' || (e.visaType && !e.visaType.toLowerCase().includes('citizen'));
    const q = search.toLowerCase();
    const matchesSearch = 
      e.firstName.toLowerCase().includes(q) ||
      e.lastName.toLowerCase().includes(q) ||
      e.employeeNumber.toLowerCase().includes(q) ||
      (e.visaType && e.visaType.toLowerCase().includes(q)) ||
      (e.department && e.department.toLowerCase().includes(q));

    return isVisa && matchesSearch;
  });

  // Driver License holders
  const licenseHolders = employees.filter(e => {
    const hasLicense = e.hasDriverLicense || e.licenseNumber || e.licenseExpiryDate;
    const q = search.toLowerCase();
    const matchesSearch = 
      e.firstName.toLowerCase().includes(q) ||
      e.lastName.toLowerCase().includes(q) ||
      e.employeeNumber.toLowerCase().includes(q) ||
      (e.licenseNumber && e.licenseNumber.toLowerCase().includes(q)) ||
      (e.department && e.department.toLowerCase().includes(q));

    return hasLicense && matchesSearch;
  });

  // Calculate KPIs
  const totalVisaHolders = employees.filter(e => e.citizenStatus === 'VISA_HOLDER').length;
  const criticalVisas = alerts.filter(a => a.type === 'VISA_EXPIRY' && a.daysRemaining <= 30).length;
  const totalLicenses = employees.filter(e => e.hasDriverLicense || e.licenseNumber).length;
  const forkliftOperators = employees.filter(e => e.department && e.department.includes('Production')).length;

  const handleSimulateVevoCheck = (emp: Employee) => {
    setVevoCheckingId(emp.id);
    setTimeout(() => {
      setVevoCheckingId(null);
      addToast(
        'VEVO Verification Passed', 
        `Department of Home Affairs VEVO database confirmed work rights for ${emp.firstName} ${emp.lastName}.`, 
        'success'
      );
      addAudit(
        'COMPLIANCE_VEVO_CHECK', 
        'Visa Tracking', 
        emp.id, 
        `Real-time VEVO check verified work rights for ${emp.firstName} ${emp.lastName}`, 
        'Admin', 
        'SuperAdmin'
      );
    }, 1200);
  };

  const handleSendReminder = (emp: Employee, type: 'VISA' | 'LICENSE') => {
    addToast(
      'Reminder Dispatched',
      `Sent urgent compliance renewal notice to ${emp.firstName} ${emp.lastName} (${emp.email}).`,
      'info'
    );
    addAudit(
      'COMPLIANCE_REMINDER_SENT',
      type === 'VISA' ? 'Visa' : 'License',
      emp.id,
      `Sent ${type} renewal email alert to ${emp.firstName} ${emp.lastName}`,
      'Admin',
      'SuperAdmin'
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 font-sans text-xs">
      
      {/* Top Metric Header */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Visa Holders</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">{totalVisaHolders}</span>
            <span className="text-[10px] text-slate-500 font-medium">Active Visa workforce</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Visas Expiring &lt;30d</span>
            <span className="text-2xl font-black text-amber-600 mt-1 block">{criticalVisas}</span>
            <span className="text-[10px] text-amber-700 font-medium">Requires immediate renewal</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Licensed Drivers</span>
            <span className="text-2xl font-black text-emerald-600 mt-1 block">{totalLicenses}</span>
            <span className="text-[10px] text-emerald-700 font-medium">Verified Australia / State</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Car className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Forklift &amp; Press QA</span>
            <span className="text-2xl font-black text-purple-600 mt-1 block">{forkliftOperators}</span>
            <span className="text-[10px] text-purple-700 font-medium">High risk plant staff</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <HardHat className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Compliance Management Container */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        
        {/* Sub-Tab Navigation Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex bg-slate-200/80 p-1 rounded-2xl gap-1 max-w-md w-full">
            <button
              onClick={() => setSubTab('visa')}
              className={`flex-1 py-2 px-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                subTab === 'visa' 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-orange-500" />
              <span>Visa Tracking &amp; VEVO</span>
            </button>

            <button
              onClick={() => setSubTab('license')}
              className={`flex-1 py-2 px-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                subTab === 'license' 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Car className="w-3.5 h-3.5 text-blue-500" />
              <span>Driver Licenses</span>
            </button>

            <button
              onClick={() => setSubTab('whs')}
              className={`flex-1 py-2 px-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                subTab === 'whs' 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <HardHat className="w-3.5 h-3.5 text-emerald-500" />
              <span>WHS Policies</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search staff, visa subclass, license..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl bg-white font-medium text-slate-800 text-xs focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>
          </div>
        </div>

        {/* SUBTAB 1: VISA TRACKING & VEVO */}
        {subTab === 'visa' && (
          <div className="divide-y divide-slate-100">
            <div className="p-4 bg-orange-50/40 border-b border-orange-100/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-orange-600" />
                <span className="font-bold text-orange-900">Department of Home Affairs (VEVO) Compliance Standards:</span>
                <span className="text-slate-600">Ensure every non-citizen employee has current visa validity and permitted fortnightly work hours.</span>
              </div>
              <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-orange-100 text-orange-800">
                Fair Work Australia
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                    <th className="p-4">Employee</th>
                    <th className="p-4">Visa Subclass</th>
                    <th className="p-4">Work Rights &amp; Restrictions</th>
                    <th className="p-4">Expiry Date</th>
                    <th className="p-4">Compliance Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {visaHolders.map(emp => {
                    const alert = alerts.find(a => a.employeeId === emp.id && a.type === 'VISA_EXPIRY');
                    const daysLeft = alert ? alert.daysRemaining : 180;
                    const isCritical = daysLeft <= 30;
                    const isWarning = daysLeft <= 60 && daysLeft > 30;

                    return (
                      <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={emp.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                              alt={emp.firstName}
                              className="w-10 h-10 rounded-xl object-cover ring-2 ring-slate-100"
                            />
                            <div>
                              <div className="font-bold text-slate-900">{emp.firstName} {emp.lastName}</div>
                              <div className="text-[11px] text-slate-500">{emp.employeeNumber} • {emp.department || 'Production'}</div>
                            </div>
                          </div>
                        </td>

                        <td className="p-4">
                          <div className="font-bold text-slate-800">{emp.visaType || 'Subclass 482 (TSS)'}</div>
                          <span className="text-[10px] text-slate-400 font-mono">Permit ID: VEVO-{emp.employeeNumber.slice(-4)}</span>
                        </td>

                        <td className="p-4">
                          <div className="font-semibold text-slate-700">
                            {emp.workRestrictions || 'Full-time work rights (38 hrs/week)'}
                          </div>
                          <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>VEVO Verified</span>
                          </span>
                        </td>

                        <td className="p-4">
                          <div className="font-bold font-mono text-slate-900">{emp.visaExpiryDate || '30/08/2026'}</div>
                          <span className="text-[10px] text-slate-500">{daysLeft} days remaining</span>
                        </td>

                        <td className="p-4">
                          {isCritical ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1 w-fit animate-pulse">
                              <AlertTriangle className="w-3 h-3" />
                              <span>Critical ({daysLeft}d)</span>
                            </span>
                          ) : isWarning ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-100 text-amber-700 border border-amber-200 flex items-center gap-1 w-fit">
                              <Clock className="w-3 h-3" />
                              <span>Expiring Soon ({daysLeft}d)</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1 w-fit">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Active &amp; Compliant</span>
                            </span>
                          )}
                        </td>

                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleSimulateVevoCheck(emp)}
                              disabled={vevoCheckingId === emp.id}
                              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-[11px] transition flex items-center gap-1 cursor-pointer"
                              title="Run Instant VEVO Check"
                            >
                              <RefreshCw className={`w-3 h-3 text-blue-600 ${vevoCheckingId === emp.id ? 'animate-spin' : ''}`} />
                              <span>{vevoCheckingId === emp.id ? 'Checking...' : 'VEVO'}</span>
                            </button>

                            <button
                              onClick={() => handleSendReminder(emp, 'VISA')}
                              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-[11px] transition flex items-center gap-1 cursor-pointer"
                              title="Send Reminder Email"
                            >
                              <Send className="w-3 h-3 text-orange-500" />
                              <span>Alert</span>
                            </button>

                            <button
                              onClick={() => setSelectedEmployee(emp)}
                              className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] transition cursor-pointer"
                            >
                              Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SUBTAB 2: DRIVER LICENSES & FORKLIFT PERMITS */}
        {subTab === 'license' && (
          <div className="divide-y divide-slate-100">
            <div className="p-4 bg-blue-50/40 border-b border-blue-100/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Car className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-blue-900">Transport for NSW &amp; SafeWork NSW Operator Compliance:</span>
                <span className="text-slate-600">Verify company vehicle drivers and certified high-risk printing press / forklift operators.</span>
              </div>
              <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-blue-100 text-blue-800">
                SafeWork NSW Verified
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                    <th className="p-4">Staff Member</th>
                    <th className="p-4">License / Permit #</th>
                    <th className="p-4">Authority &amp; Class</th>
                    <th className="p-4">Expiry Date</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {licenseHolders.map(emp => {
                    const isForklift = emp.department && emp.department.includes('Production');
                    return (
                      <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={emp.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                              alt={emp.firstName}
                              className="w-10 h-10 rounded-xl object-cover ring-2 ring-slate-100"
                            />
                            <div>
                              <div className="font-bold text-slate-900">{emp.firstName} {emp.lastName}</div>
                              <div className="text-[11px] text-slate-500">{emp.jobTitle} • {emp.department}</div>
                            </div>
                          </div>
                        </td>

                        <td className="p-4">
                          <div className="font-mono font-bold text-slate-900">
                            {emp.licenseNumber || `DL-${emp.employeeNumber.replace('EMP-', '9948')}`}
                          </div>
                          <span className="text-[10px] text-slate-400">Card Scan on File</span>
                        </td>

                        <td className="p-4">
                          <div className="font-bold text-slate-800">
                            {emp.licenseCountry || 'NSW, Australia'}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-mono text-[10px] font-bold">Class C</span>
                            {isForklift && (
                              <span className="px-1.5 py-0.2 rounded bg-purple-100 text-purple-700 font-mono text-[10px] font-bold">Class LF (Forklift)</span>
                            )}
                          </div>
                        </td>

                        <td className="p-4">
                          <div className="font-bold font-mono text-slate-900">{emp.licenseExpiryDate || '12/10/2027'}</div>
                          <span className="text-[10px] text-emerald-600 font-semibold">Valid</span>
                        </td>

                        <td className="p-4">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1 w-fit">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Verified</span>
                          </span>
                        </td>

                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleSendReminder(emp, 'LICENSE')}
                              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-[11px] transition flex items-center gap-1 cursor-pointer"
                            >
                              <Send className="w-3 h-3 text-blue-500" />
                              <span>Remind</span>
                            </button>

                            <button
                              onClick={() => setSelectedEmployee(emp)}
                              className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] transition cursor-pointer"
                            >
                              Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SUBTAB 3: WHS POLICIES */}
        {subTab === 'whs' && (
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-black text-sm text-slate-900">HsCreations Work Health &amp; Safety (WHS) Standards</h3>
                <p className="text-slate-500 text-[11px]">Sydney Printing &amp; Large Format Production Floor Safety Framework</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                ISO 9001 &amp; AS/NZS 4801 Compliant
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                  <HardHat className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-slate-900">Press Floor PPE Standard</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Mandatory steel-capped footwear, safety eyewear, and ear protection around Heidelberg &amp; Mimaki digital printers.
                </p>
                <div className="text-[10px] font-bold text-emerald-600">✓ 100% Staff Acknowledged</div>
              </div>

              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                  <Award className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-slate-900">Chemical &amp; Ink SDS Safety</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Safety Data Sheets (SDS) for UV curing inks, solvent cleaning agents, and lamination adhesives stored in Riverwood vault.
                </p>
                <div className="text-[10px] font-bold text-emerald-600">✓ SDS Folder Updated 2026</div>
              </div>

              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-slate-900">Emergency &amp; Evacuation</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Biannual fire evacuation drills, active First Aid wardens, and automated incident reporting for Sydney plant.
                </p>
                <div className="text-[10px] font-bold text-purple-600">✓ Next Drill: Q4 2026</div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Modal for editing employee */}
      {selectedEmployee && (
        <EmployeeDetailModal
          employee={selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
        />
      )}

    </div>
  );
}