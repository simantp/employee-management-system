import fs from 'fs';
import path from 'path';
import { 
  INITIAL_EMPLOYEES, 
  INITIAL_LEAVE_REQUESTS, 
  INITIAL_AUDIT_LOGS, 
  INITIAL_TIMECARDS 
} from './initialData';
import {
  INITIAL_DOCUMENT_TYPES,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_USERS,
  INITIAL_EXPIRY_SETTINGS
} from './store';
import { Employee, TimecardRecord, LeaveRequest, EmployeeDocument, DocumentTypeConfig, Announcement, AuditLog, AuthUser, ExpiryReminderSettings } from '@/types';

const DATA_DIR = path.join(process.cwd(), 'data');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export async function readJsonFile<T>(filename: string, defaultData: T): Promise<T> {
  try {
    ensureDataDir();
    const filePath = path.join(DATA_DIR, filename);
    if (!fs.existsSync(filePath)) {
      await writeJsonFile(filename, defaultData);
      return defaultData;
    }
    const content = await fs.promises.readFile(filePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch (err) {
    console.error(`Error reading ${filename}:`, err);
    return defaultData;
  }
}

export async function writeJsonFile<T>(filename: string, data: T): Promise<void> {
  try {
    ensureDataDir();
    const filePath = path.join(DATA_DIR, filename);
    await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`Error writing ${filename}:`, err);
  }
}

export async function getStoredEmployees(): Promise<Employee[]> {
  return readJsonFile<Employee[]>('employees.json', INITIAL_EMPLOYEES);
}

export async function saveStoredEmployees(employees: Employee[]): Promise<void> {
  await writeJsonFile('employees.json', employees);
}

export async function getStoredTimecards(): Promise<TimecardRecord[]> {
  return readJsonFile<TimecardRecord[]>('timecards.json', INITIAL_TIMECARDS);
}

export async function saveStoredTimecards(timecards: TimecardRecord[]): Promise<void> {
  await writeJsonFile('timecards.json', timecards);
}

export async function getStoredLeaveRequests(): Promise<LeaveRequest[]> {
  return readJsonFile<LeaveRequest[]>('leave.json', INITIAL_LEAVE_REQUESTS);
}

export async function saveStoredLeaveRequests(leaveRequests: LeaveRequest[]): Promise<void> {
  await writeJsonFile('leave.json', leaveRequests);
}

export async function getStoredDocumentTypes(): Promise<DocumentTypeConfig[]> {
  return readJsonFile<DocumentTypeConfig[]>('document_types.json', INITIAL_DOCUMENT_TYPES);
}

export async function saveStoredDocumentTypes(docTypes: DocumentTypeConfig[]): Promise<void> {
  await writeJsonFile('document_types.json', docTypes);
}

export async function getStoredAnnouncements(): Promise<Announcement[]> {
  return readJsonFile<Announcement[]>('announcements.json', INITIAL_ANNOUNCEMENTS);
}

export async function saveStoredAnnouncements(announcements: Announcement[]): Promise<void> {
  await writeJsonFile('announcements.json', announcements);
}

export async function getStoredAuditLogs(): Promise<AuditLog[]> {
  return readJsonFile<AuditLog[]>('audit.json', INITIAL_AUDIT_LOGS);
}

export async function saveStoredAuditLogs(auditLogs: AuditLog[]): Promise<void> {
  await writeJsonFile('audit.json', auditLogs);
}

export async function getStoredUsers(): Promise<AuthUser[]> {
  return readJsonFile<AuthUser[]>('users.json', INITIAL_USERS);
}

export async function saveStoredUsers(users: AuthUser[]): Promise<void> {
  await writeJsonFile('users.json', users);
}

export async function getStoredSettings(): Promise<any> {
  return readJsonFile<any>('settings.json', {
    expirySettings: INITIAL_EXPIRY_SETTINGS,
  });
}

export async function saveStoredSettings(settings: any): Promise<void> {
  await writeJsonFile('settings.json', settings);
}
