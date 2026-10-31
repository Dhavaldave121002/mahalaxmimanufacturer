const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const banners = [
  {
    id: 'banner-roti-cover-pro',
    category: 'Home and kitchen',
    title: 'Pure Cotton Roti Covers',
    subtitle: 'Traditional quilted flower weave keeps rotis soft & fresh naturally.',
    tag: 'DIRECT MILL PRODUCER',
    cta: 'Shop Roti Covers',
    cta_link: '/catalog?category=home-kitchen',
    image: '/banner-designs/banner-roti-cover.jpg',
    mobile_image: '/banner-designs/banner-roti-cover.jpg',
    is_active: 1,
    display_order: 1,
    visibility: 'ALL',
    show_text_overlay: 1
  },
  {
    id: 'banner-veg-bag-pro',
    category: 'Household',
    title: 'Reusable Cotton Produce Bags',
    subtitle: 'Breathable cotton mesh keeps vegetables and fruits fresh for longer.',
    tag: 'ZERO-PLASTIC LIVING',
    cta: 'Shop Produce Bags',
    cta_link: '/catalog?category=household',
    image: '/banner-designs/banner-veg-bag.jpg',
    mobile_image: '/banner-designs/banner-veg-bag.jpg',
    is_active: 1,
    display_order: 2,
    visibility: 'ALL',
    show_text_overlay: 1
  },
  {
    id: 'banner-tote-bag-pro',
    category: 'Textile',
    title: 'Handcrafted Canvas Tote Bags',
    subtitle: 'Heavy-duty natural cotton canvas with premium vegan leather handles.',
    tag: 'COMMERCIAL BULK SUPPLY',
    cta: 'Explore Tote Bags',
    cta_link: '/catalog?category=textile',
    image: '/banner-designs/banner-tote-bag.jpg',
    mobile_image: '/banner-designs/banner-tote-bag.jpg',
    is_active: 1,
    display_order: 3,
    visibility: 'ALL',
    show_text_overlay: 1
  },
  {
    id: 'banner-saree-cover-pro',
    category: 'Textile',
    title: 'Quilted Cotton Saree Covers',
    subtitle: 'Breathable transparent view covers to protect and preserve fine silks.',
    tag: 'WARDROBE STORAGE CARE',
    cta: 'Shop Saree Covers',
    cta_link: '/catalog?category=textile',
    image: '/banner-designs/banner-saree-cover.jpg',
    mobile_image: '/banner-designs/banner-saree-cover.jpg',
    is_active: 1,
    display_order: 4,
    visibility: 'ALL',
    show_text_overlay: 1
  }
];

async function updateBanners() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'mahalaxmi_db'
  });

  console.log('Connected to MySQL. Updating app_banners with exact product banners...');
  for (const b of banners) {
    await conn.query(
      `UPDATE app_banners 
       SET title = ?, subtitle = ?, tag = ?, cta = ?, cta_link = ?, 
           image = ?, mobile_image = ?, is_active = ?, display_order = ?, 
           visibility = ?, show_text_overlay = ?
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
        b.id
      ]
    );
    console.log(`Updated banner: ${b.id}`);
  }

  // Deactivate all others
  await conn.query(
    `UPDATE app_banners 
     SET is_active = 0 
     WHERE id NOT IN (?, ?, ?, ?)`,
    banners.map(b => b.id)
  );

  const [activeRows] = await conn.query('SELECT id, title, image, is_active FROM app_banners WHERE is_active = 1');
  console.log('Active banners in MySQL:', activeRows);

  await conn.end();

  // Update public/app-config.json
  const configPath = path.join(__dirname, '..', 'public', 'app-config.json');
  if (fs.existsSync(configPath)) {
    const raw = fs.readFileSync(configPath, 'utf8');
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
      isActive: true,
      displayOrder: b.display_order,
      showTextOverlay: Boolean(b.show_text_overlay)
    }));
    config.lastSyncedAt = new Date().toISOString();
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
    console.log('public/app-config.json updated successfully.');
  }
}

updateBanners().catch(err => {
  console.error('Failed to update banners:', err);
  process.exit(1);
});
