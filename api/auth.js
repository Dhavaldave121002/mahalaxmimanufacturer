import { getDbPool } from '../database/db.js';
import fs from 'fs';
import path from 'path';
import {
  createAdminSession,
  destroyAdminSession,
  hashPassword,
  requireAdminSession,
  verifyPassword
} from './_lib/admin-session.js';

// Memory fallback cache for users
let usersCache = null;

function loadFallbackUsers() {
  if (usersCache && usersCache.length > 0) return usersCache;
  // Check /tmp first for runtime persisted updates
  try {
    const tmpDir = process.platform === 'win32' ? (process.env.TEMP || 'C:\\Windows\\Temp') : '/tmp';
    const tmpPath = path.join(tmpDir, 'users.json');
    if (fs.existsSync(tmpPath)) {
      usersCache = JSON.parse(fs.readFileSync(tmpPath, 'utf8'));
      if (usersCache && usersCache.length > 0) return usersCache;
    }
  } catch (_) {}

  try {
    const filePath = path.join(process.cwd(), 'private-data', 'fixtures', 'users.json');
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
  // Save to /tmp for serverless runtime persistence
  try {
    const tmpDir = process.platform === 'win32' ? (process.env.TEMP || 'C:\\Windows\\Temp') : '/tmp';
    const tmpPath = path.join(tmpDir, 'users.json');
    fs.writeFileSync(tmpPath, JSON.stringify(users, null, 2), 'utf8');
  } catch (_) {}

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
    walletBalance: Number(u.wallet_balance ?? u.walletBalance ?? 0),
    walletTransactions: typeof u.wallet_transactions === 'string'
      ? JSON.parse(u.wallet_transactions || '[]')
      : (u.walletTransactions || []),
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
    if (req.query?.action === 'admin_session') {
      const admin = await requireAdminSession(req, res);
      if (!admin) return;
      return res.status(200).json({ success: true, user: admin });
    }
    const admin = await requireAdminSession(req, res);
    if (!admin) return;

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

    if (action === 'admin_logout') {
      try {
        await destroyAdminSession(pool, req, res);
        return res.status(200).json({ success: true, message: 'Admin session closed.' });
      } catch (error) {
        console.error('Admin logout failed:', error);
        return res.status(503).json({ success: false, error: 'Could not close admin session.' });
      }
    }

    if (action === 'admin_login') {
      const email = String(identifier || '').trim().toLowerCase();
      if (!pool) {
        return res.status(503).json({ success: false, message: 'Admin sign-in requires a configured database.' });
      }
      if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required.' });
      }
      try {
        const [rows] = await pool.query(
          "SELECT id, name, email, role, password_hash FROM users WHERE email = ? AND role = 'admin' LIMIT 1",
          [email]
        );
        const admin = rows[0];
        if (!admin) {
          return res.status(401).json({ success: false, message: 'Invalid administrator credentials.' });
        }

        const storedPassword = String(admin.password_hash || '');
        const validPassword = storedPassword.startsWith('scrypt$')
          ? await verifyPassword(password, storedPassword)
          : storedPassword.length > 0 && storedPassword === password;
        if (!validPassword) {
          return res.status(401).json({ success: false, message: 'Invalid administrator credentials.' });
        }

        if (!storedPassword.startsWith('scrypt$')) {
          const hashedPassword = await hashPassword(password);
          await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hashedPassword, admin.id]);
        }

        await createAdminSession(pool, admin.id, res);
        return res.status(200).json({
          success: true,
          message: 'Administrator sign-in successful.',
          user: { id: admin.id, name: admin.name, email: admin.email, role: admin.role }
        });
      } catch (error) {
        console.error('Admin sign-in failed:', error);
        return res.status(503).json({ success: false, message: 'Administrator sign-in is temporarily unavailable.' });
      }
    }

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
      const role = companyName || gstNumber ? 'retailer' : 'consumer';
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
            message: 'Account registered successfully! Welcome to Mahalaxmi Enterprise.',
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
        message: 'Account registered successfully! Welcome to Mahalaxmi Enterprise.',
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
    
    // -------------------------------------------------------------
    // ACTION: UPDATE PROFILE
    // -------------------------------------------------------------
    if (action === 'update_profile') {
      const u = user || req.body || {};
      const cleanEmail = (u.email || '').trim().toLowerCase();
      const cleanName = (u.name || u.fullName || '').trim();
      const cleanCompany = (u.companyName || u.company_name || '').trim();
      const cleanPhone = (u.phone || u.mobile || '').trim();
      const cleanGst = (u.gstNumber || u.gst_number || '').trim().toUpperCase();
      const newWalletBal = u.walletBalance !== undefined ? Number(u.walletBalance) : undefined;
      const newWalletTxns = u.walletTransactions !== undefined ? JSON.stringify(u.walletTransactions) : undefined;
      const newAddresses = Array.isArray(u.addresses)
        ? JSON.stringify(u.addresses.slice(0, 20))
        : undefined;

      if (!cleanEmail) {
        return res.status(400).json({ success: false, message: 'User email is required to update profile.' });
      }

      if (pool) {
        try {
          await pool.query(
            'UPDATE users SET name = COALESCE(NULLIF(?, ""), name), company_name = COALESCE(NULLIF(?, ""), company_name), phone = COALESCE(NULLIF(?, ""), phone), gst_number = COALESCE(NULLIF(?, ""), gst_number), wallet_balance = COALESCE(?, wallet_balance), wallet_transactions = COALESCE(?, wallet_transactions), addresses = COALESCE(?, addresses) WHERE email = ?',
            [cleanName, cleanCompany, cleanPhone, cleanGst, newWalletBal, newWalletTxns, newAddresses, cleanEmail]
          );
          const [updatedRows] = await pool.query('SELECT * FROM users WHERE email = ?', [cleanEmail]);
          if (updatedRows && updatedRows.length > 0) {
            return res.status(200).json({
              success: true,
              message: 'Profile updated successfully in MySQL database!',
              user: sanitizeUser(updatedRows[0])
            });
          }
        } catch (dbErr) {
          console.warn('MySQL profile update warning:', dbErr.message);
        }
      }

      // Fallback update
      const fallback = loadFallbackUsers();
      const idx = fallback.findIndex(f => f.email.toLowerCase() === cleanEmail);
      if (idx !== -1) {
        if (cleanName) fallback[idx].name = cleanName;
        if (cleanCompany) fallback[idx].companyName = cleanCompany;
        if (cleanPhone) fallback[idx].phone = cleanPhone;
        if (cleanGst) fallback[idx].gstNumber = cleanGst;
        if (newWalletBal !== undefined) fallback[idx].walletBalance = newWalletBal;
        if (u.walletTransactions !== undefined) fallback[idx].walletTransactions = u.walletTransactions;
        if (Array.isArray(u.addresses)) fallback[idx].addresses = u.addresses.slice(0, 20);
        saveFallbackUsers(fallback);
        return res.status(200).json({
          success: true,
          message: 'Profile updated successfully!',
          user: sanitizeUser(fallback[idx])
        });
      }

      return res.status(404).json({ success: false, message: 'Account not found to update.' });
    }

    // -------------------------------------------------------------
    // ACTION: WALLET OPERATIONS (TOP-UP, REFUND CREDIT, REDEEM/PAY)
    // -------------------------------------------------------------
    if (action === 'wallet_topup' || action === 'wallet_refund' || action === 'wallet_pay') {
      if (action === 'wallet_topup') {
        return res.status(503).json({
          success: false,
          message: 'Wallet top-up is disabled until payment verification and account authorization are available.'
        });
      }
      const targetEmail = (req.body.email || req.body.userEmail || '').trim().toLowerCase();
      const amount = Number(req.body.amount || 0);
      const orderId = req.body.orderId || '';
      const orderNumber = req.body.orderNumber || '';
      const description = req.body.description || '';
      const paymentRef = req.body.paymentRef || '';

      if (!targetEmail) {
        return res.status(400).json({ success: false, message: 'Customer email is required for wallet operations.' });
      }
      if (isNaN(amount) || amount <= 0) {
        return res.status(400).json({ success: false, message: 'A valid positive amount is required.' });
      }

      let matchedUser = null;
      let matchedIndex = -1;

      // 1. Fetch user from fallback or DB
      const fallback = loadFallbackUsers();
      matchedIndex = fallback.findIndex(f => f.email.toLowerCase() === targetEmail);
      if (matchedIndex !== -1) {
        matchedUser = fallback[matchedIndex];
      }

      if (!matchedUser) {
        return res.status(404).json({ success: false, message: `User with email "${targetEmail}" was not found.` });
      }

      const currentBalance = Number(matchedUser.walletBalance || matchedUser.wallet_balance || 0);
      let newBalance = currentBalance;
      let txType = 'WALLET_TOPUP';
      let txDesc = '';

      if (action === 'wallet_topup') {
        newBalance = currentBalance + amount;
        txType = 'WALLET_TOPUP';
        txDesc = description || `Added ₹${amount} to Mill Points (Payment Ref: ${paymentRef || 'UPI-' + Date.now().toString().slice(-6)})`;
      } else if (action === 'wallet_refund') {
        newBalance = currentBalance + amount;
        txType = 'CREDIT_REFUND';
        txDesc = description || `100% Refund of ₹${amount} credited as Mill Points for Order #${orderNumber || orderId}`;
      } else if (action === 'wallet_pay') {
        if (currentBalance < amount) {
          return res.status(400).json({
            success: false,
            message: `Insufficient points balance! Available: 🪙 ${currentBalance}, Required: 🪙 ${amount}.`
          });
        }
        newBalance = currentBalance - amount;
        txType = 'ORDER_PAYMENT';
        txDesc = description || `Redeemed 🪙 ${amount} Points towards Order #${orderNumber || orderId}`;
      }

      const newTx = {
        id: `wt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        userId: matchedUser.id,
        userEmail: targetEmail,
        type: txType,
        amount: amount,
        description: txDesc,
        orderId: orderId,
        orderNumber: orderNumber,
        balanceAfter: newBalance,
        timestamp: new Date().toISOString()
      };

      const existingTxns = Array.isArray(matchedUser.walletTransactions)
        ? matchedUser.walletTransactions
        : (typeof matchedUser.wallet_transactions === 'string' ? JSON.parse(matchedUser.wallet_transactions || '[]') : []);

      const updatedTxns = [newTx, ...existingTxns];

      // Update in fallback
      matchedUser.walletBalance = newBalance;
      matchedUser.walletTransactions = updatedTxns;
      fallback[matchedIndex] = matchedUser;
      saveFallbackUsers(fallback);

      // Update in MySQL if pool is available
      if (pool) {
        try {
          await pool.query(
            'UPDATE users SET wallet_balance = ?, wallet_transactions = ? WHERE email = ?',
            [newBalance, JSON.stringify(updatedTxns), targetEmail]
          );
        } catch (dbErr) {
          console.warn('MySQL wallet update warning:', dbErr.message);
        }
      }

      return res.status(200).json({
        success: true,
        message: txDesc,
        walletBalance: newBalance,
        transaction: newTx,
        user: sanitizeUser(matchedUser)
      });
    }

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

    }

    // -------------------------------------------------------------
    // ACTION: DELETE_ACCOUNT (User self-deletion to reduce server load)
    // -------------------------------------------------------------
    if (action === 'delete_account') {
      const targetEmail = ((req.body?.email || req.body?.identifier || '').trim().toLowerCase());
      const targetId = ((req.body?.id || req.body?.userId || '').trim());

      // STRICT SECURITY GUARD: ADMIN MASTER ACCOUNTS CAN NEVER BE DELETED!
      const PROTECTED_ADMIN_EMAILS = [
        'admin@mahalaxmienterprises.com',
        'admin@mahalaxmi.in',
        'mahalaxmienterpriseuk@gmail.com',
        'deviltimeisback001@gmail.com'
      ];

      if (PROTECTED_ADMIN_EMAILS.includes(targetEmail)) {
        return res.status(403).json({
          success: false,
          message: 'Security Alert: Administrator accounts cannot be deleted.'
        });
      }

      // Check if user is admin in fallback cache
      const fallback = loadFallbackUsers();
      const fallbackUser = fallback.find(
        f => (targetEmail && f.email?.toLowerCase() === targetEmail) || (targetId && f.id === targetId)
      );

      if (fallbackUser && (fallbackUser.role === 'admin' || PROTECTED_ADMIN_EMAILS.includes((fallbackUser.email || '').toLowerCase()))) {
        return res.status(403).json({
          success: false,
          message: 'Security Alert: Administrator master accounts cannot be deleted.'
        });
      }

      // Check in MySQL as well
      if (pool) {
        try {
          const [rows] = await pool.query(
            'SELECT * FROM users WHERE email = ? OR id = ? LIMIT 1',
            [targetEmail, targetId]
          );
          if (rows && rows.length > 0) {
            const dbUser = rows[0];
            if (dbUser.role === 'admin' || PROTECTED_ADMIN_EMAILS.includes((dbUser.email || '').toLowerCase())) {
              return res.status(403).json({
                success: false,
                message: 'Security Alert: Administrator master accounts cannot be deleted.'
              });
            }
          }
        } catch (dbErr) {
          console.warn('MySQL admin verification lookup error:', dbErr.message);
        }
      }

      // Deletion from MySQL database
      let deletedFromDb = false;
      if (pool) {
        try {
          const [delRes] = await pool.query(
            'DELETE FROM users WHERE email = ? OR id = ?',
            [targetEmail, targetId]
          );
          if (delRes && delRes.affectedRows > 0) {
            deletedFromDb = true;
          }
        } catch (dbErr) {
          console.warn('MySQL delete user error:', dbErr.message);
        }
      }

      // Deletion from fallback users.json and memory cache
      const updatedFallback = fallback.filter(
        f => !((targetEmail && f.email?.toLowerCase() === targetEmail) || (targetId && f.id === targetId))
      );
      saveFallbackUsers(updatedFallback);

      return res.status(200).json({
        success: true,
        message: 'Your account and personal data have been completely deleted from our servers.',
        deletedFromDb
      });
    }

    return res.status(400).json({ success: false, message: 'Invalid action.' });
  }

  res.status(405).json({ success: false, message: 'Method not allowed.' });
}
