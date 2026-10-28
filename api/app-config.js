import { getDbPool } from '../database/db.js';
import fs from 'fs';
import path from 'path';
import { requireAdminSession } from './_lib/admin-session.js';

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
  
  // ----------------------------------------------------
  // DELHIVERY PINCODE SERVICEABILITY & COD CHECK
  // ----------------------------------------------------
  if (req.url && (req.url.includes('action=pincode') || req.url.includes('check_pincode='))) {
    try {
      const urlObj = new URL(req.url, 'http://localhost:5173');
      const pin = urlObj.searchParams.get('pincode') || urlObj.searchParams.get('check_pincode') || '';
      const cleanPin = pin.replace(/\D/g, '');

      if (!cleanPin || cleanPin.length !== 6) {
        return res.status(400).json({
          success: false,
          serviceable: false,
          error: 'Please provide a valid 6-digit Indian postal code.'
        });
      }

      const delhiveryToken = process.env.DELHIVERY_API_TOKEN;
      if (!delhiveryToken) {
        return res.status(503).json({
          success: false,
          serviceable: null,
          verificationAvailable: false,
          error: 'Live delivery verification is not configured.'
        });
      }
      const dUrl = 'https://track.delhivery.com/c/api/pin-codes/json/?filter_codes=' + cleanPin;

      const dRes = await fetch(dUrl, {
        headers: {
          'Authorization': 'Token ' + delhiveryToken,
          'Accept': 'application/json'
        }
      });

      if (dRes.ok) {
        const dData = await dRes.json();
        const codeList = dData?.delivery_codes || [];
        const match = codeList.find(c => c.postal_code?.pin == cleanPin);

        if (match && match.postal_code) {
          const pc = match.postal_code;
          const codAvailable = pc.cod === 'Y' || pc.cash === 'Y';
          const prepaidAvailable = pc.pre_paid === 'Y';
          const district = pc.district || pc.city || '';
          let state = pc.state_code || '';
          let city = pc.city || district;

          // Surat Postal Code Guarantee (395xxx / 394xxx are Surat, Gujarat)
          if (cleanPin.startsWith('395') || cleanPin.startsWith('394')) {
            city = 'Surat';
            state = 'GJ';
          }

          // Calculate estimated delivery: Surat to Gujarat = 1-2 days, Rest of India = 3-4 days
          const isGujarat = state === 'GJ' || district.toLowerCase().includes('surat') || district.toLowerCase().includes('ahmedabad');
          const estDays = isGujarat ? '1-2 Days (Surat Fast Direct Dispatch)' : '3-4 Business Days';

          return res.status(200).json({
            success: true,
            serviceable: true,
            pincode: cleanPin,
            city: city,
            state: state === 'GJ' ? 'Gujarat' : state,
            district: cleanPin.startsWith('395') || cleanPin.startsWith('394') ? 'Surat' : district,
            codAvailable: codAvailable,
            prepaidAvailable: prepaidAvailable,
            pickupAvailable: pc.pickup === 'Y',
            estimatedDays: estDays,
            courierPartner: 'Delhivery Surface Express',
            message: codAvailable
              ? 'Delivery & Cash on Delivery (COD) available for ' + city + ' (' + cleanPin + ').'
              : 'Prepaid Delivery available. (Cash on Delivery not serviceable for this pincode).'
          });
        }
      }

      return res.status(200).json({
        success: true,
        serviceable: false,
        verificationAvailable: true,
        pincode: cleanPin,
        codAvailable: false,
        prepaidAvailable: false,
        message: `Delivery serviceability could not be confirmed for pincode ${cleanPin}.`
      });
    } catch (dErr) {
      console.warn('Delhivery check error:', dErr.message);
      const urlObj = new URL(req.url, 'http://localhost:5173');
      const cleanPin = (urlObj.searchParams.get('pincode') || urlObj.searchParams.get('check_pincode') || '').replace(/\D/g, '');
      return res.status(502).json({
        success: false,
        serviceable: null,
        verificationAvailable: false,
        pincode: cleanPin,
        error: 'Live delivery verification is temporarily unavailable.'
      });
    }
  }

  // ----------------------------------------------------
  // DELHIVERY SHIPMENT BOOKING & AWB GENERATION
  // ----------------------------------------------------
  if (req.url && req.url.includes('action=delhivery-waybill')) {
    try {
      return res.status(503).json({
        success: false,
        error: 'Carrier shipment booking is not configured. No waybill was generated.'
      });
    } catch (awbErr) {
      console.warn('Delhivery waybill error:', awbErr.message);
      return res.status(500).json({ success: false, error: 'Shipment booking failed.' });
    }
  }

  // ----------------------------------------------------
  // DELHIVERY LIVE TRACKING STATUS
  // ----------------------------------------------------
  if (req.url && req.url.includes('action=delhivery-track')) {
    try {
      const urlObj = new URL(req.url, 'http://localhost:5173');
      const waybill = urlObj.searchParams.get('waybill') || urlObj.searchParams.get('awb') || '';
      const delhiveryToken = process.env.DELHIVERY_API_TOKEN;

      if (!waybill) {
        return res.status(400).json({ success: false, error: 'Waybill number is required.' });
      }
      if (!delhiveryToken) {
        return res.status(503).json({ success: false, error: 'Live shipment tracking is not configured.' });
      }

      const trackUrl = 'https://track.delhivery.com/api/v1/packages/json/?waybill=' + waybill;
      const tRes = await fetch(trackUrl, {
        headers: {
          'Authorization': 'Token ' + delhiveryToken,
          'Accept': 'application/json'
        }
      });

      if (tRes.ok) {
        const tData = await tRes.json();
        return res.status(200).json({
          success: true,
          waybill: waybill,
          data: tData
        });
      }

      return res.status(502).json({ success: false, error: 'The carrier could not verify this waybill.' });
    } catch (trackErr) {
      console.warn('Delhivery tracking error:', trackErr.message);
      return res.status(502).json({ success: false, error: 'Live shipment tracking is temporarily unavailable.' });
    }
  }

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
    const admin = await requireAdminSession(req, res);
    if (!admin) return;
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

      if (process.env.NODE_ENV === 'production' && !dbSaved) {
        return res.status(503).json({ success: false, error: 'The notification could not be saved to the database.' });
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
               (id, category, title, subtitle, tag, badge, tagline, cta, cta_link, image, mobile_image, visibility, show_text_overlay, gradient_from, gradient_via, gradient_to, accent_color, icon_name, badge_icon, is_active, display_order)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
               ON DUPLICATE KEY UPDATE 
                 category=VALUES(category), title=VALUES(title), subtitle=VALUES(subtitle),
                 tag=VALUES(tag), badge=VALUES(badge), tagline=VALUES(tagline),
                 cta=VALUES(cta), cta_link=VALUES(cta_link), image=VALUES(image),
                 mobile_image=VALUES(mobile_image), visibility=VALUES(visibility),
                 show_text_overlay=VALUES(show_text_overlay),
                 gradient_from=VALUES(gradient_from), gradient_via=VALUES(gradient_via), gradient_to=VALUES(gradient_to),
                 accent_color=VALUES(accent_color), icon_name=VALUES(icon_name), badge_icon=VALUES(badge_icon),
                 is_active=VALUES(is_active), display_order=VALUES(display_order)`,
              [
                b.id,
                b.category || '',
                b.title || '',
                b.subtitle || '',
                b.tag || '',
                b.badge || '',
                b.tagline || '',
                b.cta || '',
                b.ctaLink || '/catalog',
                b.image || '',
                b.mobileImage || '',
                b.visibility || 'ALL',
                b.showTextOverlay !== false ? 1 : 0,
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

      if (process.env.NODE_ENV === 'production' && !dbSaved) {
        return res.status(503).json({ success: false, error: 'Banners could not be saved to the database.' });
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
      if (process.env.NODE_ENV === 'production') {
        return res.status(503).json({ success: false, error: 'Full app configuration does not have durable database storage yet.' });
      }
      const currentConfig = readFallbackConfig() || {};
      const merged = { ...currentConfig, ...body.config, lastSyncedAt: new Date().toISOString() };
      saveFallbackConfig(merged);

      return res.status(200).json({
        success: true,
        message: 'Mobile app configuration synced successfully.',
        data: merged
      });
    }

    // 4. Update Bundle Offer Configuration (Frequently Bought Together)
    if (action === 'update_bundle_offer' && body.bundleOffer) {
      if (process.env.NODE_ENV === 'production') {
        return res.status(503).json({ success: false, error: 'Bundle configuration does not have durable database storage yet.' });
      }
      const currentConfig = readFallbackConfig() || {};
      currentConfig.bundleOffer = {
        ...currentConfig.bundleOffer,
        ...body.bundleOffer
      };
      currentConfig.lastSyncedAt = new Date().toISOString();
      saveFallbackConfig(currentConfig);

      return res.status(200).json({
        success: true,
        message: 'Mill Saver Bundle configuration updated successfully!',
        data: currentConfig.bundleOffer
      });
    }

    // 5. Customization Pricing Sync & Configuration
    if (action === 'update_customization_pricing') {
      const pricing = body.customizationPricing || body.pricing;
      if (!pricing || typeof pricing !== 'object') {
        return res.status(400).json({ success: false, error: 'Invalid customization pricing payload' });
      }
      const currentConfig = readFallbackConfig() || {};
      currentConfig.customizationPricing = {
        ...(currentConfig.customizationPricing || {}),
        ...pricing
      };
      currentConfig.lastSyncedAt = new Date().toISOString();
      saveFallbackConfig(currentConfig);

      if (pool) {
        try {
          await pool.query(
            `INSERT INTO app_settings (setting_key, setting_value) VALUES ('customization_pricing', ?)
             ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
            [JSON.stringify(currentConfig.customizationPricing)]
          );
        } catch (e) {
          // quiet fallback if app_settings schema differs
        }
      }

      return res.status(200).json({
        success: true,
        message: 'Customization pricing updated and synced across Website & Mobile App!',
        data: currentConfig.customizationPricing
      });
    }
  }

  // ----------------------------------------------------
  // GET Handler: Retrieve Live Config for Flutter & Web
  // ----------------------------------------------------
  if (pool) {
    try {
      const requestUrl = new URL(req.url || '/', 'http://localhost');
      if (requestUrl.searchParams.get('platform') === 'website') {
        const [websiteBanners] = await pool.query(
          "SELECT * FROM app_banners WHERE is_active = 1 AND (visibility = 'WEB_ONLY' OR visibility = 'ALL' OR visibility IS NULL) ORDER BY display_order ASC"
        );
        return res.status(200).json({
          success: true,
          source: 'MYSQL_DATABASE',
          data: {
            banners: websiteBanners.map(b => ({
              id: b.id,
              category: b.category,
              title: b.title,
              subtitle: b.subtitle,
              tag: b.tag,
              badge: b.badge || '',
              tagline: b.tagline || '',
              cta: b.cta,
              ctaLink: b.cta_link || '/catalog',
              image: b.image,
              mobileImage: b.mobile_image || b.image,
              visibility: b.visibility,
              showTextOverlay: Boolean(b.show_text_overlay),
              gradientFrom: b.gradient_from,
              gradientVia: b.gradient_via,
              gradientTo: b.gradient_to,
              accentColor: b.accent_color,
              iconName: b.icon_name,
              badgeIcon: b.badge_icon,
              isActive: Boolean(b.is_active),
              displayOrder: b.display_order
            }))
          }
        });
      }

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
        badge: b.badge || '',
        tagline: b.tagline || '',
        cta: b.cta,
        ctaLink: b.cta_link || '/catalog',
        image: b.image,
        mobileImage: b.mobile_image || '',
        visibility: b.visibility || 'ALL',
        showTextOverlay: b.show_text_overlay == null ? true : Boolean(b.show_text_overlay),
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
      let couponsLoadedFromDatabase = false;
      try {
        // Only return Public 1-Click coupons for Mobile App (exclude WEB_ONLY, exclude SECRET_MANUAL_ONLY, exclude LAUNCH150)
        const [couponsRows] = await pool.query(
          "SELECT * FROM coupons WHERE is_active = 1 AND (valid_until IS NULL OR valid_until >= UTC_TIMESTAMP()) AND (usage_limit IS NULL OR used_count < usage_limit) AND is_featured = 1 AND (suggestion_mode IS NULL OR suggestion_mode != 'SECRET_MANUAL_ONLY') AND (target_platform IS NULL OR target_platform != 'WEB_ONLY') AND UPPER(code) != 'LAUNCH150' ORDER BY created_at DESC"
        );
        if (Array.isArray(couponsRows)) {
          couponsLoadedFromDatabase = true;
          formattedCoupons = couponsRows.map(c => ({
            id: c.id,
            code: c.code,
            title: c.title,
            description: c.description || '',
            discountType: c.discount_type,
            discountValue: Number(c.discount_value),
            minOrderValue: Number(c.min_order_value || 0),
            maxDiscountAmount: c.max_discount_amount ? Number(c.max_discount_amount) : undefined,
            validUntil: c.valid_until ? new Date(c.valid_until).toISOString() : undefined,
            isActive: Boolean(c.is_active),
            isFeatured: true,
            applicableFor: c.applicable_for || 'ALL',
            usageLimit: c.usage_limit == null ? undefined : Number(c.usage_limit),
            usedCount: Number(c.used_count || 0),
            targetPlatform: c.target_platform || 'ALL'
          }));
        }
      } catch (coupErr) {
        // quiet fallback
      }

      const rawFallbackCoupons = readFallbackConfig()?.coupons || [];
      const fallbackCoupons = rawFallbackCoupons.filter(
        c => c.isActive && c.isFeatured !== false && c.suggestionMode !== 'SECRET_MANUAL_ONLY' && (c.code || '').toUpperCase() !== 'LAUNCH150' && c.targetPlatform !== 'WEB_ONLY'
      );

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
          banners: formattedBanners.length > 0
            ? formattedBanners.filter(b => b.visibility !== 'WEB_ONLY')
            : (readFallbackConfig()?.banners || []).filter(b => b.visibility !== 'WEB_ONLY'),
          categories: formattedCategories.length > 0 ? formattedCategories : (readFallbackConfig()?.categories || []),
          notifications: formattedNotifications,
          coupons: couponsLoadedFromDatabase ? formattedCoupons : fallbackCoupons,
          bundleOffer: readFallbackConfig()?.bundleOffer || {
            enabled: true,
            title: "Frequently Bought Together • Mill Saver Bundle",
            subtitle: "Customers frequently combine these complementary mill-grade essentials",
            badgeText: "Extra 15% Bundle Discount Applied",
            discountPercentage: 15,
            minItemsForDiscount: 2,
            savingsNote: "You save ₹{savings} ({discount}% off combo)",
            bundleMaxProducts: 3
          },
          customizationPricing: readFallbackConfig()?.customizationPricing || {
            'No Customization': 0,
            'Only Logo': 12,
            'Only Design': 22,
            'Design & Logo': 32,
            'Embroidery Branding': 42,
            'Custom Weave & GSM': 55,
            'Custom Size': 20
          }
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
    notifications: [],
    bundleOffer: {
      enabled: true,
      title: "Frequently Bought Together • Mill Saver Bundle",
      subtitle: "Customers frequently combine these complementary mill-grade essentials",
      badgeText: "Extra 15% Bundle Discount Applied",
      discountPercentage: 15,
      minItemsForDiscount: 2,
      savingsNote: "You save ₹{savings} ({discount}% off combo)",
      bundleMaxProducts: 3
    }
  };

  return res.status(200).json({
    success: true,
    source: 'CACHED_STORE',
    data: fallback
  });
}
