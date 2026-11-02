// interests.js
// Renders the Research Interests section: just a topic title paired with
// the venue where related work was submitted/accepted.
document.addEventListener('DOMContentLoaded', () => {
  const ul = document.getElementById('interest-list');
  if (!ul) return;

  fetch('assets/data/research_interests.json')
    .then(res => res.json())
    .then(items => {
      ul.innerHTML = '';
      items.forEach(item => {
        const status = ['accepted', 'ongoing'].includes(item.status) ? item.status : 'submitted';
        const label = { accepted: 'Accepted', submitted: 'Submitted', ongoing: 'Ongoing' }[status];
        const li = document.createElement('li');

        const title = document.createElement('span');
        title.className = 'interest-title';
        title.textContent = item.title;
        li.appendChild(title);

        const meta = document.createElement('span');
        meta.className = 'interest-meta';

        if (item.venue) {
          const venue = document.createElement('span');
          venue.className = 'venue';
          venue.textContent = item.venue;
          meta.appendChild(venue);
        }

        const badge = document.createElement('span');
        badge.className = `status-badge status-badge--${status}`;
        badge.textContent = label;
        meta.appendChild(badge);

        li.appendChild(meta);
        ul.appendChild(li);
      });
    })
    .catch(err => console.error('Failed to load research interests:', err));
});
