function rupiah(value) {
  return 'Rp ' + Number(value || 0).toLocaleString('id-ID');
}

function thb(value) {
  return '฿ ' + Number(value || 0).toLocaleString('en-US');
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function stripHtml(value) {
  return String(value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

module.exports = { rupiah, thb, escapeHtml, stripHtml };
