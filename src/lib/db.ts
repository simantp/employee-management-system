import mysql from 'mysql2/promise';

// Global singleton pool pattern for Next.js to avoid connection exhaustion in dev mode
declare global {
  // eslint-disable-next-line no-var
  var _mysqlPool: mysql.Pool | undefined;
}

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = parseInt(process.env.DB_PORT || '3306', 10);
const DB_USER = process.env.DB_USER || '';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || '';

export const isDbConfigured = Boolean(DB_USER && DB_NAME);

export function getPool(): mysql.Pool | null {
  if (!isDbConfigured) {
    return null;
  }

  if (!global._mysqlPool) {
    global._mysqlPool = mysql.createPool({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
      charset: 'utf8mb4',
    });
  }

  return global._mysqlPool;
}

/**
 * Execute parameterized query safely against MySQL database
 */
export async function query<T = any>(sql: string, params: any[] = []): Promise<T> {
  const pool = getPool();
  if (!pool) {
    throw new Error('MySQL Database is not configured. Please define DB_USER and DB_NAME in environment variables.');
  }

  try {
    const [results] = await pool.query(sql, params);
    return results as T;
  } catch (error: any) {
    console.error('MySQL Query Error:', { sql, params, error: error.message });
    throw error;
  }
}

/**
 * Test database connection
 */
export async function testConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const pool = getPool();
    if (!pool) {
      return { success: false, message: 'Database credentials not provided in environment.' };
    }
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    return { success: true, message: 'Connected to MySQL successfully.' };
  } catch (err: any) {
    return { success: false, message: `MySQL Connection Failed: ${err.message}` };
  }
}
