'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store';

export default function MyDocumentsCard() {
  const { currentStaff, uploadDocument } = useApp();
  const [uploading, setUploading] = useState(false);

  const handleSimulatedUpload = () => {
    setUploading(true);
    setTimeout(() => {
      uploadDocument(currentStaff.id, {
        name: 'Medical_Cert_Aug2026.pdf',
        type: 'Medical Certificate',
        fileSize: '1.2 MB',
      });
      setUploading(false);
    }, 600);
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900">My Documents &amp; Compliance</h3>
          <p className="text-[11px] text-slate-500">ID, Visas, Licenses &amp; Declarations</p>
        </div>
        <button className="text-xs font-bold text-blue-600 hover:underline">
          View All &rarr;
        </button>
      </div>

      <div className="space-y-2 my-1">
        {currentStaff.documents.map(doc => (
          <div key={doc.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/50 text-xs">
            <div className="min-w-0">
              <p className="font-bold text-slate-800 truncate text-[11px]">{doc.name}</p>
              <p className="text-[10px] text-slate-400">Uploaded {doc.uploadDate}</p>
            </div>
            <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
              doc.status === 'Verified' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
            }`}>
              {doc.status}
            </span>
          </div>
        ))}
      </div>

      <button
        onClick={handleSimulatedUpload}
        disabled={uploading}
        className="w-full py-2 px-4 rounded-xl border border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/50 hover:bg-blue-50 text-blue-700 font-bold text-xs transition flex items-center justify-center gap-2 mt-2 cursor-pointer"
      >
        <span>{uploading ? 'Uploading Document...' : '+ Upload Renewal / Certificate'}</span>
      </button>
    </div>
  );
}
