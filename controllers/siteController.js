const fs = require('fs');
const path = require('path');
const { getProducts, sortProductsForShop } = require('./_shared');
const { buildCanonical, seoDefaults, organizationSchema, breadcrumbSchema, productSchema } = require('../helpers/seo');
const { slugify } = require('../helpers/slug');

function baseSchemas(req, extras = []) {
  const baseUrl = req.app.locals.baseUrl;
  return [
    organizationSchema({
      baseUrl,
      logo: `${baseUrl}${process.env.STORE_LOGO || '/images/logo.png'}`
    }),
    ...extras
  ];
}

exports.home = (req, res) => {
  const products = sortProductsForShop(getProducts().filter((item) => item.active));
  const featured = products.filter((item) => item.topSeller).slice(0, 8);
  const seo = seoDefaults({
    title: 'Mawar Parfum – Toko Parfum Original di Poipet',
    description:
      'Mawar Parfum adalah toko parfum original di Poipet yang menyediakan parfum pria, wanita, dan unisex dengan harga terbaik di Poipet.',
    url: buildCanonical(req.app.locals.baseUrl, req.originalUrl),
    image: `${req.app.locals.baseUrl}${process.env.DEFAULT_OG_IMAGE || '/images/og-cover.jpg'}`,
    keywords: [
      'Mawar Parfum',
      'Parfum Poipet',
      'Mawar Parfum Poipet',
      'Toko parfum di Poipet',
      'Parfum original Poipet',
      'Parfum pria Poipet',
      'Parfum wanita Poipet'
    ]
  });

  const schemas = baseSchemas(req, [
    breadcrumbSchema([{ name: 'Home', url: seo.url }])
  ]);

  res.render('pages/home', {
    seo,
    schemas,
    products,
    featured,
    pageTitle: 'Home'
  });
};

exports.products = (req, res) => {
  const q = String(req.query.q || '').trim().toLowerCase();
  const category = String(req.query.category || '').toUpperCase().trim();
  let products = sortProductsForShop(getProducts().filter((item) => item.active));

  if (category) products = products.filter((item) => item.category === category);
  if (q) {
    products = products.filter((item) =>
      [item.name, item.desc, item.category, item.aroma].join(' ').toLowerCase().includes(q)
    );
  }

  const seo = seoDefaults({
    title: 'Produk Parfum Original Poipet | Mawar Parfum',
    description:
      'Lihat koleksi parfum pria, wanita, dan unisex dari Mawar Parfum Poipet. Produk original, ready stock, dan pilihan top seller terbaik.',
    url: buildCanonical(req.app.locals.baseUrl, req.originalUrl),
    image: `${req.app.locals.baseUrl}${process.env.DEFAULT_OG_IMAGE || '/images/og-cover.jpg'}`,
    type: 'website'
  });

  const schemas = baseSchemas(req, [
    breadcrumbSchema([
      { name: 'Home', url: buildCanonical(req.app.locals.baseUrl, '/') },
      { name: 'Produk', url: seo.url }
    ])
  ]);

  res.render('pages/product-list', {
    seo,
    schemas,
    products,
    query: q,
    category,
    pageTitle: 'Produk'
  });
};

exports.productDetail = (req, res) => {
  const products = getProducts().filter((item) => item.active);
  const slug = slugify(req.params.slug);
  const product = products.find((item) => item.slug === slug);

  if (!product) {
    return res.status(404).render('pages/404', {
      seo: seoDefaults({
        title: 'Produk tidak ditemukan | Mawar Parfum',
        description: 'Produk yang Anda cari tidak ditemukan.',
        url: buildCanonical(req.app.locals.baseUrl, req.originalUrl)
      })
    });
  }

  const url = buildCanonical(req.app.locals.baseUrl, req.originalUrl);
  const seo = seoDefaults({
    title: product.metaTitle || `${product.name} | Mawar Parfum Poipet`,
    description: product.metaDescription,
    url,
    image: product.image.startsWith('http') ? product.image : `${req.app.locals.baseUrl}${product.image}`,
    type: 'product',
    keywords: [product.name, 'Mawar Parfum Poipet', `${product.name} Poipet`]
  });

  const schemas = baseSchemas(req, [
    breadcrumbSchema([
      { name: 'Home', url: buildCanonical(req.app.locals.baseUrl, '/') },
      { name: 'Produk', url: buildCanonical(req.app.locals.baseUrl, '/products') },
      { name: product.name, url }
    ]),
    productSchema({
      product,
      url,
      image: seo.image
    })
  ]);

  res.render('pages/product', {
    seo,
    schemas,
    product,
    relatedProducts: sortProductsForShop(products.filter((item) => item.id !== product.id)).slice(0, 6),
    pageTitle: product.name
  });
};

exports.checkout = (req, res) => {
  const seo = seoDefaults({
    title: 'Checkout Parfum Original Poipet | Mawar Parfum',
    description:
      'Selesaikan checkout produk Mawar Parfum Poipet dengan aman. Upload bukti transfer, isi alamat, dan kirim pesanan ke admin.',
    url: buildCanonical(req.app.locals.baseUrl, req.originalUrl),
    image: `${req.app.locals.baseUrl}${process.env.DEFAULT_OG_IMAGE || '/images/og-cover.jpg'}`
  });

  const schemas = baseSchemas(req, [
    breadcrumbSchema([
      { name: 'Home', url: buildCanonical(req.app.locals.baseUrl, '/') },
      { name: 'Checkout', url: seo.url }
    ])
  ]);

  res.render('pages/checkout', {
    seo,
    schemas,
    pageTitle: 'Checkout'
  });
};

exports.robots = (req, res) => {
  const content = fs.readFileSync(path.join(process.cwd(), 'robots.txt'), 'utf8');
  res.type('text/plain').send(content);
};

exports.sitemap = (req, res) => {
  const content = fs.readFileSync(path.join(process.cwd(), 'sitemap.xml'), 'utf8');
  res.type('application/xml').send(content);
};
