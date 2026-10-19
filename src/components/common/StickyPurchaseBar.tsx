import React, { useState, useEffect } from 'react';
import { Product, ProductVariant } from '../../types';
import { ShoppingCart, Zap, Check } from 'lucide-react';

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
      // The sticky bar must NOT appear at the top or while the user is still in the main right portion
      // (title, pricing tiers, options, add to cart, delivery checker, etc.).
      // It must ONLY appear once the entire right portion has finished and scrolled past above the viewport.
      const targetEl = document.getElementById('product-right-column') || document.getElementById('main-product-actions');
      if (targetEl) {
        const rect = targetEl.getBoundingClientRect();
        setIsVisible(rect.bottom <= 0);
      } else {
        setIsVisible(window.scrollY > 900);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });

    // Initial check (hidden by default when at top)
    handleScroll();
    const timeoutId = setTimeout(handleScroll, 150);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  if (!isVisible) return null;

  const total = currentUnitPrice * quantity;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-2xl py-2 px-2.5 sm:py-3 sm:px-8 transition-transform duration-300 animate-in slide-in-from-bottom w-full max-w-full">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-1.5 sm:gap-4 w-full min-w-0">
        {/* Product Info Thumbnail & Title */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-11 h-11 object-cover rounded-xl border border-slate-200 shrink-0"
          />
          <div className="min-w-0 flex-1 pr-2">
            <h4
              className="font-extrabold text-xs sm:text-sm text-navy leading-tight break-words line-clamp-2 md:line-clamp-none"
              title={product.name}
            >
              {product.name}
            </h4>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
              <span className="text-[10px] sm:text-[11px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded shrink-0">
                Qty {quantity}
              </span>
              {selectedVariant && (
                <span className="text-slate-500 text-[11px] truncate">
                  • {selectedVariant.name}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons & Single Total Price */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="text-right shrink-0">
            <span className="text-[10px] text-slate-400 block leading-tight">Total Payable:</span>
            <div className="flex items-baseline gap-1 justify-end">
              <span className="font-black text-sm sm:text-base text-navy">
                ₹{total.toLocaleString('en-IN')}
              </span>
              {product.mrp > currentUnitPrice && (
                <span className="text-[10px] text-slate-400 line-through hidden sm:inline">
                  ₹{(product.mrp * quantity).toLocaleString('en-IN')}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={onAddToCart}
            className={`py-2 px-2.5 sm:py-2.5 sm:px-5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1 shadow-sm shrink-0 ${
              addedAnimation
                ? 'bg-emerald-600 text-white'
                : 'bg-navy hover:bg-navy-800 text-white'
            }`}
          >
            {addedAnimation ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Added</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-3.5 h-3.5 text-champagne shrink-0" />
                <span>Add to Cart</span>
              </>
            )}
          </button>

          <button
            onClick={onBuyNow}
            className="py-2 px-3 sm:py-2.5 sm:px-6 bg-indigo hover:bg-indigo-dark text-white rounded-xl font-black text-xs transition shadow-premium flex items-center justify-center gap-1 shrink-0 whitespace-nowrap"
          >
            <Zap className="w-3.5 h-3.5 shrink-0" />
            <span className="sm:hidden">Buy Now</span>
            <span className="hidden sm:inline">Buy Now • Fast Checkout</span>
          </button>
        </div>
      </div>
    </div>
  );
};
