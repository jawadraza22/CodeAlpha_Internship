const { db } = require('../config/db');

const createProject = (req, res) => {
  const { title, description, deadline } = req.body;
  const owner_id = req.user.id;

  try {
    const stmt = db.prepare('INSERT INTO projects (title, description, owner_id, deadline) VALUES (?, ?, ?, ?)');
    const info = stmt.run(title, description, owner_id, deadline);
    
    // Auto-add owner as member
    db.prepare('INSERT INTO project_members (project_id, user_id) VALUES (?, ?)').run(info.lastInsertRowid, owner_id);

    res.status(201).json({ id: info.lastInsertRowid, title, description, owner_id, deadline });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getProjects = (req, res) => {
  try {
    // Get projects where user is a member
    const projects = db.prepare(`
      SELECT p.* FROM projects p
      JOIN project_members pm ON p.id = pm.project_id
      WHERE pm.user_id = ?
    `).all(req.user.id);
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getProjectById = (req, res) => {
  const { id } = req.params;
  try {
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    
    const members = db.prepare(`
      SELECT u.id, u.username, u.email, u.profile_image FROM users u
      JOIN project_members pm ON u.id = pm.user_id
      WHERE pm.project_id = ?
    `).all(id);

    res.json({ ...project, members });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const updateProject = (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    // Build dynamic query
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    
    if (fields.length === 0) return res.status(400).json({ message: 'No fields to update' });

    const stmt = db.prepare(`UPDATE projects SET ${fields} WHERE id = ?`);
    stmt.run(...values, id);
    
    res.json({ message: 'Project updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const deleteProject = (req, res) => {
  const { id } = req.params;
  try {
    db.prepare('DELETE FROM projects WHERE id = ?').run(id);
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const addMember = (req, res) => {
  const { projectId } = req.params;
  const { email } = req.body;

  try {
    const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (!user) return res.status(404).json({ message: 'User not found' });

    db.prepare('INSERT OR IGNORE INTO project_members (project_id, user_id) VALUES (?, ?)').run(projectId, user.id);
    res.json({ message: 'Member added' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { createProject, getProjects, getProjectById, updateProject, deleteProject, addMember };
