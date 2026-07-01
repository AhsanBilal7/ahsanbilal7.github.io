// pub-utils.js
// Shared helpers for deriving publication status/dates so publications.json
// stays the single source of truth for the Research and News sections.
window.PubUtils = (function () {
  const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

  function classifyHighlight(text) {
    const t = (text || '').toLowerCase();
    if (/accept/.test(t)) return 'accepted';
    if (/submit/.test(t)) return 'submitted';
    return null;
  }

  function pubStatuses(highlights) {
    const statuses = new Set();
    (highlights || []).forEach(h => {
      const s = classifyHighlight(h);
      if (s) statuses.add(s);
    });
    return statuses;
  }

  // "May 2026" -> { year: 2026, month: 4 }
  function parseMonthYear(str) {
    if (!str) return null;
    const m = String(str).trim().match(/^([A-Za-z]+)\s+(\d{4})$/);
    if (!m) return null;
    const monthIdx = MONTHS.indexOf(m[1].slice(0, 3).toLowerCase());
    if (monthIdx === -1) return null;
    return { year: parseInt(m[2], 10), month: monthIdx };
  }

  // "ICML'26" / "ICASSP'26 Workshop" -> 2026
  function yearFromVenue(venue) {
    if (!venue) return null;
    const m = String(venue).match(/'(\d{2})\b/);
    if (!m) return null;
    return 2000 + parseInt(m[1], 10);
  }

  // Higher = more recent. Unknown month is treated as earliest-in-year so it
  // never outranks a precisely dated entry from the same year.
  function sortKey(dateInfo) {
    if (!dateInfo) return -Infinity;
    const month = dateInfo.month == null ? -1 : dateInfo.month;
    return dateInfo.year * 12 + month;
  }

  return { classifyHighlight, pubStatuses, parseMonthYear, yearFromVenue, sortKey };
})();
