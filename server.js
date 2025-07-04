require('dotenv').config(); // Always at the very top

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const User = require('./models/User'); // User model
const Onboarding = require('./models/Onboarding'); // Onboarding model

const JWT_SECRET = process.env.JWT_SECRET || 'changeme123';

const app = express();

app.use(cors());
app.use(express.json());

const PORT = 5050;

// --- Connect to MongoDB ---
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('MongoDB connected');
}).catch((err) => {
  console.error('MongoDB connection error:', err);
});

// --- HEALTH CHECK ---
app.get('/', (req, res) => {
  res.send('VBMS Backend is running!');
});

// --- TEST ROUTE ---
app.get('/api/test', (req, res) => {
  res.json({ message: "API connection is working! 🎉" });
});

// --- ONBOARDING ROUTE ---
app.post('/api/onboard', async (req, res) => {
  try {
    const data = req.body;
    // Save onboarding to MongoDB
    const record = await Onboarding.create(data);
    res.json({ message: "Onboarding received", record });
  } catch (e) {
    console.error('Onboarding save error:', e);
    res.status(500).json({ error: "Failed to save onboarding data." });
  }
});

// --- REGISTER ROUTE ---
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'All fields required.' });

    const exists = await User.findOne({ email });
    if (exists)
      return res.status(409).json({ message: 'Email already registered.' });

    const user = new User({ name, email, password });
    await user.save();

    const token = jwt.sign(
      { id: user._id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.status(201).json({ token, user: { name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ message: 'Registration failed.', error: err.message });
  }
});

// --- LOGIN ROUTE ---
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Both fields required.' });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(401).json({ message: 'Invalid email or password.' });

    const match = await user.comparePassword(password); // Password validation method in User model
    if (!match)
      return res.status(401).json({ message: 'Invalid email or password.' });

    const token = jwt.sign(
      { id: user._id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ token, user: { name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ message: 'Login failed.', error: err.message });
  }
});

// --- STRIPE PAYMENT INTENT ROUTE ---
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const { amount, packageName, addOns, email, affiliateCode } = req.body;

    // Stripe metadata for reporting
    const meta = {
      packageName: packageName || '',
      addOns: addOns ? JSON.stringify(addOns) : '',
      email: email || '',
      affiliateCode: affiliateCode || '',
    };

    const paymentIntent = await stripe.paymentIntents.create({
      amount, // in cents
      currency: 'usd',
      description: `VBMS Payment${packageName ? ' - ' + packageName : ''}`,
      metadata: meta,
    });

    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    res.status(400).send({ error: { message: error.message } });
  }
});

// --- LISTEN ---
app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});
