# HsCreations Sydney Employee Management System (EMS)
## Complete cPanel Hosting & MySQL Database Deployment Guide

This guide provides step-by-step instructions for deploying the EMS application on a **cPanel shared or VPS hosting environment** (CloudLinux / Phusion Passenger / Node.js Selector) with a **MySQL database** and server-side document storage in `public/uploads/`.

---

## Architecture Overview

1. **Backend Database**: MySQL 8.0+ / MariaDB 10.4+
2. **Database Driver**: `mysql2` pure JavaScript client with connection pooling and parameterized queries (zero native C++ build requirements).
3. **Physical File Storage**:
   - Location: `public/uploads/{staff_name}_{employee_id}/` (e.g. `public/uploads/suman_thapa_emp-42/passport_copy.png`).
   - Served directly as static files or through Next.js static asset routing.
4. **Data Synchronization**:
   - Dynamic REST API endpoints (`/api/employees`, `/api/documents`, `/api/timecards`, `/api/leave`, `/api/announcements`, `/api/document-types`, `/api/audit`).
   - Graceful offline fallback: If MySQL is not reachable, the system seamlessly uses client-side state and localStorage.

---

## Step 1: Create the MySQL Database in cPanel

1. Log in to your **cPanel Dashboard**.
2. Navigate to **Databases** -> **MySQL Database Wizard**.
3. **Step 1 - Create A Database**:
   - Name: `emsdb` (full name will look like `yourcpaneluser_emsdb`). Click *Next Step*.
4. **Step 2 - Create Database Users**:
   - Username: `emsadmin` (full name `yourcpaneluser_emsadmin`).
   - Password: Use the Password Generator to generate a strong password (save this safely). Click *Create User*.
5. **Step 3 - Add User to the Database**:
   - Check **ALL PRIVILEGES** (SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, ALTER, INDEX, etc.).
   - Click *Make Changes*.

---

## Step 2: Import the Database Schema & Seed Data

1. In cPanel, navigate to **Databases** -> **phpMyAdmin**.
2. In the left sidebar, click on your newly created database (`yourcpaneluser_emsdb`).
3. Click the **Import** tab in the top navigation.
4. Under **File to import**, click *Choose File* and select:
   ```
   database/schema.sql
   ```
5. Leave the format as **SQL** and click **Import** (or **Go**).
6. Verify that the 8 tables are created:
   - `users`
   - `employees`
   - `employee_documents`
   - `timecards`
   - `leave_requests`
   - `document_types`
   - `announcements`
   - `audit_logs`

---

## Step 3: Setup Node.js Application in cPanel

1. In cPanel, navigate to **Software** -> **Setup Node.js App** (CloudLinux Node.js Selector).
2. Click **Create Application**.
3. Configure the fields:
   - **Node.js version**: Select **18.x** or **20.x** (recommended).
   - **Application mode**: `Production`
   - **Application root**: `ems` or `public_html/ems` (the folder where your project files will live).
   - **Application URL**: `ems.yourdomain.com.au` or `yourdomain.com.au`.
   - **Application startup file**: `server.js` (or leave default if using Next.js custom server).
4. Click **Create**.
5. Once created, cPanel will display a command to enter the virtual environment at the top (e.g., `source /home/user/nodevenv/ems/20/bin/activate && cd /home/user/ems`). Copy this for terminal use.

---

## Step 4: Upload Application Files

You can upload files via **cPanel File Manager** or **Git Version Control**:

### Option A: Via cPanel File Manager / ZIP
1. On your local machine, run the production build or zip the project (excluding `node_modules` and `.next` cache).
2. In cPanel File Manager, upload the ZIP into the Application Root directory and extract it.
3. Make sure the folder structure contains:
   ```
   ├── database/
   ├── public/
   │   └── uploads/
   ├── src/
   ├── package.json
   ├── next.config.ts
   ├── tsconfig.json
   └── .env
   ```

### Option B: Via SSH Terminal / Git
1. Open cPanel **Terminal** (or connect via SSH).
2. Run the virtual environment command:
   ```bash
   source /home/youruser/nodevenv/ems/20/bin/activate && cd /home/youruser/ems
   ```
3. Install project dependencies:
   ```bash
   npm install --production=false
   ```
4. Build the Next.js application:
   ```bash
   npm run build
   ```

---

## Step 5: Configure Environment Variables

Create a file named `.env` in the root of your application (`/home/youruser/ems/.env`) with the following values:

```env
# MySQL Database Credentials
DB_HOST=localhost
DB_PORT=3306
DB_USER=yourcpaneluser_emsadmin
DB_PASSWORD=YourStrongDatabasePassword123!
DB_NAME=yourcpaneluser_emsdb

# Live Application URL
NEXT_PUBLIC_APP_URL=https://ems.yourdomain.com.au

# SMTP Email for OTP verification & Admin alerts
SMTP_HOST=mail.yourdomain.com.au
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=notifications@yourdomain.com.au
SMTP_PASSWORD=YourEmailPassword123!
SMTP_FROM="HsCreations EMS" <notifications@yourdomain.com.au>
ADMIN_NOTIFICATION_EMAIL=admin@yourdomain.com.au

NODE_ENV=production
PORT=3000
```

> **Note**: You can also add these environment variables directly inside the cPanel **Setup Node.js App** UI under the *Environment Variables* section.

---

## Step 6: Configure Uploads Folder Permissions

To allow staff compliance documents and licenses to be written to disk:
1. In cPanel File Manager, ensure the folder `public/uploads` exists.
2. Set permissions for `public/uploads` to **`0755`** (or `0775` depending on server security configuration).
3. The application will automatically create subfolders named:
   ```
   public/uploads/{sanitized_staff_name}_{employee_id}/
   ```
   when documents are uploaded by staff or administrators.

---

## Step 7: Automatic Database Migration Test

Once the application is running, you can test the database connection and auto-run the schema migration by visiting:
```
https://ems.yourdomain.com.au/api/setup-db
```
This endpoint will test MySQL connectivity and verify all tables and pre-seeded records.

---

## Step 8: Restart Application & Verify

1. In cPanel **Setup Node.js App**, click **Restart** on your application.
2. Open your website: `https://ems.yourdomain.com.au`.
3. Sign In with the pre-seeded admin credentials:
   - **Admin Email**: `admin@company.com.au` or `admin@hscreations.com.au`
   - **Default Staff**: `suman.thapa@company.com` (PIN: `4829`)
4. Verify:
   - Staff directory loads from MySQL.
   - Uploading a document creates a folder in `public/uploads/` and adds a row to `employee_documents`.
   - Timecards and Clock-In shifts persist to MySQL table `timecards`.
   - Leave requests and approvals update `leave_requests` and staff leave balances in `employees`.

---

## Summary of REST APIs

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/setup-db` | GET / POST | Tests DB connection & executes `schema.sql` migration |
| `/api/employees` | GET, POST, PUT, DELETE | Full CRUD on employee directory & joined documents |
| `/api/documents/upload` | POST | Writes binary file to `/uploads/{staff}/` & stores DB record |
| `/api/documents` | PUT, DELETE | Updates verification status / Deletes file from disk and DB |
| `/api/timecards` | GET, POST, PUT, DELETE | Clock-in/out shifts, manual admin adjustments |
| `/api/leave` | GET, POST, PUT | Leave applications, medical certs, HR approvals |
| `/api/announcements` | GET, POST, DELETE | Company bulletin broadcasts |
| `/api/document-types` | GET, POST, DELETE | Compliance document types and categories |
| `/api/audit` | GET, POST | Immutable audit trail records |
