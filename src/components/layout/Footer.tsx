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
  CheckCircle2,
  Lock
} from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-navy text-white pt-12 pb-8 border-t border-navy-800 w-full max-w-full overflow-hidden">
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
                <a
                  href="/feed.xml"
                  target="_blank"
                  rel="alternate"
                  className="text-xs text-champagne hover:underline flex items-center gap-1"
                >
                  <span>📡 RSS 2.0 Catalog Feed</span>
                </a>
              </li>
              <li>
                <a
                  href="/sitemap.xml"
                  target="_blank"
                  className="text-xs text-slate-300 hover:text-champagne transition"
                >
                  <span>🗺️ Google Sitemap Index</span>
                </a>
              </li>
              <li>
                <Link to="/account" className="text-xs text-slate-300 hover:text-champagne transition flex items-center gap-1.5 pt-1">
                  <span>🏢 B2B Verified GST Profile</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* 2.1 B2B Verified Authority Registry & Backlink Citation Matrix */}
        <div className="mt-10 pt-8 border-t border-navy-800/80 space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-champagne tracking-wider uppercase">
                Verified B2B Authority Registry & Trade Portals
              </p>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Official registration credentials across Indian and international trade networks:
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-[10px]">
              <a
                href="https://www.indiamart.com/mahalaxmi-enterprises-surat/"
                target="_blank"
                rel="noreferrer noopener"
                className="px-2.5 py-1 bg-navy-800 hover:bg-navy-700 text-slate-200 rounded-lg border border-slate-700 flex items-center gap-1.5 transition"
                title="IndiaMART Verified Exporter & Star Supplier"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>IndiaMART TrustSEAL</span>
              </a>
              <a
                href="https://www.tradeindia.com/Seller-15949210-Mahalaxmi-Enterprises/"
                target="_blank"
                rel="noreferrer noopener"
                className="px-2.5 py-1 bg-navy-800 hover:bg-navy-700 text-slate-200 rounded-lg border border-slate-700 flex items-center gap-1.5 transition"
                title="TradeIndia Certified Mill Manufacturer"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>TradeIndia TrustStamp</span>
              </a>
              <a
                href="https://www.exportersindia.com/mahalaxmi-enterprises-gujarat/"
                target="_blank"
                rel="noreferrer noopener"
                className="px-2.5 py-1 bg-navy-800 hover:bg-navy-700 text-slate-200 rounded-lg border border-slate-700 flex items-center gap-1.5 transition"
                title="ExportersIndia Verified Manufacturer Profile"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>ExportersIndia Verified</span>
              </a>
              <a
                href="https://services.gst.gov.in/services/searchtp"
                target="_blank"
                rel="noreferrer noopener"
                className="px-2.5 py-1 bg-navy-800 hover:bg-navy-700 text-slate-200 rounded-lg border border-slate-700 flex items-center gap-1.5 transition"
                title="Verify GSTIN 24AAECM8921P1ZA on Official GST Portal"
              >
                <span className="w-2 h-2 rounded-full bg-indigo"></span>
                <span>GST Portal Official</span>
              </a>
              <a
                href="https://udyamregistration.gov.in/"
                target="_blank"
                rel="noreferrer noopener"
                className="px-2.5 py-1 bg-navy-800 hover:bg-navy-700 text-slate-200 rounded-lg border border-slate-700 flex items-center gap-1.5 transition"
                title="Ministry of Micro, Small and Medium Enterprises"
              >
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                <span>Ministry of MSME</span>
              </a>
            </div>
          </div>

          {/* 2.2 Pan-India Wholesale City Delivery Network (Local SEO Matrix) */}
          <div className="pt-4 border-t border-navy-800/60 text-[11px] text-slate-300">
            <span className="font-bold text-slate-200 block mb-1">
              Direct Mill Freight Corridor & Wholesale City Network:
            </span>
            <p className="leading-relaxed">
              <Link to="/catalog?q=Surat+Textile" className="hover:text-champagne transition">Surat Textile Hub (Ring Road)</Link> •{' '}
              <Link to="/catalog?q=Ahmedabad+Cotton" className="hover:text-champagne transition">Ahmedabad (Kalupur & Relief Road)</Link> •{' '}
              <Link to="/catalog?q=Mumbai+Textile" className="hover:text-champagne transition">Mumbai (Mangaldas & Mulji Jetha Market)</Link> •{' '}
              <Link to="/catalog?q=Delhi+Bedsheets" className="hover:text-champagne transition">Delhi NCR (Chandni Chowk & Gandhi Nagar)</Link> •{' '}
              <Link to="/catalog?q=Tirupur+Cotton" className="hover:text-champagne transition">Tirupur (Cotton Hosiery Cluster)</Link> •{' '}
              <Link to="/catalog?q=Bangalore+Linen" className="hover:text-champagne transition">Bangalore (Chickpet Commercial)</Link> •{' '}
              <Link to="/catalog?q=Kolkata+Wholesale" className="hover:text-champagne transition">Kolkata (Burrabazar Wholesale)</Link> •{' '}
              <Link to="/catalog?q=Jaipur+Textile" className="hover:text-champagne transition">Jaipur (Johari & Purohit Ji Ka Katla)</Link> •{' '}
              <Link to="/catalog?q=Ludhiana+Towels" className="hover:text-champagne transition">Ludhiana (Clock Tower Hub)</Link> •{' '}
              <Link to="/catalog?q=Hyderabad+Cotton" className="hover:text-champagne transition">Hyderabad (Madina Market)</Link> •{' '}
              <Link to="/catalog?q=Chennai+Linen" className="hover:text-champagne transition">Chennai (Sowcarpet)</Link> •{' '}
              <Link to="/catalog?q=Kanpur+Cotton" className="hover:text-champagne transition">Kanpur (General Ganj Hub)</Link>
            </p>
          </div>
        </div>
      </div>

      {/* 3. Bottom Legal & Copyright Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 border-t border-navy-800 text-xs text-slate-300 flex flex-col md:flex-row items-center justify-between gap-4">
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
