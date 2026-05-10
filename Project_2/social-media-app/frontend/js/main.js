const API_URL = '/api';

// Check if user is logged in
function getUser() {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}

function getToken() {
  return localStorage.getItem('token');
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'login.html';
}

// Generate Avatar color based on string
function stringToColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = '#';
  for (let i = 0; i < 3; i++) {
    let value = (hash >> (i * 8)) & 0xFF;
    color += ('00' + value.toString(16)).substr(-2);
  }
  return color;
}

function renderAvatar(user) {
  if (user.avatar && user.avatar !== 'default.png') {
    return `<img src="/uploads/${user.avatar}" class="avatar" onerror="this.onerror=null; this.src='default_avatar.png';">`;
  }
  const initial = user.username.charAt(0).toUpperCase();
  const color = stringToColor(user.username);
  return `<div class="avatar" style="background-color: ${color}">${initial}</div>`;
}

// Render Navbar
document.addEventListener('DOMContentLoaded', () => {
  const navLinks = document.getElementById('navLinks');
  const user = getUser();
  
  if (navLinks) {
    if (user) {
      navLinks.innerHTML = `
        <a href="index.html">Feed</a>
        <a href="profile.html?id=${user.id}">Profile</a>
        <button onclick="logout()" class="btn btn-outline">Logout</button>
      `;
    } else {
      navLinks.innerHTML = `
        <a href="login.html">Login</a>
        <a href="register.html" class="btn">Sign Up</a>
      `;
    }
  }
});
