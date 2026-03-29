const express = require('express');
const { getProducts, getArticles } = require('../helpers/store');

const router = express.Router();

router.get('/sitemap.xml', (req, res) => {
  const baseUrl = req.app.locals.baseUrl;
  const urls = [
    '/',
    '/produk',
    '/artikel',
    '/tentang',
    '/kontak'
  ];

  const productUrls = getProducts().map((item) => `/produk/${item.slug}`);
  const articleUrls = getArticles().map((item) => `/artikel/${item.slug}`);

  const allUrls = [...urls, ...productUrls, ...articleUrls];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map((url) => `  <url>
    <loc>${baseUrl}${url === '/' ? '' : url}</loc>
    <changefreq>${url.startsWith('/produk/') || url.startsWith('/artikel/') ? 'weekly' : 'daily'}</changefreq>
    <priority>${url === '/' ? '1.0' : '0.8'}</priority>
  </url>`).join('\n')}
</urlset>`;

  res.type('application/xml').send(xml);
});

router.get('/robots.txt', (req, res) => {
  const baseUrl = req.app.locals.baseUrl;
  res.type('text/plain').send(`User-agent: *
Allow: /

Sitemap: ${baseUrl}/sitemap.xml`);
});

module.exports = router;
