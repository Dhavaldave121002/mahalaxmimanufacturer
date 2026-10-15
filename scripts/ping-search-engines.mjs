// Automated Live Search Engine Ping & IndexNow Submitter for Mahalaxmi Enterprises
import https from 'https';

const DOMAIN = 'mahalaxmimanufacturer.com';
const SITEMAP_URL = `https://${DOMAIN}/sitemap.xml`;
const KEY = 'd80f4f91899147cbba1b7e42d7658c14';

const urlsToPing = [
  `https://${DOMAIN}/`,
  `https://${DOMAIN}/wholesale`,
  `https://${DOMAIN}/catalog`,
  `https://${DOMAIN}/category/textile`,
  `https://${DOMAIN}/category/cotton-products`,
  `https://${DOMAIN}/category/home-kitchen`,
  `https://${DOMAIN}/category/household`,
  `https://${DOMAIN}/product/glance-300-tc-cotton-double-bedsheet`,
  `https://${DOMAIN}/product/hospitality-grade-600-gsm-bath-towel`,
  `https://${DOMAIN}/product/canvas-shopping-tote-bag`,
  `https://${DOMAIN}/product/microfiber-cleaning-cloths-pack-of-24`
];

async function submitIndexNow() {
  const payload = JSON.stringify({
    host: DOMAIN,
    key: KEY,
    keyLocation: `https://${DOMAIN}/${KEY}.txt`,
    urlList: urlsToPing
  });

  console.log(`[IndexNow] Pinging api.indexnow.org for ${urlsToPing.length} URLs...`);

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.indexnow.org',
      port: 443,
      path: '/indexnow',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, res => {
      console.log(`[IndexNow] Status Code: ${res.statusCode} ${res.statusMessage}`);
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 202) {
          console.log('[IndexNow] Success! Search engines notified for instant crawling.');
        } else {
          console.log(`[IndexNow] Response: ${data}`);
        }
        resolve();
      });
    });

    req.on('error', err => {
      console.error('[IndexNow Error]:', err.message);
      resolve();
    });

    req.write(payload);
    req.end();
  });
}

async function pingSearchEngines() {
  await submitIndexNow();
  console.log('⚡ All live search engines pinged successfully!');
}

pingSearchEngines();
