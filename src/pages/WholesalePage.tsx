import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Product, Quotation } from '../types';
import {
  Building2,
  FileSpreadsheet,
  Plus,
  Trash2,
  Send,
  CheckCircle2,
  Clock,
  ShieldCheck,
  CreditCard,
  Truck,
  ArrowRight,
  Layers,
  Percent,
  Download,
  AlertCircle
} from 'lucide-react';
import { Badge } from '../components/common/Badge';

export const WholesalePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prefillSku = searchParams.get('sku') || '';

  const {
    products,
    currentUser,
    addToCart,
    quotations,
    createQuotationRequest,
    acceptAndConvertQuotation
  } = useApp();

  // Active Tab: 'pad' (Bulk SKU Order Pad) | 'rfq' (Request Quotation) | 'quotes' (Track Quotations)
  const [activeTab, setActiveTab] = useState<'pad' | 'rfq' | 'quotes'>('pad');

  // Bulk SKU Order Pad State: list of { productId, quantity }
  const [padRows, setPadRows] = useState<{ productId: string; quantity: number }[]>([
    { productId: products[0]?.id || '', quantity: 20 },
    { productId: products[4]?.id || '', quantity: 50 },
    { productId: products[8]?.id || '', quantity: 20 }
  ]);
  const [padAddedFeedback, setPadAddedFeedback] = useState(false);

  // RFQ Form State
  const [rfqRows, setRfqRows] = useState<{ productId: string; quantity: number; targetPrice?: number }[]>([
    { productId: products.find(p => p.sku === prefillSku)?.id || products[0].id, quantity: 200, targetPrice: 450 }
  ]);
  const [rfqNotes, setRfqNotes] = useState('');
  const [rfqSubmittedSuccess, setRfqSubmittedSuccess] = useState<Quotation | null>(null);

  // Add row in Bulk Pad
  const handleAddPadRow = () => {
    setPadRows(prev => [...prev, { productId: products[0].id, quantity: 10 }]);
  };

  const handleRemovePadRow = (index: number) => {
    setPadRows(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdatePadRow = (index: number, field: 'productId' | 'quantity', val: any) => {
    setPadRows(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: val };
      return updated;
    });
  };

  // Add all pad items to cart
  const handleAddPadToCart = () => {
    padRows.forEach(row => {
      const prod = products.find(p => p.id === row.productId);
      if (prod && row.quantity > 0) {
        addToCart(prod, row.quantity);
      }
    });
    setPadAddedFeedback(true);
    setTimeout(() => {
      setPadAddedFeedback(false);
      navigate('/cart');
    }, 1500);
  };

  // Add row in RFQ
  const handleAddRfqRow = () => {
    setRfqRows(prev => [...prev, { productId: products[0].id, quantity: 100 }]);
  };

  const handleRemoveRfqRow = (index: number) => {
    setRfqRows(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateRfqRow = (index: number, field: string, val: any) => {
    setRfqRows(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: val };
      return updated;
    });
  };

  const handleRfqSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rfqRows.length === 0) return;
    const createdQuote = createQuotationRequest(rfqRows, rfqNotes);
    setRfqSubmittedSuccess(createdQuote);
    setActiveTab('quotes');
  };

  const handleConvertQuote = (quoteId: string) => {
    const order = acceptAndConvertQuotation(quoteId);
    if (order) {
      navigate(`/orders?success=${order.id}`);
    }
  };

  // Calculate pad totals live
  const padCalculations = padRows.reduce(
    (acc, row) => {
      const prod = products.find(p => p.id === row.productId);
      if (!prod) return acc;
      // Find matching tier
      const sortedTiers = [...(prod.wholesaleTiers || [])].sort((a, b) => b.minQty - a.minQty);
      const tier = sortedTiers.find(t => row.quantity >= t.minQty);
      const unit = tier ? tier.pricePerUnit : prod.retailPrice;
      const total = unit * row.quantity;
      acc.totalPieces += row.quantity;
      acc.totalCost += total;
      return acc;
    },
    { totalPieces: 0, totalCost: 0 }
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-10 pb-20">
      {/* 1. Wholesale Header Banner */}
      <div className="bg-gradient-to-r from-navy via-navy-800 to-indigo-dark text-white rounded-3xl p-8 sm:p-10 shadow-premium relative overflow-hidden">
        <div className="max-w-3xl space-y-4 relative z-10">
          <Badge variant="champagne" size="sm" className="font-bold">
            B2B WHOLESALE COMMERCE HUB
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
            Direct Mill Sourcing, Bulk Order Pad & RFQ Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Direct-from-loom supply for retailers, hotels, hospitals, and corporate merchandisers. Rapid multi-SKU entry, customized batch quotations, and institutional 30-day payment terms.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-700 text-xs">
            <div>
              <p className="text-champagne font-black text-base">Surat & Tirupur</p>
              <p className="text-[11px] text-slate-300">Direct Mill Dispatch</p>
            </div>
            <div>
              <p className="text-champagne font-black text-base">Up to 46% Off</p>
              <p className="text-[11px] text-slate-300">On Container/Bale Lots</p>
            </div>
            <div>
              <p className="text-champagne font-black text-base">5% & 12% GST</p>
              <p className="text-[11px] text-slate-300">Instant ITC Credit</p>
            </div>
            <div>
              <p className="text-champagne font-black text-base">Net 30 Credit</p>
              <p className="text-[11px] text-slate-300">For Verified Buyers</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('pad')}
          className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'pad'
              ? 'border-indigo text-indigo'
              : 'border-transparent text-slate-500 hover:text-navy'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Quick Bulk SKU Order Pad</span>
        </button>

        <button
          onClick={() => setActiveTab('rfq')}
          className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'rfq'
              ? 'border-indigo text-indigo'
              : 'border-transparent text-slate-500 hover:text-navy'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Request Custom Quotation (RFQ)</span>
        </button>

        <button
          onClick={() => setActiveTab('quotes')}
          className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'quotes'
              ? 'border-indigo text-indigo'
              : 'border-transparent text-slate-500 hover:text-navy'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Track Quotations ({quotations.length})</span>
        </button>
      </div>

      {/* TAB 1: BULK SKU ORDER PAD */}
      {activeTab === 'pad' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-subtle space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-base text-navy">
                  Multi-SKU Rapid Order Entry Grid
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select products, adjust quantities, and instantly push to cart with live tier discounts applied.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddPadRow}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-navy rounded-xl text-xs font-bold transition flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Plus className="w-4 h-4 text-indigo" />
                <span>Add Product Row</span>
              </button>
            </div>

            {/* Grid Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <th className="py-3 px-4 w-1/2">Product Selection</th>
                    <th className="py-3 px-3 text-center">Unit MRP</th>
                    <th className="py-3 px-3 text-center w-28">Order Qty</th>
                    <th className="py-3 px-4 text-right">Applicable Tier Rate</th>
                    <th className="py-3 px-4 text-right">Row Total</th>
                    <th className="py-3 px-2 text-center w-12">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {padRows.map((row, idx) => {
                    const prod = products.find(p => p.id === row.productId) || products[0];
                    const sortedTiers = [...(prod.wholesaleTiers || [])].sort((a, b) => b.minQty - a.minQty);
                    const tier = sortedTiers.find(t => row.quantity >= t.minQty);
                    const unitRate = tier ? tier.pricePerUnit : prod.retailPrice;
                    const rowTotal = unitRate * row.quantity;

                    return (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        {/* Product Picker */}
                        <td className="py-3 px-4">
                          <select
                            value={row.productId}
                            onChange={e => handleUpdatePadRow(idx, 'productId', e.target.value)}
                            className="w-full p-2 border border-slate-300 rounded-lg text-xs font-medium focus:border-indigo outline-none bg-white text-navy"
                          >
                            {products.map(p => (
                              <option key={p.id} value={p.id}>
                                [{p.sku}] {p.name}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* MRP */}
                        <td className="py-3 px-3 text-center text-slate-400 line-through">
                          ₹{prod.mrp}
                        </td>

                        {/* Qty Input */}
                        <td className="py-3 px-3 text-center">
                          <input
                            type="number"
                            min="1"
                            value={row.quantity}
                            onChange={e => handleUpdatePadRow(idx, 'quantity', Math.max(1, Number(e.target.value)))}
                            className="w-20 text-center p-1.5 border border-slate-300 rounded-lg text-xs font-bold focus:border-indigo outline-none"
                          />
                        </td>

                        {/* Tier Rate */}
                        <td className="py-3 px-4 text-right">
                          <span className="font-bold text-navy">₹{unitRate}</span>
                          {tier && tier.savingsPercent > 0 && (
                            <span className="block text-[10px] text-emerald-700 font-semibold">
                              {tier.label} ({tier.savingsPercent}% off)
                            </span>
                          )}
                        </td>

                        {/* Row Total */}
                        <td className="py-3 px-4 text-right font-black text-indigo">
                          ₹{rowTotal.toLocaleString('en-IN')}
                        </td>

                        {/* Delete Button */}
                        <td className="py-3 px-2 text-center">
                          <button
                            onClick={() => handleRemovePadRow(idx)}
                            className="p-1.5 text-slate-400 hover:text-error hover:bg-red-50 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Calculations & Transfer to Cart */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pt-4 border-t border-slate-200">
              <div className="flex items-center gap-6 text-xs text-slate-600">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Batch Quantity:</span>
                  <span className="text-base font-black text-navy">{padCalculations.totalPieces} Units</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Estimated Taxable Total:</span>
                  <span className="text-xl font-black text-indigo">
                    ₹{padCalculations.totalCost.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddPadToCart}
                className="px-6 py-3.5 bg-indigo hover:bg-indigo-dark text-white rounded-xl text-xs font-bold transition shadow-premium flex items-center justify-center gap-2"
              >
                {padAddedFeedback ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Transferred to Cart!</span>
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Push Batch to Cart & Checkout &rarr;</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: REQUEST CUSTOM RFQ */}
      {activeTab === 'rfq' && (
        <form onSubmit={handleRfqSubmit} className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-subtle space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-base text-navy">
                  Commercial Request for Quotation (RFQ)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Submit customized volume requests (200+ units) directly to Surat mill production managers.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddRfqRow}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1"
              >
                <Plus className="w-4 h-4 text-indigo" />
                <span>Add Item</span>
              </button>
            </div>

            {/* Buyer Verification notice */}
            <div className="p-4 bg-indigo-light/60 rounded-2xl border border-indigo-100 text-xs flex items-center justify-between">
              <div>
                <p className="font-bold text-navy">Quoting as: {currentUser.name}</p>
                <p className="text-slate-600 text-[11px]">
                  Company: <span className="font-semibold">{currentUser.companyName || 'Not Set'}</span> • GSTIN: <span className="font-mono font-semibold">{currentUser.gstNumber || 'Not Set'}</span>
                </p>
              </div>
              <Badge variant="primary" size="sm">
                {currentUser.businessType || 'Wholesale Buyer'}
              </Badge>
            </div>

            {/* RFQ Items Grid */}
            <div className="space-y-3">
              {rfqRows.map((row, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center text-xs"
                >
                  <div className="sm:col-span-6">
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Target Product</label>
                    <select
                      value={row.productId}
                      onChange={e => handleUpdateRfqRow(idx, 'productId', e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-lg bg-white outline-none text-navy font-semibold"
                    >
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          [{p.sku}] {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-3">
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Requested Qty (Units)</label>
                    <input
                      type="number"
                      min="50"
                      value={row.quantity}
                      onChange={e => handleUpdateRfqRow(idx, 'quantity', Number(e.target.value))}
                      className="w-full p-2 border border-slate-300 rounded-lg bg-white outline-none font-bold text-navy"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Target Rate (₹/unit)</label>
                    <input
                      type="number"
                      placeholder="e.g. 480"
                      value={row.targetPrice || ''}
                      onChange={e => handleUpdateRfqRow(idx, 'targetPrice', Number(e.target.value))}
                      className="w-full p-2 border border-slate-300 rounded-lg bg-white outline-none font-bold text-indigo"
                    />
                  </div>

                  <div className="sm:col-span-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleRemoveRfqRow(idx)}
                      className="p-2 text-slate-400 hover:text-error rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Special Instructions & Specs */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Custom Specifications & Freight Instructions:
              </label>
              <textarea
                rows={3}
                value={rfqNotes}
                onChange={e => setRfqNotes(e.target.value)}
                placeholder="Specify custom embroidery, export packaging, delivery dock requirements, or requested payment terms (e.g. Net 30, LC, Advance RTGS)."
                className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:border-indigo outline-none"
              ></textarea>
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-indigo hover:bg-indigo-dark text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-premium"
            >
              <Send className="w-4 h-4" />
              <span>Submit Commercial RFQ to Loom Merchandiser</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: TRACK QUOTATIONS */}
      {activeTab === 'quotes' && (
        <div className="space-y-6">
          {rfqSubmittedSuccess && (
            <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 space-y-1">
              <p className="font-bold flex items-center gap-2 text-sm text-emerald-800">
                <CheckCircle2 className="w-4 h-4" />
                RFQ {rfqSubmittedSuccess.quoteNumber} Logged Successfully!
              </p>
              <p className="text-slate-600">
                Our operations team will review your quantities and prepare official pricing. You can also view and accept prepared quotes below.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6">
            {quotations.map(quote => (
              <div
                key={quote.id}
                className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-subtle space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-base font-black text-navy">{quote.quoteNumber}</span>
                      <Badge
                        variant={
                          quote.status === 'PREPARED'
                            ? 'success'
                            : quote.status === 'CONVERTED'
                            ? 'primary'
                            : 'warning'
                        }
                        size="sm"
                      >
                        {quote.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Buyer: <span className="font-semibold text-slate-800">{quote.buyer.companyName}</span> • Created: {new Date(quote.createdAt).toLocaleDateString('en-IN')} • Valid until: {new Date(quote.validUntil).toLocaleDateString('en-IN')}
                    </p>
                  </div>

                  {quote.status === 'PREPARED' && (
                    <button
                      onClick={() => handleConvertQuote(quote.id)}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Accept Quote & Generate B2B Order</span>
                    </button>
                  )}
                </div>

                {/* Quoted Items */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                    <thead className="bg-slate-100 text-slate-700">
                      <tr>
                        <th className="py-2.5 px-3">Product Name</th>
                        <th className="py-2.5 px-2 text-center">SKU</th>
                        <th className="py-2.5 px-2 text-center">Quantity</th>
                        <th className="py-2.5 px-3 text-right">Target Rate</th>
                        <th className="py-2.5 px-3 text-right">Mill Quoted Unit Rate</th>
                        <th className="py-2.5 px-4 text-right">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {quote.items.map((it, i) => (
                        <tr key={i}>
                          <td className="py-2.5 px-3 font-semibold text-navy">{it.productName}</td>
                          <td className="py-2.5 px-2 text-center font-mono text-slate-500">{it.sku}</td>
                          <td className="py-2.5 px-2 text-center font-bold text-navy">{it.quantity}</td>
                          <td className="py-2.5 px-3 text-right text-slate-500">₹{it.targetPrice || '-'}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-indigo">₹{it.quotedUnitPrice}</td>
                          <td className="py-2.5 px-4 text-right font-bold text-navy">₹{it.totalPrice.toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Financial Summary */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-2 text-xs">
                  <div className="space-y-1 text-slate-600">
                    {quote.notes && <p className="italic text-slate-500">Note: "{quote.notes}"</p>}
                    {quote.preparedBy && <p className="text-[11px] text-indigo font-semibold">Prepared by: {quote.preparedBy}</p>}
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-right space-y-1 min-w-[240px]">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal:</span>
                      <span className="font-semibold text-navy">₹{quote.subtotal.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Estimated GST (5%):</span>
                      <span className="font-semibold text-navy">₹{quote.estimatedTax.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Freight Estimate:</span>
                      <span className="font-semibold text-navy">₹{quote.estimatedFreight.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="border-t border-slate-300 pt-1 flex justify-between font-bold text-navy text-sm">
                      <span>Grand Total:</span>
                      <span className="text-indigo font-black">₹{quote.grandTotal.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
