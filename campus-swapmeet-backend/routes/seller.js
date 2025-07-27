const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// Apply for seller status
router.post('/apply', auth, async (req, res) => {
  try {
    const { businessName, businessDescription, phoneNumber } = req.body;
    
    // Update user with seller application
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        sellerStatus: 'pending',
        businessName,
        businessDescription,
        phoneNumber
      },
      { new: true }
    ).select('-password');
    
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// Get seller applications (admin only)
router.get('/applications', auth, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    return res.status(403).json({ success: false, message: 'Only admin can view applications' });
  }
  try {
    const applications = await User.find({ sellerStatus: 'pending' }).select('-password');
    res.json({ success: true, applications });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// Approve seller application (admin only)
router.post('/applications/:userId/approve', auth, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    return res.status(403).json({ success: false, message: 'Only admin can approve applications' });
  }
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { sellerStatus: 'approved' },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// Reject seller application (admin only)
router.post('/applications/:userId/reject', auth, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    return res.status(403).json({ success: false, message: 'Only admin can reject applications' });
  }
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { sellerStatus: 'rejected' },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

module.exports = router; 