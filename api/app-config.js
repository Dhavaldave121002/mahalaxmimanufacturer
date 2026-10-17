import { getDbPool } from '../database/db.js';
import fs from 'fs';
import path from 'path';

// Helper to read current public/app-config.json safely
function readFallbackConfig() {
  try {
    const configPath = path.join(process.cwd(), 'public', 'app-config.json');
    if (fs.existsSync(configPath)) {
      const raw = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Fallback config read failed:', e.message);
  }
  return null;
}

// Helper to save to public/app-config.json safely
function saveFallbackConfig(newConfig) {
  try {
    const configPath = path.join(process.cwd(), 'public', 'app-config.json');
    fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.warn('Fallback config write skipped (read-only environment):', e.message);
    return false;
  }
}

export default async function handler(req, res) {
  // Set CORS headers so Flutter mobile app or any web client can query
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Handle database connectivity test directly to conserve serverless function slots
  if (req.url && (req.url.includes('check_db=true') || req.url.includes('action=db-status'))) {
    const { testDbConnection } = await import('../database/db.js');
    const result = await testDbConnection();
    return res.status(200).json(result);
  }



  const pool = getDbPool();

  // ----------------------------------------------------
  // POST Handler: Admin Broadcasts or Banner Sync
  // ----------------------------------------------------
  if (req.method === 'POST') {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        body = {};
      }
    }
    body = body || {};

    const action = body.action || (body.title ? 'send_notification' : 'sync_config');

    // 1. Send / Broadcast Mobile App Notification
    if (action === 'send_notification') {
      const notif = body.notification || body;
      const notifId = notif.id || `notif-${Date.now()}`;
      const title = notif.title || 'Mill Notification';
      const message = notif.message || '';
      const targetCategory = notif.targetCategory || notif.target_category || 'All';
      const type = notif.type || 'OFFER';
      const timestamp = notif.timestamp || new Date().toISOString();

      let dbSaved = false;

      // Save to MySQL if available
      if (pool) {
        try {
          await pool.query(
            `INSERT INTO app_notifications (id, title, message, target_category, type, is_sent)
             VALUES (?, ?, ?, ?, ?, 1)
             ON DUPLICATE KEY UPDATE title=VALUES(title), message=VALUES(message), type=VALUES(type)`,
            [notifId, title, message, targetCategory, type]
          );
          dbSaved = true;
        } catch (dbErr) {
          console.warn('MySQL notification insert warning:', dbErr.message);
        }
      }

      // Also persist to public/app-config.json
      const currentConfig = readFallbackConfig() || {};
      const existingNotifs = currentConfig.notifications || [];
      const updatedNotifs = [
        {
          id: notifId,
          title,
          message,
          timestamp,
          targetCategory,
          type,
          isSent: true
        },
        ...existingNotifs.filter(n => n.id !== notifId)
      ];

      currentConfig.notifications = updatedNotifs;
      currentConfig.lastSyncedAt = new Date().toISOString();
      saveFallbackConfig(currentConfig);

      return res.status(200).json({
        success: true,
        message: dbSaved
          ? 'Notification broadcasted and saved to MySQL database!'
          : 'Notification broadcasted and saved to app configuration!',
        dbSaved,
        notification: {
          id: notifId,
          title,
          message,
          timestamp,
          targetCategory,
          type,
          isSent: true
        }
      });
    }

    // 2. Sync Banners to Database and App Config
    if (action === 'sync_banners' && Array.isArray(body.banners)) {
      let dbSaved = false;
      if (pool) {
        try {
          for (const b of body.banners) {
            await pool.query(
              `INSERT INTO app_banners 
               (id, category, title, subtitle, tag, cta, image, gradient_from, gradient_via, gradient_to, accent_color, icon_name, badge_icon, is_active, display_order)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
               ON DUPLICATE KEY UPDATE 
                 category=VALUES(category), title=VALUES(title), subtitle=VALUES(subtitle),
                 tag=VALUES(tag), cta=VALUES(cta), image=VALUES(image),
                 gradient_from=VALUES(gradient_from), gradient_via=VALUES(gradient_via), gradient_to=VALUES(gradient_to),
                 accent_color=VALUES(accent_color), icon_name=VALUES(icon_name), badge_icon=VALUES(badge_icon),
                 is_active=VALUES(is_active), display_order=VALUES(display_order)`,
              [
                b.id,
                b.category || '',
                b.title || '',
                b.subtitle || '',
                b.tag || '',
                b.cta || '',
                b.image || '',
                b.gradientFrom || '#0F172A',
                b.gradientVia || null,
                b.gradientTo || '#334155',
                b.accentColor || '#F59E0B',
                b.iconName || 'kitchen',
                b.badgeIcon || 'star',
                b.isActive !== false ? 1 : 0,
                b.displayOrder || 1
              ]
            );
          }
          dbSaved = true;
        } catch (dbErr) {
          console.warn('MySQL banner sync warning:', dbErr.message);
        }
      }

      const currentConfig = readFallbackConfig() || {};
      currentConfig.banners = body.banners;
      currentConfig.lastSyncedAt = new Date().toISOString();
      saveFallbackConfig(currentConfig);

      return res.status(200).json({
        success: true,
        message: 'Banners synced successfully across database and Flutter app.',
        dbSaved
      });
    }

    // 3. Full Config Sync
    if (action === 'sync_config' && body.config) {
      const currentConfig = readFallbackConfig() || {};
      const merged = { ...currentConfig, ...body.config, lastSyncedAt: new Date().toISOString() };
      saveFallbackConfig(merged);

      return res.status(200).json({
        success: true,
        message: 'Mobile app configuration synced successfully.',
        data: merged
      });
    }
  }

  // ----------------------------------------------------
  // GET Handler: Retrieve Live Config for Flutter & Web
  // ----------------------------------------------------
  if (pool) {
    try {
      const [banners] = await pool.query('SELECT * FROM app_banners WHERE is_active = 1 ORDER BY display_order ASC');
      const [categories] = await pool.query('SELECT * FROM categories ORDER BY display_order ASC');
      const [settingsRows] = await pool.query('SELECT * FROM app_settings LIMIT 1');
      const [notifications] = await pool.query('SELECT * FROM app_notifications ORDER BY created_at DESC LIMIT 15');

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

      const formattedNotifications = notifications.map(n => ({
        id: n.id,
        title: n.title,
        message: n.message,
        targetCategory: n.target_category || 'All',
        type: n.type || 'OFFER',
        timestamp: n.created_at ? new Date(n.created_at).toISOString() : new Date().toISOString(),
        isSent: Boolean(n.is_sent)
      }));

      let formattedCoupons = [];
      try {
        const [couponsRows] = await pool.query('SELECT * FROM coupons WHERE is_active = 1 ORDER BY is_featured DESC, created_at DESC');
        if (Array.isArray(couponsRows)) {
          formattedCoupons = couponsRows.map(c => ({
            id: c.id,
            code: c.code,
            title: c.title,
            description: c.description || '',
            discountType: c.discount_type,
            discountValue: Number(c.discount_value),
            minOrderValue: Number(c.min_order_value || 0),
            maxDiscountAmount: c.max_discount_amount ? Number(c.max_discount_amount) : undefined,
            isActive: Boolean(c.is_active),
            isFeatured: Boolean(c.is_featured),
            applicableFor: c.applicable_for || 'ALL'
          }));
        }
      } catch (coupErr) {
        // quiet fallback
      }

      const fallbackCoupons = readFallbackConfig()?.coupons || [];

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
          banners: formattedBanners.length > 0 ? formattedBanners : (readFallbackConfig()?.banners || []),
          categories: formattedCategories.length > 0 ? formattedCategories : (readFallbackConfig()?.categories || []),
          notifications: formattedNotifications,
          coupons: formattedCoupons.length > 0 ? formattedCoupons : fallbackCoupons
        }
      });
    } catch (e) {
      console.warn('MySQL query error, serving fallback store:', e.message);
    }
  }

  // Fallback to local config file if MySQL is offline or not configured
  const fallback = readFallbackConfig() || {
    appName: 'Mahalaxmi Enterprises',
    appVersion: '1.0.3+4',
    banners: [],
    categories: [],
    notifications: []
  };

  return res.status(200).json({
    success: true,
    source: 'CACHED_STORE',
    data: fallback
  });
}
