const API_URL = 'http://localhost:5000/api';
const socket = io('http://localhost:5000');
const token = localStorage.getItem('token');
const urlParams = new URLSearchParams(window.location.search);
const projectId = urlParams.get('id');

if (!token) window.location.href = 'login.html';
if (!projectId) window.location.href = 'dashboard.html';

document.addEventListener('DOMContentLoaded', () => {
  fetchProjectDetails();
  fetchTasks();
  socket.emit('join_project', projectId);
  socket.on('task_updated', (data) => {
    if (data.projectId == projectId) fetchTasks();
  });
});

async function fetchProjectDetails() {
  try {
    const res = await fetch(`${API_URL}/projects/${projectId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const project = await res.json();
    if (res.ok) {
      document.getElementById('projectName').innerText = project.title;
      document.getElementById('projectDesc').innerText = project.description || 'No description';
      if (document.getElementById('projectStatusSelect')) {
        document.getElementById('projectStatusSelect').value = project.status;
      }
    }
  } catch (err) { console.error(err); }
}

async function markProjectComplete() {
  try {
    const res = await fetch(`${API_URL}/projects/${projectId}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status: 'Completed' })
    });
    if (res.ok) {
      alert('Success: Project has been marked as Completed!');
      window.location.href = 'dashboard.html';
    } else {
      const err = await res.json();
      alert('Error: ' + err.message);
    }
  } catch (err) { 
    alert('Network Error');
    console.error(err); 
  }
}

async function updateProjectStatus() {
  const newStatus = document.getElementById('projectStatusSelect').value;
  try {
    const res = await fetch(`${API_URL}/projects/${projectId}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status: newStatus })
    });
    if (res.ok) {
      alert('Status changed to ' + newStatus);
      if (newStatus === 'Completed') window.location.href = 'dashboard.html';
    }
  } catch (err) { console.error(err); }
}

async function fetchTasks() {
  try {
    const res = await fetch(`${API_URL}/tasks/project/${projectId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const tasks = await res.json();
    if (res.ok) renderTasks(tasks);
  } catch (err) { console.error(err); }
}

function renderTasks(tasks) {
  const containers = {
    'To Do': document.querySelector('#todo .tasks-container'),
    'In Progress': document.querySelector('#inprogress .tasks-container'),
    'Review': document.querySelector('#review .tasks-container'),
    'Completed': document.querySelector('#completed .tasks-container')
  };

  Object.values(containers).forEach(c => c.innerHTML = '');

  tasks.forEach(task => {
    const taskEl = document.createElement('div');
    taskEl.className = 'task-card animate-fade';
    taskEl.draggable = true;
    taskEl.id = `task-${task.id}`;
    taskEl.ondragstart = (e) => drag(e, task.id);
    
    taskEl.innerHTML = `
      <span class="task-priority priority-${task.priority.toLowerCase()}">${task.priority}</span>
      <h5 style="margin-bottom: 0.5rem;">${task.title}</h5>
      <p style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 1rem;">${task.description || ''}</p>
      <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem;">
        <span style="color: var(--text-secondary);"><i class="far fa-user"></i> ${task.assigned_to_name || 'Unassigned'}</span>
        <span style="color: var(--text-secondary);"><i class="far fa-calendar"></i> ${task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No date'}</span>
      </div>
      <div class="card-actions">
        ${task.status !== 'Completed' ? `
          <button class="btn-complete" onclick="handleCompleteTask(${task.id})" title="Mark as Completed">
            <i class="fas fa-check"></i>
          </button>
        ` : ''}
        <button class="btn-delete" onclick="handleDeleteTask(${task.id})" title="Delete Task">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `;
    if (containers[task.status]) containers[task.status].appendChild(taskEl);
  });

  Object.keys(containers).forEach(status => {
    const count = tasks.filter(t => t.status === status).length;
    const countEl = document.querySelector(`#${status.replace(/\s+/g, '').toLowerCase()} .count`);
    if (countEl) countEl.innerText = count;
  });
}

function allowDrop(e) { e.preventDefault(); }
function drag(e, taskId) { e.dataTransfer.setData("taskId", taskId); }

async function drop(e) {
  e.preventDefault();
  const taskId = e.dataTransfer.getData("taskId");
  const columnId = e.currentTarget.id;
  const statusMap = { 'todo': 'To Do', 'inprogress': 'In Progress', 'review': 'Review', 'completed': 'Completed' };
  const newStatus = statusMap[columnId];
  
  try {
    const res = await fetch(`${API_URL}/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ status: newStatus })
    });
    if (res.ok) {
      socket.emit('task_update', { projectId });
      fetchTasks();
    }
  } catch (err) { console.error(err); }
}

async function handleCompleteTask(taskId) {
  try {
    const res = await fetch(`${API_URL}/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ status: 'Completed' })
    });
    if (res.ok) {
      socket.emit('task_update', { projectId });
      fetchTasks();
    }
  } catch (err) { console.error(err); }
}

async function handleDeleteTask(taskId) {
  if (!confirm('Are you sure?')) return;
  try {
    const res = await fetch(`${API_URL}/tasks/${taskId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      socket.emit('task_update', { projectId });
      fetchTasks();
    }
  } catch (err) { console.error(err); }
}

async function handleDeleteProject() {
  if (!confirm('Delete entire project?')) return;
  try {
    const res = await fetch(`${API_URL}/projects/${projectId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) window.location.href = 'dashboard.html';
  } catch (err) { console.error(err); }
}

function openNewTaskModal() { openModal('taskModal'); }

document.getElementById('taskForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = document.getElementById('taskTitle').value;
  const description = document.getElementById('taskDesc').value;
  const priority = document.getElementById('taskPriority').value;
  const dueDate = document.getElementById('taskDueDate').value;
  if (title) {
    await createTask(title, description, priority, dueDate);
    closeModal('taskModal');
    e.target.reset();
  }
});

async function createTask(title, description, priority, dueDate) {
  try {
    const res = await fetch(`${API_URL}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ project_id: projectId, title, description, priority, due_date: dueDate, status: 'To Do' })
    });
    if (res.ok) {
      socket.emit('task_update', { projectId });
      fetchTasks();
    }
  } catch (err) { console.error(err); }
}
