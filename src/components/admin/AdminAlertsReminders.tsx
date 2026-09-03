'use client';

import React, { useState } from 'react';
import { 
  Bell, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  Send, 
  Filter, 
  Search, 
  Calendar, 
  Plus, 
  User, 
  ShieldAlert, 
  FileText, 
  X,
  AlertCircle,
  Eye,
  Check
} from 'lucide-react';
import { useApp } from '@/lib/store';
import { ComplianceAlert, Employee } from '@/types';
import EmployeeDetailModal from './EmployeeDetailModal';

export default function AdminAlertsReminders() {
  const { alerts, employees, addToast, addAudit } = useApp();
  
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

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

  // Filtered list
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

  const criticalCount = activeAlerts.filter(a => a.severity === 'URGENT' || a.daysRemaining <= 14).length;
  const warningCount = activeAlerts.filter(a => a.severity === 'WARNING' || (a.daysRemaining > 14 && a.daysRemaining <= 60)).length;
  const totalCount = activeAlerts.length;

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
      
      {/* Top Metric Header */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Active Alerts</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">{totalCount}</span>
            <span className="text-[10px] text-slate-500 font-medium">Compliance watchlist</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Bell className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Critical (&lt;14 Days)</span>
            <span className="text-2xl font-black text-rose-600 mt-1 block">{criticalCount}</span>
            <span className="text-[10px] text-rose-700 font-medium">Immediate action needed</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Upcoming (&lt;60 Days)</span>
            <span className="text-2xl font-black text-amber-600 mt-1 block">{warningCount}</span>
            <span className="text-[10px] text-amber-700 font-medium">Renewal in progress</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Resolved This Month</span>
            <span className="text-2xl font-black text-emerald-600 mt-1 block">{dismissedIds.length + 12}</span>
            <span className="text-[10px] text-emerald-700 font-medium">Audited &amp; closed</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Alert Center Container */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        
        {/* Filter & Action Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
          
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search alerts, staff, department..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl bg-white font-medium text-slate-800 text-xs focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>

            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
              className="p-2 border border-slate-200 rounded-xl bg-white text-xs font-bold text-slate-700 focus:ring-2 focus:ring-orange-500/20 cursor-pointer"
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
              className="p-2 border border-slate-200 rounded-xl bg-white text-xs font-bold text-slate-700 focus:ring-2 focus:ring-orange-500/20 cursor-pointer"
            >
              <option value="ALL">All Severities</option>
              <option value="URGENT">🔴 Urgent Priority</option>
              <option value="WARNING">🟠 Warning (Upcoming)</option>
              <option value="INFO">🔵 Informational</option>
            </select>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-black shadow-md shadow-orange-500/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Set New Reminder</span>
          </button>
        </div>

        {/* Alert List */}
        <div className="divide-y divide-slate-100">
          {filteredAlerts.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <h4 className="font-bold text-slate-800 text-sm">All Clear! No Pending Alerts Found</h4>
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
                      className="w-11 h-11 rounded-2xl object-cover ring-2 ring-slate-100 flex-shrink-0 mt-0.5 sm:mt-0"
                    />

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-extrabold text-slate-900 text-xs">{alert.employeeName}</span>
                        <span className="text-[10px] text-slate-400">• {alert.department}</span>
                        {isUrgent ? (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-rose-100 text-rose-700 border border-rose-200">
                            CRITICAL
                          </span>
                        ) : isWarning ? (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-100 text-amber-700 border border-amber-200">
                            WARNING
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-blue-100 text-blue-700 border border-blue-200">
                            STANDARD
                          </span>
                        )}
                        {snoozedDays && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            💤 Snoozed +{snoozedDays}d
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-slate-800 text-xs">{alert.title}</h4>

                      <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium">
                        <span className="flex items-center gap-1 font-mono">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>Due: {alert.dueDate}</span>
                        </span>
                        <span className="font-bold text-orange-600">
                          ({effectiveDays} days remaining)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => handleSendReminder(alert)}
                      className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5 text-orange-500" />
                      <span>Send Alert</span>
                    </button>

                    <button
                      onClick={() => handleSnooze(alert, 7)}
                      className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold text-xs flex items-center gap-1 transition cursor-pointer"
                      title="Snooze 7 days"
                    >
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Snooze</span>
                    </button>

                    <button
                      onClick={() => handleResolve(alert)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Resolve</span>
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

      {/* CREATE CUSTOM REMINDER MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">Set New Compliance Reminder</h3>
                  <p className="text-slate-500 text-[11px]">Creates tracking task for employee or department</p>
                </div>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
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
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-white font-medium text-xs focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Target Employee *</label>
                  <select
                    value={newReminder.employeeId}
                    onChange={e => setNewReminder({...newReminder, employeeId: e.target.value})}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-white font-medium text-xs focus:ring-2 focus:ring-orange-500/20"
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
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-white font-medium text-xs focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category</label>
                  <select
                    value={newReminder.type}
                    onChange={e => setNewReminder({...newReminder, type: e.target.value as ComplianceAlert['type']})}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-white font-medium text-xs focus:ring-2 focus:ring-orange-500/20"
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
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-white font-medium text-xs focus:ring-2 focus:ring-orange-500/20"
                  >
                    <option value="URGENT">🔴 Urgent Priority (&lt;14d)</option>
                    <option value="WARNING">🟠 Warning (Upcoming &lt;60d)</option>
                    <option value="INFO">🔵 Standard Informational</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-black text-xs shadow-md shadow-orange-500/20"
                >
                  Save &amp; Track Reminder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Employee Details Modal */}
      {selectedEmployee && (
        <EmployeeDetailModal
          employee={selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
        />
      )}

    </div>
  );
}