const express = require('express');
const router = express.Router();
const Favorite = require('../models/Favorite');
const Product = require('../models/Product');
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

// Add a favorite
router.post('/', requireAuth, async (req, res) => {
  const { product } = req.body;
  const favorite = await Favorite.create({ user: req.user.id, product });
  res.status(201).json({ success: true, favorite });
});

// Remove a favorite
router.delete('/:productId', requireAuth, async (req, res) => {
  await Favorite.findOneAndDelete({ user: req.user.id, product: req.params.productId });
  res.json({ success: true, message: 'Favorite removed' });
});

// List user's favorites
router.get('/', requireAuth, async (req, res) => {
  const favorites = await Favorite.find({ user: req.user.id }).populate('product');
  res.json({ success: true, favorites });
});

module.exports = router; 