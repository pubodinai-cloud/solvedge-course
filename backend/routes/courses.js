const express = require('express');
const router = express.Router();
const db = require('../database/index');

// Get all published courses
router.get('/', (req, res) => {
  try {
    const courses = db.prepare(`
      SELECT id, title, description, price, sale_price, thumbnail, 
             duration, level, category, featured, created_at
      FROM courses 
      WHERE published = 1
      ORDER BY featured DESC, created_at DESC
    `).all();

    res.json({ courses });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

// Get single course
router.get('/:id', (req, res) => {
  try {
    const course = db.prepare(`
      SELECT * FROM courses WHERE id = ? AND published = 1
    `).get(req.params.id);

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json({ course });
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({ error: 'Failed to fetch course' });
  }
});

// Get featured courses
router.get('/featured/list', (req, res) => {
  try {
    const courses = db.prepare(`
      SELECT id, title, description, price, sale_price, thumbnail, 
             duration, level, category
      FROM courses 
      WHERE published = 1 AND featured = 1
      ORDER BY created_at DESC
      LIMIT 3
    `).all();

    res.json({ courses });
  } catch (error) {
    console.error('Get featured courses error:', error);
    res.status(500).json({ error: 'Failed to fetch featured courses' });
  }
});

// Get courses by category
router.get('/category/:category', (req, res) => {
  try {
    const courses = db.prepare(`
      SELECT id, title, description, price, sale_price, thumbnail, 
             duration, level, category
      FROM courses 
      WHERE published = 1 AND category = ?
      ORDER BY created_at DESC
    `).all(req.params.category);

    res.json({ courses });
  } catch (error) {
    console.error('Get courses by category error:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

module.exports = router;
