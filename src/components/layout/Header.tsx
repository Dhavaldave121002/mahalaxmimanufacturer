import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  Search,
  ShoppingCart,
  User as UserIcon,
  MapPin,
  Menu,
  X,
  PhoneCall,
  ShieldCheck,
  ChevronDown,
  Building2,
  Package,
  Layers,
  Sparkles,
  ArrowRight,
  SlidersHorizontal,
  CheckCircle2,
  Flame,
  Zap,
  Tag,
  FileSpreadsheet,
  Download,
  Calculator,
  Truck,
  ChevronRight,
  Heart
} from 'lucide-react';
import { Badge } from '../common/Badge';
import { WishlistDrawer } from '../common/WishlistDrawer';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    currentUser,
    isLoggedIn,
    logout,
    switchUserRole,
    cartTotalItemsCount,
    cartSubtotal,
    products,
    deliveryPincode,
    deliveryInfo,
    checkPincode,
    recentSearches,
    addRecentSearch,
    coupons,
    wishlist
  } = useApp();

  const topPromo = coupons.find(c => c.isActive && c.isFeatured);

  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [searchCategory, setSearchCategory] = useState('all');
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState(deliveryPincode);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const mobileSearchContainerRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  // Track scroll position to enhance sticky header appearance
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Automatically close any open search or menus on page navigation
  useEffect(() => {
    setSearchOpen(false);
    setRoleMenuOpen(false);
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile menu or pin modal is open
  useEffect(() => {
    if (mobileMenuOpen || pinModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen, pinModalOpen]);

  // Click outside and escape key dismiss
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      const insideDesktop = searchContainerRef.current?.contains(target);
      const insideMobile = mobileSearchContainerRef.current?.contains(target);
      if (!insideDesktop && !insideMobile) {
        setSearchOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setRoleMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      addRecentSearch(searchInput.trim());
      setSearchOpen(false);
      const catQuery = searchCategory !== 'all' ? `&category=${searchCategory}` : '';
      navigate(`/catalog?q=${encodeURIComponent(searchInput.trim())}${catQuery}`);
    }
  };

  const filteredSuggestions = searchInput.trim()
    ? products
        .filter(p => {
          if (searchCategory !== 'all' && p.category !== searchCategory) return false;
          return (
            p.name.toLowerCase().includes(searchInput.toLowerCase()) ||
            p.categoryName.toLowerCase().includes(searchInput.toLowerCase()) ||
            p.subcategory.toLowerCase().includes(searchInput.toLowerCase()) ||
            p.tags.some(t => t.toLowerCase().includes(searchInput.toLowerCase()))
          );
        })
        .slice(0, 5)
    : [];

  const handlePincodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    checkPincode(pinInput);
    setPinModalOpen(false);
  };

  // Circular Category Rail (Amazon / Flipkart / Meesho signature)
  const categoryBubbles = [
    {
      name: 'Double Bedsheets',
      path: '/category/textile',
      img: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?q=80&w=200&auto=format&fit=crop'
    },
    {
      name: 'Cotton Towels',
      path: '/category/cotton-products',
      img: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?q=80&w=200&auto=format&fit=crop'
    },
    {
      name: 'Curtains & Drapes',
      path: '/category/textile',
      img: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=200&auto=format&fit=crop'
    },
    {
      name: 'Kitchen Towels',
      path: '/category/home-kitchen',
      img: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=200&auto=format&fit=crop'
    },
    {
      name: 'Microfiber Wipes',
      path: '/category/household',
      img: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?q=80&w=200&auto=format&fit=crop'
    },
    {
      name: 'Canvas Tote Bags',
      path: '/category/cotton-products',
      img: 'https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=200&auto=format&fit=crop'
    },
    {
      name: 'Hotel White Linen',
      path: '/category/textile',
      img: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=200&auto=format&fit=crop'
    },
    {
      name: 'Bulk Mill Bales',
      path: '/wholesale',
      img: 'https://images.unsplash.com/photo-1604014237800-1c9102c219da?q=80&w=200&auto=format&fit=crop',
      isHot: true
    },
    {
      name: 'Sample Kits & Bundles',
      path: '/catalog?q=sample',
      img: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?q=80&w=200&auto=format&fit=crop',
      isHot: true
    }
  ];

  return (
    <>
      {/* 1. Top Offer Announcement & Persona Switcher Bar (Normal flow, at very top) */}
      <div className="bg-navy text-white text-xs py-1.5 px-4 sm:px-6 w-full border-b border-navy-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="bg-champagne/20 text-champagne px-2.5 py-0.5 rounded font-black text-[10px] tracking-wider uppercase border border-champagne/30 flex items-center gap-1">
              <Zap className="w-3 h-3 fill-current" />
              DIRECT MILL RATE
            </span>
            <span className="text-slate-200 text-[11px] hidden sm:inline">
              🚚 Free Delivery above ₹1,499 • {topPromo ? (
                <>⚡ Live Offer: <strong className="text-champagne font-mono font-black">{topPromo.code}</strong> ({topPromo.discountType === 'FLAT' ? `Flat ₹${topPromo.discountValue} Off` : `${topPromo.discountValue}% Off`}) • </>
              ) : null}🏢 100% GST ITC Invoicing
            </span>
            <span className="text-slate-200 text-[11px] sm:hidden">
              {topPromo ? (
                <>⚡ Offer: <strong className="text-champagne font-mono font-black">{topPromo.code}</strong> ({topPromo.discountType === 'FLAT' ? `Flat ₹${topPromo.discountValue} Off` : `${topPromo.discountValue}% Off`})</>
              ) : (
                <>⚡ Direct Mill Rates • 100% Cotton</>
              )}
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <a
              href="tel:+919429187611"
              className="text-slate-300 hover:text-champagne transition flex items-center gap-1 font-medium"
            >
              <PhoneCall className="w-3 h-3 text-champagne" />
              <span>Mill Desk: +91 94291 87611</span>
            </a>
            <span className="text-slate-700 hidden md:inline">•</span>
            <Link
              to="/wholesale"
              className="text-slate-300 hover:text-white transition font-medium hidden md:inline"
            >
              Wholesale RFQ
            </Link>
            <span className="text-slate-700 hidden sm:inline">•</span>
            {isLoggedIn ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/account"
                  className="text-champagne hover:text-white transition font-bold"
                >
                  My Account
                </Link>
                <span className="text-slate-700">•</span>
                <button
                  type="button"
                  onClick={logout}
                  className="text-slate-400 hover:text-white transition text-[10px] cursor-pointer"
                  title="Sign out of account"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="text-champagne hover:text-white transition font-bold"
              >
                Sign In / Register
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* 2. Main Flipkart / Amazon Style Header Bar (ALWAYS PINNED TO TOP 0) */}
      <header
        className={`sticky top-0 z-50 w-full backdrop-blur-md transition-all duration-200 py-1.5 sm:py-2.5 px-2 sm:px-6 ${
          isScrolled
            ? 'bg-white shadow-md border-b border-slate-300'
            : 'bg-white/98 shadow-sm border-b border-slate-200/90'
        }`}
      >
        <div className="max-w-7xl mx-auto w-full">
          {/* Main Bar Row (Logo, Pincode, Search on desktop, Actions) */}
          <div className="flex items-center justify-between gap-1 sm:gap-6 w-full min-w-0">
            {/* Logo & Hamburger Menu */}
            <div className="flex items-center gap-1 sm:gap-3 shrink-0 min-w-0">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden p-1 text-slate-700 hover:text-navy hover:bg-slate-100 rounded-lg transition"
                aria-label="Open mobile menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              <Link to="/" className="flex items-center gap-1.5 sm:gap-2 group min-w-0">
                <img
                  src="/logo.png"
                  alt="Mahalaxmi Enterprises Logo"
                  className="w-8 h-8 sm:w-11 sm:h-11 rounded-full object-cover shadow-sm group-hover:scale-105 transition-transform border border-slate-200 shrink-0"
                />
                <div className="flex flex-col min-w-0">
                  <span className="font-black text-xs sm:text-base lg:text-lg tracking-tight text-navy leading-none whitespace-nowrap">
                    MAHALAXMI ENTERPRISES
                  </span>
                  <span className="text-[7px] sm:text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mt-0.5 hidden xs:block">
                    Direct Mill Rates
                  </span>
                </div>
              </Link>
            </div>

            {/* Desktop Location Delivery Selector (Amazon-style) */}
            <div className="hidden lg:flex items-center shrink-0">
              <button
                onClick={() => setPinModalOpen(true)}
                aria-label={`Delivery location: ${deliveryInfo?.city || 'Surat'} ${deliveryPincode}. Click to change pincode`}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs hover:bg-slate-100 transition border border-slate-200/60 text-left bg-white/70"
              >
                <MapPin className="w-4 h-4 text-indigo shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Deliver to</p>
                  <p className="font-bold text-navy text-xs flex items-center gap-1">
                    {deliveryInfo?.city || 'Surat'} {deliveryPincode}
                    <ChevronDown className="w-3 h-3 text-slate-500" />
                  </p>
                </div>
              </button>
            </div>

            {/* Desktop-only Mega Search Bar (Hidden on mobile) */}
            <div className="hidden md:block flex-1 max-w-2xl relative z-40" ref={searchContainerRef}>
              <form onSubmit={handleSearchSubmit} className="flex rounded-xl overflow-hidden shadow-subtle border border-slate-300 focus-within:border-indigo focus-within:ring-2 focus-within:ring-indigo/20 transition bg-white">
                <div className="hidden sm:flex items-center bg-slate-100 border-r border-slate-300 px-2 text-xs text-slate-700 font-semibold cursor-pointer">
                  <select
                    id="header-department-select"
                    name="department"
                    aria-label="Select Shopping Department"
                    value={searchCategory}
                    onChange={e => setSearchCategory(e.target.value)}
                    className="bg-transparent border-none outline-none pr-1 cursor-pointer"
                  >
                    <option value="all">All Departments</option>
                    <option value="textile">Textile</option>
                    <option value="cotton-products">Cotton Products</option>
                    <option value="home-kitchen">Home & Kitchen</option>
                    <option value="household">Household</option>
                  </select>
                </div>

                <div className="relative flex-1 flex items-center">
                  <input
                    id="header-search-input"
                    name="search"
                    aria-label="Search direct mill products"
                    type="text"
                    value={searchInput}
                    onChange={e => {
                      setSearchInput(e.target.value);
                      setSearchOpen(true);
                    }}
                    onFocus={() => setSearchOpen(true)}
                    placeholder="Search 300 TC bedsheets, 600 GSM bath towels, microfiber wipers, canvas bags..."
                    className="w-full text-navy text-xs sm:text-sm pl-4 pr-3 py-2.5 outline-none placeholder:text-slate-500"
                  />
                  {searchInput && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchInput('');
                        setSearchOpen(false);
                      }}
                      aria-label="Clear search input"
                      className="p-1.5 text-slate-500 hover:text-navy mr-1 rounded-full transition"
                      title="Clear search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  aria-label="Submit search"
                  className="px-5 bg-indigo hover:bg-indigo-dark text-white text-xs font-bold transition flex items-center justify-center shrink-0"
                >
                  <Search className="w-4 h-4" />
                  <span className="ml-1.5 hidden md:inline">Search</span>
                </button>
              </form>

              {/* Desktop Autocomplete Dropdown */}
              {searchOpen && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-float border border-slate-200/90 py-3.5 z-50 overflow-hidden animate-in fade-in ring-1 ring-black/5">
                  {searchInput.trim() ? (
                    <div>
                      <div className="px-4 py-1 text-xs font-bold text-slate-600 uppercase tracking-wider">
                        Matching Mill Products
                      </div>
                      {filteredSuggestions.length > 0 ? (
                        filteredSuggestions.map(item => (
                          <Link
                            key={item.id}
                            to={`/product/${item.slug}`}
                            onClick={() => {
                              setSearchOpen(false);
                              addRecentSearch(item.name);
                            }}
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition"
                          >
                            <img
                              src={item.images[0]}
                              alt={item.name}
                              className="w-10 h-10 object-cover rounded-lg border border-slate-200"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-navy truncate">{item.name}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs font-black text-indigo">₹{item.retailPrice}</span>
                                <span className="text-[11px] text-slate-500 line-through">₹{item.mrp}</span>
                                <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 rounded font-bold">
                                  {item.subcategory}
                                </span>
                              </div>
                            </div>
                          </Link>
                        ))
                      ) : (
                        <div className="px-4 py-6 text-center text-xs text-slate-600">
                          No direct matches found. Press Enter to view all results.
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <div className="px-4 py-1 text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                        Recent & Popular Searches
                      </div>
                      <div className="flex flex-wrap gap-1.5 px-4">
                        {recentSearches.map((term, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              setSearchInput(term);
                              addRecentSearch(term);
                              setSearchOpen(false);
                              navigate(`/catalog?q=${encodeURIComponent(term)}`);
                            }}
                            className="px-3 py-1 bg-slate-100 hover:bg-indigo-light hover:text-indigo text-slate-700 rounded-full text-xs transition"
                          >
                            {term}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-1 sm:gap-3 shrink-0">
              {/* Mobile PIN Code Quick Badge */}
              <button
                onClick={() => setPinModalOpen(true)}
                aria-label={`Delivery Pincode: ${deliveryInfo?.city || 'Surat'}`}
                className="flex lg:hidden items-center gap-1 px-1.5 py-1 text-[10px] sm:text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition shrink-0"
                title="Delivery Pincode"
              >
                <MapPin className="w-3 h-3 text-indigo shrink-0" />
                <span className="max-w-[42px] sm:max-w-[65px] truncate">{deliveryInfo?.city || 'Surat'}</span>
              </button>

              {/* Wholesale RFQ Link */}
              <Link
                to="/wholesale"
                aria-label="Bulk Order Pad for wholesale buyers"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 bg-indigo-light text-indigo hover:bg-indigo hover:text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                <Building2 className="w-4 h-4" />
                <span>Bulk Order Pad</span>
              </Link>

              {/* Account Link */}
              {isLoggedIn ? (
                <Link
                  to="/account"
                  aria-label={`My Account: ${currentUser.name}`}
                  className="flex items-center gap-1 p-1 sm:p-1.5 hover:bg-slate-100 rounded-xl transition text-slate-700 hover:text-navy shrink-0"
                  title="My Account"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-200 flex items-center justify-center text-navy font-bold text-xs shrink-0">
                    {currentUser.name.charAt(0)}
                  </div>
                  <div className="hidden xl:block text-left text-xs">
                    <p className="text-[10px] text-slate-500 font-medium">Hello, {currentUser.name.split(' ')[0]}</p>
                    <p className="font-bold text-navy">Orders & GST</p>
                  </div>
                </Link>
              ) : (
                <Link
                  to="/login"
                  aria-label="Sign In or Register account"
                  className="flex items-center gap-1 p-1.5 sm:px-3 sm:py-2 hover:bg-slate-100 rounded-xl transition text-slate-700 hover:text-navy border border-slate-200 shrink-0"
                  title="Sign In / Register"
                >
                  <UserIcon className="w-4 h-4 text-indigo shrink-0" />
                  <div className="hidden xl:block text-left text-xs">
                    <p className="text-[10px] text-slate-500 font-medium">Direct Mill Access</p>
                    <p className="font-bold text-navy">Sign In / Register</p>
                  </div>
                </Link>
              )}

              {/* Wishlist Button */}
              <button
                type="button"
                onClick={() => setWishlistOpen(true)}
                aria-label={`Wishlist with ${wishlist.length} saved items`}
                className="relative p-2 sm:px-3 sm:py-2.5 rounded-xl hover:bg-slate-100 transition text-slate-700 hover:text-red-600 shrink-0 border border-slate-200 cursor-pointer"
                title="View Saved Wishlist"
              >
                <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${wishlist.length > 0 ? 'text-red-500 fill-red-500' : 'text-slate-600'}`} />
                {wishlist.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white">
                    {wishlist.length}
                  </span>
                )}
              </button>

              {/* Cart Link */}
              <Link
                to="/cart"
                aria-label={`Shopping Cart with ${cartTotalItemsCount} items, total ₹${cartSubtotal}`}
                className="flex items-center gap-1.5 bg-navy hover:bg-navy-800 text-white p-1.5 sm:px-4 sm:py-2.5 rounded-xl transition shadow-premium group shrink-0"
                title="View Cart"
              >
                <div className="relative">
                  <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-champagne" />
                  {cartTotalItemsCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-error text-white font-black text-[9px] sm:text-[10px] w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center ring-2 ring-navy animate-pulse">
                      {cartTotalItemsCount}
                    </span>
                  )}
                </div>
                <div className="hidden sm:block text-left text-xs">
                  <p className="text-[10px] text-slate-300 font-semibold">Your Cart</p>
                  <p className="font-black text-white">₹{cartSubtotal.toLocaleString('en-IN')}</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Row 2: Full-Width Search Bar for Mobile Screens (<md) */}
          <div className="md:hidden mt-2 relative z-40 w-full" ref={mobileSearchContainerRef}>
            <form onSubmit={handleSearchSubmit} className="flex rounded-xl overflow-hidden shadow-sm border border-slate-300 focus-within:border-indigo focus-within:ring-2 focus-within:ring-indigo/20 transition bg-white w-full">
              <div className="relative flex-1 flex items-center min-w-0">
                <Search className="w-4 h-4 text-slate-500 ml-2.5 shrink-0" />
                <input
                  id="mobile-search-input"
                  name="search-mobile"
                  aria-label="Search direct mill products"
                  type="text"
                  value={searchInput}
                  onChange={e => {
                    setSearchInput(e.target.value);
                    setSearchOpen(true);
                  }}
                  onFocus={() => setSearchOpen(true)}
                  placeholder="Search bedsheets, towels, curtains, totes..."
                  className="w-full text-navy text-xs pl-2 pr-1.5 py-2 outline-none placeholder:text-slate-500 min-w-0"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchInput('');
                      setSearchOpen(false);
                    }}
                    aria-label="Clear search input"
                    className="p-1 text-slate-500 hover:text-navy mr-1 rounded-full transition"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <button
                type="submit"
                aria-label="Submit search"
                className="px-3 sm:px-4 bg-indigo hover:bg-indigo-dark text-white text-xs font-bold transition flex items-center justify-center shrink-0"
              >
                <span>Search</span>
              </button>
            </form>

            {/* Mobile Autocomplete Dropdown */}
            {searchOpen && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl shadow-float border border-slate-200/90 py-3 z-50 overflow-hidden animate-in fade-in ring-1 ring-black/5 w-full">
                {searchInput.trim() ? (
                  <div>
                    <div className="px-3.5 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Matching Mill Products
                    </div>
                    {filteredSuggestions.length > 0 ? (
                      filteredSuggestions.map(item => (
                        <Link
                          key={item.id}
                          to={`/product/${item.slug}`}
                          onClick={() => {
                            setSearchOpen(false);
                            addRecentSearch(item.name);
                          }}
                          className="flex items-center gap-3 px-3.5 py-2 hover:bg-slate-50 transition border-b border-slate-50 last:border-0"
                        >
                          <img
                            src={item.images[0]}
                            alt={item.name}
                            className="w-9 h-9 object-cover rounded-lg border border-slate-200 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-navy truncate">{item.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs font-black text-indigo">₹{item.retailPrice}</span>
                              <span className="text-[10px] text-slate-400 line-through">₹{item.mrp}</span>
                            </div>
                          </div>
                        </Link>
                      ))
                    ) : (
                      <div className="px-3 py-4 text-center text-xs text-slate-500">
                        No matches. Tap Search to view all results.
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <div className="px-3.5 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Recent & Popular Searches
                    </div>
                    <div className="flex flex-wrap gap-1 px-3">
                      {recentSearches.map((term, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            setSearchInput(term);
                            addRecentSearch(term);
                            setSearchOpen(false);
                            navigate(`/catalog?q=${encodeURIComponent(term)}`);
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-light hover:text-indigo text-slate-700 rounded-full text-xs transition"
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 3. Flipkart / Meesho Style Visual Category Circles Rail (Scrolls away under Bar 2, hidden on cart/checkout/admin) */}
      {!['/cart', '/checkout'].includes(location.pathname) && !location.pathname.startsWith('/admin') && (
        <nav className="bg-white border-b border-slate-200 overflow-x-auto hide-scrollbar relative z-10 w-full max-w-full touch-pan-x py-2 sm:py-2.5">
          <div className="flex items-center gap-4 sm:gap-8 px-4 w-max min-w-full justify-start sm:justify-center">
            {categoryBubbles.map((cat, i) => (
              <Link
                key={i}
                to={cat.path}
                className="group flex flex-col items-center text-center gap-1.5 transition"
              >
                <div className="relative w-12 h-12 rounded-full overflow-hidden p-0.5 bg-gradient-to-tr from-slate-200 to-indigo/40 group-hover:from-indigo group-hover:to-champagne transition">
                  <img
                    src={cat.img}
                    alt={cat.name}
                    className="w-full h-full object-cover rounded-full group-hover:scale-110 transition-transform duration-300"
                  />
                  {cat.isHot && (
                    <span className="absolute top-0 right-0 w-3 h-3 bg-error rounded-full border-2 border-white"></span>
                  )}
                </div>
                <span className="text-[11px] font-bold text-slate-700 group-hover:text-indigo transition whitespace-nowrap">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </nav>
      )}

      {/* PIN Code Modal */}
      {/* Pincode Modal Portaled to document.body */}
      {pinModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className="fixed inset-0"
            onClick={() => setPinModalOpen(false)}
          />
          <div className="relative bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl z-10 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-indigo" />
                <p className="font-extrabold text-navy text-base">Check Delivery PIN</p>
              </div>
              <button
                onClick={() => setPinModalOpen(false)}
                aria-label="Close delivery pincode modal"
                className="text-slate-500 hover:text-navy p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-600 mb-4">
              Enter your 6-digit Indian postal code to check direct mill transit speed.
            </p>
            <form onSubmit={handlePincodeSubmit} className="space-y-4">
              <input
                id="pincode-modal-input"
                name="pincode"
                aria-label="Enter 6-digit Indian postal pincode"
                type="text"
                maxLength={6}
                value={pinInput}
                onChange={e => setPinInput(e.target.value.replace(/\D/g, ''))}
                placeholder="e.g. 395002, 110001, 560001"
                className="w-full text-center text-lg font-mono tracking-widest px-4 py-2 border border-slate-300 rounded-xl focus:border-indigo outline-none"
                autoFocus
              />
              <button
                type="submit"
                aria-label="Verify serviceability for pincode"
                className="w-full bg-indigo hover:bg-indigo-dark text-white py-2.5 rounded-xl font-bold text-xs transition"
              >
                Verify Serviceability
              </button>
            </form>

            {deliveryInfo && (
              <div className="mt-4 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                <p className="font-bold text-navy">
                  {deliveryInfo.city}, {deliveryInfo.state} ({deliveryInfo.pincode})
                </p>
                <p className="text-emerald-700 mt-1 flex items-center gap-1 font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  Serviceable • Estimated Delivery: {deliveryInfo.estimatedDays} {deliveryInfo.estimatedDays === 1 ? 'day' : 'days'}
                </p>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* Mobile Menu Drawer Portaled directly to document.body */}
      {mobileMenuOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100] flex">
          {/* Full Screen Dim Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Container (Slides from left, full height, no bottom collision) */}
          <div className="relative w-[85%] max-w-[320px] h-full bg-white z-[101] shadow-2xl flex flex-col overflow-hidden animate-slide-right">
            {/* 1. Executive Drawer Header */}
            <div className="bg-gradient-to-r from-navy via-navy-800 to-indigo-dark text-white p-5 space-y-3 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img
                    src="/logo.png"
                    alt="Mahalaxmi Enterprises Logo"
                    className="w-10 h-10 rounded-full object-cover shadow-sm border border-champagne/40 shrink-0"
                  />
                  <div>
                    <h4 className="font-black text-sm tracking-tight leading-tight">MAHALAXMI ENTERPRISES</h4>
                    <p className="text-[10px] text-champagne font-bold tracking-wider uppercase">Direct Mill Weaves</p>
                  </div>
                </div>

                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
                  aria-label="Close menu"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* User Persona & Pincode Chips */}
              <div className="pt-2 border-t border-slate-700/60 flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs">
                  {isLoggedIn ? (
                    <>
                      <span className="text-slate-300 font-medium truncate">Hello, {currentUser.name}</span>
                      <button
                        type="button"
                        onClick={() => {
                          logout();
                          setMobileMenuOpen(false);
                        }}
                        className="text-champagne hover:underline text-[10px] font-bold cursor-pointer"
                      >
                        Logout
                      </button>
                    </>
                  ) : (
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-champagne font-bold flex items-center gap-1 hover:underline text-xs"
                    >
                      <UserIcon className="w-3.5 h-3.5" />
                      <span>Sign In / Create Account</span>
                    </Link>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setPinModalOpen(true);
                  }}
                  className="flex items-center justify-between bg-black/20 hover:bg-black/30 px-3 py-1.5 rounded-xl text-[11px] text-slate-300 transition border border-white/10"
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-champagne shrink-0" />
                    <span className="truncate">Deliver to: {deliveryPincode} ({deliveryInfo?.city || 'Surat'})</span>
                  </div>
                  <span className="text-champagne font-bold shrink-0 ml-1">Change</span>
                </button>
              </div>
            </div>

            {/* 2. Scrollable Navigation Menu */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 text-xs text-navy overscroll-contain">
              {/* B2B Wholesale Power Suite (Featured) */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo block px-2">
                  ⚡ WHOLESALE & MILL POWER TOOLS
                </span>
                <div className="bg-indigo-light/50 rounded-2xl p-1.5 border border-indigo-100 space-y-0.5">
                  <Link
                    to="/wholesale"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white transition text-navy font-bold"
                  >
                    <div className="flex items-center gap-2.5">
                      <FileSpreadsheet className="w-4 h-4 text-indigo shrink-0" />
                      <span>Bulk Multi-SKU Pad</span>
                    </div>
                    <span className="text-[10px] bg-indigo text-white px-2 py-0.5 rounded font-bold">Fast Entry</span>
                  </Link>

                  <Link
                    to="/wholesale"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white transition text-navy font-bold"
                  >
                    <div className="flex items-center gap-2.5">
                      <Building2 className="w-4 h-4 text-indigo shrink-0" />
                      <span>Request Custom RFQ</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </Link>

                  <Link
                    to="/wholesale"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white transition text-navy font-bold"
                  >
                    <div className="flex items-center gap-2.5">
                      <Calculator className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>GSTIN & ITC Calculator</span>
                    </div>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">Tax Savings</span>
                  </Link>

                  <Link
                    to="/wholesale"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white transition text-navy font-bold"
                  >
                    <div className="flex items-center gap-2.5">
                      <Download className="w-4 h-4 text-indigo shrink-0" />
                      <span>Surat Mill Price Sheet</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">PDF</span>
                  </Link>
                </div>
              </div>

              {/* Primary Product Categories */}
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block px-2">
                  🛍️ DIRECT MILL CATEGORIES
                </span>
                <Link
                  to="/catalog"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 transition text-slate-800 font-semibold"
                >
                  <div className="flex items-center gap-2.5">
                    <Layers className="w-4 h-4 text-slate-500 shrink-0" />
                    <span>Shop All Products</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </Link>

                <Link
                  to="/category/textile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 transition text-slate-800 font-semibold"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">🧵</span>
                    <span>Textiles (Bedsheets, Curtains)</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </Link>

                <Link
                  to="/category/cotton-products"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 transition text-slate-800 font-semibold"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">🌿</span>
                    <span>Cotton Products (Towels, Bags)</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </Link>

                <Link
                  to="/category/home-kitchen"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 transition text-slate-800 font-semibold"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">🍳</span>
                    <span>Home & Kitchen (Towels, Aprons)</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </Link>

                <Link
                  to="/category/household"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 transition text-slate-800 font-semibold"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">🧹</span>
                    <span>Household (Microfiber, Dusters)</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </Link>
              </div>

              {/* Account, Orders & Support */}
              <div className="space-y-1 pt-2 border-t border-slate-100">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block px-2">
                  📦 ACCOUNT & CONSIGNMENTS
                </span>
                <Link
                  to="/orders"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 transition text-slate-800 font-semibold"
                >
                  <div className="flex items-center gap-2.5">
                    <Truck className="w-4 h-4 text-indigo shrink-0" />
                    <span>Track My Consignment</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </Link>

                <Link
                  to="/account"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 transition text-slate-800 font-semibold"
                >
                  <div className="flex items-center gap-2.5">
                    <UserIcon className="w-4 h-4 text-slate-500 shrink-0" />
                    <span>Business & GST Settings</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </Link>

                <Link
                  to="/wholesale"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 transition text-slate-800 font-semibold"
                >
                  <div className="flex items-center gap-2.5">
                    <Building2 className="w-4 h-4 text-indigo shrink-0" />
                    <span>Direct Mill Wholesale Desk</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </Link>
              </div>
            </div>

            {/* 3. Drawer Bottom Contact Strip */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs shrink-0 space-y-2">
              <a
                href="https://wa.me/919876543210?text=Hello%20Mahalaxmi%20Enterprises%2C%20I%20want%20to%20order%20wholesale%20fabrics"
                target="_blank"
                rel="noreferrer"
                className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition shadow-sm text-center"
              >
                <span>💬 WhatsApp Surat Mill Desk</span>
              </a>

              <div className="text-[10px] text-slate-400 text-center">
                Surat Textile Park • GSTIN: 24AAECM8921P1ZA
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Slide-over User-Persistent Wishlist Drawer */}
      <WishlistDrawer isOpen={wishlistOpen} onClose={() => setWishlistOpen(false)} />
    </>
  );
};
