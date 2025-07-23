const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Product = require('../models/Product');
const Report = require('../models/Report');
const jwt = require('jsonwebtoken');

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

router.get('/recent-activity', requireAuth, async (req, res) => {
  if (req.user.role !== 'superadmin') {
    return res.status(403).json({ success: false, message: 'Only superadmin can access this endpoint' });
  }
  try {
    const recentUsers = await User.find().sort({ createdAt: -1 }).limit(5);
    const recentProducts = await Product.find().sort({ updatedAt: -1 }).limit(5);
    const recentReports = await Report.find().sort({ createdAt: -1 }).limit(5).populate('product');

    const activities = [
      ...recentUsers.map(u => ({ type: 'user', message: `New user registered: ${u.name} from ${u.collegeName}`, date: u.createdAt })),
      ...recentProducts.map(p => ({ type: 'product', message: `Listing updated: ${p.title}`, date: p.updatedAt })),
      ...recentReports.map(r => ({ type: 'report', message: `Report received for ${r.product?.title || 'a product'}`, date: r.createdAt }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);

    res.json({ success: true, activities });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

module.exports = router; 