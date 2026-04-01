const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const orderController = require('../controllers/orderController');

router.get('/api/admin/me', adminController.me);
router.get('/api/products', orderController.listProducts);
router.get('/api/admin/products', adminController.requireAdmin, adminController.listProducts);
router.post('/api/admin/products', adminController.requireAdmin, adminController.createProduct);
router.put('/api/admin/products/:id', adminController.requireAdmin, adminController.updateProduct);
router.delete('/api/admin/products/:id', adminController.requireAdmin, adminController.deleteProduct);
router.get('/api/admin/orders', adminController.requireAdmin, adminController.listOrders);
router.post('/api/order', orderController.createOrder);
router.post('/checkout', orderController.legacyCheckout);

module.exports = router;
