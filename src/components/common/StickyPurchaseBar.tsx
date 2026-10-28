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
  canPurchase: boolean;
}

export const StickyPurchaseBar: React.FC<StickyPurchaseBarProps> = ({
  product,
  selectedVariant,
  quantity,
  currentUnitPrice,
  onAddToCart,
  onBuyNow,
  addedAnimation,
  canPurchase
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

  if (!canPurchase) return null;

  const total = currentUnitPrice * quantity;

  return (
    <div
      aria-hidden={!isVisible}
      className={`fixed inset-x-0 bottom-0 z-50 box-border w-full max-w-full border-t border-slate-200 bg-white/95 px-2.5 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 shadow-2xl backdrop-blur-md transition-[transform,opacity] duration-300 ease-out motion-reduce:transition-none md:px-8 md:py-3 ${
        isVisible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-full opacity-0'
      }`}
    >
      <div className="mx-auto flex w-full min-w-0 flex-col gap-2 md:max-w-7xl md:flex-row md:items-center md:justify-between md:gap-4">
        {/* Product Info Thumbnail & Title */}
        <div className="flex min-w-0 w-full flex-1 items-center gap-2 md:gap-3.5">
          <img
            src={orderProductImagesByResolution(product.images)[0]}
            alt={product.name}
            className="h-9 w-9 shrink-0 rounded-lg border border-slate-200 object-cover md:h-11 md:w-11 md:rounded-xl"
          />
          <div className="min-w-0 flex-1 md:pr-2">
            <h4
              className="line-clamp-1 break-words text-[11px] font-extrabold leading-tight text-navy md:text-sm"
              title={product.name}
            >
              {product.name}
            </h4>
              <div className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs text-slate-500">
                <span className="shrink-0 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 md:text-[11px]">
                  Qty {quantity}
                </span>
                {selectedVariant && (
                  <span className="truncate text-[10px] text-slate-500 md:text-[11px]">
                    • {(selectedVariant.colorName || selectedVariant.name || '').replace(/\s*\/\s*\d+$/i, '').replace(/\s*\(?\s*pack\s+of\s+\d+\s*\)?/i, '').trim()}
                  </span>
                )}
              </div>
          </div>
        </div>

        {/* Action Buttons & Single Total Price */}
        <div className="grid w-full min-w-0 grid-cols-[minmax(90px,auto)_minmax(0,1fr)_minmax(0,1fr)] items-center gap-1.5 md:flex md:w-auto md:shrink-0 md:gap-3">
          <div className="min-w-0 text-left md:shrink-0 md:text-right">
            <span className="block text-[9px] leading-tight text-slate-400 md:text-[10px]">Total Payable:</span>
            <div className="flex min-w-0 flex-wrap items-baseline justify-start gap-x-1 md:justify-end">
              <span className="whitespace-nowrap text-xs font-black text-navy md:text-base">
                ₹{total.toLocaleString('en-IN')}
              </span>
              {product.mrp > currentUnitPrice && (
                <span className="hidden whitespace-nowrap text-[10px] text-slate-400 line-through md:inline">
                  ₹{(product.mrp * quantity).toLocaleString('en-IN')}
                </span>
              )}
            </div>
          </div>

          <button
                onClick={onAddToCart}
                className={`flex min-h-10 min-w-0 items-center justify-center gap-1 rounded-lg px-1.5 text-[10px] font-bold leading-tight shadow-sm transition md:min-h-11 md:shrink-0 md:gap-1.5 md:rounded-xl md:px-5 md:py-2.5 md:text-xs ${
                  addedAnimation
                    ? 'bg-emerald-600 text-white'
                    : 'bg-navy text-white hover:bg-navy-800'
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
                className="flex min-h-10 min-w-0 items-center justify-center gap-1 whitespace-nowrap rounded-lg bg-indigo px-1.5 text-[10px] font-black leading-tight text-white shadow-premium transition hover:bg-indigo-dark md:min-h-11 md:shrink-0 md:gap-1.5 md:rounded-xl md:px-6 md:py-2.5 md:text-xs"
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
