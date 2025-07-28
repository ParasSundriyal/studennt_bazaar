const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const auth = require('../middleware/auth');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const BuyRequest = require('../models/BuyRequest');
const Review = require('../models/Review');
const User = require('../models/User');

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'campus-swapmeet/products',
    allowed_formats: ['jpg', 'jpeg', 'png']
  }
});
const upload = multer({ storage });

// Only allow sellers
function requireSeller(req, res, next) {
  if ((req.user.role !== 'admin' && req.user.role !== 'superadmin') && req.user.sellerStatus !== 'approved') {
    return res.status(403).json({ success: false, message: 'Only approved sellers can perform this action' });
  }
  next();
}

// Create product (with image upload)
router.post('/', auth, requireSeller, upload.array('images', 5), async (req, res) => {
  try {
    const { title, description, price, category } = req.body;
    const images = req.files.map(file => file.path);
    const product = await Product.create({
      title, description, price, category, images, seller: req.user._id, status: 'active'
    });
    res.status(201).json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// Get all products (with search and filters)
router.get('/', async (req, res) => {
  try {
    const { keyword, category, minPrice, maxPrice, location } = req.query;
    const filter = { status: 'active' };
    if (keyword) {
      filter.$or = [
        { title: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } }
      ];
    }
    if (category) {
      filter.category = category;
    }
    if (minPrice) {
      filter.price = { ...filter.price, $gte: Number(minPrice) };
    }
    if (maxPrice) {
      filter.price = { ...filter.price, $lte: Number(maxPrice) };
    }
    if (location) {
      filter.location = { $regex: location, $options: 'i' };
    }
    const products = await Product.find(filter).populate('seller', 'name collegeId');
    res.json({ success: true, products });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// Get all active products (public)
router.get('/all', async (req, res) => {
  try {
    const products = await Product.find({ status: 'active' }).populate('seller', 'name collegeId');
    res.json({ success: true, products });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// Get current user's selling items
router.get('/my', auth, async (req, res) => {
  try {
    const products = await Product.find({ seller: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, products });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// Get product by ID
router.get('/:id', async (req, res) => {
  const product = await Product.findById(req.params.id).populate('seller', 'name collegeId');
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  res.json({ success: true, product });
});

// Update product (seller only)
router.put('/:id', auth, requireSeller, async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  if (String(product.seller) !== req.user._id.toString() && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    return res.status(403).json({ success: false, message: 'Not your product' });
  }
  Object.assign(product, req.body);
  await product.save();
  res.json({ success: true, product });
});

// Delete product (seller only)
router.delete('/:id', auth, requireSeller, async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  if (String(product.seller) !== req.user._id.toString() && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    return res.status(403).json({ success: false, message: 'Not your product' });
  }
  await Product.findByIdAndDelete(product._id);
  res.json({ success: true, message: 'Product deleted' });
});

// Get all buy requests for the logged-in seller
router.get('/buy-requests/seller', auth, async (req, res) => {
  try {
    const requests = await BuyRequest.find({ seller: req.user._id })
      .populate('buyer', 'name collegeId')
      .populate('product', 'title price images')
      .sort({ createdAt: -1 });
    res.json({ success: true, requests });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// Get all buy requests for the logged-in buyer
router.get('/buy-requests/buyer', auth, async (req, res) => {
  try {
    const requests = await BuyRequest.find({ buyer: req.user._id })
      .populate('seller', 'name collegeId')
      .populate('product', 'title price images')
      .sort({ createdAt: -1 });
    res.json({ success: true, requests });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// Approve a buy request (seller only)
router.post('/buy-requests/:requestId/approve', auth, async (req, res) => {
  try {
    const request = await BuyRequest.findById(req.params.requestId);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
    if (String(request.seller) !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not your request' });
    }
    request.status = 'approved';
    await request.save();
    res.json({ success: true, request });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// Reject a buy request (seller only)
router.post('/buy-requests/:requestId/reject', auth, async (req, res) => {
  try {
    const request = await BuyRequest.findById(req.params.requestId);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
    if (String(request.seller) !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not your request' });
    }
    request.status = 'rejected';
    await request.save();
    res.json({ success: true, request });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// Create a guest buy request (no authentication required) - MUST come before /:id/buy-request
router.post('/:id/guest-buy-request', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    
    const { message, buyerName, buyerPhone } = req.body;
    
    if (!buyerName || !buyerPhone || !message) {
      return res.status(400).json({ success: false, message: 'Buyer name, phone, and message are required' });
    }
    
    // Validate phone number format (basic validation)
    if (!/^[0-9]{10}$/.test(buyerPhone.replace(/\D/g, ''))) {
      return res.status(400).json({ success: false, message: 'Please enter a valid 10-digit phone number' });
    }
    
    const buyRequest = await BuyRequest.create({
      product: product._id,
      buyer: null, // No user ID for guest requests
      seller: product.seller,
      message,
      buyerName,
      buyerPhone,
      status: 'pending'
    });
    
    res.status(201).json({ success: true, buyRequest });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// Create a buy request (authenticated users)
router.post('/:id/buy-request', auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    if (String(product.seller) === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot buy your own product' });
    }
    const { message, buyerName, buyerPhone } = req.body;
    if (!buyerName || !buyerPhone || !message) {
      return res.status(400).json({ success: false, message: 'Buyer name, phone, and message are required' });
    }
    // Validate phone number format (basic validation)
    if (!/^[0-9]{10}$/.test(buyerPhone.replace(/\D/g, ''))) {
      return res.status(400).json({ success: false, message: 'Please enter a valid 10-digit phone number' });
    }
    const request = await BuyRequest.create({
      product: product._id,
      buyer: req.user._id,
      seller: product.seller,
      message,
      buyerName,
      buyerPhone,
      status: 'pending'
    });
    res.status(201).json({ success: true, request });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// Add a review to a product
router.post('/reviews', auth, async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;
    if (!productId || !rating || !comment) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }
    // Prevent duplicate review
    const existing = await Review.findOne({ product: productId, user: req.user._id });
    if (existing) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this product.' });
    }
    const review = await Review.create({
      product: productId,
      user: req.user._id,
      rating,
      comment
    });
    // Update product average rating and review count
    const reviews = await Review.find({ product: productId });
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    await Product.findByIdAndUpdate(productId, {
      rating: avgRating,
      reviewCount: reviews.length
    });
    res.status(201).json({ success: true, review });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// Get all reviews for a product
router.get('/reviews/:productId', async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.productId })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 });
    res.json({ success: true, reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

module.exports = router; 