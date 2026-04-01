const { stripHtml } = require('./format');

function buildCanonical(baseUrl, pathname = '/') {
  const cleanBase = String(baseUrl || '').replace(/\/$/, '');
  const cleanPath = String(pathname || '/').split('?')[0];
  return cleanBase + (cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`);
}

function seoDefaults({ title, description, url, image, type = 'website', keywords = [] } = {}) {
  return {
    title: title || 'Mawar Parfum – Toko Parfum Original di Poipet',
    description:
      description ||
      'Mawar Parfum adalah toko parfum original di Poipet yang menyediakan parfum pria, wanita, dan unisex dengan harga terbaik di Poipet.',
    url,
    image,
    type,
    keywords: Array.isArray(keywords) ? keywords.join(', ') : String(keywords || ''),
    twitterCard: 'summary_large_image'
  };
}

function organizationSchema({ baseUrl, logo, sameAs = [] }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: process.env.APP_NAME || 'Mawar Parfum',
    url: baseUrl,
    logo,
    telephone: process.env.STORE_PHONE || undefined,
    email: process.env.STORE_EMAIL || undefined,
    address: {
      '@type': 'PostalAddress',
      addressLocality: process.env.STORE_CITY || 'Poipet',
      addressCountry: process.env.STORE_COUNTRY || 'Cambodia',
      streetAddress: process.env.STORE_ADDRESS || 'Poipet, Cambodia'
    },
    sameAs
  };
}

function breadcrumbSchema(items = []) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  };
}

function productSchema({ product, url, image, brand = 'Mawar Parfum' }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: image ? [image] : undefined,
    description: stripHtml(product.desc || product.description || product.name),
    brand: {
      '@type': 'Brand',
      name: brand
    },
    category: product.category,
    sku: product.id,
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: 'IDR',
      price: Number(product.price || 0),
      availability: product.soldOut
        ? 'https://schema.org/OutOfStock'
        : 'https://schema.org/InStock'
    }
  };
}

module.exports = {
  buildCanonical,
  seoDefaults,
  organizationSchema,
  breadcrumbSchema,
  productSchema
};
