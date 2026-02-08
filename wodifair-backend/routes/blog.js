import express from 'express';
import { body } from 'express-validator';
import pool from '../db.js';
import { validate } from '../middleware/validate.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Public: Get published blogs
router.get('/', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM blogs WHERE is_published = TRUE ORDER BY published_at DESC");
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Admin: Get ALL blogs (including drafts)
router.get('/all', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM blogs ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching all blog posts:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Public: Get single blog post by slug
router.get('/:slug', async (req, res) => {
  const { slug } = req.params;
  try {
    const result = await pool.query("SELECT * FROM blogs WHERE slug = $1 AND is_published = TRUE", [slug]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching blog post:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Admin: Create Blog Post
router.post('/', authenticateToken, validate([
  body('title').trim().notEmpty().escape(),
  body('slug').trim().notEmpty().escape(),
  body('content').notEmpty()
]), async (req, res) => {
  const { title, slug, excerpt, content, category, imageUrl, isPublished } = req.body;
  const authorId = req.user.id;
  try {
    const result = await pool.query(
      'INSERT INTO blogs (title, slug, excerpt, content, category, image_url, author_id, is_published, published_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [title, slug, excerpt, content, category, imageUrl, authorId, isPublished, isPublished ? new Date() : null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating blog post:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Admin: Update Blog Post
router.put('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { title, slug, excerpt, content, category, imageUrl, isPublished } = req.body;
  try {
    const result = await pool.query(
      'UPDATE blogs SET title = $1, slug = $2, excerpt = $3, content = $4, category = $5, image_url = $6, is_published = $7, published_at = $8 WHERE id = $9 RETURNING *',
      [title, slug, excerpt, content, category, imageUrl, isPublished, isPublished ? new Date() : null, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Blog post not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating blog post:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Admin: Delete Blog Post
router.delete('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM blogs WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Blog post not found' });
    res.json({ message: 'Blog post deleted successfully' });
  } catch (error) {
    console.error('Error deleting blog post:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

export default router;
