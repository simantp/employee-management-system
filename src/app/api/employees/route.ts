import { NextResponse } from 'next/server';
import { query, isDbConfigured } from '@/lib/db';
import { Employee, EmployeeDocument } from '@/types';
import { getStoredEmployees, saveStoredEmployees } from '@/lib/serverData';
import { getOnboardingProgress } from '@/lib/onboarding';

function mapDbRowToEmployee(row: any, documents: EmployeeDocument[] = []): Employee {
  return {
    id: row.id,
    employeeNumber: row.employee_number,
    username: row.username || undefined,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    mobilePhone: row.mobile_phone,
    homePhone: row.home_phone || undefined,
    dateOfBirth: row.date_of_birth || '',
    startDate: row.start_date || '',
    gender: (row.gender as any) || 'Prefer not to say',
    address: row.address || '',
    suburb: row.suburb || '',
    state: row.state || 'NSW',
    postcode: row.postcode || '',
    department: row.department || undefined,
    jobTitle: row.job_title || 'Staff Member',
    workLocation: row.work_location || 'Sydney, NSW',
    reportsTo: row.reports_to || 'Operations Lead',
    status: row.status || 'Active',
    onboardingStatus: (row.onboarding_status as any) || (row.status === 'Pending' ? 'INVITED' : 'COMPLETED'),
    inviteToken: row.invite_token || undefined,
    inviteSentAt: row.invite_sent_at || undefined,
    inviteExpiresAt: row.invite_expires_at || undefined,
    passwordSetAt: row.password_set_at || undefined,
    profileCompletedAt: row.profile_completed_at || undefined,
    workingHours: Number(row.working_hours) || 38,
    workingHoursConfirmed: Boolean(row.working_hours_confirmed),
    citizenStatus: (row.citizen_status as any) || 'CITIZEN',
    visaType: row.visa_type || undefined,
    visaExpiryDate: row.visa_expiry_date || undefined,
    visaStatusConfirmed: Boolean(row.visa_status_confirmed),
    hasDriverLicense: Boolean(row.has_driver_license),
    licenseCountry: row.license_country || 'NSW (Australia)',
    licenseNumber: row.license_number || '',
    licenseExpiryDate: row.license_expiry_date || '',
    emergencyNextOfKin: row.emergency_next_of_kin || '',
    emergencyRelationship: row.emergency_relationship || '',
    emergencyAddress: row.emergency_address || '',
    emergencySuburb: row.emergency_suburb || '',
    emergencyState: (row.emergency_state as any) || 'NSW',
    emergencyPostcode: row.emergency_postcode || '',
    emergencyMobile: row.emergency_mobile || '',
    bankName: row.bank_name || '',
    bankBranch: row.bank_branch || '',
    accountName: row.account_name || '',
    bsbEncrypted: row.bsb_encrypted || undefined,
    bsbMasked: row.bsb_masked || '062-•••',
    accountNumberEncrypted: row.account_number_encrypted || undefined,
    accountNumberMasked: row.account_number_masked || '•••••847',
    tfnEncrypted: row.tfn_encrypted || undefined,
    tfnMasked: row.tfn_masked || '•••-•••-782',
    superFundName: row.super_fund_name || '',
    superMemberNumber: row.super_member_number || '',
    kioskPin: row.kiosk_pin || '4829',
    clockState: row.clock_state || 'CLOCKED_OUT',
    lastClockIn: row.last_clock_in || undefined,
    lastClockOut: row.last_clock_out || undefined,
    clockInTimestamp: row.clock_in_timestamp ? Number(row.clock_in_timestamp) : undefined,
    currentShiftId: row.current_shift_id || undefined,
    avatarUrl: row.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    leaveBalance: {
      annual: Number(row.annual_leave_balance) || 20,
      sick: Number(row.sick_leave_balance) || 10,
      carers: Number(row.carers_leave_balance) || 2,
      longService: Number(row.long_service_balance) || 0,
    },
    payslips: [],
    documents,
  };
}

export async function GET() {
  if (isDbConfigured) {
    try {
      const empRows = await query<any[]>('SELECT * FROM employees ORDER BY employee_number ASC');
      const docRows = await query<any[]>('SELECT * FROM employee_documents ORDER BY created_at DESC');

      const docsByEmp: Record<string, EmployeeDocument[]> = {};
      docRows.forEach(doc => {
        const empId = doc.employee_id;
        if (!docsByEmp[empId]) docsByEmp[empId] = [];
        docsByEmp[empId].push({
          id: doc.id,
          name: doc.name,
          type: doc.type,
          documentNumber: doc.document_number || undefined,
          expiryDate: doc.expiry_date || undefined,
          uploadDate: doc.upload_date,
          status: doc.status,
          fileSize: doc.file_size || '1.8 MB',
          fileType: doc.file_type || 'image',
          previewUrl: doc.preview_url || doc.file_path,
        });
      });

      const rawEmployees: Employee[] = empRows.map(row => mapDbRowToEmployee(row, docsByEmp[row.id] || []));
      const employees: Employee[] = rawEmployees.map(emp => {
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
      await saveStoredEmployees(employees);
      return NextResponse.json({ success: true, employees });
    } catch (err: any) {
      console.warn('MySQL employee fetch failed, falling back to disk storage:', err.message);
    }
  }

  const rawEmployees = await getStoredEmployees();
  const employees = rawEmployees.map(emp => {
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
  return NextResponse.json({ success: true, employees });
}

export async function POST(req: Request) {
  try {
    const body: Partial<Employee> = await req.json();
    const id = body.id || `emp-${Date.now()}`;
    const empNumber = body.employeeNumber || `HSC-SYD-${Math.floor(100 + Math.random() * 900)}`;

    const newEmp: Employee = {
      id,
      employeeNumber: empNumber,
      username: body.username || `${body.firstName || 'staff'}.${body.lastName || 'member'}`.toLowerCase().replace(/[^a-z0-9._-]/g, ''),
      firstName: body.firstName || 'Staff',
      lastName: body.lastName || 'Member',
      email: body.email || '',
      mobilePhone: body.mobilePhone || '',
      homePhone: body.homePhone,
      dateOfBirth: body.dateOfBirth || '',
      startDate: body.startDate || new Date().toISOString().split('T')[0],
      gender: body.gender || 'Prefer not to say',
      address: body.address || '',
      suburb: body.suburb || '',
      state: body.state || 'NSW',
      postcode: body.postcode || '',
      department: body.department,
      jobTitle: body.jobTitle || 'Staff Member',
      workLocation: body.workLocation || 'Sydney, NSW',
      reportsTo: body.reportsTo || 'Operations Lead',
      status: body.status || 'Active',
      onboardingStatus: body.onboardingStatus || (body.status === 'Pending' ? 'INVITED' : 'COMPLETED'),
      inviteToken: body.inviteToken,
      inviteSentAt: body.inviteSentAt || (body.status === 'Pending' ? new Date().toISOString() : undefined),
      inviteExpiresAt: body.inviteExpiresAt || (body.status === 'Pending' ? new Date(Date.now() + 60 * 60 * 1000).toISOString() : undefined),
      passwordSetAt: body.passwordSetAt,
      profileCompletedAt: body.profileCompletedAt,
      workingHours: body.workingHours || 38.0,
      workingHoursConfirmed: body.workingHoursConfirmed ?? true,
      citizenStatus: body.citizenStatus || 'CITIZEN',
      visaType: body.visaType,
      visaExpiryDate: body.visaExpiryDate,
      visaStatusConfirmed: body.visaStatusConfirmed ?? true,
      hasDriverLicense: body.hasDriverLicense ?? true,
      licenseCountry: body.licenseCountry || 'NSW (Australia)',
      licenseNumber: body.licenseNumber,
      licenseExpiryDate: body.licenseExpiryDate,
      emergencyNextOfKin: body.emergencyNextOfKin || '',
      emergencyRelationship: body.emergencyRelationship || '',
      emergencyAddress: body.emergencyAddress || '',
      emergencySuburb: body.emergencySuburb || '',
      emergencyState: body.emergencyState || 'NSW',
      emergencyPostcode: body.emergencyPostcode || '',
      emergencyMobile: body.emergencyMobile || '',
      bankName: body.bankName,
      bankBranch: body.bankBranch,
      accountName: body.accountName,
      bsbEncrypted: body.bsbEncrypted,
      bsbMasked: body.bsbMasked || '062-•••',
      accountNumberEncrypted: body.accountNumberEncrypted,
      accountNumberMasked: body.accountNumberMasked || '•••••847',
      tfnEncrypted: body.tfnEncrypted,
      tfnMasked: body.tfnMasked || '•••-•••-782',
      superFundName: body.superFundName,
      superMemberNumber: body.superMemberNumber,
      kioskPin: body.kioskPin || '4829',
      clockState: body.clockState || 'CLOCKED_OUT',
      avatarUrl: body.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      leaveBalance: body.leaveBalance || { annual: 20, sick: 10, carers: 2, longService: 0 },
      payslips: [],
      documents: body.documents || [],
    };

    // Update disk JSON
    const stored = await getStoredEmployees();
    const updated = [newEmp, ...stored.filter(e => e.id !== id)];
    await saveStoredEmployees(updated);

    if (isDbConfigured) {
      try {
        const sql = `
          INSERT INTO employees (
            id, employee_number, first_name, last_name, email, mobile_phone,
            address, suburb, state, postcode, start_date, department, job_title,
            work_location, reports_to, status, working_hours, working_hours_confirmed,
            citizen_status, visa_type, visa_expiry_date, visa_status_confirmed,
            has_driver_license, license_country, license_number, license_expiry_date,
            emergency_next_of_kin, emergency_relationship, emergency_mobile,
            bank_name, bank_branch, account_name, bsb_encrypted, bsb_masked,
            account_number_encrypted, account_number_masked, tfn_encrypted, tfn_masked,
            super_fund_name, super_member_number, kiosk_pin, clock_state, avatar_url,
            annual_leave_balance, sick_leave_balance, carers_leave_balance, long_service_balance
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        await query(sql, [
          id, empNumber, newEmp.firstName, newEmp.lastName, newEmp.email, newEmp.mobilePhone,
          newEmp.address, newEmp.suburb, newEmp.state, newEmp.postcode, newEmp.startDate, newEmp.department || null, newEmp.jobTitle,
          newEmp.workLocation, newEmp.reportsTo, newEmp.status, newEmp.workingHours, newEmp.workingHoursConfirmed ? 1 : 0,
          newEmp.citizenStatus, newEmp.visaType || null, newEmp.visaExpiryDate || null, newEmp.visaStatusConfirmed ? 1 : 0,
          newEmp.hasDriverLicense ? 1 : 0, newEmp.licenseCountry || 'NSW (Australia)', newEmp.licenseNumber || null, newEmp.licenseExpiryDate || null,
          newEmp.emergencyNextOfKin || null, newEmp.emergencyRelationship || null, newEmp.emergencyMobile || null,
          newEmp.bankName || null, newEmp.bankBranch || null, newEmp.accountName || null, newEmp.bsbEncrypted || null, newEmp.bsbMasked || null,
          newEmp.accountNumberEncrypted || null, newEmp.accountNumberMasked || null, newEmp.tfnEncrypted || null, newEmp.tfnMasked || null,
          newEmp.superFundName || null, newEmp.superMemberNumber || null, newEmp.kioskPin || '4829', newEmp.clockState || 'CLOCKED_OUT',
          newEmp.avatarUrl, newEmp.leaveBalance.annual, newEmp.leaveBalance.sick, newEmp.leaveBalance.carers, newEmp.leaveBalance.longService
        ]);
      } catch (err: any) {
        console.warn('MySQL employee insert skipped:', err.message);
      }
    }

    return NextResponse.json({ success: true, id, employeeNumber: empNumber });
  } catch (err: any) {
    console.error('Error inserting employee:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { id, updates } = await req.json();
    if (!id) {
      return NextResponse.json({ success: false, message: 'Employee ID required' }, { status: 400 });
    }

    // Update disk JSON
    const stored = await getStoredEmployees();
    const updated = stored.map(emp => emp.id === id ? { ...emp, ...updates } : emp);
    await saveStoredEmployees(updated);

    if (isDbConfigured) {
      try {
        const setClauses: string[] = [];
        const params: any[] = [];
        const fieldMap: Record<string, string> = {
          username: 'username', onboardingStatus: 'onboarding_status', inviteToken: 'invite_token',
          inviteSentAt: 'invite_sent_at', inviteExpiresAt: 'invite_expires_at', passwordSetAt: 'password_set_at',
          profileCompletedAt: 'profile_completed_at',
          firstName: 'first_name', lastName: 'last_name', email: 'email', mobilePhone: 'mobile_phone',
          address: 'address', suburb: 'suburb', state: 'state', postcode: 'postcode', startDate: 'start_date',
          department: 'department', jobTitle: 'job_title', workLocation: 'work_location', reportsTo: 'reports_to',
          status: 'status', workingHours: 'working_hours', workingHoursConfirmed: 'working_hours_confirmed',
          citizenStatus: 'citizen_status', visaType: 'visa_type', visaExpiryDate: 'visa_expiry_date',
          visaStatusConfirmed: 'visa_status_confirmed', hasDriverLicense: 'has_driver_license',
          licenseCountry: 'license_country', licenseNumber: 'license_number', licenseExpiryDate: 'license_expiry_date',
          emergencyNextOfKin: 'emergency_next_of_kin', emergencyRelationship: 'emergency_relationship',
          emergencyMobile: 'emergency_mobile', bankName: 'bank_name', bankBranch: 'bank_branch',
          accountName: 'account_name', bsbEncrypted: 'bsb_encrypted', bsbMasked: 'bsb_masked',
          accountNumberEncrypted: 'account_number_encrypted', accountNumberMasked: 'account_number_masked',
          tfnEncrypted: 'tfn_encrypted', tfnMasked: 'tfn_masked', superFundName: 'super_fund_name',
          superMemberNumber: 'super_member_number', kioskPin: 'kiosk_pin', clockState: 'clock_state',
          lastClockIn: 'last_clock_in', lastClockOut: 'last_clock_out', clockInTimestamp: 'clock_in_timestamp',
          currentShiftId: 'current_shift_id', avatarUrl: 'avatar_url',
        };

        for (const [key, value] of Object.entries(updates)) {
          const col = fieldMap[key];
          if (col) {
            setClauses.push(`\`${col}\` = ?`);
            params.push(typeof value === 'boolean' ? (value ? 1 : 0) : (value ?? null));
          }
        }

        if (setClauses.length > 0) {
          params.push(id);
          const sql = `UPDATE employees SET ${setClauses.join(', ')} WHERE id = ?`;
          await query(sql, params);
        }
      } catch (err: any) {
        console.warn('MySQL employee update skipped:', err.message);
      }
    }

    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    console.error('Error updating employee:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, message: 'ID required' }, { status: 400 });
    }

    // Remove from disk JSON
    const stored = await getStoredEmployees();
    const updated = stored.filter(emp => emp.id !== id);
    await saveStoredEmployees(updated);

    if (isDbConfigured) {
      try {
        await query('DELETE FROM employees WHERE id = ?', [id]);
      } catch (err: any) {
        console.warn('MySQL employee delete skipped:', err.message);
      }
    }

    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    console.error('Error deleting employee:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
