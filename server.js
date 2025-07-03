const stripe = require('stripe')('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'); // <--- Replace with your actual secret key from Stripe
const cors = require('cors');
const express = require('express');
const app = express();
app.use(cors());
const PORT = 5050;

app.use(express.json());

// The root route
app.get('/', (req, res) => {
  res.send('VBMS Backend is running!');
});

// ADD THIS:
app.get('/api/test', (req, res) => {
  res.json({ message: "API connection is working! 🎉" });
});

app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    // You can customize amount, currency, and description
    const { amount } = req.body;

    // Stripe requires the amount in cents (e.g., $10.00 = 1000)
    const paymentIntent = await stripe.paymentIntents.create({
      amount, // e.g. 1000 = $10.00
      currency: 'usd',
      description: 'VBMS Payment',
    });

    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    res.status(400).send({ error: { message: error.message } });
  }
});
