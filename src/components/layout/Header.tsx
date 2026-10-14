import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  Tag
} from 'lucide-react';
import { Badge } from '../common/Badge';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const {
    currentUser,
    switchUserRole,
    cartTotalItemsCount,
    cartSubtotal,
    products,
    deliveryPincode,
    deliveryInfo,
    checkPincode,
    recentSearches,
    addRecentSearch
  } = useApp();

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [searchCategory, setSearchCategory] = useState('all');
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState(deliveryPincode);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
    }
  ];

  return (
    <header className="sticky top-0 z-40 w-full shadow-subtle">
      {/* 1. Top Offer Announcement & Persona Switcher Bar */}
      <div className="bg-navy text-white text-xs py-1.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="bg-champagne/20 text-champagne px-2.5 py-0.5 rounded font-black text-[10px] tracking-wider uppercase border border-champagne/30 flex items-center gap-1">
              <Zap className="w-3 h-3 fill-current" />
              DIRECT MILL RATE
            </span>
            <span className="text-slate-200 text-[11px] hidden sm:inline">
              🚚 Free Dispatch above ₹1,499 • ⚡ Instant 10% UPI Discount: <strong className="text-champagne font-mono">MILLDIRECT10</strong> • 🏢 GST Input Credit Invoicing
            </span>
            <span className="text-slate-200 text-[11px] sm:hidden">
              Direct Mill Rates & Wholesale Essentials
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Interactive Persona / Role Switcher */}
            <div className="relative">
              <button
                onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                className="flex items-center gap-1.5 bg-navy-800 hover:bg-navy-700 text-slate-200 px-2.5 py-1 rounded-md text-xs font-medium border border-slate-700 transition"
                title="Switch active user persona"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span className="text-slate-400">Persona:</span>
                <span className="text-white font-bold capitalize">
                  {currentUser.role === 'admin' ? 'Admin Ops' : currentUser.businessType || currentUser.role}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {roleMenuOpen && (
                <div className="absolute right-0 mt-1 w-64 bg-white text-navy rounded-2xl shadow-premium border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3.5 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    Switch Buyer Mode
                  </div>
                  <button
                    onClick={() => { switchUserRole('consumer'); setRoleMenuOpen(false); }}
                    className={`w-full text-left px-3.5 py-2.5 text-xs flex items-center justify-between hover:bg-slate-50 transition ${currentUser.role === 'consumer' ? 'bg-indigo-light text-indigo font-bold' : ''}`}
                  >
                    <div>
                      <p className="font-semibold text-slate-900">Individual Consumer (B2C)</p>
                      <p className="text-[11px] text-slate-500">Retail rates & doorstep home delivery</p>
                    </div>
                    {currentUser.role === 'consumer' && <CheckCircle2 className="w-4 h-4 text-indigo" />}
                  </button>

                  <button
                    onClick={() => { switchUserRole('retailer'); setRoleMenuOpen(false); }}
                    className={`w-full text-left px-3.5 py-2.5 text-xs flex items-center justify-between hover:bg-slate-50 transition ${currentUser.role === 'retailer' ? 'bg-indigo-light text-indigo font-bold' : ''}`}
                  >
                    <div>
                      <p className="font-semibold text-slate-900">Verified Retailer (B2B)</p>
                      <p className="text-[11px] text-slate-500">GST Input credit & 28% off tiers</p>
                    </div>
                    {currentUser.role === 'retailer' && <CheckCircle2 className="w-4 h-4 text-indigo" />}
                  </button>

                  <button
                    onClick={() => { switchUserRole('wholesaler'); setRoleMenuOpen(false); }}
                    className={`w-full text-left px-3.5 py-2.5 text-xs flex items-center justify-between hover:bg-slate-50 transition ${currentUser.role === 'wholesaler' ? 'bg-indigo-light text-indigo font-bold' : ''}`}
                  >
                    <div>
                      <p className="font-semibold text-slate-900">Hotel / Institutional Buyer</p>
                      <p className="text-[11px] text-slate-500">Bulk RFQ & 30-Day Credit Line</p>
                    </div>
                    {currentUser.role === 'wholesaler' && <CheckCircle2 className="w-4 h-4 text-indigo" />}
                  </button>

                  <button
                    onClick={() => { switchUserRole('admin'); setRoleMenuOpen(false); }}
                    className={`w-full text-left px-3.5 py-2.5 text-xs flex items-center justify-between hover:bg-slate-50 transition border-t border-slate-100 ${currentUser.role === 'admin' ? 'bg-indigo-light text-indigo font-bold' : ''}`}
                  >
                    <div>
                      <p className="font-semibold text-slate-900">Operations Director (Admin)</p>
                      <p className="text-[11px] text-slate-500">Inventory, RFQs & Invoices</p>
                    </div>
                    {currentUser.role === 'admin' && <CheckCircle2 className="w-4 h-4 text-indigo" />}
                  </button>
                </div>
              )}
            </div>

            <Link
              to="/admin"
              className="text-[11px] font-semibold text-champagne hover:text-white transition flex items-center gap-1"
            >
              <SlidersHorizontal className="w-3 h-3" />
              <span>Admin Desk</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Main Flipkart / Amazon Style Header Bar */}
      <div className="glass-header border-b border-slate-200/80 px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 sm:gap-6">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 text-slate-700 hover:text-navy hover:bg-slate-100 rounded-lg transition"
            >
              <Menu className="w-6 h-6" />
            </button>

            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-2xl bg-navy flex items-center justify-center text-champagne font-black text-xl shadow-subtle group-hover:scale-105 transition-transform border border-navy-800">
                M
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  <span className="font-black text-xl tracking-tight text-navy leading-none">
                    MAHALAXMI
                  </span>
                  <span className="text-[9px] bg-indigo text-white font-extrabold px-1.5 py-0.2 rounded uppercase">
                    MILLS
                  </span>
                </div>
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mt-0.5">
                  Direct Mill Rates
                </span>
              </div>
            </Link>
          </div>

          {/* Location Delivery Selector (Amazon-style) */}
          <div className="hidden lg:flex items-center shrink-0">
            <button
              onClick={() => setPinModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs hover:bg-slate-100 transition border border-slate-200/60 text-left bg-white/70"
            >
              <MapPin className="w-4 h-4 text-indigo shrink-0" />
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Deliver to</p>
                <p className="font-bold text-navy text-xs flex items-center gap-1">
                  {deliveryInfo?.city || 'Surat'} {deliveryPincode}
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </p>
              </div>
            </button>
          </div>

          {/* Amazon/Flipkart Mega Search Bar */}
          <div className="flex-1 max-w-2xl relative" ref={searchContainerRef}>
            <form onSubmit={handleSearchSubmit} className="flex rounded-xl overflow-hidden shadow-subtle border border-slate-300 focus-within:border-indigo focus-within:ring-2 focus-within:ring-indigo/20 transition bg-white">
              {/* Category Dropdown (Amazon style) */}
              <div className="hidden sm:flex items-center bg-slate-100 border-r border-slate-300 px-2 text-xs text-slate-700 font-semibold cursor-pointer">
                <select
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

              {/* Text Input */}
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchInput}
                  onChange={e => {
                    setSearchInput(e.target.value);
                    setSearchOpen(true);
                  }}
                  onFocus={() => setSearchOpen(true)}
                  placeholder="Search 300 TC bedsheets, 600 GSM bath towels, microfiber wipers, canvas bags..."
                  className="w-full text-navy text-xs sm:text-sm pl-4 pr-3 py-2.5 outline-none placeholder:text-slate-400"
                />
              </div>

              {/* Search Submit Button */}
              <button
                type="submit"
                className="px-5 bg-indigo hover:bg-indigo-dark text-white text-xs font-bold transition flex items-center justify-center shrink-0"
              >
                <Search className="w-4 h-4" />
                <span className="ml-1.5 hidden md:inline">Search</span>
              </button>
            </form>

            {/* Autocomplete Dropdown */}
            {searchOpen && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-premium border border-slate-200 py-3 z-50 overflow-hidden animate-in fade-in">
                {searchInput.trim() ? (
                  <div>
                    <div className="px-4 py-1 text-xs font-bold text-slate-400 uppercase tracking-wider">
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
                              <span className="text-[11px] text-slate-400 line-through">₹{item.mrp}</span>
                              <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 rounded font-bold">
                                {item.subcategory}
                              </span>
                            </div>
                          </div>
                        </Link>
                      ))
                    ) : (
                      <div className="px-4 py-6 text-center text-xs text-slate-500">
                        No direct matches found. Press Enter to view all results.
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <div className="px-4 py-1 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
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
          <div className="flex items-center gap-3 shrink-0">
            {/* Wholesale RFQ Link */}
            <Link
              to="/wholesale"
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 bg-indigo-light text-indigo hover:bg-indigo hover:text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              <Building2 className="w-4 h-4" />
              <span>Bulk Order Pad</span>
            </Link>

            {/* Account Link */}
            <Link
              to="/account"
              className="flex items-center gap-2 p-1.5 hover:bg-slate-100 rounded-xl transition text-slate-700 hover:text-navy"
            >
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-navy font-bold text-xs">
                {currentUser.name.charAt(0)}
              </div>
              <div className="hidden xl:block text-left text-xs">
                <p className="text-[10px] text-slate-400 font-medium">Hello, {currentUser.name.split(' ')[0]}</p>
                <p className="font-bold text-navy">Orders & GST</p>
              </div>
            </Link>

            {/* Cart Link */}
            <Link
              to="/cart"
              className="flex items-center gap-2.5 bg-navy hover:bg-navy-800 text-white px-4 py-2.5 rounded-xl transition shadow-premium group"
            >
              <div className="relative">
                <ShoppingCart className="w-5 h-5 text-champagne" />
                {cartTotalItemsCount > 0 && (
                  <span className="absolute -top-2.5 -right-2.5 bg-error text-white font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-navy animate-pulse">
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
      </div>

      {/* 3. Flipkart / Meesho Style Visual Category Circles Rail */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-2.5 overflow-x-auto hide-scrollbar">
        <div className="max-w-7xl mx-auto flex items-center gap-6 sm:gap-8 min-w-max">
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
      </div>

      {/* PIN Code Modal */}
      {pinModalOpen && (
        <div className="fixed inset-0 z-50 bg-navy/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-premium animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-indigo" />
                <h3 className="font-extrabold text-navy">Check Delivery PIN</h3>
              </div>
              <button onClick={() => setPinModalOpen(false)} className="text-slate-400 hover:text-navy">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-600 mb-4">
              Enter your 6-digit Indian postal code to check direct mill transit speed.
            </p>
            <form onSubmit={handlePincodeSubmit} className="space-y-4">
              <input
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
                  Serviceable • Estimated Dispatch: {deliveryInfo.estimatedDays} {deliveryInfo.estimatedDays === 1 ? 'day' : 'days'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-sm flex">
          <div className="bg-white w-4/5 max-w-sm h-full flex flex-col p-6 shadow-premium overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-navy flex items-center justify-center text-champagne font-bold text-sm">
                  M
                </div>
                <span className="font-black text-navy text-lg">MAHALAXMI</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-1 text-slate-400 hover:text-navy">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="py-4 space-y-4 text-sm font-semibold text-navy">
              <Link to="/catalog" onClick={() => setMobileMenuOpen(false)} className="block py-1 hover:text-indigo">
                Shop All Products
              </Link>
              <Link to="/category/textile" onClick={() => setMobileMenuOpen(false)} className="block py-1 hover:text-indigo">
                Textile (Bedsheets, Curtains, Fabrics)
              </Link>
              <Link to="/category/cotton-products" onClick={() => setMobileMenuOpen(false)} className="block py-1 hover:text-indigo">
                Cotton Products (Towels, Bags)
              </Link>
              <Link to="/category/home-kitchen" onClick={() => setMobileMenuOpen(false)} className="block py-1 hover:text-indigo">
                Home & Kitchen (Towels, Aprons)
              </Link>
              <Link to="/category/household" onClick={() => setMobileMenuOpen(false)} className="block py-1 hover:text-indigo">
                Household (Microfiber, Dusters)
              </Link>
              <Link to="/wholesale" onClick={() => setMobileMenuOpen(false)} className="block py-1 text-indigo font-bold">
                Wholesale Deals & Bulk Orders
              </Link>
              <Link to="/orders" onClick={() => setMobileMenuOpen(false)} className="block py-1 text-slate-700">
                Track My Order
              </Link>
              <Link to="/account" onClick={() => setMobileMenuOpen(false)} className="block py-1 text-slate-700">
                Business & Profile Settings
              </Link>
              <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="block py-1 text-champagne font-bold">
                Admin & Operations Dashboard
              </Link>
            </div>

            <div className="mt-auto pt-6 border-t border-slate-200 text-xs text-slate-500">
              <p className="font-bold text-navy">Mahalaxmi Enterprises</p>
              <p>Direct Mill Rates & Wholesale Essentials</p>
              <p className="mt-1">Surat Textile Park • GSTIN: 24AAECM8921P1ZA</p>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
