// ornament-rotation.js — client-side freshness fallback for liturgical ornament rotation.
// Depends on window.getPeriod defined by liturgical-period.js (loaded before this script).
// At build time, the correct ornament for the build-date period is already inlined (data-file
// matches the inlined SVG). This script only fires a fetch when a stale build is viewed after
// the liturgical period has changed.
(function () {
  function run() {
    var period = getPeriod(new Date());
    var ornaments = document.querySelectorAll('.ornament[data-candidates]');
    ornaments.forEach(function (el) {
      var candidates = JSON.parse(el.dataset.candidates);
      var match = candidates.find(function (c) { return c.period === period; })
               || candidates.find(function (c) { return !c.period; })
               || candidates[0];
      if (match.file === el.dataset.file) return; // already correct (common case) → no fetch
      fetch('/assets/ornaments/' + el.dataset.category + '/' + match.file + '.svg')
        .then(function (r) { return r.text(); })
        .then(function (svg) {
          svg = svg.replace(/<\?xml[^?]*\?>\s*/g, '').replace(/<!DOCTYPE[^>]*>\s*/g, '');
          el.innerHTML = svg;
          el.dataset.file = match.file;
        });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
