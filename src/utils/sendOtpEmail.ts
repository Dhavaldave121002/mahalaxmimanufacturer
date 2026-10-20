/**
 * Real Email OTP Dispatcher
 * Calls the secure Vercel Serverless Function `/api/send-otp`
 * which uses Pure EmailJS to deliver official branded OTP emails.
 */
export const sendOtpEmail = async (
  email: string,
  otp: string,
  name: string = 'Valued Customer'
): Promise<{ success: boolean; delivered: boolean; message: string }> => {
  if (!email || !email.includes('@')) {
    return { success: false, delivered: false, message: 'Not an email address' };
  }

  // Dispatch via secure serverless endpoint
  try {
    const response = await fetch('/api/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp, name })
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        delivered: !!data.delivered,
        message: data.delivered
          ? `Real OTP email delivered to ${email}! Check your inbox & spam folder.`
          : data.warning || `OTP sent to ${email}`
      };
    } else {
      const errData = await response.json().catch(() => ({}));
      console.warn('API send-otp returned non-200:', errData);
      return {
        success: true,
        delivered: false,
        message: errData.message || `OTP generated for ${email}`
      };
    }
  } catch (e) {
    console.warn('/api/send-otp request failed:', e);
  }

  // Direct client-side EmailJS dispatch fallback (works even in local dev or without serverless)
  try {
    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_935pxzz';
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_rxzob8r';
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'G6gT9XDN4SFBz6oqW';

    if (serviceId && publicKey) {
      const ejsRes = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': window.location.origin
        },
        body: JSON.stringify({
          service_id: serviceId,
          template_id: templateId,
          user_id: publicKey,
          template_params: {
            to_email: email,
            to_name: name,
            subject: `Namaste ${name}, Your Verification OTP is ${otp} - Mahalaxmi Enterprises`,
            headline: 'Your Verification Code',
            code_box: otp,
            subtext: 'Valid for 5 minutes only',
            otp: otp,
            message: `Use the One-Time Password (OTP) below to securely verify your account on Mahalaxmi Enterprises.`
          }
        })
      });

      if (ejsRes.ok) {
        return {
          success: true,
          delivered: true,
          message: `Real OTP email delivered to ${email}! Check your inbox & spam folder.`
        };
      }
    }
  } catch (err) {
    console.warn('[EmailJS Direct Fallback Warning]:', err);
  }

  // Graceful fallback for local dev when offline
  return {
    success: true,
    delivered: false,
    message: `OTP generated for ${email}: ${otp}`
  };
};
