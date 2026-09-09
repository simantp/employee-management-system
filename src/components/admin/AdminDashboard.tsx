'use client';

import React, { useState } from 'react';
import KPICard from './KPICard';
import PendingLeaveApprovals from './PendingLeaveApprovals';
import PendingDocumentApprovals from './PendingDocumentApprovals';
import AuditLogViewer from './AuditLogViewer';
import EmployeeDetailModal from './EmployeeDetailModal';
import PostAnnouncementModal from './PostAnnouncementModal';
import EmployeeManagementView from './EmployeeManagementView';
import AdminTimecardManagement from './AdminTimecardManagement';
import AdminAlertsReminders from './AdminAlertsReminders';
import AdminSettingsHub from './AdminSettingsHub';
import ActiveStaffModal from './ActiveStaffModal';
import VisaLicenseAlertsModal from './VisaLicenseAlertsModal';
import { Employee } from '@/types';
import { useApp } from '@/lib/store';

export default function AdminDashboard({
  activeTab = 'dashboard'
}: {
  activeTab?: string;
}) {
  const { employees, alerts, expirySettings } = useApp();
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [showActiveStaffModal, setShowActiveStaffModal] = useState(false);
  const [showVisaLicenseAlertsModal, setShowVisaLicenseAlertsModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedEmployeeSection, setSelectedEmployeeSection] = useState<'EMPLOYMENT' | 'PERSONAL' | 'VISA_LICENCE_EMERGENCY' | 'BANKING' | 'DOCUMENTS'>('EMPLOYMENT');

  const activeStaffOnDuty = employees.filter(e => e.clockState === 'CLOCKED_IN').length;

  // Calculate Visa and License Warning & Critical alerts count
  const parseDays = (dateStr?: string) => {
    if (!dateStr) return null;
    let expDate: Date | null = null;
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) expDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
    } else {
      expDate = new Date(dateStr);
    }
    if (!expDate || isNaN(expDate.getTime())) return null;
    return Math.ceil((expDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  };

  let visaAndLicenseAlertCount = 0;
  employees.forEach(emp => {
    if (emp.visaExpiryDate && emp.citizenStatus !== 'CITIZEN' && emp.citizenStatus !== 'PERMANENT_RESIDENT') {
      let days = parseDays(emp.visaExpiryDate);
      if (days === null) {
        const matching = alerts.find(a => a.employeeId === emp.id && a.type === 'VISA_EXPIRY');
        if (matching) days = matching.daysRemaining;
      }
      if (days !== null && days <= expirySettings.visaWarningDays) {
        visaAndLicenseAlertCount++;
      }
    }
    if (emp.hasDriverLicense && emp.licenseExpiryDate) {
      let days = parseDays(emp.licenseExpiryDate);
      if (days === null) {
        const matching = alerts.find(a => a.employeeId === emp.id && a.type === 'LICENSE_EXPIRY');
        if (matching) days = matching.daysRemaining;
      }
      if (days !== null && days <= expirySettings.licenseWarningDays) {
        visaAndLicenseAlertCount++;
      }
    }
  });

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      {/* Top Header Bar (Only on Admin Dashboard) */}
      {(activeTab === 'dashboard' || !activeTab) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight">
              Admin Command Center
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAnnouncementModal(true)}
              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-black shadow-md shadow-orange-500/20 transition cursor-pointer"
            >
              + Broadcast Announcement
            </button>
          </div>
        </div>
      )}

      {/* Sub-View Routing or Main Clean Dashboard */}
      {activeTab === 'timecards' ? (
        <AdminTimecardManagement />
      ) : activeTab === 'employees' ? (
        <EmployeeManagementView />
      ) : activeTab === 'approvals' ? (
        <PendingLeaveApprovals mode="full" />
      ) : (activeTab === 'alerts' || activeTab === 'compliance' || activeTab === 'visa-alerts' || activeTab === 'license-alerts' || activeTab === 'whs-policies') ? (
        <AdminAlertsReminders defaultTab={activeTab === 'visa-alerts' ? 'visa' : activeTab === 'license-alerts' ? 'license' : 'all'} />
      ) : activeTab === 'settings' ? (
        <AdminSettingsHub />
      ) : activeTab === 'roles' ? (
        <AdminSettingsHub defaultTab="ROLES" />
      ) : (activeTab === 'documents' || activeTab === 'doc-types') ? (
        <AdminSettingsHub defaultTab="DOCUMENTS" />
      ) : activeTab === 'audit-log' ? (
        <AuditLogViewer />
      ) : (
        <>
          {/* 1. Core High-Impact KPI Metrics (2 Cards: Live on Shift & Visa/License Alerts) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
            <KPICard
              value={String(activeStaffOnDuty)}
              label="Live on Shift"
              sublabel="Active floor staff • Click to view list"
              colorScheme="green"
              onClick={() => setShowActiveStaffModal(true)}
            />
            <KPICard
              value={String(visaAndLicenseAlertCount)}
              label="Visa and License Expiry Alerts"
              sublabel="Urgent & approaching renewals • Click to view"
              colorScheme="amber"
              onClick={() => setShowVisaLicenseAlertsModal(true)}
            />
          </div>

          {/* 2. Priority Action Items: Pending Approvals */}
          <div className="space-y-6">
            <PendingLeaveApprovals mode="compact" />
            <PendingDocumentApprovals />
          </div>
        </>
      )}

      {/* Broadcast Announcement Modal */}
      {showAnnouncementModal && (
        <PostAnnouncementModal onClose={() => setShowAnnouncementModal(false)} />
      )}

      {/* Live Active On-Shift Staff Modal */}
      <ActiveStaffModal
        isOpen={showActiveStaffModal}
        onClose={() => setShowActiveStaffModal(false)}
        onSelectEmployee={(emp) => {
          setSelectedEmployeeSection('EMPLOYMENT');
          setSelectedEmployee(emp);
        }}
      />

      {/* Visa and License Expiry Alerts Modal */}
      <VisaLicenseAlertsModal
        isOpen={showVisaLicenseAlertsModal}
        onClose={() => setShowVisaLicenseAlertsModal(false)}
        onSelectEmployee={(emp, section = 'DOCUMENTS') => {
          setSelectedEmployeeSection(section);
          setSelectedEmployee(emp);
        }}
      />

      {/* Employee Detail & Edit Modal */}
      {selectedEmployee && (
        <EmployeeDetailModal 
          employee={selectedEmployee} 
          initialSection={selectedEmployeeSection}
          onClose={() => setSelectedEmployee(null)} 
        />
      )}
    </div>
  );
}
