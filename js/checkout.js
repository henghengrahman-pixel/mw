// public/js/checkout.js
(() => {
  "use strict";

  // ✅ Samakan dengan halaman index/product kamu:
  // - kalau index/product pakai localStorage key "mp_cart" → biarkan
  // - kalau punyamu pakai "cart" → ganti jadi "cart"
  const CART_KEY = "mp_cart";

  function $(sel) {
    return document.querySelector(sel);
  }

  function safeJsonParse(text, fallback) {
    try {
      return JSON.parse(text);
    } catch {
      return fallback;
    }
  }

  function getCart() {
    try {
      const raw = localStorage.getItem(CART_KEY);
      const cart = raw ? JSON.parse(raw) : [];
      return Array.isArray(cart) ? cart : [];
    } catch {
      return [];
    }
  }

  function setCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(Array.isArray(cart) ? cart : []));
  }

  function clearCart() {
    localStorage.removeItem(CART_KEY);
  }

  function cartToItems(cart) {
    // Normalisasi item cart supaya backend aman
    return cart
      .map((p) => ({
        id: String(p?.id || "").trim(),
        name: String(p?.name || "Produk").trim(),
        qty: Math.max(1, Number(p?.qty || 1)),
        price: Math.max(0, Number(p?.price || 0)),
      }))
      .filter((x) => x.id); // wajib ada id
  }

  async function safeReadJson(res) {
    const ct = (res.headers.get("content-type") || "").toLowerCase();
    if (ct.includes("application/json")) return await res.json();
    const txt = await res.text();
    return { ok: false, message: txt || "Response bukan JSON" };
  }

  function disableBtn(btn, state, labelBusy = "Memproses...") {
    if (!btn) return;
    btn.disabled = !!state;
    if (state) {
      btn.dataset._label = btn.textContent || "";
      btn.textContent = labelBusy;
    } else {
      btn.textContent = btn.dataset._label || btn.textContent || "Checkout";
      delete btn.dataset._label;
    }
  }

  function validateCustomer(customer) {
    if (!customer.name) return "Nama wajib diisi.";
    if (!customer.phone) return "No WhatsApp/Telepon wajib diisi.";
    if (!customer.address) return "Alamat wajib diisi.";
    return "";
  }

  async function submitOrder(e) {
    e.preventDefault();

    const btn = $("#btnCheckout") || $('button[type="submit"]');
    disableBtn(btn, true);

    try {
      const cart = getCart();
      if (!cart.length) {
        alert("Cart kosong.");
        disableBtn(btn, false);
        return;
      }

      const customer = {
        name: ($("#name")?.value || "").trim(),
        phone: ($("#phone")?.value || "").trim(),
        address: ($("#address")?.value || "").trim(),
      };

      const err = validateCustomer(customer);
      if (err) {
        alert(err);
        disableBtn(btn, false);
        return;
      }

      const notes = ($("#notes")?.value || "").trim();

      // optional fields (kalau ada)
      const paymentMethod = ($("#paymentMethod")?.value || "CASH").trim();
      const shippingMethod = ($("#shippingMethod")?.value || "STANDARD").trim();

      // ongkir optional, default 0
      const shippingFee = Math.max(0, Number($("#shippingFee")?.value || 0));

      const items = cartToItems(cart);
      if (!items.length) {
        alert("Cart tidak valid (item kosong).");
        disableBtn(btn, false);
        return;
      }

      const payload = {
        customer,
        notes,
        paymentMethod,
        shippingMethod,
        items,
        totals: { shippingFee },
      };

      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await safeReadJson(res);

      if (!res.ok || !data?.ok) {
        alert(data?.message || data?.error || "Gagal checkout");
        disableBtn(btn, false);
        return;
      }

      // sukses
      clearCart();
      const code = data.orderCode || "";
      location.href = `/success.html?order=${encodeURIComponent(code)}`;
    } catch (err) {
      alert("Error koneksi / server. Coba lagi.");
      disableBtn(btn, false);
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    const form = $("#checkoutForm");
    if (form) form.addEventListener("submit", submitOrder);

    // ✅ optional: kalau ada tombol clear cart
    const clearBtn = $("#btnClearCart");
    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        const cart = getCart();
        if (!cart.length) return alert("Cart kosong.");
        if (!confirm("Kosongkan keranjang?")) return;
        clearCart();
        alert("Keranjang dikosongkan.");
      });
    }
  });
})();
