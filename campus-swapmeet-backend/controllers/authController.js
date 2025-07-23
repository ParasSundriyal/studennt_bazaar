const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

function generateToken(user) {
  return jwt.sign({ id: user._id, collegeId: user.collegeId, role: user.role, sellerStatus: user.sellerStatus }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

exports.signup = async (req, res) => {
  try {
    const { collegeId, name, collegeEmail, collegeName, phoneNumber, password } = req.body;
    if (!collegeId || !name || !collegeEmail || !collegeName || !phoneNumber || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    const existing = await User.findOne({ collegeId });
    if (existing) {
      return res.status(400).json({ success: false, message: 'College ID already registered' });
    }
    const user = await User.create({ collegeId, name, collegeEmail, collegeName, phoneNumber, password });
    const token = generateToken(user);
    res.status(201).json({ success: true, token, user: { id: user._id, collegeId: user.collegeId, name: user.name, role: user.role, sellerStatus: user.sellerStatus } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { collegeId, password } = req.body;
    if (!collegeId || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    const user = await User.findOne({ collegeId });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }
    const match = await user.comparePassword(password);
    if (!match) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }
    const token = generateToken(user);
    res.json({ success: true, token, user: { id: user._id, collegeId: user.collegeId, name: user.name, role: user.role, sellerStatus: user.sellerStatus } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({
      success: true,
      user: {
        id: user._id,
        collegeId: user.collegeId,
        name: user.name,
        role: user.role,
        sellerStatus: user.sellerStatus,
        collegeEmail: user.collegeEmail,
        collegeName: user.collegeName,
        phoneNumber: user.phoneNumber
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
}; 