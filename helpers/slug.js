const slugify = require('slugify');

function createSlug(text) {
  return slugify(String(text || ''), {
    lower: true,
    strict: true,
    trim: true,
    locale: 'id'
  });
}

module.exports = { createSlug };
