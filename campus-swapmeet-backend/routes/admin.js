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

// Get recent activity (admin only)
router.get('/recent-activity', auth, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    return res.status(403).json({ success: false, message: 'Only admin can access this endpoint' });
  }
  try {
    // Get recent user registrations
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name collegeId createdAt');
    
    // Get recent products
    const recentProducts = await Product.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('seller', 'name collegeId')
      .select('title price createdAt');
    
    // Get recent reports
    const recentReports = await Report.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('reporter', 'name collegeId')
      .select('reason createdAt');
    
    // Combine and format activities
    const activities = [];
    
    recentUsers.forEach(user => {
      activities.push({
        type: 'user',
        message: `New user registered: ${user.name} (${user.collegeId})`,
        date: user.createdAt
      });
    });
    
    recentProducts.forEach(product => {
      activities.push({
        type: 'product',
        message: `New product listed: ${product.title} by ${product.seller?.name || 'Unknown'}`,
        date: product.createdAt
      });
    });
    
    recentReports.forEach(report => {
      activities.push({
        type: 'report',
        message: `New report filed by ${report.reporter?.name || 'Unknown'}: ${report.reason}`,
        date: report.createdAt
      });
    });
    
    // Sort by date (most recent first)
    activities.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    res.json({ success: true, activities: activities.slice(0, 10) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

module.exports = router; 