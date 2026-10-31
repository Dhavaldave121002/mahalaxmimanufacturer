import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const domain = 'https://mahalaxmimanufacturer.com';
const locationData = JSON.parse(await readFile(path.join(root, 'src', 'data', 'locationPages.json'), 'utf8'));
const directory = JSON.parse(await readFile(path.join(root, 'src', 'data', 'indiaLocationDirectory.json'), 'utf8'));
const publishedProducts = JSON.parse(await readFile(path.join(root, 'public', 'products.json'), 'utf8'));
const { services } = locationData;
const { states, source } = directory;
const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[character]));
const cleanText = value => String(value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const truncate = (value, length) => value.length > length ? `${value.slice(0, length - 3).trimEnd()}...` : value;

const countryLocation = {
  url: `${domain}/locations`
};
const stateLocations = states.map(state => ({
  state,
  url: `${domain}/locations/${state.slug}`
}));
const districtLocations = states.flatMap(state => state.districts.map(district => ({
  state,
  district,
  url: `${domain}/locations/${state.slug}/districts/${district.slug}`
})));
const cityLocations = states.flatMap(state => state.cities.map(city => ({
  state,
  city,
  url: `${domain}/locations/${state.slug}/${city.slug}`
})));
const allLocations = [countryLocation, ...stateLocations, ...districtLocations, ...cityLocations];

const sitemapPath = path.join(root, 'public', 'sitemap.xml');
const sitemap = await readFile(sitemapPath, 'utf8');
const cleanedSitemap = sitemap
  .replace(/\s*<url>\s*<loc>https:\/\/mahalaxmimanufacturer\.com\/locations(?:\/[^<]*)?<\/loc>[\s\S]*?<\/url>/g, '')
  .replace(/\s*<url>\s*<loc>https:\/\/mahalaxmimanufacturer\.com\/product\/[^<]*<\/loc>[\s\S]*?<\/url>/g, '')
  .replace(/\s*<url>\s*<loc>https:\/\/mahalaxmimanufacturer\.com\/(?:account|login|track)\/?<\/loc>[\s\S]*?<\/url>/g, '');
const lastmod = new Date().toISOString().slice(0, 10);
const productSlugs = new Set();
const productEntries = publishedProducts.map(product => {
  if (typeof product.slug !== 'string' || !product.slug.trim() || productSlugs.has(product.slug)) {
    throw new Error(`Published product has a missing or duplicate slug: ${product.name || product.id || '(unknown)'}`);
  }
  productSlugs.add(product.slug);
  const image = Array.isArray(product.images) ? product.images.find(item => typeof item === 'string' && item.trim()) : '';
  const imageEntry = image
    ? `\n    <image:image>\n      <image:loc>${escapeHtml(image)}</image:loc>\n      <image:title>${escapeHtml(product.name)}</image:title>\n    </image:image>`
    : '';
  return `  <url>
    <loc>${domain}/product/${encodeURIComponent(product.slug)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>${imageEntry}
  </url>`;
}).join('\n');
const locationEntries = allLocations.map(location => `  <url>
    <loc>${location.url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${location.city ? '0.5' : location.district ? '0.6' : '0.7'}</priority>
  </url>`).join('\n');
const updatedSitemap = cleanedSitemap.replace('</urlset>', `${productEntries}\n${locationEntries}\n</urlset>`);
await writeFile(sitemapPath, updatedSitemap, 'utf8');

if (process.argv.includes('--prerender')) {
  const distPath = path.join(root, 'dist');
  const template = await readFile(path.join(distPath, 'index.html'), 'utf8');

  const writePage = async (url, relativePath, title, description, keywords, content, options = {}) => {
    const pageTitle = escapeHtml(title);
    const pageDescription = escapeHtml(description);
    const pageKeywords = escapeHtml(keywords);
    const canonical = escapeHtml(url);
    let output = template
      .replace(/<title>[^<]*<\/title>/, `<title>${pageTitle}</title>`)
      .replace(/<meta name="description" content="[^"]*"\s*\/?>/, `<meta name="description" content="${pageDescription}" />`)
      .replace(/<meta name="keywords" content="[^"]*"\s*\/?>/, `<meta name="keywords" content="${pageKeywords}" />`)
      .replace(/<link rel="canonical" href="[^"]*"\s*\/?>/, `<link rel="canonical" href="${canonical}" />`)
      .replace(/<meta property="og:url" content="[^"]*"\s*\/?>/, `<meta property="og:url" content="${canonical}" />`)
      .replace(/<meta property="og:title" content="[^"]*"\s*\/?>/, `<meta property="og:title" content="${pageTitle}" />`)
      .replace(/<meta property="og:description" content="[^"]*"\s*\/?>/, `<meta property="og:description" content="${pageDescription}" />`)
      .replace('<div id="root"></div>', `<div id="root">${content}</div>`);
    if (options.image) {
      const image = escapeHtml(options.image);
      output = output
        .replace(/<meta property="og:image" content="[^"]*"\s*\/?>/, `<meta property="og:image" content="${image}" />`)
        .replace(/<meta name="twitter:image" content="[^"]*"\s*\/?>/, `<meta name="twitter:image" content="${image}" />`);
    }
    if (options.type) {
      output = output.replace(/<meta property="og:type" content="[^"]*"\s*\/?>/, `<meta property="og:type" content="${escapeHtml(options.type)}" />`);
    }
    if (options.schema) {
      const schema = JSON.stringify(options.schema).replace(/</g, '\\u003c');
      output = output.replace('</head>', `<script id="product-schema-ldjson" type="application/ld+json">${schema}</script></head>`);
    }
    const outputPath = path.join(distPath, relativePath, 'index.html');
    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, output, 'utf8');
  };

  const stateLinks = states.map(state => `<li><a href="/locations/${escapeHtml(state.slug)}">${escapeHtml(state.name)}</a> — ${state.districts.length} districts, ${state.cities.length} cities and towns</li>`).join('');
  const countryContent = `<main><nav aria-label="Breadcrumb"><a href="/">Home</a> &gt; India</nav><h1>Explore product delivery locations across India</h1><p>Browse states, union territories, districts and cities and towns. Mahalaxmi Enterprise offers an online catalogue of cotton, textile, home utility and kitchen products. Confirm delivery serviceability for your exact PIN code before ordering.</p><p><a href="/catalog">Browse products</a> · <a href="/wholesale">Bulk and business enquiries</a></p><h2>States and union territories</h2><ul>${stateLinks}</ul><p>Place names: <a href="${escapeHtml(source.url)}">GeoNames</a> (CC BY 4.0). Directory coverage includes places with population over 500 or administrative seats down to PPLA4, along with configured cities; it does not imply local stores or guaranteed delivery.</p></main>`;
  await writePage(countryLocation.url, path.join('locations'), 'India locations | Mahalaxmi Enterprise', 'Browse states, union territories, districts and towns across India. Explore Mahalaxmi Enterprise products and confirm delivery availability by PIN code.', 'India locations, product delivery locations, states, cities and towns', countryContent);

  for (const { state, city, url } of cityLocations) {
    const districtLabel = city.district ? `, ${city.district}` : '';
    const title = `Cotton, Textile & Home Products in ${city.name} | Mahalaxmi Enterprise`;
    const description = `Explore cotton and fabric products, home utility, kitchen accessories, reusable bags and storage essentials for ${city.name}${districtLabel}, ${state.name}. Check current product details, delivery availability and bulk enquiry options.`;
    const keywords = `textile products ${city.name}, cotton products supplier ${city.name}, home utility products ${city.name}, kitchen accessories ${city.name}, tote bags wholesale ${city.name}, reusable products ${city.name}, cotton manufacturing ${city.name}, storage solutions ${city.name}, ${state.name}`;
    const serviceLinks = services.map(service => `<a class="location-service-link" href="${escapeHtml(service.href)}"><span class="location-service-image"><img src="${escapeHtml(service.image)}" alt="${escapeHtml(service.title)} products for ${escapeHtml(city.name)}" loading="lazy" width="102" height="102"></span><strong>${escapeHtml(service.title)}</strong><span>${escapeHtml(service.detail)}</span></a>`).join('');
    const staticContent = `<main><style>.location-services-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px 12px}.location-service-link{display:flex;min-width:0;flex-direction:column;align-items:center;padding:4px;text-align:center;text-decoration:none;color:#14213d}.location-service-image{display:block;width:min(160px,100%);height:auto;aspect-ratio:1;margin-bottom:10px;border:1px dashed #7dd3fc;border-radius:50%;background:#fff;padding:4px}.location-service-image img{width:100%;height:100%;border-radius:50%;object-fit:cover}.location-service-link strong{display:flex;min-height:40px;align-items:center;justify-content:center;font-size:15px;font-weight:500}.location-service-link>span:last-child{margin-top:4px;font-size:12px;line-height:16px;color:#475569}@media(min-width:640px){.location-services-grid{grid-template-columns:repeat(4,minmax(0,1fr));gap:32px 20px}}@media(min-width:1280px){.location-services-grid{grid-template-columns:repeat(7,minmax(0,1fr))}}</style><nav aria-label="Breadcrumb"><a href="/">Home</a> &gt; <a href="/locations/${escapeHtml(state.slug)}">${escapeHtml(state.name)}</a>${city.district ? ` &gt; <a href="/locations/${escapeHtml(state.slug)}/districts/${escapeHtml(city.districtSlug)}">${escapeHtml(city.district)}</a>` : ''} &gt; ${escapeHtml(city.name)}</nav><h1>Cotton, Textile &amp; Home Products for ${escapeHtml(city.name)}</h1><p>Explore Mahalaxmi Enterprise’s online range of cotton and fabric products, home utility essentials, kitchen accessories, reusable bags and storage solutions for buyers in ${escapeHtml(city.name)}${escapeHtml(districtLabel)}, ${escapeHtml(state.name)}. Product details and delivery availability are confirmed for your address before purchase.</p><h2>Products and business categories</h2><div class="location-services-grid">${serviceLinks}</div><h2>Delivery and product information</h2><p>Enter your PIN code on a product or checkout page to check delivery serviceability. Confirm current specifications, availability and pricing on each listing. This page does not represent a local store or city-specific stock guarantee.</p><p><a href="/catalog">Browse products</a> · <a href="/wholesale">Ask about bulk orders</a></p><p class="location-source">Place-name source: <a href="${escapeHtml(source.url)}">GeoNames</a> (CC BY 4.0).</p></main>`;
    await writePage(url, path.join('locations', state.slug, city.slug), title, description, keywords, staticContent);
  }

  for (const product of publishedProducts) {
    const url = `${domain}/product/${encodeURIComponent(product.slug)}`;
    const title = `${product.name} | Mahalaxmi Enterprise`;
    const summary = truncate(cleanText(product.short_description || product.description || product.name), 320);
    const description = truncate(`${product.name}: ${summary}`, 155);
    const category = product.category_name || product.categoryName || product.category_id || 'Products';
    const categoryUrl = `/category/${encodeURIComponent(product.category_id || 'textile')}`;
    const image = Array.isArray(product.images) ? product.images.find(item => typeof item === 'string' && item.trim()) : '';
    const content = `<main><nav aria-label="Breadcrumb"><a href="/">Home</a> &gt; <a href="/catalog">Catalog</a> &gt; <a href="${escapeHtml(categoryUrl)}">${escapeHtml(category)}</a> &gt; ${escapeHtml(product.name)}</nav><h1>${escapeHtml(product.name)}</h1>${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(product.name)}" width="600" height="600">` : ''}<p>${escapeHtml(summary)}</p><p>Review product specifications, current price and availability on this page. Enter your PIN code to confirm delivery serviceability before ordering.</p><p><a href="${escapeHtml(categoryUrl)}">Browse ${escapeHtml(category)} products</a> · <a href="/wholesale">Ask about bulk orders</a></p></main>`;
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      '@id': `${url}#product`,
      name: product.name,
      ...(image ? { image: [image] } : {}),
      description: summary,
      ...(product.sku ? { sku: product.sku } : {}),
      category,
      brand: { '@type': 'Brand', name: 'Mahalaxmi Enterprise' },
      manufacturer: { '@type': 'Organization', name: 'Mahalaxmi Enterprise', url: domain }
    };
    await writePage(
      url,
      path.join('product', product.slug),
      title,
      description,
      [product.name, category, product.subcategory].filter(Boolean).join(', '),
      content,
      { image, schema, type: 'product' }
    );
  }

  for (const { state, district, url } of districtLocations) {
    const title = `Cotton, Textile & Home Products in ${district.name}, ${state.name} | Mahalaxmi Enterprise`;
    const description = `Browse cotton, textile, home utility and kitchen products for customers in ${district.name}, ${state.name}. Explore towns and places in the district and check delivery by PIN code.`;
    const keywords = `textile products ${district.name}, cotton products ${district.name}, home utility ${district.name}, ${state.name}`;
    const places = state.cities.filter(city => city.districtSlug === district.slug && city.district === district.name);
    const placeLinks = places.map(city => `<li><a href="/locations/${escapeHtml(state.slug)}/${escapeHtml(city.slug)}">${escapeHtml(city.name)}</a></li>`).join('');
    const content = `<main><nav aria-label="Breadcrumb"><a href="/">Home</a> &gt; <a href="/locations/${escapeHtml(state.slug)}">${escapeHtml(state.name)}</a> &gt; ${escapeHtml(district.name)}</nav><h1>Products and delivery information for ${escapeHtml(district.name)}</h1><p>Explore the online catalogue of cotton and fabric products, home utility essentials, kitchen accessories, reusable bags and storage solutions for buyers in ${escapeHtml(district.name)}, ${escapeHtml(state.name)}. Delivery serviceability is confirmed by PIN code; this page does not represent a local store or reserved stock.</p><p><a href="/catalog">Browse products</a> · <a href="/wholesale">Bulk and business enquiries</a></p><h2>Places in ${escapeHtml(district.name)}</h2><ul>${placeLinks || '<li>Contact us with your PIN code to confirm serviceability.</li>'}</ul><p>Place-name source: <a href="${escapeHtml(source.url)}">GeoNames</a> (CC BY 4.0).</p></main>`;
    await writePage(url, path.join('locations', state.slug, 'districts', district.slug), title, description, keywords, content);
  }

  for (const { state, url } of stateLocations) {
    const title = `Cotton, Textile & Home Products in ${state.name} | Mahalaxmi Enterprise`;
    const description = `Explore cotton, textile, home utility and kitchen products available for delivery enquiries across ${state.name}. Browse districts and places, and check delivery serviceability by PIN code.`;
    const keywords = `textile products ${state.name}, cotton products ${state.name}, home utility ${state.name}, kitchen accessories ${state.name}`;
    const districtLinks = state.districts.map(district => `<li><a href="/locations/${escapeHtml(state.slug)}/districts/${escapeHtml(district.slug)}">${escapeHtml(district.name)}</a></li>`).join('');
    const popularPlaces = [...state.cities].sort((a, b) => b.population - a.population).slice(0, 30);
    const placeLinks = popularPlaces.map(city => `<li><a href="/locations/${escapeHtml(state.slug)}/${escapeHtml(city.slug)}">${escapeHtml(city.name)}</a></li>`).join('');
    const content = `<main><nav aria-label="Breadcrumb"><a href="/">Home</a> &gt; ${escapeHtml(state.name)}</nav><h1>Cotton, Textile &amp; Home Products in ${escapeHtml(state.name)}</h1><p>Explore Mahalaxmi Enterprise’s online catalogue of cotton and fabric products, home utility essentials, kitchen accessories, reusable bags and storage solutions for buyers across ${escapeHtml(state.name)}. Delivery serviceability is confirmed by PIN code; this page does not represent a local store or reserved stock.</p><p><a href="/catalog">Browse products</a> · <a href="/wholesale">Bulk and business enquiries</a></p><h2>Districts</h2><ul>${districtLinks}</ul><h2>Places</h2><ul>${placeLinks}</ul><p>Place-name source: <a href="${escapeHtml(source.url)}">GeoNames</a> (CC BY 4.0).</p></main>`;
    await writePage(url, path.join('locations', state.slug), title, description, keywords, content);
  }
}

console.log(`Generated ${publishedProducts.length} product and ${allLocations.length} location URLs in public/sitemap.xml${process.argv.includes('--prerender') ? ` and static HTML pages in dist/ (${cityLocations.length} places)` : ''}.`);
