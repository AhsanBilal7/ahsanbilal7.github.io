// news.js
// News list = manually curated items (news.json) + auto-generated "paper
// accepted" entries derived from publications.json, so accepted papers only
// need to be entered once.
document.addEventListener('DOMContentLoaded', () => {
  const ul = document.getElementById('news-list');

  Promise.all([
    fetch('assets/data/news.json').then(res => res.json()),
    fetch('assets/data/publications.json').then(res => res.json())
  ])
    .then(([newsItems, publications]) => {
      const autoItems = [];

      publications.forEach(pub => {
        const d = pub.details || {};
        const statuses = PubUtils.pubStatuses(d.research_highlights);
        if (!statuses.has('accepted')) return;

        const explicitDate = PubUtils.parseMonthYear(d.announced);
        const venueYear = PubUtils.yearFromVenue(d.venue);
        const dateInfo = explicitDate || (venueYear ? { year: venueYear, month: null } : null);
        if (!dateInfo) return;

        const arxiv = (d.links || []).find(l => /arxiv/i.test(l.label || ''));
        const titleHtml = arxiv
          ? `<a href="${arxiv.href}" target="_blank">"${d.title}"</a>`
          : `"${d.title}"`;
        const venueHtml = d.venue_href
          ? `<a href="${d.venue_href}" target="_blank">${d.venue || ''}</a>`
          : (d.venue || '');
        const isBestPaper = (d.research_highlights || []).some(h => /best paper/i.test(h));

        autoItems.push({
          date: d.announced || String(dateInfo.year),
          html: `🎉 Paper accepted at <strong>${venueHtml}</strong>: ${titleHtml}${isBestPaper ? ' — 🏆 Best Paper Award' : ''}`,
          _sortKey: PubUtils.sortKey(dateInfo)
        });
      });

      const manualItems = newsItems.map(item => ({
        ...item,
        _sortKey: PubUtils.sortKey(PubUtils.parseMonthYear(item.date))
      }));

      const combined = manualItems.concat(autoItems).sort((a, b) => b._sortKey - a._sortKey);

      renderDateList(ul, combined);
    })
    .catch(err => console.error('Failed to load news:', err));
});
