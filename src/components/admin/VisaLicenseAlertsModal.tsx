'use client';

import React, { useState } from 'react';
import { Employee } from '@/types';
import { useApp } from '@/lib/store';
import StaffEmailLogsModal from './StaffEmailLogsModal';

interface VisaLicenseAlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEmployee?: (emp: Employee, initialSection?: 'DOCUMENTS' | 'VISA_LICENCE_EMERGENCY') => void;
}

interface ExpiryItem {
  id: string;
  employee: Employee;
  documentType: 'VISA' | 'DRIVER_LICENSE' | 'CERTIFICATION' | 'OTHER';
  documentTitle: string;
  documentNumber?: string;
  expiryDateStr: string;
  daysRemaining: number;
  severity: 'CRITICAL' | 'WARNING';
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

export default function VisaLicenseAlertsModal({
  isOpen,
  onClose
}: VisaLicenseAlertsModalProps) {
  const { employees, alerts, expirySettings, sendInstantExpiryNotification } = useApp();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'VISA' | 'LICENSE'>('ALL');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'CRITICAL' | 'WARNING'>('ALL');
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [selectedStaffForLogs, setSelectedStaffForLogs] = useState<Employee | null>(null);

  if (!isOpen) return null;

  // Compile ONLY warning and critical items across all staff
  const expiryItems: ExpiryItem[] = [];

  employees.forEach(emp => {
    if (emp.status === 'Archived' || emp.status === 'Terminated') return;

    // 1. Visa Expiry
    if (emp.visaExpiryDate && emp.citizenStatus !== 'CITIZEN' && emp.citizenStatus !== 'PERMANENT_RESIDENT') {
      let days = parseExpiryDays(emp.visaExpiryDate);
      if (days === null) {
        const matchingAlert = alerts.find(a => a.employeeId === emp.id && a.type === 'VISA_EXPIRY');
        if (matchingAlert) days = matchingAlert.daysRemaining;
      }

      if (days !== null && days <= expirySettings.visaWarningDays) {
        const severity: 'CRITICAL' | 'WARNING' = days <= expirySettings.visaCriticalDays ? 'CRITICAL' : 'WARNING';
        expiryItems.push({
          id: `visa-${emp.id}`,
          employee: emp,
          documentType: 'VISA',
          documentTitle: emp.visaType || 'Subclass 482 (TSS Visa)',
          documentNumber: emp.visaStatusConfirmed ? 'VEVO Verified' : 'Pending Verification',
          expiryDateStr: emp.visaExpiryDate,
          daysRemaining: days,
          severity,
        });
      }
    }

    // 2. Driver License Expiry
    if (emp.hasDriverLicense && emp.licenseExpiryDate) {
      let days = parseExpiryDays(emp.licenseExpiryDate);
      if (days === null) {
        const matchingAlert = alerts.find(a => a.employeeId === emp.id && a.type === 'LICENSE_EXPIRY');
        if (matchingAlert) days = matchingAlert.daysRemaining;
      }

      if (days !== null && days <= expirySettings.licenseWarningDays) {
        const severity: 'CRITICAL' | 'WARNING' = days <= expirySettings.licenseCriticalDays ? 'CRITICAL' : 'WARNING';
        expiryItems.push({
          id: `license-${emp.id}`,
          employee: emp,
          documentType: 'DRIVER_LICENSE',
          documentTitle: `Driver Licence (${emp.licenseCountry || 'NSW'})`,
          documentNumber: emp.licenseNumber || 'DL On File',
          expiryDateStr: emp.licenseExpiryDate,
          daysRemaining: days,
          severity,
        });
      }
    }

    // 3. Uploaded Compliance Documents with Expiry
    emp.documents?.forEach(doc => {
      if (doc.expiryDate) {
        const dName = (doc.name || '').toLowerCase();
        const dType = (doc.type || '').toLowerCase();
        const isVisa = dName.includes('visa') || dType.includes('visa');
        const isLicense = dName.includes('licen') || dType.includes('licen') || dName.includes('forklift') || dType.includes('forklift');
        
        if (isVisa || isLicense) {
          let days = parseExpiryDays(doc.expiryDate);
          if (days === null) {
            const matchingAlert = alerts.find(a => a.employeeId === emp.id && (isVisa ? a.type === 'VISA_EXPIRY' : a.type === 'LICENSE_EXPIRY'));
            if (matchingAlert) days = matchingAlert.daysRemaining;
          }
          const warnThreshold = isVisa ? expirySettings.visaWarningDays : expirySettings.licenseWarningDays;
          const critThreshold = isVisa ? expirySettings.visaCriticalDays : expirySettings.licenseCriticalDays;

          if (days !== null && days <= warnThreshold) {
            const severity: 'CRITICAL' | 'WARNING' = days <= critThreshold ? 'CRITICAL' : 'WARNING';
            const existing = expiryItems.find(x => x.id === `doc-${doc.id}` || (x.employee.id === emp.id && x.documentTitle === (doc.name || doc.type)));
            if (!existing) {
              expiryItems.push({
                id: `doc-${doc.id}`,
                employee: emp,
                documentType: isVisa ? 'VISA' : 'DRIVER_LICENSE',
                documentTitle: doc.name || doc.type || (isVisa ? 'Visa Document' : 'Driver License Document'),
                documentNumber: doc.documentNumber || 'Document On File',
                expiryDateStr: doc.expiryDate,
                daysRemaining: days,
                severity,
              });
            }
          }
        }
      }
    });
  });

  // Deduplicate and sort by urgency (lowest days remaining first)
  const uniqueItems = expiryItems.reduce<ExpiryItem[]>((acc, item) => {
    if (!acc.some(x => x.id === item.id)) acc.push(item);
    return acc;
  }, []).sort((a, b) => a.daysRemaining - b.daysRemaining);

  // Filter items based on search and selected filters
  const filteredItems = uniqueItems.filter(item => {
    const q = search.toLowerCase();
    const matchesSearch = 
      item.employee.firstName.toLowerCase().includes(q) ||
      item.employee.lastName.toLowerCase().includes(q) ||
      item.employee.employeeNumber.toLowerCase().includes(q) ||
      item.documentTitle.toLowerCase().includes(q) ||
      (item.documentNumber && item.documentNumber.toLowerCase().includes(q)) ||
      (item.employee.department && item.employee.department.toLowerCase().includes(q));

    const matchesCategory = 
      categoryFilter === 'ALL' ? true :
      categoryFilter === 'VISA' ? item.documentType === 'VISA' :
      item.documentType === 'DRIVER_LICENSE';

    const matchesSeverity = 
      severityFilter === 'ALL' ? true :
      item.severity === severityFilter;

    return matchesSearch && matchesCategory && matchesSeverity;
  });

  const criticalCount = uniqueItems.filter(i => i.severity === 'CRITICAL').length;
  const warningCount = uniqueItems.filter(i => i.severity === 'WARNING').length;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 max-w-4xl w-full my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-xs shadow-black/20 flex flex-col max-h-[88vh]"
        onClick={e => e.stopPropagation()}
      >
        
        {/* Modal Header */}
        <div className="p-6 bg-slate-50 text-slate-900 flex items-center justify-between border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Visa and License Expiry Alerts
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 font-extrabold text-[10px] border border-rose-200">
                {uniqueItems.length} Warning &amp; Critical Alerts
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Active alerts for TSS 482 visas, student visas, and driver licences requiring renewal
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-200/80 transition cursor-pointer font-bold text-xs"
          >
            Close
          </button>
        </div>

        {/* Severity Summary Filter Strip */}
        <div className="grid grid-cols-2 bg-slate-100/70 text-slate-800 p-3 border-b border-slate-200 text-center text-xs divide-x divide-slate-200">
          <div 
            onClick={() => setSeverityFilter(severityFilter === 'CRITICAL' ? 'ALL' : 'CRITICAL')}
            className={`cursor-pointer px-2 py-1 rounded-xl transition ${
              severityFilter === 'CRITICAL' ? 'bg-rose-100 text-rose-800 font-bold border border-rose-200' : 'hover:bg-slate-200/60'
            }`}
          >
            <span className="text-rose-600 font-black text-sm block">{criticalCount}</span>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Critical Alerts (&le; {expirySettings.visaCriticalDays}d)</span>
          </div>

          <div 
            onClick={() => setSeverityFilter(severityFilter === 'WARNING' ? 'ALL' : 'WARNING')}
            className={`cursor-pointer px-2 py-1 rounded-xl transition ${
              severityFilter === 'WARNING' ? 'bg-amber-100 text-amber-800 font-bold border border-amber-200' : 'hover:bg-slate-200/60'
            }`}
          >
            <span className="text-amber-600 font-black text-sm block">{warningCount}</span>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Warning Alerts (&le; {expirySettings.visaWarningDays}d)</span>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <input
              type="text"
              placeholder="Search staff, visa subclass, licence #..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="px-3.5 py-2 border border-slate-200 rounded-xl bg-white font-medium text-slate-800 text-xs focus:ring-2 focus:ring-amber-500/20 shadow-2xs w-full sm:w-64"
            />

            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setCategoryFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                  categoryFilter === 'ALL' ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({uniqueItems.length})
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('VISA')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                  categoryFilter === 'VISA' ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Visas ({uniqueItems.filter(i => i.documentType === 'VISA').length})
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('LICENSE')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                  categoryFilter === 'LICENSE' ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Licences ({uniqueItems.filter(i => i.documentType === 'DRIVER_LICENSE').length})
              </button>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 font-semibold self-end sm:self-center">
            Showing <strong className="text-slate-900">{filteredItems.length}</strong> urgent alert(s)
          </div>
        </div>

        {/* List of Warning & Critical Expiring Items */}
        <div className="p-5 space-y-3 overflow-y-auto flex-1 divide-y divide-slate-100">
          {filteredItems.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black uppercase tracking-wider inline-block">
                All Clear
              </span>
              <h4 className="font-bold text-slate-800 text-sm">No Warning or Critical Expiry Alerts</h4>
              <p className="text-slate-500 max-w-sm mx-auto text-xs">
                All employee visas and driver licences are valid beyond the configured warning threshold.
              </p>
            </div>
          ) : (
            filteredItems.map(item => {
              const isCritical = item.severity === 'CRITICAL';

              return (
                <div
                  key={item.id}
                  className={`pt-3 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 p-3.5 rounded-2xl transition-all border ${
                    isCritical 
                      ? 'bg-rose-50/40 border-rose-200/80 hover:bg-rose-50/70' 
                      : 'bg-amber-50/30 border-amber-200/70 hover:bg-amber-50/60'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <img
                      src={item.employee.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                      alt={item.employee.firstName}
                      className="w-12 h-12 rounded-2xl object-cover ring-2 ring-white shadow-xs flex-shrink-0"
                    />

                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm truncate">
                          {item.employee.firstName} {item.employee.lastName}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-slate-500 px-2 py-0.5 rounded-md bg-white border border-slate-200">
                          {item.employee.employeeNumber}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          • {item.employee.department || 'Production'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-slate-800 text-xs">
                          {item.documentTitle}
                        </span>
                        {item.documentNumber && (
                          <span className="text-[10px] font-mono text-slate-500 bg-white/80 px-1.5 py-0.5 rounded border border-slate-200">
                            {item.documentNumber}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium">
                        <span className="text-slate-500">
                          Expiry Date: <strong className="font-mono text-slate-800 font-bold">{item.expiryDateStr}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Expiry Status Badge & Instant Alert Button */}
                  <div className="flex items-center gap-2.5 self-end sm:self-center flex-shrink-0">
                    <div className="text-right">
                      {item.daysRemaining <= 0 ? (
                        <span className="inline-block px-3 py-1.5 rounded-xl text-[10px] font-black bg-rose-600 text-white shadow-xs">
                          EXPIRED ({Math.abs(item.daysRemaining)}d ago)
                        </span>
                      ) : isCritical ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                          <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
                          CRITICAL ({item.daysRemaining}d)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                          <span className="w-2 h-2 rounded-full bg-amber-600" />
                          WARNING ({item.daysRemaining}d)
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedStaffForLogs(item.employee)}
                        className="px-2.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200/80 font-bold text-[10px] transition cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                        title={`View email communication logs for ${item.employee.firstName}`}
                      >
                        <svg className="w-3 h-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span>Email Logs</span>
                      </button>

                      <button
                        type="button"
                        disabled={sendingId === item.id}
                        onClick={async () => {
                          setSendingId(item.id);
                          try {
                            await sendInstantExpiryNotification({
                              employeeId: item.employee.id,
                              documentType: item.documentType === 'VISA' ? 'VISA' : 'LICENSE',
                              documentName: item.documentTitle,
                              documentNumber: item.documentNumber,
                              expiryDate: item.expiryDateStr,
                              daysRemaining: item.daysRemaining,
                              severity: item.severity,
                            });
                          } finally {
                            setTimeout(() => setSendingId(null), 500);
                          }
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] shadow-sm shadow-blue-500/20 transition cursor-pointer inline-flex items-center gap-1 disabled:opacity-50"
                        title="Send instant in-app notification & reminder email to staff"
                      >
                        {sendingId === item.id ? (
                          <>
                            <span className="w-2.5 h-2.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Sending...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                            <span>Send Alert</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-medium">
            Fair Work Australia &amp; Home Affairs VEVO immigration monitoring system.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>

      {/* Staff Email Logs Modal */}
      <StaffEmailLogsModal
        isOpen={!!selectedStaffForLogs}
        employee={selectedStaffForLogs}
        onClose={() => setSelectedStaffForLogs(null)}
      />

    </div>
  );
}
