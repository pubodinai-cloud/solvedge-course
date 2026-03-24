const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../database/index');

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

// Create order
router.post('/', authMiddleware, (req, res) => {
  try {
    const { course_id } = req.body;

    // Check if already enrolled
    const existing = db.prepare(
      'SELECT id FROM user_courses WHERE user_id = ? AND course_id = ?'
    ).get(req.userId, course_id);

    if (existing) {
      return res.status(400).json({ error: 'Already enrolled in this course' });
    }

    // Get course price
    const course = db.prepare('SELECT id, price, sale_price FROM courses WHERE id = ?').get(course_id);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const amount = course.sale_price || course.price;

    // Create order
    const result = db.prepare(
      'INSERT INTO orders (user_id, course_id, amount, status) VALUES (?, ?, ?, ?)'
    ).run(req.userId, course_id, amount, 'pending');

    res.status(201).json({
      message: 'Order created',
      order: {
        id: result.lastInsertRowid,
        course_id,
        amount,
        status: 'pending'
      }
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Get user orders
router.get('/my', authMiddleware, (req, res) => {
  try {
    const orders = db.prepare(`
      SELECT o.id, o.amount, o.status, o.created_at,
             c.title, c.thumbnail
      FROM orders o
      JOIN courses c ON o.course_id = c.id
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC
    `).all(req.userId);

    res.json({ orders });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get user enrolled courses
router.get('/enrolled', authMiddleware, (req, res) => {
  try {
    const courses = db.prepare(`
      SELECT c.id, c.title, c.description, c.thumbnail, c.video_url, c.ebook_url,
             uc.progress, uc.enrolled_at
      FROM user_courses uc
      JOIN courses c ON uc.course_id = c.id
      WHERE uc.user_id = ?
      ORDER BY uc.enrolled_at DESC
    `).all(req.userId);

    res.json({ courses });
  } catch (error) {
    console.error('Get enrolled courses error:', error);
    res.status(500).json({ error: 'Failed to fetch enrolled courses' });
  }
});

// Update progress
router.put('/progress/:courseId', authMiddleware, (req, res) => {
  try {
    const { progress } = req.body;

    db.prepare(`
      UPDATE user_courses 
      SET progress = ?, completed_at = CASE WHEN progress >= 100 THEN CURRENT_TIMESTAMP ELSE NULL END
      WHERE user_id = ? AND course_id = ?
    `).run(progress, req.userId, req.params.courseId);

    res.json({ message: 'Progress updated' });
  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

module.exports = router;
