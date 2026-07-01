// awards.js
document.addEventListener('DOMContentLoaded', () => {
  const ul = document.getElementById('awards-list');
  fetch('assets/data/awards.json')
    .then(res => res.json())
    .then(items => renderDateList(ul, items))
    .catch(err => console.error('Failed to load awards:', err));
});
