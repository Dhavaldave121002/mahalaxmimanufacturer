import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../../types';
import { useApp } from '../../context/AppContext';
import { ShoppingCart, Star, Check, Zap, Layers, ArrowUpRight } from 'lucide-react';
import { Badge } from './Badge';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useApp();
  const [added, setAdded] = useState(false);

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
    <div className="group relative bg-white rounded-2xl border border-slate-200/90 hover:border-indigo/40 overflow-hidden shadow-subtle hover:shadow-card transition-all duration-300 flex flex-col">
      {/* Top Image & Badges Container */}
      <Link to={`/product/${product.slug}`} className="relative aspect-[4/3] overflow-hidden bg-slate-100 block">
        <img
          src={product.images[0]}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Floating Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start z-10">
          {product.isDirectMillDeal && (
            <span className="badge-mill text-[10px] font-bold px-2 py-0.5 rounded shadow-sm flex items-center gap-1">
              <Zap className="w-2.5 h-2.5 fill-current" />
              DIRECT MILL
            </span>
          )}
          {product.isBestSeller && (
            <Badge variant="champagne" size="sm" className="font-bold">
              BESTSELLER
            </Badge>
          )}
        </div>

        {discountPercent > 0 && (
          <div className="absolute top-2.5 right-2.5 bg-error text-white text-[11px] font-black px-2 py-0.5 rounded shadow-sm">
            {discountPercent}% OFF
          </div>
        )}
      </Link>

      {/* Product Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Category & Subcategory line */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
            <span className="font-medium text-indigo truncate">{product.categoryName}</span>
            <span className="text-slate-400">•</span>
            <span className="truncate">{product.subcategory}</span>
          </div>

          {/* Product Title */}
          <Link to={`/product/${product.slug}`} className="block group-hover:text-indigo transition">
            <h3 className="font-bold text-sm text-navy line-clamp-2 leading-snug">
              {product.name}
            </h3>
          </Link>

          {/* Ratings & Reviews */}
          <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-600">
            <div className="flex items-center text-amber-500 font-bold">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span className="ml-0.5 text-xs text-slate-800">{product.rating}</span>
            </div>
            <span className="text-slate-400">({product.reviewCount})</span>
            <span className="text-[10px] text-slate-400 font-mono ml-auto">SKU: {product.sku.slice(-6)}</span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100">
          {/* Price & Wholesale Tier Highlight */}
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-extrabold text-navy">
              ₹{product.retailPrice.toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-slate-400 line-through">
              ₹{product.mrp.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">/ unit</span>
          </div>

          {bestTier && (
            <div className="mt-1.5 bg-indigo-light/80 border border-indigo-100 rounded-lg p-1.5 text-[11px] text-indigo flex items-center justify-between">
              <span className="font-semibold">Bulk Rate ({bestTier.minQty}+ pcs):</span>
              <span className="font-bold text-indigo-dark">₹{bestTier.pricePerUnit} ({bestTier.savingsPercent}% off)</span>
            </div>
          )}

          {/* Quick Action Button */}
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={handleQuickAdd}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm ${
                added
                  ? 'bg-emerald-600 text-white'
                  : 'bg-navy hover:bg-navy-800 text-white'
              }`}
            >
              {added ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Added to Cart
                </>
              ) : (
                <>
                  <ShoppingCart className="w-3.5 h-3.5 text-champagne" />
                  Add to Cart
                </>
              )}
            </button>

            <Link
              to={`/product/${product.slug}`}
              className="p-2 border border-slate-200 hover:border-indigo hover:text-indigo rounded-xl text-slate-600 transition"
              title="View full specs & wholesale tiers"
            >
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
