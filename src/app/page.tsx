'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '@/lib/store';
import AdminSidebar from '@/components/layout/AdminSidebar';
import StaffSidebar from '@/components/layout/StaffSidebar';
import Topbar from '@/components/layout/Topbar';
import AdminDashboard from '@/components/admin/AdminDashboard';
import StaffDashboard from '@/components/staff/StaffDashboard';
import ApplyLeaveModal from '@/components/staff/ApplyLeaveModal';
import ChangePasswordModal from '@/components/staff/ChangePasswordModal';
import AuthPortal from '@/components/auth/AuthPortal';

export default function AppHome() {
  const { currentUser, currentStaff, showChangePasswordModal, setShowChangePasswordModal, logout } = useApp();
  const [adminTab, setAdminTab] = useState('dashboard');
  const [staffTab, setStaffTab] = useState('dashboard');

  const [showGlobalLeaveModal, setShowGlobalLeaveModal] = useState(false);

  const [hasInviteOrReset, setHasInviteOrReset] = useState(false);
  const checkedUrlOnMountRef = useRef(false);

  // Automatically remove any lingering URL hash (like #compliance) from the address bar
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }, []);

  // If an invite or password reset link is opened on initial page load, clear conflicting sessions and show AuthPortal
  useEffect(() => {
    if (typeof window !== 'undefined' && !checkedUrlOnMountRef.current) {
      checkedUrlOnMountRef.current = true;
      const searchParams = new URLSearchParams(window.location.search);
      const inviteParam = searchParams.get('invite') || searchParams.get('token') || searchParams.get('inviteToken');
      const resetParam = searchParams.get('resetToken') || searchParams.get('reset');
      
      if (inviteParam || resetParam) {
        setHasInviteOrReset(true);
        logout();
      }
    }
  }, [logout]);

  // Whenever admin or staff logs in, automatically select and display the dashboard tab
  useEffect(() => {
    if (currentUser) {
      setAdminTab('dashboard');
      setStaffTab('dashboard');
    }
  }, [currentUser?.id, currentUser?.role]);

  // Check if URL currently has any active invite or reset query parameters
  const hasActiveUrlInviteOrReset = typeof window !== 'undefined' 
    ? Boolean(new URLSearchParams(window.location.search).get('invite') || new URLSearchParams(window.location.search).get('token') || new URLSearchParams(window.location.search).get('inviteToken') || new URLSearchParams(window.location.search).get('resetToken') || new URLSearchParams(window.location.search).get('reset'))
    : false;

  // 1. If not logged in OR actively on an unprocessed invite/reset link -> Show AuthPortal!
  if (!currentUser || (hasInviteOrReset && hasActiveUrlInviteOrReset)) {
    return <AuthPortal onInviteCompleted={() => setHasInviteOrReset(false)} />;
  }

  const isAdmin = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN' || currentUser.role === 'HR_MANAGER';

  // 2. If logged in as Admin / Super Admin -> Show ONLY Admin Portal
  if (isAdmin) {
    return (
      <div className="flex h-screen overflow-hidden bg-[#eceef8]">
        <AdminSidebar activeTab={adminTab} onSelectTab={setAdminTab} />
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
          <Topbar 
            onOpenLeaveModal={() => setShowGlobalLeaveModal(true)}
            onNavigateTab={(tab) => setAdminTab(tab)}
          />
          <main className="flex-1 overflow-y-auto min-h-0">
            <AdminDashboard activeTab={adminTab} />
          </main>
        </div>

        {showChangePasswordModal && (
          <ChangePasswordModal
            onClose={() => setShowChangePasswordModal(false)}
            staffId={currentUser.staffId || currentStaff?.id}
            email={currentUser.email}
            userName={currentUser.name}
          />
        )}
      </div>
    );
  }

  // 3. If logged in as Staff -> Show ONLY Staff Portal
  return (
    <div className="flex h-screen overflow-hidden bg-[#eceef8]">
      <StaffSidebar activeTab={staffTab} onSelectTab={setStaffTab} />
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Topbar 
          onOpenLeaveModal={() => setShowGlobalLeaveModal(true)}
          onNavigateTab={(tab) => setStaffTab(tab)}
        />
        <main className="flex-1 overflow-y-auto min-h-0">
          <StaffDashboard activeTab={staffTab} />
        </main>
      </div>

      {showGlobalLeaveModal && (
        <ApplyLeaveModal onClose={() => setShowGlobalLeaveModal(false)} />
      )}

      {showChangePasswordModal && (
        <ChangePasswordModal
          onClose={() => setShowChangePasswordModal(false)}
          staffId={currentUser.staffId || currentStaff?.id}
          email={currentUser.email || currentStaff?.email}
          userName={currentUser.name || (currentStaff ? `${currentStaff.firstName} ${currentStaff.lastName}` : 'Staff Member')}
        />
      )}
    </div>
  );
}
