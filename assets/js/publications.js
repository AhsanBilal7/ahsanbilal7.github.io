// publications.js

// Dynamically load and render publication entries with support for videos, images,
// author footnotes, venue footnotes, research highlights, and media coverage.

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('publications');

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
    const card = el(
      'div',
      {
        class: isMedia
          ? 'col-4 col-4-medium col-4-small vertically_aligned pub-card'
          : 'col-8 col-8-medium col-8-small vertically_aligned pub-card',
        'data-selected': String(pub.selected),
        'data-topic': pub.topic
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
      art.appendChild(el('span', { class: 'venue' }, d.venue || ''));
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

      // Research highlights
      (d.research_highlights || []).forEach(h => {
        art.appendChild(el('span', { class: 'research_highlight' }, h));
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
            // collaborater
            if (d.collaborater && d.collaborater.length) {
              const covSpan = el('span', { class: 'collaborater' });
              d.collaborater.forEach((m, i) => {
                const a = el('a', { href: m.href, target: '_blank' }, m.outlet);
                covSpan.appendChild(a);
                if (i < d.collaborater.length - 1) covSpan.appendChild(document.createTextNode(', '));
              });
              art.appendChild(covSpan);
            }
          
    }

    card.appendChild(art);
    return card;
  }

  // Load and render JSON data
  fetch('assets/data/publications.json')
    .then(res => res.json())
    .then(data => {
      data.forEach(pub => {
        container.appendChild(buildCard(pub, true));
        container.appendChild(buildCard(pub, false));
      });
    })
    .catch(console.error);

  // Filter toggles
  document.getElementById('show-selected').addEventListener('click', () => {
    document.querySelectorAll('.pub-card').forEach(c => {
      c.style.display = c.dataset.selected === 'true' ? '' : 'none';
    });
  });
  document.getElementById('show-all').addEventListener('click', () => {
    document.querySelectorAll('.pub-card').forEach(c => (c.style.display = ''));
  });
});