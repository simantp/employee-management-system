'use client';

import React, { useState } from 'react';
import { 
  Building2, 
  Clock, 
  Palmtree, 
  ShieldCheck, 
  Bell, 
  Database, 
  Save, 
  CheckCircle2, 
  RefreshCcw, 
  Download, 
  AlertTriangle, 
  Lock, 
  Globe, 
  Sliders, 
  FileText,
  Mail,
  Zap,
  Sparkles
} from 'lucide-react';
import { useApp } from '@/lib/store';

export default function AdminSettingsHub() {
  const { addToast, addAudit, employees, timecards, leaveRequests } = useApp();

  const [activeTab, setActiveTab] = useState<'COMPANY' | 'SHIFTS' | 'LEAVE' | 'SECURITY' | 'NOTIFS' | 'BACKUP'>('COMPANY');

  // 1. Company Profile State
  const [companyForm, setCompanyForm] = useState({
    companyName: 'HsCreations Pty Ltd',
    legalEntity: 'HsCreations Design & Print Group',
    abn: '48 123 456 789',
    plantAddress: '14 Belmore Road, Riverwood, NSW 2210',
    contactEmail: 'admin@hscreations.com.au',
    contactPhone: '+61 2 9876 5432',
    timeZone: 'Australia/Sydney (AEST/AEDT)',
    fairWorkAward: 'Graphic Arts, Printing and Publishing Award 2020 [MA000026]',
  });

  // 2. Shift & Timecard Rules State
  const [shiftRules, setShiftRules] = useState({
    standardWeeklyHours: 38,
    dailyOvertimeThreshold: 7.6,
    defaultMealBreakMinutes: 30,
    gracePeriodMinutes: 15,
    autoDeductBreak: true,
    requireKioskPassword: false,
    allowEmergencySupervisorClockOut: true,
  });

  // 3. Leave Policy State
  const [leavePolicy, setLeavePolicy] = useState({
    annualLeaveDaysPerYear: 20,
    sickLeaveDaysPerYear: 10,
    carersLeaveDaysPerYear: 2,
    mandatoryNoticeWeeks: 4,
    autoApproveSickWithMedicalCert: false,
    blockLeaveOnPublicHolidays: true,
  });

  // 4. Security & Cryptography State
  const [securitySettings, setSecuritySettings] = useState({
    enforceEmailOtp2FA: true,
    sessionTimeoutMinutes: 45,
    aesVaultActive: true,
    maskSensitiveBankTFN: true,
    allowStaffPasswordResetSelfService: true,
  });

  // 5. Notification Preferences
  const [notifPreferences, setNotifPreferences] = useState({
    notifyAdminOnClockIn: true,
    notifyAdminOnClockOut: true,
    notifyAdminOnLeaveSubmit: true,
    emailVisaExpiryDigestWeekly: true,
    notifyStaffOnShiftApproval: true,
  });

  const handleSaveSettings = (section: string) => {
    addToast('Settings Saved', `${section} preferences updated and persisted successfully.`, 'success');
    addAudit('SYSTEM_SETTINGS_UPDATED', 'Settings', 'global', `Updated ${section} configuration settings`, 'Admin', 'SuperAdmin');
  };

  const handleExportSystemBackup = () => {
    const backupData = {
      timestamp: new Date().toISOString(),
      facility: 'Sydney NSW Plant',
      employees,
      timecards,
      leaveRequests,
      settings: {
        company: companyForm,
        shifts: shiftRules,
        leave: leavePolicy,
        security: securitySettings,
      }
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `HsCreations_System_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);

    addToast('Backup Exported', 'Full system JSON backup downloaded.', 'success');
    addAudit('SYSTEM_BACKUP_EXPORT', 'Backup', 'all', 'Exported comprehensive system backup', 'Admin', 'SuperAdmin');
  };

  const handleResetDemoData = () => {
    if (window.confirm('Are you sure you want to reset demo data to initial default state? Current test records will be refreshed.')) {
      try {
        localStorage.clear();
        addToast('Data Reset', 'System refreshed to initial data state. Reloading...', 'info');
        setTimeout(() => {
          window.location.reload();
        }, 800);
      } catch (e) {}
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 font-sans text-xs">
      
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-black text-slate-900">System &amp; Operations Settings Hub</h2>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              Active Production
            </span>
          </div>
          <p className="text-slate-500 text-[11px] mt-0.5">
            Configure Sydney print plant policies, Fair Work compliance rules, shifts, and data governance
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportSystemBackup}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>Export Backup</span>
          </button>

          <button
            onClick={() => handleSaveSettings(activeTab)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-black text-xs shadow-md shadow-orange-500/20 flex items-center gap-1.5 transition cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Changes</span>
          </button>
        </div>
      </div>

      {/* Main Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Navigation Sidebar (3 cols) */}
        <div className="lg:col-span-3 space-y-1 bg-white p-3 rounded-3xl border border-slate-200/80 shadow-xs self-start">
          <button
            onClick={() => setActiveTab('COMPANY')}
            className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'COMPANY' 
                ? 'bg-orange-500/10 text-orange-700 font-extrabold' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4 text-orange-500" />
            <span>Plant &amp; Company Profile</span>
          </button>

          <button
            onClick={() => setActiveTab('SHIFTS')}
            className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'SHIFTS' 
                ? 'bg-orange-500/10 text-orange-700 font-extrabold' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4 text-blue-500" />
            <span>Shift &amp; Timecard Rules</span>
          </button>

          <button
            onClick={() => setActiveTab('LEAVE')}
            className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'LEAVE' 
                ? 'bg-orange-500/10 text-orange-700 font-extrabold' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Palmtree className="w-4 h-4 text-emerald-500" />
            <span>Leave &amp; Accrual Policy</span>
          </button>

          <button
            onClick={() => setActiveTab('SECURITY')}
            className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'SECURITY' 
                ? 'bg-orange-500/10 text-orange-700 font-extrabold' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-purple-500" />
            <span>Security &amp; Encryption</span>
          </button>

          <button
            onClick={() => setActiveTab('NOTIFS')}
            className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'NOTIFS' 
                ? 'bg-orange-500/10 text-orange-700 font-extrabold' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Bell className="w-4 h-4 text-amber-500" />
            <span>Notification Triggers</span>
          </button>

          <button
            onClick={() => setActiveTab('BACKUP')}
            className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'BACKUP' 
                ? 'bg-orange-500/10 text-orange-700 font-extrabold' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Database className="w-4 h-4 text-cyan-600" />
            <span>Data &amp; Maintenance</span>
          </button>
        </div>

        {/* Content Pane (9 cols) */}
        <div className="lg:col-span-9 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs">
          
          {/* TAB 1: COMPANY PROFILE */}
          {activeTab === 'COMPANY' && (
            <div className="space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-black text-sm text-slate-900">Plant &amp; Headquarters Profile</h3>
                <p className="text-slate-500 text-[11px]">Official Australian business registration and operating location</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Company Trading Name</label>
                  <input
                    type="text"
                    value={companyForm.companyName}
                    onChange={e => setCompanyForm({...companyForm, companyName: e.target.value})}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-white font-medium text-xs focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Australian Business Number (ABN)</label>
                  <input
                    type="text"
                    value={companyForm.abn}
                    onChange={e => setCompanyForm({...companyForm, abn: e.target.value})}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-white font-mono font-bold text-xs focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">Sydney Production Facility Address</label>
                  <input
                    type="text"
                    value={companyForm.plantAddress}
                    onChange={e => setCompanyForm({...companyForm, plantAddress: e.target.value})}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-white font-medium text-xs focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Operations Contact Email</label>
                  <input
                    type="email"
                    value={companyForm.contactEmail}
                    onChange={e => setCompanyForm({...companyForm, contactEmail: e.target.value})}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-white font-medium text-xs focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Operating Timezone</label>
                  <input
                    type="text"
                    disabled
                    value={companyForm.timeZone}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 font-bold text-slate-600 text-xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">Registered Fair Work Modern Award</label>
                  <input
                    type="text"
                    value={companyForm.fairWorkAward}
                    onChange={e => setCompanyForm({...companyForm, fairWorkAward: e.target.value})}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-white font-medium text-xs focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SHIFT & TIMECARD RULES */}
          {activeTab === 'SHIFTS' && (
            <div className="space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-black text-sm text-slate-900">Shift &amp; Timecard Attendance Rules</h3>
                <p className="text-slate-500 text-[11px]">Fair Work Australia standard full-time hours, breaks, and Kiosk parameters</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Standard Full-Time Weekly Hours</label>
                  <input
                    type="number"
                    value={shiftRules.standardWeeklyHours}
                    onChange={e => setShiftRules({...shiftRules, standardWeeklyHours: Number(e.target.value)})}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-white font-bold text-xs"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">National standard is 38.0 hours.</span>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Daily Overtime Threshold (Hours)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={shiftRules.dailyOvertimeThreshold}
                    onChange={e => setShiftRules({...shiftRules, dailyOvertimeThreshold: Number(e.target.value)})}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-white font-bold text-xs"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Overtime calculated above 7.6h per weekday.</span>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Default Unpaid Meal Break (Minutes)</label>
                  <input
                    type="number"
                    value={shiftRules.defaultMealBreakMinutes}
                    onChange={e => setShiftRules({...shiftRules, defaultMealBreakMinutes: Number(e.target.value)})}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-white font-bold text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Kiosk Clock-In Grace Window (Minutes)</label>
                  <input
                    type="number"
                    value={shiftRules.gracePeriodMinutes}
                    onChange={e => setShiftRules({...shiftRules, gracePeriodMinutes: Number(e.target.value)})}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-white font-bold text-xs"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-3">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shiftRules.autoDeductBreak}
                    onChange={e => setShiftRules({...shiftRules, autoDeductBreak: e.target.checked})}
                    className="w-4 h-4 rounded text-orange-500 focus:ring-orange-500 cursor-pointer"
                  />
                  <span className="font-bold text-slate-800">Auto-deduct 30 min meal break on shifts exceeding 5 hours</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shiftRules.allowEmergencySupervisorClockOut}
                    onChange={e => setShiftRules({...shiftRules, allowEmergencySupervisorClockOut: e.target.checked})}
                    className="w-4 h-4 rounded text-orange-500 focus:ring-orange-500 cursor-pointer"
                  />
                  <span className="font-bold text-slate-800">Allow SuperAdmin emergency clock-out overrides with audit stamps</span>
                </label>
              </div>
            </div>
          )}

          {/* TAB 3: LEAVE POLICY */}
          {activeTab === 'LEAVE' && (
            <div className="space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-black text-sm text-slate-900">National Employment Standards (NES) Leave Framework</h3>
                <p className="text-slate-500 text-[11px]">Fair Work statutory leave entitlements for permanent and fixed-term staff</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                  <label className="font-bold text-emerald-950 block mb-1">Annual Leave Accrual</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={leavePolicy.annualLeaveDaysPerYear}
                      onChange={e => setLeavePolicy({...leavePolicy, annualLeaveDaysPerYear: Number(e.target.value)})}
                      className="w-20 p-2 border border-emerald-300 rounded-xl bg-white font-black text-emerald-900"
                    />
                    <span className="font-bold text-emerald-800 text-[11px]">Days / Year</span>
                  </div>
                  <span className="text-[10px] text-emerald-700 mt-1 block">4 weeks statutory minimum</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-blue-50/50 border border-blue-100">
                  <label className="font-bold text-blue-950 block mb-1">Sick &amp; Carer's Leave</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={leavePolicy.sickLeaveDaysPerYear}
                      onChange={e => setLeavePolicy({...leavePolicy, sickLeaveDaysPerYear: Number(e.target.value)})}
                      className="w-20 p-2 border border-blue-300 rounded-xl bg-white font-black text-blue-900"
                    />
                    <span className="font-bold text-blue-800 text-[11px]">Days / Year</span>
                  </div>
                  <span className="text-[10px] text-blue-700 mt-1 block">10 days paid personal leave</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-purple-50/50 border border-purple-100">
                  <label className="font-bold text-purple-950 block mb-1">Mandatory Notice</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={leavePolicy.mandatoryNoticeWeeks}
                      onChange={e => setLeavePolicy({...leavePolicy, mandatoryNoticeWeeks: Number(e.target.value)})}
                      className="w-20 p-2 border border-purple-300 rounded-xl bg-white font-black text-purple-900"
                    />
                    <span className="font-bold text-purple-800 text-[11px]">Weeks</span>
                  </div>
                  <span className="text-[10px] text-purple-700 mt-1 block">Standard contract departure notice</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SECURITY & CRYPTOGRAPHY */}
          {activeTab === 'SECURITY' && (
            <div className="space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-black text-sm text-slate-900">Security, Authentication &amp; AES-256 Vault</h3>
                <p className="text-slate-500 text-[11px]">Protect sensitive staff records, TFN numbers, and bank credentials</p>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-slate-950 text-white border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-white">AES-256-GCM Vault Status</h4>
                      <p className="text-[11px] text-slate-400">All TFN and banking details are encrypted client-side before storage</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-[10px] font-black border border-emerald-500/30">
                    VAULT ACTIVE
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900">Enforce 6-Digit Email OTP on Staff Registration</h4>
                    <p className="text-slate-500 text-[11px]">Validates Australian email ownership before portal activation</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={securitySettings.enforceEmailOtp2FA}
                    onChange={e => setSecuritySettings({...securitySettings, enforceEmailOtp2FA: e.target.checked})}
                    className="w-4 h-4 rounded text-orange-500 cursor-pointer"
                  />
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900">Mask Sensitive Records in Administrative Views</h4>
                    <p className="text-slate-500 text-[11px]">Masks BSB, Account Numbers, and TFN digits by default</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={securitySettings.maskSensitiveBankTFN}
                    onChange={e => setSecuritySettings({...securitySettings, maskSensitiveBankTFN: e.target.checked})}
                    className="w-4 h-4 rounded text-orange-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: NOTIFICATION TRIGGERS */}
          {activeTab === 'NOTIFS' && (
            <div className="space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-black text-sm text-slate-900">Automated Notifications &amp; SuperAdmin Alerts</h3>
                <p className="text-slate-500 text-[11px]">Real-time in-app toasts, audible shift alerts, and email notifications</p>
              </div>

              <div className="space-y-3">
                <label className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="font-bold text-slate-900 block">🟢 Real-Time Staff Clock-In Notifications</span>
                    <span className="text-slate-500 text-[11px]">SuperAdmin alerted immediately with staff name, time, and department</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifPreferences.notifyAdminOnClockIn}
                    onChange={e => setNotifPreferences({...notifPreferences, notifyAdminOnClockIn: e.target.checked})}
                    className="w-4 h-4 rounded text-orange-500 cursor-pointer"
                  />
                </label>

                <label className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="font-bold text-slate-900 block">🔴 Real-Time Staff Clock-Out &amp; Shift Summary Alerts</span>
                    <span className="text-slate-500 text-[11px]">Alerted upon shift completion with total hours logged</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifPreferences.notifyAdminOnClockOut}
                    onChange={e => setNotifPreferences({...notifPreferences, notifyAdminOnClockOut: e.target.checked})}
                    className="w-4 h-4 rounded text-orange-500 cursor-pointer"
                  />
                </label>

                <label className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="font-bold text-slate-900 block">🛂 Visa Expiry 60-Day Automated Digest</span>
                    <span className="text-slate-500 text-[11px]">Weekly alert summarizing staff with visas approaching expiration</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifPreferences.emailVisaExpiryDigestWeekly}
                    onChange={e => setNotifPreferences({...notifPreferences, emailVisaExpiryDigestWeekly: e.target.checked})}
                    className="w-4 h-4 rounded text-orange-500 cursor-pointer"
                  />
                </label>
              </div>
            </div>
          )}

          {/* TAB 6: DATA & MAINTENANCE */}
          {activeTab === 'BACKUP' && (
            <div className="space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-black text-sm text-slate-900">System Data Management &amp; Disaster Recovery</h3>
                <p className="text-slate-500 text-[11px]">Export JSON snapshot backups, export audit ledgers, or reset demo state</p>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900">Download Complete System Backup</h4>
                    <p className="text-slate-500 text-[11px]">Encrypted JSON archive containing employee profiles, timecards, and leaves</p>
                  </div>
                  <button
                    onClick={handleExportSystemBackup}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                  >
                    Export JSON
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-rose-950">Reset Test Database to Defaults</h4>
                    <p className="text-rose-700 text-[11px]">Clears browser localStorage and reloads factory demo workforce records</p>
                  </div>
                  <button
                    onClick={handleResetDemoData}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                  >
                    Reset Demo State
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}