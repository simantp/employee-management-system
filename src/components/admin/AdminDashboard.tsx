'use client';

import React, { useState } from 'react';
import KPICard from './KPICard';
import DepartmentDonutChart from './DepartmentDonutChart';
import VisaExpiryAlerts from './VisaExpiryAlerts';
import ComplianceStatusDonut from './ComplianceStatusDonut';
import EmployeeDirectoryTable from './EmployeeDirectoryTable';
import PendingLeaveApprovals from './PendingLeaveApprovals';
import PendingDocumentApprovals from './PendingDocumentApprovals';
import AuditLogViewer from './AuditLogViewer';
import EmployeeDetailModal from './EmployeeDetailModal';
import PostAnnouncementModal from './PostAnnouncementModal';
import EmployeeManagementView from './EmployeeManagementView';
import AdminTimecardManagement from './AdminTimecardManagement';
import AdminComplianceManagement from './AdminComplianceManagement';
import AdminAlertsReminders from './AdminAlertsReminders';
import AdminSettingsHub from './AdminSettingsHub';
import { Employee } from '@/types';
import { useApp } from '@/lib/store';

export default function AdminDashboard({
  activeTab = 'dashboard'
}: {
  activeTab?: string;
}) {
  const { leaveRequests, employees } = useApp();
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const pendingApprovals = leaveRequests.filter(r => r.status === 'PENDING').length;
  const activeStaffOnDuty = employees.filter(e => e.clockState === 'CLOCKED_IN').length;

  // Calculate pending documents
  let pendingDocsCount = 0;
  employees.forEach(emp => {
    emp.documents?.forEach(d => {
      if (d.status === 'Pending') pendingDocsCount++;
    });
  });

  const totalUrgentActions = pendingApprovals + pendingDocsCount;

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      {/* Top Header Bar (Only on Admin Dashboard) */}
      {(activeTab === 'dashboard' || !activeTab) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight">
              Admin Command Center
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Sydney Plant &amp; Headquarters Management • Australian Compliance Hub
            </p>
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
        <div className="space-y-6">
          <PendingLeaveApprovals mode="full" />
          <PendingDocumentApprovals />
        </div>
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
          {/* 1. Core High-Impact KPI Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <KPICard
              value={String(activeStaffOnDuty)}
              label="Live on Shift"
              sublabel="Active floor staff"
              colorScheme="green"
            />
            <KPICard
              value={String(employees.length || 42)}
              label="Total Employees"
              sublabel="Active workforce"
              colorScheme="blue"
            />
            <KPICard
              value={String(totalUrgentActions)}
              label="Pending Actions"
              sublabel="Leave & docs review"
              colorScheme="rose"
            />
            <KPICard
              value="3"
              label="Visa Expiry Alerts"
              sublabel="Within 30–60 days"
              colorScheme="amber"
            />
            <KPICard
              value="98.5%"
              label="Fair Work Compliance"
              sublabel="Audit score"
              colorScheme="purple"
            />
          </div>

          {/* 2. Priority Action Items: Pending Approvals */}
          <div className="space-y-6">
            <PendingLeaveApprovals mode="compact" />
            <PendingDocumentApprovals />
          </div>

          {/* 3. Visual Telemetry & Analytics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <DepartmentDonutChart />
            <VisaExpiryAlerts />
            <ComplianceStatusDonut />
          </div>

          {/* 4. Staff Directory Table Overview */}
          <EmployeeDirectoryTable 
            onSelectEmployee={(emp) => setSelectedEmployee(emp)} 
          />
        </>
      )}

      {showAnnouncementModal && (
        <PostAnnouncementModal onClose={() => setShowAnnouncementModal(false)} />
      )}

      {selectedEmployee && (
        <EmployeeDetailModal 
          employee={selectedEmployee} 
          onClose={() => setSelectedEmployee(null)} 
        />
      )}
    </div>
  );
}
