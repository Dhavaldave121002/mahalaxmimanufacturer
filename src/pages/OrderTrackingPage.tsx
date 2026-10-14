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
  Calendar
} from 'lucide-react';
import { Badge } from '../components/common/Badge';

export const OrderTrackingPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const successOrderId = searchParams.get('success');

  const { orders, addToCart, products } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(() => {
    if (successOrderId) {
      return orders.find(o => o.id === successOrderId) || orders[0] || null;
    }
    return orders[0] || null;
  });

  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [invoiceType, setInvoiceType] = useState<'INVOICE' | 'PACKING_SLIP'>('INVOICE');
  const [reorderSuccess, setReorderSuccess] = useState(false);

  // Filter or search orders
  const displayedOrders = searchQuery.trim()
    ? orders.filter(
        o =>
          o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          o.customer.phone.includes(searchQuery) ||
          o.trackingNumber?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : orders;

  const currentOrder = selectedOrder || orders[0];

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

          <div className="flex items-center gap-3">
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

      {/* Main Order Tracker Layout: Orders List (Left) + Selected Order Detail (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Sidebar: Orders Search & History List */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-5 border border-slate-200 shadow-subtle space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-extrabold text-sm text-navy">Order Consignments</h3>
            <span className="text-xs text-slate-400 font-semibold">{orders.length} total</span>
          </div>

          {/* Search order input */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by Order ID or phone..."
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
                </div>
              </div>

              {/* Waybill / Tracking Banner */}
              {currentOrder.trackingNumber && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                      Freight Dispatch Carrier:
                    </span>
                    <p className="font-bold text-navy text-sm mt-0.5">
                      {currentOrder.courierName || 'VRL Express Cargo'}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                      Docket / Waybill No:
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

      {/* Official Tax Invoice & Packing Slip Modal */}
      {currentOrder && (
        <InvoiceModal
          order={currentOrder}
          isOpen={invoiceModalOpen}
          onClose={() => setInvoiceModalOpen(false)}
          type={invoiceType}
        />
      )}
    </div>
  );
};
