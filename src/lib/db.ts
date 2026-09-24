import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { getAllEnvironmentVariables, getEnvVar } from './smtpConfig';

// Global singleton pool pattern for Next.js to avoid connection exhaustion in dev mode
declare global {
  // eslint-disable-next-line no-var
  var _mysqlPool: mysql.Pool | undefined;
  // eslint-disable-next-line no-var
  var _dbSchemaChecked: boolean | undefined;
}

export interface DbConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  source: string;
}

/**
 * Resolves database credentials with support for:
 * 1. DATABASE_URL / MYSQL_URL connection strings
 * 2. Standard aliases across Hostinger, cPanel, Docker, AWS, and Next.js
 * 3. Automatic localhost -> 127.0.0.1 conversion for Linux socket compatibility
 */
export function getDbConfig(): DbConfig {
  const env = getAllEnvironmentVariables();

  let host = '';
  let port = 3306;
  let user = '';
  let password = '';
  let database = '';
  let source = 'ENV_VARS';

  // 1. Check for connection string URI (DATABASE_URL, MYSQL_URL, etc.)
  const dbUrl = getEnvVar(env, 'DATABASE_URL', 'MYSQL_URL', 'JAWSDB_URL', 'CLEARDB_DATABASE_URL');
  if (dbUrl && (dbUrl.startsWith('mysql://') || dbUrl.startsWith('mysql2://'))) {
    try {
      const parsed = new URL(dbUrl.replace(/^mysql2:\/\//, 'mysql://'));
      host = parsed.hostname;
      port = parsed.port ? parseInt(parsed.port, 10) : 3306;
      user = decodeURIComponent(parsed.username || '');
      password = decodeURIComponent(parsed.password || '');
      database = decodeURIComponent(parsed.pathname.replace(/^\//, '') || '');
      source = 'DATABASE_URL';
    } catch (e) {
      console.warn('Could not parse database URL connection string:', e);
    }
  }

  // 2. Fallback to individual variables if not provided via URL
  if (!host) {
    host = getEnvVar(env, 'DB_HOST', 'DATABASE_HOST', 'MYSQL_HOST', 'MYSQLHOST', 'HOST') || '127.0.0.1';
  }
  if (!user) {
    user = getEnvVar(env, 'DB_USER', 'DATABASE_USER', 'MYSQL_USER', 'MYSQLUSER', 'DB_USERNAME', 'MYSQL_USERNAME');
  }
  if (!password) {
    password = getEnvVar(env, 'DB_PASSWORD', 'DATABASE_PASSWORD', 'MYSQL_PASSWORD', 'MYSQLPASSWORD', 'DB_PASS', 'MYSQL_PWD');
  }
  if (!database) {
    database = getEnvVar(env, 'DB_NAME', 'DATABASE_NAME', 'MYSQL_DATABASE', 'MYSQLDATABASE', 'DB_DATABASE');
  }
  const rawPort = getEnvVar(env, 'DB_PORT', 'DATABASE_PORT', 'MYSQL_PORT', 'MYSQLPORT');
  if (rawPort) {
    const p = parseInt(rawPort.trim(), 10);
    if (!isNaN(p) && p > 0) port = p;
  }

  host = host.trim();
  user = user.trim();
  password = password.trim();
  database = database.trim();

  // 3. CRITICAL LINUX SOCKET FIX FOR HOSTINGER:
  // On Linux/Hostinger containers, 'localhost' causes mysql2 to try connecting via Unix socket (/var/run/mysqld/mysqld.sock).
  // Hostinger MySQL services listen on TCP 127.0.0.1:3306. Converting 'localhost' to '127.0.0.1' forces TCP connection.
  if (host.toLowerCase() === 'localhost') {
    host = '127.0.0.1';
  }

  return { host, port, user, password, database, source };
}

/**
 * Dynamic check: returns true if database username and database name are configured
 */
export function getIsDbConfigured(): boolean {
  const cfg = getDbConfig();
  return Boolean(cfg.user && cfg.database);
}

// Live export binding for backward compatibility across all existing API routes
export let isDbConfigured: boolean = getIsDbConfigured();

/**
 * Ensures essential database tables and columns exist in MySQL.
 * Runs once upon startup or first query.
 */
export async function ensureDatabaseSchema(pool: mysql.Pool): Promise<void> {
  if (global._dbSchemaChecked) return;

  try {
    // 1. Check if the employees table exists
    const [tables] = await pool.query<any[]>("SHOW TABLES LIKE 'employees'");
    const employeesExists = Array.isArray(tables) && tables.length > 0;

    if (!employeesExists) {
      console.log('[MySQL] Core tables not found. Automatically initializing schema from database/schema.sql...');
      const schemaPath = path.join(process.cwd(), 'database', 'schema.sql');
      if (fs.existsSync(schemaPath)) {
        const sqlContent = await fs.promises.readFile(schemaPath, 'utf8');
        const statements = sqlContent
          .replace(/--.*$/gm, '')
          .split(';')
          .map(st => st.trim())
          .filter(st => st.length > 0);

        for (const statement of statements) {
          try {
            await pool.query(statement);
          } catch (err: any) {
            console.warn('[MySQL Schema Init] Statement warning:', err.message);
          }
        }
        console.log(`[MySQL] Initialized schema successfully (${statements.length} queries).`);
      }
    } else {
      // 2. Employees table exists: verify that critical columns are present
      const [colRows] = await pool.query<any[]>('SHOW COLUMNS FROM employees');
      const existingCols = new Set((colRows as any[]).map(c => c.Field.toLowerCase()));

      const columnsToAdd = [
        { name: 'username', def: 'VARCHAR(100) NULL' },
        { name: 'onboarding_status', def: "VARCHAR(32) NOT NULL DEFAULT 'INVITED'" },
        { name: 'invite_token', def: 'VARCHAR(128) NULL' },
        { name: 'invite_sent_at', def: 'VARCHAR(64) NULL' },
        { name: 'invite_expires_at', def: 'VARCHAR(64) NULL' },
        { name: 'password_set_at', def: 'VARCHAR(64) NULL' },
        { name: 'profile_completed_at', def: 'VARCHAR(64) NULL' },
        { name: 'date_of_birth', def: 'VARCHAR(32) NULL' },
        { name: 'gender', def: "VARCHAR(32) DEFAULT 'Prefer not to say'" },
        { name: 'home_phone', def: 'VARCHAR(32) NULL' },
        { name: 'emergency_home_phone', def: 'VARCHAR(32) NULL' },
        { name: 'account_number', def: 'VARCHAR(64) NULL' },
        { name: 'emergency_address', def: 'VARCHAR(255) NULL' },
        { name: 'emergency_suburb', def: 'VARCHAR(100) NULL' },
        { name: 'emergency_state', def: "VARCHAR(16) DEFAULT 'NSW'" },
        { name: 'emergency_postcode', def: 'VARCHAR(16) NULL' },
      ];

      for (const col of columnsToAdd) {
        if (!existingCols.has(col.name.toLowerCase())) {
          try {
            await pool.query(`ALTER TABLE employees ADD COLUMN ${col.name} ${col.def}`);
            console.log(`[MySQL Migration] Added missing column: employees.${col.name}`);
          } catch (e: any) {
            console.warn(`[MySQL Migration] Failed to add column employees.${col.name}:`, e.message);
          }
        }
      }

      // Check users table for username column
      try {
        const [userCols] = await pool.query<any[]>('SHOW COLUMNS FROM users');
        const userColsSet = new Set((userCols as any[]).map(c => c.Field.toLowerCase()));
        if (!userColsSet.has('username')) {
          await pool.query('ALTER TABLE users ADD COLUMN username VARCHAR(100) NULL');
          console.log('[MySQL Migration] Added missing column: users.username');
        }
      } catch (e: any) {}

      // Check if notifications table exists
      try {
        const [notifTables] = await pool.query<any[]>("SHOW TABLES LIKE 'notifications'");
        if (!Array.isArray(notifTables) || notifTables.length === 0) {
          await pool.query(`
            CREATE TABLE IF NOT EXISTS \`notifications\` (
              \`id\` VARCHAR(64) NOT NULL,
              \`recipient\` VARCHAR(32) NOT NULL DEFAULT 'STAFF',
              \`recipient_id\` VARCHAR(64) NULL,
              \`title\` VARCHAR(191) NOT NULL,
              \`message\` TEXT NOT NULL,
              \`type\` VARCHAR(32) NOT NULL DEFAULT 'GENERAL',
              \`timestamp\` VARCHAR(64) NOT NULL,
              \`read_status\` TINYINT(1) NOT NULL DEFAULT 0,
              \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
          `);
          console.log('[MySQL Migration] Created notifications table');
        }
      } catch (e: any) {}
    }

    global._dbSchemaChecked = true;
  } catch (err: any) {
    console.error('[MySQL Schema Check] Error during schema verification:', err.message);
  }
}

/**
 * Returns singleton MySQL connection pool
 */
export function getPool(): mysql.Pool | null {
  isDbConfigured = getIsDbConfigured();
  if (!isDbConfigured) {
    return null;
  }

  const cfg = getDbConfig();

  if (!global._mysqlPool) {
    try {
      const isLocal = ['127.0.0.1', 'localhost'].includes(cfg.host.toLowerCase());
      const isCloudProvider = !isLocal ||
        cfg.host.includes('aivencloud.com') ||
        cfg.host.includes('rds.amazonaws.com') ||
        cfg.host.includes('digitalocean.com') ||
        cfg.host.includes('planetscale') ||
        cfg.host.includes('tidbcloud.com') ||
        cfg.host.includes('cleardb') ||
        process.env.MYSQL_SSL === 'true' ||
        process.env.DB_SSL === 'true';

      const sslConfig = isCloudProvider ? { rejectUnauthorized: false } : undefined;

      global._mysqlPool = mysql.createPool({
        host: cfg.host,
        port: cfg.port,
        user: cfg.user,
        password: cfg.password,
        database: cfg.database,
        ssl: sslConfig,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 10000,
        charset: 'utf8mb4',
        connectTimeout: 15000,
      });

      // Trigger asynchronous background schema verification
      ensureDatabaseSchema(global._mysqlPool).catch(e => {
        console.warn('Background database schema verification notice:', e.message);
      });
    } catch (err: any) {
      console.error('[MySQL] Failed to create connection pool:', err.message);
      return null;
    }
  }

  return global._mysqlPool;
}

/**
 * Execute parameterized query safely against MySQL database
 */
export async function query<T = any>(sql: string, params: any[] = []): Promise<T> {
  const pool = getPool();
  if (!pool) {
    throw new Error('MySQL Database is not configured. Please define DB_USER and DB_NAME (or MYSQL_USER / MYSQL_DATABASE) in Hostinger environment variables.');
  }

  try {
    const [results] = await pool.query(sql, params);
    return results as T;
  } catch (error: any) {
    // If the error is table missing (errno 1146), attempt auto-migration and retry once
    if (error.errno === 1146 || error.code === 'ER_NO_SUCH_TABLE') {
      console.warn('[MySQL] Table missing detected during query. Attempting schema migration...');
      global._dbSchemaChecked = false;
      await ensureDatabaseSchema(pool);
      const [retryResults] = await pool.query(sql, params);
      return retryResults as T;
    }

    console.error('MySQL Query Error:', { sql: sql.slice(0, 100), error: error.message });
    throw error;
  }
}

/**
 * Test database connection and return detailed diagnostic status
 */
export async function testConnection(): Promise<{
  success: boolean;
  configured: boolean;
  message: string;
  details?: {
    host: string;
    port: number;
    user: string;
    database: string;
    passwordLength: number;
    source: string;
    tablesCount?: number;
    tables?: string[];
  };
  error?: string;
}> {
  const cfg = getDbConfig();
  const configured = Boolean(cfg.user && cfg.database);

  if (!configured) {
    return {
      success: false,
      configured: false,
      message: 'Database credentials not detected. Please configure DB_HOST, DB_USER, DB_PASSWORD, and DB_NAME in Hostinger environment variables.',
      details: {
        host: cfg.host,
        port: cfg.port,
        user: cfg.user,
        database: cfg.database,
        passwordLength: cfg.password ? cfg.password.length : 0,
        source: cfg.source,
      },
    };
  }

  try {
    const pool = getPool();
    if (!pool) {
      return {
        success: false,
        configured: true,
        message: 'Could not create MySQL connection pool.',
        details: {
          host: cfg.host,
          port: cfg.port,
          user: cfg.user,
          database: cfg.database,
          passwordLength: cfg.password ? cfg.password.length : 0,
          source: cfg.source,
        },
      };
    }

    const connection = await pool.getConnection();
    await connection.ping();

    // Query tables
    const [tableRows] = await connection.query<any[]>('SHOW TABLES');
    connection.release();

    const tableNames = Array.isArray(tableRows)
      ? tableRows.map(r => Object.values(r)[0] as string)
      : [];

    return {
      success: true,
      configured: true,
      message: `Connected to MySQL successfully. Found ${tableNames.length} tables in database '${cfg.database}'.`,
      details: {
        host: cfg.host,
        port: cfg.port,
        user: cfg.user,
        database: cfg.database,
        passwordLength: cfg.password.length,
        source: cfg.source,
        tablesCount: tableNames.length,
        tables: tableNames,
      },
    };
  } catch (err: any) {
    let friendly = err.message || 'Unknown MySQL connection error';
    const isLocal = ['127.0.0.1', 'localhost'].includes(cfg.host.toLowerCase());

    if (err.code === 'ENOTFOUND') {
      friendly = `DNS lookup failed for host '${cfg.host}' (ENOTFOUND). The hostname does not exist in DNS. If using Aiven Cloud: 1) Verify the exact 'Host' copied from the Aiven Console Overview tab; 2) Ensure the Aiven service status is 'Running' (new services take 2-3 minutes to become ready).`;
    } else if (err.code === 'ECONNREFUSED') {
      if (cfg.host.includes('aivencloud.com')) {
        friendly = `Connection refused at ${cfg.host}:${cfg.port} (ECONNREFUSED). 1) In Aiven Console, ensure your MySQL service state is 'Running' (not stopped/rebuilding); 2) Check 'IP Filter' (Allowed IP addresses) in Aiven Service Settings and ensure 0.0.0.0/0 is allowed so Hostinger can reach it; 3) Verify port is set to ${cfg.port}.`;
      } else if (isLocal) {
        friendly = `Connection refused at ${cfg.host}:${cfg.port}. Please verify that local MySQL is running on port 3306.`;
      } else {
        friendly = `Connection refused at ${cfg.host}:${cfg.port}. The server actively rejected the connection. Check that the port is correct and any IP firewall allows connections.`;
      }
    } else if (err.code === 'ETIMEDOUT') {
      friendly = `Connection timed out to ${cfg.host}:${cfg.port}. The server did not respond. Check firewall and IP whitelist settings on your database provider.`;
    } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      friendly = `Access denied for user '${cfg.user}'@'${cfg.host}'. Please double-check your database username and password in Hostinger environment variables.`;
    } else if (err.code === 'ER_BAD_DB_ERROR') {
      friendly = `Database '${cfg.database}' does not exist on MySQL server. In Aiven, the default database is usually 'defaultdb'.`;
    } else if (err.message && (err.message.includes('SSL') || err.message.includes('handshake'))) {
      friendly = `SSL/TLS Handshake error with ${cfg.host}: ${err.message}. Managed Cloud MySQL requires SSL (automatically enabled).`;
    }

    return {
      success: false,
      configured: true,
      message: friendly,
      error: err.code || err.message,
      details: {
        host: cfg.host,
        port: cfg.port,
        user: cfg.user,
        database: cfg.database,
        passwordLength: cfg.password ? cfg.password.length : 0,
        source: cfg.source,
      },
    };
  }
}
