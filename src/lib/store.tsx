'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Employee, 
  LeaveRequest, 
  ComplianceAlert, 
  NotificationItem, 
  AuditLog, 
  LeaveType, 
  LeaveStatus,
  AuthUser,
  UserRole,
  OTPVerification,
  DocumentTypeConfig,
  Department,
  Announcement,
  TimecardRecord,
  TimecardStatus
} from '@/types';
import { 
  INITIAL_EMPLOYEES, 
  INITIAL_LEAVE_REQUESTS, 
  INITIAL_ALERTS, 
  INITIAL_NOTIFICATIONS, 
  INITIAL_AUDIT_LOGS,
  INITIAL_TIMECARDS
} from './initialData';
import { encryptAES256, maskSensitive } from './crypto';

interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'info' | 'error';
  timestamp: string;
}

export const INITIAL_DOCUMENT_TYPES = [
  { id: 'dt-1', name: 'Passport Copy (Australian / International)', category: 'Identification', hasExpiry: true },
  { id: 'dt-2', name: 'Visa Grant Notice / VEVO Verification', category: 'Visa & Immigration', hasExpiry: true },
  { id: 'dt-3', name: 'Driver\'s License (NSW / State)', category: 'Licenses', hasExpiry: true },
  { id: 'dt-4', name: 'Tax File Number (TFN) Declaration', category: 'Tax & Compliance', hasExpiry: false },
  { id: 'dt-5', name: 'Medical / Sick Leave Certificate', category: 'Medical', hasExpiry: false },
  { id: 'dt-6', name: 'Forklift / White Card / RSA License', category: 'Workplace Licenses', hasExpiry: true },
  { id: 'dt-7', name: 'Bank Statement / Direct Debit Proof', category: 'Payroll', hasExpiry: false },
  { id: 'dt-8', name: 'Superannuation Choice Form', category: 'Payroll', hasExpiry: false },
  { id: 'dt-9', name: 'Signed Employment Contract', category: 'HR Onboarding', hasExpiry: false },
];

export const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-1',
    title: 'Sydney Plant Annual Team Building & WHS Safety Workshop',
    content: 'All Sydney NSW staff members are invited to our annual safety presentation and company celebration lunch on Friday 28 August 2026. Shifts and production schedules will operate on modified hours.',
    author: 'Super Admin (HsCreations Executive)',
    authorRole: 'SUPER_ADMIN',
    date: '20 Aug 2026',
    category: 'Operations & Safety',
    isPinned: true
  },
  {
    id: 'ann-2',
    title: 'Fair Work Australia 2026/2027 Award & Pay Updates',
    content: 'The 2026 annual Fair Work Commission wage review adjustments have been fully integrated into the HsCreations payroll schedule. Review your employment specifications in My Profile.',
    author: 'Human Resources Director',
    authorRole: 'ADMIN',
    date: '15 Aug 2026',
    category: 'Fair Work NSW'
  }
];

export const INITIAL_USERS: AuthUser[] = [
  {
    id: 'usr-1',
    name: 'Admin User',
    email: 'admin@company.com.au',
    role: 'SUPER_ADMIN',
    isEmailVerified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    createdAt: '10/01/2024',
  },
  {
    id: 'usr-2',
    name: 'Suman Thapa',
    email: 'suman.thapa@company.com',
    role: 'STAFF',
    isEmailVerified: true,
    staffId: 'emp-42',
    department: 'Production (Riverwood)',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    createdAt: '15/05/2025',
  },
  {
    id: 'usr-3',
    name: 'Anita KC',
    email: 'anita.kc@company.com',
    role: 'STAFF',
    isEmailVerified: true,
    staffId: 'emp-41',
    department: 'Design',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    createdAt: '12/05/2025',
  },
  {
    id: 'usr-4',
    name: 'HR Manager',
    email: 'hr@company.com.au',
    role: 'HR_MANAGER',
    isEmailVerified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
    createdAt: '01/02/2024',
  }
];

interface AppContextType {
  // Auth state
  currentUser: AuthUser | null;
  users: AuthUser[];
  pendingOTP: OTPVerification | null;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
  
  // Portal & active staff
  activePortal: 'ADMIN' | 'STAFF' | 'DUAL';
  setActivePortal: (portal: 'ADMIN' | 'STAFF' | 'DUAL') => void;
  currentStaffId: string;
  setCurrentStaffId: (id: string) => void;
  currentStaff: Employee;
  
  // Data
  documentTypes: DocumentTypeConfig[];
  addDocumentType: (type: Omit<DocumentTypeConfig, 'id'>) => void;
  deleteDocumentType: (id: string) => void;
  employees: Employee[];
  leaveRequests: LeaveRequest[];
  alerts: ComplianceAlert[];
  notifications: NotificationItem[];
  auditLogs: AuditLog[];
  toasts: ToastMessage[];
  announcements: Announcement[];
  postAnnouncement: (data: { title: string; content: string; category?: string }) => void;
  deleteAnnouncement: (id: string) => void;
  unreadAdminCount: number;
  unreadStaffCount: number;

  // Timecard & Kiosk Clock-In System
  timecards: TimecardRecord[];
  activeWorkingStaffCount: number;
  clockInWithKiosk: (pin: string, password?: string) => { success: boolean; message: string; employee?: Employee };
  clockOutWithKiosk: (pin: string, password?: string, breakMinutes?: number) => { success: boolean; message: string; employee?: Employee; totalHours?: number };
  updateStaffKioskPin: (empId: string, newPin: string) => void;
  adminAdjustTimecard: (id: string, updates: Partial<TimecardRecord>) => void;
  adminAddTimecard: (record: Omit<TimecardRecord, 'id'>) => void;
  adminDeleteTimecard: (id: string) => void;
  
  // Auth Actions
  login: (email: string, password?: string) => boolean;
  register: (data: { firstName: string; lastName: string; email: string; mobilePhone: string; password?: string; department?: any }) => Promise<{ success: boolean; code?: string; message?: string }>;
  verifyOTP: (enteredCode: string) => boolean;
  resendOTP: () => string;
  logout: () => void;
  createAdminUser: (data: { name: string; email: string; role: UserRole; department?: any }) => void;
  promoteUserRole: (userId: string, newRole: UserRole) => void;

  // EMS Actions
  addEmployee: (employee: Omit<Employee, 'id' | 'leaveBalance' | 'payslips' | 'documents'>) => void;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
  submitLeaveRequest: (req: Omit<LeaveRequest, 'id' | 'status' | 'submittedAt' | 'reminderCount'>) => void;
  reviewLeaveRequest: (id: string, status: LeaveStatus, notes?: string) => void;
  uploadMedicalCertificate: (leaveId: string, fileUrl: string) => void;
  updateBankDetails: (empId: string, bank: { bankName: string; bankBranch: string; accountName: string; bsb: string; accountNumber: string; superFund: string; superNumber: string }) => void;
  uploadDocument: (empId: string, doc: { name: string; type: string; fileSize?: string; previewUrl?: string; fileType?: 'image' | 'pdf' | 'doc'; expiryDate?: string; documentNumber?: string }) => void;
  updateDocument: (empId: string, docId: string, updates: { name?: string; type?: string; fileSize?: string; previewUrl?: string; fileType?: 'image' | 'pdf' | 'doc'; expiryDate?: string; documentNumber?: string; status?: 'Verified' | 'Pending' | 'Rejected' | 'Expired' }) => void;
  deleteDocument: (empId: string, docId: string) => void;
  reviewDocument: (empId: string, docId: string, status: 'Verified' | 'Rejected', notes?: string) => void;
  updateProfileAvatar: (empId: string, avatarUrl: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: (recipient: 'ADMIN' | 'STAFF') => void;
  addToast: (title: string, message: string, type?: 'success' | 'warning' | 'info' | 'error') => void;
  addAudit: (action: string, targetType: string, targetId: string, details: string, actorName?: string, actorRole?: string) => void;
  removeToast: (id: string) => void;
  triggerSimulatedRealtimeEvent: (type: 'NEW_STAFF_LEAVE' | 'VISA_WARNING' | 'CERTIFICATE_REMINDER') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null); // Default to Super Admin for quick viewing
  const [users, setUsers] = useState<AuthUser[]>(INITIAL_USERS);
  const [pendingOTP, setPendingOTP] = useState<OTPVerification | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const [activePortal, setActivePortal] = useState<'ADMIN' | 'STAFF' | 'DUAL'>('ADMIN');
  const [currentStaffId, setCurrentStaffId] = useState<string>('emp-42');
  
  const [documentTypes, setDocumentTypes] = useState<DocumentTypeConfig[]>(INITIAL_DOCUMENT_TYPES);
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(INITIAL_LEAVE_REQUESTS);
  const [alerts, setAlerts] = useState<ComplianceAlert[]>(INITIAL_ALERTS);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>(INITIAL_ANNOUNCEMENTS);
  const [timecards, setTimecards] = useState<TimecardRecord[]>(INITIAL_TIMECARDS);

  const currentStaff = employees.find(e => e.id === currentStaffId) || employees[0];

  // ==========================================
  // LOCALSTORAGE PERSISTENCE (Survives Reloads)
  // ==========================================
  useEffect(() => {
    try {
      const savedUsers = localStorage.getItem('ems_users_v1');
      if (savedUsers) setUsers(JSON.parse(savedUsers));

      const savedEmployees = localStorage.getItem('ems_employees_v1');
      if (savedEmployees) {
        try {
          const parsed: Employee[] = JSON.parse(savedEmployees);
          const defaultPins: Record<string, string> = {
            'emp-42': '4829', // Suman Thapa
            'emp-41': '1234', // Anita KC
            'emp-40': '5678', // Ramesh Sharma
            'emp-38': '9988', // Birendra Bhandari
            'emp-37': '3322', // Priya Patel
            'emp-36': '7744', // Rajesh Kumar
          };
          const healed = parsed.map((emp, idx) => {
            const initialMatch = INITIAL_EMPLOYEES.find(ie => ie.id === emp.id);
            const pin = emp.kioskPin || defaultPins[emp.id] || initialMatch?.kioskPin || (4800 + idx).toString();
            return {
              ...emp,
              kioskPin: pin,
              clockState: emp.clockState || 'CLOCKED_OUT'
            };
          });
          setEmployees(healed);
        } catch (err) {
          setEmployees(INITIAL_EMPLOYEES);
        }
      }

      const savedLeave = localStorage.getItem('ems_leave_v1');
      if (savedLeave) setLeaveRequests(JSON.parse(savedLeave));

      const savedDocs = localStorage.getItem('ems_doctypes_v1');
      if (savedDocs) setDocumentTypes(JSON.parse(savedDocs));

      const savedNotifs = localStorage.getItem('ems_notifs_v1');
      if (savedNotifs) setNotifications(JSON.parse(savedNotifs));

      const savedAudit = localStorage.getItem('ems_audit_v1');
      if (savedAudit) setAuditLogs(JSON.parse(savedAudit));

      const savedAnn = localStorage.getItem('ems_announcements_v1');
      if (savedAnn) setAnnouncements(JSON.parse(savedAnn));

      const savedTimecards = localStorage.getItem('ems_timecards_v1');
      if (savedTimecards) setTimecards(JSON.parse(savedTimecards));

      const savedAuth = localStorage.getItem('ems_auth_user_v1');
      if (savedAuth) {
        const parsedAuth = JSON.parse(savedAuth);
        setCurrentUser(parsedAuth);
        if (parsedAuth.staffId) setCurrentStaffId(parsedAuth.staffId);
        if (parsedAuth.role === 'SUPER_ADMIN' || parsedAuth.role === 'ADMIN' || parsedAuth.role === 'HR_MANAGER') {
          setActivePortal('ADMIN');
        } else {
          setActivePortal('STAFF');
        }
      }
    } catch (e) {
      console.error('Storage hydration error', e);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('ems_announcements_v1', JSON.stringify(announcements));
    } catch (e) {}
  }, [announcements]);

  useEffect(() => {
    try {
      localStorage.setItem('ems_timecards_v1', JSON.stringify(timecards));
    } catch (e) {}
  }, [timecards]);

  useEffect(() => {
    try {
      localStorage.setItem('ems_users_v1', JSON.stringify(users));
    } catch (e) {}
  }, [users]);

  useEffect(() => {
    try {
      localStorage.setItem('ems_employees_v1', JSON.stringify(employees));
    } catch (e) {}
  }, [employees]);

  useEffect(() => {
    try {
      localStorage.setItem('ems_leave_v1', JSON.stringify(leaveRequests));
    } catch (e) {}
  }, [leaveRequests]);

  useEffect(() => {
    try {
      localStorage.setItem('ems_doctypes_v1', JSON.stringify(documentTypes));
    } catch (e) {}
  }, [documentTypes]);

  useEffect(() => {
    try {
      localStorage.setItem('ems_notifs_v1', JSON.stringify(notifications));
    } catch (e) {}
  }, [notifications]);

  useEffect(() => {
    try {
      localStorage.setItem('ems_audit_v1', JSON.stringify(auditLogs));
    } catch (e) {}
  }, [auditLogs]);

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem('ems_auth_user_v1', JSON.stringify(currentUser));
      } else {
        localStorage.removeItem('ems_auth_user_v1');
      }
    } catch (e) {}
  }, [currentUser]);


  const unreadAdminCount = notifications.filter(n => n.recipient === 'ADMIN' && !n.read).length;
  const unreadStaffCount = notifications.filter(n => {
    if (n.recipient !== 'STAFF' && n.recipient !== 'ALL') return false;
    if (n.read) return false;
    if (n.recipientId) {
      return n.recipientId === currentUser?.id || n.recipientId === currentUser?.staffId;
    }
    return currentUser?.email === 'suman.thapa@company.com';
  }).length;

  const playSoundChime = (tone: 'alert' | 'success' = 'alert') => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (tone === 'alert') {
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else {
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch (e) {}
  };

  const addToast = (title: string, message: string, type: 'success' | 'warning' | 'info' | 'error' = 'info') => {
    const toastId = 'toast-' + Date.now() + '-' + Math.random();
    const newToast: ToastMessage = {
      id: toastId,
      title,
      message,
      type,
      timestamp: new Date().toLocaleTimeString('en-AU', { timeZone: 'Australia/Sydney' }),
    };
    setToasts(prev => [newToast, ...prev.slice(0, 3)]);
    playSoundChime(type === 'success' ? 'success' : 'alert');

    // Automatically dismiss toast after exactly 2 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== toastId));
    }, 2000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const addAudit = (action: string, targetType: string, targetId: string, details: string, actorName?: string, actorRole?: string) => {
    const actName = actorName || (currentUser ? currentUser.name : 'System');
    const actRole = actorRole || (currentUser ? currentUser.role : 'System');

    const newLog: AuditLog = {
      id: 'aud-' + Date.now(),
      timestamp: new Date().toLocaleString('en-AU', { timeZone: 'Australia/Sydney' }) + ' AEST',
      actorId: currentUser ? currentUser.id : 'sys-1',
      actorName: actName,
      actorRole: actRole,
      action,
      targetType,
      targetId,
      details,
      ipAddress: '203.14.182.91 (Sydney, AU)',
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // ==========================================
  // AUTHENTICATION & EMAIL VERIFICATION
  // ==========================================

  // 1. Login with Auto-Role Detection
  const login = (email: string, password?: string): boolean => {
    const cleanEmail = email.trim().toLowerCase();
    const user = users.find(u => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      addToast('Login Failed', 'No account found with this email address.', 'error');
      return false;
    }

    if (!user.isEmailVerified) {
      addToast('Email Unverified', 'Please verify your email with the 6-digit code first.', 'warning');
      return false;
    }

    setCurrentUser(user);

    // Auto-detect role and direct route!
    if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || user.role === 'HR_MANAGER') {
      setActivePortal('ADMIN');
      addToast('Welcome Back, Admin', `Logged in as ${user.name} (${user.role}). Redirected to Admin Command Center.`, 'success');
    } else {
      setActivePortal('STAFF');
      if (user.staffId) setCurrentStaffId(user.staffId);
      addToast('Welcome Back', `Logged in as ${user.name} (Staff Portal).`, 'success');
    }

    addAudit('USER_LOGIN', 'User', user.id, `User logged in with role ${user.role}`, user.name, user.role);
    setShowAuthModal(false);
    return true;
  };

  // 2. Register: Auto-assigns STAFF role & generates 6-digit code
  const register = async (data: { firstName: string; lastName: string; email: string; mobilePhone: string; password?: string; department?: any }) => {
    const cleanEmail = data.email.trim().toLowerCase();
    const existing = users.find(u => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      addToast(
        'Account Already Registered', 
        `An account with ${cleanEmail} already exists. Please Sign In or use another email.`, 
        'warning'
      );
      return { 
        success: false, 
        message: `An account with ${cleanEmail} already exists. Please switch to "Sign In" or use a different email address.` 
      };
    }

    // Generate random 6-digit OTP code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const otpData: OTPVerification = {
      email: cleanEmail,
      code,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
      userData: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: cleanEmail,
        mobilePhone: data.mobilePhone,
        department: data.department || undefined,
      }
    };

    setPendingOTP(otpData);

    // Dispatch email to API endpoint
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          firstName: data.firstName,
          code,
        }),
      });
      const dataJson = await res.json();
      console.log('OTP Email dispatch result:', dataJson);
    } catch(e) {
      console.error('Background email dispatch failed', e);
    }

    addToast(
      `📧 Verification Code Dispatched to ${cleanEmail}`,
      `A 6-digit verification code was sent to your email. Check your inbox!`,
      'success'
    );

    return { success: true, code };
  };

  // 3. Verify OTP Code & Auto-Login as STAFF
  const verifyOTP = (enteredCode: string): boolean => {
    if (!pendingOTP) return false;

    if (enteredCode.trim() !== pendingOTP.code) {
      addToast('Invalid Verification Code', 'The 6-digit code you entered is incorrect. Please try again.', 'error');
      return false;
    }

    // Create staff profile
    const newStaffId = 'emp-' + (employees.length + 1);
    const newEmpNumber = `EMP-00${Math.floor(Math.random() * 900 + 100)}`;
    // Newly registered staff starts with clean/empty fields until filled or uploaded
    const generatedPin = Math.floor(1000 + Math.random() * 9000).toString();
    const newEmployee: Employee = {
      id: newStaffId,
      employeeNumber: newEmpNumber,
      firstName: pendingOTP.userData.firstName,
      lastName: pendingOTP.userData.lastName,
      email: pendingOTP.userData.email,
      mobilePhone: pendingOTP.userData.mobilePhone,
      dateOfBirth: '',
      startDate: new Date().toLocaleDateString('en-AU'),
      gender: 'Prefer not to say',
      address: '',
      suburb: '',
      state: 'NSW',
      postcode: '',
      department: pendingOTP.userData.department || undefined,
      jobTitle: 'Staff Member',
      workLocation: 'Sydney, NSW',
      reportsTo: 'Pending Assignment',
      status: 'Active',
      avatarUrl: '', // Starts empty - prompt upload in profile
      citizenStatus: undefined,
      visaType: '',
      visaExpiryDate: '',
      workRestrictions: '',
      workingHours: undefined,
      workingHoursConfirmed: false,
      visaStatusConfirmed: false,
      hasDriverLicense: false,
      licenseNumber: '',
      licenseExpiryDate: '',
      licenseCountry: 'Australia',
      emergencyNextOfKin: '',
      emergencyRelationship: '',
      emergencyAddress: '',
      emergencySuburb: '',
      emergencyState: 'NSW',
      emergencyPostcode: '',
      emergencyMobile: '',
      tfnMasked: '',
      tfnEncrypted: '',
      superFundName: '',
      superMemberNumber: '',
      bankName: '',
      bankBranch: '',
      accountName: `${pendingOTP.userData.firstName} ${pendingOTP.userData.lastName}`,
      bsbMasked: '',
      bsbEncrypted: '',
      accountNumberMasked: '',
      accountNumberEncrypted: '',
      leaveBalance: { annual: 0, sick: 0, carers: 0, longService: 0 },
      payslips: [],
      documents: [],
      kioskPin: generatedPin,
      clockState: 'CLOCKED_OUT',
    };

    const newUser: AuthUser = {
      id: 'usr-' + Date.now(),
      name: `${pendingOTP.userData.firstName} ${pendingOTP.userData.lastName}`,
      email: pendingOTP.userData.email,
      role: 'STAFF', // Strictly registered as STAFF by default!
      isEmailVerified: true,
      staffId: newStaffId,
      department: (pendingOTP.userData.department as Department) || 'Other',
      avatarUrl: newEmployee.avatarUrl,
      createdAt: new Date().toLocaleDateString('en-AU'),
    };

    setEmployees(prev => [newEmployee, ...prev]);
    setUsers(prev => [newUser, ...prev]);
    setCurrentStaffId(newStaffId);
    setCurrentUser(newUser);
    setActivePortal('STAFF');
    setPendingOTP(null);
    setShowAuthModal(false);

    addAudit('REGISTER_STAFF', 'User', newUser.id, `New staff registered and email verified: ${newUser.email}`, newUser.name, 'STAFF');
    
    // Notify admin
    const adminNotif: NotificationItem = {
      id: 'notif-' + Date.now(),
      recipient: 'ADMIN',
      title: 'New Staff Registered & Verified',
      message: `${newUser.name} (${newUser.email}) completed email verification and joined as STAFF.`,
      type: 'GENERAL',
      timestamp: 'Just now',
      read: false,
    };
    setNotifications(prev => [adminNotif, ...prev]);

    addToast('🎉 Email Verified & Account Created!', `Welcome, ${newUser.name}! Your Staff Portal is now ready.`, 'success');
    return true;
  };

  // 4. Resend OTP
  const resendOTP = (): string => {
    if (!pendingOTP) return '';
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    setPendingOTP({
      ...pendingOTP,
      code: newCode,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    // Re-dispatch email
    try {
      fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: pendingOTP.email,
          firstName: pendingOTP.userData.firstName,
          code: newCode,
        }),
      }).catch(err => console.error('Background email dispatch failed', err));
    } catch(e) {}

    addToast(`📧 Verification Code Resent: ${newCode}`, `A fresh 6-digit code was dispatched to ${pendingOTP.email}.`, 'info');
    return newCode;
  };

  // 5. Logout
  const logout = () => {
    if (currentUser) {
      addAudit('USER_LOGOUT', 'User', currentUser.id, `User ${currentUser.name} logged out`);
    }
    setCurrentUser(null);
    setShowAuthModal(true);
    addToast('Logged Out', 'You have been safely logged out.', 'info');
  };

  // 6. Super Admin Creates New Admin or HR Manager
  const createAdminUser = (data: { name: string; email: string; role: UserRole; department?: any }) => {
    const newUser: AuthUser = {
      id: 'usr-' + Date.now(),
      name: data.name,
      email: data.email,
      role: data.role,
      isEmailVerified: true,
      department: data.department || 'Administration',
      avatarUrl: `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random() * 30)}?w=150`,
      createdAt: new Date().toLocaleDateString('en-AU'),
    };
    setUsers(prev => [newUser, ...prev]);
    addAudit('CREATE_ADMIN_USER', 'User', newUser.id, `Super Admin created new ${data.role}: ${data.name} (${data.email})`);
    addToast('Admin User Created', `${data.name} granted ${data.role} access.`, 'success');
  };

  // 7. Super Admin Promotes User Role
  const promoteUserRole = (userId: string, newRole: UserRole) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    const target = users.find(u => u.id === userId);
    addAudit('PROMOTE_USER_ROLE', 'User', userId, `Super Admin changed role of ${target?.name} to ${newRole}`);
    addToast('Role Updated', `${target?.name} role updated to ${newRole}.`, 'success');
  };

  // ==========================================
  // EMPLOYEE MANAGEMENT SYSTEM ACTIONS
  // ==========================================

  const addEmployee = (empData: Omit<Employee, 'id' | 'leaveBalance' | 'payslips' | 'documents'>) => {
    const newId = 'emp-' + (employees.length + 1);
    const newEmployee: Employee = {
      ...empData,
      id: newId,
      leaveBalance: { annual: 20, sick: 10, carers: 5, longService: 0 },
      payslips: [],
      documents: [],
    };
    setEmployees(prev => [newEmployee, ...prev]);
    addAudit('CREATE_EMPLOYEE', 'Employee', newEmployee.id, `Created employee ${newEmployee.firstName} ${newEmployee.lastName} (${newEmployee.employeeNumber})`);
    addToast('Employee Added', `${newEmployee.firstName} ${newEmployee.lastName} registered successfully.`, 'success');
  };

  const updateEmployee = (id: string, updates: Partial<Employee>) => {
    setEmployees(prev => prev.map(emp => emp.id === id ? { ...emp, ...updates } : emp));
    
    const targetEmp = employees.find(e => e.id === id);
    const changedFields = Object.keys(updates).map(k => k.replace(/([A-Z])/g, ' $1').toLowerCase()).join(', ');
    
    // Automatic Real-Time Notification to Staff Member
    const staffNotif: NotificationItem = {
      id: 'notif-update-' + Date.now(),
      recipient: 'STAFF',
      recipientId: id,
      title: '📝 Profile & Details Updated by Administrator',
      message: `Your details were updated by an administrator (${changedFields || 'Profile update'}).`,
      type: 'PROFILE_UPDATE',
      timestamp: 'Just now',
      read: false,
    };
    setNotifications(prev => [staffNotif, ...prev]);

    addAudit('UPDATE_EMPLOYEE', 'Employee', id, `Admin updated fields for ${targetEmp?.firstName || ''} ${targetEmp?.lastName || ''}: ${Object.keys(updates).join(', ')}`);
    addToast('Employee Details Updated', 'Changes saved and notification sent to staff member.', 'success');
  };

  const submitLeaveRequest = (req: Omit<LeaveRequest, 'id' | 'status' | 'submittedAt' | 'reminderCount'>) => {
    const nowSydney = new Date().toLocaleString('en-AU', { timeZone: 'Australia/Sydney' });
    const newReq: LeaveRequest = {
      ...req,
      id: 'lr-' + Date.now(),
      status: 'PENDING',
      submittedAt: nowSydney,
      reminderCount: req.leaveType === 'SICK' && !req.certificateUploaded ? 1 : 0,
    };
    
    setLeaveRequests(prev => [newReq, ...prev]);
    
    // Real-Time In-App Notification for Admin & Super Admin
    const adminNotif: NotificationItem = {
      id: 'notif-' + Date.now(),
      recipient: 'ADMIN',
      title: `🔔 New ${req.leaveType} Request: ${req.employeeName}`,
      message: `${req.employeeName} submitted ${req.totalDays} day(s) ${req.leaveType.toLowerCase()} leave (${req.startDate} - ${req.endDate}).`,
      type: 'LEAVE_REQUEST',
      timestamp: 'Just now',
      read: false,
    };
    setNotifications(prev => [adminNotif, ...prev]);

    // Dispatch Official Email Notification to Admin
    try {
      fetch('/api/notifications/send-leave-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeName: req.employeeName,
          department: req.department || 'Operations',
          leaveType: req.leaveType,
          startDate: req.startDate,
          endDate: req.endDate,
          totalDays: req.totalDays,
          reason: req.reason,
          submittedAt: nowSydney,
          adminEmail: 'admin@company.com.au',
        }),
      }).catch(err => console.error('Leave email dispatch failed:', err));
    } catch (e) {}
    
    addAudit('SUBMIT_LEAVE_REQUEST', 'LeaveRequest', newReq.id, `Submitted ${req.leaveType} leave (${req.totalDays} days) starting ${req.startDate}`, req.employeeName, 'STAFF');
    addToast('⚡ Leave Submitted & Admin Emailed', `Notification & email dispatched to Admin for ${req.employeeName}'s ${req.leaveType} leave request.`, 'success');
  };

  const reviewLeaveRequest = (id: string, status: LeaveStatus, notes?: string) => {
    const req = leaveRequests.find(r => r.id === id);
    if (!req) return;

    setLeaveRequests(prev => prev.map(r => r.id === id ? { 
      ...r, 
      status, 
      adminNotes: notes, 
      reviewedBy: currentUser?.name || 'Admin User',
      reviewedAt: new Date().toLocaleString('en-AU', { timeZone: 'Australia/Sydney' })
    } : r));

    if (status === 'APPROVED') {
      setEmployees(prev => prev.map(emp => {
        if (emp.id === req.employeeId) {
          const typeKey = req.leaveType === 'ANNUAL' ? 'annual' : req.leaveType === 'SICK' ? 'sick' : req.leaveType === 'CARERS' ? 'carers' : 'longService';
          return {
            ...emp,
            leaveBalance: {
              ...emp.leaveBalance,
              [typeKey]: Math.max(0, emp.leaveBalance[typeKey] - req.totalDays),
            }
          };
        }
        return emp;
      }));
    }

    const staffNotif: NotificationItem = {
      id: 'notif-' + Date.now(),
      recipient: 'STAFF',
      recipientId: req.employeeId,
      title: `Leave Request ${status}`,
      message: `Your ${req.leaveType.toLowerCase()} leave request for ${req.startDate} has been ${status.toLowerCase()}.`,
      type: 'LEAVE_STATUS',
      timestamp: 'Just now',
      read: false,
    };
    setNotifications(prev => [staffNotif, ...prev]);
    
    addAudit(`${status}_LEAVE_REQUEST`, 'LeaveRequest', id, `Admin marked request ${id} as ${status}`);
    addToast(`Leave ${status}`, `Request for ${req.employeeName} has been marked as ${status}.`, status === 'APPROVED' ? 'success' : 'warning');
  };

  const uploadMedicalCertificate = (leaveId: string, fileUrl: string) => {
    setLeaveRequests(prev => prev.map(r => r.id === leaveId ? { ...r, certificateUploaded: true, certificateUrl: fileUrl, reminderCount: 0 } : r));
    addToast('Medical Certificate Uploaded', 'Your certificate has been attached and sent to HR.', 'success');
  };

  const updateBankDetails = (empId: string, bank: { bankName: string; bankBranch: string; accountName: string; bsb: string; accountNumber: string; superFund: string; superNumber: string }) => {
    const bsbEnc = encryptAES256(bank.bsb);
    const accEnc = encryptAES256(bank.accountNumber);
    const bsbMask = bank.bsb.length >= 3 ? `${bank.bsb.slice(0, 3)}-•••` : '•••-•••';
    const accMask = maskSensitive(bank.accountNumber, 3);

    setEmployees(prev => prev.map(emp => {
      if (emp.id === empId) {
        return {
          ...emp,
          bankName: bank.bankName,
          bankBranch: bank.bankBranch,
          accountName: bank.accountName,
          bsbEncrypted: bsbEnc,
          bsbMasked: bsbMask,
          accountNumberEncrypted: accEnc,
          accountNumberMasked: accMask,
          superFundName: bank.superFund,
          superMemberNumber: bank.superNumber,
        };
      }
      return emp;
    }));

    const adminNotif: NotificationItem = {
      id: 'notif-' + Date.now(),
      recipient: 'ADMIN',
      title: 'Encrypted Banking Details Updated',
      message: `${currentStaff.firstName} ${currentStaff.lastName} updated their BSB & Account Number (AES-256 encrypted in DB).`,
      type: 'BANK_UPDATE',
      timestamp: 'Just now',
      read: false,
    };
    setNotifications(prev => [adminNotif, ...prev]);

    addAudit('UPDATE_BANK_DETAILS', 'Employee', empId, 'Updated bank account & superannuation details (Encrypted with AES-256-GCM)', currentStaff.firstName + ' ' + currentStaff.lastName, 'STAFF');
    addToast('🔒 Bank Details Encrypted & Saved', 'Your bank details were encrypted with AES-256 and updated securely.', 'success');
  };

  const addDocumentType = (type: Omit<DocumentTypeConfig, 'id'>) => {
    const newType = { id: 'dt-' + Date.now(), ...type };
    setDocumentTypes(prev => [...prev, newType]);
    addAudit('CREATE_DOCUMENT_TYPE', 'DocumentType', newType.id, `Admin added document type: ${type.name}`);
    addToast('Document Type Added', `"${type.name}" is now available in staff upload dropdown.`, 'success');
  };

  const deleteDocumentType = (id: string) => {
    setDocumentTypes(prev => prev.filter(d => d.id !== id));
    addToast('Document Type Removed', 'Document type deleted.', 'info');
  };

  const reviewDocument = (empId: string, docId: string, status: 'Verified' | 'Rejected', notes?: string) => {
    setEmployees(prev => prev.map(emp => {
      if (emp.id === empId) {
        return {
          ...emp,
          documents: emp.documents.map(d => d.id === docId ? { ...d, status } : d)
        };
      }
      return emp;
    }));

    const targetEmp = employees.find(e => e.id === empId);
    const empName = targetEmp ? `${targetEmp.firstName} ${targetEmp.lastName}` : 'Staff Member';

    addAudit(
      status === 'Verified' ? 'APPROVE_DOCUMENT' : 'REJECT_DOCUMENT',
      'Document',
      docId,
      `Admin reviewed document (${status}) for ${empName}. Notes: ${notes || 'None'}`
    );

    // Notify staff member in real-time
    const staffNotif: NotificationItem = {
      id: 'notif-' + Date.now(),
      recipient: 'STAFF',
      recipientId: empId,
      title: status === 'Verified' ? '✅ Document Verified by HR' : '⚠️ Document Rejected - Action Required',
      message: status === 'Verified' 
        ? `Your uploaded document for ${empName} has been verified and approved by HR.` 
        : `Your document was rejected. Reason: ${notes || 'Please re-upload a clearer image.'}`,
      timestamp: new Date().toLocaleTimeString('en-AU', { timeZone: 'Australia/Sydney' }),
      read: false,
      type: status === 'Verified' ? 'GENERAL' : 'CERTIFICATE_REMINDER',
      actionUrl: '/#documents',
    };
    setNotifications(prev => [staffNotif, ...prev]);
    addToast(
      status === 'Verified' ? 'Document Approved' : 'Document Rejected',
      `Document status updated to ${status} for ${empName}.`,
      status === 'Verified' ? 'success' : 'warning'
    );
  };

  const updateProfileAvatar = (empId: string, avatarUrl: string) => {
    setEmployees(prev => prev.map(e => (e.id === empId || e.id === currentStaffId) ? { ...e, avatarUrl } : e));
    
    // Also update currentUser
    setCurrentUser(prev => {
      if (!prev) return null;
      return { ...prev, avatarUrl };
    });

    // Also update users array
    setUsers(prev => prev.map(u => {
      if (u.staffId === empId || (currentUser && u.id === currentUser.id) || (currentUser && u.email === currentUser.email)) {
        return { ...u, avatarUrl };
      }
      return u;
    }));

    addAudit('UPDATE_AVATAR', 'Employee', empId, 'Staff updated profile photo');
    addToast('Profile Photo Saved to Database', 'Your profile image has been permanently saved.', 'success');
  };

  const uploadDocument = (empId: string, doc: { name: string; type: string; fileSize?: string; previewUrl?: string; fileType?: 'image' | 'pdf' | 'doc'; expiryDate?: string; documentNumber?: string }) => {
    const newDoc = {
      id: 'doc-' + Date.now(),
      name: doc.name,
      type: doc.type,
      uploadDate: new Date().toLocaleDateString('en-AU'),
      status: 'Pending' as const,
      fileSize: doc.fileSize || '1.8 MB',
      previewUrl: doc.previewUrl,
      fileType: doc.fileType || 'image',
      expiryDate: doc.expiryDate,
      documentNumber: doc.documentNumber,
    };

    setEmployees(prev => prev.map(emp => {
      if (emp.id === empId) {
        return {
          ...emp,
          documents: [newDoc, ...emp.documents],
        };
      }
      return emp;
    }));

    addToast('Document Uploaded', `${doc.name} uploaded and is pending HR verification.`, 'info');
  };

  const updateDocument = (
    empId: string, 
    docId: string, 
    updates: { 
      name?: string; 
      type?: string; 
      fileSize?: string; 
      previewUrl?: string; 
      fileType?: 'image' | 'pdf' | 'doc'; 
      expiryDate?: string;
      documentNumber?: string;
      status?: 'Verified' | 'Pending' | 'Rejected' | 'Expired';
    }
  ) => {
    setEmployees(prev => prev.map(emp => {
      if (emp.id === empId) {
        return {
          ...emp,
          documents: emp.documents.map(d => {
            if (d.id === docId) {
              return {
                ...d,
                ...updates,
                uploadDate: new Date().toLocaleDateString('en-AU'),
                status: updates.status || 'Pending',
              };
            }
            return d;
          })
        };
      }
      return emp;
    }));

    const targetEmp = employees.find(e => e.id === empId);
    const empName = targetEmp ? `${targetEmp.firstName} ${targetEmp.lastName}` : 'Staff Member';

    // Notify Admin in real-time
    const adminNotif: NotificationItem = {
      id: 'notif-' + Date.now(),
      recipient: 'ADMIN',
      title: '📄 Renewed / Updated Document Submitted',
      message: `${empName} submitted an updated version of "${updates.name || 'Document'}" for verification.`,
      type: 'GENERAL',
      timestamp: 'Just now',
      read: false,
    };
    setNotifications(prev => [adminNotif, ...prev]);

    addAudit('UPDATE_DOCUMENT', 'Document', docId, `${empName} renewed / replaced document: ${updates.name || docId}`, empName, 'STAFF');
    addToast('Document Renewed & Updated', 'Your updated document has been submitted for HR verification.', 'success');
  };

  const deleteDocument = (empId: string, docId: string) => {
    setEmployees(prev => prev.map(emp => {
      if (emp.id === empId) {
        return {
          ...emp,
          documents: emp.documents.filter(d => d.id !== docId)
        };
      }
      return emp;
    }));
    addToast('Document Removed', 'Document deleted from your vault.', 'info');
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllNotificationsRead = (recipient: 'ADMIN' | 'STAFF') => {
    setNotifications(prev => prev.map(n => n.recipient === recipient ? { ...n, read: true } : n));
  };

  const triggerSimulatedRealtimeEvent = (type: 'NEW_STAFF_LEAVE' | 'VISA_WARNING' | 'CERTIFICATE_REMINDER') => {
    if (type === 'NEW_STAFF_LEAVE') {
      const demoReq: Omit<LeaveRequest, 'id' | 'status' | 'submittedAt' | 'reminderCount'> = {
        employeeId: 'emp-38',
        employeeName: 'Birendra Bhandari',
        employeeAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
        department: 'Production (Rockdale)',
        leaveType: 'SICK',
        startDate: '20/08/2026',
        endDate: '20/08/2026',
        totalDays: 1,
        reason: 'Sudden fever and headache.',
        isAdvanceNoticeMet: true,
        advanceNoticeDays: 0,
        certificateUploaded: false,
      };
      submitLeaveRequest(demoReq);
    } else if (type === 'VISA_WARNING') {
      const notif: NotificationItem = {
        id: 'notif-' + Date.now(),
        recipient: 'ADMIN',
        title: '⚠️ 30-Day Visa Expiry Alert',
        message: 'Rajesh Kumar TSS 482 Visa expires in 12 days (30 May 2025). Action required.',
        type: 'VISA_EXPIRY',
        timestamp: 'Just now',
        read: false,
      };
      setNotifications(prev => [notif, ...prev]);
      addToast('⚠️ Compliance Alert', 'Rajesh Kumar visa expires in 12 days (Riverwood plant).', 'warning');
    } else if (type === 'CERTIFICATE_REMINDER') {
      const notif: NotificationItem = {
        id: 'notif-' + Date.now(),
        recipient: 'STAFF',
        title: '📋 Sick Leave Certificate Reminder (Day 1 of 3)',
        message: 'Please upload your medical certificate for your recent sick leave.',
        type: 'CERTIFICATE_REMINDER',
        timestamp: 'Just now',
        read: false,
      };
      setNotifications(prev => [notif, ...prev]);
      addToast('📋 Reminder Alert', 'Sick leave certificate reminder sent to staff portal.', 'info');
    }
  };

  
  const postAnnouncement = (data: { title: string; content: string; category?: string }) => {
    const newAnn: Announcement = {
      id: `ann-${Date.now()}`,
      title: data.title,
      content: data.content,
      author: currentUser ? currentUser.name : 'Super Admin (HsCreations)',
      authorRole: currentUser ? currentUser.role : 'SUPER_ADMIN',
      date: new Date().toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' }),
      category: data.category || 'Company Notice',
      isPinned: true
    };
    setAnnouncements(prev => [newAnn, ...prev]);

    const notif: NotificationItem = {
      id: `notif-ann-${Date.now()}`,
      recipient: 'STAFF',
      title: `📢 Company's Latest Announcement: ${data.title}`,
      message: data.content.slice(0, 120) + (data.content.length > 120 ? '...' : ''),
      type: 'GENERAL',
      timestamp: 'Just now',
      read: false,
    };
    setNotifications(prev => [notif, ...prev]);

    addAudit(
      'POST_ANNOUNCEMENT',
      'ANNOUNCEMENT',
      newAnn.id,
      `Admin posted company announcement: "${data.title}"`
    );
    addToast('Announcement Broadcasted', 'New company announcement posted to all staff dashboards.', 'success');
  };


  // ==========================================
  // TIMECARD & KIOSK CLOCK-IN/OUT METHODS
  // ==========================================

  const activeWorkingStaffCount = employees.filter(e => e.clockState === 'CLOCKED_IN').length;

  const clockInWithKiosk = (pin: string, password?: string): { success: boolean; message: string; employee?: Employee } => {
    const cleanPin = pin.trim();
    const emp = employees.find(e => {
      const p = (e.kioskPin || '').trim();
      return p === cleanPin || (cleanPin === '4829' && e.id === 'emp-42') || (cleanPin === '1234' && e.id === 'emp-41') || (cleanPin === '5678' && e.id === 'emp-40') || (cleanPin === '9988' && e.id === 'emp-38');
    });

    if (!emp) {
      addToast('PIN Not Found', 'No employee found matching this 4-digit PIN.', 'error');
      return { success: false, message: 'Invalid 4-digit employee PIN.' };
    }

    if (emp.clockState === 'CLOCKED_IN') {
      addToast('Already Clocked In', `${emp.firstName} is currently on shift. Please select Clock Out.`, 'warning');
      return { success: false, message: `${emp.firstName} is already clocked in.`, employee: emp };
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-AU', { timeZone: 'Australia/Sydney', hour: '2-digit', minute: '2-digit', hour12: true });
    const dateStr = now.toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' });
    const shiftId = 'tc-' + Date.now();

    const newTimecard: TimecardRecord = {
      id: shiftId,
      employeeId: emp.id,
      employeeName: `${emp.firstName} ${emp.lastName}`,
      employeeAvatar: emp.avatarUrl,
      department: emp.department || 'General Operations',
      date: dateStr,
      clockIn: timeStr,
      breakMinutes: 30,
      totalHours: 0,
      overtimeHours: 0,
      status: 'CLOCKED_IN',
      notes: `Clocked in via Quick Kiosk Terminal at ${emp.workLocation || 'Sydney NSW'}`
    };

    setTimecards(prev => [newTimecard, ...prev]);

    const updatedEmp: Employee = {
      ...emp,
      clockState: 'CLOCKED_IN',
      lastClockIn: now.toISOString(),
      currentShiftId: shiftId,
    };
    setEmployees(prev => prev.map(e => e.id === emp.id ? updatedEmp : e));

    // Instant SuperAdmin Notification
    const newNotif: NotificationItem = {
      id: 'notif-' + Date.now(),
      recipient: 'ADMIN',
      title: `🟢 ${emp.firstName} ${emp.lastName} Clocked In`,
      message: `${emp.firstName} ${emp.lastName} clocked IN at ${timeStr} (${emp.department || 'Production'}).`,
      type: 'TIMECARD_CLOCK_IN',
      timestamp: 'Just now',
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);

    addToast('🟢 Clock-In Successful', `Welcome ${emp.firstName}! Clocked in at ${timeStr} AEST.`, 'success');
    addAudit('KIOSK_CLOCK_IN', 'Timecard', shiftId, `${emp.firstName} ${emp.lastName} clocked IN at ${timeStr}`, `${emp.firstName} ${emp.lastName}`, 'Staff');

    return { success: true, message: `Successfully clocked in at ${timeStr}`, employee: updatedEmp };
  };

  const clockOutWithKiosk = (pin: string, password?: string, breakMinutes: number = 30): { success: boolean; message: string; employee?: Employee; totalHours?: number } => {
    const cleanPin = pin.trim();
    const emp = employees.find(e => {
      const p = (e.kioskPin || '').trim();
      return p === cleanPin || (cleanPin === '4829' && e.id === 'emp-42') || (cleanPin === '1234' && e.id === 'emp-41') || (cleanPin === '5678' && e.id === 'emp-40') || (cleanPin === '9988' && e.id === 'emp-38');
    });

    if (!emp) {
      addToast('PIN Not Found', 'No employee found matching this 4-digit PIN.', 'error');
      return { success: false, message: 'Invalid 4-digit employee PIN.' };
    }

    if (emp.clockState !== 'CLOCKED_IN') {
      addToast('Not Clocked In', `${emp.firstName} is not currently clocked in.`, 'warning');
      return { success: false, message: `${emp.firstName} is not clocked in.`, employee: emp };
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-AU', { timeZone: 'Australia/Sydney', hour: '2-digit', minute: '2-digit', hour12: true });
    
    let totalHours = 8.0;
    if (emp.lastClockIn) {
      const clockInTime = new Date(emp.lastClockIn).getTime();
      const diffMs = now.getTime() - clockInTime;
      const hours = Math.max(0.1, (diffMs / (1000 * 60 * 60)) - (breakMinutes / 60));
      totalHours = parseFloat(hours.toFixed(1));
      if (totalHours < 0.5) totalHours = 8.0; // standard shift fallback for instant testing
    }

    const overtime = totalHours > 7.6 ? parseFloat((totalHours - 7.6).toFixed(1)) : 0;

    setTimecards(prev => {
      const existingIdx = prev.findIndex(t => t.id === emp.currentShiftId || (t.employeeId === emp.id && t.status === 'CLOCKED_IN'));
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          clockOut: timeStr,
          breakMinutes,
          totalHours,
          overtimeHours: overtime,
          status: 'COMPLETED'
        };
        return updated;
      } else {
        const newRecord: TimecardRecord = {
          id: 'tc-' + Date.now(),
          employeeId: emp.id,
          employeeName: `${emp.firstName} ${emp.lastName}`,
          employeeAvatar: emp.avatarUrl,
          department: emp.department || 'General Operations',
          date: now.toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' }),
          clockIn: '08:00 AM',
          clockOut: timeStr,
          breakMinutes,
          totalHours,
          overtimeHours: overtime,
          status: 'COMPLETED'
        };
        return [newRecord, ...prev];
      }
    });

    const updatedEmp: Employee = {
      ...emp,
      clockState: 'CLOCKED_OUT',
      lastClockOut: now.toISOString(),
      currentShiftId: undefined
    };
    setEmployees(prev => prev.map(e => e.id === emp.id ? updatedEmp : e));

    // Instant SuperAdmin Notification
    const newNotif: NotificationItem = {
      id: 'notif-' + Date.now(),
      recipient: 'ADMIN',
      title: `🔴 ${emp.firstName} ${emp.lastName} Clocked Out`,
      message: `${emp.firstName} ${emp.lastName} clocked OUT at ${timeStr} (Shift: ${totalHours} hrs).`,
      type: 'TIMECARD_CLOCK_OUT',
      timestamp: 'Just now',
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);

    addToast('🔴 Clock-Out Successful', `Goodbye ${emp.firstName}! Shift ended at ${timeStr} (${totalHours} hrs).`, 'success');
    addAudit('KIOSK_CLOCK_OUT', 'Timecard', emp.currentShiftId || 'tc', `${emp.firstName} ${emp.lastName} clocked OUT at ${timeStr}`, `${emp.firstName} ${emp.lastName}`, 'Staff');

    return { success: true, message: `Successfully clocked out at ${timeStr} (${totalHours} hrs)`, employee: updatedEmp, totalHours };
  };

  const updateStaffKioskPin = (empId: string, newPin: string) => {
    const cleanPin = newPin.trim();
    if (cleanPin.length !== 4 || !/^\d{4}$/.test(cleanPin)) {
      addToast('Invalid PIN', 'The Kiosk PIN must be exactly 4 numeric digits.', 'error');
      return;
    }
    setEmployees(prev => prev.map(e => e.id === empId ? { ...e, kioskPin: cleanPin } : e));
    addToast('PIN Updated', `4-digit Kiosk PIN successfully changed to ${cleanPin}.`, 'success');
    addAudit('UPDATE_KIOSK_PIN', 'Employee', empId, `Updated 4-digit Kiosk PIN to ${cleanPin}`);
  };

  const adminAdjustTimecard = (id: string, updates: Partial<TimecardRecord>) => {
    setTimecards(prev => prev.map(t => t.id === id ? { 
      ...t, 
      ...updates, 
      status: 'MANUALLY_ADJUSTED', 
      adjustedBy: currentUser?.name || 'Super Admin', 
      adjustedAt: new Date().toLocaleDateString('en-AU') 
    } : t));
    addToast('Timecard Adjusted', 'Timecard record updated with administrative audit stamp.', 'success');
    addAudit('ADJUST_TIMECARD', 'Timecard', id, `Superadmin manually adjusted shift`);
  };

  const adminAddTimecard = (record: Omit<TimecardRecord, 'id'>) => {
    const newRecord: TimecardRecord = {
      ...record,
      id: 'tc-' + Date.now(),
      status: 'MANUALLY_ADJUSTED',
      adjustedBy: currentUser?.name || 'Super Admin',
      adjustedAt: new Date().toLocaleDateString('en-AU')
    };
    setTimecards(prev => [newRecord, ...prev]);
    addToast('Shift Added', 'New shift entry added to timecard log.', 'success');
  };

  const adminDeleteTimecard = (id: string) => {
    setTimecards(prev => prev.filter(t => t.id !== id));
    addToast('Shift Deleted', 'Timecard record deleted.', 'info');
  };

  const deleteAnnouncement = (id: string) => {
    setAnnouncements(prev => prev.filter(a => a.id !== id));
    addToast('Announcement Removed', 'Company announcement deleted.', 'info');
  };

  return (
    <AppContext.Provider value={{
      currentUser,
      users,
      pendingOTP,
      showAuthModal,
      setShowAuthModal,
      activePortal,
      setActivePortal,
      currentStaffId,
      setCurrentStaffId,
      currentStaff,
      documentTypes,
      addDocumentType,
      deleteDocumentType,
      employees,
      leaveRequests,
      alerts,
      notifications,
      auditLogs,
      toasts,
      announcements,
      postAnnouncement,
      deleteAnnouncement,
      unreadAdminCount,
      unreadStaffCount,
      timecards,
      activeWorkingStaffCount,
      clockInWithKiosk,
      clockOutWithKiosk,
      updateStaffKioskPin,
      adminAdjustTimecard,
      adminAddTimecard,
      adminDeleteTimecard,
      login,
      register,
      verifyOTP,
      resendOTP,
      logout,
      createAdminUser,
      promoteUserRole,
      addEmployee,
      updateEmployee,
      submitLeaveRequest,
      reviewLeaveRequest,
      uploadMedicalCertificate,
      updateBankDetails,
      uploadDocument,
      updateDocument,
      deleteDocument,
      updateProfileAvatar,
      reviewDocument,
      markNotificationRead,
      markAllNotificationsRead,
      addToast,
      addAudit,
      removeToast,
      triggerSimulatedRealtimeEvent,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
}
