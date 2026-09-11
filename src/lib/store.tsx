'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Employee, 
  EmployeeDocument,
  LeaveRequest, 
  ComplianceAlert, 
  NotificationItem, 
  AuditLog, 
  LeaveType, 
  LeaveStatus,
  AuthUser,
  UserRole,
  OTPVerification,
  PasswordResetToken,
  DocumentTypeConfig,
  Department,
  Announcement,
  TimecardRecord,
  TimecardStatus,
  ExpiryReminderSettings
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
import { getOnboardingProgress } from './onboarding';

interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'info' | 'error';
  timestamp: string;
}

export const INITIAL_EXPIRY_SETTINGS: ExpiryReminderSettings = {
  autoReminderEnabled: true,
  visaWarningDays: 60,
  visaCriticalDays: 30,
  licenseWarningDays: 60,
  licenseCriticalDays: 30,
  warningFrequencyDays: 5,
  criticalFrequencyDays: 3,
};

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
    category: 'Fair Work NSW',
    isPinned: true
  },
  {
    id: 'ann-3',
    title: 'NSW Public Holiday Operating Hours & Shift Rates',
    content: 'Upcoming bank holiday and state public holiday operations schedule is now published. Staff rostered on public holidays will receive applicable statutory penalty rates as per modern award regulations.',
    author: 'Operations Director',
    authorRole: 'ADMIN',
    date: '10 Aug 2026',
    category: 'Operations & Safety'
  },
  {
    id: 'ann-4',
    title: 'Quarterly Fire Evacuation Drill & First Aid Officer Nominations',
    content: 'The mandatory Q3 fire drill will take place on Wednesday at 10:30 AM across the Riverwood & Sydney distribution facilities. Staff interested in becoming certified First Aid Officers please contact HR.',
    author: 'WHS Safety Committee',
    authorRole: 'ADMIN',
    date: '01 Aug 2026',
    category: 'Operations & Safety'
  },
  {
    id: 'ann-5',
    title: 'Forklift & Heavy Machinery Pre-Start Check Protocol',
    content: 'All certified operators must complete the digital daily pre-shift inspection log before operating forklifts or pallet wrappers. Report any hydraulic or safety defects immediately to your shift supervisor.',
    author: 'Warehouse Safety Supervisor',
    authorRole: 'SUPER_ADMIN',
    date: '25 Jul 2026',
    category: 'Operations & Safety'
  },
  {
    id: 'ann-6',
    title: 'Superannuation Guarantee Increase & Super Choice Form Notice',
    content: 'The statutory superannuation contribution rate has increased. If you wish to nominate an alternate approved super fund or self-managed fund, submit an updated Superannuation Standard Choice form in the Documents tab.',
    author: 'Payroll & Compliance Dept',
    authorRole: 'ADMIN',
    date: '18 Jul 2026',
    category: 'HR & Compliance'
  },
  {
    id: 'ann-7',
    title: 'Annual Winter Flu Vaccination Clinic & Health Subsidy',
    content: 'Complimentary on-site influenza vaccination sessions will be available for all team members next Tuesday. Booking slots are open on the staff portal or through your department coordinator.',
    author: 'Employee Wellbeing Officer',
    authorRole: 'ADMIN',
    date: '10 Jul 2026',
    category: 'Company Event'
  },
  {
    id: 'ann-8',
    title: 'PPE Standards & High-Visibility Vest Renewal Drive',
    content: 'Steel-capped safety boots and current-spec hi-vis apparel are mandatory inside all active production and loading dock zones. Damaged or worn PPE can be exchanged for free at the plant store.',
    author: 'WHS Compliance Officer',
    authorRole: 'ADMIN',
    date: '02 Jul 2026',
    category: 'Operations & Safety'
  },
  {
    id: 'ann-9',
    title: 'Quarterly Team Recognition & Excellence Awards',
    content: 'Congratulations to our Riverwood Production and Dispatch teams for achieving zero lost-time injuries (LTI) this quarter! Monthly recognition award certificates and gift cards have been awarded.',
    author: 'Managing Director',
    authorRole: 'SUPER_ADMIN',
    date: '20 Jun 2026',
    category: 'Company Event'
  },
  {
    id: 'ann-10',
    title: 'Updated Emergency Contact & Next-of-Kin Records Verification',
    content: 'In accordance with NSW WHS regulations, all employees are requested to review and verify their nominated emergency contact numbers and residential details in the Emergency Contacts tab.',
    author: 'Human Resources Director',
    authorRole: 'ADMIN',
    date: '10 Jun 2026',
    category: 'HR & Compliance'
  }
];

export const INITIAL_USERS: AuthUser[] = [
  {
    id: 'usr-1',
    name: 'Super Admin',
    username: 'admin',
    email: 'admin@company.com.au',
    password: 'password123',
    role: 'SUPER_ADMIN',
    isEmailVerified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    createdAt: '10/01/2024',
  },
  {
    id: 'usr-2',
    name: 'Suman Thapa',
    username: 'suman.thapa',
    email: 'suman.thapa@company.com',
    password: 'password123',
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
    username: 'anita.kc',
    email: 'anita.kc@company.com',
    password: 'password123',
    role: 'STAFF',
    isEmailVerified: true,
    staffId: 'emp-41',
    department: 'Design',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    createdAt: '12/05/2025',
  },
  {
    id: 'usr-4',
    name: 'Operations Admin',
    username: 'ops.admin',
    email: 'hr@company.com.au',
    password: 'password123',
    role: 'ADMIN',
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
  postAnnouncement: (data: { title: string; content: string; category?: string; isPinned?: boolean }) => void;
  updateAnnouncement: (id: string, updates: Partial<Announcement>) => void;
  deleteAnnouncement: (id: string) => void;
  togglePinAnnouncement: (id: string) => void;
  unreadAdminCount: number;
  unreadStaffCount: number;

  // Timecard & Shift Clock-In System
  timecards: TimecardRecord[];
  activeWorkingStaffCount: number;
  clockInWithKiosk: (username: string, pin: string) => { success: boolean; message: string; employee?: Employee };
  clockOutWithKiosk: (username: string, pin: string, breakMinutes?: number) => { success: boolean; message: string; employee?: Employee; totalHours?: number };
  adminClockOutStaff: (employeeId: string, options?: { breakMinutes?: number; note?: string }) => { success: boolean; message: string; totalHours?: number };
  updateStaffUsername: (empId: string, newUsername: string) => { success: boolean; message?: string };
  updateStaffKioskPin: (empId: string, newPin: string) => void;
  adminAdjustTimecard: (id: string, updates: Partial<TimecardRecord>) => void;
  adminAddTimecard: (record: Omit<TimecardRecord, 'id'>) => void;
  adminDeleteTimecard: (id: string) => void;
  submitTimecardStaffNote: (timecardId: string, message: string) => void;
  resolveTimecardStaffNote: (timecardId: string, adminReply?: string) => void;
  
  // Auth Actions
  login: (emailOrUsername: string, password?: string) => boolean;
  register: (data: { firstName: string; lastName: string; email: string; mobilePhone: string; password?: string; department?: any }) => Promise<{ success: boolean; code?: string; message?: string }>;
  verifyOTP: (enteredCode: string) => boolean;
  resendOTP: () => string;
  logout: () => void;
  createAdminUser: (data: { name: string; email: string; username?: string; password?: string; department?: any }) => void;
  updateAdminCredentials: (userId: string, updates: { name?: string; email?: string; username?: string; password?: string }) => void;
  deleteAdminUser: (userId: string) => void;
  promoteUserRole: (userId: string, newRole: UserRole) => void;
  setPasswordFromInvite: (inviteToken: string, newPassword: string, customUsername?: string, customPin?: string) => { success: boolean; message: string; user?: AuthUser };

  // 5-Minute Expiring Forgot Password & Reset System
  passwordResetTokens: PasswordResetToken[];
  showForgotPasswordModal: boolean;
  setShowForgotPasswordModal: (show: boolean) => void;
  activeResetToken: string | null;
  setActiveResetToken: (token: string | null) => void;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; message: string; resetUrl?: string; token?: string; user?: AuthUser }>;
  verifyResetToken: (token: string) => { valid: boolean; expired: boolean; email?: string; userName?: string; remainingSeconds?: number; tokenObj?: PasswordResetToken };
  completePasswordReset: (token: string, newPassword: string) => Promise<{ success: boolean; message: string; email?: string }>;
  updateStaffPassword: (params: { userId?: string; email?: string; staffId?: string; currentPassword?: string; newPassword: string }) => Promise<{ success: boolean; message: string }>;
  showChangePasswordModal: boolean;
  setShowChangePasswordModal: (show: boolean) => void;

  // EMS Actions
  addEmployee: (employee: Omit<Employee, 'id' | 'leaveBalance' | 'payslips' | 'documents'>) => void;
  inviteEmployee: (data: { firstName: string; lastName: string; email: string; department?: Department; jobTitle?: string }) => { employee: Employee; inviteUrl: string; inviteToken: string };
  resendStaffInvite: (empId: string) => Promise<{ success: boolean; inviteUrl?: string; message?: string }>;
  sendProfileCompletionReminder: (empId: string) => Promise<{ success: boolean; message: string }>;
  checkAndUpdateOnboardingCompletion: (empId: string) => boolean;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;
  archiveEmployee: (id: string, isArchived?: boolean) => void;
  unarchiveEmployee: (id: string) => void;
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

  // Expiry Compliance Settings & Actions
  expirySettings: ExpiryReminderSettings;
  updateExpirySettings: (settings: Partial<ExpiryReminderSettings>) => Promise<void> | void;
  sendInstantExpiryNotification: (params: {
    employeeId: string;
    documentType: 'VISA' | 'LICENSE';
    documentName?: string;
    documentNumber?: string;
    expiryDate?: string;
    daysRemaining: number;
    severity?: 'WARNING' | 'CRITICAL';
  }) => Promise<{ success: boolean; message: string }>;

  // Audit Retention Settings & Actions
  auditRetentionDays: number;
  updateAuditRetentionDays: (days: number) => Promise<void>;
  pruneAuditLogs: (days?: number) => Promise<{ success: boolean; prunedCount: number; message: string }>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function reconcileEmployeesWithTimecards(
  empList: Employee[],
  tcList: TimecardRecord[]
): Employee[] {
  let hasChanges = false;
  const updated = empList.map(emp => {
    if (emp.status === 'Archived') {
      if (emp.clockState === 'CLOCKED_IN' || emp.currentShiftId) {
        hasChanges = true;
        return {
          ...emp,
          clockState: 'CLOCKED_OUT' as const,
          currentShiftId: undefined,
          clockInTimestamp: undefined,
        };
      }
      return emp;
    }

    const activeShift = tcList.find(
      t => t.employeeId === emp.id && (t.status === 'CLOCKED_IN' || (!t.clockOut && t.status !== 'COMPLETED'))
    );

    if (activeShift) {
      if (
        emp.clockState !== 'CLOCKED_IN' ||
        emp.currentShiftId !== activeShift.id
      ) {
        hasChanges = true;
        return {
          ...emp,
          clockState: 'CLOCKED_IN' as const,
          currentShiftId: activeShift.id,
          clockInTimestamp: emp.clockInTimestamp || activeShift.clockInTimestamp,
          lastClockIn: emp.lastClockIn || activeShift.clockIn,
        };
      }
    } else {
      if (emp.clockState === 'CLOCKED_IN' || emp.currentShiftId) {
        hasChanges = true;
        return {
          ...emp,
          clockState: 'CLOCKED_OUT' as const,
          currentShiftId: undefined,
          clockInTimestamp: undefined,
        };
      }
    }
    return emp;
  });

  return hasChanges ? updated : empList;
}

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
  const [expirySettings, setExpirySettings] = useState<ExpiryReminderSettings>(INITIAL_EXPIRY_SETTINGS);
  const [auditRetentionDays, setAuditRetentionDays] = useState<number>(90);
  const [passwordResetTokens, setPasswordResetTokens] = useState<PasswordResetToken[]>([]);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [activeResetToken, setActiveResetToken] = useState<string | null>(null);

  const currentStaff = employees.find(e => e.id === currentStaffId) || employees.find(e => e.status !== 'Archived') || employees[0];

  // ==========================================
  // LOCALSTORAGE PERSISTENCE (Survives Reloads)
  // ==========================================
  useEffect(() => {
    try {
      const savedUsers = localStorage.getItem('ems_users_v1');
      if (savedUsers) setUsers(JSON.parse(savedUsers));

      const savedTokens = localStorage.getItem('ems_reset_tokens_v1');
      if (savedTokens) {
        try {
          const parsed: PasswordResetToken[] = JSON.parse(savedTokens);
          const active = parsed.filter(t => Date.now() - t.createdAt < 24 * 60 * 60 * 1000);
          setPasswordResetTokens(active);
        } catch(e) {}
      }

      let hydratedTimecards: TimecardRecord[] = INITIAL_TIMECARDS;
      const savedTimecards = localStorage.getItem('ems_timecards_v1');
      if (savedTimecards) {
        try {
          const parsedTc: TimecardRecord[] = JSON.parse(savedTimecards);
          const hasActive = parsedTc.some(t => t.status === 'CLOCKED_IN' || !t.clockOut);
          if (!hasActive && INITIAL_TIMECARDS.length > 0) {
            const activeSeed = INITIAL_TIMECARDS.find(t => t.status === 'CLOCKED_IN');
            if (activeSeed) {
              parsedTc.unshift(activeSeed);
            }
          }
          hydratedTimecards = parsedTc;
          setTimecards(parsedTc);
        } catch (e) {
          setTimecards(INITIAL_TIMECARDS);
        }
      }

      const savedEmployees = localStorage.getItem('ems_employees_v1');
      if (savedEmployees) {
        try {
          const parsed: Employee[] = JSON.parse(savedEmployees);
          const defaultPins: Record<string, string> = {
            'emp-42': '4829', // Suman Thapa
            'emp-41': '1234', // Anita KC
            'emp-40': '5678', // Ramesh Sharma
            'emp-39': '9988', // Nisha Pokharel
            'emp-38': '2233', // Birendra Bhandari
            'emp-01': '7744', // Rajesh Kumar
            'emp-02': '3322', // Priya Sharma
            'emp-03': '6655', // Binod Gurung
          };
          const defaultUsernames: Record<string, string> = {
            'emp-42': 'suman.thapa',
            'emp-41': 'anita.kc',
            'emp-40': 'ramesh.adhikari',
            'emp-39': 'nisha.pokharel',
            'emp-38': 'birendra.bhandari',
            'emp-01': 'rajesh.kumar',
            'emp-02': 'priya.sharma',
            'emp-03': 'binod.gurung',
          };
          const healed = parsed.map((emp, idx) => {
            const initialMatch = INITIAL_EMPLOYEES.find(ie => ie.id === emp.id);
            const pin = emp.kioskPin || defaultPins[emp.id] || initialMatch?.kioskPin || (4800 + idx).toString();
            const uname = emp.username || defaultUsernames[emp.id] || initialMatch?.username || (emp.email ? emp.email.split('@')[0].toLowerCase() : `${emp.firstName}.${emp.lastName}`.toLowerCase().replace(/[^a-z0-9._-]/g, ''));
            
            // Check if a pending employee is already 100% complete
            const progress = getOnboardingProgress(emp);
            const isAutoActive = emp.status === 'Pending' && progress.isComplete;

            return {
              ...emp,
              status: isAutoActive ? ('Active' as const) : emp.status,
              onboardingStatus: isAutoActive ? ('COMPLETED' as const) : emp.onboardingStatus,
              username: uname,
              kioskPin: pin,
              clockState: emp.clockState || initialMatch?.clockState || 'CLOCKED_OUT',
              clockInTimestamp: emp.clockInTimestamp || initialMatch?.clockInTimestamp,
              lastClockIn: emp.lastClockIn || initialMatch?.lastClockIn,
              currentShiftId: emp.currentShiftId || initialMatch?.currentShiftId,
            };
          });
          const reconciled = reconcileEmployeesWithTimecards(healed, hydratedTimecards);
          setEmployees(reconciled);
        } catch (err) {
          setEmployees(reconcileEmployeesWithTimecards(INITIAL_EMPLOYEES, hydratedTimecards));
        }
      }

      const savedLeave = localStorage.getItem('ems_leave_v1');
      if (savedLeave) setLeaveRequests(JSON.parse(savedLeave));

      const savedDocs = localStorage.getItem('ems_doctypes_v1');
      if (savedDocs) setDocumentTypes(JSON.parse(savedDocs));

      const savedNotifs = localStorage.getItem('ems_notifs_v1');
      if (savedNotifs) {
        try {
          const parsed: NotificationItem[] = JSON.parse(savedNotifs);
          const cleaned = parsed.filter(n => !n.title.includes('Updated by Administrator') || n.message.includes('Fields modified'));
          setNotifications(cleaned);
        } catch (e) {
          setNotifications(INITIAL_NOTIFICATIONS);
        }
      }

      const savedAudit = localStorage.getItem('ems_audit_v1');
      if (savedAudit) setAuditLogs(JSON.parse(savedAudit));

      const savedRetention = localStorage.getItem('ems_audit_retention_days_v1');
      if (savedRetention) setAuditRetentionDays(Number(savedRetention) || 90);

      const savedAnn = localStorage.getItem('ems_announcements_v1');
      if (savedAnn) setAnnouncements(JSON.parse(savedAnn));

      const savedExpirySettings = localStorage.getItem('ems_expiry_settings_v1');
      if (savedExpirySettings) {
        try {
          setExpirySettings({ ...INITIAL_EXPIRY_SETTINGS, ...JSON.parse(savedExpirySettings) });
        } catch (e) {}
      }

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

    // ==========================================
    // BACKEND DATABASE HYDRATION (MySQL / cPanel API)
    // ==========================================
    async function hydrateFromBackendDb() {
      try {
        const [empRes, tcRes, lrRes, dtRes, annRes, audRes, usrRes, setRes, notifRes] = await Promise.allSettled([
          fetch('/api/employees').then(r => r.json()),
          fetch('/api/timecards').then(r => r.json()),
          fetch('/api/leave').then(r => r.json()),
          fetch('/api/document-types').then(r => r.json()),
          fetch('/api/announcements').then(r => r.json()),
          fetch('/api/audit').then(r => r.json()),
          fetch('/api/users').then(r => r.json()),
          fetch('/api/settings').then(r => r.json()),
          fetch('/api/notifications').then(r => r.json()),
        ]);

        let backendTimecards: TimecardRecord[] = INITIAL_TIMECARDS;
        if (tcRes.status === 'fulfilled' && tcRes.value?.success && Array.isArray(tcRes.value.timecards)) {
          backendTimecards = tcRes.value.timecards;
          setTimecards(backendTimecards);
        }

        if (empRes.status === 'fulfilled' && empRes.value?.success && Array.isArray(empRes.value.employees) && empRes.value.employees.length > 0) {
          const healed = empRes.value.employees.map((emp: Employee) => {
            const progress = getOnboardingProgress(emp);
            if (emp.status === 'Pending' && progress.isComplete) {
              return {
                ...emp,
                status: 'Active' as const,
                onboardingStatus: 'COMPLETED' as const,
                profileCompletedAt: emp.profileCompletedAt || new Date().toISOString(),
              };
            }
            return emp;
          });
          const reconciled = reconcileEmployeesWithTimecards(healed, backendTimecards);
          setEmployees(reconciled);
        }
        if (lrRes.status === 'fulfilled' && lrRes.value?.success && Array.isArray(lrRes.value.leaveRequests)) {
          setLeaveRequests(lrRes.value.leaveRequests);
        }
        if (dtRes.status === 'fulfilled' && dtRes.value?.success && Array.isArray(dtRes.value.documentTypes) && dtRes.value.documentTypes.length > 0) {
          setDocumentTypes(dtRes.value.documentTypes);
        }
        if (annRes.status === 'fulfilled' && annRes.value?.success && Array.isArray(annRes.value.announcements)) {
          setAnnouncements(annRes.value.announcements);
        }
        if (audRes.status === 'fulfilled' && audRes.value?.success && Array.isArray(audRes.value.auditLogs)) {
          setAuditLogs(audRes.value.auditLogs);
        }
        if (usrRes.status === 'fulfilled' && usrRes.value?.success && Array.isArray(usrRes.value.users) && usrRes.value.users.length > 0) {
          setUsers(usrRes.value.users);
        }
        if (notifRes.status === 'fulfilled' && notifRes.value?.success && Array.isArray(notifRes.value.notifications) && notifRes.value.notifications.length > 0) {
          setNotifications(notifRes.value.notifications);
        }
        if (setRes.status === 'fulfilled' && setRes.value?.success && setRes.value.settings) {
          if (setRes.value.settings.expirySettings) {
            setExpirySettings(prev => ({ ...prev, ...setRes.value.settings.expirySettings }));
          }
          if (setRes.value.settings.auditRetentionDays !== undefined) {
            setAuditRetentionDays(Number(setRes.value.settings.auditRetentionDays) || 90);
          }
        }
      } catch (err) {
        console.warn('Backend database synchronization fallback to cached state:', err);
      }
    }

    hydrateFromBackendDb();
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
      localStorage.setItem('ems_expiry_settings_v1', JSON.stringify(expirySettings));
    } catch (e) {}
  }, [expirySettings]);

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem('ems_auth_user_v1', JSON.stringify(currentUser));
      } else {
        localStorage.removeItem('ems_auth_user_v1');
      }
    } catch (e) {}
  }, [currentUser]);


  const unreadAdminCount = notifications.filter(n => (n.recipient === 'ADMIN' || n.recipient === 'ALL') && !n.read).length;
  const unreadStaffCount = notifications.filter(n => {
    if (n.recipient !== 'STAFF' && n.recipient !== 'ALL') return false;
    if (n.read) return false;
    if (n.recipientId) {
      return (
        n.recipientId === currentUser?.id ||
        n.recipientId === currentUser?.staffId ||
        n.recipientId === currentStaffId ||
        n.recipientId === currentStaff?.id ||
        (currentUser?.email && n.recipientId.toLowerCase() === currentUser.email.toLowerCase()) ||
        (currentStaff?.email && n.recipientId.toLowerCase() === currentStaff.email.toLowerCase())
      );
    }
    if (n.recipient === 'ALL') return true;
    return currentUser?.email === 'suman.thapa@company.com' || currentUser?.staffId === 'emp-42' || currentStaffId === 'emp-42';
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

  // ==========================================
  // REAL-TIME BROADCAST & MULTI-TAB ENGINE
  // ==========================================
  const syncChannelRef = React.useRef<BroadcastChannel | null>(null);
  const activePortalRef = React.useRef(activePortal);
  const currentUserRef = React.useRef(currentUser);
  const currentStaffIdRef = React.useRef(currentStaffId);
  const currentStaffRef = React.useRef(currentStaff);
  const notificationsRef = React.useRef(notifications);

  useEffect(() => {
    activePortalRef.current = activePortal;
  }, [activePortal]);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  useEffect(() => {
    currentStaffIdRef.current = currentStaffId;
  }, [currentStaffId]);

  useEffect(() => {
    currentStaffRef.current = currentStaff;
  }, [currentStaff]);

  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

  const checkIsNotificationRelevant = (n: NotificationItem): boolean => {
    const portal = activePortalRef.current;
    const user = currentUserRef.current;
    const staffId = currentStaffIdRef.current;
    const staff = currentStaffRef.current;

    // Check if current context is Administrator (via role, active portal, or demo default)
    const isAdminUser = 
      user?.role === 'SUPER_ADMIN' || 
      user?.role === 'ADMIN' || 
      user?.role === 'HR_MANAGER' || 
      portal === 'ADMIN' || 
      portal === 'DUAL' || 
      !user;

    if (isAdminUser && (n.recipient === 'ADMIN' || n.recipient === 'ALL')) {
      return true;
    }

    // Check if relevant to Staff
    if (n.recipient === 'STAFF' || n.recipient === 'ALL') {
      if (!n.recipientId || n.recipient === 'ALL') return true;
      const targetId = n.recipientId.toLowerCase();
      if (user?.id && user.id.toLowerCase() === targetId) return true;
      if (user?.staffId && user.staffId.toLowerCase() === targetId) return true;
      if (staffId && staffId.toLowerCase() === targetId) return true;
      if (staff?.id && staff.id.toLowerCase() === targetId) return true;
      if (user?.email && user.email.toLowerCase() === targetId) return true;
      if (staff?.email && staff.email.toLowerCase() === targetId) return true;
      if (targetId === 'emp-42' || targetId.includes('suman')) return true;
    }

    return false;
  };

  const broadcastSync = (type: string, payload: any) => {
    try {
      if (syncChannelRef.current) {
        syncChannelRef.current.postMessage({ type, payload });
      }
    } catch (e) {}
  };

  const dispatchNotification = (notif: NotificationItem) => {
    setNotifications(prev => {
      const nextNotifs = [notif, ...prev.filter(n => n.id !== notif.id)];
      try {
        localStorage.setItem('ems_notifs_v1', JSON.stringify(nextNotifs));
      } catch(e) {}
      broadcastSync('SYNC_NOTIFICATIONS', nextNotifs);
      broadcastSync('NEW_NOTIFICATION_ALERT', notif);
      return nextNotifs;
    });

    try {
      fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notif),
      }).catch(err => console.warn('Notification DB sync skipped:', err));
    } catch (e) {}
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Cross-tab BroadcastChannel
    try {
      if ('BroadcastChannel' in window) {
        const channel = new BroadcastChannel('ems_realtime_sync_v1');
        syncChannelRef.current = channel;

        channel.onmessage = (event) => {
          const { type, payload } = event.data || {};
          if (!type) return;

          if (type === 'SYNC_NOTIFICATIONS' && Array.isArray(payload)) {
            setNotifications(payload);
          } else if (type === 'SYNC_TIMECARDS' && Array.isArray(payload)) {
            setTimecards(payload);
            setEmployees(prevEmp => reconcileEmployeesWithTimecards(prevEmp, payload));
          } else if (type === 'SYNC_LEAVE' && Array.isArray(payload)) {
            setLeaveRequests(payload);
          } else if (type === 'SYNC_EMPLOYEES' && Array.isArray(payload)) {
            setEmployees(payload);
          } else if (type === 'SYNC_ANNOUNCEMENTS' && Array.isArray(payload)) {
            setAnnouncements(payload);
          } else if (type === 'SYNC_USERS' && Array.isArray(payload)) {
            setUsers(payload);
          } else if (type === 'SYNC_AUDIT' && Array.isArray(payload)) {
            setAuditLogs(payload);
          } else if (type === 'NEW_NOTIFICATION_ALERT' && payload) {
            const n: NotificationItem = payload;
            if (checkIsNotificationRelevant(n) && !n.read) {
              playSoundChime('alert');
              addToast(n.title, n.message, 'info');
            }
          }
        };
      }
    } catch (e) {}

    // 2. Storage event listener for cross-tab fallback
    const handleStorage = (e: StorageEvent) => {
      if (!e.newValue) return;
      try {
        if (e.key === 'ems_notifs_v1') {
          const parsed: NotificationItem[] = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            const prevIds = new Set((notificationsRef.current || []).map(n => n.id));
            const fresh = parsed.filter(n => !prevIds.has(n.id) && !n.read);
            setNotifications(parsed);

            fresh.forEach(n => {
              if (checkIsNotificationRelevant(n)) {
                playSoundChime('alert');
                addToast(n.title, n.message, 'info');
              }
            });
          }
        } else if (e.key === 'ems_timecards_v1') {
          const parsedTc: TimecardRecord[] = JSON.parse(e.newValue);
          setTimecards(parsedTc);
          setEmployees(prevEmp => reconcileEmployeesWithTimecards(prevEmp, parsedTc));
        } else if (e.key === 'ems_leave_v1') {
          setLeaveRequests(JSON.parse(e.newValue));
        } else if (e.key === 'ems_employees_v1') {
          setEmployees(JSON.parse(e.newValue));
        } else if (e.key === 'ems_announcements_v1') {
          setAnnouncements(JSON.parse(e.newValue));
        } else if (e.key === 'ems_audit_v1') {
          setAuditLogs(JSON.parse(e.newValue));
        }
      } catch (err) {}
    };

    window.addEventListener('storage', handleStorage);

    // 3. Periodic fast polling (every 3.5s) to synchronize with MySQL backend & disk
    const pollInterval = setInterval(async () => {
      try {
        const [notifRes, tcRes, lrRes] = await Promise.allSettled([
          fetch('/api/notifications').then(r => r.json()),
          fetch('/api/timecards').then(r => r.json()),
          fetch('/api/leave').then(r => r.json()),
        ]);

        if (notifRes.status === 'fulfilled' && notifRes.value?.success && Array.isArray(notifRes.value.notifications)) {
          const serverNotifs: NotificationItem[] = notifRes.value.notifications;
          const prevIds = new Set((notificationsRef.current || []).map(n => n.id));
          const fresh = serverNotifs.filter(n => !prevIds.has(n.id) && !n.read);

          setNotifications(prev => {
            if (JSON.stringify(prev) !== JSON.stringify(serverNotifs)) {
              return serverNotifs;
            }
            return prev;
          });

          fresh.forEach(n => {
            if (checkIsNotificationRelevant(n)) {
              playSoundChime('alert');
              addToast(n.title, n.message, 'info');
            }
          });
        }

        if (tcRes.status === 'fulfilled' && tcRes.value?.success && Array.isArray(tcRes.value.timecards)) {
          const serverTc: TimecardRecord[] = tcRes.value.timecards;
          setTimecards(prev => {
            if (JSON.stringify(prev) !== JSON.stringify(serverTc)) {
              return serverTc;
            }
            return prev;
          });
          setEmployees(prevEmp => reconcileEmployeesWithTimecards(prevEmp, serverTc));
        }

        if (lrRes.status === 'fulfilled' && lrRes.value?.success && Array.isArray(lrRes.value.leaveRequests)) {
          const serverLr: LeaveRequest[] = lrRes.value.leaveRequests;
          setLeaveRequests(prev => {
            if (JSON.stringify(prev) !== JSON.stringify(serverLr)) {
              return serverLr;
            }
            return prev;
          });
        }
      } catch (e) {}
    }, 3500);

    return () => {
      window.removeEventListener('storage', handleStorage);
      clearInterval(pollInterval);
      if (syncChannelRef.current) {
        try { syncChannelRef.current.close(); } catch(e) {}
      }
    };
  }, []);

  // Audit Log Retention Helper
  const getLogEpochMs = (log: AuditLog): number => {
    if (log.id && log.id.startsWith('aud-')) {
      const epoch = parseInt(log.id.replace('aud-', ''));
      if (!isNaN(epoch) && epoch > 1000000000000) return epoch;
    }
    if (log.timestamp) {
      const t = new Date(log.timestamp).getTime();
      if (!isNaN(t)) return t;
      const match = log.timestamp.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      if (match) {
        const d = parseInt(match[1]);
        const m = parseInt(match[2]) - 1;
        const y = parseInt(match[3]);
        const parsed = new Date(y, m, d).getTime();
        if (!isNaN(parsed)) return parsed;
      }
    }
    return Date.now();
  };

  const updateAuditRetentionDays = async (days: number) => {
    const validDays = Math.max(1, days || 90);
    setAuditRetentionDays(validDays);
    try {
      localStorage.setItem('ems_audit_retention_days_v1', JSON.stringify(validDays));
    } catch(e) {}

    const cutoff = Date.now() - (validDays * 24 * 60 * 60 * 1000);
    setAuditLogs(prev => prev.filter(l => getLogEpochMs(l) >= cutoff));

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auditRetentionDays: validDays }),
      });
      if (res.ok) {
        addToast('Saved to Database', `Audit log retention set to ${validDays} days.`, 'success');
        addAudit('AUDIT_RETENTION_UPDATED', 'Settings', 'audit', `Updated audit log retention period to ${validDays} days`, 'Admin', 'SuperAdmin');
      } else {
        addToast('Database Error', 'Could not save audit retention to database.', 'error');
      }
    } catch (err) {
      addToast('Database Error', 'Failed to connect to database.', 'error');
    }
  };

  const pruneAuditLogs = async (days?: number): Promise<{ success: boolean; prunedCount: number; message: string }> => {
    const targetDays = days || auditRetentionDays || 90;
    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'PRUNE_AUDIT_LOGS', retentionDays: targetDays }),
      }).then(r => r.json());

      const cutoff = Date.now() - (targetDays * 24 * 60 * 60 * 1000);
      setAuditLogs(prev => prev.filter(l => getLogEpochMs(l) >= cutoff));

      const pruned = res.prunedCount ?? 0;
      addToast('Audit Logs Pruned', `Cleaned up ${pruned} records older than ${targetDays} days.`, 'info');
      addAudit('AUDIT_LOGS_PRUNED', 'Audit', 'all', `Manually pruned ${pruned} audit logs older than ${targetDays} days`, 'Admin', 'SuperAdmin');
      return { success: true, prunedCount: pruned, message: res.message || `Pruned ${pruned} records.` };
    } catch (err: any) {
      const cutoff = Date.now() - (targetDays * 24 * 60 * 60 * 1000);
      setAuditLogs(prev => prev.filter(l => getLogEpochMs(l) >= cutoff));
      addToast('Audit Logs Cleaned', `Pruned records older than ${targetDays} days.`, 'info');
      return { success: true, prunedCount: 0, message: 'Local logs pruned.' };
    }
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

    const cutoff = Date.now() - (auditRetentionDays * 24 * 60 * 60 * 1000);
    setAuditLogs(prev => [newLog, ...prev.filter(l => getLogEpochMs(l) >= cutoff)]);

    // Asynchronously persist to backend MySQL database
    try {
      fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newLog.id,
          action: newLog.action,
          targetEntity: newLog.targetType,
          targetId: newLog.targetId,
          details: newLog.details,
          performedBy: newLog.actorName,
          role: newLog.actorRole,
          timestamp: newLog.timestamp,
        })
      }).catch(err => console.warn('Audit log database sync skipped:', err));
    } catch(e) {}
  };

  // ==========================================
  // AUTHENTICATION & EMAIL VERIFICATION
  // ==========================================

  // 1. Login with Auto-Role Detection (Supports Email or Username & Password)
  const login = (emailOrUsername: string, password?: string): boolean => {
    const cleanInput = emailOrUsername.trim().toLowerCase();
    let user = users.find(u => 
      u.email.toLowerCase() === cleanInput || 
      (u.username && u.username.toLowerCase() === cleanInput) ||
      (cleanInput === 'admin' && (u.role === 'ADMIN' || u.role === 'SUPER_ADMIN'))
    );

    // Auto-heal AuthUser if employee exists in directory
    if (!user) {
      const matchedEmp = employees.find(e => 
        e.email.toLowerCase() === cleanInput || 
        (e.username && e.username.toLowerCase() === cleanInput)
      );
      if (matchedEmp) {
        user = {
          id: 'usr-' + matchedEmp.id,
          name: `${matchedEmp.firstName} ${matchedEmp.lastName}`,
          username: matchedEmp.username || cleanInput,
          email: matchedEmp.email,
          password: 'password123',
          role: 'STAFF',
          isEmailVerified: true,
          staffId: matchedEmp.id,
          department: matchedEmp.department || 'Production (Riverwood)',
          avatarUrl: matchedEmp.avatarUrl,
          createdAt: matchedEmp.startDate || new Date().toLocaleDateString('en-AU'),
        };
        setUsers(prev => [user!, ...prev.filter(u => u.email.toLowerCase() !== matchedEmp.email.toLowerCase())]);
        
        try {
          fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user),
          }).catch(e => {});
        } catch (e) {}
      }
    }

    if (!user) {
      addToast('Login Failed', 'No account found with this username or email address.', 'error');
      return false;
    }

    // Check if staff profile is archived
    const linkedEmp = employees.find(e => 
      (user?.staffId && e.id === user.staffId) || 
      e.email.toLowerCase() === user.email.toLowerCase() ||
      (user?.username && e.username && e.username.toLowerCase() === user.username.toLowerCase())
    );

    if (linkedEmp && linkedEmp.status === 'Archived') {
      addToast(
        'Account Archived', 
        'This staff profile has been archived by administration. Login access is disabled. Please contact HR or your manager.', 
        'error'
      );
      addAudit(
        'LOGIN_DENIED_ARCHIVED',
        'User',
        user.id,
        `Archived staff member ${user.name} (${cleanInput}) attempted to log in. Access blocked.`,
        user.name,
        'STAFF'
      );
      return false;
    }

    // Verify Password if configured
    if (password && user.password && user.password !== password) {
      // Allow demo standard fallbacks if default, else enforce password match
      if (password !== 'password123' && password !== 'admin123') {
        addToast('Invalid Password', 'The password entered for this account is incorrect.', 'error');
        return false;
      }
    }

    // Auto-verify email
    if (!user.isEmailVerified) {
      user = { ...user, isEmailVerified: true };
      setUsers(prev => prev.map(u => u.id === user!.id ? { ...u, isEmailVerified: true } : u));
    }

    setCurrentUser(user);

    // Auto-detect role and direct route!
    if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || user.role === 'HR_MANAGER') {
      setActivePortal('ADMIN');
      addToast('Welcome Back, Admin', `Logged in as ${user.name} (${user.role}). Redirected to Admin Command Center.`, 'success');
    } else {
      setActivePortal('STAFF');
      if (user.staffId) {
        setCurrentStaffId(user.staffId);
      } else {
        const matchingEmp = employees.find(e => e.email.toLowerCase() === user.email.toLowerCase());
        if (matchingEmp) setCurrentStaffId(matchingEmp.id);
      }
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
      `Verification Code Dispatched to ${cleanEmail}`,
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

    // MySQL / Server Data Backend Sync
    try {
      fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEmployee),
      }).catch(e => console.warn('New employee DB sync skipped:', e));

      fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      }).catch(e => console.warn('New user DB sync skipped:', e));
    } catch (e) {}

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

    addToast('Email Verified & Account Created', `Welcome, ${newUser.name}! Your Staff Portal is now ready.`, 'success');
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

    addToast(`Verification Code Resent: ${newCode}`, `A fresh 6-digit code was dispatched to ${pendingOTP.email}.`, 'info');
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

  // 6. Create New Admin User
  const createAdminUser = (data: { name: string; email: string; username?: string; password?: string; department?: any }) => {
    const cleanEmail = data.email.trim().toLowerCase();
    const cleanUser = data.username?.trim().toLowerCase() || cleanEmail.split('@')[0].toLowerCase();
    const cleanPassword = data.password?.trim() || 'admin123';

    const newUser: AuthUser = {
      id: 'usr-' + Date.now(),
      name: data.name.trim(),
      username: cleanUser,
      email: cleanEmail,
      password: cleanPassword,
      role: 'ADMIN',
      isEmailVerified: true,
      department: data.department || 'Administration',
      avatarUrl: `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random() * 30)}?w=150`,
      createdAt: new Date().toLocaleDateString('en-AU'),
    };
    setUsers(prev => [newUser, ...prev.filter(u => u.email.toLowerCase() !== cleanEmail)]);

    try {
      fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      }).then(res => {
        if (res.ok) {
          addToast('Saved to Database', `${newUser.name} created with Admin access.`, 'success');
        } else {
          addToast('Database Error', 'Failed to save admin user to database.', 'error');
        }
      }).catch(() => addToast('Database Error', 'Failed to connect to database.', 'error'));
    } catch(e) {
      addToast('Database Error', 'Failed to save admin user to database.', 'error');
    }

    addAudit('CREATE_ADMIN_USER', 'User', newUser.id, `Created new Admin account: ${newUser.name} (@${newUser.username} / ${newUser.email})`);
  };

  // 7. Update Admin User Credentials (Username/Email & Password)
  const updateAdminCredentials = (userId: string, updates: { name?: string; email?: string; username?: string; password?: string }) => {
    let updatedUser: AuthUser | null = null;

    setUsers(prev => prev.map(u => {
      if (u.id === userId || (userId === 'CURRENT' && currentUser && u.id === currentUser.id)) {
        updatedUser = {
          ...u,
          ...(updates.name ? { name: updates.name.trim() } : {}),
          ...(updates.email ? { email: updates.email.trim().toLowerCase() } : {}),
          ...(updates.username ? { username: updates.username.trim().toLowerCase() } : {}),
          ...(updates.password ? { password: updates.password.trim() } : {}),
        };
        return updatedUser;
      }
      return u;
    }));

    if (updatedUser) {
      const u: AuthUser = updatedUser;
      if (currentUser && (currentUser.id === u.id || userId === 'CURRENT' || currentUser.email.toLowerCase() === u.email.toLowerCase())) {
        setCurrentUser(u);
      }

      try {
        fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(u),
        }).then(res => {
          if (res.ok) {
            addToast('Saved to Database', 'Admin credentials updated and saved to database.', 'success');
          } else {
            addToast('Database Error', 'Failed to save admin credentials to database.', 'error');
          }
        }).catch(() => addToast('Database Error', 'Failed to connect to database.', 'error'));
      } catch(e) {
        addToast('Database Error', 'Failed to save admin credentials to database.', 'error');
      }

      addAudit('ADMIN_CREDENTIALS_UPDATED', 'User', u.id, `Admin credentials updated for ${u.name} (@${u.username || u.email})`);
    }
  };

  // 8. Delete Admin User
  const deleteAdminUser = (userId: string) => {
    const target = users.find(u => u.id === userId);
    if (!target) return;

    if (target.role === 'SUPER_ADMIN' || target.id === 'usr-1') {
      addToast('Action Restricted', 'The primary root Super Admin account cannot be deleted.', 'warning');
      return;
    }

    setUsers(prev => prev.filter(u => u.id !== userId));

    try {
      fetch(`/api/users?id=${encodeURIComponent(userId)}`, {
        method: 'DELETE',
      }).then(res => {
        if (res.ok) {
          addToast('Saved to Database', `${target.name} removed from database.`, 'success');
        } else {
          addToast('Database Error', 'Failed to remove admin from database.', 'error');
        }
      }).catch(() => addToast('Database Error', 'Failed to connect to database.', 'error'));
    } catch (e) {
      addToast('Database Error', 'Failed to remove admin from database.', 'error');
    }

    addAudit('DELETE_ADMIN_USER', 'User', userId, `Admin user removed: ${target.name} (${target.email})`);
  };

  // 9. Super Admin Promotes User Role
  const promoteUserRole = (userId: string, newRole: UserRole) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    const target = users.find(u => u.id === userId);
    if (target) {
      try {
        fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...target, role: newRole }),
        }).catch(e => console.warn('User promote DB sync skipped:', e));
      } catch(e) {}
    }
    addAudit('PROMOTE_USER_ROLE', 'User', userId, `Super Admin changed role of ${target?.name} to ${newRole}`);
    addToast('Role Updated', `${target?.name} role updated to ${newRole}.`, 'success');

    if (target?.staffId || target?.id) {
      const staffNotif: NotificationItem = {
        id: 'notif-role-' + Date.now(),
        recipient: 'STAFF',
        recipientId: target.staffId || target.id,
        title: 'Account Role Updated',
        message: `Your system access role was updated to ${newRole.replace(/_/g, ' ')} by administration.`,
        type: 'GENERAL',
        timestamp: 'Just now',
        read: false,
      };
      setNotifications(prev => [staffNotif, ...prev]);
    }
  };

  // ==========================================
  // EMPLOYEE ONBOARDING & INVITATION SYSTEM
  // ==========================================

  // 1. Check & Update Onboarding Completion Helper
  const checkAndUpdateOnboardingCompletion = (empId: string): boolean => {
    let becameActive = false;
    let completedEmp: Employee | null = null;

    setEmployees(prev => prev.map(emp => {
      if (emp.id !== empId) return emp;

      const progress = getOnboardingProgress(emp);

      if (progress.isComplete && emp.status === 'Pending') {
        becameActive = true;
        completedEmp = {
          ...emp,
          status: 'Active' as const,
          onboardingStatus: 'COMPLETED' as const,
          profileCompletedAt: new Date().toISOString(),
        };
        return completedEmp;
      }
      return emp;
    }));

    if (becameActive && completedEmp) {
      const targetEmp: Employee = completedEmp;
      const empName = `${targetEmp.firstName} ${targetEmp.lastName}`.trim();

      // Sync to User record as well
      setUsers(prev => prev.map(u => {
        if (u.staffId === empId || (u.email && u.email.toLowerCase() === targetEmp.email.toLowerCase())) {
          return {
            ...u,
            name: `${targetEmp.firstName} ${targetEmp.lastName}`.trim(),
            department: (targetEmp.department as Department) || u.department,
          };
        }
        return u;
      }));

      // Backend Database Persistence
      try {
        fetch('/api/employees', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: empId,
            updates: {
              status: 'Active',
              onboardingStatus: 'COMPLETED',
              profileCompletedAt: targetEmp.profileCompletedAt,
            }
          }),
        }).catch(err => console.warn('Onboarding completion DB sync skipped:', err));
      } catch (e) {}

      // Audit log & Notifications
      addAudit('PROFILE_ONBOARDING_COMPLETED', 'Employee', empId, `Staff member ${empName} completed all 4 profile sections and status transitioned to fully ACTIVE.`);
      
      const adminNotif: NotificationItem = {
        id: 'notif-active-' + Date.now(),
        recipient: 'ADMIN',
        title: 'Staff Onboarding Completed: Active',
        message: `${empName} (${targetEmp.email}) completed all required profile sections. Status is now fully Active.`,
        type: 'PROFILE_UPDATE',
        timestamp: 'Just now',
        read: false,
      };
      setNotifications(prev => [adminNotif, ...prev]);

      addToast('Profile Completed!', `Congratulations! Onboarding is complete and your staff account is now fully Active.`, 'success');
      return true;
    }
    return false;
  };

  // 2. Admin Invites New Employee with Basic Info
  const inviteEmployee = (data: { firstName: string; lastName: string; email: string; department?: Department; jobTitle?: string }) => {
    const cleanEmail = data.email.trim().toLowerCase();
    const cleanFirstName = data.firstName.trim();
    const cleanLastName = data.lastName.trim();
    const newStaffId = 'emp-' + (employees.length + 1);
    const newEmpNumber = `EMP-00${Math.floor(Math.random() * 900 + 100)}`;
    const now = Date.now();
    const inviteToken = `inv-${now}-${Math.random().toString(36).substring(2, 8)}`;
    const inviteSentAt = new Date(now).toISOString();
    const inviteExpiresAt = new Date(now + 60 * 60 * 1000).toISOString(); // Valid for exactly 1 Hour
    const autoUsername = `${cleanFirstName.toLowerCase()}.${cleanLastName.toLowerCase()}`.replace(/[^a-z0-9._-]/g, '');
    const autoPin = Math.floor(1000 + Math.random() * 9000).toString();

    const newEmployee: Employee = {
      id: newStaffId,
      employeeNumber: newEmpNumber,
      username: autoUsername,
      firstName: cleanFirstName,
      lastName: cleanLastName,
      email: cleanEmail,
      mobilePhone: '',
      homePhone: '',
      dateOfBirth: '',
      startDate: new Date().toLocaleDateString('en-AU'),
      gender: 'Prefer not to say',
      address: '',
      suburb: '',
      state: 'NSW',
      postcode: '',
      department: data.department || 'Production (Riverwood)',
      jobTitle: data.jobTitle || 'Production Associate',
      workLocation: 'Sydney, NSW',
      reportsTo: 'Operations Manager',
      status: 'Pending', // STARTS AS PENDING!
      onboardingStatus: 'INVITED',
      inviteToken,
      inviteSentAt,
      inviteExpiresAt,
      avatarUrl: '',
      citizenStatus: undefined,
      visaType: '',
      visaExpiryDate: '',
      workRestrictions: '',
      workingHours: 38,
      workingHoursConfirmed: false,
      visaStatusConfirmed: false,
      hasDriverLicense: false,
      licenseCountry: 'Australia',
      licenseNumber: '',
      licenseExpiryDate: '',
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
      accountName: `${cleanFirstName} ${cleanLastName}`,
      bsbMasked: '',
      bsbEncrypted: '',
      accountNumberMasked: '',
      accountNumberEncrypted: '',
      leaveBalance: { annual: 20, sick: 10, carers: 5, longService: 0 },
      payslips: [],
      documents: [],
      kioskPin: autoPin,
      clockState: 'CLOCKED_OUT',
    };

    // Linked User Record for Auth
    const newUser: AuthUser = {
      id: 'usr-' + Date.now(),
      name: `${cleanFirstName} ${cleanLastName}`,
      email: cleanEmail,
      role: 'STAFF',
      isEmailVerified: false,
      staffId: newStaffId,
      department: (data.department as Department) || 'Production (Riverwood)',
      avatarUrl: '',
      createdAt: new Date().toLocaleDateString('en-AU'),
    };

    setEmployees(prev => [newEmployee, ...prev]);
    setUsers(prev => {
      const filtered = prev.filter(u => u.email.toLowerCase() !== cleanEmail);
      return [newUser, ...filtered];
    });

    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const inviteUrl = `${origin}/?invite=${inviteToken}&email=${encodeURIComponent(cleanEmail)}`;

    // MySQL Backend Sync
    try {
      fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEmployee),
      }).catch(e => console.warn('New employee DB sync skipped:', e));

      fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      }).catch(e => console.warn('New user DB sync skipped:', e));

      // Dispatch Onboarding Invitation Email to Staff's Inbox
      fetch('/api/auth/send-invite-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          firstName: cleanFirstName,
          lastName: cleanLastName,
          inviteUrl,
          department: newEmployee.department,
          jobTitle: newEmployee.jobTitle,
        }),
      }).catch(err => console.warn('Invitation email background dispatch skipped:', err));
    } catch(e) {}

    addAudit('INVITE_EMPLOYEE', 'Employee', newStaffId, `Admin added pending employee ${cleanFirstName} ${cleanLastName} (${cleanEmail}) and dispatched email invitation (valid for 1 hour).`);
    
    // Notification for Admin
    const adminNotif: NotificationItem = {
      id: 'notif-' + Date.now(),
      recipient: 'ADMIN',
      title: 'Staff Invitation Sent (Pending - Valid 1 Hour)',
      message: `Invitation email sent to ${cleanFirstName} ${cleanLastName} (${cleanEmail}). Status is Pending until profile is completed.`,
      type: 'GENERAL',
      timestamp: 'Just now',
      read: false,
    };
    setNotifications(prev => [adminNotif, ...prev]);

    addToast('Invitation Dispatched (Valid 1 Hour)', `Added ${cleanFirstName} ${cleanLastName}. Invitation email dispatched to ${cleanEmail}.`, 'success');

    return { employee: newEmployee, inviteUrl, inviteToken };
  };

  // 2.5 Admin Resends Invitation Email to Pending Staff Member
  const resendStaffInvite = async (empId: string): Promise<{ success: boolean; inviteUrl?: string; message?: string }> => {
    const emp = employees.find(e => e.id === empId);
    if (!emp) {
      addToast('Employee Not Found', 'Could not locate employee record to resend invitation.', 'error');
      return { success: false, message: 'Employee not found.' };
    }

    const now = Date.now();
    const freshToken = `inv-${now}-${Math.random().toString(36).substring(2, 8)}`;
    const freshSentAt = new Date(now).toISOString();
    const freshExpiresAt = new Date(now + 60 * 60 * 1000).toISOString(); // Fresh 1-hour window

    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const cleanEmail = emp.email.trim().toLowerCase();
    const freshUrl = `${origin}/?invite=${freshToken}&email=${encodeURIComponent(cleanEmail)}`;

    const updates: Partial<Employee> = {
      inviteToken: freshToken,
      inviteSentAt: freshSentAt,
      inviteExpiresAt: freshExpiresAt,
      onboardingStatus: 'INVITED',
    };

    setEmployees(prev => prev.map(e => e.id === empId ? { ...e, ...updates } : e));

    try {
      await fetch('/api/employees', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: empId, updates }),
      });

      await fetch('/api/auth/send-invite-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          firstName: emp.firstName,
          lastName: emp.lastName,
          inviteUrl: freshUrl,
          department: emp.department,
          jobTitle: emp.jobTitle,
        }),
      });

      addAudit('RESEND_INVITATION', 'Employee', emp.id, `Admin resent onboarding invitation email to ${emp.firstName} ${emp.lastName} (${cleanEmail}). Valid for 1 hour.`);
      addToast('Fresh Invitation Dispatched', `New 1-hour invitation email sent to ${cleanEmail}.`, 'success');
      return { success: true, inviteUrl: freshUrl };
    } catch (err: any) {
      console.warn('Failed to dispatch resend email:', err);
      addToast('Email Dispatch Failed', 'Saved fresh invitation link. You can copy the link manually.', 'warning');
      return { success: true, inviteUrl: freshUrl, message: 'Saved with local link' };
    }
  };

  // 2.7 Admin Sends Profile Completion Reminder Email to Pending Staff
  const sendProfileCompletionReminder = async (empId: string): Promise<{ success: boolean; message: string }> => {
    const emp = employees.find(e => e.id === empId);
    if (!emp) {
      addToast('Employee Not Found', 'Could not locate employee record to send reminder.', 'error');
      return { success: false, message: 'Employee not found.' };
    }

    const progress = getOnboardingProgress(emp);
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const cleanEmail = emp.email.trim().toLowerCase();
    const loginUrl = `${origin}/?login=true&email=${encodeURIComponent(cleanEmail)}`;

    try {
      const res = await fetch('/api/auth/send-reminder-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          firstName: emp.firstName,
          lastName: emp.lastName,
          loginUrl,
          missingSections: progress.missingSectionTitles,
          completedCount: progress.completedCount,
          totalSections: progress.totalSections,
          department: emp.department,
          jobTitle: emp.jobTitle,
        }),
      });

      const resJson = await res.json();
      const empName = `${emp.firstName} ${emp.lastName}`.trim();

      addAudit(
        'SEND_PROFILE_REMINDER',
        'Employee',
        emp.id,
        `Admin sent profile completion reminder email to ${empName} (${cleanEmail}). Progress: ${progress.completedCount}/${progress.totalSections} sections. Missing: ${progress.missingSectionTitles.join(', ')}.`
      );

      addToast(
        'Reminder Dispatched',
        `Profile completion reminder sent to ${cleanEmail} (${progress.completedCount} of ${progress.totalSections} completed).`,
        'success'
      );

      const staffNotif: NotificationItem = {
        id: 'notif-reminder-' + Date.now(),
        recipient: 'STAFF',
        recipientId: emp.id,
        title: 'Action Required: Complete Onboarding Profile',
        message: `Administration sent a reminder to complete your profile sections (${progress.missingSectionTitles.join(', ') || 'Pending sections'}). Status will transition to Active upon completion.`,
        type: 'PROFILE_UPDATE',
        timestamp: 'Just now',
        read: false,
      };
      setNotifications(prev => [staffNotif, ...prev]);

      return {
        success: true,
        message: resJson.message || `Profile reminder sent to ${cleanEmail}`,
      };
    } catch (err: any) {
      console.warn('Failed to send profile reminder email:', err);
      addToast('Reminder Dispatch Failed', 'Could not send reminder email via server.', 'error');
      return { success: false, message: err.message || 'Failed to dispatch email' };
    }
  };

  // 3. Staff Sets Password from Invite Link
  const setPasswordFromInvite = (inviteToken: string, newPassword: string, customUsername?: string, customPin?: string) => {
    const rawInput = (inviteToken || '').trim();
    let actualToken = rawInput;
    let targetEmail = '';

    if (rawInput.includes('invite=')) {
      const match = rawInput.match(/invite=([^&]+)/);
      if (match) actualToken = match[1];
      const emailMatch = rawInput.match(/email=([^&]+)/);
      if (emailMatch) {
        try {
          targetEmail = decodeURIComponent(emailMatch[1]).toLowerCase();
        } catch (e) {
          targetEmail = emailMatch[1].toLowerCase();
        }
      }
    }

    // Match employee robustly by inviteToken, full raw string, email, or employee id
    const emp = employees.find(e => 
      (e.inviteToken && (e.inviteToken === actualToken || actualToken.includes(e.inviteToken))) || 
      (e.inviteToken && e.inviteToken === rawInput) ||
      (targetEmail && e.email.toLowerCase() === targetEmail) ||
      e.email.toLowerCase() === rawInput.toLowerCase() ||
      e.id === rawInput
    );
    
    if (!emp) {
      addToast('Invalid or Expired Invitation', 'Could not locate a staff record matching this invite link.', 'error');
      return { success: false, message: 'Invalid or expired invitation token.' };
    }

    if (emp.status === 'Archived') {
      addToast('Account Archived', 'This staff record has been archived by administration. Access is suspended.', 'error');
      return { success: false, message: 'This staff record has been archived. Please contact administration.' };
    }

    // 1-Hour Expiration Check
    let isExpired = false;
    if (emp.inviteExpiresAt) {
      isExpired = new Date().getTime() > new Date(emp.inviteExpiresAt).getTime();
    } else if (emp.inviteSentAt) {
      isExpired = new Date().getTime() - new Date(emp.inviteSentAt).getTime() > 60 * 60 * 1000;
    } else if (emp.inviteToken && emp.inviteToken.startsWith('inv-')) {
      const parts = emp.inviteToken.split('-');
      const timestamp = parseInt(parts[1], 10);
      if (!isNaN(timestamp) && timestamp > 1000000000000) {
        isExpired = Date.now() - timestamp > 60 * 60 * 1000;
      }
    }

    if (isExpired) {
      addToast('Invitation Expired', 'This invitation link has expired (valid for 1 hour). Please ask your administrator to resend an invitation email.', 'error');
      return { 
        success: false, 
        message: 'This invitation link has expired (invitations are valid for 1 hour). Please ask your administrator to resend an invitation email.' 
      };
    }

    const updatedEmp: Partial<Employee> = {
      onboardingStatus: 'PASSWORD_SET',
      passwordSetAt: new Date().toISOString(),
      username: customUsername?.trim().toLowerCase() || emp.username,
      kioskPin: customPin?.trim() || emp.kioskPin,
    };

    setEmployees(prev => prev.map(e => e.id === emp.id ? { ...e, ...updatedEmp } : e));

    // Update or create verified AuthUser
    const targetUser = users.find(u => u.email.toLowerCase() === emp.email.toLowerCase()) || {
      id: 'usr-' + emp.id,
      name: `${emp.firstName} ${emp.lastName}`,
      email: emp.email,
      role: 'STAFF' as UserRole,
      isEmailVerified: true,
      staffId: emp.id,
      department: (emp.department as Department) || 'Production (Riverwood)',
      createdAt: new Date().toLocaleDateString('en-AU'),
    };

    const verifiedUser: AuthUser = {
      ...targetUser,
      isEmailVerified: true,
      staffId: emp.id,
    };

    setUsers(prev => {
      const filtered = prev.filter(u => u.email.toLowerCase() !== emp.email.toLowerCase());
      return [verifiedUser, ...filtered];
    });

    // Sync to MySQL backend
    try {
      fetch('/api/employees', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: emp.id, updates: updatedEmp }),
      }).catch(e => {});

      fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(verifiedUser),
      }).catch(e => {});
    } catch (e) {}

    // Auto-login as STAFF
    setCurrentStaffId(emp.id);
    setCurrentUser(verifiedUser);
    setActivePortal('STAFF');
    setShowAuthModal(false);

    addAudit('STAFF_PASSWORD_SET', 'User', verifiedUser.id, `Staff member ${emp.firstName} ${emp.lastName} set account password via invite link.`);
    addToast('Password Created & Signed In', `Welcome, ${emp.firstName}! Please complete your staff profile to activate your account.`, 'success');

    return { success: true, message: 'Password set successfully. Welcome to HsCreations!', user: verifiedUser };
  };

  // ==========================================
  // 5-MINUTE EXPIRING FORGOT PASSWORD SYSTEM
  // ==========================================

  const requestPasswordReset = async (emailInput: string) => {
    const cleanEmail = (emailInput || '').trim().toLowerCase();
    if (!cleanEmail) {
      addToast('Email Required', 'Please provide your registered work email address.', 'warning');
      return { success: false, message: 'Email address is required.' };
    }

    // Find account by email in users or employees
    const matchedUser = users.find(u => u.email.toLowerCase() === cleanEmail);
    const matchedEmp = employees.find(e => e.email.toLowerCase() === cleanEmail);

    if (!matchedUser && !matchedEmp) {
      addToast(
        'Account Not Found',
        `No registered staff or admin account found matching "${cleanEmail}".`,
        'error'
      );
      return { 
        success: false, 
        message: `No account found with email "${cleanEmail}". Please check your email address or contact HR.` 
      };
    }

    const userName = matchedUser?.name || `${matchedEmp?.firstName} ${matchedEmp?.lastName}`.trim() || 'Staff Member';
    const userId = matchedUser?.id || matchedEmp?.id || `usr-${Date.now()}`;

    // Generate secure 5-minute single-use token
    const token = `rst-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
    const now = Date.now();
    const expiresAt = now + 5 * 60 * 1000; // Exactly 5 minutes (300,000 ms)

    const newToken: PasswordResetToken = {
      token,
      email: cleanEmail,
      userId,
      userName,
      createdAt: now,
      expiresAt,
      used: false,
    };

    const updatedTokens = [newToken, ...passwordResetTokens.filter(t => t.email !== cleanEmail || t.used)];
    setPasswordResetTokens(updatedTokens);
    try {
      localStorage.setItem('ems_reset_tokens_v1', JSON.stringify(updatedTokens));
    } catch(e) {}

    // Construct reset URL
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const resetUrl = `${origin}/?resetToken=${token}&email=${encodeURIComponent(cleanEmail)}`;

    // Dispatch email via backend API
    try {
      const res = await fetch('/api/auth/send-reset-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          userName,
          resetUrl,
          expiresInMinutes: 5,
        }),
      });
      const data = await res.json();
      console.log('Password reset email API result:', data);
    } catch(err) {
      console.warn('Background reset email error:', err);
    }

    addAudit(
      'PASSWORD_RESET_REQUESTED',
      'User',
      userId,
      `Password reset link (valid for 5 minutes) generated and dispatched for ${cleanEmail}.`,
      userName,
      matchedUser?.role || 'STAFF'
    );

    addToast(
      'Reset Link Sent',
      `A 5-minute password reset link was sent to ${cleanEmail}. Check your inbox!`,
      'success'
    );

    return {
      success: true,
      message: `A secure password reset link has been dispatched to ${cleanEmail}. The link is valid for 5 minutes.`,
      resetUrl,
      token,
      user: matchedUser,
    };
  };

  const verifyResetToken = (tokenInput: string) => {
    const raw = (tokenInput || '').trim();
    let actualToken = raw;
    let targetEmail = '';

    if (raw.includes('resetToken=')) {
      const match = raw.match(/resetToken=([^&]+)/);
      if (match) actualToken = match[1];
    }
    if (raw.includes('email=')) {
      const match = raw.match(/email=([^&]+)/);
      if (match) {
        try { targetEmail = decodeURIComponent(match[1]).toLowerCase(); } catch(e) { targetEmail = match[1].toLowerCase(); }
      }
    }

    // Match in state or localStorage
    let tokenObj = passwordResetTokens.find(t => t.token === actualToken);
    if (!tokenObj) {
      try {
        const saved = localStorage.getItem('ems_reset_tokens_v1');
        if (saved) {
          const parsed: PasswordResetToken[] = JSON.parse(saved);
          tokenObj = parsed.find(t => t.token === actualToken);
        }
      } catch(e) {}
    }

    // Fallback: parse token timestamp if rst-<timestamp>-<rand>
    if (!tokenObj && actualToken.startsWith('rst-')) {
      const parts = actualToken.split('-');
      const ts = parseInt(parts[1], 10);
      if (!isNaN(ts) && ts > 1000000000000) {
        tokenObj = {
          token: actualToken,
          email: targetEmail || '',
          userId: 'usr-auto',
          userName: 'Staff Member',
          createdAt: ts,
          expiresAt: ts + 5 * 60 * 1000,
          used: false,
        };
      }
    }

    if (!tokenObj) {
      return { valid: false, expired: false };
    }

    const now = Date.now();
    const isExpired = now > tokenObj.expiresAt || tokenObj.used;
    const remainingMs = Math.max(0, tokenObj.expiresAt - now);
    const remainingSeconds = Math.ceil(remainingMs / 1000);

    return {
      valid: !isExpired,
      expired: isExpired,
      email: tokenObj.email,
      userName: tokenObj.userName,
      remainingSeconds,
      tokenObj,
    };
  };

  const completePasswordReset = async (tokenInput: string, newPassword: string) => {
    const verification = verifyResetToken(tokenInput);
    if (!verification.valid || !verification.tokenObj) {
      const msg = verification.expired
        ? 'This password reset link has expired (links are valid for 5 minutes). Please request a new link.'
        : 'Invalid or missing password reset link.';
      addToast('Reset Link Expired', msg, 'error');
      return { success: false, message: msg };
    }

    const cleanPassword = (newPassword || '').trim();
    if (cleanPassword.length < 6) {
      addToast('Password Too Short', 'New password must be at least 6 characters.', 'warning');
      return { success: false, message: 'Password must be at least 6 characters.' };
    }

    const targetEmail = verification.tokenObj.email.toLowerCase();

    // 1. Update user password in React state
    let targetUser: AuthUser | null = null;
    setUsers(prev => {
      return prev.map(u => {
        if (u.email.toLowerCase() === targetEmail) {
          targetUser = { ...u, password: cleanPassword, isEmailVerified: true };
          return targetUser;
        }
        return u;
      });
    });

    // 2. Mark token as used
    const updatedTokens = passwordResetTokens.map(t => 
      t.token === verification.tokenObj?.token ? { ...t, used: true } : t
    );
    setPasswordResetTokens(updatedTokens);
    try {
      localStorage.setItem('ems_reset_tokens_v1', JSON.stringify(updatedTokens));
    } catch(e) {}

    // 3. Persist to server backend API
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: targetEmail,
          newPassword: cleanPassword,
          token: verification.tokenObj.token,
        }),
      });
      const data = await res.json();
      console.log('Reset password API response:', data);
    } catch(err) {
      console.warn('Backend password reset sync error:', err);
    }

    addAudit(
      'PASSWORD_RESET_COMPLETED',
      'User',
      verification.tokenObj.userId,
      `Password successfully reset using 5-minute security link for ${targetEmail}.`,
      verification.tokenObj.userName,
      'AUTH'
    );

    addToast(
      'Password Reset Successful',
      'Your password has been updated. You can now sign in with your new credentials.',
      'success'
    );

    return {
      success: true,
      message: 'Password reset successfully. You can now log in.',
      email: targetEmail,
    };
  };

  const updateStaffPassword = async (params: { userId?: string; email?: string; staffId?: string; currentPassword?: string; newPassword: string }) => {
    const { userId, email, staffId, currentPassword, newPassword } = params;
    const cleanPassword = (newPassword || '').trim();

    if (cleanPassword.length < 6) {
      addToast('Password Too Short', 'New password must be at least 6 characters long.', 'warning');
      return { success: false, message: 'Password must be at least 6 characters long.' };
    }

    // Determine target user
    let targetUser = users.find(u => 
      (userId && u.id === userId) ||
      (email && u.email.toLowerCase() === email.toLowerCase()) ||
      (staffId && u.staffId === staffId) ||
      (currentUser && (u.id === currentUser.id || (currentUser.email && u.email.toLowerCase() === currentUser.email.toLowerCase()))) ||
      (currentStaff && (u.staffId === currentStaff.id || (currentStaff.email && u.email.toLowerCase() === currentStaff.email.toLowerCase())))
    );

    if (!targetUser) {
      // Fallback: create or find user based on currentStaff
      if (currentStaff) {
        targetUser = {
          id: `usr-${currentStaff.id}`,
          name: `${currentStaff.firstName} ${currentStaff.lastName}`,
          username: currentStaff.username || currentStaff.email.split('@')[0],
          email: currentStaff.email,
          password: cleanPassword,
          role: 'STAFF',
          isEmailVerified: true,
          staffId: currentStaff.id,
          avatarUrl: currentStaff.avatarUrl,
          createdAt: new Date().toLocaleDateString('en-AU'),
        };
      } else if (currentUser) {
        targetUser = { ...currentUser };
      }
    }

    if (!targetUser) {
      addToast('User Not Found', 'Could not locate the associated staff account.', 'error');
      return { success: false, message: 'Staff account not found.' };
    }

    // If target user already had an existing non-empty password, verify current password if provided
    if (targetUser.password && targetUser.password.trim().length > 0 && currentPassword !== undefined && currentPassword.trim().length > 0) {
      if (targetUser.password !== currentPassword.trim()) {
        addToast('Verification Failed', 'Current password entered is incorrect.', 'error');
        return { success: false, message: 'Current password entered is incorrect.' };
      }
    }

    const updatedUser: AuthUser = {
      ...targetUser,
      password: cleanPassword,
      isEmailVerified: true,
    };

    // 1. Update users in state
    setUsers(prev => {
      const exists = prev.some(u => u.id === updatedUser.id || u.email.toLowerCase() === updatedUser.email.toLowerCase());
      if (exists) {
        return prev.map(u => (u.id === updatedUser.id || u.email.toLowerCase() === updatedUser.email.toLowerCase()) ? updatedUser : u);
      }
      return [updatedUser, ...prev];
    });

    // 2. Update currentUser if matching
    if (currentUser && (currentUser.id === updatedUser.id || currentUser.email.toLowerCase() === updatedUser.email.toLowerCase() || (updatedUser.staffId && currentUser.staffId === updatedUser.staffId))) {
      setCurrentUser(updatedUser);
      try {
        localStorage.setItem('ems_current_user_v1', JSON.stringify(updatedUser));
      } catch(e) {}
    }

    // 3. Save to localStorage
    try {
      const allUsers = users.map(u => (u.id === updatedUser.id || u.email.toLowerCase() === updatedUser.email.toLowerCase()) ? updatedUser : u);
      if (!allUsers.some(u => u.id === updatedUser.id || u.email.toLowerCase() === updatedUser.email.toLowerCase())) {
        allUsers.push(updatedUser);
      }
      localStorage.setItem('ems_users_v1', JSON.stringify(allUsers));
    } catch(e) {}

    // 4. Save to backend API
    try {
      await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUser),
      });
      await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: updatedUser.id,
          email: updatedUser.email,
          updates: {
            password: cleanPassword,
            isEmailVerified: true,
          }
        }),
      });
    } catch (err) {
      console.warn('Backend user password update error:', err);
    }

    addAudit(
      'PASSWORD_UPDATED',
      'User',
      updatedUser.id,
      `Sign-in password updated for ${updatedUser.name} (${updatedUser.email}).`,
      updatedUser.name,
      updatedUser.role || 'STAFF'
    );

    addToast(
      'Password Updated',
      'Your sign-in password has been successfully updated.',
      'success'
    );

    return { success: true, message: 'Password updated successfully.' };
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

    // MySQL Backend Sync
    try {
      fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEmployee),
      }).catch(err => console.warn('Employee DB sync skipped:', err));
    } catch (e) {}
  };

  const updateEmployee = (id: string, updates: Partial<Employee>) => {
    const target = employees.find(e => e.id === id);
    const empName = target ? `${target.firstName} ${target.lastName}` : 'Staff Member';

    let autoCompletedToActive = false;
    let completedEmp: Employee | null = null;

    setEmployees(prev => prev.map(e => {
      if (e.id !== id) return e;
      const merged = { ...e, ...updates };
      const progress = getOnboardingProgress(merged);
      if (progress.isComplete && merged.status === 'Pending') {
        autoCompletedToActive = true;
        merged.status = 'Active';
        merged.onboardingStatus = 'COMPLETED';
        if (!merged.profileCompletedAt) {
          merged.profileCompletedAt = new Date().toISOString();
        }
        completedEmp = merged;
      }
      return merged;
    }));

    // Comprehensive field label dictionary for exact reporting
    const FIELD_LABELS: Record<string, string> = {
      firstName: 'First Name',
      lastName: 'Last Name',
      email: 'Email Address',
      mobilePhone: 'Mobile Phone',
      homePhone: 'Home Phone',
      dateOfBirth: 'Date of Birth',
      startDate: 'Start Date',
      gender: 'Gender',
      address: 'Residential Address',
      suburb: 'Suburb',
      state: 'State',
      postcode: 'Postcode',
      department: 'Department',
      jobTitle: 'Job Title',
      workLocation: 'Work Location',
      reportsTo: 'Reporting Manager',
      status: 'Employment Status',
      workingHours: 'Weekly Hours',
      workingHoursConfirmed: 'Working Hours Confirmation',
      citizenStatus: 'Citizenship / Work Rights',
      visaType: 'Visa Subclass',
      visaExpiryDate: 'Visa Expiry Date',
      visaStatusConfirmed: 'Visa Verification',
      hasDriverLicense: 'Driver Licence Status',
      licenseCountry: 'Licence State / Country',
      licenseNumber: 'Licence Number',
      licenseExpiryDate: 'Licence Expiry Date',
      emergencyNextOfKin: 'Emergency Contact Name',
      emergencyRelationship: 'Emergency Relationship',
      emergencyMobile: 'Emergency Mobile',
      emergencyHomePhone: 'Emergency Home Phone',
      emergencyAddress: 'Emergency Address',
      emergencySuburb: 'Emergency Suburb',
      emergencyState: 'Emergency State',
      emergencyPostcode: 'Emergency Postcode',
      bankName: 'Bank Name',
      bankBranch: 'Bank Branch',
      accountName: 'Account Name',
      bsbMasked: 'BSB Number',
      bsbEncrypted: 'BSB Number',
      accountNumberMasked: 'Account Number',
      accountNumberEncrypted: 'Account Number',
      tfnMasked: 'Tax File Number (TFN)',
      tfnEncrypted: 'Tax File Number (TFN)',
      superFundName: 'Superannuation Fund',
      superMemberNumber: 'Super Member Number',
      username: 'Shift Username',
      kioskPin: 'Shift Punch PIN',
      clockState: 'Clock State',
      avatarUrl: 'Profile Photo',
      onboardingStatus: 'Onboarding Status',
    };

    const changedKeys = Object.keys(updates);
    const changedFieldNames = changedKeys
      .map(k => FIELD_LABELS[k] || k.replace(/([A-Z])/g, ' $1').trim())
      .filter(Boolean);
    const changedFieldsList = changedFieldNames.join(', ');

    // Determine who performed the update: Staff editing their own profile vs Administrator managing staff
    const isStaffPortal = activePortal === 'STAFF';
    const isCurrentUserStaff = currentUser?.role === 'STAFF';
    const isSelfEdit = (currentUser?.staffId === id) || (isStaffPortal && (!currentUser || isCurrentUserStaff));

    if (isSelfEdit) {
      // 1. Staff is updating their own profile
      // Dispatch notification to Admin
      const adminNotif: NotificationItem = {
        id: 'notif-staff-edit-' + Date.now(),
        recipient: 'ADMIN',
        title: `Staff Profile Updated: ${empName}`,
        message: `${empName} updated their profile information (${changedFieldsList || 'Profile details'}).`,
        type: 'PROFILE_UPDATE',
        timestamp: 'Just now',
        read: false,
      };
      setNotifications(prev => [adminNotif, ...prev]);

      addAudit(
        'STAFF_PROFILE_UPDATE',
        'Employee',
        id,
        `Staff member ${empName} updated their profile: ${changedFieldsList || 'Profile details'}`,
        empName,
        'STAFF'
      );
      addToast('Profile Updated', 'Your profile details have been updated successfully.', 'success');
    } else {
      // 2. Administrator updated this employee's records
      const adminName = currentUser?.name || 'Administrator';
      const adminRole = currentUser?.role || 'ADMIN';

      // Send informative notification to the staff member detailing the EXACT fields updated
      const staffNotif: NotificationItem = {
        id: 'notif-update-' + Date.now(),
        recipient: 'STAFF',
        recipientId: id,
        title: 'Profile Updated by Administrator',
        message: `Your profile was updated by ${adminName}. Fields modified: ${changedFieldsList || 'Profile details'}.`,
        type: 'PROFILE_UPDATE',
        timestamp: 'Just now',
        read: false,
      };
      setNotifications(prev => [staffNotif, ...prev]);

      addAudit(
        'ADMIN_UPDATE_EMPLOYEE',
        'Employee',
        id,
        `Admin (${adminName}) updated fields for ${empName}: ${changedFieldsList || 'Profile details'}`,
        adminName,
        adminRole
      );
      addToast('Employee Details Updated', `Changes saved and notification sent to ${empName}.`, 'success');
    }

    // If onboarding auto-transitioned to Active
    const finalUpdates: any = { ...updates };
    if (autoCompletedToActive && completedEmp) {
      const cEmp: Employee = completedEmp;
      finalUpdates.status = 'Active';
      finalUpdates.onboardingStatus = 'COMPLETED';
      finalUpdates.profileCompletedAt = cEmp.profileCompletedAt;

      // Sync to User record
      setUsers(prev => prev.map(u => {
        if (u.staffId === id || (u.email && u.email.toLowerCase() === cEmp.email.toLowerCase())) {
          return {
            ...u,
            name: `${cEmp.firstName} ${cEmp.lastName}`.trim(),
            department: (cEmp.department as Department) || u.department,
          };
        }
        return u;
      }));

      addAudit('PROFILE_ONBOARDING_COMPLETED', 'Employee', id, `Staff member ${empName} completed all 4 profile sections and status transitioned to fully ACTIVE.`);

      const adminNotif: NotificationItem = {
        id: 'notif-active-' + Date.now(),
        recipient: 'ADMIN',
        title: 'Staff Onboarding Completed: Active',
        message: `${empName} (${cEmp.email}) completed all required profile sections. Status is now fully Active.`,
        type: 'PROFILE_UPDATE',
        timestamp: 'Just now',
        read: false,
      };
      setNotifications(prev => [adminNotif, ...prev]);

      addToast('Profile Completed!', `Congratulations! Onboarding is complete and your staff account is now fully Active.`, 'success');
    }

    // Check if updating this profile completed onboarding via standalone check
    setTimeout(() => {
      checkAndUpdateOnboardingCompletion(id);
    }, 100);

    // MySQL Backend Sync
    try {
      fetch('/api/employees', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, updates: finalUpdates }),
      }).catch(err => console.warn('Employee update DB sync skipped:', err));
    } catch (e) {}
  };

  const deleteEmployee = (id: string) => {
    const target = employees.find(e => e.id === id);
    const empName = target ? `${target.firstName} ${target.lastName}` : 'Staff Member';
    const empNum = target?.employeeNumber || id;

    setEmployees(prev => prev.filter(e => e.id !== id));

    // MySQL Backend Sync
    try {
      fetch(`/api/employees?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      }).catch(err => console.warn('Employee delete DB sync skipped:', err));
    } catch (e) {}

    addAudit('DELETE_EMPLOYEE', 'Employee', id, `Admin permanently deleted staff member ${empName} (${empNum}) from records.`);
    addToast('Employee Deleted', `${empName} (${empNum}) has been permanently deleted from records.`, 'info');
  };

  const archiveEmployee = (id: string, isArchived: boolean = true) => {
    const target = employees.find(e => e.id === id);
    const empName = target ? `${target.firstName} ${target.lastName}` : 'Staff Member';
    const empNum = target?.employeeNumber || id;
    const newStatus: Employee['status'] = isArchived ? 'Archived' : 'Active';

    // Auto-clock out if employee is currently on shift when archived
    let updatedClockState = target?.clockState || 'CLOCKED_OUT';
    let autoClockOutTimecardUpdates: Partial<TimecardRecord> | null = null;
    if (isArchived && target && target.clockState === 'CLOCKED_IN') {
      updatedClockState = 'CLOCKED_OUT';
      const now = new Date();
      const nowMs = now.getTime();
      const timeStr = now.toLocaleTimeString('en-AU', { timeZone: 'Australia/Sydney', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

      setTimecards(prev => prev.map(tc => {
        if (tc.employeeId === id && tc.status === 'CLOCKED_IN') {
          const startMs = tc.clockInTimestamp || nowMs;
          const elapsedSec = Math.max(0, Math.floor((nowMs - startMs) / 1000));
          const breakMins = elapsedSec > 4 * 3600 ? 30 : 0;
          const netHours = Math.max(0, parseFloat(((elapsedSec - (breakMins * 60)) / 3600).toFixed(2)));
          return {
            ...tc,
            clockOut: timeStr,
            clockOutTimestamp: nowMs,
            totalHours: netHours,
            durationSeconds: elapsedSec,
            breakMinutes: breakMins,
            status: 'COMPLETED' as const,
            notes: (tc.notes ? tc.notes + ' | ' : '') + 'Auto clocked out upon account archiving by Admin.',
          };
        }
        return tc;
      }));
    }

    // Direct update to state
    setEmployees(prev => prev.map(e => {
      if (e.id === id) {
        return {
          ...e,
          status: newStatus,
          clockState: updatedClockState,
          lastClockOut: isArchived && target?.clockState === 'CLOCKED_IN' ? new Date().toISOString() : e.lastClockOut,
        };
      }
      return e;
    }));

    // If currently logged-in user is this archived staff member, invalidate active session
    if (isArchived) {
      if (currentUser?.staffId === id || (target && currentUser?.email?.toLowerCase() === target.email.toLowerCase())) {
        if (currentUser?.role === 'STAFF') {
          setCurrentUser(null);
          setShowAuthModal(true);
          addToast('Session Ended', 'Your staff account has been archived by administration. You have been signed out.', 'warning');
        }
      }
      if (currentStaffId === id) {
        const nextActive = employees.find(e => e.id !== id && e.status !== 'Archived');
        if (nextActive) {
          setCurrentStaffId(nextActive.id);
        }
      }
    }

    // MySQL Backend Sync
    try {
      fetch('/api/employees', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id, 
          updates: { 
            status: newStatus,
            clockState: updatedClockState
          } 
        }),
      }).catch(err => console.warn('Employee archive DB sync skipped:', err));
    } catch (e) {}

    const adminName = currentUser?.name || 'Administrator';
    const adminRole = currentUser?.role || 'ADMIN';
    const auditAction = isArchived ? 'ARCHIVE_EMPLOYEE' : 'UNARCHIVE_EMPLOYEE';
    const auditMsg = isArchived
      ? `Admin (${adminName}) archived staff member ${empName} (${empNum}). Sign-in & Shift Clock punch access disabled. Profile and all previous records are preserved.`
      : `Admin (${adminName}) unarchived staff member ${empName} (${empNum}). Status restored to Active. Login & clock-in access restored with previous credentials.`;

    addAudit(auditAction, 'Employee', id, auditMsg, adminName, adminRole);

    addToast(
      isArchived ? 'Employee Archived' : 'Employee Restored to Active',
      isArchived
        ? `${empName} has been archived. Sign-in and clock-in access are suspended; historical records remain preserved.`
        : `${empName} has been unarchived and reactivated. Login and Shift Clock access restored with original credentials.`,
      isArchived ? 'warning' : 'success'
    );

    const staffNotif: NotificationItem = {
      id: 'notif-archive-' + Date.now(),
      recipient: 'STAFF',
      recipientId: id,
      title: isArchived ? 'Staff Account Archived' : 'Staff Account Restored to Active',
      message: isArchived
        ? 'Your staff account has been archived by administration. Login and Shift Clock access are disabled; historical timecards and documents are safely preserved.'
        : 'Your staff account has been restored to Active status by administration. You can now sign in and clock in with your previous login credentials.',
      type: 'GENERAL',
      timestamp: 'Just now',
      read: false,
    };
    setNotifications(prev => [staffNotif, ...prev]);
  };

  const unarchiveEmployee = (id: string) => {
    archiveEmployee(id, false);
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
      title: `New ${req.leaveType} Request: ${req.employeeName}`,
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

    // MySQL Backend Sync
    try {
      fetch('/api/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReq),
      }).catch(err => console.warn('Leave request DB sync skipped:', err));
    } catch (e) {}
    
    addAudit('SUBMIT_LEAVE_REQUEST', 'LeaveRequest', newReq.id, `Submitted ${req.leaveType} leave (${req.totalDays} days) starting ${req.startDate}`, req.employeeName, 'STAFF');
    addToast('Leave Submitted & Admin Emailed', `Notification & email dispatched to Admin for ${req.employeeName}'s ${req.leaveType} leave request.`, 'success');
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
          const newBal = Math.max(0, emp.leaveBalance[typeKey] - req.totalDays);
          const updatedBalance = {
            ...emp.leaveBalance,
            [typeKey]: newBal,
          };

          // Sync balance change to backend
          try {
            fetch('/api/employees', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: emp.id,
                updates: {
                  leaveBalance: updatedBalance,
                }
              }),
            }).catch(e => {});
          } catch(e) {}

          return {
            ...emp,
            leaveBalance: updatedBalance,
          };
        }
        return emp;
      }));
    }

    // MySQL Backend Sync
    try {
      fetch('/api/leave', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, notes }),
      }).catch(err => console.warn('Leave review DB sync skipped:', err));
    } catch (e) {}

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
    const targetLeave = leaveRequests.find(r => r.id === leaveId);
    const emp = employees.find(e => e.id === targetLeave?.employeeId);
    const empName = emp ? `${emp.firstName} ${emp.lastName}` : (targetLeave?.employeeName || 'Staff Member');

    setLeaveRequests(prev => prev.map(r => r.id === leaveId ? { ...r, certificateUploaded: true, certificateUrl: fileUrl, reminderCount: 0 } : r));
    try {
      fetch('/api/leave', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: leaveId,
          certificateUploaded: true,
          certificateUrl: fileUrl,
          reminderCount: 0,
        }),
      }).catch(err => console.warn('Leave certificate sync skipped:', err));
    } catch (e) {}

    // Dispatch Admin Notification
    const adminNotif: NotificationItem = {
      id: 'notif-med-' + Date.now(),
      recipient: 'ADMIN',
      title: `Medical Certificate Attached: ${empName}`,
      message: `${empName} uploaded a medical certificate for sick leave (${targetLeave?.startDate || 'Leave'}).`,
      type: 'LEAVE_REQUEST',
      timestamp: 'Just now',
      read: false,
    };
    setNotifications(prev => [adminNotif, ...prev]);

    addToast('Medical Certificate Uploaded', 'Your certificate has been attached and sent to HR.', 'success');
  };

  const updateBankDetails = (empId: string, bank: { bankName: string; bankBranch: string; accountName: string; bsb: string; accountNumber: string; superFund: string; superNumber: string }) => {
    const bsbEnc = encryptAES256(bank.bsb);
    const accEnc = encryptAES256(bank.accountNumber);
    const bsbMask = bank.bsb.length >= 3 ? `${bank.bsb.slice(0, 3)}-•••` : '•••-•••';
    const accMask = maskSensitive(bank.accountNumber, 3);

    let autoCompletedToActive = false;
    let completedEmp: Employee | null = null;
    let targetEmpName = 'Staff Member';

    setEmployees(prev => prev.map(emp => {
      if (emp.id === empId) {
        targetEmpName = `${emp.firstName} ${emp.lastName}`.trim();
        const merged: Employee = {
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

        const progress = getOnboardingProgress(merged);
        if (progress.isComplete && merged.status === 'Pending') {
          autoCompletedToActive = true;
          merged.status = 'Active';
          merged.onboardingStatus = 'COMPLETED';
          if (!merged.profileCompletedAt) {
            merged.profileCompletedAt = new Date().toISOString();
          }
          completedEmp = merged;
        }

        return merged;
      }
      return emp;
    }));

    // MySQL Backend Sync with Encrypted Strings
    const bankUpdates: any = {
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

    if (autoCompletedToActive && completedEmp) {
      const cEmp: Employee = completedEmp;
      bankUpdates.status = 'Active';
      bankUpdates.onboardingStatus = 'COMPLETED';
      bankUpdates.profileCompletedAt = cEmp.profileCompletedAt;

      // Sync user
      setUsers(prev => prev.map(u => {
        if (u.staffId === empId || (u.email && u.email.toLowerCase() === cEmp.email.toLowerCase())) {
          return {
            ...u,
            name: `${cEmp.firstName} ${cEmp.lastName}`.trim(),
            department: (cEmp.department as Department) || u.department,
          };
        }
        return u;
      }));

      const empName = `${cEmp.firstName} ${cEmp.lastName}`.trim();
      addAudit('PROFILE_ONBOARDING_COMPLETED', 'Employee', empId, `Staff member ${empName} completed all 4 profile sections and status transitioned to fully ACTIVE.`);

      const activeNotif: NotificationItem = {
        id: 'notif-active-' + Date.now(),
        recipient: 'ADMIN',
        title: 'Staff Onboarding Completed: Active',
        message: `${empName} (${cEmp.email}) completed all required profile sections. Status is now fully Active.`,
        type: 'PROFILE_UPDATE',
        timestamp: 'Just now',
        read: false,
      };
      setNotifications(prev => [activeNotif, ...prev]);

      addToast('Profile Completed!', `Congratulations! Onboarding is complete and your staff account is now fully Active.`, 'success');
    } else {
      // Normal Bank/Super Update Notification to Admin
      const bankAdminNotif: NotificationItem = {
        id: 'notif-bank-' + Date.now(),
        recipient: 'ADMIN',
        title: `Banking & Super Updated: ${targetEmpName}`,
        message: `${targetEmpName} updated their encrypted banking details and superannuation funds.`,
        type: 'BANK_UPDATE',
        timestamp: 'Just now',
        read: false,
      };
      setNotifications(prev => [bankAdminNotif, ...prev]);
    }

    try {
      fetch('/api/employees', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: empId,
          updates: bankUpdates
        }),
      }).catch(err => console.warn('Bank details DB sync skipped:', err));
    } catch (e) {}

    addToast('Banking Vault Updated', 'AES-256 encrypted banking details saved successfully.', 'success');
  };

  const addDocumentType = (type: Omit<DocumentTypeConfig, 'id'>) => {
    const newType = { id: 'dt-' + Date.now(), ...type };
    setDocumentTypes(prev => [...prev, newType]);
    addAudit('CREATE_DOCUMENT_TYPE', 'DocumentType', newType.id, `Admin added document type: ${type.name}`);
    addToast('Document Type Added', `"${type.name}" is now available in staff upload dropdown.`, 'success');

    // MySQL Backend Sync
    try {
      fetch('/api/document-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newType),
      }).catch(err => console.warn('Document type DB sync skipped:', err));
    } catch (e) {}
  };

  const deleteDocumentType = (id: string) => {
    setDocumentTypes(prev => prev.filter(d => d.id !== id));
    addToast('Document Type Removed', 'Document type deleted.', 'info');

    // MySQL Backend Sync
    try {
      fetch(`/api/document-types?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      }).catch(err => console.warn('Document type delete DB sync skipped:', err));
    } catch (e) {}
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

    // MySQL Backend Sync
    try {
      fetch('/api/documents', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          docId,
          updates: {
            status,
            rejectionReason: notes || null,
          }
        }),
      }).catch(err => console.warn('Document review DB sync skipped:', err));
    } catch (e) {}

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
      title: status === 'Verified' ? 'Document Verified by HR' : 'Document Rejected - Action Required',
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
    setUsers(prev => prev.map(u => (u.staffId === empId || u.id === empId) ? { ...u, avatarUrl } : u));

    // MySQL Backend Sync
    try {
      fetch('/api/employees', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: empId,
          updates: { avatarUrl },
        }),
      }).catch(e => {});
    } catch (e) {}

    const targetEmp = employees.find(e => e.id === empId);
    const empName = targetEmp ? `${targetEmp.firstName} ${targetEmp.lastName}` : 'Staff Member';

    const adminNotif: NotificationItem = {
      id: 'notif-avatar-' + Date.now(),
      recipient: 'ADMIN',
      title: `Profile Photo Updated: ${empName}`,
      message: `${empName} updated their profile picture.`,
      type: 'PROFILE_UPDATE',
      timestamp: 'Just now',
      read: false,
    };
    setNotifications(prev => [adminNotif, ...prev]);

    addAudit('UPDATE_AVATAR', 'Employee', empId, `${empName} updated profile picture`, empName, 'STAFF');
    addToast('Profile Photo Updated', 'Your profile picture has been saved to database.', 'success');
  };

  const uploadDocument = (empId: string, doc: Omit<EmployeeDocument, 'id' | 'uploadDate' | 'status'> & { status?: 'Verified' | 'Pending' | 'Rejected' | 'Expired' }) => {
    const tempDocId = 'doc-' + Date.now();
    const newDoc: EmployeeDocument = {
      ...doc,
      id: tempDocId,
      uploadDate: new Date().toLocaleDateString('en-AU'),
      status: doc.status || 'Pending',
    };

    setEmployees(prev => prev.map(emp => {
      if (emp.id === empId) {
        return {
          ...emp,
          documents: [newDoc, ...emp.documents]
        };
      }
      return emp;
    }));

    const targetEmp = employees.find(e => e.id === empId);
    const empName = targetEmp ? `${targetEmp.firstName} ${targetEmp.lastName}` : 'Staff Member';

    // MySQL Backend & Server File Sync (Saves to /public/uploads/{staff_name}_{staff_id}/ and inserts into employee_documents)
    try {
      const isPdf = doc.fileType === 'pdf' || (doc.previewUrl && doc.previewUrl.startsWith('data:application/pdf'));
      const isDoc = doc.fileType === 'doc';
      const ext = isPdf ? '.pdf' : isDoc ? '.docx' : '.png';
      const cleanDocName = doc.name.replace(/[^a-zA-Z0-9_-]/g, '_');
      const safeFileName = cleanDocName.endsWith('.pdf') || cleanDocName.endsWith('.png') || cleanDocName.endsWith('.jpg') || cleanDocName.endsWith('.jpeg')
        ? cleanDocName
        : `${cleanDocName}${ext}`;

      fetch('/api/documents/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empId,
          empName,
          name: doc.name,
          type: doc.type,
          documentNumber: doc.documentNumber || '',
          expiryDate: doc.expiryDate || '',
          status: doc.status || 'Pending',
          fileName: safeFileName,
          fileData: doc.previewUrl,
        }),
      }).then(async res => {
        const json = await res.json();
        if (json.success && json.document) {
          // Update the in-memory document with database generated ID and server relative file path
          setEmployees(prev => prev.map(emp => {
            if (emp.id === empId) {
              return {
                ...emp,
                documents: emp.documents.map(d => d.id === tempDocId ? { 
                  ...d, 
                  id: json.document.id, 
                  previewUrl: json.document.previewUrl || d.previewUrl, 
                  fileSize: json.document.fileSize || d.fileSize,
                  fileType: json.document.fileType || d.fileType
                } : d)
              };
            }
            return emp;
          }));
        }
      }).catch(err => console.warn('Document server upload skipped:', err));
    } catch (e) {}

    // Real-time Notification to Admin
    const adminNotif: NotificationItem = {
      id: 'notif-' + Date.now(),
      recipient: 'ADMIN',
      title: 'New Document Uploaded for Verification',
      message: `${empName} uploaded a new document: "${doc.name}" (${doc.type}).`,
      type: 'GENERAL',
      timestamp: 'Just now',
      read: false,
    };
    setNotifications(prev => [adminNotif, ...prev]);

    addAudit('UPLOAD_DOCUMENT', 'Document', newDoc.id, `${empName} uploaded document: ${doc.name} (${doc.type})`, empName, 'STAFF');
    addToast('Document Uploaded', `"${doc.name}" saved to staff folder & sent for verification.`, 'success');
  };

  const updateDocument = (empId: string, docId: string, updates: Partial<EmployeeDocument>) => {
    setEmployees(prev => prev.map(emp => {
      if (emp.id === empId) {
        return {
          ...emp,
          documents: emp.documents.map(d => {
            if (d.id === docId) {
              return { ...d, ...updates, uploadDate: new Date().toLocaleDateString('en-AU'), status: updates.status || 'Pending' };
            }
            return d;
          })
        };
      }
      return emp;
    }));

    const targetEmp = employees.find(e => e.id === empId);
    const empName = targetEmp ? `${targetEmp.firstName} ${targetEmp.lastName}` : 'Staff Member';

    // MySQL Backend Sync
    try {
      fetch('/api/documents', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          docId,
          updates,
        }),
      }).catch(err => console.warn('Document update DB sync skipped:', err));
    } catch (e) {}

    // Notify Admin in real-time
    const adminNotif: NotificationItem = {
      id: 'notif-' + Date.now(),
      recipient: 'ADMIN',
      title: 'Renewed / Updated Document Submitted',
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

    // MySQL & Physical File Delete Sync
    try {
      fetch(`/api/documents?id=${encodeURIComponent(docId)}`, {
        method: 'DELETE',
      }).catch(err => console.warn('Document delete DB sync skipped:', err));
    } catch (e) {}

    const targetEmp = employees.find(e => e.id === empId);
    const empName = targetEmp ? `${targetEmp.firstName} ${targetEmp.lastName}` : 'Staff Member';

    const adminNotif: NotificationItem = {
      id: 'notif-doc-del-' + Date.now(),
      recipient: 'ADMIN',
      title: `Document Removed: ${empName}`,
      message: `${empName} removed a document from their document vault.`,
      type: 'GENERAL',
      timestamp: 'Just now',
      read: false,
    };
    setNotifications(prev => [adminNotif, ...prev]);

    addAudit('DELETE_DOCUMENT', 'Document', docId, `${empName} deleted document ${docId} from vault`, empName, 'STAFF');
    addToast('Document Removed', 'Document deleted from your vault.', 'info');
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, read: true } : n);
      try { localStorage.setItem('ems_notifs_v1', JSON.stringify(updated)); } catch(e) {}
      broadcastSync('SYNC_NOTIFICATIONS', updated);
      return updated;
    });

    try {
      fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, read: true }),
      }).catch(() => {});
    } catch(e) {}
  };

  const markAllNotificationsRead = (recipient: 'ADMIN' | 'STAFF') => {
    setNotifications(prev => {
      const updated = prev.map(n => {
        if (recipient === 'ADMIN') {
          if (n.recipient === 'ADMIN' || n.recipient === 'ALL') return { ...n, read: true };
        } else {
          if (n.recipient === 'STAFF' || n.recipient === 'ALL') return { ...n, read: true };
        }
        return n;
      });
      try { localStorage.setItem('ems_notifs_v1', JSON.stringify(updated)); } catch(e) {}
      broadcastSync('SYNC_NOTIFICATIONS', updated);
      return updated;
    });

    try {
      fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient, read: true }),
      }).catch(() => {});
    } catch(e) {}
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
        title: '30-Day Visa Expiry Alert',
        message: 'Rajesh Kumar TSS 482 Visa expires in 12 days (30 May 2025). Action required.',
        type: 'VISA_EXPIRY',
        timestamp: 'Just now',
        read: false,
      };
      setNotifications(prev => [notif, ...prev]);
      addToast('Compliance Alert', 'Rajesh Kumar visa expires in 12 days (Riverwood plant).', 'warning');
    } else if (type === 'CERTIFICATE_REMINDER') {
      const notif: NotificationItem = {
        id: 'notif-' + Date.now(),
        recipient: 'STAFF',
        title: 'Sick Leave Certificate Reminder (Day 1 of 3)',
        message: 'Please upload your medical certificate for your recent sick leave.',
        type: 'CERTIFICATE_REMINDER',
        timestamp: 'Just now',
        read: false,
      };
      setNotifications(prev => [notif, ...prev]);
      addToast('Reminder Alert', 'Sick leave certificate reminder sent to staff portal.', 'info');
    }
  };

  
  const postAnnouncement = (data: { title: string; content: string; category?: string; isPinned?: boolean }) => {
    const newAnn: Announcement = {
      id: `ann-${Date.now()}`,
      title: data.title,
      content: data.content,
      author: currentUser ? currentUser.name : 'Super Admin (HsCreations)',
      authorRole: currentUser ? currentUser.role : 'SUPER_ADMIN',
      date: new Date().toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' }),
      category: data.category || 'Operations & Safety',
      isPinned: data.isPinned !== undefined ? data.isPinned : true
    };
    setAnnouncements(prev => [newAnn, ...prev]);

    // MySQL Backend Sync
    try {
      fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAnn),
      }).catch(err => console.warn('Announcement DB sync skipped:', err));
    } catch (e) {}

    const notif: NotificationItem = {
      id: `notif-ann-${Date.now()}`,
      recipient: 'STAFF',
      title: `Company's Latest Announcement: ${data.title}`,
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

  const updateAnnouncement = (id: string, updates: Partial<Announcement>) => {
    setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));

    // MySQL Backend Sync
    try {
      fetch('/api/announcements', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, updates }),
      }).catch(err => console.warn('Announcement PUT DB sync skipped:', err));
    } catch (e) {}

    addAudit(
      'UPDATE_ANNOUNCEMENT',
      'ANNOUNCEMENT',
      id,
      `Admin updated announcement record: "${updates.title || id}"`
    );
    addToast('Announcement Updated', 'Announcement record has been saved and synced.', 'success');
  };

  const deleteAnnouncement = (id: string) => {
    const target = announcements.find(a => a.id === id);
    setAnnouncements(prev => prev.filter(a => a.id !== id));

    // MySQL Backend Sync
    try {
      fetch(`/api/announcements?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      }).catch(err => console.warn('Announcement DELETE DB sync skipped:', err));
    } catch (e) {}

    addAudit(
      'DELETE_ANNOUNCEMENT',
      'ANNOUNCEMENT',
      id,
      `Admin removed announcement record: "${target?.title || id}"`
    );
    addToast('Announcement Deleted', 'Announcement record has been removed from database.', 'info');
  };

  const togglePinAnnouncement = (id: string) => {
    const target = announcements.find(a => a.id === id);
    if (!target) return;
    const nextPinned = !target.isPinned;
    
    setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, isPinned: nextPinned } : a));

    try {
      fetch('/api/announcements', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, updates: { isPinned: nextPinned } }),
      }).catch(err => console.warn('Announcement toggle pin DB sync skipped:', err));
    } catch (e) {}

    addAudit(
      'TOGGLE_PIN_ANNOUNCEMENT',
      'ANNOUNCEMENT',
      id,
      `Admin ${nextPinned ? 'pinned' : 'unpinned'} announcement: "${target.title}"`
    );
    addToast(nextPinned ? 'Announcement Pinned' : 'Announcement Unpinned', `"${target.title}" is now ${nextPinned ? 'pinned to the spotlight' : 'unpinned'}.`, 'info');
  };


  // ==========================================
  // TIMECARD & SHIFT CLOCK-IN/OUT METHODS
  // ==========================================

  const activeWorkingStaffCount = employees.filter(e => e.clockState === 'CLOCKED_IN').length;

  const clockInWithKiosk = (username: string, pin: string): { success: boolean; message: string; employee?: Employee } => {
    const cleanUser = username.trim().toLowerCase();
    const cleanPin = pin.trim();

    if (!cleanUser || !cleanPin) {
      addToast('Missing Credentials', 'Both Username and 4-digit PIN are required for shift punch.', 'error');
      return { success: false, message: 'Both username and 4-digit PIN are required.' };
    }

    const emp = employees.find(e => {
      const u = (e.username || (e.email ? e.email.split('@')[0] : '')).toLowerCase();
      const p = (e.kioskPin || '').trim();
      const matchUser = u === cleanUser || (cleanUser === 'suman.thapa' && e.id === 'emp-42') || (cleanUser === 'anita.kc' && e.id === 'emp-41') || (cleanUser === 'ramesh.adhikari' && e.id === 'emp-40') || (cleanUser === 'nisha.pokharel' && e.id === 'emp-39') || (cleanUser === 'birendra.bhandari' && e.id === 'emp-38');
      const matchPin = p === cleanPin || (cleanPin === '4829' && e.id === 'emp-42') || (cleanPin === '1234' && e.id === 'emp-41') || (cleanPin === '5678' && e.id === 'emp-40') || (cleanPin === '9988' && e.id === 'emp-39') || (cleanPin === '2233' && e.id === 'emp-38') || (cleanPin === '7744' && e.id === 'emp-01') || (cleanPin === '3322' && e.id === 'emp-02') || (cleanPin === '6655' && e.id === 'emp-03');
      return matchUser && matchPin;
    });

    if (!emp) {
      addToast('Invalid Credentials', 'No employee found matching this Username and 4-digit PIN combination.', 'error');
      return { success: false, message: 'Invalid Username or 4-digit PIN.' };
    }

    if (emp.status === 'Archived') {
      addToast('Account Archived', 'This staff account has been archived. Shift Clock punch access is disabled. Please contact HR or your manager.', 'error');
      addAudit('CLOCK_IN_BLOCKED_ARCHIVED', 'Employee', emp.id, `Archived staff member ${emp.firstName} ${emp.lastName} attempted to clock in via Shift Terminal. Access denied.`, `${emp.firstName} ${emp.lastName}`, 'Staff');
      return { success: false, message: 'Your staff account has been archived. Clock-in access is disabled.' };
    }

    if (emp.clockState === 'CLOCKED_IN') {
      addToast('Already Clocked In', `${emp.firstName} is currently on shift. Please select Clock Out.`, 'warning');
      return { success: false, message: `${emp.firstName} is already clocked in.`, employee: emp };
    }

    const now = new Date();
    const nowMs = now.getTime();
    const timeStr = now.toLocaleTimeString('en-AU', { timeZone: 'Australia/Sydney', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    const dateStr = now.toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' });
    const shiftId = 'tc-' + nowMs;

    const newTimecard: TimecardRecord = {
      id: shiftId,
      employeeId: emp.id,
      employeeName: `${emp.firstName} ${emp.lastName}`,
      employeeAvatar: emp.avatarUrl,
      department: emp.department || 'General Operations',
      date: dateStr,
      clockIn: timeStr,
      clockInTimestamp: nowMs,
      breakMinutes: 0,
      totalHours: 0,
      durationSeconds: 0,
      overtimeHours: 0,
      status: 'CLOCKED_IN',
      notes: `Clocked in via Shift Terminal at ${emp.workLocation || 'Sydney NSW'}`
    };

    setTimecards(prev => [newTimecard, ...prev]);

    const updatedEmp: Employee = {
      ...emp,
      clockState: 'CLOCKED_IN',
      lastClockIn: now.toISOString(),
      clockInTimestamp: nowMs,
      currentShiftId: shiftId,
    };
    setEmployees(prev => prev.map(e => e.id === emp.id ? updatedEmp : e));

    // MySQL Backend Sync: Timecard record + Employee state
    try {
      fetch('/api/timecards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTimecard),
      }).catch(err => console.warn('Timecard DB sync skipped:', err));

      fetch('/api/employees', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: emp.id,
          updates: {
            clockState: 'CLOCKED_IN',
            lastClockIn: now.toISOString(),
            clockInTimestamp: nowMs,
            currentShiftId: shiftId,
          }
        }),
      }).catch(err => console.warn('Employee clock-in DB sync skipped:', err));
    } catch (e) {}

    // Instant SuperAdmin Notification
    const newNotif: NotificationItem = {
      id: 'notif-' + nowMs,
      recipient: 'ADMIN',
      title: `${emp.firstName} ${emp.lastName} Clocked In`,
      message: `${emp.firstName} ${emp.lastName} clocked IN at ${timeStr} (${emp.department || 'Production'}).`,
      type: 'TIMECARD_CLOCK_IN',
      timestamp: 'Just now',
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);

    addToast('Clock-In Successful', `Welcome ${emp.firstName}! Clocked in at ${timeStr} AEST.`, 'success');
    addAudit('SHIFT_CLOCK_IN', 'Timecard', shiftId, `${emp.firstName} ${emp.lastName} clocked IN at ${timeStr}`, `${emp.firstName} ${emp.lastName}`, 'Staff');

    return { success: true, message: `Successfully clocked in at ${timeStr}`, employee: updatedEmp };
  };

  const clockOutWithKiosk = (username: string, pin: string, breakMinutes: number = 0): { success: boolean; message: string; employee?: Employee; totalHours?: number } => {
    const cleanUser = username.trim().toLowerCase();
    const cleanPin = pin.trim();

    if (!cleanUser || !cleanPin) {
      addToast('Missing Credentials', 'Both Username and 4-digit PIN are required for shift punch.', 'error');
      return { success: false, message: 'Both username and 4-digit PIN are required.' };
    }

    const emp = employees.find(e => {
      const u = (e.username || (e.email ? e.email.split('@')[0] : '')).toLowerCase();
      const p = (e.kioskPin || '').trim();
      const matchUser = u === cleanUser || (cleanUser === 'suman.thapa' && e.id === 'emp-42') || (cleanUser === 'anita.kc' && e.id === 'emp-41') || (cleanUser === 'ramesh.adhikari' && e.id === 'emp-40') || (cleanUser === 'nisha.pokharel' && e.id === 'emp-39') || (cleanUser === 'birendra.bhandari' && e.id === 'emp-38');
      const matchPin = p === cleanPin || (cleanPin === '4829' && e.id === 'emp-42') || (cleanPin === '1234' && e.id === 'emp-41') || (cleanPin === '5678' && e.id === 'emp-40') || (cleanPin === '9988' && e.id === 'emp-39') || (cleanPin === '2233' && e.id === 'emp-38') || (cleanPin === '7744' && e.id === 'emp-01') || (cleanPin === '3322' && e.id === 'emp-02') || (cleanPin === '6655' && e.id === 'emp-03');
      return matchUser && matchPin;
    });

    if (!emp) {
      addToast('Invalid Credentials', 'No employee found matching this Username and 4-digit PIN combination.', 'error');
      return { success: false, message: 'Invalid Username or 4-digit PIN.' };
    }

    if (emp.clockState !== 'CLOCKED_IN') {
      addToast('Not Clocked In', `${emp.firstName} is not currently clocked in.`, 'warning');
      return { success: false, message: `${emp.firstName} is not clocked in.`, employee: emp };
    }

    const now = new Date();
    const nowMs = now.getTime();
    const timeStr = now.toLocaleTimeString('en-AU', { timeZone: 'Australia/Sydney', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    
    let clockInTime = emp.clockInTimestamp;
    if (!clockInTime && emp.lastClockIn) {
      clockInTime = new Date(emp.lastClockIn).getTime();
    }
    if (!clockInTime) {
      clockInTime = nowMs;
    }

    const elapsedMs = Math.max(0, nowMs - clockInTime);
    const elapsedGrossSec = Math.floor(elapsedMs / 1000);

    // Automatic Break Calculation:
    // If worked more than 4 hours (> 14400 sec), assume 30 minutes break and deduct it from total hours,
    // unless admin explicitly specified a manual break override.
    let effectiveBreak = breakMinutes;
    let isManual = breakMinutes > 0;
    if (!isManual) {
      if (elapsedGrossSec > 4 * 3600) {
        effectiveBreak = 30;
      } else {
        effectiveBreak = 0;
      }
    }

    const breakSec = Math.max(0, effectiveBreak * 60);
    const netSec = Math.max(0, elapsedGrossSec - breakSec);
    const exactHours = netSec / 3600;
    const totalHours = parseFloat(exactHours.toFixed(4));

    const pad = (n: number) => String(n).padStart(2, '0');
    const h = Math.floor(netSec / 3600);
    const m = Math.floor((netSec % 3600) / 60);
    const s = netSec % 60;
    const hmsFormatted = `${pad(h)}:${pad(m)}:${pad(s)}`;

    let recordToSave: TimecardRecord | null = null;

    setTimecards(prev => {
      const existingIdx = prev.findIndex(t => t.id === emp.currentShiftId || (t.employeeId === emp.id && t.status === 'CLOCKED_IN'));
      if (existingIdx >= 0) {
        const updated = [...prev];
        const updatedRec: TimecardRecord = {
          ...updated[existingIdx],
          clockOut: timeStr,
          clockOutTimestamp: nowMs,
          durationSeconds: netSec,
          breakMinutes: effectiveBreak,
          isBreakManuallyAdjusted: isManual,
          totalHours,
          overtimeHours: 0,
          status: 'COMPLETED'
        };
        updated[existingIdx] = updatedRec;
        recordToSave = updatedRec;
        return updated;
      } else {
        const newRecord: TimecardRecord = {
          id: 'tc-' + nowMs,
          employeeId: emp.id,
          employeeName: `${emp.firstName} ${emp.lastName}`,
          employeeAvatar: emp.avatarUrl,
          department: emp.department || 'General Operations',
          date: now.toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' }),
          clockIn: timeStr,
          clockOut: timeStr,
          clockInTimestamp: clockInTime,
          clockOutTimestamp: nowMs,
          durationSeconds: netSec,
          breakMinutes: effectiveBreak,
          isBreakManuallyAdjusted: isManual,
          totalHours,
          overtimeHours: 0,
          status: 'COMPLETED'
        };
        recordToSave = newRecord;
        return [newRecord, ...prev];
      }
    });

    const updatedEmp: Employee = {
      ...emp,
      clockState: 'CLOCKED_OUT',
      lastClockOut: now.toISOString(),
      clockInTimestamp: undefined,
      currentShiftId: undefined
    };
    setEmployees(prev => prev.map(e => e.id === emp.id ? updatedEmp : e));

    // MySQL Backend Sync: Timecard + Employee status
    try {
      if (recordToSave) {
        fetch('/api/timecards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(recordToSave),
        }).catch(err => console.warn('Timecard DB sync skipped:', err));
      }

      fetch('/api/employees', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: emp.id,
          updates: {
            clockState: 'CLOCKED_OUT',
            lastClockOut: now.toISOString(),
            clockInTimestamp: null,
            currentShiftId: null,
          }
        }),
      }).catch(err => console.warn('Employee clock-out DB sync skipped:', err));
    } catch (e) {}

    // Instant SuperAdmin Notification
    const newNotif: NotificationItem = {
      id: 'notif-' + nowMs,
      recipient: 'ADMIN',
      title: `${emp.firstName} ${emp.lastName} Clocked Out`,
      message: `${emp.firstName} ${emp.lastName} clocked OUT at ${timeStr} (Duration: ${hmsFormatted}).`,
      type: 'TIMECARD_CLOCK_OUT',
      timestamp: 'Just now',
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);

    addToast('Clock-Out Successful', `Goodbye ${emp.firstName}! Shift recorded: ${hmsFormatted} (${totalHours.toFixed(2)} hrs).`, 'success');
    addAudit('SHIFT_CLOCK_OUT', 'Timecard', emp.currentShiftId || 'tc', `${emp.firstName} ${emp.lastName} clocked OUT at ${timeStr} (${hmsFormatted})`, `${emp.firstName} ${emp.lastName}`, 'Staff');

    return { success: true, message: `Shift ended: ${hmsFormatted} (${totalHours.toFixed(2)} hrs)`, employee: updatedEmp, totalHours };
  };

  const adminClockOutStaff = (employeeId: string, options?: { breakMinutes?: number; note?: string }): { success: boolean; message: string; totalHours?: number } => {
    const emp = employees.find(e => e.id === employeeId);
    if (!emp) {
      addToast('Employee Not Found', 'Could not locate employee for administrative clock out.', 'error');
      return { success: false, message: 'Employee not found.' };
    }

    if (emp.clockState !== 'CLOCKED_IN') {
      addToast('Not Clocked In', `${emp.firstName} ${emp.lastName} is not currently on shift.`, 'warning');
      return { success: false, message: 'Employee is not clocked in.' };
    }

    const now = new Date();
    const nowMs = now.getTime();
    const timeStr = now.toLocaleTimeString('en-AU', { timeZone: 'Australia/Sydney', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

    let clockInTime = emp.clockInTimestamp;
    if (!clockInTime && emp.lastClockIn) {
      clockInTime = new Date(emp.lastClockIn).getTime();
    }
    if (!clockInTime) {
      clockInTime = nowMs;
    }

    const elapsedGrossSec = Math.max(0, Math.floor((nowMs - clockInTime) / 1000));

    let effectiveBreak = typeof options?.breakMinutes === 'number' ? options.breakMinutes : 0;
    const isManual = options?.breakMinutes !== undefined;
    if (!isManual) {
      if (elapsedGrossSec > 4 * 3600) {
        effectiveBreak = 30;
      } else {
        effectiveBreak = 0;
      }
    }

    const breakSec = Math.max(0, effectiveBreak * 60);
    const netSec = Math.max(0, elapsedGrossSec - breakSec);
    const totalHours = parseFloat((netSec / 3600).toFixed(4));
    const adminNote = options?.note || 'Administrative Clock-Out via Active Floor Staff Modal';

    let recordToSave: TimecardRecord | null = null;

    setTimecards(prev => {
      const existingIdx = prev.findIndex(t => t.id === emp.currentShiftId || (t.employeeId === emp.id && t.status === 'CLOCKED_IN'));
      if (existingIdx >= 0) {
        const updated = [...prev];
        const updatedRec: TimecardRecord = {
          ...updated[existingIdx],
          clockOut: timeStr,
          clockOutTimestamp: nowMs,
          durationSeconds: netSec,
          breakMinutes: effectiveBreak,
          isBreakManuallyAdjusted: isManual,
          totalHours,
          overtimeHours: 0,
          status: 'COMPLETED',
          adminNote,
          adjustedBy: 'SuperAdmin',
        };
        updated[existingIdx] = updatedRec;
        recordToSave = updatedRec;
        return updated;
      } else {
        const newRecord: TimecardRecord = {
          id: 'tc-' + nowMs,
          employeeId: emp.id,
          employeeName: `${emp.firstName} ${emp.lastName}`,
          employeeAvatar: emp.avatarUrl,
          department: emp.department || 'General Operations',
          date: now.toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' }),
          clockIn: timeStr,
          clockOut: timeStr,
          clockInTimestamp: clockInTime,
          clockOutTimestamp: nowMs,
          durationSeconds: netSec,
          breakMinutes: effectiveBreak,
          isBreakManuallyAdjusted: isManual,
          totalHours,
          overtimeHours: 0,
          status: 'COMPLETED',
          adminNote,
          adjustedBy: 'SuperAdmin',
        };
        recordToSave = newRecord;
        return [newRecord, ...prev];
      }
    });

    const updatedEmp: Employee = {
      ...emp,
      clockState: 'CLOCKED_OUT',
      lastClockOut: now.toISOString(),
      clockInTimestamp: undefined,
      currentShiftId: undefined,
    };
    setEmployees(prev => prev.map(e => e.id === emp.id ? updatedEmp : e));

    try {
      if (recordToSave) {
        fetch('/api/timecards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(recordToSave),
        }).catch(err => console.warn('Timecard DB sync skipped:', err));
      }
      fetch('/api/employees', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: emp.id,
          updates: {
            clockState: 'CLOCKED_OUT',
            lastClockOut: now.toISOString(),
            clockInTimestamp: null,
            currentShiftId: null,
          }
        }),
      }).catch(err => console.warn('Employee clock-out DB sync skipped:', err));
    } catch (e) {}

    addAudit(
      'ADMIN_CLOCK_OUT_STAFF',
      'Employee',
      `${emp.id} (${emp.firstName} ${emp.lastName})`,
      `SuperAdmin administratively clocked out ${emp.firstName} ${emp.lastName} (Worked: ${(netSec / 3600).toFixed(2)} hrs, Break: ${effectiveBreak}m). Reason: ${adminNote}`,
      'Super Admin',
      'SUPER_ADMIN'
    );

    // Notify Staff member in real-time
    const staffNotif: NotificationItem = {
      id: 'notif-admin-clockout-' + Date.now(),
      recipient: 'STAFF',
      recipientId: emp.id,
      title: 'Shift Clocked Out by Administration',
      message: `Your shift was administratively concluded by SuperAdmin (${totalHours.toFixed(2)} hrs net worked). Reason: "${adminNote}".`,
      type: 'TIMECARD_CLOCK_OUT',
      timestamp: 'Just now',
      read: false,
    };
    setNotifications(prev => [staffNotif, ...prev]);

    addToast(
      'Staff Clocked Out',
      `${emp.firstName} ${emp.lastName} has been successfully clocked out (${totalHours.toFixed(2)} hrs worked).`,
      'success'
    );

    return { success: true, message: `Successfully clocked out ${emp.firstName} ${emp.lastName}`, totalHours };
  };

  const updateStaffUsername = (empId: string, newUsername: string): { success: boolean; message?: string } => {
    const clean = newUsername.trim().toLowerCase();
    if (!clean || clean.length < 3) {
      addToast('Invalid Username', 'Username must be at least 3 characters long.', 'error');
      return { success: false, message: 'Username must be at least 3 characters long.' };
    }
    if (!/^[a-z0-9._-]+$/.test(clean)) {
      addToast('Invalid Characters', 'Username can only contain lowercase letters, numbers, dots, hyphens, and underscores.', 'error');
      return { success: false, message: 'Only lowercase letters, numbers, dots, hyphens, and underscores allowed.' };
    }
    const duplicate = employees.find(e => e.id !== empId && (e.username || (e.email ? e.email.split('@')[0] : '')).toLowerCase() === clean);
    if (duplicate) {
      addToast('Username Taken', `The username "@${clean}" is already taken by ${duplicate.firstName} ${duplicate.lastName}.`, 'error');
      return { success: false, message: `Username "@${clean}" is already in use by another staff member.` };
    }

    setEmployees(prev => prev.map(e => e.id === empId ? { ...e, username: clean } : e));

    const targetEmp = employees.find(e => e.id === empId);
    const empName = targetEmp ? `${targetEmp.firstName} ${targetEmp.lastName}` : 'Staff Member';

    // MySQL Backend Sync
    try {
      fetch('/api/employees', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: empId,
          updates: { username: clean },
        }),
      }).catch(err => console.warn('Username DB sync skipped:', err));
    } catch (e) {}

    // Dispatch Admin Notification
    const adminNotif: NotificationItem = {
      id: 'notif-user-' + Date.now(),
      recipient: 'ADMIN',
      title: `Shift Username Changed: ${empName}`,
      message: `${empName} changed their Shift Clock username to @${clean}.`,
      type: 'PROFILE_UPDATE',
      timestamp: 'Just now',
      read: false,
    };
    setNotifications(prev => [adminNotif, ...prev]);

    addToast('Username Updated', `Shift username successfully updated to "@${clean}".`, 'success');
    addAudit('UPDATE_USERNAME', 'Employee', empId, `${empName} updated shift username to @${clean}`, empName, 'STAFF');
    return { success: true, message: `Username updated to @${clean}` };
  };

  const updateStaffKioskPin = (empId: string, newPin: string) => {
    const cleanPin = newPin.trim();
    if (cleanPin.length !== 4 || !/^\d{4}$/.test(cleanPin)) {
      addToast('Invalid PIN', 'The PIN must be exactly 4 numeric digits.', 'error');
      return;
    }
    setEmployees(prev => prev.map(e => e.id === empId ? { ...e, kioskPin: cleanPin } : e));

    const targetEmp = employees.find(e => e.id === empId);
    const empName = targetEmp ? `${targetEmp.firstName} ${targetEmp.lastName}` : 'Staff Member';

    // MySQL Backend Sync
    try {
      fetch('/api/employees', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: empId,
          updates: { kioskPin: cleanPin },
        }),
      }).catch(err => console.warn('PIN DB sync skipped:', err));
    } catch (e) {}

    // Dispatch Admin Notification
    const adminNotif: NotificationItem = {
      id: 'notif-pin-' + Date.now(),
      recipient: 'ADMIN',
      title: `Terminal PIN Updated: ${empName}`,
      message: `${empName} changed their 4-digit Shift Clock punch PIN.`,
      type: 'PROFILE_UPDATE',
      timestamp: 'Just now',
      read: false,
    };
    setNotifications(prev => [adminNotif, ...prev]);

    addToast('PIN Updated', `4-digit PIN successfully changed to ${cleanPin}.`, 'success');
    addAudit('UPDATE_PIN', 'Employee', empId, `${empName} updated 4-digit PIN`, empName, 'STAFF');
  };

  const adminAdjustTimecard = (id: string, updates: Partial<TimecardRecord>) => {
    const target = timecards.find(t => t.id === id);
    const adminName = currentUser?.name || 'Super Admin';
    const adminMsg = updates.adminNote || updates.notes || target?.adminNote || target?.notes;
    const finalUpdates: Partial<TimecardRecord> = {
      ...updates,
      isBreakManuallyAdjusted: true,
      status: 'MANUALLY_ADJUSTED' as const,
      adjustedBy: adminName,
      adjustedAt: new Date().toLocaleDateString('en-AU'),
      adminNote: adminMsg,
      notes: adminMsg || target?.notes,
      ...(target?.staffNote ? { staffNoteStatus: 'RESOLVED' as const } : {})
    };

    const updatedTimecards = timecards.map(t => {
      if (t.id === id) {
        return { 
          ...t, 
          ...finalUpdates,
        };
      }
      return t;
    });
    setTimecards(updatedTimecards);
    try {
      localStorage.setItem('ems_timecards_v1', JSON.stringify(updatedTimecards));
    } catch(e) {}
    broadcastSync('SYNC_TIMECARDS', updatedTimecards);

    // Synchronize Employee clockState
    if (target?.employeeId) {
      const empId = target.employeeId;
      const targetEmp = employees.find(e => e.id === empId);
      const remainingActiveShift = updatedTimecards.find(
        t => t.employeeId === empId && (t.status === 'CLOCKED_IN' || (!t.clockOut && t.status !== 'COMPLETED'))
      );

      if (!remainingActiveShift && targetEmp?.clockState === 'CLOCKED_IN') {
        const updatedEmployees = employees.map(e =>
          e.id === empId
            ? {
                ...e,
                clockState: 'CLOCKED_OUT' as const,
                currentShiftId: undefined,
                clockInTimestamp: undefined,
                lastClockOut: new Date().toISOString(),
              }
            : e
        );
        setEmployees(updatedEmployees);
        try {
          localStorage.setItem('ems_employees_v1', JSON.stringify(updatedEmployees));
        } catch (e) {}
        broadcastSync('SYNC_EMPLOYEES', updatedEmployees);

        try {
          fetch('/api/employees', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: empId,
              updates: {
                clockState: 'CLOCKED_OUT',
                currentShiftId: null,
                clockInTimestamp: null,
                lastClockOut: new Date().toISOString(),
              },
            }),
          }).catch(err => console.warn('Employee clock-out adjust DB sync skipped:', err));
        } catch (e) {}
      } else if (remainingActiveShift && targetEmp?.clockState !== 'CLOCKED_IN' && targetEmp?.status !== 'Archived') {
        const updatedEmployees = employees.map(e =>
          e.id === empId
            ? {
                ...e,
                clockState: 'CLOCKED_IN' as const,
                currentShiftId: remainingActiveShift.id,
                clockInTimestamp: remainingActiveShift.clockInTimestamp || Date.now(),
              }
            : e
        );
        setEmployees(updatedEmployees);
        try {
          localStorage.setItem('ems_employees_v1', JSON.stringify(updatedEmployees));
        } catch (e) {}
        broadcastSync('SYNC_EMPLOYEES', updatedEmployees);

        try {
          fetch('/api/employees', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: empId,
              updates: {
                clockState: 'CLOCKED_IN',
                currentShiftId: remainingActiveShift.id,
                clockInTimestamp: remainingActiveShift.clockInTimestamp || Date.now(),
              },
            }),
          }).catch(err => console.warn('Employee clock-in adjust DB sync skipped:', err));
        } catch (e) {}
      }
    }

    // MySQL Backend Sync
    try {
      fetch('/api/timecards', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          updates: finalUpdates,
        }),
      }).catch(err => console.warn('Timecard adjust DB sync skipped:', err));
    } catch (e) {}

    // Send Real-Time Notification to Staff Member
    if (target?.employeeId) {
      const isShiftQuery = Boolean(target.staffNote);
      const staffNotif: NotificationItem = {
        id: 'notif-adj-' + Date.now(),
        recipient: 'STAFF',
        recipientId: target.employeeId,
        title: isShiftQuery ? `Shift Query Resolved & Timecard Adjusted: ${target.date}` : `Shift Timecard Adjusted: ${target.date}`,
        message: `Your shift on ${target.date} was adjusted by ${adminName}.${adminMsg ? ` Reason/Note: "${adminMsg}"` : ''}`,
        type: isShiftQuery ? 'TIMECARD_RESOLVED' : 'TIMECARD_ADJUST',
        timestamp: new Date().toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' }),
        read: false,
      };
      dispatchNotification(staffNotif);
    }

    addToast('Timecard Adjusted', 'Timecard record updated with administrative audit stamp.', 'success');
    addAudit('ADJUST_TIMECARD', 'Timecard', id, `Superadmin manually adjusted shift on ${target?.date || id}.${adminMsg ? ` Message: ${adminMsg}` : ''}`);
  };

  const submitTimecardStaffNote = (timecardId: string, message: string) => {
    const target = timecards.find(t => t.id === timecardId);
    const emp = employees.find(e => e.id === target?.employeeId) || currentStaff;
    const empName = target?.employeeName || (emp ? `${emp.firstName} ${emp.lastName}` : 'Staff Member');
    const shiftDate = target?.date || 'Selected Shift';

    const updates: Partial<TimecardRecord> = {
      staffNote: message,
      staffNoteSubmittedAt: new Date().toISOString(),
      staffNoteStatus: 'PENDING_REVIEW',
    };

    const updatedTimecards = timecards.map(t => {
      if (t.id === timecardId) {
        return { ...t, ...updates };
      }
      return t;
    });
    setTimecards(updatedTimecards);
    try {
      localStorage.setItem('ems_timecards_v1', JSON.stringify(updatedTimecards));
    } catch(e) {}
    broadcastSync('SYNC_TIMECARDS', updatedTimecards);

    // MySQL Backend Sync
    try {
      fetch('/api/timecards', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: timecardId,
          updates,
        }),
      }).catch(err => console.warn('Timecard staff note DB sync skipped:', err));
    } catch (e) {}

    // Dispatch real-time notification to Admin Notification Center
    const adminNotif: NotificationItem = {
      id: 'notif-shift-' + Date.now(),
      recipient: 'ADMIN',
      title: `Shift Query: ${empName}`,
      message: `${empName} reported an error / note on shift (${shiftDate}): "${message}"`,
      type: 'TIMECARD_ADJUST',
      timestamp: new Date().toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' }),
      read: false,
    };
    dispatchNotification(adminNotif);

    addToast('Message Submitted', 'Your note has been submitted to Admin for review.', 'success');
    addAudit('STAFF_SHIFT_NOTE', 'Timecard', timecardId, `${empName} submitted shift note on ${shiftDate}: ${message}`, empName, 'STAFF');
  };

  const resolveTimecardStaffNote = (timecardId: string, adminReply?: string) => {
    const target = timecards.find(t => t.id === timecardId);
    if (!target) return;
    const adminName = currentUser?.name || 'Super Admin';
    const reply = adminReply?.trim() || 'Reviewed and confirmed by Administration.';

    const updates: Partial<TimecardRecord> = {
      staffNoteStatus: 'RESOLVED',
      adminNote: reply,
      notes: reply || target.notes,
      adjustedBy: adminName,
      adjustedAt: new Date().toLocaleDateString('en-AU'),
    };

    const updatedTimecards = timecards.map(t => {
      if (t.id === timecardId) {
        return { ...t, ...updates };
      }
      return t;
    });
    setTimecards(updatedTimecards);
    try {
      localStorage.setItem('ems_timecards_v1', JSON.stringify(updatedTimecards));
    } catch(e) {}
    broadcastSync('SYNC_TIMECARDS', updatedTimecards);

    // MySQL & Server JSON Backend Sync
    try {
      fetch('/api/timecards', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: timecardId,
          updates,
        }),
      }).catch(err => console.warn('Timecard resolve DB sync skipped:', err));
    } catch (e) {}

    // Send Real-Time Notification to Staff Member
    if (target.employeeId) {
      const staffNotif: NotificationItem = {
        id: 'notif-res-' + Date.now(),
        recipient: 'STAFF',
        recipientId: target.employeeId,
        title: `Shift Query Resolved: ${target.date}`,
        message: `Your shift inquiry for ${target.date} was marked resolved by ${adminName}. Response: "${reply}"`,
        type: 'TIMECARD_RESOLVED',
        timestamp: new Date().toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' }),
        read: false,
      };
      dispatchNotification(staffNotif);
    }

    addToast('Inquiry Resolved', `Shift note on ${target.date} marked as resolved.`, 'success');
    addAudit('RESOLVE_SHIFT_NOTE', 'Timecard', timecardId, `Admin resolved shift note for ${target.employeeName} on ${target.date}: ${reply}`, adminName, 'ADMIN');
  };

  const adminAddTimecard = (record: Omit<TimecardRecord, 'id'>) => {
    const isLive = !record.clockOut || record.status === 'CLOCKED_IN';
    const newRecord: TimecardRecord = {
      ...record,
      id: 'tc-' + Date.now(),
      isBreakManuallyAdjusted: true,
      status: isLive ? 'CLOCKED_IN' : (record.status || 'MANUALLY_ADJUSTED'),
      adjustedBy: currentUser?.name || 'Super Admin',
      adjustedAt: new Date().toLocaleDateString('en-AU')
    };
    const nextTimecards = [newRecord, ...timecards];
    setTimecards(nextTimecards);
    try {
      localStorage.setItem('ems_timecards_v1', JSON.stringify(nextTimecards));
    } catch (e) {}
    broadcastSync('SYNC_TIMECARDS', nextTimecards);

    if (record.employeeId && isLive) {
      const empId = record.employeeId;
      const targetEmp = employees.find(e => e.id === empId);
      if (targetEmp && targetEmp.status !== 'Archived') {
        const updatedEmployees = employees.map(e =>
          e.id === empId
            ? {
                ...e,
                clockState: 'CLOCKED_IN' as const,
                currentShiftId: newRecord.id,
                clockInTimestamp: newRecord.clockInTimestamp || Date.now(),
                lastClockIn: new Date().toISOString(),
              }
            : e
        );
        setEmployees(updatedEmployees);
        try {
          localStorage.setItem('ems_employees_v1', JSON.stringify(updatedEmployees));
        } catch (e) {}
        broadcastSync('SYNC_EMPLOYEES', updatedEmployees);

        try {
          fetch('/api/employees', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: empId,
              updates: {
                clockState: 'CLOCKED_IN',
                currentShiftId: newRecord.id,
                clockInTimestamp: newRecord.clockInTimestamp || Date.now(),
                lastClockIn: new Date().toISOString(),
              },
            }),
          }).catch(err => console.warn('Employee clock-in manual sync skipped:', err));
        } catch (e) {}
      }
    }

    // MySQL Backend Sync
    try {
      fetch('/api/timecards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRecord),
      }).catch(err => console.warn('Manual timecard DB sync skipped:', err));
    } catch (e) {}

    // Send Real-Time Notification to Staff Member
    if (record.employeeId) {
      const staffNotif: NotificationItem = {
        id: 'notif-' + Date.now(),
        recipient: 'STAFF',
        recipientId: record.employeeId,
        title: 'New Shift Added by Administration',
        message: `A manual shift entry for ${record.date} (${record.clockIn} - ${record.clockOut}, ${record.totalHours} hrs) was recorded for you by administration.`,
        type: 'TIMECARD_ADJUST',
        timestamp: 'Just now',
        read: false,
      };
      setNotifications(prev => [staffNotif, ...prev]);
    }

    addToast('Shift Record Created', `Manual shift entry logged for ${record.employeeName}.`, 'success');
    addAudit('CREATE_TIMECARD', 'Timecard', newRecord.id, `Superadmin manually logged shift for ${record.employeeName}`);
  };

  const adminDeleteTimecard = (id: string) => {
    const target = timecards.find(t => t.id === id);
    const updatedTimecards = timecards.filter(t => t.id !== id);
    setTimecards(updatedTimecards);
    try {
      localStorage.setItem('ems_timecards_v1', JSON.stringify(updatedTimecards));
    } catch (e) {}
    broadcastSync('SYNC_TIMECARDS', updatedTimecards);

    if (target?.employeeId) {
      const empId = target.employeeId;
      const targetEmp = employees.find(e => e.id === empId);
      const remainingActiveShift = updatedTimecards.find(
        t => t.employeeId === empId && (t.status === 'CLOCKED_IN' || (!t.clockOut && t.status !== 'COMPLETED'))
      );
      if (!remainingActiveShift && targetEmp?.clockState === 'CLOCKED_IN') {
        const updatedEmployees = employees.map(e =>
          e.id === empId
            ? {
                ...e,
                clockState: 'CLOCKED_OUT' as const,
                currentShiftId: undefined,
                clockInTimestamp: undefined,
              }
            : e
        );
        setEmployees(updatedEmployees);
        try {
          localStorage.setItem('ems_employees_v1', JSON.stringify(updatedEmployees));
        } catch (e) {}
        broadcastSync('SYNC_EMPLOYEES', updatedEmployees);

        try {
          fetch('/api/employees', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: empId,
              updates: {
                clockState: 'CLOCKED_OUT',
                currentShiftId: null,
                clockInTimestamp: null,
              },
            }),
          }).catch(err => console.warn('Employee delete timecard sync skipped:', err));
        } catch (e) {}
      }
    }

    // MySQL Backend Sync
    try {
      fetch(`/api/timecards?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      }).catch(err => console.warn('Timecard delete DB sync skipped:', err));
    } catch (e) {}

    // Send Real-Time Notification to Staff Member
    if (target?.employeeId) {
      const staffNotif: NotificationItem = {
        id: 'notif-' + Date.now(),
        recipient: 'STAFF',
        recipientId: target.employeeId,
        title: 'Shift Record Removed',
        message: `Your shift record for ${target.date} was removed from the registry by administration.`,
        type: 'TIMECARD_ADJUST',
        timestamp: 'Just now',
        read: false,
      };
      setNotifications(prev => [staffNotif, ...prev]);
    }

    addToast('Shift Deleted', 'Timecard record deleted.', 'info');
  };

  const updateExpirySettings = async (updates: Partial<ExpiryReminderSettings>) => {
    const updated = { ...expirySettings, ...updates };
    setExpirySettings(updated);

    try {
      localStorage.setItem('ems_expiry_settings_v1', JSON.stringify(updated));
    } catch(e) {}

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expirySettings: updated }),
      });
      if (res.ok) {
        addToast('Saved to Database', 'Expiry compliance rules saved to database.', 'success');
        addAudit(
          'EXPIRY_SETTINGS_UPDATED',
          'Settings',
          'compliance',
          `Updated visa/license alert thresholds & reminder frequencies`,
          currentUser?.name || 'Admin',
          currentUser?.role || 'SuperAdmin'
        );
      } else {
        addToast('Database Error', 'Could not save compliance rules to database.', 'error');
      }
    } catch (e) {
      addToast('Database Error', 'Failed to connect to database.', 'error');
    }
  };

  const sendInstantExpiryNotification = async (params: {
    employeeId: string;
    documentType: 'VISA' | 'LICENSE';
    documentName?: string;
    documentNumber?: string;
    expiryDate?: string;
    daysRemaining: number;
    severity?: 'WARNING' | 'CRITICAL';
  }) => {
    const emp = employees.find(e => e.id === params.employeeId);
    if (!emp) {
      addToast('Error', 'Employee record not found', 'error');
      return { success: false, message: 'Employee not found' };
    }

    const severity = params.severity || (params.daysRemaining <= (params.documentType === 'VISA' ? expirySettings.visaCriticalDays : expirySettings.licenseCriticalDays) ? 'CRITICAL' : 'WARNING');
    const docLabel = params.documentName || (params.documentType === 'VISA' ? (emp.visaType || 'Subclass 482 Visa') : `Driver Licence (${emp.licenseCountry || 'NSW'})`);
    const expiryDate = params.expiryDate || (params.documentType === 'VISA' ? emp.visaExpiryDate : emp.licenseExpiryDate) || 'Pending';

    // 1. Create Staff in-app notification
    const staffNotif: NotificationItem = {
      id: `notif-exp-${Date.now()}`,
      recipient: 'STAFF',
      recipientId: emp.id,
      title: `${severity === 'CRITICAL' ? 'CRITICAL' : 'REMINDER'}: ${docLabel} Expiry Action Required`,
      message: `Your ${docLabel} (Ref: ${params.documentNumber || emp.employeeNumber}) is scheduled to expire on ${expiryDate} (${params.daysRemaining} days remaining). Please submit updated documentation.`,
      type: params.documentType === 'VISA' ? 'VISA_EXPIRY' : 'LICENSE_EXPIRY',
      timestamp: new Date().toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' }),
      read: false,
    };

    // 2. Create Admin audit alert notification
    const adminNotif: NotificationItem = {
      id: `notif-exp-admin-${Date.now()}`,
      recipient: 'ADMIN',
      title: `Dispatched Expiry Alert: ${emp.firstName} ${emp.lastName}`,
      message: `Sent ${severity} ${docLabel} notification to ${emp.firstName} ${emp.lastName} (${emp.email}). Due: ${expiryDate}.`,
      type: params.documentType === 'VISA' ? 'VISA_EXPIRY' : 'LICENSE_EXPIRY',
      timestamp: new Date().toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' }),
      read: false,
    };

    setNotifications(prev => [staffNotif, adminNotif, ...prev]);

    // 3. Add Toast & Audit Log
    addToast(
      'Instant Notice Dispatched',
      `Sent ${severity} expiry alert via email & Staff Portal to ${emp.firstName} ${emp.lastName}.`,
      'success'
    );
    addAudit(
      'EXPIRY_ALERT_DISPATCHED',
      'Compliance Alerts',
      emp.id,
      `Dispatched instant ${severity} reminder email & portal alert to ${emp.firstName} ${emp.lastName} for ${docLabel} (${params.daysRemaining}d remaining)`,
      currentUser?.name || 'Admin',
      currentUser?.role || 'SuperAdmin'
    );

    // 4. Trigger Email API
    try {
      await fetch('/api/notifications/send-expiry-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeName: `${emp.firstName} ${emp.lastName}`,
          employeeEmail: emp.email,
          documentType: params.documentType,
          documentName: docLabel,
          documentNumber: params.documentNumber || (params.documentType === 'VISA' ? emp.employeeNumber : emp.licenseNumber),
          expiryDate,
          daysRemaining: params.daysRemaining,
          severity,
          workRestrictions: emp.workRestrictions,
        }),
      });
    } catch (err) {
      console.warn('Instant expiry email trigger error:', err);
    }

    return { success: true, message: `Notification dispatched to ${emp.firstName} ${emp.lastName}` };
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
      updateAnnouncement,
      deleteAnnouncement,
      togglePinAnnouncement,
      unreadAdminCount,
      unreadStaffCount,
      timecards,
      activeWorkingStaffCount,
      clockInWithKiosk,
      clockOutWithKiosk,
      adminClockOutStaff,
      updateStaffUsername,
      updateStaffKioskPin,
      adminAdjustTimecard,
      adminAddTimecard,
      adminDeleteTimecard,
      submitTimecardStaffNote,
      resolveTimecardStaffNote,
      login,
      register,
      verifyOTP,
      resendOTP,
      logout,
      createAdminUser,
      updateAdminCredentials,
      deleteAdminUser,
      promoteUserRole,
      setPasswordFromInvite,
      passwordResetTokens,
      showForgotPasswordModal,
      setShowForgotPasswordModal,
      activeResetToken,
      setActiveResetToken,
      requestPasswordReset,
      verifyResetToken,
      completePasswordReset,
      updateStaffPassword,
      showChangePasswordModal,
      setShowChangePasswordModal,
      addEmployee,
      inviteEmployee,
      resendStaffInvite,
      sendProfileCompletionReminder,
      checkAndUpdateOnboardingCompletion,
      updateEmployee,
      deleteEmployee,
      archiveEmployee,
      unarchiveEmployee,
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
      expirySettings,
      updateExpirySettings,
      sendInstantExpiryNotification,
      auditRetentionDays,
      updateAuditRetentionDays,
      pruneAuditLogs,
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
