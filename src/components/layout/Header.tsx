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
  FileText,
  Package,
  Layers,
  Sparkles,
  ArrowRight,
  SlidersHorizontal,
  CheckCircle2
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
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState(deliveryPincode);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close search suggestions when clicking outside
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
      navigate(`/catalog?q=${encodeURIComponent(searchInput.trim())}`);
    }
  };

  const filteredSuggestions = searchInput.trim()
    ? products
        .filter(
          p =>
            p.name.toLowerCase().includes(searchInput.toLowerCase()) ||
            p.categoryName.toLowerCase().includes(searchInput.toLowerCase()) ||
            p.subcategory.toLowerCase().includes(searchInput.toLowerCase()) ||
            p.tags.some(t => t.toLowerCase().includes(searchInput.toLowerCase()))
        )
        .slice(0, 5)
    : [];

  const handlePincodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    checkPincode(pinInput);
    setPinModalOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full shadow-subtle">
      {/* 1. Top Announcement & Persona Switcher Bar */}
      <div className="bg-navy text-white text-xs py-1.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="bg-champagne/20 text-champagne px-2 py-0.5 rounded font-semibold text-[11px] tracking-wide uppercase border border-champagne/30">
              Direct Mill Guarantee
            </span>
            <span className="text-slate-300 hidden sm:inline">
              Direct Weaving Rates • 100% Combed Cotton • Official GST Tax Invoice
            </span>
            <span className="text-slate-300 sm:hidden">
              Direct Mill Rates & Wholesale Essentials
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Interactive Persona / Role Switcher */}
            <div className="relative">
              <button
                onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                className="flex items-center gap-1.5 bg-navy-800 hover:bg-navy-700 text-slate-200 px-2.5 py-1 rounded-md text-xs font-medium border border-slate-700 transition"
                title="Switch active user persona to test B2B, B2C and Admin workflows"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span className="text-slate-400">Viewing as:</span>
                <span className="text-white font-semibold capitalize">
                  {currentUser.role === 'admin' ? 'Admin Ops' : currentUser.businessType || currentUser.role}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {roleMenuOpen && (
                <div className="absolute right-0 mt-1 w-60 bg-white text-navy rounded-xl shadow-premium border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    Switch Test Persona
                  </div>
                  <button
                    onClick={() => { switchUserRole('consumer'); setRoleMenuOpen(false); }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition ${currentUser.role === 'consumer' ? 'bg-indigo-light text-indigo font-bold' : ''}`}
                  >
                    <div>
                      <p className="font-semibold text-slate-800">Consumer (B2C)</p>
                      <p className="text-[11px] text-slate-500">Retail rates & home delivery</p>
                    </div>
                    {currentUser.role === 'consumer' && <CheckCircle2 className="w-4 h-4 text-indigo" />}
                  </button>

                  <button
                    onClick={() => { switchUserRole('retailer'); setRoleMenuOpen(false); }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition ${currentUser.role === 'retailer' ? 'bg-indigo-light text-indigo font-bold' : ''}`}
                  >
                    <div>
                      <p className="font-semibold text-slate-800">Verified Retailer (B2B)</p>
                      <p className="text-[11px] text-slate-500">GST Input credit & 28% off tiers</p>
                    </div>
                    {currentUser.role === 'retailer' && <CheckCircle2 className="w-4 h-4 text-indigo" />}
                  </button>

                  <button
                    onClick={() => { switchUserRole('wholesaler'); setRoleMenuOpen(false); }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition ${currentUser.role === 'wholesaler' ? 'bg-indigo-light text-indigo font-bold' : ''}`}
                  >
                    <div>
                      <p className="font-semibold text-slate-800">Hotel / Institutional Buyer</p>
                      <p className="text-[11px] text-slate-500">Bulk RFQ & 30-Day Credit Line</p>
                    </div>
                    {currentUser.role === 'wholesaler' && <CheckCircle2 className="w-4 h-4 text-indigo" />}
                  </button>

                  <button
                    onClick={() => { switchUserRole('admin'); setRoleMenuOpen(false); }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition border-t border-slate-100 ${currentUser.role === 'admin' ? 'bg-indigo-light text-indigo font-bold' : ''}`}
                  >
                    <div>
                      <p className="font-semibold text-slate-800">Operations Director (Admin)</p>
                      <p className="text-[11px] text-slate-500">Inventory, RFQs & Invoices</p>
                    </div>
                    {currentUser.role === 'admin' && <CheckCircle2 className="w-4 h-4 text-indigo" />}
                  </button>
                </div>
              )}
            </div>

            <div className="hidden lg:flex items-center gap-2 text-slate-300">
              <PhoneCall className="w-3.5 h-3.5 text-champagne" />
              <span>Wholesale Desk: +91 98765 43210</span>
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

      {/* 2. Main Header Bar */}
      <div className="glass-header border-b border-slate-200/80 px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo & Mobile Menu Trigger */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 text-slate-700 hover:text-navy hover:bg-slate-100 rounded-lg transition"
            >
              <Menu className="w-6 h-6" />
            </button>

            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-xl bg-navy flex items-center justify-center text-champagne font-black text-xl shadow-subtle group-hover:scale-105 transition-transform">
                M
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-xl tracking-tight text-navy leading-none">
                  MAHALAXMI<span className="text-indigo">.</span>
                </span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                  Direct Mill Rates
                </span>
              </div>
            </Link>
          </div>

          {/* Delivery PIN Code Selector */}
          <div className="hidden md:flex items-center">
            <button
              onClick={() => setPinModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs hover:bg-slate-100 transition border border-transparent hover:border-slate-200 text-left"
            >
              <MapPin className="w-4 h-4 text-indigo" />
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-medium">Deliver to</p>
                <p className="font-bold text-navy flex items-center gap-1">
                  {deliveryInfo?.city || 'Surat'} {deliveryPincode}
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </p>
              </div>
            </button>
          </div>

          {/* Search Bar with Autocomplete Dropdown */}
          <div className="flex-1 max-w-xl relative" ref={searchContainerRef}>
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                value={searchInput}
                onChange={e => {
                  setSearchInput(e.target.value);
                  setSearchOpen(true);
                }}
                onFocus={() => setSearchOpen(true)}
                placeholder="Search bedsheets, 600 GSM towels, kitchen cloths, canvas bags..."
                className="w-full bg-slate-100/90 hover:bg-slate-100 focus:bg-white text-navy text-sm pl-11 pr-24 py-2.5 rounded-xl border border-slate-200 focus:border-indigo focus:ring-2 focus:ring-indigo/20 transition outline-none"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-indigo hover:bg-indigo-dark text-white text-xs font-semibold rounded-lg transition"
              >
                Search
              </button>
            </form>

            {/* Search Suggestions Modal / Dropdown */}
            {searchOpen && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl shadow-premium border border-slate-200 py-3 z-50 overflow-hidden animate-in fade-in">
                {searchInput.trim() ? (
                  <div>
                    <div className="px-4 py-1 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Matching Products
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
                            className="w-10 h-10 object-cover rounded-md border border-slate-200"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-navy truncate">{item.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs font-bold text-indigo">₹{item.retailPrice}</span>
                              <span className="text-[11px] text-slate-400 line-through">₹{item.mrp}</span>
                              <span className="text-[10px] bg-indigo-light text-indigo px-1.5 rounded font-semibold">
                                {item.subcategory}
                              </span>
                            </div>
                          </div>
                        </Link>
                      ))
                    ) : (
                      <div className="px-4 py-6 text-center text-xs text-slate-500">
                        No direct matches found for "{searchInput}". Press search to view all results.
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

          {/* Quick Actions: Account, RFQ, Cart */}
          <div className="flex items-center gap-3">
            {/* Wholesale RFQ Quick Link */}
            <Link
              to="/wholesale"
              className="hidden lg:flex items-center gap-1.5 px-3 py-2 bg-indigo-light text-indigo hover:bg-indigo hover:text-white rounded-xl text-xs font-bold transition"
            >
              <Building2 className="w-4 h-4" />
              <span>Bulk RFQ</span>
            </Link>

            {/* Account Link */}
            <Link
              to="/account"
              className="flex items-center gap-2 p-2 hover:bg-slate-100 rounded-xl transition text-slate-700 hover:text-navy"
            >
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs">
                {currentUser.name.charAt(0)}
              </div>
              <div className="hidden xl:block text-left">
                <p className="text-[11px] text-slate-500 font-medium">Hello, {currentUser.name.split(' ')[0]}</p>
                <p className="text-xs font-bold text-navy">Orders & Profile</p>
              </div>
            </Link>

            {/* Shopping Cart Drawer Link */}
            <Link
              to="/cart"
              className="flex items-center gap-2 bg-navy hover:bg-navy-800 text-white px-3.5 py-2 rounded-xl transition shadow-sm group"
            >
              <div className="relative">
                <ShoppingCart className="w-5 h-5 text-champagne" />
                {cartTotalItemsCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-indigo text-white font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-navy">
                    {cartTotalItemsCount}
                  </span>
                )}
              </div>
              <div className="hidden sm:block text-left text-xs">
                <p className="text-[10px] text-slate-300 font-medium">Your Cart</p>
                <p className="font-bold text-white">₹{cartSubtotal.toLocaleString('en-IN')}</p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* 3. Category & Department Navigation Bar */}
      <nav className="bg-white border-b border-slate-200 px-4 sm:px-6 overflow-x-auto hide-scrollbar">
        <div className="max-w-7xl mx-auto flex items-center gap-6 py-2.5 text-xs font-semibold text-slate-700 whitespace-nowrap">
          <Link
            to="/catalog"
            className="flex items-center gap-1.5 text-navy hover:text-indigo transition font-bold"
          >
            <Layers className="w-3.5 h-3.5 text-indigo" />
            <span>Shop All Products</span>
          </Link>

          <span className="text-slate-300">|</span>

          <Link
            to="/category/textile"
            className="hover:text-indigo transition flex items-center gap-1"
          >
            <span>Textile</span>
            <span className="text-[10px] text-slate-400 font-normal">(Bedsheets, Curtains, Linen)</span>
          </Link>

          <Link
            to="/category/cotton-products"
            className="hover:text-indigo transition flex items-center gap-1"
          >
            <span>Cotton Products</span>
            <span className="text-[10px] text-slate-400 font-normal">(Bath Towels, Canvas Bags)</span>
          </Link>

          <Link
            to="/category/home-kitchen"
            className="hover:text-indigo transition flex items-center gap-1"
          >
            <span>Home and Kitchen</span>
            <span className="text-[10px] text-slate-400 font-normal">(Kitchen Towels, Aprons)</span>
          </Link>

          <Link
            to="/category/household"
            className="hover:text-indigo transition flex items-center gap-1"
          >
            <span>Household</span>
            <span className="text-[10px] text-slate-400 font-normal">(Microfiber, Dusters)</span>
          </Link>

          <span className="text-slate-300">|</span>

          <Link
            to="/catalog?filter=bestseller"
            className="text-amber-800 hover:text-amber-900 transition flex items-center gap-1"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Best Sellers</span>
          </Link>

          <Link
            to="/wholesale"
            className="text-indigo hover:text-indigo-dark font-bold transition flex items-center gap-1"
          >
            <span>Wholesale Deals & Bulk Orders</span>
            <Badge variant="champagne" size="sm">Mill Rates</Badge>
          </Link>

          <Link
            to="/orders"
            className="text-slate-600 hover:text-navy ml-auto transition"
          >
            Track Order
          </Link>
        </div>
      </nav>

      {/* PIN Code Checker Modal */}
      {pinModalOpen && (
        <div className="fixed inset-0 z-50 bg-navy/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-premium animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-indigo" />
                <h3 className="font-bold text-navy">Check Delivery PIN</h3>
              </div>
              <button onClick={() => setPinModalOpen(false)} className="text-slate-400 hover:text-navy">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-600 mb-4">
              Enter your 6-digit Indian postal code to verify direct dispatch availability and estimated delivery days.
            </p>
            <form onSubmit={handlePincodeSubmit} className="space-y-4">
              <div>
                <input
                  type="text"
                  maxLength={6}
                  value={pinInput}
                  onChange={e => setPinInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 395002, 110001, 560001"
                  className="w-full text-center text-lg font-mono tracking-widest px-4 py-2 border border-slate-300 rounded-xl focus:border-indigo focus:ring-2 focus:ring-indigo/20 outline-none"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                className="w-full bg-indigo hover:bg-indigo-dark text-white py-2.5 rounded-xl font-semibold text-xs transition"
              >
                Verify Serviceability
              </button>
            </form>

            {deliveryInfo && (
              <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <p className="font-bold text-slate-800">
                  {deliveryInfo.city}, {deliveryInfo.state} ({deliveryInfo.pincode})
                </p>
                <p className="text-emerald-700 mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
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
              <Link to="/wholesale" onClick={() => setMobileMenuOpen(false)} className="block py-1 text-indigo">
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
