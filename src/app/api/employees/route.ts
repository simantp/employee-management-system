import { NextResponse } from 'next/server';
import { query, isDbConfigured } from '@/lib/db';
import { Employee, EmployeeDocument } from '@/types';

// Helper to map DB row to Employee object
function mapDbRowToEmployee(row: any, documents: EmployeeDocument[] = []): Employee {
  return {
    id: row.id,
    employeeNumber: row.employee_number,
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
    workingHours: Number(row.working_hours) || 38,
    workingHoursConfirmed: Boolean(row.working_hours_confirmed),
    citizenStatus: row.citizen_status || 'Australian Citizen',
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
  if (!isDbConfigured) {
    return NextResponse.json({ success: false, isConfigured: false, message: 'Database not configured' });
  }

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

    const employees: Employee[] = empRows.map(row => mapDbRowToEmployee(row, docsByEmp[row.id] || []));

    return NextResponse.json({
      success: true,
      employees,
    });
  } catch (err: any) {
    console.error('Error fetching employees from MySQL:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!isDbConfigured) {
    return NextResponse.json({ success: false, message: 'Database not configured' }, { status: 400 });
  }

  try {
    const body: Partial<Employee> = await req.json();
    const id = body.id || `emp-${Date.now()}`;
    const empNumber = body.employeeNumber || `HSC-SYD-${Math.floor(100 + Math.random() * 900)}`;

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
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?
      )
    `;

    await query(sql, [
      id,
      empNumber,
      body.firstName || 'Staff',
      body.lastName || 'Member',
      body.email || '',
      body.mobilePhone || '',
      body.address || '',
      body.suburb || '',
      body.state || 'NSW',
      body.postcode || '',
      body.startDate || new Date().toISOString().split('T')[0],
      body.department || null,
      body.jobTitle || 'Staff Member',
      body.workLocation || 'Sydney, NSW',
      body.reportsTo || 'Operations Lead',
      body.status || 'Active',
      body.workingHours || 38.0,
      body.workingHoursConfirmed ? 1 : 0,
      body.citizenStatus || 'Australian Citizen',
      body.visaType || null,
      body.visaExpiryDate || null,
      body.visaStatusConfirmed ? 1 : 0,
      body.hasDriverLicense ? 1 : 0,
      body.licenseCountry || 'NSW (Australia)',
      body.licenseNumber || null,
      body.licenseExpiryDate || null,
      body.emergencyNextOfKin || null,
      body.emergencyRelationship || null,
      body.emergencyMobile || null,
      body.bankName || null,
      body.bankBranch || null,
      body.accountName || null,
      body.bsbEncrypted || null,
      body.bsbMasked || null,
      body.accountNumberEncrypted || null,
      body.accountNumberMasked || null,
      body.tfnEncrypted || null,
      body.tfnMasked || null,
      body.superFundName || null,
      body.superMemberNumber || null,
      body.kioskPin || '4829',
      body.clockState || 'CLOCKED_OUT',
      body.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      body.leaveBalance?.annual || 20.0,
      body.leaveBalance?.sick || 10.0,
      body.leaveBalance?.carers || 2.0,
      body.leaveBalance?.longService || 0.0,
    ]);

    return NextResponse.json({ success: true, id, employeeNumber: empNumber });
  } catch (err: any) {
    console.error('Error inserting employee in MySQL:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  if (!isDbConfigured) {
    return NextResponse.json({ success: false, message: 'Database not configured' }, { status: 400 });
  }

  try {
    const { id, updates } = await req.json();
    if (!id) {
      return NextResponse.json({ success: false, message: 'Employee ID required' }, { status: 400 });
    }

    const setClauses: string[] = [];
    const params: any[] = [];

    const fieldMap: Record<string, string> = {
      firstName: 'first_name',
      lastName: 'last_name',
      email: 'email',
      mobilePhone: 'mobile_phone',
      address: 'address',
      suburb: 'suburb',
      state: 'state',
      postcode: 'postcode',
      startDate: 'start_date',
      department: 'department',
      jobTitle: 'job_title',
      workLocation: 'work_location',
      reportsTo: 'reports_to',
      status: 'status',
      workingHours: 'working_hours',
      workingHoursConfirmed: 'working_hours_confirmed',
      citizenStatus: 'citizen_status',
      visaType: 'visa_type',
      visaExpiryDate: 'visa_expiry_date',
      visaStatusConfirmed: 'visa_status_confirmed',
      hasDriverLicense: 'has_driver_license',
      licenseCountry: 'license_country',
      licenseNumber: 'license_number',
      licenseExpiryDate: 'license_expiry_date',
      emergencyNextOfKin: 'emergency_next_of_kin',
      emergencyRelationship: 'emergency_relationship',
      emergencyMobile: 'emergency_mobile',
      bankName: 'bank_name',
      bankBranch: 'bank_branch',
      accountName: 'account_name',
      bsbEncrypted: 'bsb_encrypted',
      bsbMasked: 'bsb_masked',
      accountNumberEncrypted: 'account_number_encrypted',
      accountNumberMasked: 'account_number_masked',
      tfnEncrypted: 'tfn_encrypted',
      tfnMasked: 'tfn_masked',
      superFundName: 'super_fund_name',
      superMemberNumber: 'super_member_number',
      kioskPin: 'kiosk_pin',
      clockState: 'clock_state',
      lastClockIn: 'last_clock_in',
      lastClockOut: 'last_clock_out',
      clockInTimestamp: 'clock_in_timestamp',
      currentShiftId: 'current_shift_id',
      avatarUrl: 'avatar_url',
    };

    for (const [key, value] of Object.entries(updates)) {
      const col = fieldMap[key];
      if (col) {
        setClauses.push(`\`${col}\` = ?`);
        if (typeof value === 'boolean') {
          params.push(value ? 1 : 0);
        } else {
          params.push(value ?? null);
        }
      }
    }

    if (setClauses.length === 0) {
      return NextResponse.json({ success: true, message: 'No fields to update' });
    }

    params.push(id);
    const sql = `UPDATE employees SET ${setClauses.join(', ')} WHERE id = ?`;
    await query(sql, params);

    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    console.error('Error updating employee in MySQL:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  if (!isDbConfigured) {
    return NextResponse.json({ success: false, message: 'Database not configured' }, { status: 400 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, message: 'ID required' }, { status: 400 });
    }

    await query('DELETE FROM employees WHERE id = ?', [id]);
    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    console.error('Error deleting employee from MySQL:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
