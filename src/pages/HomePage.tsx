import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { CATEGORIES_CONFIG } from '../data/mockProducts';
import { ProductCard } from '../components/common/ProductCard';
import { Badge } from '../components/common/Badge';
import type { AppBanner } from '../types';
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  Truck,
  Building2,
  Users,
  CheckCircle2,
  Send,
  Layers,
  Sparkles,
  HelpCircle,
  Calculator,
  Flame,
  Clock,
  ChevronLeft,
  ChevronRight,
  Percent,
  Check,
  Tag,
  CreditCard,
  Box,
  TrendingUp,
  PackageCheck,
  Package,
  Boxes
} from 'lucide-react';

const HOME_PRIMARY_CATEGORY_IDS = ['home-kitchen', 'household', 'textile', 'cotton-products'];

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { products, submitBusinessEnquiry, addToCart, categories, mobileAppConfig } = useApp();
  const availableCategories = categories.length > 0 ? categories : CATEGORIES_CONFIG;
  const homePrimaryCategories = HOME_PRIMARY_CATEGORY_IDS.flatMap(id => {
    const category = availableCategories.find(item => item.id === id);
    return category ? [category] : [];
  });

  // Hero Carousel State: Dynamic from Admin & CMS (Filtered for Website)
  const [websiteBanners, setWebsiteBanners] = useState<AppBanner[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/app-config?platform=website')
      .then(async res => {
        const data = await res.json();
        if (!res.ok || !data?.success || !Array.isArray(data?.data?.banners)) {
          throw new Error(data?.error || `Website banners could not be loaded (HTTP ${res.status}).`);
        }
        if (!cancelled) setWebsiteBanners(data.data.banners);
      })
      .catch(error => {
        console.warn('Website banner database sync failed; using configured banners:', error);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const activeBanners = (websiteBanners?.length ? websiteBanners : mobileAppConfig?.banners || []).filter(
    b => b.isActive && (b.visibility === 'WEB_ONLY' || b.visibility === 'ALL' || !b.visibility)
  );

  const normalizeImageUrl = (url?: string) => {
    if (!url) return '';
    const s = url.trim();
    if (s.startsWith('http://') || s.startsWith('https://')) return s;
    if (s.startsWith('/')) return s;
    return '/' + s;
  };

  const heroSlides = activeBanners.length > 0
    ? activeBanners.map(b => ({
        id: b.id,
        title: (b.title || '').trim(),
        subtitle: (b.subtitle || '').trim(),
        highlight: (b.tag || '').trim(),
        ctaText: (b.cta || '').trim(),
        ctaLink: b.ctaLink || (b.category ? `/category/${b.category.toLowerCase().replace(/[^a-z0-9]/g, '-')}` : '/catalog'),
        image: b.image || '/assets/images/banner_cotton.jpg',
        mobileImage: b.mobileImage || b.image || '',
        badge: (b.badge || '').trim(),
        tagline: (b.tagline || '').trim(),
        showTextOverlay: b.showTextOverlay !== false
      }))
    : [
        {
          id: 'def-1',
          title: "India's Premier Direct Mill Commerce",
          subtitle: "Ahmedabad Weaving Units • Tirupur Cotton • Zero Middleman Markup",
          highlight: "Save Up To 46% On Bulk",
          ctaText: "Explore Mill Catalog",
          ctaLink: "/catalog",
          image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?q=80&w=1200&auto=format&fit=crop",
          mobileImage: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?q=80&w=800&auto=format&fit=crop",
          badge: "AUTHENTIC MILL CONTRACT RATES",
          tagline: "300 TC Combed Cotton Bedsheets From ₹489",
          showTextOverlay: true
        }
      ];

  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto advance hero slider
  useEffect(() => {
    if (heroSlides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % heroSlides.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [heroSlides.length]);


  const [calcQuantity, setCalcQuantity] = useState<number>(100);
  const [calcItem, setCalcItem] = useState<'bedsheet' | 'towel' | 'microfiber'>('bedsheet');
  const [calculatorMode, setCalculatorMode] = useState<'savings' | 'reseller'>('savings');
  const [resellerSellingPrice, setResellerSellingPrice] = useState<number>(999);


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

  // Reseller calculations
  const resellerRevenue = calcQuantity * resellerSellingPrice;
  const resellerGrossProfit = resellerRevenue - totalBulkCost;
  const resellerRoi = Math.round((resellerGrossProfit / totalBulkCost) * 100);

  // Sample Kits & Bundles Handler
  const [sampleAddedId, setSampleAddedId] = useState<string | null>(null);

  const handleOrderSampleKit = (productId: string, autoRedirect: boolean = false) => {
    const item = products.find(p => p.id === productId);
    if (item) {
      addToCart(item, 1);
      setSampleAddedId(productId);
      setTimeout(() => setSampleAddedId(null), 2500);
      if (autoRedirect) {
        navigate('/cart');
      }
    } else {
      navigate('/catalog?q=sample');
    }
  };

  return (
    <div className="space-y-12 pb-16">
      {/* ========================================================
          1. HERO CAROUSEL: Amazon/Flipkart Full-Width Mega Banner
          ======================================================== */}
      <section className="relative w-full overflow-hidden text-white bg-navy-950">
        {(() => {
          const currentHero = heroSlides[currentSlide] || heroSlides[0];

          return (
            <div className="relative mx-auto aspect-[6/5] h-auto min-h-0 w-full overflow-hidden bg-slate-900 shadow-premium sm:mx-5 sm:aspect-[16/5] sm:max-w-[1600px] sm:rounded-3xl lg:mx-auto">
              <picture className="absolute inset-0 block h-full w-full">
                {currentHero.mobileImage && (
                  <source media="(max-width: 640px)" srcSet={normalizeImageUrl(currentHero.mobileImage)} />
                )}
                <img
                  src={normalizeImageUrl(currentHero.image)}
                  alt={`${currentHero.title || 'Mahalaxmi Enterprises'} banner`}
                  fetchPriority="high"
                  decoding="async"
                  className="h-full w-full object-cover object-center"
                />
              </picture>

              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-950/75 via-slate-950/20 to-transparent sm:h-40"
              />

              <div className="absolute inset-x-0 bottom-0 z-10 px-3 pb-16 sm:px-8 sm:pb-20 lg:px-12">
                <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
                  {currentHero.ctaText && (
                    <Link
                      to={currentHero.ctaLink}
                      className="group inline-flex min-h-10 items-center gap-2 rounded-full border border-white/30 bg-indigo-600 px-4 py-2 text-[11px] font-bold text-white shadow-lg shadow-black/20 transition hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:min-h-12 sm:px-6 sm:text-sm"
                    >
                      <span>{currentHero.ctaText}</span>
                      <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1" />
                    </Link>
                  )}
                  <Link
                    to="/wholesale"
                    className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/60 bg-slate-950/25 px-4 py-2 text-[11px] font-bold text-white shadow-lg shadow-black/15 backdrop-blur-sm transition hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:min-h-12 sm:px-6 sm:text-sm"
                  >
                    <Building2 className="h-4 w-4 shrink-0 text-champagne" />
                    <span>Request Mill RFQ</span>
                  </Link>
                </div>
              </div>

              {heroSlides.length > 1 && (
                <>
                  <div className="absolute right-3 top-3 z-20 flex items-center gap-1.5 rounded-full border border-white/20 bg-slate-950/30 px-2.5 py-2 backdrop-blur-sm sm:bottom-7 sm:left-1/2 sm:right-auto sm:top-auto sm:-translate-x-1/2 sm:gap-2 sm:px-3">
                    {heroSlides.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentSlide(idx)}
                        aria-label={`Go to slide ${idx + 1}`}
                        aria-current={currentSlide === idx ? 'true' : undefined}
                        className={`h-2 rounded-full transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                          currentSlide === idx ? 'w-6 bg-white sm:w-8' : 'w-2 bg-white/55 hover:bg-white/80'
                        }`}
                      />
                    ))}
                  </div>
                  <button
                    onClick={() => setCurrentSlide(prev => (prev - 1 + heroSlides.length) % heroSlides.length)}
                    aria-label="Previous hero banner slide"
                    className="absolute left-3 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-slate-950/35 text-white shadow-lg backdrop-blur-sm transition hover:bg-slate-950/65 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:flex"
                    title="Previous slide"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    onClick={() => setCurrentSlide(prev => (prev + 1) % heroSlides.length)}
                    aria-label="Next hero banner slide"
                    className="absolute right-3 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-slate-950/35 text-white shadow-lg backdrop-blur-sm transition hover:bg-slate-950/65 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:flex"
                    title="Next slide"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}
            </div>
          );
        })()}
      </section>

      {/* ========================================================
          COMMERCIAL PERKS & ASSURANCE STRIP (Full-Width Edge-to-Edge)
          ======================================================== */}
      <section className="w-full bg-white border-b border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.04)] !-mt-12 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 min-[360px]:grid-cols-2 lg:grid-cols-4 py-3 sm:py-4 gap-2.5 sm:gap-6 lg:gap-0 lg:divide-x lg:divide-slate-200">
            {/* Box 1: 5% Bank Discount */}
            <div className="flex min-w-0 items-start gap-2.5 rounded-xl bg-slate-50/70 p-2.5 sm:items-center lg:rounded-none lg:bg-transparent lg:px-6 lg:py-2">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-indigo-100 bg-indigo-50 text-indigo-600 shadow-sm sm:mt-0 sm:h-11 sm:w-11">
                <CreditCard className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="break-words text-[11px] font-bold leading-snug text-navy sm:text-sm">5% Instant Bank Discount</p>
                <p className="mt-0.5 break-words text-[10px] leading-snug text-slate-500 sm:text-xs">RuPay & Commercial Cards (MILLB2B)</p>
              </div>
            </div>

            {/* Box 2: Pan-India Delivery */}
            <div className="flex min-w-0 items-start gap-2.5 rounded-xl bg-slate-50/70 p-2.5 sm:items-center lg:rounded-none lg:bg-transparent lg:px-6 lg:py-2">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-600 shadow-sm sm:mt-0 sm:h-11 sm:w-11">
                <Truck className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="break-words text-[11px] font-bold leading-snug text-navy sm:text-sm">Fast Pan-India Delivery</p>
                <p className="mt-0.5 break-words text-[10px] leading-snug text-slate-500 sm:text-xs">19,000+ PIN Codes Covered</p>
              </div>
            </div>

            {/* Box 3: GST invoice details */}
            <div className="flex min-w-0 items-start gap-2.5 rounded-xl bg-slate-50/70 p-2.5 sm:items-center lg:rounded-none lg:bg-transparent lg:px-6 lg:py-2">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-amber-100 bg-amber-50 text-amber-600 shadow-sm sm:mt-0 sm:h-11 sm:w-11">
                <ShieldCheck className="w-5 h-5 text-amber-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="break-words text-[11px] font-bold leading-snug text-navy sm:text-sm">GST Tax Invoice</p>
                <p className="mt-0.5 break-words text-[10px] leading-snug text-slate-500 sm:text-xs">Verified GST Invoice with HSN</p>
              </div>
            </div>

            {/* Box 4: Zero Commission */}
            <div className="flex min-w-0 items-start gap-2.5 rounded-xl bg-slate-50/70 p-2.5 sm:items-center lg:rounded-none lg:bg-transparent lg:px-6 lg:py-2">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-purple-100 bg-purple-50 text-purple-600 shadow-sm sm:mt-0 sm:h-11 sm:w-11">
                <Zap className="w-5 h-5 text-purple-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="break-words text-[11px] font-bold leading-snug text-navy sm:text-sm">Zero Commission Rates</p>
                <p className="mt-0.5 break-words text-[10px] leading-snug text-slate-500 sm:text-xs">Pure factory rates without 25% app fee</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          3. WHY BUY DIRECT FROM MILL VS AMAZON / FLIPKART
             (Direct Factory Cost Advantage Comparison)
          ======================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-subtle space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <Badge variant="champagne" size="sm" className="font-bold">
              THE MAHALAXMI ENTERPRISES ADVANTAGE
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-black text-navy tracking-tight">
              Why Our Prices Beat Amazon, Flipkart & Traditional Traders
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Eliminating 5 layers of intermediaries so you receive pure factory weaving rates with verified GST invoices.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            {/* Traditional Supply Chain Box */}
            <div className="p-6 rounded-2xl bg-red-50/50 border border-red-200 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-red-200">
                <span className="font-bold text-sm text-red-900">Marketplace & Retail Traders</span>
                <span className="text-xs font-black text-red-700 bg-red-100 px-2.5 py-0.5 rounded-full">3x Markup</span>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-600">
                <li className="flex items-center gap-2">❌ Spinning Mill &rarr; Trader Markup (+20%)</li>
                <li className="flex items-center gap-2">❌ National Brand Licensing Margin (+30%)</li>
                <li className="flex items-center gap-2">❌ Regional Wholesaler & Distributor Storage (+15%)</li>
                <li className="flex items-center gap-2">❌ E-Commerce Marketplace Commission (18% - 25%)</li>
                <li className="flex items-center gap-2 font-bold text-red-900 pt-2 border-t border-red-200">
                  Total Buyer Cost: ₹1,899 for standard 300 TC bedsheet
                </li>
              </ul>
            </div>

            {/* Mahalaxmi Direct Mill Box */}
            <div className="p-6 rounded-2xl bg-emerald-50/70 border border-emerald-300 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-emerald-300">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-emerald-950">Mahalaxmi Enterprises Direct Mill Model</span>
                  <Badge variant="success" size="sm">Factory Rate</Badge>
                </div>
                <span className="text-xs font-black text-emerald-800 bg-emerald-200 px-2.5 py-0.5 rounded-full">Save 50%+</span>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-700">
                <li className="flex items-center gap-2 font-semibold text-emerald-900">
                  <Check className="w-4 h-4 text-emerald-600" />
                  Direct Air-Jet Weaving from Ahmedabad Textile Cluster
                </li>
                <li className="flex items-center gap-2 font-semibold text-emerald-900">
                  <Check className="w-4 h-4 text-emerald-600" />
                  Zero Middleman Commissions or Marketplace Fees
                </li>
                <li className="flex items-center gap-2 font-semibold text-emerald-900">
                  <Check className="w-4 h-4 text-emerald-600" />
                  GST Tax Invoice with business details
                </li>
                <li className="flex items-center gap-2 font-semibold text-emerald-900">
                  <Check className="w-4 h-4 text-emerald-600" />
                  Direct Pallet Freight Dispatch Across 19,000+ PIN Codes
                </li>
                <li className="flex items-center gap-2 font-black text-emerald-950 pt-2 border-t border-emerald-300">
                  Total Buyer Cost: ₹489 to ₹899 (Direct Factory Rate)
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          4. FOUR PRIMARY SHOPPING CATEGORIES
          ======================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo font-bold text-xs uppercase tracking-wider mb-1">
              <Layers className="w-4 h-4" />
              <span>Core Manufacturing Divisions</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-navy tracking-tight">
              Primary Sourcing Categories
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

        <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
          {homePrimaryCategories.map(cat => (
            <Link
              key={cat.id}
              to={`/category/${cat.id}`}
              aria-label={`Open ${cat.name} category`}
              className="group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-subtle transition-all duration-300 hover:shadow-premium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo focus-visible:ring-offset-2 sm:rounded-3xl"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 sm:aspect-[16/10]">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy/95 via-navy/25 to-transparent"></div>
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <h3 className="font-extrabold text-base leading-tight text-white drop-shadow-sm transition group-hover:text-champagne sm:text-lg">
                    {cat.name}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-[10px] leading-snug text-white/90 sm:text-[11px]">
                    {cat.tagline}
                  </p>
                </div>
              </div>

              <div className="flex flex-1 flex-col justify-between bg-white p-3 sm:p-4">
                <p className="hidden text-xs leading-relaxed text-slate-600 line-clamp-2 sm:block">
                  {cat.description}
                </p>

                <div className="mt-2 flex flex-wrap gap-1 border-t border-slate-100 pt-2 sm:mt-4 sm:pt-3">
                  {cat.subcategories.map((sub, i) => (
                    <span
                      key={i}
                      className={`rounded-lg bg-slate-100 px-2 py-0.5 text-[9px] font-semibold text-slate-700 transition group-hover:bg-indigo-light group-hover:text-indigo sm:px-2.5 sm:text-[10px] ${
                        i >= 2 ? 'hidden sm:inline-flex' : ''
                      }`}
                    >
                      {sub}
                    </span>
                  ))}
                  {cat.subcategories.length > 2 && (
                    <span className="rounded-lg bg-indigo-light px-2 py-0.5 text-[9px] font-bold text-indigo sm:hidden">
                      +{cat.subcategories.length - 2}
                    </span>
                  )}
                  <span className="ml-auto inline-flex items-center gap-1 self-center whitespace-nowrap text-[10px] font-bold text-indigo sm:text-xs">
                    Browse
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5 sm:h-3.5 sm:w-3.5" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ========================================================
          4.5 B2B SAMPLES & COMMERCIAL BUNDLES SUITE
              (Physical Swatches, 1-Pc Evaluation & Complete Bundles)
          ======================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-navy rounded-3xl p-6 sm:p-10 text-white shadow-premium relative overflow-hidden border border-indigo-800/40">
          {/* Subtle Background Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 space-y-8">
            {/* Header & Value Proposition */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-white/10 pb-6">
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-champagne/20 border border-champagne/30 text-champagne text-xs font-black tracking-wide uppercase">
                  <PackageCheck className="w-4 h-4 text-champagne" />
                  <span>B2B Quality Assurance • 100% Rebate Voucher</span>
                </div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
                  Evaluate Mill Quality Before Bulk Placement
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Experience our fabric weave density, GSM thickness, and commercial tactile finish risk-free. Order single piece unit samples from any product page or get our curated physical swatch testing kits.
                </p>
              </div>

              <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-4 py-2.5 rounded-2xl shrink-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div className="text-left">
                  <p className="text-xs font-black text-emerald-300">100% Refund Guarantee</p>
                  <p className="text-[11px] text-slate-300">Sample kit cost credited back on 1st bulk order</p>
                </div>
              </div>
            </div>

            {/* 3 Sample Offering Cards */}
            <div className="grid grid-cols-1 gap-3 sm:gap-6 md:grid-cols-3">
              {/* Card 1: Complete Commercial Sample Bundle */}
              <div className="bg-white/5 hover:bg-white/10 border-2 border-champagne/50 rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all group relative overflow-hidden backdrop-blur-sm">
                <div className="absolute top-3 right-3 bg-champagne text-navy text-[10px] font-black uppercase px-2 py-0.5 rounded shadow">
                  Most Popular
                </div>
                <div>
                  <div className="w-12 h-12 rounded-xl bg-champagne/20 text-champagne flex items-center justify-center mb-4">
                    <Boxes className="w-6 h-6" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-champagne transition">
                    Complete Commercial Sample Bundle
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-200 mt-1.5 leading-relaxed">
                    All-in-one testing box: 12 fabric swatches, 4 towel cuts, canvas tote sample, GSM specs & ₹300 coupon.
                  </p>

                  <div className="mt-4 pt-3 border-t border-white/10 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-champagne">₹299</span>
                    <span className="text-xs text-slate-400 line-through">₹999</span>
                    <span className="text-[11px] font-bold text-emerald-400 ml-auto">70% OFF</span>
                  </div>

                  <ul className="mt-3 space-y-1.5 text-[11px] sm:text-xs text-slate-200">
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      12 Bedsheet & Terry Towel Swatches
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      4 Microfiber & Canvas Mini Cutters
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      Includes 100% Refund Voucher Code
                    </li>
                  </ul>
                </div>

                <div className="mt-6 space-y-2">
                  <button
                    onClick={() => handleOrderSampleKit('prod-sample-bundle-all', false)}
                    className="w-full py-2.5 px-4 bg-champagne hover:bg-champagne-light text-navy font-black text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow"
                  >
                    <Package className="w-4 h-4" />
                    <span>{sampleAddedId === 'prod-sample-bundle-all' ? 'Added to Cart! ✓' : 'Add Bundle (₹299)'}</span>
                  </button>
                  <button
                    onClick={() => handleOrderSampleKit('prod-sample-bundle-all', true)}
                    className="w-full py-2 px-4 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1 border border-white/20"
                  >
                    <span>Buy Now &rarr;</span>
                  </button>
                </div>
              </div>

              {/* Card 2: Fabric Swatch Box */}
              <div className="bg-white/5 hover:bg-white/10 border border-white/30 rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all group backdrop-blur-sm">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center mb-4">
                    <PackageCheck className="w-6 h-6" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-champagne transition">
                    Fabric Swatch Kit (12 Pieces)
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-200 mt-1.5 leading-relaxed">
                    Physical touch & feel kit: 300-600 TC bedsheet fabrics and 400-650 GSM cotton terry swatches.
                  </p>

                  <div className="mt-4 pt-3 border-t border-white/10 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-champagne">₹199</span>
                    <span className="text-xs text-slate-400 line-through">₹499</span>
                    <span className="text-[11px] font-bold text-emerald-400 ml-auto">60% OFF</span>
                  </div>

                  <ul className="mt-3 space-y-1.5 text-[11px] sm:text-xs text-slate-200">
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      Yarn Count & GSM Specification Tagged
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      Color Fastness & Bleach Resistance Guide
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      Refundable on any subsequent bulk order
                    </li>
                  </ul>
                </div>

                <div className="mt-6 space-y-2">
                  <button
                    onClick={() => handleOrderSampleKit('prod-swatch-box-01', false)}
                    className="w-full py-2.5 px-4 bg-indigo hover:bg-indigo-dark text-white font-black text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow"
                  >
                    <Package className="w-4 h-4" />
                    <span>{sampleAddedId === 'prod-swatch-box-01' ? 'Added to Cart! ✓' : 'Add Swatch Kit (₹199)'}</span>
                  </button>
                  <button
                    onClick={() => handleOrderSampleKit('prod-swatch-box-01', true)}
                    className="w-full py-2 px-4 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1 border border-white/20"
                  >
                    <span>Buy Now &rarr;</span>
                  </button>
                </div>
              </div>

              {/* Card 3: 1-Piece Individual Product Sample */}
              <div className="bg-white/5 hover:bg-white/10 border border-white/30 rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all group backdrop-blur-sm">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center mb-4">
                    <Tag className="w-6 h-6" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-champagne transition">
                    1-Pc Product Unit Sample
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-200 mt-1.5 leading-relaxed">
                    Need a finished bedsheet, bath towel, or microfiber roll? Order just 1 piece without wholesale MOQ!
                  </p>

                  <div className="mt-4 pt-3 border-t border-white/10 flex items-baseline gap-2">
                    <span className="text-base font-black text-amber-400">Standard Retail Rate</span>
                    <span className="text-[11px] font-bold text-emerald-400 ml-auto">MOQ Bypassed</span>
                  </div>

                  <ul className="mt-3 space-y-1.5 text-[11px] sm:text-xs text-slate-200">
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      Available on every product page
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      Test washing, stitching & shrinkage
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      Immediate air-courier dispatch
                    </li>
                  </ul>
                </div>

                <div className="mt-6 space-y-2">
                  <Link
                    to="/catalog"
                    className="w-full py-2.5 px-4 bg-white/15 hover:bg-white/25 text-white font-black text-xs rounded-xl transition flex items-center justify-center gap-1.5 border border-white/20"
                  >
                    <span>Browse Products to Sample</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    to="/catalog?q=sample"
                    className="w-full py-2 px-4 text-center text-champagne hover:underline font-bold text-xs block"
                  >
                    View All Sample Bundles &rarr;
                  </Link>
                </div>
              </div>
            </div>

            {/* Bottom Guarantee Banner */}
            <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-champagne" />
                <span>Dispatched within 24 Hours via Air Express Courier</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Verified Mill Quality Test Certificate Enclosed in Box</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Use coupon code <strong>SAMPLE100</strong> on your bulk order</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          5. ADMIN-SELECTED HOMEPAGE PRODUCTS
          ======================================================== */}
      {bestSellers.length > 0 && (
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-1.5 text-amber-600 font-bold text-xs uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Selected by Our Team</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-navy tracking-tight">
              Featured Products
            </h2>
          </div>
          <Link
            to="/catalog?filter=featured"
            className="text-xs font-bold text-indigo hover:text-indigo-dark flex items-center gap-1"
          >
            <span>View All Featured Products</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
          {bestSellers.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
      )}

      {/* ========================================================
          6. WHOLESALE DEALS & INTERACTIVE LIVE SAVINGS CALCULATOR
          ======================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-gradient-to-br from-navy to-navy-900 rounded-3xl p-4 sm:p-10 text-white shadow-premium relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center">
            <div className="lg:col-span-6 space-y-4">
              <Badge variant="champagne" size="sm" className="font-bold">
                VOLUME DISCOUNTS ENGINE
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                Wholesale Deals & Direct Mill Bulk Purchasing
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Unlock direct mill pricing tiers when purchasing 10, 50, or 200+ units. Automatic discount application at checkout with GST tax invoices for eligible commercial orders.
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

              <div className="pt-4 grid grid-cols-1 gap-2 sm:flex sm:gap-3">
                <Link
                  to="/wholesale"
                  className="flex min-h-11 items-center justify-center rounded-xl bg-indigo px-4 py-2.5 text-center text-xs font-bold text-white shadow-sm transition hover:bg-indigo-dark sm:px-5"
                >
                  Open Bulk Order Pad
                </Link>
                <Link
                  to="/wholesale"
                  className="flex min-h-11 items-center justify-center rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-center text-xs font-bold text-white transition hover:bg-white/20 sm:px-5"
                >
                  Request Custom RFQ
                </Link>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="min-w-0 bg-white text-navy rounded-2xl p-4 sm:p-6 shadow-card border border-slate-200">
                {/* Mode Selector: Wholesale Savings vs Reseller Profit */}
                <div className="flex flex-col gap-2 border-b border-slate-100 pb-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 w-full bg-slate-100 p-1 rounded-xl text-[10px] font-bold sm:w-auto sm:text-xs">
                    <button
                      type="button"
                      onClick={() => setCalculatorMode('savings')}
                      className={`min-w-0 flex-1 px-2 py-2 rounded-lg transition sm:flex-none sm:px-3 sm:py-1.5 ${
                        calculatorMode === 'savings'
                          ? 'bg-navy text-white shadow-sm'
                          : 'text-slate-600 hover:text-navy'
                      }`}
                    >
                      <span className="sm:hidden">Bulk Savings</span>
                      <span className="hidden sm:inline">Bulk Buyer Savings</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCalculatorMode('reseller')}
                      className={`min-w-0 flex-1 px-2 py-2 rounded-lg transition flex items-center justify-center gap-1 sm:flex-none sm:px-3 sm:py-1.5 ${
                        calculatorMode === 'reseller'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-slate-600 hover:text-navy'
                      }`}
                    >
                      <TrendingUp className="hidden h-3.5 w-3.5 shrink-0 sm:block" />
                      <span className="sm:hidden">Reseller Profit</span>
                      <span className="hidden sm:inline">Reseller / Store Profit</span>
                    </button>
                  </div>
                  <span className="self-start text-[10px] bg-indigo-light text-indigo px-2 py-0.5 rounded font-bold sm:self-auto sm:text-[11px]">
                    Live Rates
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  <label className="text-xs font-bold text-slate-600 block">Select Product Line:</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => {
                        setCalcItem('bedsheet');
                        setResellerSellingPrice(999);
                      }}
                      className={`min-w-0 p-2 rounded-xl text-[10px] leading-tight font-semibold border transition text-center sm:text-xs ${
                        calcItem === 'bedsheet'
                          ? 'border-indigo bg-indigo-light text-indigo font-bold'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <span className="sm:hidden">Bedsheet<br />300 TC</span>
                      <span className="hidden sm:inline">300 TC Bedsheet</span>
                    </button>
                    <button
                      onClick={() => {
                        setCalcItem('towel');
                        setResellerSellingPrice(499);
                      }}
                      className={`min-w-0 p-2 rounded-xl text-[10px] leading-tight font-semibold border transition text-center sm:text-xs ${
                        calcItem === 'towel'
                          ? 'border-indigo bg-indigo-light text-indigo font-bold'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <span className="sm:hidden">Towel<br />600 GSM</span>
                      <span className="hidden sm:inline">600 GSM Towel</span>
                    </button>
                    <button
                      onClick={() => {
                        setCalcItem('microfiber');
                        setResellerSellingPrice(699);
                      }}
                      className={`min-w-0 p-2 rounded-xl text-[10px] leading-tight font-semibold border transition text-center sm:text-xs ${
                        calcItem === 'microfiber'
                          ? 'border-indigo bg-indigo-light text-indigo font-bold'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <span className="sm:hidden">Microfiber<br />24 pcs</span>
                      <span className="hidden sm:inline">Microfiber (24-Pk)</span>
                    </button>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-700">Order Quantity:</span>
                    <span className="font-black text-indigo text-sm">{calcQuantity} Units</span>
                  </div>
                  <input
                    id="calc-order-quantity"
                    name="orderQuantity"
                    aria-label="Order Quantity in Units"
                    type="range"
                    min="10"
                    max="500"
                    step="10"
                    value={calcQuantity}
                    onChange={e => setCalcQuantity(Number(e.target.value))}
                    className="w-full accent-indigo cursor-pointer"
                  />
                  <div className="flex justify-between gap-2 text-[9px] text-slate-500 sm:text-[10px]">
                    <span>10 Units · Retailer</span>
                    <span className="hidden sm:inline">100 Units · Hotelier</span>
                    <span>500 Units · Distributor</span>
                  </div>
                </div>

                {calculatorMode === 'reseller' && (
                  <div className="mt-3 p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-emerald-950">Your Selling Price to Customers:</span>
                      <span className="font-black text-emerald-800 text-sm">₹{resellerSellingPrice} / pc</span>
                    </div>
                    <input
                      id="calc-reseller-price"
                      name="resellerPrice"
                      aria-label="Your Customer Selling Price"
                      type="range"
                      min={calcData.bulkRate + 50}
                      max={calcData.mrp}
                      step="25"
                      value={resellerSellingPrice}
                      onChange={e => setResellerSellingPrice(Number(e.target.value))}
                      className="w-full accent-emerald-600 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-emerald-700">
                      <span>Direct Mill Cost: ₹{calcData.bulkRate}</span>
                      <span>MRP Ceiling: ₹{calcData.mrp}</span>
                    </div>
                  </div>
                )}

                {/* Calculation Output Card */}
                {calculatorMode === 'savings' ? (
                  <div className="mt-4 bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2 text-xs">
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
                ) : (
                  <div className="mt-4 bg-emerald-50 rounded-xl p-4 border border-emerald-300 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-700">
                      <span>Your Total Sourcing Cost (Mill):</span>
                      <span className="font-bold text-navy">₹{totalBulkCost.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span>Total Revenue from Customers:</span>
                      <span className="font-bold text-navy">₹{resellerRevenue.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="pt-2 border-t border-emerald-300 flex justify-between items-center text-emerald-950 font-black text-sm">
                      <span>Your Net Reseller Profit:</span>
                      <span className="bg-emerald-600 text-white px-2.5 py-1 rounded-lg text-base font-black">
                        ₹{resellerGrossProfit.toLocaleString('en-IN')} ({resellerRoi}% ROI)
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6" aria-labelledby="customer-reviews-heading">
        <div className="bg-slate-100/80 rounded-3xl p-6 sm:p-10 border border-slate-200 text-center">
          <h3 id="customer-reviews-heading" className="text-xl sm:text-2xl font-black text-navy">
            Customer reviews
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            Verified customer feedback will be published here after it has been collected and approved.
          </p>
        </div>
      </section>

      {/* ========================================================
          9. BULK ORDER ENQUIRY & RFQ FORM
          ======================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-gradient-to-r from-navy via-navy-800 to-indigo-dark rounded-3xl p-8 sm:p-12 text-white shadow-premium">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 space-y-4">
              <span className="badge-mill text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                MAHALAXMI ENTERPRISES · DIRECT MILL SALES
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                Submit a Bulk Order Enquiry or Commercial RFQ
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Need customized dimensions, custom GSM weaving, hotel logo embroidery, or multi-container orders? Our Ahmedabad merchandisers will prepare a formal GST quotation within 4 business hours.
              </p>

              <div className="pt-2 text-xs text-slate-300 space-y-2">
                <p>• Mahalaxmi Enterprises Sales: <a href="tel:+919033598639" className="text-champagne font-bold hover:underline">+91 90335 98639</a></p>
                <p className="break-words">• Official Email: <a href="mailto:mahalaxmienterprise881@gmail.com" className="text-champagne font-bold hover:underline">mahalaxmienterprise881@gmail.com</a></p>
                <p>• Address: Narol Textile Cluster, Ahmedabad, Gujarat 382405</p>
              </div>
            </div>

            <div className="lg:col-span-7 bg-white text-navy rounded-3xl p-6 sm:p-8 shadow-card">
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
                      <label htmlFor="rfq-fullname" className="text-[11px] font-bold text-slate-700 block mb-1">Your Full Name *</label>
                      <input
                        id="rfq-fullname"
                        name="fullName"
                        type="text"
                        required
                        value={enquiryForm.fullName}
                        onChange={e => setEnquiryForm({ ...enquiryForm, fullName: e.target.value })}
                        placeholder="e.g. Ramesh Chandra"
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:border-indigo focus:ring-1 focus:ring-indigo outline-none"
                      />
                    </div>
                    <div>
                      <label htmlFor="rfq-businessname" className="text-[11px] font-bold text-slate-700 block mb-1">Company / Business Name *</label>
                      <input
                        id="rfq-businessname"
                        name="businessName"
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
                      <label htmlFor="rfq-phone" className="text-[11px] font-bold text-slate-700 block mb-1">Contact Phone Number *</label>
                      <input
                        id="rfq-phone"
                        name="phone"
                        type="tel"
                        required
                        value={enquiryForm.phone}
                        onChange={e => setEnquiryForm({ ...enquiryForm, phone: e.target.value })}
                        placeholder="+91 98XXX XXXXX"
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:border-indigo focus:ring-1 focus:ring-indigo outline-none"
                      />
                    </div>
                    <div>
                      <label htmlFor="rfq-email" className="text-[11px] font-bold text-slate-700 block mb-1">Business Email Address *</label>
                      <input
                        id="rfq-email"
                        name="email"
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
                      <label htmlFor="rfq-businesstype" className="text-[11px] font-bold text-slate-700 block mb-1">Business Type</label>
                      <select
                        id="rfq-businesstype"
                        name="businessType"
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
                      <label htmlFor="rfq-volume" className="text-[11px] font-bold text-slate-700 block mb-1">Expected Monthly Volume</label>
                      <select
                        id="rfq-volume"
                        name="volume"
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
                    <label htmlFor="rfq-notes" className="text-[11px] font-bold text-slate-700 block mb-1">Requirement Details & SKUs</label>
                    <textarea
                      id="rfq-notes"
                      name="notes"
                      rows={2}
                      value={enquiryForm.notes}
                      onChange={e => setEnquiryForm({ ...enquiryForm, notes: e.target.value })}
                      placeholder="e.g. Need 200 units of King Size 300 TC Bedsheets in White, plus 300 units of 600 GSM Bath Towels with embroidered crest."
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:border-indigo focus:ring-1 focus:ring-indigo outline-none"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    aria-label="Send Commercial RFQ to Mill Sales Desk"
                    className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo px-4 py-3 text-center text-xs font-bold leading-snug text-white shadow-sm transition hover:bg-indigo-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo focus-visible:ring-offset-2 sm:py-3.5"
                  >
                    <Send className="h-4 w-4 shrink-0" />
                    <span className="sm:hidden">Send Commercial RFQ</span>
                    <span className="hidden sm:inline">Send Commercial RFQ to Mill Sales Desk</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
