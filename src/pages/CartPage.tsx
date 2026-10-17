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
  Mail
} from 'lucide-react';
import { Badge } from '../components/common/Badge';

export const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    cart,
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
  const [timeLeft, setTimeLeft] = useState(899); // 14 mins 59 secs

  // Active & Featured storefront coupons configured by Admin
  const featuredCoupons = coupons.filter(c => c.isActive && c.isFeatured);

  // Abandoned cart email recovery state
  const [emailCartInput, setEmailCartInput] = useState(currentUser?.email || '');
  const [emailCartSending, setEmailCartSending] = useState(false);
  const [emailCartStatus, setEmailCartStatus] = useState<string | null>(null);

  const handleSendCartEmail = async () => {
    if (!emailCartInput.trim() || !emailCartInput.includes('@')) {
      setEmailCartStatus('Please enter a valid email address.');
      return;
    }
    setEmailCartSending(true);
    setEmailCartStatus(null);
    const res = await sendAbandonedCartEmail(emailCartInput.trim(), currentUser?.name);
    setEmailCartSending(false);
    setEmailCartStatus(res.message);
  };

  React.useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleApplyCoupon = (e?: React.FormEvent, code?: string) => {
    if (e) e.preventDefault();
    const targetCode = code || couponInput;
    if (!targetCode.trim()) return;
    const res = applyCoupon(targetCode);
    setCouponMsg({ text: res.message, success: res.success });
    if (res.success) {
      setCouponInput('');
    }
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-6">
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

      {/* High-Conversion Scarcity & Cart Reservation Banner */}
      <div className="bg-amber-50/90 border border-amber-300/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 text-amber-950">
          <div className="p-1.5 bg-amber-200/70 rounded-lg text-amber-800">
            <Timer className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <span className="font-extrabold text-slate-900">
              High Demand: Direct Mill Rates Reserved for:
            </span>{' '}
            <span className="font-black text-rose-700 font-mono text-sm tracking-wider">
              {formatTime(timeLeft)}
            </span>
            <p className="text-[11px] text-amber-800">
              Complete checkout before timer expires to guarantee Surat mill batch pricing.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-bold text-emerald-800 bg-white/90 border border-emerald-200 px-3 py-1.5 rounded-xl shrink-0">
          <Lock className="w-3.5 h-3.5 text-emerald-600" />
          <span>Inventory Locked</span>
        </div>
      </div>

      {/* Interactive Free Shipping Progress Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-subtle space-y-2">
        <div className="flex items-center justify-between text-xs font-bold">
          <div className="flex items-center gap-2 text-navy">
            <Truck className="w-4 h-4 text-indigo" />
            <span>
              {cartSubtotal >= 1499 ? (
                <span className="text-emerald-700">🎉 Congratulations! You unlocked FREE Direct Mill Freight</span>
              ) : (
                <span>
                  Add <strong className="text-indigo">₹{(1499 - cartSubtotal).toLocaleString('en-IN')}</strong> more for FREE Direct Mill Freight
                </span>
              )}
            </span>
          </div>
          <span className="text-xs font-mono font-bold text-slate-500">
            {Math.min(100, Math.round((cartSubtotal / 1499) * 100))}%
          </span>
        </div>

        {/* Progress meter bar */}
        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              cartSubtotal >= 1499 ? 'bg-emerald-500' : 'bg-gradient-to-r from-indigo to-indigo-light'
            }`}
            style={{ width: `${Math.min(100, Math.round((cartSubtotal / 1499) * 100))}%` }}
          ></div>
        </div>
      </div>

      {/* Main Grid: Item List (Left) + Pricing Summary (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Cart Items List */}
        <div className="lg:col-span-8 space-y-4">
          {cart.map(item => (
            <div
              key={item.id}
              className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-subtle flex flex-col sm:flex-row gap-4 sm:items-center justify-between"
            >
              {/* Image & Product info */}
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <img
                  src={item.product.images[0]}
                  alt={item.product.name}
                  className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-xl border border-slate-100 shrink-0"
                />
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-indigo bg-indigo-light px-2 py-0.5 rounded">
                      {item.product.subcategory}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">SKU: {item.product.sku}</span>
                  </div>

                  <Link
                    to={`/product/${item.product.slug}`}
                    className="font-bold text-sm text-navy hover:text-indigo transition line-clamp-1 block"
                  >
                    {item.product.name}
                  </Link>

                  {item.selectedVariant && (
                    <p className="text-xs text-slate-500">
                      Variant: <span className="font-semibold text-slate-700">{item.selectedVariant.name}</span>
                    </p>
                  )}

                  {/* Applied Wholesale Tier Tag */}
                  {item.appliedTier && item.appliedTier.savingsPercent > 0 ? (
                    <span className="inline-block text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                      {item.appliedTier.label} ({item.appliedTier.savingsPercent}% Bulk Discount Applied)
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400">
                      Standard retail pricing ({item.product.wholesaleTiers?.[1]?.minQty ? `Order ${item.product.wholesaleTiers[1].minQty}+ for wholesale rate` : ''})
                    </span>
                  )}
                </div>
              </div>

              {/* Quantity Counter & Subtotal */}
              <div className="flex items-center justify-between sm:justify-end gap-6 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                <div className="flex items-center border border-slate-300 rounded-xl overflow-hidden bg-white">
                  <button
                    onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                    className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 font-bold text-xs"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
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
                  className="px-4 py-2 bg-navy text-white text-xs font-bold rounded-xl hover:bg-navy-800 transition"
                >
                  Apply
                </button>
              </form>
            )}

            {couponMsg && (
              <p className={`text-[11px] font-semibold ${couponMsg.success ? 'text-emerald-700' : 'text-error'}`}>
                {couponMsg.text}
              </p>
            )}

            {/* Quick 1-Click Coupon Chips (Dynamically driven by Admin) */}
            {featuredCoupons.length > 0 && (
              <div className="pt-2 border-t border-slate-100 space-y-1.5">
                <span className="text-[11px] font-bold text-slate-700 block">
                  Tap to apply available mill coupons:
                </span>
                <div className="flex flex-col gap-1.5">
                  {featuredCoupons.map(coupon => {
                    const isApplied = appliedCoupon === coupon.code;
                    const isFlat = coupon.discountType === 'FLAT';
                    return (
                      <button
                        key={coupon.id}
                        type="button"
                        onClick={() => handleApplyCoupon(undefined, coupon.code)}
                        className={`p-2 rounded-xl text-left border text-xs transition flex items-center justify-between ${
                          isApplied
                            ? 'border-emerald-500 bg-emerald-50/70 text-emerald-900 font-bold ring-1 ring-emerald-500'
                            : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0 pr-2">
                          <Tag className="w-3.5 h-3.5 text-indigo shrink-0" />
                          <span className="font-black text-slate-900 shrink-0">{coupon.code}</span>
                          <span className="text-[10px] text-slate-500 font-medium truncate">
                            • {isFlat ? `₹${coupon.discountValue} FLAT OFF` : `${coupon.discountValue}% OFF`}
                            {coupon.minOrderValue > 0 ? ` (>₹${coupon.minOrderValue.toLocaleString('en-IN')})` : ''}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded shrink-0 ${
                            isApplied
                              ? 'bg-emerald-200/70 text-emerald-900'
                              : 'bg-indigo/10 text-indigo'
                          }`}
                        >
                          {isApplied ? 'Applied ✓' : '1-Click Apply'}
                        </span>
                      </button>
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
                  <span className="text-[10px] text-slate-400 font-mono">(ITC Claimable)</span>
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

              {/* B2B GST Input Tax Credit (ITC) Callout */}
              <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl text-xs space-y-1 mt-2">
                <div className="flex justify-between items-center font-bold text-emerald-950">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Business GST Credit (ITC):
                  </span>
                  <span className="text-emerald-700 font-black">
                    ₹{Math.round(cartTax.totalTax).toLocaleString('en-IN')} Back
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Enter GSTIN at checkout to claim 100% GSTR-2B input tax credit. Net landed cost: <strong className="text-navy">₹{Math.round(cartTotal - cartTax.totalTax).toLocaleString('en-IN')}</strong>.
                </p>
              </div>
            </div>

            {/* Checkout Button */}
            <button
              onClick={() => navigate('/checkout')}
              className="w-full py-4 bg-indigo hover:bg-indigo-dark text-white rounded-xl font-black text-sm transition shadow-premium flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
            >
              <span>Proceed to Fast Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* 1-Click WhatsApp Quick Order */}
            <a
              href={`https://wa.me/919876543210?text=${encodeURIComponent(
                `Hello Mahalaxmi Enterprises, I want to order my cart items:\n` +
                cart.map(i => `- ${i.quantity}x ${i.product.name} (₹${i.unitPrice}/pc)`).join('\n') +
                `\n\nTotal Amount: ₹${cartTotal}\nPlease confirm order and share payment link / bank RTGS details.`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 shadow-sm text-center"
            >
              <span>💬 Confirm & Order Cart via WhatsApp</span>
            </a>

            {/* Email Cart Summary & ₹150 Voucher (Abandoned Cart Recovery) */}
            <div className="p-3.5 bg-gradient-to-br from-indigo-50/50 to-emerald-50/40 border border-indigo-100 rounded-2xl space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-navy flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-indigo" />
                  <span>⏱️ 30-Min Auto Cart Recovery & Voucher</span>
                </span>
                <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full">
                  AUTO 30-MIN
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                Your cart is automatically saved! If you leave without checkout, we will automatically send your cart items with an instant discount voucher {featuredCoupons[0] ? <>(<strong>{featuredCoupons[0].code}</strong>)</> : ''} after 30 minutes of inactivity. Want it right now? Enter your email:
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={emailCartInput}
                  onChange={e => setEmailCartInput(e.target.value)}
                  placeholder="Enter email address"
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
            </div>

            {/* Payment & Security Trust Badges Strip */}
            <div className="pt-3 border-t border-slate-100 space-y-2.5">
              <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <Lock className="w-3 h-3 text-emerald-600" />
                <span>256-Bit Bank-Grade SSL Secure Checkout</span>
              </div>

              {/* Supported Payment Channels */}
              <div className="flex flex-wrap items-center justify-center gap-2 text-[10px] font-bold text-slate-600">
                <span className="px-2 py-0.5 bg-slate-100 rounded border border-slate-200">UPI / QR</span>
                <span className="px-2 py-0.5 bg-slate-100 rounded border border-slate-200">Google Pay</span>
                <span className="px-2 py-0.5 bg-slate-100 rounded border border-slate-200">PhonePe</span>
                <span className="px-2 py-0.5 bg-slate-100 rounded border border-slate-200">RuPay</span>
                <span className="px-2 py-0.5 bg-slate-100 rounded border border-slate-200">NetBanking</span>
                <span className="px-2 py-0.5 bg-slate-100 rounded border border-slate-200">Cash on Delivery</span>
              </div>

              {/* B2B Trust Notice */}
              <div className="pt-2 text-[11px] text-slate-500 space-y-1">
                <p className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>GSTIN Tax Invoice generated automatically for 100% ITC claim.</span>
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
    </div>
  );
};
