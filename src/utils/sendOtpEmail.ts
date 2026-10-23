/**
 * Real Email OTP Dispatcher
 * Calls the secure Vercel Serverless Function `/api/send-otp`
 * which uses EmailJS to deliver official branded OTP emails.
 */
export const sendOtpEmail = async (
  email: string,
  otp: string,
  name: string = 'Valued Customer'
): Promise<{ success: boolean; delivered: boolean; message: string }> => {
  if (!email || !email.includes('@')) {
    return { success: false, delivered: false, message: 'Not an email address' };
  }

  try {
    const response = await fetch('/api/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp, name })
    });
    const data = await response.json().catch(() => null);
    const delivered = response.ok && data?.success === true && data?.delivered === true;
    return {
      success: delivered,
      delivered,
      message: delivered
        ? `Verification code sent to ${email}. Check your inbox and spam folder.`
        : typeof data?.message === 'string'
          ? data.message
          : 'Unable to send the verification code. Please try again later.'
    };
  } catch (error) {
    console.warn('/api/send-otp request failed:', error);
    return {
      success: false,
      delivered: false,
      message: 'Unable to reach the email service. Please try again later.'
    };
  }
};
