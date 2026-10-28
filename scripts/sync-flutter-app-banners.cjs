const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const flutterPath = 'C:\\mahalaxmi_enterprises';

const banners = [
  {
    id: 'banner-roti-cover-pro',
    category: 'Home and kitchen',
    title: 'Pure Cotton Roti Covers',
    subtitle: 'Traditional quilted weave keeps rotis warm & fresh',
    tag: '100% PURE COTTON',
    cta: 'Shop Roti Covers',
    cta_link: '/catalog?category=home-kitchen',
    image: '/banner-designs/hero-roti-cover.jpg',
    mobile_image: 'assets/images/banner_roti_cover.jpg',
    gradient_from: '#881337',
    gradient_via: '#9F1239',
    gradient_to: '#BE123C',
    accent_color: '#FBBF24',
    icon_name: 'kitchen',
    badge_icon: 'star',
    display_order: 1,
    is_active: 1,
    visibility: 'ALL',
    show_text_overlay: 1
  },
  {
    id: 'banner-veg-bag-pro',
    category: 'Household',
    title: 'Reusable Produce Bags',
    subtitle: 'Breathable cotton mesh keeps produce fresh',
    tag: 'ZERO-PLASTIC LIVING',
    cta: 'Shop Produce Bags',
    cta_link: '/catalog?category=household',
    image: '/banner-designs/hero-veg-bag.jpg',
    mobile_image: 'assets/images/banner_veg_bag.jpg',
    gradient_from: '#064E3B',
    gradient_via: '#047857',
    gradient_to: '#059669',
    accent_color: '#10B981',
    icon_name: 'cleaning',
    badge_icon: 'verified',
    display_order: 2,
    is_active: 1,
    visibility: 'ALL',
    show_text_overlay: 1
  },
  {
    id: 'banner-tote-bag-pro',
    category: 'Textile',
    title: 'Canvas Tote Bags',
    subtitle: 'Heavy-duty natural cotton, made to last',
    tag: 'DAILY ESSENTIALS',
    cta: 'Explore Tote Bags',
    cta_link: '/catalog?category=textile',
    image: '/banner-designs/hero-tote-bag.jpg',
    mobile_image: 'assets/images/banner_tote_bag.jpg',
    gradient_from: '#1E293B',
    gradient_via: '#334155',
    gradient_to: '#475569',
    accent_color: '#38BDF8',
    icon_name: 'checkroom',
    badge_icon: 'local_mall',
    display_order: 3,
    is_active: 1,
    visibility: 'ALL',
    show_text_overlay: 1
  },
  {
    id: 'banner-saree-cover-pro',
    category: 'Textile',
    title: 'Cotton Saree Covers',
    subtitle: 'Breathable transparent protection for fine silks',
    tag: 'WARDROBE CARE',
    cta: 'Shop Saree Covers',
    cta_link: '/catalog?category=textile',
    image: '/banner-designs/hero-saree-cover.jpg',
    mobile_image: 'assets/images/banner_saree_cover.jpg',
    gradient_from: '#312E81',
    gradient_via: '#4338CA',
    gradient_to: '#6366F1',
    accent_color: '#818CF8',
    icon_name: 'checkroom',
    badge_icon: 'favorite',
    display_order: 4,
    is_active: 1,
    visibility: 'ALL',
    show_text_overlay: 1
  }
];

async function syncAll() {
  // 1. MySQL
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'mahalaxmi_db'
  });

  console.log('Updating MySQL app_banners...');
  for (const b of banners) {
    await conn.query(
      `UPDATE app_banners 
       SET title = ?, subtitle = ?, tag = ?, cta = ?, cta_link = ?, 
           image = ?, mobile_image = ?, is_active = ?, display_order = ?, 
           visibility = ?, show_text_overlay = ?,
           gradient_from = ?, gradient_via = ?, gradient_to = ?,
           accent_color = ?, icon_name = ?, badge_icon = ?
       WHERE id = ?`,
      [
        b.title,
        b.subtitle,
        b.tag,
        b.cta,
        b.cta_link,
        b.image,
        b.mobile_image,
        b.is_active,
        b.display_order,
        b.visibility,
        b.show_text_overlay,
        b.gradient_from,
        b.gradient_via,
        b.gradient_to,
        b.accent_color,
        b.icon_name,
        b.badge_icon,
        b.id
      ]
    );
  }
  await conn.query(`UPDATE app_banners SET is_active = 0 WHERE id NOT IN (?, ?, ?, ?)`, banners.map(b => b.id));
  console.log('MySQL app_banners updated.');
  await conn.end();

  // 2. Flutter app_config.json
  const flutterConfigFile = path.join(flutterPath, 'assets', 'app_config.json');
  if (fs.existsSync(flutterConfigFile)) {
    const raw = fs.readFileSync(flutterConfigFile, 'utf8');
    const config = JSON.parse(raw);
    config.banners = banners.map(b => ({
      id: b.id,
      category: b.category,
      title: b.title,
      subtitle: b.subtitle,
      tag: b.tag,
      cta: b.cta,
      image: b.mobile_image,
      mobileImage: b.mobile_image,
      gradientFrom: b.gradient_from,
      gradientVia: b.gradient_via,
      gradientTo: b.gradient_to,
      accentColor: b.accent_color,
      iconName: b.icon_name,
      badgeIcon: b.badge_icon,
      isActive: true,
      displayOrder: b.display_order
    }));
    config.lastSyncedAt = new Date().toISOString();
    fs.writeFileSync(flutterConfigFile, JSON.stringify(config, null, 2), 'utf8');
    console.log('Updated', flutterConfigFile);
  }

  // 3. Web public/app-config.json
  const webConfigFile = path.join(__dirname, '..', 'public', 'app-config.json');
  if (fs.existsSync(webConfigFile)) {
    const raw = fs.readFileSync(webConfigFile, 'utf8');
    const config = JSON.parse(raw);
    config.banners = banners.map(b => ({
      id: b.id,
      category: b.category,
      title: b.title,
      subtitle: b.subtitle,
      tag: b.tag,
      cta: b.cta,
      ctaLink: b.cta_link,
      image: b.image,
      mobileImage: b.mobile_image,
      gradientFrom: b.gradient_from,
      gradientVia: b.gradient_via,
      gradientTo: b.gradient_to,
      accentColor: b.accent_color,
      iconName: b.icon_name,
      badgeIcon: b.badge_icon,
      isActive: true,
      displayOrder: b.display_order,
      showTextOverlay: true
    }));
    config.lastSyncedAt = new Date().toISOString();
    fs.writeFileSync(webConfigFile, JSON.stringify(config, null, 2), 'utf8');
    console.log('Updated', webConfigFile);
  }

  // 4. Update Flutter static fallback in lib/screens/home/home_screen.dart
  const homeScreenFile = path.join(flutterPath, 'lib', 'screens', 'home', 'home_screen.dart');
  if (fs.existsSync(homeScreenFile)) {
    let content = fs.readFileSync(homeScreenFile, 'utf8');
    // Replace the fallback roti cover category image if present
    content = content.replace(
      /'roti_cover_category\.webp'/g,
      "'banner_roti_cover.jpg'"
    );
    fs.writeFileSync(homeScreenFile, content, 'utf8');
    console.log('Updated home_screen.dart references.');
  }

  console.log('Sync complete!');
}

syncAll().catch(console.error);
