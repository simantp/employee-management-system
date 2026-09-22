const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { promisify } = require('util');

const scrypt = promisify(crypto.scrypt);
const KEY_LENGTH = 64;
const PREFIX = 'scrypt$';

async function hashPassword(plain) {
  const salt = crypto.randomBytes(16);
  const derived = await scrypt(plain, salt, KEY_LENGTH);
  return `${PREFIX}${salt.toString('hex')}$${derived.toString('hex')}`;
}

async function seed() {
  const dataDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  console.log('Seeding local database for Employee Management System...');

  // 1. Seed Admin & Staff Users
  const adminPasswordHash = await hashPassword('Password123!');
  const staffPasswordHash = await hashPassword('Password123!');

  const users = [
    {
      id: 'usr-1',
      name: 'Administrator',
      username: 'admin',
      email: 'admin@company.com.au',
      password: adminPasswordHash,
      role: 'SUPER_ADMIN',
      isEmailVerified: true,
      avatarUrl: '',
      createdAt: new Date().toLocaleDateString('en-AU'),
    },
    {
      id: 'usr-2',
      name: 'Suman Thapa',
      username: 'suman.thapa',
      email: 'suman.thapa@company.com',
      password: staffPasswordHash,
      role: 'STAFF',
      isEmailVerified: true,
      staffId: 'emp-1',
      department: 'Production (Riverwood)',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      createdAt: new Date().toLocaleDateString('en-AU'),
    }
  ];

  fs.writeFileSync(path.join(dataDir, 'users.json'), JSON.stringify(users, null, 2), 'utf8');
  console.log('✓ Seeded users.json (Admin + Staff)');

  // 2. Seed Sample Employee
  const employees = [
    {
      id: 'emp-1',
      employeeNumber: 'EMP-0001',
      firstName: 'Suman',
      lastName: 'Thapa',
      email: 'suman.thapa@company.com',
      mobilePhone: '0412 345 678',
      homePhone: '02 9876 5432',
      dateOfBirth: '1994-08-14',
      startDate: '2025-05-15',
      gender: 'Male',
      address: '14 Belmore Road',
      suburb: 'Riverwood',
      state: 'NSW',
      postcode: '2210',
      department: 'Production (Riverwood)',
      jobTitle: 'Production Specialist',
      workLocation: 'Riverwood, NSW',
      reportsTo: 'Operations Admin',
      status: 'Active',
      clockState: 'CLOCKED_OUT',
      kioskPin: '1234',
      citizenStatus: 'VISA_HOLDER',
      visaType: 'Temporary Skill Shortage (Subclass 482)',
      visaExpiryDate: '2026-12-31',
      workRestrictions: 'Full-time work rights, 38 hours/week',
      hasDriverLicense: true,
      licenseCountry: 'Australia',
      licenseNumber: 'DL-9948210',
      licenseExpiryDate: '2027-10-12',
      emergencyNextOfKin: 'Pooja Thapa',
      emergencyRelationship: 'Spouse',
      emergencyAddress: '14 Belmore Road',
      emergencySuburb: 'Riverwood',
      emergencyState: 'NSW',
      emergencyPostcode: '2210',
      emergencyMobile: '0423 999 888',
      emergencyHomePhone: '02 9876 5432',
      tfnMasked: '• • • - • • • - 482',
      superFundName: 'AustralianSuper',
      superMemberNumber: 'AUS-8849102',
      bankName: 'Commonwealth Bank of Australia',
      bankBsbMasked: '062 - • • •',
      bankAccountNumberMasked: '• • • • 4910',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      createdAt: new Date().toLocaleDateString('en-AU'),
    }
  ];

  fs.writeFileSync(path.join(dataDir, 'employees.json'), JSON.stringify(employees, null, 2), 'utf8');
  console.log('✓ Seeded employees.json (Sample staff member Suman Thapa)');

  // 3. Seed Sample Announcement
  const announcements = [
    {
      id: 'ann-1',
      title: 'Welcome to the HsCreations Employee Portal',
      content: 'Welcome to the local development instance of the HsCreations Employee Management System. You can manage staff, review compliance alerts, log timecards, and update employment records.',
      author: 'Super Admin',
      authorRole: 'SUPER_ADMIN',
      date: new Date().toLocaleDateString('en-AU'),
      category: 'Operations & Safety',
      isPinned: true
    }
  ];

  fs.writeFileSync(path.join(dataDir, 'announcements.json'), JSON.stringify(announcements, null, 2), 'utf8');
  console.log('✓ Seeded announcements.json');

  console.log('\nSeed completed successfully!');
  console.log('Default credentials:');
  console.log('  Admin:  admin@company.com.au / Password123!');
  console.log('  Staff:  suman.thapa@company.com / Password123! (PIN: 1234)');
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
