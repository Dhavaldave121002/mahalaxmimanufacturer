export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, X-Client-App, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    const { email, otp } = req.body || {};
    let customerName = (req.body?.name || '').trim();
    if (!customerName || customerName.toLowerCase() === 'valued customer' || customerName.toLowerCase() === 'customer') {
      if (email && email.includes('@')) {
        const raw = email.split('@')[0].replace(/[0-9._-]+/g, ' ').trim();
        if (raw.length > 1) {
          customerName = raw.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
        }
      }
    }
    if (!customerName) customerName = 'Valued Partner';

    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Valid email address is required' });
    }

    if (!otp) {
      return res.status(400).json({ success: false, message: 'OTP is required' });
    }

    // ==========================================
    // EmailJS Dispatch Engine (Direct Gmail delivery without Resend or sandbox restrictions)
    // ==========================================
    const EMAILJS_SERVICE_ID = process.env.EMAILJS_SERVICE_ID || process.env.VITE_EMAILJS_SERVICE_ID || 'service_935pxzz';
    let EMAILJS_TEMPLATE_ID = process.env.EMAILJS_TEMPLATE_ID || process.env.VITE_EMAILJS_TEMPLATE_ID || 'template_rxzob8r';
    if (!EMAILJS_TEMPLATE_ID || EMAILJS_TEMPLATE_ID === 'rn6jeir' || EMAILJS_TEMPLATE_ID === 'template_er89rta') {
      EMAILJS_TEMPLATE_ID = 'template_rxzob8r';
    }
    const EMAILJS_PUBLIC_KEY = process.env.EMAILJS_PUBLIC_KEY || process.env.VITE_EMAILJS_PUBLIC_KEY || process.env.EMAILJS_USER_ID || 'G6gT9XDN4SFBz6oqW';
    const EMAILJS_PRIVATE_KEY = process.env.EMAILJS_PRIVATE_KEY;

    let emailDelivered = false;

    if (EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY) {
      try {
        const payload = {
          service_id: EMAILJS_SERVICE_ID,
          template_id: EMAILJS_TEMPLATE_ID,
          user_id: EMAILJS_PUBLIC_KEY,
          template_params: {
            to_email: email,
            to_name: customerName,
            user_email: email,
            user_name: customerName,
            subject: `Namaste ${customerName}, Your Verification OTP is ${otp} - Mahalaxmi Enterprises`,
            headline: 'Your Verification Code',
            code_box: otp,
            subtext: 'Valid for 5 minutes only',
            otp: otp,
            passcode: otp,
            verification_code: otp,
            items_block: '',
            message: `Use the One-Time Password (OTP) below to securely verify your account on Mahalaxmi Enterprises.`
          }
        };
        if (EMAILJS_PRIVATE_KEY) {
          payload.accessToken = EMAILJS_PRIVATE_KEY;
        }

        let emailJsRes = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Origin': 'https://mahalaxmimanufacturer.com'
          },
          body: JSON.stringify(payload)
        });

        if (emailJsRes.ok) {
          emailDelivered = true;
          console.log(`[EmailJS] OTP ${otp} dispatched successfully to ${email}`);
        } else {
          // If primary template fails, auto-fallback to template_rxzob8r
          if (EMAILJS_TEMPLATE_ID !== 'template_rxzob8r') {
            payload.template_id = 'template_rxzob8r';
            const retryRes = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Origin': 'https://mahalaxmimanufacturer.com'
              },
              body: JSON.stringify(payload)
            });
            if (retryRes.ok) {
              emailDelivered = true;
              console.log(`[EmailJS] OTP ${otp} dispatched via fallback template_rxzob8r to ${email}`);
            }
          }
        }
      } catch (ejsErr) {
        console.warn('[EmailJS] Network error:', ejsErr);
      }
    }

    if (!emailDelivered) {
      return res.status(503).json({
        success: false,
        delivered: false,
        message: 'Unable to send verification code. Please try again later.'
      });
    }

    return res.status(200).json({
      success: true,
      delivered: true,
      provider: 'emailjs',
      message: `Verification code sent to ${email} via EmailJS`
    });

  } catch (error) {
    console.error('Error in send-otp handler:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process OTP request'
    });
  }
}
