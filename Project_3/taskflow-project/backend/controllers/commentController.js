const { db } = require('../config/db');

const addComment = (req, res) => {
  const { task_id, content } = req.body;
  const user_id = req.user.id;

  try {
    const stmt = db.prepare('INSERT INTO comments (task_id, user_id, content) VALUES (?, ?, ?)');
    const info = stmt.run(task_id, user_id, content);
    res.status(201).json({ id: info.lastInsertRowid, task_id, user_id, content });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getCommentsByTask = (req, res) => {
  const { taskId } = req.params;
  try {
    const comments = db.prepare(`
      SELECT c.*, u.username, u.profile_image FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.task_id = ?
      ORDER BY c.created_at DESC
    `).all(taskId);
    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { addComment, getCommentsByTask };
