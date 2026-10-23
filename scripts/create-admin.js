import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { randomUUID } from 'node:crypto';
import { getDbPool } from '../database/db.js';
import { hashPassword } from '../api/_lib/admin-session.js';

function ask(question) {
  const terminal = createInterface({ input: stdin, output: stdout });
  return terminal.question(question).finally(() => terminal.close());
}

function askHidden(question) {
  if (!stdin.isTTY || typeof stdin.setRawMode !== 'function') {
    return Promise.reject(new Error('Run this command in an interactive terminal so the password can be hidden.'));
  }

  return new Promise((resolve, reject) => {
    let value = '';
    stdout.write(question);
    stdin.setRawMode(true);
    stdin.resume();

    const finish = (error) => {
      stdin.removeListener('data', onData);
      stdin.setRawMode(false);
      stdout.write('\n');
      if (error) reject(error);
      else resolve(value);
    };

    const onData = (chunk) => {
      for (const character of chunk.toString('utf8')) {
        if (character === '\u0003') {
          finish(new Error('Admin setup cancelled.'));
          return;
        }
        if (character === '\r' || character === '\n') {
          finish();
          return;
        }
        if (character === '\u0008' || character === '\u007f') {
          value = value.slice(0, -1);
          continue;
        }
        if (character >= ' ') value += character;
      }
    };

    stdin.on('data', onData);
  });
}

async function main() {
  const pool = getDbPool();
  if (!pool) {
    throw new Error('MySQL is not configured. Set the database variables in the local .env file first.');
  }

  try {
    const name = (await ask('Administrator name: ')).trim();
    const email = (await ask('Administrator email: ')).trim().toLowerCase();
    const phone = (await ask('Administrator phone: ')).trim();

    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !phone) {
      throw new Error('Enter a name, valid email address, and phone number.');
    }

    const [databaseRows] = await pool.query('SELECT DATABASE() AS databaseName');
    const databaseName = databaseRows[0]?.databaseName;
    if (!databaseName) {
      throw new Error('The MySQL connection has no selected database.');
    }

    stdout.write(`\nThis will create a new admin account in database "${databaseName}".\n`);
    stdout.write('It will not change any existing user account.\n');
    if ((await ask('Type CREATE ADMIN to continue: ')).trim() !== 'CREATE ADMIN') {
      stdout.write('Admin setup cancelled; no database changes were made.\n');
      return;
    }

    const password = await askHidden('New admin password (minimum 12 characters): ');
    const confirmation = await askHidden('Confirm new admin password: ');
    if (password.length < 12) {
      throw new Error('Choose a password with at least 12 characters.');
    }
    if (password !== confirmation) {
      throw new Error('The passwords do not match.');
    }

    const passwordHash = await hashPassword(password);
    const id = `admin-${randomUUID()}`;
    await pool.query(
      `INSERT INTO users (id, name, email, phone, password_hash, role)
       VALUES (?, ?, ?, ?, ?, 'admin')`,
      [id, name, email, phone, passwordHash]
    );

    stdout.write(`Admin account created for ${email} in "${databaseName}".\n`);
    stdout.write('Sign in at /admin using the email and password you just entered.\n');
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(`Admin setup failed: ${error.message}`);
  process.exitCode = 1;
});
