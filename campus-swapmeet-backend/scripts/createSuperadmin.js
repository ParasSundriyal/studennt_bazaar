// Usage: node scripts/createSuperadmin.js
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const MONGODB_URI = process.env.MONGODB_URI;

async function createSuperadmin() {
  await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const collegeId = 'superadmin';
  const password = 'superadmin123';
  const name = 'Super Admin';
  const collegeEmail = 'superadmin@admin.com';
  const collegeName = 'Admin College';
  const phoneNumber = '9999999999';

  let user = await User.findOne({ collegeId });
  if (user) {
    user.role = 'superadmin';
    user.sellerStatus = 'approved';
    user.password = password;
    await user.save();
    console.log('Updated existing user to superadmin.');
  } else {
    user = await User.create({
      collegeId,
      password,
      name,
      collegeEmail,
      collegeName,
      phoneNumber,
      role: 'superadmin',
      sellerStatus: 'approved'
    });
    console.log('Created new superadmin user.');
  }
  console.log('Superadmin credentials:');
  console.log('College ID:', collegeId);
  console.log('Password:', password);
  process.exit(0);
}

createSuperadmin().catch(err => {
  console.error('Error creating superadmin:', err);
  process.exit(1);
}); 