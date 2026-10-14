import React, { useState } from 'react';
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
  CheckCircle2
} from 'lucide-react';
import { Badge } from '../components/common/Badge';

export const AccountPage: React.FC = () => {
  const { currentUser, updateUserProfile, addSavedAddress, orders, quotations } = useApp();

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: currentUser.name,
    email: currentUser.email,
    phone: currentUser.phone,
    companyName: currentUser.companyName || '',
    gstNumber: currentUser.gstNumber || '',
    businessType: currentUser.businessType || 'Retailer'
  });

  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState<Omit<Address, 'id'>>({
    fullName: currentUser.name,
    phone: currentUser.phone,
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              to="/orders"
              className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-indigo transition shadow-subtle text-xs space-y-1 block"
            >
              <Package className="w-5 h-5 text-indigo mb-1" />
              <p className="font-bold text-navy">Track Consignments</p>
              <p className="text-[11px] text-slate-500">{orders.length} orders on file</p>
            </Link>

            <Link
              to="/wholesale"
              className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-indigo transition shadow-subtle text-xs space-y-1 block"
            >
              <Clock className="w-5 h-5 text-indigo mb-1" />
              <p className="font-bold text-navy">Commercial RFQs</p>
              <p className="text-[11px] text-slate-500">{quotations.length} active quotes</p>
            </Link>
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
            {currentUser.addresses.map(addr => (
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
    </div>
  );
};
