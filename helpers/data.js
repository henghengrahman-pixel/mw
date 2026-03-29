const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(__dirname, '..', 'data');

const FILES = {
  products: path.join(DATA_DIR, 'products.json'),
  articles: path.join(DATA_DIR, 'articles.json'),
  seo: path.join(DATA_DIR, 'seo.json')
};

function ensureDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function ensureFile(filePath, fallback) {
  ensureDir();
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(fallback, null, 2), 'utf8');
  }
}

function readJson(filePath, fallback) {
  ensureFile(filePath, fallback);
  try {
    const raw = fs.readFileSync(filePath, 'utf8').trim();
    if (!raw) {
      writeJson(filePath, fallback);
      return structuredClonePolyfill(fallback);
    }
    return JSON.parse(raw);
  } catch (error) {
    writeJson(filePath, fallback);
    return structuredClonePolyfill(fallback);
  }
}

function writeJson(filePath, value) {
  ensureDir();
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2), 'utf8');
}

function structuredClonePolyfill(value) {
  return JSON.parse(JSON.stringify(value));
}

module.exports = {
  DATA_DIR,
  FILES,
  readJson,
  writeJson
};
