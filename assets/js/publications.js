// publications.js
// Renders the Research Papers list from publications.json and drives the
// featured / all / accepted / submitted filter tabs above the section.
// Each entry is intentionally minimal: title, authors (* = equal
// contribution), venue + status, and a single PDF link.

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('pub-list');
  const toggleContainer = document.getElementById('toggle-pub-container');
  const HIDE_TRANSITION_MS = 260;
  let currentFilter = 'all';

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

  // Prefer a PDF-ish link (arXiv, or anything labeled/linking to a PDF);
  // fall back to whatever single link is provided.
  function pickPdfLink(links) {
    if (!links || !links.length) return null;
    const pdf = links.find(l => /pdf|arxiv/i.test(l.label || '') || /arxiv\.org|\.pdf($|\?)/i.test(l.href || ''));
    return pdf || links[0];
  }

  function buildEntry(pub) {
    const d = pub.details || {};
    const status = d.status === 'accepted' ? 'accepted' : 'submitted';

    const entry = el('article', {
      class: 'pub-entry',
      'data-selected': String(!!pub.selected),
      'data-status-accepted': String(status === 'accepted'),
      'data-status-submitted': String(status === 'submitted')
    });

    entry.appendChild(el('h3', { class: 'pub-title' }, d.title || ''));

    // Authors, with a superscript * for equal contribution.
    const authorPara = el('p', { class: 'pub-authors' });
    const authors = d.authors || [];
    let hasEqual = false;
    authors.forEach((a, i) => {
      let node = document.createTextNode(a.name);
      if (a.equal) {
        hasEqual = true;
        const wrap = el('span', {}, node, el('sup', {}, '*'));
        node = wrap;
      }
      if (a.href) {
        const link = el('a', { href: a.href, target: '_blank' });
        link.appendChild(node);
        node = link;
      }
      if (a.strong) node = el('span', { class: 'strong' }, node);
      authorPara.appendChild(node);
      if (i < authors.length - 1) authorPara.appendChild(document.createTextNode(', '));
    });
    entry.appendChild(authorPara);

    if (hasEqual) {
      entry.appendChild(el('p', { class: 'author_footnote pub-footnote' }, '* Equal contribution'));
    }

    // Venue + status + PDF link.
    const meta = el('p', { class: 'pub-meta' });
    const venueContent = d.venue_href
      ? el('a', { href: d.venue_href, target: '_blank', class: 'venue' }, d.venue || '')
      : el('span', { class: 'venue' }, d.venue || '');
    meta.appendChild(venueContent);
    meta.appendChild(el('span', { class: `status-badge status-badge--${status}` }, status === 'accepted' ? 'Accepted' : 'Submitted'));
    (d.badges || []).forEach(b => {
      meta.appendChild(el('span', { class: 'status-badge status-badge--extra' }, b));
    });
    const pdf = pickPdfLink(d.links);
    if (pdf) {
      meta.appendChild(el('a', { href: pdf.href, target: '_blank', class: 'pub-pdf' }, /pdf|arxiv/i.test(pdf.label || '') ? 'PDF' : pdf.label));
    }
    entry.appendChild(meta);

    return entry;
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
    document.querySelectorAll('.pub-entry').forEach(card => {
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

  fetch('assets/data/publications.json')
    .then(res => res.json())
    .then(data => {
      data.forEach(pub => container.appendChild(buildEntry(pub)));
      applyFilter(currentFilter);
    })
    .catch(console.error);
});
