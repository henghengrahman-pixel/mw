async function fileToDataUrl(file) {
  if (!file) return null;
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const checkoutForm = document.getElementById('checkoutForm');
if (checkoutForm) {
  checkoutForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const result = document.getElementById('checkoutResult');
    result.textContent = 'Mengirim pesanan...';

    const formData = new FormData(checkoutForm);
    const file = formData.get('proof');
    const price = Number(formData.get('price') || 0);
    const qty = Number(formData.get('qty') || 1);

    const payload = {
      customer: {
        name: formData.get('name'),
        phone: formData.get('phone'),
        telegram: formData.get('telegram')
      },
      address: {
        location: formData.get('location'),
        detail: formData.get('detail')
      },
      items: [
        {
          name: formData.get('productName'),
          price,
          qty
        }
      ],
      notes: formData.get('notes'),
      paymentMethod: formData.get('paymentMethod'),
      payment: {
        method: formData.get('paymentMethod'),
        totalIdr: price * qty
      },
      totals: {
        subtotal: price * qty,
        shippingFee: 0,
        grandTotal: price * qty
      },
      proof: file && file.size ? {
        name: file.name,
        type: file.type,
        dataUrl: await fileToDataUrl(file)
      } : null
    };

    const response = await fetch('/api/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) {
      result.textContent = data.message || 'Gagal mengirim pesanan.';
      return;
    }
    result.textContent = `Pesanan berhasil dikirim. Kode order: ${data.orderCode}`;
    checkoutForm.reset();
  });
}

const adminLoginForm = document.getElementById('adminLoginForm');
if (adminLoginForm) {
  adminLoginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const result = document.getElementById('adminLoginResult');
    result.textContent = 'Proses login...';
    const payload = Object.fromEntries(new FormData(adminLoginForm).entries());
    const response = await fetch('/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const text = await response.text();
    if (!response.ok) {
      result.textContent = text || 'Login gagal';
      return;
    }
    window.location.href = '/admin/dashboard';
  });
}

const productForm = document.getElementById('productForm');
if (productForm) {
  productForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const result = document.getElementById('productFormResult');
    result.textContent = 'Menyimpan produk...';
    const entries = Object.fromEntries(new FormData(productForm).entries());
    entries.topSeller = Boolean(new FormData(productForm).get('topSeller'));
    entries.soldOut = Boolean(new FormData(productForm).get('soldOut'));
    const response = await fetch('/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entries)
    });
    const data = await response.json();
    if (!response.ok) {
      result.textContent = data.message || 'Gagal menyimpan produk';
      return;
    }
    result.textContent = 'Produk berhasil disimpan. Refresh halaman untuk melihat data terbaru.';
    productForm.reset();
  });
}

const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    await fetch('/logout', { method: 'POST' });
    window.location.href = '/admin/login';
  });
}
