const path = require('path');
const express = require('express');
const session = require('express-session');
const siteRoutes = require('./routes/site');
const adminRoutes = require('./routes/admin');
const systemRoutes = require('./routes/system');
const { getSeoSettings } = require('./helpers/store');
const { makeMeta } = require('./helpers/seo');

const app = express();
const PORT = process.env.PORT || 3000;
const BASE_URL = String(process.env.BASE_URL || `http://localhost:${PORT}`).replace(/\/+$/, '');

app.locals.baseUrl = BASE_URL;
app.locals.appName = process.env.APP_NAME || 'Mawar Parfume';

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'mawar-parfume-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax'
  }
}));

app.use((req, res, next) => {
  res.locals.baseUrl = BASE_URL;
  res.locals.currentUrl = `${BASE_URL}${req.originalUrl === '/' ? '' : req.originalUrl}`;
  res.locals.appName = app.locals.appName;
  res.locals.siteSettings = getSeoSettings();
  res.locals.year = new Date().getFullYear();
  next();
});

app.use('/public', express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

app.use(systemRoutes);
app.use(siteRoutes);
app.use('/admin', adminRoutes);

app.use((req, res) => {
  res.status(404).render('pages/404', {
    pageClass: 'page-404',
    activeNav: '',
    meta: makeMeta({
      title: 'Halaman tidak ditemukan',
      description: 'Halaman yang Anda cari tidak tersedia.',
      path: req.originalUrl,
      noindex: true
    }, BASE_URL),
    schema: []
  });
});

app.listen(PORT, () => {
  console.log(`Mawar Parfume running on http://localhost:${PORT}`);
});
