const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
// Replace node-fetch import with dynamic import for compatibility
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// JWT middleware
function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ success: false, message: 'No token' });
  try {
    const decoded = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
}

function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    return res.status(403).json({ success: false, message: 'Only admin can perform this action' });
  }
  next();
}

// List all users (admin only)
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  const users = await User.find().select('-password');
  res.json({ success: true, users });
});

// Get admin/superadmin dashboard stats
router.get('/stats', requireAuth, async (req, res) => {
  if (req.user.role !== 'superadmin') {
    return res.status(403).json({ success: false, message: 'Only superadmin can access this endpoint' });
  }
  const User = require('../models/User');
  const Product = require('../models/Product');
  const Report = require('../models/Report');
  try {
    const totalUsers = await User.countDocuments();
    const activeListings = await Product.countDocuments({ status: 'active' });
    const pendingReviews = await Product.countDocuments({ status: 'pending' });
    const reports = await Report.countDocuments({ status: 'pending' });
    res.json({ success: true, stats: { totalUsers, activeListings, pendingReviews, reports } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// Dashboard stats for current user
router.get('/dashboard-stats', requireAuth, async (req, res) => {
  try {
    const Product = require('../models/Product');
    const BuyRequest = require('../models/BuyRequest');
    const userId = req.user.id;
    // Items sold
    const soldProducts = await Product.find({ seller: userId, status: 'sold' });
    const itemsSold = soldProducts.length;
    // Items bought
    const itemsBought = await BuyRequest.countDocuments({ buyer: userId, status: 'approved' });
    // Total earned
    const totalEarned = soldProducts.reduce((sum, p) => sum + (p.price || 0), 0);
    // Profile views (stubbed)
    const profileViews = 0;
    res.json({ success: true, stats: { itemsSold, itemsBought, totalEarned, profileViews } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// Get user profile
router.get('/:id', requireAuth, async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  res.json({ success: true, user });
});

// Update current user's profile (name, phone, etc.)
router.put('/me', requireAuth, async (req, res) => {
  try {
    const updates = {};
    if (req.body.name) updates.name = req.body.name;
    if (req.body.phone) updates.phoneNumber = req.body.phone;
    // Add other fields as needed
    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true }).select('-password');
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// Update current user's location
router.put('/me/location', requireAuth, async (req, res) => {
  try {
    const { lat, lng } = req.body;
    let address = '';
    // Fetch address from Nominatim
    if (lat && lng) {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
      const response = await fetch(url, { headers: { 'User-Agent': 'campus-swapmeet/1.0' } });
      if (response.ok) {
        const data = await response.json();
        address = data.display_name || '';
      } else {
        const text = await response.text();
        console.error('Nominatim error:', response.status, text);
        throw new Error(`Nominatim error: ${response.status}`);
      }
    }
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { location: { lat, lng, address } },
      { new: true }
    ).select('-password');
    res.json({ success: true, user });
  } catch (err) {
    console.error('Location update error:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

module.exports = router; 