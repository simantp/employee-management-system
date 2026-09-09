'use client';

import React, { useState, useRef } from 'react';
import { useApp } from '@/lib/store';
import { compressImage } from '@/lib/imageUtils';

export default function AvatarUploadModal({ onClose }: { onClose: () => void }) {
  const { currentStaff, updateProfileAvatar } = useApp();

  const [source, setSource] = useState<'COMPUTER' | 'MOBILE'>('COMPUTER');
  const [mobilePermissionGranted, setMobilePermissionGranted] = useState(false);
  const [previewImg, setPreviewImg] = useState<string>(currentStaff.avatarUrl || '');
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const raw = event.target?.result as string;
        // Compress client-side to ensure lightweight permanent storage (< 40KB)
        const compressed = await compressImage(raw, 320, 320, 0.88);
        setPreviewImg(compressed);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!previewImg) return;
    setIsSaving(true);
    try {
      const finalImg = await compressImage(previewImg, 320, 320, 0.88);
      updateProfileAvatar(currentStaff.id, finalImg);
      setIsSaving(false);
      onClose();
    } catch (err) {
      updateProfileAvatar(currentStaff.id, previewImg);
      setIsSaving(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden text-xs" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Upload Profile Picture</h3>
            <p className="text-xs text-slate-500">Permanent Database Storage • Sydney Portal</p>
          </div>
          <button 
            onClick={onClose} 
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-2 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 transition cursor-pointer"
          >
            Close
          </button>
        </div>

        <div className="p-6 space-y-5">
          
          {/* Avatar Preview Box */}
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              {previewImg ? (
                <img 
                  src={previewImg} 
                  alt="Avatar Preview" 
                  className="w-24 h-24 rounded-2xl object-cover ring-2 ring-slate-900 shadow-md"
                />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400">
                  <span className="text-[10px] font-semibold">No Photo</span>
                </div>
              )}

              <div className="absolute inset-0 rounded-2xl bg-slate-900/70 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[10px] font-bold">
                <span>CHANGE</span>
              </div>
            </div>
            <span className="text-xs text-slate-500">Click avatar photo above or select an option below</span>
          </div>

          {/* Source Tabs: Computer vs Mobile */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setSource('COMPUTER')}
              className={`py-2 rounded-lg font-semibold text-xs transition cursor-pointer ${
                source === 'COMPUTER' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              From Computer
            </button>

            <button
              type="button"
              onClick={() => setSource('MOBILE')}
              className={`py-2 rounded-lg font-semibold text-xs transition cursor-pointer ${
                source === 'MOBILE' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              From Mobile
            </button>
          </div>

          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />

          {/* Computer Upload Area */}
          {source === 'COMPUTER' && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50 rounded-xl p-5 text-center cursor-pointer transition space-y-1"
            >
              <p className="font-semibold text-slate-800 text-xs">Click to browse or drop photo here</p>
              <p className="text-[10px] text-slate-400">Supports JPG, PNG, WebP (auto-optimized & persisted)</p>
            </div>
          )}

          {/* Mobile Upload Area with Permission */}
          {source === 'MOBILE' && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 space-y-2.5">
              <p className="text-xs leading-snug">
                Allow Employee Portal to access your camera and mobile storage to take or choose a photo.
              </p>

              {mobilePermissionGranted ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold transition cursor-pointer text-xs"
                >
                  Open Camera / Photo Gallery
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setMobilePermissionGranted(true);
                    fileInputRef.current?.click();
                  }}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold transition cursor-pointer text-xs"
                >
                  Allow Mobile Storage & Camera
                </button>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 font-semibold hover:bg-slate-100 transition text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!previewImg || isSaving}
              className="px-5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-semibold text-xs transition cursor-pointer"
            >
              {isSaving ? 'Saving to Database...' : 'Save Profile Photo'}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
