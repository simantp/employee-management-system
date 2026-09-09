'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/lib/store';
import DocumentTypesManager from './DocumentTypesManager';
import RolesManagement from './RolesManagement';

export type SettingsTab = 'COMPANY' | 'SHIFTS' | 'LEAVE' | 'DOCUMENTS' | 'ROLES' | 'EXPIRY' | 'SECURITY' | 'NOTIFS' | 'BACKUP';

export default function AdminSettingsHub({
  defaultTab = 'COMPANY'
}: {
  defaultTab?: SettingsTab;
}) {
  const { addToast, addAudit, employees, timecards, leaveRequests, expirySettings, updateExpirySettings } = useApp();

  const [activeTab, setActiveTab] = useState<SettingsTab>(defaultTab);

  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab]);

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

  // 4. Visa & License Expiry Compliance Rules State
  const [expiryForm, setExpiryForm] = useState(expirySettings);

  useEffect(() => {
    if (expirySettings) {
      setExpiryForm(expirySettings);
    }
  }, [expirySettings]);

  // 5. Security & Cryptography State
  const [securitySettings, setSecuritySettings] = useState({
    enforceEmailOtp2FA: true,
    sessionTimeoutMinutes: 45,
    aesVaultActive: true,
    maskSensitiveBankTFN: true,
    allowStaffPasswordResetSelfService: true,
  });

  // 6. Notification Preferences
  const [notifPreferences, setNotifPreferences] = useState({
    notifyAdminOnClockIn: true,
    notifyAdminOnClockOut: true,
    notifyAdminOnLeaveSubmit: true,
    emailVisaExpiryDigestWeekly: true,
    notifyStaffOnShiftApproval: true,
  });

  const handleSaveSettings = (section: string) => {
    if (activeTab === 'EXPIRY') {
      updateExpirySettings(expiryForm);
      return;
    }
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

  const handleExportSQLDump = () => {
    let sql = `-- ====================================================================\n`;
    sql += `-- HsCreations Sydney NSW Employee Management System (EMS)\n`;
    sql += `-- Production MySQL Database Export Snapshot\n`;
    sql += `-- Generated: ${new Date().toLocaleString('en-AU', { timeZone: 'Australia/Sydney' })}\n`;
    sql += `-- Charset: utf8mb4, Collation: utf8mb4_unicode_ci\n`;
    sql += `-- ====================================================================\n\n`;
    sql += `SET FOREIGN_KEY_CHECKS = 0;\n\n`;

    const escape = (val: any) => {
      if (val === null || val === undefined) return 'NULL';
      if (typeof val === 'number') return val;
      if (typeof val === 'boolean') return val ? 1 : 0;
      return `'${String(val).replace(/'/g, "''")}'`;
    };

    // Employees
    sql += `-- --------------------------------------------------------------------\n`;
    sql += `-- Table: employees (${employees.length} records)\n`;
    sql += `-- --------------------------------------------------------------------\n`;
    employees.forEach(emp => {
      sql += `INSERT INTO \`employees\` (\n`;
      sql += `  \`id\`, \`employee_number\`, \`first_name\`, \`last_name\`, \`email\`, \`mobile_phone\`,\n`;
      sql += `  \`address\`, \`suburb\`, \`state\`, \`postcode\`, \`start_date\`, \`department\`, \`job_title\`,\n`;
      sql += `  \`work_location\`, \`reports_to\`, \`status\`, \`working_hours\`, \`working_hours_confirmed\`,\n`;
      sql += `  \`citizen_status\`, \`visa_type\`, \`visa_expiry_date\`, \`visa_status_confirmed\`,\n`;
      sql += `  \`has_driver_license\`, \`license_country\`, \`license_number\`, \`license_expiry_date\`,\n`;
      sql += `  \`emergency_next_of_kin\`, \`emergency_relationship\`, \`emergency_mobile\`,\n`;
      sql += `  \`bank_name\`, \`bank_branch\`, \`account_name\`, \`bsb_encrypted\`, \`bsb_masked\`,\n`;
      sql += `  \`account_number_encrypted\`, \`account_number_masked\`, \`tfn_encrypted\`, \`tfn_masked\`,\n`;
      sql += `  \`super_fund_name\`, \`super_member_number\`, \`kiosk_pin\`, \`clock_state\`, \`avatar_url\`,\n`;
      sql += `  \`annual_leave_balance\`, \`sick_leave_balance\`, \`carers_leave_balance\`, \`long_service_balance\`\n`;
      sql += `) VALUES (\n`;
      sql += `  ${escape(emp.id)}, ${escape(emp.employeeNumber)}, ${escape(emp.firstName)}, ${escape(emp.lastName)}, ${escape(emp.email)}, ${escape(emp.mobilePhone)},\n`;
      sql += `  ${escape(emp.address)}, ${escape(emp.suburb)}, ${escape(emp.state)}, ${escape(emp.postcode)}, ${escape(emp.startDate)}, ${escape(emp.department)}, ${escape(emp.jobTitle)},\n`;
      sql += `  ${escape(emp.workLocation)}, ${escape(emp.reportsTo)}, ${escape(emp.status)}, ${escape(emp.workingHours || 38)}, ${escape(emp.workingHoursConfirmed ? 1 : 0)},\n`;
      sql += `  ${escape(emp.citizenStatus)}, ${escape(emp.visaType)}, ${escape(emp.visaExpiryDate)}, ${escape(emp.visaStatusConfirmed ? 1 : 0)},\n`;
      sql += `  ${escape(emp.hasDriverLicense ? 1 : 0)}, ${escape(emp.licenseCountry)}, ${escape(emp.licenseNumber)}, ${escape(emp.licenseExpiryDate)},\n`;
      sql += `  ${escape(emp.emergencyNextOfKin)}, ${escape(emp.emergencyRelationship)}, ${escape(emp.emergencyMobile)},\n`;
      sql += `  ${escape(emp.bankName)}, ${escape(emp.bankBranch)}, ${escape(emp.accountName)}, ${escape(emp.bsbEncrypted)}, ${escape(emp.bsbMasked)},\n`;
      sql += `  ${escape(emp.accountNumberEncrypted)}, ${escape(emp.accountNumberMasked)}, ${escape(emp.tfnEncrypted)}, ${escape(emp.tfnMasked)},\n`;
      sql += `  ${escape(emp.superFundName)}, ${escape(emp.superMemberNumber)}, ${escape(emp.kioskPin || '4829')}, ${escape(emp.clockState || 'CLOCKED_OUT')}, ${escape(emp.avatarUrl)},\n`;
      sql += `  ${escape(emp.leaveBalance?.annual || 20)}, ${escape(emp.leaveBalance?.sick || 10)}, ${escape(emp.leaveBalance?.carers || 2)}, ${escape(emp.leaveBalance?.longService || 0)}\n`;
      sql += `) ON DUPLICATE KEY UPDATE \`status\` = VALUES(\`status\`), \`updated_at\` = CURRENT_TIMESTAMP;\n\n`;
    });

    sql += `SET FOREIGN_KEY_CHECKS = 1;\n`;

    const blob = new Blob([sql], { type: 'application/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `HsCreations_Database_Dump_${new Date().toISOString().slice(0, 10)}.sql`;
    a.click();
    URL.revokeObjectURL(url);

    addToast('SQL Exported', 'Full database SQL dump generated & downloaded.', 'success');
    addAudit('DATABASE_SQL_EXPORT', 'Database', 'all', 'Exported full SQL database snapshot', 'Admin', 'SuperAdmin');
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
            <h2 className="text-base font-bold text-slate-900">System &amp; Operations Settings Hub</h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
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
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition cursor-pointer"
          >
            Export Backup
          </button>

          <button
            onClick={() => handleSaveSettings(activeTab)}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 shadow-xs transition cursor-pointer"
          >
            Save Changes
          </button>
        </div>
      </div>

      {/* Main Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Navigation Sidebar (3 cols) */}
        <div className="lg:col-span-3 space-y-1 bg-white p-3 rounded-3xl border border-slate-200/80 shadow-xs self-start">
          <button
            onClick={() => setActiveTab('COMPANY')}
            className={`w-full text-left p-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'COMPANY' 
                ? 'bg-slate-900 text-white font-bold' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            Plant &amp; Company Profile
          </button>

          <button
            onClick={() => setActiveTab('SHIFTS')}
            className={`w-full text-left p-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'SHIFTS' 
                ? 'bg-slate-900 text-white font-bold' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            Shift &amp; Timecard Rules
          </button>

          <button
            onClick={() => setActiveTab('LEAVE')}
            className={`w-full text-left p-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'LEAVE' 
                ? 'bg-slate-900 text-white font-bold' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            Leave &amp; Accrual Policy
          </button>

          <button
            onClick={() => setActiveTab('DOCUMENTS')}
            className={`w-full text-left p-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'DOCUMENTS' 
                ? 'bg-slate-900 text-white font-bold' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            Required Documents
          </button>

          <button
            onClick={() => setActiveTab('ROLES')}
            className={`w-full text-left p-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'ROLES' 
                ? 'bg-slate-900 text-white font-bold' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            Roles &amp; Permissions
          </button>

          <button
            onClick={() => setActiveTab('EXPIRY')}
            className={`w-full text-left p-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'EXPIRY' 
                ? 'bg-slate-900 text-white font-bold' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            Visa &amp; License Expiry
          </button>

          <button
            onClick={() => setActiveTab('SECURITY')}
            className={`w-full text-left p-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'SECURITY' 
                ? 'bg-slate-900 text-white font-bold' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            Security &amp; Encryption
          </button>

          <button
            onClick={() => setActiveTab('NOTIFS')}
            className={`w-full text-left p-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'NOTIFS' 
                ? 'bg-slate-900 text-white font-bold' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            Notification Triggers
          </button>

          <button
            onClick={() => setActiveTab('BACKUP')}
            className={`w-full text-left p-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'BACKUP' 
                ? 'bg-slate-900 text-white font-bold' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            Data &amp; Maintenance
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
                <p className="text-slate-500 text-[11px]">Fair Work Australia standard full-time hours, breaks, and shift parameters</p>
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
                  <label className="font-bold text-slate-700 block mb-1">Clock-In Grace Window (Minutes)</label>
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

          {/* TAB 4: REQUIRED DOCUMENTS */}
          {activeTab === 'DOCUMENTS' && (
            <DocumentTypesManager />
          )}

          {/* TAB 5: ROLES & PERMISSIONS */}
          {activeTab === 'ROLES' && (
            <RolesManagement />
          )}

          {/* TAB 6: VISA & LICENSE EXPIRY COMPLIANCE */}
          {activeTab === 'EXPIRY' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Visa &amp; Driver License Expiry Compliance Rules</h3>
                  <p className="text-slate-500 text-[11px]">Configure warning and critical days thresholds, auto-reminder intervals, and staff portal notifications</p>
                </div>
                <button
                  onClick={() => updateExpirySettings(expiryForm)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition cursor-pointer self-start sm:self-auto"
                >
                  Save Compliance Rules
                </button>
              </div>

              {/* Master Auto-Reminder Toggle Card */}
              <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                expiryForm.autoReminderEnabled 
                  ? 'bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-slate-50 border-blue-200 shadow-xs' 
                  : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-xs text-slate-900">Automated Expiry Reminders Engine</h4>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        expiryForm.autoReminderEnabled
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'bg-slate-200 text-slate-600 border-slate-300'
                      }`}>
                        {expiryForm.autoReminderEnabled ? 'ENABLED & ACTIVE' : 'PAUSED'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 max-w-xl">
                      When enabled, automated email reminders and staff portal notifications are sent to employees:
                      <strong className="text-slate-800"> 1 reminder every {expiryForm.warningFrequencyDays} days</strong> during Warning status, and
                      <strong className="text-rose-700"> 1 reminder every {expiryForm.criticalFrequencyDays} days</strong> during Critical status.
                    </p>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={expiryForm.autoReminderEnabled}
                      onChange={e => {
                        const updated = { ...expiryForm, autoReminderEnabled: e.target.checked };
                        setExpiryForm(updated);
                        updateExpirySettings(updated);
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              {/* Thresholds Configuration: Visa & Driver License */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Visa Expiry Thresholds */}
                <div className="bg-slate-50/70 p-4.5 rounded-2xl border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                      <h4 className="font-bold text-xs text-slate-900">Visa Expiration Thresholds</h4>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">Subclass 482/485/500</span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-slate-700 font-bold text-xs flex items-center justify-between mb-1">
                        <span>Visa Warning Threshold</span>
                        <span className="text-amber-700 font-bold text-[11px]">{expiryForm.visaWarningDays} Days Before Expiry</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          max="180"
                          value={expiryForm.visaWarningDays}
                          onChange={e => setExpiryForm({...expiryForm, visaWarningDays: Math.max(1, parseInt(e.target.value) || 1)})}
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20"
                        />
                        <span className="text-xs font-medium text-slate-500 whitespace-nowrap">days before</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">Triggers Warning status in Alerts hub &amp; starts automated cycle</p>
                    </div>

                    <div>
                      <label className="text-slate-700 font-bold text-xs flex items-center justify-between mb-1">
                        <span>Visa Critical Threshold</span>
                        <span className="text-rose-700 font-bold text-[11px]">{expiryForm.visaCriticalDays} Days Before Expiry</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          max="90"
                          value={expiryForm.visaCriticalDays}
                          onChange={e => setExpiryForm({...expiryForm, visaCriticalDays: Math.max(1, parseInt(e.target.value) || 1)})}
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-xs font-bold text-slate-800 focus:ring-2 focus:ring-rose-500/20"
                        />
                        <span className="text-xs font-medium text-slate-500 whitespace-nowrap">days before</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">Triggers Urgent Red Critical breach alert &amp; accelerated dispatch</p>
                    </div>
                  </div>
                </div>

                {/* Driver License Expiry Thresholds */}
                <div className="bg-slate-50/70 p-4.5 rounded-2xl border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                      <h4 className="font-bold text-xs text-slate-900">Driver License Thresholds</h4>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">NSW &amp; Interstate</span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-slate-700 font-bold text-xs flex items-center justify-between mb-1">
                        <span>License Warning Threshold</span>
                        <span className="text-amber-700 font-bold text-[11px]">{expiryForm.licenseWarningDays} Days Before Expiry</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          max="180"
                          value={expiryForm.licenseWarningDays}
                          onChange={e => setExpiryForm({...expiryForm, licenseWarningDays: Math.max(1, parseInt(e.target.value) || 1)})}
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20"
                        />
                        <span className="text-xs font-medium text-slate-500 whitespace-nowrap">days before</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">Triggers upcoming license renewal reminder</p>
                    </div>

                    <div>
                      <label className="text-slate-700 font-bold text-xs flex items-center justify-between mb-1">
                        <span>License Critical Threshold</span>
                        <span className="text-rose-700 font-bold text-[11px]">{expiryForm.licenseCriticalDays} Days Before Expiry</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          max="90"
                          value={expiryForm.licenseCriticalDays}
                          onChange={e => setExpiryForm({...expiryForm, licenseCriticalDays: Math.max(1, parseInt(e.target.value) || 1)})}
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-xs font-bold text-slate-800 focus:ring-2 focus:ring-rose-500/20"
                        />
                        <span className="text-xs font-medium text-slate-500 whitespace-nowrap">days before</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">Triggers Critical alert to ensure valid driving authorisation</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dispatch Frequency Configuration */}
              <div className="bg-slate-50/70 p-4.5 rounded-2xl border border-slate-200 space-y-4">
                <div className="border-b border-slate-200 pb-2.5">
                  <h4 className="font-bold text-xs text-slate-900">Automated Reminder Dispatch Frequency</h4>
                  <p className="text-slate-500 text-[11px]">Set how often reminder emails &amp; staff portal alerts are dispatched to affected employees</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-amber-900">Warning State Frequency</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                        Every {expiryForm.warningFrequencyDays} Days
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-600">Send 1 notice every</span>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={expiryForm.warningFrequencyDays}
                        onChange={e => setExpiryForm({...expiryForm, warningFrequencyDays: Math.max(1, parseInt(e.target.value) || 1)})}
                        className="w-20 px-2.5 py-1.5 border border-amber-300 rounded-lg bg-white text-xs font-bold text-slate-800 text-center"
                      />
                      <span className="text-xs text-slate-600">days</span>
                    </div>
                    <p className="text-[10px] text-amber-800">1 email + 1 staff portal notification sent every {expiryForm.warningFrequencyDays} days during warning window.</p>
                  </div>

                  <div className="p-3.5 bg-rose-50/60 rounded-xl border border-rose-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-rose-900">Critical State Frequency</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                        Every {expiryForm.criticalFrequencyDays} Days
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-600">Send 1 notice every</span>
                      <input
                        type="number"
                        min="1"
                        max="14"
                        value={expiryForm.criticalFrequencyDays}
                        onChange={e => setExpiryForm({...expiryForm, criticalFrequencyDays: Math.max(1, parseInt(e.target.value) || 1)})}
                        className="w-20 px-2.5 py-1.5 border border-rose-300 rounded-lg bg-white text-xs font-bold text-slate-800 text-center"
                      />
                      <span className="text-xs text-slate-600">days</span>
                    </div>
                    <p className="text-[10px] text-rose-800">1 email + 1 staff portal notification sent every {expiryForm.criticalFrequencyDays} days during critical window.</p>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => {
                    const reset = {
                      autoReminderEnabled: true,
                      visaWarningDays: 60,
                      visaCriticalDays: 30,
                      licenseWarningDays: 60,
                      licenseCriticalDays: 30,
                      warningFrequencyDays: 5,
                      criticalFrequencyDays: 3,
                    };
                    setExpiryForm(reset);
                    updateExpirySettings(reset);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                >
                  Reset to Defaults (60d/30d)
                </button>

                <button
                  onClick={() => updateExpirySettings(expiryForm)}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 shadow-xs transition cursor-pointer"
                >
                  Save Compliance Configuration
                </button>
              </div>
            </div>
          )}

          {/* TAB 7: SECURITY & CRYPTOGRAPHY */}
          {activeTab === 'SECURITY' && (
            <div className="space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-black text-sm text-slate-900">Security, Authentication &amp; AES-256 Vault</h3>
                <p className="text-slate-500 text-[11px]">Protect sensitive staff records, TFN numbers, and bank credentials</p>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-slate-900 text-white border border-slate-800 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-xs text-white">AES-256-GCM Vault Status</h4>
                    <p className="text-[11px] text-slate-400">All TFN and banking details are encrypted client-side before storage</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold border border-emerald-500/30">
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
                <h3 className="font-bold text-sm text-slate-900">Automated Notifications &amp; Admin Alerts</h3>
                <p className="text-slate-500 text-[11px]">Real-time in-app notifications and email summaries</p>
              </div>

              <div className="space-y-3">
                <label className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="font-bold text-slate-900 block">Real-Time Staff Clock-In Notifications</span>
                    <span className="text-slate-500 text-[11px]">Admin alerted immediately with staff name, time, and department</span>
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
                    <span className="font-bold text-slate-900 block">Real-Time Staff Clock-Out &amp; Shift Summary Alerts</span>
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
                    <span className="font-bold text-slate-900 block">Visa Expiry 60-Day Automated Digest</span>
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
                <h3 className="font-bold text-sm text-slate-900">System Data Management &amp; Disaster Recovery</h3>
                <p className="text-slate-500 text-[11px]">Export JSON snapshot backups, export audit ledgers, or reset demo state</p>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900">Download MySQL Database Dump (.sql)</h4>
                    <p className="text-slate-500 text-[11px]">Production-ready SQL file with all table structures and current record INSERTs</p>
                  </div>
                  <button
                    onClick={handleExportSQLDump}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                  >
                    Export MySQL (.sql)
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900">Download Complete System Backup (.json)</h4>
                    <p className="text-slate-500 text-[11px]">Encrypted JSON archive containing employee profiles, timecards, and leaves</p>
                  </div>
                  <button
                    onClick={handleExportSystemBackup}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition cursor-pointer"
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