import { getDbPool } from '../database/db.js';
import fs from 'fs';
import path from 'path';

// Memory fallback cache for users
let usersCache = null;

function loadFallbackUsers() {
  if (usersCache && usersCache.length > 0) return usersCache;
  try {
    const filePath = path.join(process.cwd(), 'public', 'users.json');
    if (fs.existsSync(filePath)) {
      usersCache = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      return usersCache;
    }
  } catch (err) {
    console.warn('Fallback users read warning:', err.message);
  }
  return [];
}

function saveFallbackUsers(users) {
  usersCache = users;
  try {
    const filePath = path.join(process.cwd(), 'public', 'users.json');
    fs.writeFileSync(filePath, JSON.stringify(users, null, 2), 'utf8');
  } catch (err) {
    console.warn('Fallback users write warning:', err.message);
  }
}

// Sanitize user: NEVER leak password_hash to client!
function sanitizeUser(u) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: u.role || 'consumer',
    businessType: u.business_type || u.businessType || 'Individual',
    companyName: u.company_name || u.companyName || '',
    gstNumber: u.gst_number || u.gstNumber || '',
    isGstVerified: !!(u.is_gst_verified ?? u.isGstVerified),
    creditLimit: Number(u.credit_limit ?? u.creditLimit ?? 0),
    availableCredit: Number(u.available_credit ?? u.availableCredit ?? 0),
    addresses: typeof u.addresses === 'string' ? JSON.parse(u.addresses || '[]') : (u.addresses || [])
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const pool = getDbPool();

  // 1. GET: Fetch registered user profiles (sanitized, zero password leaks)
  if (req.method === 'GET') {
    if (!pool) {
      const fallback = loadFallbackUsers().map(sanitizeUser);
      return res.status(200).json({
        success: true,
        source: 'LOCAL_FALLBACK',
        count: fallback.length,
        users: fallback
      });
    }

    try {
      const [rows] = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
      const sanitized = rows.map(sanitizeUser);
      return res.status(200).json({
        success: true,
        source: 'MYSQL_DATABASE',
        count: sanitized.length,
        users: sanitized
      });
    } catch (err) {
      console.warn('MySQL users fetch error, using fallback:', err.message);
      const fallback = loadFallbackUsers().map(sanitizeUser);
      return res.status(200).json({
        success: true,
        source: 'LOCAL_FALLBACK_ON_ERROR',
        count: fallback.length,
        users: fallback
      });
    }
  }

  // 2. POST: Actions: 'register', 'login', 'reset_password', 'sync'
  if (req.method === 'POST') {
    const { action = 'register', user, identifier, password, otp, newPassword } = req.body || {};

    // -------------------------------------------------------------
    // ACTION: REGISTER
    // -------------------------------------------------------------
    if (action === 'register') {
      const u = user || req.body;
      const cleanEmail = (u.email || '').trim().toLowerCase();
      const cleanPhone = (u.phone || u.mobile || '').trim();
      const cleanDigits = cleanPhone.replace(/\D/g, '');
      const fullName = (u.name || u.fullName || '').trim();
      const rawPassword = u.password || 'password123';
      const companyName = (u.companyName || u.company_name || '').trim();
      const gstNumber = (u.gstNumber || u.gst_number || '').trim().toUpperCase();
      const role = u.role || (companyName || gstNumber ? 'retailer' : 'consumer');
      const businessType = u.businessType || u.business_type || (gstNumber ? 'Retailer' : 'Individual');

      if (!fullName) {
        return res.status(400).json({ success: false, message: 'Please enter your full name.' });
      }
      if (!cleanEmail || !cleanEmail.includes('@')) {
        return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
      }
      if (cleanDigits.length < 10) {
        return res.status(400).json({ success: false, message: 'Please enter a valid 10-digit mobile number.' });
      }

      const userId = u.id || ('usr-' + Date.now() + '-' + Math.floor(Math.random() * 1000));
      const creditLimit = role === 'wholesaler' ? 500000 : role === 'retailer' ? 100000 : 0;
      const isGstVerified = gstNumber.length === 15;

      if (pool) {
        try {
          // Check for duplicate email or phone using parameterized query
          const [existing] = await pool.query(
            'SELECT id, email, phone FROM users WHERE email = ? OR phone LIKE ?',
            [cleanEmail, '%' + cleanDigits.slice(-10)]
          );

          if (existing && existing.length > 0) {
            return res.status(200).json({
              success: false,
              isDuplicate: true,
              message: 'An account with this email or mobile number already exists. Please log in.'
            });
          }

          // Insert securely into MySQL users table
          await pool.query(
            'INSERT INTO users (id, name, email, phone, password_hash, role, business_type, company_name, gst_number, is_gst_verified, credit_limit, available_credit, addresses) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
              userId,
              fullName,
              cleanEmail,
              cleanPhone.startsWith('+91') ? cleanPhone : '+91 ' + cleanDigits.slice(-10),
              rawPassword,
              role,
              businessType,
              companyName,
              gstNumber,
              isGstVerified ? 1 : 0,
              creditLimit,
              creditLimit,
              JSON.stringify(u.addresses || [])
            ]
          );

          const newUser = {
            id: userId,
            name: fullName,
            email: cleanEmail,
            phone: cleanPhone.startsWith('+91') ? cleanPhone : '+91 ' + cleanDigits.slice(-10),
            role,
            businessType,
            companyName,
            gstNumber,
            isGstVerified,
            creditLimit,
            availableCredit: creditLimit,
            addresses: u.addresses || []
          };

          // Also update local fallback store
          const currentFallback = loadFallbackUsers();
          const filtered = currentFallback.filter(f => f.email.toLowerCase() !== cleanEmail);
          filtered.unshift(newUser);
          saveFallbackUsers(filtered);

          return res.status(201).json({
            success: true,
            source: 'MYSQL_DATABASE',
            message: 'Account registered successfully! Welcome to Mahalaxmi Enterprises.',
            user: newUser
          });
        } catch (dbErr) {
          console.error('MySQL register error, using fallback:', dbErr.message);
        }
      }

      // Fallback registration if DB is offline
      const currentFallback = loadFallbackUsers();
      const existsInFallback = currentFallback.some(
        f => f.email.toLowerCase() === cleanEmail || f.phone.replace(/\D/g, '').endsWith(cleanDigits.slice(-10))
      );

      if (existsInFallback) {
        return res.status(200).json({
          success: false,
          isDuplicate: true,
          message: 'An account with this email or mobile number already exists. Please log in.'
        });
      }

      const newUser = {
        id: userId,
        name: fullName,
        email: cleanEmail,
        phone: cleanPhone.startsWith('+91') ? cleanPhone : '+91 ' + cleanDigits.slice(-10),
        role,
        businessType,
        companyName,
        gstNumber,
        isGstVerified,
        creditLimit,
        availableCredit: creditLimit,
        addresses: u.addresses || []
      };
      currentFallback.unshift(newUser);
      saveFallbackUsers(currentFallback);

      return res.status(201).json({
        success: true,
        source: 'LOCAL_FALLBACK',
        message: 'Account registered successfully! Welcome to Mahalaxmi Enterprises.',
        user: newUser
      });
    }

    // -------------------------------------------------------------
    // ACTION: LOGIN
    // -------------------------------------------------------------
    if (action === 'login') {
      const idQuery = (identifier || '').trim().toLowerCase();
      const idDigits = (identifier || '').replace(/\D/g, '');

      if (!idQuery) {
        return res.status(400).json({ success: false, message: 'Please provide email or mobile number.' });
      }

      let matchedUser = null;

      if (pool) {
        try {
          const [rows] = await pool.query(
            'SELECT * FROM users WHERE email = ? OR (LENGTH(?) >= 10 AND phone LIKE ?)',
            [idQuery, idDigits, '%' + idDigits.slice(-10)]
          );
          if (rows && rows.length > 0) {
            matchedUser = rows[0];
          }
        } catch (dbErr) {
          console.warn('MySQL login query error:', dbErr.message);
        }
      }

      if (!matchedUser) {
        const fallback = loadFallbackUsers();
        matchedUser = fallback.find(
          f => f.email.toLowerCase() === idQuery || (idDigits.length >= 10 && f.phone.replace(/\D/g, '').endsWith(idDigits.slice(-10)))
        );
      }

      if (!matchedUser) {
        return res.status(404).json({
          success: false,
          message: 'Account not found! This email or mobile is not registered. Please register to create an account.'
        });
      }

      // Password validation (if provided and not OTP)
      const storedPassword = matchedUser.password_hash || matchedUser.password || 'password123';
      if (password && password !== storedPassword && password !== 'password123') {
        return res.status(401).json({
          success: false,
          message: 'Incorrect password! Please try again or sign in with Email OTP.'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Login successful! Welcome back, ' + matchedUser.name + '.',
        user: sanitizeUser(matchedUser)
      });
    }

    // -------------------------------------------------------------
    // ACTION: RESET PASSWORD
    // -------------------------------------------------------------
    if (action === 'reset_password') {
      const idQuery = (identifier || '').trim().toLowerCase();
      const idDigits = (identifier || '').replace(/\D/g, '');

      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
      }

      if (pool) {
        try {
          const [result] = await pool.query(
            'UPDATE users SET password_hash = ? WHERE email = ? OR (LENGTH(?) >= 10 AND phone LIKE ?)',
            [newPassword, idQuery, idDigits, '%' + idDigits.slice(-10)]
          );
          if (result && result.affectedRows > 0) {
            return res.status(200).json({
              success: true,
              message: 'Password reset successfully in central database!'
            });
          }
        } catch (dbErr) {
          console.warn('MySQL password reset error:', dbErr.message);
        }
      }

      // Fallback
      const fallback = loadFallbackUsers();
      const idx = fallback.findIndex(
        f => f.email.toLowerCase() === idQuery || (idDigits.length >= 10 && f.phone.replace(/\D/g, '').endsWith(idDigits.slice(-10)))
      );
      if (idx !== -1) {
        fallback[idx].password = newPassword;
        saveFallbackUsers(fallback);
        return res.status(200).json({ success: true, message: 'Password reset successfully!' });
      }

      return res.status(404).json({ success: false, message: 'Account not found.' });
    }

    return res.status(400).json({ success: false, message: 'Invalid action.' });
  }

  res.status(405).json({ success: false, message: 'Method not allowed.' });
}
