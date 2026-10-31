import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  Trash2,
  ArrowRight,
  ShieldCheck,
  Tag,
  ShoppingBag,
  Building2,
  CheckCircle2,
  AlertCircle,
  Truck,
  RotateCcw,
  Timer,
  Sparkles,
  Percent,
  Lock,
  Check,
  Zap,
  Mail,
  Palette
} from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { ProductCard } from '../components/common/ProductCard';
import { getCustomizationCharge, getSizeCharge } from '../constants/customizationPricing';
import { BUSINESS_WHATSAPP_NUMBER } from '../constants/businessContact';

export const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    cart,
    products,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    cartSubtotal,
    cartTax,
    cartShipping,
    cartTotal,
    appliedCoupon,
    couponDiscount,
    applyCoupon,
    removeCoupon,
    coupons,
    currentUser,
    deliveryInfo,
    sendAbandonedCartEmail
  } = useApp();

  const [couponInput, setCouponInput] = useState('');
  const [couponMsg, setCouponMsg] = useState<{ text: string; success: boolean } | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const recentlyViewedProducts = React.useMemo(() => {
    try {
      const stored = localStorage.getItem('mle_recently_viewed_products');
      const recentIds: string[] = stored ? JSON.parse(stored) : [];
      return recentIds
        .map(id => products.find(product => product.id === id))
        .filter((product): product is NonNullable<typeof product> => Boolean(product));
    } catch (error) {
      console.warn('Recently viewed products could not be loaded:', error);
      return [];
    }
  }, [products]);

  const renderRecentlyViewed = () => recentlyViewedProducts.length > 0 && (
    <section className="mx-auto w-full max-w-7xl space-y-4 text-left">
      <div>
        <h2 className="text-xl font-black text-navy sm:text-2xl">Recently Viewed</h2>
        <p className="mt-1 text-xs text-slate-500">Products you looked at recently.</p>
      </div>
      <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
        {recentlyViewedProducts.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );

  // Persistent Reservation Timer: Survives page refreshes using real-time timestamp
  const getInitialReservedTime = () => {
    try {
      if (!cart || cart.length === 0) {
        localStorage.removeItem('mahalaxmi_cart_reserved_until');
        return 15 * 60;
      }
      const stored = localStorage.getItem('mahalaxmi_cart_reserved_until');
      if (stored) {
        const target = parseInt(stored, 10);
        const diff = Math.floor((target - Date.now()) / 1000);
        if (diff > 0) return diff;
      }
      const newTarget = Date.now() + 15 * 60 * 1000; // 15 mins from now
      localStorage.setItem('mahalaxmi_cart_reserved_until', newTarget.toString());
      return 15 * 60;
    } catch {
      return 15 * 60;
    }
  };

  const [timeLeft, setTimeLeft] = useState<number>(getInitialReservedTime);

  // Notify user when coupon is automatically removed due to quantity decrease
  const prevAppliedCouponRef = React.useRef(appliedCoupon);
  React.useEffect(() => {
    if (prevAppliedCouponRef.current && !appliedCoupon) {
      setCouponMsg({
        text: `⚠️ Coupon "${prevAppliedCouponRef.current}" removed: Minimum order value not met.`,
        success: false
      });
    }
    prevAppliedCouponRef.current = appliedCoupon;
  }, [appliedCoupon]);

  // Active & Public 1-Click coupons configured by Admin for Storefront
  // (Excludes secret/email-only voucher codes like LAUNCH150 and APP_ONLY coupons)
  const featuredCoupons = coupons.filter(
    c =>
      c.isActive &&
      c.isFeatured &&
      c.suggestionMode !== 'SECRET_MANUAL_ONLY' &&
      (c.code || '').trim().toUpperCase() !== 'LAUNCH150' &&
      c.targetPlatform !== 'APP_ONLY'
  );
  const cartStockIssues = cart.reduce<{ productId: string; name: string; reason: string }[]>((issues, item) => {
    if (issues.some(issue => issue.productId === item.productId)) return issues;
    const currentProduct = products.find(product => product.id === item.productId) ?? item.product;
    const quantity = cart
      .filter(cartItem => cartItem.productId === item.productId)
      .reduce((total, cartItem) => total + cartItem.quantity, 0);

    if (currentProduct.stock <= 0) {
      issues.push({ productId: item.productId, name: item.product.name, reason: 'Out of stock' });
    } else if (quantity > currentProduct.stock) {
      issues.push({ productId: item.productId, name: item.product.name, reason: `Only ${currentProduct.stock} left in stock` });
    }
    return issues;
  }, []);

  // Abandoned cart email recovery state (Empty by default so user enters their own email)
  const [emailCartInput, setEmailCartInput] = useState('');
  const [emailCartSending, setEmailCartSending] = useState(false);
  const [emailCartStatus, setEmailCartStatus] = useState<string | null>(null);
  const [recoveryOffer, setRecoveryOffer] = useState<{ discount: number } | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    setRecoveryOffer(null);
    if (cart.length === 0) return;

    fetch('/api/abandoned-cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'OFFER',
        subtotal: cartSubtotal,
        source: 'WEB',
        customerType: currentUser?.role && currentUser.role !== 'consumer' ? 'B2B' : 'B2C'
      })
    })
      .then(async response => {
        if (!response.ok) return null;
        return response.json();
      })
      .then(data => {
        if (!cancelled && data?.success && data.available && Number.isFinite(Number(data.offer?.discount))) {
          setRecoveryOffer({
            discount: Number(data.offer.discount)
          });
        }
      })
      .catch(error => {
        console.warn('Current cart offer could not be verified:', error);
      });

    return () => {
      cancelled = true;
    };
  }, [cart.length, cartSubtotal, currentUser?.role]);

  const handleSendCartEmail = async () => {
    if (!emailCartInput.trim() || !emailCartInput.includes('@')) {
      setEmailCartStatus('Please enter a valid email address.');
      return;
    }
    setEmailCartSending(true);
    setEmailCartStatus(null);
    const res = await sendAbandonedCartEmail(emailCartInput.trim(), currentUser?.name || 'Valued Customer');
    setEmailCartSending(false);
    setEmailCartStatus(res.success ? `✅ ${res.message}` : res.message);
    if (res.success) {
      setEmailCartInput('');
    }
  };

  React.useEffect(() => {
    if (!cart || cart.length === 0) {
      try {
        localStorage.removeItem('mahalaxmi_cart_reserved_until');
      } catch {}
      setTimeLeft(15 * 60);
      return;
    }

    // When cart has items, ensure a valid future timestamp exists
    try {
      const stored = localStorage.getItem('mahalaxmi_cart_reserved_until');
      if (!stored || parseInt(stored, 10) <= Date.now()) {
        const newTarget = Date.now() + 15 * 60 * 1000;
        localStorage.setItem('mahalaxmi_cart_reserved_until', newTarget.toString());
        setTimeLeft(15 * 60);
      }
    } catch {}

    const updateTime = () => {
      try {
        const stored = localStorage.getItem('mahalaxmi_cart_reserved_until');
        if (stored) {
          const target = parseInt(stored, 10);
          const diff = Math.floor((target - Date.now()) / 1000);
          setTimeLeft(diff > 0 ? diff : 0);
          return;
        }
      } catch {}
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, [cart?.length]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleApplyCoupon = async (e?: React.FormEvent, code?: string) => {
    if (e) e.preventDefault();
    const targetCode = code || couponInput;
    if (!targetCode.trim()) return;
    setIsApplyingCoupon(true);
    try {
      const res = await applyCoupon(targetCode);
      setCouponMsg({ text: res.message, success: res.success });
      if (res.success) setCouponInput('');
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="space-y-12 px-4 py-12 sm:py-16">
        <div className="mx-auto max-w-4xl space-y-6 text-center">
          <div className="w-20 h-20 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
            <ShoppingBag className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-navy">Your Shopping Cart is Empty</h2>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Discover direct mill rates across combed cotton bedsheets, 600 GSM towels, and commercial essentials.
            </p>
          </div>
          <div className="pt-2 flex justify-center gap-4">
            <Link
              to="/catalog"
              className="px-6 py-3 bg-indigo text-white rounded-xl text-xs font-bold hover:bg-indigo-dark transition shadow-sm"
            >
              Explore Product Catalog
            </Link>
            <Link
              to="/wholesale"
              className="px-6 py-3 bg-white text-navy border border-slate-300 rounded-xl text-xs font-bold hover:bg-slate-50 transition"
            >
              Open Wholesale Order Pad
            </Link>
          </div>
        </div>
        {renderRecentlyViewed()}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-navy tracking-tight">
            Review Your Order Cart
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {cart.length} unique line {cart.length === 1 ? 'item' : 'items'} • Wholesale volume pricing calculated dynamically
          </p>
        </div>

        <button
          onClick={clearCart}
          className="text-xs text-slate-500 hover:text-error transition font-semibold"
        >
          Clear Entire Cart
        </button>
      </div>

      {/* Unified Luxury Shipping & Reserved Pricing Guarantee Banner */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-subtle space-y-3">
        {/* Top Header Row: Delivery Goal & Reserved Timer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Free Shipping Status */}
          <div className="flex items-center gap-3 text-xs">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              cartSubtotal >= 1499 ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo/10 text-indigo'
            }`}>
              <Truck className="w-5 h-5" />
            </div>
            <div>
              {cartSubtotal >= 1499 ? (
                <div className="font-extrabold text-emerald-800 flex items-center gap-1.5 text-xs sm:text-sm">
                  <span>🎉 FREE Direct Mill Delivery Unlocked!</span>
                </div>
              ) : (
                <div className="font-extrabold text-navy text-xs sm:text-sm">
                  Add <span className="text-indigo">₹{(1499 - cartSubtotal).toLocaleString('en-IN')}</span> more for <span className="text-emerald-700">FREE Direct Mill Delivery</span>
                </div>
              )}
              <p className="text-[11px] text-slate-500">
                Direct mill dispatch with 4-point fabric inspection guarantee.
              </p>
            </div>
          </div>

          {/* Reserved Pricing Timer Pill */}
          <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50/80 border border-amber-200 rounded-xl text-xs">
              <span className="flex h-2 w-2 relative shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <span className="font-bold text-amber-900 text-[11px]">Rates Reserved:</span>
              <span className="font-black font-mono text-rose-700 text-xs tracking-wider">
                {formatTime(timeLeft)}
              </span>
            </div>
            <div className="hidden xs:flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-xl">
              <Lock className="w-3 h-3 text-emerald-600" />
              <span>Locked</span>
            </div>
          </div>
        </div>

        {/* Progress Bar with Milestones */}
        <div className="space-y-1.5 pt-1">
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-200/50">
            <div
              className={`h-full transition-all duration-700 rounded-full ${
                cartSubtotal >= 1499
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                  : 'bg-gradient-to-r from-indigo via-indigo-500 to-indigo-600'
              }`}
              style={{ width: `${Math.min(100, Math.round((cartSubtotal / 1499) * 100))}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span>₹0 (Standard Rate)</span>
            <span className="font-bold text-indigo font-mono">
              {Math.min(100, Math.round((cartSubtotal / 1499) * 100))}% Reached
            </span>
            <span className="font-bold text-emerald-700">₹1,499 (FREE Delivery)</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Item List (Left) + Pricing Summary (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Cart Items List */}
        <div className="lg:col-span-8 space-y-4">
          {cart.map(item => (
            <div
              key={item.id}
              className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-subtle flex flex-col md:flex-row gap-4 md:items-center justify-between"
            >
              {/* Image & Product info */}
              <div className="flex min-w-0 flex-1 items-center gap-4">
                <img
                  src={item.product.images[0]}
                  alt={item.product.name}
                  className="h-20 w-20 shrink-0 rounded-xl border border-slate-100 object-cover sm:h-24 sm:w-24"
                />
                <div className="space-y-1 min-w-0">
                  <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                    <span className="max-w-full truncate rounded bg-indigo-light px-2 py-0.5 text-[10px] font-bold text-indigo">
                      {item.product.subcategory}
                    </span>
                    <span className="max-w-full truncate whitespace-nowrap font-mono text-[10px] text-slate-400">
                      SKU: {item.product.sku}
                    </span>
                  </div>

                  <Link
                    to={`/product/${item.product.slug}`}
                    className="block line-clamp-2 text-sm font-bold text-navy transition hover:text-indigo"
                  >
                    {item.product.name}
                  </Link>

                  {item.selectedVariant && (
                    <p className="text-xs text-slate-500">
                      Variant: <span className="font-semibold text-slate-700">{item.selectedVariant.name}</span>
                    </p>
                  )}

                  {item.appliedTier && item.appliedTier.savingsPercent > 0 ? (
                    <span className="inline-block text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                      {item.appliedTier.label} ({item.appliedTier.savingsPercent}% Bulk Discount Applied)
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400">
                      Standard retail pricing ({item.product.wholesaleTiers?.[1]?.minQty ? `Order ${item.product.wholesaleTiers[1].minQty}+ for wholesale rate` : ''})
                    </span>
                  )}

                  {/* Customization & Branding Specs */}
                  {item.customization && item.customization.type && item.customization.type !== 'No Customization' && (
                    <div className="mt-2 p-2.5 bg-purple-50 border border-purple-200 rounded-xl text-[11px] text-purple-900 space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5 font-bold">
                        <span className="px-1.5 py-0.5 bg-purple-600 text-white rounded text-[10px] flex items-center gap-1">
                          <Palette className="w-3 h-3" />
                          {item.customization.type}
                        </span>
                        {getCustomizationCharge(item.customization.type) > 0 && (
                          <span className="bg-purple-100 text-purple-800 border border-purple-300 px-1.5 py-0.2 rounded text-[10px] font-extrabold">
                            +₹{getCustomizationCharge(item.customization.type)}/pc
                          </span>
                        )}
                        {getSizeCharge(item.customization.selectedSize) > 0 && (
                          <span className="bg-amber-100 text-amber-800 border border-amber-300 px-1.5 py-0.2 rounded text-[10px] font-extrabold">
                            +₹{getSizeCharge(item.customization.selectedSize)}/pc Size Add-on
                          </span>
                        )}
                        {item.customization.logoText && (
                          <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-purple-200 text-navy">
                            "{item.customization.logoText}"
                          </span>
                        )}
                        {item.customization.logoPosition && (
                          <span className="text-[10px] text-slate-500 uppercase font-semibold">
                            • Pos: {item.customization.logoPosition}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-[10px] text-purple-800">
                        {item.customization.selectedSize && (
                          <span>📐 Size: <strong>{item.customization.selectedSize}</strong></span>
                        )}
                        {item.customization.customGsm && (
                          <span>🧶 GSM: <strong>{item.customization.customGsm}</strong></span>
                        )}
                        {item.customization.logoFileName && (
                          <span className="bg-white px-1.5 py-0.5 rounded border border-purple-200 text-purple-900 font-bold">
                            📎 Logo: {item.customization.logoFileName}
                          </span>
                        )}
                        {item.customization.designFileName && (
                          <span className="bg-white px-1.5 py-0.5 rounded border border-purple-200 text-purple-900 font-bold">
                            📎 Design: {item.customization.designFileName}
                          </span>
                        )}
                        {item.customization.techPackFileName && (
                          <span className="bg-white px-1.5 py-0.5 rounded border border-purple-200 text-purple-900 font-bold">
                            📎 Tech-Pack: {item.customization.techPackFileName}
                          </span>
                        )}
                        {item.customization.designNote && (
                          <span className="text-slate-600 truncate max-w-xs italic">
                            📝 Note: {item.customization.designNote}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Quantity Counter & Subtotal */}
              <div className="flex items-center justify-between gap-6 border-t border-slate-100 pt-3 md:justify-end md:border-t-0 md:pt-0">
                <div className="flex items-center border border-slate-300 rounded-xl overflow-hidden bg-white">
                  <button
                    onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                    className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 font-bold text-xs"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={item.selectedVariant?.id.startsWith('sample-') ? 1 : Math.max(1, item.product.moq || 1)}
                    value={item.quantity}
                    onChange={e => updateCartQuantity(item.id, Number(e.target.value))}
                    className="w-12 text-center text-xs font-bold text-navy focus:outline-none py-1"
                  />
                  <button
                    onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                    className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 font-bold text-xs"
                  >
                    +
                  </button>
                </div>

                <div className="text-right min-w-[90px]">
                  <p className="font-bold text-sm text-navy">
                    ₹{item.totalPrice.toLocaleString('en-IN')}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    ₹{item.unitPrice}/unit
                  </p>
                </div>

                <button
                  onClick={() => removeFromCart(item.id)}
                  className="p-2 text-slate-400 hover:text-error hover:bg-red-50 rounded-lg transition"
                  title="Remove from Cart"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {/* Direct Mill Guarantee Strip */}
          <div className="p-4 bg-ivory rounded-2xl border border-slate-200 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-700">
              <Truck className="w-4 h-4 text-indigo" />
              <span>
                {cartSubtotal >= 1499
                  ? 'Congratulations! You qualify for Free Direct Mill Shipping.'
                  : `Add ₹${1499 - cartSubtotal} more to qualify for Free Shipping.`}
              </span>
            </div>
            <span className="font-bold text-emerald-700">
              {cartSubtotal >= 1499 ? 'FREE FREIGHT' : '₹99 STANDARD'}
            </span>
          </div>
        </div>

        {/* Right Column: Order Summary & Checkout Trigger */}
        <div className="lg:col-span-4 space-y-5">
          {/* Coupon Code Section */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-subtle space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-navy">
              <Tag className="w-4 h-4 text-indigo" />
              <span>Apply Discount Coupon</span>
            </div>

            {appliedCoupon ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-emerald-800">{appliedCoupon}</span>
                  <p className="text-[11px] text-emerald-700">Savings: -₹{couponDiscount}</p>
                </div>
                <button
                  onClick={removeCoupon}
                  className="text-xs font-bold text-emerald-800 hover:underline"
                >
                  Remove
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  value={couponInput}
                  onChange={e => setCouponInput(e.target.value)}
                  placeholder="MILLDIRECT10 or BULK500"
                  className="flex-1 uppercase text-xs px-3 py-2 border border-slate-300 rounded-xl focus:border-indigo outline-none"
                />
                <button
                  type="submit"
                  disabled={isApplyingCoupon}
                  className="px-4 py-2 bg-navy text-white text-xs font-bold rounded-xl hover:bg-navy-800 transition"
                >
                  {isApplyingCoupon ? 'Checking…' : 'Apply'}
                </button>
              </form>
            )}

            <p className="text-[10.5px] text-slate-400">
              💡 Received a subscriber voucher via email? Enter your secret promo code above and tap Apply.
            </p>

            {couponMsg && (
              <p className={`text-[11px] font-semibold ${couponMsg.success ? 'text-emerald-700' : 'text-error'}`}>
                {couponMsg.text}
              </p>
            )}

            {/* Quick 1-Click Coupon Chips (Dynamically driven by Admin) */}
            {featuredCoupons.length > 0 && (
              <div className="pt-2 border-t border-slate-100 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700 block">
                    Tap to apply available mill coupons:
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    {featuredCoupons.length} Available
                  </span>
                </div>

                <div className="flex flex-col gap-1.5">
                  {featuredCoupons.map(coupon => {
                    const isApplied = appliedCoupon === coupon.code;
                    const isFlat = coupon.discountType === 'FLAT';
                    const minSpend = coupon.minOrderValue || 0;
                    const isQualified = cartSubtotal >= minSpend;
                    const shortAmt = minSpend - cartSubtotal;

                    return (
                      <div
                        key={coupon.id}
                        className={`p-2.5 rounded-xl border text-xs transition flex flex-col gap-1 ${
                          isApplied
                            ? 'border-emerald-500 bg-emerald-50/70 text-emerald-900 font-bold ring-1 ring-emerald-500 shadow-xs'
                            : isQualified
                            ? 'border-indigo/30 bg-indigo-50/20 hover:bg-indigo-50/50 text-slate-800'
                            : 'border-slate-200 bg-slate-50/70 text-slate-500'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0 pr-1">
                            <Tag className={`w-3.5 h-3.5 shrink-0 ${isApplied ? 'text-emerald-600' : isQualified ? 'text-indigo' : 'text-slate-400'}`} />
                            <span className="font-mono font-black text-slate-900 shrink-0">{coupon.code}</span>
                            <span className="text-[10px] text-slate-500 font-semibold truncate">
                              • {isFlat ? `₹${coupon.discountValue} FLAT OFF` : `${coupon.discountValue}% OFF`}
                            </span>
                          </div>

                          {isApplied ? (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded shrink-0 bg-emerald-200/70 text-emerald-900 flex items-center gap-1">
                              <Check className="w-3 h-3" /> Applied
                            </span>
                          ) : isQualified ? (
                            <button
                              type="button"
                              onClick={() => handleApplyCoupon(undefined, coupon.code)}
                              disabled={isApplyingCoupon}
                              className="px-2.5 py-1 bg-indigo hover:bg-indigo-dark text-white text-[10.5px] font-bold rounded-lg transition shadow-xs shrink-0 cursor-pointer"
                            >
                              1-Click Apply
                            </button>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded shrink-0 bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                              <Lock className="w-2.5 h-2.5 text-amber-600" /> Add ₹{shortAmt.toLocaleString('en-IN')} to unlock
                            </span>
                          )}
                        </div>

                        {minSpend > 0 && !isQualified && (
                          <p className="text-[9.5px] text-slate-400 pl-5">
                            Min. order of ₹{minSpend.toLocaleString('en-IN')} required to apply this coupon.
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Pricing Calculation Summary Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-subtle space-y-4">
            <h3 className="font-bold text-sm text-navy pb-3 border-b border-slate-100">
              Commercial Order Summary
            </h3>

            <div className="space-y-2.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Taxable Items Subtotal:</span>
                <span className="font-semibold text-navy">₹{cartSubtotal.toLocaleString('en-IN')}</span>
              </div>

              {couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Coupon Discount:</span>
                  <span>-₹{couponDiscount.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="flex items-center gap-1">
                  <span>Goods & Services Tax (GST):</span>
                </span>
                <span className="font-semibold text-navy">₹{Math.round(cartTax.totalTax).toLocaleString('en-IN')}</span>
              </div>

              <div className="flex justify-between">
                <span>Freight & Handling:</span>
                <span className="font-semibold text-navy">
                  {cartShipping === 0 ? 'FREE' : `₹${cartShipping}`}
                </span>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline text-navy">
                <span className="text-sm font-bold">Total Payable Amount:</span>
                <span className="text-xl font-black text-indigo">
                  ₹{cartTotal.toLocaleString('en-IN')}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 text-right">Inclusive of all taxes & shipping</p>
            </div>

            {/* Checkout Button */}
            {cartStockIssues.length > 0 && (
              <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">
                <p className="font-bold">Update unavailable items before checkout:</p>
                <ul className="mt-1 list-disc pl-4">
                  {cartStockIssues.map(issue => (
                    <li key={issue.productId}>{issue.name}: {issue.reason}</li>
                  ))}
                </ul>
              </div>
            )}
            <button
              onClick={() => navigate('/checkout')}
              disabled={cartStockIssues.length > 0}
              className={`flex w-full items-center justify-center gap-2 rounded-xl py-4 text-sm font-black shadow-premium transition ${
                cartStockIssues.length > 0
                  ? 'cursor-not-allowed bg-slate-300 text-slate-600'
                  : 'bg-indigo text-white hover:scale-[1.01] hover:bg-indigo-dark active:scale-[0.99]'
              }`}
            >
              <span>{cartStockIssues.length > 0 ? 'Resolve Stock Issues' : 'Proceed to Fast Checkout'}</span>
              {cartStockIssues.length === 0 && <ArrowRight className="w-4 h-4" />}
            </button>

            {/* 1-Click WhatsApp Quick Order */}
            <a
              href={`https://wa.me/${BUSINESS_WHATSAPP_NUMBER}?text=${encodeURIComponent(
                `Hello Mahalaxmi Enterprise, I want to order my cart items:\n` +
                cart.map(i => `- ${i.quantity}x ${i.product.name} (₹${i.unitPrice}/pc)`).join('\n') +
                `\n\nTotal Amount: ₹${cartTotal}\nPlease confirm order and share payment link / bank RTGS details.`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 shadow-sm text-center"
            >
              <span>💬 Confirm & Order Cart via WhatsApp</span>
            </a>

            {/* Email Cart Summary & verified admin offer */}
            {recoveryOffer && <div className="p-3.5 bg-gradient-to-br from-indigo-50/50 to-emerald-50/40 border border-indigo-100 rounded-2xl space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-navy flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-indigo" />
                  <span>Current store offer • Save ₹{recoveryOffer.discount.toLocaleString('en-IN')}</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                Email yourself a cart reminder with this currently active admin offer. The coupon code will be included in the email.
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={emailCartInput}
                  onChange={e => setEmailCartInput(e.target.value)}
                  placeholder="Enter your email to receive the cart offer..."
                  className="flex-1 px-3 py-2 text-xs bg-white rounded-xl border border-slate-300 outline-none focus:border-indigo"
                />
                <button
                  type="button"
                  onClick={handleSendCartEmail}
                  disabled={emailCartSending}
                  className="px-3.5 py-2 bg-navy hover:bg-navy-800 text-white rounded-xl text-xs font-bold transition shrink-0 cursor-pointer disabled:opacity-50"
                >
                  {emailCartSending ? 'Sending...' : 'Email Cart'}
                </button>
              </div>
              {emailCartStatus && (
                <p className={`text-[11px] font-bold ${emailCartStatus.includes('✅') ? 'text-emerald-700' : 'text-red-600'}`}>
                  {emailCartStatus}
                </p>
              )}
            </div>}

            {/* Payment & Security Trust Badges Strip */}
            <div className="pt-3 border-t border-slate-100 space-y-2.5">
              <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <Lock className="w-3 h-3 text-emerald-600" />
                <span>256-Bit Bank-Grade SSL Secure Checkout</span>
              </div>

              {/* B2B Trust Notice */}
              <div className="pt-2 text-[11px] text-slate-500 space-y-1">
                <p className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>GST tax invoice generated using your eligible business details.</span>
                </p>
                <p className="flex items-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5 text-indigo shrink-0" />
                  <span>7-Day Return & Replacement for manufacturing flaws.</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {renderRecentlyViewed()}
    </div>
  );
};
