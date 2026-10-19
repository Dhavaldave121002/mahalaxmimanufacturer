import { MobileAppConfig } from '../types';

export const INITIAL_MOBILE_APP_CONFIG: MobileAppConfig = {
  banners: [
    {
      id: 'banner-textile',
      category: 'Textile',
      title: "India's Premier Direct Mill Commerce",
      subtitle: 'Surat Weaving Units • Tirupur Cotton • Zero Middleman Markup',
      tag: 'PREMIUM LINEN',
      badge: 'AUTHENTIC MILL CONTRACT RATES',
      tagline: '300 TC Combed Cotton Bedsheets From ₹489',
      cta: 'Explore Mill Catalog',
      ctaLink: '/catalog',
      image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?q=80&w=1200&auto=format&fit=crop',
      gradientFrom: '#312E81',
      gradientVia: '#4338CA',
      gradientTo: '#6366F1',
      accentColor: '#818CF8',
      iconName: 'checkroom',
      badgeIcon: 'diamond',
      isActive: true,
      displayOrder: 1
    },
    {
      id: 'banner-cotton',
      category: 'Cotton products',
      title: 'Hospitality Grade 600 GSM Bath Towels',
      subtitle: '5-Star Luxury Absorbency • Combed Gujarat Cotton • Chlorine Safe',
      tag: '100% PURE COTTON',
      badge: 'HOSPITALITY PLUSH SERIE',
      tagline: 'Commercial Zero-Twist Weave From ₹225',
      cta: 'Shop Bath Linen',
      ctaLink: '/category/cotton-products',
      image: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?q=80&w=1200&auto=format&fit=crop',
      gradientFrom: '#881337',
      gradientVia: '#9F1239',
      gradientTo: '#BE123C',
      accentColor: '#FBBF24',
      iconName: 'spa',
      badgeIcon: 'eco',
      isActive: true,
      displayOrder: 2
    },
    {
      id: 'banner-household',
      category: 'Household',
      title: 'Heavy Canvas Totes & Commercial Hygiene',
      subtitle: 'Eco-Friendly 380 GSM Canvas Shopping Bags & 350 GSM Microfiber Wipes',
      tag: 'DAILY ESSENTIALS',
      badge: 'COMMERCIAL ESSENTIALS',
      tagline: 'Direct Factory Bags From ₹58',
      cta: 'Order Bulk Supplies',
      ctaLink: '/wholesale',
      image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=1200&auto=format&fit=crop',
      gradientFrom: '#064E3B',
      gradientVia: '#047857',
      gradientTo: '#059669',
      accentColor: '#10B981',
      iconName: 'cleaning',
      badgeIcon: 'verified',
      isActive: true,
      displayOrder: 3
    },
    {
      id: 'banner-kitchen',
      category: 'Home and kitchen',
      title: 'Commercial Kitchen Linen & Chef Aprons',
      subtitle: 'High-Absorbency Herringbone Kitchen Towels & Table Covers',
      tag: 'KITCHEN & DINING',
      badge: 'HOTEL & BANQUET GRADE',
      tagline: 'Chef Aprons & Linen From ₹85',
      cta: 'Shop Wholesale',
      ctaLink: '/category/home-kitchen',
      image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=1200&auto=format&fit=crop',
      gradientFrom: '#0F172A',
      gradientVia: '#1E293B',
      gradientTo: '#334155',
      accentColor: '#F59E0B',
      iconName: 'kitchen',
      badgeIcon: 'star',
      isActive: true,
      displayOrder: 4
    }
  ],
  categories: [
    {
      id: 'app-cat-kitchen',
      name: 'Home and kitchen',
      color: '#F59E0B',
      iconName: 'kitchen',
      image: 'assets/images/banner_home_kitchen.jpg',
      productCountText: '3 Products',
      isFeaturedInApp: true,
      displayOrder: 1
    },
    {
      id: 'app-cat-household',
      name: 'Household',
      color: '#10B981',
      iconName: 'cleaning',
      image: 'assets/images/banner_household.jpg',
      productCountText: '3 Products',
      isFeaturedInApp: true,
      displayOrder: 2
    },
    {
      id: 'app-cat-textile',
      name: 'Textile',
      color: '#3B82F6',
      iconName: 'checkroom',
      image: 'assets/images/banner_textile.jpg',
      productCountText: '3 Products',
      isFeaturedInApp: true,
      displayOrder: 3
    },
    {
      id: 'app-cat-cotton',
      name: 'Cotton products',
      color: '#8B5CF6',
      iconName: 'spa',
      image: 'assets/images/banner_cotton.jpg',
      productCountText: '3 Products',
      isFeaturedInApp: true,
      displayOrder: 4
    }
  ],
  settings: {
    appName: 'Mahalaxmi Enterprises',
    appVersion: '1.0.3+4',
    minSupportedVersion: '1.0.0',
    maintenanceMode: false,
    maintenanceMessage: 'Mahalaxmi Enterprises Mill servers are undergoing scheduled routine maintenance. App ordering will resume shortly.',
    supportPhone: '+91 85111 72099',
    supportEmail: 'dhavaldave121002@gmail.com',
    whatsappNumber: '918511172099',
    flashSaleActive: true,
    flashSaleTag: 'DIWALI MILL DHAMAKA - UP TO 45% WHOLESALE',
    catalogDownloadUrl: 'https://mahalaxmimanufacturer.vercel.app/catalog.pdf',
    gstNotice: '100% Verified Input Tax Credit (ITC) invoices available for all commercial business orders.',
    localFlutterProjectPath: 'C:\\mahalaxmi_enterprises'
  },
  notifications: [
    {
      id: 'notif-1',
      title: 'Diwali Mill Sale is Live! 🎉',
      message: 'Direct factory rates now active across all 300 TC Combed Cotton Double Bedsheets and Towels.',
      timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
      targetCategory: 'Textile',
      type: 'OFFER',
      isSent: true
    },
    {
      id: 'notif-2',
      title: 'Order Dispatch Notification 🚚',
      message: 'Surat Central Warehouse dispatch team has fulfilled B2B consignment for immediate logistics handoff.',
      timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
      type: 'ORDER',
      isSent: true
    }
  ],
  appExclusiveProductIds: ['prod-bedsheet-01', 'prod-cotton-towel-01', 'prod-tote-01'],
  lastSyncedAt: new Date().toISOString()
};
