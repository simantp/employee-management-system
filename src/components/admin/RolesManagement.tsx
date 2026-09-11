'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store';
import { AuthUser } from '@/types';

export default function RolesManagement() {
  const { 
    users, 
    currentUser, 
    createAdminUser, 
    updateAdminCredentials, 
    deleteAdminUser 
  } = useApp();

  // State for Create Admin Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    department: 'Administration',
  });
  const [showCreatePassword, setShowCreatePassword] = useState(false);

  // State for Edit Admin Modal
  const [editingAdmin, setEditingAdmin] = useState<AuthUser | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
  });
  const [showEditPassword, setShowEditPassword] = useState(false);

  // State for Delete Admin Confirmation Modal
  const [adminToDelete, setAdminToDelete] = useState<AuthUser | null>(null);

  // State for Current Logged-in Admin In-Place Quick Edit Card
  const [myCreds, setMyCreds] = useState({
    name: currentUser?.name || 'Super Admin',
    username: currentUser?.username || 'admin',
    email: currentUser?.email || 'admin@company.com.au',
    password: currentUser?.password || 'password123',
  });
  const [showMyPassword, setShowMyPassword] = useState(false);
  const [myCredsSaved, setMyCredsSaved] = useState(false);

  // Filter: ONLY ADMINS (Strictly exclude staff - there is only 1 role: Admin)
  const adminUsers = users.filter(u => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN' || u.role === 'HR_MANAGER');

  // Handle My Credentials Update
  const handleSaveMyCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    if (!myCreds.name.trim() || !myCreds.email.trim()) return;

    updateAdminCredentials('CURRENT', {
      name: myCreds.name.trim(),
      username: myCreds.username.trim(),
      email: myCreds.email.trim(),
      password: myCreds.password.trim(),
    });

    setMyCredsSaved(true);
    setTimeout(() => setMyCredsSaved(false), 3000);
  };

  // Handle Create Admin Submit
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name.trim() || !createForm.email.trim()) return;

    createAdminUser({
      name: createForm.name.trim(),
      username: createForm.username.trim() || createForm.email.split('@')[0].trim().toLowerCase(),
      email: createForm.email.trim().toLowerCase(),
      password: createForm.password.trim() || 'admin123',
      department: createForm.department || 'Administration',
    });

    setShowCreateModal(false);
    setCreateForm({ name: '', username: '', email: '', password: '', department: 'Administration' });
  };

  // Handle Edit Admin Modal Open
  const handleOpenEdit = (admin: AuthUser) => {
    setEditingAdmin(admin);
    setEditForm({
      name: admin.name,
      username: admin.username || admin.email.split('@')[0],
      email: admin.email,
      password: admin.password || 'password123',
    });
    setShowEditPassword(false);
  };

  // Handle Edit Admin Submit
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdmin || !editForm.name.trim() || !editForm.email.trim()) return;

    updateAdminCredentials(editingAdmin.id, {
      name: editForm.name.trim(),
      username: editForm.username.trim(),
      email: editForm.email.trim(),
      password: editForm.password.trim(),
    });

    setEditingAdmin(null);
  };

  return (
    <div className="space-y-6 text-xs animate-in fade-in duration-150" id="roles">
      
      {/* ========================================================================= */}
      {/* 1. TOP SPOTLIGHT: CURRENT LOGGED-IN ADMIN CREDENTIALS QUICK EDIT */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 text-white rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-sm sm:text-base text-white tracking-tight">
                My Admin Login &amp; Security Credentials
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-orange-500 text-slate-950 tracking-wider">
                ADMIN
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Update your login username, email address, or password. Anyone with these credentials can log in to the Admin Dashboard.
            </p>
          </div>

          {myCredsSaved && (
            <span className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold flex items-center gap-1.5 animate-in fade-in">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Credentials Saved!
            </span>
          )}
        </div>

        <form onSubmit={handleSaveMyCredentials} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-1">
          {/* Full Name */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Admin Name
            </label>
            <input
              type="text"
              required
              value={myCreds.name}
              onChange={e => setMyCreds({ ...myCreds, name: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-semibold text-xs focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              placeholder="e.g. Super Admin"
            />
          </div>

          {/* Username */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Username / Login ID
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-500 font-mono font-bold">@</span>
              <input
                type="text"
                required
                value={myCreds.username}
                onChange={e => setMyCreds({ ...myCreds, username: e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, '') })}
                className="w-full pl-7 pr-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-cyan-300 font-mono font-bold text-xs focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                placeholder="admin"
              />
            </div>
          </div>

          {/* Email Address */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Company Email
            </label>
            <input
              type="email"
              required
              value={myCreds.email}
              onChange={e => setMyCreds({ ...myCreds, email: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-medium text-xs focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              placeholder="admin@company.com.au"
            />
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Admin Password</span>
              <button
                type="button"
                onClick={() => setShowMyPassword(!showMyPassword)}
                className="text-[9px] font-bold text-orange-400 hover:text-orange-300 transition cursor-pointer"
              >
                {showMyPassword ? 'Hide' : 'Show'}
              </button>
            </label>
            <input
              type={showMyPassword ? 'text' : 'password'}
              required
              value={myCreds.password}
              onChange={e => setMyCreds({ ...myCreds, password: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-amber-300 font-mono font-bold text-xs focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              placeholder="••••••••"
            />
          </div>

          {/* Submit Action */}
          <div className="sm:col-span-2 lg:col-span-4 flex items-center justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-orange-500/20 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              Save My Admin Credentials
            </button>
          </div>
        </form>
      </div>

      {/* ========================================================================= */}
      {/* 2. ADMIN ACCOUNTS DIRECTORY TABLE */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        
        {/* Header Bar */}
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-sm text-slate-900 tracking-tight">
                Admin Accounts &amp; Access Controls ({adminUsers.length})
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-900 text-white">
                Admin Only
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              All administrative accounts with access to the Admin Dashboard. Staff accounts are managed separately in Staff Directory.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition cursor-pointer self-start sm:self-auto"
          >
            Create Admin User
          </button>
        </div>

        {/* Admin Accounts Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Admin User</th>
                <th className="py-3 px-4">Username</th>
                <th className="py-3 px-4">Work Email</th>
                <th className="py-3 px-4">Password</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Created</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {adminUsers.map(admin => {
                const isCurrent = currentUser?.id === admin.id || currentUser?.email.toLowerCase() === admin.email.toLowerCase();
                const displayUser = admin.username || admin.email.split('@')[0];
                const displayPass = admin.password || 'password123';

                return (
                  <tr key={admin.id} className={`transition ${isCurrent ? 'bg-orange-50/30' : 'hover:bg-slate-50/80'}`}>
                    {/* User Identity */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <img 
                          src={admin.avatarUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'} 
                          alt={admin.name} 
                          className="w-8 h-8 rounded-xl object-cover ring-2 ring-slate-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-slate-900 block truncate">{admin.name}</span>
                            {isCurrent && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-orange-100 text-orange-800 border border-orange-300">
                                You
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 block truncate">{admin.department || 'Administration'}</span>
                        </div>
                      </div>
                    </td>

                    {/* Username */}
                    <td className="py-3 px-4 font-mono font-bold text-cyan-600 text-xs">
                      @{displayUser}
                    </td>

                    {/* Work Email */}
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-700">
                      {admin.email}
                    </td>

                    {/* Password */}
                    <td className="py-3 px-4 font-mono text-xs">
                      <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold border border-slate-200 inline-block">
                        ••••••••
                      </span>
                    </td>

                    {/* Role */}
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-slate-900 text-white shadow-2xs">
                        Admin
                      </span>
                    </td>

                    {/* Created Date */}
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {admin.createdAt || 'Standard'}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(admin)}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 font-bold text-slate-700 transition cursor-pointer shadow-2xs"
                          title="Update Username, Email or Password"
                        >
                          Edit
                        </button>

                        {admin.id !== 'usr-1' && (
                          <button
                            type="button"
                            onClick={() => setAdminToDelete(admin)}
                            className="px-2.5 py-1 rounded-lg border border-rose-200 bg-rose-50/80 hover:bg-rose-100 text-rose-700 font-bold transition cursor-pointer shadow-2xs"
                            title="Delete Admin Account"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 3. MODAL: CREATE NEW ADMIN USER */}
      {/* ========================================================================= */}
      {showCreateModal && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto"
          onClick={() => setShowCreateModal(false)}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 text-xs animate-in zoom-in-95 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h4 className="font-extrabold text-base text-slate-900">Create New Admin User</h4>
                <p className="text-[11px] text-slate-500">Set email &amp; password for Admin Dashboard login access</p>
              </div>
              <button 
                onClick={() => setShowCreateModal(false)} 
                className="px-2 py-1 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rachel Adams"
                  value={createForm.name}
                  onChange={e => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Username / Login ID</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-mono font-bold">@</span>
                  <input
                    type="text"
                    placeholder="rachel.admin (optional)"
                    value={createForm.username}
                    onChange={e => setCreateForm({ ...createForm, username: e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, '') })}
                    className="w-full pl-7 pr-3 py-2.5 border border-slate-300 rounded-xl bg-white font-mono font-bold text-cyan-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Company Work Email *</label>
                <input
                  type="email"
                  required
                  placeholder="rachel.adams@company.com.au"
                  value={createForm.email}
                  onChange={e => setCreateForm({ ...createForm, email: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">Admin Login Password *</label>
                  <button
                    type="button"
                    onClick={() => setShowCreatePassword(!showCreatePassword)}
                    className="text-[10px] font-bold text-orange-600 hover:text-orange-700 cursor-pointer"
                  >
                    {showCreatePassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <input
                  type={showCreatePassword ? 'text' : 'password'}
                  required
                  placeholder="Enter initial admin password"
                  value={createForm.password}
                  onChange={e => setCreateForm({ ...createForm, password: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-mono font-bold text-amber-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Anyone with this email and password can log in directly as Admin.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition shadow-xs cursor-pointer"
                >
                  Create Admin Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MODAL: EDIT ADMIN CREDENTIALS */}
      {/* ========================================================================= */}
      {editingAdmin && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto"
          onClick={() => setEditingAdmin(null)}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 text-xs animate-in zoom-in-95 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h4 className="font-extrabold text-base text-slate-900">Edit Admin Credentials</h4>
                <p className="text-[11px] text-slate-500">Update username, email, or password for {editingAdmin.name}</p>
              </div>
              <button 
                onClick={() => setEditingAdmin(null)} 
                className="px-2 py-1 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3.5">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Username / Login ID</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-mono font-bold">@</span>
                  <input
                    type="text"
                    required
                    value={editForm.username}
                    onChange={e => setEditForm({ ...editForm, username: e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, '') })}
                    className="w-full pl-7 pr-3 py-2.5 border border-slate-300 rounded-xl bg-white font-mono font-bold text-cyan-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Company Work Email *</label>
                <input
                  type="email"
                  required
                  value={editForm.email}
                  onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">Admin Login Password *</label>
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className="text-[10px] font-bold text-orange-600 hover:text-orange-700 cursor-pointer"
                  >
                    {showEditPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <input
                  type={showEditPassword ? 'text' : 'password'}
                  required
                  value={editForm.password}
                  onChange={e => setEditForm({ ...editForm, password: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-mono font-bold text-amber-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  New password will take effect immediately for future logins.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingAdmin(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition shadow-xs cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MODAL: DELETE ADMIN USER CONFIRMATION (MODERN MODAL) */}
      {/* ========================================================================= */}
      {adminToDelete && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150"
          onClick={() => setAdminToDelete(null)}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 text-xs animate-in zoom-in-95 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-start pb-3 border-b border-slate-100">
              <div>
                <h4 className="font-extrabold text-base text-slate-900">Delete Administrator</h4>
                <p className="text-[11px] text-slate-500">Revoke administrative access and remove account</p>
              </div>
              <button 
                onClick={() => setAdminToDelete(null)} 
                className="px-2 py-1 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>

            {/* Target Admin Card Preview */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3">
              <img 
                src={adminToDelete.avatarUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'} 
                alt={adminToDelete.name} 
                className="w-11 h-11 rounded-xl object-cover ring-2 ring-slate-200 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-slate-900 text-xs truncate">{adminToDelete.name}</span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-slate-900 text-white">
                    Admin
                  </span>
                </div>
                <div className="font-mono text-cyan-700 font-bold text-[11px] truncate">
                  @{adminToDelete.username || adminToDelete.email.split('@')[0]}
                </div>
                <div className="text-slate-500 font-mono text-[10px] truncate">
                  {adminToDelete.email}
                </div>
              </div>
            </div>

            {/* Warning Alert */}
            <div className="p-3.5 rounded-2xl bg-rose-50/80 border border-rose-200/80 text-rose-950 space-y-1">
              <div className="font-bold text-rose-900 text-[11px] uppercase tracking-wider">
                Permanent Revocation
              </div>
              <p className="text-[11px] text-rose-800 leading-relaxed">
                Are you sure you want to delete administrator access for <strong>{adminToDelete.name}</strong>? Anyone with these credentials will immediately lose login access to the Admin Dashboard.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setAdminToDelete(null)}
                className="px-4 py-2.5 border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteAdminUser(adminToDelete.id);
                  setAdminToDelete(null);
                }}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-extrabold transition shadow-md shadow-rose-600/20 cursor-pointer"
              >
                Confirm Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
