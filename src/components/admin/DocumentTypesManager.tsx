'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store';
import { DocumentTypeConfig } from '@/types';
import ConfirmDeleteModal from '@/components/common/ConfirmDeleteModal';

export default function DocumentTypesManager() {
  const { documentTypes, addDocumentType, toggleDocumentTypeRequired, deleteDocumentType } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [deletingType, setDeletingType] = useState<DocumentTypeConfig | null>(null);
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeCategory, setNewTypeCategory] = useState('Identification');
  const [hasExpiry, setHasExpiry] = useState(true);
  const [isRequired, setIsRequired] = useState(false);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTypeName.trim()) return;

    addDocumentType({
      name: newTypeName.trim(),
      category: newTypeCategory,
      hasExpiry,
      isRequired,
    });
    setNewTypeName('');
    setIsRequired(false);
    setShowAddModal(false);
  };

  const compulsoryCount = documentTypes.filter(d => d.isRequired).length;

  return (
    <div className="space-y-5 text-xs" id="document-types">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-3">
        <div>
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 flex-wrap">
            <span>Required Document Types & Compliance Categories</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800">
              Staff Dropdown Controller
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
              {compulsoryCount} Compulsory for Onboarding
            </span>
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Flag documents as compulsory to require staff upload before their profile can be completed and activated.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0"
        >
          Add New Document Type
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {documentTypes.map(dt => (
          <div 
            key={dt.id} 
            className={`p-3.5 rounded-2xl border transition flex flex-col justify-between gap-3 ${
              dt.isRequired 
                ? 'border-amber-200 bg-amber-50/30 hover:bg-amber-50/50 shadow-xs' 
                : 'border-slate-200/80 bg-slate-50/60 hover:bg-white hover:shadow-xs'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-1 mb-1.5 flex-wrap">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">
                  {dt.category || 'General'}
                </span>
                {dt.isRequired ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 border border-amber-300 text-amber-900 inline-flex items-center gap-1">
                    ★ Compulsory
                  </span>
                ) : (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-500">
                    Optional
                  </span>
                )}
              </div>
              <h4 className="font-bold text-slate-900 text-xs truncate" title={dt.name}>{dt.name}</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {dt.hasExpiry ? 'Tracks 30-day Expiry' : 'Static Document'} • {dt.isRequired ? 'Mandatory for onboarding activation' : 'Optional document'}
              </p>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/60">
              <button
                type="button"
                onClick={() => toggleDocumentTypeRequired(dt.id)}
                className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  dt.isRequired
                    ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-200'
                    : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                }`}
                title={dt.isRequired ? 'Click to make optional' : 'Click to make compulsory for profile activation'}
              >
                {dt.isRequired ? '✓ Compulsory (Click to change)' : '+ Make Compulsory'}
              </button>

              <button
                type="button"
                onClick={() => setDeletingType(dt)}
                className="text-[11px] font-bold text-slate-400 hover:text-rose-600 px-2 py-1 rounded-lg transition cursor-pointer"
                title="Delete Document Type"
              >
                Delete
              </button>
            </div>
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

              <div className="flex items-center gap-2 pt-1 bg-amber-50/80 p-2.5 rounded-xl border border-amber-200">
                <input
                  type="checkbox"
                  id="isRequired"
                  checked={isRequired}
                  onChange={e => setIsRequired(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
                <label htmlFor="isRequired" className="font-semibold text-slate-800 cursor-pointer">
                  <span className="font-bold text-amber-900 block">Compulsory for Staff Activation</span>
                  <span className="text-[11px] text-slate-500 block">Staff cannot complete onboarding or activate profile without uploading this document</span>
                </label>
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
