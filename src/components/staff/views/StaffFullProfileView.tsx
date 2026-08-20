'use client';

import React, { useState } from 'react';
import { 
  User, 
  ShieldCheck, 
  HeartHandshake, 
  Lock, 
  Edit3, 
  Camera, 
  Upload, 
  CreditCard, 
  FileText,
  AlertCircle,
  CheckCircle2,
  Award,
  Phone,
  MapPin,
  Sparkles
} from 'lucide-react';
import { useApp } from '@/lib/store';
import EditPersonalInfoModal from '../EditPersonalInfoModal';
import EditWorkRightsModal from '../EditWorkRightsModal';
import EditEmergencyContactModal from '../EditEmergencyContactModal';
import BankDetailsModal from '../BankDetailsModal';
import AvatarUploadModal from '../AvatarUploadModal';

export default function StaffFullProfileView() {
  const { currentStaff } = useApp();
  
  const [showPersonalModal, setShowPersonalModal] = useState(false);
  const [showVisaModal, setShowVisaModal] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-150 text-xs">
      
      {/* Header Profile Hero Card */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-navy-950 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            
            {/* Clickable Profile Image Container */}
            <div 
              onClick={() => setShowAvatarModal(true)}
              className="relative group cursor-pointer flex-shrink-0"
              title="Click to upload or change profile photo"
            >
              {currentStaff.avatarUrl ? (
                <img 
                  src={currentStaff.avatarUrl} 
                  alt={currentStaff.firstName} 
                  className="w-20 h-20 rounded-2xl object-cover ring-4 ring-cyan-400/80 shadow-xl group-hover:scale-105 transition"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-slate-800 border-2 border-dashed border-cyan-400/60 flex flex-col items-center justify-center text-cyan-300 group-hover:bg-slate-700 transition">
                  <User className="w-7 h-7 mb-1" />
                  <span className="text-[9px] font-black uppercase tracking-wider">+ Photo</span>
                </div>
              )}

              {/* Hover Badge */}
              <div className="absolute inset-0 rounded-2xl bg-navy-950/70 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center text-white backdrop-blur-2xs">
                <Camera className="w-5 h-5 text-cyan-300 mb-0.5" />
                <span className="text-[9px] font-black tracking-wide text-cyan-300">CHANGE</span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  {currentStaff.firstName} {currentStaff.lastName}
                </h2>
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {currentStaff.status || 'Active'}
                </span>
              </div>
              <p className="text-xs text-cyan-300 font-semibold mt-0.5">
                {currentStaff.jobTitle || 'Staff Member'} • {currentStaff.department || 'General Staff'}
              </p>
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 mt-2">
                <span className="font-mono bg-white/10 px-2 py-0.5 rounded text-white font-bold">{currentStaff.employeeNumber}</span>
                <span>•</span>
                <span>Started: {currentStaff.startDate || 'Recent'}</span>
                <span>•</span>
                <span>Location: {currentStaff.workLocation || 'Sydney, NSW'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowAvatarModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition"
            >
              <Camera className="w-3.5 h-3.5 text-cyan-400" />
              <span>Change Photo</span>
            </button>

            <button
              onClick={() => setShowPersonalModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-navy-950 font-bold text-xs shadow-md shadow-cyan-500/25 transition hover:scale-[1.02] active:scale-[0.98]"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Profile Info</span>
            </button>
          </div>
        </div>
      </div>

      {/* Profile Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* SECTION 1: Personal & Residential Info */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              <span>Personal & Residential Information</span>
            </h3>
            <button
              onClick={() => setShowPersonalModal(true)}
              className="flex items-center gap-1.5 text-[11px] font-extrabold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 px-3 py-1 rounded-xl transition"
            >
              <Edit3 className="w-3 h-3" />
              <span>Edit Details</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-slate-400 font-bold text-[10px] uppercase block mb-0.5">First & Last Name</span>
              <span className="font-bold text-slate-900 text-xs">{currentStaff.firstName} {currentStaff.lastName}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold text-[10px] uppercase block mb-0.5">Date of Birth</span>
              <span className="font-bold text-slate-900 text-xs">{currentStaff.dateOfBirth || 'Not provided yet'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold text-[10px] uppercase block mb-0.5">Gender</span>
              <span className="font-bold text-slate-900 text-xs">{currentStaff.gender || 'Prefer not to say'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold text-[10px] uppercase block mb-0.5">Primary Mobile Phone</span>
              <span className="font-bold text-slate-900 text-xs">{currentStaff.mobilePhone || 'Not provided yet'}</span>
            </div>
            <div className="col-span-2 pt-1 border-t border-slate-100/60">
              <span className="text-slate-400 font-bold text-[10px] uppercase block mb-0.5">Residential Street Address</span>
              <span className="font-bold text-slate-900 text-xs">{currentStaff.address || 'Not provided yet'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold text-[10px] uppercase block mb-0.5">Suburb & State</span>
              <span className="font-bold text-slate-900 text-xs">
                {currentStaff.suburb ? `${currentStaff.suburb}, ${currentStaff.state}` : 'Not provided yet'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 font-bold text-[10px] uppercase block mb-0.5">Postcode</span>
              <span className="font-mono font-bold text-slate-900 text-xs">{currentStaff.postcode || '----'}</span>
            </div>
            {currentStaff.homePhone && (
              <div>
                <span className="text-slate-400 font-bold text-[10px] uppercase block mb-0.5">Home Phone</span>
                <span className="font-bold text-slate-900 text-xs">{currentStaff.homePhone}</span>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 2: Legal Work Rights & Visa Compliance */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Legal Work Rights & Visa Compliance</span>
            </h3>
            <button
              onClick={() => setShowVisaModal(true)}
              className="flex items-center gap-1.5 text-[11px] font-extrabold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 px-3 py-1 rounded-xl transition"
            >
              <Edit3 className="w-3 h-3" />
              <span>Edit Work Rights</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <span className="text-slate-400 font-bold text-[10px] uppercase block mb-0.5">Australian Citizenship Status</span>
              <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                {currentStaff.citizenStatus === 'CITIZEN' ? (
                  <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    🇦🇺 Australian Citizen (Unrestricted)
                  </span>
                ) : currentStaff.citizenStatus === 'PERMANENT_RESIDENT' ? (
                  <span className="text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                    🪪 Permanent Resident (PR)
                  </span>
                ) : currentStaff.citizenStatus === 'VISA_HOLDER' ? (
                  <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    ✈️ Visa Holder (VEVO Verified)
                  </span>
                ) : (
                  <span className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                    Citizenship / Visa details pending
                  </span>
                )}
              </span>
            </div>

            {currentStaff.citizenStatus === 'VISA_HOLDER' && (
              <>
                <div>
                  <span className="text-slate-400 font-bold text-[10px] uppercase block mb-0.5">Visa Subclass</span>
                  <span className="font-bold text-slate-900 text-xs">{currentStaff.visaType || 'TSS 482'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold text-[10px] uppercase block mb-0.5">Visa Expiry Date</span>
                  <span className="font-bold text-rose-600 text-xs">{currentStaff.visaExpiryDate || 'Pending'}</span>
                </div>
              </>
            )}

            <div className="col-span-2">
              <span className="text-slate-400 font-bold text-[10px] uppercase block mb-0.5">Work Rights & Hours Restrictions</span>
              <span className="font-bold text-slate-800 text-xs">{currentStaff.workRestrictions || 'Standard full-time employment rights'}</span>
            </div>

            <div className="col-span-2 pt-2 border-t border-slate-100/60">
              <span className="text-slate-400 font-bold text-[10px] uppercase block mb-1">Driver's License (Forklift & Transport)</span>
              {currentStaff.hasDriverLicense ? (
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 text-xs block">{currentStaff.licenseNumber || 'License on file'}</span>
                    <span className="text-[10px] text-slate-500">State: {currentStaff.licenseCountry || 'NSW'} • Expires: {currentStaff.licenseExpiryDate || 'N/A'}</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                    Verified
                  </span>
                </div>
              ) : (
                <span className="text-slate-400 text-xs font-semibold">No Australian Driver's License recorded</span>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 3: Emergency Next of Kin */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
              <HeartHandshake className="w-4 h-4 text-rose-500" />
              <span>Emergency Next of Kin</span>
            </h3>
            <button
              onClick={() => setShowEmergencyModal(true)}
              className="flex items-center gap-1.5 text-[11px] font-extrabold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 px-3 py-1 rounded-xl transition"
            >
              <Edit3 className="w-3 h-3" />
              <span>Edit Emergency Contact</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-slate-400 font-bold text-[10px] uppercase block mb-0.5">Next of Kin Full Name</span>
              <span className="font-bold text-slate-900 text-xs">{currentStaff.emergencyNextOfKin || 'Not provided yet'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold text-[10px] uppercase block mb-0.5">Relationship</span>
              <span className="font-bold text-slate-900 text-xs">{currentStaff.emergencyRelationship || 'Not provided yet'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold text-[10px] uppercase block mb-0.5">Emergency Mobile Phone</span>
              <span className="font-bold text-slate-900 text-xs">{currentStaff.emergencyMobile || 'Not provided yet'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold text-[10px] uppercase block mb-0.5">Secondary / Home Phone</span>
              <span className="font-bold text-slate-900 text-xs">{currentStaff.emergencyHomePhone || 'N/A'}</span>
            </div>
            <div className="col-span-2 pt-1 border-t border-slate-100/60">
              <span className="text-slate-400 font-bold text-[10px] uppercase block mb-0.5">Emergency Residential Address</span>
              <span className="font-bold text-slate-900 text-xs">
                {currentStaff.emergencyAddress ? `${currentStaff.emergencyAddress}, ${currentStaff.emergencySuburb} ${currentStaff.emergencyState} ${currentStaff.emergencyPostcode}` : 'Not provided yet'}
              </span>
            </div>
          </div>
        </div>

        {/* SECTION 4: Banking & Superannuation (AES-256 Encrypted) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-purple-600" />
              <span>Banking, TFN & Superannuation (Encrypted)</span>
            </h3>
            <button
              onClick={() => setShowBankModal(true)}
              className="flex items-center gap-1.5 text-[11px] font-extrabold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200/80 px-3 py-1 rounded-xl transition"
            >
              <Edit3 className="w-3 h-3" />
              <span>Update Banking</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-slate-400 font-bold text-[10px] uppercase block mb-0.5">Bank Name</span>
              <span className="font-bold text-slate-900 text-xs">{currentStaff.bankName || 'Not provided yet'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold text-[10px] uppercase block mb-0.5">Account Holder</span>
              <span className="font-bold text-slate-900 text-xs">{currentStaff.accountName || `${currentStaff.firstName} ${currentStaff.lastName}`}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold text-[10px] uppercase block mb-0.5">BSB Number</span>
              <span className="font-mono font-bold text-slate-900 text-xs">{currentStaff.bsbMasked || 'Pending details'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold text-[10px] uppercase block mb-0.5">Account Number</span>
              <span className="font-mono font-bold text-slate-900 text-xs">{currentStaff.accountNumberMasked || 'Pending details'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold text-[10px] uppercase block mb-0.5">Tax File Number (TFN)</span>
              <span className="font-mono font-bold text-slate-900 text-xs">{currentStaff.tfnMasked || 'Pending declaration'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold text-[10px] uppercase block mb-0.5">Superannuation Fund</span>
              <span className="font-bold text-slate-900 text-xs">{currentStaff.superFundName || 'Pending choice'}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Dedicated Modals */}
      {showPersonalModal && (
        <EditPersonalInfoModal onClose={() => setShowPersonalModal(false)} />
      )}

      {showVisaModal && (
        <EditWorkRightsModal onClose={() => setShowVisaModal(false)} />
      )}

      {showEmergencyModal && (
        <EditEmergencyContactModal onClose={() => setShowEmergencyModal(false)} />
      )}

      {showBankModal && (
        <BankDetailsModal onClose={() => setShowBankModal(false)} />
      )}

      {showAvatarModal && (
        <AvatarUploadModal onClose={() => setShowAvatarModal(false)} />
      )}

    </div>
  );
}
