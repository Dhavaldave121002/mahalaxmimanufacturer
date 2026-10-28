const fs = require('fs');
const path = require('path');

const sourceDir = path.join(process.cwd(), 'public', 'banner-designs', 'source-products');
const outDir = path.join(process.cwd(), 'public', 'banner-designs');

function getBase64(filename) {
  const p = path.join(sourceDir, filename);
  const buf = fs.readFileSync(p);
  return `data:image/webp;base64,${buf.toString('base64')}`;
}

const rotiBase64 = getBase64('roti_cover.webp');
const vegBase64 = getBase64('veg_bag.webp');
const toteBase64 = getBase64('tote_bag.webp');
const sareeBase64 = getBase64('saree_cover.webp');

const banners = [
  {
    key: 'roti-cover',
    tag: '100% PURE COTTON',
    title: 'Cotton Roti Covers',
    subtitle: 'Keeps rotis soft, warm & fresh naturally.',
    cta: 'Shop Roti Covers',
    bgStart: '#F5F7F4',
    bgEnd: '#E6EFE7',
    accent: '#2B5A3C',
    badgeBg: '#E2ECE3',
    badgeText: '#234C32',
    image: rotiBase64
  },
  {
    key: 'veg-bag',
    tag: 'ZERO-PLASTIC LIVING',
    title: 'Reusable Produce Bags',
    subtitle: 'Breathable cotton mesh for lasting freshness.',
    cta: 'Shop Produce Bags',
    bgStart: '#FAF6EE',
    bgEnd: '#ECE4D4',
    accent: '#473C2C',
    badgeBg: '#EDE4D2',
    badgeText: '#3B3224',
    image: vegBase64
  },
  {
    key: 'tote-bag',
    tag: 'DAILY ESSENTIALS',
    title: 'Canvas Tote Bags',
    subtitle: 'Heavy-duty natural cotton, made to last.',
    cta: 'Explore Tote Bags',
    bgStart: '#FAF3F1',
    bgEnd: '#EFE3DF',
    accent: '#4A342E',
    badgeBg: '#EFE1DC',
    badgeText: '#3F2C27',
    image: toteBase64
  },
  {
    key: 'saree-cover',
    tag: 'WARDROBE CARE',
    title: 'Cotton Saree Covers',
    subtitle: 'Breathable protection for your precious silks.',
    cta: 'Shop Saree Covers',
    bgStart: '#F7F8FA',
    bgEnd: '#E9ECF1',
    accent: '#27384A',
    badgeBg: '#E3E8EE',
    badgeText: '#202E3D',
    image: sareeBase64
  }
];

function buildDesktopSvg(b) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 500" width="1600" height="500">
  <defs>
    <linearGradient id="bg-${b.key}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${b.bgStart}"/>
      <stop offset="100%" stop-color="${b.bgEnd}"/>
    </linearGradient>
    <filter id="shadow-${b.key}" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="18" stdDeviation="24" flood-color="#1E293B" flood-opacity="0.14"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1600" height="500" fill="url(#bg-${b.key})"/>

  <!-- Subtle organic decorative ambient shape -->
  <circle cx="1200" cy="250" r="260" fill="${b.badgeBg}" opacity="0.6"/>

  <!-- Left Content Column -->
  <g transform="translate(140, 140)">
    <!-- Small Tag Badge -->
    <rect x="0" y="0" width="${b.tag.length * 10 + 32}" height="32" rx="16" fill="${b.badgeBg}"/>
    <text x="16" y="21" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif" font-size="12" font-weight="700" letter-spacing="1.5" fill="${b.badgeText}">${b.tag}</text>

    <!-- Headline (Big, Clean, Minimal) -->
    <text x="0" y="90" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif" font-size="52" font-weight="800" letter-spacing="-1" fill="${b.accent}">${b.title}</text>

    <!-- Subtitle (1 Short Sentence) -->
    <text x="0" y="135" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif" font-size="20" font-weight="500" fill="${b.accent}" opacity="0.78">${b.subtitle}</text>

    <!-- Clean Pill Button -->
    <g transform="translate(0, 175)">
      <rect width="210" height="52" rx="26" fill="${b.accent}"/>
      <text x="105" y="32" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif" font-size="15" font-weight="700" letter-spacing="0.5" fill="#FFFFFF">${b.cta} →</text>
    </g>
  </g>

  <!-- Right Product Image (Real User Product) -->
  <g transform="translate(1000, 45)" filter="url(#shadow-${b.key})">
    <image href="${b.image}" x="0" y="0" width="410" height="410" preserveAspectRatio="xMidYMid meet"/>
  </g>
</svg>`;
}

function buildMobileSvg(b) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 500" width="600" height="500">
  <defs>
    <linearGradient id="bg-m-${b.key}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${b.bgStart}"/>
      <stop offset="100%" stop-color="${b.bgEnd}"/>
    </linearGradient>
    <filter id="shadow-m-${b.key}" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#1E293B" flood-opacity="0.12"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="600" height="500" fill="url(#bg-m-${b.key})"/>
  <circle cx="300" cy="180" r="140" fill="${b.badgeBg}" opacity="0.7"/>

  <!-- Top Center Product Image (Real User Product) -->
  <g transform="translate(170, 30)" filter="url(#shadow-m-${b.key})">
    <image href="${b.image}" x="0" y="0" width="260" height="260" preserveAspectRatio="xMidYMid meet"/>
  </g>

  <!-- Bottom Centered Content Column -->
  <g transform="translate(300, 330)">
    <!-- Small Tag Badge -->
    <g transform="translate(-${(b.tag.length * 8 + 24) / 2}, 0)">
      <rect x="0" y="0" width="${b.tag.length * 8 + 24}" height="26" rx="13" fill="${b.badgeBg}"/>
      <text x="${(b.tag.length * 8 + 24) / 2}" y="17" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif" font-size="10" font-weight="700" letter-spacing="1.2" fill="${b.badgeText}">${b.tag}</text>
    </g>

    <!-- Headline -->
    <text x="0" y="52" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif" font-size="28" font-weight="800" letter-spacing="-0.5" fill="${b.accent}">${b.title}</text>

    <!-- Subtitle -->
    <text x="0" y="78" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif" font-size="13" font-weight="500" fill="${b.accent}" opacity="0.8">${b.subtitle}</text>

    <!-- Pill Button -->
    <g transform="translate(-90, 96)">
      <rect width="180" height="42" rx="21" fill="${b.accent}"/>
      <text x="90" y="26" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif" font-size="13" font-weight="700" fill="#FFFFFF">${b.cta} →</text>
    </g>
  </g>
</svg>`;
}

for (const b of banners) {
  const deskPath = path.join(outDir, `banner-${b.key}-desktop.svg`);
  const mobPath = path.join(outDir, `banner-${b.key}-mobile.svg`);
  fs.writeFileSync(deskPath, buildDesktopSvg(b), 'utf8');
  fs.writeFileSync(mobPath, buildMobileSvg(b), 'utf8');
  console.log(`Generated: ${b.key} (desktop & mobile)`);
}

console.log('All 4 EcoRight / EcoCarry style banners generated successfully!');
