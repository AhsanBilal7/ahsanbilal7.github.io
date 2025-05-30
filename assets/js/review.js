// news.js
document.addEventListener('DOMContentLoaded', () => {
    const ul = document.querySelector('.wrapper.review_style1 .container ul');
    fetch('assets/data/review.json')
      .then(res => res.json())
      .then(items => {
        ul.innerHTML = '';
        items.forEach(item => {
          const li = document.createElement('li');
          const span = document.createElement('span');
          span.className = 'date';
          span.textContent = `[${item.date}]`;
          li.appendChild(span);
          // use innerHTML for the rest
          li.insertAdjacentHTML('beforeend', ' ' + item.html);
          ul.appendChild(li);
        });
      })
      .catch(err => console.error('Failed to load reviews:', err));
  });
  