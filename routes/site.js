const express = require('express');
const {
  getProducts,
  getArticles,
  getSeoSettings
} = require('../helpers/store');
const {
  makeMeta,
  breadcrumbSchema,
  organizationSchema,
  productSchema,
  articleSchema
} = require('../helpers/seo');

const router = express.Router();

function buildLocals(req) {
  const settings = getSeoSettings();
  const baseUrl = resBaseUrl(req);
  return { settings, baseUrl };
}

function resBaseUrl(req) {
  return req.app.locals.baseUrl;
}

router.get('/', (req, res) => {
  const products = getProducts().filter((item) => item.inStock);
  const articles = getArticles();
  const settings = getSeoSettings();
  const baseUrl = resBaseUrl(req);
  const meta = makeMeta({
    title: settings.homeMetaTitle,
    description: settings.homeMetaDescription,
    path: '/'
  }, baseUrl);

  res.render('pages/home', {
    pageClass: 'page-home',
    activeNav: 'home',
    products: products.slice(0, 6),
    articles: articles.slice(0, 3),
    meta,
    schema: [
      organizationSchema(settings, baseUrl),
      breadcrumbSchema([{ name: 'Home', path: '/' }], baseUrl)
    ]
  });
});

router.get('/produk', (req, res) => {
  const keyword = String(req.query.q || '').trim().toLowerCase();
  const products = getProducts().filter((item) => {
    if (!keyword) return true;
    const haystack = [
      item.name,
      item.shortDescription,
      item.description,
      item.category,
      ...(item.keywords || [])
    ].join(' ').toLowerCase();
    return haystack.includes(keyword);
  });

  const settings = getSeoSettings();
  const baseUrl = resBaseUrl(req);
  const meta = makeMeta({
    title: `Produk ${settings.siteName} | Mawar Parfum`,
    description: 'Lihat koleksi parfum premium Mawar Parfume Poipet. Temukan aroma floral, woody, musk, dan pilihan parfum original Poipet.',
    path: keyword ? `/produk?q=${encodeURIComponent(keyword)}` : '/produk'
  }, baseUrl);

  res.render('pages/products', {
    pageClass: 'page-products',
    activeNav: 'products',
    products,
    keyword,
    meta,
    schema: [
      breadcrumbSchema([
        { name: 'Home', path: '/' },
        { name: 'Produk', path: '/produk' }
      ], baseUrl)
    ]
  });
});

router.get('/produk/:slug', (req, res) => {
  const products = getProducts();
  const product = products.find((item) => item.slug === req.params.slug);
  if (!product) return res.status(404).render('pages/404', {
    pageClass: 'page-404',
    activeNav: '',
    meta: makeMeta({
      title: 'Produk tidak ditemukan',
      description: 'Halaman produk yang Anda cari tidak ditemukan.',
      path: req.originalUrl,
      noindex: true
    }, resBaseUrl(req)),
    schema: []
  });

  const relatedProducts = products
    .filter((item) => item.slug !== product.slug)
    .sort((a, b) => Number(b.featured) - Number(a.featured))
    .slice(0, 4);

  const baseUrl = resBaseUrl(req);
  const meta = makeMeta({
    title: product.metaTitle || `${product.name} | Mawar Parfume`,
    description: product.metaDescription || product.shortDescription,
    path: `/produk/${product.slug}`,
    type: 'product',
    image: product.image.startsWith('http') ? product.image : `${baseUrl}${product.image}`
  }, baseUrl);

  res.render('pages/product-detail', {
    pageClass: 'page-product-detail',
    activeNav: 'products',
    product,
    relatedProducts,
    meta,
    schema: [
      breadcrumbSchema([
        { name: 'Home', path: '/' },
        { name: 'Produk', path: '/produk' },
        { name: product.name, path: `/produk/${product.slug}` }
      ], baseUrl),
      productSchema(product, baseUrl)
    ]
  });
});

router.get('/artikel', (req, res) => {
  const keyword = String(req.query.q || '').trim().toLowerCase();
  const articles = getArticles().filter((item) => {
    if (!keyword) return true;
    const haystack = [
      item.title,
      item.excerpt,
      item.content,
      ...(item.keywords || [])
    ].join(' ').toLowerCase();
    return haystack.includes(keyword);
  });

  const baseUrl = resBaseUrl(req);
  const meta = makeMeta({
    title: 'Artikel Mawar Parfume',
    description: 'Baca artikel seputar parfum Poipet, tips memilih aroma, dan informasi terbaru dari Mawar Parfume.',
    path: '/artikel'
  }, baseUrl);

  res.render('pages/articles', {
    pageClass: 'page-articles',
    activeNav: 'articles',
    articles,
    keyword,
    meta,
    schema: [
      breadcrumbSchema([
        { name: 'Home', path: '/' },
        { name: 'Artikel', path: '/artikel' }
      ], baseUrl)
    ]
  });
});

router.get('/artikel/:slug', (req, res) => {
  const articles = getArticles();
  const article = articles.find((item) => item.slug === req.params.slug);
  if (!article) return res.status(404).render('pages/404', {
    pageClass: 'page-404',
    activeNav: '',
    meta: makeMeta({
      title: 'Artikel tidak ditemukan',
      description: 'Halaman artikel yang Anda cari tidak ditemukan.',
      path: req.originalUrl,
      noindex: true
    }, resBaseUrl(req)),
    schema: []
  });

  const baseUrl = resBaseUrl(req);
  const meta = makeMeta({
    title: article.metaTitle || article.title,
    description: article.metaDescription || article.excerpt,
    path: `/artikel/${article.slug}`,
    type: 'article',
    image: article.coverImage.startsWith('http') ? article.coverImage : `${baseUrl}${article.coverImage}`
  }, baseUrl);

  res.render('pages/article-detail', {
    pageClass: 'page-article-detail',
    activeNav: 'articles',
    article,
    meta,
    schema: [
      breadcrumbSchema([
        { name: 'Home', path: '/' },
        { name: 'Artikel', path: '/artikel' },
        { name: article.title, path: `/artikel/${article.slug}` }
      ], baseUrl),
      articleSchema(article, baseUrl)
    ]
  });
});

router.get('/tentang', (req, res) => {
  const settings = getSeoSettings();
  const baseUrl = resBaseUrl(req);
  const meta = makeMeta({
    title: settings.aboutMetaTitle,
    description: settings.aboutMetaDescription,
    path: '/tentang'
  }, baseUrl);

  res.render('pages/about', {
    pageClass: 'page-about',
    activeNav: 'about',
    meta,
    settings,
    schema: [
      breadcrumbSchema([
        { name: 'Home', path: '/' },
        { name: 'Tentang', path: '/tentang' }
      ], baseUrl)
    ]
  });
});

router.get('/kontak', (req, res) => {
  const settings = getSeoSettings();
  const baseUrl = resBaseUrl(req);
  const meta = makeMeta({
    title: settings.contactMetaTitle,
    description: settings.contactMetaDescription,
    path: '/kontak'
  }, baseUrl);

  res.render('pages/contact', {
    pageClass: 'page-contact',
    activeNav: 'contact',
    meta,
    settings,
    schema: [
      breadcrumbSchema([
        { name: 'Home', path: '/' },
        { name: 'Kontak', path: '/kontak' }
      ], baseUrl)
    ]
  });
});

module.exports = router;
