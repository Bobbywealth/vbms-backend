const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Adjust the path if needed
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'changeme123';

// Admin-only middleware (optional if you want protection)
// const requireAdmin = (req, res, next) => {
//   const authHeader = req.headers.authorization;
//   if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ message: 'No token' });
//   const token = authHeader.split(' ')[1];
//   try {
//     const decoded = jwt.verify(token, JWT_SECRET);
//     if (decoded.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
//     next();
//   } catch (err) {
//     res.status(401).json({ message: 'Invalid token' });
//   }
// };

router.post('/create-user', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: 'Email already registered.' });

    const newUser = new User({ name, email, password, role });
    await newUser.save();

    res.status(201).json({ message: 'User created', user: { name, email, role } });
  } catch (err) {
    res.status(500).json({ message: 'User creation failed', error: err.message });
  }
});

module.exports = router;
