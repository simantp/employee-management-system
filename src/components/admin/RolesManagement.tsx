'use client';

import React, { useState } from 'react';
import { 
  KeyRound, 
  UserPlus, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  MoreVertical, 
  X,
  Lock,
  UserCheck
} from 'lucide-react';
import { useApp } from '@/lib/store';
import { UserRole, AuthUser } from '@/types';

export default function RolesManagement() {
  const { users, currentUser, createAdminUser, promoteUserRole } = useApp();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    role: 'ADMIN' as UserRole,
    department: 'Administration' as any,
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) return;

    createAdminUser(form);
    setShowCreateModal(false);
    setForm({ name: '', email: '', role: 'ADMIN', department: 'Administration' });
  };

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 mb-6" id="roles">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>Admin Roles & User Permissions</span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                Super Admin Access
              </span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Only Super Admin can create or promote users to Admin / HR Manager roles
            </p>
          </div>
        </div>

        {isSuperAdmin && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-navy-950 hover:bg-slate-900 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition"
          >
            <UserPlus className="w-3.5 h-3.5 text-cyan-400" />
            <span>+ Create Admin User</span>
          </button>
        )}
      </div>

      {/* Users & Roles Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
            <tr>
              <th className="py-3 px-4">User</th>
              <th className="py-3 px-4">Work Email</th>
              <th className="py-3 px-4">Assigned Role</th>
              <th className="py-3 px-4">Email Status</th>
              <th className="py-3 px-4">Joined Date</th>
              <th className="py-3 px-4 text-right">Role Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-slate-50/80 transition">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2.5">
                    <img 
                      src={u.avatarUrl || 'https://images.unsplash.com/photo-1534528741775?w=150'} 
                      alt={u.name} 
                      className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200"
                    />
                    <div>
                      <span className="font-bold text-slate-900 block">{u.name}</span>
                      <span className="text-[10px] text-slate-400">{u.department || 'All Branches'}</span>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 font-mono text-[11px] text-slate-700">{u.email}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                    u.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                    u.role === 'ADMIN' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                    u.role === 'HR_MANAGER' ? 'bg-cyan-100 text-cyan-800 border border-cyan-200' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-500 text-[11px]">{u.createdAt}</td>
                <td className="py-3 px-4 text-right">
                  {isSuperAdmin && u.role !== 'SUPER_ADMIN' ? (
                    <select
                      value={u.role}
                      onChange={(e) => promoteUserRole(u.id, e.target.value as UserRole)}
                      className="text-[11px] font-bold bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 focus:outline-none cursor-pointer"
                    >
                      <option value="STAFF">STAFF</option>
                      <option value="HR_MANAGER">HR_MANAGER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">Primary Super Admin</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal to Create New Admin */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 p-4">
      <div className="bg-white rounded-2xl shadow-2xl border max-w-md w-full p-6 text-xs animate-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center pb-3 border-b">
              <div>
                <h4 className="font-bold text-base text-slate-900">Grant Admin Role</h4>
                <p className="text-slate-500">Add or provision an Admin / HR Manager account</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="py-4 space-y-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rachel Adams"
                  value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})}
                  className="w-full p-2.5 border rounded-xl bg-slate-50"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Company Email *</label>
                <input
                  type="email"
                  required
                  placeholder="rachel.adams@company.com.au"
                  value={form.email}
                  onChange={e => setForm({...form, email: e.target.value})}
                  className="w-full p-2.5 border rounded-xl bg-slate-50"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Role Permission Tier</label>
                <select
                  value={form.role}
                  onChange={e => setForm({...form, role: e.target.value as UserRole})}
                  className="w-full p-2.5 border rounded-xl bg-slate-50 font-bold"
                >
                  <option value="ADMIN">ADMIN (Full Plant & Employee Management)</option>
                  <option value="HR_MANAGER">HR_MANAGER (Leave & Compliance Only)</option>
                  <option value="STAFF">STAFF (Self-Service)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border rounded-xl font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-600/25"
                >
                  Create Admin Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
