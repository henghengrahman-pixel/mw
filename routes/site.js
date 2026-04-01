const express = require('express');
const router = express.Router();
const siteController = require('../controllers/siteController');

router.get('/', siteController.home);
router.get('/products', siteController.products);
router.get('/product/:slug', siteController.productDetail);
router.get('/checkout', siteController.checkout);
router.get('/robots.txt', siteController.robots);
router.get('/sitemap.xml', siteController.sitemap);

module.exports = router;
