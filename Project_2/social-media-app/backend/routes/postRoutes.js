const express = require('express');
const Post = require('../models/Post');
const User = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

router.get('/', async (req, res) => {
  try {
    const posts = await Post.findAll({ include: [{ model: User, attributes: ['id', 'username', 'avatar'] }], order: [['createdAt', 'DESC']] });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', [auth, upload.single('image')], async (req, res) => {
  try {
    const { content } = req.body;
    const image = req.file ? req.file.filename : null;
    const post = await Post.create({ content, image, userId: req.user.id });
    const fullPost = await Post.findByPk(post.id, { include: [{ model: User, attributes: ['id', 'username', 'avatar'] }] });
    res.json(fullPost);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/like', auth, async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    
    const hasLiked = await post.hasLiker(req.user.id);
    if (hasLiked) {
      await post.removeLiker(req.user.id);
      post.likesCount -= 1;
    } else {
      await post.addLiker(req.user.id);
      post.likesCount += 1;
    }
    await post.save();
    res.json({ likesCount: post.likesCount, liked: !hasLiked });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/user/:userId', async (req, res) => {
  try {
    const posts = await Post.findAll({
      where: { userId: req.params.userId },
      include: [{ model: User, attributes: ['id', 'username', 'avatar'] }],
      order: [['createdAt', 'DESC']]
    });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    
    console.log(`Deleting post ${req.params.id}. Owner: ${post.userId}, Requestor: ${req.user.id}`);
    
    if (post.userId != req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await post.destroy();
    res.json({ message: 'Post deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
