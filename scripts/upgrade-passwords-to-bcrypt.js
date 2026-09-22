const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

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

const BCRYPT_ROUNDS = 12;

function isBcrypt(str) {
  if (!str || typeof str !== 'string') return false;
  return /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(str.trim());
}

async function run() {
  console.log('=== Enterprise Password Hardening & Bcrypt Migration ===\n');

  // 1. Upgrade data/users.json
  const usersJsonPath = path.join(__dirname, '..', 'data', 'users.json');
  let usersData = [];
  if (fs.existsSync(usersJsonPath)) {
    try {
      usersData = JSON.parse(fs.readFileSync(usersJsonPath, 'utf8'));
      let modified = false;

      for (const u of usersData) {
        if (u.password && !isBcrypt(u.password)) {
          const plain = u.password;
          const hashed = bcrypt.hashSync(plain, BCRYPT_ROUNDS);
          u.passwordHash = hashed;
          delete u.password;
          modified = true;
          console.log(`[JSON] Upgraded password for ${u.email} -> bcrypt ($2a$12$...)`);
        } else if (u.password && isBcrypt(u.password)) {
          u.passwordHash = u.password;
          delete u.password;
          modified = true;
        }
      }

      if (modified) {
        fs.writeFileSync(usersJsonPath, JSON.stringify(usersData, null, 2), 'utf8');
        console.log('✓ Successfully sanitized and hashed data/users.json (zero plaintext passwords)\n');
      } else {
        console.log('✓ data/users.json is already sanitized with bcrypt\n');
      }
    } catch (err) {
      console.error('Error upgrading data/users.json:', err.message);
    }
  }

  // 2. Upgrade MySQL hscreations_ems database
  try {
    const connection = await mysql.createConnection({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
    });

    console.log(`Connected to MySQL database "${DB_NAME}"`);

    const [rows] = await connection.query('SELECT id, email, name, password, password_hash FROM users');
    console.log(`Found ${rows.length} user records in MySQL database.`);

    let updatedCount = 0;
    for (const row of rows) {
      let hash = row.password_hash;
      const plain = row.password;

      if (!hash && plain) {
        hash = isBcrypt(plain) ? plain : bcrypt.hashSync(plain, BCRYPT_ROUNDS);
      } else if (hash && !isBcrypt(hash)) {
        hash = bcrypt.hashSync(hash, BCRYPT_ROUNDS);
      } else if (!hash && !plain) {
        // Default password for accounts without password (e.g. admin)
        hash = bcrypt.hashSync('Password123!', BCRYPT_ROUNDS);
      }

      await connection.query(
        'UPDATE users SET password_hash = ?, password = NULL WHERE id = ?',
        [hash, row.id]
      );
      updatedCount++;
      console.log(`[MySQL] User ${row.email || row.name}: password_hash set, plaintext password erased (NULL)`);
    }

    console.log(`\n✓ Successfully secured and updated ${updatedCount} users in MySQL database.`);

    // 3. Verification check
    const [checkRows] = await connection.query('SELECT id, email, name, password, password_hash FROM users');
    console.log('\n--- Database Security Verification ---');
    let allSecure = true;
    for (const r of checkRows) {
      const hasPlaintext = r.password !== null && r.password !== '';
      const hasValidHash = isBcrypt(r.password_hash);
      console.log(`User: ${r.email.padEnd(30)} | Plaintext Password: ${hasPlaintext ? 'EXPOSED (' + r.password + ')' : 'NULL (SECURE)'} | Hash: ${hasValidHash ? 'BCRYPT_COST_12 ✓' : 'MISSING ✗'}`);
      if (hasPlaintext || !hasValidHash) {
        allSecure = false;
      }
    }

    if (allSecure) {
      console.log('\n✅ ALL PASSWORDS IN DATABASE ARE 100% SECURED WITH INDUSTRY-STANDARD BCRYPT (COST FACTOR 12). ZERO PLAINTEXT PASSWORDS EXIST.');
    } else {
      console.warn('\n⚠️ Some user passwords could not be fully verified.');
    }

    await connection.end();
  } catch (err) {
    console.error('MySQL database password upgrade failed:', err.message);
  }
}

run();
