const express = require("express");
const session = require("express-session");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const app = express();

// ===== ENV (Railway Variables) =====
const ADMIN_ID = process.env.ADMIN_ID;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const BOT_TOKEN = process.env.BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// ✅ kategori valid (tambah MIX)
const VALID_CATEGORIES = ["MEN", "WOMEN", "UNISEX", "MIX"];

// ===== PERSIST VIA VOLUME (/data) =====
const DATA_DIR = process.env.DATA_DIR || "/data";
const PRODUCTS_FILE = path.join(DATA_DIR, "products.json");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");

// ===== Helpers: File Init =====
function ensureDataFiles() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(PRODUCTS_FILE)) fs.writeFileSync(PRODUCTS_FILE, "", "utf8");
    if (!fs.existsSync(ORDERS_FILE)) fs.writeFileSync(ORDERS_FILE, "", "utf8");
  } catch (e) {
    console.error("ensureDataFiles error:", e);
  }
}

// ===== Seed Products =====
function getSeedProducts() {
  return [
    {
      id: crypto.randomUUID(),
      name: "ROSE OUD",
      price: "150000",
      desc: "Spicy • Warm • Luxury",
      image: "https://via.placeholder.com/600x900.png?text=ROSE+OUD",
      badge: "BESTSELLER",
      category: "UNISEX",
      soldOut: false,
      active: true,
      topSeller: true,
      topNotes: "",
      midNotes: "",
      baseNotes: "",
      aroma: "",
      createdAt: new Date().toISOString(),
    },
    {
      id: crypto.randomUUID(),
      name: "ROSE VANILLA",
      price: "175000",
      desc: "Sweet • Cozy • Elegant",
      image: "https://via.placeholder.com/600x900.png?text=ROSE+VANILLA",
      badge: "REFILLABLE",
      category: "WOMEN",
      soldOut: true,
      active: true,
      topSeller: false,
      topNotes: "",
      midNotes: "",
      baseNotes: "",
      aroma: "",
      createdAt: new Date().toISOString(),
    },
  ];
}

// ===== Load/Save Products =====
function loadProducts() {
  try {
    ensureDataFiles();
    const raw = fs.readFileSync(PRODUCTS_FILE, "utf8") || "";
    const txt = raw.trim();

    if (!txt) {
      const seed = getSeedProducts();
      fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(seed, null, 2), "utf8");
      return seed;
    }

    const parsed = JSON.parse(txt);
    if (!Array.isArray(parsed)) throw new Error("products.json is not an array");

    return parsed.map((p) => ({
      ...p,
      name: String(p?.name || "").toUpperCase().trim(),
      price: String(p?.price || "0").trim(),
      category: VALID_CATEGORIES.includes(String(p?.category || "").toUpperCase().trim())
        ? String(p.category).toUpperCase().trim()
        : "WOMEN",
      soldOut: !!p?.soldOut,
      active: p?.active !== false,
      topSeller: !!p?.topSeller,
      badge: String(p?.badge || "").trim(),
      createdAt: p?.createdAt || new Date().toISOString(),
    }));
  } catch (e) {
    console.error("loadProducts error:", e);
    const seed = getSeedProducts();
    try {
      fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(seed, null, 2), "utf8");
    } catch {}
    return seed;
  }
}

function saveProducts(products) {
  try {
    ensureDataFiles();
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2), "utf8");
  } catch (e) {
    console.error("saveProducts error:", e);
  }
}

// ===== Load/Save Orders =====
function loadOrders() {
  try {
    ensureDataFiles();
    const raw = fs.readFileSync(ORDERS_FILE, "utf8") || "";
    const txt = raw.trim();
    if (!txt) {
      fs.writeFileSync(ORDERS_FILE, JSON.stringify([], null, 2), "utf8");
      return [];
    }
    const parsed = JSON.parse(txt);
    if (!Array.isArray(parsed)) throw new Error("orders.json is not an array");
    return parsed;
  } catch (e) {
    console.error("loadOrders error:", e);
    try {
      fs.writeFileSync(ORDERS_FILE, JSON.stringify([], null, 2), "utf8");
    } catch {}
    return [];
  }
}

function saveOrders(orders) {
  try {
    ensureDataFiles();
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), "utf8");
  } catch (e) {
    console.error("saveOrders error:", e);
  }
}

let products = loadProducts();
let orders = loadOrders();

function safeReloadProducts() {
  products = loadProducts();
}
function safeReloadOrders() {
  orders = loadOrders();
}

// =====================================================
// ✅ HTML INJECTOR (ANTI ZOOM CONSISTENT)
// - inject viewport + anti-zoom.js + guard css ke semua *.html
// - ini yang bikin "klik keranjang" tidak bikin zoom random lagi di iOS
// =====================================================
const PUBLIC_DIR = path.join(__dirname, "public");
const VIEWPORT_DESIRED =
  'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover';

function injectIntoHead(html) {
  let out = String(html || "");

  // 1) Ensure meta viewport desired
  if (/<meta\s+name=["']viewport["']/i.test(out)) {
    out = out.replace(
      /<meta\s+name=["']viewport["'][^>]*>/i,
      `<meta name="viewport" content="${VIEWPORT_DESIRED}">`
    );
  } else {
    out = out.replace(
      /<head[^>]*>/i,
      (m) => `${m}\n  <meta name="viewport" content="${VIEWPORT_DESIRED}">`
    );
  }

  // 2) Ensure anti-zoom script exists (defer)
  if (!/\/js\/anti-zoom\.js/i.test(out)) {
    out = out.replace(
      /<\/head>/i,
      `  <script src="/js/anti-zoom.js" defer></script>\n</head>`
    );
  }

  // 3) Guard CSS minimal (iOS input zoom + tap)
  if (!/data-zoom-guard=["']1["']/i.test(out)) {
    const guard = `
  <style data-zoom-guard="1">
    html{-webkit-text-size-adjust:100%;text-size-adjust:100%;}
    input,textarea,select,button{font-size:16px;}
    a,button,.btn,.iconbtn,.cartlink,.checkout-link,.cart-close,.thumb,.size,.pill{-webkit-tap-highlight-color:transparent;touch-action:manipulation;}
  </style>
`;
    out = out.replace(/<\/head>/i, `${guard}</head>`);
  }

  return out;
}

// Serve root -> index.html (inject)
app.get("/", (req, res) => {
  const f = path.join(PUBLIC_DIR, "index.html");
  try {
    const html = fs.readFileSync(f, "utf8");
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(injectIntoHead(html));
  } catch (e) {
    res.status(404).send("index.html not found");
  }
});

// Serve any .html with injection (index/product/checkout/admin/etc)
app.get(/\/.+\.html$/i, (req, res, next) => {
  const filePath = path.join(PUBLIC_DIR, req.path.replace(/^\//, ""));
  if (!filePath.startsWith(PUBLIC_DIR)) return res.status(400).send("Bad path");

  if (!fs.existsSync(filePath)) return next();
  try {
    const html = fs.readFileSync(filePath, "utf8");
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(injectIntoHead(html));
  } catch (e) {
    console.error("HTML read error:", e);
    res.status(500).send("Server error");
  }
});

// ===== Body & Static =====
// ✅ naikkan limit supaya base64 bukti transfer tidak kepotong
app.use(express.json({ limit: "12mb" }));
app.use(express.urlencoded({ extended: true }));

// static after html-inject routes (biar .html lewat injector)
app.use(express.static("public"));

// ===== Session =====
app.use(
  session({
    secret: process.env.SESSION_SECRET || "mawar-parfum-secret",
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: "lax" },
  })
);

// ===== Helper: Admin =====
function requireAdmin(req, res, next) {
  if (req.session && req.session.admin) return next();
  return res.status(401).send("Unauthorized");
}

// ===== Helper: Telegram (HTML mode) =====
function escapeHtml(s) {
  return String(s || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

async function sendTelegram(textHtml) {
  if (!BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.log("[TG] BOT_TOKEN / TELEGRAM_CHAT_ID belum diset.");
    return;
  }
  try {
    const r = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: textHtml,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });

    if (!r.ok) {
      const t = await r.text();
      console.log("[TG] sendMessage Error:", t);
    }
  } catch (err) {
    console.error("Telegram sendMessage error:", err?.message || err);
  }
}

// ✅ helper: kirim foto bukti transfer ke Telegram
function dataUrlToBuffer(dataUrl) {
  const s = String(dataUrl || "");
  const m = s.match(/^data:(.+?);base64,(.+)$/);
  if (!m) return null;
  const mime = m[1];
  const b64 = m[2];
  const buf = Buffer.from(b64, "base64");
  return { mime, buf };
}

async function sendTelegramPhoto(dataUrl, captionHtml = "", filename = "bukti.jpg") {
  if (!BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.log("[TG] BOT_TOKEN / TELEGRAM_CHAT_ID belum diset.");
    return;
  }

  const parsed = dataUrlToBuffer(dataUrl);
  if (!parsed) {
    console.log("[TG] Bukti transfer tidak valid (bukan dataUrl base64).");
    return;
  }

  try {
    const { mime, buf } = parsed;

    // Node 18+ biasanya sudah ada FormData/Blob global.
    // Kalau environment kamu tidak punya, solusi: upgrade Node ke 18+ di Railway.
    const form = new FormData();
    const blob = new Blob([buf], { type: mime || "image/jpeg" });

    form.append("chat_id", TELEGRAM_CHAT_ID);
    form.append("photo", blob, filename);
    if (captionHtml) {
      form.append("caption", captionHtml);
      form.append("parse_mode", "HTML");
    }
    form.append("disable_web_page_preview", "true");

    const r = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
      method: "POST",
      body: form,
    });

    if (!r.ok) {
      const t = await r.text();
      console.log("[TG] sendPhoto Error:", t);
    }
  } catch (err) {
    console.error("Telegram sendPhoto error:", err?.message || err);
  }
}

function rupiah(n) {
  const num = Number(n || 0);
  return "Rp " + num.toLocaleString("id-ID");
}
function thb(n) {
  const num = Number(n || 0);
  return "฿ " + num.toLocaleString("en-US");
}

function genOrderCode() {
  return "MW-" + Date.now().toString().slice(-8);
}

// ===== SORTING (READY DI ATAS, SOLD OUT DI BAWAH) =====
function normalizeBadge(b) {
  return String(b || "")
    .split(",")
    .map((x) => x.trim().toUpperCase())
    .filter(Boolean);
}

/**
 * Rule urutan:
 * 1) ACTIVE saja (filter di endpoint)
 * 2) Ready (soldOut=false) dulu
 * 3) BESTSELLER dulu
 * 4) Terbaru dulu (createdAt)
 * 5) Fallback alfabet
 */
function sortProductsForShop(list) {
  return list.sort((a, b) => {
    const sa = a.soldOut ? 1 : 0;
    const sb = b.soldOut ? 1 : 0;
    if (sa !== sb) return sa - sb;

    const ba = normalizeBadge(a.badge).includes("BESTSELLER") ? 0 : 1;
    const bb = normalizeBadge(b.badge).includes("BESTSELLER") ? 0 : 1;
    if (ba !== bb) return ba - bb;

    const ta = new Date(a.createdAt || 0).getTime() || 0;
    const tb = new Date(b.createdAt || 0).getTime() || 0;
    if (ta !== tb) return tb - ta;

    return String(a.name || "").localeCompare(String(b.name || ""), "id");
  });
}

// ===== ADMIN AUTH =====
app.post("/admin/login", (req, res) => {
  const { id, password } = req.body || {};
  if (!ADMIN_ID || !ADMIN_PASSWORD) {
    return res.status(500).send("ENV ADMIN_ID / ADMIN_PASSWORD belum diset");
  }
  if (id === ADMIN_ID && password === ADMIN_PASSWORD) {
    req.session.admin = true;
    return res.json({ ok: true });
  }
  return res.status(401).send("Login gagal");
});

app.post("/logout", (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get("/api/admin/me", (req, res) => {
  if (req.session && req.session.admin) return res.json({ ok: true, id: ADMIN_ID });
  return res.status(401).send("Unauthorized");
});

// ===== PRODUCTS API =====
app.get("/api/products", (req, res) => {
  safeReloadProducts();
  const activeList = products.filter((p) => p.active);
  const sorted = sortProductsForShop([...activeList]);
  res.json(sorted);
});

app.get("/api/admin/products", requireAdmin, (req, res) => {
  safeReloadProducts();
  const sorted = sortProductsForShop([...products]);
  res.json(sorted);
});

app.post("/api/admin/products", requireAdmin, (req, res) => {
  safeReloadProducts();
  const p = req.body || {};

  const catRaw = String(p.category || "WOMEN").toUpperCase().trim();
  const category = VALID_CATEGORIES.includes(catRaw) ? catRaw : "WOMEN";

  const item = {
    id: crypto.randomUUID(),
    name: String(p.name || "").toUpperCase().trim(),
    price: String(p.price || "").trim(),
    desc: String(p.desc || "").trim(),
    image: String(p.image || "").trim(),
    badge: String(p.badge || "").trim(),
    category,
    soldOut: !!p.soldOut,
    active: p.active !== false,
    topSeller: !!p.topSeller,
    topNotes: String(p.topNotes || "").trim(),
    midNotes: String(p.midNotes || "").trim(),
    baseNotes: String(p.baseNotes || "").trim(),
    aroma: String(p.aroma || "").trim(),
    createdAt: new Date().toISOString(),
  };

  products.unshift(item);
  saveProducts(products);
  return res.json(item);
});

app.put("/api/admin/products/:id", requireAdmin, (req, res) => {
  safeReloadProducts();
  const id = req.params.id;
  const idx = products.findIndex((x) => x.id === id);
  if (idx === -1) return res.status(404).send("Not found");

  const p = req.body || {};
  let nextCategory = products[idx].category;

  if (p.category !== undefined) {
    const catRaw = String(p.category || "").toUpperCase().trim();
    if (VALID_CATEGORIES.includes(catRaw)) nextCategory = catRaw;
  }

  products[idx] = {
    ...products[idx],
    name: p.name !== undefined ? String(p.name).toUpperCase().trim() : products[idx].name,
    price: p.price !== undefined ? String(p.price).trim() : products[idx].price,
    desc: p.desc !== undefined ? String(p.desc).trim() : products[idx].desc,
    image: p.image !== undefined ? String(p.image).trim() : products[idx].image,
    badge: p.badge !== undefined ? String(p.badge).trim() : products[idx].badge,
    category: nextCategory,
    soldOut: p.soldOut !== undefined ? !!p.soldOut : products[idx].soldOut,
    active: p.active !== undefined ? !!p.active : products[idx].active,
    topSeller: p.topSeller !== undefined ? !!p.topSeller : products[idx].topSeller,
    topNotes: p.topNotes !== undefined ? String(p.topNotes).trim() : products[idx].topNotes,
    midNotes: p.midNotes !== undefined ? String(p.midNotes).trim() : products[idx].midNotes,
    baseNotes: p.baseNotes !== undefined ? String(p.baseNotes).trim() : products[idx].baseNotes,
    aroma: p.aroma !== undefined ? String(p.aroma).trim() : products[idx].aroma,
    createdAt: products[idx].createdAt || new Date().toISOString(),
    id,
  };

  saveProducts(products);
  return res.json(products[idx]);
});

app.delete("/api/admin/products/:id", requireAdmin, (req, res) => {
  safeReloadProducts();
  const id = req.params.id;
  products = products.filter((x) => x.id !== id);
  saveProducts(products);
  return res.json({ ok: true });
});

// ===== ORDERS API (ADMIN) =====
app.get("/api/admin/orders", requireAdmin, (req, res) => {
  safeReloadOrders();
  res.json({ ok: true, orders });
});

// ===== CHECKOUT API (BARU) =====
app.post("/api/order", async (req, res) => {
  try {
    safeReloadProducts();
    safeReloadOrders();

    const body = req.body || {};
    const customer = body.customer || {};
    const items = Array.isArray(body.items) ? body.items : [];
    const notes = String(body.notes || "").trim();

    const paymentMethod = String(body.paymentMethod || body.payment?.method || "COD").trim();
    const paymentCurrency = String(
      body.payment?.currency || (paymentMethod === "CASH" ? "THB" : "IDR") || ""
    ).trim();

    const bottles = Number(body.payment?.bottles || 0);
    const bottleRateThb = Number(body.payment?.bottleRateThb || 300);
    const totalThbClient = Number(body.payment?.totalThb || 0);
    const totalIdrClient = Number(body.payment?.totalIdr || 0);

    const shippingMethod = String(body.shippingMethod || "STANDARD").trim();
    const shippingFee = Math.max(0, Number(body?.totals?.shippingFee || 0));

    const name = String(customer.name || "").trim();
    const phone = String(customer.phone || "").trim();
    const telegram = String(customer.telegram || "").trim();

    const loc = String(body.address?.location || "").trim();
    const det = String(body.address?.detail || "").trim();
    const legacyAddress = String(customer.address || "").trim();
    const addressFull = [loc, det].filter(Boolean).join(" — ") || legacyAddress;

    if (!name) return res.status(400).json({ ok: false, message: "Nama wajib." });
    if (!phone && !telegram)
      return res
        .status(400)
        .json({ ok: false, message: "Isi minimal salah satu: WhatsApp atau Telegram." });
    if (!loc && !det && !legacyAddress)
      return res
        .status(400)
        .json({ ok: false, message: "Alamat wajib: pilih lokasi atau isi detail alamat." });
    if (!items.length) return res.status(400).json({ ok: false, message: "Cart kosong." });

    const proof = body.proof || null;
    const proofHasData = !!proof?.dataUrl;

    if (paymentMethod === "TRANSFER" && !proofHasData) {
      return res.status(400).json({ ok: false, message: "Bukti transfer wajib diupload." });
    }

    let subtotal = 0;
    const safeItems = items.map((it) => {
      const qty = Math.max(1, Number(it.qty || 1));
      const found = products.find(
        (p) => p.id === it.id || p.name === String(it.name || "").toUpperCase().trim()
      );
      if (found && found.soldOut) throw new Error(`Produk SOLD OUT: ${found.name}`);

      const priceServer = found
        ? Math.max(0, Number(found.price || 0))
        : Math.max(0, Number(it.price || 0));
      const line = qty * priceServer;
      subtotal += line;

      return {
        id: String(found?.id || it.id || ""),
        name: String(found?.name || it.name || "ITEM").slice(0, 80),
        qty,
        price: priceServer,
        line,
      };
    });

    const grandTotal = subtotal + shippingFee;

    const totalQty = safeItems.reduce((a, x) => a + Number(x.qty || 0), 0);
    const totalThbServer = totalQty * bottleRateThb;

    const order = {
      orderCode: genOrderCode(),
      createdAt: new Date().toISOString(),
      customer: { name, phone, telegram },
      address: { location: loc, detail: det, full: addressFull },
      notes,
      payment: {
        method: paymentMethod,
        currency: paymentCurrency,
        bottles: bottles || totalQty,
        bottleRateThb,
        totalThb: totalThbClient || totalThbServer,
        totalIdr: totalIdrClient || grandTotal,
      },
      shippingMethod,
      items: safeItems,
      totals: { subtotal, shippingFee, grandTotal },
      proof: proof
        ? {
            name: String(proof.name || "").slice(0, 120),
            type: String(proof.type || "").slice(0, 80),
            hasData: proofHasData,
          }
        : null,
      status: "NEW",
    };

    orders.unshift(order);
    saveOrders(orders);

    if (paymentMethod === "TRANSFER" && proofHasData) {
      const caption =
        `<b>BUKTI TRANSFER ✅</b>\n` +
        `<b>Kode:</b> <code>${escapeHtml(order.orderCode)}</code>\n` +
        `<b>Nama:</b> ${escapeHtml(name)}\n` +
        `<b>Total:</b> <b>${escapeHtml(rupiah(order.payment.totalIdr))}</b>\n` +
        `<b>Rek:</b> <b>SEABANK 901368831935</b>\n` +
        `<b>A/N:</b> <b>RAHMAN ALFARIZI SIREGAR</b>`;

      await sendTelegramPhoto(proof.dataUrl, caption, proof.name || "bukti.jpg");
    }

    const itemLines = safeItems
      .map((x) => `• ${escapeHtml(x.name)} x${x.qty} = <b>${escapeHtml(rupiah(x.line))}</b>`)
      .join("\n");

    const alamatLine = addressFull ? `<b>Alamat:</b> ${escapeHtml(addressFull)}\n` : "";
    const kontakLine =
      `<b>WA:</b> ${escapeHtml(phone || "-")}\n` + `<b>Telegram:</b> ${escapeHtml(telegram || "-")}\n`;

    let bayarLine = "";
    if (paymentMethod === "CASH") {
      bayarLine = `<b>Pembayaran:</b> CASH\n` + `<b>Total:</b> <b>${escapeHtml(thb(order.payment.totalThb))}</b>\n`;
    } else if (paymentMethod === "TRANSFER") {
      bayarLine =
        `<b>Pembayaran:</b> TRANSFER\n` +
        `<b>Total:</b> <b>${escapeHtml(rupiah(order.payment.totalIdr))}</b>\n` +
        `<b>Bukti:</b> ${order.proof?.hasData ? "✅ Ada (lihat foto)" : "❌ Tidak"}\n` +
        `<b>Rek:</b> <b>SEABANK 901368831935</b>\n` +
        `<b>A/N:</b> <b>RAHMAN ALFARIZI SIREGAR</b>\n`;
    } else {
      bayarLine = `<b>Pembayaran:</b> ${escapeHtml(paymentMethod)}\n`;
    }

    const msg =
      `<b>ORDER BARU MASUK ✅</b>\n` +
      `<b>Kode:</b> <code>${escapeHtml(order.orderCode)}</code>\n` +
      `<b>Nama:</b> ${escapeHtml(name)}\n` +
      kontakLine +
      alamatLine +
      `<b>Pengiriman:</b> ${escapeHtml(shippingMethod)}\n` +
      bayarLine +
      `\n<b>Item:</b>\n${itemLines}\n\n` +
      `<b>Subtotal IDR:</b> ${escapeHtml(rupiah(subtotal))}\n` +
      `<b>Ongkir IDR:</b> ${escapeHtml(rupiah(shippingFee))}\n` +
      `<b>Total IDR:</b> <b>${escapeHtml(rupiah(grandTotal))}</b>\n` +
      (notes ? `\n<b>Catatan:</b> ${escapeHtml(notes)}` : "");

    await sendTelegram(msg);
    return res.json({ ok: true, orderCode: order.orderCode });
  } catch (e) {
    const msg = String(e?.message || e);
    if (msg.startsWith("Produk SOLD OUT:")) {
      return res.status(400).json({ ok: false, message: msg });
    }
    console.error("API ORDER ERROR:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
});

// ===== CHECKOUT (LEGACY) =====
app.post("/checkout", async (req, res) => {
  safeReloadProducts();
  const body = req.body || {};

  const nama = body.nama;
  const lokasi = body.lokasi;
  const kontak = body.kontak;
  const pengantaran = body.pengantaran;
  const cart = Array.isArray(body.cart) ? body.cart : null;

  if (cart && cart.length) {
    if (!nama || !lokasi || !kontak) return res.status(400).send("Data belum lengkap");

    for (const it of cart) {
      const found = products.find(
        (p) => p.id === it.id || p.name === String(it.name || "").toUpperCase().trim()
      );
      if (found && found.soldOut) return res.status(400).send(`Produk SOLD OUT: ${found.name}`);
    }

    let computed = 0;
    const itemsText = cart
      .map((it, i) => {
        const qty = Number(it.qty || 0);
        const price = Number(it.price || 0);
        const sub = qty * price;
        computed += sub;
        return `${i + 1}. ${it.name} x${qty} = ${rupiah(sub)}`;
      })
      .join("\n");

    const finalTotal = Number(body.total || computed);

    const msg =
      `🛒 ORDER BARU — MAWAR PARFUM\n\n` +
      `👤 Nama: ${nama}\n` +
      `📍 Lokasi Poipet: ${lokasi}\n` +
      `📲 Kontak (Tele/WA): ${kontak}\n` +
      `⏰ Pengantaran: ${pengantaran || "-"}\n\n` +
      `📦 Item:\n${itemsText}\n\n` +
      `💰 TOTAL: ${rupiah(finalTotal)}\n\n` +
      `✅ Status: Menunggu konfirmasi admin`;

    await sendTelegram(escapeHtml(msg));
    return res.send("OK");
  }

  const wa = body.wa;
  const alamat = body.alamat;
  const produk = body.produk;
  const jumlah = body.jumlah;
  const total = body.total;

  if (!nama || !produk) return res.status(400).send("Data belum lengkap");

  const found = products.find((p) => p.name === String(produk || "").toUpperCase().trim());
  if (found && found.soldOut) return res.status(400).send("Produk SOLD OUT");

  const msg =
    `🛒 ORDER BARU (Mawar Parfum)\n` +
    `Nama: ${nama || "-"}\n` +
    `Produk: ${produk || "-"}\n` +
    `Jumlah: ${jumlah || "-"}\n` +
    `Total: ${total || "-"}\n` +
    `Kontak: ${wa || "-"}\n` +
    `Alamat: ${alamat || "-"}`;

  await sendTelegram(escapeHtml(msg));
  return res.send("Pesanan berhasil dikirim");
});

// ===== START =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
  console.log("Products file:", PRODUCTS_FILE);
  console.log("Orders file:", ORDERS_FILE);
});
