import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Truck,
  RotateCcw,
  Headphones,
  Award,
  Factory,
  Mail,
  Phone,
  MapPin,
  CheckCircle2
} from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-navy text-white pt-12 pb-8 border-t border-navy-800">
      {/* 1. Value Proposition Pillars */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-12 border-b border-navy-800/80">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-navy-800/40 border border-navy-700/50">
            <div className="p-2.5 bg-indigo/20 text-champagne rounded-lg">
              <Factory className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white">Direct Mill Rates</h4>
              <p className="text-xs text-slate-300 mt-1">
                Zero intermediary markup. Genuine factory prices directly from Surat & Tirupur looms.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-xl bg-navy-800/40 border border-navy-700/50">
            <div className="p-2.5 bg-indigo/20 text-champagne rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white">100% GST Invoiced</h4>
              <p className="text-xs text-slate-300 mt-1">
                Claim full Input Tax Credit (ITC) with legally compliant B2B tax invoices & E-way bills.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-xl bg-navy-800/40 border border-navy-700/50">
            <div className="p-2.5 bg-indigo/20 text-champagne rounded-lg">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white">Pan-India Freight Logistics</h4>
              <p className="text-xs text-slate-300 mt-1">
                Reliable pallet and parcel dispatches to 19,000+ PIN codes with live GPS tracking.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-xl bg-navy-800/40 border border-navy-700/50">
            <div className="p-2.5 bg-indigo/20 text-champagne rounded-lg">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white">Hospitality & Export Grade</h4>
              <p className="text-xs text-slate-300 mt-1">
                OEKO-TEX tested combed cotton engineered for 500+ commercial laundering cycles.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Navigation Links & Corporate Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand & Corporate Office */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-indigo flex items-center justify-center text-champagne font-black text-lg">
                M
              </div>
              <span className="font-black text-xl text-white tracking-tight">
                MAHALAXMI<span className="text-champagne">.</span>
              </span>
            </div>
            <p className="text-xs font-semibold text-champagne tracking-wider uppercase">
              Direct Mill Rates & Wholesale Essentials
            </p>
            <p className="text-xs text-slate-300 leading-relaxed max-w-sm">
              Mahalaxmi Enterprises is India's dedicated manufacturing marketplace for combed cotton bedsheets, 600 GSM bath towels, heavy canvas bags, and commercial hygiene textiles. Serving retail households and verified hospitality chains nationwide.
            </p>

            <div className="pt-2 text-xs text-slate-300 space-y-1.5">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-champagne shrink-0" />
                <span>Textile Park Phase II, Ring Road, Surat, Gujarat 395002</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-champagne shrink-0" />
                <span>Wholesale Line: +91 98765 43210 / +91 94261 11223</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-champagne shrink-0" />
                <span>orders@mahalaxmienterprises.com</span>
              </div>
            </div>
          </div>

          {/* Catalog Categories */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-200">Catalog Collections</h4>
            <ul className="text-xs text-slate-300 space-y-2">
              <li>
                <Link to="/category/textile" className="hover:text-champagne transition">
                  Textile (Bedsheets & Curtains)
                </Link>
              </li>
              <li>
                <Link to="/category/cotton-products" className="hover:text-champagne transition">
                  Cotton Products & Towels
                </Link>
              </li>
              <li>
                <Link to="/category/home-kitchen" className="hover:text-champagne transition">
                  Home and Kitchen Linen
                </Link>
              </li>
              <li>
                <Link to="/category/household" className="hover:text-champagne transition">
                  Household & Microfiber
                </Link>
              </li>
              <li>
                <Link to="/catalog?filter=bestseller" className="hover:text-champagne transition">
                  Best Seller Collections
                </Link>
              </li>
              <li>
                <Link to="/wholesale" className="hover:text-champagne transition font-semibold text-indigo-light">
                  Direct Mill Greige Bales
                </Link>
              </li>
            </ul>
          </div>

          {/* Wholesale & Commercial */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-200">Wholesale Commerce</h4>
            <ul className="text-xs text-slate-300 space-y-2">
              <li>
                <Link to="/wholesale" className="hover:text-champagne transition">
                  Request Bulk Quotation (RFQ)
                </Link>
              </li>
              <li>
                <Link to="/wholesale" className="hover:text-champagne transition">
                  Bulk SKU Order Pad
                </Link>
              </li>
              <li>
                <Link to="/account" className="hover:text-champagne transition">
                  GST Verification Portal
                </Link>
              </li>
              <li>
                <Link to="/wholesale" className="hover:text-champagne transition">
                  Hotel & Hospitality Procurement
                </Link>
              </li>
              <li>
                <Link to="/wholesale" className="hover:text-champagne transition">
                  Reseller & Distributor Program
                </Link>
              </li>
              <li>
                <Link to="/orders" className="hover:text-champagne transition">
                  Consignment Tracking
                </Link>
              </li>
            </ul>
          </div>

          {/* Compliance & Administration */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-200">Governance & Trust</h4>
            <ul className="text-xs text-slate-300 space-y-2">
              <li className="flex items-center gap-1.5 text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>GSTIN: 24AAECM8921P1ZA</span>
              </li>
              <li className="flex items-center gap-1.5 text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>UDYAM-GJ-22-0049182 (MSME)</span>
              </li>
              <li className="flex items-center gap-1.5 text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>OEKO-TEX Standard 100 Class 1</span>
              </li>
              <li>
                <Link to="/admin" className="text-champagne hover:underline font-semibold block pt-2">
                  Admin & Operations Login &rarr;
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* 3. Bottom Legal & Copyright Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 border-t border-navy-800 text-xs text-slate-400 flex flex-col md:flex-row items-center justify-between gap-4">
        <p>&copy; {new Date().getFullYear()} Mahalaxmi Enterprises. All rights reserved. Direct Mill Rates & Wholesale Essentials.</p>
        <div className="flex items-center gap-6">
          <span className="hover:text-white transition cursor-pointer">Terms of Commercial Supply</span>
          <span className="hover:text-white transition cursor-pointer">Wholesale Return Policy</span>
          <span className="hover:text-white transition cursor-pointer">GST Invoice Compliance</span>
          <span className="hover:text-white transition cursor-pointer">Security & Privacy</span>
        </div>
      </div>
    </footer>
  );
};
