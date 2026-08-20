'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store';
import AdminSidebar from '@/components/layout/AdminSidebar';
import StaffSidebar from '@/components/layout/StaffSidebar';
import Topbar from '@/components/layout/Topbar';
import AdminDashboard from '@/components/admin/AdminDashboard';
import StaffDashboard from '@/components/staff/StaffDashboard';
import AddEmployeeModal from '@/components/admin/AddEmployeeModal';
import ApplyLeaveModal from '@/components/staff/ApplyLeaveModal';
import AuthPortal from '@/components/auth/AuthPortal';

export default function AppHome() {
  const { currentUser } = useApp();
  const [adminTab, setAdminTab] = useState('dashboard');
  const [staffTab, setStaffTab] = useState('dashboard');

  const [showGlobalAddModal, setShowGlobalAddModal] = useState(false);
  const [showGlobalLeaveModal, setShowGlobalLeaveModal] = useState(false);

  // 1. If not logged in -> Show ONLY the Full-Screen Login & Registration Portal!
  if (!currentUser) {
    return <AuthPortal />;
  }

  const isAdmin = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN' || currentUser.role === 'HR_MANAGER';

  // 2. If logged in as Admin / Super Admin -> Show ONLY Admin Portal
  if (isAdmin) {
    return (
      <div className="flex h-screen overflow-hidden bg-[#f0f4f9]">
        <AdminSidebar activeTab={adminTab} onSelectTab={setAdminTab} />
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
          <Topbar 
            onOpenAddModal={() => setShowGlobalAddModal(true)} 
            onOpenLeaveModal={() => setShowGlobalLeaveModal(true)}
          />
          <main className="flex-1 overflow-y-auto min-h-0">
            <AdminDashboard activeTab={adminTab} />
          </main>
        </div>

        {showGlobalAddModal && (
          <AddEmployeeModal onClose={() => setShowGlobalAddModal(false)} />
        )}
      </div>
    );
  }

  // 3. If logged in as Staff -> Show ONLY Staff Portal
  return (
    <div className="flex h-screen overflow-hidden bg-[#f0f4f9]">
      <StaffSidebar activeTab={staffTab} onSelectTab={setStaffTab} />
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Topbar 
          onOpenAddModal={() => setShowGlobalAddModal(true)} 
          onOpenLeaveModal={() => setShowGlobalLeaveModal(true)}
        />
        <main className="flex-1 overflow-y-auto min-h-0">
          <StaffDashboard activeTab={staffTab} />
        </main>
      </div>

      {showGlobalLeaveModal && (
        <ApplyLeaveModal onClose={() => setShowGlobalLeaveModal(false)} />
      )}
    </div>
  );
}
