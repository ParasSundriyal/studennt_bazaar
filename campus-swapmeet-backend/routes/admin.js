const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Product = require('../models/Product');
const Report = require('../models/Report');
const auth = require('../middleware/auth');

// Get all users (admin only)
router.get('/users', auth, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    return res.status(403).json({ success: false, message: 'Only admin can access this endpoint' });
  }
  try {
    const users = await User.find().select('-password');
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// Get all products (admin only)
router.get('/products', auth, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    return res.status(403).json({ success: false, message: 'Only admin can access this endpoint' });
  }
  try {
    const products = await Product.find().populate('seller', 'name collegeId');
    res.json({ success: true, products });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// Get all reports (admin only)
router.get('/reports', auth, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    return res.status(403).json({ success: false, message: 'Only admin can access this endpoint' });
  }
  try {
    const reports = await Report.find()
      .populate('reporter', 'name collegeId')
      .populate('reportedUser', 'name collegeId')
      .populate('product', 'title price images');
    res.json({ success: true, reports });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

module.exports = router; 