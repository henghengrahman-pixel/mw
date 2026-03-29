const express = require('express');
const {
  getProducts,
  saveProducts,
  getArticles,
  saveArticles,
  getSeoSettings,
  saveSeoSettings,
  normalizeProduct,
  normalizeArticle
} = require('../helpers/store');
const { makeMeta } = require('../helpers/seo');
const { requireAdmin } = require('../middleware/admin');

const router = express.Router();

router.get('/login', (req, res) => {
  if (req.session && req.session.admin) {
    return res.redirect('/admin');
  }

  res.render('admin/login', {
    layout: false,
    pageClass: 'page-admin-login',
    activeNav: '',
    error: req.query.error || '',
    meta: makeMeta({
      title: 'Admin Login | Mawar Parfume',
      description: 'Halaman login admin Mawar Parfume.',
      path: '/admin/login',
      noindex: true
    }, req.app.locals.baseUrl),
    schema: []
  });
});

router.post('/login', (req, res) => {
  const { id, password } = req.body;
  const validId = process.env.ADMIN_ID || 'admin';
  const validPassword = process.env.ADMIN_PASSWORD || 'admin123';
  if (id === validId && password === validPassword) {
    req.session.admin = true;
    req.session.adminId = id;
    return res.redirect('/admin');
  }
  return res.redirect('/admin/login?error=Login%20gagal');
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/admin/login'));
});

router.get('/', requireAdmin, (req, res) => {
  const products = getProducts();
  const articles = getArticles();
  const settings = getSeoSettings();

  res.render('admin/dashboard', {
    layout: false,
    pageClass: 'page-admin',
    current: 'dashboard',
    stats: {
      products: products.length,
      articles: articles.length,
      featured: products.filter((item) => item.featured).length
    },
    settings
  });
});

router.get('/produk', requireAdmin, (req, res) => {
  res.render('admin/products', {
    layout: false,
    pageClass: 'page-admin',
    current: 'products',
    products: getProducts()
  });
});

router.post('/produk', requireAdmin, (req, res) => {
  const products = getProducts();
  const item = normalizeProduct(req.body);
  products.unshift(item);
  saveProducts(products);
  res.redirect('/admin/produk');
});

router.post('/produk/:id/update', requireAdmin, (req, res) => {
  const products = getProducts();
  const index = products.findIndex((item) => item.id === req.params.id);
  if (index >= 0) {
    products[index] = normalizeProduct({
      ...products[index],
      ...req.body,
      id: products[index].id,
      createdAt: products[index].createdAt
    });
    saveProducts(products);
  }
  res.redirect('/admin/produk');
});

router.post('/produk/:id/delete', requireAdmin, (req, res) => {
  const products = getProducts().filter((item) => item.id !== req.params.id);
  saveProducts(products);
  res.redirect('/admin/produk');
});

router.get('/artikel', requireAdmin, (req, res) => {
  res.render('admin/articles', {
    layout: false,
    pageClass: 'page-admin',
    current: 'articles',
    articles: getArticles()
  });
});

router.post('/artikel', requireAdmin, (req, res) => {
  const articles = getArticles();
  articles.unshift(normalizeArticle(req.body));
  saveArticles(articles);
  res.redirect('/admin/artikel');
});

router.post('/artikel/:id/update', requireAdmin, (req, res) => {
  const articles = getArticles();
  const index = articles.findIndex((item) => item.id === req.params.id);
  if (index >= 0) {
    articles[index] = normalizeArticle({
      ...articles[index],
      ...req.body,
      id: articles[index].id,
      createdAt: articles[index].createdAt
    });
    saveArticles(articles);
  }
  saveArticles(articles);
  res.redirect('/admin/artikel');
});

router.post('/artikel/:id/delete', requireAdmin, (req, res) => {
  saveArticles(getArticles().filter((item) => item.id !== req.params.id));
  res.redirect('/admin/artikel');
});

router.get('/seo', requireAdmin, (req, res) => {
  res.render('admin/seo', {
    layout: false,
    pageClass: 'page-admin',
    current: 'seo',
    settings: getSeoSettings()
  });
});

router.post('/seo', requireAdmin, (req, res) => {
  saveSeoSettings({
    ...req.body
  });
  res.redirect('/admin/seo');
});

module.exports = router;
