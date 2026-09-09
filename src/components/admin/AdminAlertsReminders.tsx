'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/lib/store';
import { Employee } from '@/types';

interface ExpiringRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeAvatar?: string;
  department: string;
  employeeNumber: string;
  category: 'VISA' | 'LICENSE' | 'OTHER';
  documentTitle: string;
  documentNumber?: string;
  expiryDate: string;
  daysRemaining: number;
  severity: 'CRITICAL' | 'WARNING';
  workRightsOrState?: string;
  emp: Employee;
}

function parseExpiryDays(dateStr?: string): number | null {
  if (!dateStr) return null;
  let expDate: Date | null = null;
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const [d, m, y] = parts;
      expDate = new Date(`${y}-${m}-${d}`);
    }
  } else {
    expDate = new Date(dateStr);
  }
  if (!expDate || isNaN(expDate.getTime())) return null;
  const now = new Date();
  return Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export default function AdminAlertsReminders({
  defaultTab = 'all'
}: {
  defaultTab?: 'all' | 'visa' | 'license';
}) {
  const { alerts, employees, expirySettings, updateExpirySettings, sendInstantExpiryNotification } = useApp();
  
  const [activeSubTab, setActiveSubTab] = useState<'all' | 'visa' | 'license'>(defaultTab);

  useEffect(() => {
    if (defaultTab) {
      setActiveSubTab(defaultTab);
    }
  }, [defaultTab]);

  const [search, setSearch] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [sendingId, setSendingId] = useState<string | null>(null);

  // 1. Compile Visa Expiring Records (ONLY Warning & Critical)
  const visaExpiring: ExpiringRecord[] = [];
  employees.forEach(emp => {
    if (emp.visaExpiryDate && emp.citizenStatus !== 'CITIZEN' && emp.citizenStatus !== 'PERMANENT_RESIDENT') {
      let days = parseExpiryDays(emp.visaExpiryDate);
      if (days === null) {
        const matchingAlert = alerts.find(a => a.employeeId === emp.id && a.type === 'VISA_EXPIRY');
        if (matchingAlert) days = matchingAlert.daysRemaining;
      }
      
      if (days !== null && days <= expirySettings.visaWarningDays) {
        const severity: 'CRITICAL' | 'WARNING' = days <= expirySettings.visaCriticalDays ? 'CRITICAL' : 'WARNING';
        visaExpiring.push({
          id: `visa-${emp.id}`,
          employeeId: emp.id,
          employeeName: `${emp.firstName} ${emp.lastName}`,
          employeeAvatar: emp.avatarUrl,
          department: emp.department || 'Sydney Operations',
          employeeNumber: emp.employeeNumber,
          category: 'VISA',
          documentTitle: emp.visaType || 'Subclass 482 TSS Visa',
          documentNumber: emp.visaStatusConfirmed ? 'VEVO Verified' : 'Pending Verification',
          expiryDate: emp.visaExpiryDate,
          daysRemaining: days,
          severity,
          workRightsOrState: emp.workRestrictions || 'Full work rights (38 hrs/wk)',
          emp,
        });
      }
    }

    // Check uploaded visa documents
    emp.documents?.forEach(doc => {
      if (doc.expiryDate && (doc.name?.toLowerCase().includes('visa') || doc.type?.toLowerCase().includes('visa'))) {
        const days = parseExpiryDays(doc.expiryDate);
        if (days !== null && days <= expirySettings.visaWarningDays) {
          const severity: 'CRITICAL' | 'WARNING' = days <= expirySettings.visaCriticalDays ? 'CRITICAL' : 'WARNING';
          const existing = visaExpiring.find(v => v.employeeId === emp.id);
          if (!existing) {
            visaExpiring.push({
              id: `doc-visa-${doc.id}`,
              employeeId: emp.id,
              employeeName: `${emp.firstName} ${emp.lastName}`,
              employeeAvatar: emp.avatarUrl,
              department: emp.department || 'Sydney Operations',
              employeeNumber: emp.employeeNumber,
              category: 'VISA',
              documentTitle: doc.name || doc.type || 'Visa Grant Document',
              documentNumber: doc.documentNumber || 'Document on file',
              expiryDate: doc.expiryDate,
              daysRemaining: days,
              severity,
              workRightsOrState: 'Work Rights Document',
              emp,
            });
          }
        }
      }
    });
  });

  // 2. Compile Driver License Expiring Records (ONLY Warning & Critical)
  const licenseExpiring: ExpiringRecord[] = [];
  employees.forEach(emp => {
    if (emp.hasDriverLicense && emp.licenseExpiryDate) {
      let days = parseExpiryDays(emp.licenseExpiryDate);
      if (days === null) {
        const matchingAlert = alerts.find(a => a.employeeId === emp.id && a.type === 'LICENSE_EXPIRY');
        if (matchingAlert) days = matchingAlert.daysRemaining;
      }

      if (days !== null && days <= expirySettings.licenseWarningDays) {
        const severity: 'CRITICAL' | 'WARNING' = days <= expirySettings.licenseCriticalDays ? 'CRITICAL' : 'WARNING';
        licenseExpiring.push({
          id: `license-${emp.id}`,
          employeeId: emp.id,
          employeeName: `${emp.firstName} ${emp.lastName}`,
          employeeAvatar: emp.avatarUrl,
          department: emp.department || 'Sydney Operations',
          employeeNumber: emp.employeeNumber,
          category: 'LICENSE',
          documentTitle: `Driver Licence (${emp.licenseCountry || 'NSW'})`,
          documentNumber: emp.licenseNumber || 'DL On File',
          expiryDate: emp.licenseExpiryDate,
          daysRemaining: days,
          severity,
          workRightsOrState: emp.licenseCountry || 'NSW, Australia',
          emp,
        });
      }
    }

    // Check uploaded license & forklift documents
    emp.documents?.forEach(doc => {
      const isLic = doc.name?.toLowerCase().includes('licen') || doc.type?.toLowerCase().includes('licen') || doc.name?.toLowerCase().includes('forklift');
      if (doc.expiryDate && isLic) {
        const days = parseExpiryDays(doc.expiryDate);
        if (days !== null && days <= expirySettings.licenseWarningDays) {
          const severity: 'CRITICAL' | 'WARNING' = days <= expirySettings.licenseCriticalDays ? 'CRITICAL' : 'WARNING';
          const existing = licenseExpiring.find(l => l.employeeId === emp.id && l.documentTitle === doc.name);
          if (!existing) {
            licenseExpiring.push({
              id: `doc-lic-${doc.id}`,
              employeeId: emp.id,
              employeeName: `${emp.firstName} ${emp.lastName}`,
              employeeAvatar: emp.avatarUrl,
              department: emp.department || 'Sydney Operations',
              employeeNumber: emp.employeeNumber,
              category: 'LICENSE',
              documentTitle: doc.name || doc.type || 'Driver / Plant License',
              documentNumber: doc.documentNumber || 'Document on file',
              expiryDate: doc.expiryDate,
              daysRemaining: days,
              severity,
              workRightsOrState: 'Operator Authorisation',
              emp,
            });
          }
        }
      }
    });
  });

  // 3. Compile All Alerts (ONLY Warning & Critical)
  const allExpiring: ExpiringRecord[] = [...visaExpiring, ...licenseExpiring].sort((a, b) => a.daysRemaining - b.daysRemaining);

  // Filter based on active tab, search, and severity
  const getDisplayRecords = () => {
    let list = activeSubTab === 'visa' ? visaExpiring : activeSubTab === 'license' ? licenseExpiring : allExpiring;
    
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(r => 
        r.employeeName.toLowerCase().includes(q) ||
        r.department.toLowerCase().includes(q) ||
        r.documentTitle.toLowerCase().includes(q) ||
        r.employeeNumber.toLowerCase().includes(q)
      );
    }

    if (selectedSeverity !== 'ALL') {
      list = list.filter(r => r.severity === selectedSeverity);
    }

    return list;
  };

  const displayRecords = getDisplayRecords();

  const handleSendInstant = async (record: ExpiringRecord) => {
    setSendingId(record.id);
    try {
      await sendInstantExpiryNotification({
        employeeId: record.employeeId,
        documentType: record.category === 'VISA' ? 'VISA' : 'LICENSE',
        documentName: record.documentTitle,
        documentNumber: record.documentNumber,
        expiryDate: record.expiryDate,
        daysRemaining: record.daysRemaining,
        severity: record.severity,
      });
    } finally {
      setTimeout(() => {
        setSendingId(null);
      }, 500);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 font-sans text-xs">
      
      {/* 1. Header & Navigation Sub-Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Visa and License Alerts Hub</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold border border-rose-200">
              {allExpiring.length} Warning &amp; Critical Alerts
            </span>
          </div>
          <p className="text-slate-500 mt-0.5">
            Active compliance tracking for expiring visas and licenses within configured warning &amp; critical thresholds.
          </p>
        </div>

        {/* Sub-Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200 self-start sm:self-auto">
          <button
            onClick={() => { setActiveSubTab('all'); setSearch(''); }}
            className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
              activeSubTab === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Alerts ({allExpiring.length})
          </button>

          <button
            onClick={() => { setActiveSubTab('visa'); setSearch(''); }}
            className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
              activeSubTab === 'visa'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Visa Alerts ({visaExpiring.length})
          </button>

          <button
            onClick={() => { setActiveSubTab('license'); setSearch(''); }}
            className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
              activeSubTab === 'license'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Driver Licenses ({licenseExpiring.length})
          </button>
        </div>
      </div>

      {/* 2. Automated Expiry Reminders Banner & Toggle */}
      <div className={`p-4 sm:p-5 rounded-3xl border transition-all ${
        expirySettings.autoReminderEnabled 
          ? 'bg-gradient-to-r from-blue-50/90 via-indigo-50/50 to-slate-50 border-blue-200 shadow-xs' 
          : 'bg-slate-50 border-slate-200'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-xs text-slate-900">Automated Expiry Compliance Reminders</h3>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                expirySettings.autoReminderEnabled
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : 'bg-slate-200 text-slate-600 border-slate-300'
              }`}>
                {expirySettings.autoReminderEnabled ? 'AUTOMATIC NOTIFICATIONS ACTIVE' : 'AUTOMATIC NOTIFICATIONS PAUSED'}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 max-w-2xl leading-relaxed">
              When enabled, automatic reminder emails and staff portal notifications are dispatched to staff:
              <strong className="text-slate-800"> 1 reminder every {expirySettings.warningFrequencyDays} days</strong> during Warning status, and
              <strong className="text-rose-700"> 1 reminder every {expirySettings.criticalFrequencyDays} days</strong> during Critical status. Reminders can also be dispatched on demand using the instant button below. Days thresholds and intervals can be adjusted in the Settings tab.
            </p>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-center">
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={expirySettings.autoReminderEnabled}
                onChange={e => {
                  updateExpirySettings({ autoReminderEnabled: e.target.checked });
                }}
                className="sr-only peer"
              />
              <div className="w-12 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* 3. Main Alert Center Container */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        
        {/* Filter Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search expiring records, staff, department..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="px-3.5 py-2 border border-slate-200 rounded-xl bg-white font-medium text-slate-800 text-xs focus:ring-2 focus:ring-blue-500/20 shadow-xs w-full sm:w-72"
            />

            <select
              value={selectedSeverity}
              onChange={e => setSelectedSeverity(e.target.value)}
              className="p-2 border border-slate-200 rounded-xl bg-white text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/20 cursor-pointer shadow-xs"
            >
              <option value="ALL">All Severities (Warning &amp; Critical)</option>
              <option value="CRITICAL">Critical Only</option>
              <option value="WARNING">Warning Only</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <span>Showing <strong>{displayRecords.length}</strong> urgent document record(s)</span>
          </div>
        </div>

        {/* Records Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-5">Staff Member</th>
                <th className="py-3.5 px-5">Department</th>
                <th className="py-3.5 px-5">Document / Subclass</th>
                <th className="py-3.5 px-5">Expiry Date</th>
                <th className="py-3.5 px-5">Status &amp; Urgency</th>
                <th className="py-3.5 px-5">Work Rights / Notes</th>
                <th className="py-3.5 px-5 text-right">Instant Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 space-y-2">
                    <div className="font-bold text-slate-700 text-sm">No Warning or Critical Expiry Alerts</div>
                    <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                      All staff visas and driver licenses are valid with expiry dates beyond the configured warning threshold ({activeSubTab === 'visa' ? expirySettings.visaWarningDays : expirySettings.licenseWarningDays} days).
                    </p>
                  </td>
                </tr>
              ) : (
                displayRecords.map(record => {
                  const isCritical = record.severity === 'CRITICAL';
                  const isSending = sendingId === record.id;

                  return (
                    <tr key={record.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <img 
                            src={record.employeeAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} 
                            alt={record.employeeName} 
                            className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-200 shadow-xs flex-shrink-0"
                          />
                          <div>
                            <span className="font-bold text-slate-900 block">{record.employeeName}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{record.employeeNumber}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-5 font-medium text-slate-700">
                        {record.department}
                      </td>

                      <td className="py-3.5 px-5">
                        <span className="font-bold text-slate-900 block">{record.documentTitle}</span>
                        {record.documentNumber && (
                          <span className="text-[10px] text-slate-400 font-mono">{record.documentNumber}</span>
                        )}
                      </td>

                      <td className="py-3.5 px-5">
                        <span className="font-mono text-slate-900 font-bold block">{record.expiryDate}</span>
                        <span className={`text-[10px] font-bold ${isCritical ? 'text-rose-600' : 'text-amber-600'}`}>
                          {record.daysRemaining <= 0 
                            ? `EXPIRED (${Math.abs(record.daysRemaining)}d ago)` 
                            : `${record.daysRemaining} days remaining`}
                        </span>
                      </td>

                      <td className="py-3.5 px-5">
                        {isCritical ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
                            CRITICAL
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                            WARNING
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-5 text-[11px] text-slate-600">
                        {record.workRightsOrState || 'Verified Rights'}
                      </td>

                      <td className="py-3.5 px-5 text-right">
                        <button
                          onClick={() => handleSendInstant(record)}
                          disabled={isSending}
                          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] shadow-xs transition cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50"
                          title="Sends reminder email to employee and notification to Staff Portal"
                        >
                          {isSending ? (
                            <>
                              <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              <span>Sending...</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                              </svg>
                              <span>Send Instant Alert</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
