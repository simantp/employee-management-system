'use client';

import React, { useState, useRef } from 'react';
import { 
  X, 
  Camera, 
  Upload, 
  CheckCircle2, 
  Smartphone, 
  Monitor, 
  User,
  Sparkles,
  Save
} from 'lucide-react';
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
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-150 text-xs" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-tr from-slate-950 via-slate-900 to-navy-950 text-white relative">
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500 text-navy-950 flex items-center justify-center font-bold shadow-md shadow-cyan-500/20">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm text-white">Upload Profile Picture</h3>
              <p className="text-[11px] text-cyan-300">Permanent Database Storage • Sydney Portal</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          
          {/* Avatar Preview Box */}
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              {previewImg ? (
                <img 
                  src={previewImg} 
                  alt="Avatar Preview" 
                  className="w-28 h-28 rounded-3xl object-cover ring-4 ring-cyan-500 shadow-xl"
                />
              ) : (
                <div className="w-28 h-28 rounded-3xl bg-slate-100 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400">
                  <User className="w-10 h-10 text-slate-400 mb-1" />
                  <span className="text-[10px] font-bold">No Photo Selected</span>
                </div>
              )}

              <div className="absolute inset-0 rounded-3xl bg-navy-950/70 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center text-white text-[10px] font-bold">
                <Camera className="w-6 h-6 text-cyan-300 mb-1" />
                <span className="text-cyan-300">BROWSE</span>
              </div>
            </div>
            <span className="text-[11px] text-slate-500 font-semibold">Click avatar photo above or select an option below</span>
          </div>

          {/* Source Tabs: Computer vs Mobile */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
            <button
              type="button"
              onClick={() => setSource('COMPUTER')}
              className={`py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 ${
                source === 'COMPUTER' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Monitor className="w-4 h-4" />
              <span>From Computer</span>
            </button>

            <button
              type="button"
              onClick={() => setSource('MOBILE')}
              className={`py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 ${
                source === 'MOBILE' ? 'bg-white text-cyan-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>From Mobile</span>
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
              className="border-2 border-dashed border-blue-200 hover:border-blue-500 bg-blue-50/40 hover:bg-blue-50/80 rounded-2xl p-5 text-center cursor-pointer transition space-y-1.5"
            >
              <Upload className="w-6 h-6 text-blue-600 mx-auto" />
              <p className="font-bold text-slate-800 text-xs">Click to browse or drop photo here</p>
              <p className="text-[10px] text-slate-400">Supports JPG, PNG, WebP (auto-optimized & persisted)</p>
            </div>
          )}

          {/* Mobile Upload Area with Permission */}
          {source === 'MOBILE' && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 space-y-2.5">
              <div className="flex items-start gap-2.5">
                <Smartphone className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] leading-snug">
                  Allow Employee Portal to access your camera and mobile storage to take or choose a photo.
                </p>
              </div>

              {mobilePermissionGranted ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2.8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xs transition"
                >
                  <Camera className="w-4 h-4" />
                  <span>Open Camera / Photo Gallery</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setMobilePermissionGranted(true);
                    fileInputRef.current?.click();
                  }}
                  className="w-full py-2.8 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xs transition"
                >
                  <span>Allow Mobile Storage & Camera</span>
                </button>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 rounded-2xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 transition-all text-xs"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!previewImg || isSaving}
              className="flex items-center gap-2.5 px-7 py-3 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white font-black text-xs shadow-lg shadow-cyan-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving to Database...' : 'Save Profile Photo'}</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
