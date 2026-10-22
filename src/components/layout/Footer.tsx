import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
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
  Lock,
  Building2,
  X,
  MessageSquare
} from 'lucide-react';

export const Footer: React.FC = () => {
  const location = useLocation();
  const [legalModal, setLegalModal] = useState<string | null>(null);

  // Hide storefront footer on admin dashboard
  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <footer className="bg-navy text-white pt-12 pb-24 md:pb-12 border-t border-navy-800 w-full max-w-full overflow-hidden">
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
                Zero intermediary markup. Genuine factory prices directly from Ahmedabad & Tirupur looms.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-xl bg-navy-800/40 border border-emerald-500/30">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm text-white">7-Day Return & 100% Refund</h4>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold border border-emerald-500/40">Guaranteed</span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Doorstep reverse pickup in 24-48 hrs. 100% refund to UPI/Bank or instant size/defect exchange.
              </p>
              <button
                type="button"
                onClick={() => setLegalModal('RETURN')}
                className="mt-1.5 text-[11px] text-emerald-400 hover:text-emerald-300 font-bold underline flex items-center gap-1 cursor-pointer"
              >
                Read Full Refund Policy →
              </button>
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
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white">100% GST & Lab Tested</h4>
              <p className="text-xs text-slate-300 mt-1">
                OEKO-TEX tested combed cotton. Valid B2B tax invoices with full Input Tax Credit (ITC).
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Navigation Links & Corporate Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8">
          {/* Brand & Corporate Office */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-2.5">
              <img
                src="/logo.png"
                alt="Mahalaxmi Enterprises Logo"
                className="w-10 h-10 rounded-full object-cover shadow-sm border border-navy-700 shrink-0"
              />
              <span className="font-black text-xl text-white tracking-tight">
                MAHALAXMI ENTERPRISES<span className="text-champagne">.</span>
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
                <span>Narol Textile Cluster, Ahmedabad, Gujarat 382405</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-champagne shrink-0" />
                <span>Wholesale Line: +91 98765 43210 / +91 85111 72099</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-champagne shrink-0" />
                <span>orders@mahalaxmienterprises.com</span>
              </div>
            </div>
          </div>

          {/* Catalog Categories */}
          <div className="lg:col-span-2 space-y-3">
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

          {/* Customer Service & Return Policies */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-200">Customer Care & Support</h4>
            <ul className="text-xs text-slate-300 space-y-2">
              <li>
                <button
                  type="button"
                  onClick={() => setLegalModal('RETURN')}
                  className="hover:text-champagne transition text-left font-bold text-emerald-400 flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>7-Day Return & Refund Policy</span>
                </button>
              </li>
              <li>
                <Link to="/orders" className="hover:text-champagne transition flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-slate-400" />
                  <span>Track Order & Live AWB</span>
                </Link>
              </li>
              <li>
                <Link to="/orders" className="hover:text-champagne transition text-amber-300 font-medium">
                  Request Return / Exchange Online
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setLegalModal('TERMS')}
                  className="hover:text-champagne transition text-left"
                >
                  Shipping & Delivery Terms
                </button>
              </li>
              <li>
                <a
                  href="https://wa.me/918511172099?text=Namaste%20Mahalaxmi%20Enterprises,%20I%20have%20an%20inquiry%20regarding%20my%20Order/Return."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-champagne transition text-emerald-400 flex items-center gap-1.5 font-semibold whitespace-nowrap"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>WhatsApp Helpdesk (+91 85111 72099)</span>
                </a>
              </li>
              <li>
                <Link to="/wholesale" className="hover:text-champagne transition">
                  Commercial Sample Evaluation
                </Link>
              </li>
            </ul>
          </div>

          {/* Compliance & Administration */}
          <div className="lg:col-span-3 space-y-3">
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
              <li className="flex items-center gap-1.5 text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>ISO 9001:2015 Production Standards</span>
              </li>
              <li className="flex items-center gap-1.5 text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Ahmedabad Loom Quality Tested Guarantee</span>
              </li>
              <li>
                <Link to="/account" className="text-xs text-slate-300 hover:text-champagne transition flex items-center gap-1.5 pt-0.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>B2B Verified GST Profile</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

      </div>

      {/* 3. Bottom Legal & Copyright Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-6 border-t border-navy-800 text-xs text-slate-300 flex flex-col md:flex-row items-center justify-between gap-4">
        <p>&copy; {new Date().getFullYear()} Mahalaxmi Enterprises. All rights reserved. Direct Mill Rates & Wholesale Essentials.</p>
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <button onClick={() => setLegalModal('RETURN')} className="text-emerald-400 font-bold hover:text-emerald-300 transition text-left cursor-pointer flex items-center gap-1">
            <RotateCcw className="w-3.5 h-3.5" />
            7-Day Return & Refund Policy
          </button>
          <button onClick={() => setLegalModal('TERMS')} className="hover:text-champagne transition text-left">Terms of Commercial Supply</button>
          <button onClick={() => setLegalModal('GST')} className="hover:text-champagne transition text-left">GST Invoice Compliance</button>
          <button onClick={() => setLegalModal('PRIVACY')} className="hover:text-champagne transition text-left">Security & Privacy</button>
        </div>
      </div>

      {/* Legal Policy Modal */}
      {legalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white text-navy rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative border border-slate-200 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setLegalModal(null)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-navy hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {legalModal === 'RETURN' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-emerald-600">
                  <RotateCcw className="w-6 h-6 shrink-0" />
                  <div>
                    <h3 className="text-lg font-black text-navy">7-Day Return, Exchange & 100% Refund Policy</h3>
                    <p className="text-xs text-emerald-600 font-semibold">100% Buyer Protection & Direct Mill Guarantee</p>
                  </div>
                </div>

                <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-950 space-y-1.5">
                  <div className="font-bold flex items-center gap-1.5 text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Hassle-Free Doorstep Reverse Pickup & 100% Refund</span>
                  </div>
                  <p className="leading-relaxed">
                    At Mahalaxmi Enterprises, we stand firmly behind every piece of fabric produced in our Ahmedabad & Tirupur looms. If you are not completely satisfied with your order, we offer a straightforward 7-Day return, exchange, or refund with zero hidden deductions.
                  </p>
                </div>

                <div className="space-y-2.5 text-xs text-slate-700">
                  <h4 className="font-bold text-navy uppercase text-[11px] tracking-wider">Policy Highlights & Terms:</h4>
                  <ul className="space-y-2 pl-1">
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-emerald-600 shrink-0">1.</span>
                      <span><strong>7-Day Return Window:</strong> You can initiate a return or exchange request within 7 calendar days from the date the consignment is delivered to your address.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-emerald-600 shrink-0">2.</span>
                      <span><strong>100% Full Refund Guarantee:</strong> When a return is requested, 100% of your order value will be refunded directly to your original payment method (Bank Account / UPI / Card) within 3-5 business days after reverse pickup.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-emerald-600 shrink-0">3.</span>
                      <span><strong>Free Doorstep Reverse Pickup:</strong> Our logistics partners (Delhivery, BlueDart, Blr Freight) will pick up the package from your doorstep within 24 to 48 business hours at zero reverse freight cost for verified defect/exchange claims.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-emerald-600 shrink-0">4.</span>
                      <span><strong>Size / Dimension / Defect Exchange:</strong> Received a different size or weaving flaw? Select "Size / Defect Exchange" and a fresh replacement lot will be dispatched immediately.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-emerald-600 shrink-0">5.</span>
                      <span><strong>B2B & Wholesale Bales:</strong> Commercial consignments with weaving flaws or GSM deviation exceeding ±3% are 100% replaced with zero hassle. Sample kit costs (₹199 / ₹299) are 100% credited back on your first wholesale order.</span>
                    </li>
                  </ul>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                  <h4 className="font-bold text-navy">How to Request a Return or Exchange:</h4>
                  <div className="space-y-1 text-slate-600">
                    <p>• <strong>Method 1 (Instant Online):</strong> Visit <Link to="/orders" onClick={() => setLegalModal(null)} className="text-indigo font-bold underline">Track Order / Consignments</Link>, select your delivered order, and click the <strong>"🔄 Return / Exchange"</strong> button.</p>
                    <p>• <strong>Method 2 (WhatsApp Desk):</strong> Ping our Ahmedabad Mill dispatch helpline on WhatsApp at <a href="https://wa.me/918511172099" target="_blank" rel="noopener noreferrer" className="text-emerald-600 font-bold underline">+91 85111 72099</a> with your Order ID.</p>
                    <p>• <strong>Method 3 (Email):</strong> Email our team at <a href="mailto:orders@mahalaxmienterprises.com" className="text-indigo font-bold underline">orders@mahalaxmienterprises.com</a>.</p>
                  </div>
                </div>
              </div>
            )}

            {legalModal === 'TERMS' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-indigo">
                  <Factory className="w-5 h-5" />
                  <h3 className="text-lg font-black">Terms of Commercial Supply</h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  All commercial textile purchases from Mahalaxmi Enterprises are executed under standard Ahmedabad Mill trade covenants. Minimum Order Quantities (MOQ) apply per SKU. Goods are dispatched ex-mill upon receipt of payment or under approved B2B 30-day revolving credit line.
                </p>
                <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4">
                  <li>Direct mill billing with legal GST compliance.</li>
                  <li>Dispatch within 24-48 business hours via insured freight partners.</li>
                  <li>Transit insurance included on all bulk pallet shipments.</li>
                </ul>
              </div>
            )}

            {legalModal === 'GST' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-indigo">
                  <ShieldCheck className="w-5 h-5" />
                  <h3 className="text-lg font-black">GST Invoice Compliance</h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Every order includes an authorized B2B Tax Invoice compliant with Section 31 of the CGST Act. Valid for 100% Input Tax Credit (ITC) claiming.
                </p>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono space-y-1">
                  <p><strong>GSTIN:</strong> 24AAECM8921P1ZA</p>
                  <p><strong>HSN Codes:</strong> 6302 (Bed & Bath Linen - 5% / 12%), 5208 (Woven Cotton Fabrics - 5%)</p>
                  <p><strong>E-way Bill:</strong> Auto-generated for consignments exceeding ₹50,000</p>
                </div>
              </div>
            )}

            {legalModal === 'PRIVACY' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-navy">
                  <Lock className="w-5 h-5" />
                  <h3 className="text-lg font-black">Security & Privacy Protocol</h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Mahalaxmi Enterprises implements 256-bit SSL encryption across all order transactions, RFQ submissions, and business registrations.
                </p>
                <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4">
                  <li>Commercial customer data is never shared with third-party marketing brokers.</li>
                  <li>Payments processed via RBI-licensed payment aggregators.</li>
                  <li>Registered trade accounts protected with One-Time Password (OTP) verification.</li>
                </ul>
              </div>
            )}

            <div className="pt-4 mt-6 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setLegalModal(null)}
                className="px-5 py-2 bg-navy text-white text-xs font-bold rounded-xl hover:bg-navy-800 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};
