const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();

router.post('/:id', auth, async (req, res) => {
  try {
    if (req.user.id === parseInt(req.params.id)) return res.status(400).json({ error: 'Cannot follow yourself' });

    const currentUser = await User.findByPk(req.user.id);
    const userToFollow = await User.findByPk(req.params.id);

    if (!userToFollow) return res.status(404).json({ error: 'User not found' });

    const isFollowing = await currentUser.hasFollowing(userToFollow);
    if (isFollowing) {
      await currentUser.removeFollowing(userToFollow);
      res.json({ following: false });
    } else {
      await currentUser.addFollowing(userToFollow);
      res.json({ following: true });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/status', auth, async (req, res) => {
  try {
    const currentUser = await User.findByPk(req.user.id);
    const userToCheck = await User.findByPk(req.params.id);
    if (!userToCheck) return res.status(404).json({ error: 'User not found' });
    
    const following = await currentUser.hasFollowing(userToCheck);
    res.json({ following });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
