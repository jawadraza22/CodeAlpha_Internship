function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'login.html';
}

// Global user state check
document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (!token && !window.location.href.includes('login.html') && !window.location.href.includes('register.html')) {
    window.location.href = 'login.html';
  }
});
