import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CouponOffer } from '../../types';
import {
  Tag,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Percent,
  Sparkles,
  Zap,
  Building2,
  ShoppingBag,
  RotateCcw,
  Search,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';
import { INITIAL_COUPONS } from '../../data/initialCoupons';

export const CouponOfferManager: React.FC = () => {
  const {
    coupons,
    addCoupon,
    updateCoupon,
    deleteCoupon,
    toggleCouponActive,
    toggleCouponFeatured
  } = useApp();

  const [search, setSearch] = useState('');
  const [filterAudience, setFilterAudience] = useState<'ALL' | 'B2B' | 'B2C'>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponOffer | null>(null);

  const [formData, setFormData] = useState<{
    code: string;
    title: string;
    description: string;
    discountType: 'FLAT' | 'PERCENTAGE';
    discountValue: number;
    minOrderValue: number;
    maxDiscountAmount: string;
    applicableFor: 'ALL' | 'B2B' | 'B2C';
    validUntil: string;
    isActive: boolean;
    isFeatured: boolean;
  }>({
    code: '',
    title: '',
    description: '',
    discountType: 'FLAT',
    discountValue: 150,
    minOrderValue: 0,
    maxDiscountAmount: '',
    applicableFor: 'ALL',
    validUntil: '',
    isActive: true,
    isFeatured: true
  });

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleOpenCreate = () => {
    setEditingCoupon(null);
    setFormData({
      code: '',
      title: '',
      description: '',
      discountType: 'FLAT',
      discountValue: 100,
      minOrderValue: 0,
      maxDiscountAmount: '',
      applicableFor: 'ALL',
      validUntil: '',
      isActive: true,
      isFeatured: true
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (coupon: CouponOffer) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      title: coupon.title,
      description: coupon.description,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minOrderValue: coupon.minOrderValue,
      maxDiscountAmount: coupon.maxDiscountAmount ? coupon.maxDiscountAmount.toString() : '',
      applicableFor: coupon.applicableFor,
      validUntil: coupon.validUntil ? coupon.validUntil.slice(0, 10) : '',
      isActive: coupon.isActive,
      isFeatured: coupon.isFeatured
    });
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = formData.code.trim().toUpperCase().replace(/\s+/g, '');
    if (!cleanCode) return;

    const payload = {
      code: cleanCode,
      title: formData.title.trim(),
      description: formData.description.trim(),
      discountType: formData.discountType,
      discountValue: Number(formData.discountValue),
      minOrderValue: Number(formData.minOrderValue) || 0,
      maxDiscountAmount: formData.maxDiscountAmount ? Number(formData.maxDiscountAmount) : undefined,
      applicableFor: formData.applicableFor,
      validUntil: formData.validUntil ? new Date(formData.validUntil).toISOString() : undefined,
      isActive: formData.isActive,
      isFeatured: formData.isFeatured
    };

    if (editingCoupon) {
      updateCoupon(editingCoupon.id, payload);
    } else {
      // Check duplicate code
      const exists = coupons.some(c => c.code.toUpperCase() === cleanCode);
      if (exists) {
        alert(`A coupon with code "${cleanCode}" already exists. Please choose a different code or edit the existing one.`);
        return;
      }
      addCoupon(payload);
    }

    setModalOpen(false);
  };

  const handleResetDefaults = () => {
    if (confirm('Restore factory mill default coupons (LAUNCH150, MILLDIRECT10, BULK500, MAHALAXMI20)? Custom coupons will remain intact.')) {
      INITIAL_COUPONS.forEach(ic => {
        const found = coupons.find(c => c.code === ic.code);
        if (!found) {
          addCoupon({
            code: ic.code,
            title: ic.title,
            description: ic.description,
            discountType: ic.discountType,
            discountValue: ic.discountValue,
            minOrderValue: ic.minOrderValue,
            maxDiscountAmount: ic.maxDiscountAmount,
            applicableFor: ic.applicableFor,
            isActive: ic.isActive,
            isFeatured: ic.isFeatured
          });
        }
      });
      alert('Factory mill coupons verified & restored.');
    }
  };

  // Filtered List
  const filteredCoupons = coupons.filter(c => {
    const matchesSearch =
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase());

    const matchesAudience = filterAudience === 'ALL' || c.applicableFor === filterAudience || c.applicableFor === 'ALL';
    const matchesStatus =
      filterStatus === 'ALL' ||
      (filterStatus === 'ACTIVE' && c.isActive) ||
      (filterStatus === 'INACTIVE' && !c.isActive);

    return matchesSearch && matchesAudience && matchesStatus;
  });

  const activeCount = coupons.filter(c => c.isActive).length;
  const featuredCount = coupons.filter(c => c.isActive && c.isFeatured).length;
  const b2bCount = coupons.filter(c => c.applicableFor === 'B2B').length;
  const totalClaims = coupons.reduce((sum, c) => sum + (c.usedCount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-navy via-indigo-950 to-indigo-900 rounded-3xl p-6 text-white shadow-premium border border-indigo-700/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full bg-gradient-to-l from-champagne/10 to-transparent pointer-events-none" />
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-champagne text-navy uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 fill-navy" />
                Dynamic Offer Engine
              </span>
              <span className="text-xs text-slate-300">Live Real-Time Sync</span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Promotional Coupons & Mill Offers Manager
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Create, modify, activate, or feature discount codes. Any coupon added or toggled here
              instantly reflects on the storefront Cart 1-click apply chips, abandoned cart recovery, and mobile app checkout!
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={handleResetDefaults}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-white/10"
              title="Reset default mill launch promo codes"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restore Factory Defaults</span>
            </button>
            <button
              onClick={handleOpenCreate}
              className="px-5 py-2.5 bg-champagne hover:bg-champagne-light text-navy rounded-xl text-xs font-black transition flex items-center gap-2 shadow-lg shadow-champagne/20"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Coupon</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-400">Active Coupons</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <p className="text-2xl font-black text-navy">{activeCount}</p>
          <p className="text-[11px] text-slate-500">Live in system / ready to claim</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-400">Featured On Cart</span>
            <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600">{featuredCount}</p>
          <p className="text-[11px] text-slate-500">1-Click Apply chips on Cart Page</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-400">B2B Deals</span>
            <Building2 className="w-4 h-4 text-indigo" />
          </div>
          <p className="text-2xl font-black text-indigo">{b2bCount}</p>
          <p className="text-[11px] text-slate-500">Restricted to GST verified buyers</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-400">Total Discount Claims</span>
            <Tag className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-600">{totalClaims}</p>
          <p className="text-[11px] text-slate-500">Orders redeemed with coupons</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-subtle flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search coupon code or title..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:border-indigo outline-none"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto">
          {/* Audience Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
            <button
              onClick={() => setFilterAudience('ALL')}
              className={`px-3 py-1 rounded-lg transition ${filterAudience === 'ALL' ? 'bg-white text-navy shadow-sm' : 'hover:text-navy'}`}
            >
              All Audiences
            </button>
            <button
              onClick={() => setFilterAudience('B2C')}
              className={`px-3 py-1 rounded-lg transition ${filterAudience === 'B2C' ? 'bg-white text-navy shadow-sm' : 'hover:text-navy'}`}
            >
              B2C Retail
            </button>
            <button
              onClick={() => setFilterAudience('B2B')}
              className={`px-3 py-1 rounded-lg transition ${filterAudience === 'B2B' ? 'bg-white text-navy shadow-sm' : 'hover:text-navy'}`}
            >
              B2B Wholesale
            </button>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
            <button
              onClick={() => setFilterStatus('ALL')}
              className={`px-2.5 py-1 rounded-lg transition ${filterStatus === 'ALL' ? 'bg-white text-navy shadow-sm' : 'hover:text-navy'}`}
            >
              All ({coupons.length})
            </button>
            <button
              onClick={() => setFilterStatus('ACTIVE')}
              className={`px-2.5 py-1 rounded-lg transition ${filterStatus === 'ACTIVE' ? 'bg-emerald-600 text-white shadow-sm' : 'hover:text-navy'}`}
            >
              Active ({activeCount})
            </button>
            <button
              onClick={() => setFilterStatus('INACTIVE')}
              className={`px-2.5 py-1 rounded-lg transition ${filterStatus === 'INACTIVE' ? 'bg-slate-400 text-white shadow-sm' : 'hover:text-navy'}`}
            >
              Inactive
            </button>
          </div>
        </div>
      </div>

      {/* Coupons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCoupons.map(coupon => {
          const isFlat = coupon.discountType === 'FLAT';
          const isExpired = coupon.validUntil && new Date(coupon.validUntil).getTime() < Date.now();

          return (
            <div
              key={coupon.id}
              className={`bg-white rounded-3xl border transition-all duration-200 p-5 flex flex-col justify-between shadow-subtle hover:shadow-md relative overflow-hidden ${
                !coupon.isActive
                  ? 'border-slate-200 bg-slate-50/60 opacity-80'
                  : coupon.isFeatured
                  ? 'border-amber-400/80 ring-1 ring-amber-400/30'
                  : 'border-slate-200'
              }`}
            >
              {/* Featured Ribbon / Badge */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span
                    className={`font-mono font-black text-sm px-2.5 py-1 rounded-xl tracking-wider border flex items-center gap-1.5 ${
                      coupon.isActive
                        ? 'bg-navy text-champagne border-navy'
                        : 'bg-slate-200 text-slate-500 border-slate-300'
                    }`}
                  >
                    <Tag className="w-3.5 h-3.5 text-champagne" />
                    <span>{coupon.code}</span>
                  </span>

                  <button
                    onClick={() => handleCopy(coupon.code)}
                    className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
                    title="Copy coupon code"
                  >
                    {copiedCode === coupon.code ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  {coupon.isFeatured && coupon.isActive && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                      <Zap className="w-3 h-3 fill-amber-500 text-amber-600" />
                      Featured Chip
                    </span>
                  )}
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      !coupon.isActive
                        ? 'bg-slate-200 text-slate-600'
                        : isExpired
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {!coupon.isActive ? 'Inactive' : isExpired ? 'Expired' : 'Active'}
                  </span>
                </div>
              </div>

              {/* Offer Details */}
              <div className="space-y-2 mb-4">
                <h4 className="font-extrabold text-navy text-sm">{coupon.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                  {coupon.description}
                </p>

                {/* Discount Badge & Rules */}
                <div className="pt-2 flex flex-wrap gap-2 text-[11px]">
                  <span className="font-black text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1">
                    {isFlat ? (
                      <>₹{coupon.discountValue} FLAT OFF</>
                    ) : (
                      <>{coupon.discountValue}% OFF {coupon.maxDiscountAmount ? `(Max ₹${coupon.maxDiscountAmount})` : ''}</>
                    )}
                  </span>

                  <span className="font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                    {coupon.minOrderValue > 0 ? `Min ₹${coupon.minOrderValue.toLocaleString('en-IN')}` : 'No Min Spend'}
                  </span>

                  <span className={`font-semibold px-2.5 py-1 rounded-lg ${
                    coupon.applicableFor === 'B2B'
                      ? 'bg-indigo/10 text-indigo font-bold'
                      : coupon.applicableFor === 'B2C'
                      ? 'bg-teal-50 text-teal-800'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {coupon.applicableFor === 'B2B' ? '🏢 B2B Only' : coupon.applicableFor === 'B2C' ? '🛍️ B2C Retail' : '🌐 All Shoppers'}
                  </span>
                </div>

                {coupon.validUntil && (
                  <div className="text-[10px] text-slate-400 flex items-center gap-1 pt-1 font-medium">
                    <Calendar className="w-3 h-3" />
                    <span>Valid until: {new Date(coupon.validUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                )}
              </div>

              {/* Footer Controls */}
              <div className="pt-3 border-t border-slate-100 space-y-2.5">
                {/* Instant Toggles */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-500 font-medium">Live Status</span>
                  <button
                    onClick={() => toggleCouponActive(coupon.id)}
                    className={`px-3 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1.5 ${
                      coupon.isActive
                        ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                        : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                    }`}
                  >
                    {coupon.isActive ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    <span>{coupon.isActive ? 'Active (Live)' : 'Disabled'}</span>
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-500 font-medium">1-Click Cart Chip</span>
                  <button
                    onClick={() => toggleCouponFeatured(coupon.id)}
                    className={`px-3 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1.5 ${
                      coupon.isFeatured
                        ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                    title="Toggle whether this coupon appears directly on the Cart page for 1-click apply"
                  >
                    <Zap className="w-3 h-3 fill-current" />
                    <span>{coupon.isFeatured ? 'Featured on Cart' : 'Hidden from Cart'}</span>
                  </button>
                </div>

                {/* Edit & Delete Actions */}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-[10px] text-slate-400 font-medium">
                    Used: <strong className="text-slate-700">{coupon.usedCount || 0}</strong> times
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(coupon)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-indigo hover:text-white rounded-lg text-slate-600 text-xs font-bold transition flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete coupon code "${coupon.code}"?`)) {
                          deleteCoupon(coupon.id);
                        }
                      }}
                      className="p-1 hover:bg-rose-100 text-slate-400 hover:text-rose-600 rounded-lg transition"
                      title="Delete coupon"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {filteredCoupons.length === 0 && (
          <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-slate-200 p-8 space-y-3">
            <Tag className="w-12 h-12 text-slate-300 mx-auto" />
            <h4 className="font-extrabold text-navy text-base">No coupons match your current filter</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Try adjusting your search query, or click below to create a new promotional coupon code.
            </p>
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 bg-indigo text-white font-bold text-xs rounded-xl hover:bg-indigo-dark transition inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Coupon</span>
            </button>
          </div>
        )}
      </div>

      {/* Create / Edit Coupon Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-premium space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-lg text-navy">
                  {editingCoupon ? `Edit Coupon: ${editingCoupon.code}` : 'Create New Mill Promo Coupon'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure discount formula, spend thresholds, and visibility.
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Coupon Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DIWALI500"
                    value={formData.code}
                    onChange={e =>
                      setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s+/g, '') })
                    }
                    className="w-full p-2.5 border border-slate-300 rounded-xl outline-none font-mono font-black uppercase text-sm tracking-wider focus:border-indigo"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Discount Type *
                  </label>
                  <select
                    value={formData.discountType}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        discountType: e.target.value as 'FLAT' | 'PERCENTAGE'
                      })
                    }
                    className="w-full p-2.5 border border-slate-300 rounded-xl outline-none bg-white font-bold"
                  >
                    <option value="FLAT">Flat ₹ Rupees Off</option>
                    <option value="PERCENTAGE">Percentage (%) Off</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Offer Title / Badge Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Festival Mill Direct Offer"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:border-indigo font-bold"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Description / Terms *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Instant 15% discount on direct loom bedsheets and towels above ₹2,000"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:border-indigo"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    {formData.discountType === 'FLAT' ? 'Discount Amount (₹) *' : 'Discount Percent (%) *'}
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formData.discountValue}
                    onChange={e => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl outline-none font-bold text-indigo"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Min Order Value (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    placeholder="0 for none"
                    value={formData.minOrderValue}
                    onChange={e => setFormData({ ...formData, minOrderValue: Number(e.target.value) })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Max Cap Amount (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    disabled={formData.discountType === 'FLAT'}
                    placeholder={formData.discountType === 'FLAT' ? 'N/A for flat' : 'Optional cap'}
                    value={formData.maxDiscountAmount}
                    onChange={e => setFormData({ ...formData, maxDiscountAmount: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl outline-none disabled:bg-slate-100 disabled:text-slate-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Eligible Audience
                  </label>
                  <select
                    value={formData.applicableFor}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        applicableFor: e.target.value as 'ALL' | 'B2B' | 'B2C'
                      })
                    }
                    className="w-full p-2.5 border border-slate-300 rounded-xl outline-none bg-white font-semibold"
                  >
                    <option value="ALL">All Customers (B2C & B2B)</option>
                    <option value="B2B">B2B Wholesale Verified Only</option>
                    <option value="B2C">B2C Retail Only</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Expiry Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={formData.validUntil}
                    onChange={e => setFormData({ ...formData, validUntil: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl outline-none"
                  />
                </div>
              </div>

              {/* Checkboxes */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-indigo rounded"
                  />
                  <div>
                    <span className="font-bold text-slate-800 block">Make Active Immediately</span>
                    <span className="text-[10px] text-slate-500">
                      Shoppers can redeem this code during checkout.
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={e => setFormData({ ...formData, isFeatured: e.target.checked })}
                    className="w-4 h-4 text-amber-500 rounded"
                  />
                  <div>
                    <span className="font-bold text-slate-800 block">
                      Feature on Cart Page (1-Click Apply Chip)
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Displays in the promotional chips box on the Cart so users don't need to type the code manually.
                    </span>
                  </div>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-600 font-semibold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-navy hover:bg-navy-800 text-white font-black rounded-xl transition flex items-center gap-2 shadow-md"
                >
                  <Check className="w-4 h-4 text-champagne" />
                  <span>{editingCoupon ? 'Save Changes' : 'Publish Coupon Code'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
