import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Address, PaymentMethod } from '../types';
import {
  ShieldCheck,
  CheckCircle2,
  Building2,
  User as UserIcon,
  MapPin,
  CreditCard,
  QrCode,
  Truck,
  ArrowRight,
  AlertCircle,
  Clock,
  Lock
} from 'lucide-react';
import { Badge } from '../components/common/Badge';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    cart,
    cartSubtotal,
    cartTax,
    cartShipping,
    cartTotal,
    appliedCoupon,
    couponDiscount,
    currentUser,
    updateUserProfile,
    addSavedAddress,
    createOrder,
    redeemWalletPoints,
    deliveryInfo
  } = useApp();

  // Redirect if cart is empty
  if (cart.length === 0) {
    navigate('/cart');
    return null;
  }

  // Checkout Form States
  const [isB2B, setIsB2B] = useState<boolean>(currentUser.role !== 'consumer' || !!currentUser.gstNumber);
  const [companyName, setCompanyName] = useState(currentUser.companyName || '');
  const [gstNumber, setGstNumber] = useState(currentUser.gstNumber || '');

  // Address selection
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(0);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState<Omit<Address, 'id'>>({
    fullName: currentUser.name,
    phone: currentUser.phone,
    street: '',
    landmark: '',
    city: deliveryInfo?.city || 'Surat',
    state: deliveryInfo?.state || 'Gujarat',
    pincode: deliveryInfo?.pincode || '395002',
    addressType: isB2B ? 'COMMERCIAL' : 'HOME'
  });

  // Payment Method
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('RAZORPAY');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Address to use
  const activeAddress = currentUser.addresses[selectedAddressIndex] || {
    id: 'temp-1',
    fullName: currentUser.name,
    phone: currentUser.phone,
    street: 'Plot 402, Ring Road Textile Hub',
    city: 'Surat',
    state: 'Gujarat',
    pincode: '395002',
    addressType: 'COMMERCIAL' as const
  };

  const handlePincodeChange = (pin: string) => {
    const cleanPin = pin.replace(/\D/g, '').slice(0, 6);
    let autoCity = newAddress.city;
    let autoState = newAddress.state;

    if (cleanPin.startsWith('38') || cleanPin.startsWith('39') || cleanPin.startsWith('36')) {
      autoState = 'Gujarat';
      if (cleanPin.startsWith('380')) autoCity = 'Ahmedabad';
      else if (cleanPin.startsWith('395')) autoCity = 'Surat';
      else if (cleanPin.startsWith('390')) autoCity = 'Vadodara';
      else if (cleanPin.startsWith('360')) autoCity = 'Rajkot';
    } else if (cleanPin.startsWith('40') || cleanPin.startsWith('41')) {
      autoState = 'Maharashtra';
      if (cleanPin.startsWith('400')) autoCity = 'Mumbai';
      else if (cleanPin.startsWith('411')) autoCity = 'Pune';
    } else if (cleanPin.startsWith('11')) {
      autoState = 'Delhi';
      autoCity = 'New Delhi';
    } else if (cleanPin.startsWith('56')) {
      autoState = 'Karnataka';
      autoCity = 'Bangalore';
    } else if (cleanPin.startsWith('60')) {
      autoState = 'Tamil Nadu';
      autoCity = 'Chennai';
    } else if (cleanPin.startsWith('30')) {
      autoState = 'Rajasthan';
      autoCity = 'Jaipur';
    }

    setNewAddress(prev => ({
      ...prev,
      pincode: cleanPin,
      city: autoCity,
      state: autoState
    }));
  };

  const handleAddNewAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddress.street || !newAddress.pincode) return;
    addSavedAddress(newAddress);
    setShowNewAddressForm(false);
    setSelectedAddressIndex(0);
  };

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Save company and GST if entered
    if (isB2B && gstNumber) {
      updateUserProfile({
        companyName,
        gstNumber: gstNumber.toUpperCase(),
        isGstVerified: true
      });
    }

    // A. RAZORPAY ONLINE GATEWAY PAYMENT FLOW
    if (paymentMethod === 'RAZORPAY') {
      setIsSubmitting(true);
      const razorpayKey = (import.meta as any).env.VITE_RAZORPAY_KEY_ID || 'rzp_live_TXxnGK4dKMgIdA';

      if (typeof (window as any).Razorpay === 'undefined') {
        alert('Razorpay Payment Gateway is loading. Please check your internet connection and try again.');
        setIsSubmitting(false);
        return;
      }

      const options = {
        key: razorpayKey,
        amount: Math.round(cartTotal * 100), // Amount in paise
        currency: 'INR',
        name: 'Mahalaxmi Enterprises',
        description: `Consignment Payment - ${cart.length} items (Surat Direct Mill)`,
        image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=160&auto=format&fit=crop&q=80',
        prefill: {
          name: activeAddress.fullName || currentUser.name || 'Valued Buyer',
          email: currentUser.email || 'customer@mahalaxmi.in',
          contact: activeAddress.phone || currentUser.phone || '8511172099',
        },
        notes: {
          order_source: 'WEBSITE_CHECKOUT',
          b2b_buyer: isB2B ? 'YES' : 'NO',
          gst_number: gstNumber || 'N/A',
          company_name: companyName || 'N/A'
        },
        theme: {
          color: '#312E81' // Luxury Navy/Indigo Brand Theme
        },
        handler: function (response: any) {
          console.log('[Razorpay Live Success]', response);
          const order = createOrder({
            paymentMethod: 'RAZORPAY',
            shippingAddress: activeAddress,
            billingAddress: activeAddress
          });
          setIsSubmitting(false);
          navigate(`/orders?success=${order.id}&payment_id=${response.razorpay_payment_id || ''}`);
        },
        modal: {
          ondismiss: function () {
            setIsSubmitting(false);
          }
        }
      };

      try {
        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', function (resp: any) {
          console.error('[Razorpay Failed]', resp.error);
          alert(`Payment failed: ${resp.error?.description || 'Transaction declined. Please try another card or UPI.'}`);
          setIsSubmitting(false);
        });
        rzp.open();
      } catch (err: any) {
        console.error('Razorpay invocation error:', err);
        setIsSubmitting(false);
        alert('Could not launch payment gateway. Please select UPI or Cash on Delivery.');
      }
      return;
    }

    // B. NON-RAZORPAY FLOW (WALLET_POINTS, UPI, NET_BANKING, COD)
    setIsSubmitting(true);
    setTimeout(async () => {
      const order = createOrder({
        paymentMethod,
        shippingAddress: activeAddress,
        billingAddress: activeAddress
      });

      // If paying with Wallet Points, redeem the points from the user's ledger
      if (paymentMethod === 'WALLET_POINTS') {
        const pointsToRedeem = Math.min(currentUser.walletBalance || 0, cartTotal);
        if (pointsToRedeem > 0) {
          await redeemWalletPoints(pointsToRedeem, order.orderNumber, order.id);
        }
      }

      setIsSubmitting(false);
      navigate(`/orders?success=${order.id}`);
    }, 1000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 pb-20">
      {/* Title */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-navy tracking-tight">
            Secure Commercial Checkout
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Order Reference: {cart.length} items • Direct Surat Mill Dispatch • 100% Legal GST Invoice
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 font-semibold">
          <Lock className="w-3.5 h-3.5" />
          <span>256-Bit SSL Encrypted</span>
        </div>
      </div>

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Checkout Steps (B2B/GST, Shipping Address, Payment Method) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Step 1: Buyer Entity & GST Registration */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-subtle space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-navy text-white text-xs font-bold flex items-center justify-center">
                  1
                </span>
                <h3 className="font-extrabold text-sm text-navy">Buyer Identity & GST Invoice Status</h3>
              </div>
              <Badge variant={isB2B ? 'primary' : 'outline'} size="sm">
                {isB2B ? 'B2B Trade Invoice' : 'Individual Consumer'}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => setIsB2B(false)}
                className={`p-3 rounded-xl border text-left transition flex items-center gap-3 ${
                  !isB2B
                    ? 'border-indigo bg-indigo-light text-navy ring-1 ring-indigo'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <UserIcon className="w-5 h-5 text-indigo shrink-0" />
                <div>
                  <p className="text-xs font-bold">Individual / Retail Buyer</p>
                  <p className="text-[10px] text-slate-500">Standard retail receipt</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setIsB2B(true)}
                className={`p-3 rounded-xl border text-left transition flex items-center gap-3 ${
                  isB2B
                    ? 'border-indigo bg-indigo-light text-navy ring-1 ring-indigo'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Building2 className="w-5 h-5 text-indigo shrink-0" />
                <div>
                  <p className="text-xs font-bold">Registered Business (B2B)</p>
                  <p className="text-[10px] text-slate-500">Claim 5% / 12% GST Input Tax Credit</p>
                </div>
              </button>
            </div>

            {/* B2B GST Details input */}
            {isB2B && (
              <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Registered Company / Trade Name *
                  </label>
                  <input
                    type="text"
                    required={isB2B}
                    value={companyName}
                    onChange={e => setCompanyName(e.target.value)}
                    placeholder="e.g. Royal Grand Hotels & Resorts Ltd."
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:border-indigo outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    GSTIN Number (15 Digits) *
                  </label>
                  <input
                    type="text"
                    required={isB2B}
                    maxLength={15}
                    value={gstNumber}
                    onChange={e => setGstNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. 24AABCP1357K1ZT"
                    className="w-full text-xs font-mono uppercase px-3 py-2 border border-slate-300 rounded-xl focus:border-indigo outline-none"
                  />
                  <p className="text-[10px] text-emerald-700 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Auto-validated for instant GSTR-2B Input Tax Credit
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Shipping Destination Address */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-subtle space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-navy text-white text-xs font-bold flex items-center justify-center">
                  2
                </span>
                <h3 className="font-extrabold text-sm text-navy">Delivery & Consignment Address</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowNewAddressForm(!showNewAddressForm)}
                className="text-xs font-bold text-indigo hover:underline"
              >
                {showNewAddressForm ? 'Cancel' : '+ Add New Address'}
              </button>
            </div>

            {/* Saved Addresses List */}
            {!showNewAddressForm && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentUser.addresses.map((addr, idx) => (
                  <div
                    key={addr.id}
                    onClick={() => setSelectedAddressIndex(idx)}
                    className={`p-4 rounded-xl border cursor-pointer transition text-xs space-y-1 ${
                      selectedAddressIndex === idx
                        ? 'border-indigo bg-indigo-light/50 ring-1 ring-indigo'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-navy">{addr.fullName}</span>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                        {addr.addressType}
                      </span>
                    </div>
                    {addr.companyName && <p className="text-slate-500 font-medium">{addr.companyName}</p>}
                    <p className="text-slate-700">{addr.street}</p>
                    <p className="text-slate-700">{addr.city}, {addr.state} - {addr.pincode}</p>
                    <p className="text-slate-500">Contact: {addr.phone}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Add New Address Form Modal/inline */}
            {showNewAddressForm && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
                <h4 className="font-bold text-navy">Enter New Delivery Destination</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Receiver Full Name"
                    value={newAddress.fullName}
                    onChange={e => setNewAddress({ ...newAddress, fullName: e.target.value })}
                    className="p-2 border border-slate-300 rounded-lg outline-none"
                  />
                  <input
                    type="tel"
                    required
                    placeholder="Phone Number"
                    value={newAddress.phone}
                    onChange={e => setNewAddress({ ...newAddress, phone: e.target.value })}
                    className="p-2 border border-slate-300 rounded-lg outline-none"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Street Address, Building, Floor"
                    value={newAddress.street}
                    onChange={e => setNewAddress({ ...newAddress, street: e.target.value })}
                    className="sm:col-span-2 p-2 border border-slate-300 rounded-lg outline-none"
                  />
                  <input
                    type="text"
                    maxLength={6}
                    required
                    placeholder="6-digit PIN (Auto-fills city)"
                    value={newAddress.pincode}
                    onChange={e => handlePincodeChange(e.target.value)}
                    className="p-2 border border-slate-300 rounded-lg outline-none font-mono font-bold text-navy"
                  />
                  <input
                    type="text"
                    required
                    placeholder="City / District"
                    value={newAddress.city}
                    onChange={e => setNewAddress({ ...newAddress, city: e.target.value })}
                    className="p-2 border border-slate-300 rounded-lg outline-none"
                  />
                  <input
                    type="text"
                    required
                    placeholder="State"
                    value={newAddress.state}
                    onChange={e => setNewAddress({ ...newAddress, state: e.target.value })}
                    className="p-2 border border-slate-300 rounded-lg outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddNewAddress}
                  className="px-4 py-2 bg-indigo text-white font-bold rounded-lg text-xs hover:bg-indigo-dark transition"
                >
                  Save and Use Address
                </button>
              </div>
            )}
          </div>

          {/* Step 3: Payment Method Selection */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-subtle space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-navy text-white text-xs font-bold flex items-center justify-center">
                3
              </span>
              <h3 className="font-extrabold text-sm text-navy">Payment Method</h3>
            </div>

            <div className="space-y-3">
              {/* Razorpay Live Gateway (Cards, UPI, NetBanking, Wallets) */}
              <label
                onClick={() => setPaymentMethod('RAZORPAY')}
                className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                  paymentMethod === 'RAZORPAY'
                    ? 'border-indigo bg-indigo-light/50 ring-2 ring-indigo shadow-sm'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo text-white rounded-xl shadow-sm">
                    <ShieldCheck className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-black text-navy">Pay via Razorpay Secure (Live)</p>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">RECOMMENDED</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Credit/Debit Cards, Google Pay, PhonePe, Paytm, NetBanking & Corporate Credit Lines
                    </p>
                  </div>
                </div>
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'RAZORPAY'}
                  onChange={() => setPaymentMethod('RAZORPAY')}
                  className="accent-indigo w-4 h-4"
                />
              </label>

              {/* UPI Option */}
              <label
                onClick={() => setPaymentMethod('UPI')}
                className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                  paymentMethod === 'UPI'
                    ? 'border-indigo bg-indigo-light/50 ring-1 ring-indigo'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo/10 text-indigo rounded-lg">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-navy">Instant UPI / Dynamic QR Code</p>
                    <p className="text-[10px] text-slate-500">Google Pay, PhonePe, Paytm, BHIM (Zero Gateway Surcharge)</p>
                  </div>
                </div>
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'UPI'}
                  onChange={() => setPaymentMethod('UPI')}
                  className="accent-indigo"
                />
              </label>

              {/* Net Banking / RTGS Option */}
              <label
                onClick={() => setPaymentMethod('NET_BANKING')}
                className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                  paymentMethod === 'NET_BANKING'
                    ? 'border-indigo bg-indigo-light/50 ring-1 ring-indigo'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo/10 text-indigo rounded-lg">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-navy">Bank Transfer / NEFT / RTGS</p>
                    <p className="text-[10px] text-slate-500">Direct Mill Escrow Account (Ideal for bulk payments ₹50,000+)</p>
                  </div>
                </div>
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'NET_BANKING'}
                  onChange={() => setPaymentMethod('NET_BANKING')}
                  className="accent-indigo"
                />
              </label>

              {/* COD Option */}
              <label
                onClick={() => setPaymentMethod('COD')}
                className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                  paymentMethod === 'COD'
                    ? 'border-indigo bg-indigo-light/50 ring-1 ring-indigo'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo/10 text-indigo rounded-lg">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-navy">Cash on Delivery (COD)</p>
                    <p className="text-[10px] text-slate-500">Pay cash or UPI upon delivery at your doorstep</p>
                  </div>
                </div>
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'COD'}
                  onChange={() => setPaymentMethod('COD')}
                  className="accent-indigo"
                />
              </label>

              {/* Mahalaxmi Mill Points Wallet Option (1 Point = ₹1) */}
              <label
                onClick={() => setPaymentMethod('WALLET_POINTS')}
                className={`p-4 rounded-xl border flex items-center justify-between transition ${
                  paymentMethod === 'WALLET_POINTS'
                    ? 'border-indigo bg-indigo-50/70 ring-2 ring-indigo cursor-pointer'
                    : 'border-slate-200 hover:bg-slate-50 cursor-pointer'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-champagne text-navy flex items-center justify-center font-black text-base shadow-sm">
                    🪙
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-navy">Pay with Mill Points Wallet</p>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                        Available: 🪙 {(currentUser.walletBalance || 0).toLocaleString('en-IN')} Points (₹{(currentUser.walletBalance || 0).toLocaleString('en-IN')})
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {(currentUser.walletBalance || 0) >= cartTotal
                        ? '✓ 100% full order amount covered by your available points balance!'
                        : `Points cover ₹${Math.min(currentUser.walletBalance || 0, cartTotal)}, balance payable via UPI/Cash.`}
                    </p>
                  </div>
                </div>
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'WALLET_POINTS'}
                  onChange={() => setPaymentMethod('WALLET_POINTS')}
                  className="accent-indigo w-4 h-4"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Order Review, Calculations & Action Button */}
        <div className="lg:col-span-4 space-y-5">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-subtle space-y-4 sticky top-36">
            <h3 className="font-bold text-sm text-navy pb-3 border-b border-slate-100">
              Order Items Review ({cart.length})
            </h3>

            {/* Compact Items List */}
            <div className="max-h-56 overflow-y-auto space-y-3 pr-1 text-xs">
              {cart.map(item => (
                <div key={item.id} className="flex items-center gap-3 justify-between">
                  <img
                    src={item.product.images[0]}
                    alt={item.product.name}
                    className="w-12 h-12 object-cover rounded-lg border border-slate-100 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-navy truncate">{item.product.name}</p>
                    <p className="text-[11px] text-slate-500">
                      Qty: <span className="font-bold">{item.quantity}</span> × ₹{item.unitPrice}
                    </p>
                  </div>
                  <span className="font-bold text-navy whitespace-nowrap">
                    ₹{item.totalPrice.toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>

            {/* Price Calculations */}
            <div className="space-y-2 text-xs text-slate-600 pt-3 border-t border-slate-100">
              <div className="flex justify-between">
                <span>Taxable Items Subtotal:</span>
                <span className="font-semibold text-navy">₹{cartSubtotal.toLocaleString('en-IN')}</span>
              </div>

              {couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Coupon Discount ({appliedCoupon}):</span>
                  <span>-₹{couponDiscount.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Tax Levy (CGST + SGST / IGST):</span>
                <span className="font-semibold text-navy">₹{Math.round(cartTax.totalTax).toLocaleString('en-IN')}</span>
              </div>

              <div className="flex justify-between">
                <span>Freight Logistics:</span>
                <span className="font-semibold text-navy">
                  {cartShipping === 0 ? 'FREE' : `₹${cartShipping}`}
                </span>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline text-navy">
                <span className="text-sm font-bold">Total Amount to Pay:</span>
                <span className="text-2xl font-black text-indigo">
                  ₹{cartTotal.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Place Order CTA Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-4 rounded-xl font-bold text-xs transition shadow-premium flex items-center justify-center gap-2 ${
                isSubmitting
                  ? 'bg-slate-400 cursor-not-allowed text-white'
                  : 'bg-indigo hover:bg-indigo-dark text-white'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" />
                  <span>Processing Order & GST Invoice...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm & Place Order (₹{cartTotal.toLocaleString('en-IN')})</span>
                </>
              )}
            </button>

            {/* 1-Click WhatsApp Checkout Fallback */}
            <a
              href={`https://wa.me/919876543210?text=${encodeURIComponent(
                `Hello Mahalaxmi Enterprises, I am ready to checkout my order:\n` +
                `Name: ${activeAddress.fullName} (${activeAddress.phone})\n` +
                `Delivery Address: ${activeAddress.street}, ${activeAddress.city}, ${activeAddress.state} - ${activeAddress.pincode}\n` +
                (isB2B && gstNumber ? `Company: ${companyName} | GSTIN: ${gstNumber}\n` : '') +
                `Total Amount: ₹${cartTotal} (Payment Mode: ${paymentMethod})\n\nPlease confirm dispatch from Surat Mill.`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 shadow-sm text-center"
            >
              <span>💬 Confirm & Finalize via WhatsApp</span>
            </a>

            <div className="pt-2 border-t border-slate-100 flex flex-col gap-1.5 text-center">
              <div className="flex items-center justify-center gap-3 text-[10px] font-bold text-slate-500">
                <span>🔒 256-Bit SSL Encrypted</span>
                <span>•</span>
                <span>🛡️ SafeXpress / V-Trans Express</span>
                <span>•</span>
                <span>⚡ 24h Mill Gate Loading</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                By confirming, you agree to Mahalaxmi Enterprises Direct Mill Terms of Commercial Supply.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
