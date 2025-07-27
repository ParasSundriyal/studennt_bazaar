const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const auth = require('../middleware/auth');

// Get all reports (admin only)
router.get('/', auth, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    return res.status(403).json({ success: false, message: 'Only admin can view reports' });
  }
  try {
    const reports = await Report.find()
      .populate('reporter', 'name collegeId')
      .populate('reportedUser', 'name collegeId')
      .populate('product', 'title price images')
      .sort({ createdAt: -1 });
    res.json({ success: true, reports });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// Create a report
router.post('/', auth, async (req, res) => {
  try {
    const { type, reason, reportedUserId, productId, description } = req.body;
    const report = await Report.create({
      type,
      reason,
      description,
      reporter: req.user._id,
      reportedUser: reportedUserId,
      product: productId,
      status: 'pending'
    });
    res.status(201).json({ success: true, report });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// Update report status (admin only)
router.put('/:id/status', auth, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    return res.status(403).json({ success: false, message: 'Only admin can update reports' });
  }
  try {
    const { status } = req.body;
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('reporter', 'name collegeId')
     .populate('reportedUser', 'name collegeId')
     .populate('product', 'title price images');
    
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }
    
    res.json({ success: true, report });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

module.exports = router; 