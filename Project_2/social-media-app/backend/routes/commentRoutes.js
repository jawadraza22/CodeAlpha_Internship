const express = require('express');
const Comment = require('../models/Comment');
const User = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/:postId', async (req, res) => {
  try {
    const comments = await Comment.findAll({
      where: { postId: req.params.postId },
      include: [{ model: User, attributes: ['id', 'username', 'avatar'] }],
      order: [['createdAt', 'ASC']]
    });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:postId', auth, async (req, res) => {
  try {
    const { text } = req.body;
    const comment = await Comment.create({ text, postId: req.params.postId, userId: req.user.id });
    const fullComment = await Comment.findByPk(comment.id, { include: [{ model: User, attributes: ['id', 'username', 'avatar'] }] });
    res.json(fullComment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
