require('dotenv').config();

const fs = require('fs');
const path = require('path');
const express = require('express');
const session = require('express-session');
const FileStore = require('session-file-store')(session);

const siteRoutes = require('./routes/site');
const adminRoutes = require('./routes/admin');
const systemRoutes = require('./routes/system');
const { getSeoSettings } = require('./helpers/store');
const { makeMeta } = require('./helpers/seo');

const app = express();
const PORT = process.env.PORT || 3000;
const BASE_URL = String(process.env.BASE_URL || `http://localhost:${PORT}`).replace(/\/+$/, '');
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const SESSION_DIR = path.join(DATA_DIR, 'sessions');

/* ===== Ensure data & session folder exist ===== */
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(SESSION_DIR)) {
  fs.mkdirSync(SESSION_DIR, { recursive: true });
}

/* ===== App locals ===== */
app.locals.baseUrl = BASE_URL;
app.locals.appName = process.env.APP_NAME || 'Mawar Parfume';

/* ===== View Engine ===== */
app.set('trust proxy', 1);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

/* ===== Body Parser ===== */
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

/* ===== Session (File Store) ===== */
app.use(session({
  store: new FileStore({
    path: SESSION_DIR,
    ttl: 60 * 60 * 24 * 7,
    reapInterval: 60 * 60
  }),
  secret: process.env.SESSION_SECRET || 'mawar-parfume-secret',
  resave: false,
  saveUninitialized: false,
  name: 'mawar.sid',
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24 * 7
  }
}));

/* ===== Global Variables for Views ===== */
app.use((req, res, next) => {
  try {
    res.locals.siteSettings = getSeoSettings();
  } catch (err) {
    res.locals.siteSettings = {};
  }

  res.locals.baseUrl = BASE_URL;
  res.locals.currentUrl = `${BASE_URL}${req.originalUrl === '/' ? '' : req.originalUrl}`;
  res.locals.appName = app.locals.appName;
  res.locals.year = new Date().getFullYear();
  next();
});

/* ===== Static Files ===== */
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

/* ===== Routes ===== */
app.use(systemRoutes);
app.use(siteRoutes);
app.use('/admin', adminRoutes);

/* ===== 404 Page ===== */
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

/* ===== Start Server ===== */
app.listen(PORT, '0.0.0.0', () => {
  console.log('====================================');
  console.log('Mawar Parfume Server Running');
  console.log('Port      :', PORT);
  console.log('Base URL  :', BASE_URL);
  console.log('Data Dir  :', DATA_DIR);
  console.log('Session   :', SESSION_DIR);
  console.log('====================================');
});
