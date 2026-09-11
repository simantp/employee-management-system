'use client';

import React, { useState, useRef } from 'react';
import { useApp } from '@/lib/store';
import { EmployeeDocument } from '@/types';
import ConfirmDeleteModal from '@/components/common/ConfirmDeleteModal';

export default function EmployeeDocumentsTab({ employeeId }: { employeeId: string }) {
  const { 
    employees, 
    documentTypes, 
    uploadDocument, 
    updateDocument, 
    deleteDocument, 
    reviewDocument,
    addToast,
    addAudit
  } = useApp();

  const currentEmp = employees.find(e => e.id === employeeId);
  const documents: EmployeeDocument[] = currentEmp?.documents || [];

  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Modals & States
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [editingDoc, setEditingDoc] = useState<EmployeeDocument | null>(null);
  const [inspectDoc, setInspectDoc] = useState<EmployeeDocument | null>(null);
  const [zoomDoc, setZoomDoc] = useState<boolean>(false);
  const [rejectingDoc, setRejectingDoc] = useState<EmployeeDocument | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [deletingDoc, setDeletingDoc] = useState<EmployeeDocument | null>(null);

  // Form states for Upload / Edit
  const [formDocType, setFormDocType] = useState<string>(documentTypes[0]?.name || 'Passport Copy (Australian / International)');
  const [formDocName, setFormDocName] = useState<string>('');
  const [formDocNumber, setFormDocNumber] = useState<string>('');
  const [formExpiryDate, setFormExpiryDate] = useState<string>('');
  const [formStatus, setFormStatus] = useState<'Verified' | 'Pending' | 'Rejected' | 'Expired'>('Verified');
  const [formFilePreview, setFormFilePreview] = useState<string | null>(null);
  const [formFileSize, setFormFileSize] = useState<string>('1.8 MB');
  const [formFileType, setFormFileType] = useState<'image' | 'pdf' | 'doc'>('image');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Default image presets for quick testing
  const samplePresets = [
    {
      name: 'NSW Driver Licence',
      type: 'Driver\'s License (NSW / State)',
      number: 'NSW-9482910',
      expiry: '2027-11-20',
      preview: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
    },
    {
      name: 'Australian Passport Copy',
      type: 'Passport Copy (Australian / International)',
      number: 'PA-8849201',
      expiry: '2034-05-14',
      preview: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80',
    },
    {
      name: 'Subclass 482 Visa Grant Notice',
      type: 'Visa Grant Notice / VEVO Verification',
      number: 'VEVO-2026-9812',
      expiry: '2026-12-31',
      preview: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=600&auto=format&fit=crop&q=80',
    },
    {
      name: 'Forklift High Risk Work Licence',
      type: 'Forklift / White Card / RSA License',
      number: 'HRW-LF-44910',
      expiry: '2028-09-15',
      preview: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=600&auto=format&fit=crop&q=80',
    },
    {
      name: 'TFN Declaration Form',
      type: 'Tax File Number (TFN) Declaration',
      number: 'TFN-DEC-2026',
      expiry: '',
      preview: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
    }
  ];

  if (!currentEmp) {
    return (
      <div className="p-8 text-center text-slate-500">
        Employee record not found.
      </div>
    );
  }

  // Filtered documents
  const filteredDocs = documents.filter(doc => {
    const matchesCategory = filterCategory === 'ALL' || 
      doc.type.toLowerCase().includes(filterCategory.toLowerCase()) || 
      doc.name.toLowerCase().includes(filterCategory.toLowerCase());

    const matchesSearch = !searchQuery.trim() || 
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.documentNumber && doc.documentNumber.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  // Open upload modal
  const handleOpenUpload = () => {
    setEditingDoc(null);
    setFormDocType(documentTypes[0]?.name || 'Passport Copy (Australian / International)');
    setFormDocName('');
    setFormDocNumber('');
    setFormExpiryDate('');
    setFormStatus('Verified');
    setFormFilePreview(null);
    setFormFileSize('1.8 MB');
    setFormFileType('image');
    setShowUploadModal(true);
  };

  // Open edit modal
  const handleOpenEdit = (doc: EmployeeDocument) => {
    setEditingDoc(doc);
    setFormDocType(doc.type);
    setFormDocName(doc.name);
    setFormDocNumber(doc.documentNumber || '');
    setFormExpiryDate(doc.expiryDate || '');
    setFormStatus(doc.status || 'Verified');
    setFormFilePreview(doc.previewUrl || null);
    setFormFileSize(doc.fileSize || '1.8 MB');
    setFormFileType((doc as any).fileType || (doc.previewUrl?.endsWith('.pdf') ? 'pdf' : 'image'));
    setShowUploadModal(true);
  };

  // Select Quick Preset
  const handleSelectPreset = (preset: typeof samplePresets[0]) => {
    setFormDocType(preset.type);
    setFormDocName(preset.name);
    setFormDocNumber(preset.number);
    setFormExpiryDate(preset.expiry);
    setFormFilePreview(preset.preview);
    setFormFileSize('1.8 MB');
    setFormFileType('image');
  };

  // Handle Real File Upload via FileReader
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const isPdf = file.type.includes('pdf') || file.name.toLowerCase().endsWith('.pdf');
      const isDoc = file.name.toLowerCase().endsWith('.doc') || file.name.toLowerCase().endsWith('.docx');
      setFormFileType(isPdf ? 'pdf' : isDoc ? 'doc' : 'image');
      setFormFileSize((file.size / (1024 * 1024)).toFixed(2) + ' MB');
      
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormFilePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);

      if (!formDocName) {
        setFormDocName(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  // Submit Upload / Edit
  const handleSaveDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDocName.trim()) {
      alert('Please enter a document name');
      return;
    }

    const defaultImg = formFilePreview || samplePresets.find(p => p.type === formDocType)?.preview || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80';

    if (editingDoc) {
      updateDocument(employeeId, editingDoc.id, {
        name: formDocName.trim(),
        type: formDocType,
        documentNumber: formDocNumber.trim() || undefined,
        expiryDate: formExpiryDate || undefined,
        status: formStatus,
        fileSize: formFileSize,
        fileType: formFileType,
        previewUrl: defaultImg,
      });

      addToast('Document Updated', `"${formDocName}" was successfully updated.`, 'success');
      addAudit('ADMIN_UPDATE_DOCUMENT', 'Document', editingDoc.id, `Admin updated document "${formDocName}" for ${currentEmp.firstName} ${currentEmp.lastName}`, 'Admin', 'SuperAdmin');
    } else {
      uploadDocument(employeeId, {
        name: formDocName.trim(),
        type: formDocType,
        documentNumber: formDocNumber.trim() || undefined,
        expiryDate: formExpiryDate || undefined,
        fileSize: formFileSize,
        fileType: formFileType,
        previewUrl: defaultImg,
      });

      // If admin selected Verified status, automatically mark it verified
      if (formStatus === 'Verified') {
        const docId = 'doc-' + Date.now();
        reviewDocument(employeeId, docId, 'Verified', 'Verified directly by Admin upon upload');
      }

      addToast('Document Added', `"${formDocName}" uploaded to ${currentEmp.firstName}'s compliance vault.`, 'success');
      addAudit('ADMIN_UPLOAD_DOCUMENT', 'Document', employeeId, `Admin uploaded document "${formDocName}" for ${currentEmp.firstName} ${currentEmp.lastName}`, 'Admin', 'SuperAdmin');
    }

    setShowUploadModal(false);
  };

  // 1-Click Verify
  const handleVerify = (doc: EmployeeDocument) => {
    reviewDocument(employeeId, doc.id, 'Verified', 'Approved by Admin in staff profile');
    addToast('Document Verified', `"${doc.name}" has been marked as legally verified.`, 'success');
    if (inspectDoc?.id === doc.id) {
      setInspectDoc({ ...inspectDoc, status: 'Verified' });
    }
  };

  // Submit Rejection
  const handleConfirmReject = () => {
    if (!rejectingDoc) return;
    const reason = rejectReason.trim() || 'Document does not meet compliance standards or image is illegible.';
    reviewDocument(employeeId, rejectingDoc.id, 'Rejected', reason);
    addToast('Document Rejected', `"${rejectingDoc.name}" was rejected. Staff member has been notified.`, 'info');
    if (inspectDoc?.id === rejectingDoc.id) {
      setInspectDoc({ ...inspectDoc, status: 'Rejected' });
    }
    setRejectingDoc(null);
    setRejectReason('');
  };

  // Confirm Delete
  const handleConfirmDelete = () => {
    if (!deletingDoc) return;
    deleteDocument(employeeId, deletingDoc.id);
    addAudit('ADMIN_DELETE_DOCUMENT', 'Document', deletingDoc.id, `Admin deleted document "${deletingDoc.name}" for ${currentEmp.firstName} ${currentEmp.lastName}`, 'Admin', 'SuperAdmin');
    addToast('Document Deleted', `"${deletingDoc.name}" was removed from employee records.`, 'info');
    if (inspectDoc?.id === deletingDoc.id) {
      setInspectDoc(null);
    }
    setDeletingDoc(null);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h3 className="font-extrabold text-sm text-slate-900">
            {currentEmp.firstName}&apos;s Uploaded Documents &amp; Compliance Vault
          </h3>
          <p className="text-slate-500 text-[11px] mt-0.5">
            Manage, verify, reject, download, and upload legal identification, visas, driver licences, and certificates
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenUpload}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <span>Upload New Document</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
        <div className="flex flex-wrap items-center gap-1.5">
          {['ALL', 'Identification', 'Visa', 'License', 'Tax', 'Payroll'].map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setFilterCategory(cat)}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                filterCategory === cat
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {cat === 'ALL' ? 'All Files' : cat}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-64">
          <input
            type="text"
            placeholder="Search documents or number..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
          />
        </div>
      </div>

      {/* Documents Grid / Table */}
      {filteredDocs.length === 0 ? (
        <div className="p-8 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-center space-y-2">
          <div className="font-bold text-slate-700 text-xs">No documents found matching this filter</div>
          <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
            {documents.length === 0 
              ? `${currentEmp.firstName} does not have any documents uploaded yet. Click 'Upload New Document' to add their files.`
              : 'Try selecting a different filter category or clearing the search query.'}
          </p>
          {documents.length === 0 && (
            <button
              type="button"
              onClick={handleOpenUpload}
              className="mt-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition cursor-pointer"
            >
              Upload First Document
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredDocs.map(doc => {
            const isPdf = doc.fileType === 'pdf' || (doc.previewUrl && doc.previewUrl.toLowerCase().includes('.pdf')) || (doc.previewUrl && doc.previewUrl.startsWith('data:application/pdf'));
            const previewImg = doc.previewUrl || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80';
            const isExpired = doc.status === 'Expired';
            const isPending = doc.status === 'Pending';
            const isVerified = doc.status === 'Verified';
            const isRejected = doc.status === 'Rejected';

            return (
              <div
                key={doc.id}
                className="p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm transition flex flex-col justify-between space-y-3"
              >
                <div className="flex items-start gap-3">
                  {/* Thumbnail */}
                  <div
                    onClick={() => setInspectDoc(doc)}
                    className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 cursor-pointer relative group flex items-center justify-center shadow-2xs"
                    title="Click to inspect"
                  >
                    {isPdf ? (
                      <div className="w-full h-full bg-rose-50 flex flex-col items-center justify-center text-rose-600 p-1">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <span className="text-[8px] font-black uppercase tracking-tight text-rose-700">PDF</span>
                      </div>
                    ) : (
                      <img
                        src={previewImg}
                        alt={doc.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition"
                      />
                    )}
                    <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <span className="text-[9px] font-bold text-white bg-slate-950/80 px-1 py-0.5 rounded">
                        View
                      </span>
                    </div>
                  </div>

                  {/* Document Info */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-start justify-between gap-1">
                      <h4 
                        onClick={() => setInspectDoc(doc)}
                        className="font-bold text-slate-900 text-xs truncate cursor-pointer hover:underline" 
                        title={doc.name}
                      >
                        {doc.name}
                      </h4>

                      {/* Status Badge */}
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase shrink-0 ${
                        isVerified ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                        isPending ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                        isRejected ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                        'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {doc.status}
                      </span>
                    </div>

                    <p className="text-[10px] text-slate-500 font-medium truncate">
                      {doc.type}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[10px] text-slate-500 font-medium pt-0.5">
                      {doc.documentNumber && (
                        <span>ID: <strong className="font-mono text-slate-700">{doc.documentNumber}</strong></span>
                      )}
                      {doc.expiryDate && (
                        <span>
                          Expires: <strong className={isExpired ? 'text-rose-600 font-bold' : 'text-slate-700'}>{doc.expiryDate}</strong>
                        </span>
                      )}
                      <span>Uploaded: {doc.uploadDate || 'Active'}</span>
                    </div>
                  </div>
                </div>

                {/* Card Actions Toolbar */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setInspectDoc(doc)}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-[10px] transition cursor-pointer"
                    >
                      Inspect
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(doc)}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-[10px] transition cursor-pointer"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeletingDoc(doc)}
                      className="px-2 py-1 rounded-lg text-rose-600 hover:bg-rose-50 font-bold text-[10px] transition cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>

                  {/* Quick Verification Actions */}
                  <div className="flex items-center gap-1.5">
                    {isPending && (
                      <>
                        <button
                          type="button"
                          onClick={() => setRejectingDoc(doc)}
                          className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 font-bold text-[10px] transition cursor-pointer"
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          onClick={() => handleVerify(doc)}
                          className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] transition shadow-xs cursor-pointer"
                        >
                          Verify &amp; Approve
                        </button>
                      </>
                    )}

                    {!isPending && isVerified && (
                      <button
                        type="button"
                        onClick={() => setRejectingDoc(doc)}
                        className="px-2 py-1 rounded-lg text-slate-500 hover:text-rose-700 font-bold text-[10px] transition cursor-pointer"
                      >
                        Revoke Approval
                      </button>
                    )}

                    {!isPending && isRejected && (
                      <button
                        type="button"
                        onClick={() => handleVerify(doc)}
                        className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] transition cursor-pointer"
                      >
                        Re-Verify
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ======================================================== */}
      {/* 1. UPLOAD / EDIT DOCUMENT MODAL */}
      {/* ======================================================== */}
      {showUploadModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 my-6 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">
                  {editingDoc ? 'Edit Document Information' : `Upload Document for ${currentEmp.firstName} ${currentEmp.lastName}`}
                </h3>
                <p className="text-[11px] text-slate-500">Record compliance proof, expiry date and legal verification</p>
              </div>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold px-2 py-1 rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSaveDocument} className="space-y-4">
              
              {/* Quick Preset Selector for Easy Testing */}
              {!editingDoc && (
                <div className="space-y-1.5 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
                    Quick Demo Presets (1-Click Fill):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {samplePresets.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectPreset(preset)}
                        className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-slate-900 text-slate-700 font-bold text-[10px] transition cursor-pointer"
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Document Category / Type Selector */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Document Classification *</label>
                <select
                  value={formDocType}
                  onChange={e => {
                    setFormDocType(e.target.value);
                    if (!formDocName) {
                      setFormDocName(e.target.value);
                    }
                  }}
                  className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-bold text-slate-900 cursor-pointer"
                  required
                >
                  {documentTypes.map(dt => (
                    <option key={dt.id} value={dt.name}>
                      {dt.name} ({dt.category})
                    </option>
                  ))}
                </select>
              </div>

              {/* Document Display Name */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Document Title / File Description *</label>
                <input
                  type="text"
                  required
                  value={formDocName}
                  onChange={e => setFormDocName(e.target.value)}
                  placeholder="e.g. NSW Driver Licence (Front & Back)"
                  className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-bold text-slate-900"
                />
              </div>

              {/* Document Number & Expiry Date Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Document / ID Number (Optional)</label>
                  <input
                    type="text"
                    value={formDocNumber}
                    onChange={e => setFormDocNumber(e.target.value)}
                    placeholder="e.g. NSW-9482910"
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-mono font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Expiration Date (If Applicable)</label>
                  <input
                    type="date"
                    value={formExpiryDate}
                    onChange={e => setFormExpiryDate(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-bold text-slate-900"
                  />
                </div>
              </div>

              {/* Initial Status Setting (Admin only) */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Verification Status *</label>
                <select
                  value={formStatus}
                  onChange={e => setFormStatus(e.target.value as any)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-bold text-slate-900 cursor-pointer"
                >
                  <option value="Verified">Verified (Compliance Approved)</option>
                  <option value="Pending">Pending (Requires Review)</option>
                  <option value="Rejected">Rejected (Requires Re-upload)</option>
                  <option value="Expired">Expired (Past Validity Date)</option>
                </select>
              </div>

              {/* File Attachment / File Picker */}
              <div className="space-y-2">
                <label className="font-bold text-slate-700 block">Attached File / Document Preview</label>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*,application/pdf"
                  className="hidden"
                />

                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-slate-800 rounded-2xl p-4 text-center cursor-pointer bg-slate-50 transition space-y-1.5"
                >
                  {formFilePreview ? (
                    <div className="space-y-2">
                      {formFileType === 'pdf' ? (
                        <div className="flex items-center justify-center gap-3 p-3 bg-rose-50 border border-rose-200 rounded-xl">
                          <div className="p-2 rounded-lg bg-rose-100 text-rose-600 font-bold">
                            PDF
                          </div>
                          <div className="text-left">
                            <span className="font-bold text-slate-900 block text-xs truncate max-w-xs">{formDocName || 'Attached PDF Document'}</span>
                            <span className="text-[10px] text-rose-700 font-semibold">PDF Document Selected ({formFileSize})</span>
                          </div>
                        </div>
                      ) : (
                        <img
                          src={formFilePreview}
                          alt="Preview"
                          className="max-h-28 mx-auto rounded-lg object-cover border border-slate-200"
                        />
                      )}
                      <span className="text-[10px] font-bold text-slate-600 block">
                        Click to change selected image / file ({formFileSize})
                      </span>
                    </div>
                  ) : (
                    <div>
                      <span className="font-bold text-slate-700 block">Click to select image or PDF from computer</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Supports PNG, JPG, WEBP, PDF up to 15MB</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 font-bold hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold transition hover:bg-slate-800 cursor-pointer shadow-sm"
                >
                  {editingDoc ? 'Save Updates' : 'Upload to Vault'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. DOCUMENT INSPECT / LIGHTBOX PREVIEW MODAL */}
      {/* ======================================================== */}
      {inspectDoc && (() => {
        const isPdf = !!inspectDoc.previewUrl && (
          inspectDoc.previewUrl.toLowerCase().endsWith('.pdf') ||
          inspectDoc.previewUrl.includes('.pdf?') ||
          inspectDoc.previewUrl.startsWith('data:application/pdf') ||
          inspectDoc.type?.toLowerCase().includes('pdf') ||
          inspectDoc.name?.toLowerCase().endsWith('.pdf') ||
          (inspectDoc as any).fileType === 'pdf'
        );

        return (
          <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto" onClick={() => setInspectDoc(null)}>
            <div className="bg-white rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl border border-slate-200 space-y-0 animate-in zoom-in-95 my-6 text-xs" onClick={e => e.stopPropagation()}>
              
              {/* Lightbox Header */}
              <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                    <span>{inspectDoc.name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                      inspectDoc.status === 'Verified' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                      inspectDoc.status === 'Pending' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                      'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}>
                      {inspectDoc.status}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Staff: <strong>{currentEmp.firstName} {currentEmp.lastName}</strong> • {inspectDoc.type}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setInspectDoc(null)}
                  className="text-slate-400 hover:text-white font-bold p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Document Controls Bar */}
              <div className="flex items-center justify-between px-5 py-2.5 bg-slate-800 border-b border-slate-700 text-xs">
                <div className="flex items-center gap-2 text-slate-300 font-medium">
                  <span className="font-semibold text-slate-200">
                    {isPdf ? 'PDF Document Preview' : 'Image Attachment Preview'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {!isPdf && (
                    <button
                      type="button"
                      onClick={() => setZoomDoc(!zoomDoc)}
                      className="px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                      </svg>
                      <span>{zoomDoc ? 'Fit to Window' : 'Zoom 100%'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Document Body / PDF Viewer / Image Viewer */}
              <div className="p-4 sm:p-6 bg-slate-950 flex flex-col items-center justify-center min-h-[380px] max-h-[65vh] overflow-auto">
                {isPdf ? (
                  <iframe
                    src={inspectDoc.previewUrl || ''}
                    title={inspectDoc.name}
                    className="w-full h-[52vh] rounded-2xl bg-white border border-slate-800 shadow-2xl"
                  />
                ) : (
                  <div className={`transition-all duration-200 flex items-center justify-center ${zoomDoc ? 'max-w-none w-auto' : 'max-w-full max-h-[55vh]'}`}>
                    <img
                      src={inspectDoc.previewUrl || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&auto=format&fit=crop&q=80'}
                      alt={inspectDoc.name}
                      className={`rounded-2xl object-contain shadow-2xl border border-slate-800 bg-white transition-transform ${
                        zoomDoc ? 'w-auto h-auto max-w-[90vw]' : 'max-h-[50vh] max-w-full'
                      }`}
                    />
                  </div>
                )}
                <div className="mt-3 text-center">
                  <span className="text-[11px] text-slate-400 font-medium">
                    Official document uploaded by <strong>{currentEmp.firstName} {currentEmp.lastName}</strong> ({inspectDoc.uploadDate || 'Active'})
                  </span>
                </div>
              </div>

              {/* Lightbox Meta Details & Actions */}
              <div className="p-5 bg-white space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 block">Document ID / Number</span>
                    <span className="font-mono font-bold text-slate-900 text-xs">{inspectDoc.documentNumber || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 block">Expiry Date</span>
                    <span className="font-bold text-slate-900 text-xs">{inspectDoc.expiryDate || 'No Expiry'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 block">Upload Date</span>
                    <span className="font-bold text-slate-900 text-xs">{inspectDoc.uploadDate || 'Active'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 block">File Size</span>
                    <span className="font-bold text-slate-900 text-xs">{inspectDoc.fileSize || '1.8 MB'}</span>
                  </div>
                </div>

                {/* Action Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold transition cursor-pointer flex items-center gap-1.5"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                      <span>Print Document</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => {
                        const doc = inspectDoc;
                        setInspectDoc(null);
                        handleOpenEdit(doc);
                      }}
                      className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold transition cursor-pointer"
                    >
                      Edit Details
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const doc = inspectDoc;
                        setDeletingDoc(doc);
                      }}
                      className="px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl font-bold transition cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {inspectDoc.status !== 'Verified' && (
                      <button
                        type="button"
                        onClick={() => handleVerify(inspectDoc)}
                        className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-sm cursor-pointer"
                      >
                        Verify Document
                      </button>
                    )}
                    {inspectDoc.status !== 'Rejected' && (
                      <button
                        type="button"
                        onClick={() => setRejectingDoc(inspectDoc)}
                        className="px-4 py-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 font-bold transition cursor-pointer"
                      >
                        Reject Document
                      </button>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>
        );
      })()}

      {/* ======================================================== */}
      {/* 3. REJECTION REASON DIALOG */}
      {/* ======================================================== */}
      {rejectingDoc && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 text-xs">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-sm text-slate-900">
                Reject Document: &quot;{rejectingDoc.name}&quot;
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Explain reason for rejection. This notice will be immediately delivered to {currentEmp.firstName}.
              </p>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Rejection Reason / Guidance for Staff</label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="e.g. The photo provided is blurry or cropped. Please upload a clear color scan showing all four corners."
                className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setRejectingDoc(null);
                  setRejectReason('');
                }}
                className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 font-bold hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition cursor-pointer shadow-sm"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. MODERN DELETE CONFIRMATION MODAL */}
      {/* ======================================================== */}
      <ConfirmDeleteModal
        isOpen={!!deletingDoc}
        title="Delete Document from Vault?"
        itemName={deletingDoc?.name}
        description={deletingDoc ? `Are you sure you want to permanently remove "${deletingDoc.name}" (${deletingDoc.type}) from ${currentEmp.firstName}'s compliance records? This cannot be undone.` : undefined}
        confirmButtonText="Delete Document"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingDoc(null)}
      />

    </div>
  );
}
