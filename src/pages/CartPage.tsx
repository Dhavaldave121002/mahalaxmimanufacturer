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
  RotateCcw
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
    currentUser,
    deliveryInfo
  } = useApp();

  const [couponInput, setCouponInput] = useState('');
  const [couponMsg, setCouponMsg] = useState<{ text: string; success: boolean } | null>(null);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    const res = applyCoupon(couponInput);
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
              <p className={`text-[11px] ${couponMsg.success ? 'text-emerald-700' : 'text-error'}`}>
                {couponMsg.text}
              </p>
            )}

            <div className="text-[10px] text-slate-400 space-y-0.5 pt-1">
              <p>• <span className="font-semibold text-slate-600">MILLDIRECT10:</span> 10% instant off on all orders</p>
              <p>• <span className="font-semibold text-slate-600">BULK500:</span> ₹500 off on orders above ₹3,000</p>
              <p>• <span className="font-semibold text-slate-600">MAHALAXMI20:</span> 20% off on bulk wholesale (₹10k+)</p>
            </div>
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
            </div>

            {/* Checkout Button */}
            <button
              onClick={() => navigate('/checkout')}
              className="w-full py-3.5 bg-indigo hover:bg-indigo-dark text-white rounded-xl font-bold text-xs transition shadow-premium flex items-center justify-center gap-2"
            >
              <span>Proceed to Fast Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* B2B Trust Notice */}
            <div className="pt-2 text-[11px] text-slate-500 space-y-1">
              <p className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>GSTIN Invoice generated automatically upon payment.</span>
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
  );
};
