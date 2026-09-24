import { NextResponse } from 'next/server';
import { query, getIsDbConfigured, testConnection, getPool, ensureDatabaseSchema } from '@/lib/db';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const isConfigured = getIsDbConfigured();
  const conn = await testConnection();

  return NextResponse.json({
    success: conn.success,
    configured: isConfigured,
    message: conn.message,
    details: conn.details,
    error: conn.error,
  });
}

export async function POST() {
  const isConfigured = getIsDbConfigured();
  if (!isConfigured) {
    return NextResponse.json({
      success: false,
      message: 'Database is not configured. Please define DB_USER and DB_NAME (or MYSQL_USER / MYSQL_DATABASE) in Hostinger environment variables.',
    }, { status: 400 });
  }

  const pool = getPool();
  if (!pool) {
    return NextResponse.json({
      success: false,
      message: 'Failed to create database connection pool. Please verify host and credentials in Hostinger.',
    }, { status: 500 });
  }

  try {
    const schemaPath = path.join(process.cwd(), 'database', 'schema.sql');
    if (!fs.existsSync(schemaPath)) {
      return NextResponse.json({
        success: false,
        message: 'database/schema.sql file not found on server.',
      }, { status: 404 });
    }

    const sqlContent = await fs.promises.readFile(schemaPath, 'utf8');

    // Split SQL into individual statements
    const statements = sqlContent
      .replace(/--.*$/gm, '') // Remove comments
      .split(';')
      .map(st => st.trim())
      .filter(st => st.length > 0);

    let executed = 0;
    const warnings: string[] = [];

    for (const statement of statements) {
      try {
        await query(statement);
        executed++;
      } catch (err: any) {
        warnings.push(`Notice: ${err.message}`);
      }
    }

    // Force schema column checks
    await ensureDatabaseSchema(pool);

    const [tableRows] = await pool.query<any[]>('SHOW TABLES');
    const tableNames = Array.isArray(tableRows)
      ? tableRows.map(r => Object.values(r)[0] as string)
      : [];

    return NextResponse.json({
      success: true,
      message: `Database schema and seed data successfully initialized (${executed} queries executed). Found ${tableNames.length} tables.`,
      tablesCount: tableNames.length,
      tables: tableNames,
      warnings: warnings.slice(0, 5),
    });
  } catch (err: any) {
    console.error('Database migration error:', err);
    return NextResponse.json({
      success: false,
      message: `Migration Failed: ${err.message}`,
    }, { status: 500 });
  }
}
