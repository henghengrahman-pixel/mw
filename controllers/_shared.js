const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { slugify } = require('../helpers/slug');

const VALID_CATEGORIES = ['MEN', 'WOMEN', 'UNISEX', 'MIX'];
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');

function ensureDataFiles() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(PRODUCTS_FILE)) fs.writeFileSync(PRODUCTS_FILE, '[]', 'utf8');
  if (!fs.existsSync(ORDERS_FILE)) fs.writeFileSync(ORDERS_FILE, '[]', 'utf8');
}

function getSeedProducts() {
  return [
    {
      id: crypto.randomUUID(),
      slug: 'rose-oud',
      name: 'ROSE OUD',
      price: '150000',
      desc: 'Spicy • Warm • Luxury',
      image: '/images/product-placeholder.png',
      badge: 'BESTSELLER',
      category: 'UNISEX',
      soldOut: false,
      active: true,
      topSeller: true,
      topNotes: '',
      midNotes: '',
      baseNotes: '',
      aroma: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      alt: 'Rose Oud Mawar Parfum Poipet',
      metaTitle: 'ROSE OUD | Mawar Parfum Poipet',
      metaDescription: 'ROSE OUD dari Mawar Parfum Poipet. Parfum original dengan aroma spicy, warm, dan luxury.'
    }
  ];
}

function normalizeProduct(raw = {}) {
  const name = String(raw.name || '').toUpperCase().trim();
  const slug = raw.slug ? slugify(raw.slug) : slugify(name);
  const category = VALID_CATEGORIES.includes(String(raw.category || '').toUpperCase().trim())
    ? String(raw.category || '').toUpperCase().trim()
    : 'WOMEN';
  return {
    ...raw,
    id: raw.id || crypto.randomUUID(),
    slug,
    name,
    price: String(raw.price || '0').trim(),
    desc: String(raw.desc || '').trim(),
    image: String(raw.image || '/images/product-placeholder.png').trim(),
    badge: String(raw.badge || '').trim(),
    category,
    soldOut: Boolean(raw.soldOut),
    active: raw.active !== false,
    topSeller: Boolean(raw.topSeller),
    topNotes: String(raw.topNotes || '').trim(),
    midNotes: String(raw.midNotes || '').trim(),
    baseNotes: String(raw.baseNotes || '').trim(),
    aroma: String(raw.aroma || '').trim(),
    alt: String(raw.alt || `${name} Mawar Parfum Poipet`).trim(),
    metaTitle: String(raw.metaTitle || `${name} | Mawar Parfum Poipet`).trim(),
    metaDescription: String(
      raw.metaDescription ||
        `${name} dari Mawar Parfum Poipet. Tersedia parfum original Poipet untuk pria, wanita, dan unisex.`
    ).trim(),
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function readJson(file, fallback = []) {
  ensureDataFiles();
  try {
    const raw = fs.readFileSync(file, 'utf8').trim();
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(file, value) {
  ensureDataFiles();
  fs.writeFileSync(file, JSON.stringify(value, null, 2), 'utf8');
}

function getProducts() {
  let list = readJson(PRODUCTS_FILE, []);
  if (!list.length) {
    list = getSeedProducts();
    writeJson(PRODUCTS_FILE, list);
  }
  return list.map(normalizeProduct);
}

function saveProducts(products = []) {
  writeJson(PRODUCTS_FILE, products.map(normalizeProduct));
}

function getOrders() {
  return readJson(ORDERS_FILE, []);
}

function saveOrders(orders = []) {
  writeJson(ORDERS_FILE, orders);
}

function sortProductsForShop(list = []) {
  return [...list].sort((a, b) => {
    const soldA = a.soldOut ? 1 : 0;
    const soldB = b.soldOut ? 1 : 0;
    if (soldA !== soldB) return soldA - soldB;

    const topA = a.topSeller || String(a.badge || '').toUpperCase().includes('BESTSELLER') ? 0 : 1;
    const topB = b.topSeller || String(b.badge || '').toUpperCase().includes('BESTSELLER') ? 0 : 1;
    if (topA !== topB) return topA - topB;

    const timeA = new Date(a.createdAt || 0).getTime();
    const timeB = new Date(b.createdAt || 0).getTime();
    if (timeA !== timeB) return timeB - timeA;

    return a.name.localeCompare(b.name, 'id');
  });
}

module.exports = {
  VALID_CATEGORIES,
  DATA_DIR,
  PRODUCTS_FILE,
  ORDERS_FILE,
  ensureDataFiles,
  getProducts,
  saveProducts,
  getOrders,
  saveOrders,
  normalizeProduct,
  sortProductsForShop
};
