const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
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

function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    return res.status(403).json({ success: false, message: 'Only admin can perform this action' });
  }
  next();
}

// Create a report
router.post('/', requireAuth, async (req, res) => {
  const { product, reason } = req.body;
  const report = await Report.create({ product, reason, reportedBy: req.user.id });
  res.status(201).json({ success: true, report });
});

// List all reports (admin only)
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  const reports = await Report.find().populate('product').populate('reportedBy', 'name collegeId');
  res.json({ success: true, reports });
});

// Update report status (admin only)
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  const report = await Report.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!report) return res.status(404).json({ success: false, message: 'Report not found' });
  res.json({ success: true, report });
});

module.exports = router; 