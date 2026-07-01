// publications.js
// Renders publication cards from publications.json and drives the
// representative / all / accepted / submitted filter tabs above the section.

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('publications');
  const toggleContainer = document.getElementById('toggle-pub-container');
  const HIDE_TRANSITION_MS = 260;
  let currentFilter = 'all';

  // Utility to create elements with attributes and children
  function el(tag, attrs = {}, ...children) {
    const e = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (k.startsWith('data-')) e.setAttribute(k, v);
      else if (k === 'class') e.className = v;
      else e[k] = v;
    });
    children.forEach(c => {
      if (typeof c === 'string') e.appendChild(document.createTextNode(c));
      else if (c) e.appendChild(c);
    });
    return e;
  }

  // Build one publication card (media or details)
  function buildCard(pub, isMedia) {
    const statuses = PubUtils.pubStatuses((pub.details || {}).research_highlights);
    const card = el(
      'div',
      {
        class: isMedia
          ? 'col-4 col-4-medium col-4-small vertically_aligned pub-card'
          : 'col-8 col-8-medium col-8-small vertically_aligned pub-card',
        'data-selected': String(pub.selected),
        'data-status-accepted': String(statuses.has('accepted')),
        'data-status-submitted': String(statuses.has('submitted'))
      }
    );

    const art = el('article');

    if (isMedia) {
      const m = pub.media || {};
      if (m.type === 'video') {
        const video = el('video', { autoplay: true, muted: true, playsInline: true, loop: true, preload: 'metadata' });
        video.appendChild(el('source', { src: m.src || '', type: m.format || '' }));
        art.appendChild(el('div', { class: 'image fit' }, video));
      } else if (m.type === 'image') {
        art.appendChild(el('div', { class: 'image fit' }, el('img', { src: m.src || '', alt: '' })));
      }
    } else {
      const d = pub.details || {};
      art.style.textAlign = 'left';

      // Title
      art.appendChild(el('h3', {}, d.title || ''));

      // Authors
      const authorSpan = el('span');
      (d.authors || []).forEach((a, i) => {
        let node;
        if (a.href) node = el('a', { href: a.href, target: '_blank' }, a.name);
        else node = document.createTextNode(a.name);
        if (a.strong) node = el('span', { class: 'strong' }, node);
        authorSpan.appendChild(node);
        if (i < d.authors.length - 1) authorSpan.appendChild(document.createTextNode(', '));
      });
      art.appendChild(authorSpan);
      art.appendChild(el('br'));

      // Author footnote
      if (d.author_footnote) {
        art.appendChild(el('span', { class: 'author_footnote' }, d.author_footnote));
        art.appendChild(el('br'));
      }

      // Venue and venue footnote
      const venueContent = d.venue_href
        ? el('a', { href: d.venue_href, target: '_blank' }, d.venue || '')
        : (d.venue || '');
      art.appendChild(el('span', { class: 'venue' }, venueContent));
      art.appendChild(el('br'));
      if (d.venue_footnote) {
        art.appendChild(el('span', { class: 'venue_footnote' }, d.venue_footnote));
        art.appendChild(el('br'));
      }

      // Links
      (d.links || []).forEach((l, i) => {
        const a = el('a', { href: l.href, target: '_blank', class: 'links' }, l.label);
        art.appendChild(a);
        if (i < d.links.length - 1) art.appendChild(document.createTextNode(' | '));
      });
      art.appendChild(el('br'));

      // Research highlights (color-coded by status)
      (d.research_highlights || []).forEach(h => {
        const status = PubUtils.classifyHighlight(h);
        const cls = status ? `research_highlight status-${status}` : 'research_highlight';
        art.appendChild(el('span', { class: cls }, h));
        art.appendChild(el('br'));
      });

      // Media coverage
      if (d.media_coverage && d.media_coverage.length) {
        const covSpan = el('span', { class: 'media_coverage' });
        d.media_coverage.forEach((m, i) => {
          const a = el('a', { href: m.href, target: '_blank' }, m.outlet);
          covSpan.appendChild(a);
          if (i < d.media_coverage.length - 1) covSpan.appendChild(document.createTextNode(', '));
        });
        art.appendChild(covSpan);
      }

      // Collaborators
      if (d.collaborator && d.collaborator.length) {
        const covSpan = el('span', { class: 'collaborater' });
        d.collaborator.forEach((m, i) => {
          const a = el('a', { href: m.href, target: '_blank' }, m.outlet);
          covSpan.appendChild(a);
          if (i < d.collaborator.length - 1) covSpan.appendChild(document.createTextNode(', '));
        });
        art.appendChild(covSpan);
      }
    }

    card.appendChild(art);
    return card;
  }

  function cardMatchesFilter(card, filter) {
    switch (filter) {
      case 'representative': return card.getAttribute('data-selected') === 'true';
      case 'accepted': return card.getAttribute('data-status-accepted') === 'true';
      case 'submitted': return card.getAttribute('data-status-submitted') === 'true';
      case 'all':
      default: return true;
    }
  }

  function showCard(card) {
    clearTimeout(card._hideTimer);
    if (card.style.display === 'none') {
      card.style.display = '';
      // Force layout before removing the hidden class so the fade transition plays.
      requestAnimationFrame(() => requestAnimationFrame(() => card.classList.remove('pub-card--hidden')));
    } else {
      card.classList.remove('pub-card--hidden');
    }
  }

  function hideCard(card) {
    clearTimeout(card._hideTimer);
    card.classList.add('pub-card--hidden');
    card._hideTimer = setTimeout(() => { card.style.display = 'none'; }, HIDE_TRANSITION_MS);
  }

  function applyFilter(filter) {
    currentFilter = filter;
    document.querySelectorAll('.pub-card').forEach(card => {
      if (cardMatchesFilter(card, filter)) showCard(card);
      else hideCard(card);
    });
    toggleContainer.querySelectorAll('.pub-filter').forEach(tab => {
      tab.classList.toggle('is-active', tab.dataset.filter === filter);
    });
  }

  toggleContainer.addEventListener('click', e => {
    const tab = e.target.closest('.pub-filter');
    if (!tab) return;
    applyFilter(tab.dataset.filter);
  });

  // Load and render JSON data
  fetch('assets/data/publications.json')
    .then(res => res.json())
    .then(data => {
      data.forEach(pub => {
        container.appendChild(buildCard(pub, true));
        container.appendChild(buildCard(pub, false));
      });
      applyFilter(currentFilter);
    })
    .catch(console.error);
});
