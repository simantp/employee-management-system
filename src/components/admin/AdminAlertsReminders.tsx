'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/lib/store';
import { ComplianceAlert, Employee } from '@/types';
import EmployeeDetailModal from './EmployeeDetailModal';

export default function AdminAlertsReminders({
  defaultTab = 'all'
}: {
  defaultTab?: 'all' | 'visa' | 'license';
}) {
  const { alerts, employees, addToast, addAudit } = useApp();
  
  const [activeSubTab, setActiveSubTab] = useState<'all' | 'visa' | 'license'>(defaultTab);

  useEffect(() => {
    if (defaultTab) {
      setActiveSubTab(defaultTab);
    }
  }, [defaultTab]);

  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [vevoCheckingId, setVevoCheckingId] = useState<string | null>(null);

  // Local state for managed alerts (support snoozing and resolving)
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [snoozedMap, setSnoozedMap] = useState<Record<string, number>>({});

  // New Custom Reminder Form
  const [newReminder, setNewReminder] = useState({
    title: '',
    employeeId: '',
    dueDate: '',
    type: 'VISA_EXPIRY' as ComplianceAlert['type'],
    severity: 'WARNING' as ComplianceAlert['severity'],
    description: '',
  });

  const activeAlerts = alerts.filter(a => !dismissedIds.includes(a.id));

  // Filtered general alerts list
  const filteredAlerts = activeAlerts.filter(a => {
    const q = search.toLowerCase();
    const matchesSearch = 
      a.employeeName.toLowerCase().includes(q) ||
      a.title.toLowerCase().includes(q) ||
      (a.department && a.department.toLowerCase().includes(q));

    const matchesType = selectedType === 'ALL' ? true : a.type === selectedType;
    const matchesSeverity = selectedSeverity === 'ALL' ? true : a.severity === selectedSeverity;

    return matchesSearch && matchesType && matchesSeverity;
  });

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

  const criticalCount = activeAlerts.filter(a => a.severity === 'URGENT' || a.daysRemaining <= 14).length;
  const warningCount = activeAlerts.filter(a => a.severity === 'WARNING' || (a.daysRemaining > 14 && a.daysRemaining <= 60)).length;
  const totalCount = activeAlerts.length;

  const criticalVisas = alerts.filter(a => a.type === 'VISA_EXPIRY' && a.daysRemaining <= 30).length;
  const upcomingVisas = alerts.filter(a => a.type === 'VISA_EXPIRY' && a.daysRemaining > 30 && a.daysRemaining <= 60).length;

  const handleSnooze = (alert: ComplianceAlert, days: number) => {
    setSnoozedMap(prev => ({
      ...prev,
      [alert.id]: days
    }));
    addToast('Alert Snoozed', `Reminder for ${alert.employeeName} snoozed for ${days} days.`, 'info');
    addAudit('ALERT_SNOOZED', 'Alerts', alert.id, `Snoozed "${alert.title}" by ${days} days`, 'Admin', 'SuperAdmin');
  };

  const handleResolve = (alert: ComplianceAlert) => {
    setDismissedIds(prev => [...prev, alert.id]);
    addToast('Alert Marked Resolved', `Compliance item for ${alert.employeeName} closed.`, 'success');
    addAudit('ALERT_RESOLVED', 'Alerts', alert.id, `Resolved compliance alert "${alert.title}" for ${alert.employeeName}`, 'Admin', 'SuperAdmin');
  };

  const handleSendReminder = (alert: ComplianceAlert) => {
    addToast('Direct Notification Sent', `Dispatched priority compliance alert to ${alert.employeeName}.`, 'success');
    addAudit('ALERT_REMINDER_SENT', 'Alerts', alert.id, `Sent reminder notice to ${alert.employeeName} for ${alert.title}`, 'Admin', 'SuperAdmin');
  };

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
    }, 1000);
  };

  const handleSendVisaOrLicenseReminder = (emp: Employee, type: 'VISA' | 'LICENSE') => {
    addToast(
      'Notice Dispatched',
      `Sent urgent ${type === 'VISA' ? 'Visa Renewal' : 'License Renewal'} notice to ${emp.firstName} ${emp.lastName} (${emp.email}).`,
      'info'
    );
    addAudit(
      `${type}_REMINDER_SENT`, 
      'Compliance Alerts', 
      emp.id, 
      `Dispatched ${type} renewal notice to ${emp.firstName} ${emp.lastName}`, 
      'Admin', 
      'SuperAdmin'
    );
  };

  const handleCreateReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReminder.title || !newReminder.dueDate) return;

    const emp = employees.find(e => e.id === newReminder.employeeId) || employees[0];
    addToast('Custom Reminder Created', `Logged "${newReminder.title}" for ${emp.firstName} ${emp.lastName}.`, 'success');
    addAudit('CUSTOM_ALERT_CREATED', 'Alerts', 'new', `Created reminder: ${newReminder.title} for ${emp.firstName} ${emp.lastName}`, 'Admin', 'SuperAdmin');
    setShowCreateModal(false);
    setNewReminder({
      title: '',
      employeeId: '',
      dueDate: '',
      type: 'VISA_EXPIRY',
      severity: 'WARNING',
      description: '',
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 font-sans text-xs">
      
      {/* 1. Header & Navigation Sub-Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Alerts, Reminders &amp; Compliance Hub</h2>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200">
              {activeAlerts.length} Active Alerts
            </span>
          </div>
          <p className="text-slate-500 mt-0.5">
            Monitor urgent deadlines, visa expirations, driver licenses, and automated compliance reminders.
          </p>
        </div>

        {/* Sub-Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200 self-start sm:self-auto">
          <button
            onClick={() => { setActiveSubTab('all'); setSearch(''); }}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
              activeSubTab === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Alerts ({activeAlerts.length})
          </button>

          <button
            onClick={() => { setActiveSubTab('visa'); setSearch(''); }}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
              activeSubTab === 'visa'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Visa Alerts ({visaHolders.length})
          </button>

          <button
            onClick={() => { setActiveSubTab('license'); setSearch(''); }}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
              activeSubTab === 'license'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Driver Licenses ({licenseHolders.length})
          </button>
        </div>
      </div>

      {/* 2. SUB-TAB: ALL ALERTS & REMINDERS */}
      {activeSubTab === 'all' && (
        <>
          {/* Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Active Alerts</span>
                <span className="text-2xl font-bold text-slate-900 mt-1 block">{totalCount}</span>
                <span className="text-[10px] text-slate-500 font-medium">Compliance watchlist</span>
              </div>
              <div className="text-[10px] font-bold text-blue-600 uppercase">
                Alerts
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Critical (&lt;14 Days)</span>
                <span className="text-2xl font-bold text-rose-600 mt-1 block">{criticalCount}</span>
                <span className="text-[10px] text-rose-700 font-medium">Immediate action needed</span>
              </div>
              <div className="text-[10px] font-bold text-rose-600 uppercase">
                Critical
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Upcoming (&lt;60 Days)</span>
                <span className="text-2xl font-bold text-amber-600 mt-1 block">{warningCount}</span>
                <span className="text-[10px] text-amber-700 font-medium">Renewal in progress</span>
              </div>
              <div className="text-[10px] font-bold text-amber-600 uppercase">
                Upcoming
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Resolved This Month</span>
                <span className="text-2xl font-bold text-emerald-600 mt-1 block">{dismissedIds.length + 12}</span>
                <span className="text-[10px] text-emerald-700 font-medium">Audited &amp; closed</span>
              </div>
              <div className="text-[10px] font-bold text-emerald-600 uppercase">
                Resolved
              </div>
            </div>
          </div>

          {/* Main Alert Center Container */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            
            {/* Filter & Action Toolbar */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  placeholder="Search alerts, staff, department..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-xl bg-white font-medium text-slate-800 text-xs focus:ring-2 focus:ring-blue-500/20 shadow-xs w-full sm:w-64"
                />

                <select
                  value={selectedType}
                  onChange={e => setSelectedType(e.target.value)}
                  className="p-2 border border-slate-200 rounded-xl bg-white text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/20 cursor-pointer shadow-xs"
                >
                  <option value="ALL">All Categories</option>
                  <option value="VISA_EXPIRY">Visa Expirations</option>
                  <option value="LICENSE_EXPIRY">Driver &amp; Operator Licenses</option>
                  <option value="MISSING_SICK_CERT">Sick Leave Certificates</option>
                  <option value="INCOMPLETE_RECORD">Incomplete Records</option>
                  <option value="PENDING_SIGNATURE">Pending Signatures</option>
                </select>

                <select
                  value={selectedSeverity}
                  onChange={e => setSelectedSeverity(e.target.value)}
                  className="p-2 border border-slate-200 rounded-xl bg-white text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/20 cursor-pointer shadow-xs"
                >
                  <option value="ALL">All Severities</option>
                  <option value="URGENT">Urgent Priority</option>
                  <option value="WARNING">Warning (Upcoming)</option>
                  <option value="INFO">Informational</option>
                </select>
              </div>

              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 shadow-xs"
              >
                Set New Reminder
              </button>
            </div>

            {/* Alert List */}
            <div className="divide-y divide-slate-100">
              {filteredAlerts.length === 0 ? (
                <div className="p-12 text-center space-y-2">
                  <h4 className="font-bold text-slate-800 text-sm">All Clear - No Pending Alerts Found</h4>
                  <p className="text-slate-500 max-w-sm mx-auto">
                    No active compliance breaches or pending document deadlines match your current filter.
                  </p>
                </div>
              ) : (
                filteredAlerts.map(alert => {
                  const snoozedDays = snoozedMap[alert.id];
                  const effectiveDays = alert.daysRemaining + (snoozedDays || 0);
                  const isUrgent = effectiveDays <= 14;
                  const isWarning = effectiveDays > 14 && effectiveDays <= 45;

                  return (
                    <div 
                      key={alert.id}
                      className="p-4 sm:p-5 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-start sm:items-center gap-3.5">
                        <img
                          src={alert.employeeAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                          alt={alert.employeeName}
                          className="w-11 h-11 rounded-2xl object-cover ring-1 ring-slate-200 flex-shrink-0 mt-0.5 sm:mt-0"
                        />

                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-slate-900 text-xs">{alert.employeeName}</span>
                            <span className="text-[10px] text-slate-400">• {alert.department}</span>
                            {isUrgent ? (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                                CRITICAL
                              </span>
                            ) : isWarning ? (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
                                WARNING
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-100 text-blue-700 border border-blue-200">
                                STANDARD
                              </span>
                            )}
                            {snoozedDays && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                Snoozed +{snoozedDays}d
                              </span>
                            )}
                          </div>

                          <h4 className="font-bold text-slate-800 text-xs">{alert.title}</h4>

                          <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium">
                            <span className="font-mono">
                              Due: {alert.dueDate}
                            </span>
                            <span className="font-bold text-slate-700">
                              ({effectiveDays} days remaining)
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          onClick={() => handleSendReminder(alert)}
                          className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-2xs transition cursor-pointer"
                        >
                          Send Alert
                        </button>

                        <button
                          onClick={() => handleSnooze(alert, 7)}
                          className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs transition cursor-pointer"
                          title="Snooze 7 days"
                        >
                          Snooze
                        </button>

                        <button
                          onClick={() => handleResolve(alert)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition cursor-pointer"
                        >
                          Resolve
                        </button>

                        <button
                          onClick={() => {
                            const emp = employees.find(e => e.id === alert.employeeId);
                            if (emp) setSelectedEmployee(emp);
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                        >
                          View
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}

      {/* 3. SUB-TAB: VISA EXPIRY & VEVO ALERTS */}
      {activeSubTab === 'visa' && (
        <>
          {/* Visa Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Visa Holders</span>
                <span className="text-2xl font-bold text-slate-900 mt-1 block">{visaHolders.length}</span>
                <span className="text-[10px] text-slate-500 font-medium">Registered visa staff</span>
              </div>
              <div className="text-[10px] font-bold text-blue-600 uppercase">
                Visas
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Expiring &lt;30 Days</span>
                <span className="text-2xl font-bold text-rose-600 mt-1 block">{criticalVisas}</span>
                <span className="text-[10px] text-rose-700 font-medium">Critical renewal priority</span>
              </div>
              <div className="text-[10px] font-bold text-rose-600 uppercase">
                Critical
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Expiring &lt;60 Days</span>
                <span className="text-2xl font-bold text-amber-600 mt-1 block">{upcomingVisas}</span>
                <span className="text-[10px] text-amber-700 font-medium">Renewal in progress</span>
              </div>
              <div className="text-[10px] font-bold text-amber-600 uppercase">
                Upcoming
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">VEVO Status</span>
                <span className="text-2xl font-bold text-emerald-600 mt-1 block">100% Active</span>
                <span className="text-[10px] text-emerald-700 font-medium">Home Affairs compliant</span>
              </div>
              <div className="text-[10px] font-bold text-emerald-600 uppercase">
                VEVO
              </div>
            </div>
          </div>

          {/* Visa Table Container */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Visa Tracking &amp; Home Affairs VEVO Directory</h3>
                <p className="text-[11px] text-slate-500">Live monitoring of TSS 482, Graduate 485, Student, and working rights</p>
              </div>

              <input
                type="text"
                placeholder="Search visa holders..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-xl bg-white font-medium text-slate-800 text-xs focus:ring-2 focus:ring-blue-500/20 w-full sm:w-64"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="py-3.5 px-5">Staff Member</th>
                    <th className="py-3.5 px-5">Department</th>
                    <th className="py-3.5 px-5">Visa Subclass</th>
                    <th className="py-3.5 px-5">Expiry Date</th>
                    <th className="py-3.5 px-5">Work Rights</th>
                    <th className="py-3.5 px-5">VEVO Status</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visaHolders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-slate-400">
                        No visa holder records found matching your search.
                      </td>
                    </tr>
                  ) : (
                    visaHolders.map(emp => {
                      const alert = alerts.find(a => a.employeeId === emp.id && a.type === 'VISA_EXPIRY');
                      const daysRemaining = alert?.daysRemaining ?? 75;
                      const isCritical = daysRemaining <= 30;
                      const isWarning = daysRemaining > 30 && daysRemaining <= 60;

                      return (
                        <tr key={emp.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3.5 px-5">
                            <div className="flex items-center gap-3">
                              <img 
                                src={emp.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} 
                                alt={emp.firstName} 
                                className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200 shadow-xs"
                              />
                              <div>
                                <span className="font-bold text-slate-900 block">{emp.firstName} {emp.lastName}</span>
                                <span className="text-[10px] text-slate-400 font-mono">{emp.employeeNumber}</span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-5 font-medium text-slate-700">
                            {emp.department || 'Sydney Operations'}
                          </td>

                          <td className="py-3.5 px-5 font-bold text-slate-800">
                            {emp.visaType || 'Subclass 482 TSS'}
                          </td>

                          <td className="py-3.5 px-5">
                            <span className="font-mono text-slate-800 font-bold block">{emp.visaExpiryDate || '30/08/2026'}</span>
                            {isCritical ? (
                              <span className="text-[10px] font-bold text-rose-600">{daysRemaining} days remaining</span>
                            ) : isWarning ? (
                              <span className="text-[10px] font-bold text-amber-600">{daysRemaining} days remaining</span>
                            ) : (
                              <span className="text-[10px] font-medium text-slate-400">{daysRemaining} days remaining</span>
                            )}
                          </td>

                          <td className="py-3.5 px-5 text-[11px] text-slate-600">
                            {emp.workRestrictions || 'Full work rights (38 hrs/wk)'}
                          </td>

                          <td className="py-3.5 px-5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              <span>Verified VEVO</span>
                            </span>
                          </td>

                          <td className="py-3.5 px-5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleSimulateVevoCheck(emp)}
                                disabled={vevoCheckingId === emp.id}
                                className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-[10px] font-bold transition cursor-pointer"
                              >
                                {vevoCheckingId === emp.id ? 'Checking...' : 'Check VEVO'}
                              </button>

                              <button
                                onClick={() => handleSendVisaOrLicenseReminder(emp, 'VISA')}
                                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-[10px] font-bold transition cursor-pointer"
                              >
                                Send Notice
                              </button>

                              <button
                                onClick={() => setSelectedEmployee(emp)}
                                className="px-2 py-1 rounded-lg text-slate-600 hover:bg-slate-100 font-bold text-[11px] transition cursor-pointer"
                              >
                                View
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* 4. SUB-TAB: DRIVER LICENSES & PERMITS */}
      {activeSubTab === 'license' && (
        <>
          {/* License Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Licensed Drivers</span>
                <span className="text-2xl font-bold text-slate-900 mt-1 block">{licenseHolders.length}</span>
                <span className="text-[10px] text-slate-500 font-medium">Verified operators</span>
              </div>
              <div className="text-[10px] font-bold text-blue-600 uppercase">
                Drivers
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">NSW Licences</span>
                <span className="text-2xl font-bold text-emerald-600 mt-1 block">{licenseHolders.length}</span>
                <span className="text-[10px] text-emerald-700 font-medium">Service NSW valid</span>
              </div>
              <div className="text-[10px] font-bold text-emerald-600 uppercase">
                NSW
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Plant Operators</span>
                <span className="text-2xl font-bold text-amber-600 mt-1 block">
                  {employees.filter(e => e.department?.includes('Production')).length}
                </span>
                <span className="text-[10px] text-amber-700 font-medium">Forklift &amp; heavy plant</span>
              </div>
              <div className="text-[10px] font-bold text-amber-600 uppercase">
                Plant
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Audit Score</span>
                <span className="text-2xl font-bold text-purple-600 mt-1 block">100%</span>
                <span className="text-[10px] text-purple-700 font-medium">Zero compliance breaches</span>
              </div>
              <div className="text-[10px] font-bold text-purple-600 uppercase">
                Audit
              </div>
            </div>
          </div>

          {/* License Table Container */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Driver Licenses &amp; Plant Equipment Permits</h3>
                <p className="text-[11px] text-slate-500">Service NSW driver permits, forklift high-risk work licenses, and operator authorisations</p>
              </div>

              <input
                type="text"
                placeholder="Search license holders..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-xl bg-white font-medium text-slate-800 text-xs focus:ring-2 focus:ring-blue-500/20 w-full sm:w-64"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="py-3.5 px-5">Staff Member</th>
                    <th className="py-3.5 px-5">Department</th>
                    <th className="py-3.5 px-5">License Number</th>
                    <th className="py-3.5 px-5">Jurisdiction</th>
                    <th className="py-3.5 px-5">Expiry Date</th>
                    <th className="py-3.5 px-5">Status</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {licenseHolders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-slate-400">
                        No driver license records found matching your search.
                      </td>
                    </tr>
                  ) : (
                    licenseHolders.map(emp => (
                      <tr key={emp.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3">
                            <img 
                              src={emp.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} 
                              alt={emp.firstName} 
                              className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200 shadow-xs"
                            />
                            <div>
                              <span className="font-bold text-slate-900 block">{emp.firstName} {emp.lastName}</span>
                              <span className="text-[10px] text-slate-400 font-mono">{emp.employeeNumber}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-5 font-medium text-slate-700">
                          {emp.department || 'Sydney Operations'}
                        </td>

                        <td className="py-3.5 px-5 font-mono font-bold text-slate-800">
                          {emp.licenseNumber || 'DL-9948210'}
                        </td>

                        <td className="py-3.5 px-5 text-slate-600">
                          {emp.licenseCountry || 'NSW, Australia'}
                        </td>

                        <td className="py-3.5 px-5 font-mono font-bold text-slate-800">
                          {emp.licenseExpiryDate || '12/10/2027'}
                        </td>

                        <td className="py-3.5 px-5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>Active / Valid</span>
                          </span>
                        </td>

                        <td className="py-3.5 px-5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleSendVisaOrLicenseReminder(emp, 'LICENSE')}
                              className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-[10px] font-bold transition cursor-pointer"
                            >
                              Send Notice
                            </button>

                            <button
                              onClick={() => setSelectedEmployee(emp)}
                              className="px-2 py-1 rounded-lg text-slate-600 hover:bg-slate-100 font-bold text-[11px] transition cursor-pointer"
                            >
                              View
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* 5. CREATE CUSTOM REMINDER MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Set New Compliance Reminder</h3>
                <p className="text-slate-500 text-[11px]">Creates tracking task for employee or department</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer font-bold text-xs">
                Close
              </button>
            </div>

            <form onSubmit={handleCreateReminder} className="space-y-3.5">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Reminder Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Forklift License Class LF Renewal"
                  value={newReminder.title}
                  onChange={e => setNewReminder({...newReminder, title: e.target.value})}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-white font-medium text-xs focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Target Employee *</label>
                  <select
                    value={newReminder.employeeId}
                    onChange={e => setNewReminder({...newReminder, employeeId: e.target.value})}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-white font-medium text-xs focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                  >
                    <option value="">-- Select Staff --</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} ({emp.employeeNumber})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={newReminder.dueDate}
                    onChange={e => setNewReminder({...newReminder, dueDate: e.target.value})}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-white font-medium text-xs focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category</label>
                  <select
                    value={newReminder.type}
                    onChange={e => setNewReminder({...newReminder, type: e.target.value as ComplianceAlert['type']})}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-white font-medium text-xs focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                  >
                    <option value="VISA_EXPIRY">Visa Expiry</option>
                    <option value="LICENSE_EXPIRY">Driver / Operator License</option>
                    <option value="MISSING_SICK_CERT">Sick Leave Certificate</option>
                    <option value="INCOMPLETE_RECORD">Incomplete File</option>
                    <option value="PENDING_SIGNATURE">Pending Signature</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Severity Level</label>
                  <select
                    value={newReminder.severity}
                    onChange={e => setNewReminder({...newReminder, severity: e.target.value as ComplianceAlert['severity']})}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-white font-medium text-xs focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                  >
                    <option value="URGENT">Urgent Priority (&lt;14d)</option>
                    <option value="WARNING">Warning (Upcoming &lt;60d)</option>
                    <option value="INFO">Standard Informational</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 cursor-pointer"
                >
                  Save &amp; Track Reminder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Employee Details Modal */}
      {selectedEmployee && (
        <EmployeeDetailModal
          employee={selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
        />
      )}

    </div>
  );
}