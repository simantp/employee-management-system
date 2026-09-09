'use client';

import React from 'react';

export interface ConfirmDeleteModalProps {
  isOpen: boolean;
  title: string;
  itemName?: string;
  description?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function ConfirmDeleteModal({
  isOpen,
  title,
  itemName,
  description,
  confirmButtonText = 'Delete Permanently',
  cancelButtonText = 'Cancel',
  onConfirm,
  onCancel,
  isLoading = false,
}: ConfirmDeleteModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150"
      onClick={onCancel}
    >
      <div 
        className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200/90 space-y-4 animate-in zoom-in-95 duration-150 text-xs shadow-black/20"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Badge & Title */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
              Confirm Deletion
            </span>
            <button
              type="button"
              onClick={onCancel}
              className="text-slate-400 hover:text-slate-700 font-bold px-2 py-1 rounded-lg text-xs transition cursor-pointer"
            >
              Close
            </button>
          </div>

          <h3 className="font-extrabold text-base text-slate-900 tracking-tight">
            {title}
          </h3>
        </div>

        {/* Content & Warning */}
        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-slate-600">
          {itemName && (
            <div className="font-bold text-slate-900 text-xs truncate">
              Target Item: <span className="font-mono text-rose-700 font-bold">"{itemName}"</span>
            </div>
          )}

          <p className="text-[11px] leading-relaxed text-slate-600">
            {description || 'Are you sure you want to proceed? This item will be permanently removed from active records and cannot be restored.'}
          </p>

          <div className="text-[10px] text-slate-400 font-medium pt-1 border-t border-slate-200/60">
            Audit logs and historical compliance receipts will be retained.
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition cursor-pointer disabled:opacity-50"
          >
            {cancelButtonText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs transition shadow-md shadow-rose-600/20 hover:scale-[1.02] cursor-pointer disabled:opacity-50"
          >
            {isLoading ? 'Deleting...' : confirmButtonText}
          </button>
        </div>

      </div>
    </div>
  );
}
