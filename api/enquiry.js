import { getDbPool } from '../database/db.js';
import fs from 'fs';
import path from 'path';
import { requireAdminSession } from './_lib/admin-session.js';

let enquiriesCache = null;

function loadFallbackEnquiries() {
  if (enquiriesCache && enquiriesCache.length > 0) return enquiriesCache;
  try {
    const filePath = path.join(process.cwd(), 'private-data', 'fixtures', 'enquiries.json');
    if (fs.existsSync(filePath)) {
      enquiriesCache = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      return enquiriesCache;
    }
  } catch (err) {
    console.warn('Fallback enquiries read warning:', err.message);
  }
  return [];
}

function saveFallbackEnquiries(enquiries) {
  enquiriesCache = enquiries;
  try {
    const filePath = path.join(process.cwd(), 'private-data', 'fixtures', 'enquiries.json');
    fs.writeFileSync(filePath, JSON.stringify(enquiries, null, 2), 'utf8');
  } catch (err) {
    console.warn('Fallback enquiries write warning:', err.message);
  }
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

  // 1. GET: Return all business enquiries for Admin Dashboard
  if (req.method === 'GET') {
    const admin = await requireAdminSession(req, res);
    if (!admin) return;
    if (pool) {
      try {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS business_enquiries (
            id INT AUTO_INCREMENT PRIMARY KEY,
            enquiry_code VARCHAR(100),
            full_name VARCHAR(150),
            email VARCHAR(150),
            phone VARCHAR(50),
            business_name VARCHAR(200),
            business_type VARCHAR(100),
            expected_monthly_volume VARCHAR(100),
            notes TEXT,
            source VARCHAR(50) DEFAULT 'WEB',
            status ENUM('NEW', 'CONTACTED', 'QUOTED', 'CONVERTED', 'CLOSED') DEFAULT 'NEW',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        const [rows] = await pool.query('SELECT * FROM business_enquiries ORDER BY created_at DESC');
        const formatted = rows.map(r => ({
          id: `enq-${r.id}`,
          enquiryCode: r.enquiry_code,
          fullName: r.full_name,
          email: r.email,
          phone: r.phone,
          businessName: r.business_name,
          businessType: r.business_type,
          expectedMonthlyVolume: r.expected_monthly_volume,
          notes: r.notes,
          source: r.source,
          status: r.status,
          createdAt: r.created_at
        }));

        return res.status(200).json({
          success: true,
          source: 'MYSQL_DATABASE',
          count: formatted.length,
          enquiries: formatted
        });
      } catch (dbErr) {
        console.warn('MySQL enquiries fetch warning:', dbErr.message);
        if (process.env.NODE_ENV === 'production') {
          return res.status(503).json({ success: false, error: 'Enquiries are unavailable because database access failed.' });
        }
      }
    }

    const fallback = loadFallbackEnquiries();
    return res.status(200).json({
      success: true,
      source: 'LOCAL_FALLBACK',
      count: fallback.length,
      enquiries: fallback
    });
  }

  // 2. POST: Submit a new requirement / enquiry
  if (req.method === 'POST') {
    if (process.env.NODE_ENV === 'production' && !pool) {
      return res.status(503).json({ success: false, error: 'Enquiry submission requires a configured database.' });
    }
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = {}; }
    }
    body = body || {};

    const fullName = String(body.fullName || body.name || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const phone = String(body.phone || body.mobile || '').trim();
    if (!fullName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || phone.replace(/\D/g, '').length < 7) {
      return res.status(400).json({ success: false, error: 'A valid name, email address, and phone number are required.' });
    }
    const businessName = String(body.businessName || body.companyName || body.company || '').trim();
    const businessType = String(body.businessType || body.type || '').trim();
    const expectedMonthlyVolume = String(body.expectedMonthlyVolume || body.volume || '').trim();
    const notes = String(body.notes || body.requirement || body.message || '').trim();
    const source = body.source === 'FLUTTER_APP' ? 'FLUTTER_APP' : 'WEB';
    const enquiryCode = `ENQ-${Date.now().toString().slice(-6)}`;

    const newEnquiry = {
      id: `enq-${Date.now()}`,
      enquiryCode,
      fullName,
      email,
      phone,
      businessName,
      businessType,
      expectedMonthlyVolume,
      notes,
      source,
      status: 'NEW',
      createdAt: new Date().toISOString()
    };

    // Save in MySQL Database
    if (pool) {
      try {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS business_enquiries (
            id INT AUTO_INCREMENT PRIMARY KEY,
            enquiry_code VARCHAR(100),
            full_name VARCHAR(150),
            email VARCHAR(150),
            phone VARCHAR(50),
            business_name VARCHAR(200),
            business_type VARCHAR(100),
            expected_monthly_volume VARCHAR(100),
            notes TEXT,
            source VARCHAR(50) DEFAULT 'WEB',
            status ENUM('NEW', 'CONTACTED', 'QUOTED', 'CONVERTED', 'CLOSED') DEFAULT 'NEW',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        await pool.query(
          `INSERT INTO business_enquiries 
           (enquiry_code, full_name, email, phone, business_name, business_type, expected_monthly_volume, notes, source, status) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'NEW')`,
          [enquiryCode, fullName, email, phone, businessName, businessType, expectedMonthlyVolume, notes, source]
        );
      } catch (dbErr) {
        console.warn('MySQL insert enquiry error:', dbErr.message);
        if (process.env.NODE_ENV === 'production') {
          return res.status(503).json({ success: false, error: 'The enquiry could not be saved. Please try again later.' });
        }
      }
    }

    // Save in local fallback
    const current = loadFallbackEnquiries();
    current.unshift(newEnquiry);
    saveFallbackEnquiries(current);

    // Dispatch Notification Emails (Admin Alert + Customer Acknowledgment)
    sendEnquiryEmails({
      enquiryCode,
      fullName,
      email,
      phone,
      businessName,
      businessType,
      expectedMonthlyVolume,
      notes,
      source
    }).catch(e => console.warn('Enquiry email delivery warning:', e.message));

    return res.status(201).json({
      success: true,
      message: 'Business requirement submitted successfully! Our mill manager will contact you within 2 business hours.',
      enquiry: newEnquiry
    });
  }

  res.status(405).json({ success: false, message: 'Method Not Allowed' });
}

async function sendEnquiryEmails(data) {
  const {
    enquiryCode,
    fullName,
    email,
    phone,
    businessName,
    businessType,
    expectedMonthlyVolume,
    notes,
    source
  } = data;


  const adminRecipients = ['mahalaxmienterpriseuk@gmail.com', 'dhavaldave121002@gmail.com', 'deviltimeisback001@gmail.com'];

  const adminEmailHtml = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0F172A; margin: 0; padding: 20px;">
      <div style="max-width: 580px; margin: 0 auto; background: #FFFFFF; border-radius: 18px; overflow: hidden; border: 1px solid #CBD5E1;">
        <div style="background-color: #14213D; padding: 24px; text-align: center;">
          <h2 style="color: #FFFFFF; margin: 0; font-size: 20px; font-weight: 900; letter-spacing: 0.5px;">
            🏭 NEW BUSINESS REQUIREMENT / RFQ
          </h2>
          <p style="color: #FCA311; font-size: 12px; font-weight: 700; margin: 6px 0 0; text-transform: uppercase;">
            Lead #${enquiryCode} • ${source}
          </p>
        </div>
        <div style="padding: 24px; color: #1E293B; font-size: 13px; line-height: 1.6;">
          <p style="font-size: 14px; font-weight: bold; margin-top: 0; color: #0F172A;">
            A new commercial buyer requirement has been submitted:
          </p>
          <table width="100%" cellpadding="8" cellspacing="0" style="border-collapse: collapse; margin: 16px 0; background: #F8FAFC; border-radius: 12px; border: 1px solid #E2E8F0;">
            <tr>
              <td style="font-weight: bold; width: 140px; color: #475569;">Company Name:</td>
              <td style="font-weight: 800; color: #0F172A;">${businessName}</td>
            </tr>
            <tr>
              <td style="font-weight: bold; color: #475569;">Contact Person:</td>
              <td>${fullName}</td>
            </tr>
            <tr>
              <td style="font-weight: bold; color: #475569;">Mobile Number:</td>
              <td><a href="tel:${phone}" style="color: #2563EB; font-weight: bold; text-decoration: none;">${phone}</a></td>
            </tr>
            <tr>
              <td style="font-weight: bold; color: #475569;">Email Address:</td>
              <td><a href="mailto:${email}" style="color: #2563EB; text-decoration: none;">${email}</a></td>
            </tr>
            <tr>
              <td style="font-weight: bold; color: #475569;">Business Type:</td>
              <td><span style="background: #E0E7FF; color: #3730A3; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 800;">${businessType}</span></td>
            </tr>
            <tr>
              <td style="font-weight: bold; color: #475569;">Monthly Volume:</td>
              <td style="font-weight: bold; color: #D97706;">${expectedMonthlyVolume}</td>
            </tr>
            <tr>
              <td style="font-weight: bold; color: #475569; vertical-align: top;">Requirement Notes:</td>
              <td style="background: #FFFFFF; border-radius: 6px; border: 1px solid #CBD5E1; color: #0F172A; font-weight: 500;">
                ${notes}
              </td>
            </tr>
          </table>

          <div style="text-align: center; margin: 24px 0 10px;">
            <a href="https://wa.me/${phone.replace(/\\D/g, '')}?text=${encodeURIComponent(`Namaste ${fullName}, we received your requirement #${enquiryCode} at Mahalaxmi Enterprise. Our team will follow up with you shortly.`)}"
               style="background: #10B981; color: #FFFFFF; font-weight: bold; font-size: 13px; text-decoration: none; padding: 12px 24px; border-radius: 12px; display: inline-block;">
              💬 Reply to Buyer on WhatsApp
            </a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;


  // 3. Guaranteed Direct Gmail Dispatch via EmailJS Engine
  try {
    const EMAILJS_SERVICE_ID = process.env.EMAILJS_SERVICE_ID || process.env.VITE_EMAILJS_SERVICE_ID || 'service_935pxzz';
    const EMAILJS_TEMPLATE_ID = 'template_rxzob8r';
    const EMAILJS_PUBLIC_KEY = process.env.EMAILJS_PUBLIC_KEY || process.env.VITE_EMAILJS_PUBLIC_KEY || 'G6gT9XDN4SFBz6oqW';

    if (EMAILJS_SERVICE_ID && EMAILJS_PUBLIC_KEY) {
      // Send Admin Alert
      await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'https://mahalaxmimanufacturer.com'
        },
        body: JSON.stringify({
          service_id: EMAILJS_SERVICE_ID,
          template_id: EMAILJS_TEMPLATE_ID,
          user_id: EMAILJS_PUBLIC_KEY,
          template_params: {
            to_email: 'mahalaxmienterpriseuk@gmail.com',
            to_name: 'Mahalaxmi Mill Admin',
            subject: `🚨 New Business Enquiry: ${businessName} (${expectedMonthlyVolume})`,
            headline: 'New Business Enquiry',
            code_box: `#${enquiryCode}`,
            subtext: `From: ${fullName} (${phone}) • Vol: ${expectedMonthlyVolume}`,
            message: `New requirement from ${fullName} (${businessName}, ${businessType})! Phone: ${phone}, Email: ${email}. Target Volume: ${expectedMonthlyVolume}. Notes: ${notes}`
          }
        })
      }).catch(() => {});

      // Send Customer Acknowledgment
      if (email && email.includes('@')) {
        await fetch('https://api.emailjs.com/api/v1.0/email/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Origin': 'https://mahalaxmimanufacturer.com'
          },
          body: JSON.stringify({
            service_id: EMAILJS_SERVICE_ID,
            template_id: EMAILJS_TEMPLATE_ID,
            user_id: EMAILJS_PUBLIC_KEY,
            template_params: {
              to_email: email,
              to_name: fullName,
              subject: `Requirement Confirmed: #${enquiryCode} | Mahalaxmi Enterprise`,
              headline: 'Requirement Received',
              code_box: `#${enquiryCode}`,
              subtext: `Business enquiry received • Vol: ${expectedMonthlyVolume}`,
              brand_name: 'Mahalaxmi Enterprise',
              brand_tagline: 'Direct Mill Rates & Wholesale Essentials',
              support_phone: '+91 90335 98639',
              support_email: 'mahalaxmienterprise881@gmail.com',
              message: `Namaste ${fullName}! Thank you for your enquiry for ${businessName}. Our team has received your volume request (${expectedMonthlyVolume}) and will contact you shortly.`
            }
          })
        }).catch(() => {});
      }
    }
  } catch (ejsErr) {
    console.warn('[EmailJS Enquiry Dispatch Warning]:', ejsErr);
  }
}
