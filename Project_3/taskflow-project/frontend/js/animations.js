// Liquid Custom Cursor
const cursor = document.createElement('div');
cursor.className = 'custom-cursor';
document.body.appendChild(cursor);

document.addEventListener('mousemove', (e) => {
  cursor.style.left = e.clientX + 'px';
  cursor.style.top = e.clientY + 'px';
});

const interactiveElements = document.querySelectorAll('button, a, .glass, .task-card, input');
interactiveElements.forEach(el => {
  el.addEventListener('mouseenter', () => cursor.classList.add('cursor-hover'));
  el.addEventListener('mouseleave', () => cursor.classList.remove('cursor-hover'));
});

// Entry Animations Staggered
const cards = document.querySelectorAll('.animate-fade');
cards.forEach((card, i) => {
  card.style.opacity = '0';
  card.style.transform = 'translateY(30px)';
  setTimeout(() => {
    card.style.transition = 'all 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)';
    card.style.opacity = '1';
    card.style.transform = 'translateY(0)';
  }, i * 150);
});
