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
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-2xl py-3 px-4 sm:px-8 transition-transform duration-300 animate-in slide-in-from-bottom">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Product Info Thumbnail */}
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-11 h-11 object-cover rounded-xl border border-slate-200 shrink-0 hidden sm:block"
          />
          <div className="min-w-0">
            <h4 className="font-extrabold text-xs sm:text-sm text-navy truncate max-w-xs sm:max-w-md">
              {product.name}
            </h4>
            <div className="flex items-center gap-2 text-xs">
              <span className="font-black text-indigo">₹{currentUnitPrice.toLocaleString('en-IN')}</span>
              {product.mrp > currentUnitPrice && (
                <span className="text-[11px] text-slate-400 line-through">₹{product.mrp}</span>
              )}
              {selectedVariant && (
                <span className="text-[11px] text-slate-500 font-medium hidden md:inline">
                  • {selectedVariant.name}
                </span>
              )}
              <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded">
                Qty: {quantity}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="text-right hidden md:block">
            <span className="text-[10px] text-slate-400 block">Total Payable:</span>
            <span className="font-black text-sm text-navy">₹{total.toLocaleString('en-IN')}</span>
          </div>

          <button
            onClick={onAddToCart}
            className={`py-2 sm:py-2.5 px-3 sm:px-5 rounded-xl font-bold text-xs transition flex items-center gap-1.5 shadow-sm ${
              addedAnimation
                ? 'bg-emerald-600 text-white'
                : 'bg-navy hover:bg-navy-800 text-white'
            }`}
          >
            {addedAnimation ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Added to Cart</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-3.5 h-3.5 text-champagne" />
                <span>Add to Cart</span>
              </>
            )}
          </button>

          <button
            onClick={onBuyNow}
            className="py-2 sm:py-2.5 px-4 sm:px-6 bg-indigo hover:bg-indigo-dark text-white rounded-xl font-bold text-xs transition shadow-premium flex items-center gap-1.5"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Buy Now (₹{total.toLocaleString('en-IN')})</span>
          </button>

          {/* 1-Click WhatsApp Quick Order */}
          <a
            href={`https://wa.me/919876543210?text=${encodeURIComponent(
              `Hello Mahalaxmi Enterprises, I want to order ${quantity} units of "${product.name}" (SKU: ${product.sku}) at ₹${currentUnitPrice}/pc. Total: ₹${total}. Please confirm stock.`
            )}`}
            target="_blank"
            rel="noreferrer"
            className="hidden sm:flex py-2 sm:py-2.5 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition items-center gap-1.5 shadow-sm"
            title="Order via WhatsApp"
          >
            <span>💬 WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
};
