const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// Load environment variables from .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        let val = trimmed.slice(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        process.env[key] = val;
      }
    }
  });
}

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = parseInt(process.env.DB_PORT || '3306', 10);
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'hscreations_ems';

function readJsonFile(filename, defaultValue = []) {
  const filePath = path.join(__dirname, '..', 'data', filename);
  if (!fs.existsSync(filePath)) return defaultValue;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    console.warn(`Could not parse data/${filename}:`, e.message);
    return defaultValue;
  }
}

async function runMigration() {
  console.log('====================================================');
  console.log(' HsCreations EMS - MySQL Migration & Data Sync Tool');
  console.log('====================================================');
  console.log(`Connecting to MySQL Server at ${DB_HOST}:${DB_PORT} as user "${DB_USER}"...`);

  let connection;
  try {
    connection = await mysql.createConnection({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
    });
    console.log('✓ Successfully connected to MySQL server!');
  } catch (err) {
    console.error('✗ Failed to connect to MySQL server:', err.message);
    console.error('  Please ensure XAMPP is running and MySQL service is active.');
    process.exit(1);
  }

  try {
    // 1. Ensure Database Exists
    console.log(`Ensuring database "${DB_NAME}" exists...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await connection.query(`USE \`${DB_NAME}\``);
    console.log(`✓ Using database "${DB_NAME}"`);

    // 2. Disable Foreign Key Checks during setup
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');

    // 3. Create Tables
    console.log('\n--- Creating / Verifying Tables ---');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`users\` (
        \`id\` VARCHAR(64) NOT NULL,
        \`email\` VARCHAR(191) NOT NULL,
        \`username\` VARCHAR(100) NULL,
        \`name\` VARCHAR(191) NOT NULL,
        \`role\` VARCHAR(32) NOT NULL DEFAULT 'STAFF',
        \`password\` VARCHAR(255) NULL,
        \`password_hash\` VARCHAR(255) NULL,
        \`is_email_verified\` TINYINT(1) NOT NULL DEFAULT 1,
        \`staff_id\` VARCHAR(64) NULL,
        \`department\` VARCHAR(100) NULL,
        \`avatar_url\` TEXT NULL,
        \`created_at\` VARCHAR(64) NULL,
        \`created_timestamp\` BIGINT NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uk_users_email\` (\`email\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✓ Table `users` ready');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`employees\` (
        \`id\` VARCHAR(64) NOT NULL,
        \`employee_number\` VARCHAR(32) NOT NULL,
        \`username\` VARCHAR(100) NULL,
        \`first_name\` VARCHAR(100) NOT NULL,
        \`last_name\` VARCHAR(100) NOT NULL,
        \`email\` VARCHAR(191) NOT NULL,
        \`mobile_phone\` VARCHAR(32) NOT NULL,
        \`home_phone\` VARCHAR(32) NULL,
        \`date_of_birth\` VARCHAR(32) NULL,
        \`start_date\` VARCHAR(32) NULL,
        \`gender\` VARCHAR(32) DEFAULT 'Prefer not to say',
        \`address\` VARCHAR(255) NULL,
        \`suburb\` VARCHAR(100) NULL,
        \`state\` VARCHAR(16) DEFAULT 'NSW',
        \`postcode\` VARCHAR(16) NULL,
        \`department\` VARCHAR(100) NULL,
        \`job_title\` VARCHAR(100) NOT NULL DEFAULT 'Staff Member',
        \`work_location\` VARCHAR(100) DEFAULT 'Sydney, NSW',
        \`reports_to\` VARCHAR(100) DEFAULT 'Operations Lead',
        \`status\` VARCHAR(32) NOT NULL DEFAULT 'Active',
        \`onboarding_status\` VARCHAR(32) DEFAULT 'COMPLETED',
        \`invite_token\` VARCHAR(128) NULL,
        \`invite_sent_at\` VARCHAR(64) NULL,
        \`invite_expires_at\` VARCHAR(64) NULL,
        \`password_set_at\` VARCHAR(64) NULL,
        \`profile_completed_at\` VARCHAR(64) NULL,
        \`working_hours\` DECIMAL(5,2) NOT NULL DEFAULT 38.00,
        \`working_hours_confirmed\` TINYINT(1) NOT NULL DEFAULT 1,
        \`citizen_status\` VARCHAR(64) DEFAULT 'Australian Citizen',
        \`visa_type\` VARCHAR(100) NULL,
        \`visa_expiry_date\` VARCHAR(32) NULL,
        \`visa_status_confirmed\` TINYINT(1) NOT NULL DEFAULT 1,
        \`has_driver_license\` TINYINT(1) NOT NULL DEFAULT 1,
        \`license_country\` VARCHAR(100) DEFAULT 'NSW (Australia)',
        \`license_number\` VARCHAR(64) NULL,
        \`license_expiry_date\` VARCHAR(32) NULL,
        \`emergency_next_of_kin\` VARCHAR(100) NULL,
        \`emergency_relationship\` VARCHAR(100) NULL,
        \`emergency_address\` VARCHAR(255) NULL,
        \`emergency_suburb\` VARCHAR(100) NULL,
        \`emergency_state\` VARCHAR(16) DEFAULT 'NSW',
        \`emergency_postcode\` VARCHAR(16) NULL,
        \`emergency_mobile\` VARCHAR(32) NULL,
        \`bank_name\` VARCHAR(100) NULL,
        \`bank_branch\` VARCHAR(100) NULL,
        \`account_name\` VARCHAR(100) NULL,
        \`bsb_encrypted\` TEXT NULL,
        \`bsb_masked\` VARCHAR(32) NULL,
        \`account_number_encrypted\` TEXT NULL,
        \`account_number_masked\` VARCHAR(32) NULL,
        \`tfn_encrypted\` TEXT NULL,
        \`tfn_masked\` VARCHAR(32) NULL,
        \`super_fund_name\` VARCHAR(100) NULL,
        \`super_member_number\` VARCHAR(64) NULL,
        \`kiosk_pin\` VARCHAR(16) NOT NULL DEFAULT '4829',
        \`clock_state\` VARCHAR(32) NOT NULL DEFAULT 'CLOCKED_OUT',
        \`last_clock_in\` VARCHAR(64) NULL,
        \`last_clock_out\` VARCHAR(64) NULL,
        \`clock_in_timestamp\` BIGINT NULL,
        \`current_shift_id\` VARCHAR(64) NULL,
        \`avatar_url\` TEXT NULL,
        \`annual_leave_balance\` DECIMAL(6,2) NOT NULL DEFAULT 20.00,
        \`sick_leave_balance\` DECIMAL(6,2) NOT NULL DEFAULT 10.00,
        \`carers_leave_balance\` DECIMAL(6,2) NOT NULL DEFAULT 2.00,
        \`long_service_balance\` DECIMAL(6,2) NOT NULL DEFAULT 0.00,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uk_employees_number\` (\`employee_number\`),
        UNIQUE KEY \`uk_employees_email\` (\`email\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✓ Table `employees` ready');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`employee_documents\` (
        \`id\` VARCHAR(64) NOT NULL,
        \`employee_id\` VARCHAR(64) NOT NULL,
        \`name\` VARCHAR(191) NOT NULL,
        \`type\` VARCHAR(100) NOT NULL,
        \`document_number\` VARCHAR(100) NULL,
        \`expiry_date\` VARCHAR(32) NULL,
        \`upload_date\` VARCHAR(32) NOT NULL,
        \`status\` VARCHAR(32) NOT NULL DEFAULT 'Pending',
        \`file_size\` VARCHAR(32) NULL DEFAULT '1.8 MB',
        \`file_type\` VARCHAR(32) NULL DEFAULT 'image',
        \`file_path\` TEXT NULL,
        \`preview_url\` TEXT NULL,
        \`rejection_reason\` TEXT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        KEY \`idx_emp_doc_empid\` (\`employee_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✓ Table `employee_documents` ready');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`timecards\` (
        \`id\` VARCHAR(64) NOT NULL,
        \`employee_id\` VARCHAR(64) NOT NULL,
        \`employee_name\` VARCHAR(191) NOT NULL,
        \`employee_avatar\` TEXT NULL,
        \`department\` VARCHAR(100) NOT NULL DEFAULT 'General Operations',
        \`date\` VARCHAR(32) NOT NULL,
        \`clock_in\` VARCHAR(32) NOT NULL,
        \`clock_out\` VARCHAR(32) NULL,
        \`clock_in_timestamp\` BIGINT NOT NULL,
        \`clock_out_timestamp\` BIGINT NULL,
        \`duration_seconds\` INT NOT NULL DEFAULT 0,
        \`break_minutes\` INT NOT NULL DEFAULT 0,
        \`is_break_manually_adjusted\` TINYINT(1) NOT NULL DEFAULT 0,
        \`total_hours\` DECIMAL(6,4) NOT NULL DEFAULT 0.0000,
        \`overtime_hours\` DECIMAL(6,4) NOT NULL DEFAULT 0.0000,
        \`status\` VARCHAR(32) NOT NULL DEFAULT 'CLOCKED_IN',
        \`notes\` TEXT NULL,
        \`admin_note\` TEXT NULL,
        \`staff_note\` TEXT NULL,
        \`staff_note_submitted_at\` VARCHAR(64) NULL,
        \`staff_note_status\` VARCHAR(32) NULL,
        \`adjusted_by\` VARCHAR(100) NULL,
        \`adjusted_at\` VARCHAR(64) NULL,
        \`clock_in_ip\` VARCHAR(64) NULL,
        \`clock_out_ip\` VARCHAR(64) NULL,
        \`clock_in_workstation\` VARCHAR(100) NULL,
        \`clock_out_workstation\` VARCHAR(100) NULL,
        \`ip_address\` VARCHAR(64) NULL,
        \`workstation_label\` VARCHAR(100) NULL,
        \`device_info\` VARCHAR(255) NULL,
        \`ip_status\` VARCHAR(64) NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        KEY \`idx_timecards_empid\` (\`employee_id\`),
        KEY \`idx_timecards_date\` (\`date\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✓ Table `timecards` ready');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`leave_requests\` (
        \`id\` VARCHAR(64) NOT NULL,
        \`employee_id\` VARCHAR(64) NOT NULL,
        \`employee_name\` VARCHAR(191) NOT NULL,
        \`employee_avatar\` TEXT NULL,
        \`department\` VARCHAR(100) NOT NULL,
        \`leave_type\` VARCHAR(32) NOT NULL,
        \`start_date\` VARCHAR(32) NOT NULL,
        \`end_date\` VARCHAR(32) NOT NULL,
        \`total_days\` DECIMAL(5,2) NOT NULL DEFAULT 1.00,
        \`reason\` TEXT NOT NULL,
        \`status\` VARCHAR(32) NOT NULL DEFAULT 'PENDING',
        \`certificate_url\` TEXT NULL,
        \`certificate_uploaded\` TINYINT(1) NOT NULL DEFAULT 0,
        \`admin_notes\` TEXT NULL,
        \`submitted_at\` VARCHAR(64) NOT NULL,
        \`submitted_timestamp\` BIGINT NULL,
        \`is_advance_notice_met\` TINYINT(1) NOT NULL DEFAULT 1,
        \`advance_notice_days\` INT NOT NULL DEFAULT 0,
        \`reminder_count\` INT NOT NULL DEFAULT 0,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        KEY \`idx_leave_empid\` (\`employee_id\`),
        KEY \`idx_leave_status\` (\`status\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✓ Table `leave_requests` ready');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`document_types\` (
        \`id\` VARCHAR(64) NOT NULL,
        \`name\` VARCHAR(191) NOT NULL,
        \`category\` VARCHAR(100) NOT NULL,
        \`has_expiry\` TINYINT(1) NOT NULL DEFAULT 1,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✓ Table `document_types` ready');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`announcements\` (
        \`id\` VARCHAR(64) NOT NULL,
        \`title\` VARCHAR(191) NOT NULL,
        \`content\` TEXT NOT NULL,
        \`author\` VARCHAR(100) NOT NULL,
        \`author_role\` VARCHAR(64) NOT NULL DEFAULT 'SUPER_ADMIN',
        \`date\` VARCHAR(32) NOT NULL,
        \`category\` VARCHAR(100) NULL,
        \`is_pinned\` TINYINT(1) NOT NULL DEFAULT 0,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✓ Table `announcements` ready');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`audit_logs\` (
        \`id\` VARCHAR(64) NOT NULL,
        \`action\` VARCHAR(64) NOT NULL,
        \`target_entity\` VARCHAR(64) NOT NULL,
        \`target_id\` VARCHAR(64) NOT NULL,
        \`details\` TEXT NOT NULL,
        \`performed_by\` VARCHAR(100) NOT NULL,
        \`role\` VARCHAR(64) NOT NULL DEFAULT 'STAFF',
        \`timestamp\` VARCHAR(64) NOT NULL,
        \`ip_address\` VARCHAR(64) NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        KEY \`idx_audit_entity\` (\`target_entity\`),
        KEY \`idx_audit_action\` (\`action\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✓ Table `audit_logs` ready');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`notifications\` (
        \`id\` VARCHAR(64) NOT NULL,
        \`recipient\` VARCHAR(32) NOT NULL DEFAULT 'ADMIN',
        \`recipient_id\` VARCHAR(64) NULL,
        \`title\` VARCHAR(191) NOT NULL,
        \`message\` TEXT NOT NULL,
        \`type\` VARCHAR(64) NOT NULL DEFAULT 'GENERAL',
        \`timestamp\` VARCHAR(64) NOT NULL,
        \`read\` TINYINT(1) NOT NULL DEFAULT 0,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✓ Table `notifications` ready');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`email_logs\` (
        \`id\` VARCHAR(64) NOT NULL,
        \`recipient_email\` VARCHAR(191) NOT NULL,
        \`recipient_name\` VARCHAR(191) NOT NULL,
        \`subject\` VARCHAR(255) NOT NULL,
        \`body_preview\` TEXT NULL,
        \`type\` VARCHAR(64) NOT NULL DEFAULT 'GENERAL',
        \`status\` VARCHAR(32) NOT NULL DEFAULT 'SENT',
        \`sent_at\` VARCHAR(64) NOT NULL,
        \`timestamp\` VARCHAR(64) NOT NULL,
        \`attempts\` INT NOT NULL DEFAULT 1,
        \`error_details\` TEXT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✓ Table `email_logs` ready');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`sessions\` (
        \`id\` VARCHAR(64) NOT NULL,
        \`token\` VARCHAR(128) NOT NULL,
        \`user_id\` VARCHAR(64) NOT NULL,
        \`user_email\` VARCHAR(191) NOT NULL,
        \`user_name\` VARCHAR(191) NOT NULL,
        \`role\` VARCHAR(32) NOT NULL DEFAULT 'STAFF',
        \`staff_id\` VARCHAR(64) NULL,
        \`created_at\` BIGINT NOT NULL,
        \`expires_at\` BIGINT NOT NULL,
        \`ip_address\` VARCHAR(64) NULL,
        \`user_agent\` TEXT NULL,
        \`last_active_at\` BIGINT NOT NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uk_sessions_token\` (\`token\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✓ Table `sessions` ready');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`settings\` (
        \`id\` VARCHAR(64) NOT NULL,
        \`settings_json\` LONGTEXT NOT NULL,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✓ Table `settings` ready');

    // 4. Migrate Data from data/*.json files
    console.log('\n--- Migrating Present Data from data/*.json into MySQL ---');

    // Users
    const users = readJsonFile('users.json');
    if (users.length > 0) {
      for (const u of users) {
        await connection.query(`
          INSERT INTO users (id, email, username, name, role, password, is_email_verified, staff_id, department, avatar_url, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            username = VALUES(username),
            name = VALUES(name),
            role = VALUES(role),
            password = VALUES(password),
            is_email_verified = VALUES(is_email_verified),
            staff_id = VALUES(staff_id),
            department = VALUES(department),
            avatar_url = VALUES(avatar_url)
        `, [
          u.id, u.email, u.username || null, u.name, u.role, u.password || null,
          u.isEmailVerified ? 1 : 0, u.staffId || null, u.department || null,
          u.avatarUrl || null, u.createdAt || null
        ]);
      }
      console.log(`✓ Migrated ${users.length} users`);
    }

    // Employees & Documents
    const employees = readJsonFile('employees.json');
    if (employees.length > 0) {
      let docCount = 0;
      for (const e of employees) {
        await connection.query(`
          INSERT INTO employees (
            id, employee_number, username, first_name, last_name, email, mobile_phone,
            home_phone, date_of_birth, start_date, gender, address, suburb, state, postcode,
            department, job_title, work_location, reports_to, status, onboarding_status,
            invite_token, invite_sent_at, invite_expires_at, password_set_at, profile_completed_at,
            working_hours, working_hours_confirmed, citizen_status, visa_type, visa_expiry_date,
            visa_status_confirmed, has_driver_license, license_country, license_number, license_expiry_date,
            emergency_next_of_kin, emergency_relationship, emergency_address, emergency_suburb,
            emergency_state, emergency_postcode, emergency_mobile, bank_name, bank_branch,
            account_name, bsb_encrypted, bsb_masked, account_number_encrypted, account_number_masked,
            tfn_encrypted, tfn_masked, super_fund_name, super_member_number, kiosk_pin, clock_state,
            last_clock_in, last_clock_out, clock_in_timestamp, current_shift_id, avatar_url,
            annual_leave_balance, sick_leave_balance, carers_leave_balance, long_service_balance
          ) VALUES (
            ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?
          )
          ON DUPLICATE KEY UPDATE
            username = VALUES(username),
            first_name = VALUES(first_name),
            last_name = VALUES(last_name),
            mobile_phone = VALUES(mobile_phone),
            department = VALUES(department),
            job_title = VALUES(job_title),
            status = VALUES(status),
            kiosk_pin = VALUES(kiosk_pin),
            clock_state = VALUES(clock_state),
            last_clock_in = VALUES(last_clock_in),
            last_clock_out = VALUES(last_clock_out),
            clock_in_timestamp = VALUES(clock_in_timestamp),
            current_shift_id = VALUES(current_shift_id),
            avatar_url = VALUES(avatar_url),
            annual_leave_balance = VALUES(annual_leave_balance),
            sick_leave_balance = VALUES(sick_leave_balance),
            carers_leave_balance = VALUES(carers_leave_balance),
            long_service_balance = VALUES(long_service_balance),
            bank_name = VALUES(bank_name),
            bank_branch = VALUES(bank_branch),
            account_name = VALUES(account_name),
            bsb_encrypted = VALUES(bsb_encrypted),
            bsb_masked = VALUES(bsb_masked),
            account_number_encrypted = VALUES(account_number_encrypted),
            account_number_masked = VALUES(account_number_masked),
            tfn_encrypted = VALUES(tfn_encrypted),
            tfn_masked = VALUES(tfn_masked),
            super_fund_name = VALUES(super_fund_name),
            super_member_number = VALUES(super_member_number)
        `, [
          e.id, e.employeeNumber, e.username || null, e.firstName, e.lastName, e.email, e.mobilePhone,
          e.homePhone || null, e.dateOfBirth || null, e.startDate || null, e.gender || 'Prefer not to say',
          e.address || null, e.suburb || null, e.state || 'NSW', e.postcode || null,
          e.department || null, e.jobTitle || 'Staff Member', e.workLocation || 'Sydney, NSW',
          e.reportsTo || 'Operations Lead', e.status || 'Active', e.onboardingStatus || 'COMPLETED',
          e.inviteToken || null, e.inviteSentAt || null, e.inviteExpiresAt || null,
          e.passwordSetAt || null, e.profileCompletedAt || null,
          e.workingHours || 38.00, e.workingHoursConfirmed ? 1 : 0,
          e.citizenStatus || 'Australian Citizen', e.visaType || null, e.visaExpiryDate || null,
          e.visaStatusConfirmed ? 1 : 0, e.hasDriverLicense ? 1 : 0,
          e.licenseCountry || 'NSW (Australia)', e.licenseNumber || null, e.licenseExpiryDate || null,
          e.emergencyNextOfKin || null, e.emergencyRelationship || null, e.emergencyAddress || null,
          e.emergencySuburb || null, e.emergencyState || 'NSW', e.emergencyPostcode || null,
          e.emergencyMobile || null, e.bankName || null, e.bankBranch || null,
          e.accountName || null, e.bsbEncrypted || null, e.bsbMasked || null,
          e.accountNumberEncrypted || null, e.accountNumberMasked || null,
          e.tfnEncrypted || null, e.tfnMasked || null, e.superFundName || null,
          e.superMemberNumber || null, e.kioskPin || '4829', e.clockState || 'CLOCKED_OUT',
          e.lastClockIn || null, e.lastClockOut || null, e.clockInTimestamp || null,
          e.currentShiftId || null, e.avatarUrl || null,
          e.leaveBalance?.annual ?? 20, e.leaveBalance?.sick ?? 10,
          e.leaveBalance?.carers ?? 2, e.leaveBalance?.longService ?? 0
        ]);

        if (Array.isArray(e.documents)) {
          for (const d of e.documents) {
            docCount++;
            await connection.query(`
              INSERT INTO employee_documents (
                id, employee_id, name, type, document_number, expiry_date, upload_date,
                status, file_size, file_type, file_path, preview_url, rejection_reason
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              ON DUPLICATE KEY UPDATE
                status = VALUES(status),
                expiry_date = VALUES(expiry_date),
                preview_url = VALUES(preview_url),
                rejection_reason = VALUES(rejection_reason)
            `, [
              d.id, e.id, d.name, d.type, d.documentNumber || null, d.expiryDate || null,
              d.uploadDate || new Date().toLocaleDateString('en-AU'), d.status || 'Pending',
              d.fileSize || '1.8 MB', d.fileType || 'image', d.filePath || null,
              d.previewUrl || null, d.rejectionReason || null
            ]);
          }
        }
      }
      console.log(`✓ Migrated ${employees.length} employees and ${docCount} employee documents`);
    }

    // Timecards
    const timecards = readJsonFile('timecards.json');
    if (timecards.length > 0) {
      for (const t of timecards) {
        await connection.query(`
          INSERT INTO timecards (
            id, employee_id, employee_name, employee_avatar, department, date,
            clock_in, clock_out, clock_in_timestamp, clock_out_timestamp,
            duration_seconds, break_minutes, is_break_manually_adjusted,
            total_hours, overtime_hours, status, notes, admin_note, staff_note,
            staff_note_submitted_at, staff_note_status, adjusted_by, adjusted_at,
            clock_in_ip, clock_out_ip, clock_in_workstation, clock_out_workstation,
            ip_address, workstation_label, device_info, ip_status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            clock_out = VALUES(clock_out),
            clock_out_timestamp = VALUES(clock_out_timestamp),
            duration_seconds = VALUES(duration_seconds),
            break_minutes = VALUES(break_minutes),
            total_hours = VALUES(total_hours),
            status = VALUES(status),
            notes = VALUES(notes),
            admin_note = VALUES(admin_note),
            staff_note = VALUES(staff_note)
        `, [
          t.id, t.employeeId, t.employeeName, t.employeeAvatar || null,
          t.department || 'General Operations', t.date, t.clockIn, t.clockOut || null,
          t.clockInTimestamp || 0, t.clockOutTimestamp || null,
          t.durationSeconds || 0, t.breakMinutes || 0, t.isBreakManuallyAdjusted ? 1 : 0,
          t.totalHours || 0, t.overtimeHours || 0, t.status || 'CLOCKED_IN',
          t.notes || null, t.adminNote || null, t.staffNote || null,
          t.staffNoteSubmittedAt || null, t.staffNoteStatus || null,
          t.adjustedBy || null, t.adjustedAt || null,
          t.clockInIp || t.ipAddress || null, t.clockOutIp || null,
          t.clockInWorkstation || t.workstationLabel || null, t.clockOutWorkstation || null,
          t.ipAddress || null, t.workstationLabel || null, t.deviceInfo || null,
          t.ipStatus || null
        ]);
      }
      console.log(`✓ Migrated ${timecards.length} timecard shift records`);
    }

    // Leave Requests
    const leaveRequests = readJsonFile('leave.json');
    if (leaveRequests.length > 0) {
      for (const l of leaveRequests) {
        await connection.query(`
          INSERT INTO leave_requests (
            id, employee_id, employee_name, employee_avatar, department,
            leave_type, start_date, end_date, total_days, reason, status,
            certificate_url, certificate_uploaded, admin_notes, submitted_at,
            submitted_timestamp, is_advance_notice_met, advance_notice_days, reminder_count
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            status = VALUES(status),
            admin_notes = VALUES(admin_notes),
            certificate_url = VALUES(certificate_url),
            certificate_uploaded = VALUES(certificate_uploaded)
        `, [
          l.id, l.employeeId, l.employeeName, l.employeeAvatar || null,
          l.department, l.leaveType, l.startDate, l.endDate,
          l.totalDays || 1, l.reason || '', l.status || 'PENDING',
          l.certificateUrl || null, l.certificateUploaded ? 1 : 0,
          l.adminNotes || null, l.submittedAt, l.submittedTimestamp || null,
          l.isAdvanceNoticeMet ? 1 : 0, l.advanceNoticeDays || 0, l.reminderCount || 0
        ]);
      }
      console.log(`✓ Migrated ${leaveRequests.length} leave requests`);
    }

    // Document Types
    const docTypes = readJsonFile('document_types.json');
    if (docTypes.length > 0) {
      for (const dt of docTypes) {
        await connection.query(`
          INSERT INTO document_types (id, name, category, has_expiry)
          VALUES (?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE name = VALUES(name), category = VALUES(category), has_expiry = VALUES(has_expiry)
        `, [dt.id, dt.name, dt.category, dt.hasExpiry ? 1 : 0]);
      }
      console.log(`✓ Migrated ${docTypes.length} document type configurations`);
    }

    // Announcements
    const announcements = readJsonFile('announcements.json');
    if (announcements.length > 0) {
      for (const a of announcements) {
        await connection.query(`
          INSERT INTO announcements (id, title, content, author, author_role, date, category, is_pinned)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE title = VALUES(title), content = VALUES(content), is_pinned = VALUES(is_pinned)
        `, [a.id, a.title, a.content, a.author, a.authorRole || 'SUPER_ADMIN', a.date, a.category || null, a.isPinned ? 1 : 0]);
      }
      console.log(`✓ Migrated ${announcements.length} announcements`);
    }

    // Audit Logs
    const auditLogs = readJsonFile('audit.json');
    if (auditLogs.length > 0) {
      for (const al of auditLogs) {
        await connection.query(`
          INSERT INTO audit_logs (id, action, target_entity, target_id, details, performed_by, role, timestamp, ip_address)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE details = VALUES(details)
        `, [
          al.id, al.action, al.targetType || al.targetEntity || 'System',
          al.targetId || '0', al.details || '', al.actorName || al.performedBy || 'System',
          al.actorRole || al.role || 'STAFF', al.timestamp, al.ipAddress || null
        ]);
      }
      console.log(`✓ Migrated ${auditLogs.length} audit logs`);
    }

    // Settings
    const settings = readJsonFile('settings.json', null);
    if (settings) {
      await connection.query(`
        INSERT INTO settings (id, settings_json)
        VALUES ('global_settings', ?)
        ON DUPLICATE KEY UPDATE settings_json = VALUES(settings_json)
      `, [JSON.stringify(settings)]);
      console.log('✓ Migrated application settings');
    }

    // Re-enable Foreign Key Checks
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('\n====================================================');
    console.log(' Migration & Database Sync Completed Successfully! ');
    console.log('====================================================');

  } catch (err) {
    console.error('\n✗ Migration Error:', err);
  } finally {
    if (connection) await connection.end();
  }
}

runMigration();
