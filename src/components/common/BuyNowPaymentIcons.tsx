import React from 'react';

export const BuyNowPaymentIcons: React.FC = () => (
  <span
    role="img"
    aria-label="Google Pay, PhonePe, and Paytm supported"
    className="ml-1 inline-flex shrink-0 items-center -space-x-1 min-[360px]:-space-x-1.5 max-[359px]:ml-0 max-[359px]:-space-x-1.5"
  >
    <span title="Google Pay" className="flex h-4 w-4 items-center justify-center rounded-full border border-slate-200 bg-white text-[10px] font-black text-blue-600 shadow-sm max-[359px]:h-3.5 max-[359px]:w-3.5 max-[359px]:text-[9px]">
      G
    </span>
    <span title="PhonePe" className="flex h-4 w-4 items-center justify-center rounded-full border border-white bg-[#5F259F] text-[8px] font-bold text-white shadow-sm max-[359px]:h-3.5 max-[359px]:w-3.5 max-[359px]:text-[7px]">
      पे
    </span>
    <span title="Paytm" className="flex h-4 w-4 items-center justify-center rounded-full border border-slate-200 bg-white text-[8px] font-black text-[#002970] shadow-sm max-[359px]:h-3.5 max-[359px]:w-3.5 max-[359px]:text-[7px]">
      P
    </span>
  </span>
);
