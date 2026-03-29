function trimText(text = '', max = 160) {
  const normalized = String(text).replace(/\s+/g, ' ').trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max - 1).trim()}…`;
}

function absoluteUrl(baseUrl, routePath = '/') {
  const cleanBase = String(baseUrl || '').replace(/\/+$/, '');
  const cleanPath = String(routePath || '/').startsWith('/') ? routePath : `/${routePath}`;
  return `${cleanBase}${cleanPath === '/' ? '' : cleanPath}`;
}

function defaultImage(baseUrl) {
  return absoluteUrl(baseUrl, '/assets/og-cover.jpg');
}

function makeMeta({
  title,
  description,
  path = '/',
  image,
  type = 'website',
  noindex = false,
  siteName = 'Mawar Parfume',
  twitterCard = 'summary_large_image'
}, baseUrl) {
  const canonical = absoluteUrl(baseUrl, path);
  return {
    title,
    description: trimText(description, 160),
    canonical,
    image: image || defaultImage(baseUrl),
    type,
    noindex,
    siteName,
    twitterCard
  };
}

function breadcrumbSchema(items, baseUrl) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(baseUrl, item.path)
    }))
  };
}

function organizationSchema(settings, baseUrl) {
  return {
    '@context': 'https://schema.org',
    '@type': settings.businessType || 'Organization',
    name: settings.businessName,
    url: absoluteUrl(baseUrl, '/'),
    logo: defaultImage(baseUrl),
    image: defaultImage(baseUrl),
    description: settings.siteDescription,
    telephone: settings.phone || undefined,
    email: settings.email || undefined,
    address: settings.address ? {
      '@type': 'PostalAddress',
      streetAddress: settings.address
    } : undefined,
    areaServed: settings.areaServed || 'Poipet',
    sameAs: [settings.instagram, settings.facebook, settings.tiktok, settings.whatsappLink].filter(Boolean)
  };
}

function productSchema(product, baseUrl) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: [product.image || defaultImage(baseUrl)],
    description: trimText(product.shortDescription || product.description || product.metaDescription || '', 500),
    sku: product.id,
    brand: {
      '@type': 'Brand',
      name: 'Mawar Parfume'
    },
    category: product.category,
    offers: {
      '@type': 'Offer',
      url: absoluteUrl(baseUrl, `/produk/${product.slug}`),
      priceCurrency: 'IDR',
      price: Number(product.price || 0),
      availability: product.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition'
    }
  };
}

function articleSchema(article, baseUrl) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: trimText(article.excerpt || article.metaDescription || '', 300),
    image: [article.coverImage || defaultImage(baseUrl)],
    datePublished: article.createdAt,
    dateModified: article.updatedAt || article.createdAt,
    author: {
      '@type': 'Organization',
      name: 'Mawar Parfume'
    },
    publisher: {
      '@type': 'Organization',
      name: 'Mawar Parfume',
      logo: {
        '@type': 'ImageObject',
        url: defaultImage(baseUrl)
      }
    },
    mainEntityOfPage: absoluteUrl(baseUrl, `/artikel/${article.slug}`)
  };
}

module.exports = {
  trimText,
  absoluteUrl,
  makeMeta,
  breadcrumbSchema,
  organizationSchema,
  productSchema,
  articleSchema
};
