import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
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
  AlertCircle,
  Calculator,
  Search,
  Printer,
  Sparkles,
  Box,
  FileText,
  Check,
  X,
  ExternalLink
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

  // Active Tab: 'pad' | 'rfq' | 'quotes' | 'itc' | 'ratecard'
  const [activeTab, setActiveTab] = useState<'pad' | 'rfq' | 'quotes' | 'itc' | 'ratecard'>('pad');

  // Bulk SKU Order Pad State
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

  // Selected Quote for Printable Preview Modal
  const [selectedQuoteForPrint, setSelectedQuoteForPrint] = useState<Quotation | null>(null);

  // Net-30 Trade Credit Modal State
  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
  const [creditForm, setCreditForm] = useState({
    businessName: currentUser.companyName || '',
    gstin: currentUser.gstNumber || '',
    annualTurnover: '₹50 Lakhs - ₹2 Crores',
    requestedLimit: 250000,
    panNumber: '',
    bankAccount: '',
    ifsc: ''
  });
  const [creditApproved, setCreditApproved] = useState(false);

  // Swatch Box Feedback
  const [swatchAdded, setSwatchAdded] = useState(false);

  // GSTIN & ITC Calculator State
  const [gstinInput, setGstinInput] = useState(currentUser.gstNumber || '24AAECM8921P1ZA');
  const [monthlyProcurement, setMonthlyProcurement] = useState<number>(200000);
  const [taxCategory, setTaxCategory] = useState<'textile' | 'household'>('textile');
  const [gstinVerifiedData, setGstinVerifiedData] = useState<{
    valid: boolean;
    entityName?: string;
    state?: string;
    status?: string;
    filingFrequency?: string;
  } | null>({
    valid: true,
    entityName: currentUser.companyName || 'Mahalaxmi Wholesale Partner Enterprises',
    state: 'Gujarat (State Code 24)',
    status: 'ACTIVE - Regular Taxpayer',
    filingFrequency: 'Monthly (GSTR-1 & GSTR-3B)'
  });

  // Rate Card State
  const [rateCardCategory, setRateCardCategory] = useState<string>('all');
  const [rateCardSearch, setRateCardSearch] = useState<string>('');

  // Bulk Pad actions
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

  // RFQ Actions
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

  // 1-Click Order Swatch Box
  const handleOrderSwatchKit = () => {
    const swatchProduct = products.find(p => p.id === 'prod-swatch-box-01') || products[0];
    addToCart(swatchProduct, 1);
    setSwatchAdded(true);
    setTimeout(() => setSwatchAdded(false), 3000);
  };

  // Handle Trade Credit Application Submission
  const handleCreditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCreditApproved(true);
    setTimeout(() => {
      setIsCreditModalOpen(false);
      setCreditApproved(false);
    }, 2500);
  };

  // GSTIN Live Validation & Entity Lookup
  const handleValidateGstin = (value: string) => {
    const cleanGst = value.toUpperCase().trim();
    setGstinInput(cleanGst);

    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (cleanGst.length === 15 && gstRegex.test(cleanGst)) {
      const stateCode = cleanGst.substring(0, 2);
      const stateNames: Record<string, string> = {
        '24': 'Gujarat',
        '27': 'Maharashtra',
        '07': 'Delhi',
        '29': 'Karnataka',
        '33': 'Tamil Nadu',
        '09': 'Uttar Pradesh',
        '08': 'Rajasthan',
        '19': 'West Bengal'
      };
      setGstinVerifiedData({
        valid: true,
        entityName: currentUser.companyName || `${cleanGst.substring(2, 7)} Textile Traders`,
        state: `${stateNames[stateCode] || 'Registered State'} (Code ${stateCode})`,
        status: 'ACTIVE - Verified Taxpayer',
        filingFrequency: 'Monthly (GSTR-1 / GSTR-3B Compliant)'
      });
    } else if (cleanGst.length === 15) {
      setGstinVerifiedData({
        valid: false
      });
    } else {
      setGstinVerifiedData(null);
    }
  };

  // Calculate pad totals live
  const padCalculations = padRows.reduce(
    (acc, row) => {
      const prod = products.find(p => p.id === row.productId);
      if (!prod) return acc;
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

  // Filtered Rate Card Products
  const filteredRateCardProducts = products.filter(p => {
    const matchCat = rateCardCategory === 'all' || p.category === rateCardCategory;
    const matchSearch =
      p.name.toLowerCase().includes(rateCardSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(rateCardSearch.toLowerCase()) ||
      p.hsnCode.includes(rateCardSearch);
    return matchCat && matchSearch;
  });

  // Calculate ITC Savings
  const taxRate = taxCategory === 'textile' ? 0.05 : 0.12;
  const taxableBase = monthlyProcurement / (1 + taxRate);
  const monthlyItcSavings = Math.round(monthlyProcurement - taxableBase);
  const annualItcSavings = monthlyItcSavings * 12;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 pb-24">
      {/* 1. Wholesale Header Banner */}
      <div className="bg-gradient-to-r from-navy via-navy-800 to-indigo-dark text-white rounded-3xl p-6 sm:p-10 shadow-premium relative overflow-hidden">
        <div className="max-w-3xl space-y-4 relative z-10">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="champagne" size="sm" className="font-bold">
              B2B ENTERPRISE WHOLESALE PORTAL
            </Badge>
            <span className="bg-emerald-500/20 text-emerald-300 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-400/30">
              Direct Surat Loom Mill Rates
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
            Direct Mill Sourcing, Multi-SKU Pad, RFQ & GSTR-2B Tax Credit Engine
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            High-speed procurement for retailers, distributors, hotels, and corporate resellers. Zero middlemen, instant Input Tax Credit (ITC) filings, and guaranteed commercial Net-30 credit terms.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-4 border-t border-slate-700 text-xs">
            <div>
              <p className="text-champagne font-black text-sm sm:text-base">Surat & Tirupur</p>
              <p className="text-[11px] text-slate-300">Direct Mill Dispatch</p>
            </div>
            <div>
              <p className="text-champagne font-black text-sm sm:text-base">Up to 46% Off</p>
              <p className="text-[11px] text-slate-300">On Container/Bale Lots</p>
            </div>
            <div>
              <p className="text-champagne font-black text-sm sm:text-base">5% & 12% GST</p>
              <p className="text-[11px] text-slate-300">100% Verified ITC</p>
            </div>
            <div>
              <p className="text-champagne font-black text-sm sm:text-base">Net-30 Credit</p>
              <p className="text-[11px] text-slate-300">₹50K - ₹5L Pre-Approved</p>
            </div>
          </div>
        </div>

        {/* Quick Action Badges on Top Right */}
        <div className="mt-6 sm:mt-0 sm:absolute sm:top-8 sm:right-8 flex flex-col gap-2.5 z-10">
          <button
            onClick={() => setIsCreditModalOpen(true)}
            className="px-4 py-2.5 bg-champagne hover:bg-champagne/90 text-navy font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
          >
            <CreditCard className="w-4 h-4 text-navy" />
            <span>Apply 30-Day Trade Credit</span>
          </button>

          <button
            onClick={handleOrderSwatchKit}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2"
          >
            <Box className="w-4 h-4 text-champagne" />
            <span>{swatchAdded ? '✓ Swatch Kit Added!' : 'Order Swatch Kit (₹199)'}</span>
          </button>
        </div>
      </div>

      {/* 2. Interactive Navigation Tabs (5 Rich Tabs) */}
      <div className="border-b border-slate-200 overflow-x-auto touch-pan-x flex gap-4 sm:gap-8 hide-scrollbar">
        <button
          onClick={() => setActiveTab('pad')}
          className={`pb-3.5 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap shrink-0 ${
            activeTab === 'pad'
              ? 'border-indigo text-indigo'
              : 'border-transparent text-slate-500 hover:text-navy'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Quick Bulk SKU Pad</span>
        </button>

        <button
          onClick={() => setActiveTab('rfq')}
          className={`pb-3.5 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap shrink-0 ${
            activeTab === 'rfq'
              ? 'border-indigo text-indigo'
              : 'border-transparent text-slate-500 hover:text-navy'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Request Custom RFQ</span>
        </button>

        <button
          onClick={() => setActiveTab('quotes')}
          className={`pb-3.5 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap shrink-0 ${
            activeTab === 'quotes'
              ? 'border-indigo text-indigo'
              : 'border-transparent text-slate-500 hover:text-navy'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Track RFQs ({quotations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('itc')}
          className={`pb-3.5 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap shrink-0 ${
            activeTab === 'itc'
              ? 'border-indigo text-indigo'
              : 'border-transparent text-slate-500 hover:text-navy'
          }`}
        >
          <Calculator className="w-4 h-4" />
          <span>GSTIN & ITC Calculator</span>
        </button>

        <button
          onClick={() => setActiveTab('ratecard')}
          className={`pb-3.5 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap shrink-0 ${
            activeTab === 'ratecard'
              ? 'border-indigo text-indigo'
              : 'border-transparent text-slate-500 hover:text-navy'
          }`}
        >
          <Download className="w-4 h-4" />
          <span>Surat Mill Price Sheet</span>
        </button>
      </div>

      {/* ========================================================
          TAB 1: BULK SKU ORDER PAD
          ======================================================== */}
      {activeTab === 'pad' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-5 sm:p-8 border border-slate-200 shadow-subtle space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h2 className="font-extrabold text-base sm:text-lg text-navy">
                  Multi-SKU Rapid Order Entry Grid
                </h2>
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
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs min-w-[640px]">
                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <th className="py-3 px-4 w-5/12">Product Selection</th>
                    <th className="py-3 px-3 text-center">Unit MRP</th>
                    <th className="py-3 px-3 text-center w-28">Order Qty</th>
                    <th className="py-3 px-4 text-right">Applicable Tier Rate</th>
                    <th className="py-3 px-4 text-right">Row Total</th>
                    <th className="py-3 px-2 text-center w-12">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
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

      {/* ========================================================
          TAB 2: REQUEST CUSTOM RFQ
          ======================================================== */}
      {activeTab === 'rfq' && (
        <form onSubmit={handleRfqSubmit} className="space-y-6">
          <div className="bg-white rounded-3xl p-5 sm:p-8 border border-slate-200 shadow-subtle space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div>
                <h2 className="font-extrabold text-base sm:text-lg text-navy">
                  Commercial Request for Quotation (RFQ)
                </h2>
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
            <div className="p-4 bg-indigo-light/60 rounded-2xl border border-indigo-100 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <p className="font-bold text-navy">Quoting as: {currentUser.name}</p>
                <p className="text-slate-600 text-[11px]">
                  Company: <span className="font-semibold">{currentUser.companyName || 'Not Set'}</span> • GSTIN: <span className="font-mono font-semibold">{currentUser.gstNumber || '24AAECM8921P1ZA'}</span>
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
                      placeholder="e.g. 450"
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

      {/* ========================================================
          TAB 3: TRACK QUOTATIONS
          ======================================================== */}
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
                className="bg-white rounded-3xl p-5 sm:p-8 border border-slate-200 shadow-subtle space-y-6"
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

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedQuoteForPrint(quote)}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <Printer className="w-4 h-4 text-indigo" />
                      <span>Print Quote PDF</span>
                    </button>

                    {quote.status === 'PREPARED' && (
                      <button
                        onClick={() => handleConvertQuote(quote.id)}
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Accept & Order</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Quoted Items */}
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs min-w-[600px]">
                    <thead className="bg-slate-100 text-slate-700">
                      <tr>
                        <th className="py-2.5 px-3">Product Name</th>
                        <th className="py-2.5 px-2 text-center">SKU</th>
                        <th className="py-2.5 px-2 text-center">Quantity</th>
                        <th className="py-2.5 px-3 text-right">Target Rate</th>
                        <th className="py-2.5 px-3 text-right">Mill Quoted Rate</th>
                        <th className="py-2.5 px-4 text-right">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
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

      {/* ========================================================
          TAB 4: GSTIN & GSTR-2B ITC CALCULATOR ENGINE
          ======================================================== */}
      {activeTab === 'itc' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: GSTIN Live Verification & Tax Policy */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-subtle space-y-6">
              <div>
                <span className="text-[11px] font-bold text-indigo uppercase tracking-wider block">
                  GOVERNMENT COMPLIANT B2B TAX PORTAL
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-navy mt-1">
                  GSTIN Validator & Input Tax Credit (ITC) Portal
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Validate your 15-digit GSTIN to activate corporate invoice generation, GSTR-1 live filing, and direct GSTR-2B tax refund eligibility.
                </p>
              </div>

              {/* GSTIN Input Form */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-700 block">
                  Enter 15-Digit Indian GSTIN:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={15}
                    value={gstinInput}
                    onChange={e => handleValidateGstin(e.target.value)}
                    placeholder="e.g. 24AAECM8921P1ZA"
                    className="flex-1 p-3 border border-slate-300 rounded-xl text-xs font-mono font-bold text-navy uppercase tracking-widest focus:border-indigo outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleValidateGstin(gstinInput)}
                    className="px-5 py-3 bg-navy hover:bg-navy-800 text-white rounded-xl text-xs font-bold transition shrink-0"
                  >
                    Verify Status
                  </button>
                </div>

                {/* Verification Result Card */}
                {gstinVerifiedData && (
                  <div
                    className={`p-4 rounded-2xl border text-xs space-y-2.5 transition ${
                      gstinVerifiedData.valid
                        ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                        : 'bg-rose-50 border-rose-200 text-rose-950'
                    }`}
                  >
                    {gstinVerifiedData.valid ? (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-emerald-800 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            GSTIN Verified & Active in CBIC Master
                          </span>
                          <span className="bg-emerald-200/80 text-emerald-900 font-bold px-2 py-0.5 rounded text-[10px]">
                            ELIGIBLE FOR FULL ITC
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-emerald-200 text-[11px]">
                          <div>
                            <span className="text-slate-500 block">Legal Entity Name:</span>
                            <span className="font-bold text-navy">{gstinVerifiedData.entityName}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">State Jurisdiction:</span>
                            <span className="font-bold text-navy">{gstinVerifiedData.state}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Taxpayer Status:</span>
                            <span className="font-bold text-emerald-700">{gstinVerifiedData.status}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Filing Mode:</span>
                            <span className="font-bold text-slate-800">{gstinVerifiedData.filingFrequency}</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center gap-2 text-rose-700">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>Invalid GSTIN format. Please enter a valid 15-character alphanumeric GST number.</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Tax Credit Policy & Benefits */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <h3 className="font-bold text-xs text-navy uppercase tracking-wider">
                  Direct Mill Invoice GST Benefits:
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="font-bold text-navy">Textiles & Cotton Linen</p>
                    <p className="text-slate-500 text-[11px] mt-0.5">HSN Chapter 52 & 63: Flat 5% GST with 100% GSTR-2B input refund.</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="font-bold text-navy">Household & Cleaning Items</p>
                    <p className="text-slate-500 text-[11px] mt-0.5">HSN Chapter 39 & 63: Flat 12% GST claimable against business output tax.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Interactive ITC ROI Calculator */}
            <div className="lg:col-span-5 bg-gradient-to-br from-navy via-navy-800 to-indigo-dark text-white rounded-3xl p-6 sm:p-8 shadow-premium space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <Badge variant="champagne" size="sm" className="font-bold">
                  LIVE CASH SAVINGS ESTIMATOR
                </Badge>
                <h3 className="text-xl font-black text-white">
                  Monthly Input Tax Credit (ITC) Refund Calculator
                </h3>
                <p className="text-xs text-slate-300">
                  See how much money your business claws back from the government on every bulk consignment from Mahalaxmi Enterprises.
                </p>

                {/* Sourcing Category */}
                <div className="space-y-1.5 pt-2">
                  <label className="text-xs text-slate-300 font-semibold block">Select Procurement Category:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTaxCategory('textile')}
                      className={`p-2.5 rounded-xl text-xs font-bold border transition text-center ${
                        taxCategory === 'textile'
                          ? 'bg-champagne text-navy border-champagne'
                          : 'bg-white/10 text-white border-white/20 hover:bg-white/15'
                      }`}
                    >
                      Textile / Cotton (5% GST)
                    </button>
                    <button
                      type="button"
                      onClick={() => setTaxCategory('household')}
                      className={`p-2.5 rounded-xl text-xs font-bold border transition text-center ${
                        taxCategory === 'household'
                          ? 'bg-champagne text-navy border-champagne'
                          : 'bg-white/10 text-white border-white/20 hover:bg-white/15'
                      }`}
                    >
                      Household Goods (12% GST)
                    </button>
                  </div>
                </div>

                {/* Monthly Volume Slider */}
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-300">Monthly Procurement:</span>
                    <span className="font-black text-champagne text-base">₹{monthlyProcurement.toLocaleString('en-IN')}</span>
                  </div>
                  <input
                    type="range"
                    min="25000"
                    max="1000000"
                    step="25000"
                    value={monthlyProcurement}
                    onChange={e => setMonthlyProcurement(Number(e.target.value))}
                    className="w-full accent-champagne cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>₹25,000</span>
                    <span>₹5,00,000</span>
                    <span>₹10,00,000+</span>
                  </div>
                </div>
              </div>

              {/* Calculated Outputs */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-300">Monthly ITC Refund Claim:</span>
                  <span className="text-xl font-black text-emerald-400">₹{monthlyItcSavings.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-300">Annual Business Tax Savings:</span>
                  <span className="text-2xl font-black text-champagne">₹{annualItcSavings.toLocaleString('en-IN')}</span>
                </div>
                <div className="text-[11px] text-slate-300 pt-2 border-t border-white/10">
                  ✨ Automatically reflected in your GST portal under form GSTR-2B with Surat Mill E-Invoicing.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 5: SURAT MILL PRICE SHEET & HSN MASTER
          ======================================================== */}
      {activeTab === 'ratecard' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-5 sm:p-8 border border-slate-200 shadow-subtle space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="champagne" size="sm" className="font-bold">
                    OFFICIAL SURAT LOOM CATALOGUE
                  </Badge>
                  <span className="text-xs text-slate-400 font-mono">Q4 Direct Contract Rates</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-navy mt-1">
                  Surat Mill Wholesale Rate Card & HSN Master Sheet
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Direct commercial lot rates, HSN tax classifications, bale pack dimensions, and minimum order quantities.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2.5 bg-navy hover:bg-navy-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Master Price List</span>
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1">
                {['all', 'textile', 'cotton-products', 'home-kitchen', 'household'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setRateCardCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap capitalize ${
                      rateCardCategory === cat
                        ? 'bg-indigo text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat === 'all' ? 'All Categories' : cat.replace('-', ' ')}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={rateCardSearch}
                  onChange={e => setRateCardSearch(e.target.value)}
                  placeholder="Filter by SKU or name..."
                  className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs outline-none focus:border-indigo"
                />
              </div>
            </div>

            {/* Rate Sheet Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs min-w-[760px]">
                <thead className="bg-slate-100 text-slate-700 font-bold">
                  <tr>
                    <th className="py-3 px-4">Product Name & Grade</th>
                    <th className="py-3 px-3 text-center">SKU</th>
                    <th className="py-3 px-3 text-center">HSN</th>
                    <th className="py-3 px-3 text-center">GST</th>
                    <th className="py-3 px-3 text-center">MOQ</th>
                    <th className="py-3 px-3 text-right">Retail MRP</th>
                    <th className="py-3 px-3 text-right">Wholesale Tier 1</th>
                    <th className="py-3 px-4 text-right">Direct Mill Contract</th>
                    <th className="py-3 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredRateCardProducts.map(prod => {
                    const lowestTier = prod.wholesaleTiers?.[prod.wholesaleTiers.length - 1];
                    const midTier = prod.wholesaleTiers?.[1] || lowestTier;

                    return (
                      <tr key={prod.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3 px-4 font-bold text-navy">
                          <Link to={`/product/${prod.slug}`} className="hover:text-indigo">
                            {prod.name}
                          </Link>
                          <span className="block text-[10px] text-slate-500 font-normal">
                            {prod.subcategory} • Stock: {prod.stock} units
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-slate-500">{prod.sku}</td>
                        <td className="py-3 px-3 text-center font-mono font-semibold text-slate-700">{prod.hsnCode}</td>
                        <td className="py-3 px-3 text-center font-bold text-emerald-700">{prod.gstRate}%</td>
                        <td className="py-3 px-3 text-center font-bold text-slate-800">{prod.moq || 1} Pcs</td>
                        <td className="py-3 px-3 text-right text-slate-400 line-through">₹{prod.mrp}</td>
                        <td className="py-3 px-3 text-right font-bold text-slate-800">
                          ₹{midTier?.pricePerUnit || prod.retailPrice}
                        </td>
                        <td className="py-3 px-4 text-right font-black text-indigo">
                          ₹{lowestTier?.pricePerUnit || prod.retailPrice}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => {
                              addToCart(prod, prod.moq || 10);
                              navigate('/cart');
                            }}
                            className="px-2.5 py-1 bg-indigo-light hover:bg-indigo text-indigo hover:text-white rounded-lg text-[11px] font-bold transition"
                          >
                            Order
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Letterhead Footer Notice */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-[11px] text-slate-600 flex flex-col sm:flex-row justify-between items-center gap-2">
              <p>
                <strong>Certification:</strong> Rates are Ex-Factory Surat Loom Gate. Valid for verified GST registered buyers. Freight computed per weight slab via SafeXpress or V-Trans.
              </p>
              <span className="text-slate-400 shrink-0 font-mono">Mahalaxmi Enterprises © Surat, Gujarat</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: 30-DAY COMMERCIAL TRADE CREDIT APPLICATION
          ======================================================== */}
      {isCreditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 relative">
            <button
              onClick={() => setIsCreditModalOpen(false)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-navy rounded-full bg-slate-100 transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <Badge variant="champagne" size="sm" className="font-bold">
                INSTITUTIONAL FINANCING
              </Badge>
              <h3 className="text-xl font-black text-navy mt-1">
                Apply for 30-Day Revolving Trade Credit (Net-30)
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Purchase bulk textiles and household inventory today, pay after 30 days with 0% interest for verified GST businesses.
              </p>
            </div>

            {creditApproved ? (
              <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3">
                <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6 stroke-[3]" />
                </div>
                <h4 className="font-black text-emerald-950 text-lg">Provisional Credit Line Approved!</h4>
                <p className="text-xs text-emerald-800">
                  Credit Limit of <strong>₹{creditForm.requestedLimit.toLocaleString('en-IN')}</strong> activated under GSTIN <strong>{creditForm.gstin || '24AAECM8921P1ZA'}</strong>. You can now choose "30-Day Credit" during checkout.
                </p>
              </div>
            ) : (
              <form onSubmit={handleCreditSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Company / Store Name:</label>
                    <input
                      type="text"
                      required
                      value={creditForm.businessName}
                      onChange={e => setCreditForm({ ...creditForm, businessName: e.target.value })}
                      placeholder="e.g. Shree Textiles"
                      className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:border-indigo"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Business GSTIN:</label>
                    <input
                      type="text"
                      required
                      maxLength={15}
                      value={creditForm.gstin}
                      onChange={e => setCreditForm({ ...creditForm, gstin: e.target.value.toUpperCase() })}
                      placeholder="e.g. 24AAECM8921P1ZA"
                      className="w-full p-2.5 border border-slate-300 rounded-xl font-mono uppercase outline-none focus:border-indigo"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Annual Turnover:</label>
                    <select
                      value={creditForm.annualTurnover}
                      onChange={e => setCreditForm({ ...creditForm, annualTurnover: e.target.value })}
                      className="w-full p-2.5 border border-slate-300 rounded-xl outline-none bg-white text-navy font-semibold"
                    >
                      <option>₹10 Lakhs - ₹50 Lakhs</option>
                      <option>₹50 Lakhs - ₹2 Crores</option>
                      <option>₹2 Crores - ₹10 Crores</option>
                      <option>Above ₹10 Crores</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Requested Credit Line:</label>
                    <select
                      value={creditForm.requestedLimit}
                      onChange={e => setCreditForm({ ...creditForm, requestedLimit: Number(e.target.value) })}
                      className="w-full p-2.5 border border-slate-300 rounded-xl outline-none bg-white font-bold text-indigo"
                    >
                      <option value={50000}>₹50,000 (Starter)</option>
                      <option value={150000}>₹1,50,000 (Growth)</option>
                      <option value={250000}>₹2,50,000 (Wholesale)</option>
                      <option value={500000}>₹5,00,000 (Enterprise Institutional)</option>
                    </select>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500 space-y-1">
                  <p className="font-semibold text-slate-700">Instant Soft Evaluation:</p>
                  <p>No CIBIL bureau impact. Assessment performed against your GSTR-3B filings and Surat Mill trade verification.</p>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-indigo hover:bg-indigo-dark text-white rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-premium"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Submit Application for Instant Approval</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: FORMAL RFQ PRINTABLE QUOTATION SHEET
          ======================================================== */}
      {selectedQuoteForPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedQuoteForPrint(null)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-navy rounded-full bg-slate-100 transition"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Letterhead Header */}
            <div className="border-b-2 border-navy pb-4 flex justify-between items-start">
              <div>
                <h3 className="text-xl font-black text-navy tracking-tight">MAHALAXMI ENTERPRISES</h3>
                <p className="text-[11px] text-slate-500">
                  Ring Road Textile Market, Surat, Gujarat - 395002 • GSTIN: 24AAECM8921P1ZA
                </p>
                <p className="text-[11px] text-slate-500 font-semibold">Direct Mill Manufacturer & Master Distributor</p>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold text-sm text-indigo">{selectedQuoteForPrint.quoteNumber}</span>
                <p className="text-[10px] text-slate-400">Date: {new Date(selectedQuoteForPrint.createdAt).toLocaleDateString('en-IN')}</p>
              </div>
            </div>

            {/* Buyer Details */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Quotation Issued To:</span>
                <p className="font-bold text-navy">{selectedQuoteForPrint.buyer.companyName}</p>
                <p className="text-slate-600">Contact: {selectedQuoteForPrint.buyer.name}</p>
                <p className="text-slate-600 font-mono text-[11px]">GSTIN: {selectedQuoteForPrint.buyer.gstNumber || 'Not Stated'}</p>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Pricing Terms:</span>
                <p className="text-slate-700">Validity: 14 Days from issuance</p>
                <p className="text-slate-700">Dispatch: Within 3 business days of confirmation</p>
                <p className="text-slate-700">Payment: RTGS / Net 30 Commercial Credit</p>
              </div>
            </div>

            {/* Items Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-2 text-center">SKU</th>
                    <th className="py-2.5 px-2 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-right">Quoted Unit Rate</th>
                    <th className="py-2.5 px-4 text-right">Total (INR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedQuoteForPrint.items.map((it, i) => (
                    <tr key={i}>
                      <td className="py-2.5 px-3 font-semibold text-navy">{it.productName}</td>
                      <td className="py-2.5 px-2 text-center font-mono text-slate-500">{it.sku}</td>
                      <td className="py-2.5 px-2 text-center font-bold">{it.quantity}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-indigo">₹{it.quotedUnitPrice}</td>
                      <td className="py-2.5 px-4 text-right font-bold">₹{it.totalPrice.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Summary */}
            <div className="flex justify-between items-center text-xs pt-2">
              <div className="text-[11px] text-slate-500 space-y-1">
                <p>E. & O.E. Subject to Surat jurisdiction.</p>
                <p>Authorized Signatory: <strong>Mahalaxmi Loom Merchandising</strong></p>
              </div>
              <div className="space-y-1 text-right min-w-[200px]">
                <div className="flex justify-between text-slate-600">
                  <span>Taxable Subtotal:</span>
                  <span className="font-semibold">₹{selectedQuoteForPrint.subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>GST (5%):</span>
                  <span className="font-semibold">₹{selectedQuoteForPrint.estimatedTax.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Freight:</span>
                  <span className="font-semibold">₹{selectedQuoteForPrint.estimatedFreight.toLocaleString('en-IN')}</span>
                </div>
                <div className="border-t border-slate-300 pt-1 flex justify-between font-black text-navy text-sm">
                  <span>Total Amount:</span>
                  <span className="text-indigo">₹{selectedQuoteForPrint.grandTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-3 bg-navy hover:bg-navy-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>Print Quotation Sheet</span>
              </button>
              <button
                onClick={() => {
                  handleConvertQuote(selectedQuoteForPrint.id);
                  setSelectedQuoteForPrint(null);
                }}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Accept & Generate B2B Order</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
