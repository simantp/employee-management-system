'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/lib/store';

export default function AuditLogViewer() {
  const { auditLogs } = useApp();
  const [filterType, setFilterType] = useState<'ALL' | 'AUTH' | 'PUNCH' | 'SECURITY'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => {
      // Type Filter
      if (filterType === 'AUTH') {
        if (!log.action.includes('LOGIN') && !log.action.includes('LOGOUT') && !log.action.includes('REGISTER') && !log.action.includes('DENIED')) {
          return false;
        }
      } else if (filterType === 'PUNCH') {
        if (!log.action.includes('CLOCK') && !log.action.includes('TIMECARD') && !log.action.includes('SHIFT')) {
          return false;
        }
      } else if (filterType === 'SECURITY') {
        if (!log.action.includes('FAILED') && !log.action.includes('BLOCKED') && !log.action.includes('DENIED') && !log.action.includes('ENCRYPTED') && !log.action.includes('IP')) {
          return false;
        }
      }

      // Search Term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesAction = log.action.toLowerCase().includes(query);
        const matchesActor = (log.actorName || '').toLowerCase().includes(query) || (log.actorRole || '').toLowerCase().includes(query);
        const matchesTarget = `${log.targetType} ${log.targetId}`.toLowerCase().includes(query);
        const matchesDetails = (log.details || '').toLowerCase().includes(query);
        const matchesIp = (log.ipAddress || '').toLowerCase().includes(query);
        return matchesAction || matchesActor || matchesTarget || matchesDetails || matchesIp;
      }

      return true;
    });
  }, [auditLogs, filterType, searchTerm]);

  const getActionBadgeClass = (action: string) => {
    if (action.includes('FAILED') || action.includes('BLOCKED') || action.includes('DENIED')) {
      return 'bg-rose-100 text-rose-800 border border-rose-300';
    }
    if (action.includes('SUCCESS') || action.includes('APPROVE') || action.includes('VERIFIED') || action.includes('REGISTER')) {
      return 'bg-emerald-100 text-emerald-800 border border-emerald-300';
    }
    if (action.includes('LOGOUT')) {
      return 'bg-slate-100 text-slate-700 border border-slate-300';
    }
    if (action.includes('VIEW_ENCRYPTED') || action.includes('WARNING')) {
      return 'bg-amber-100 text-amber-800 border border-amber-300';
    }
    return 'bg-blue-100 text-blue-800 border border-blue-200';
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 mb-6" id="audit-log">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span>Security Audit Trail & Compliance Log</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
              Live Recording ({filteredLogs.length})
            </span>
          </h3>
          <p className="text-[11px] text-slate-500">
            Immutable ledger of authentication, punch events, unauthorized attempts & security actions
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[10px] font-bold">
            {(['ALL', 'AUTH', 'PUNCH', 'SECURITY'] as const).map(type => (
              <button
                key={type}
                type="button"
                onClick={() => setFilterType(type)}
                className={`px-2.5 py-1 rounded-md transition ${
                  filterType === type ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {type === 'ALL' ? 'All' : type === 'AUTH' ? 'Logins' : type === 'PUNCH' ? 'Shifts' : 'Security'}
              </button>
            ))}
          </div>

          <input
            type="text"
            placeholder="Search audit trail..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="text-xs px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-sans"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
            <tr>
              <th className="py-2.5 px-4">Timestamp (AEST)</th>
              <th className="py-2.5 px-4">Actor</th>
              <th className="py-2.5 px-4">Action</th>
              <th className="py-2.5 px-4">Target</th>
              <th className="py-2.5 px-4">Audit Details</th>
              <th className="py-2.5 px-4">IP Address</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400 font-sans text-xs">
                  No matching audit logs found.
                </td>
              </tr>
            ) : (
              filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-2.5 px-4 text-slate-500 whitespace-nowrap">{log.timestamp}</td>
                  <td className="py-2.5 px-4 font-bold text-slate-900 font-sans whitespace-nowrap">
                    {log.actorName} <span className="text-slate-400 text-[10px] font-normal">({log.actorRole})</span>
                  </td>
                  <td className="py-2.5 px-4 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getActionBadgeClass(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 font-sans text-slate-800 whitespace-nowrap">
                    {log.targetType} <span className="text-slate-400 text-[10px]">#{log.targetId}</span>
                  </td>
                  <td className="py-2.5 px-4 font-sans text-slate-600 min-w-[280px]">{log.details}</td>
                  <td className="py-2.5 px-4 text-slate-400 text-[10px] font-mono whitespace-nowrap">{log.ipAddress || '192.168.1.100'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
