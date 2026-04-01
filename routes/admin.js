const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

router.get('/admin/login', adminController.loginPage);
router.get('/admin', adminController.requireAdmin, adminController.dashboard);
router.get('/admin/dashboard', adminController.requireAdmin, adminController.dashboard);
router.post('/admin/login', adminController.login);
router.post('/logout', adminController.logout);

module.exports = router;
