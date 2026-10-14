import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { CATEGORIES_CONFIG } from '../data/mockProducts';
import { ProductCard } from '../components/common/ProductCard';
import { Badge } from '../components/common/Badge';
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  Truck,
  Building2,
  Users,
  Hotel,
  Home,
  CheckCircle2,
  Send,
  Layers,
  Sparkles,
  HelpCircle,
  FileSpreadsheet,
  Calculator,
  Flame
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const { products, submitBusinessEnquiry } = useApp();

  // Selected persona tab for "Shop by Business Need"
  const [selectedBusinessNeed, setSelectedBusinessNeed] = useState<
    'hotels' | 'retailers' | 'resellers' | 'institutions' | 'home'
  >('hotels');

  // Interactive Bulk Calculator state
  const [calcQuantity, setCalcQuantity] = useState<number>(100);
  const [calcItem, setCalcItem] = useState<'bedsheet' | 'towel' | 'microfiber'>('bedsheet');

  // Business Enquiry Quick Form state
  const [enquiryForm, setEnquiryForm] = useState({
    fullName: '',
    businessName: '',
    phone: '',
    email: '',
    city: '',
    businessType: 'Retailer' as const,
    expectedMonthlyVolume: '₹1,00,000 - ₹5,00,000',
    notes: ''
  });
  const [enquirySubmitted, setEnquirySubmitted] = useState(false);

  const handleEnquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitBusinessEnquiry({
      ...enquiryForm,
      state: 'India',
      interestedCategories: ['textile', 'cotton-products']
    });
    setEnquirySubmitted(true);
    setTimeout(() => {
      setEnquirySubmitted(false);
      setEnquiryForm({
        fullName: '',
        businessName: '',
        phone: '',
        email: '',
        city: '',
        businessType: 'Retailer',
        expectedMonthlyVolume: '₹1,00,000 - ₹5,00,000',
        notes: ''
      });
    }, 4000);
  };

  // Best sellers & trending lists
  const bestSellers = products.filter(p => p.isBestSeller).slice(0, 4);
  const trendingDeals = products.filter(p => p.isDirectMillDeal).slice(0, 4);

  // Calculator logic
  const calcData = {
    bedsheet: { name: '300 TC Combed Cotton Bedsheet', retailRate: 899, bulkRate: 489, mrp: 1899 },
    towel: { name: '600 GSM Plush Bath Towel', retailRate: 449, bulkRate: 225, mrp: 999 },
    microfiber: { name: '350 GSM Microfiber Cloth (24-Pk)', retailRate: 599, bulkRate: 340, mrp: 1299 }
  }[calcItem];

  const totalRetailCost = calcQuantity * calcData.retailRate;
  const totalBulkCost = calcQuantity * calcData.bulkRate;
  const totalSavings = totalRetailCost - totalBulkCost;
  const percentageSavings = Math.round((totalSavings / totalRetailCost) * 100);

  return (
    <div className="space-y-16 pb-16">
      {/* ========================================================
          1. HERO BANNER: Direct Mill Rates & Wholesale Essentials
          ======================================================== */}
      <section className="relative bg-navy overflow-hidden text-white pt-10 pb-16 lg:py-20">
        {/* Subtle patterned background */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#C6AA80_1px,transparent_1px)] [background-size:20px_20px]"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-navy-800 border border-slate-700 text-xs font-semibold text-champagne">
                <span className="w-2 h-2 rounded-full bg-champagne animate-pulse"></span>
                <span>Direct Mill Rates • Zero Middlemen • Surat & Tirupur Looms</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
                India's Premier <span className="text-champagne">B2B Wholesale</span> & Direct Mill Commerce
              </h1>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl">
                Source directly from industrial looms. 300+ TC bedsheets, 600 GSM combed cotton towels, heavy canvas bags, and commercial hygiene textiles. Tailored for retail stores, hospitality chains, institutions, and savvy home buyers.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  to="/catalog"
                  className="px-6 py-3.5 bg-indigo hover:bg-indigo-dark text-white rounded-xl font-bold text-sm transition shadow-premium flex items-center gap-2 group"
                >
                  <span>Explore Product Catalog</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  to="/wholesale"
                  className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl font-bold text-sm transition flex items-center gap-2"
                >
                  <Building2 className="w-4 h-4 text-champagne" />
                  <span>Request Wholesale Quotation</span>
                </Link>
              </div>

              {/* Trust Badges Bar */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-800 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>100% GST Invoiced (Full ITC)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Tiered Volume Discounts</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Pan-India Pallet Freight</span>
                </div>
              </div>
            </div>

            {/* Right Visual Column: Featured Mill Showcase Card */}
            <div className="lg:col-span-5">
              <div className="relative rounded-2xl overflow-hidden border border-slate-700/80 shadow-premium bg-navy-800/80 p-3">
                <div className="relative aspect-[4/3] rounded-xl overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?q=80&w=1000&auto=format&fit=crop"
                    alt="Glance 300 TC Combed Cotton Bedsheet"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy/90 via-navy/20 to-transparent"></div>

                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <span className="badge-mill text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                      Featured Mill Run
                    </span>
                    <h3 className="font-bold text-base mt-1 text-white">
                      300 TC Pure Combed Cotton Bedsheet Sets
                    </h3>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/20 text-xs">
                      <div>
                        <span className="text-slate-300 text-[11px]">Direct Mill Wholesale:</span>
                        <p className="font-black text-champagne text-base">₹489 <span className="text-xs font-normal text-slate-300">/ set (200+ pcs)</span></p>
                      </div>
                      <Link
                        to="/product/glance-300-tc-cotton-double-bedsheet"
                        className="px-3 py-1.5 bg-indigo hover:bg-indigo-dark text-white rounded-lg font-semibold text-xs transition"
                      >
                        View Tiers &rarr;
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Sub-card ticker */}
                <div className="mt-3 grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="bg-navy-900/60 p-2.5 rounded-lg border border-slate-700">
                    <p className="text-[10px] text-slate-400 uppercase">Average Retail MRP</p>
                    <p className="font-bold text-slate-300 line-through">₹1,899</p>
                  </div>
                  <div className="bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-800/40">
                    <p className="text-[10px] text-emerald-400 uppercase font-semibold">Bulk Buyer Savings</p>
                    <p className="font-bold text-emerald-300">Up to 46% Off</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          2. FOUR PRIMARY SHOPPING CATEGORIES
          ======================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo font-bold text-xs uppercase tracking-wider mb-1">
              <Layers className="w-4 h-4" />
              <span>Core Product Divisions</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-navy tracking-tight">
              Four Primary Wholesale & Retail Categories
            </h2>
          </div>
          <Link
            to="/catalog"
            className="text-xs font-bold text-indigo hover:text-indigo-dark flex items-center gap-1"
          >
            <span>Browse Complete Master Catalog</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {CATEGORIES_CONFIG.map(cat => (
            <Link
              key={cat.id}
              to={`/category/${cat.id}`}
              className="group relative bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-subtle hover:shadow-premium transition-all duration-300 flex flex-col justify-between"
            >
              <div className="aspect-[16/10] overflow-hidden bg-slate-100 relative">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy/80 via-transparent to-transparent"></div>
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <h3 className="font-extrabold text-lg text-white group-hover:text-champagne transition">
                    {cat.name}
                  </h3>
                  <p className="text-[11px] text-slate-300 line-clamp-1">{cat.tagline}</p>
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between bg-white">
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {cat.description}
                </p>

                {/* Subcategory Pills */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-1">
                  {cat.subcategories.map((sub, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-medium group-hover:bg-indigo-light group-hover:text-indigo transition"
                    >
                      {sub}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ========================================================
          3. BEST SELLERS: High Demand Commercial Lines
          ======================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-1.5 text-amber-600 font-bold text-xs uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Verified Customer Favorites</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-navy tracking-tight">
              Best Selling Lines & Repeat Re-Orders
            </h2>
          </div>
          <Link
            to="/catalog?filter=bestseller"
            className="text-xs font-bold text-indigo hover:text-indigo-dark flex items-center gap-1"
          >
            <span>View All Best Sellers</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {bestSellers.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* ========================================================
          4. WHOLESALE DEALS & INTERACTIVE LIVE SAVINGS CALCULATOR
          ======================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-gradient-to-br from-navy to-navy-900 rounded-3xl p-6 sm:p-10 text-white shadow-premium relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Content */}
            <div className="lg:col-span-6 space-y-4">
              <Badge variant="champagne" size="sm" className="font-bold">
                VOLUME DISCOUNTS ENGINE
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                Wholesale Deals & Direct Mill Bulk Purchasing
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Unlock direct mill pricing tiers when purchasing 10, 50, or 200+ units. Automatic discount application at checkout with official GST tax invoices for commercial input tax credit.
              </p>

              <div className="space-y-2.5 pt-2 text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Tier 1 (10-49 Pcs): 25% - 30% Wholesale Margin</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Tier 2 (50-199 Pcs): 35% - 42% Commercial Batch Rate</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Tier 3 (200+ Pcs): Direct Mill Contract Rates (Up to 50% Off)</span>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <Link
                  to="/wholesale"
                  className="px-5 py-2.5 bg-indigo hover:bg-indigo-dark text-white rounded-xl text-xs font-bold transition shadow-sm"
                >
                  Open Bulk Order Pad
                </Link>
                <Link
                  to="/wholesale"
                  className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold transition"
                >
                  Request Custom RFQ
                </Link>
              </div>
            </div>

            {/* Right: Live Interactive Price Tier Simulator */}
            <div className="lg:col-span-6">
              <div className="bg-white text-navy rounded-2xl p-6 shadow-card border border-slate-200">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-indigo" />
                    <h3 className="font-bold text-sm text-navy">Live Bulk Savings Simulator</h3>
                  </div>
                  <span className="text-[11px] bg-indigo-light text-indigo px-2 py-0.5 rounded font-bold">
                    Interactive
                  </span>
                </div>

                {/* Product Selector */}
                <div className="mt-4 space-y-3">
                  <label className="text-xs font-bold text-slate-600 block">Select Product Line:</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setCalcItem('bedsheet')}
                      className={`p-2 rounded-xl text-xs font-semibold border transition text-center ${
                        calcItem === 'bedsheet'
                          ? 'border-indigo bg-indigo-light text-indigo'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      300 TC Bedsheet
                    </button>
                    <button
                      onClick={() => setCalcItem('towel')}
                      className={`p-2 rounded-xl text-xs font-semibold border transition text-center ${
                        calcItem === 'towel'
                          ? 'border-indigo bg-indigo-light text-indigo'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      600 GSM Towel
                    </button>
                    <button
                      onClick={() => setCalcItem('microfiber')}
                      className={`p-2 rounded-xl text-xs font-semibold border transition text-center ${
                        calcItem === 'microfiber'
                          ? 'border-indigo bg-indigo-light text-indigo'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      Microfiber (24-Pk)
                    </button>
                  </div>
                </div>

                {/* Quantity Slider */}
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-700">Order Quantity:</span>
                    <span className="font-black text-indigo text-sm">{calcQuantity} Units</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="500"
                    step="10"
                    value={calcQuantity}
                    onChange={e => setCalcQuantity(Number(e.target.value))}
                    className="w-full accent-indigo cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>10 Units (Retailer)</span>
                    <span>100 Units (Hotelier)</span>
                    <span>500 Units (Distributor)</span>
                  </div>
                </div>

                {/* Real-time Calculation Breakdown Box */}
                <div className="mt-5 bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Standard Retail Cost:</span>
                    <span className="line-through">₹{totalRetailCost.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-900 font-bold">
                    <span>Direct Mill Bulk Rate:</span>
                    <span className="text-indigo text-sm font-black">₹{totalBulkCost.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-emerald-700 font-extrabold text-sm">
                    <span>Your Total Cash Savings:</span>
                    <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-black">
                      ₹{totalSavings.toLocaleString('en-IN')} ({percentageSavings}% Off)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          5. SHOP BY BUSINESS NEED
          ======================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <Badge variant="primary" size="sm" className="mb-2">
            TAILORED PROCUREMENT
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-navy tracking-tight">
            Shop by Business Need
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Custom-built supply terms, packaging specifications, and pricing matrices designed for your sector.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {[
            { id: 'hotels', label: 'Hotels & Resorts', icon: Hotel },
            { id: 'retailers', label: 'Retailers & Showrooms', icon: Building2 },
            { id: 'resellers', label: 'Resellers & D2C Brands', icon: Users },
            { id: 'institutions', label: 'Hospitals & Institutions', icon: ShieldCheck },
            { id: 'home', label: 'Savvy Home Buyers', icon: Home }
          ].map(tab => {
            const Icon = tab.icon;
            const active = selectedBusinessNeed === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedBusinessNeed(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-sm ${
                  active
                    ? 'bg-navy text-white shadow-subtle'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-champagne' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Selected Persona Feature Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-subtle grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            {selectedBusinessNeed === 'hotels' && (
              <>
                <h3 className="text-xl font-bold text-navy">
                  Hospitality Linen & Bath Solutions (3★ to 5★ Standards)
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  High-durability 300 & 400 TC percale bedsheets, zero-twist 600 GSM bath sheets, and stain-resistant banquet table linen tested for 500+ commercial wash cycles in industrial laundry plants.
                </p>
                <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="font-bold text-navy">Custom Embroidery</p>
                    <p className="text-slate-500 text-[11px] mt-0.5">Hotel crest weaving on towels and duvet corners</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="font-bold text-navy">30-Day Credit Terms</p>
                    <p className="text-slate-500 text-[11px] mt-0.5">Approved credit accounts for hospitality groups</p>
                  </div>
                </div>
              </>
            )}

            {selectedBusinessNeed === 'retailers' && (
              <>
                <h3 className="text-xl font-bold text-navy">
                  Textile Retailers & Fabric Showrooms
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Maximize store profit margins with direct mill rates on packaged bedsheets, curtains, and cotton towels. Fast 48-hour dispatch so you can maintain lean inventory without tying up capital.
                </p>
                <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="font-bold text-navy">Display-Ready Packaging</p>
                    <p className="text-slate-500 text-[11px] mt-0.5">Attractive retail photo-card box packaging</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="font-bold text-navy">Low MOQ of 10 Pcs</p>
                    <p className="text-slate-500 text-[11px] mt-0.5">Test multiple colors & designs with minimal risk</p>
                  </div>
                </div>
              </>
            )}

            {selectedBusinessNeed === 'resellers' && (
              <>
                <h3 className="text-xl font-bold text-navy">
                  Online Resellers, Boutiques & D2C Brands
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Source unbranded and white-label cotton goods with high-definition digital asset packs ready for your marketplace listings. High repeat purchase rates and low returns.
                </p>
                <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="font-bold text-navy">High-Resolution Photos</p>
                    <p className="text-slate-500 text-[11px] mt-0.5">Free product photography & listing specs provided</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="font-bold text-navy">Bulk Drop-Freight</p>
                    <p className="text-slate-500 text-[11px] mt-0.5">Direct dispatch to Amazon / Flipkart fulfillment centers</p>
                  </div>
                </div>
              </>
            )}

            {selectedBusinessNeed === 'institutions' && (
              <>
                <h3 className="text-xl font-bold text-navy">
                  Hospitals, Healthcare Facilities & Boarding Schools
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Heavy-duty chlorine-resistant patient linen, hospital draw sheets, color-coded 350 GSM microfiber sanitizing cloths, and industrial kitchen aprons.
                </p>
                <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="font-bold text-navy">Thermal Autoclave Safe</p>
                    <p className="text-slate-500 text-[11px] mt-0.5">Withstands 90°C high-temperature sterilization</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="font-bold text-navy">Tender Rate Contracts</p>
                    <p className="text-slate-500 text-[11px] mt-0.5">Fixed 12-month supply pricing agreements</p>
                  </div>
                </div>
              </>
            )}

            {selectedBusinessNeed === 'home' && (
              <>
                <h3 className="text-xl font-bold text-navy">
                  Direct Mill Savings for Home Buyers
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Why pay 2x to 3x retail showroom markups? Get luxury 300 TC pure cotton bedsheets and 600 GSM spa towels delivered to your doorstep at direct factory rates.
                </p>
                <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="font-bold text-navy">Free Home Delivery</p>
                    <p className="text-slate-500 text-[11px] mt-0.5">Complimentary shipping on orders above ₹1,499</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="font-bold text-navy">Cash on Delivery (COD)</p>
                    <p className="text-slate-500 text-[11px] mt-0.5">Available across 19,000+ Indian pincodes</p>
                  </div>
                </div>
              </>
            )}

            <div className="pt-2">
              <Link
                to="/catalog"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-navy hover:bg-navy-800 text-white rounded-xl text-xs font-bold transition"
              >
                <span>Browse Curated Catalog for this Sector</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="aspect-[4/3] rounded-2xl overflow-hidden border border-slate-200 shadow-subtle">
              <img
                src={
                  selectedBusinessNeed === 'hotels'
                    ? 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=800&auto=format&fit=crop'
                    : selectedBusinessNeed === 'retailers'
                    ? 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=800&auto=format&fit=crop'
                    : selectedBusinessNeed === 'resellers'
                    ? 'https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=800&auto=format&fit=crop'
                    : selectedBusinessNeed === 'institutions'
                    ? 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=800&auto=format&fit=crop'
                    : 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=800&auto=format&fit=crop'
                }
                alt="Business Need Showcase"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          6. DIRECT MILL DEALS & TRENDING
          ======================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-1.5 text-indigo font-bold text-xs uppercase tracking-wider mb-1">
              <Flame className="w-4 h-4 text-orange-500" />
              <span>Direct Mill Rate Deals</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-navy tracking-tight">
              Factory Direct Production Runs
            </h2>
          </div>
          <Link
            to="/catalog"
            className="text-xs font-bold text-indigo hover:text-indigo-dark flex items-center gap-1"
          >
            <span>View All Runs</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {trendingDeals.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* ========================================================
          7. BULK ORDER ENQUIRY & RFQ FORM
          ======================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-gradient-to-r from-navy via-navy-800 to-indigo-dark rounded-3xl p-8 sm:p-12 text-white shadow-premium">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 space-y-4">
              <span className="badge-mill text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                DIRECT MILL SALES DESK
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                Submit a Bulk Order Enquiry or Commercial RFQ
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Need customized dimensions, custom GSM weaving, hotel logo embroidery, or multi-container orders? Our Surat merchandisers will prepare a formal GST quotation within 4 business hours.
              </p>

              <div className="pt-2 text-xs text-slate-300 space-y-2">
                <p>• Mill Sales Hotline: <span className="text-champagne font-bold">+91 98765 43210</span></p>
                <p>• Official Procurement Desk: <span className="text-champagne font-bold">rfq@mahalaxmienterprises.com</span></p>
                <p>• Address: Textile Park Phase II, Ring Road, Surat, Gujarat</p>
              </div>
            </div>

            <div className="lg:col-span-7 bg-white text-navy rounded-2xl p-6 sm:p-8 shadow-card">
              {enquirySubmitted ? (
                <div className="text-center py-8 space-y-3">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-lg text-navy">Commercial Enquiry Received!</h3>
                  <p className="text-xs text-slate-600 max-w-sm mx-auto">
                    Thank you. Our senior mill merchandiser has logged your enquiry and will contact you via phone/email with our mill rate catalogue.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleEnquirySubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Your Full Name *</label>
                      <input
                        type="text"
                        required
                        value={enquiryForm.fullName}
                        onChange={e => setEnquiryForm({ ...enquiryForm, fullName: e.target.value })}
                        placeholder="e.g. Ramesh Chandra"
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:border-indigo focus:ring-1 focus:ring-indigo outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Company / Business Name *</label>
                      <input
                        type="text"
                        required
                        value={enquiryForm.businessName}
                        onChange={e => setEnquiryForm({ ...enquiryForm, businessName: e.target.value })}
                        placeholder="e.g. Chandra Handlooms & Textiles"
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:border-indigo focus:ring-1 focus:ring-indigo outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Contact Phone Number *</label>
                      <input
                        type="tel"
                        required
                        value={enquiryForm.phone}
                        onChange={e => setEnquiryForm({ ...enquiryForm, phone: e.target.value })}
                        placeholder="+91 98XXX XXXXX"
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:border-indigo focus:ring-1 focus:ring-indigo outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Business Email Address *</label>
                      <input
                        type="email"
                        required
                        value={enquiryForm.email}
                        onChange={e => setEnquiryForm({ ...enquiryForm, email: e.target.value })}
                        placeholder="procurement@company.com"
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:border-indigo focus:ring-1 focus:ring-indigo outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Business Type</label>
                      <select
                        value={enquiryForm.businessType}
                        onChange={e => setEnquiryForm({ ...enquiryForm, businessType: e.target.value as any })}
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:border-indigo outline-none bg-white"
                      >
                        <option value="Retailer">Retail Store / Showroom</option>
                        <option value="Hotel/Hospitality">Hotel / Resort / Guest House</option>
                        <option value="Reseller">Online Reseller / D2C Brand</option>
                        <option value="Institution">Hospital / Medical / School</option>
                        <option value="Exporter">Exporter / Buying House</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Expected Monthly Volume</label>
                      <select
                        value={enquiryForm.expectedMonthlyVolume}
                        onChange={e => setEnquiryForm({ ...enquiryForm, expectedMonthlyVolume: e.target.value })}
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:border-indigo outline-none bg-white"
                      >
                        <option value="₹50,000 - ₹1,00,000">₹50,000 - ₹1,00,000</option>
                        <option value="₹1,00,000 - ₹5,00,000">₹1,00,000 - ₹5,00,000</option>
                        <option value="₹5,00,000 - ₹20,00,000">₹5,00,000 - ₹20,00,000</option>
                        <option value="₹20,00,000+">₹20,00,000+ (Container Volume)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Requirement Details & SKUs</label>
                    <textarea
                      rows={2}
                      value={enquiryForm.notes}
                      onChange={e => setEnquiryForm({ ...enquiryForm, notes: e.target.value })}
                      placeholder="e.g. Need 200 units of King Size 300 TC Bedsheets in White, plus 300 units of 600 GSM Bath Towels with embroidered crest."
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:border-indigo focus:ring-1 focus:ring-indigo outline-none"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-indigo hover:bg-indigo-dark text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Send className="w-4 h-4" />
                    <span>Send Commercial RFQ to Mill Sales Desk</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          8. HELPFUL BUYING GUIDES & EDUCATIONAL CONTENT
          ======================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-1.5 text-indigo font-bold text-xs uppercase tracking-wider mb-1">
              <HelpCircle className="w-4 h-4" />
              <span>Commercial Knowledge Hub</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-navy tracking-tight">
              Textile & Linen Buying Guides
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-subtle hover:shadow-card transition">
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold uppercase">
              Bedsheet Technical Guide
            </span>
            <h3 className="font-bold text-base text-navy mt-2 mb-1">
              Understanding Thread Count: 200 TC vs 300 TC vs 400 TC
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Learn why yarn single-ply construction matters far more than inflated thread counts. What true 300 TC combed cotton offers for commercial laundering resistance.
            </p>
            <Link to="/catalog" className="text-xs font-bold text-indigo hover:underline">
              Read Technical Guide &rarr;
            </Link>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-subtle hover:shadow-card transition">
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold uppercase">
              Towel Density Standards
            </span>
            <h3 className="font-bold text-base text-navy mt-2 mb-1">
              Cotton Towel GSM Explained: 400 GSM vs 600 GSM
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Grams per Square Meter (GSM) determines towel plushness, water absorption speed, and laundry drying cycles for high-occupancy hotels and gyms.
            </p>
            <Link to="/category/cotton-products" className="text-xs font-bold text-indigo hover:underline">
              Read GSM Standards &rarr;
            </Link>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-subtle hover:shadow-card transition">
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold uppercase">
              Tax & Invoicing
            </span>
            <h3 className="font-bold text-base text-navy mt-2 mb-1">
              Maximizing GST Input Tax Credit (ITC) on Bulk Textile Purchases
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Step-by-step guidance on 5% vs 12% textile HSN codes, generating legal E-way bills, and seamlessly matching GSTR-2B credits on Mahalaxmi tax invoices.
            </p>
            <Link to="/wholesale" className="text-xs font-bold text-indigo hover:underline">
              View GST Guidelines &rarr;
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
