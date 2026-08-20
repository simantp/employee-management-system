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
// STORE (src/lib/store.tsx)
// ==========================================
write('lib/store.tsx', `
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Employee, 
  LeaveRequest, 
  ComplianceAlert, 
  NotificationItem, 
  AuditLog, 
  LeaveType, 
  LeaveStatus 
} from '@/types';
import { 
  INITIAL_EMPLOYEES, 
  INITIAL_LEAVE_REQUESTS, 
  INITIAL_ALERTS, 
  INITIAL_NOTIFICATIONS, 
  INITIAL_AUDIT_LOGS 
} from './initialData';
import { encryptAES256, maskSensitive } from './crypto';

interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'info' | 'error';
  timestamp: string;
}

interface AppContextType {
  activePortal: 'ADMIN' | 'STAFF' | 'DUAL';
  setActivePortal: (portal: 'ADMIN' | 'STAFF' | 'DUAL') => void;
  currentStaffId: string;
  setCurrentStaffId: (id: string) => void;
  currentStaff: Employee;
  employees: Employee[];
  leaveRequests: LeaveRequest[];
  alerts: ComplianceAlert[];
  notifications: NotificationItem[];
  auditLogs: AuditLog[];
  toasts: ToastMessage[];
  unreadAdminCount: number;
  unreadStaffCount: number;
  
  // Actions
  addEmployee: (employee: Omit<Employee, 'id' | 'leaveBalance' | 'payslips' | 'documents'>) => void;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
  submitLeaveRequest: (req: Omit<LeaveRequest, 'id' | 'status' | 'submittedAt' | 'reminderCount'>) => void;
  reviewLeaveRequest: (id: string, status: LeaveStatus, notes?: string) => void;
  uploadMedicalCertificate: (leaveId: string, fileUrl: string) => void;
  updateBankDetails: (empId: string, bank: { bankName: string; bankBranch: string; accountName: string; bsb: string; accountNumber: string; superFund: string; superNumber: string }) => void;
  uploadDocument: (empId: string, doc: { name: string; type: string; fileSize?: string }) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: (recipient: 'ADMIN' | 'STAFF') => void;
  removeToast: (id: string) => void;
  triggerSimulatedRealtimeEvent: (type: 'NEW_STAFF_LEAVE' | 'VISA_WARNING' | 'CERTIFICATE_REMINDER') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [activePortal, setActivePortal] = useState<'ADMIN' | 'STAFF' | 'DUAL'>('ADMIN');
  const [currentStaffId, setCurrentStaffId] = useState<string>('emp-42');
  
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(INITIAL_LEAVE_REQUESTS);
  const [alerts, setAlerts] = useState<ComplianceAlert[]>(INITIAL_ALERTS);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const currentStaff = employees.find(e => e.id === currentStaffId) || employees[0];

  const unreadAdminCount = notifications.filter(n => n.recipient === 'ADMIN' && !n.read).length;
  const unreadStaffCount = notifications.filter(n => n.recipient === 'STAFF' && !n.read).length;

  // Sound chime helper
  const playSoundChime = (tone: 'alert' | 'success' = 'alert') => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (tone === 'alert') {
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else {
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch (e) {
      // Audio context might be disabled before user gesture
    }
  };

  const addToast = (title: string, message: string, type: 'success' | 'warning' | 'info' | 'error' = 'info') => {
    const newToast: ToastMessage = {
      id: 'toast-' + Date.now() + '-' + Math.random(),
      title,
      message,
      type,
      timestamp: new Date().toLocaleTimeString('en-AU', { timeZone: 'Australia/Sydney' }),
    };
    setToasts(prev => [newToast, ...prev.slice(0, 4)]);
    playSoundChime(type === 'success' ? 'success' : 'alert');
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const addAudit = (action: string, targetType: string, targetId: string, details: string, actorName = 'Admin User', actorRole = 'Super Admin') => {
    const newLog: AuditLog = {
      id: 'aud-' + Date.now(),
      timestamp: new Date().toLocaleString('en-AU', { timeZone: 'Australia/Sydney' }) + ' AEST',
      actorId: actorRole === 'Super Admin' ? 'admin-1' : currentStaff.id,
      actorName: actorRole === 'Super Admin' ? 'Admin User' : currentStaff.firstName + ' ' + currentStaff.lastName,
      actorRole,
      action,
      targetType,
      targetId,
      details,
      ipAddress: '203.14.182.91 (Sydney, AU)',
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // 1. Add Employee
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
    
    addAudit('CREATE_EMPLOYEE', 'Employee', newEmployee.id, \`Created employee \${newEmployee.firstName} \${newEmployee.lastName} (\${newEmployee.employeeNumber})\`);
    
    // Add real-time notification
    const notif: NotificationItem = {
      id: 'notif-' + Date.now(),
      recipient: 'ADMIN',
      title: 'New Staff Profile Created',
      message: \`Employee \${newEmployee.firstName} \${newEmployee.lastName} added to \${newEmployee.department}.\`,
      type: 'GENERAL',
      timestamp: 'Just now',
      read: false,
    };
    setNotifications(prev => [notif, ...prev]);
    addToast('Employee Added', \`\${newEmployee.firstName} \${newEmployee.lastName} registered successfully.\`, 'success');
  };

  // 2. Update Employee
  const updateEmployee = (id: string, updates: Partial<Employee>) => {
    setEmployees(prev => prev.map(emp => emp.id === id ? { ...emp, ...updates } : emp));
    addAudit('UPDATE_EMPLOYEE', 'Employee', id, \`Updated fields: \${Object.keys(updates).join(', ')}\`);
    addToast('Profile Updated', 'Employee details updated successfully.', 'success');
  };

  // 3. Submit Leave Request (Real-time trigger to Admin)
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
    
    // Real-time Push to Admin
    const adminNotif: NotificationItem = {
      id: 'notif-' + Date.now(),
      recipient: 'ADMIN',
      title: \`New \${req.leaveType} Request: \${req.employeeName}\`,
      message: \`\${req.employeeName} submitted \${req.totalDays} day(s) \${req.leaveType.toLowerCase()} leave (\${req.startDate} - \${req.endDate}).\`,
      type: 'LEAVE_REQUEST',
      timestamp: 'Just now',
      read: false,
    };
    setNotifications(prev => [adminNotif, ...prev]);
    
    addAudit('SUBMIT_LEAVE_REQUEST', 'LeaveRequest', newReq.id, \`Submitted \${req.leaveType} leave (\${req.totalDays} days) starting \${req.startDate}\`, req.employeeName, 'Staff');
    
    // Trigger In-App Instant Floating Toast
    addToast(
      '⚡ Real-Time Notification Sent to Admin',
      \`\${req.employeeName}'s \${req.leaveType} request was delivered to Admin Portal instantly.\`,
      'success'
    );
  };

  // 4. Review Leave Request (Real-time trigger to Staff)
  const reviewLeaveRequest = (id: string, status: LeaveStatus, notes?: string) => {
    const req = leaveRequests.find(r => r.id === id);
    if (!req) return;

    setLeaveRequests(prev => prev.map(r => r.id === id ? { 
      ...r, 
      status, 
      adminNotes: notes, 
      reviewedBy: 'Admin User',
      reviewedAt: new Date().toLocaleString('en-AU', { timeZone: 'Australia/Sydney' })
    } : r));

    // Deduct leave balance if approved
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

    // Real-time Push to Staff
    const staffNotif: NotificationItem = {
      id: 'notif-' + Date.now(),
      recipient: 'STAFF',
      title: \`Leave Request \${status}\`,
      message: \`Your \${req.leaveType.toLowerCase()} leave request for \${req.startDate} has been \${status.toLowerCase()}.\`,
      type: 'LEAVE_STATUS',
      timestamp: 'Just now',
      read: false,
    };
    setNotifications(prev => [staffNotif, ...prev]);
    
    addAudit(\`\${status}_LEAVE_REQUEST\`, 'LeaveRequest', id, \`Admin marked request \${id} as \${status}\`);
    addToast(
      \`Leave \${status}\`,
      \`Request for \${req.employeeName} has been marked as \${status}.\`,
      status === 'APPROVED' ? 'success' : 'warning'
    );
  };

  // 5. Upload Medical Certificate
  const uploadMedicalCertificate = (leaveId: string, fileUrl: string) => {
    setLeaveRequests(prev => prev.map(r => r.id === leaveId ? { ...r, certificateUploaded: true, certificateUrl: fileUrl, reminderCount: 0 } : r));
    addToast('Medical Certificate Uploaded', 'Your certificate has been attached and sent to HR.', 'success');
  };

  // 6. Update Bank Details with AES-256 Field Encryption
  const updateBankDetails = (empId: string, bank: { bankName: string; bankBranch: string; accountName: string; bsb: string; accountNumber: string; superFund: string; superNumber: string }) => {
    const bsbEnc = encryptAES256(bank.bsb);
    const accEnc = encryptAES256(bank.accountNumber);
    const bsbMask = bank.bsb.length >= 3 ? \`\${bank.bsb.slice(0, 3)}-•••\` : '•••-•••';
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

    // Real-time Push to Admin
    const adminNotif: NotificationItem = {
      id: 'notif-' + Date.now(),
      recipient: 'ADMIN',
      title: 'Encrypted Banking Details Updated',
      message: \`\${currentStaff.firstName} \${currentStaff.lastName} updated their BSB & Account Number (AES-256 encrypted in DB).\`,
      type: 'BANK_UPDATE',
      timestamp: 'Just now',
      read: false,
    };
    setNotifications(prev => [adminNotif, ...prev]);

    addAudit('UPDATE_BANK_DETAILS', 'Employee', empId, 'Updated bank account & superannuation details (Encrypted with AES-256-GCM)', currentStaff.firstName + ' ' + currentStaff.lastName, 'Staff');
    addToast('🔒 Bank Details Encrypted & Saved', 'Your bank details were encrypted with AES-256 and updated securely.', 'success');
  };

  // 7. Upload Document
  const uploadDocument = (empId: string, doc: { name: string; type: string; fileSize?: string }) => {
    const newDoc = {
      id: 'doc-' + Date.now(),
      name: doc.name,
      type: doc.type,
      uploadDate: new Date().toLocaleDateString('en-AU'),
      status: 'Pending' as const,
      fileSize: doc.fileSize || '1.5 MB',
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

    addToast('Document Uploaded', \`\${doc.name} uploaded and is pending HR verification.\`, 'info');
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllNotificationsRead = (recipient: 'ADMIN' | 'STAFF') => {
    setNotifications(prev => prev.map(n => n.recipient === recipient ? { ...n, read: true } : n));
  };

  // Simulate Real-time incoming events
  const triggerSimulatedRealtimeEvent = (type: 'NEW_STAFF_LEAVE' | 'VISA_WARNING' | 'CERTIFICATE_REMINDER') => {
    if (type === 'NEW_STAFF_LEAVE') {
      const demoReq: Omit<LeaveRequest, 'id' | 'status' | 'submittedAt' | 'reminderCount'> = {
        employeeId: 'emp-38',
        employeeName: 'Birendra Bhandari',
        employeeAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
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

  return (
    <AppContext.Provider value={{
      activePortal,
      setActivePortal,
      currentStaffId,
      setCurrentStaffId,
      currentStaff,
      employees,
      leaveRequests,
      alerts,
      notifications,
      auditLogs,
      toasts,
      unreadAdminCount,
      unreadStaffCount,
      addEmployee,
      updateEmployee,
      submitLeaveRequest,
      reviewLeaveRequest,
      uploadMedicalCertificate,
      updateBankDetails,
      uploadDocument,
      markNotificationRead,
      markAllNotificationsRead,
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
`);

console.log('Store generated successfully');
