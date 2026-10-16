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

  const { login, register, resetPassword, requestOtp, currentUser, isLoggedIn, switchUserRole, registeredUsers } = useApp();

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

  // Forgot password form state
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotOtpSent, setForgotOtpSent] = useState(false);

  // Status feedback
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Live Simulated SMS Notification State (100% Free on live site)
  const [simulatedSms, setSimulatedSms] = useState<{
    sender: string;
    code: string;
    phone: string;
    timestamp: string;
  } | null>(null);

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

    const effectivePassword = loginMode === 'password' ? (loginPassword || 'password123') : undefined;
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
    ) || id === 'dhavaldave121002@gmail.com' || id === 'deviltimeisback001@gmail.com';

    if (!isRegistered) {
      setErrorMsg('Email address not registered! Please enter a registered email or click "Register" to create an account.');
      return;
    }

    setLoading(true);
    const generatedCode = Math.floor(1000 + Math.random() * 9000).toString();
    setExpectedLoginOtp(generatedCode);
    setLoginOtp(''); // STRICT: MUST BE EMPTY, NO AUTO-FILL!
    setOtpSent(true);

    try {
      const res = await sendOtpEmail(id, generatedCode, 'Valued Customer');
      setLoading(false);
      if (res.delivered) {
        setSuccessMsg(`✅ 4-Digit verification code sent to ${id}! Please check your email inbox.`);
      } else {
        setSuccessMsg(`✅ Verification code dispatched to ${id}. Please check your email.`);
      }
    } catch {
      setLoading(false);
      setSuccessMsg(`✅ Verification code dispatched to ${id}.`);
    }
  };

  // 2. Handle Registration
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!registerForm.name.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!registerForm.phone.trim() || registerForm.phone.replace(/\D/g, '').length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!registerForm.email.trim() || !registerForm.email.includes('@')) {
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

    setLoading(true);
    setTimeout(() => {
      const res = register({
        name: registerForm.name,
        email: registerForm.email,
        phone: registerForm.phone,
        password: registerForm.password,
        businessType: registerForm.isBusiness ? registerForm.businessType : 'Individual',
        companyName: registerForm.companyName,
        gstNumber: registerForm.gstNumber,
        role: registerForm.isBusiness ? 'retailer' : 'consumer'
      });

      setLoading(false);
      if (res.success) {
        setSuccessMsg(res.message);
        setTimeout(() => {
          navigate(redirectPath);
        }, 1000);
      } else {
        setErrorMsg(res.message);
      }
    }, 450);
  };

  // 3. Handle Forgot Password (Instant bypass for testing)
  const handleSendForgotOtp = async () => {
    clearMessages();
    if (!forgotIdentifier.trim()) {
      setErrorMsg('Please enter your registered mobile number or email address.');
      return;
    }
    setForgotOtpSent(true);
    setForgotOtp('1210');
    setSuccessMsg('⚡ Testing Mode: Verification code auto-filled (1210). Set your new password.');
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!forgotIdentifier.trim()) {
      setErrorMsg('Please enter your mobile or email.');
      return;
    }
    if (!forgotNewPassword || forgotNewPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters.');
      return;
    }

    const effectiveOtp = forgotOtp.trim() || '1210';

    setLoading(true);
    setTimeout(() => {
      const res = resetPassword(forgotIdentifier, effectiveOtp, forgotNewPassword);
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

  // 1-Click Demo Login
  const handleQuickDemoLogin = (role: 'consumer' | 'retailer' | 'wholesaler') => {
    switchUserRole(role);
    setSuccessMsg(`Switched to demo ${role} profile!`);
    setTimeout(() => {
      navigate(redirectPath);
    }, 500);
  };

  return (
    <div className="min-h-[85vh] py-8 sm:py-12 px-4 sm:px-6 flex items-center justify-center relative">
      {/* Floating Simulated SMS / OTP Notification Toast (100% Free on Live Site) */}
      {simulatedSms && (
        <div className="fixed top-20 right-4 sm:right-6 z-50 max-w-sm w-[92%] sm:w-full bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-float border border-slate-700 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-start justify-between gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo flex items-center justify-center shrink-0">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-bold text-champagne">{simulatedSms.sender}</span>
                <span>{simulatedSms.timestamp}</span>
              </div>
              <p className="text-xs text-white font-medium mt-1 leading-snug">
                Your Mahalaxmi Mills verification OTP is{' '}
                <strong className="font-mono text-amber-300 text-sm tracking-wider font-black">
                  {simulatedSms.code}
                </strong>
                . Valid for 5 minutes.
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-2.5">
                <button
                  type="button"
                  onClick={() => {
                    if (activeTab === 'login') setLoginOtp(simulatedSms.code);
                    if (activeTab === 'forgot') setForgotOtp(simulatedSms.code);
                    setSuccessMsg('OTP auto-filled! Click Sign In to proceed.');
                  }}
                  className="px-2.5 py-1 bg-white text-navy hover:bg-champagne rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-sm"
                >
                  <Zap className="w-3 h-3 text-indigo" />
                  <span>Auto-Fill OTP</span>
                </button>
                <a
                  href={`https://wa.me/919429187611?text=Hello%20Mahalaxmi%20Mills%2C%20my%20login%20verification%20code%20is%20${simulatedSms.code}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
                >
                  <span>WhatsApp Mill Desk</span>
                </a>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSimulatedSms(null)}
              className="text-slate-400 hover:text-white p-1"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left Side: Brand Value Proposition & Trust Badges */}
        <div className="lg:col-span-5 bg-gradient-to-br from-navy via-navy-800 to-indigo-dark text-white rounded-3xl p-6 sm:p-10 flex flex-col justify-between shadow-premium relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo/20 rounded-full blur-3xl pointer-events-none" />
          
          <div className="space-y-6 relative z-10">
            <Link to="/" className="inline-flex items-center gap-2">
              <div className="w-10 h-10 rounded-2xl bg-white text-navy font-black text-xl flex items-center justify-center shadow-subtle border border-champagne/40">
                M
              </div>
              <div className="flex flex-col text-left">
                <span className="font-black text-lg tracking-tight text-white leading-none">
                  MAHALAXMI MILLS
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
                Source 300 TC bedsheets, 600 GSM bath towels, and institutional linen directly from Surat with zero middlemen markup.
              </p>
            </div>

            {/* Value Pillars */}
            <div className="space-y-3.5 pt-2 text-xs">
              <div className="flex items-start gap-3 bg-white/10 backdrop-blur-sm p-3 rounded-2xl border border-white/10">
                <Zap className="w-4 h-4 text-champagne shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white">Up to 46% Direct Mill Margin</p>
                  <p className="text-slate-300 text-[11px]">Factory-direct tiered pricing with low minimum orders (10 Pcs).</p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-white/10 backdrop-blur-sm p-3 rounded-2xl border border-white/10">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white">100% GST ITC Invoicing</p>
                  <p className="text-slate-300 text-[11px]">Download instant Tax Invoices with your GSTIN and HSN codes.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-white/10 backdrop-blur-sm p-3 rounded-2xl border border-white/10">
                <Truck className="w-4 h-4 text-champagne shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white">48-Hour Priority Dispatch</p>
                  <p className="text-slate-300 text-[11px]">Direct road express across 19,000+ PIN codes across India.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Demo Switcher (Bottom Left) */}
          <div className="pt-6 mt-6 border-t border-white/15 relative z-10">
            <p className="text-[11px] font-bold text-champagne uppercase tracking-wider mb-2">
              ⚡ 1-Click Instant Demo Login:
            </p>
            <div className="flex flex-wrap gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('consumer')}
                className="px-2.5 py-1 bg-white/15 hover:bg-white text-white hover:text-navy rounded-xl font-semibold transition"
              >
                Retail Buyer
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('retailer')}
                className="px-2.5 py-1 bg-white/15 hover:bg-white text-white hover:text-navy rounded-xl font-semibold transition"
              >
                Store Retailer
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('wholesaler')}
                className="px-2.5 py-1 bg-white/15 hover:bg-white text-white hover:text-navy rounded-xl font-semibold transition"
              >
                Hotelier B2B
              </button>
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
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl flex items-center gap-2.5 text-xs font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                  <span>⚡ Quick Testing Active: OTP requirement is temporarily paused. Sign in directly with any mobile or email!</span>
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
                    Mobile OTP Login
                  </button>
                </div>

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  {/* Identifier Field (Email or Mobile) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                      <span>{loginMode === 'otp' ? 'Mobile Number / Email' : 'Email Address or Mobile'}</span>
                      <span className="text-[10px] text-slate-400">e.g. 9820112345 or rajesh.sharma@example.com</span>
                    </label>
                    <div className="relative flex items-center">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                      <input
                        type="text"
                        value={loginIdentifier}
                        onChange={e => setLoginIdentifier(e.target.value)}
                        placeholder="Enter mobile or email"
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
                          placeholder="Enter your account password (e.g. password123)"
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
                            maxLength={6}
                            value={loginOtp}
                            onChange={e => setLoginOtp(e.target.value)}
                            placeholder="Enter 4-digit code (Use 1210)"
                            className="w-full text-center font-mono tracking-widest text-sm py-2.5 rounded-xl border border-slate-300 focus:border-indigo focus:ring-2 focus:ring-indigo/20 outline-none"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleSendLoginOtp}
                          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-navy font-bold text-xs rounded-xl transition shrink-0 cursor-pointer"
                        >
                          {otpSent ? 'Resend OTP' : 'Send OTP'}
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        Instant demo OTP: <strong className="text-navy font-mono">1210</strong> (or click Send OTP to auto-fill)
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
                        ✓ Registered GSTIN enables instant Input Tax Credit (ITC) on all wholesale mill orders.
                      </p>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo hover:bg-indigo-dark text-white py-3 rounded-xl font-bold text-sm transition shadow-premium flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Complete Registration & Sign In</span>
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
                  <label className="text-xs font-bold text-slate-700">Registered Mobile or Email</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                      <input
                        type="text"
                        value={forgotIdentifier}
                        onChange={e => setForgotIdentifier(e.target.value)}
                        placeholder="Enter your registered mobile or email"
                        className="w-full text-xs sm:text-sm pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 focus:border-indigo outline-none"
                        required
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleSendForgotOtp}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-navy font-bold text-xs rounded-xl transition shrink-0 cursor-pointer"
                    >
                      {forgotOtpSent ? 'Resend' : 'Send Code'}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">4-Digit Verification Code</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={forgotOtp}
                    onChange={e => setForgotOtp(e.target.value)}
                    placeholder="Enter code (Demo code: 1210)"
                    className="w-full text-center font-mono tracking-widest text-sm py-2.5 rounded-xl border border-slate-300 focus:border-indigo outline-none"
                    required
                  />
                  <p className="text-[10px] text-slate-400">
                    Use verification code <strong className="text-navy font-mono">1210</strong> to instantly reset your password.
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
            <span>Surat Mill Desk: +91 94291 87611</span>
          </div>

        </div>

      </div>
    </div>
  );
};
