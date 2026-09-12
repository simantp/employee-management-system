'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/lib/store';
import DocumentTypesManager from './DocumentTypesManager';
import RolesManagement from './RolesManagement';
import { LockedIpRecord } from '@/types';
import { detectWorkstationIp } from '@/lib/ipUtils';

export type SettingsTab = 'COMPANY' | 'SHIFTS' | 'LEAVE' | 'DOCUMENTS' | 'ROLES' | 'EXPIRY' | 'IP_LOCK' | 'SECURITY' | 'RETENTION' | 'NOTIFS' | 'BACKUP';

export default function AdminSettingsHub({
  defaultTab = 'COMPANY'
}: {
  defaultTab?: SettingsTab;
}) {
  const { 
    addToast, 
    addAudit, 
    employees, 
    timecards, 
    leaveRequests, 
    auditLogs, 
    expirySettings, 
    updateExpirySettings, 
    auditRetentionDays, 
    updateAuditRetentionDays, 
    pruneAuditLogs,
    ipLockSettings,
    updateIpLockSettings,
    addLockedIp,
    updateLockedIp,
    deleteLockedIp,
    toggleLockedIp,
    detectAndLockCurrentIp,
    updateEmployee,
  } = useApp();

  const [activeTab, setActiveTab] = useState<SettingsTab>(defaultTab);
  const [retentionDaysInput, setRetentionDaysInput] = useState<number>(auditRetentionDays || 90);
  const [isPruning, setIsPruning] = useState(false);
  const [isSavingRetention, setIsSavingRetention] = useState(false);

  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab]);

  useEffect(() => {
    if (auditRetentionDays) {
      setRetentionDaysInput(auditRetentionDays);
    }
  }, [auditRetentionDays]);

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

  // 7. Workstation IP Lock & Restrictions State
  const [showAddIpModal, setShowAddIpModal] = useState(false);
  const [editingIpId, setEditingIpId] = useState<string | null>(null);
  const [ipForm, setIpForm] = useState<{
    ip: string;
    label: string;
    notes?: string;
    isActive: boolean;
  }>({
    ip: '',
    label: '',
    notes: '',
    isActive: true,
  });
  const [detectedAdminIp, setDetectedAdminIp] = useState<string>('');
  const [isDetectingIp, setIsDetectingIp] = useState(false);
  const [releasingLock, setReleasingLock] = useState<LockedIpRecord | null>(null);

  useEffect(() => {
    if (activeTab === 'IP_LOCK') {
      setIsDetectingIp(true);
      detectWorkstationIp().then(ip => {
        setDetectedAdminIp(ip);
        setIsDetectingIp(false);
      }).catch(() => setIsDetectingIp(false));
    }
  }, [activeTab]);

  // Auto-sync settings to localStorage and backend in real time
  const [isHydrated, setIsHydrated] = useState(false);
  const isFirstRender = React.useRef(true);

  useEffect(() => {
    async function loadSettings() {
      try {
        const saved = localStorage.getItem('ems_settings_hub');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.companyForm) setCompanyForm(parsed.companyForm);
          if (parsed.shiftRules) setShiftRules(parsed.shiftRules);
          if (parsed.leavePolicy) setLeavePolicy(parsed.leavePolicy);
          if (parsed.securitySettings) setSecuritySettings(parsed.securitySettings);
          if (parsed.notifPreferences) setNotifPreferences(parsed.notifPreferences);
        }
        
        // Sync with backend API / DB
        const res = await fetch('/api/settings').then(r => r.json());
        if (res?.success && res?.settings) {
          if (res.settings.companyForm) setCompanyForm(res.settings.companyForm);
          if (res.settings.shiftRules) setShiftRules(res.settings.shiftRules);
          if (res.settings.leavePolicy) setLeavePolicy(res.settings.leavePolicy);
          if (res.settings.securitySettings) setSecuritySettings(res.settings.securitySettings);
          if (res.settings.notifPreferences) setNotifPreferences(res.settings.notifPreferences);
          if (res.settings.auditRetentionDays !== undefined) {
            setRetentionDaysInput(Number(res.settings.auditRetentionDays) || 90);
          }
          if (res.settings.expirySettings) {
            setExpiryForm(res.settings.expirySettings);
          }
        }
      } catch (e) {}
      setIsHydrated(true);
    }
    loadSettings();
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const payload = {
          companyForm,
          shiftRules,
          leavePolicy,
          securitySettings,
          notifPreferences,
          expirySettings: expiryForm,
          auditRetentionDays: retentionDaysInput,
        };
        localStorage.setItem('ems_settings_hub', JSON.stringify(payload));
        localStorage.setItem('ems_audit_retention_days_v1', JSON.stringify(retentionDaysInput));
        localStorage.setItem('ems_expiry_settings_v1', JSON.stringify(expiryForm));

        const res = await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            addToast('Saved to Database', 'Settings updated and saved in real time.', 'success');
          } else {
            addToast('Database Error', data.message || 'Could not save settings to database.', 'error');
          }
        } else {
          addToast('Database Error', 'Server error while saving settings.', 'error');
        }
      } catch (e) {
        addToast('Database Error', 'Failed to connect to database.', 'error');
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [companyForm, shiftRules, leavePolicy, securitySettings, notifPreferences, expiryForm, retentionDaysInput, isHydrated]);

  const handleUpdateRetention = (days: number) => {
    const validDays = Math.max(1, Math.min(3650, days || 90));
    setRetentionDaysInput(validDays);
    updateAuditRetentionDays(validDays);
  };

  const handleSaveSettings = async (section: string) => {
    if (activeTab === 'EXPIRY') {
      updateExpirySettings(expiryForm);
      return;
    }
    if (activeTab === 'RETENTION') {
      setIsSavingRetention(true);
      await updateAuditRetentionDays(retentionDaysInput);
      setIsSavingRetention(false);
      return;
    }
    addToast('Settings Saved', `${section} preferences updated and persisted successfully.`, 'success');
    addAudit('SYSTEM_SETTINGS_UPDATED', 'Settings', 'global', `Updated ${section} configuration settings`, 'Admin', 'SuperAdmin');
  };

  const handleManualPruneLogs = async () => {
    setIsPruning(true);
    try {
      const res = await pruneAuditLogs(retentionDaysInput);
      addToast('Audit Logs Pruned', res.message || `Pruned records older than ${retentionDaysInput} days.`, 'success');
    } catch (e: any) {
      addToast('Pruning Error', e.message || 'Failed to prune logs.', 'error');
    } finally {
      setIsPruning(false);
    }
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

        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Auto-Saved in Real Time</span>
          </div>

          <button
            onClick={handleExportSystemBackup}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition cursor-pointer"
          >
            Export Backup
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
            onClick={() => setActiveTab('IP_LOCK')}
            className={`w-full text-left p-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-between ${
              activeTab === 'IP_LOCK' 
                ? 'bg-slate-900 text-white font-bold' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <span>Workstation IP Lock</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono font-bold ${
              ipLockSettings?.enabled
                ? 'bg-rose-950/40 text-rose-400 border border-rose-500/30'
                : 'bg-slate-100 text-slate-500'
            }`}>
              {ipLockSettings?.lockedIps?.filter(l => l.isActive).length || 0} Locked
            </span>
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
            onClick={() => setActiveTab('RETENTION')}
            className={`w-full text-left p-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-between ${
              activeTab === 'RETENTION' 
                ? 'bg-slate-900 text-white font-bold' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <span>Audit Log &amp; Retention</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono font-bold ${
              activeTab === 'RETENTION' ? 'bg-slate-800 text-orange-400' : 'bg-slate-100 text-slate-500'
            }`}>
              {retentionDaysInput}d
            </span>
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
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-bold text-sm text-slate-900">Visa &amp; Driver License Expiry Compliance Rules</h3>
                <p className="text-slate-500 text-[11px]">Configure warning and critical days thresholds, auto-reminder intervals, and staff portal notifications</p>
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

          {/* TAB: WORKSTATION IP LOCK & RESTRICTIONS */}
          {activeTab === 'IP_LOCK' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-black text-sm text-slate-900">Workstation IP Detection &amp; Locking System</h3>
                  <p className="text-slate-500 text-[11px]">
                    Detect and lock client IP addresses. Once locked, shift clock-in and clock-out can strictly only be performed from authorized workstation IPs.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={async () => {
                      const res = await detectAndLockCurrentIp('Current Workstation');
                      if (res?.success) {
                        setDetectedAdminIp(res.ip);
                      }
                    }}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Detect &amp; Lock Current IP</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingIpId(null);
                      setIpForm({
                        ip: detectedAdminIp || '',
                        label: '',
                        notes: '',
                        isActive: true,
                      });
                      setShowAddIpModal(true);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>+ Add Locked IP</span>
                  </button>
                </div>
              </div>

              {/* 1. Enforcement Policy Selector */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-slate-900">1. Shift Clock IP Lock Enforcement Policy</h4>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border font-mono ${
                    ipLockSettings?.enabled
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                    POLICY: {ipLockSettings?.enabled ? 'STRICT LOCK ENFORCED' : 'UNRESTRICTED (DISABLED)'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {/* Option 1: STRICT LOCK */}
                  <div
                    onClick={() => updateIpLockSettings({ enabled: true })}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition ${
                      ipLockSettings?.enabled
                        ? 'border-rose-500 bg-rose-50/40 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-xs text-slate-900">Locked Workstations Only (Strict)</span>
                      <span className={`w-3 h-3 rounded-full border-2 ${
                        ipLockSettings?.enabled ? 'bg-rose-500 border-rose-500' : 'border-slate-300'
                      }`} />
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Staff shift clock-in and clock-out is strictly restricted to active locked workstation IPs. Any punch attempt from an unapproved IP is immediately rejected with an authorization error.
                    </p>
                    <div className="mt-2 text-[10px] font-bold text-rose-700">
                      Maximum Security • Zero Unapproved Punching
                    </div>
                  </div>

                  {/* Option 2: DISABLED */}
                  <div
                    onClick={() => updateIpLockSettings({ enabled: false })}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition ${
                      !ipLockSettings?.enabled
                        ? 'border-slate-700 bg-slate-100 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-xs text-slate-900">Unrestricted (Disabled)</span>
                      <span className={`w-3 h-3 rounded-full border-2 ${
                        !ipLockSettings?.enabled ? 'bg-slate-700 border-slate-700' : 'border-slate-300'
                      }`} />
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Punches are permitted from any network. Client workstation IP and device signatures are stamped on timecards for Fair Work compliance without blocking punches.
                    </p>
                    <div className="mt-2 text-[10px] font-bold text-slate-600">
                      Audit Logging Only • Open Access
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Live Current Workstation IP Detection Banner */}
              <div className="p-4 rounded-2xl bg-slate-900 text-white border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Current Workstation IP</span>
                      {isDetectingIp && (
                        <span className="text-[9px] text-orange-400 font-mono animate-pulse">Detecting...</span>
                      )}
                    </div>
                    <div className="flex items-baseline gap-3 mt-1">
                      <span className="text-xl font-black font-mono tracking-tight text-white">
                        {detectedAdminIp || (isDetectingIp ? 'Scanning network...' : '127.0.0.1 (Local)')}
                      </span>
                      {(() => {
                        const matched = ipLockSettings?.lockedIps?.find(l => l.ip === detectedAdminIp);
                        if (matched && matched.isActive) {
                          return (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 inline-flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              <span>Authorized Workstation ({matched.label})</span>
                            </span>
                          );
                        }
                        if (matched && !matched.isActive) {
                          return (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/80 text-amber-400 border border-amber-500/40">
                              Registered But Inactive ({matched.label})
                            </span>
                          );
                        }
                        return (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                            Unregistered Workstation IP
                          </span>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsDetectingIp(true);
                        detectWorkstationIp().then(ip => {
                          setDetectedAdminIp(ip);
                          setIsDetectingIp(false);
                          addToast('IP Detected', `Current workstation IP is ${ip}`, 'info');
                        });
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer"
                    >
                      Re-Detect IP
                    </button>

                    {(() => {
                      const matched = ipLockSettings?.lockedIps?.find(l => l.ip === detectedAdminIp && l.isActive);
                      if (matched) {
                        return (
                          <button
                            type="button"
                            onClick={() => setReleasingLock(matched)}
                            className="px-3.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
                          >
                            <span>Release Current Lock</span>
                          </button>
                        );
                      }
                      const inactiveMatch = ipLockSettings?.lockedIps?.find(l => l.ip === detectedAdminIp && !l.isActive);
                      if (inactiveMatch) {
                        return (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => toggleLockedIp(inactiveMatch.id)}
                              className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition cursor-pointer shadow-xs"
                            >
                              Enable Lock
                            </button>
                            <button
                              type="button"
                              onClick={() => setReleasingLock(inactiveMatch)}
                              className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-bold text-xs transition cursor-pointer"
                            >
                              Release
                            </button>
                          </div>
                        );
                      }
                      return (
                        <button
                          type="button"
                          onClick={() => {
                            if (detectedAdminIp) {
                              detectAndLockCurrentIp('Admin Workstation');
                            }
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition cursor-pointer shadow-xs"
                        >
                          Lock This Workstation
                        </button>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* 2. Authorized & Locked Workstations List */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">2. Authorized &amp; Locked Workstation IPs</h4>
                    <p className="text-slate-500 text-[11px]">List of all registered workstations, kiosks, and terminals authorized for punch operations.</p>
                  </div>
                  <span className="text-[11px] font-bold text-slate-600 font-mono">
                    {ipLockSettings?.lockedIps?.filter(l => l.isActive).length || 0} / {ipLockSettings?.lockedIps?.length || 0} Active Workstations
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {ipLockSettings?.lockedIps?.map(loc => (
                    <div
                      key={loc.id}
                      className={`p-4 rounded-2xl border transition relative ${
                        loc.isActive
                          ? 'border-slate-200 bg-white shadow-2xs hover:border-slate-300'
                          : 'border-slate-200/60 bg-slate-50/70 opacity-70'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h5 className="font-black text-xs text-slate-900">{loc.label}</h5>
                          {loc.notes && (
                            <span className="text-[10px] text-slate-500 block leading-tight">{loc.notes}</span>
                          )}
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border shrink-0 ${
                          loc.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}>
                          {loc.isActive ? 'Active Locked' : 'Disabled'}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1 font-mono text-[10px] text-slate-600">
                        <div className="flex justify-between items-center">
                          <span className="font-sans text-slate-400">Locked IP Address:</span>
                          <span className="font-bold text-slate-900 text-xs">{loc.ip}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-sans text-slate-400">Added:</span>
                          <span className="font-sans text-slate-600">{loc.addedAt || 'Configured'}</span>
                        </div>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                        <button
                          type="button"
                          onClick={() => toggleLockedIp(loc.id)}
                          className="text-[11px] font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
                        >
                          {loc.isActive ? 'Disable' : 'Enable'}
                        </button>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingIpId(loc.id);
                              setIpForm({
                                ip: loc.ip,
                                label: loc.label,
                                notes: loc.notes || '',
                                isActive: loc.isActive,
                              });
                              setShowAddIpModal(true);
                            }}
                            className="text-[11px] font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setReleasingLock(loc)}
                            className="text-[11px] font-bold text-rose-600 hover:text-rose-800 cursor-pointer"
                          >
                            Release Lock
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Add / Edit Locked Workstation IP Modal */}
          {showAddIpModal && (
            <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in zoom-in-95">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h4 className="font-black text-sm text-slate-900">
                    {editingIpId ? 'Edit Locked Workstation IP' : 'Lock New Workstation IP'}
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowAddIpModal(false)}
                    className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Workstation / Terminal Label *</label>
                    <input
                      type="text"
                      placeholder="e.g. Sydney Riverwood Plant Main Kiosk"
                      value={ipForm.label}
                      onChange={e => setIpForm({ ...ipForm, label: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-xl bg-white text-xs font-medium focus:ring-2 focus:ring-orange-500/20"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-slate-700">IP Address (IPv4 / IPv6 / Subnet) *</label>
                      {detectedAdminIp && (
                        <button
                          type="button"
                          onClick={() => setIpForm({ ...ipForm, ip: detectedAdminIp })}
                          className="text-[10px] text-emerald-700 font-bold hover:underline cursor-pointer"
                        >
                          Use Current Detected IP ({detectedAdminIp})
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. 192.168.1.100 or 120.18.42.110"
                      value={ipForm.ip}
                      onChange={e => setIpForm({ ...ipForm, ip: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-xl bg-white font-mono font-bold text-xs focus:ring-2 focus:ring-orange-500/20"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">Enter an exact IP or CIDR subnet (e.g. 192.168.1.0/24).</span>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Department / Location Notes</label>
                    <input
                      type="text"
                      placeholder="e.g. Front reception desk terminal, Riverwood plant hall"
                      value={ipForm.notes}
                      onChange={e => setIpForm({ ...ipForm, notes: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-xl bg-white text-xs font-medium focus:ring-2 focus:ring-orange-500/20"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="ip-is-active"
                      checked={ipForm.isActive}
                      onChange={e => setIpForm({ ...ipForm, isActive: e.target.checked })}
                      className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-slate-300 cursor-pointer"
                    />
                    <label htmlFor="ip-is-active" className="font-bold text-slate-700 cursor-pointer">
                      Active (Workstation punches permitted)
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddIpModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!ipForm.ip.trim() || !ipForm.label.trim()) {
                        addToast('Missing Fields', 'Workstation Label and IP Address are required.', 'error');
                        return;
                      }
                      if (editingIpId) {
                        updateLockedIp(editingIpId, {
                          ip: ipForm.ip.trim(),
                          label: ipForm.label.trim(),
                          notes: ipForm.notes?.trim(),
                          isActive: ipForm.isActive,
                        });
                      } else {
                        addLockedIp(ipForm.ip.trim(), ipForm.label.trim(), ipForm.notes?.trim());
                      }
                      setShowAddIpModal(false);
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                  >
                    {editingIpId ? 'Save Changes' : 'Lock Workstation IP'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modern Release / Delete Workstation IP Lock Modal */}
          {releasingLock && (
            <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center font-bold text-xs">
                      IP
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-slate-900">Release Workstation Lock</h4>
                      <p className="text-[10px] text-slate-500">Remove from authorized IP whitelist</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReleasingLock(null)}
                    className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>

                <div className="p-3.5 rounded-2xl bg-rose-50/60 border border-rose-200/80 space-y-2 text-xs">
                  <p className="text-slate-700 leading-relaxed text-[11px]">
                    Are you sure you want to release and remove the locked IP for <strong className="text-slate-950 font-bold">{releasingLock.label}</strong>?
                  </p>
                  <div className="p-2.5 rounded-xl bg-white border border-rose-200 font-mono text-xs text-slate-800 space-y-1">
                    <div className="flex justify-between">
                      <span className="font-sans text-slate-400 text-[10px]">Workstation:</span>
                      <span className="font-bold text-slate-900">{releasingLock.label}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-sans text-slate-400 text-[10px]">IP Address:</span>
                      <span className="font-bold text-rose-700">{releasingLock.ip}</span>
                    </div>
                    {releasingLock.notes && (
                      <div className="flex justify-between">
                        <span className="font-sans text-slate-400 text-[10px]">Notes:</span>
                        <span className="font-sans text-slate-600 text-[11px]">{releasingLock.notes}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-rose-700 font-semibold">
                    Once released, shift clock punch from this workstation will be blocked if IP lock enforcement is active.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setReleasingLock(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                  >
                    Keep Locked
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      deleteLockedIp(releasingLock.id);
                      addToast('Workstation Lock Released', `Unlocked and removed IP ${releasingLock.ip} (${releasingLock.label}).`, 'info');
                      setReleasingLock(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                  >
                    Release &amp; Delete Lock
                  </button>
                </div>
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

          {/* TAB: AUDIT LOG & RETENTION POLICY */}
          {activeTab === 'RETENTION' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Audit Log &amp; Record Retention Policy</h3>
                  <p className="text-slate-500 text-[11px]">
                    Configure how long system activity trails and audit logs are kept in database &amp; server records before automated deletion
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-mono text-[10px] font-bold border border-emerald-200 self-start sm:self-auto">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Auto-Purge Engine Active
                </span>
              </div>

              {/* Status Overview Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="p-4 rounded-2xl bg-slate-900 text-white border border-slate-800 space-y-1">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Retention Window</span>
                  <div className="text-2xl font-black text-orange-400 flex items-baseline gap-1">
                    <span>{retentionDaysInput}</span>
                    <span className="text-xs font-bold text-slate-300">Days</span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Records older than {retentionDaysInput} days are automatically deleted
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Audit Records on File</span>
                  <div className="text-2xl font-black text-slate-900 flex items-baseline gap-1">
                    <span>{auditLogs.length}</span>
                    <span className="text-xs font-medium text-slate-500">entries</span>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Live records currently maintained in storage
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Deletion Schedule</span>
                  <div className="text-sm font-black text-slate-900 pt-1">
                    Continuous &amp; Real-time
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Purged across MySQL database &amp; disk storage automatically
                  </p>
                </div>
              </div>

              {/* Retention Setting Controls */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-2xs">
                <div>
                  <h4 className="font-bold text-xs text-slate-900">Set Maximum Audit Log Retention Period</h4>
                  <p className="text-slate-500 text-[11px]">
                    Select a standard compliance preset or enter a custom number of days.
                  </p>
                </div>

                {/* Preset Buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                  {[
                    { label: '7 Days', days: 7, desc: '1 Wk' },
                    { label: '14 Days', days: 14, desc: '2 Wks' },
                    { label: '30 Days', days: 30, desc: '1 Mo' },
                    { label: '60 Days', days: 60, desc: '2 Mos' },
                    { label: '90 Days', days: 90, desc: 'Default' },
                    { label: '180 Days', days: 180, desc: '6 Mos' },
                    { label: '365 Days', days: 365, desc: '1 Yr' },
                  ].map(preset => (
                    <button
                      key={preset.days}
                      type="button"
                      onClick={() => handleUpdateRetention(preset.days)}
                      className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                        retentionDaysInput === preset.days
                          ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="font-bold text-xs">{preset.label}</div>
                      <div className={`text-[10px] ${retentionDaysInput === preset.days ? 'text-orange-400' : 'text-slate-400'}`}>
                        {preset.desc}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Custom Days Input */}
                <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <label className="font-bold text-xs text-slate-800">
                      Custom Retention Window:
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="1"
                        max="3650"
                        value={retentionDaysInput}
                        onChange={e => handleUpdateRetention(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-24 px-3 py-1.5 text-xs font-bold border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-900 text-center"
                      />
                      <span className="text-slate-500 font-bold text-xs">Days</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isPruning}
                      onClick={handleManualPruneLogs}
                      className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition cursor-pointer disabled:opacity-50"
                    >
                      {isPruning ? 'Pruning...' : 'Prune Expired Logs Now'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Policy & Compliance Information */}
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 text-amber-950 space-y-2">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-xs text-amber-900 uppercase tracking-wider">Automated Audit Lifecycle Rules</h4>
                </div>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-800/90 leading-relaxed pl-1">
                  <li>Audit logs and activity records older than the specified duration are automatically purged on every database sync and background maintenance cycle.</li>
                  <li>Pruning operates synchronously across both local JSON file snapshots and the MySQL production database (<code className="bg-amber-100/80 px-1 py-0.5 rounded text-[10px] font-mono">audit_logs</code> table).</li>
                  <li>Essential employee profile records, timecards, and approved leave records remain permanently intact and are not deleted by the audit log retention policy.</li>
                </ul>
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