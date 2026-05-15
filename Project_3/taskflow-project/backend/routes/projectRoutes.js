const express = require('express');
const router = express.Router();
const { createProject, getProjects, getProjectById, updateProject, deleteProject, addMember } = require('../controllers/projectController');
const auth = require('../middleware/auth');

router.use(auth); // All project routes require auth

router.post('/', createProject);
router.get('/', getProjects);
router.get('/:id', getProjectById);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject);
router.post('/:projectId/members', addMember);

module.exports = router;
