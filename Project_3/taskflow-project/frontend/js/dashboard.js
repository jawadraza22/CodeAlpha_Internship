const API_URL = 'http://localhost:5000/api';
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user'));

if (!token) window.location.href = 'login.html';

document.addEventListener('DOMContentLoaded', () => {
  if (user) {
    document.getElementById('welcomeText').innerText = `Welcome back, ${user.username}!`;
  }
  fetchDashboardData();
});

async function fetchDashboardData() {
  try {
    // Fetch Projects
    const projectsRes = await fetch(`${API_URL}/projects`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const projects = await projectsRes.json();

    // Fetch Summary Stats
    const statsRes = await fetch(`${API_URL}/tasks/summary`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const stats = await statsRes.json();

    if (projectsRes.ok && statsRes.ok) {
      document.getElementById('activeProjects').innerText = stats.activeProjects;
      document.getElementById('completedProjects').innerText = stats.completedProjects;
      document.getElementById('pendingTasks').innerText = stats.pendingTasks;
      document.getElementById('completedTasks').innerText = stats.completedTasks;
      renderProjects(projects);
    }
  } catch (err) {
    console.error(err);
  }
}

function renderProjects(projects) {
  const list = document.getElementById('projectsList');
  list.innerHTML = projects.map(p => `
    <div class="stat-card glass animate-fade" onclick="window.location.href='board.html?id=${p.id}'" style="cursor: pointer; border-left: 4px solid ${p.status === 'Completed' ? '#10b981' : '#3b82f6'};">
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
        <h4 style="margin: 0;">${p.title}</h4>
        <span class="task-priority ${p.status === 'Completed' ? 'priority-low' : 'priority-medium'}" style="font-size: 0.65rem;">${p.status}</span>
      </div>
      <p style="color: var(--text-secondary); font-size: 0.85rem; height: 3rem; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">${p.description || 'No description provided.'}</p>
      <div style="margin-top: 1.5rem; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding-top: 1rem;">
        <span style="font-size: 0.75rem; color: var(--text-secondary);"><i class="far fa-calendar-alt"></i> ${p.deadline ? new Date(p.deadline).toLocaleDateString() : 'No date'}</span>
        <i class="fas fa-arrow-right" style="color: var(--primary-color); font-size: 0.8rem;"></i>
      </div>
    </div>
  `).join('');
}

function openNewProjectModal() {
  openModal('projectModal');
}

document.getElementById('projectForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = document.getElementById('projectTitle').value;
  const description = document.getElementById('projectDesc').value;
  const deadline = document.getElementById('projectDeadline').value;

  if (title) {
    await createProject(title, description, deadline);
    closeModal('projectModal');
    e.target.reset();
  }
});

async function createProject(title, description, deadline) {
  try {
    const res = await fetch(`${API_URL}/projects`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ title, description, deadline, status: 'Planning' })
    });
    if (res.ok) {
      fetchDashboardData();
    }
  } catch (err) {
    console.error(err);
  }
}
