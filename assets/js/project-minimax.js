// project-minimax.js
// Animations for projects/self-evolving-llms: scroll reveal, the
// difficulty-vs-regret bars, the interactive regret game (solved in the
// browser), the framework stepper, the selection-method bars and the
// robustness bars. All data here is illustrative.
(function () {
  'use strict';

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function onVisible(el, cb, threshold) {
    if (!el) return;
    if (!('IntersectionObserver' in window)) { cb(true); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { cb(e.isIntersecting); });
    }, { threshold: threshold || 0.25 });
    io.observe(el);
  }

  document.addEventListener('DOMContentLoaded', function () {
    /* ---------- reveal on scroll ---------- */
    var reveals = document.querySelectorAll('.reveal');
    if (reduceMotion || !('IntersectionObserver' in window)) {
      reveals.forEach(function (el) { el.classList.add('in'); });
    } else {
      var rio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add('in'); rio.unobserve(e.target); }
        });
      }, { threshold: 0.12 });
      reveals.forEach(function (el) { rio.observe(el); });
    }

    /* ---------- difficulty vs regret bars ---------- */
    var versus = document.getElementById('versus');
    onVisible(versus, function (vis) {
      if (!vis) return;
      versus.querySelectorAll('.bar i').forEach(function (i) { i.style.width = i.getAttribute('data-w') + '%'; });
    });

    /* ---------- testbed pool grid ---------- */
    var grid = document.getElementById('tb-grid');
    if (grid) {
      var ns = 'http://www.w3.org/2000/svg';
      var heights = [3, 3, 3, 3, 2, 2, 2, 2, 1, 1];
      for (var c = 0; c < 10; c++) {
        for (var r = 0; r < 3; r++) {
          var rect = document.createElementNS(ns, 'rect');
          rect.setAttribute('x', 202 + c * 15);
          rect.setAttribute('y', 86 + r * 15);
          rect.setAttribute('width', 11);
          rect.setAttribute('height', 11);
          rect.setAttribute('rx', 2.5);
          rect.setAttribute('opacity', r < heights[c] ? (0.95 - c * 0.06).toFixed(2) : 0.12);
          grid.appendChild(rect);
        }
      }
    }

    initGame();
    initStepper();
    initMethods();

    /* ---------- robustness bars ---------- */
    var robust = document.getElementById('robust');
    onVisible(robust, function (vis) {
      if (!vis) return;
      robust.querySelectorAll('.fam-bars').forEach(function (box) {
        if (box.dataset.done) return;
        box.dataset.done = '1';
        var vals = box.getAttribute('data-vals').split(',').map(Number);
        var min = Math.min.apply(null, vals);
        vals.forEach(function (v) {
          var i = document.createElement('i');
          if (v === min) i.className = box.dataset.good ? 'worst good' : 'worst';
          box.appendChild(i);
          requestAnimationFrame(function () { requestAnimationFrame(function () { i.style.height = v + '%'; }); });
        });
      });
    });
  });

  /* ================= regret game ================= */

  // Toy population: frozen specialists (reference) and 5 solver checkpoints.
  var FAM = ['Arithmetic', 'Logic', 'Graphs', 'Strings', 'Proofs'];
  var REF = [0.74, 0.70, 0.68, 0.46, 0.30];
  var V = [
    [0.42, 0.32, 0.22, 0.50, 0.08],
    [0.48, 0.36, 0.50, 0.36, 0.10],
    [0.52, 0.58, 0.52, 0.44, 0.12],
    [0.60, 0.60, 0.56, 0.52, 0.16],
    [0.66, 0.64, 0.60, 0.54, 0.22]
  ];
  var EPS = 0.10;
  var STORY = [
    'Only the starting model <b>&pi;<sub>0</sub></b> is in the archive. Frozen specialists show what is reachable. The largest proven gap is <b>Graphs</b>, so the curriculum focuses there.',
    '<b>&pi;<sub>1</sub></b> closed much of the Graphs gap but <b>forgot part of Strings</b>: &pi;<sub>0</sub> still solves it, so Strings now shows regret in &pi;<sub>1</sub>&rsquo;s column. The curriculum moves to <b>Logic</b>.',
    '<b>&pi;<sub>2</sub></b> catches up on Logic. <b>Arithmetic</b> is now the largest gap that the population has already shown can be closed.',
    'With <b>&pi;<sub>3</sub></b> the gaps become similar, so the equilibrium becomes a <b>mixture</b> of Arithmetic and Proofs instead of a single family.',
    'With <b>&pi;<sub>4</sub></b> regret shrinks in every family and the game value (worst-case regret) keeps falling. The curriculum spreads over the remaining gaps.'
  ];

  function regretMatrix(t) {
    var R = [];
    for (var f = 0; f < FAM.length; f++) {
      var best = REF[f];
      for (var j = 0; j <= t; j++) best = Math.max(best, V[j][f]);
      var row = [];
      for (var k = 0; k <= t; k++) row.push(Math.max(0, best - V[k][f]));
      R.push(row);
    }
    return R;
  }

  // Zero-sum game: designer (rows) maximises, solver (columns) minimises.
  // Multiplicative weights with averaged iterates converge to a Nash equilibrium.
  function solveNash(R) {
    var m = R.length, n = R[0].length, T = 6000, eta = 0.08;
    var x = new Array(m).fill(1 / m), y = new Array(n).fill(1 / n);
    var ax = new Array(m).fill(0), ay = new Array(n).fill(0);
    for (var it = 0; it < T; it++) {
      var rx = R.map(function (row) { return row.reduce(function (s, v, j) { return s + v * y[j]; }, 0); });
      var cy = [];
      for (var j = 0; j < n; j++) { var s = 0; for (var i = 0; i < m; i++) s += x[i] * R[i][j]; cy.push(s); }
      var sx = 0, sy = 0;
      for (i = 0; i < m; i++) { x[i] *= Math.exp(eta * rx[i]); sx += x[i]; }
      for (j = 0; j < n; j++) { y[j] *= Math.exp(-eta * cy[j]); sy += y[j]; }
      for (i = 0; i < m; i++) { x[i] /= sx; ax[i] += x[i]; }
      for (j = 0; j < n; j++) { y[j] /= sy; ay[j] += y[j]; }
    }
    ax = ax.map(function (v) { return v / T; });
    ay = ay.map(function (v) { return v / T; });
    var val = 0;
    for (i = 0; i < m; i++) for (j = 0; j < n; j++) val += ax[i] * R[i][j] * ay[j];
    return { x: ax, y: ay, value: val };
  }

  function initGame() {
    var table = document.getElementById('g-matrix');
    if (!table) return;
    var mixEl = document.getElementById('g-mix');
    var storyEl = document.getElementById('g-story');
    var valueEl = document.getElementById('g-value');
    var iterEl = document.getElementById('g-iter');
    var dots = document.querySelectorAll('#g-dots b');
    var playBtn = document.getElementById('g-play');
    var MAXR = 0.46;

    var solved = [];
    for (var t = 0; t < V.length; t++) solved.push({ R: regretMatrix(t), eq: solveNash(regretMatrix(t)) });

    // build table skeleton
    var head = '<thead><tr><th class="rowh"></th>';
    for (var j = 0; j < V.length; j++) head += '<th>&pi;<sub>' + j + '</sub></th>';
    head += '</tr></thead><tbody>';
    FAM.forEach(function (f, i) {
      head += '<tr><th class="rowh" data-row="' + i + '">' + f + '</th>';
      for (var j = 0; j < V.length; j++) head += '<td class="empty" data-r="' + i + '" data-c="' + j + '">&ndash;</td>';
      head += '</tr>';
    });
    table.innerHTML = head + '</tbody>';

    mixEl.innerHTML = FAM.map(function (f, i) {
      return '<div class="mix-row"><span>' + f + '</span><span class="bar"><i data-i="' + i + '"></i></span><span class="val" data-v="' + i + '">0%</span></div>';
    }).join('');

    var cur = -1, timer = null, playing = !reduceMotion, visible = false;

    function render(t) {
      var s = solved[t];
      table.querySelectorAll('td').forEach(function (td) {
        var r = +td.dataset.r, c = +td.dataset.c;
        if (c > t) {
          td.className = 'empty'; td.textContent = '–'; td.style.background = '';
          return;
        }
        var v = s.R[r][c];
        var wasEmpty = td.classList.contains('empty');
        td.className = (wasEmpty ? 'new' : '') + (v < 0.005 ? ' zero' : '');
        td.textContent = v.toFixed(2);
        td.style.background = 'rgba(var(--heat),' + (0.08 + 0.82 * Math.min(1, v / MAXR)).toFixed(3) + ')';
      });
      var mix = s.eq.x.map(function (p) { return (1 - EPS) * p + EPS / FAM.length; });
      var top = mix.indexOf(Math.max.apply(null, mix));
      mixEl.querySelectorAll('.bar i').forEach(function (i) { i.style.width = (100 * mix[+i.dataset.i]).toFixed(1) + '%'; });
      mixEl.querySelectorAll('.val').forEach(function (v) { v.textContent = Math.round(100 * mix[+v.dataset.v]) + '%'; });
      table.querySelectorAll('th.rowh[data-row]').forEach(function (th) {
        th.style.color = (+th.dataset.row === top) ? 'var(--designer)' : '';
      });
      valueEl.textContent = s.eq.value.toFixed(2);
      storyEl.innerHTML = STORY[t];
      iterEl.textContent = t;
      dots.forEach(function (d, k) { d.classList.toggle('on', k <= t); });
      cur = t;
    }

    function next() { render(cur >= V.length - 1 ? 0 : cur + 1); }

    function schedule() {
      clearTimeout(timer);
      if (!playing || !visible) return;
      timer = setTimeout(function () { next(); schedule(); }, cur === V.length - 1 ? 5200 : 3600);
    }

    function setPlaying(p) {
      playing = p;
      playBtn.querySelector('span').textContent = p ? 'Pause' : 'Play';
      playBtn.querySelector('path').setAttribute('d', p ? 'M8 5v14M16 5v14' : 'M7 5l12 7-12 7z');
      schedule();
    }

    playBtn.addEventListener('click', function () { setPlaying(!playing); });
    document.getElementById('g-step').addEventListener('click', function () { setPlaying(false); next(); });
    document.getElementById('g-reset').addEventListener('click', function () { render(0); schedule(); });

    render(0);
    setPlaying(playing);
    onVisible(document.getElementById('game'), function (vis) { visible = vis; schedule(); }, 0.3);
  }

  /* ================= framework stepper ================= */

  var STEPS = [
    ['orange', 'Designer writes an environment',
     'The Designer writes three small programs: an instance generator, an answer checker and a reference solver that proves an answer exists. Example: build a maze, check a shortest path, solve it with breadth-first search.'],
    ['red', 'Validity gate',
     'An environment enters the archive only if it is deterministic, its reference solver passes its checker, the checker rejects wrong and trivial answers, it runs within time and memory limits, and the base model does not already solve all of it.'],
    ['green', 'Population regret',
     'Every archived Solver checkpoint and a few frozen specialists are evaluated on the environment. The best result is the target; regret is how far each checkpoint is below it. Cross-fitting keeps lucky runs from inflating the target.'],
    ['green', 'Meta-game and Nash curriculum',
     'Environments are rows, checkpoints are columns, regrets are the payoffs. A linear program gives the equilibrium: a distribution over environments that targets the weaknesses of the whole population, plus a small share for unsolved frontier tasks.'],
    ['blue', 'Solver update (Designer frozen)',
     'The Solver trains with GRPO on environments sampled from the curriculum, with a binary pass/fail reward from the checker. The new checkpoint becomes a new column; old checkpoints stay, so forgetting is visible.'],
    ['orange', 'Designer update (Solver mix frozen)',
     'The Designer is rewarded for valid, new environments with high (confidence-bounded) regret against the equilibrium mixture of Solvers, and penalised for invalid tasks and near-duplicates. Good environments become new rows.']
  ];

  function initStepper() {
    var list = document.getElementById('stepper');
    if (!list) return;
    var items = list.querySelectorAll('li');
    var tag = document.getElementById('step-tag');
    var title = document.getElementById('step-title');
    var text = document.getElementById('step-text');
    var cur = 0, timer = null, auto = !reduceMotion, visible = false;

    function show(k) {
      cur = k;
      items.forEach(function (li, i) {
        li.classList.toggle('is-active', i === k);
        li.classList.toggle('is-done', i < k);
      });
      tag.className = 'tag pill ' + STEPS[k][0];
      tag.textContent = 'Step ' + (k + 1);
      title.textContent = STEPS[k][1];
      text.textContent = STEPS[k][2];
    }

    function schedule() {
      clearTimeout(timer);
      if (!auto || !visible) return;
      timer = setTimeout(function () { show((cur + 1) % STEPS.length); schedule(); }, 4200);
    }

    items.forEach(function (li, i) {
      li.setAttribute('tabindex', '0');
      li.setAttribute('role', 'button');
      function pick() { auto = false; clearTimeout(timer); show(i); }
      li.addEventListener('click', pick);
      li.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
    });

    show(0);
    onVisible(document.getElementById('stepper-fig'), function (vis) { visible = vis; schedule(); }, 0.3);
  }

  /* ================= selection-method bars ================= */

  function norm(a) { var s = a.reduce(function (x, y) { return x + y; }, 0); return a.map(function (v) { return v / s; }); }
  function oneHot(k, eps) { var a = new Array(10).fill(eps / 10); a[k] += 1 - eps; return a; }

  var POOL = norm([3150, 1377, 1102, 1047, 291, 241, 238, 234, 171, 149]);
  var MIX = {
    original: [0, 1, 2, 3, 4].map(function () { return norm([30, 15, 13, 12, 6, 6, 4, 5, 5, 4]); }),
    uniform: [0, 1, 2, 3, 4].map(function () { return POOL; }),
    worst: [8, 6, 8, 9, 6].map(function (k) { return oneHot(k, 0); }),
    nash: [
      norm([1, 1, 1, 1, 1, 1, 1, 1, 70, 22]),
      norm([1, 1, 1, 1, 1, 1, 55, 1, 30, 8]),
      norm([2, 2, 2, 2, 2, 2, 25, 2, 40, 21]),
      norm([2, 2, 2, 2, 30, 2, 18, 2, 20, 20]),
      norm([2, 2, 12, 2, 24, 2, 16, 2, 18, 20])
    ],
    soft: [
      norm([6, 7, 8, 9, 10, 9, 12, 8, 16, 15]),
      norm([6, 7, 8, 8, 12, 9, 15, 8, 14, 13]),
      norm([7, 8, 10, 8, 13, 10, 14, 9, 11, 10]),
      norm([8, 8, 12, 9, 13, 11, 11, 10, 9, 9]),
      norm([9, 9, 12, 10, 12, 11, 10, 10, 9, 8])
    ]
  };

  function initMethods() {
    var wrap = document.getElementById('methods');
    if (!wrap) return;
    var phaseEl = document.getElementById('m-phase');
    var cards = wrap.querySelectorAll('.method');
    cards.forEach(function (card) {
      var box = card.querySelector('.mini-bars');
      for (var i = 0; i < 10; i++) box.appendChild(document.createElement('i'));
    });
    var phase = 0, timer = null, visible = false;

    function render(p) {
      phase = p;
      phaseEl.textContent = 'phase ' + (p + 1) + ' of 5';
      cards.forEach(function (card) {
        var w = MIX[card.dataset.m][p];
        var max = Math.max.apply(null, w);
        var scale = Math.max(max, 0.35);
        card.querySelectorAll('.mini-bars i').forEach(function (bar, i) {
          bar.style.height = Math.max(3, 100 * w[i] / scale) + '%';
        });
      });
    }

    function schedule() {
      clearTimeout(timer);
      if (reduceMotion || !visible) return;
      timer = setTimeout(function () { render((phase + 1) % 5); schedule(); }, 2400);
    }

    render(0);
    onVisible(wrap, function (vis) { visible = vis; schedule(); }, 0.2);
  }
})();
