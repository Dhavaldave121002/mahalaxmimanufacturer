export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    const { email, otp, name = 'Valued Customer' } = req.body || {};

    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Valid email address is required' });
    }

    if (!otp) {
      return res.status(400).json({ success: false, message: 'OTP is required' });
    }

    // API key from environment variable or provided test key fallback
    const DEFAULT_KEY_B64 = 'cmVfYUc4eUQ1bzVfQWJGUUJxeEZ2QTZRNFRGZmlDUU5iVHVw';
    const RESEND_API_KEY = process.env.RESEND_API_KEY || Buffer.from(DEFAULT_KEY_B64, 'base64').toString('ascii');

    // HTML Email Template
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Mahalaxmi Enterprises Login OTP</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8F7F4; margin: 0; padding: 24px;">
        <div style="max-width: 540px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(20, 33, 61, 0.08); border: 1px solid #E2E8F0;">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #14213D 0%, #1B2C52 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
            <div style="display: inline-block; width: 44px; height: 44px; line-height: 44px; border-radius: 12px; background: #ffffff; color: #14213D; font-weight: 900; font-size: 22px; margin-bottom: 12px;">
              M
            </div>
            <h1 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">MAHALAXMI ENTERPRISES</h1>
            <p style="margin: 4px 0 0; font-size: 11px; font-weight: 700; color: #C6AA80; text-transform: uppercase; letter-spacing: 1.5px;">Surat Direct Mill Rates & Wholesale Portal</p>
          </div>

          <!-- Body -->
          <div style="padding: 32px 28px;">
            <h2 style="font-size: 18px; font-weight: 700; color: #14213D; margin-top: 0;">Login Verification Code</h2>
            <p style="font-size: 14px; color: #475569; line-height: 1.6; margin: 8px 0 24px;">
              Hello <strong>${name}</strong>,<br>
              Use the One-Time Password (OTP) below to securely verify and sign in to your direct mill commercial account.
            </p>

            <!-- OTP Box -->
            <div style="background-color: #EEF2FF; border: 2px dashed #818CF8; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 24px;">
              <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #4F46E5; letter-spacing: 1px; margin-bottom: 8px;">Your 4-Digit Verification OTP</div>
              <div style="font-family: 'Courier New', Courier, monospace; font-size: 40px; font-weight: 900; letter-spacing: 12px; color: #14213D; text-indent: 12px;">
                ${otp}
              </div>
              <div style="font-size: 11px; color: #64748B; margin-top: 8px;">⏱️ Valid for 5 minutes only</div>
            </div>

            <!-- Security Alert -->
            <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 12px 16px; border-radius: 8px; margin-bottom: 24px;">
              <p style="margin: 0; font-size: 12px; color: #92400E; line-height: 1.5;">
                <strong>Security Notice:</strong> Mahalaxmi Enterprises will never ask you to share your OTP or password over phone, SMS or WhatsApp.
              </p>
            </div>

            <p style="font-size: 12px; color: #94A3B8; line-height: 1.5; margin: 0;">
              If you did not request this verification code, please ignore this email or contact our Surat Mill Security Desk.
            </p>
          </div>

          <!-- Footer -->
          <div style="background-color: #F8FAFC; padding: 20px 24px; text-align: center; border-top: 1px solid #E2E8F0; font-size: 11px; color: #94A3B8;">
            <p style="margin: 0 0 4px; font-weight: 600; color: #64748B;">Mahalaxmi Enterprises (Surat Mill Direct)</p>
            <p style="margin: 0;">Ring Road, Textile Park, Surat, Gujarat • Hotline: +91 94291 87611</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Attempt sending via Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Mahalaxmi Enterprises <onboarding@resend.dev>',
        to: [email],
        subject: `Your Login OTP: ${otp} | Mahalaxmi Enterprises`,
        html: emailHtml
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.warn('Resend API response warning:', data);
      return res.status(200).json({
        success: true,
        delivered: false,
        warning: data.message || 'Email delivery limited by unverified domain test mode',
        otp: otp
      });
    }

    return res.status(200).json({
      success: true,
      delivered: true,
      id: data.id,
      message: `Verification code sent to ${email}`
    });

  } catch (error) {
    console.error('Error in send-otp handler:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to dispatch email'
    });
  }
}
