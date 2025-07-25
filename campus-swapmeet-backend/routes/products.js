const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const BuyRequest = require('../models/BuyRequest');

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

// Only allow sellers
function requireSeller(req, res, next) {
  if ((req.user.role !== 'admin' && req.user.role !== 'superadmin') && req.user.sellerStatus !== 'approved') {
    return res.status(403).json({ success: false, message: 'Only approved sellers can perform this action' });
  }
  next();
}

// Create product (with image upload)
router.post('/', requireAuth, requireSeller, upload.array('images', 5), async (req, res) => {
  try {
    const { title, description, price, category } = req.body;
    const images = req.files.map(file => file.path);
    const product = await Product.create({
      title, description, price, category, images, seller: req.user.id, status: 'active'
    });
    res.status(201).json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// Get all products
router.get('/', async (req, res) => {
  const products = await Product.find({ status: 'active' }).populate('seller', 'name collegeId');
  res.json({ success: true, products });
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
router.get('/my', requireAuth, async (req, res) => {
  try {
    const products = await Product.find({ seller: req.user.id }).sort({ createdAt: -1 });
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
router.put('/:id', requireAuth, requireSeller, async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  if (String(product.seller) !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    return res.status(403).json({ success: false, message: 'Not your product' });
  }
  Object.assign(product, req.body);
  await product.save();
  res.json({ success: true, product });
});

// Delete product (seller only)
router.delete('/:id', requireAuth, requireSeller, async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  if (String(product.seller) !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    return res.status(403).json({ success: false, message: 'Not your product' });
  }
  await product.deleteOne();
  res.json({ success: true, message: 'Product deleted' });
});

// Get all buy requests for the logged-in seller
router.get('/buy-requests/seller', requireAuth, async (req, res) => {
  try {
    const requests = await BuyRequest.find({ seller: req.user.id })
      .populate('product')
      .populate('buyer', 'name collegeId');
    res.json({ success: true, requests });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// Get all buy requests for the logged-in buyer
router.get('/buy-requests/buyer', requireAuth, async (req, res) => {
  try {
    const requests = await BuyRequest.find({ buyer: req.user.id })
      .populate('product')
      .populate('seller', 'name collegeId');
    res.json({ success: true, requests });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// Approve a buy request (seller only)
router.post('/buy-requests/:requestId/approve', requireAuth, async (req, res) => {
  try {
    const request = await BuyRequest.findById(req.params.requestId);
    if (!request) return res.status(404).json({ success: false, message: 'Buy request not found' });
    if (String(request.seller) !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized' });
    request.status = 'approved';
    await request.save();
    // Mark the product as sold
    const product = await Product.findById(request.product);
    if (product) {
      product.status = 'sold';
      await product.save();
    }
    res.json({ success: true, request });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// Reject a buy request (seller only)
router.post('/buy-requests/:requestId/reject', requireAuth, async (req, res) => {
  try {
    const request = await BuyRequest.findById(req.params.requestId);
    if (!request) return res.status(404).json({ success: false, message: 'Buy request not found' });
    if (String(request.seller) !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized' });
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
router.post('/:id/buy-request', requireAuth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    if (String(product.seller) === req.user.id) return res.status(400).json({ success: false, message: 'Cannot send buy request to your own product' });
    const { message, buyerName, buyerPhone } = req.body;
    
    if (!buyerName || !buyerPhone) {
      return res.status(400).json({ success: false, message: 'Buyer name and phone are required' });
    }
    
    const buyRequest = await BuyRequest.create({
      product: product._id,
      buyer: req.user.id,
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

module.exports = router; 