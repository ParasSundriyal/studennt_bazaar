const express = require('express');
const router = express.Router();
const Favorite = require('../models/Favorite');
const Product = require('../models/Product');
const auth = require('../middleware/auth');

// Get user's favorites
router.get('/', auth, async (req, res) => {
  try {
    const favorites = await Favorite.find({ user: req.user._id })
      .populate('product', 'title price images seller')
      .populate('product.seller', 'name collegeId');
    res.json({ success: true, favorites });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// Add to favorites
router.post('/', auth, async (req, res) => {
  try {
    const { productId } = req.body;
    const existing = await Favorite.findOne({ user: req.user._id, product: productId });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Already in favorites' });
    }
    let favorite = await Favorite.create({ user: req.user._id, product: productId });
    favorite = await favorite.populate({
      path: 'product',
      populate: { path: 'seller', select: 'name collegeId' }
    });
    res.status(201).json({ success: true, favorite });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// Remove from favorites
router.delete('/:productId', auth, async (req, res) => {
  try {
    await Favorite.findOneAndDelete({ user: req.user._id, product: req.params.productId });
    res.json({ success: true, message: 'Removed from favorites' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

module.exports = router; 