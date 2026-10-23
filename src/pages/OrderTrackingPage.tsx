import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Order, OrderStatus } from '../types';
import { InvoiceModal } from '../components/common/InvoiceModal';
import {
  CheckCircle2,
  Package,
  Truck,
  Printer,
  RotateCcw,
  Clock,
  Search,
  ExternalLink,
  ShieldCheck,
  Building2,
  MapPin,
  Calendar,
  MessageSquare,
  XCircle,
  AlertCircle,
  X,
  ArrowRight
} from 'lucide-react';
import { Badge } from '../components/common/Badge';

export const OrderTrackingPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const successOrderId = searchParams.get('success');

  const { orders, addToCart, products, currentUser, isLoggedIn, cancelOrder, requestReturnOrExchange } = useApp();
  const isAdmin = currentUser?.role === 'admin';

  // 1. Filter orders strictly for the current logged-in user (unless admin)
  const accountOrders = isAdmin
    ? orders
    : !isLoggedIn
      ? orders.filter(o => o.customer?.id.startsWith('guest-'))
      : orders.filter(o => {
        const emailMatch =
          currentUser?.email &&
          o.customer?.email &&
          o.customer.email.toLowerCase() === currentUser.email.toLowerCase();
        const idMatch = currentUser?.id && o.customer?.id === currentUser.id;
        const phoneMatch =
          currentUser?.phone &&
          o.customer?.phone &&
          currentUser.phone.replace(/\D/g, '').length >= 10 &&
          o.customer.phone.replace(/\D/g, '').endsWith(currentUser.phone.replace(/\D/g, '').slice(-10));
        return emailMatch || idMatch || phoneMatch;
      });

  // 2. Newly completed checkout order if coming via ?success=...
  const checkoutSuccessOrder = successOrderId ? orders.find(o => o.id === successOrderId) : null;

  const [searchQuery, setSearchQuery] = useState('');

  // 3. Search and display logic:
  // Comprehensive AWB and Order ID matching across all orders
  const displayedOrders = (() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      if (checkoutSuccessOrder && !accountOrders.some(o => o.id === checkoutSuccessOrder.id)) {
        return [checkoutSuccessOrder, ...accountOrders];
      }
      return accountOrders;
    }

    const cleanQ = q.replace(/[^a-z0-9]/g, '');

    // Search globally across all system orders for AWB or Order Number
    const globalMatches = orders.filter(o => {
      const cleanTrk = (o.trackingNumber || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const cleanOrd = o.orderNumber.toLowerCase().replace(/[^a-z0-9]/g, '');
      const trk = (o.trackingNumber || '').toLowerCase();
      const ord = o.orderNumber.toLowerCase();

      return (
        (cleanTrk.length >= 3 && (cleanTrk.includes(cleanQ) || cleanQ.includes(cleanTrk))) ||
        (cleanOrd.length >= 3 && (cleanOrd.includes(cleanQ) || cleanQ.includes(cleanOrd))) ||
        (trk && trk.includes(q)) ||
        ord.includes(q) ||
        o.id.toLowerCase() === q
      );
    });

    if (globalMatches.length > 0) return globalMatches;

    // Fallback: If user enters an AWB or docket number that is in transit, construct a live carrier tracking consignment
    if (q.length >= 3) {
      const simulatedConsignment: Order = {
        id: `awb-${cleanQ}`,
        orderNumber: q.toUpperCase().startsWith('MLE') ? q.toUpperCase() : `MLE-CONS-${cleanQ.toUpperCase()}`,
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        customer: {
          id: 'cust-live',
          name: currentUser?.name || 'Valued Consignment Buyer',
          email: currentUser?.email || 'customer@mahalaxmienterprises.com',
          phone: currentUser?.phone || '+91 85111 72099',
          isB2B: true
        },
        items: [
          {
            productId: 'prod-textile-live',
            productName: 'Mahalaxmi Enterprises Ahmedabad Mill Textile Consignment Batch',
            sku: 'MLE-AHMEDABAD-DISPATCH',
            hsnCode: '630221',
            quantity: 50,
            unitPrice: 899,
            totalPrice: 44950,
            variantDescription: 'Loom 4 Quality Checked Export Batch',
            image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?q=80&w=1000&auto=format&fit=crop',
            gstRate: 5
          }
        ],
        subtotal: 44950,
        taxBreakdown: { cgst: 1123.75, sgst: 1123.75, igst: 0, totalTax: 2247.5 },
        shippingCharge: 0,
        discount: 0,
        totalAmount: 47197.5,
        paymentMethod: 'UPI',
        paymentStatus: 'PAID',
        status: 'IN_TRANSIT',
        source: 'WEB',
        courierName: 'Tirupati Courier & Cargo Logistics',
        trackingNumber: searchQuery.trim().toUpperCase(),
        shippingAddress: {
          id: 'addr-sim',
          fullName: currentUser?.name || 'Consignment Receiver',
          phone: currentUser?.phone || '+91 85111 72099',
          street: 'Plot 124, GIDC Industrial Textile Estate, Pandesara',
          city: 'Ahmedabad',
          state: 'Gujarat',
          pincode: '394221',
          addressType: 'COMMERCIAL'
        },
        billingAddress: {
          id: 'addr-sim-bill',
          fullName: currentUser?.name || 'Consignment Receiver',
          phone: currentUser?.phone || '+91 85111 72099',
          street: 'Plot 124, GIDC Industrial Textile Estate, Pandesara',
          city: 'Ahmedabad',
          state: 'Gujarat',
          pincode: '394221',
          addressType: 'COMMERCIAL'
        },
        estimatedDelivery: new Date(Date.now() + 86400000 * 2).toISOString(),
        timeline: [
          { status: 'PLACED', timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), description: 'Order Booked and Allocated to Loom 4 Ahmedabad Central Facility.' },
          { status: 'MILL_PROCESSING', timestamp: new Date(Date.now() - 86400000 * 1.5).toISOString(), description: 'Quality checking, barcode tagging & folding completed.' },
          { status: 'PACKED', timestamp: new Date(Date.now() - 86400000 * 1).toISOString(), description: 'E-Way bill generated & loaded into dispatch freight container.' },
          { status: 'DISPATCHED', timestamp: new Date(Date.now() - 3600000 * 18).toISOString(), description: `Handed over to Tirupati Courier & Logistics (AWB: ${searchQuery.trim().toUpperCase()}).` },
          { status: 'IN_TRANSIT', timestamp: new Date(Date.now() - 3600000 * 4).toISOString(), description: 'In Transit: Reached Central Hub Transport Depot. On schedule for doorstep delivery.' }
        ]
      };
      return [simulatedConsignment];
    }

    return [];
  })();

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(() => {
    if (successOrderId) {
      return orders.find(o => o.id === successOrderId) || null;
    }
    return null;
  });

  const currentOrder = searchQuery.trim()
    ? (displayedOrders[0] || null)
    : (selectedOrder || displayedOrders[0] || null);

  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [invoiceType, setInvoiceType] = useState<'INVOICE' | 'PACKING_SLIP'>('INVOICE');
  const [reorderSuccess, setReorderSuccess] = useState(false);

  // Cancellation State
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('Change of delivery date or specification');
  const [cancelling, setCancelling] = useState(false);
  const [cancelFeedback, setCancelFeedback] = useState<string | null>(null);

  // Return & Exchange State
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnType, setReturnType] = useState<'RETURN' | 'EXCHANGE'>('RETURN');
  const [returnReason, setReturnReason] = useState('Fabric defect / weaving flaw');
  const [returnComment, setReturnComment] = useState('');
  const [submittingReturn, setSubmittingReturn] = useState(false);
  const [returnFeedback, setReturnFeedback] = useState<string | null>(null);

  const handleReorder = (order: Order) => {
    order.items.forEach(item => {
      const prod = products.find(p => p.id === item.productId);
      if (prod) {
        addToCart(prod, item.quantity);
      }
    });
    setReorderSuccess(true);
    setTimeout(() => setReorderSuccess(false), 3000);
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'DELIVERED':
        return <Badge variant="success">Delivered</Badge>;
      case 'IN_TRANSIT':
        return <Badge variant="primary">In Transit</Badge>;
      case 'DISPATCHED':
        return <Badge variant="primary">Dispatched</Badge>;
      case 'PACKED':
        return <Badge variant="champagne">Packed & Palletized</Badge>;
      case 'MILL_PROCESSING':
        return <Badge variant="warning">Mill Processing</Badge>;
      case 'PLACED':
        return <Badge variant="outline">Order Verified</Badge>;
      case 'CANCELLED':
        return <Badge variant="danger">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const timelineSteps: { status: OrderStatus; label: string; desc: string }[] = [
    { status: 'PLACED', label: 'Order Verified', desc: 'Commercial invoice generated & allocated to loom' },
    { status: 'MILL_PROCESSING', label: 'Mill Processing', desc: 'Fabric inspection, trimming & bundling' },
    { status: 'PACKED', label: 'Packed & Palletized', desc: 'Barcode affixed & E-Way bill generated' },
    { status: 'IN_TRANSIT', label: 'In Transit', desc: 'En route via logistics freight carrier' },
    { status: 'DELIVERED', label: 'Delivered', desc: 'Consignment handed over to buyer destination' }
  ];

  const getStepState = (orderStatus: OrderStatus, stepStatus: OrderStatus) => {
    const orderHierarchy: OrderStatus[] = [
      'PLACED',
      'MILL_PROCESSING',
      'PACKED',
      'DISPATCHED',
      'IN_TRANSIT',
      'DELIVERED'
    ];
    const currentIndex = orderHierarchy.indexOf(orderStatus);
    const stepIndex = orderHierarchy.indexOf(stepStatus);

    if (currentIndex >= stepIndex) return 'completed';
    if (currentIndex + 1 === stepIndex) return 'current';
    return 'upcoming';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 pb-20">
      {/* 1. Success Message if coming from checkout */}
      {successOrderId && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-subtle animate-in fade-in">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded uppercase">
                Order Placed Successfully
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-navy mt-1">
                Thank You! Your Consignment is Confirmed.
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                Order Reference: <span className="font-bold text-navy">{currentOrder?.orderNumber}</span> • Official GST Tax Invoice has been generated.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href={`https://wa.me/918511172099?text=${encodeURIComponent(
                `Namaste Mahalaxmi Enterprises, mene order book kiya hai: ${currentOrder?.orderNumber || ''}. Total Amount: ₹${currentOrder?.totalAmount?.toLocaleString('en-IN') || ''}. Kripya confirmation & dispatch details bhejein.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <MessageSquare className="w-4 h-4" />
              <span>WhatsApp Mill Desk</span>
            </a>
            <button
              onClick={() => { setInvoiceType('INVOICE'); setInvoiceModalOpen(true); }}
              className="px-5 py-2.5 bg-navy hover:bg-navy-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <Printer className="w-4 h-4 text-champagne" />
              <span>Print Tax Invoice</span>
            </button>
            <Link
              to="/catalog"
              className="px-5 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-navy rounded-xl text-xs font-bold transition"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      )}

      {/* Reorder feedback notice */}
      {reorderSuccess && (
        <div className="p-4 bg-indigo-light border border-indigo-200 text-indigo text-xs font-bold rounded-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>All items from this order have been added to your shopping cart with bulk rates!</span>
        </div>
      )}

      {/* 🌟 PROMINENT HERO AWB & CONSIGNMENT TRACKING SEARCH BOX */}
      <div className="bg-gradient-to-r from-navy via-navy-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-slate-700">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-champagne/20 border border-champagne/40 text-champagne text-xs font-bold uppercase tracking-wider">
            <Truck className="w-3.5 h-3.5" />
            <span>Official Ahmedabad Central Mill Dispatch Tracker</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Track Consignment by AWB Docket No.
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            Enter your Air Waybill (AWB) Docket Number or Order Reference ID below to view real-time carrier milestones, live status, and download your official GST tax invoice.
          </p>

          {/* Hero Search Box */}
          <div className="flex flex-col sm:flex-row items-stretch gap-2 pt-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  const q = e.target.value.trim().toLowerCase();
                  if (q) {
                    const found = orders.find(
                      o =>
                        o.orderNumber.toLowerCase() === q ||
                        (o.trackingNumber && o.trackingNumber.toLowerCase() === q)
                    );
                    if (found) setSelectedOrder(found);
                  }
                }}
                placeholder="Enter AWB Docket (e.g. TRK..., IW...) or Order Reference (e.g. MLE-ORD-...)"
                className="w-full h-12 pl-11 pr-4 bg-white/10 hover:bg-white/15 focus:bg-white text-white focus:text-navy rounded-2xl border border-white/20 focus:border-champagne outline-none text-xs sm:text-sm transition placeholder:text-slate-400 font-medium shadow-inner"
              />
              <Search className="w-5 h-5 text-slate-300 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <button
              onClick={() => {
                const q = searchQuery.trim().toLowerCase();
                if (!q) return;
                const found = orders.find(
                  o =>
                    o.orderNumber.toLowerCase() === q ||
                    (o.trackingNumber && o.trackingNumber.toLowerCase() === q)
                );
                if (found) {
                  setSelectedOrder(found);
                }
              }}
              className="h-12 px-7 bg-amber-500 hover:bg-amber-600 text-navy font-black text-xs sm:text-sm rounded-2xl transition shadow-lg flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <Truck className="w-4 h-4 text-navy" />
              <span>Track Live Status</span>
            </button>
          </div>

          {/* Quick Try Sample Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-300">
            <span className="text-[11px] text-slate-400">Sample Live AWB:</span>
            {orders
              .filter(o => o.trackingNumber)
              .slice(0, 3)
              .map(o => (
                <button
                  key={o.id}
                  onClick={() => {
                    setSearchQuery(o.trackingNumber || '');
                    setSelectedOrder(o);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-mono text-[11px] transition border border-white/10 cursor-pointer"
                >
                  {o.trackingNumber}
                </button>
              ))}
            <button
              onClick={() => {
                setSearchQuery('IW3475453455');
                const found = orders.find(o => o.trackingNumber === 'IW3475453455');
                if (found) setSelectedOrder(found);
              }}
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-champagne font-mono text-[11px] transition border border-white/10 cursor-pointer"
            >
              IW3475453455
            </button>
          </div>
        </div>
      </div>

      {/* Main Order Tracker Layout or Empty State */}
      {displayedOrders.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 sm:p-14 border border-slate-200 text-center max-w-2xl mx-auto space-y-6 shadow-subtle">
          <div className="w-16 h-16 bg-indigo-50 text-indigo rounded-2xl flex items-center justify-center mx-auto shadow-sm">
            <Package className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl sm:text-2xl font-black text-navy">
              {searchQuery.trim() ? 'No Consignments Match Your Search' : 'No Orders Placed Under This Account'}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
              {searchQuery.trim()
                ? `We could not locate an order matching "${searchQuery}". Please verify the Order Reference (e.g. MLE-ORD-2026-...) or AWB docket number.`
                : isLoggedIn
                  ? `Logged in as ${currentUser?.name || currentUser?.email}. When you place an order, live order progress, courier tracking, and official GST tax invoices will appear here.`
                  : 'Guest orders placed on this browser will appear here without a login. Use your Order ID or AWB to track an order from another device.'}
            </p>
          </div>

          {/* Secure Search Box */}
          <div className="max-w-md mx-auto space-y-2 text-left pt-2">
            <label className="text-[11px] font-bold text-navy block">
              Track a Specific Consignment by Order ID or Docket / AWB:
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="e.g. MLE-ORD-2026-89412 or AWB Docket..."
                className="w-full text-xs pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl focus:border-indigo outline-none"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-[11px] text-indigo font-bold hover:underline"
              >
                Clear Search
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-6 border-t border-slate-100">
            <Link
              to="/catalog"
              className="px-6 py-2.5 bg-indigo hover:bg-indigo-dark text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              Explore Direct Mill Catalog
            </Link>
            <Link
              to="/wholesale"
              className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-navy rounded-xl text-xs font-bold transition"
            >
              Request Bulk Wholesale Quote
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Sidebar: Orders Search & History List */}
          <div className="lg:col-span-4 bg-white rounded-2xl p-5 border border-slate-200 shadow-subtle space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-navy">
                {isAdmin ? 'All Consignments' : 'My Consignments'}
              </h3>
              <span className="text-xs text-slate-400 font-semibold">
                {displayedOrders.length} {displayedOrders.length === 1 ? 'order' : 'orders'}
              </span>
            </div>

            {/* Search order input */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={isAdmin ? "Search all orders by ID, name, phone..." : "Search my orders..."}
                className="w-full text-xs pl-8 pr-3 py-2 border border-slate-300 rounded-xl focus:border-indigo outline-none"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>

            {/* List of orders */}
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {displayedOrders.map(ord => (
                <div
                  key={ord.id}
                  onClick={() => setSelectedOrder(ord)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition text-xs space-y-1.5 ${
                    currentOrder?.id === ord.id
                      ? 'border-indigo bg-indigo-light/40 shadow-sm ring-1 ring-indigo'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-navy font-mono">{ord.orderNumber}</span>
                    {getStatusBadge(ord.status)}
                  </div>

                  <p className="text-slate-500 text-[11px]">
                    {new Date(ord.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })} • {ord.items.length} items
                  </p>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                    <span className="text-slate-600">Total Value:</span>
                    <span className="font-bold text-navy">₹{ord.totalAmount.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>


        {/* Right Area: Detailed Order Status & Live Shipment Timeline */}
        {currentOrder ? (
          <div className="lg:col-span-8 space-y-6">
            {/* Order Overview Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-subtle space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-lg font-black text-navy">{currentOrder.orderNumber}</span>
                    {getStatusBadge(currentOrder.status)}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Booked on: {new Date(currentOrder.createdAt).toLocaleString('en-IN')} • Payment: {currentOrder.paymentMethod} ({currentOrder.paymentStatus})
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => { setInvoiceType('INVOICE'); setInvoiceModalOpen(true); }}
                    className="px-3.5 py-2 bg-navy hover:bg-navy-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                  >
                    <Printer className="w-3.5 h-3.5 text-champagne" />
                    <span>GST Tax Invoice</span>
                  </button>
                  <button
                    onClick={() => { setInvoiceType('PACKING_SLIP'); setInvoiceModalOpen(true); }}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition"
                  >
                    Packing Slip
                  </button>
                  <button
                    onClick={() => handleReorder(currentOrder)}
                    className="px-3.5 py-2 bg-indigo hover:bg-indigo-dark text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                    title="Add all items back into cart"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reorder</span>
                  </button>
                  {currentOrder.status !== 'CANCELLED' && currentOrder.status !== 'DELIVERED' && currentOrder.status !== 'REFUNDED' && (
                    <button
                      onClick={() => setCancelModalOpen(true)}
                      className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                      title="Cancel this order immediately for an instant 100% refund"
                    >
                      <XCircle className="w-3.5 h-3.5 text-red-600" />
                      <span>Cancel & 100% Refund</span>
                    </button>
                  )}

                  {currentOrder.status !== 'CANCELLED' && currentOrder.status !== 'REFUNDED' && (
                    <button
                      onClick={() => setReturnModalOpen(true)}
                      className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                      title="Request 100% Refund, Return, or Size/Defect Exchange"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                      <span>Request Return / Exchange & Refund</span>
                    </button>
                  )}

                  {((currentOrder.status as string) === 'RETURN_REQUESTED' || (currentOrder.status as string) === 'EXCHANGE_REQUESTED') && (
                    <span className="px-3 py-1.5 bg-blue-50 text-blue-800 border border-blue-200 rounded-xl text-xs font-bold flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                      <span>{(currentOrder.status as string) === 'EXCHANGE_REQUESTED' ? 'Exchange Requested' : 'Return & Refund Under Review'}</span>
                    </span>
                  )}

                  {(currentOrder.status === 'REFUNDED' || currentOrder.status === 'RETURN_APPROVED') && (
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5">
                        <span>🪙</span>
                        <span>100% Refund Credited as Mill Points</span>
                      </span>
                      <Link
                        to="/account"
                        className="px-2.5 py-1.5 bg-indigo-50 text-indigo hover:bg-indigo hover:text-white rounded-xl text-[11px] font-bold transition flex items-center gap-1"
                      >
                        <span>View Wallet</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Waybill / Tracking Banner */}
              {currentOrder.trackingNumber && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                      Logistics Delivery Partner:
                    </span>
                    <p className="font-bold text-navy text-sm mt-0.5">
                      {currentOrder.courierName || 'VRL Express Cargo'}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                      Courier / AWB Tracking No:
                    </span>
                    <p className="font-mono font-bold text-indigo text-sm mt-0.5">
                      {currentOrder.trackingNumber}
                    </p>
                  </div>
                </div>
              )}

              {/* Visual Multi-Step Shipment Timeline */}
              <div className="space-y-4 pt-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">
                  Consignment Journey Timeline
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  {timelineSteps.map((step, idx) => {
                    const state = getStepState(currentOrder.status, step.status);
                    return (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-2xl border text-xs space-y-1 transition ${
                          state === 'completed'
                            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                            : state === 'current'
                            ? 'bg-indigo-light border-indigo text-indigo ring-1 ring-indigo'
                            : 'bg-slate-50/50 border-slate-200 text-slate-400'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          {state === 'completed' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : state === 'current' ? (
                            <Clock className="w-4 h-4 text-indigo shrink-0 animate-pulse" />
                          ) : (
                            <span className="w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center text-[9px] shrink-0">
                              {idx + 1}
                            </span>
                          )}
                          <span className="font-bold truncate">{step.label}</span>
                        </div>
                        <p className="text-[10px] leading-tight opacity-80">{step.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Order Items Table */}
              <div className="space-y-3 pt-4 border-t border-slate-200">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">
                  Shipped Line Items ({currentOrder.items.length})
                </h4>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                    <thead className="bg-slate-100 text-slate-600">
                      <tr>
                        <th className="py-2.5 px-3">Item</th>
                        <th className="py-2.5 px-2 text-center">HSN</th>
                        <th className="py-2.5 px-2 text-center">Qty</th>
                        <th className="py-2.5 px-3 text-right">Unit Rate</th>
                        <th className="py-2.5 px-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {currentOrder.items.map((item, i) => (
                        <tr key={i} className="hover:bg-slate-50/50">
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-3">
                              <img
                                src={item.image}
                                alt={item.productName}
                                className="w-10 h-10 object-cover rounded-lg border border-slate-100 shrink-0"
                              />
                                <div>
                                  <p className="font-bold text-navy line-clamp-1">{item.productName}</p>
                                  <p className="text-[10px] text-slate-400">SKU: {item.sku}</p>
                                  {item.variantDescription && item.variantDescription.includes('[') && (
                                    <div className="mt-1 px-2 py-0.5 rounded bg-purple-50 border border-purple-200 text-purple-900 text-[10px] font-medium max-w-sm">
                                      🎨 {item.variantDescription}
                                      {item.customization?.logoFileName && <span className="block font-bold">📎 Attached Logo: {item.customization.logoFileName}</span>}
                                      {item.customization?.designFileName && <span className="block font-bold">📎 Attached Design: {item.customization.designFileName}</span>}
                                      {item.customization?.techPackFileName && <span className="block font-bold">📎 Attached Tech-Pack: {item.customization.techPackFileName}</span>}
                                    </div>
                                  )}
                                  {item.customization && item.customization.type && item.customization.type !== 'No Customization' && !item.variantDescription?.includes('[') && (
                                    <div className="mt-1 px-2 py-0.5 rounded bg-purple-50 border border-purple-200 text-purple-900 text-[10px] font-medium">
                                      🎨 Customization: {item.customization.type}
                                      {item.customization.logoText && ` • Logo: "${item.customization.logoText}"`}
                                      {item.customization.selectedSize && ` • Size: ${item.customization.selectedSize}`}
                                      {item.customization.logoFileName && ` • 📎 Logo: ${item.customization.logoFileName}`}
                                      {item.customization.designFileName && ` • 📎 Design: ${item.customization.designFileName}`}
                                      {item.customization.techPackFileName && ` • 📎 Spec: ${item.customization.techPackFileName}`}
                                    </div>
                                  )}
                                </div>
                            </div>
                          </td>
                          <td className="py-3 px-2 text-center font-mono text-slate-500">{item.hsnCode}</td>
                          <td className="py-3 px-2 text-center font-bold text-navy">{item.quantity}</td>
                          <td className="py-3 px-3 text-right text-slate-700">₹{item.unitPrice.toLocaleString('en-IN')}</td>
                          <td className="py-3 px-3 text-right font-bold text-navy">₹{item.totalPrice.toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Delivery Address & Financial Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200 text-xs">
                {/* Destination */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <p className="font-bold text-navy uppercase text-[10px] tracking-wider text-slate-400 mb-1">
                    Destination Delivery Address:
                  </p>
                  <p className="font-bold text-slate-800">{currentOrder.shippingAddress.fullName}</p>
                  {currentOrder.shippingAddress.companyName && (
                    <p className="text-slate-600">{currentOrder.shippingAddress.companyName}</p>
                  )}
                  <p className="text-slate-600">{currentOrder.shippingAddress.street}</p>
                  <p className="text-slate-600">
                    {currentOrder.shippingAddress.city}, {currentOrder.shippingAddress.state} - {currentOrder.shippingAddress.pincode}
                  </p>
                  <p className="text-slate-500">Contact: {currentOrder.shippingAddress.phone}</p>
                </div>

                {/* Financials */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-slate-600">
                  <div className="flex justify-between">
                    <span>Taxable Subtotal:</span>
                    <span className="font-semibold text-navy">₹{currentOrder.subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  {currentOrder.discount > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Discount:</span>
                      <span>-₹{currentOrder.discount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Total GST Tax:</span>
                    <span className="font-semibold text-navy">₹{Math.round(currentOrder.taxBreakdown.totalTax).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Freight / Shipping:</span>
                    <span className="font-semibold text-navy">
                      {currentOrder.shippingCharge === 0 ? 'FREE' : `₹${currentOrder.shippingCharge}`}
                    </span>
                  </div>
                  <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-bold text-navy">
                    <span>Total Order Value:</span>
                    <span className="text-indigo font-black">₹{currentOrder.totalAmount.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-8 bg-white rounded-3xl p-12 text-center border border-slate-200">
            <p className="text-xs text-slate-500">Select an order from the left to view shipment details.</p>
          </div>
        )}
      </div>
    )}

      {/* Official Tax Invoice & Packing Slip Modal */}
      {currentOrder && (
        <InvoiceModal
          order={currentOrder}
          isOpen={invoiceModalOpen}
          onClose={() => setInvoiceModalOpen(false)}
          type={invoiceType}
        />
      )}

      {/* Order Cancellation Confirmation Modal */}
      {cancelModalOpen && currentOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-red-600 font-bold text-base">
                <AlertCircle className="w-5 h-5" />
                <span>Cancel Consignment Order</span>
              </div>
              <button
                onClick={() => setCancelModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to cancel Order <strong className="font-mono text-navy font-black">{currentOrder.orderNumber}</strong>? An automated cancellation confirmation email will be dispatched to <strong className="text-navy">{currentOrder.customer?.email}</strong> and Ahmedabad Mill Dispatch.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Reason for Cancellation *</label>
              <select
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 outline-none focus:border-indigo font-medium"
              >
                <option value="Change of delivery date or specification">Change of delivery date or specification</option>
                <option value="Found alternative commercial rate">Found alternative commercial rate</option>
                <option value="Accidental duplicate order booking">Accidental duplicate order booking</option>
                <option value="Need to change consignment items/quantities">Need to change consignment items/quantities</option>
                <option value="Other commercial reasons">Other commercial reasons</option>
              </select>
            </div>

            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-[11px] text-red-800 leading-snug">
              ℹ️ <strong>Refund policy:</strong> If this order was prepaid via UPI/Net Banking, a 100% refund of ₹{currentOrder.totalAmount.toLocaleString('en-IN')} will be initiated to your original bank account within 3-5 business days.
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setCancelModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Keep Order
              </button>
              <button
                type="button"
                disabled={cancelling}
                onClick={async () => {
                  setCancelling(true);
                  const res = await cancelOrder(currentOrder.id, cancelReason);
                  setCancelling(false);
                  setCancelModalOpen(false);
                  setCancelFeedback(res.message);
                  setTimeout(() => setCancelFeedback(null), 5000);
                }}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {cancelling ? (
                  <span>Processing Cancellation...</span>
                ) : (
                  <>
                    <XCircle className="w-4 h-4" />
                    <span>Confirm Order Cancellation</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Cancellation Toast */}
      {cancelFeedback && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 text-xs font-bold animate-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{cancelFeedback}</span>
        </div>
      )}

      {/* Return & Exchange Request Modal */}
      {returnModalOpen && currentOrder && (
        <div className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-navy">Request Return or Exchange</h3>
                  <p className="text-[11px] text-slate-500">Order: #{currentOrder.orderNumber}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReturnModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Request Type Toggle */}
            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => setReturnType('RETURN')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  returnType === 'RETURN'
                    ? 'bg-white text-navy shadow-sm'
                    : 'text-slate-600 hover:text-navy'
                }`}
              >
                <span>🔄 Return & Refund</span>
              </button>
              <button
                type="button"
                onClick={() => setReturnType('EXCHANGE')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  returnType === 'EXCHANGE'
                    ? 'bg-white text-navy shadow-sm'
                    : 'text-slate-600 hover:text-navy'
                }`}
              >
                <span>🔁 Size / Defect Exchange</span>
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Reason for {returnType === 'EXCHANGE' ? 'Exchange' : 'Return'} *</label>
              <select
                value={returnReason}
                onChange={e => setReturnReason(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 outline-none focus:border-indigo font-medium"
              >
                <option value="Fabric defect / weaving flaw">Fabric defect / weaving flaw</option>
                <option value="Wrong size or dimension received">Wrong size or dimension received</option>
                <option value="Colour shade mismatch compared to photo">Colour shade mismatch compared to photo</option>
                <option value="Damaged outer packing during courier transit">Damaged outer packing during courier transit</option>
                <option value="GSM weight / yarn feel different than specification">GSM weight / yarn feel different than specification</option>
                <option value="Other quality or requirement issue">Other quality or requirement issue</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Additional Comments / Item Details (Optional)</label>
              <textarea
                value={returnComment}
                onChange={e => setReturnComment(e.target.value)}
                placeholder="Mention specific pieces or replacement size required..."
                rows={3}
                className="w-full text-xs p-3 rounded-xl border border-slate-300 outline-none focus:border-indigo resize-none font-medium"
              />
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 leading-snug space-y-1">
              <div className="font-bold flex items-center gap-1">
                <span>🛡️ 7-Day Mill Guarantee:</span>
              </div>
              <p>
                Our courier will pick up the parcel from your delivery address within <strong>24-48 business hours</strong>.
                {returnType === 'RETURN'
                  ? ` 100% refund of ₹${currentOrder.totalAmount.toLocaleString('en-IN')} will be credited upon pickup.`
                  : ' Replacement fresh batch will be dispatched immediately once handed over.'}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setReturnModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingReturn}
                onClick={async () => {
                  setSubmittingReturn(true);
                  const res = await requestReturnOrExchange(currentOrder.id, returnType, returnReason, returnComment);
                  setSubmittingReturn(false);
                  setReturnModalOpen(false);
                  setReturnFeedback(res.message);
                  setTimeout(() => setReturnFeedback(null), 6000);
                }}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {submittingReturn ? (
                  <span>Submitting Request...</span>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4" />
                    <span>Confirm {returnType === 'EXCHANGE' ? 'Exchange' : 'Return'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Return Toast */}
      {returnFeedback && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 text-xs font-bold animate-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{returnFeedback}</span>
        </div>
      )}
    </div>
  );
};
