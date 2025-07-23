const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

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

function requireSuperadmin(req, res, next) {
  if (req.user.role !== 'superadmin') {
    return res.status(403).json({ success: false, message: 'Only superadmin can perform this action' });
  }
  next();
}

// Student applies to become seller
router.post('/apply', requireAuth, async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  if (user.role !== 'student') return res.status(400).json({ success: false, message: 'Only students can apply' });
  user.sellerStatus = 'pending';
  await user.save();
  res.json({ success: true, message: 'Seller application submitted' });
});

// Superadmin approves seller
router.post('/approve/:userId', requireAuth, requireSuperadmin, async (req, res) => {
  const user = await User.findById(req.params.userId);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  user.sellerStatus = 'approved';
  await user.save();
  res.json({ success: true, message: 'Seller approved' });
});

// Superadmin rejects seller
router.post('/reject/:userId', requireAuth, requireSuperadmin, async (req, res) => {
  const user = await User.findById(req.params.userId);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  user.sellerStatus = 'rejected';
  await user.save();
  res.json({ success: true, message: 'Seller rejected' });
});

// List all pending seller applications (superadmin)
router.get('/pending', requireAuth, requireSuperadmin, async (req, res) => {
  const pending = await User.find({ sellerStatus: 'pending', role: 'student' });
  res.json({ success: true, pending });
});

module.exports = router; 