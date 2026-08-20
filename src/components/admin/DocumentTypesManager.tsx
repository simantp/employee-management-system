'use client';

import React, { useState } from 'react';
import { FileText, Plus, Trash2, ShieldCheck, CheckCircle2, X } from 'lucide-react';
import { useApp } from '@/lib/store';

export default function DocumentTypesManager() {
  const { documentTypes, addDocumentType, deleteDocumentType } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeCategory, setNewTypeCategory] = useState('Identification');
  const [hasExpiry, setHasExpiry] = useState(true);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTypeName.trim()) return;

    addDocumentType({
      name: newTypeName.trim(),
      category: newTypeCategory,
      hasExpiry,
    });
    setNewTypeName('');
    setShowAddModal(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 mb-6 text-xs" id="document-types">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center border border-cyan-100">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>Required Document Types & Compliance Categories</span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800">
                Staff Dropdown Controller
              </span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Document types added here automatically appear in the Staff Portal upload dropdown
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-navy-950 hover:bg-slate-900 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition"
        >
          <Plus className="w-3.5 h-3.5 text-cyan-400" />
          <span>+ Add New Document Type</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {documentTypes.map(dt => (
          <div key={dt.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex items-start justify-between gap-2 hover:bg-white hover:shadow-xs transition">
            <div className="min-w-0">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 block w-max mb-1">
                {dt.category || 'General'}
              </span>
              <h4 className="font-bold text-slate-900 text-xs truncate" title={dt.name}>{dt.name}</h4>
              <span className="text-[10px] text-slate-400">
                {dt.hasExpiry ? '⏳ Tracks 30-day Expiry' : '📄 Static Document'}
              </span>
            </div>

            <button
              onClick={() => deleteDocumentType(dt.id)}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
              title="Delete Document Type"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 p-4">
      <div className="bg-white rounded-2xl shadow-2xl border max-w-md w-full p-6 text-xs animate-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center pb-3 border-b">
              <div>
                <h4 className="font-bold text-base text-slate-900">Add New Document Type</h4>
                <p className="text-slate-500">Will be available immediately in staff upload modal</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="py-4 space-y-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Document Type Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Forklift High Risk Work License"
                  value={newTypeName}
                  onChange={e => setNewTypeName(e.target.value)}
                  className="w-full p-2.5 border rounded-xl bg-slate-50 font-semibold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Category</label>
                <select
                  value={newTypeCategory}
                  onChange={e => setNewTypeCategory(e.target.value)}
                  className="w-full p-2.5 border rounded-xl bg-slate-50 font-bold"
                >
                  <option value="Identification">Identification (Passport, ID)</option>
                  <option value="Visa & Immigration">Visa & Immigration (VEVO, TSS)</option>
                  <option value="Licenses">Licenses & Permits (Driving, Forklift)</option>
                  <option value="Medical">Medical & Health (Certificates)</option>
                  <option value="Tax & Compliance">Tax & Compliance (TFN, Super)</option>
                  <option value="HR Onboarding">HR Onboarding & Contracts</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="hasExpiry"
                  checked={hasExpiry}
                  onChange={e => setHasExpiry(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="hasExpiry" className="font-semibold text-slate-700">
                  Track 30-Day Expiry Date Alerts for Admin
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border rounded-xl font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-600/25"
                >
                  Add Document Type
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
