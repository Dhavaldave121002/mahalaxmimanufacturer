import React from 'react';
import { Lock, Building2, Truck } from 'lucide-react';

interface PaymentTrustBadgesProps {
  showSslNotice?: boolean;
  className?: string;
}

// 1. Official UPI Logo (NPCI arrows + bold slanted UPI text)
const UpiLogo: React.FC = () => (
  <svg viewBox="0 0 70 22" className="h-4 w-auto max-h-4 object-contain" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* NPCI Forward Arrows */}
    <path d="M4 3L13 11L4 19L7 11L4 3Z" fill="#097939" />
    <path d="M9 3L18 11L9 19L12 11L9 3Z" fill="#ED7524" />
    {/* Slanted Bold UPI typography */}
    <g fill="#2D3748" transform="skewX(-8)">
      {/* U */}
      <path d="M25 4h3.6v7.2c0 1.8 1.1 2.8 2.8 2.8s2.8-1 2.8-2.8V4h3.6v7.2c0 3.8-2.6 5.8-6.4 5.8s-6.4-2-6.4-5.8V4z" />
      {/* P */}
      <path d="M41 4h5.6c3.2 0 5 1.7 5 4.5s-1.8 4.5-5 4.5h-2v4H41V4zm3.6 6h2c1.2 0 1.8-.6 1.8-1.5s-.6-1.5-1.8-1.5h-2V10z" />
      {/* I */}
      <path d="M54.5 4H58v13h-3.5V4z" />
    </g>
  </svg>
);

// 2. Official Google Pay Logo (4-color G mark + charcoal Pay text)
const GPayLogo: React.FC = () => (
  <svg viewBox="0 0 64 22" className="h-4 w-auto max-h-4 object-contain" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(1, 2)">
      {/* Google G */}
      <path d="M16 8.5c0-.55-.05-1.08-.14-1.6H9v3.02h3.93c-.17.92-.68 1.7-1.45 2.23v1.85h2.35c1.37-1.26 2.17-3.12 2.17-5.5z" fill="#4285F4"/>
      <path d="M9 15.6c1.97 0 3.63-.65 4.84-1.77l-2.35-1.85c-.65.44-1.49.7-2.49.7-1.92 0-3.55-1.29-4.13-3.03H2.43v1.91C3.65 14 6.11 15.6 9 15.6z" fill="#34A853"/>
      <path d="M4.87 9.65c-.15-.44-.24-.91-.24-1.4s.09-.96.24-1.4V4.94H2.43C1.94 5.92 1.66 7.02 1.66 8.25s.28 2.33.77 3.31l2.44-1.91z" fill="#FBBC05"/>
      <path d="M9 3.52c1.07 0 2.03.37 2.79 1.09l2.09-2.09C12.62 1.34 10.96.7 9 .7 6.11.7 3.65 2.3 2.43 4.94l2.44 1.91c.58-1.74 2.21-3.33 4.13-3.33z" fill="#EA4335"/>
    </g>
    {/* Pay text */}
    <g fill="#5F6368" transform="translate(19, 2.5)">
      <path d="M3 2.2h3.4c2 0 3.4 1.3 3.4 3.1 0 1.9-1.4 3.1-3.4 3.1H4.6v4.6H3V2.2zm3.3 4.6c1.1 0 1.8-.6 1.8-1.5s-.7-1.5-1.8-1.5H4.6v3h1.7z"/>
      <path d="M14.5 7.2c0-1.5-1.1-2.3-2.7-2.3-1.5 0-2.6.8-2.8 1.9l1.3.5c.2-.5.6-.9 1.5-.9.7 0 1.3.4 1.3 1.1v.5l-1.9.1c-1.8.1-2.8.9-2.8 2.1 0 1.2.9 2 2.2 2 1 0 1.7-.5 2.1-1.1v1h1.4V7.2zm-1.4 2.5c-.3.5-.8.9-1.6.9-.6 0-1.1-.3-1.1-.9 0-.6.5-1 1.5-1l1.2-.1v1z"/>
      <path d="M19.8 5.1l-3 7.2-1.4-7.2h-1.5l2.2 9-2 4.3h1.6l5.2-13.3h-.1z"/>
    </g>
  </svg>
);

// 3. Official PhonePe Logo (PhonePe purple + stylized white Pe + PhonePe wordmark)
const PhonePeLogo: React.FC = () => (
  <svg viewBox="0 0 78 22" className="h-4 w-auto max-h-4 object-contain" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Purple rounded brand badge */}
    <rect x="1" y="2" width="18" height="18" rx="5" fill="#5F259F" />
    {/* Stylized white Hindi Devanagari 'पे' */}
    <g fill="#FFFFFF">
      {/* Top horizontal shirorekha */}
      <rect x="5.2" y="6.2" width="9.6" height="1.6" rx="0.5" />
      {/* Slanted upper matra */}
      <path d="M10.8 6.5L13.8 3.5C14.1 3.2 14.5 3.4 14.4 3.8L12.5 6.5H10.8Z" />
      {/* Letter curve */}
      <path d="M6.8 7.2V10.2C6.8 11.4 7.6 12.2 8.8 12.2H11V7.2H9.4V10.6C9.4 10.9 9.1 11.1 8.8 11.1C8.5 11.1 8.2 10.9 8.2 10.6V7.2H6.8Z" />
      {/* Right vertical stem */}
      <rect x="11.2" y="7.2" width="1.6" height="7.2" rx="0.4" />
    </g>
    {/* Brand Name Text */}
    <text x="23" y="15" fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" fontWeight="800" fontSize="11" fill="#5F259F" letterSpacing="-0.2">
      PhonePe
    </text>
  </svg>
);

// 4. Official Paytm Logo (Dark Navy "Pay" + Vibrant Cyan "tm")
const PaytmLogo: React.FC = () => (
  <svg viewBox="0 0 54 20" className="h-3.5 w-auto max-h-3.5 object-contain" fill="none" xmlns="http://www.w3.org/2000/svg">
    <text x="1" y="15" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="900" fontSize="15" fill="#002970" letterSpacing="-0.6">
      Pay
    </text>
    <text x="31" y="15" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="900" fontSize="15" fill="#00BAF2" letterSpacing="-0.6">
      tm
    </text>
  </svg>
);

// 5. Official RuPay Logo (Chevron arrows + bold italic RuPay)
const RupayLogo: React.FC = () => (
  <svg viewBox="0 0 66 20" className="h-3.5 w-auto max-h-3.5 object-contain" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Dual RuPay Arrows */}
    <path d="M2 16L7.5 4H12.5L7 16H2Z" fill="#004B87" />
    <path d="M8.5 16L14 4H19L13.5 16H8.5Z" fill="#F26522" />
    {/* RuPay Text */}
    <text x="21" y="14.5" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="900" fontStyle="italic" fontSize="13.5" fill="#004B87" letterSpacing="-0.3">
      RuPay
    </text>
  </svg>
);

// 6. Official Visa Logo (Royal blue italic VISA with golden corner)
const VisaLogo: React.FC = () => (
  <svg viewBox="0 0 52 18" className="h-3.5 w-auto max-h-3.5 object-contain" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* V with gold flick */}
    <path d="M10.2 2L6.8 15.5H2.4L0.4 4.2C0.3 3.6 0.6 3.2 1.1 3C2.5 2.4 5 1.6 7.4 1.1L8.8 6.7L10.2 2Z" fill="#1434CB"/>
    <path d="M3.4 2.7C2.6 3 1.9 3.3 1.3 3.7L0.4 4.3C0.9 4.3 2 4 3.4 2.7Z" fill="#FAA61A"/>
    {/* I */}
    <path d="M15.4 2L12.4 15.5H9L12 2H15.4Z" fill="#1434CB"/>
    {/* S */}
    <path d="M23.8 5.7C23.8 3.5 20.9 3.4 18.9 3.4C16.8 3.4 15.4 3.8 14.6 4.2L15.2 6.9C16 6.5 17.3 6.1 18.7 6.1C19.9 6.1 20.6 6.6 20.6 7.3C20.6 8.1 19.5 8.5 18.2 9.1C16 10.1 14.7 11.3 14.7 13C14.7 15.3 17 16.4 19.7 16.4C21.3 16.4 22.6 16 23.4 15.6L22.8 12.9C22.1 13.2 21 13.6 19.8 13.6C18.6 13.6 17.9 13.1 17.9 12.4C17.9 11.6 18.9 11.2 20.3 10.5C22.6 9.4 23.8 8.2 23.8 5.7Z" fill="#1434CB"/>
    {/* A */}
    <path d="M31.8 2H29C28.1 2 27.4 2.3 27 3.2L22.8 15.5H26.2L26.9 13.3H31L31.4 15.5H34.4L31.8 2ZM27.8 10.6L29.4 5.3L30.4 10.6H27.8Z" fill="#1434CB"/>
  </svg>
);

// 7. Official Mastercard Logo (Overlapping vibrant red and golden yellow circles)
const MastercardLogo: React.FC = () => (
  <svg viewBox="0 0 36 22" className="h-4.5 w-auto max-h-4.5 object-contain" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="11" r="10" fill="#EB001B" />
    <circle cx="24" cy="11" r="10" fill="#F79E1B" />
    <path d="M18 4.2a10 10 0 0 1 0 13.6 10 10 0 0 1 0-13.6z" fill="#FF5F00" />
  </svg>
);

export const PaymentTrustBadges: React.FC<PaymentTrustBadgesProps> = ({
  showSslNotice = true,
  className = ''
}) => {
  return (
    <div className={`space-y-2.5 ${className}`}>
      {showSslNotice && (
        <div className="flex items-center justify-center gap-1.5 text-[10.5px] font-black text-slate-600 uppercase tracking-wider">
          <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>256-Bit Bank-Grade SSL Secure Checkout</span>
        </div>
      )}

      {/* Structured 4-column balanced grid of official payment channels */}
      <div className="grid grid-cols-4 gap-1.5">
        {/* 1. UPI */}
        <div
          title="Instant Unified Payments Interface (UPI / QR)"
          className="h-8 px-1.5 bg-white border border-slate-200/90 rounded-lg shadow-2xs hover:border-slate-300 hover:shadow-xs transition flex items-center justify-center overflow-hidden select-none"
        >
          <UpiLogo />
        </div>

        {/* 2. Google Pay */}
        <div
          title="Google Pay UPI"
          className="h-8 px-1.5 bg-white border border-slate-200/90 rounded-lg shadow-2xs hover:border-slate-300 hover:shadow-xs transition flex items-center justify-center overflow-hidden select-none"
        >
          <GPayLogo />
        </div>

        {/* 3. PhonePe */}
        <div
          title="PhonePe UPI & Wallet"
          className="h-8 px-1.5 bg-white border border-slate-200/90 rounded-lg shadow-2xs hover:border-slate-300 hover:shadow-xs transition flex items-center justify-center overflow-hidden select-none"
        >
          <PhonePeLogo />
        </div>

        {/* 4. Paytm */}
        <div
          title="Paytm UPI & Wallet"
          className="h-8 px-1.5 bg-white border border-slate-200/90 rounded-lg shadow-2xs hover:border-slate-300 hover:shadow-xs transition flex items-center justify-center overflow-hidden select-none"
        >
          <PaytmLogo />
        </div>

        {/* 5. RuPay */}
        <div
          title="RuPay Debit & Credit Cards"
          className="h-8 px-1.5 bg-white border border-slate-200/90 rounded-lg shadow-2xs hover:border-slate-300 hover:shadow-xs transition flex items-center justify-center overflow-hidden select-none"
        >
          <RupayLogo />
        </div>

        {/* 6. Visa Card */}
        <div
          title="Visa Debit & Credit Cards"
          className="h-8 px-1.5 bg-white border border-slate-200/90 rounded-lg shadow-2xs hover:border-slate-300 hover:shadow-xs transition flex items-center justify-center overflow-hidden select-none"
        >
          <VisaLogo />
        </div>

        {/* 7. Mastercard */}
        <div
          title="Mastercard Cards"
          className="h-8 px-1.5 bg-white border border-slate-200/90 rounded-lg shadow-2xs hover:border-slate-300 hover:shadow-xs transition flex items-center justify-center overflow-hidden select-none"
        >
          <MastercardLogo />
        </div>

        {/* 8. NetBanking */}
        <div
          title="All Major Indian NetBanking (SBI, HDFC, ICICI, Axis)"
          className="h-8 px-1.5 bg-white border border-slate-200/90 rounded-lg shadow-2xs hover:border-slate-300 hover:shadow-xs transition flex items-center justify-center gap-1 overflow-hidden select-none"
        >
          <Building2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
          <span className="text-[10px] font-bold text-slate-700 tracking-tight leading-none">NetBanking</span>
        </div>
      </div>

      {/* 9. Cash on Delivery (COD) Full-Width Dedicated Trust Strip */}
      <div
        title="Cash on Delivery Doorstep Payment"
        className="w-full h-8 px-3 bg-emerald-50/80 border border-emerald-200/90 rounded-lg shadow-2xs flex items-center justify-center gap-1.5 select-none hover:bg-emerald-50 transition"
      >
        <Truck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
        <span className="text-[11px] font-extrabold text-emerald-900 tracking-tight">
          Cash on Delivery (COD) Available
        </span>
      </div>
    </div>
  );
};
