// ornament-rotation.js — client-side liturgical ornament rotation.
// Depends on window.getPeriod defined by liturgical-period.js (loaded synchronously in <head>).
//
// Build inlines the neutral default ornament (no liturgical period) so the build is
// frozen-safe regardless of when it was made. The <head> flag script adds html.orn-rotate
// on special days to hide rotating ornaments before first paint. This script then either:
//   - reveals immediately (default already correct for this period), or
//   - fetches the seasonal SVG, injects it, then reveals.
// On fetch failure: reveals the default already in the DOM (graceful offline degradation).
(function () {
  function reveal(el) {
    el.classList.add('orn-ready');
  }

  function run() {
    var period = getPeriod(new Date());
    var ornaments = document.querySelectorAll('.ornament[data-candidates]');
    ornaments.forEach(function (el) {
      var candidates = JSON.parse(el.dataset.candidates);
      var match = candidates.find(function (c) { return c.period === period; })
               || candidates.find(function (c) { return !c.period; })
               || candidates[0];
      if (match.file === el.dataset.file) {
        // Default is already correct for this period → reveal, no fetch.
        reveal(el);
        return;
      }
      fetch('/assets/ornaments/' + el.dataset.category + '/' + match.file + '.svg')
        .then(function (r) { return r.text(); })
        .then(function (svg) {
          svg = svg.replace(/<\?xml[^?]*\?>\s*/g, '').replace(/<!DOCTYPE[^>]*>\s*/g, '');
          el.innerHTML = svg;
          el.dataset.file = match.file;
          reveal(el);
        })
        .catch(function () {
          // Network failure: show the neutral default already in the DOM.
          reveal(el);
        });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
