'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store';
import { EmployeeDocument } from '@/types';

export default function PendingDocumentApprovals() {
  const { employees, reviewDocument } = useApp();
  const [selectedPreviewDoc, setSelectedPreviewDoc] = useState<{ doc: EmployeeDocument; empName: string; empId: string } | null>(null);
  const [rejectNotes, setRejectNotes] = useState('');
  const [rejectingDocId, setRejectingDocId] = useState<string | null>(null);

  // Aggregate all pending documents across all employees
  const pendingDocs: Array<{ doc: EmployeeDocument; empId: string; empName: string; empNumber: string; dept: string }> = [];

  employees.forEach(emp => {
    emp.documents.forEach(doc => {
      if (doc.status === 'Pending') {
        pendingDocs.push({
          doc,
          empId: emp.id,
          empName: `${emp.firstName} ${emp.lastName}`,
          empNumber: emp.employeeNumber,
          dept: emp.department,
        });
      }
    });
  });

  if (pendingDocs.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm text-xs">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Pending Document Approvals</h3>
            <p className="text-[11px] text-slate-500">Employee compliance uploads, renewed licenses &amp; visa notices</p>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            All Documents Verified
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4 text-xs">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span>Pending Document Approvals</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
              {pendingDocs.length} Pending Review
            </span>
          </h3>
          <p className="text-[11px] text-slate-500">
            Inspect uploaded identification, visas &amp; licenses to mark as legally verified
          </p>
        </div>
      </div>

      {/* Grid of Pending Documents */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pendingDocs.map(({ doc, empId, empName, empNumber, dept }) => {
          const previewImg = doc.previewUrl || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=500';

          return (
            <div 
              key={doc.id}
              className="p-4 rounded-2xl border border-slate-200 bg-slate-50/40 hover:bg-white hover:shadow-md transition space-y-3 flex flex-col justify-between"
            >
              {/* Document Thumbnail Preview */}
              <div 
                onClick={() => setSelectedPreviewDoc({ doc, empName, empId })}
                className="relative h-28 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 cursor-pointer group flex items-center justify-center"
              >
                <img 
                  src={previewImg} 
                  alt={doc.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition"
                />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                  <span className="px-2.5 py-1 bg-white text-slate-900 font-bold rounded-lg text-[10px] shadow">
                    Inspect Document
                  </span>
                </div>
                <div className="absolute top-2 right-2">
                  <span className="px-2 py-0.5 bg-amber-500 text-white rounded-full text-[9px] font-bold shadow-xs">
                    Pending
                  </span>
                </div>
              </div>

              {/* Document Info */}
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 text-xs truncate" title={doc.name}>
                  {doc.name}
                </h4>
                <p className="text-[11px] text-blue-600 font-semibold truncate">{doc.type}</p>
                <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                  <span className="font-bold text-slate-800">{empName}</span>
                  <span className="font-mono text-slate-400">{empNumber}</span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>Uploaded: {doc.uploadDate}</span>
                  <span>{doc.fileSize || '1.8 MB'}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => reviewDocument(empId, doc.id, 'Verified')}
                  className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center shadow-xs transition cursor-pointer"
                >
                  Verify &amp; Approve
                </button>

                <button
                  onClick={() => setRejectingDocId(doc.id)}
                  className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl font-bold border border-rose-200 transition cursor-pointer"
                  title="Reject Document"
                >
                  Reject
                </button>
              </div>

              {/* Rejection Note Form */}
              {rejectingDocId === doc.id && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-2 animate-in fade-in text-[11px]">
                  <label className="font-bold text-rose-900 block">Reason for Rejection:</label>
                  <input
                    type="text"
                    placeholder="e.g. Image blurry / Expiry date expired"
                    value={rejectNotes}
                    onChange={e => setRejectNotes(e.target.value)}
                    className="w-full p-2 border border-rose-300 rounded-lg bg-white focus:outline-none text-slate-800"
                  />
                  <div className="flex justify-end gap-1.5">
                    <button
                      onClick={() => setRejectingDocId(null)}
                      className="px-2.5 py-1 border border-slate-200 rounded-lg text-slate-600 font-bold bg-white cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        reviewDocument(empId, doc.id, 'Rejected', rejectNotes);
                        setRejectingDocId(null);
                        setRejectNotes('');
                      }}
                      className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg shadow-xs cursor-pointer"
                    >
                      Confirm Reject
                    </button>
                  </div>
                </div>
              )}

            </div>
          );
        })}
      </div>

      {/* Lightbox Preview Modal */}
      {selectedPreviewDoc && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4" onClick={() => setSelectedPreviewDoc(null)}>
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden animate-in zoom-in-95 text-xs" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-white">{selectedPreviewDoc.doc.name}</h3>
                <p className="text-[11px] text-slate-400">
                  Uploaded by {selectedPreviewDoc.empName} • {selectedPreviewDoc.doc.uploadDate}
                </p>
              </div>
              <button 
                onClick={() => setSelectedPreviewDoc(null)} 
                className="px-2 py-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 font-bold"
              >
                Close
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 max-h-96 flex items-center justify-center">
                <img 
                  src={selectedPreviewDoc.doc.previewUrl || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600'} 
                  alt={selectedPreviewDoc.doc.name}
                  className="max-h-96 w-full object-contain"
                />
              </div>

              <div className="grid grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-semibold block">Employee</span>
                  <span className="font-bold text-slate-800 text-xs">{selectedPreviewDoc.empName}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-semibold block">Category</span>
                  <span className="font-bold text-blue-600 text-xs">{selectedPreviewDoc.doc.type}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-semibold block">Review Status</span>
                  <span className="font-bold text-amber-600 text-xs">{selectedPreviewDoc.doc.status}</span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <button
                onClick={() => {
                  reviewDocument(selectedPreviewDoc.empId, selectedPreviewDoc.doc.id, 'Verified');
                  setSelectedPreviewDoc(null);
                }}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm cursor-pointer"
              >
                Verify &amp; Approve Document
              </button>

              <button
                onClick={() => setSelectedPreviewDoc(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
