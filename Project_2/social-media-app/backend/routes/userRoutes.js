const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
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

router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    let user = await User.findOne({ where: { email } });
    if (user) return res.status(400).json({ error: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = await User.create({ username, email, password: hashedPassword });
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, username: user.username, email: user.email, avatar: user.avatar } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, username: user.username, email: user.email, avatar: user.avatar } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, { attributes: { exclude: ['password'] } });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, { 
      attributes: { exclude: ['password'] },
      include: [
        { model: User, as: 'Followers', attributes: ['id'] },
        { model: User, as: 'Following', attributes: ['id'] }
      ]
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    const userData = user.toJSON();
    userData.followersCount = user.Followers.length;
    userData.followingCount = user.Following.length;
    
    res.json(userData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/update', [auth, upload.single('avatar')], async (req, res) => {
  try {
    const { bio, username } = req.body;
    const avatar = req.file ? req.file.filename : undefined;
    
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (username) user.username = username;
    if (bio !== undefined) user.bio = bio;
    if (avatar) user.avatar = avatar;

    await user.save();
    res.json({ message: 'Profile updated', user: { id: user.id, username: user.username, bio: user.bio, avatar: user.avatar } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
