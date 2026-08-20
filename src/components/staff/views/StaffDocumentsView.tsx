'use client';

import React, { useState } from 'react';
import { 
  FileText, 
  Upload, 
  Download, 
  Eye, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  X, 
  Calendar,
  ShieldCheck,
  Smartphone,
  Monitor,
  RefreshCw
} from 'lucide-react';
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
          <Upload className="w-4 h-4" />
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
        <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mx-auto shadow-xs group-hover:scale-105 transition">
          <Upload className="w-6 h-6" />
        </div>
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
                <img 
                  src={previewImg} 
                  alt={doc.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                />
                <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/30 transition flex items-center justify-center">
                  <span className="opacity-0 group-hover:opacity-100 transition px-3 py-1.5 bg-black/20 text-white rounded-xl font-bold flex items-center gap-1 text-[11px] shadow-md">
                    <Eye className="w-3.5 h-3.5" />
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

                <div className="absolute bottom-2 left-2 bg-black/20 text-white text-[9px] font-bold px-2.5 py-0.5 rounded-lg  font-mono">
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
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>{doc.expiryDate ? `Exp: ${doc.expiryDate}` : `Uploaded: ${doc.uploadDate}`}</span>
                  </span>

                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setEditingDoc(doc)}
                      className="px-2.5 py-1 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold flex items-center gap-1 text-[11px] transition cursor-pointer"
                      title="Update or Replace Expired Document"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Update</span>
                    </button>

                    <button 
                      onClick={() => setSelectedPreviewDoc(doc)}
                      className="p-1 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                      title="View & Download"
                    >
                      <Download className="w-3.5 h-3.5" />
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

      {/* Full Document Lightbox Preview Modal with Clean Non-intrusive Backdrop */}
      {selectedPreviewDoc && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/25 p-4 cursor-pointer" onClick={() => setSelectedPreviewDoc(null)}>
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 max-w-2xl w-full overflow-hidden animate-in zoom-in-95 text-xs cursor-default shadow-black/20" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-white">{selectedPreviewDoc.name}</h3>
                <p className="text-[11px] text-orange-400">{selectedPreviewDoc.type} • Uploaded {selectedPreviewDoc.uploadDate}</p>
              </div>
              <button 
                onClick={() => setSelectedPreviewDoc(null)} 
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 max-h-96 flex items-center justify-center">
                <img 
                  src={selectedPreviewDoc.previewUrl || defaultPreviews[selectedPreviewDoc.name] || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600'} 
                  alt={selectedPreviewDoc.name} 
                  className="max-h-96 w-full object-contain"
                />
              </div>

              <div className="grid grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-semibold block">Status</span>
                  <span className={`font-bold text-xs ${
                    selectedPreviewDoc.status === 'Verified' ? 'text-emerald-600' : 'text-amber-600'
                  }`}>
                    {selectedPreviewDoc.status}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-semibold block">Expiry Date</span>
                  <span className="font-bold text-slate-800 text-xs">{selectedPreviewDoc.expiryDate || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-semibold block">Compliance Check</span>
                  <span className="font-bold text-slate-800 text-xs">SafeWork NSW / VEVO</span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  const doc = selectedPreviewDoc;
                  setSelectedPreviewDoc(null);
                  setEditingDoc(doc);
                }}
                className="px-4 py-2 bg-orange-100 hover:bg-orange-200 text-orange-950 font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition"
              >
                <RefreshCw className="w-4 h-4 text-orange-600" />
                <span>Update / Replace Document</span>
              </button>

              <button
                onClick={() => {
                  alert(`Downloading ${selectedPreviewDoc.name}...`);
                  setSelectedPreviewDoc(null);
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-sm flex items-center gap-2 cursor-pointer transition"
              >
                <Download className="w-4 h-4" />
                <span>Download Copy</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
