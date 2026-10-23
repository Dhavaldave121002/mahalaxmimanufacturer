import React, { useState, useEffect } from 'react';
import { Product, ProductVariant } from '../../types';
import { ShoppingCart, Zap, Check } from 'lucide-react';
import { orderProductImagesByResolution } from '../../utils/productImages';
import { BuyNowPaymentIcons } from './BuyNowPaymentIcons';

interface StickyPurchaseBarProps {
  product: Product;
  selectedVariant?: ProductVariant;
  quantity: number;
  currentUnitPrice: number;
  onAddToCart: () => void;
  onBuyNow: () => void;
  addedAnimation: boolean;
}

export const StickyPurchaseBar: React.FC<StickyPurchaseBarProps> = ({
  product,
  selectedVariant,
  quantity,
  currentUnitPrice,
  onAddToCart,
  onBuyNow,
  addedAnimation
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // 1. Mobile Experience: Always visible so mobile buyers always have instant 1-tap checkout
      if (window.innerWidth < 768) {
        setIsVisible(true);
        return;
      }

      // 2. Desktop Experience:
      // The sticky purchase bar appears whenever:
      // - The main buttons (#main-product-actions) are NOT fully in the screen viewport (either scrolled past top, or hidden below the fold)
      // - OR when the user has scrolled down past 150px
      const mainActions = document.getElementById('main-product-actions');
      if (mainActions) {
        const rect = mainActions.getBoundingClientRect();
        // Check if main action buttons are fully visible in the active viewport
        const isMainFullyVisible = rect.top >= 40 && rect.bottom <= (window.innerHeight - 40);
        setIsVisible(!isMainFullyVisible || window.scrollY > 150);
      } else {
        setIsVisible(true);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });

    // Initial check on load
    handleScroll();
    const timeoutId = setTimeout(handleScroll, 100);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  if (!isVisible) return null;

  const total = currentUnitPrice * quantity;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 box-border w-full max-w-full border-t border-slate-200 bg-white/95 px-2.5 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 shadow-2xl backdrop-blur-md transition-transform duration-300 animate-in slide-in-from-bottom sm:px-8 sm:py-3">
      <div className="mx-auto flex w-full min-w-0 flex-col gap-2 sm:max-w-7xl sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        {/* Product Info Thumbnail & Title */}
        <div className="flex min-w-0 w-full flex-1 items-center gap-2 sm:gap-3.5">
          <img
            src={orderProductImagesByResolution(product.images)[0]}
            alt={product.name}
            className="h-9 w-9 shrink-0 rounded-lg border border-slate-200 object-cover sm:h-11 sm:w-11 sm:rounded-xl"
          />
          <div className="min-w-0 flex-1 sm:pr-2">
            <h4
              className="line-clamp-1 break-all text-[11px] font-extrabold leading-tight text-navy sm:text-sm md:break-normal"
              title={product.name}
            >
              {product.name}
            </h4>
            <div className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs text-slate-500">
              <span className="shrink-0 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 sm:text-[11px]">
                Qty {quantity}
              </span>
              {selectedVariant && (
                <span className="truncate text-[10px] text-slate-500 sm:text-[11px]">
                  • {selectedVariant.name}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons & Single Total Price */}
        <div className="grid w-full min-w-0 grid-cols-[minmax(104px,auto)_minmax(0,1fr)_minmax(0,1fr)] items-center gap-1.5 sm:flex sm:w-auto sm:shrink-0 sm:gap-3">
          <div className="min-w-0 text-left sm:shrink-0 sm:text-right">
            <span className="block text-[9px] leading-tight text-slate-400 sm:text-[10px]">Total Payable:</span>
            <div className="flex min-w-0 flex-wrap items-baseline justify-start gap-x-1 sm:justify-end">
              <span className="whitespace-nowrap text-xs font-black text-navy sm:text-base">
                ₹{total.toLocaleString('en-IN')}
              </span>
              {product.mrp > currentUnitPrice && (
                <span className="hidden whitespace-nowrap text-[10px] text-slate-400 line-through sm:inline">
                  ₹{(product.mrp * quantity).toLocaleString('en-IN')}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={onAddToCart}
            className={`flex min-h-10 min-w-0 items-center justify-center gap-1 rounded-lg px-1.5 text-[10px] font-bold leading-tight shadow-sm transition sm:min-h-11 sm:shrink-0 sm:gap-1.5 sm:rounded-xl sm:px-5 sm:py-2.5 sm:text-xs ${
              addedAnimation
                ? 'bg-emerald-600 text-white'
                : 'bg-navy hover:bg-navy-800 text-white'
            }`}
          >
            {addedAnimation ? (
              <>
                <Check className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Added</span>
              </>
            ) : (
              <>
                <ShoppingCart className="h-3.5 w-3.5 shrink-0 text-champagne" />
                <span className="truncate">Add to Cart</span>
              </>
            )}
          </button>

          <button
            onClick={onBuyNow}
            className="flex min-h-10 min-w-0 items-center justify-center gap-1 whitespace-nowrap rounded-lg bg-indigo px-1.5 text-[10px] font-black leading-tight text-white shadow-premium transition hover:bg-indigo-dark sm:min-h-11 sm:shrink-0 sm:gap-1.5 sm:rounded-xl sm:px-6 sm:py-2.5 sm:text-xs"
          >
            <Zap className="h-3.5 w-3.5 shrink-0 max-[359px]:hidden" />
            <span>Buy Now</span>
            <BuyNowPaymentIcons />
          </button>
        </div>
      </div>
    </div>
  );
};
