const express = require('express');
const router = express.Router();
const { createTask, getTasksByProject, updateTask, deleteTask, getTaskSummary } = require('../controllers/taskController');
const { addComment, getCommentsByTask } = require('../controllers/commentController');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/summary', getTaskSummary);
router.post('/', createTask);
router.get('/project/:projectId', getTasksByProject);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);

// Comment routes nested under tasks for convenience
router.post('/:taskId/comments', addComment);
router.get('/:taskId/comments', getCommentsByTask);

module.exports = router;
