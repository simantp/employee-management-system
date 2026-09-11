export type AUState = 'NSW' | 'VIC' | 'QLD' | 'WA' | 'SA' | 'TAS' | 'ACT' | 'NT';

export type CitizenStatus = 'CITIZEN' | 'PERMANENT_RESIDENT' | 'VISA_HOLDER';

export type Department = 
  | 'Production (Riverwood)'
  | 'Production (Rockdale)'
  | 'Design'
  | 'Administration'
  | 'Sales & Marketing'
  | 'Human Resources'
  | 'Other';

export type LeaveType = 'ANNUAL' | 'SICK' | 'CARERS' | 'LONG_SERVICE' | 'RESIGNATION' | 'UNPAID' | 'WFH';

export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'HR_MANAGER' | 'STAFF';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  username?: string;
  password?: string;
  role: UserRole;
  isEmailVerified: boolean;
  staffId?: string;
  avatarUrl?: string;
  department?: Department;
  createdAt: string;
}

export interface OTPVerification {
  email: string;
  code: string;
  expiresAt: number;
  userData: {
    firstName: string;
    lastName: string;
    email: string;
    mobilePhone: string;
    password?: string;
    department?: Department;
  };
}

export interface PasswordResetToken {
  token: string;
  email: string;
  userId: string;
  userName: string;
  createdAt: number;
  expiresAt: number; // 5 minutes = createdAt + 5 * 60 * 1000
  used: boolean;
}


export interface EmployeeDocument {
  id: string;
  name: string;
  type: string;
  uploadDate: string;
  status: 'Verified' | 'Pending' | 'Rejected' | 'Expired';
  expiryDate?: string;
  documentNumber?: string;
  fileSize?: string;
  previewUrl?: string;
  fileType?: 'image' | 'pdf' | 'doc';
}

export interface Payslip {
  id: string;
  payPeriod: string;
  payDate: string;
  grossPay: number;
  taxDeductions: number;
  superannuation: number;
  netPay: number;
  status: 'Paid' | 'Pending';
}

export interface LeaveBalance {
  annual: number;
  sick: number;
  carers: number;
  longService: number;
}

export interface Employee {
  id: string;
  employeeNumber: string;
  username?: string; // Unique Shift & Portal username e.g. "suman.thapa"
  firstName: string;
  lastName: string;
  email: string;
  mobilePhone: string;
  homePhone?: string;
  dateOfBirth: string;
  startDate: string;
  gender: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
  
  address: string;
  suburb: string;
  state: AUState;
  postcode: string;

  department?: Department | '';
  jobTitle: string;
  workLocation: string;
  reportsTo: string;
  status: 'Active' | 'On Leave' | 'Terminated' | 'Archived' | 'Pending';
  avatarUrl?: string;

  // Onboarding & Invitation Lifecycle
  onboardingStatus?: 'INVITED' | 'PASSWORD_SET' | 'PROFILE_COMPLETED' | 'COMPLETED';
  inviteToken?: string;
  inviteSentAt?: string;
  inviteExpiresAt?: string;
  passwordSetAt?: string;
  profileCompletedAt?: string;

  citizenStatus?: CitizenStatus;
  visaType?: string;
  visaExpiryDate?: string;
  workRestrictions?: string;
  workingHours?: number;
  workingHoursConfirmed?: boolean;
  visaStatusConfirmed?: boolean;
  
  hasDriverLicense: boolean;
  licenseCountry?: string;
  licenseNumber?: string;
  licenseExpiryDate?: string;

  emergencyNextOfKin: string;
  emergencyRelationship: string;
  emergencyAddress: string;
  emergencySuburb: string;
  emergencyState: AUState;
  emergencyPostcode: string;
  emergencyMobile: string;
  emergencyHomePhone?: string;
  emergencyWorkPhone?: string;

  tfnMasked: string;
  tfnEncrypted: string;
  superFundName: string;
  superMemberNumber: string;
  bankName: string;
  bankBranch: string;
  accountName: string;
  bsbMasked: string;
  bsbEncrypted: string;
  accountNumberMasked: string;
  accountNumberEncrypted: string;

  leaveBalance: LeaveBalance;
  payslips: Payslip[];
  documents: EmployeeDocument[];

  // Timecard & Shift Clock-in System
  kioskPin?: string; // 4-digit Quick PIN e.g. "4829"
  clockState?: 'CLOCKED_IN' | 'CLOCKED_OUT';
  lastClockIn?: string;
  lastClockOut?: string;
  clockInTimestamp?: number; // ms epoch timestamp when clock-in occurred
  currentShiftId?: string;
}

export type TimecardStatus = 'CLOCKED_IN' | 'COMPLETED' | 'ON_LEAVE' | 'MANUALLY_ADJUSTED';

export interface TimecardRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeAvatar?: string;
  department?: Department | string;
  date: string; // "17 Aug 2026"
  clockIn: string; // "07:30 AM" or ISO
  clockOut?: string; // "04:00 PM" or ISO
  clockInTimestamp?: number; // exact ms epoch
  clockOutTimestamp?: number; // exact ms epoch
  durationSeconds?: number; // exact seconds worked (net)
  breakMinutes: number;
  isBreakManuallyAdjusted?: boolean;
  totalHours: number;
  overtimeHours: number;
  status: TimecardStatus;
  leaveType?: LeaveType;
  notes?: string;
  adminNote?: string;
  staffNote?: string;
  staffNoteSubmittedAt?: string;
  staffNoteStatus?: 'PENDING_REVIEW' | 'RESOLVED';
  adjustedBy?: string;
  adjustedAt?: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeAvatar?: string;
  department?: Department | '';
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: LeaveStatus;
  submittedAt: string;
  submittedBefore7AM?: boolean;
  isAdvanceNoticeMet: boolean;
  advanceNoticeDays: number;
  certificateUrl?: string;
  certificateUploaded: boolean;
  reminderCount: number;
  adminNotes?: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface ComplianceAlert {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeAvatar?: string;
  department: Department;
  type: 'VISA_EXPIRY' | 'LICENSE_EXPIRY' | 'MISSING_SICK_CERT' | 'INCOMPLETE_RECORD' | 'PENDING_SIGNATURE';
  title: string;
  description: string;
  dueDate: string;
  daysRemaining: number;
  severity: 'URGENT' | 'WARNING' | 'INFO';
}

export interface NotificationItem {
  id: string;
  recipient: 'ADMIN' | 'STAFF' | string;
  recipientId?: string;
  title: string;
  message: string;
  type: 'LEAVE_REQUEST' | 'LEAVE_STATUS' | 'VISA_EXPIRY' | 'LICENSE_EXPIRY' | 'CERTIFICATE_REMINDER' | 'PROFILE_UPDATE' | 'BANK_UPDATE' | 'TIMECARD_CLOCK_IN' | 'TIMECARD_CLOCK_OUT' | 'TIMECARD_ADJUST' | 'TIMECARD_RESOLVED' | 'GENERAL' | string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: string;
  targetType: string;
  targetId: string;
  details: string;
  ipAddress: string;
}


export interface DocumentTypeConfig {
  id: string;
  name: string;
  category?: string;
  description?: string;
  hasExpiry?: boolean;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  author: string;
  authorRole: string;
  date: string;
  category?: string;
  isPinned?: boolean;
}

export interface ExpiryReminderSettings {
  autoReminderEnabled: boolean;
  visaWarningDays: number;
  visaCriticalDays: number;
  licenseWarningDays: number;
  licenseCriticalDays: number;
  warningFrequencyDays: number;
  criticalFrequencyDays: number;
}

export interface AuditRetentionSettings {
  retentionDays: number; // e.g. 30, 60, 90, 180, 365
  autoPruneEnabled: boolean;
  lastPrunedAt?: string;
}

export interface SystemSettingsConfig {
  expirySettings: ExpiryReminderSettings;
  auditRetentionDays: number;
  autoPruneAuditLogs: boolean;
}

