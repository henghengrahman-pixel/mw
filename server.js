require('dotenv').config();

const path = require('path');
const express = require('express');
const session = require('express-session');
const expressLayouts = require('express-ejs-layouts');
const siteRoutes = require('./routes/site');
const adminRoutes = require('./routes/admin');
const apiRoutes = require('./routes/api');
const { seoDefaults, buildCanonical } = require('./helpers/seo');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;

app.disable('x-powered-by');
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layouts/main');
app.use(expressLayouts);

app.use(express.json({ limit: '12mb' }));
app.use(express.urlencoded({ extended: true, limit: '12mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'mawar-parfum-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    }
  })
);

app.locals.appName = process.env.APP_NAME || 'Mawar Parfum';
app.locals.baseUrl = baseUrl.replace(/\/$/, '');
app.locals.currentYear = new Date().getFullYear();

app.use((req, res, next) => {
  res.locals.baseUrl = app.locals.baseUrl;
  res.locals.currentPath = req.path;
  res.locals.isAdmin = Boolean(req.session && req.session.admin);
  res.locals.layout = 'layouts/main';
  res.locals.seo = seoDefaults({
    title: 'Mawar Parfum – Toko Parfum Original di Poipet',
    description:
      'Mawar Parfum adalah toko parfum original di Poipet yang menyediakan parfum pria, wanita, dan unisex dengan harga terbaik di Poipet.',
    url: buildCanonical(baseUrl, req.originalUrl),
    image: `${app.locals.baseUrl}${process.env.DEFAULT_OG_IMAGE || '/images/og-cover.jpg'}`
  });
  next();
});

app.use('/', siteRoutes);
app.use('/', adminRoutes);
app.use('/', apiRoutes);

app.use((req, res) => {
  res.status(404).render('pages/404', {
    seo: seoDefaults({
      title: '404 – Halaman tidak ditemukan | Mawar Parfum',
      description: 'Halaman yang Anda cari tidak ditemukan.',
      url: buildCanonical(baseUrl, req.originalUrl)
    })
  });
});

app.use((err, req, res, next) => {
  console.error('SERVER ERROR:', err);
  if (req.originalUrl.startsWith('/api/')) {
    return res.status(500).json({ ok: false, message: 'Server error' });
  }
  return res.status(500).render('pages/500', {
    seo: seoDefaults({
      title: '500 – Server error | Mawar Parfum',
      description: 'Terjadi kesalahan pada server.',
      url: buildCanonical(baseUrl, req.originalUrl)
    }),
    errorMessage: process.env.NODE_ENV === 'production' ? 'Terjadi kesalahan.' : err.message
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
