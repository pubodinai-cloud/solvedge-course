const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const jwt = require('jsonwebtoken');
const db = require('../database/index');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const JWT_SECRET = process.env.JWT_SECRET || 'solvedge-secret-key';

// Middleware to verify token
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Create payment intent
router.post('/create-payment-intent', authMiddleware, async (req, res) => {
  try {
    const { order_id } = req.body;

    // Get order details
    const order = db.prepare(`
      SELECT o.*, c.title 
      FROM orders o
      JOIN courses c ON o.course_id = c.id
      WHERE o.id = ? AND o.user_id = ?
    `).get(order_id, req.userId);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status === 'paid') {
      return res.status(400).json({ error: 'Order already paid' });
    }

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.amount * 100), // Convert to cents
      currency: 'thb',
      metadata: {
        order_id: order.id.toString(),
        user_id: req.userId.toString(),
        course_id: order.course_id.toString()
      }
    });

    // Update order with payment intent ID
    db.prepare('UPDATE orders SET stripe_payment_id = ? WHERE id = ?')
      .run(paymentIntent.id, order_id);

    res.json({
      clientSecret: paymentIntent.client_secret,
      amount: order.amount,
      currency: 'THB'
    });
  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

// Webhook for Stripe events
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    
    // Update order status
    db.prepare('UPDATE orders SET status = ? WHERE stripe_payment_id = ?')
      .run('paid', paymentIntent.id);

    // Enroll user in course
    const order = db.prepare('SELECT user_id, course_id FROM orders WHERE stripe_payment_id = ?')
      .get(paymentIntent.id);

    if (order) {
      db.prepare('INSERT OR IGNORE INTO user_courses (user_id, course_id) VALUES (?, ?)')
        .run(order.user_id, order.course_id);
    }

    console.log('✅ Payment succeeded:', paymentIntent.id);
  }

  res.json({ received: true });
});

// Confirm payment (fallback)
router.post('/confirm', authMiddleware, async (req, res) => {
  try {
    const { order_id, payment_intent_id } = req.body;

    // Verify payment with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);

    if (paymentIntent.status === 'succeeded') {
      // Update order
      db.prepare('UPDATE orders SET status = ?, stripe_payment_id = ? WHERE id = ? AND user_id = ?')
        .run('paid', payment_intent_id, order_id, req.userId);

      // Get order details
      const order = db.prepare('SELECT course_id FROM orders WHERE id = ?').get(order_id);

      if (order) {
        // Enroll user
        db.prepare('INSERT OR IGNORE INTO user_courses (user_id, course_id) VALUES (?, ?)')
          .run(req.userId, order.course_id);
      }

      res.json({ message: 'Payment confirmed', status: 'paid' });
    } else {
      res.status(400).json({ error: 'Payment not completed' });
    }
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({ error: 'Failed to confirm payment' });
  }
});

module.exports = router;
