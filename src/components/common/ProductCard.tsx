import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../../types';
import { useApp } from '../../context/AppContext';
import { ShoppingCart, Star, Check, Zap, ArrowUpRight, ShieldCheck, Flame, MessageCircle, Heart } from 'lucide-react';
import { Badge } from './Badge';
import { useRealRating } from '../../hooks/useRealRating';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart, isInWishlist, toggleWishlist } = useApp();
  const [added, setAdded] = useState(false);
  const isSaved = isInWishlist(product.id);
  const realRating = useRealRating(product.id, product.slug);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1, product.variants?.[0]);
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };

  // Best bulk savings tier
  const bestTier = product.wholesaleTiers && product.wholesaleTiers.length > 1
    ? product.wholesaleTiers[product.wholesaleTiers.length - 1]
    : null;

  const discountPercent = Math.round(((product.mrp - product.retailPrice) / product.mrp) * 100);

  return (
    <div className="group relative bg-white rounded-3xl border border-slate-200/90 hover:border-indigo/50 overflow-hidden shadow-subtle hover:shadow-premium transition-all duration-300 flex flex-col">
      {/* Top Image Container */}
      <Link to={`/product/${product.slug}`} aria-label={`View details of ${product.name}`} className="relative aspect-[4/3] overflow-hidden bg-slate-100 block">
        <img
          src={product.images[0]}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-108 transition-transform duration-500"
          loading="lazy"
        />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start z-10">
          {(product.id.includes('sample') || product.id.includes('swatch')) && (
            <span className="bg-purple-700 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1">
              <Zap className="w-2.5 h-2.5 fill-champagne text-champagne" />
              100% REBATE SAMPLE
            </span>
          )}
          {product.isDirectMillDeal && !(product.id.includes('sample') || product.id.includes('swatch')) && (
            <span className="badge-mill text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1">
              <Zap className="w-2.5 h-2.5 fill-current" />
              DIRECT MILL RATE
            </span>
          )}
          {product.isBestSeller && (
            <span className="bg-amber-400 text-slate-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
              <Flame className="w-2.5 h-2.5 fill-current text-orange-700" />
              HOT SELLER
            </span>
          )}
        </div>

        {/* Heart Wishlist Toggle Button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          className={`absolute top-2.5 right-2.5 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition shadow-sm cursor-pointer z-10 ${
            isSaved
              ? 'bg-red-50 text-red-500 fill-red-500 ring-1 ring-red-200'
              : 'bg-white/90 text-slate-400 hover:text-red-500 hover:bg-white'
          }`}
          title={isSaved ? 'Remove from Wishlist' : 'Save to Wishlist'}
        >
          <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isSaved ? 'fill-red-500 text-red-500' : ''}`} />
        </button>

        {discountPercent > 0 && (
          <div className="absolute top-2.5 left-2.5 bg-error text-white text-[10px] font-black px-2 py-0.5 rounded-lg shadow-sm">
            {discountPercent}% OFF
          </div>
        )}

        {/* Flipkart / Amazon style Assured Badge floating at bottom right */}
        <div className="absolute bottom-2 right-2 bg-white/95 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-black text-indigo border border-indigo-100 flex items-center gap-1 shadow-sm">
          <ShieldCheck className="w-3 h-3 text-indigo fill-indigo-light" />
          <span>MILL-ASSURED</span>
        </div>
      </Link>

      {/* Product Information */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Category & SKU */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
            <span className="font-bold text-indigo truncate">{product.categoryName}</span>
            <span className="text-[10px] font-mono">SKU: {product.sku.slice(-6)}</span>
          </div>

          {/* Product Title */}
          <Link to={`/product/${product.slug}`} className="block group-hover:text-indigo transition">
            <h3 className="font-bold text-sm text-navy line-clamp-2 leading-snug">
              {product.name}
            </h3>
          </Link>

          {/* Rating Pill — uses real reviews from API/DB, not hardcoded mock data */}
          <div className="flex items-center gap-2 mt-2">
            {realRating && realRating.count > 0 ? (
              <>
                <div className="flex items-center bg-emerald-700 text-white text-[11px] font-black px-2 py-0.5 rounded-md">
                  <span>{realRating.rating}</span>
                  <Star className="w-2.5 h-2.5 fill-current ml-0.5" />
                </div>
                <span className="text-xs text-slate-400 font-medium">
                  ({realRating.count} {realRating.count === 1 ? 'review' : 'reviews'})
                </span>
              </>
            ) : (
              <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                Direct Mill Launch
              </span>
            )}
          </div>
        </div>

        {/* Pricing & Actions */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-navy">
              ₹{product.retailPrice.toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-slate-400 line-through">
              ₹{product.mrp.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-emerald-700 font-bold ml-auto">
              Save ₹{product.mrp - product.retailPrice}
            </span>
          </div>

          {/* Volume Tier Preview (Meesho / Udaan Style) */}
          {bestTier && (
            <div className="mt-1.5 bg-indigo-light/80 border border-indigo-100 rounded-xl p-1.5 text-[11px] text-indigo flex items-center justify-between">
              <span className="font-semibold">Bulk Rate ({bestTier.minQty}+ pcs):</span>
              <span className="font-black text-indigo-dark">₹{bestTier.pricePerUnit} ({bestTier.savingsPercent}% off)</span>
            </div>
          )}

          {/* Trust Tags */}
          <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 font-medium">
            <span>✓ COD Available</span>
            <span>•</span>
            <span>✓ 7-Day Return</span>
            <span>•</span>
            <span>✓ Fast Delivery</span>
          </div>

          {/* Add to Cart & WhatsApp Quick Order Buttons */}
          <div className="mt-2.5 flex items-center gap-1.5">
            <button
              onClick={handleQuickAdd}
              aria-label={`Add ${product.name} to cart`}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm ${
                added
                  ? 'bg-emerald-600 text-white'
                  : 'bg-navy hover:bg-navy-800 text-white'
              }`}
            >
              {added ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Added</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-3.5 h-3.5 text-champagne" />
                  <span>Add to Cart</span>
                </>
              )}
            </button>

            {/* 1-Click WhatsApp Direct Quick Buy */}
            <a
              href={`https://wa.me/919876543210?text=${encodeURIComponent(
                `Hello Mahalaxmi Enterprises, I want to order "${product.name}" (SKU: ${product.sku}) at ₹${product.retailPrice}. Please confirm stock & dispatch.`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="p-2.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white rounded-xl transition border border-emerald-200 shrink-0"
              title="Quick Order via WhatsApp"
              aria-label={`Order ${product.name} directly on WhatsApp`}
            >
              <MessageCircle className="w-4 h-4" />
            </a>

            <Link
              to={`/product/${product.slug}`}
              className="p-2.5 border border-slate-200 hover:border-indigo hover:text-indigo rounded-xl text-slate-600 transition shrink-0"
              title="View full specifications & wholesale tiers"
              aria-label={`View specifications and wholesale tiers for ${product.name}`}
            >
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
