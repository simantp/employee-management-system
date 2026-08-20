'use client';

import React from 'react';
import { History } from 'lucide-react';
import { useApp } from '@/lib/store';

export default function AuditLogViewer() {
  const { auditLogs } = useApp();

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 mb-6" id="audit-log">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>Security Audit Trail & Compliance Log</span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 animate-pulse">
                Live Recording
              </span>
            </h3>
            <p className="text-[11px] text-slate-500">Immutable ledger of bank detail decryptions, profile changes & approvals</p>
          </div>
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
            {auditLogs.map(log => (
              <tr key={log.id} className="hover:bg-slate-50/80 transition">
                <td className="py-2.5 px-4 text-slate-500 whitespace-nowrap">{log.timestamp}</td>
                <td className="py-2.5 px-4 font-bold text-slate-900 font-sans">{log.actorName} ({log.actorRole})</td>
                <td className="py-2.5 px-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    log.action.includes('VIEW_ENCRYPTED') ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                    log.action.includes('APPROVE') ? 'bg-emerald-100 text-emerald-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {log.action}
                  </span>
                </td>
                <td className="py-2.5 px-4 font-sans text-slate-800">{log.targetType} #{log.targetId}</td>
                <td className="py-2.5 px-4 font-sans text-slate-600">{log.details}</td>
                <td className="py-2.5 px-4 text-slate-400 text-[10px]">{log.ipAddress}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
