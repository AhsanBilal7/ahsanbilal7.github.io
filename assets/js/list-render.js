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
