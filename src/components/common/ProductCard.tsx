import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../../types';
import { useApp } from '../../context/AppContext';
import { ShoppingCart, Star, Check, Zap, ArrowUpRight, ShieldCheck, Sparkles, MessageCircle, Heart } from 'lucide-react';
import { Badge } from './Badge';
import { useRealRating } from '../../hooks/useRealRating';
import { orderProductImagesByResolution } from '../../utils/productImages';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart, isInWishlist, toggleWishlist } = useApp();
  const [added, setAdded] = useState(false);
  const isSaved = isInWishlist(product.id);
  const realRating = useRealRating(product.id, product.slug);
  const approximatePrice = product.specifications?.['Source Price Status'] === 'Approximate - verify before sale';
  const outOfStock = product.stock <= 0;
  const availabilityNeedsConfirmation = product.specifications?.['Source Availability'] === 'Needs confirmation';
  const insufficientStockForMoq = product.stock > 0 && product.stock < Math.max(1, product.moq || 1);
  const purchaseUnavailable = outOfStock || insufficientStockForMoq;
  const preferredImage = orderProductImagesByResolution(product.images)[0];

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (addToCart(product, Math.max(1, product.moq || 1), product.variants?.[0])) {
      setAdded(true);
      setTimeout(() => setAdded(false), 1600);
    }
  };

  // Best bulk savings tier
  const bestTier = product.wholesaleTiers && product.wholesaleTiers.length > 1
    ? product.wholesaleTiers[product.wholesaleTiers.length - 1]
    : null;

  const discountPercent = Math.round(((product.mrp - product.retailPrice) / product.mrp) * 100);

  return (
    <div className="group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.08)] transition-all duration-300 hover:border-indigo/50 hover:shadow-premium sm:rounded-3xl">
      {/* Top Image Container */}
      <Link to={`/product/${product.slug}`} aria-label={`View details of ${product.name}`} className="relative aspect-square overflow-hidden bg-slate-50 block">
        <img
          src={preferredImage}
          alt={product.name}
          className="w-full h-full object-contain object-center"
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
              <Sparkles className="w-2.5 h-2.5" />
              FEATURED
            </span>
          )}
          {discountPercent > 0 && !approximatePrice && (
            <span className="bg-error text-white text-[10px] font-black px-2 py-0.5 rounded-lg shadow-sm">
              {discountPercent}% OFF
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

        {/* Flipkart / Amazon style Assured Badge floating at bottom right */}
        {product.stock > 0 && !approximatePrice && (
          <div className="absolute bottom-2 right-2 bg-white/95 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-black text-indigo border border-indigo-100 flex items-center gap-1 shadow-sm">
            <ShieldCheck className="w-3 h-3 text-indigo fill-indigo-light" />
            <span>MILL-ASSURED</span>
          </div>
        )}
      </Link>

      {/* Product Information */}
      <div className="flex flex-1 flex-col justify-between p-3 sm:p-4">
        <div>
          {/* Category & SKU */}
          <div className="mb-1 flex min-w-0 flex-col items-start gap-0.5 text-[9px] text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:gap-1 sm:text-[11px]">
            <span className="max-w-full truncate font-bold text-indigo">{product.categoryName}</span>
            <span className="max-w-full truncate font-mono text-[9px] sm:text-[10px]">SKU: {product.sku.slice(-6)}</span>
          </div>

          {/* Product Title */}
          <Link to={`/product/${product.slug}`} className="block group-hover:text-indigo transition">
            <h3 className="line-clamp-3 min-h-[3.15rem] text-[13px] font-bold leading-[1.05rem] text-navy sm:line-clamp-2 sm:min-h-0 sm:text-sm sm:leading-snug">
              {product.name}
            </h3>
          </Link>

          {/* Rating Pill — uses real reviews from API/DB, not hardcoded mock data */}
          <div className="mt-2 flex min-w-0 items-center gap-2">
            {realRating && realRating.count > 0 ? (
              <>
                <div className="flex items-center bg-emerald-700 text-white text-[11px] font-black px-2 py-0.5 rounded-md">
                  <span>{realRating.rating}</span>
                  <Star className="w-2.5 h-2.5 fill-current ml-0.5" />
                </div>
                <span className="truncate text-xs font-medium text-slate-400">
                  ({realRating.count} {realRating.count === 1 ? 'review' : 'reviews'})
                </span>
              </>
            ) : (
              <span className="max-w-full truncate rounded border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                {outOfStock
                  ? 'Out of stock'
                  : insufficientStockForMoq
                    ? 'Insufficient stock for MOQ'
                    : 'Direct Mill Launch'}
              </span>
            )}
          </div>
        </div>

        {/* Pricing & Actions */}
        <div className="mt-2.5 border-t border-slate-100 pt-2 sm:mt-4 sm:pt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-black text-navy sm:text-xl">
              {approximatePrice ? 'Approx. ' : ''}₹{product.retailPrice.toLocaleString('en-IN')}
            </span>
            {!approximatePrice && (
              <>
                <span className="text-xs text-slate-400 line-through">
                  ₹{product.mrp.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-emerald-700 font-bold ml-auto">
                  Save ₹{product.mrp - product.retailPrice}
                </span>
              </>
            )}
          </div>

          {/* Volume Tier Preview (Meesho / Udaan Style) */}
          {bestTier && (
            <div className="mt-1.5 flex items-center justify-between gap-1 overflow-hidden rounded-xl border border-indigo-100 bg-indigo-light/80 p-1.5 text-[9px] text-indigo sm:text-[11px]">
              <span className="min-w-0 truncate font-semibold sm:overflow-visible sm:whitespace-normal">
                Bulk Rate ({bestTier.minQty}+):
              </span>
              <span className="shrink-0 font-black text-indigo-dark">
                ₹{bestTier.pricePerUnit}<span className="hidden sm:inline"> ({bestTier.savingsPercent}% off)</span>
              </span>
            </div>
          )}

          <div className="mt-2 grid grid-cols-2 gap-x-1 gap-y-1 text-[9px] font-medium text-slate-600 sm:mt-2 sm:flex sm:items-center sm:justify-between sm:gap-1 sm:whitespace-nowrap sm:text-[10px]">
            <span>{`MOQ ${product.moq}`}</span>
            <span className={`truncate font-semibold ${
              outOfStock
                ? 'text-red-700'
                : insufficientStockForMoq || availabilityNeedsConfirmation
                  ? 'text-amber-700'
                  : 'text-emerald-700'
            }`}>
              {outOfStock
                ? 'Out of stock'
                : availabilityNeedsConfirmation
                  ? 'In stock • confirmation pending'
                  : insufficientStockForMoq
                    ? 'Insufficient stock for MOQ'
                    : 'In stock'}
            </span>
            <span className="col-span-2 sm:hidden">{approximatePrice ? 'Approx. price' : 'Price shown'}</span>
            <span className="hidden text-slate-300 sm:inline" aria-hidden="true">•</span>
            <span className="hidden sm:inline">{approximatePrice ? 'Approx. price' : 'Price shown'}</span>
          </div>

          {/* Add to Cart, WhatsApp Enquiry & Product Details */}
          <div className="mt-2 grid min-w-0 grid-cols-[minmax(0,1fr)_auto_auto] gap-1 sm:mt-2.5 sm:flex sm:items-center sm:gap-1.5">
            <button
              onClick={handleQuickAdd}
              disabled={purchaseUnavailable}
              aria-label={`Add ${product.name} to cart`}
              className={`col-span-3 flex min-w-0 items-center justify-center gap-1 rounded-lg px-1.5 py-2 text-[10px] font-bold shadow-sm transition sm:col-span-1 sm:flex-1 sm:gap-1.5 sm:rounded-xl sm:px-3 sm:py-2.5 sm:text-xs ${
                purchaseUnavailable
                  ? 'cursor-not-allowed bg-slate-200 text-slate-600'
                  : added
                  ? 'bg-emerald-600 text-white'
                  : 'bg-navy hover:bg-navy-800 text-white'
              }`}
            >
              {purchaseUnavailable ? (
                <span className="truncate">
                  {outOfStock ? 'Unavailable' : 'Insufficient Stock'}
                </span>
              ) : added ? (
                <>
                  <Check className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                  <span className="truncate">Added</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="h-3 w-3 shrink-0 text-champagne sm:h-3.5 sm:w-3.5" />
                  <span className="truncate">Add to Cart</span>
                </>
              )}
            </button>

            {/* 1-Click WhatsApp Direct Quick Buy */}
            <a
              href={`https://wa.me/919033598639?text=${encodeURIComponent(
                `Hello Mahalaxmi Enterprises, I want to order "${product.name}" (SKU: ${product.sku}) at ₹${product.retailPrice}. Please confirm stock & dispatch.`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="col-start-2 shrink-0 rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-emerald-700 transition hover:bg-emerald-600 hover:text-white sm:col-start-auto sm:rounded-xl sm:p-2.5"
              title="Ask us about this product on WhatsApp"
              aria-label={`Ask about ${product.name} on WhatsApp`}
            >
              <MessageCircle className="w-4 h-4" />
            </a>

            <Link
              to={`/product/${product.slug}`}
              className="col-start-3 shrink-0 rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:border-indigo hover:text-indigo sm:col-start-auto sm:rounded-xl sm:p-2.5"
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
