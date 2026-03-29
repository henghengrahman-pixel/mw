const crypto = require('crypto');
const { FILES, readJson, writeJson } = require('./data');
const { createSlug } = require('./slug');

const productSeed = [
  {
    id: crypto.randomUUID(),
    name: 'Mawar Oud Royale',
    slug: 'mawar-oud-royale',
    category: 'unisex',
    price: 185000,
    image: '/assets/products/mawar-oud-royale.jpg',
    alt: 'Mawar Oud Royale parfum premium Mawar Parfume Poipet',
    shortDescription: 'Parfum premium dengan karakter oud, mawar, dan amber yang elegan.',
    description: 'Mawar Oud Royale adalah parfum signature dengan karakter hangat, mewah, dan tahan lama. Cocok untuk acara formal maupun pemakaian harian bagi penyuka aroma berkelas.',
    topNotes: 'Saffron, pink pepper',
    middleNotes: 'Rose, jasmine',
    baseNotes: 'Oud, amber, musk',
    volume: '35 ML',
    keywords: ['mawar parfum', 'parfum poipet', 'mawar parfume poipet'],
    inStock: true,
    featured: true,
    metaTitle: 'Mawar Oud Royale | Mawar Parfum Poipet',
    metaDescription: 'Beli Mawar Oud Royale dari Mawar Parfum Poipet. Aroma oud dan rose premium, tahan lama, elegan, dan cocok untuk pemakaian harian.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: crypto.randomUUID(),
    name: 'Mawar Velvet Bloom',
    slug: 'mawar-velvet-bloom',
    category: 'women',
    price: 169000,
    image: '/assets/products/mawar-velvet-bloom.jpg',
    alt: 'Mawar Velvet Bloom parfum wanita premium Mawar Parfume',
    shortDescription: 'Aroma floral manis yang lembut, feminin, dan nyaman dipakai seharian.',
    description: 'Velvet Bloom menghadirkan karakter floral yang soft namun tetap terasa mewah. Cocok untuk pengguna yang mencari parfum original Poipet dengan kesan elegan dan bersih.',
    topNotes: 'Pear, bergamot',
    middleNotes: 'Rose, peony',
    baseNotes: 'Vanilla, white musk',
    volume: '35 ML',
    keywords: ['mawar parfume', 'toko parfum poipet', 'rekomendasi parfum poipet'],
    inStock: true,
    featured: true,
    metaTitle: 'Mawar Velvet Bloom | Parfum Original Poipet',
    metaDescription: 'Mawar Velvet Bloom adalah parfum wanita dengan aroma floral manis, lembut, elegan, dan tahan lama dari Mawar Parfume Poipet.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: crypto.randomUUID(),
    name: 'Mawar Noir Intense',
    slug: 'mawar-noir-intense',
    category: 'men',
    price: 179000,
    image: '/assets/products/mawar-noir-intense.jpg',
    alt: 'Mawar Noir Intense parfum pria original Poipet',
    shortDescription: 'Aroma maskulin bersih dengan sentuhan woody dan musk modern.',
    description: 'Noir Intense dibuat untuk pengguna yang suka aroma rapi, modern, dan percaya diri. Cocok untuk kerja, meeting, dan aktivitas malam.',
    topNotes: 'Citrus, cardamom',
    middleNotes: 'Lavender, cedar',
    baseNotes: 'Patchouli, musk',
    volume: '35 ML',
    keywords: ['beli parfum poipet', 'parfum original poipet'],
    inStock: true,
    featured: false,
    metaTitle: 'Mawar Noir Intense | Beli Parfum Poipet',
    metaDescription: 'Cari parfum pria di Poipet? Mawar Noir Intense punya aroma woody musk yang modern, rapi, dan tahan lama.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const articleSeed = [
  {
    id: crypto.randomUUID(),
    title: 'Kenapa Mawar Parfume Jadi Pilihan untuk Pecinta Parfum Poipet',
    slug: 'kenapa-mawar-parfume-jadi-pilihan-untuk-pecinta-parfum-poipet',
    excerpt: 'Mengenal keunggulan Mawar Parfume sebagai toko parfum Poipet dengan pilihan aroma premium dan pelayanan yang rapi.',
    content: `<p>Mawar Parfume hadir untuk pelanggan yang mencari parfum premium dengan tampilan elegan, aroma tahan lama, dan pengalaman belanja yang rapi.</p>
<p>Kami memilih karakter aroma yang mudah dipakai harian, cocok untuk hadiah, dan nyaman dipakai di berbagai aktivitas.</p>
<p>Bagi pelanggan yang mencari <strong>parfum poipet</strong>, kami ingin menghadirkan pilihan yang jelas, informatif, dan mudah dibandingkan sebelum membeli.</p>`,
    coverImage: '/assets/articles/artikel-1.jpg',
    coverAlt: 'Artikel Mawar Parfume tentang parfum Poipet',
    keywords: ['mawar parfume poipet', 'parfum poipet', 'toko parfum poipet'],
    metaTitle: 'Kenapa Mawar Parfume Jadi Pilihan untuk Pecinta Parfum Poipet',
    metaDescription: 'Alasan Mawar Parfume cocok untuk Anda yang mencari parfum Poipet dengan aroma premium, tampilan elegan, dan pengalaman belanja yang lebih rapi.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: crypto.randomUUID(),
    title: 'Tips Memilih Parfum Original Poipet Sesuai Karakter Aroma',
    slug: 'tips-memilih-parfum-original-poipet-sesuai-karakter-aroma',
    excerpt: 'Panduan singkat memilih parfum original Poipet berdasarkan karakter floral, woody, musk, dan sweet.',
    content: `<p>Setiap orang punya preferensi aroma yang berbeda. Ada yang suka floral lembut, ada yang lebih suka woody maskulin, dan ada juga yang senang aroma manis yang nyaman.</p>
<p>Mulailah dari kebutuhan utama: apakah parfum dipakai harian, untuk acara khusus, atau sebagai hadiah. Setelah itu baru pilih profil aroma yang paling cocok.</p>
<p>Di Mawar Parfume, setiap produk diberi keterangan singkat agar proses memilih menjadi lebih mudah.</p>`,
    coverImage: '/assets/articles/artikel-2.jpg',
    coverAlt: 'Tips memilih parfum original Poipet',
    keywords: ['parfum original poipet', 'rekomendasi parfum poipet'],
    metaTitle: 'Tips Memilih Parfum Original Poipet Sesuai Karakter Aroma',
    metaDescription: 'Pelajari cara memilih parfum original Poipet sesuai karakter aroma agar lebih pas untuk kebutuhan harian maupun hadiah.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const seoSeed = {
  siteName: 'Mawar Parfume',
  siteTitle: 'Mawar Parfum | Parfum Poipet Premium',
  siteDescription: 'Mawar Parfume adalah toko parfum Poipet dengan pilihan aroma premium, tampilan elegan, dan pengalaman belanja yang rapi.',
  businessName: 'Mawar Parfume',
  businessType: 'LocalBusiness',
  areaServed: 'Poipet',
  address: 'Poipet, Cambodia',
  phone: '+855-000-000-000',
  email: 'hello@mawarparfume.com',
  whatsappLink: 'https://wa.me/855000000000',
  instagram: '',
  facebook: '',
  tiktok: '',
  defaultMetaTitle: 'Mawar Parfum | Parfum Poipet Premium',
  defaultMetaDescription: 'Mawar Parfume menghadirkan parfum premium dengan tampilan elegan, aroma tahan lama, dan pengalaman belanja yang rapi di Poipet.',
  homeMetaTitle: 'Mawar Parfum | Parfum Poipet Premium dan Elegan',
  homeMetaDescription: 'Mawar Parfume Poipet menghadirkan parfum premium dengan aroma elegan, informasi produk jelas, dan tampilan website yang SEO-friendly.',
  aboutMetaTitle: 'Tentang Mawar Parfume',
  aboutMetaDescription: 'Kenal lebih dekat dengan Mawar Parfume, toko parfum Poipet dengan fokus pada kualitas aroma dan pengalaman belanja yang rapi.',
  contactMetaTitle: 'Kontak Mawar Parfume',
  contactMetaDescription: 'Hubungi Mawar Parfume untuk pertanyaan produk, pemesanan, atau kerja sama.'
};

function normalizeProduct(input = {}) {
  const now = new Date().toISOString();
  const name = String(input.name || '').trim();
  return {
    id: input.id || crypto.randomUUID(),
    name,
    slug: input.slug ? createSlug(input.slug) : createSlug(name),
    category: String(input.category || 'unisex').trim().toLowerCase(),
    price: Number(input.price || 0),
    image: String(input.image || '').trim() || '/assets/og-cover.jpg',
    alt: String(input.alt || `${name} parfum premium Mawar Parfume`).trim(),
    shortDescription: String(input.shortDescription || '').trim(),
    description: String(input.description || '').trim(),
    topNotes: String(input.topNotes || '').trim(),
    middleNotes: String(input.middleNotes || '').trim(),
    baseNotes: String(input.baseNotes || '').trim(),
    volume: String(input.volume || '35 ML').trim(),
    keywords: Array.isArray(input.keywords) ? input.keywords : String(input.keywords || '').split(',').map((item) => item.trim()).filter(Boolean),
    inStock: input.inStock !== false && String(input.inStock) !== 'false',
    featured: String(input.featured) === 'true' || input.featured === true,
    metaTitle: String(input.metaTitle || name).trim(),
    metaDescription: String(input.metaDescription || input.shortDescription || '').trim(),
    createdAt: input.createdAt || now,
    updatedAt: now
  };
}

function normalizeArticle(input = {}) {
  const now = new Date().toISOString();
  const title = String(input.title || '').trim();
  return {
    id: input.id || crypto.randomUUID(),
    title,
    slug: input.slug ? createSlug(input.slug) : createSlug(title),
    excerpt: String(input.excerpt || '').trim(),
    content: String(input.content || '').trim(),
    coverImage: String(input.coverImage || '').trim() || '/assets/og-cover.jpg',
    coverAlt: String(input.coverAlt || `${title} Mawar Parfume`).trim(),
    keywords: Array.isArray(input.keywords) ? input.keywords : String(input.keywords || '').split(',').map((item) => item.trim()).filter(Boolean),
    metaTitle: String(input.metaTitle || title).trim(),
    metaDescription: String(input.metaDescription || input.excerpt || '').trim(),
    createdAt: input.createdAt || now,
    updatedAt: now
  };
}

function getProducts() {
  return readJson(FILES.products, productSeed).map(normalizeProduct);
}

function saveProducts(products) {
  writeJson(FILES.products, products.map(normalizeProduct));
}

function getArticles() {
  return readJson(FILES.articles, articleSeed).map(normalizeArticle);
}

function saveArticles(articles) {
  writeJson(FILES.articles, articles.map(normalizeArticle));
}

function getSeoSettings() {
  return readJson(FILES.seo, seoSeed);
}

function saveSeoSettings(settings) {
  writeJson(FILES.seo, {
    ...seoSeed,
    ...settings
  });
}

module.exports = {
  getProducts,
  saveProducts,
  getArticles,
  saveArticles,
  getSeoSettings,
  saveSeoSettings,
  normalizeProduct,
  normalizeArticle
};
