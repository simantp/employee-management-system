'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store';
import { DocumentTypeConfig } from '@/types';
import ConfirmDeleteModal from '@/components/common/ConfirmDeleteModal';

export default function DocumentTypesManager() {
  const { documentTypes, addDocumentType, deleteDocumentType } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [deletingType, setDeletingType] = useState<DocumentTypeConfig | null>(null);
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
    <div className="space-y-5 text-xs" id="document-types">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-3">
        <div>
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <span>Required Document Types & Compliance Categories</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800">
              Staff Dropdown Controller
            </span>
          </h3>
          <p className="text-[11px] text-slate-500">
            Document types added here automatically appear in the Staff Portal upload dropdown
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
        >
          Add New Document Type
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {documentTypes.map(dt => (
          <div key={dt.id} className="p-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/60 flex items-start justify-between gap-2 hover:bg-white hover:shadow-xs transition">
            <div className="min-w-0">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 block w-max mb-1">
                {dt.category || 'General'}
              </span>
              <h4 className="font-bold text-slate-900 text-xs truncate" title={dt.name}>{dt.name}</h4>
              <span className="text-[10px] text-slate-400">
                {dt.hasExpiry ? 'Tracks 30-day Expiry' : 'Static Document'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setDeletingType(dt)}
              className="text-[11px] font-bold text-slate-400 hover:text-rose-600 px-2 py-1 rounded-lg transition cursor-pointer"
              title="Delete Document Type"
            >
              Delete
            </button>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 text-xs animate-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center pb-3 border-b">
              <div>
                <h4 className="font-bold text-base text-slate-900">Add New Document Type</h4>
                <p className="text-slate-500">Will be available immediately in staff upload modal</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-xs font-bold text-slate-400 hover:text-slate-700 cursor-pointer">
                Close
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
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="hasExpiry" className="font-semibold text-slate-700 cursor-pointer">
                  Track 30-Day Expiry Date Alerts for Admin
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border rounded-xl font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition cursor-pointer"
                >
                  Add Document Type
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modern Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!deletingType}
        title="Delete Document Classification Type?"
        itemName={deletingType?.name}
        description={deletingType ? `Are you sure you want to delete "${deletingType.name}" (${deletingType.category}) from required compliance categories? It will no longer be available in the staff portal upload dropdown.` : undefined}
        confirmButtonText="Delete Classification"
        onConfirm={() => {
          if (deletingType) {
            deleteDocumentType(deletingType.id);
            setDeletingType(null);
          }
        }}
        onCancel={() => setDeletingType(null)}
      />

    </div>
  );
}
