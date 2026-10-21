import React from 'react';
import { Lock, Building2, Truck } from 'lucide-react';

interface PaymentTrustBadgesProps {
  showSslNotice?: boolean;
  className?: string;
}

export const PaymentTrustBadges: React.FC<PaymentTrustBadgesProps> = ({
  showSslNotice = true,
  className = ''
}) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {showSslNotice && (
        <div className="flex items-center justify-center gap-1.5 text-[10.5px] font-black text-slate-600 uppercase tracking-wider">
          <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>256-Bit Bank-Grade SSL Secure Checkout</span>
        </div>
      )}

      {/* Actual Official Payment Brand Logos */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {/* 1. Official UPI Logo */}
        <div
          title="Instant Unified Payments Interface (UPI / QR)"
          className="h-8 px-2.5 bg-white border border-slate-200 rounded-xl shadow-2xs hover:border-slate-300 hover:shadow-xs transition flex items-center justify-center select-none"
        >
          <img src="/assets/payment/upi.svg" alt="UPI" className="h-4.5 w-auto object-contain" />
        </div>

        {/* 2. Official Google Pay Logo */}
        <div
          title="Google Pay UPI"
          className="h-8 px-2.5 bg-white border border-slate-200 rounded-xl shadow-2xs hover:border-slate-300 hover:shadow-xs transition flex items-center justify-center select-none"
        >
          <img src="/assets/payment/gpay.svg" alt="Google Pay" className="h-4 w-auto object-contain" />
        </div>

        {/* 3. Official PhonePe Logo */}
        <div
          title="PhonePe UPI & Wallet"
          className="h-8 px-2.5 bg-white border border-slate-200 rounded-xl shadow-2xs hover:border-slate-300 hover:shadow-xs transition flex items-center justify-center select-none"
        >
          <img src="/assets/payment/phonepe.svg" alt="PhonePe" className="h-4.5 w-auto object-contain" />
        </div>

        {/* 4. Official Paytm Logo */}
        <div
          title="Paytm UPI, Wallet & Postpaid"
          className="h-8 px-2.5 bg-white border border-slate-200 rounded-xl shadow-2xs hover:border-slate-300 hover:shadow-xs transition flex items-center justify-center select-none"
        >
          <img src="/assets/payment/paytm.svg" alt="Paytm" className="h-3.5 w-auto object-contain" />
        </div>

        {/* 5. Official RuPay Logo */}
        <div
          title="RuPay Debit & Credit Cards"
          className="h-8 px-2.5 bg-white border border-slate-200 rounded-xl shadow-2xs hover:border-slate-300 hover:shadow-xs transition flex items-center justify-center select-none"
        >
          <img src="/assets/payment/rupay.svg" alt="RuPay" className="h-3.5 w-auto object-contain" />
        </div>

        {/* 6. Official Visa Card Logo */}
        <div
          title="Visa Debit & Credit Cards"
          className="h-8 px-2.5 bg-white border border-slate-200 rounded-xl shadow-2xs hover:border-slate-300 hover:shadow-xs transition flex items-center justify-center select-none"
        >
          <img src="/assets/payment/visa.svg" alt="Visa" className="h-3.5 w-auto object-contain" />
        </div>

        {/* 7. Official Mastercard Logo */}
        <div
          title="Mastercard Cards"
          className="h-8 px-2.5 bg-white border border-slate-200 rounded-xl shadow-2xs hover:border-slate-300 hover:shadow-xs transition flex items-center justify-center select-none"
        >
          <img src="/assets/payment/mastercard.svg" alt="Mastercard" className="h-4.5 w-auto object-contain" />
        </div>

        {/* 8. NetBanking */}
        <div
          title="All Major Indian NetBanking (SBI, HDFC, ICICI, Axis)"
          className="h-8 px-2.5 bg-white border border-slate-200 rounded-xl shadow-2xs hover:border-slate-300 hover:shadow-xs transition flex items-center gap-1.5 select-none"
        >
          <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
          <span className="text-[11px] font-bold text-slate-700 tracking-tight">NetBanking</span>
        </div>

        {/* 9. Cash on Delivery (COD) */}
        <div
          title="Cash on Delivery Doorstep Payment"
          className="h-8 px-3 bg-emerald-50/70 border border-emerald-300/80 rounded-xl shadow-2xs hover:border-emerald-400 hover:shadow-xs transition flex items-center gap-1.5 select-none"
        >
          <Truck className="w-4 h-4 text-emerald-700 shrink-0" />
          <span className="text-[11px] font-black text-emerald-900 tracking-tight">Cash on Delivery</span>
        </div>
      </div>
    </div>
  );
};
