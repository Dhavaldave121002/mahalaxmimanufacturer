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
      // Show when scrolled past 400px (when hero buy buttons scroll out of view)
      if (window.scrollY > 420) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!isVisible) return null;

  const total = currentUnitPrice * quantity;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-2xl py-2 px-2.5 sm:py-3 sm:px-8 transition-transform duration-300 animate-in slide-in-from-bottom w-full max-w-full">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-1.5 sm:gap-4 w-full min-w-0">
        {/* Product Info Thumbnail & Price */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink">
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-10 h-10 object-cover rounded-xl border border-slate-200 shrink-0 hidden sm:block"
          />
          <div className="min-w-0">
            <h4 className="font-extrabold text-xs sm:text-sm text-navy truncate max-w-[110px] sm:max-w-md hidden xs:block">
              {product.name}
            </h4>
            <div className="flex items-baseline gap-1 sm:gap-2 text-xs">
              <span className="font-black text-sm sm:text-base text-navy">₹{total.toLocaleString('en-IN')}</span>
              {product.mrp > currentUnitPrice && (
                <span className="text-[10px] text-slate-400 line-through hidden xs:inline">₹{product.mrp * quantity}</span>
              )}
              <span className="text-[9px] sm:text-[11px] text-emerald-700 font-bold bg-emerald-50 px-1 py-0.2 rounded shrink-0">
                Qty {quantity}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <div className="text-right hidden md:block">
            <span className="text-[10px] text-slate-400 block">Total Payable:</span>
            <span className="font-black text-sm text-navy">₹{total.toLocaleString('en-IN')}</span>
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
