const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../database/index');

const JWT_SECRET = process.env.JWT_SECRET || 'solvedge-secret-key';

// Middleware to verify admin
const adminMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT role FROM users WHERE id = ?').get(decoded.userId);
    
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// ===== DASHBOARD =====
router.get('/dashboard', adminMiddleware, (req, res) => {
  try {
    const totalRevenue = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total FROM orders WHERE status = 'paid'
    `).get();

    const totalOrders = db.prepare(`
      SELECT COUNT(*) as count FROM orders WHERE status = 'paid'
    `).get();

    const totalUsers = db.prepare(`
      SELECT COUNT(*) as count FROM users WHERE role = 'user'
    `).get();

    const totalCourses = db.prepare(`
      SELECT COUNT(*) as count FROM courses WHERE published = 1
    `).get();

    const recentOrders = db.prepare(`
      SELECT o.id, o.amount, o.status, o.created_at,
             u.email as user_email, c.title as course_title
      FROM orders o
      JOIN users u ON o.user_id = u.id
      JOIN courses c ON o.course_id = c.id
      ORDER BY o.created_at DESC
      LIMIT 10
    `).all();

    res.json({
      stats: {
        totalRevenue: totalRevenue.total,
        totalOrders: totalOrders.count,
        totalUsers: totalUsers.count,
        totalCourses: totalCourses.count
      },
      recentOrders
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// ===== COURSES MANAGEMENT =====
router.get('/courses', adminMiddleware, (req, res) => {
  try {
    const courses = db.prepare('SELECT * FROM courses ORDER BY created_at DESC').all();
    res.json({ courses });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

router.post('/courses', adminMiddleware, (req, res) => {
  try {
    const { title, description, price, sale_price, thumbnail, video_url, ebook_url, duration, level, category, featured, published } = req.body;

    const result = db.prepare(`
      INSERT INTO courses (title, description, price, sale_price, thumbnail, video_url, ebook_url, duration, level, category, featured, published)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(title, description, price, sale_price, thumbnail, video_url, ebook_url, duration, level, category, featured ? 1 : 0, published ? 1 : 0);

    res.status(201).json({ message: 'Course created', id: result.lastInsertRowid });
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({ error: 'Failed to create course' });
  }
});

router.put('/courses/:id', adminMiddleware, (req, res) => {
  try {
    const { title, description, price, sale_price, thumbnail, video_url, ebook_url, duration, level, category, featured, published } = req.body;

    db.prepare(`
      UPDATE courses 
      SET title = ?, description = ?, price = ?, sale_price = ?, thumbnail = ?, 
          video_url = ?, ebook_url = ?, duration = ?, level = ?, category = ?, 
          featured = ?, published = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(title, description, price, sale_price, thumbnail, video_url, ebook_url, duration, level, category, featured ? 1 : 0, published ? 1 : 0, req.params.id);

    res.json({ message: 'Course updated' });
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({ error: 'Failed to update course' });
  }
});

router.delete('/courses/:id', adminMiddleware, (req, res) => {
  try {
    db.prepare('DELETE FROM courses WHERE id = ?').run(req.params.id);
    res.json({ message: 'Course deleted' });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({ error: 'Failed to delete course' });
  }
});

// ===== USERS MANAGEMENT =====
router.get('/users', adminMiddleware, (req, res) => {
  try {
    const users = db.prepare(`
      SELECT id, email, name, role, created_at FROM users ORDER BY created_at DESC
    `).all();
    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.get('/users/:id', adminMiddleware, (req, res) => {
  try {
    const user = db.prepare(`
      SELECT id, email, name, role, created_at FROM users WHERE id = ?
    `).get(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const enrolledCourses = db.prepare(`
      SELECT c.id, c.title, uc.progress, uc.enrolled_at
      FROM user_courses uc
      JOIN courses c ON uc.course_id = c.id
      WHERE uc.user_id = ?
    `).all(req.params.id);

    res.json({ user, enrolledCourses });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// ===== ORDERS MANAGEMENT =====
router.get('/orders', adminMiddleware, (req, res) => {
  try {
    const orders = db.prepare(`
      SELECT o.*, u.email as user_email, u.name as user_name, c.title as course_title
      FROM orders o
      JOIN users u ON o.user_id = u.id
      JOIN courses c ON o.course_id = c.id
      ORDER BY o.created_at DESC
    `).all();
    res.json({ orders });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

module.exports = router;
