import { NextResponse } from 'next/server';
import { query, isDbConfigured, testConnection } from '@/lib/db';
import fs from 'fs';
import path from 'path';

export async function GET() {
  if (!isDbConfigured) {
    return NextResponse.json({
      success: false,
      configured: false,
      message: 'Database environment variables (DB_USER, DB_NAME) are not configured.',
    });
  }

  const conn = await testConnection();
  if (!conn.success) {
    return NextResponse.json({
      success: false,
      configured: true,
      message: conn.message,
    });
  }

  try {
    const tables = await query<{ Tables_in_db?: string }[]>('SHOW TABLES');
    return NextResponse.json({
      success: true,
      configured: true,
      tablesCount: tables.length,
      message: `Database connected successfully with ${tables.length} tables found.`,
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      message: err.message,
    }, { status: 500 });
  }
}

export async function POST() {
  if (!isDbConfigured) {
    return NextResponse.json({
      success: false,
      message: 'Database is not configured. Please define DB_USER and DB_NAME in .env.local',
    }, { status: 400 });
  }

  try {
    const schemaPath = path.join(process.cwd(), 'database', 'schema.sql');
    if (!fs.existsSync(schemaPath)) {
      return NextResponse.json({
        success: false,
        message: 'database/schema.sql file not found.',
      }, { status: 404 });
    }

    const sqlContent = await fs.promises.readFile(schemaPath, 'utf8');

    // Split SQL into individual statements
    const statements = sqlContent
      .replace(/--.*$/gm, '') // Remove comments
      .split(';')
      .map(st => st.trim())
      .filter(st => st.length > 0);

    for (const statement of statements) {
      await query(statement);
    }

    return NextResponse.json({
      success: true,
      message: `Database schema and seed data successfully initialized (${statements.length} queries executed).`,
    });
  } catch (err: any) {
    console.error('Database migration error:', err);
    return NextResponse.json({
      success: false,
      message: `Migration Failed: ${err.message}`,
    }, { status: 500 });
  }
}
