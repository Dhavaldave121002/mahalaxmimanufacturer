import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Address } from '../types';
import {
  User as UserIcon,
  Building2,
  MapPin,
  Package,
  Clock,
  ShieldCheck,
  CreditCard,
  Plus,
  Edit2,
  CheckCircle2,
  LogOut,
  ArrowRight,
  FileText,
  Send,
  Sparkles,
  Star
} from 'lucide-react';
import { Badge } from '../components/common/Badge';

export const AccountPage: React.FC = () => {
  const { currentUser, isLoggedIn, logout, updateUserProfile, addSavedAddress, orders, quotations, submitBusinessEnquiry } = useApp();

  const userOrdersCount = currentUser?.role === 'admin'
    ? (orders?.length || 0)
    : (orders || []).filter(
        o =>
          (currentUser?.email && o.customer?.email?.toLowerCase() === currentUser.email.toLowerCase()) ||
          (currentUser?.id && o.customer?.id === currentUser.id) ||
          (currentUser?.phone &&
            o.customer?.phone &&
            currentUser.phone.replace(/\D/g, '').length >= 10 &&
            o.customer.phone.replace(/\D/g, '').endsWith(currentUser.phone.replace(/\D/g, '').slice(-10)))
      ).length;

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    companyName: currentUser?.companyName || '',
    gstNumber: currentUser?.gstNumber || '',
    businessType: currentUser?.businessType || 'Retailer'
  });

    
  // User's Submitted Reviews State
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [myReviews, setMyReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  const fetchMyReviews = async () => {
    if (!currentUser?.email) return;
    setReviewsLoading(true);
    try {
      const res = await fetch(`/api/products?action=reviews&email=${encodeURIComponent(currentUser.email.toLowerCase())}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.reviews)) {
          setMyReviews(json.reviews);
        }
      }
    } catch (_) {}
    finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    fetchMyReviews();
  }, [currentUser?.email]);

  const [showEnquiryModal, setShowEnquiryModal] = useState(false);
  const [enquirySuccess, setEnquirySuccess] = useState(false);
  const [enquirySubmitting, setEnquirySubmitting] = useState(false);
  const [enquiryForm, setEnquiryForm] = useState({
    businessName: currentUser?.companyName || '',
    fullName: currentUser?.name || '',
    phone: currentUser?.phone || '',
    email: currentUser?.email || '',
    businessType: currentUser?.businessType || 'Retailer',
    city: currentUser?.addresses?.[0]?.city || 'Surat',
    state: currentUser?.addresses?.[0]?.state || 'Gujarat',
    expectedMonthlyVolume: '₹1,00,000 - ₹5,00,000',
    notes: ''
  });

  const handleEnquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enquiryForm.notes.trim()) return;
    setEnquirySubmitting(true);
    try {
      submitBusinessEnquiry({
        businessName: enquiryForm.businessName || currentUser?.companyName || 'Business Buyer',
        fullName: enquiryForm.fullName || currentUser?.name || 'Valued Buyer',
        phone: enquiryForm.phone || currentUser?.phone || '',
        email: enquiryForm.email || currentUser?.email || '',
        businessType: enquiryForm.businessType as any,
        city: enquiryForm.city,
        state: enquiryForm.state,
        expectedMonthlyVolume: enquiryForm.expectedMonthlyVolume,
        interestedCategories: ['textile', 'cotton-products'],
        notes: enquiryForm.notes
      });
      setEnquirySuccess(true);
      setTimeout(() => {
        setEnquirySuccess(false);
        setShowEnquiryModal(false);
        setEnquiryForm(prev => ({ ...prev, notes: '' }));
      }, 2500);
    } finally {
      setEnquirySubmitting(false);
    }
  };

  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState<Omit<Address, 'id'>>({
    fullName: currentUser?.name || '',
    phone: currentUser?.phone || '',
    street: '',
    city: 'Surat',
    state: 'Gujarat',
    pincode: '395002',
    addressType: 'COMMERCIAL'
  });

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile(profileForm);
    setIsEditingProfile(false);
  };

  const handleAddAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddress.street || !newAddress.pincode) return;
    addSavedAddress(newAddress);
    setShowAddressForm(false);
  };

  if (!isLoggedIn) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 sm:py-24 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-indigo-light text-indigo flex items-center justify-center mx-auto shadow-sm">
          <UserIcon className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black text-navy">
            Sign In to Your Account
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            Please sign in to access your direct mill orders, tracking history, GST invoices, and commercial rate agreements.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            to="/login"
            className="w-full sm:w-auto px-8 py-3 bg-navy hover:bg-navy-800 text-white rounded-xl font-bold text-sm transition shadow-premium flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Sign In / Login</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/register"
            className="w-full sm:w-auto px-8 py-3 bg-white hover:bg-slate-50 text-navy border border-slate-300 rounded-xl font-bold text-sm transition cursor-pointer"
          >
            Create Free Account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 pb-20">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-navy tracking-tight">
            Commercial Account & Business Settings
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your corporate profile, GST credentials, delivery addresses, and credit line.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={currentUser.role === 'consumer' ? 'outline' : 'primary'}>
            {currentUser.role === 'consumer' ? 'Retail Consumer' : `${currentUser.businessType || 'B2B'} Account`}
          </Badge>
          {currentUser.isGstVerified && (
            <Badge variant="success" size="sm">
              GST Verified
            </Badge>
          )}
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:text-error hover:border-error/40 hover:bg-red-50 transition cursor-pointer"
            title="Sign out of account"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Business Profile Card */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-subtle space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo text-champagne font-black text-xl flex items-center justify-center">
                  {currentUser.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-navy">{currentUser.name}</h3>
                  <p className="text-xs text-slate-500">{currentUser.email}</p>
                </div>
              </div>

              <button
                onClick={() => setIsEditingProfile(!isEditingProfile)}
                className="text-xs font-bold text-indigo hover:underline flex items-center gap-1"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>{isEditingProfile ? 'Cancel' : 'Edit'}</span>
              </button>
            </div>

            {/* Profile Info or Edit Form */}
            {isEditingProfile ? (
              <form onSubmit={handleProfileSave} className="space-y-3 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Full Name</label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Email</label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={e => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Phone</label>
                  <input
                    type="tel"
                    value={profileForm.phone}
                    onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Company / Trade Name</label>
                  <input
                    type="text"
                    value={profileForm.companyName}
                    onChange={e => setProfileForm({ ...profileForm, companyName: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">GSTIN Number</label>
                  <input
                    type="text"
                    maxLength={15}
                    value={profileForm.gstNumber}
                    onChange={e => setProfileForm({ ...profileForm, gstNumber: e.target.value.toUpperCase() })}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono uppercase outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo text-white font-bold rounded-xl text-xs hover:bg-indigo-dark transition"
                >
                  Save Business Profile
                </button>
              </form>
            ) : (
              <div className="space-y-3 text-xs text-slate-600">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span>Phone Number:</span>
                  <span className="font-semibold text-navy">{currentUser.phone}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span>Company Name:</span>
                  <span className="font-semibold text-navy">{currentUser.companyName || 'Not specified'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span>GSTIN Number:</span>
                  <span className="font-mono font-semibold text-navy">{currentUser.gstNumber || 'Not configured'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span>Business Category:</span>
                  <span className="font-semibold text-navy">{currentUser.businessType || 'Retail'}</span>
                </div>
              </div>
            )}

            {/* Credit Limit Meter for B2B */}
            {currentUser.creditLimit && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between items-center font-bold text-navy">
                  <span className="flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-indigo" />
                    <span>30-Day B2B Trade Line</span>
                  </span>
                  <span className="text-emerald-700">Active</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo h-full rounded-full"
                    style={{
                      width: `${Math.round(((currentUser.availableCredit || 0) / currentUser.creditLimit) * 100)}%`
                    }}
                  ></div>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Available: ₹{currentUser.availableCredit?.toLocaleString('en-IN')}</span>
                  <span>Total Limit: ₹{currentUser.creditLimit?.toLocaleString('en-IN')}</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick shortcuts */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link
              to="/orders"
              className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-indigo transition shadow-subtle text-xs space-y-1 block"
            >
              <Package className="w-5 h-5 text-indigo mb-1" />
              <p className="font-bold text-navy">Track Consignments</p>
              <p className="text-[11px] text-slate-500">{userOrdersCount} {userOrdersCount === 1 ? 'order' : 'orders'} on file</p>
            </Link>

            <button
              type="button"
              onClick={() => setShowEnquiryModal(true)}
              className="p-4 bg-gradient-to-br from-indigo-50 to-white rounded-2xl border border-indigo/20 hover:border-indigo transition shadow-subtle text-xs space-y-1 block text-left w-full group cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <FileText className="w-5 h-5 text-indigo group-hover:scale-110 transition-transform mb-1" />
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo text-white uppercase tracking-wider">Fast RFQ</span>
              </div>
              <p className="font-bold text-navy">Custom Requirement</p>
              <p className="text-[11px] text-slate-500">Send quotes to Admin</p>
            </button>

            <button
              type="button"
              onClick={() => setShowReviewsModal(true)}
              className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-indigo transition shadow-subtle text-xs space-y-1 block text-left w-full group cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <Star className="w-5 h-5 text-amber-500 fill-amber-400 group-hover:scale-110 transition-transform mb-1" />
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  {myReviews.length}
                </span>
              </div>
              <p className="font-bold text-navy">My Reviews</p>
              <p className="text-[11px] text-slate-500">{myReviews.length} reviews submitted</p>
            </button>
          </div>
        </div>

        {/* Right Column: Address Book Management */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-subtle space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-base text-navy">Saved Consignment Addresses</h3>
              <p className="text-xs text-slate-500 mt-0.5">Manage delivery docks, retail stores, and warehouse destinations.</p>
            </div>

            <button
              onClick={() => setShowAddressForm(!showAddressForm)}
              className="px-3.5 py-1.5 bg-indigo-light text-indigo hover:bg-indigo hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Address</span>
            </button>
          </div>

          {/* New address form */}
          {showAddressForm && (
            <form onSubmit={handleAddAddress} className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs">
              <h4 className="font-bold text-navy">New Address Record</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Contact Name"
                  value={newAddress.fullName}
                  onChange={e => setNewAddress({ ...newAddress, fullName: e.target.value })}
                  className="p-2 border border-slate-300 rounded-lg outline-none"
                />
                <input
                  type="tel"
                  required
                  placeholder="Contact Phone"
                  value={newAddress.phone}
                  onChange={e => setNewAddress({ ...newAddress, phone: e.target.value })}
                  className="p-2 border border-slate-300 rounded-lg outline-none"
                />
                <input
                  type="text"
                  required
                  placeholder="Street / Unit / Estate"
                  value={newAddress.street}
                  onChange={e => setNewAddress({ ...newAddress, street: e.target.value })}
                  className="sm:col-span-2 p-2 border border-slate-300 rounded-lg outline-none"
                />
                <input
                  type="text"
                  required
                  placeholder="City"
                  value={newAddress.city}
                  onChange={e => setNewAddress({ ...newAddress, city: e.target.value })}
                  className="p-2 border border-slate-300 rounded-lg outline-none"
                />
                <input
                  type="text"
                  maxLength={6}
                  required
                  placeholder="6-Digit PIN code"
                  value={newAddress.pincode}
                  onChange={e => setNewAddress({ ...newAddress, pincode: e.target.value })}
                  className="p-2 border border-slate-300 rounded-lg outline-none font-mono"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo text-white font-bold rounded-lg text-xs hover:bg-indigo-dark transition"
              >
                Save Delivery Destination
              </button>
            </form>
          )}

          {/* List of saved addresses */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(currentUser?.addresses || []).map(addr => (
              <div
                key={addr.id}
                className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-1.5 text-xs relative"
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-navy">{addr.fullName}</span>
                  <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-bold">
                    {addr.addressType}
                  </span>
                </div>
                {addr.companyName && <p className="font-semibold text-slate-700">{addr.companyName}</p>}
                <p className="text-slate-600">{addr.street}</p>
                <p className="text-slate-600">{addr.city}, {addr.state} - {addr.pincode}</p>
                <p className="text-slate-500">Phone: {addr.phone}</p>
                {addr.isDefault && (
                  <span className="inline-block text-[10px] text-indigo font-bold bg-indigo-light px-2 py-0.5 rounded">
                    Default Destination
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Custom Requirement / Business Enquiry Modal */}
      {showEnquiryModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo/10 text-indigo flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-navy">Custom Bulk Requirement</h3>
                  <p className="text-xs text-slate-500">Direct Mill Quotation & Sourcing</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEnquiryModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {enquirySuccess ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="font-extrabold text-navy text-lg">Requirement Submitted!</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Our admin team has received your requirement. An instant notification has been dispatched to <b>mahalaxmienterpriseuk@gmail.com</b> and our team will revert within 2 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleEnquirySubmit} className="space-y-4 text-xs">
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center gap-2 text-amber-800">
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Your account details are pre-filled below for fastest turnaround.</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Company / Brand Name</label>
                    <input
                      type="text"
                      required
                      value={enquiryForm.businessName}
                      onChange={e => setEnquiryForm({ ...enquiryForm, businessName: e.target.value })}
                      className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:border-indigo"
                      placeholder="e.g. Surat Textiles Ltd"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Contact Person</label>
                    <input
                      type="text"
                      required
                      value={enquiryForm.fullName}
                      onChange={e => setEnquiryForm({ ...enquiryForm, fullName: e.target.value })}
                      className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:border-indigo"
                      placeholder="Your Full Name"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Mobile / WhatsApp</label>
                    <input
                      type="tel"
                      required
                      value={enquiryForm.phone}
                      onChange={e => setEnquiryForm({ ...enquiryForm, phone: e.target.value })}
                      className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:border-indigo"
                      placeholder="10-digit mobile"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Work Email</label>
                    <input
                      type="email"
                      required
                      value={enquiryForm.email}
                      onChange={e => setEnquiryForm({ ...enquiryForm, email: e.target.value })}
                      className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:border-indigo"
                      placeholder="email@company.com"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Expected Monthly Volume</label>
                    <select
                      value={enquiryForm.expectedMonthlyVolume}
                      onChange={e => setEnquiryForm({ ...enquiryForm, expectedMonthlyVolume: e.target.value })}
                      className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:border-indigo bg-white"
                    >
                      <option value="₹50,000 - ₹2,00,000">₹50,000 - ₹2,00,000</option>
                      <option value="₹2,00,000 - ₹5,00,000">₹2,00,000 - ₹5,00,000</option>
                      <option value="₹5,00,000 - ₹20,00,000">₹5,00,000 - ₹20,00,000</option>
                      <option value="₹20,00,000+ (Institutional)">₹20,00,000+ (Institutional)</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Destination City</label>
                    <input
                      type="text"
                      required
                      value={enquiryForm.city}
                      onChange={e => setEnquiryForm({ ...enquiryForm, city: e.target.value })}
                      className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:border-indigo"
                      placeholder="e.g. Ahmedabad, Mumbai"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Requirement Details & Specifications *</label>
                  <textarea
                    required
                    rows={3}
                    value={enquiryForm.notes}
                    onChange={e => setEnquiryForm({ ...enquiryForm, notes: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:border-indigo"
                    placeholder="Enter fabric specifications, GSM, thread count, packing requirements, delivery dates..."
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowEnquiryModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-bold hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={enquirySubmitting}
                    className="px-6 py-2.5 bg-navy hover:bg-navy-800 text-white font-bold rounded-xl shadow-md transition flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>{enquirySubmitting ? 'Submitting...' : 'Submit Requirement to Admin'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}


      {/* My Reviews Modal (Matching Mobile App "My Reviews") */}
      {showReviewsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative space-y-5 animate-in fade-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
                  <Star className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-navy">My Product Reviews</h3>
                  <p className="text-xs text-slate-500">All reviews submitted by you ({myReviews.length} items)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowReviewsModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto space-y-3 pr-1 grow">
              {reviewsLoading ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  Loading your verified reviews from central database...
                </div>
              ) : myReviews.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                    <Star className="w-6 h-6" />
                  </div>
                  <p className="font-bold text-navy text-sm">No reviews submitted yet</p>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    Visit any product detail page and click "Write a Product Review" to share your feedback.
                  </p>
                </div>
              ) : (
                myReviews.map(r => (
                  <div key={r.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-navy text-xs sm:text-sm">{r.product_title || r.productTitle || 'Direct Mill Product'}</h4>
                        <div className="flex items-center gap-1 text-amber-500 mt-1">
                          {[1, 2, 3, 4, 5].map(st => (
                            <Star
                              key={st}
                              className={`w-3.5 h-3.5 ${st <= Math.round(Number(r.rating || 5)) ? 'fill-current' : 'text-slate-200'}`}
                            />
                          ))}
                          <span className="text-[11px] font-bold text-slate-700 ml-1">{r.rating} / 5</span>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {new Date(r.created_at || r.createdAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>

                    <p className="text-slate-600 bg-white p-3 rounded-xl border border-slate-100 leading-relaxed">
                      "{r.comment}"
                    </p>

                    <div className="flex items-center justify-between text-[10px] pt-1 text-slate-400">
                      <span className="text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">
                        ✓ Verified Purchase Review
                      </span>
                      <span>Source: {r.source || 'WEB'}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setShowReviewsModal(false)}
                className="px-5 py-2 bg-navy text-white font-bold rounded-xl text-xs hover:bg-navy-800 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
