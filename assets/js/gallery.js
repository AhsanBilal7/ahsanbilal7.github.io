// gallery.js
// Renders the Gallery section from gallery.json: one featured photo (with a
// blurred copy of itself filling the frame so portrait and landscape shots
// both sit cleanly), a caption bar with prev/next, and a thumbnail strip. Thumbnails are
// clickable, and the featured photo advances on its own every few seconds
// (paused on hover/focus, when the tab is hidden, or with reduced motion).
document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('gallery');
  if (!root) return;

  const INTERVAL_MS = 5000;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const stage = root.querySelector('.gallery-stage');
  const backdrop = root.querySelector('.gallery-backdrop');
  const photo = root.querySelector('.gallery-photo');
  const title = root.querySelector('.gallery-title');
  const caption = root.querySelector('.gallery-caption');
  const meta = root.querySelector('.gallery-meta');
  const counter = root.querySelector('.gallery-counter');
  const strip = root.querySelector('.gallery-thumbs');

  let items = [];
  let current = 0;
  let timer = null;
  let paused = false;

  const pad = n => String(n).padStart(2, '0');

  function show(index) {
    current = (index + items.length) % items.length;
    const item = items[current];

    stage.classList.add('is-fading');
    const next = new Image();
    next.onload = next.onerror = () => {
      photo.src = item.src;
      photo.alt = `${item.title}: ${item.caption}`;
      backdrop.style.backgroundImage = `url("${item.src}")`;
      title.textContent = item.title;
      caption.textContent = item.caption;
      meta.textContent = [item.place, item.date].filter(Boolean).join(' · ');
      counter.textContent = `${pad(current + 1)} / ${pad(items.length)}`;
      stage.classList.remove('is-fading');
    };
    next.src = item.src;

    strip.querySelectorAll('.gallery-thumb').forEach((btn, i) => {
      const active = i === current;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-current', active ? 'true' : 'false');
      if (active && strip.scrollWidth > strip.clientWidth) {
        strip.scrollTo({ left: btn.offsetLeft - (strip.clientWidth - btn.offsetWidth) / 2, behavior: reduceMotion ? 'auto' : 'smooth' });
      }
    });

    restart();
  }

  function restart() {
    clearTimeout(timer);
    // Restart the progress bar animation on the active thumbnail.
    root.classList.remove('is-playing');
    void root.offsetWidth;
    if (reduceMotion || paused || document.hidden || items.length < 2) return;
    root.classList.add('is-playing');
    timer = setTimeout(() => show(current + 1), INTERVAL_MS);
  }

  function setPaused(value) {
    paused = value;
    if (paused) {
      clearTimeout(timer);
      root.classList.remove('is-playing');
    } else {
      restart();
    }
  }

  fetch('assets/data/gallery.json')
    .then(res => res.json())
    .then(data => {
      items = data;
      root.style.setProperty('--gallery-interval', `${INTERVAL_MS}ms`);

      items.forEach((item, i) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'gallery-thumb';
        btn.setAttribute('aria-label', `Show photo ${i + 1}: ${item.title}`);
        const img = document.createElement('img');
        img.src = item.thumb;
        img.alt = '';
        img.loading = 'lazy';
        btn.appendChild(img);
        btn.appendChild(Object.assign(document.createElement('span'), { className: 'gallery-progress' }));
        btn.addEventListener('click', () => show(i));
        strip.appendChild(btn);
      });

      root.querySelector('.gallery-prev').addEventListener('click', () => show(current - 1));
      root.querySelector('.gallery-next').addEventListener('click', () => show(current + 1));

      root.addEventListener('mouseenter', () => setPaused(true));
      root.addEventListener('mouseleave', () => setPaused(false));
      root.addEventListener('focusin', () => setPaused(true));
      root.addEventListener('focusout', e => {
        if (!root.contains(e.relatedTarget)) setPaused(false);
      });
      root.addEventListener('keydown', e => {
        if (e.key === 'ArrowLeft') show(current - 1);
        if (e.key === 'ArrowRight') show(current + 1);
      });
      document.addEventListener('visibilitychange', restart);

      show(0);
    })
    .catch(err => console.error('Failed to load gallery:', err));
});
