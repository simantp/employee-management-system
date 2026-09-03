'use client';

import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  ShieldAlert, 
  FileCheck2, 
  ClipboardList,
  Calendar
} from 'lucide-react';
import KPICard from './KPICard';
import DepartmentDonutChart from './DepartmentDonutChart';
import VisaExpiryAlerts from './VisaExpiryAlerts';
import ComplianceStatusDonut from './ComplianceStatusDonut';
import EmployeeDirectoryTable from './EmployeeDirectoryTable';
import PendingLeaveApprovals from './PendingLeaveApprovals';
import PendingDocumentApprovals from './PendingDocumentApprovals';
import AuditLogViewer from './AuditLogViewer';
import RolesManagement from './RolesManagement';
import DocumentTypesManager from './DocumentTypesManager';
import AddEmployeeModal from './AddEmployeeModal';
import EmployeeDetailModal from './EmployeeDetailModal';
import PostAnnouncementModal from './PostAnnouncementModal';
import EmployeeManagementView from './EmployeeManagementView';
import AdminTimecardManagement from './AdminTimecardManagement';
import AdminComplianceManagement from './AdminComplianceManagement';
import AdminAlertsReminders from './AdminAlertsReminders';
import AdminSettingsHub from './AdminSettingsHub';
import { Megaphone } from 'lucide-react';
import { Employee } from '@/types';
import { useApp } from '@/lib/store';

export default function AdminDashboard({
  activeTab = 'dashboard'
}: {
  activeTab?: string;
}) {
  const { leaveRequests, employees } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const pendingApprovals = leaveRequests.filter(r => r.status === 'PENDING').length;

  const pageTitle = activeTab === 'timecards'
    ? 'Timecard Records & Shift Management'
    : activeTab === 'employees'
    ? 'Staff & Employee Directory'
    : activeTab === 'emergency'
    ? 'Emergency Contacts & Next of Kin'
    : activeTab === 'approvals'
    ? 'Leave & Compliance Approvals'
    : (activeTab === 'compliance' || activeTab === 'visa-alerts')
    ? 'Visa Tracking & VEVO Compliance'
    : activeTab === 'license-alerts'
    ? 'Driver Licenses & Operator Permits'
    : activeTab === 'whs-policies'
    ? 'Work Health & Safety (WHS) Standards'
    : activeTab === 'alerts'
    ? 'Compliance Alerts & Staff Reminders'
    : activeTab === 'settings'
    ? 'System & Operations Settings'
    : activeTab === 'roles' 
    ? 'Roles & Permissions' 
    : (activeTab === 'documents' || activeTab === 'doc-types')
    ? 'Document Types & Compliance Configuration'
    : activeTab === 'audit-log'
    ? 'Security Audit Log'
    : 'Admin Command Center';

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight">
            {pageTitle}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Sydney Plant &amp; Headquarters Management • Australian Compliance Hub
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAnnouncementModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 px-3.5 py-2 rounded-xl text-xs font-black shadow-md shadow-orange-500/20 transition cursor-pointer"
          >
            <Megaphone className="w-4 h-4" />
            <span>+ Broadcast Announcement</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-blue-600/25 transition hover:shadow-lg cursor-pointer"
          >
            <span>+ Add New Employee</span>
          </button>
        </div>
      </div>

      {activeTab === 'timecards' ? (
        <AdminTimecardManagement />
      ) : activeTab === 'employees' || activeTab === 'emergency' ? (
        <EmployeeManagementView />
      ) : activeTab === 'approvals' ? (
        <div className="space-y-6">
          <PendingLeaveApprovals />
          <PendingDocumentApprovals />
        </div>
      ) : activeTab === 'compliance' || activeTab === 'visa-alerts' ? (
        <AdminComplianceManagement defaultSubTab="visa" />
      ) : activeTab === 'license-alerts' ? (
        <AdminComplianceManagement defaultSubTab="license" />
      ) : activeTab === 'whs-policies' ? (
        <AdminComplianceManagement defaultSubTab="whs" />
      ) : activeTab === 'alerts' ? (
        <AdminAlertsReminders />
      ) : activeTab === 'settings' ? (
        <AdminSettingsHub />
      ) : activeTab === 'roles' ? (
        <RolesManagement />
      ) : (activeTab === 'documents' || activeTab === 'doc-types') ? (
        <DocumentTypesManager />
      ) : activeTab === 'audit-log' ? (
        <AuditLogViewer />
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <KPICard
              icon={Users}
              value="42"
              label="Total Employees"
              sublabel="View all employees"
              colorScheme="blue"
            />
            <KPICard
              icon={UserPlus}
              value="5"
              label="New Hires"
              sublabel="This month"
              colorScheme="green"
            />
            <KPICard
              icon={ShieldAlert}
              value="3"
              label="Visa Expiring Soon"
              sublabel="Within 30 days"
              colorScheme="amber"
            />
            <KPICard
              icon={FileCheck2}
              value={String(pendingApprovals || 2)}
              label="Pending Approvals"
              sublabel="Require attention"
              colorScheme="rose"
            />
            <KPICard
              icon={ClipboardList}
              value="7"
              label="Incomplete Records"
              sublabel="Complete now"
              colorScheme="purple"
            />
          </div>

          <PendingDocumentApprovals />

          <PendingLeaveApprovals />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <DepartmentDonutChart />
            <VisaExpiryAlerts />
            <ComplianceStatusDonut />
          </div>

          <EmployeeDirectoryTable 
            onSelectEmployee={(emp) => setSelectedEmployee(emp)} 
          />

          <DocumentTypesManager />

          <RolesManagement />

          <AuditLogViewer />
        </>
      )}

      {showAddModal && (
        <AddEmployeeModal onClose={() => setShowAddModal(false)} />
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
