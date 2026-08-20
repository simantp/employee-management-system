const fs = require('fs');
const path = require('path');

const root = 'C:\\Users\\siman\\.gemini\\antigravity\\scratch\\employee-management-system';
const src = path.join(root, 'src');

function write(relPath, content) {
  const fullPath = path.join(src, relPath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
  console.log('Wrote:', relPath);
}

// ==========================================
// 1. TYPES (src/types/index.ts)
// ==========================================
write('types/index.ts', `
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

export interface EmployeeDocument {
  id: string;
  name: string;
  type: string;
  uploadDate: string;
  status: 'Verified' | 'Pending' | 'Rejected';
  expiryDate?: string;
  fileSize?: string;
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
  employeeNumber: string; // EMP-0042
  firstName: string;
  lastName: string;
  email: string;
  mobilePhone: string;
  homePhone?: string;
  dateOfBirth: string; // DD/MM/YYYY
  startDate: string; // DD/MM/YYYY
  gender: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
  
  // Address
  address: string;
  suburb: string;
  state: AUState;
  postcode: string;

  // Employment
  department: Department;
  jobTitle: string;
  workLocation: string; // e.g. "Riverwood, NSW"
  reportsTo: string;
  status: 'Active' | 'On Leave' | 'Terminated' | 'Archived';
  avatarUrl?: string;

  // Legal & Visas
  citizenStatus: CitizenStatus;
  visaType?: string;
  visaExpiryDate?: string; // DD/MM/YYYY
  workRestrictions?: string;
  
  // Driving License
  hasDriverLicense: boolean;
  licenseCountry?: string;
  licenseNumber?: string;
  licenseExpiryDate?: string; // DD/MM/YYYY

  // Emergency Contacts
  emergencyNextOfKin: string;
  emergencyRelationship: string;
  emergencyAddress: string;
  emergencySuburb: string;
  emergencyState: AUState;
  emergencyPostcode: string;
  emergencyMobile: string;
  emergencyHomePhone?: string;
  emergencyWorkPhone?: string;

  // Encrypted Banking & TFN
  tfnMasked: string; // "XXX-XXX-482"
  tfnEncrypted: string;
  superFundName: string;
  superMemberNumber: string;
  bankName: string;
  bankBranch: string;
  accountName: string;
  bsbMasked: string; // "XXX-XXX"
  bsbEncrypted: string;
  accountNumberMasked: string; // "XXXXX6789"
  accountNumberEncrypted: string;

  // Leave & Docs
  leaveBalance: LeaveBalance;
  payslips: Payslip[];
  documents: EmployeeDocument[];
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeAvatar?: string;
  department: Department;
  leaveType: LeaveType;
  startDate: string; // DD/MM/YYYY
  endDate: string; // DD/MM/YYYY
  totalDays: number;
  reason: string;
  status: LeaveStatus;
  submittedAt: string; // ISO string or Sydney formatted
  submittedBefore7AM?: boolean;
  isAdvanceNoticeMet: boolean;
  advanceNoticeDays: number;
  certificateUrl?: string;
  certificateUploaded: boolean;
  reminderCount: number; // 0, 1, 2, 3
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
  dueDate: string; // DD/MM/YYYY
  daysRemaining: number;
  severity: 'URGENT' | 'WARNING' | 'INFO';
}

export interface NotificationItem {
  id: string;
  recipient: 'ADMIN' | 'STAFF' | string;
  title: string;
  message: string;
  type: 'LEAVE_REQUEST' | 'LEAVE_STATUS' | 'VISA_EXPIRY' | 'LICENSE_EXPIRY' | 'CERTIFICATE_REMINDER' | 'PROFILE_UPDATE' | 'BANK_UPDATE' | 'GENERAL';
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
`);

console.log('Types created successfully');
