'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '@/lib/store';
import { EmployeeDocument } from '@/types';

export default function UploadDocumentModal({ 
  onClose, 
  initialDoc 
}: { 
  onClose: () => void;
  initialDoc?: EmployeeDocument | null;
}) {
  const { currentStaff, documentTypes, uploadDocument, updateDocument } = useApp();

  const isEditing = !!initialDoc;

  const [source, setSource] = useState<'COMPUTER' | 'MOBILE'>('COMPUTER');
  const [selectedDocType, setSelectedDocType] = useState(initialDoc?.type || documentTypes[0]?.name || 'Passport Copy');
  const [docName, setDocName] = useState(initialDoc?.name || '');
  const [documentNumber, setDocumentNumber] = useState(initialDoc?.documentNumber || '');
  const [expiryDate, setExpiryDate] = useState(initialDoc?.expiryDate || '');
  const [filePreview, setFilePreview] = useState<string | null>(initialDoc?.previewUrl || null);
  const [fileName, setFileName] = useState(initialDoc ? `${initialDoc.name}.png` : '');
  const [fileSize, setFileSize] = useState(initialDoc?.fileSize || '');
  const [fileType, setFileType] = useState<'image' | 'pdf' | 'doc'>((initialDoc?.fileType as any) || 'image');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialDoc) {
      setDocName(initialDoc.name);
      setSelectedDocType(initialDoc.type);
      setExpiryDate(initialDoc.expiryDate || '');
      setDocumentNumber(initialDoc.documentNumber || '');
      setFilePreview(initialDoc.previewUrl || null);
      setFileSize(initialDoc.fileSize || '1.8 MB');
    }
  }, [initialDoc]);

  // Handle actual file upload via HTML5 FileReader
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setFileSize((file.size / (1024 * 1024)).toFixed(2) + ' MB');
      const isPdf = file.type.includes('pdf') || file.name.toLowerCase().endsWith('.pdf');
      const isDoc = file.name.toLowerCase().endsWith('.doc') || file.name.toLowerCase().endsWith('.docx');
      setFileType(isPdf ? 'pdf' : isDoc ? 'doc' : 'image');

      const reader = new FileReader();
      reader.onload = (event) => {
        setFilePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);

      if (!docName) {
        setDocName(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  // Sample quick presets for instant testing
  const handleSelectPreset = (presetName: string, type: string, preview: string) => {
    setSelectedDocType(type);
    setDocName(presetName);
    setFileName(`${presetName.replace(/\s+/g, '_')}_2026.png`);
    setFileSize('1.8 MB');
    setFileType('image');
    setFilePreview(preview);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDocType) {
      alert('Please select a document type');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const payloadDoc = {
        name: docName || selectedDocType,
        type: selectedDocType,
        fileSize: fileSize || '1.6 MB',
        previewUrl: filePreview || initialDoc?.previewUrl || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&auto=format&fit=crop&q=80',
        fileType,
        expiryDate: expiryDate || undefined,
        documentNumber: documentNumber || undefined,
      };

      if (isEditing && initialDoc) {
        updateDocument(currentStaff.id, initialDoc.id, {
          ...payloadDoc,
          status: 'Pending',
        });
      } else {
        uploadDocument(currentStaff.id, payloadDoc);
      }
      setIsSubmitting(false);
      onClose();
    }, 350);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/25 p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-xs shadow-black/20" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-tr from-slate-900 via-navy-900 to-slate-950 text-white relative">
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 text-xs font-semibold text-slate-400 hover:text-white px-2 py-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
          >
            Close
          </button>

          <div className="flex items-center gap-3 mb-1">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-base text-white">
                  {isEditing ? 'Update / Renew Document' : 'Upload Compliance Document'}
                </h2>
                {isEditing && (
                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    RENEWAL
                  </span>
                )}
              </div>
              <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">
                HsCreations Compliance Vault • Sydney
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            {isEditing 
              ? 'Replace expired document with renewed copy and update expiry dates for HR verification'
              : 'Upload renewed visas, driver\'s licenses, passports, or medical certificates for HR verification'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[78vh] overflow-y-auto">
          
          {/* Source Toggle: Computer vs Mobile */}
          <div>
            <label className="font-bold text-slate-700 block mb-1.5">Upload Source</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSource('COMPUTER')}
                className={`p-3 rounded-2xl border flex items-center justify-center gap-2 font-bold text-xs transition cursor-pointer ${
                  source === 'COMPUTER'
                    ? 'border-orange-500 bg-orange-50/60 text-orange-950 ring-2 ring-orange-500/20 shadow-xs'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-white'
                }`}
              >
                <span>From Computer / Laptop</span>
              </button>

              <button
                type="button"
                onClick={() => setSource('MOBILE')}
                className={`p-3 rounded-2xl border flex items-center justify-center gap-2 font-bold text-xs transition cursor-pointer ${
                  source === 'MOBILE'
                    ? 'border-orange-500 bg-orange-50/60 text-orange-950 ring-2 ring-orange-500/20 shadow-xs'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-white'
                }`}
              >
                <span>Mobile Camera / Gallery</span>
              </button>
            </div>
          </div>

          {/* Document Type Selector */}
          <div>
            <label className="font-bold text-slate-700 block mb-1.5">Document Type *</label>
            <select
              value={selectedDocType}
              onChange={(e) => setSelectedDocType(e.target.value)}
              className="w-full p-3 rounded-2xl border border-slate-300 font-semibold text-slate-800 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition cursor-pointer"
            >
              {documentTypes.map((dt) => (
                <option key={dt.id} value={dt.name}>
                  {dt.name} ({dt.category})
                </option>
              ))}
              <option value="Medical Certificate">Medical Certificate (Sick / Carers Leave)</option>
              <option value="First Aid & WHS Certificate">First Aid &amp; WHS Certificate</option>
              <option value="Forklift / High Risk Work License">Forklift / High Risk Work License</option>
              <option value="Other Compliance Document">Other Compliance Document</option>
            </select>
          </div>

          {/* Document Name */}
          <div>
            <label className="font-bold text-slate-700 block mb-1.5">Document Label / Name *</label>
            <input
              type="text"
              required
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              placeholder="e.g. Australian Passport (Renewed 2026)"
              className="w-full px-3.5 py-3 rounded-2xl border border-slate-300 font-medium text-slate-800 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition"
            />
          </div>

          {/* Document Number & Expiry Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1.5">Document / License No.</label>
              <input
                type="text"
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
                placeholder="e.g. N1234567"
                className="w-full px-3.5 py-3 rounded-2xl border border-slate-300 font-medium text-slate-800 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1.5">New Expiry Date (if applicable)</label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-3.5 py-3 rounded-2xl border border-slate-300 font-medium text-slate-800 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition"
              />
            </div>
          </div>

          {/* Actual File Dropzone */}
          <div>
            <label className="font-bold text-slate-700 block mb-1.5">
              {isEditing ? 'Upload Replacement File / Photo (Optional if updating date only)' : 'Upload File / Photo *'}
            </label>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*,application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-orange-200 hover:border-orange-500 rounded-2xl p-4 bg-orange-50/20 hover:bg-orange-50/50 transition text-center cursor-pointer space-y-1.5 group"
            >
              <p className="font-bold text-slate-800 text-xs">
                {fileName ? fileName : source === 'MOBILE' ? 'Tap to take photo or choose from gallery' : 'Click or drag & drop file to upload'}
              </p>
              <p className="text-[10px] text-slate-400">
                Supports PDF, PNG, JPG, JPEG up to 10MB
              </p>
            </div>
          </div>

          {/* Quick Demo Test Presets */}
          <div className="pt-2 border-t border-slate-100 space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              1-Click Samples:
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleSelectPreset(
                  'Australian Passport Copy',
                  'Passport Copy (Australian / International)',
                  'https://images.unsplash.com/photo-1544717305-2782549b5136?w=500&auto=format&fit=crop&q=80'
                )}
                className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-orange-50 hover:text-orange-700 text-[10px] font-bold text-slate-700 transition cursor-pointer"
              >
                Passport Sample
              </button>

              <button
                type="button"
                onClick={() => handleSelectPreset(
                  'NSW Driver License',
                  'Driver\'s License (NSW / State)',
                  'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=500&auto=format&fit=crop&q=80'
                )}
                className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-orange-50 hover:text-orange-700 text-[10px] font-bold text-slate-700 transition cursor-pointer"
              >
                NSW Driver License
              </button>

              <button
                type="button"
                onClick={() => handleSelectPreset(
                  'VEVO TSS 482 Visa Grant',
                  'Visa Grant Notice / VEVO Verification',
                  'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=500&auto=format&fit=crop&q=80'
                )}
                className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-orange-50 hover:text-orange-700 text-[10px] font-bold text-slate-700 transition cursor-pointer"
              >
                TSS 482 Visa Notice
              </button>
            </div>
          </div>

          {/* Live Document Preview Box */}
          {filePreview && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700 text-[11px]">
                  Document Preview:
                </span>
                <span className="text-[10px] text-slate-400 font-mono">{fileSize || '1.8 MB'}</span>
              </div>
              <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-white max-h-36 flex items-center justify-center p-2">
                {fileType === 'pdf' ? (
                  <div className="flex items-center gap-3 p-3 bg-rose-50 border border-rose-200 rounded-xl w-full">
                    <div className="p-2.5 rounded-lg bg-rose-100 text-rose-600">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-slate-900 text-xs block truncate">{fileName || 'Attached_Document.pdf'}</span>
                      <span className="text-[10px] text-rose-700 font-bold">PDF Document Attached</span>
                    </div>
                  </div>
                ) : (
                  <img 
                    src={filePreview} 
                    alt="Preview" 
                    className="w-full h-36 object-cover rounded-lg"
                  />
                )}
                {fileType !== 'pdf' && (
                  <div className="absolute bottom-2 left-2 bg-black/40 backdrop-blur-xs text-white text-[9px] px-2 py-0.5 rounded font-mono">
                    {fileName || 'document_preview.jpg'}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 transition-all text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-black rounded-xl shadow-md shadow-orange-500/20 transition disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {isEditing ? (
                <span>{isSubmitting ? 'Saving Renewal...' : 'Save & Submit Updated Document'}</span>
              ) : (
                <span>{isSubmitting ? 'Uploading...' : 'Confirm & Upload Document'}</span>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
