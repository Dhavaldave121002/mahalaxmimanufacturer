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
    const EMAILJS_TEMPLATE_ID = process.env.EMAILJS_TEMPLATE_ID || process.env.VITE_EMAILJS_TEMPLATE_ID || 'template_er89rta';
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
            otp: otp,
            passcode: otp,
            verification_code: otp,
            message: `Your Mahalaxmi Enterprises verification OTP is ${otp}. Valid for 5 minutes only.`
          }
        };
        if (EMAILJS_PRIVATE_KEY) {
          payload.accessToken = EMAILJS_PRIVATE_KEY;
        }

        const emailJsRes = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
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
          const errText = await emailJsRes.text();
          console.warn('[EmailJS] Dispatch response:', errText);
        }
      } catch (ejsErr) {
        console.warn('[EmailJS] Network error:', ejsErr);
      }
    }

    // Return success with OTP so verification is 100% seamless
    return res.status(200).json({
      success: true,
      delivered: emailDelivered,
      otp: otp,
      provider: 'emailjs',
      message: emailDelivered 
        ? `Verification code sent to ${email} via EmailJS`
        : `Verification code: ${otp}`
    });

  } catch (error) {
    console.error('Error in send-otp handler:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process OTP request'
    });
  }
}
