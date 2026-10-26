import React, { useState, useEffect, useMemo } from 'react';
import {
  Mail,
  Smartphone,
  Globe,
  Search,
  Download,
  Trash2,
  Send,
  MessageCircle,
  Copy,
  Check,
  RefreshCw,
  Clock,
  Tag,
  ShoppingBag,
  ExternalLink,
  Users
} from 'lucide-react';

export interface SubscriberLead {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  cartTotal: number;
  itemsCount: number;
  itemsSummary: string;
  couponCode: string;
  subtotal?: number;
  source: 'Website' | 'Mobile App';
  status: string;
  createdAt: string;
  lastActivity?: string;
}

export const SubscriberManager: React.FC = () => {
  const [subscribers, setSubscribers] = useState<SubscriberLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'ALL' | 'Website' | 'Mobile App'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Offer Emailed' | 'Reminder Emailed' | 'Pending (30-Min)'>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ text: string; success: boolean } | null>(null);

  // Fetch subscribers from /api/abandoned-cart
  const fetchSubscribers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/abandoned-cart');
      if (res.ok) {
        const data = await res.json();
        if (data.subscribers && Array.isArray(data.subscribers)) {
          setSubscribers(data.subscribers);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch subscribers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscribers();
  }, []);

  // Copy email to clipboard
  const handleCopyEmail = (email: string, id: string) => {
    navigator.clipboard.writeText(email);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // 1-Click Resend Voucher Email
  const handleResendVoucher = async (lead: SubscriberLead) => {
    setResendingId(lead.id);
    setStatusMsg(null);
    try {
      const res = await fetch('/api/abandoned-cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SEND_NOW',
          customerName: lead.customerName,
          customerEmail: lead.customerEmail,
          customerPhone: lead.customerPhone,
          cartTotal: lead.cartTotal,
          subtotal: lead.subtotal ?? 0,
          source: lead.source === 'Mobile App' ? 'FLUTTER_APP' : 'WEB',
          items: [{ productName: lead.itemsSummary || 'Textile Consignment', quantity: 1, totalPrice: lead.cartTotal }]
        })
      });
      const data = await res.json();
      if (data.success) {
        setStatusMsg({ text: data.message || `Cart reminder sent to ${lead.customerEmail}.`, success: true });
        fetchSubscribers();
      } else {
        setStatusMsg({ text: data.error || 'Failed to resend voucher.', success: false });
      }
    } catch (err: any) {
      setStatusMsg({ text: err.message || 'Network error.', success: false });
    } finally {
      setResendingId(null);
      setTimeout(() => setStatusMsg(null), 4000);
    }
  };

  // Delete lead
  const handleDeleteLead = async (lead: SubscriberLead) => {
    if (!window.confirm(`Delete subscriber record for ${lead.customerEmail}?`)) return;
    try {
      const res = await fetch('/api/abandoned-cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'DELETE',
          id: lead.id,
          customerEmail: lead.customerEmail
        })
      });
      if (res.ok) {
        setSubscribers(prev => prev.filter(s => s.id !== lead.id));
        setStatusMsg({ text: `Subscriber ${lead.customerEmail} removed.`, success: true });
        setTimeout(() => setStatusMsg(null), 3000);
      }
    } catch (err) {
      console.warn('Failed to delete subscriber:', err);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (subscribers.length === 0) return;
    const headers = ['ID', 'Customer Name', 'Email', 'Phone', 'Cart Total (INR)', 'Items Summary', 'Coupon Sent', 'Source', 'Status', 'Date Created'];
    const rows = filteredSubscribers.map(s => [
      `"${s.id}"`,
      `"${s.customerName.replace(/"/g, '""')}"`,
      `"${s.customerEmail}"`,
      `"${s.customerPhone || ''}"`,
      s.cartTotal || 0,
      `"${(s.itemsSummary || '').replace(/"/g, '""')}"`,
      `"${s.couponCode || ''}"`,
      `"${s.source}"`,
      `"${s.status}"`,
      `"${new Date(s.createdAt).toLocaleString('en-IN')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `mahalaxmi-subscribers-leads-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered subscribers
  const filteredSubscribers = useMemo(() => {
    return subscribers.filter(s => {
      const matchQuery =
        s.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.customerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.customerPhone && s.customerPhone.includes(searchQuery)) ||
        (s.couponCode && s.couponCode.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchSource = sourceFilter === 'ALL' || s.source === sourceFilter;
      const matchStatus = statusFilter === 'ALL' || s.status === statusFilter;

      return matchQuery && matchSource && matchStatus;
    });
  }, [subscribers, searchQuery, sourceFilter, statusFilter]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = subscribers.length;
    const webCount = subscribers.filter(s => s.source === 'Website').length;
    const appCount = subscribers.filter(s => s.source === 'Mobile App').length;
    const totalCartValue = subscribers.reduce((sum, s) => sum + (s.cartTotal || 0), 0);
    const sentCount = subscribers.filter(s =>
      ['Offer Emailed', 'Reminder Emailed', 'Voucher Emailed'].includes(s.status)
    ).length;
    return { total, webCount, appCount, totalCartValue, sentCount };
  }, [subscribers]);

  return (
    <div className="space-y-6">
      {/* Top Header & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-navy tracking-tight flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo" />
              <span>Cart Leads & Email Subscribers</span>
            </h2>
            <span className="text-xs bg-indigo-100 text-indigo-900 font-extrabold px-2.5 py-0.5 rounded-full">
              {subscribers.length} Leads
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Automated cart recovery subscribers from both Website & Mobile App with WhatsApp & Email followup tools.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchSubscribers}
            disabled={loading}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            title="Refresh leads"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExportCSV}
            disabled={subscribers.length === 0}
            className="px-4 py-2 bg-navy hover:bg-navy-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {statusMsg && (
        <div
          className={`p-3 rounded-xl text-xs font-bold border transition ${
            statusMsg.success
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {statusMsg.text}
        </div>
      )}

      {/* Metrics Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-subtle space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Total Subscribers</span>
            <Users className="w-4 h-4 text-indigo" />
          </div>
          <div className="text-2xl font-black text-navy">{metrics.total}</div>
          <div className="text-[11px] text-slate-400">Captured checkout leads</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-subtle space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Cart Value at Risk</span>
            <ShoppingBag className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700">₹{metrics.totalCartValue.toLocaleString('en-IN')}</div>
          <div className="text-[11px] text-emerald-600 font-semibold">Active recover potential</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-subtle space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Platform Sources</span>
            <Globe className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex items-center gap-3 text-sm font-bold mt-1">
            <span className="flex items-center gap-1 text-slate-800">
              <Globe className="w-3.5 h-3.5 text-indigo" /> {metrics.webCount} Web
            </span>
            <span className="text-slate-300">•</span>
            <span className="flex items-center gap-1 text-slate-800">
              <Smartphone className="w-3.5 h-3.5 text-emerald-600" /> {metrics.appCount} App
            </span>
          </div>
          <div className="text-[11px] text-slate-400">Multi-channel tracking</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-subtle space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Vouchers Dispatched</span>
            <Tag className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600">{metrics.sentCount}</div>
          <div className="text-[11px] text-slate-400">Instant code sent to inbox</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-subtle flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, phone, or voucher code..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo outline-none transition"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={sourceFilter}
            onChange={e => setSourceFilter(e.target.value as any)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none"
          >
            <option value="ALL">All Sources</option>
            <option value="Website">🌐 Website</option>
            <option value="Mobile App">📱 Mobile App</option>
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none"
          >
            <option value="ALL">All Status</option>
            <option value="Offer Emailed">Offer Emailed</option>
            <option value="Reminder Emailed">Reminder Emailed</option>
            <option value="Pending (30-Min)">Pending (30-Min)</option>
          </select>
        </div>
      </div>

      {/* Subscribers Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Customer / Source</th>
                <th className="py-3 px-4">Email Address</th>
                <th className="py-3 px-4">WhatsApp / Phone</th>
                <th className="py-3 px-4">Cart Value & Items</th>
                <th className="py-3 px-4">Voucher Sent</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4 text-right">Quick Follow-Up</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSubscribers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Mail className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-sm text-slate-600">No Subscriber Leads Found</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Cart offers and reminders are recorded here when a current admin coupon applies or a customer requests a reminder.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredSubscribers.map(lead => {
                  const cleanPhone = (lead.customerPhone || '').replace(/[^0-9]/g, '');
                  const waPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
                  const waMessage = encodeURIComponent(
                    `Hello ${lead.customerName || 'Valued Customer'}, greetings from Mahalaxmi Enterprises Ahmedabad!\n\n` +
                    `We noticed you saved items worth ₹${lead.cartTotal || 0} (${lead.itemsSummary || 'Textile order'}) in your cart.\n\n` +
                    `No coupon code is included in this follow-up. Please confirm current offers in the admin coupon settings before promising a discount.\n\n` +
                    `Would you like assistance with delivery or placing your wholesale order?`
                  );

                  return (
                    <tr key={lead.id} className="hover:bg-slate-50/70 transition">
                      {/* Name & Source */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-indigo/10 text-indigo font-black flex items-center justify-center text-xs shrink-0">
                            {lead.customerName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block leading-tight">
                              {lead.customerName}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 text-[9px] font-extrabold px-1.5 py-0.2 rounded mt-0.5 ${
                                lead.source === 'Mobile App'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {lead.source === 'Mobile App' ? (
                                <Smartphone className="w-2.5 h-2.5" />
                              ) : (
                                <Globe className="w-2.5 h-2.5" />
                              )}
                              {lead.source}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-700">
                        <div className="flex items-center gap-1.5">
                          <span>{lead.customerEmail}</span>
                          <button
                            onClick={() => handleCopyEmail(lead.customerEmail, lead.id)}
                            className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-700 transition"
                            title="Copy email"
                          >
                            {copiedId === lead.id ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Phone / WhatsApp */}
                      <td className="py-3.5 px-4 text-[11px]">
                        {lead.customerPhone ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-slate-800">{lead.customerPhone}</span>
                            <a
                              href={`https://wa.me/${waPhone}?text=${waMessage}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition"
                              title="Chat on WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Not provided</span>
                        )}
                      </td>

                      {/* Cart Value & Summary */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">
                          ₹{Number(lead.cartTotal || 0).toLocaleString('en-IN')}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate max-w-xs" title={lead.itemsSummary}>
                          {lead.itemsSummary || `${lead.itemsCount || 1} Cart Item(s)`}
                        </div>
                      </td>

                      {/* Voucher Sent */}
                      <td className="py-3.5 px-4">
                        <span className="font-black text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-200 font-mono inline-block">
                          {lead.couponCode || 'No active offer'}
                        </span>
                        <span className="block text-[10px] text-emerald-700 font-semibold mt-0.5">
                          {lead.status}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-[11px] text-slate-500 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{new Date(lead.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block ml-4">
                          {new Date(lead.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>

                      {/* Quick Follow-up Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* 1-Click WhatsApp Chat */}
                          {lead.customerPhone && (
                            <a
                              href={`https://wa.me/${waPhone}?text=${waMessage}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1 shadow-sm shrink-0"
                              title="1-Click WhatsApp Followup"
                            >
                              <MessageCircle className="w-3 h-3" />
                              <span>WhatsApp</span>
                            </a>
                          )}

                          {/* Resend Email Button */}
                          <button
                            onClick={() => handleResendVoucher(lead)}
                            disabled={resendingId === lead.id}
                            className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-bold transition flex items-center gap-1 border border-indigo-200 shrink-0 disabled:opacity-50"
                            title="Resend recovery voucher email"
                          >
                            <Send className={`w-3 h-3 ${resendingId === lead.id ? 'animate-spin' : ''}`} />
                            <span>Resend</span>
                          </button>

                          {/* Delete Lead */}
                          <button
                            onClick={() => handleDeleteLead(lead)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Delete lead"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
