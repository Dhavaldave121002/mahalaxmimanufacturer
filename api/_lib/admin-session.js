import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { getDbPool } from '../../database/db.js';

const scrypt = promisify(scryptCallback);
const COOKIE_NAME = 'mle_admin_session';
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

function getSessionToken(req) {
  const cookieHeader = req.headers?.cookie || '';
  const cookie = cookieHeader.split(';').map(part => part.trim()).find(part => part.startsWith(`${COOKIE_NAME}=`));
  return cookie ? decodeURIComponent(cookie.slice(COOKIE_NAME.length + 1)) : '';
}

function sessionCookie(value, maxAge) {
  const secure = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);
  return `${COOKIE_NAME}=${encodeURIComponent(value)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}${secure ? '; Secure' : ''}`;
}

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

async function ensureSessionsTable(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_sessions (
      token_hash CHAR(64) NOT NULL PRIMARY KEY,
      user_id VARCHAR(50) NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_admin_sessions_expiry (expires_at),
      INDEX idx_admin_sessions_user (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const key = await scrypt(password, salt, 64);
  return `scrypt$${salt}$${key.toString('hex')}`;
}

export async function verifyPassword(password, storedValue) {
  const [scheme, salt, storedKey] = String(storedValue || '').split('$');
  if (scheme !== 'scrypt' || !salt || !storedKey || !/^[a-f0-9]{128}$/i.test(storedKey)) {
    return false;
  }
  const derivedKey = await scrypt(password, salt, 64);
  return timingSafeEqual(derivedKey, Buffer.from(storedKey, 'hex'));
}

export async function createAdminSession(pool, userId, res) {
  await ensureSessionsTable(pool);
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await pool.query(
    'INSERT INTO admin_sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)',
    [hashToken(token), userId, expiresAt]
  );
  res.setHeader('Set-Cookie', sessionCookie(token, SESSION_TTL_MS / 1000));
}

export async function destroyAdminSession(pool, req, res) {
  const token = getSessionToken(req);
  if (pool && token) {
    await ensureSessionsTable(pool);
    await pool.query('DELETE FROM admin_sessions WHERE token_hash = ?', [hashToken(token)]);
  }
  res.setHeader('Set-Cookie', sessionCookie('', 0));
}

export function requirePersistentDatabase(pool, res) {
  if (pool || process.env.NODE_ENV !== 'production') return true;
  res.status(503).json({
    success: false,
    error: 'This operation requires a configured persistent database.'
  });
  return false;
}

export async function requireAdminSession(req, res) {
  const pool = getDbPool();
  if (!pool) {
    res.status(503).json({ success: false, error: 'Admin access requires a configured database.' });
    return null;
  }

  const token = getSessionToken(req);
  if (!token) {
    res.status(401).json({ success: false, error: 'Admin sign-in is required.' });
    return null;
  }

  try {
    await ensureSessionsTable(pool);
    const [rows] = await pool.query(
      `SELECT u.id, u.name, u.email, u.role
       FROM admin_sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ? AND s.expires_at > UTC_TIMESTAMP() AND u.role = 'admin'
       LIMIT 1`,
      [hashToken(token)]
    );
    if (!rows.length) {
      res.setHeader('Set-Cookie', sessionCookie('', 0));
      res.status(401).json({ success: false, error: 'Admin session is invalid or expired.' });
      return null;
    }
    return rows[0];
  } catch (error) {
    console.error('Admin session verification failed:', error);
    res.status(503).json({ success: false, error: 'Admin session verification is unavailable.' });
    return null;
  }
}
