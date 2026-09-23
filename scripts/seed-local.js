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

  console.log('Seeding clean database with single Super Admin for Employee Management System...');

  // 1. Seed Single Admin User
  const adminPasswordHash = await hashPassword('SuperAdmin2026!');

  const users = [
    {
      id: 'usr-1',
      name: 'Super Admin',
      username: 'admin',
      email: 'admin@company.com.au',
      password: adminPasswordHash,
      role: 'SUPER_ADMIN',
      isEmailVerified: true,
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
      createdAt: new Date().toLocaleDateString('en-AU'),
    }
  ];

  fs.writeFileSync(path.join(dataDir, 'users.json'), JSON.stringify(users, null, 2), 'utf8');
  console.log('✓ Seeded users.json (Single Super Admin)');

  // 2. Clean Employees
  fs.writeFileSync(path.join(dataDir, 'employees.json'), JSON.stringify([], null, 2), 'utf8');
  console.log('✓ Seeded employees.json (Empty)');

  // 3. Clean Timecards & Leave
  fs.writeFileSync(path.join(dataDir, 'timecards.json'), JSON.stringify([], null, 2), 'utf8');
  fs.writeFileSync(path.join(dataDir, 'leave.json'), JSON.stringify([], null, 2), 'utf8');
  fs.writeFileSync(path.join(dataDir, 'notifications.json'), JSON.stringify([], null, 2), 'utf8');

  // 4. Seed Welcome Announcement
  const announcements = [
    {
      id: 'ann-1',
      title: 'Welcome to HsCreations Management Portal',
      content: 'Welcome to the HsCreations Employee Management System. Manage staff onboarding, compliance alerts, and shift schedules securely.',
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
  console.log('  Admin:  admin@company.com.au / SuperAdmin2026! (or password123)');
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
