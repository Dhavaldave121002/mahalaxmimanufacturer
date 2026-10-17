import React, { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ProductVariant } from '../types';
import { Badge } from '../components/common/Badge';
import { ProductCard } from '../components/common/ProductCard';
import {
  Star,
  ShieldCheck,
  Truck,
  RotateCcw,
  CheckCircle2,
  ShoppingCart,
  Zap,
  Building2,
  Layers,
  MapPin,
  ChevronRight,
  Info,
  Clock,
  Share2,
  Heart,
  Check,
  Eye,
  Flame,
  Timer,
  Sparkles,
  Box,
  PackageCheck,
  Package,
  Boxes,
  MessageSquare
} from 'lucide-react';
import { StickyPurchaseBar } from '../components/common/StickyPurchaseBar';
import { FrequentlyBoughtTogether } from '../components/common/FrequentlyBoughtTogether';
import { SEOProductHead } from '../components/common/SEOProductHead';

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const {
    products,
    addToCart,
    deliveryPincode,
    deliveryInfo,
    checkPincode,
    currentUser
  } = useApp();

  const product = products.find(p => p.slug === slug);

  // States
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(
    product?.variants?.[0]
  );
  const [quantity, setQuantity] = useState<number>(product?.moq || 1);
  const [pinInput, setPinInput] = useState(deliveryPincode);
  const [addedAnimation, setAddedAnimation] = useState(false);
  const [activeTab, setActiveTab] = useState<'specs' | 'tiers' | 'care' | 'reviews'>('specs');

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-navy">Product Not Found</h2>
        <p className="text-sm text-slate-500">The product you are looking for is unavailable or discontinued.</p>
        <Link to="/catalog" className="inline-block px-5 py-2.5 bg-indigo text-white rounded-xl text-xs font-bold">
          Back to Catalog
        </Link>
      </div>
    );
  }

  // Dynamic Wholesale Tier Calculation for current selected quantity
  const activeWholesaleTier = useMemo(() => {
    if (!product.wholesaleTiers || product.wholesaleTiers.length === 0) return null;
    const sorted = [...product.wholesaleTiers].sort((a, b) => b.minQty - a.minQty);
    return sorted.find(t => quantity >= t.minQty) || product.wholesaleTiers[0];
  }, [product, quantity]);

  const currentUnitPrice = activeWholesaleTier
    ? activeWholesaleTier.pricePerUnit
    : product.retailPrice;

  const currentLineTotal = currentUnitPrice * quantity;
  const standardRetailTotal = product.retailPrice * quantity;
  const wholesaleSavings = standardRetailTotal - currentLineTotal;

  // Next tier progress calculation
  const nextTier = useMemo(() => {
    if (!product.wholesaleTiers || product.wholesaleTiers.length === 0) return null;
    const sorted = [...product.wholesaleTiers].sort((a, b) => a.minQty - b.minQty);
    return sorted.find(t => t.minQty > quantity) || null;
  }, [product, quantity]);

  const pcsNeededForNextTier = nextTier ? nextTier.minQty - quantity : 0;
  const nextTierSavingsPerPc = nextTier ? currentUnitPrice - nextTier.pricePerUnit : 0;

  // GST ITC calculation
  const gstAmount = Math.round(currentLineTotal * (product.gstRate / (100 + product.gstRate)));
  const netEffectiveCost = currentLineTotal - gstAmount;

  const handleAddToCart = () => {
    addToCart(product, quantity, selectedVariant);
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 2000);
  };

  const handleBuyNow = () => {
    addToCart(product, quantity, selectedVariant);
    navigate('/checkout');
  };

  const handleOrderSamplePiece = () => {
    const sampleVariant: ProductVariant = {
      id: `sample-${product.id}`,
      name: `${selectedVariant?.name || 'Standard'} [Evaluation Sample 1-Pc]`,
      sku: `${product.sku}-SMP`,
      inStock: true
    };
    addToCart(product, 1, sampleVariant);
    navigate('/cart');
  };

  const handleOrderSampleBundle = () => {
    const bundle = products.find(p => p.id === 'prod-sample-bundle-all') || products.find(p => p.id === 'prod-swatch-box-01');
    if (bundle) {
      addToCart(bundle, 1);
    }
    navigate('/cart');
  };

  const handlePincodeCheck = (e: React.FormEvent) => {
    e.preventDefault();
    checkPincode(pinInput);
  };

  // Related products
  const relatedProducts = products
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-12 pb-20">
      {/* Dynamic SEO, Schema.org JSON-LD & City/State Geo Ranking */}
      <SEOProductHead product={product} city={deliveryInfo?.city || 'Surat'} state={deliveryInfo?.state || 'Gujarat'} />

      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link to="/" className="hover:text-indigo">Home</Link>
        <span>/</span>
        <Link to={`/category/${product.category}`} className="hover:text-indigo">{product.categoryName}</Link>
        <span>/</span>
        <span className="text-slate-400">{product.subcategory}</span>
        <span>/</span>
        <span className="font-semibold text-navy truncate max-w-xs">{product.name}</span>
      </div>

      {/* Main Product Layout: Gallery (Left) + Details & Tiers (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Image Gallery */}
        <div className="lg:col-span-6 space-y-4">
          {/* Hero Main Image with Zoom container */}
          <div className="relative aspect-[4/3] rounded-3xl overflow-hidden bg-slate-100 border border-slate-200 shadow-subtle group">
            <img
              src={product.images[selectedImageIndex] || product.images[0]}
              alt={product.name}
              onError={e => {
                const target = e.target as HTMLImageElement;
                if (target.src !== product.images[0]) target.src = product.images[0];
              }}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />

            {/* Badges Overlay */}
            <div className="absolute top-4 left-4 flex flex-col gap-1.5 items-start">
              {product.isDirectMillDeal && (
                <span className="badge-mill text-xs font-bold px-3 py-1 rounded shadow-sm flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  DIRECT MILL WEAVE
                </span>
              )}
              {product.isBestSeller && (
                <Badge variant="champagne" size="sm" className="font-bold">
                  BEST SELLER
                </Badge>
              )}
            </div>

            <div className="absolute bottom-4 right-4 bg-navy/80 backdrop-blur-md text-white text-[11px] px-2.5 py-1 rounded-full font-mono">
              HSN {product.hsnCode} • GST {product.gstRate}%
            </div>
          </div>

          {/* Thumbnails Row */}
          {product.images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2 hide-scrollbar">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  aria-label={`View photo ${idx + 1} of ${product.name}`}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition shrink-0 ${
                    selectedImageIndex === idx
                      ? 'border-indigo ring-2 ring-indigo/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <img
                    src={img}
                    alt={`${product.name} thumbnail ${idx + 1}`}
                    onError={e => {
                      const target = e.target as HTMLImageElement;
                      if (target.src !== product.images[0]) target.src = product.images[0];
                    }}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Factory Direct Assurance Notice */}
          <div className="p-4 bg-ivory rounded-2xl border border-slate-200 text-xs space-y-2 text-slate-700">
            <div className="flex items-center gap-2 text-navy font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Surat Direct Manufacturing & Inspection Guarantee</span>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Every batch undergoes 4-point fabric inspection for tensile strength, colorfastness, and dimensional stability before palletization.
            </p>
          </div>
        </div>

        {/* Right Column: Pricing, Tiers, Variants, and Action Controls */}
        <div className="lg:col-span-6 space-y-6">
          {/* Header & Title */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-indigo uppercase tracking-wider">{product.subcategory}</span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-mono text-slate-500">SKU: {product.sku}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-navy tracking-tight leading-snug">
              {product.name}
            </h1>

            {/* Ratings & Review summary */}
            <div className="flex items-center gap-3 mt-2.5 text-xs">
              <div className="flex items-center text-amber-500 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                <Star className="w-3.5 h-3.5 fill-current" />
                <span className="ml-1 text-slate-900">{product.rating}</span>
              </div>
              <span className="text-slate-500">({product.reviewCount} verified ratings)</span>
              <span className="text-slate-300">•</span>
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                In Stock ({product.stock} units available at mill)
              </span>
            </div>

            {/* High-Conversion Scarcity & Urgency Triggers */}
            <div className="mt-3.5 p-3 bg-amber-50/70 border border-amber-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-amber-900 font-medium flex-wrap">
                <span className="flex h-2 w-2 relative shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="flex items-center gap-1 font-bold text-slate-800">
                  <Eye className="w-3.5 h-3.5 text-indigo shrink-0" />
                  24 buyers active
                </span>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1 font-semibold text-rose-700">
                  <Flame className="w-3.5 h-3.5 text-rose-600 fill-current shrink-0" />
                  Only {Math.min(product.stock, 14)} packs left in Surat Mill lot
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-slate-700 font-medium text-[11px] bg-white/80 px-2 py-1 rounded-lg border border-amber-200/50">
                <Timer className="w-3.5 h-3.5 text-indigo shrink-0" />
                <span>Order within <strong>2h 15m</strong> for same-day shipping</span>
              </div>
            </div>
          </div>

          {/* Dynamic Pricing Engine Box */}
          <div className="bg-slate-50 rounded-2xl p-3.5 sm:p-5 border border-slate-200 space-y-3 overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2.5">
              <div>
                <span className="text-xs text-slate-500 block mb-0.5">Effective Rate for {quantity} Units:</span>
                <div className="flex items-baseline gap-2 sm:gap-3 flex-wrap">
                  <span className="text-2xl sm:text-3xl font-black text-navy">
                    ₹{currentUnitPrice.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs sm:text-sm text-slate-400 line-through">
                    MRP ₹{product.mrp.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                    {Math.round(((product.mrp - currentUnitPrice) / product.mrp) * 100)}% Off MRP
                  </span>
                </div>
              </div>

              <div className="text-left sm:text-right pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/80">
                <span className="text-[11px] text-slate-500 block">Total Batch Value:</span>
                <span className="text-lg sm:text-xl font-bold text-indigo">
                  ₹{currentLineTotal.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {wholesaleSavings > 0 && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
                <span className="font-semibold">Wholesale Volume Savings:</span>
                <span className="font-bold">You save ₹{wholesaleSavings.toLocaleString('en-IN')} vs retail</span>
              </div>
            )}

            {/* GSTR-2B Input Tax Credit Callout */}
            <div className="p-3 bg-indigo-50/70 border border-indigo-200/80 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start sm:items-center gap-2.5">
                <Building2 className="w-4 h-4 text-indigo shrink-0 mt-0.5 sm:mt-0" />
                <div>
                  <span className="font-bold text-navy block">
                    GST Registered Business? Claim ₹{gstAmount.toLocaleString('en-IN')} via GSTR-2B ITC
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Net effective landed cost: <strong className="text-navy">₹{netEffectiveCost.toLocaleString('en-IN')}</strong> (₹{Math.round(netEffectiveCost / quantity)}/pc)
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-black bg-indigo/10 text-indigo px-2 py-1 rounded whitespace-nowrap self-start sm:self-auto">
                100% ITC REBATE
              </span>
            </div>
          </div>

          {/* Wholesale Quantity Pricing Tiers Grid */}
          {product.wholesaleTiers && product.wholesaleTiers.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-navy flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-indigo" />
                  <span>Quantity-Based Wholesale Pricing Tiers</span>
                </label>
                <span className="text-[10px] text-slate-500">Automatic tier qualification</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {product.wholesaleTiers.map((tier, idx) => {
                  const isActive = activeWholesaleTier?.minQty === tier.minQty;
                  return (
                    <button
                      key={idx}
                      onClick={() => setQuantity(tier.minQty)}
                      className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                        isActive
                          ? 'border-indigo bg-indigo-light text-navy ring-2 ring-indigo/20 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider block text-slate-500">
                          {tier.maxQty ? `${tier.minQty}-${tier.maxQty} Pcs` : `${tier.minQty}+ Pcs`}
                        </span>
                        <p className="font-black text-sm text-navy mt-1">₹{tier.pricePerUnit}</p>
                      </div>
                      <span className={`text-[10px] font-bold mt-2 ${tier.savingsPercent > 0 ? 'text-emerald-700' : 'text-slate-400'}`}>
                        {tier.savingsPercent > 0 ? `${tier.savingsPercent}% Bulk Off` : 'Standard Rate'}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Live Tier Progress Bar */}
              {nextTier && (
                <div className="p-3 bg-gradient-to-r from-indigo-50 to-amber-50/60 rounded-xl border border-indigo-200/70 text-xs space-y-1.5 mt-2">
                  <div className="flex justify-between items-center text-navy font-bold">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo fill-indigo" />
                      Next Wholesale Rate Unlock
                    </span>
                    <span className="text-indigo font-black">
                      Add {pcsNeededForNextTier} more pcs
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-indigo to-champagne h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(100, Math.round((quantity / nextTier.minQty) * 100))}%`
                      }}
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-1 text-[11px] text-slate-600">
                    <span>Current: {quantity} pcs</span>
                    <span>
                      Add {pcsNeededForNextTier} pcs to pay <strong>₹{nextTier.pricePerUnit}/pc</strong> (Extra ₹{nextTierSavingsPerPc}/pc savings)
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Variant Picker (Color / Size) */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="text-xs font-bold text-navy block">
                Select Shade / Dimension: <span className="text-indigo font-semibold">{selectedVariant?.name}</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {product.variants.map(v => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(v)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium border transition flex items-center gap-2 ${
                      selectedVariant?.id === v.id
                        ? 'border-navy bg-navy text-white shadow-subtle'
                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    {v.colorHex && (
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0"
                        style={{ backgroundColor: v.colorHex }}
                      ></span>
                    )}
                    <span>{v.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity Selector & Purchase Buttons */}
          <div className="space-y-4 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-4">
              <div className="flex items-center">
                <span className="text-xs font-bold text-slate-700 mr-3">Quantity:</span>
                <div className="flex items-center border border-slate-300 rounded-xl overflow-hidden bg-white">
                  <button
                    onClick={() => setQuantity(prev => Math.max(product.moq || 1, prev - 1))}
                    className="px-3 py-2 text-slate-600 hover:bg-slate-100 font-bold text-sm transition"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={product.moq || 1}
                    value={quantity}
                    onChange={e => setQuantity(Math.max(product.moq || 1, Number(e.target.value)))}
                    className="w-16 text-center text-xs font-bold text-navy focus:outline-none py-2"
                  />
                  <button
                    onClick={() => setQuantity(prev => prev + 1)}
                    className="px-3 py-2 text-slate-600 hover:bg-slate-100 font-bold text-sm transition"
                  >
                    +
                  </button>
                </div>
              </div>

              {product.moq > 1 && (
                <span className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded">
                  MOQ: {product.moq} units
                </span>
              )}
            </div>

            {/* Add to Cart & Buy Now Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={handleAddToCart}
                className={`py-3.5 px-6 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 shadow-sm ${
                  addedAnimation
                    ? 'bg-emerald-600 text-white'
                    : 'bg-navy hover:bg-navy-800 text-white'
                }`}
              >
                {addedAnimation ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Added {quantity} Units to Cart</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4 text-champagne" />
                    <span>Add to Cart (₹{currentLineTotal.toLocaleString('en-IN')})</span>
                  </>
                )}
              </button>

              <button
                onClick={handleBuyNow}
                className="py-3.5 px-6 bg-indigo hover:bg-indigo-dark text-white rounded-xl font-bold text-xs transition shadow-premium flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4" />
                <span>Buy Now • Fast Checkout</span>
              </button>
            </div>

            {/* Direct WhatsApp Order & Mill Sales Desk */}
            <a
              href={`https://wa.me/918511172099?text=${encodeURIComponent(
                `Namaste Mahalaxmi Enterprises, I am interested in ${product.name} (SKU: ${product.sku}). Qty: ${quantity} pcs. Price: ₹${currentLineTotal}. Please provide mill dispatch availability for ${deliveryInfo?.city || 'my city'}.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 shadow-sm"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Order / Inquire via WhatsApp (Mill Desk: +91 85111 72099)</span>
            </a>

            {/* Geo & Mill Direct Guarantee Banner */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2 text-[11px] text-slate-600 font-medium">
              <span className="flex items-center gap-1.5 text-navy font-bold">
                <MapPin className="w-3.5 h-3.5 text-indigo shrink-0" />
                <span>Direct Mill Dispatch to {deliveryInfo?.city || 'Surat'}, {deliveryInfo?.state || 'Gujarat'} & All India</span>
              </span>
              <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shrink-0">
                🛡️ 7-Day Return / Exchange
              </span>
            </div>

            {/* Commercial Sample & Sample Bundle Procurement Suite */}
            <div className="p-4 bg-gradient-to-r from-amber-50/90 via-orange-50/60 to-amber-50/90 border border-amber-200/90 rounded-2xl space-y-3 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <span className="text-xs font-black text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                  <PackageCheck className="w-4 h-4 text-amber-600 shrink-0" />
                  B2B Quality Testing & Sample Evaluation
                </span>
                <span className="text-[10px] bg-amber-200 text-amber-900 font-extrabold px-2 py-0.5 rounded-full self-start sm:self-auto">
                  100% Rebate Guaranteed
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Test fabric hand-feel, GSM weave weight, and wash durability before booking wholesale consignments. Sample costs are credited back 100% on your next bulk order:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={handleOrderSamplePiece}
                  className="w-full p-2.5 bg-white hover:bg-amber-100/70 border border-amber-300 text-navy rounded-xl font-bold text-xs transition flex items-center gap-2.5 shadow-sm text-left group"
                >
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 shrink-0 group-hover:bg-amber-200 transition">
                    <Package className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-navy text-xs truncate">Order 1-Pc Sample</div>
                    <div className="text-[10px] text-slate-500 font-normal">₹{product.retailPrice} • MOQ Bypassed</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={handleOrderSampleBundle}
                  className="w-full p-2.5 bg-white hover:bg-indigo-50/80 border border-indigo-300 text-navy rounded-xl font-bold text-xs transition flex items-center gap-2.5 shadow-sm text-left group"
                >
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo shrink-0 group-hover:bg-indigo-100 transition">
                    <Boxes className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-navy text-xs truncate">Order Sample Bundle</div>
                    <div className="text-[10px] text-slate-500 font-normal">₹299 • 12 Swatches + 4 Minis</div>
                  </div>
                </button>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[10px] text-amber-900 font-medium pt-0.5 gap-1">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  Includes official Mill GSM Certification
                </span>
                <Link
                  to={`/wholesale?sku=${product.sku}&product=${encodeURIComponent(product.name)}`}
                  className="text-indigo font-bold hover:underline"
                >
                  Need 500+ Units? RFQ →
                </Link>
              </div>
            </div>

            {/* Direct WhatsApp Instant Buy Button */}
            <a
              href={`https://wa.me/919876543210?text=${encodeURIComponent(
                `Hello Mahalaxmi Enterprises, I want to order ${quantity} units of "${product.name}" (SKU: ${product.sku}, ${selectedVariant?.name || 'Default'}) at ₹${currentUnitPrice}/pc. Total Value: ₹${currentLineTotal}. Please confirm stock & dispatch.`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 shadow-sm"
            >
              <span>💬 Instant Order on WhatsApp (Direct Loom Desk)</span>
            </a>

            {/* High-Conversion Trust Signals Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs pt-1">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-emerald-600 mb-1" />
                <span className="font-bold text-navy text-[11px]">7-Day Return</span>
                <span className="text-[10px] text-slate-500">Free Replacement</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col items-center justify-center">
                <Truck className="w-4 h-4 text-indigo mb-1" />
                <span className="font-bold text-navy text-[11px]">Fast Delivery</span>
                <span className="text-[10px] text-slate-500">Pan-India Freight</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col items-center justify-center">
                <Zap className="w-4 h-4 text-amber-500 mb-1" />
                <span className="font-bold text-navy text-[11px]">COD Available</span>
                <span className="text-[10px] text-slate-500">Pay on Inspection</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col items-center justify-center">
                <Building2 className="w-4 h-4 text-indigo mb-1" />
                <span className="font-bold text-navy text-[11px]">GST E-Invoice</span>
                <span className="text-[10px] text-slate-500">100% ITC Credit</span>
              </div>
            </div>
          </div>

          {/* Delivery PIN Code Checker */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
            <div className="flex items-center gap-2 font-bold text-navy">
              <MapPin className="w-4 h-4 text-indigo" />
              <span>Check Delivery Speed to Your Pincode</span>
            </div>
            <form onSubmit={handlePincodeCheck} className="flex gap-2">
              <input
                type="text"
                maxLength={6}
                value={pinInput}
                onChange={e => setPinInput(e.target.value.replace(/\D/g, ''))}
                placeholder="6-digit Indian PIN"
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono w-40 focus:border-indigo outline-none"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-navy text-white text-xs font-semibold rounded-lg hover:bg-navy-800 transition"
              >
                Check
              </button>
            </form>

            {deliveryInfo && (
              <p className="text-emerald-700 text-[11px] font-medium flex items-center gap-1 pt-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Deliverable to {deliveryInfo.city}, {deliveryInfo.state} in {deliveryInfo.estimatedDays} business days via Express Freight.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Frequently Bought Together Bundle Cross-Sell */}
      {relatedProducts.length > 0 && (
        <FrequentlyBoughtTogether
          currentProduct={product}
          bundleProducts={relatedProducts.slice(0, 2)}
        />
      )}

      {/* Product Information Tabs: Specs, Care Instructions, Wholesale Terms, Reviews */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-subtle space-y-6">
        <div className="flex border-b border-slate-200 overflow-x-auto gap-8">
          <button
            onClick={() => setActiveTab('specs')}
            className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap ${
              activeTab === 'specs'
                ? 'border-indigo text-indigo'
                : 'border-transparent text-slate-500 hover:text-navy'
            }`}
          >
            Technical Specifications
          </button>
          <button
            onClick={() => setActiveTab('tiers')}
            className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap ${
              activeTab === 'tiers'
                ? 'border-indigo text-indigo'
                : 'border-transparent text-slate-500 hover:text-navy'
            }`}
          >
            Commercial B2B Terms & ITC
          </button>
          <button
            onClick={() => setActiveTab('care')}
            className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap ${
              activeTab === 'care'
                ? 'border-indigo text-indigo'
                : 'border-transparent text-slate-500 hover:text-navy'
            }`}
          >
            Care & Commercial Laundering
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap ${
              activeTab === 'reviews'
                ? 'border-indigo text-indigo'
                : 'border-transparent text-slate-500 hover:text-navy'
            }`}
          >
            Verified Client Reviews ({product.reviewCount})
          </button>
        </div>

        {/* Tab 1: Technical Specifications Table */}
        {activeTab === 'specs' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
              {product.description}
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border border-slate-200 rounded-xl overflow-hidden">
                <tbody className="divide-y divide-slate-100">
                  <tr className="bg-slate-50">
                    <td className="py-2.5 px-4 font-bold text-slate-700 w-1/3">HSN Code</td>
                    <td className="py-2.5 px-4 font-mono font-semibold text-navy">{product.hsnCode}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-bold text-slate-700">Applicable GST Levy</td>
                    <td className="py-2.5 px-4 font-semibold text-navy">{product.gstRate}% (Eligible for Full Input Tax Credit)</td>
                  </tr>
                  {Object.entries(product.specifications).map(([key, val], i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-slate-50/60' : ''}>
                      <td className="py-2.5 px-4 font-bold text-slate-700">{key}</td>
                      <td className="py-2.5 px-4 text-slate-800">{String(val)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Commercial Wholesale Terms */}
        {activeTab === 'tiers' && (
          <div className="space-y-4 text-xs text-slate-700">
            <h4 className="font-bold text-sm text-navy">Wholesale Procurement Policy</h4>
            <ul className="space-y-2 list-disc list-inside text-slate-600">
              <li>All bulk consignments are billed with formal GST Tax Invoices from Surat jurisdiction (State Code 24).</li>
              <li>GST numbers entered during checkout automatically receive electronic GSTR-1 filings for instantaneous GSTR-2B input credit.</li>
              <li>Consignments above ₹50,000 include government-verified E-Way bills.</li>
              <li>Verified business buyers can apply for 30-Day revolving commercial trade credit through the B2B portal.</li>
            </ul>
          </div>
        )}

        {/* Tab 3: Care Instructions */}
        {activeTab === 'care' && (
          <div className="space-y-3 text-xs text-slate-700">
            <h4 className="font-bold text-sm text-navy">Industrial & Domestic Washing Instructions</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(product.careInstructions || [
                'Wash before first use in cold water',
                'Machine wash gentle cycle with mild liquid detergent',
                'Do not use harsh chlorine bleach',
                'Tumble dry low heat or line dry in shade'
              ]).map((inst, i) => (
                <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo shrink-0" />
                  <span>{inst}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Reviews */}
        {activeTab === 'reviews' && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="text-center pr-6 border-r border-slate-200">
                <span className="text-3xl font-black text-navy">{product.rating}</span>
                <div className="flex text-amber-500 justify-center mt-1">
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                </div>
                <span className="text-[11px] text-slate-500 mt-0.5 block">{product.reviewCount} Reviews</span>
              </div>
              <div className="text-xs text-slate-600 space-y-1">
                <p className="font-bold text-slate-800">100% Genuine Commercial Buyer Feedback</p>
                <p>Ratings verified from hotel procurement desks, retail shopkeepers, and verified direct consumers.</p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="p-4 bg-white rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-navy">Harish M. (Grand Heritage Palace, Udaipur)</span>
                  <span className="text-slate-400 text-[10px]">2 weeks ago • Verified Bulk Order (150 Pcs)</span>
                </div>
                <div className="flex text-amber-500">
                  <Star className="w-3 h-3 fill-current" />
                  <Star className="w-3 h-3 fill-current" />
                  <Star className="w-3 h-3 fill-current" />
                  <Star className="w-3 h-3 fill-current" />
                  <Star className="w-3 h-3 fill-current" />
                </div>
                <p className="text-slate-600 pt-1">
                  "Outstanding fabric quality and dimensional stability. Surpassed 40 industrial wash cycles with zero shrinkage. Direct mill rates saved our property over ₹45,000 compared to regional distributors."
                </p>
              </div>

              <div className="p-4 bg-white rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-navy">Sanjay K. (Kalyan Handlooms, Ahmedabad)</span>
                  <span className="text-slate-400 text-[10px]">1 month ago • Retailer</span>
                </div>
                <div className="flex text-amber-500">
                  <Star className="w-3 h-3 fill-current" />
                  <Star className="w-3 h-3 fill-current" />
                  <Star className="w-3 h-3 fill-current" />
                  <Star className="w-3 h-3 fill-current" />
                  <Star className="w-3 h-3 fill-current" />
                </div>
                <p className="text-slate-600 pt-1">
                  "Packaging is clean and presentation is very premium for our retail shelves. Customers love the combed cotton hand-feel. Reordering another 50 packs today."
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Related Products Recommendation Row */}
      {relatedProducts.length > 0 && (
        <div className="space-y-6 pt-6">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-xl text-navy">Related Products in {product.categoryName}</h3>
            <Link to={`/category/${product.category}`} className="text-xs font-bold text-indigo hover:underline">
              View All &rarr;
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

      {/* High-Conversion Sticky Bottom Purchase Bar */}
      <StickyPurchaseBar
        product={product}
        selectedVariant={selectedVariant}
        quantity={quantity}
        currentUnitPrice={currentUnitPrice}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
        addedAnimation={addedAnimation}
      />
    </div>
  );
};
