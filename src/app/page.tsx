'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/lib/store';
import AdminSidebar from '@/components/layout/AdminSidebar';
import StaffSidebar from '@/components/layout/StaffSidebar';
import Topbar from '@/components/layout/Topbar';
import AdminDashboard from '@/components/admin/AdminDashboard';
import StaffDashboard from '@/components/staff/StaffDashboard';
import ApplyLeaveModal from '@/components/staff/ApplyLeaveModal';
import AuthPortal from '@/components/auth/AuthPortal';

export default function AppHome() {
  const { currentUser } = useApp();
  const [adminTab, setAdminTab] = useState('dashboard');
  const [staffTab, setStaffTab] = useState('dashboard');

  const [showGlobalLeaveModal, setShowGlobalLeaveModal] = useState(false);

  // Automatically remove any lingering URL hash (like #compliance) from the address bar
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }, []);

  // Whenever admin or staff logs in, automatically select and display the dashboard tab
  useEffect(() => {
    if (currentUser) {
      setAdminTab('dashboard');
      setStaffTab('dashboard');
    }
  }, [currentUser?.id, currentUser?.role]);

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
            onOpenLeaveModal={() => setShowGlobalLeaveModal(true)}
          />
          <main className="flex-1 overflow-y-auto min-h-0">
            <AdminDashboard activeTab={adminTab} />
          </main>
        </div>
      </div>
    );
  }

  // 3. If logged in as Staff -> Show ONLY Staff Portal
  return (
    <div className="flex h-screen overflow-hidden bg-[#f0f4f9]">
      <StaffSidebar activeTab={staffTab} onSelectTab={setStaffTab} />
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Topbar 
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
