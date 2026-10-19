import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  Calculator,
  Flame,
  Clock,
  ChevronLeft,
  ChevronRight,
  Percent,
  Check,
  Tag,
  Star,
  CreditCard,
  Box,
  TrendingUp,
  Quote,
  PackageCheck,
  Package,
  Boxes
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { products, submitBusinessEnquiry, addToCart, categories, mobileAppConfig } = useApp();

  // Hero Carousel State: Dynamic from Admin & CMS
  const activeBanners = (mobileAppConfig?.banners || []).filter(b => b.isActive);

  const heroSlides = activeBanners.length > 0
    ? activeBanners.map(b => ({
        id: b.id,
        title: b.title,
        subtitle: b.subtitle,
        highlight: b.tag || 'DIRECT MILL LOTS',
        ctaText: b.cta || 'Shop Wholesale',
        ctaLink: b.ctaLink || (b.category ? `/category/${b.category.toLowerCase().replace(/[^a-z0-9]/g, '-')}` : '/catalog'),
        image: b.image || 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?q=80&w=1200&auto=format&fit=crop',
        mobileImage: b.mobileImage || b.image,
        badge: b.badge || b.tag || 'AUTHENTIC MILL CONTRACT RATES',
        tagline: b.tagline || 'Direct Factory Sourcing From Surat'
      }))
    : [
        {
          id: 'def-1',
          title: "India's Premier Direct Mill Commerce",
          subtitle: "Surat Weaving Units • Tirupur Cotton • Zero Middleman Markup",
          highlight: "Save Up To 46% On Bulk",
          ctaText: "Explore Mill Catalog",
          ctaLink: "/catalog",
          image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?q=80&w=1200&auto=format&fit=crop",
          mobileImage: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?q=80&w=800&auto=format&fit=crop",
          badge: "AUTHENTIC MILL CONTRACT RATES",
          tagline: "300 TC Combed Cotton Bedsheets From ₹489"
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

  // Flash Sale Countdown Timer State
  const [timeLeft, setTimeLeft] = useState({ hours: 4, minutes: 42, seconds: 18 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 6, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Selected persona tab for "Shop by Business Need"
  const [selectedBusinessNeed, setSelectedBusinessNeed] = useState<
    'hotels' | 'retailers' | 'resellers' | 'institutions' | 'home'
  >('hotels');

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

  // Customer Reviews Carousel State
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [isReviewHovered, setIsReviewHovered] = useState(false);
  const [isMobileScreen, setIsMobileScreen] = useState(false);
  const [reviewTouchStart, setReviewTouchStart] = useState<number | null>(null);
  const [reviewTouchEnd, setReviewTouchEnd] = useState<number | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobileScreen(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const customerReviews = [
    {
      id: 1,
      name: "Vikramaditya Oberoi",
      role: "Procurement Head",
      company: "Royal Grand Hotels, New Delhi & Udaipur",
      tag: "Hospitality Bulk Buyer",
      rating: 5,
      verified: true,
      text: "We procured 450 double bedsheets and 800 bath towels for our resort chain in Udaipur. Direct mill rates saved us ₹1,40,000 compared to local traders, and GST billing was seamless.",
      savings: "Saved ₹1,40,000",
      avatarColor: "bg-blue-600",
      initials: "VO"
    },
    {
      id: 2,
      name: "Anand Patel",
      role: "Owner",
      company: "Patel Handlooms, Relief Road, Ahmedabad",
      tag: "Verified Retail Stockist",
      rating: 5,
      verified: true,
      text: "As a retail shop owner in Ahmedabad, Mahalaxmi's display boxes and low MOQ of 10 units allow me to stock fresh designs weekly with 40% profit margins. Fast 48-hour delivery.",
      savings: "40% Retail Margin",
      avatarColor: "bg-emerald-600",
      initials: "AP"
    },
    {
      id: 3,
      name: "Pooja Deshmukh",
      role: "Direct Family Buyer",
      company: "Worli, Mumbai",
      tag: "Verified Home Customer",
      rating: 5,
      verified: true,
      text: "Ordered 3 sets of 300 TC bedsheets for our family home. The fabric feel is unbelievable—so smooth and heavy. Far superior quality than what we usually find on generic apps.",
      savings: "Pure Combed Cotton",
      avatarColor: "bg-purple-600",
      initials: "PD"
    },
    {
      id: 4,
      name: "Rajesh Agarwal",
      role: "Managing Partner",
      company: "TexGlobal Exports, Surat & Dubai",
      tag: "Global Export Partner",
      rating: 5,
      verified: true,
      text: "We export container-load institutional textiles to the Middle East. Mahalaxmi's batch consistency in yarn count, tensile strength, and packing accuracy is world-class.",
      savings: "Export FCL Grade",
      avatarColor: "bg-amber-600",
      initials: "RA"
    },
    {
      id: 5,
      name: "Sunita Sharma",
      role: "Procurement In-charge",
      company: "Blossom Healthcare & Hospitals, Pune",
      tag: "Institutional Healthcare",
      rating: 5,
      verified: true,
      text: "Our hospital linen has to withstand 70°C high-temperature sterilization and bleach washing every week. Their chlorine-safe combed cotton towels retain thickness even after 50+ washes.",
      savings: "50+ Washes Durability",
      avatarColor: "bg-teal-600",
      initials: "SS"
    }
  ];

  const maxReviewIndex = isMobileScreen ? customerReviews.length - 1 : Math.max(0, customerReviews.length - 3);

  const handlePrevReview = () => {
    setCurrentReviewIndex(prev => (prev <= 0 ? maxReviewIndex : prev - 1));
  };

  const handleNextReview = () => {
    setCurrentReviewIndex(prev => (prev >= maxReviewIndex ? 0 : prev + 1));
  };

  // Auto slide reviews every 5 seconds (pauses when user hovers or interacts)
  useEffect(() => {
    if (isReviewHovered) return;
    const interval = setInterval(() => {
      setCurrentReviewIndex(prev => (prev >= maxReviewIndex ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(interval);
  }, [isReviewHovered, maxReviewIndex]);

  const handleReviewTouchStart = (e: React.TouchEvent) => {
    setReviewTouchEnd(null);
    setReviewTouchStart(e.targetTouches[0].clientX);
  };

  const handleReviewTouchMove = (e: React.TouchEvent) => {
    setReviewTouchEnd(e.targetTouches[0].clientX);
  };

  const handleReviewTouchEnd = () => {
    if (!reviewTouchStart || !reviewTouchEnd) return;
    const distance = reviewTouchStart - reviewTouchEnd;
    if (distance > 50) {
      handleNextReview();
    } else if (distance < -50) {
      handlePrevReview();
    }
  };

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
          1. HERO CAROUSEL: Amazon/Flipkart Premium Mega Banner
          ======================================================== */}
      <section className="relative bg-navy overflow-hidden text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="relative rounded-3xl overflow-hidden shadow-premium bg-navy-900 border border-slate-700 min-h-[440px] sm:min-h-[480px] flex items-center">
            {/* Background Image with smooth transitions and responsive mobile art direction */}
            <div className="absolute inset-0">
              <picture className="w-full h-full block">
                {heroSlides[currentSlide].mobileImage && (
                  <source media="(max-width: 640px)" srcSet={heroSlides[currentSlide].mobileImage} />
                )}
                <img
                  src={heroSlides[currentSlide].image.replace('w=1200', 'w=1000')}
                  alt={heroSlides[currentSlide].title}
                  fetchPriority="high"
                  decoding="async"
                  className="w-full h-full object-cover opacity-35 transition-opacity duration-1000 scale-105"
                />
              </picture>
              <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/90 to-transparent"></div>
            </div>

            {/* Content Container */}
            <div className="relative z-10 p-6 sm:p-12 max-w-2xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-champagne/20 border border-champagne/30 text-champagne text-xs font-black tracking-wide uppercase">
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>{heroSlides[currentSlide].badge}</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight">
                {heroSlides[currentSlide].title}
              </h1>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-medium">
                {heroSlides[currentSlide].subtitle}
              </p>

              <div className="pt-2 flex items-baseline gap-3">
                <span className="text-xs text-slate-300 uppercase tracking-wider font-bold">Featured Pricing:</span>
                <span className="text-xl sm:text-2xl font-black text-champagne">
                  {heroSlides[currentSlide].tagline}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex flex-wrap gap-4">
                <Link
                  to={heroSlides[currentSlide].ctaLink}
                  className="px-6 py-3.5 bg-indigo hover:bg-indigo-dark text-white rounded-2xl font-black text-xs sm:text-sm transition shadow-premium flex items-center gap-2 group"
                >
                  <span>{heroSlides[currentSlide].ctaText}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  to="/wholesale"
                  className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-2xl font-bold text-xs sm:text-sm transition flex items-center gap-2"
                >
                  <Building2 className="w-4 h-4 text-champagne" />
                  <span>Request Mill RFQ</span>
                </Link>
              </div>
            </div>

            {/* Carousel Navigation Arrows */}
            <button
              onClick={() => setCurrentSlide(prev => (prev - 1 + heroSlides.length) % heroSlides.length)}
              aria-label="Previous hero banner slide"
              className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-navy/80 hover:bg-navy text-white items-center justify-center border border-white/20 transition z-20"
              title="Previous slide"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              onClick={() => setCurrentSlide(prev => (prev + 1) % heroSlides.length)}
              aria-label="Next hero banner slide"
              className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-navy/80 hover:bg-navy text-white items-center justify-center border border-white/20 transition z-20"
              title="Next slide"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Dots Indicator */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
              {heroSlides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  aria-label={`Go to slide ${idx + 1}: ${heroSlides[idx].title}`}
                  className={`h-2 rounded-full transition-all ${
                    currentSlide === idx ? 'w-8 bg-champagne' : 'w-2 bg-white/40'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Commercial Perks & Bank Offers Strip (Amazon / Flipkart Pro style) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 -mt-6 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-subtle">
          <div className="flex items-center gap-3 p-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo shrink-0">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-navy">5% Instant Bank Discount</p>
              <p className="text-[11px] text-slate-500">RuPay & Commercial Cards (MILLB2B)</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-navy">Fast Pan-India Delivery</p>
              <p className="text-[11px] text-slate-500">19,000+ PIN Codes Covered</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-2">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-navy shrink-0">
              <ShieldCheck className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-navy">100% GSTR-2B ITC Claim</p>
              <p className="text-[11px] text-slate-500">Verified GST Invoice with HSN</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-navy">Zero Commission Rates</p>
              <p className="text-[11px] text-slate-500">Pure factory prices without 25% app fee</p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          2. FLASH SALE / DEAL OF THE DAY (With Live Countdown)
          ======================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 rounded-3xl p-5 sm:p-6 text-white shadow-premium flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white shrink-0">
              <Flame className="w-7 h-7 fill-white animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-black tracking-widest uppercase bg-white/20 px-2 py-0.5 rounded">
                DEAL OF THE DAY • DIRECT WEAVING LOTS
              </span>
              <h3 className="text-lg sm:text-xl font-black mt-0.5">
                Flash Mill Clearance: Up to 52% Off Combed Cotton Stock
              </h3>
            </div>
          </div>

          {/* Countdown Clock */}
          <div className="flex items-center gap-2 bg-black/30 px-4 py-2 rounded-2xl border border-white/20">
            <Clock className="w-4 h-4 text-champagne" />
            <span className="text-xs font-bold text-slate-200">Ends In:</span>
            <div className="flex items-center gap-1 font-mono font-black text-sm">
              <span className="bg-black/50 px-2 py-1 rounded">{String(timeLeft.hours).padStart(2, '0')}h</span>
              <span>:</span>
              <span className="bg-black/50 px-2 py-1 rounded">{String(timeLeft.minutes).padStart(2, '0')}m</span>
              <span>:</span>
              <span className="bg-black/50 px-2 py-1 rounded">{String(timeLeft.seconds).padStart(2, '0')}s</span>
            </div>
          </div>

          <Link
            to="/catalog?filter=bestseller"
            className="px-5 py-2.5 bg-white text-navy hover:bg-slate-100 rounded-xl font-bold text-xs transition shadow-sm whitespace-nowrap"
          >
            Shop Flash Deals &rarr;
          </Link>
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
              THE MAHALAXMI MILL ADVANTAGE
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
                  <span className="font-bold text-sm text-emerald-950">Mahalaxmi Direct Mill Model</span>
                  <Badge variant="success" size="sm">Factory Rate</Badge>
                </div>
                <span className="text-xs font-black text-emerald-800 bg-emerald-200 px-2.5 py-0.5 rounded-full">Save 50%+</span>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-700">
                <li className="flex items-center gap-2 font-semibold text-emerald-900">
                  <Check className="w-4 h-4 text-emerald-600" />
                  Direct Air-Jet Weaving from Surat Textile Park
                </li>
                <li className="flex items-center gap-2 font-semibold text-emerald-900">
                  <Check className="w-4 h-4 text-emerald-600" />
                  Zero Middleman Commissions or Marketplace Fees
                </li>
                <li className="flex items-center gap-2 font-semibold text-emerald-900">
                  <Check className="w-4 h-4 text-emerald-600" />
                  100% Legal GST Tax Invoice for Business ITC Claims
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {(categories && categories.length > 0 ? categories : CATEGORIES_CONFIG).map(cat => (
            <Link
              key={cat.id}
              to={`/category/${cat.id}`}
              className="group relative bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-subtle hover:shadow-premium transition-all duration-300 flex flex-col justify-between"
            >
              <div className="aspect-[16/10] overflow-hidden bg-slate-100 relative">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy/85 via-transparent to-transparent"></div>
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

                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-1">
                  {cat.subcategories.map((sub, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-lg text-[10px] font-semibold group-hover:bg-indigo-light group-hover:text-indigo transition"
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1: Complete Commercial Sample Bundle */}
              <div className="bg-white/5 hover:bg-white/10 border-2 border-champagne/40 rounded-2xl p-5 flex flex-col justify-between transition-all group relative overflow-hidden backdrop-blur-sm">
                <div className="absolute top-3 right-3 bg-champagne text-navy text-[10px] font-black uppercase px-2 py-0.5 rounded shadow">
                  Most Popular
                </div>
                <div>
                  <div className="w-12 h-12 rounded-xl bg-champagne/20 text-champagne flex items-center justify-center mb-4">
                    <Boxes className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white group-hover:text-champagne transition">
                    Complete Commercial Sample Bundle
                  </h3>
                  <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                    All-in-one testing box: 12 fabric swatches, 4 towel cuts, canvas tote sample, GSM specs & ₹300 coupon.
                  </p>

                  <div className="mt-4 pt-3 border-t border-white/10 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-champagne">₹299</span>
                    <span className="text-xs text-slate-400 line-through">₹999</span>
                    <span className="text-[11px] font-bold text-emerald-400 ml-auto">70% OFF</span>
                  </div>

                  <ul className="mt-3 space-y-1.5 text-[11px] text-slate-300">
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
              <div className="bg-white/5 hover:bg-white/10 border border-white/20 rounded-2xl p-5 flex flex-col justify-between transition-all group backdrop-blur-sm">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center mb-4">
                    <PackageCheck className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white group-hover:text-champagne transition">
                    Fabric Swatch Kit (12 Pieces)
                  </h3>
                  <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                    Physical touch & feel kit: 300-600 TC bedsheet fabrics and 400-650 GSM cotton terry swatches.
                  </p>

                  <div className="mt-4 pt-3 border-t border-white/10 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-champagne">₹199</span>
                    <span className="text-xs text-slate-400 line-through">₹499</span>
                    <span className="text-[11px] font-bold text-emerald-400 ml-auto">60% OFF</span>
                  </div>

                  <ul className="mt-3 space-y-1.5 text-[11px] text-slate-300">
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
              <div className="bg-white/5 hover:bg-white/10 border border-white/20 rounded-2xl p-5 flex flex-col justify-between transition-all group backdrop-blur-sm">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center mb-4">
                    <Tag className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white group-hover:text-champagne transition">
                    1-Pc Product Unit Sample
                  </h3>
                  <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                    Need a finished bedsheet, bath towel, or microfiber roll? Order just 1 piece without wholesale MOQ!
                  </p>

                  <div className="mt-4 pt-3 border-t border-white/10 flex items-baseline gap-2">
                    <span className="text-base font-black text-amber-400">Standard Retail Rate</span>
                    <span className="text-[11px] font-bold text-emerald-400 ml-auto">MOQ Bypassed</span>
                  </div>

                  <ul className="mt-3 space-y-1.5 text-[11px] text-slate-300">
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
          5. BEST SELLERS: High Demand Commercial Lines
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
          6. WHOLESALE DEALS & INTERACTIVE LIVE SAVINGS CALCULATOR
          ======================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-gradient-to-br from-navy to-navy-900 rounded-3xl p-6 sm:p-10 text-white shadow-premium relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
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

            <div className="lg:col-span-6">
              <div className="bg-white text-navy rounded-2xl p-6 shadow-card border border-slate-200">
                {/* Mode Selector: Wholesale Savings vs Reseller Profit */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setCalculatorMode('savings')}
                      className={`px-3 py-1.5 rounded-lg transition ${
                        calculatorMode === 'savings'
                          ? 'bg-navy text-white shadow-sm'
                          : 'text-slate-600 hover:text-navy'
                      }`}
                    >
                      Bulk Buyer Savings
                    </button>
                    <button
                      type="button"
                      onClick={() => setCalculatorMode('reseller')}
                      className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${
                        calculatorMode === 'reseller'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-slate-600 hover:text-navy'
                      }`}
                    >
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>Reseller / Store Profit</span>
                    </button>
                  </div>
                  <span className="text-[11px] bg-indigo-light text-indigo px-2 py-0.5 rounded font-bold">
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
                      className={`p-2 rounded-xl text-xs font-semibold border transition text-center ${
                        calcItem === 'bedsheet'
                          ? 'border-indigo bg-indigo-light text-indigo font-bold'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      300 TC Bedsheet
                    </button>
                    <button
                      onClick={() => {
                        setCalcItem('towel');
                        setResellerSellingPrice(499);
                      }}
                      className={`p-2 rounded-xl text-xs font-semibold border transition text-center ${
                        calcItem === 'towel'
                          ? 'border-indigo bg-indigo-light text-indigo font-bold'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      600 GSM Towel
                    </button>
                    <button
                      onClick={() => {
                        setCalcItem('microfiber');
                        setResellerSellingPrice(699);
                      }}
                      className={`p-2 rounded-xl text-xs font-semibold border transition text-center ${
                        calcItem === 'microfiber'
                          ? 'border-indigo bg-indigo-light text-indigo font-bold'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      Microfiber (24-Pk)
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
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>10 Units (Retailer)</span>
                    <span>100 Units (Hotelier)</span>
                    <span>500 Units (Distributor)</span>
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

      {/* ========================================================
          7. SHOP BY BUSINESS NEED
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
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition shadow-sm ${
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
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
            <div className="aspect-[4/3] rounded-3xl overflow-hidden border border-slate-200 shadow-subtle">
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
          8. CUSTOMER PROOF / REPUTATION CAROUSEL SLIDER
          ======================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div 
          className="bg-slate-100/80 rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm relative overflow-hidden"
          onMouseEnter={() => setIsReviewHovered(true)}
          onMouseLeave={() => setIsReviewHovered(false)}
        >
          {/* Header with Title and Arrow Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <div className="text-center sm:text-left space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full inline-flex items-center gap-1.5 shadow-sm">
                ⭐ 4.9/5 RATED DIRECT SOURCING
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-navy">
                Trusted by 14,000+ Indian Businesses & Families
              </h3>
              <p className="text-xs text-slate-500">
                Swipe or use navigation controls to explore verified buyer testimonials from hotels, retail shops & households
              </p>
            </div>

            {/* Slider Navigation Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handlePrevReview}
                aria-label="Previous customer review"
                className="w-10 h-10 rounded-xl bg-white hover:bg-navy hover:text-white text-navy border border-slate-200 flex items-center justify-center transition shadow-sm active:scale-95 cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={handleNextReview}
                aria-label="Next customer review"
                className="w-10 h-10 rounded-xl bg-white hover:bg-navy hover:text-white text-navy border border-slate-200 flex items-center justify-center transition shadow-sm active:scale-95 cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Slider Viewport Container */}
          <div
            className="overflow-hidden w-full select-none py-1"
            onTouchStart={handleReviewTouchStart}
            onTouchMove={handleReviewTouchMove}
            onTouchEnd={handleReviewTouchEnd}
          >
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{
                transform: `translateX(-${currentReviewIndex * (isMobileScreen ? 100 : 33.3333)}%)`
              }}
            >
              {customerReviews.map((rev) => (
                <div
                  key={rev.id}
                  className="w-full md:w-1/3 shrink-0 px-2 sm:px-3 flex"
                >
                  <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/90 shadow-card hover:shadow-premium transition-all duration-300 flex flex-col justify-between w-full relative group">
                    <Quote className="absolute top-4 right-4 w-8 h-8 text-slate-100 group-hover:text-indigo-light transition-colors pointer-events-none" />

                    <div className="space-y-4">
                      {/* Rating & Verified Tag */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex text-amber-500">
                          {[...Array(rev.rating)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-current" />
                          ))}
                        </div>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          {rev.savings}
                        </span>
                      </div>

                      {/* Review Text */}
                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                        "{rev.text}"
                      </p>
                    </div>

                    {/* Author Information */}
                    <div className="pt-4 mt-4 border-t border-slate-100 flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl ${rev.avatarColor} text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm`}>
                        {rev.initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-extrabold text-navy text-xs sm:text-sm truncate">
                          {rev.name}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {rev.role} • {rev.company}
                        </p>
                        <p className="text-[10px] font-semibold text-indigo mt-0.5">
                          {rev.tag}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dots Indicator */}
          <div className="flex items-center justify-center gap-1.5 pt-5">
            {Array.from({ length: maxReviewIndex + 1 }).map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentReviewIndex(idx)}
                aria-label={`Go to review slide ${idx + 1}`}
                className={`transition-all duration-300 rounded-full h-2 cursor-pointer ${
                  currentReviewIndex === idx
                    ? 'w-7 bg-indigo'
                    : 'w-2 bg-slate-300 hover:bg-slate-400'
                }`}
              />
            ))}
          </div>
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
                    className="w-full py-3.5 bg-indigo hover:bg-indigo-dark text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm"
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
    </div>
  );
};
