import React from 'react';

export const BuyNowPaymentIcons: React.FC = () => (
  <span
    role="img"
    aria-label="Google Pay, PhonePe, and Paytm supported"
    className="ml-1.5 inline-flex shrink-0 items-center -space-x-1.5 select-none"
  >
    {/* 1. Official Google Pay 4-Color 'G' Circular Badge */}
    <span
      title="Google Pay"
      className="flex h-5 w-5 min-w-[20px] min-h-[20px] max-w-[20px] max-h-[20px] aspect-square shrink-0 items-center justify-center rounded-full border border-white bg-white shadow-xs overflow-hidden"
    >
      <svg viewBox="0 0 24 24" className="h-3 w-3 shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          fill="#4285F4"
        />
        <path
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          fill="#34A853"
        />
        <path
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          fill="#FBBC05"
        />
        <path
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          fill="#EA4335"
        />
      </svg>
    </span>

    {/* 2. Official PhonePe Stylized 'पे' Purple Circular Badge */}
    <span
      title="PhonePe"
      className="flex h-5 w-5 min-w-[20px] min-h-[20px] max-w-[20px] max-h-[20px] aspect-square shrink-0 items-center justify-center rounded-full border border-white bg-[#5F259F] text-white shadow-xs overflow-hidden"
    >
      <svg viewBox="0 0 24 24" className="h-3 w-3 shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Shirorekha (Top horizontal bar) */}
        <rect x="3.5" y="5" width="13" height="2.2" rx="0.8" fill="#FFFFFF" />
        {/* Slanted upper matra */}
        <path d="M10.5 5.5L14.5 1.5C14.9 1.1 15.5 1.4 15.3 1.9L12.8 5.5H10.5Z" fill="#FFFFFF" />
        {/* Devanagari 'pa' loop */}
        <path
          d="M5.5 7V11C5.5 12.8 6.9 14 8.7 14H11.5V7H9V12C9 12.4 8.6 12.7 8.2 12.7C7.8 12.7 7.5 12.4 7.5 12V7H5.5Z"
          fill="#FFFFFF"
        />
        {/* Right vertical stem */}
        <rect x="11.8" y="7" width="2.2" height="10.5" rx="0.6" fill="#FFFFFF" />
      </svg>
    </span>

    {/* 3. Official Paytm Navy + Cyan Logo Circular Badge */}
    <span
      title="Paytm"
      className="flex h-5 w-5 min-w-[20px] min-h-[20px] max-w-[20px] max-h-[20px] aspect-square shrink-0 items-center justify-center rounded-full border border-white bg-white shadow-xs overflow-hidden"
    >
      <svg viewBox="0 0 34 14" className="w-[14px] h-auto shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
        <text
          x="1"
          y="11"
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          fontWeight="900"
          fontSize="11"
          fill="#002970"
          letterSpacing="-0.7"
        >
          Pay
        </text>
        <text
          x="18.5"
          y="11"
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          fontWeight="900"
          fontSize="11"
          fill="#00BAF2"
          letterSpacing="-0.7"
        >
          tm
        </text>
      </svg>
    </span>
  </span>
);
