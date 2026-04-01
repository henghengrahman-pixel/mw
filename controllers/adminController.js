const crypto = require('crypto');
const { getProducts, saveProducts, getOrders, normalizeProduct, sortProductsForShop } = require('./_shared');
const { seoDefaults, buildCanonical } = require('../helpers/seo');
const { slugify } = require('../helpers/slug');

exports.requireAdmin = (req, res, next) => {
  if (req.session && req.session.admin) return next();
  if (req.originalUrl.startsWith('/api/')) return res.status(401).json({ ok: false, message: 'Unauthorized' });
  return res.redirect('/admin/login');
};

exports.loginPage = (req, res) => {
  if (req.session && req.session.admin) return res.redirect('/admin/dashboard');
  res.render('pages/admin/login', {
    seo: seoDefaults({
      title: 'Login Admin | Mawar Parfum',
      description: 'Login admin Mawar Parfum.',
      url: buildCanonical(req.app.locals.baseUrl, req.originalUrl)
    }),
    layout: 'layouts/admin',
    pageTitle: 'Login Admin'
  });
};

exports.login = (req, res) => {
  const { id, password } = req.body || {};
  if (!process.env.ADMIN_ID || !process.env.ADMIN_PASSWORD) {
    return res.status(500).send('ENV ADMIN_ID / ADMIN_PASSWORD belum diset');
  }
  if (id === process.env.ADMIN_ID && password === process.env.ADMIN_PASSWORD) {
    req.session.admin = true;
    return res.json({ ok: true });
  }
  return res.status(401).send('Login gagal');
};

exports.logout = (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
};

exports.me = (req, res) => {
  if (req.session && req.session.admin) return res.json({ ok: true, id: process.env.ADMIN_ID });
  return res.status(401).send('Unauthorized');
};

exports.dashboard = (req, res) => {
  const products = sortProductsForShop(getProducts());
  const orders = getOrders();
  res.render('pages/admin/dashboard', {
    layout: 'layouts/admin',
    seo: seoDefaults({
      title: 'Dashboard Admin | Mawar Parfum',
      description: 'Dashboard admin Mawar Parfum.',
      url: buildCanonical(req.app.locals.baseUrl, req.originalUrl)
    }),
    pageTitle: 'Dashboard Admin',
    stats: {
      totalProducts: products.length,
      activeProducts: products.filter((item) => item.active).length,
      soldOutProducts: products.filter((item) => item.soldOut).length,
      totalOrders: orders.length
    },
    products,
    orders
  });
};

exports.listProducts = (req, res) => {
  return res.json(sortProductsForShop(getProducts()));
};

exports.createProduct = (req, res) => {
  const products = getProducts();
  const item = normalizeProduct({
    ...req.body,
    id: crypto.randomUUID(),
    slug: slugify(req.body.slug || req.body.name || '')
  });
  products.unshift(item);
  saveProducts(products);
  return res.json(item);
};

exports.updateProduct = (req, res) => {
  const products = getProducts();
  const index = products.findIndex((item) => item.id === req.params.id);
  if (index === -1) return res.status(404).send('Not found');

  products[index] = normalizeProduct({
    ...products[index],
    ...req.body,
    id: products[index].id,
    slug: slugify(req.body.slug || req.body.name || products[index].name)
  });

  saveProducts(products);
  return res.json(products[index]);
};

exports.deleteProduct = (req, res) => {
  const products = getProducts().filter((item) => item.id !== req.params.id);
  saveProducts(products);
  return res.json({ ok: true });
};

exports.listOrders = (req, res) => {
  return res.json({ ok: true, orders: getOrders() });
};
