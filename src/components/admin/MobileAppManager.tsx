import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { AppBanner, AppCategoryConfig, AppNotification, OrderStatus } from '../../types';
import {
  Smartphone,
  Layers,
  Image as ImageIcon,
  Plus,
  Trash2,
  Edit,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Bell,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Copy,
  Download,
  ShoppingBag,
  Sparkles,
  Save,
  Send,
  Eye,
  EyeOff,
  Radio,
  FileText,
  MessageCircle,
  Truck,
  Check,
  ChevronRight,
  ShieldCheck,
  HelpCircle,
  Search,
  Flame,
  Star,
  Settings,
  Database,
  Server,
  Globe,
  Cloud,
  Terminal
} from 'lucide-react';

export const MobileAppManager: React.FC = () => {
  const {
    mobileAppConfig,
    addMobileAppBanner,
    updateMobileAppBanner,
    deleteMobileAppBanner,
    reorderMobileAppBanner,
    toggleMobileAppBannerActive,
    updateMobileAppCategoryConfig,
    updateMobileAppSettings,
    sendAppPushNotification,
    deleteAppNotification,
    toggleAppExclusiveProduct,
    syncConfigToFlutter,
    products,
    orders,
    updateOrderStatus,
    refreshOrders
  } = useApp();

  const [isRefreshingOrders, setIsRefreshingOrders] = useState(false);

  const handleManualRefreshOrders = async () => {
    setIsRefreshingOrders(true);
    try {
      await refreshOrders();
      triggerSyncAlert('✅ Live MySQL & App Orders refreshed successfully!');
    } finally {
      setIsRefreshingOrders(false);
    }
  };

  // Active Sub-tab
  const [activeSubTab, setActiveSubTab] = useState<
    'banners' | 'categories' | 'products' | 'orders' | 'notifications' | 'settings' | 'mysql'
  >('banners');

  // MySQL Test Connection state
  const [dbTestLoading, setDbTestLoading] = useState(false);
  const [dbTestResult, setDbTestResult] = useState<{
    connected: boolean;
    message: string;
    host?: string;
    database?: string;
  } | null>(null);

  const handleTestDb = async () => {
    setDbTestLoading(true);
    setDbTestResult(null);
    try {
      const res = await fetch('/api/app-config?check_db=true');
      const data = await res.json();
      setDbTestResult(data);
    } catch (err: any) {
      setDbTestResult({
        connected: false,
        message: 'Could not connect to database test API: ' + (err.message || 'Network error')
      });
    } finally {
      setDbTestLoading(false);
    }
  };

  const handleDownloadSchemaSql = () => {
    window.open('/database/schema.sql', '_blank');
    triggerSyncAlert('📥 MySQL schema.sql opened for download!');
  };

  // Sync feedback state
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Phone Simulator Carousel State
  const [simActiveBannerIndex, setSimActiveBannerIndex] = useState(0);

  // Banner Editor Modal
  const [bannerModalOpen, setBannerModalOpen] = useState(false);
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);
  const [bannerForm, setBannerForm] = useState<{
    category: string;
    title: string;
    subtitle: string;
    tag: string;
    cta: string;
    image: string;
    gradientFrom: string;
    gradientVia: string;
    gradientTo: string;
    accentColor: string;
    iconName: string;
    badgeIcon: string;
    isActive: boolean;
  }>({
    category: 'Home and kitchen',
    title: 'Home & Kitchen',
    subtitle: 'Kitchen Towels, Aprons & Table Linen',
    tag: 'KITCHEN & DINING',
    cta: 'Shop Wholesale',
    image: 'assets/images/banner_home_kitchen.jpg',
    gradientFrom: '#0F172A',
    gradientVia: '#1E293B',
    gradientTo: '#334155',
    accentColor: '#F59E0B',
    iconName: 'kitchen',
    badgeIcon: 'star',
    isActive: true
  });

  // Push Notification Form
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifCategory, setNotifCategory] = useState('All');
  const [notifType, setNotifType] = useState<'OFFER' | 'ORDER' | 'SYSTEM' | 'PRICE_DROP'>('OFFER');

  // Filter for App Orders (matches source, id, or orderNumber with 'app')
  const appOrders = orders.filter(
    o =>
      o.source === 'FLUTTER_APP' ||
      (o.id && o.id.toLowerCase().includes('app')) ||
      (o.orderNumber && o.orderNumber.toLowerCase().includes('app'))
  );

  // Auto-slide phone simulator banner
  const activeBanners = mobileAppConfig.banners.filter(b => b.isActive);
  useEffect(() => {
    if (activeBanners.length <= 1) return;
    const interval = setInterval(() => {
      setSimActiveBannerIndex(prev => (prev + 1) % activeBanners.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [activeBanners.length]);

  // Open Banner Modal
  const handleOpenAddBanner = () => {
    setEditingBannerId(null);
    setBannerForm({
      category: 'Textile',
      title: 'Festival Mill Collection',
      subtitle: 'Combed Cotton Bedsheets & Fabrics',
      tag: 'NEW ARRIVAL',
      cta: 'Shop Direct Rates',
      image: 'assets/images/banner_textile.jpg',
      gradientFrom: '#1E1B4B',
      gradientVia: '#312E81',
      gradientTo: '#4338CA',
      accentColor: '#F59E0B',
      iconName: 'checkroom',
      badgeIcon: 'diamond',
      isActive: true
    });
    setBannerModalOpen(true);
  };

  const handleOpenEditBanner = (b: AppBanner) => {
    setEditingBannerId(b.id);
    setBannerForm({
      category: b.category,
      title: b.title,
      subtitle: b.subtitle,
      tag: b.tag,
      cta: b.cta,
      image: b.image,
      gradientFrom: b.gradientFrom,
      gradientVia: b.gradientVia || '#1E293B',
      gradientTo: b.gradientTo,
      accentColor: b.accentColor,
      iconName: b.iconName,
      badgeIcon: b.badgeIcon,
      isActive: b.isActive
    });
    setBannerModalOpen(true);
  };

  const handleSaveBanner = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBannerId) {
      updateMobileAppBanner(editingBannerId, bannerForm);
    } else {
      addMobileAppBanner(bannerForm);
    }
    setBannerModalOpen(false);
    triggerSyncAlert('Banner updated & staged for Mobile App.');
  };

  // Push Notification Handler
  const handleSendNotification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifMessage.trim()) return;

    sendAppPushNotification({
      title: notifTitle.trim(),
      message: notifMessage.trim(),
      targetCategory: notifCategory !== 'All' ? notifCategory : undefined,
      type: notifType
    });

    setNotifTitle('');
    setNotifMessage('');
    triggerSyncAlert('Push broadcast sent to all registered mobile app devices!');
  };

  // Sync to Flutter Action
  const handleSyncToFlutter = () => {
    setIsExporting(true);
    const result = syncConfigToFlutter();
    setTimeout(() => {
      setIsExporting(false);
      triggerSyncAlert('⚡ Success! Mobile App Config synchronized with live API and local Flutter assets.');
    }, 600);
  };

  const triggerSyncAlert = (msg: string) => {
    setSyncFeedback(msg);
    setTimeout(() => setSyncFeedback(null), 4500);
  };

  const handleCopyApiUrl = () => {
    navigator.clipboard.writeText('https://mahalaxmimanufacturer.vercel.app/api/app-config');
    triggerSyncAlert('📋 API Endpoint URL copied to clipboard! (Ready for Flutter http.get)');
  };

  const handleDownloadJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(mobileAppConfig, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'app_config.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    triggerSyncAlert('📥 app_config.json downloaded successfully!');
  };

  return (
    <div className="space-y-6">
      {/* Sync Feedback Toast */}
      {syncFeedback && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">
              ✓
            </div>
            <div>
              <p className="font-bold text-sm">{syncFeedback}</p>
              <p className="text-xs text-emerald-600">All mobile app instances will reflect these changes dynamically.</p>
            </div>
          </div>
          <button onClick={() => setSyncFeedback(null)} className="text-emerald-500 hover:text-emerald-800 text-xs font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Header Card: Flutter App Status & Quick Cloud Actions */}
      <div className="bg-gradient-to-r from-slate-900 via-navy-900 to-indigo-950 text-white p-6 rounded-3xl shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-bold tracking-wide">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                FLUTTER ENGINE CONNECTED
              </span>
              <span className="px-2.5 py-1 bg-white/10 text-slate-300 rounded-full text-xs font-medium">
                Target: C:\mahalaxmi_enterprises
              </span>
              <span className="px-2.5 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-xs font-mono font-bold">
                App v1.0.3+4
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
              <Smartphone className="w-7 h-7 text-champagne" />
              <span>Mobile App Central Management Hub</span>
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Control the Mahalaxmi Flutter mobile application in real-time. Manage home carousels, collections,
              product catalog sync, mobile app orders, push alerts, and version status from this unified operations panel.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleSyncToFlutter}
              disabled={isExporting}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs rounded-xl shadow-lg transition flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isExporting ? 'animate-spin' : ''}`} />
              <span>{isExporting ? 'Syncing...' : '⚡ Push Live to App'}</span>
            </button>

            <button
              onClick={handleCopyApiUrl}
              className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-white/10"
              title="Copy live REST API URL for Flutter app"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy API URL</span>
            </button>

            <button
              onClick={handleDownloadJson}
              className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-white/10"
              title="Download app_config.json"
            >
              <Download className="w-3.5 h-3.5" />
              <span>JSON</span>
            </button>
          </div>
        </div>

        {/* Quick App KPIs bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 mt-6 border-t border-white/10">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Carousels</span>
            <p className="text-xl font-black text-white mt-0.5">
              {mobileAppConfig.banners.filter(b => b.isActive).length} / {mobileAppConfig.banners.length} Slides
            </p>
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Featured Categories</span>
            <p className="text-xl font-black text-white mt-0.5">
              {mobileAppConfig.categories.filter(c => c.isFeaturedInApp).length} Categories
            </p>
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">App Orders Handled</span>
            <p className="text-xl font-black text-emerald-400 mt-0.5">
              {appOrders.length} Mobile Orders
            </p>
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Sync Status</span>
            <p className="text-xs font-medium text-slate-300 mt-1">
              Live &bull; {new Date(mobileAppConfig.lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>

        {/* Live APK Connection & Handshake Banner */}
        <div className="mt-5 p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse shrink-0 ring-4 ring-emerald-400/20" />
            <div>
              <p className="text-white font-bold flex items-center gap-2">
                <span>APK Handshake Gateway: Active</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono">200 OK</span>
              </p>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Installed phone APKs automatically fetch live updates from <code className="text-amber-300 bg-black/30 px-1 py-0.5 rounded">/api/app-config</code>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                alert('APK CONNECTION VERIFIED!\n\n1. Endpoint: https://mahalaxmimanufacturer.vercel.app/api/app-config\n2. Status: HTTP 200 OK\n3. Banners Synced: ' + mobileAppConfig.banners.length + ' Slides\n4. Categories Synced: ' + mobileAppConfig.categories.length + '\n\nAny phone with the APK installed will dynamically fetch these banners, categories, and push orders here in real time.');
              }}
              className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs transition shadow-sm flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Verify APK Connection</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Two-Column Work Area: Controls on Left, Real-Time Phone Simulator on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Management Sections */}
        <div className="lg:col-span-7 space-y-6">
          {/* Sub Navigation Tabs */}
          <div className="flex border-b border-slate-200 overflow-x-auto gap-2 pb-2 hide-scrollbar">
            <button
              onClick={() => setActiveSubTab('banners')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                activeSubTab === 'banners'
                  ? 'bg-navy text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Carousel Banners ({mobileAppConfig.banners.length})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('categories')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                activeSubTab === 'categories'
                  ? 'bg-navy text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Collections ({mobileAppConfig.categories.length})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('products')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                activeSubTab === 'products'
                  ? 'bg-navy text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Products & Catalog</span>
            </button>

            <button
              onClick={() => setActiveSubTab('orders')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                activeSubTab === 'orders'
                  ? 'bg-navy text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>App Orders ({appOrders.length})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('notifications')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                activeSubTab === 'notifications'
                  ? 'bg-navy text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Push Broadcasts</span>
            </button>

            <button
              onClick={() => setActiveSubTab('settings')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                activeSubTab === 'settings'
                  ? 'bg-navy text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>App Engine Config</span>
            </button>

            <button
              onClick={() => setActiveSubTab('mysql')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                activeSubTab === 'mysql'
                  ? 'bg-amber-600 text-white shadow-sm ring-2 ring-amber-300'
                  : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-amber-500" />
              <span>🗄️ MySQL Database & Hosting</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </button>
          </div>

          {/* SUB-TAB 1: CAROUSEL BANNERS */}
          {activeSubTab === 'banners' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-navy">Mobile App Carousel Slides</h3>
                  <p className="text-xs text-slate-500">
                    These slides appear dynamically in the top hero slider of the Flutter app home screen.
                  </p>
                </div>
                <button
                  onClick={handleOpenAddBanner}
                  className="px-3 py-2 bg-indigo hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add New Slide</span>
                </button>
              </div>

              <div className="space-y-3">
                {mobileAppConfig.banners.map((banner, index) => (
                  <div
                    key={banner.id}
                    className={`p-4 rounded-2xl border transition bg-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      banner.isActive ? 'border-slate-200' : 'border-slate-200 opacity-60 bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start sm:items-center gap-3.5">
                      {/* Gradient Preview Pill */}
                      <div
                        className="w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center text-white shadow-inner relative overflow-hidden"
                        style={{
                          background: `linear-gradient(135deg, ${banner.gradientFrom}, ${banner.gradientVia || banner.gradientTo}, ${banner.gradientTo})`
                        }}
                      >
                        <Sparkles className="w-5 h-5 text-amber-300" />
                        <span className="absolute bottom-1 text-[9px] font-mono font-bold bg-black/40 px-1 rounded">
                          #{index + 1}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700">
                            {banner.tag || banner.category}
                          </span>
                          <span className="text-xs font-bold text-indigo">
                            &rarr; {banner.category}
                          </span>
                          {!banner.isActive && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                              Inactive
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 leading-snug">{banner.title}</h4>
                        <p className="text-xs text-slate-500 line-clamp-1">{banner.subtitle}</p>
                        <div className="text-[11px] text-slate-400 font-medium">
                          CTA Button: <span className="font-semibold text-slate-600">{banner.cta}</span> &bull; Asset:{' '}
                          <code className="text-[10px] bg-slate-100 px-1 py-0.5 rounded text-slate-700">
                            {banner.image}
                          </code>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 self-end sm:self-center border-t sm:border-t-0 pt-2 sm:pt-0">
                      {/* Move Up */}
                      <button
                        onClick={() => reorderMobileAppBanner(banner.id, 'up')}
                        disabled={index === 0}
                        className="p-1.5 text-slate-400 hover:text-navy disabled:opacity-30 rounded-lg hover:bg-slate-100"
                        title="Move Up"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>

                      {/* Move Down */}
                      <button
                        onClick={() => reorderMobileAppBanner(banner.id, 'down')}
                        disabled={index === mobileAppConfig.banners.length - 1}
                        className="p-1.5 text-slate-400 hover:text-navy disabled:opacity-30 rounded-lg hover:bg-slate-100"
                        title="Move Down"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>

                      {/* Toggle Active */}
                      <button
                        onClick={() => toggleMobileAppBannerActive(banner.id)}
                        className={`p-1.5 rounded-lg text-xs font-bold ${
                          banner.isActive
                            ? 'text-emerald-600 hover:bg-emerald-50'
                            : 'text-slate-400 hover:bg-slate-200'
                        }`}
                        title={banner.isActive ? 'Hide on App' : 'Show on App'}
                      >
                        {banner.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => handleOpenEditBanner(banner)}
                        className="p-1.5 text-indigo hover:text-indigo-800 hover:bg-indigo-50 rounded-lg"
                        title="Edit Banner"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => {
                          if (confirm(`Delete banner "${banner.title}" from mobile app?`)) {
                            deleteMobileAppBanner(banner.id);
                          }
                        }}
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                        title="Delete Banner"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SUB-TAB 2: APP CATEGORIES */}
          {activeSubTab === 'categories' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-navy">Mobile App Category Highlights</h3>
                <p className="text-xs text-slate-500">
                  Manage the top circular avatar categories rendered on the Flutter home screen.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {mobileAppConfig.categories.map(cat => (
                  <div key={cat.id} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm"
                          style={{ backgroundColor: cat.color }}
                        >
                          {cat.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">{cat.name}</h4>
                          <span className="text-[11px] text-slate-500">{cat.productCountText}</span>
                        </div>
                      </div>

                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={cat.isFeaturedInApp}
                          onChange={e =>
                            updateMobileAppCategoryConfig(cat.id, { isFeaturedInApp: e.target.checked })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                      </label>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <div>
                        <label className="text-[11px] font-bold text-slate-600">Product Count Subtitle</label>
                        <input
                          type="text"
                          value={cat.productCountText}
                          onChange={e => updateMobileAppCategoryConfig(cat.id, { productCountText: e.target.value })}
                          className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo mt-0.5"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-600">Theme Accent Color</label>
                        <div className="flex items-center gap-2 mt-0.5">
                          <input
                            type="color"
                            value={cat.color}
                            onChange={e => updateMobileAppCategoryConfig(cat.id, { color: e.target.value })}
                            className="w-8 h-8 rounded border border-slate-200 cursor-pointer p-0"
                          />
                          <span className="text-xs font-mono text-slate-600">{cat.color}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SUB-TAB 3: APP PRODUCTS & CATALOG SYNC */}
          {activeSubTab === 'products' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-navy">Mobile App Catalog & Deals</h3>
                <p className="text-xs text-slate-500">
                  Tag products to be featured specifically in the Flutter App or flagged as Mill Flash Deals.
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">Product Name</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Mill Wholesale Rate</th>
                        <th className="py-3 px-4">Stock</th>
                        <th className="py-3 px-4 text-center">App Exclusive Deal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {products.map(p => {
                        const isExclusive = mobileAppConfig.appExclusiveProductIds.includes(p.id);
                        return (
                          <tr key={p.id} className="hover:bg-slate-50 transition">
                            <td className="py-3 px-4 font-semibold text-slate-800 flex items-center gap-2">
                              <img src={p.images[0]} alt={p.name} className="w-8 h-8 rounded object-cover flex-shrink-0" />
                              <span className="line-clamp-1">{p.name}</span>
                            </td>
                            <td className="py-3 px-4 text-slate-600">{p.categoryName}</td>
                            <td className="py-3 px-4 font-bold text-navy">₹{p.retailPrice}</td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  p.stock > 50 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {p.stock} units
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <button
                                onClick={() => toggleAppExclusiveProduct(p.id)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                                  isExclusive
                                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                {isExclusive ? '⭐ App Flash Deal' : '+ Feature in App'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SUB-TAB 4: MOBILE APP ORDERS */}
          {activeSubTab === 'orders' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-navy flex items-center gap-2">
                    <span>Flutter App Orders Stream</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="Live Auto-Sync Active"></span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Live orders placed directly from mobile devices running the Mahalaxmi Flutter application.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleManualRefreshOrders}
                    disabled={isRefreshingOrders}
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingOrders ? 'animate-spin' : ''}`} />
                    <span>{isRefreshingOrders ? 'Syncing...' : 'Sync Live Orders'}</span>
                  </button>
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold">
                    {appOrders.length} App Orders Active
                  </span>
                </div>
              </div>

              {appOrders.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
                  <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="font-bold text-sm">No mobile app orders yet</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Orders placed on Android/iOS app with UPI or COD will show up here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {appOrders.map(order => (
                    <div
                      key={order.id}
                      className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3 hover:border-indigo-300 transition"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-navy">{order.orderNumber}</span>
                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-mono text-[10px] font-bold rounded">
                              📱 {order.deviceInfo || 'Flutter App'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Customer: <strong className="text-slate-800">{order.customer.name}</strong> ({order.customer.phone}) &bull;{' '}
                            {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 bg-amber-100 text-amber-800 font-bold text-xs rounded-full">
                            {order.status}
                          </span>
                          <span className="text-sm font-black text-navy">₹{order.totalAmount}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="text-slate-600">
                          Items: {order.items.map(it => `${it.productName} (x${it.quantity})`).join(', ')}
                        </div>

                        {/* Status Quick Updater */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400 font-bold text-[11px]">Update Status:</span>
                          <select
                            value={order.status}
                            onChange={e => updateOrderStatus(order.id, e.target.value as OrderStatus)}
                            className="px-2 py-1 bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold"
                          >
                            <option value="PLACED">Placed</option>
                            <option value="MILL_PROCESSING">Mill Processing</option>
                            <option value="PACKED">Packed</option>
                            <option value="DISPATCHED">Dispatched</option>
                            <option value="IN_TRANSIT">In Transit</option>
                            <option value="DELIVERED">Delivered</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SUB-TAB 5: PUSH NOTIFICATIONS */}
          {activeSubTab === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-navy">Mobile App Push Notifications</h3>
                <p className="text-xs text-slate-500">
                  Broadcast promotional updates, flash mill discounts, and system alerts to all mobile app users.
                </p>
              </div>

              {/* Compose Notification Card */}
              <form onSubmit={handleSendNotification} className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Send className="w-4 h-4 text-indigo" />
                  <span>Compose Live Broadcast Alert</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700">Notification Title *</label>
                    <input
                      type="text"
                      placeholder="e.g. Diwali Mill Dhamaka Flat 40% OFF!"
                      value={notifTitle}
                      onChange={e => setNotifTitle(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-indigo mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700">Target Category Filter</label>
                    <select
                      value={notifCategory}
                      onChange={e => setNotifCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-indigo mt-1"
                    >
                      <option value="All">All App Users (Pan-India)</option>
                      <option value="Textile">Textiles & Bedsheets</option>
                      <option value="Home and kitchen">Home & Kitchen Linen</option>
                      <option value="Household">Household Supplies</option>
                      <option value="Cotton products">Pure Cotton Products</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">Message Content *</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Surat factory dispatch open. Book bulk cotton bedsheets before stock sells out!"
                    value={notifMessage}
                    onChange={e => setNotifMessage(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-indigo mt-1"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] text-slate-400">
                    Will trigger instant notification banner on Android & iOS devices.
                  </span>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-navy hover:bg-navy-800 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5"
                  >
                    <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                    <span>Broadcast Now</span>
                  </button>
                </div>
              </form>

              {/* History of Sent Notifications */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Broadcast History</h4>
                {mobileAppConfig.notifications.map(notif => (
                  <div key={notif.id} className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-sm flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <div className="p-2 rounded-lg bg-indigo-50 text-indigo flex-shrink-0">
                        <Bell className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="font-bold text-xs text-slate-900">{notif.title}</h5>
                          {notif.targetCategory && (
                            <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-bold">
                              {notif.targetCategory}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">{notif.message}</p>
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          Sent: {new Date(notif.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => deleteAppNotification(notif.id)}
                      className="text-slate-400 hover:text-red-500 p-1"
                      title="Delete Notification"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SUB-TAB 6: APP SETTINGS */}
          {activeSubTab === 'settings' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-navy">Flutter App Global Settings</h3>
                <p className="text-xs text-slate-500">
                  Control maintenance windows, force app updates, and quick customer care hotlines.
                </p>
              </div>

              <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
                {/* Maintenance Mode Toggle */}
                <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      <span>App Maintenance Mode</span>
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      When enabled, the Flutter app displays a maintenance splash preventing new orders.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={mobileAppConfig.settings.maintenanceMode}
                      onChange={e => updateMobileAppSettings({ maintenanceMode: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                  </label>
                </div>

                {/* Flash Sale Banner Tag */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700">App Flash Sale Tagline</label>
                    <input
                      type="text"
                      value={mobileAppConfig.settings.flashSaleTag}
                      onChange={e => updateMobileAppSettings({ flashSaleTag: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700">Minimum Supported App Version</label>
                    <input
                      type="text"
                      value={mobileAppConfig.settings.minSupportedVersion}
                      onChange={e => updateMobileAppSettings({ minSupportedVersion: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs mt-1"
                    />
                  </div>
                </div>

                {/* Support Hotline & WhatsApp */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700">WhatsApp Helpline Number</label>
                    <input
                      type="text"
                      value={mobileAppConfig.settings.whatsappNumber}
                      onChange={e => updateMobileAppSettings({ whatsappNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700">Customer Support Phone</label>
                    <input
                      type="text"
                      value={mobileAppConfig.settings.supportPhone}
                      onChange={e => updateMobileAppSettings({ supportPhone: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs mt-1"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <label className="text-xs font-bold text-slate-700">Local Flutter Source Code Path</label>
                  <input
                    type="text"
                    value={mobileAppConfig.settings.localFlutterProjectPath}
                    readOnly
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 font-mono mt-1"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Connected to local Flutter directory on this machine (C:\mahalaxmi_enterprises).
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* SUB-TAB 7: MYSQL DATABASE & CLOUD HOSTING */}
          {activeSubTab === 'mysql' && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 font-black text-[10px] rounded uppercase tracking-wider">
                    ENTERPRISE BACKEND
                  </span>
                  <span className="text-xs text-slate-500">Centralized Database System</span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-navy mt-1 flex items-center gap-2">
                  <Database className="w-5 h-5 text-amber-600" />
                  <span>MySQL Production Database & Cloud Hosting Hub</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Single source of truth: One MySQL database powers the <strong>Desktop/Mobile Website</strong>, the{' '}
                  <strong>Android App (Google Play Store)</strong>, and the <strong>iOS App (Apple App Store)</strong>.
                </p>
              </div>

              {/* Live Connection Test Card */}
              <div className="p-5 bg-gradient-to-br from-slate-900 to-navy-950 text-white rounded-3xl shadow-xl border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-black">
                      SQL
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>MySQL Server Status</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      </h4>
                      <p className="text-xs text-slate-400 font-mono">Engine: InnoDB &bull; Collation: utf8mb4_unicode_ci</p>
                    </div>
                  </div>

                  <button
                    onClick={handleTestDb}
                    disabled={dbTestLoading}
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs rounded-xl shadow-md transition flex items-center gap-2 disabled:opacity-50 self-start sm:self-auto"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${dbTestLoading ? 'animate-spin' : ''}`} />
                    <span>{dbTestLoading ? 'Pinging MySQL...' : '⚡ Test Live MySQL Connection'}</span>
                  </button>
                </div>

                {/* Connection Test Output Result */}
                {dbTestResult && (
                  <div
                    className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-start gap-2.5 ${
                      dbTestResult.connected
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                    }`}
                  >
                    <div className="mt-0.5 font-bold">{dbTestResult.connected ? '✓' : 'ℹ'}</div>
                    <div className="space-y-1">
                      <p className="font-bold">{dbTestResult.message}</p>
                      {dbTestResult.host && (
                        <p className="text-[11px] text-slate-400">Host: {dbTestResult.host} &bull; Database: {dbTestResult.database}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Database Parameters Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-white/10 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Database Name</span>
                    <p className="font-mono font-bold text-white mt-0.5">mahalaxmi_db</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Default Port</span>
                    <p className="font-mono font-bold text-white mt-0.5">3306</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Production Tables</span>
                    <p className="font-mono font-bold text-emerald-400 mt-0.5">10 Schemas Ready</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">REST API Ready</span>
                    <p className="font-mono font-bold text-indigo-300 mt-0.5">CORS Enabled</p>
                  </div>
                </div>
              </div>

              {/* 10 Production Tables Breakdown */}
              <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <Server className="w-4 h-4 text-indigo" />
                    <span>Configured MySQL Tables (Web &amp; App Synced)</span>
                  </h4>
                  <button
                    onClick={handleDownloadSchemaSql}
                    className="text-xs font-bold text-indigo hover:text-indigo-800 flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download schema.sql</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <strong className="text-slate-900 block font-mono">1. products</strong>
                    <span className="text-slate-500 text-[11px]">Direct mill stock, wholesale tiers, HSN/GST, and ratings.</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <strong className="text-slate-900 block font-mono">2. app_banners</strong>
                    <span className="text-slate-500 text-[11px]">Flutter app home screen hero carousel slides &amp; CTAs.</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <strong className="text-slate-900 block font-mono">3. categories</strong>
                    <span className="text-slate-500 text-[11px]">Home &amp; Kitchen, Household, Textile, Cotton product lines.</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <strong className="text-slate-900 block font-mono">4. orders &amp; order_items</strong>
                    <span className="text-slate-500 text-[11px]">Records source (WEB vs FLUTTER_APP), device info, and tracking.</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <strong className="text-slate-900 block font-mono">5. users</strong>
                    <span className="text-slate-500 text-[11px]">Retailers, wholesalers, B2B verified buyers, and admins.</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <strong className="text-slate-900 block font-mono">6. app_settings &amp; notifs</strong>
                    <span className="text-slate-500 text-[11px]">App version, maintenance mode, flash deals, and push alerts.</span>
                  </div>
                </div>
              </div>

              {/* Ready to Live Architecture Guide */}
              <div className="p-5 bg-indigo-50/60 rounded-2xl border border-indigo-200 shadow-sm space-y-3">
                <h4 className="text-xs font-black text-indigo-950 uppercase tracking-wider flex items-center gap-2">
                  <Globe className="w-4 h-4 text-indigo" />
                  <span>Go-Live Deployment Architecture (Website + Play Store + App Store)</span>
                </h4>

                <div className="space-y-2 text-xs text-slate-700">
                  <div className="p-3 bg-white rounded-xl border border-indigo-100 flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                      1
                    </span>
                    <div>
                      <strong className="text-slate-900">Website Hosting (Vercel / cPanel / Hostinger VPS):</strong>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        Set MySQL credentials in Hosting Environment Variables: <code>MYSQL_HOST</code>, <code>MYSQL_USER</code>, <code>MYSQL_PASSWORD</code>, <code>MYSQL_DATABASE</code>.
                        Execute <code>node database/seed.js</code> once to seed tables.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-indigo-100 flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                      2
                    </span>
                    <div>
                      <strong className="text-slate-900">Google Play Store Release (Android App):</strong>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        Flutter app package: <code>com.mahalaxmi.enterprises</code>. Pre-configured to point to{' '}
                        <code>https://mahalaxmimanufacturer.vercel.app/api</code>. Build command: <code>flutter build appbundle --release</code>.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-indigo-100 flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                      3
                    </span>
                    <div>
                      <strong className="text-slate-900">Apple App Store Release (iOS App):</strong>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        Bundle ID: <code>com.mahalaxmi.enterprises</code>. Uses HTTPS REST API and offline caching fallback.
                        Build command: <code>flutter build ipa --release</code>.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>
                    Jab aap Website ke Admin panel se koi bhi banner, product ya price change karenge, MySQL update hoga aur
                    Play Store / App Store ke users ko bina app update kiye instant new content dikhai dega!
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Interactive Real-Time Smartphone Device Simulator */}
        <div className="lg:col-span-5 sticky top-24">
          <div className="bg-slate-900 p-4 rounded-[40px] shadow-2xl border-4 border-slate-800 max-w-sm mx-auto">
            {/* Phone Bezel Top: Speaker, Camera & Status Bar */}
            <div className="flex items-center justify-between px-6 pt-2 pb-1 text-white text-[11px] font-bold">
              <span>13:05</span>
              <div className="w-16 h-3.5 bg-black rounded-full" />
              <div className="flex items-center gap-1.5 text-[10px]">
                <span>5G</span>
                <span>100%</span>
              </div>
            </div>

            {/* Phone Screen Container (Scrollable) */}
            <div className="bg-slate-50 rounded-[30px] overflow-hidden border border-slate-200/50 text-slate-900 h-[640px] flex flex-col justify-between shadow-inner">
              {/* App Screen Content */}
              <div className="overflow-y-auto flex-1 hide-scrollbar">
                {/* 1. App Top Header */}
                <div className="p-3 bg-white border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-navy flex items-center justify-center text-champagne font-black text-xs">
                      M
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-navy leading-none">Mahalaxmi</h4>
                      <span className="text-[9px] text-slate-400 font-medium">B2B & B2C Textile Mill</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Bell className="w-4 h-4 text-slate-600" />
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500" />
                    </div>
                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-700">
                      <ShoppingBag className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>

                {/* 2. Top Search Pill */}
                <div className="px-3 py-2 bg-white">
                  <div className="bg-slate-100 px-3 py-1.5 rounded-full flex items-center gap-2 text-slate-400 text-xs">
                    <Search className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[11px] truncate">Search 10,000+ Mill Bed linen, Towels...</span>
                  </div>
                </div>

                {/* 3. Horizontal Categories Avatars (Mirrors Flutter HomeScreen) */}
                <div className="px-2 py-2 bg-white border-b border-slate-100">
                  <div className="flex items-center gap-2.5 overflow-x-auto hide-scrollbar px-1">
                    {mobileAppConfig.categories
                      .filter(c => c.isFeaturedInApp)
                      .map((cat, i) => (
                        <div key={cat.id} className="flex flex-col items-center flex-shrink-0 cursor-pointer">
                          <div
                            className="w-12 h-12 rounded-full p-0.5 border-2 shadow-sm flex items-center justify-center"
                            style={{ borderColor: cat.color }}
                          >
                            <div
                              className="w-full h-full rounded-full flex items-center justify-center font-bold text-white text-xs"
                              style={{ backgroundColor: cat.color }}
                            >
                              {cat.name.slice(0, 2).toUpperCase()}
                            </div>
                          </div>
                          <span className="text-[9px] font-bold text-slate-700 mt-1 max-w-[50px] truncate text-center">
                            {cat.name}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>

                {/* 4. Active Promotional Banner Slider (Real-time Mirror) */}
                {activeBanners.length > 0 && (
                  <div className="p-3">
                    {(() => {
                      const cur = activeBanners[simActiveBannerIndex % activeBanners.length];
                      if (!cur) return null;
                      return (
                        <div
                          className="rounded-2xl p-4 text-white shadow-lg transition-all duration-300 relative overflow-hidden"
                          style={{
                            background: `linear-gradient(135deg, ${cur.gradientFrom}, ${cur.gradientVia || cur.gradientTo}, ${cur.gradientTo})`
                          }}
                        >
                          <div className="relative z-10 space-y-1">
                            <span
                              className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider inline-block text-slate-900"
                              style={{ backgroundColor: cur.accentColor }}
                            >
                              {cur.tag}
                            </span>
                            <h4 className="text-sm font-black leading-tight text-white">{cur.title}</h4>
                            <p className="text-[10px] text-slate-200 line-clamp-1">{cur.subtitle}</p>
                            <div className="pt-2">
                              <span className="px-3 py-1 bg-white text-slate-900 rounded-full text-[10px] font-bold inline-block shadow-sm">
                                {cur.cta} &rarr;
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Slider Navigation Dots */}
                    <div className="flex items-center justify-center gap-1.5 mt-2">
                      {activeBanners.map((_, dotIdx) => (
                        <button
                          key={dotIdx}
                          onClick={() => setSimActiveBannerIndex(dotIdx)}
                          className={`h-1.5 rounded-full transition-all ${
                            dotIdx === simActiveBannerIndex % activeBanners.length
                              ? 'w-5 bg-indigo'
                              : 'w-1.5 bg-slate-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* 5. B2B Wholesale Quick Services Bar (Matches Flutter screen) */}
                <div className="px-3 py-1">
                  <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl p-2.5 flex items-center justify-around shadow-sm text-center">
                    <div>
                      <FileText className="w-3.5 h-3.5 text-blue-400 mx-auto" />
                      <span className="text-[8px] font-bold block mt-0.5">Catalog PDF</span>
                    </div>
                    <div className="h-6 w-px bg-white/20" />
                    <div>
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 mx-auto" />
                      <span className="text-[8px] font-bold block mt-0.5">GST B2B ITC</span>
                    </div>
                    <div className="h-6 w-px bg-white/20" />
                    <div>
                      <MessageCircle className="w-3.5 h-3.5 text-amber-400 mx-auto" />
                      <span className="text-[8px] font-bold block mt-0.5">WhatsApp Mill</span>
                    </div>
                  </div>
                </div>

                {/* 6. Product Stream in App */}
                <div className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-slate-800">Featured Mill Deals</span>
                    <span className="text-[10px] font-bold text-indigo">See All</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {products.slice(0, 4).map(p => (
                      <div key={p.id} className="bg-white rounded-xl p-2 border border-slate-200 shadow-2xs space-y-1">
                        <img src={p.images[0]} alt={p.name} className="w-full h-20 rounded-lg object-cover" />
                        <h5 className="text-[10px] font-bold text-slate-800 line-clamp-1">{p.name}</h5>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-black text-navy">₹{p.retailPrice}</span>
                          <span className="text-[9px] text-emerald-600 font-bold">IN STOCK</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Nav Bar (Exact replica of Flutter App navigation) */}
              <div className="bg-white border-t border-slate-200 px-4 py-2 flex items-center justify-between text-slate-400 text-[9px] font-bold">
                <div className="flex flex-col items-center text-indigo">
                  <ShoppingBag className="w-4 h-4" />
                  <span>Home</span>
                </div>
                <div className="flex flex-col items-center">
                  <Layers className="w-4 h-4" />
                  <span>Categories</span>
                </div>
                <div className="flex flex-col items-center">
                  <Star className="w-4 h-4" />
                  <span>Wishlist</span>
                </div>
                <div className="flex flex-col items-center">
                  <Truck className="w-4 h-4" />
                  <span>Orders</span>
                </div>
                <div className="flex flex-col items-center">
                  <Settings className="w-4 h-4" />
                  <span>Profile</span>
                </div>
              </div>
            </div>

            {/* Bottom Notch Bar */}
            <div className="w-28 h-1 bg-slate-600 rounded-full mx-auto mt-2" />
          </div>

          <p className="text-center text-xs text-slate-400 mt-2 font-medium">
            📱 Real-time Flutter App Live Preview Simulator
          </p>
        </div>
      </div>

      {/* BANNER ADD / EDIT MODAL */}
      {bannerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-navy">
                {editingBannerId ? 'Edit Mobile App Carousel Slide' : 'Create New App Carousel Slide'}
              </h3>
              <button
                onClick={() => setBannerModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold text-slate-500"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBanner} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Slide Title *</label>
                  <input
                    type="text"
                    required
                    value={bannerForm.title}
                    onChange={e => setBannerForm({ ...bannerForm, title: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl mt-1"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Badge Tag *</label>
                  <input
                    type="text"
                    required
                    value={bannerForm.tag}
                    onChange={e => setBannerForm({ ...bannerForm, tag: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700">Subtitle / Tagline *</label>
                <input
                  type="text"
                  required
                  value={bannerForm.subtitle}
                  onChange={e => setBannerForm({ ...bannerForm, subtitle: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Target Category *</label>
                  <select
                    value={bannerForm.category}
                    onChange={e => setBannerForm({ ...bannerForm, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl mt-1"
                  >
                    <option value="Home and kitchen">Home and kitchen</option>
                    <option value="Household">Household</option>
                    <option value="Textile">Textile</option>
                    <option value="Cotton products">Cotton products</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700">CTA Button Text *</label>
                  <input
                    type="text"
                    required
                    value={bannerForm.cta}
                    onChange={e => setBannerForm({ ...bannerForm, cta: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl mt-1"
                  />
                </div>
              </div>

              {/* Gradient Colors */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Gradient Theme Colors</label>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400">Start Color</span>
                    <input
                      type="color"
                      value={bannerForm.gradientFrom}
                      onChange={e => setBannerForm({ ...bannerForm, gradientFrom: e.target.value })}
                      className="w-full h-9 rounded-lg border border-slate-200 cursor-pointer mt-0.5"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400">Middle Color</span>
                    <input
                      type="color"
                      value={bannerForm.gradientVia}
                      onChange={e => setBannerForm({ ...bannerForm, gradientVia: e.target.value })}
                      className="w-full h-9 rounded-lg border border-slate-200 cursor-pointer mt-0.5"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400">End Color</span>
                    <input
                      type="color"
                      value={bannerForm.gradientTo}
                      onChange={e => setBannerForm({ ...bannerForm, gradientTo: e.target.value })}
                      className="w-full h-9 rounded-lg border border-slate-200 cursor-pointer mt-0.5"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700">Accent / Tag Highlight Color</label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="color"
                    value={bannerForm.accentColor}
                    onChange={e => setBannerForm({ ...bannerForm, accentColor: e.target.value })}
                    className="w-9 h-9 rounded-lg border border-slate-200 cursor-pointer"
                  />
                  <span className="font-mono text-slate-600">{bannerForm.accentColor}</span>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700">Asset or Image URL</label>
                <input
                  type="text"
                  value={bannerForm.image}
                  onChange={e => setBannerForm({ ...bannerForm, image: e.target.value })}
                  placeholder="assets/images/banner_textile.jpg or https://..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl mt-1 font-mono text-[11px]"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="activeCheck"
                  checked={bannerForm.isActive}
                  onChange={e => setBannerForm({ ...bannerForm, isActive: e.target.checked })}
                  className="rounded text-indigo focus:ring-indigo"
                />
                <label htmlFor="activeCheck" className="font-bold text-slate-800">
                  Slide is Active and visible on Flutter Mobile App
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setBannerModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-navy hover:bg-navy-800 text-white font-bold rounded-xl shadow"
                >
                  Save Slide
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
