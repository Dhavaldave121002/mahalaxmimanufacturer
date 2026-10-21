import React from 'react';
import { Lock, Building2, Truck, QrCode } from 'lucide-react';

interface PaymentTrustBadgesProps {
  showSslNotice?: boolean;
  className?: string;
}

export const PaymentTrustBadges: React.FC<PaymentTrustBadgesProps> = ({
  showSslNotice = true,
  className = ''
}) => {
  return (
    <div className={`space-y-2.5 ${className}`}>
      {showSslNotice && (
        <div className="flex items-center justify-center gap-1.5 text-[10px] font-black text-slate-600 uppercase tracking-wider">
          <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>256-Bit Bank-Grade SSL Secure Checkout</span>
        </div>
      )}

      {/* Actual Payment Brand Logos Grid */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
        {/* 1. UPI / QR */}
        <div
          title="Instant Unified Payments Interface (UPI & QR)"
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-slate-200/90 rounded-xl shadow-2xs hover:border-slate-300 hover:shadow-xs transition select-none"
        >
          {/* Authentic NPCI UPI Arrow Icon */}
          <svg className="h-3.5 w-auto" viewBox="0 0 54 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14.6 2.5L7.9 21.5H0.9L7.6 2.5H14.6Z" fill="#097939" />
            <path d="M21.9 2.5L18.6 12L15.3 2.5H8.3L15.1 21.5H22.1L28.9 2.5H21.9Z" fill="#ED752E" />
            <path d="M37.6 2.5H26.3V21.5H33.3V14.5H37.6C41.2 14.5 43.6 12.3 43.6 8.5C43.6 4.7 41.2 2.5 37.6 2.5ZM36.6 9.5H33.3V7.5H36.6C37.8 7.5 38.6 8 38.6 8.5C38.6 9 37.8 9.5 36.6 9.5Z" fill="#0F172A" />
            <path d="M47.2 2.5H42.2V21.5H47.2V2.5Z" fill="#0F172A" />
          </svg>
          <span className="text-[10px] font-black text-slate-800 tracking-tight flex items-center gap-0.5">
            <QrCode className="w-3 h-3 text-slate-500" />
            <span>QR</span>
          </span>
        </div>

        {/* 2. Google Pay */}
        <div
          title="Google Pay UPI"
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-slate-200/90 rounded-xl shadow-2xs hover:border-slate-300 hover:shadow-xs transition select-none"
        >
          {/* Multi-color Google G Icon */}
          <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
          </svg>
          <span className="text-[10px] font-bold text-slate-800 tracking-tight">GPay</span>
        </div>

        {/* 3. PhonePe */}
        <div
          title="PhonePe UPI & Wallet"
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-slate-200/90 rounded-xl shadow-2xs hover:border-slate-300 hover:shadow-xs transition select-none"
        >
          {/* Authentic PhonePe Purple 'Pe' Logo */}
          <div className="w-3.5 h-3.5 rounded bg-[#5F259F] flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" fill="none" className="w-2.5 h-2.5" xmlns="http://www.w3.org/2000/svg">
              <path d="M14.5 4C14.5 4 11.5 4 10 5.7C8.5 7.4 8.5 9.5 8.5 9.5H5.8C5.4 9.5 5 9.8 5 10.2V12.5C5 12.9 5.4 13.2 5.8 13.2H8.5V20.2C8.5 20.6 8.8 21 9.2 21H11.8C12.2 21 12.5 20.6 12.5 20.2V13.2H16C16.4 13.2 16.7 12.9 16.7 12.5L19 10C19.2 9.8 19.2 9.5 19 9.3C18.8 9.1 18.6 9.1 18.3 9.1H12.5C12.5 9.1 12.6 7.6 13.6 6.8C14.4 6.2 15.6 6.2 15.6 6.2H18.8C19.2 6.2 19.5 5.9 19.5 5.5V4.5C19.5 4.2 19.2 4 18.8 4H14.5Z" fill="white" />
            </svg>
          </div>
          <span className="text-[10px] font-black text-[#5F259F] tracking-tight">PhonePe</span>
        </div>

        {/* 4. RuPay */}
        <div
          title="RuPay Debit & Credit Cards"
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-slate-200/90 rounded-xl shadow-2xs hover:border-slate-300 hover:shadow-xs transition select-none"
        >
          {/* Authentic RuPay Brand Typography & Chevron */}
          <svg className="h-3 w-auto" viewBox="0 0 68 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <text x="0" y="14" fontFamily="Arial, Helvetica, sans-serif" fontWeight="900" fontStyle="italic" fontSize="15" fill="#0C4DA2">Ru</text>
            <text x="21" y="14" fontFamily="Arial, Helvetica, sans-serif" fontWeight="900" fontStyle="italic" fontSize="15" fill="#F37021">Pay</text>
            <path d="M52 2L47 16H51L56 2H52Z" fill="#0C4DA2" />
            <path d="M58 2L53 16H57L62 2H58Z" fill="#F37021" />
          </svg>
        </div>

        {/* 5. Visa & Mastercard Cards */}
        <div
          title="Visa & Mastercard Debit/Credit Cards"
          className="flex items-center gap-1 px-2 py-1.5 bg-white border border-slate-200/90 rounded-xl shadow-2xs hover:border-slate-300 hover:shadow-xs transition select-none"
        >
          {/* Visa */}
          <span className="font-black italic text-[11px] tracking-tighter text-[#1A1F71] font-sans">
            VISA
          </span>
          <span className="text-slate-300 font-light text-[10px]">/</span>
          {/* Mastercard circles */}
          <div className="flex items-center -space-x-1 shrink-0">
            <div className="w-3 h-3 rounded-full bg-[#EB001B]" />
            <div className="w-3 h-3 rounded-full bg-[#F79E1B] opacity-90" />
          </div>
        </div>

        {/* 6. NetBanking */}
        <div
          title="All Indian Major NetBanking (SBI, HDFC, ICICI, Axis, PNB)"
          className="flex items-center gap-1 px-2 py-1.5 bg-white border border-slate-200/90 rounded-xl shadow-2xs hover:border-slate-300 hover:shadow-xs transition select-none"
        >
          <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span className="text-[10px] font-bold text-slate-700 tracking-tight">NetBanking</span>
        </div>

        {/* 7. Cash on Delivery (COD) */}
        <div
          title="Cash on Delivery Doorstep Payment"
          className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50/60 border border-emerald-200/80 rounded-xl shadow-2xs hover:border-emerald-300 hover:shadow-xs transition select-none"
        >
          <Truck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
          <span className="text-[10px] font-black text-emerald-900 tracking-tight">Cash on Delivery</span>
        </div>
      </div>
    </div>
  );
};
