const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const { getProducts, getOrders, saveOrders, sortProductsForShop } = require('./_shared');
const { escapeHtml, rupiah, thb } = require('../helpers/format');

function genOrderCode() {
  return 'MW-' + Date.now().toString().slice(-8);
}

function dataUrlToBuffer(dataUrl) {
  const match = String(dataUrl || '').match(/^data:(.+?);base64,(.+)$/);
  if (!match) return null;
  return { mime: match[1], buf: Buffer.from(match[2], 'base64') };
}

async function sendTelegram(textHtml) {
  if (!process.env.BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) return;
  const response = await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: process.env.TELEGRAM_CHAT_ID,
      text: textHtml,
      parse_mode: 'HTML',
      disable_web_page_preview: true
    })
  });
  if (!response.ok) {
    console.error('Telegram sendMessage error:', await response.text());
  }
}

async function sendTelegramPhoto(dataUrl, captionHtml = '', filename = 'bukti.jpg') {
  if (!process.env.BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) return;
  const parsed = dataUrlToBuffer(dataUrl);
  if (!parsed) return;

  const form = new FormData();
  const blob = new Blob([parsed.buf], { type: parsed.mime || 'image/jpeg' });
  form.append('chat_id', process.env.TELEGRAM_CHAT_ID);
  form.append('photo', blob, filename);
  if (captionHtml) {
    form.append('caption', captionHtml);
    form.append('parse_mode', 'HTML');
  }

  const response = await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendPhoto`, {
    method: 'POST',
    body: form
  });
  if (!response.ok) {
    console.error('Telegram sendPhoto error:', await response.text());
  }
}

exports.listProducts = (req, res) => {
  const products = sortProductsForShop(getProducts().filter((item) => item.active));
  return res.json(products);
};

exports.createOrder = async (req, res) => {
  try {
    const body = req.body || {};
    const customer = body.customer || {};
    const items = Array.isArray(body.items) ? body.items : [];
    const notes = String(body.notes || '').trim();
    const paymentMethod = String(body.paymentMethod || body.payment?.method || 'COD').trim();
    const paymentCurrency = String(body.payment?.currency || (paymentMethod === 'CASH' ? 'THB' : 'IDR')).trim();
    const bottles = Number(body.payment?.bottles || 0);
    const bottleRateThb = Number(body.payment?.bottleRateThb || 300);
    const totalThbClient = Number(body.payment?.totalThb || 0);
    const totalIdrClient = Number(body.payment?.totalIdr || 0);
    const shippingMethod = String(body.shippingMethod || 'STANDARD').trim();
    const shippingFee = Math.max(0, Number(body?.totals?.shippingFee || 0));
    const name = String(customer.name || '').trim();
    const phone = String(customer.phone || '').trim();
    const telegram = String(customer.telegram || '').trim();
    const loc = String(body.address?.location || '').trim();
    const det = String(body.address?.detail || '').trim();
    const legacyAddress = String(customer.address || '').trim();
    const addressFull = [loc, det].filter(Boolean).join(' — ') || legacyAddress;
    const proof = body.proof || null;
    const proofHasData = Boolean(proof?.dataUrl);

    if (!name) return res.status(400).json({ ok: false, message: 'Nama wajib.' });
    if (!phone && !telegram) {
      return res.status(400).json({ ok: false, message: 'Isi minimal salah satu: WhatsApp atau Telegram.' });
    }
    if (!addressFull) return res.status(400).json({ ok: false, message: 'Alamat wajib.' });
    if (!items.length) return res.status(400).json({ ok: false, message: 'Cart kosong.' });
    if (paymentMethod === 'TRANSFER' && !proofHasData) {
      return res.status(400).json({ ok: false, message: 'Bukti transfer wajib diupload.' });
    }

    const products = getProducts();
    let subtotal = 0;
    const safeItems = items.map((it) => {
      const qty = Math.max(1, Number(it.qty || 1));
      const found = products.find(
        (p) => p.id === it.id || p.name === String(it.name || '').toUpperCase().trim()
      );
      if (found && found.soldOut) throw new Error(`Produk SOLD OUT: ${found.name}`);
      const price = found ? Number(found.price || 0) : Number(it.price || 0);
      const line = qty * price;
      subtotal += line;
      return {
        id: String(found?.id || it.id || ''),
        name: String(found?.name || it.name || 'ITEM').slice(0, 80),
        qty,
        price,
        line
      };
    });

    const totalQty = safeItems.reduce((sum, item) => sum + Number(item.qty || 0), 0);
    const grandTotal = subtotal + shippingFee;
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
        totalThb: totalThbClient || totalQty * bottleRateThb,
        totalIdr: totalIdrClient || grandTotal
      },
      shippingMethod,
      items: safeItems,
      totals: { subtotal, shippingFee, grandTotal },
      proof: proof
        ? {
            name: String(proof.name || '').slice(0, 120),
            type: String(proof.type || '').slice(0, 80),
            hasData: proofHasData
          }
        : null,
      status: 'NEW'
    };

    const orders = getOrders();
    orders.unshift(order);
    saveOrders(orders);

    if (paymentMethod === 'TRANSFER' && proofHasData) {
      const caption =
        `<b>BUKTI TRANSFER ✅</b>\n` +
        `<b>Kode:</b> <code>${escapeHtml(order.orderCode)}</code>\n` +
        `<b>Nama:</b> ${escapeHtml(name)}\n` +
        `<b>Total:</b> <b>${escapeHtml(rupiah(order.payment.totalIdr))}</b>`;
      await sendTelegramPhoto(proof.dataUrl, caption, proof.name || 'bukti.jpg');
    }

    const itemLines = safeItems
      .map((item) => `• ${escapeHtml(item.name)} x${item.qty} = <b>${escapeHtml(rupiah(item.line))}</b>`)
      .join('\n');

    const message =
      `<b>ORDER BARU MASUK ✅</b>\n` +
      `<b>Kode:</b> <code>${escapeHtml(order.orderCode)}</code>\n` +
      `<b>Nama:</b> ${escapeHtml(name)}\n` +
      `<b>WA:</b> ${escapeHtml(phone || '-')}\n` +
      `<b>Telegram:</b> ${escapeHtml(telegram || '-')}\n` +
      `<b>Alamat:</b> ${escapeHtml(addressFull)}\n` +
      `<b>Pengiriman:</b> ${escapeHtml(shippingMethod)}\n` +
      `<b>Pembayaran:</b> ${escapeHtml(paymentMethod)}\n` +
      `<b>Total IDR:</b> <b>${escapeHtml(rupiah(grandTotal))}</b>\n` +
      (paymentMethod === 'CASH' ? `<b>Total THB:</b> <b>${escapeHtml(thb(order.payment.totalThb))}</b>\n` : '') +
      `\n<b>Item:</b>\n${itemLines}` +
      (notes ? `\n\n<b>Catatan:</b> ${escapeHtml(notes)}` : '');

    await sendTelegram(message);
    return res.json({ ok: true, orderCode: order.orderCode });
  } catch (error) {
    const msg = String(error?.message || error);
    if (msg.startsWith('Produk SOLD OUT:')) {
      return res.status(400).json({ ok: false, message: msg });
    }
    console.error('API ORDER ERROR:', error);
    return res.status(500).json({ ok: false, message: 'Server error' });
  }
};

exports.legacyCheckout = async (req, res) => {
  const body = req.body || {};
  const nama = body.nama;
  const lokasi = body.lokasi;
  const kontak = body.kontak;
  const pengantaran = body.pengantaran;
  const cart = Array.isArray(body.cart) ? body.cart : null;
  const products = getProducts();

  if (cart && cart.length) {
    if (!nama || !lokasi || !kontak) return res.status(400).send('Data belum lengkap');

    for (const item of cart) {
      const found = products.find(
        (p) => p.id === item.id || p.name === String(item.name || '').toUpperCase().trim()
      );
      if (found && found.soldOut) return res.status(400).send(`Produk SOLD OUT: ${found.name}`);
    }

    let computed = 0;
    const itemsText = cart
      .map((item, index) => {
        const qty = Number(item.qty || 0);
        const price = Number(item.price || 0);
        const sub = qty * price;
        computed += sub;
        return `${index + 1}. ${item.name} x${qty} = ${rupiah(sub)}`;
      })
      .join('\n');

    const finalTotal = Number(body.total || computed);
    await sendTelegram(
      escapeHtml(
        `🛒 ORDER BARU — MAWAR PARFUM\n\n👤 Nama: ${nama}\n📍 Lokasi Poipet: ${lokasi}\n📲 Kontak: ${kontak}\n⏰ Pengantaran: ${pengantaran || '-'}\n\n📦 Item:\n${itemsText}\n\n💰 TOTAL: ${rupiah(finalTotal)}`
      )
    );
    return res.send('OK');
  }

  const found = products.find((p) => p.name === String(body.produk || '').toUpperCase().trim());
  if (found && found.soldOut) return res.status(400).send('Produk SOLD OUT');

  await sendTelegram(
    escapeHtml(
      `🛒 ORDER BARU (Mawar Parfum)\nNama: ${body.nama || '-'}\nProduk: ${body.produk || '-'}\nJumlah: ${body.jumlah || '-'}\nTotal: ${body.total || '-'}\nKontak: ${body.wa || '-'}\nAlamat: ${body.alamat || '-'}`
    )
  );

  return res.send('Pesanan berhasil dikirim');
};
