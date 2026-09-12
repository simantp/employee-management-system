-- ====================================================================
-- HsCreations Sydney NSW Employee Management System (EMS)
-- Production MySQL Database Schema for cPanel Hosting
-- Charset: utf8mb4, Collation: utf8mb4_unicode_ci
-- ====================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- --------------------------------------------------------------------
-- 1. Table: users
-- Authentication, passwords, user roles & active sessions
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(64) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `role` ENUM('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'STAFF') NOT NULL DEFAULT 'STAFF',
  `password_hash` VARCHAR(255) NULL,
  `is_email_verified` TINYINT(1) NOT NULL DEFAULT 1,
  `staff_id` VARCHAR(64) NULL,
  `avatar_url` TEXT NULL,
  `created_at` VARCHAR(64) NULL,
  `created_timestamp` BIGINT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 2. Table: employees
-- Staff details, contacts, visa, driver licence, encrypted bank/TFN
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `employees` (
  `id` VARCHAR(64) NOT NULL,
  `employee_number` VARCHAR(32) NOT NULL,
  `first_name` VARCHAR(100) NOT NULL,
  `last_name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `mobile_phone` VARCHAR(32) NOT NULL,
  `address` VARCHAR(255) NULL,
  `suburb` VARCHAR(100) NULL,
  `state` VARCHAR(16) DEFAULT 'NSW',
  `postcode` VARCHAR(16) NULL,
  `start_date` VARCHAR(32) NULL,
  `department` VARCHAR(100) NULL,
  `job_title` VARCHAR(100) NOT NULL DEFAULT 'Staff Member',
  `work_location` VARCHAR(100) DEFAULT 'Sydney, NSW',
  `reports_to` VARCHAR(100) DEFAULT 'Operations Lead',
  `status` ENUM('Active', 'On Leave', 'Terminated', 'Probation', 'Archived') NOT NULL DEFAULT 'Active',
  `working_hours` DECIMAL(5,2) NOT NULL DEFAULT 38.00,
  `working_hours_confirmed` TINYINT(1) NOT NULL DEFAULT 1,
  `citizen_status` VARCHAR(64) DEFAULT 'Australian Citizen',
  `visa_type` VARCHAR(100) NULL,
  `visa_expiry_date` VARCHAR(32) NULL,
  `visa_status_confirmed` TINYINT(1) NOT NULL DEFAULT 1,
  `has_driver_license` TINYINT(1) NOT NULL DEFAULT 1,
  `license_country` VARCHAR(100) DEFAULT 'NSW (Australia)',
  `license_number` VARCHAR(64) NULL,
  `license_expiry_date` VARCHAR(32) NULL,
  `emergency_next_of_kin` VARCHAR(100) NULL,
  `emergency_relationship` VARCHAR(100) NULL,
  `emergency_mobile` VARCHAR(32) NULL,
  `bank_name` VARCHAR(100) NULL,
  `bank_branch` VARCHAR(100) NULL,
  `account_name` VARCHAR(100) NULL,
  `bsb_encrypted` TEXT NULL,
  `bsb_masked` VARCHAR(32) NULL,
  `account_number_encrypted` TEXT NULL,
  `account_number_masked` VARCHAR(32) NULL,
  `tfn_encrypted` TEXT NULL,
  `tfn_masked` VARCHAR(32) NULL,
  `super_fund_name` VARCHAR(100) NULL,
  `super_member_number` VARCHAR(64) NULL,
  `kiosk_pin` VARCHAR(16) NOT NULL DEFAULT '4829',
  `clock_state` ENUM('CLOCKED_IN', 'CLOCKED_OUT') NOT NULL DEFAULT 'CLOCKED_OUT',
  `last_clock_in` VARCHAR(64) NULL,
  `last_clock_out` VARCHAR(64) NULL,
  `clock_in_timestamp` BIGINT NULL,
  `current_shift_id` VARCHAR(64) NULL,
  `avatar_url` TEXT NULL,
  `annual_leave_balance` DECIMAL(6,2) NOT NULL DEFAULT 20.00,
  `sick_leave_balance` DECIMAL(6,2) NOT NULL DEFAULT 10.00,
  `carers_leave_balance` DECIMAL(6,2) NOT NULL DEFAULT 2.00,
  `long_service_balance` DECIMAL(6,2) NOT NULL DEFAULT 0.00,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_employees_number` (`employee_number`),
  UNIQUE KEY `uk_employees_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 3. Table: employee_documents
-- Uploaded files stored in /uploads/{staff_name}_{staff_id}/
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `employee_documents` (
  `id` VARCHAR(64) NOT NULL,
  `employee_id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `type` VARCHAR(100) NOT NULL,
  `document_number` VARCHAR(100) NULL,
  `expiry_date` VARCHAR(32) NULL,
  `upload_date` VARCHAR(32) NOT NULL,
  `status` ENUM('Verified', 'Pending', 'Rejected', 'Expired') NOT NULL DEFAULT 'Pending',
  `file_size` VARCHAR(32) NULL DEFAULT '1.8 MB',
  `file_type` VARCHAR(32) NULL DEFAULT 'image',
  `file_path` TEXT NULL,
  `preview_url` TEXT NULL,
  `rejection_reason` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_emp_doc_empid` (`employee_id`),
  CONSTRAINT `fk_docs_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 4. Table: timecards
-- Shift clock logs, times, duration, overtime & breaks
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `timecards` (
  `id` VARCHAR(64) NOT NULL,
  `employee_id` VARCHAR(64) NOT NULL,
  `employee_name` VARCHAR(191) NOT NULL,
  `employee_avatar` TEXT NULL,
  `department` VARCHAR(100) NOT NULL DEFAULT 'General Operations',
  `date` VARCHAR(32) NOT NULL,
  `clock_in` VARCHAR(32) NOT NULL,
  `clock_out` VARCHAR(32) NULL,
  `clock_in_timestamp` BIGINT NOT NULL,
  `clock_out_timestamp` BIGINT NULL,
  `duration_seconds` INT NOT NULL DEFAULT 0,
  `break_minutes` INT NOT NULL DEFAULT 0,
  `total_hours` DECIMAL(6,4) NOT NULL DEFAULT 0.0000,
  `overtime_hours` DECIMAL(6,4) NOT NULL DEFAULT 0.0000,
  `status` ENUM('CLOCKED_IN', 'COMPLETED', 'ON_LEAVE', 'MANUALLY_ADJUSTED') NOT NULL DEFAULT 'CLOCKED_IN',
  `notes` TEXT NULL,
  `admin_note` TEXT NULL,
  `staff_note` TEXT NULL,
  `staff_note_submitted_at` VARCHAR(64) NULL,
  `staff_note_status` VARCHAR(32) NULL,
  `adjusted_by` VARCHAR(100) NULL,
  `adjusted_at` VARCHAR(64) NULL,
  `clock_in_ip` VARCHAR(64) NULL,
  `clock_out_ip` VARCHAR(64) NULL,
  `clock_in_workstation` VARCHAR(100) NULL,
  `clock_out_workstation` VARCHAR(100) NULL,
  `ip_address` VARCHAR(64) NULL,
  `workstation_label` VARCHAR(100) NULL,
  `device_info` VARCHAR(255) NULL,
  `ip_status` VARCHAR(64) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_timecards_empid` (`employee_id`),
  KEY `idx_timecards_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 5. Table: leave_requests
-- Staff leave applications, approvals & attached medical certs
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `leave_requests` (
  `id` VARCHAR(64) NOT NULL,
  `employee_id` VARCHAR(64) NOT NULL,
  `employee_name` VARCHAR(191) NOT NULL,
  `employee_avatar` TEXT NULL,
  `department` VARCHAR(100) NOT NULL,
  `leave_type` VARCHAR(32) NOT NULL,
  `start_date` VARCHAR(32) NOT NULL,
  `end_date` VARCHAR(32) NOT NULL,
  `total_days` DECIMAL(5,2) NOT NULL DEFAULT 1.00,
  `reason` TEXT NOT NULL,
  `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
  `certificate_url` TEXT NULL,
  `certificate_uploaded` TINYINT(1) NOT NULL DEFAULT 0,
  `admin_notes` TEXT NULL,
  `submitted_at` VARCHAR(64) NOT NULL,
  `submitted_timestamp` BIGINT NULL,
  `is_advance_notice_met` TINYINT(1) NOT NULL DEFAULT 1,
  `advance_notice_days` INT NOT NULL DEFAULT 0,
  `reminder_count` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_leave_empid` (`employee_id`),
  KEY `idx_leave_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 6. Table: document_types
-- Compliance categories configured by Super Admin
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `document_types` (
  `id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `has_expiry` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 7. Table: announcements
-- Company broadcast bulletins
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `announcements` (
  `id` VARCHAR(64) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `content` TEXT NOT NULL,
  `author` VARCHAR(100) NOT NULL,
  `author_role` VARCHAR(64) NOT NULL DEFAULT 'SUPER_ADMIN',
  `date` VARCHAR(32) NOT NULL,
  `category` VARCHAR(100) NULL,
  `is_pinned` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 8. Table: audit_logs
-- Immutable Fair Work & security audit trail
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` VARCHAR(64) NOT NULL,
  `action` VARCHAR(64) NOT NULL,
  `target_entity` VARCHAR(64) NOT NULL,
  `target_id` VARCHAR(64) NOT NULL,
  `details` TEXT NOT NULL,
  `performed_by` VARCHAR(100) NOT NULL,
  `role` VARCHAR(64) NOT NULL DEFAULT 'STAFF',
  `timestamp` VARCHAR(64) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_audit_entity` (`target_entity`),
  KEY `idx_audit_action` (`action`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ====================================================================
-- SEED INITIAL AUSTRALIAN DATA
-- ====================================================================

-- Document Types
INSERT IGNORE INTO `document_types` (`id`, `name`, `category`, `has_expiry`) VALUES
('dt-1', 'Passport Copy (Australian / International)', 'Identification', 1),
('dt-2', 'Visa Grant Notice / VEVO Verification', 'Visa & Immigration', 1),
('dt-3', 'Driver\'s License (NSW / State)', 'Licenses', 1),
('dt-4', 'Tax File Number (TFN) Declaration', 'Tax & Compliance', 0),
('dt-5', 'Medical / Sick Leave Certificate', 'Medical', 0),
('dt-6', 'Forklift / White Card / RSA License', 'Workplace Licenses', 1),
('dt-7', 'Bank Statement / Direct Debit Proof', 'Payroll', 0),
('dt-8', 'Superannuation Choice Form', 'Payroll', 0),
('dt-9', 'Signed Employment Contract', 'HR Onboarding', 0);

-- Announcements
INSERT IGNORE INTO `announcements` (`id`, `title`, `content`, `author`, `author_role`, `date`, `category`, `is_pinned`) VALUES
('ann-1', 'Sydney Plant Annual Team Building & WHS Safety Workshop', 'All Sydney NSW staff members are invited to our annual safety presentation and company celebration lunch on Friday 28 August 2026. Shifts and production schedules will operate on modified hours.', 'Super Admin (HsCreations Executive)', 'SUPER_ADMIN', '20 Aug 2026', 'Operations & Safety', 1),
('ann-2', 'Fair Work Australia 2026/2027 Award & Pay Updates', 'The 2026 annual Fair Work Commission wage review adjustments have been fully integrated into the HsCreations payroll schedule. Review your employment specifications in My Profile.', 'Human Resources Director', 'ADMIN', '15 Aug 2026', 'Fair Work NSW', 0);

-- Initial Staff Members (with encrypted payroll hashes and compliance data)
INSERT IGNORE INTO `employees` (
  `id`, `employee_number`, `first_name`, `last_name`, `email`, `mobile_phone`,
  `address`, `suburb`, `state`, `postcode`, `start_date`, `department`, `job_title`,
  `work_location`, `reports_to`, `status`, `working_hours`, `working_hours_confirmed`,
  `citizen_status`, `visa_type`, `visa_expiry_date`, `visa_status_confirmed`,
  `has_driver_license`, `license_country`, `license_number`, `license_expiry_date`,
  `emergency_next_of_kin`, `emergency_relationship`, `emergency_mobile`,
  `bank_name`, `bank_branch`, `account_name`, `bsb_encrypted`, `bsb_masked`,
  `account_number_encrypted`, `account_number_masked`, `tfn_encrypted`, `tfn_masked`,
  `super_fund_name`, `super_member_number`, `kiosk_pin`, `clock_state`, `avatar_url`,
  `annual_leave_balance`, `sick_leave_balance`, `carers_leave_balance`, `long_service_balance`
) VALUES
(
  'emp-42', 'HSC-SYD-042', 'Suman', 'Thapa', 'suman@hscreations.com.au', '0412 345 678',
  '42 Railway Parade', 'Riverwood', 'NSW', '2210', '2022-03-15', 'Production (Riverwood)', 'Senior Production Technician',
  'Riverwood Facility', 'Operations Lead', 'Active', 38.00, 1,
  'Australian Citizen', NULL, NULL, 1,
  1, 'NSW (Australia)', 'NSW-9482910', '2027-11-20',
  'Maya Thapa', 'Spouse', '0423 456 789',
  'Commonwealth Bank of Australia', 'Sydney NSW', 'Suman Thapa', 'U2FsdGVkX1+v1/bsb062000', '062-•••',
  'U2FsdGVkX1+v1/acc10293847', '•••••847', 'U2FsdGVkX1+v1/tfn123456782', '•••-•••-782',
  'AustralianSuper', 'AUS-987654', '4829', 'CLOCKED_OUT',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  16.00, 8.00, 2.00, 0.00
),
(
  'emp-41', 'HSC-SYD-041', 'Anita', 'KC', 'anita@hscreations.com.au', '0421 987 654',
  '18 King Georges Road', 'Penshurst', 'NSW', '2222', '2023-01-10', 'Design', 'Lead Graphic Pre-Press Designer',
  'Sydney HQ & Rockdale', 'Creative Director', 'Active', 38.00, 1,
  'Temporary Resident / Visa', 'Subclass 482 (Temporary Skill Shortage)', '2026-11-30', 1,
  1, 'NSW (Australia)', 'NSW-8831920', '2028-02-14',
  'Bikash KC', 'Brother', '0433 111 222',
  'Westpac Banking Corporation', 'Hurstville NSW', 'Anita KC', 'U2FsdGVkX1+v1/bsb032000', '032-•••',
  'U2FsdGVkX1+v1/acc99482710', '•••••710', 'U2FsdGVkX1+v1/tfn987654321', '•••-•••-321',
  'Hostplus Super', 'HOST-449120', '1234', 'CLOCKED_OUT',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
  18.50, 10.00, 2.00, 0.00
),
(
  'emp-40', 'HSC-SYD-040', 'Ramesh', 'Sharma', 'ramesh@hscreations.com.au', '0432 555 888',
  '55 Forest Road', 'Hurstville', 'NSW', '2220', '2021-08-01', 'Production (Rockdale)', 'Plant Shift Supervisor',
  'Rockdale Facility', 'Operations Manager', 'Active', 38.00, 1,
  'Permanent Resident', NULL, NULL, 1,
  1, 'NSW (Australia)', 'NSW-7749102', '2026-09-30',
  'Sunita Sharma', 'Spouse', '0411 999 888',
  'ANZ Bank', 'Rockdale NSW', 'Ramesh Sharma', 'U2FsdGVkX1+v1/bsb012000', '012-•••',
  'U2FsdGVkX1+v1/acc44918230', '•••••230', 'U2FsdGVkX1+v1/tfn554433221', '•••-•••-221',
  'REST Super', 'REST-881920', '5678', 'CLOCKED_OUT',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
  12.00, 6.00, 1.00, 0.00
),
(
  'emp-38', 'HSC-SYD-038', 'Birendra', 'Bhandari', 'birendra@hscreations.com.au', '0400 123 456',
  '12 Princes Highway', 'Rockdale', 'NSW', '2216', '2023-06-01', 'Production (Rockdale)', 'Machine Operator & Finishing',
  'Rockdale Facility', 'Ramesh Sharma', 'Active', 38.00, 1,
  'Temporary Resident / Visa', 'Subclass 500 (Student Visa - 48h Fortnight)', '2026-10-15', 1,
  1, 'NSW (Australia)', 'NSW-4491023', '2027-04-10',
  'Kiran Bhandari', 'Cousin', '0455 666 777',
  'National Australia Bank (NAB)', 'Rockdale NSW', 'Birendra Bhandari', 'U2FsdGVkX1+v1/bsb082000', '082-•••',
  'U2FsdGVkX1+v1/acc11928374', '•••••374', 'U2FsdGVkX1+v1/tfn778899001', '•••-•••-001',
  'AustralianSuper', 'AUS-554433', '9988', 'CLOCKED_OUT',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
  14.00, 7.00, 2.00, 0.00
);

-- Seed Initial Compliance Documents for Suman Thapa (emp-42)
INSERT IGNORE INTO `employee_documents` (
  `id`, `employee_id`, `name`, `type`, `document_number`, `expiry_date`,
  `upload_date`, `status`, `file_size`, `file_type`, `file_path`, `preview_url`
) VALUES
(
  'doc-42-1', 'emp-42', 'Australian Passport', 'Passport Copy (Australian / International)', 'PA-8849201', '2034-05-14',
  '15/01/2026', 'Verified', '2.4 MB', 'image',
  '/uploads/suman_thapa_emp-42/passport_copy.png',
  'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80'
),
(
  'doc-42-2', 'emp-42', 'NSW Driver Licence', 'Driver\'s License (NSW / State)', 'NSW-9482910', '2027-11-20',
  '15/01/2026', 'Verified', '1.8 MB', 'image',
  '/uploads/suman_thapa_emp-42/driver_licence.png',
  'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80'
),
(
  'doc-42-3', 'emp-42', 'Forklift High Risk Work Licence', 'Forklift / White Card / RSA License', 'HRW-LF-44910', '2028-09-15',
  '20/02/2026', 'Verified', '1.6 MB', 'image',
  '/uploads/suman_thapa_emp-42/forklift_licence.png',
  'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=600&auto=format&fit=crop&q=80'
);

-- Seed Initial Users (Super Admin & Staff)
INSERT IGNORE INTO `users` (`id`, `email`, `name`, `role`, `is_email_verified`, `staff_id`, `avatar_url`, `created_at`) VALUES
('usr-superadmin', 'admin@hscreations.com.au', 'Super Admin (HsCreations Executive)', 'SUPER_ADMIN', 1, 'emp-42', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150', '01/01/2024'),
('usr-hrlead', 'hr@hscreations.com.au', 'HR Operations Lead', 'HR_MANAGER', 1, 'emp-41', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150', '01/02/2024'),
('usr-suman', 'suman@hscreations.com.au', 'Suman Thapa', 'STAFF', 1, 'emp-42', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', '15/03/2022');
