// list-render.js
// Shared renderer for the simple "[date] html" list sections (News, Reviewer).
window.renderDateList = function (ul, items) {
  if (!ul) return;
  ul.innerHTML = '';
  items.forEach(item => {
    const li = document.createElement('li');
    const span = document.createElement('span');
    span.className = 'date';
    span.textContent = `[${item.date}]`;
    li.appendChild(span);
    const htmlContent = Array.isArray(item.html) ? item.html.join(', ') : item.html;
    li.insertAdjacentHTML('beforeend', ' ' + htmlContent);
    ul.appendChild(li);
  });
};

// Truncates a rendered list to `visibleCount` entries and appends a
// "Show More" button that reveals the rest on click.
window.setupShowMore = function (ul, visibleCount) {
  if (!ul) return;
  const items = Array.from(ul.children);
  if (items.length <= visibleCount) return;

  items.slice(visibleCount).forEach(li => li.classList.add('news-item--hidden'));

  const wrap = document.createElement('div');
  wrap.className = 'show-more-wrap';

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'show-more-btn';
  btn.textContent = `Show More (${items.length - visibleCount})`;
  btn.addEventListener('click', () => {
    items.forEach(li => li.classList.remove('news-item--hidden'));
    wrap.remove();
  });

  wrap.appendChild(btn);
  ul.insertAdjacentElement('afterend', wrap);
};
