import { Employee, LeaveRequest, ComplianceAlert, NotificationItem, AuditLog, TimecardRecord, DocumentTypeConfig, Announcement, AuthUser, ExpiryReminderSettings, SmtpSettings, SecuritySettings } from '@/types';

export const INITIAL_EMPLOYEES: Employee[] = [];

export const INITIAL_LEAVE_REQUESTS: LeaveRequest[] = [];

export const INITIAL_ALERTS: ComplianceAlert[] = [];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'aud-01',
    timestamp: new Date().toLocaleString('en-AU', { timeZone: 'Australia/Sydney' }) + ' AEST',
    actorId: 'usr-1',
    actorName: 'Super Admin',
    actorRole: 'SUPER_ADMIN',
    action: 'SYSTEM_INITIALIZATION',
    targetType: 'SYSTEM',
    targetId: 'ALL',
    details: 'System initialized with single Super Admin account. Demo staff records cleared.',
    ipAddress: '127.0.0.1'
  }
];

export const INITIAL_TIMECARDS: TimecardRecord[] = [];

export const INITIAL_EXPIRY_SETTINGS: ExpiryReminderSettings = {
  autoReminderEnabled: true,
  visaWarningDays: 60,
  visaCriticalDays: 30,
  licenseWarningDays: 60,
  licenseCriticalDays: 30,
  warningFrequencyDays: 5,
  criticalFrequencyDays: 3,
};

export const INITIAL_SMTP_SETTINGS: SmtpSettings = {
  host: '',
  port: 587,
  secure: false,
  user: '',
  pass: '',
  fromEmail: '',
  fromName: 'HsCreations Sydney',
  enableSmtp: true,
};

export const INITIAL_DOCUMENT_TYPES: DocumentTypeConfig[] = [
  { id: 'dt-1', name: 'Passport Copy (Australian / International)', category: 'Identification', hasExpiry: true },
  { id: 'dt-2', name: 'Visa Grant Notice / VEVO Verification', category: 'Visa & Immigration', hasExpiry: true },
  { id: 'dt-3', name: "Driver's License (NSW / State)", category: 'Licenses', hasExpiry: true },
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
    title: 'Sydney Plant Operations & HR Compliance System',
    content: 'Welcome to the HsCreations Enterprise Workforce Portal. Authorized staff and administrators can manage personnel files, clock timecards, track visas, and generate compliance reports.',
    author: 'Super Admin (HsCreations Executive)',
    authorRole: 'SUPER_ADMIN',
    date: new Date().toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' }),
    category: 'Operations & Safety',
    isPinned: true
  }
];

export const INITIAL_USERS: AuthUser[] = [
  {
    id: 'usr-1',
    name: 'Super Admin',
    username: 'admin',
    email: 'admin@company.com.au',
    passwordHash: '$2b$12$mCCNx5kx1ovN7J5poXpUQ.pWALLQ/uJWnvfnYUtk3bDVhMP3.xpaC',
    role: 'SUPER_ADMIN',
    isEmailVerified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    createdAt: '10/01/2024',
  }
];

export const INITIAL_SECURITY_SETTINGS: SecuritySettings = {
  enforceEmailOtp2FA: true,
  sessionTimeoutMinutes: 1,
  autoLogoutOnInactivity: true,
  aesVaultActive: true,
  maskSensitiveBankTFN: true,
  allowStaffPasswordResetSelfService: true,
};
