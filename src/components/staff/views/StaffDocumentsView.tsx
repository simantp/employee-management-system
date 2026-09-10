'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store';
import { EmployeeDocument } from '@/types';
import UploadDocumentModal from '../UploadDocumentModal';

export default function StaffDocumentsView() {
  const { currentStaff } = useApp();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState<EmployeeDocument | null>(null);
  const [selectedPreviewDoc, setSelectedPreviewDoc] = useState<EmployeeDocument | null>(null);
  const [filterType, setFilterType] = useState('ALL');

  const defaultPreviews: Record<string, string> = {
    'Passport Copy': 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=500&auto=format&fit=crop&q=80',
    'TFN Declaration': 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=500&auto=format&fit=crop&q=80',
    'Bank Account Confirmation': 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=500&auto=format&fit=crop&q=80',
    'Driving License Copy': 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=500&auto=format&fit=crop&q=80',
    'Signed Resume & CV': 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=500&auto=format&fit=crop&q=80',
  };

  const filteredDocs = filterType === 'ALL' 
    ? currentStaff.documents 
    : currentStaff.documents.filter(d => d.type.toLowerCase().includes(filterType.toLowerCase()));

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-150 text-xs font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Documents &amp; Compliance Vault</span>
            <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200">
              {currentStaff.documents.length} Files
            </span>
          </h2>
          <p className="text-slate-500 mt-0.5">
            HsCreations Australian compliance identification, visa notices, licenses, certifications &amp; renewals
          </p>
        </div>

        <button
          onClick={() => {
            setEditingDoc(null);
            setShowUploadModal(true);
          }}
          className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 px-4 py-2.5 rounded-2xl font-black shadow-md shadow-orange-500/20 transition hover:-translate-y-0.5 cursor-pointer"
        >
          <span>Upload Document</span>
        </button>
      </div>

      {/* Upload Dropzone Banner */}
      <div 
        onClick={() => {
          setEditingDoc(null);
          setShowUploadModal(true);
        }}
        className="border-2 border-dashed border-orange-200 hover:border-orange-500 rounded-3xl p-6 bg-gradient-to-tr from-orange-50/40 via-amber-50/20 to-slate-50 hover:bg-orange-50/70 transition text-center cursor-pointer space-y-2 group shadow-2xs"
      >
        <h4 className="font-extrabold text-slate-900 text-sm">Upload New Document or Renew Expired File</h4>
        <p className="text-slate-500 max-w-md mx-auto text-xs">
          Upload from your <strong>Computer</strong> or <strong>Mobile Phone</strong> (camera &amp; photo gallery). Renew expired driver&apos;s licenses, visas, passports, or first aid certificates.
        </p>
      </div>

      {/* Filter and Stats Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-2 font-bold text-slate-700">
          <span>Filter by Category:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {['ALL', 'Identification', 'Tax', 'License', 'Payroll', 'Medical'].map(cat => (
            <button
              key={cat}
              onClick={() => setFilterType(cat)}
              className={`px-3 py-1.5 rounded-xl font-bold transition text-xs cursor-pointer ${
                filterType === cat
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat === 'ALL' ? 'All Documents' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Documents Grid with Small Visual Previews */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredDocs.map(doc => {
          const isPdf = !!doc.previewUrl && (
            doc.previewUrl.toLowerCase().endsWith('.pdf') ||
            doc.previewUrl.includes('.pdf?') ||
            doc.previewUrl.startsWith('data:application/pdf') ||
            doc.type?.toLowerCase().includes('pdf') ||
            doc.name?.toLowerCase().endsWith('.pdf') ||
            (doc as any).fileType === 'pdf'
          );
          const previewImg = doc.previewUrl || defaultPreviews[doc.name] || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&auto=format&fit=crop&q=80';
          const isExpired = doc.status === 'Expired';

          return (
            <div 
              key={doc.id} 
              className={`bg-white rounded-3xl border transition overflow-hidden flex flex-col justify-between group shadow-sm hover:shadow-md ${
                isExpired ? 'border-amber-300 ring-2 ring-amber-400/30' : 'border-slate-200/80'
              }`}
            >
              {/* Document Image Thumbnail Preview */}
              <div 
                onClick={() => setSelectedPreviewDoc(doc)}
                className="relative h-40 bg-slate-100 border-b border-slate-100 overflow-hidden cursor-pointer flex items-center justify-center group-hover:opacity-95 transition"
              >
                {isPdf ? (
                  <div className="flex flex-col items-center justify-center p-4 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-2 shadow-xs group-hover:scale-110 transition duration-200">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span className="font-bold text-slate-800 text-[11px] truncate max-w-[200px]">{doc.name}</span>
                    <span className="text-[10px] text-rose-700 font-bold uppercase tracking-wider mt-0.5">PDF Document</span>
                  </div>
                ) : (
                  <img 
                    src={previewImg} 
                    alt={doc.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                  />
                )}

                <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/30 transition flex items-center justify-center">
                  <span className="opacity-0 group-hover:opacity-100 transition px-3 py-1.5 bg-black/40 backdrop-blur-xs text-white rounded-xl font-bold flex items-center gap-1 text-[11px] shadow-md">
                    <span>View Document</span>
                  </span>
                </div>

                <div className="absolute top-2.5 right-2.5">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black shadow-sm ${
                    doc.status === 'Verified' 
                      ? 'bg-emerald-500 text-white' 
                      : doc.status === 'Expired'
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-blue-500 text-white'
                  }`}>
                    {doc.status}
                  </span>
                </div>

                <div className="absolute bottom-2 left-2 bg-black/40 backdrop-blur-xs text-white text-[9px] font-bold px-2.5 py-0.5 rounded-lg font-mono">
                  {doc.fileSize || '1.8 MB'}
                </div>
              </div>

              {/* Document Metadata Card Body */}
              <div className="p-4 space-y-3">
                <div>
                  <h4 className="font-bold text-slate-900 text-xs truncate" title={doc.name}>
                    {doc.name}
                  </h4>
                  <p className="text-[11px] text-orange-600 font-semibold truncate">
                    {doc.type}
                  </p>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                  <span>
                    {doc.expiryDate ? `Exp: ${doc.expiryDate}` : `Uploaded: ${doc.uploadDate}`}
                  </span>

                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setEditingDoc(doc)}
                      className="px-2.5 py-1 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold flex items-center gap-1 text-[11px] transition cursor-pointer"
                      title="Update or Replace Expired Document"
                    >
                      <span>Update</span>
                    </button>

                    <button 
                      onClick={() => setSelectedPreviewDoc(doc)}
                      className="px-2 py-1 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition cursor-pointer font-semibold text-[11px]"
                      title="View & Inspect"
                    >
                      View
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Upload / Update Document Modal */}
      {(showUploadModal || editingDoc) && (
        <UploadDocumentModal 
          onClose={() => {
            setShowUploadModal(false);
            setEditingDoc(null);
          }} 
          initialDoc={editingDoc}
        />
      )}

      {/* Full Document Lightbox Preview Modal */}
      {selectedPreviewDoc && (() => {
        const isPdf = !!selectedPreviewDoc.previewUrl && (
          selectedPreviewDoc.previewUrl.toLowerCase().endsWith('.pdf') ||
          selectedPreviewDoc.previewUrl.includes('.pdf?') ||
          selectedPreviewDoc.previewUrl.startsWith('data:application/pdf') ||
          selectedPreviewDoc.type?.toLowerCase().includes('pdf') ||
          selectedPreviewDoc.name?.toLowerCase().endsWith('.pdf') ||
          (selectedPreviewDoc as any).fileType === 'pdf'
        );

        return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 cursor-pointer overflow-y-auto" onClick={() => setSelectedPreviewDoc(null)}>
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 max-w-3xl w-full overflow-hidden animate-in zoom-in-95 text-xs cursor-default shadow-black/20 my-6" onClick={(e) => e.stopPropagation()}>
              <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <span>{selectedPreviewDoc.name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                      selectedPreviewDoc.status === 'Verified' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                      selectedPreviewDoc.status === 'Pending' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                      'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}>
                      {selectedPreviewDoc.status}
                    </span>
                  </h3>
                  <p className="text-[11px] text-orange-400 mt-0.5">{selectedPreviewDoc.type} • Uploaded {selectedPreviewDoc.uploadDate}</p>
                </div>
                <button 
                  onClick={() => setSelectedPreviewDoc(null)} 
                  className="text-slate-400 hover:text-white font-bold p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Document Body / PDF Viewer / Image Viewer */}
              <div className="p-4 sm:p-6 bg-slate-950 flex flex-col items-center justify-center min-h-[350px] max-h-[60vh] overflow-auto">
                {isPdf ? (
                  <iframe 
                    src={selectedPreviewDoc.previewUrl || ''} 
                    title={selectedPreviewDoc.name} 
                    className="w-full h-[50vh] rounded-2xl bg-white border border-slate-800 shadow-2xl"
                  />
                ) : (
                  <div className="flex items-center justify-center max-w-full max-h-[50vh]">
                    <img 
                      src={selectedPreviewDoc.previewUrl || defaultPreviews[selectedPreviewDoc.name] || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600'} 
                      alt={selectedPreviewDoc.name} 
                      className="max-h-[48vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl border border-slate-800 bg-white"
                    />
                  </div>
                )}
                <div className="mt-3 text-center">
                  <span className="text-[11px] text-slate-400 font-medium">
                    {isPdf ? 'Interactive PDF Preview' : 'Document File Attachment'} • {selectedPreviewDoc.fileSize || '1.8 MB'}
                  </span>
                </div>
              </div>

              {/* Metadata details */}
              <div className="p-5 bg-white space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-semibold block">Status</span>
                    <span className={`font-bold text-xs ${
                      selectedPreviewDoc.status === 'Verified' ? 'text-emerald-600' : 'text-amber-600'
                    }`}>
                      {selectedPreviewDoc.status}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-semibold block">Document ID</span>
                    <span className="font-mono font-bold text-slate-800 text-xs">{selectedPreviewDoc.documentNumber || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-semibold block">Expiry Date</span>
                    <span className="font-bold text-slate-800 text-xs">{selectedPreviewDoc.expiryDate || 'No Expiry'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-semibold block">File Size</span>
                    <span className="font-bold text-slate-800 text-xs">{selectedPreviewDoc.fileSize || '1.8 MB'}</span>
                  </div>
                </div>

                {/* Modal Footer Actions */}
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

                    <a
                      href={selectedPreviewDoc.previewUrl || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold transition cursor-pointer flex items-center gap-1.5"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      <span>Open Full File</span>
                    </a>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const doc = selectedPreviewDoc;
                        setSelectedPreviewDoc(null);
                        setEditingDoc(doc);
                      }}
                      className="px-4 py-2 bg-orange-100 hover:bg-orange-200 text-orange-950 font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition"
                    >
                      <span>Update / Renew File</span>
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
}
