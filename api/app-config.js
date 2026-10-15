import { getDbPool } from '../database/db.js';

export default async function handler(req, res) {
  // Set CORS headers so Flutter mobile app or any web client can query
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const pool = getDbPool();

  if (pool) {
    try {
      const [banners] = await pool.query('SELECT * FROM app_banners WHERE is_active = 1 ORDER BY display_order ASC');
      const [categories] = await pool.query('SELECT * FROM categories ORDER BY display_order ASC');
      const [settingsRows] = await pool.query('SELECT * FROM app_settings LIMIT 1');
      const [notifications] = await pool.query('SELECT * FROM app_notifications ORDER BY created_at DESC LIMIT 10');

      const settings = settingsRows[0] || {};

      const formattedBanners = banners.map(b => ({
        id: b.id,
        category: b.category,
        title: b.title,
        subtitle: b.subtitle,
        tag: b.tag,
        cta: b.cta,
        image: b.image,
        gradientFrom: b.gradient_from,
        gradientVia: b.gradient_via,
        gradientTo: b.gradient_to,
        accentColor: b.accent_color,
        iconName: b.icon_name,
        badgeIcon: b.badge_icon,
        isActive: Boolean(b.is_active),
        displayOrder: b.display_order
      }));

      const formattedCategories = categories.map(c => ({
        id: c.id,
        name: c.name,
        color: c.theme_color,
        iconName: c.icon_name,
        image: c.image,
        productCountText: c.product_count_text,
        isFeaturedInApp: Boolean(c.is_featured_in_app),
        displayOrder: c.display_order
      }));

      return res.status(200).json({
        success: true,
        source: 'MYSQL_DATABASE',
        data: {
          appName: settings.app_name || 'Mahalaxmi Enterprises',
          appVersion: settings.app_version || '1.0.3+4',
          minSupportedVersion: settings.min_supported_version || '1.0.0',
          maintenanceMode: Boolean(settings.maintenance_mode),
          maintenanceMessage: settings.maintenance_message,
          supportPhone: settings.support_phone,
          supportEmail: settings.support_email,
          whatsappNumber: settings.whatsapp_number,
          flashSaleActive: Boolean(settings.flash_sale_active),
          flashSaleTag: settings.flash_sale_tag,
          catalogDownloadUrl: settings.catalog_download_url,
          gstNotice: settings.gst_notice,
          lastSyncedAt: new Date().toISOString(),
          banners: formattedBanners,
          categories: formattedCategories,
          notifications
        }
      });
    } catch (e) {
      console.warn('MySQL query error, serving default config fallback:', e.message);
    }
  }

  // Headless CMS Config payload fallback if MySQL is offline or not yet configured
  const config = {
    appName: "Mahalaxmi Enterprises",
    appVersion: "1.0.3+4",
    minSupportedVersion: "1.0.0",
    maintenanceMode: false,
    maintenanceMessage: "Mahalaxmi Mill servers are undergoing scheduled routine maintenance. App ordering will resume shortly.",
    supportPhone: "+91 85111 72099",
    supportEmail: "dhavaldave121002@gmail.com",
    whatsappNumber: "918511172099",
    flashSaleActive: true,
    flashSaleTag: "DIWALI MILL DHAMAKA - UP TO 45% WHOLESALE",
    catalogDownloadUrl: "https://mahalaxmimanufacturer.vercel.app/catalog.pdf",
    gstNotice: "100% Verified Input Tax Credit (ITC) invoices available for all commercial business orders.",
    lastSyncedAt: new Date().toISOString(),
    banners: [
      {
        id: "banner-kitchen",
        category: "Home and kitchen",
        title: "Home & Kitchen",
        subtitle: "Kitchen Towels, Aprons & Table Linen",
        tag: "KITCHEN & DINING",
        cta: "Shop Wholesale",
        image: "assets/images/banner_home_kitchen.jpg",
        gradientFrom: "#0F172A",
        gradientVia: "#1E293B",
        gradientTo: "#334155",
        accentColor: "#F59E0B",
        iconName: "kitchen",
        badgeIcon: "star",
        isActive: true,
        displayOrder: 1
      },
      {
        id: "banner-household",
        category: "Household",
        title: "Household Care",
        subtitle: "Cleaning Cloths, Storage & Laundry",
        tag: "DAILY ESSENTIALS",
        cta: "Bulk Packs",
        image: "assets/images/banner_household.jpg",
        gradientFrom: "#064E3B",
        gradientVia: "#047857",
        gradientTo: "#059669",
        accentColor: "#10B981",
        iconName: "cleaning",
        badgeIcon: "verified",
        isActive: true,
        displayOrder: 2
      },
      {
        id: "banner-textile",
        category: "Textile",
        title: "Luxury Textiles",
        subtitle: "Double Bedsheets, Curtains & Fabrics",
        tag: "PREMIUM LINEN",
        cta: "Explore Fabrics",
        image: "assets/images/banner_textile.jpg",
        gradientFrom: "#312E81",
        gradientVia: "#4338CA",
        gradientTo: "#6366F1",
        accentColor: "#818CF8",
        iconName: "checkroom",
        badgeIcon: "diamond",
        isActive: true,
        displayOrder: 3
      },
      {
        id: "banner-cotton",
        category: "Cotton products",
        title: "Pure Cotton Collection",
        subtitle: "Ultra-Soft Bath Towels & Canvas Bags",
        tag: "100% PURE COTTON",
        cta: "Direct Mill Rates",
        image: "assets/images/banner_cotton.jpg",
        gradientFrom: "#881337",
        gradientVia: "#9F1239",
        gradientTo: "#BE123C",
        accentColor: "#FBBF24",
        iconName: "spa",
        badgeIcon: "eco",
        isActive: true,
        displayOrder: 4
      }
    ],
    categories: [
      {
        id: "app-cat-kitchen",
        name: "Home and kitchen",
        color: "#F59E0B",
        iconName: "kitchen",
        image: "assets/images/banner_home_kitchen.jpg",
        productCountText: "3 Products",
        isFeaturedInApp: true,
        displayOrder: 1
      },
      {
        id: "app-cat-household",
        name: "Household",
        color: "#10B981",
        iconName: "cleaning",
        image: "assets/images/banner_household.jpg",
        productCountText: "3 Products",
        isFeaturedInApp: true,
        displayOrder: 2
      },
      {
        id: "app-cat-textile",
        name: "Textile",
        color: "#3B82F6",
        iconName: "checkroom",
        image: "assets/images/banner_textile.jpg",
        productCountText: "3 Products",
        isFeaturedInApp: true,
        displayOrder: 3
      },
      {
        id: "app-cat-cotton",
        name: "Cotton products",
        color: "#8B5CF6",
        iconName: "spa",
        image: "assets/images/banner_cotton.jpg",
        productCountText: "3 Products",
        isFeaturedInApp: true,
        displayOrder: 4
      }
    ],
    notifications: [
      {
        id: "notif-1",
        title: "Diwali Mill Sale is Live! 🎉",
        message: "Direct factory rates now active across all 300 TC Combed Cotton Double Bedsheets and Towels.",
        timestamp: new Date().toISOString(),
        targetCategory: "Textile",
        type: "OFFER",
        isSent: true
      }
    ]
  };

  return res.status(200).json({
    success: true,
    source: 'CACHED_STORE',
    data: config
  });
}
