const { db } = require('../config/db');

const createTask = (req, res) => {
  const { project_id, title, description, assigned_to, priority, due_date } = req.body;

  try {
    const stmt = db.prepare('INSERT INTO tasks (project_id, title, description, assigned_to, priority, due_date) VALUES (?, ?, ?, ?, ?, ?)');
    const info = stmt.run(project_id, title, description, assigned_to, priority, due_date);
    res.status(201).json({ id: info.lastInsertRowid, ...req.body });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getTasksByProject = (req, res) => {
  const { projectId } = req.params;
  try {
    const tasks = db.prepare(`
      SELECT t.*, u.username as assigned_to_name FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.project_id = ?
    `).all(projectId);
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const updateTask = (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);

    if (fields.length === 0) return res.status(400).json({ message: 'No fields to update' });

    db.prepare(`UPDATE tasks SET ${fields} WHERE id = ?`).run(...values, id);
    res.json({ message: 'Task updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const deleteTask = (req, res) => {
  const { id } = req.params;
  try {
    db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getTaskSummary = (req, res) => {
  const userId = req.user.id;
  try {
    const activeProjects = db.prepare(`
      SELECT COUNT(*) as count FROM projects p
      JOIN project_members pm ON p.id = pm.project_id
      WHERE pm.user_id = ? AND p.status != 'Completed'
    `).get(userId).count;

    const completedProjects = db.prepare(`
      SELECT COUNT(*) as count FROM projects p
      JOIN project_members pm ON p.id = pm.project_id
      WHERE pm.user_id = ? AND p.status = 'Completed'
    `).get(userId).count;
    
    const pendingTasks = db.prepare(`
      SELECT COUNT(*) as count FROM tasks t
      JOIN project_members pm ON t.project_id = pm.project_id
      WHERE pm.user_id = ? AND t.status != 'Completed'
    `).get(userId).count;

    const completedTasks = db.prepare(`
      SELECT COUNT(*) as count FROM tasks t
      JOIN project_members pm ON t.project_id = pm.project_id
      WHERE pm.user_id = ? AND t.status = 'Completed'
    `).get(userId).count;

    res.json({ activeProjects, completedProjects, pendingTasks, completedTasks });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { createTask, getTasksByProject, updateTask, deleteTask, getTaskSummary };
