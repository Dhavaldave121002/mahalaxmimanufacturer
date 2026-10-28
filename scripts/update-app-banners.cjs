const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateBanners() {
  const conn = await mysql.createConnection({
    host: process.env.MYSQL_HOST || '127.0.0.1',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'mahalaxmi_db'
  });

  // Backup current banners
  await conn.query('CREATE TABLE IF NOT EXISTS app_banners_backup_20261028 LIKE app_banners');
  await conn.query('TRUNCATE TABLE app_banners_backup_20261028');
  await conn.query('INSERT INTO app_banners_backup_20261028 SELECT * FROM app_banners');
  console.log('Backed up current app_banners');

  // Deactivate old banners
  await conn.query('UPDATE app_banners SET is_active = 0');

  const newBanners = [
    {
      id: 'banner-roti-cover-pro',
      category: 'Home and kitchen',
      title: 'Cotton Roti Covers',
      subtitle: 'Keeps rotis soft, warm & fresh naturally.',
      tag: '100% PURE COTTON',
      cta: 'Shop Roti Covers',
      cta_link: '/catalog?category=home-kitchen',
      image: '/banner-designs/banner-roti-cover-desktop.svg',
      mobile_image: '/banner-designs/banner-roti-cover-mobile.svg',
      gradient_from: '#F5F7F4',
      gradient_via: '#EEF3EE',
      gradient_to: '#E6EFE7',
      accent_color: '#2B5A3C',
      display_order: 1,
      is_active: 1,
      visibility: 'ALL',
      show_text_overlay: 0
    },
    {
      id: 'banner-veg-bag-pro',
      category: 'Household',
      title: 'Reusable Produce Bags',
      subtitle: 'Breathable cotton mesh for lasting freshness.',
      tag: 'ZERO-PLASTIC LIVING',
      cta: 'Shop Produce Bags',
      cta_link: '/catalog?category=household',
      image: '/banner-designs/banner-veg-bag-desktop.svg',
      mobile_image: '/banner-designs/banner-veg-bag-mobile.svg',
      gradient_from: '#FAF6EE',
      gradient_via: '#F3EDE1',
      gradient_to: '#ECE4D4',
      accent_color: '#473C2C',
      display_order: 2,
      is_active: 1,
      visibility: 'ALL',
      show_text_overlay: 0
    },
    {
      id: 'banner-tote-bag-pro',
      category: 'Textile',
      title: 'Canvas Tote Bags',
      subtitle: 'Heavy-duty natural cotton, made to last.',
      tag: 'DAILY ESSENTIALS',
      cta: 'Explore Tote Bags',
      cta_link: '/catalog?category=textile',
      image: '/banner-designs/banner-tote-bag-desktop.svg',
      mobile_image: '/banner-designs/banner-tote-bag-mobile.svg',
      gradient_from: '#FAF3F1',
      gradient_via: '#F4E8E5',
      gradient_to: '#EFE3DF',
      accent_color: '#4A342E',
      display_order: 3,
      is_active: 1,
      visibility: 'ALL',
      show_text_overlay: 0
    },
    {
      id: 'banner-saree-cover-pro',
      category: 'Textile',
      title: 'Cotton Saree Covers',
      subtitle: 'Breathable protection for your precious silks.',
      tag: 'WARDROBE CARE',
      cta: 'Shop Saree Covers',
      cta_link: '/catalog?category=textile',
      image: '/banner-designs/banner-saree-cover-desktop.svg',
      mobile_image: '/banner-designs/banner-saree-cover-mobile.svg',
      gradient_from: '#F7F8FA',
      gradient_via: '#EEF2F6',
      gradient_to: '#E9ECF1',
      accent_color: '#27384A',
      display_order: 4,
      is_active: 1,
      visibility: 'ALL',
      show_text_overlay: 0
    }
  ];

  for (const b of newBanners) {
    await conn.query(`
      INSERT INTO app_banners (
        id, category, title, subtitle, tag, cta, cta_link,
        image, mobile_image, gradient_from, gradient_via, gradient_to,
        accent_color, display_order, is_active, visibility, show_text_overlay
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        category = VALUES(category),
        title = VALUES(title),
        subtitle = VALUES(subtitle),
        tag = VALUES(tag),
        cta = VALUES(cta),
        cta_link = VALUES(cta_link),
        image = VALUES(image),
        mobile_image = VALUES(mobile_image),
        gradient_from = VALUES(gradient_from),
        gradient_via = VALUES(gradient_via),
        gradient_to = VALUES(gradient_to),
        accent_color = VALUES(accent_color),
        display_order = VALUES(display_order),
        is_active = VALUES(is_active),
        visibility = VALUES(visibility),
        show_text_overlay = VALUES(show_text_overlay)
    `, [
      b.id, b.category, b.title, b.subtitle, b.tag, b.cta, b.cta_link,
      b.image, b.mobile_image, b.bgStart || b.gradient_from, b.bgVia || b.gradient_via, b.bgEnd || b.gradient_to,
      b.accent_color, b.display_order, b.is_active, b.visibility, b.show_text_overlay
    ]);
  }

  console.log(`Successfully inserted/updated ${newBanners.length} banners in app_banners table.`);

  // Audit active banners
  const [active] = await conn.query('SELECT id, title, subtitle, tag, image, cta, display_order FROM app_banners WHERE is_active = 1 ORDER BY display_order');
  console.log('Active Banners in Database:');
  console.log(JSON.stringify(active, null, 2));

  await conn.end();
}

updateBanners().catch(console.error);
