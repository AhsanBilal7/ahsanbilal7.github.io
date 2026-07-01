// review.js
document.addEventListener('DOMContentLoaded', () => {
  const ul = document.getElementById('review-list');
  fetch('assets/data/review.json')
    .then(res => res.json())
    .then(items => renderDateList(ul, items))
    .catch(err => console.error('Failed to load reviews:', err));
});
