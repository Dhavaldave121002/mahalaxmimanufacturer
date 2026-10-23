import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { sendOtpEmail } from '../utils/sendOtpEmail';
import {
  Lock,
  Mail,
  Phone,
  User as UserIcon,
  Building2,
  FileText,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
  KeyRound,
  AlertCircle,
  Truck,
  Zap,
  HelpCircle,
  MessageSquare,
  X
} from 'lucide-react';

interface LoginPageProps {
  defaultTab?: 'login' | 'register' | 'forgot';
}

export const LoginPage: React.FC<LoginPageProps> = ({ defaultTab = 'login' }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/account';

  const { login, register, resetPassword, requestOtp, currentUser, isLoggedIn, registeredUsers } = useApp();

  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'forgot'>(defaultTab);

  // Sync tab if prop changes
  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab]);

  // Login form state
  const [loginMode, setLoginMode] = useState<'password' | 'otp'>('password');
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginOtp, setLoginOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Register form state
  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    isBusiness: false,
    companyName: '',
    gstNumber: '',
    businessType: 'Retailer' as const
  });
  const [registerOtpSent, setRegisterOtpSent] = useState(false);
  const [registerOtp, setRegisterOtp] = useState('');
  const [expectedRegisterOtp, setExpectedRegisterOtp] = useState<string | null>(null);

  // Forgot password form state
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotOtpSent, setForgotOtpSent] = useState(false);
  const [expectedForgotOtp, setExpectedForgotOtp] = useState<string | null>(null);

  // Status feedback
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // If already logged in, show notification banner
  useEffect(() => {
    if (isLoggedIn && !searchParams.get('reauth')) {
      // User can remain or click to account
    }
  }, [isLoggedIn, searchParams]);

  const clearMessages = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const [expectedLoginOtp, setExpectedLoginOtp] = useState<string | null>(null);

  // 1. Handle Login
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!loginIdentifier.trim()) {
      setErrorMsg('Please enter your registered email address.');
      return;
    }

    if (loginMode === 'otp') {
      if (!loginOtp.trim()) {
        setErrorMsg('Please enter the 4-digit verification code sent to your email.');
        return;
      }
      if (expectedLoginOtp && loginOtp.trim() !== expectedLoginOtp) {
        setErrorMsg('Incorrect OTP! Please check the 4-digit code received in your email.');
        return;
      }
    }

    const effectivePassword = loginMode === 'password' ? loginPassword : undefined;
    const effectiveOtp = loginMode === 'otp' ? loginOtp.trim() : undefined;

    setLoading(true);
    setTimeout(() => {
      const res = login(
        loginIdentifier,
        effectivePassword,
        effectiveOtp
      );

      setLoading(false);
      if (res.success) {
        setSuccessMsg(res.message);
        setTimeout(() => {
          navigate(redirectPath);
        }, 800);
      } else {
        setErrorMsg(res.message);
      }
    }, 400);
  };

  // Send Login OTP via Real Email
  const handleSendLoginOtp = async () => {
    clearMessages();
    if (import.meta.env.PROD) {
      setErrorMsg('Customer OTP sign-in is unavailable until server-side authentication is configured.');
      return;
    }
    const id = loginIdentifier.trim().toLowerCase();
    if (!id) {
      setErrorMsg('Please enter your registered email address first.');
      return;
    }

    if (!id.includes('@')) {
      setErrorMsg('Please enter a valid email address (e.g. name@example.com).');
      return;
    }

    // Check if email is registered in system
    const isRegistered = registeredUsers.some(
      u => u.email.toLowerCase() === id || u.phone.includes(id)
    );

    if (!isRegistered) {
      setErrorMsg('Email address not registered! Please enter a registered email or click "Create Account" to sign up.');
      return;
    }

    setLoading(true);
    const generatedCode = Math.floor(1000 + Math.random() * 9000).toString();

    const matchedUser = registeredUsers.find(u => u.email.toLowerCase() === id.toLowerCase() || u.phone === id);
    const customerDisplayName = matchedUser?.name || (id.includes('@') ? id.split('@')[0].replace(/[._]/g, ' ') : 'Valued Customer');

    try {
      const result = await sendOtpEmail(id, generatedCode, customerDisplayName);
      setLoading(false);
      if (!result.delivered) {
        setErrorMsg(result.message);
        return;
      }
      setExpectedLoginOtp(generatedCode);
      setLoginOtp('');
      setOtpSent(true);
      setSuccessMsg(result.message);
    } catch (error) {
      console.error('Login OTP delivery failed:', error);
      setLoading(false);
      setErrorMsg('Unable to send the verification code. Please try again later.');
    }
  };

  // 2. Handle Registration with Email OTP Verification
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (import.meta.env.PROD) {
      setErrorMsg('Customer registration is unavailable until server-side authentication is configured.');
      return;
    }

    if (!registerForm.name.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!registerForm.phone.trim() || registerForm.phone.replace(/\\D/g, '').length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }
    const cleanEmail = registerForm.email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (registerForm.password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }
    if (registerForm.password !== registerForm.confirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter.');
      return;
    }
    if (registerForm.isBusiness && registerForm.gstNumber && registerForm.gstNumber.trim().length !== 15) {
      setErrorMsg('GSTIN must be exactly 15 alphanumeric characters (e.g. 24AABCP1357K1ZT).');
      return;
    }

    // Check if email already registered
    const alreadyExists = registeredUsers.some(
      u => u.email.toLowerCase() === cleanEmail
    );
    if (alreadyExists) {
      setErrorMsg('This email address is already registered! Please sign in or reset your password.');
      return;
    }

    // Step 1: Send Email Verification OTP if not sent yet
    if (!registerOtpSent) {
      setLoading(true);
      const generatedCode = Math.floor(1000 + Math.random() * 9000).toString();

      try {
        const result = await sendOtpEmail(cleanEmail, generatedCode, registerForm.name.trim());
        setLoading(false);
        if (!result.delivered) {
          setErrorMsg(result.message);
          return;
        }
        setExpectedRegisterOtp(generatedCode);
        setRegisterOtp('');
        setRegisterOtpSent(true);
        setSuccessMsg(result.message);
      } catch (error) {
        console.error('Registration OTP delivery failed:', error);
        setLoading(false);
        setErrorMsg('Unable to send the verification code. Please try again later.');
      }
      return;
    }

    // Step 2: Verify entered Email OTP
    if (!registerOtp.trim()) {
      setErrorMsg('Please enter the 4-digit verification code sent to your email.');
      return;
    }

    if (expectedRegisterOtp && registerOtp.trim() !== expectedRegisterOtp) {
      setErrorMsg('Incorrect OTP! Please check the 4-digit code received in your email.');
      return;
    }

    // Step 3: Complete registration on verified OTP
    setLoading(true);
    setTimeout(() => {
      const res = register({
        name: registerForm.name,
        email: cleanEmail,
        phone: registerForm.phone,
        password: registerForm.password,
        businessType: registerForm.isBusiness ? registerForm.businessType : 'Individual',
        companyName: registerForm.companyName,
        gstNumber: registerForm.gstNumber,
        role: registerForm.isBusiness ? 'retailer' : 'consumer'
      });

      setLoading(false);
      if (res.success) {
        setSuccessMsg(`🎉 Account verified & created! Welcome to Mahalaxmi Enterprises, ${registerForm.name}.`);
        setTimeout(() => {
          navigate(redirectPath);
        }, 800);
      } else {
        setErrorMsg(res.message);
      }
    }, 450);
  };

  // 3. Handle Forgot Password
  const handleSendForgotOtp = async () => {
    clearMessages();
    if (import.meta.env.PROD) {
      setErrorMsg('Password recovery is unavailable until server-side authentication is configured.');
      return;
    }
    const id = forgotIdentifier.trim().toLowerCase();
    if (!id || !id.includes('@')) {
      setErrorMsg('Please enter your registered email address.');
      return;
    }

    const isRegistered = registeredUsers.some(u => u.email.toLowerCase() === id);
    if (!isRegistered) {
      setErrorMsg('Email address not registered! Please enter a registered email.');
      return;
    }

    setLoading(true);
    const genCode = Math.floor(1000 + Math.random() * 9000).toString();

    const matchedUser = registeredUsers.find(u => u.email.toLowerCase() === id.toLowerCase() || u.phone === id);
    const customerDisplayName = matchedUser?.name || (id.includes('@') ? id.split('@')[0].replace(/[._]/g, ' ') : 'Valued Customer');

    try {
      const result = await sendOtpEmail(id, genCode, customerDisplayName);
      setLoading(false);
      if (!result.delivered) {
        setErrorMsg(result.message);
        return;
      }
      setExpectedForgotOtp(genCode);
      setForgotOtp('');
      setForgotOtpSent(true);
      setSuccessMsg(result.message);
    } catch (error) {
      console.error('Password reset OTP delivery failed:', error);
      setLoading(false);
      setErrorMsg('Unable to send the verification code. Please try again later.');
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (import.meta.env.PROD) {
      setErrorMsg('Password recovery is unavailable until server-side authentication is configured.');
      return;
    }

    if (!forgotIdentifier.trim()) {
      setErrorMsg('Please enter your registered email.');
      return;
    }
    if (!forgotOtp.trim()) {
      setErrorMsg('Please enter the 4-digit verification code sent to your email.');
      return;
    }
    if (expectedForgotOtp && forgotOtp.trim() !== expectedForgotOtp) {
      setErrorMsg('Incorrect OTP! Please check the code received in your email.');
      return;
    }
    if (!forgotNewPassword || forgotNewPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const res = resetPassword(forgotIdentifier, forgotOtp.trim(), forgotNewPassword);
      setLoading(false);
      if (res.success) {
        setSuccessMsg(res.message);
        setTimeout(() => {
          setActiveTab('login');
          setLoginIdentifier(forgotIdentifier);
          setLoginPassword(forgotNewPassword);
        }, 1200);
      } else {
        setErrorMsg(res.message);
      }
    }, 450);
  };


  return (
    <div className="min-h-[85vh] py-8 sm:py-12 px-4 sm:px-6 flex items-center justify-center relative">

      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left Side: Brand Value Proposition & Trust Badges */}
        <div className="lg:col-span-5 bg-gradient-to-br from-navy via-navy-800 to-indigo-dark text-white rounded-3xl p-6 sm:p-10 flex flex-col justify-between shadow-premium relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo/20 rounded-full blur-3xl pointer-events-none" />
          
          <div className="space-y-6 relative z-10">
            <Link to="/" className="inline-flex items-center gap-2.5">
              <img
                src="/logo.png"
                alt="Mahalaxmi Enterprises Logo"
                className="w-11 h-11 rounded-full object-cover shadow-sm border border-champagne/50"
              />
              <div className="flex flex-col text-left">
                <span className="font-black text-lg tracking-tight text-white leading-none">
                  MAHALAXMI ENTERPRISES
                </span>
                <span className="text-[9px] font-extrabold text-champagne uppercase tracking-widest mt-0.5">
                  Direct Mill Rates & Portal
                </span>
              </div>
            </Link>

            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                {activeTab === 'login' && 'Sign in to access direct factory rates'}
                {activeTab === 'register' && 'Create your direct mill account'}
                {activeTab === 'forgot' && 'Reset your commercial account password'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Source 300 TC bedsheets, 600 GSM bath towels, and institutional linen directly from Ahmedabad with zero middlemen markup.
              </p>
            </div>

            {/* Value Pillars */}
            <div className="space-y-3.5 pt-2 text-xs">
              <div className="flex items-start gap-3 bg-white/10 p-3 rounded-2xl border border-white/10">
                <Zap className="w-4 h-4 text-champagne shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white">Up to 46% Direct Mill Margin</p>
                  <p className="text-slate-300 text-[11px]">Factory-direct tiered pricing with low minimum orders (10 Pcs).</p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-white/10 p-3 rounded-2xl border border-white/10">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white">GST Tax Invoicing</p>
                  <p className="text-slate-300 text-[11px]">Download tax invoices with your GSTIN and HSN details.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-white/10 p-3 rounded-2xl border border-white/10">
                <Truck className="w-4 h-4 text-champagne shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white">48-Hour Priority Dispatch</p>
                  <p className="text-slate-300 text-[11px]">Direct road express across 19,000+ PIN codes across India.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Verified Official Manufacturer Trust Banner */}
          <div className="pt-4 mt-6 border-t border-white/15 relative z-10">
            <div className="flex items-center gap-2 text-champagne text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Official Direct Mill Account • GST Invoice Backed</span>
            </div>
          </div>
        </div>

        {/* Right Side: Interactive Auth Forms Container */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-card flex flex-col justify-between">
          
          <div>
            {/* Top Navigation Tabs */}
            <div className="flex border-b border-slate-200 gap-6 mb-6">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('login');
                  clearMessages();
                }}
                className={`pb-3 font-bold text-sm transition relative cursor-pointer ${
                  activeTab === 'login'
                    ? 'text-navy border-b-2 border-indigo'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('register');
                  clearMessages();
                }}
                className={`pb-3 font-bold text-sm transition relative cursor-pointer ${
                  activeTab === 'register'
                    ? 'text-navy border-b-2 border-indigo'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                Create Account
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('forgot');
                  clearMessages();
                }}
                className={`pb-3 font-bold text-sm transition relative cursor-pointer ${
                  activeTab === 'forgot'
                    ? 'text-navy border-b-2 border-indigo'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                Reset Password
              </button>
            </div>

            {/* Error & Success Notification Banners */}
            {errorMsg && (
              <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2.5 text-xs text-red-700 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-error shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-800 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* ========================================================
                TAB 1: SIGN IN / LOGIN FORM
                ======================================================== */}
            {activeTab === 'login' && (
              <div className="space-y-5">
                <div className="p-3 bg-indigo/5 border border-indigo/20 text-navy rounded-2xl flex items-center gap-2.5 text-xs font-semibold">
                  <ShieldCheck className="w-4 h-4 text-indigo shrink-0" />
                  <span>Secure Email Verification active. OTP is sent to your registered email address.</span>
                </div>

                {/* Mode Selector: Password vs Instant OTP */}
                <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setLoginMode('password');
                      clearMessages();
                    }}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      loginMode === 'password'
                        ? 'bg-white text-navy shadow-sm'
                        : 'text-slate-500 hover:text-navy'
                    }`}
                  >
                    Password Login
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginMode('otp');
                      clearMessages();
                    }}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      loginMode === 'otp'
                        ? 'bg-white text-navy shadow-sm'
                        : 'text-slate-500 hover:text-navy'
                    }`}
                  >
                    Email OTP Login
                  </button>
                </div>

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  {/* Identifier Field (Email or Mobile) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                      <span>{loginMode === 'otp' ? 'Registered Email Address' : 'Email Address or Mobile'}</span>
                      <span className="text-[10px] text-slate-400">e.g. you@example.com</span>
                    </label>
                    <div className="relative flex items-center">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                      <input
                        type="text"
                        value={loginIdentifier}
                        onChange={e => setLoginIdentifier(e.target.value)}
                        placeholder="Enter registered email address"
                        className="w-full text-xs sm:text-sm pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-indigo focus:ring-2 focus:ring-indigo/20 outline-none transition"
                        required
                      />
                    </div>
                  </div>

                  {/* Password Mode Fields */}
                  {loginMode === 'password' && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700">Password</label>
                        <button
                          type="button"
                          onClick={() => setActiveTab('forgot')}
                          className="text-[11px] font-bold text-indigo hover:underline cursor-pointer"
                        >
                          Forgot Password?
                        </button>
                      </div>
                      <div className="relative flex items-center">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={loginPassword}
                          onChange={e => setLoginPassword(e.target.value)}
                          placeholder="Enter your account password"
                          className="w-full text-xs sm:text-sm pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 focus:border-indigo focus:ring-2 focus:ring-indigo/20 outline-none transition"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 text-slate-400 hover:text-slate-600 p-1"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* OTP Mode Fields */}
                  {loginMode === 'otp' && (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            maxLength={4}
                            value={loginOtp}
                            onChange={e => setLoginOtp(e.target.value.replace(/\D/g, ''))}
                            placeholder="Enter 4-digit code sent to email"
                            className="w-full text-center font-mono tracking-widest text-sm py-2.5 rounded-xl border border-slate-300 focus:border-indigo focus:ring-2 focus:ring-indigo/20 outline-none"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleSendLoginOtp}
                          className="px-4 py-2.5 bg-indigo hover:bg-indigo-dark text-white font-bold text-xs rounded-xl transition shrink-0 cursor-pointer"
                        >
                          {otpSent ? 'Resend OTP' : 'Send OTP'}
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-indigo" />
                        Check your email inbox for the 4-digit verification code.
                      </p>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-navy hover:bg-navy-800 text-white py-3 rounded-xl font-bold text-sm transition shadow-premium flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Sign In to Account</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                <div className="text-center pt-2">
                  <p className="text-xs text-slate-500">
                    Don't have an account yet?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('register');
                        clearMessages();
                      }}
                      className="font-bold text-indigo hover:underline cursor-pointer"
                    >
                      Register Now (Takes 30 seconds)
                    </button>
                  </p>
                </div>
              </div>
            )}

            {/* ========================================================
                TAB 2: REGISTER / CREATE ACCOUNT
                ======================================================== */}
            {activeTab === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Full Name *</label>
                    <div className="relative flex items-center">
                      <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                      <input
                        type="text"
                        value={registerForm.name}
                        onChange={e => setRegisterForm({ ...registerForm, name: e.target.value })}
                        placeholder="e.g. Ramesh Patel"
                        className="w-full text-xs sm:text-sm pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 focus:border-indigo outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Mobile Number (10 Digits) *</label>
                    <div className="relative flex items-center">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                      <input
                        type="tel"
                        maxLength={13}
                        value={registerForm.phone}
                        onChange={e => setRegisterForm({ ...registerForm, phone: e.target.value })}
                        placeholder="e.g. 98201 12345"
                        className="w-full text-xs sm:text-sm pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 focus:border-indigo outline-none"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Email Address *</label>
                  <div className="relative flex items-center">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                    <input
                      type="email"
                      value={registerForm.email}
                      onChange={e => setRegisterForm({ ...registerForm, email: e.target.value })}
                      placeholder="e.g. ramesh@pateltextiles.com"
                      className="w-full text-xs sm:text-sm pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 focus:border-indigo outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Create Password *</label>
                    <input
                      type="password"
                      value={registerForm.password}
                      onChange={e => setRegisterForm({ ...registerForm, password: e.target.value })}
                      placeholder="Min 6 characters"
                      className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo outline-none"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Confirm Password *</label>
                    <input
                      type="password"
                      value={registerForm.confirmPassword}
                      onChange={e => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                      placeholder="Re-enter password"
                      className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo outline-none"
                      required
                    />
                  </div>
                </div>

                {/* Commercial B2B Account Checkbox */}
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-3">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={registerForm.isBusiness}
                      onChange={e => setRegisterForm({ ...registerForm, isBusiness: e.target.checked })}
                      className="w-4 h-4 text-indigo rounded focus:ring-indigo cursor-pointer"
                    />
                    <span className="text-xs font-bold text-navy">
                      I am purchasing for a Business / Store / Hotel (Enable GST Invoicing)
                    </span>
                  </label>

                  {registerForm.isBusiness && (
                    <div className="space-y-3 pt-2 border-t border-slate-200 animate-in fade-in">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-600">Company / Shop Name</label>
                          <input
                            type="text"
                            value={registerForm.companyName}
                            onChange={e => setRegisterForm({ ...registerForm, companyName: e.target.value })}
                            placeholder="e.g. Patel Handlooms"
                            className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-600">GSTIN Number (Optional)</label>
                          <input
                            type="text"
                            maxLength={15}
                            value={registerForm.gstNumber}
                            onChange={e => setRegisterForm({ ...registerForm, gstNumber: e.target.value.toUpperCase() })}
                            placeholder="15-digit GSTIN"
                            className="w-full text-xs font-mono px-3 py-2 rounded-lg border border-slate-300 outline-none uppercase"
                          />
                        </div>
                      </div>
                      <p className="text-[10px] text-emerald-700 font-medium">
                        ✓ Your registered GSTIN can be included on eligible business invoices.
                      </p>
                    </div>
                  )}
                </div>

                {/* Email Verification OTP Section */}
                {registerOtpSent && (
                  <div className="p-4 bg-indigo/5 border-2 border-indigo/30 rounded-2xl space-y-2.5 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-navy flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-indigo" />
                        <span>Enter Email Verification OTP (4 Digits) *</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setRegisterOtpSent(false);
                          setRegisterOtp('');
                        }}
                        className="text-[11px] font-bold text-slate-500 hover:text-indigo cursor-pointer"
                      >
                        Change Email
                      </button>
                    </div>
                    <div className="relative flex items-center">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                      <input
                        type="text"
                        maxLength={4}
                        value={registerOtp}
                        onChange={e => setRegisterOtp(e.target.value.replace(/\D/g, ''))}
                        placeholder="Enter 4-digit code from email"
                        className="w-full text-base sm:text-lg tracking-widest font-mono text-center pl-10 pr-4 py-2.5 rounded-xl border-2 border-indigo/40 bg-white focus:border-indigo outline-none font-bold text-navy"
                        required
                        autoFocus
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Code sent to {registerForm.email}</span>
                      <button
                        type="button"
                        disabled={loading}
                        onClick={async () => {
                          const genOtp = Math.floor(1000 + Math.random() * 9000).toString();
                          setLoading(true);
                          try {
                            const result = await sendOtpEmail(registerForm.email.trim().toLowerCase(), genOtp, registerForm.name.trim());
                            setLoading(false);
                            if (!result.delivered) {
                              setErrorMsg(result.message);
                              return;
                            }
                            setExpectedRegisterOtp(genOtp);
                            setSuccessMsg(result.message);
                          } catch (error) {
                            console.error('Registration OTP resend failed:', error);
                            setLoading(false);
                            setErrorMsg('Unable to send the verification code. Please try again later.');
                          }
                        }}
                        className="text-indigo font-bold hover:underline cursor-pointer"
                      >
                        Resend OTP
                      </button>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo hover:bg-indigo-dark text-white py-3 rounded-xl font-bold text-sm transition shadow-premium flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>{registerOtpSent ? 'Verify OTP & Complete Registration' : 'Verify Email & Create Account'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="text-center pt-1">
                  <p className="text-xs text-slate-500">
                    Already registered?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('login');
                        clearMessages();
                      }}
                      className="font-bold text-navy hover:underline cursor-pointer"
                    >
                      Sign In here
                    </button>
                  </p>
                </div>
              </form>
            )}

            {/* ========================================================
                TAB 3: FORGOT PASSWORD / OTP RESET
                ======================================================== */}
            {activeTab === 'forgot' && (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Registered Email Address</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                      <input
                        type="email"
                        value={forgotIdentifier}
                        onChange={e => setForgotIdentifier(e.target.value)}
                        placeholder="Enter your registered email address"
                        className="w-full text-xs sm:text-sm pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 focus:border-indigo outline-none"
                        required
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleSendForgotOtp}
                      className="px-4 py-2.5 bg-indigo hover:bg-indigo-dark text-white font-bold text-xs rounded-xl transition shrink-0 cursor-pointer"
                    >
                      {forgotOtpSent ? 'Resend' : 'Send Code'}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">4-Digit Verification Code</label>
                  <input
                    type="text"
                    maxLength={4}
                    value={forgotOtp}
                    onChange={e => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 4-digit code sent to email"
                    className="w-full text-center font-mono tracking-widest text-sm py-2.5 rounded-xl border border-slate-300 focus:border-indigo outline-none"
                    required
                  />
                  <p className="text-[10px] text-slate-400">
                    Enter the 4-digit verification code sent to your registered email inbox.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Enter New Password</label>
                  <div className="relative flex items-center">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                    <input
                      type="password"
                      value={forgotNewPassword}
                      onChange={e => setForgotNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full text-xs sm:text-sm pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-indigo outline-none"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-navy hover:bg-navy-800 text-white py-3 rounded-xl font-bold text-sm transition shadow-premium flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>Update Password & Proceed to Login</span>
                  )}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('login');
                      clearMessages();
                    }}
                    className="text-xs font-bold text-indigo hover:underline cursor-pointer"
                  >
                    ← Back to Sign In
                  </button>
                </div>
              </form>
            )}

          </div>

          {/* Secure Footer Info */}
          <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              256-bit SSL Direct Mill Encryption
            </span>
            <span>Ahmedabad Mill Desk: +91 94291 87611</span>
          </div>

        </div>

      </div>
    </div>
  );
};
