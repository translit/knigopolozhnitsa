// service-button.js — Typikon -> service book button.
// Reads #service-links (day anchor id -> [{ url, label }], injected at build on
// Typikon pages) and shows a fixed book button for the day anchor in the URL hash.
// One service: the button is a plain link. Several: it opens a list of them.
// A later hash that is not a day anchor (heading links) keeps the current day.
(function () {
  var data = document.getElementById('service-links');
  if (!data) return;
  var links;
  try { links = JSON.parse(data.textContent); } catch (e) { return; }

  var wrap = document.createElement('div');
  wrap.className = 'service-button';
  wrap.hidden = true;
  var list = document.createElement('div');
  list.className = 'service-button-list';
  list.hidden = true;
  var button = document.createElement('a');
  button.className = 'service-button-glyph';
  // Open book, outline.
  button.innerHTML =
    '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M16 7S9 1 2 6v22c7-5 14 0 14 0s7-5 14 0V6c-7-5-14 1-14 1m0 0v21"/>' +
    '</svg>';
  wrap.appendChild(list);
  wrap.appendChild(button);
  document.body.appendChild(wrap);

  function show(id) {
    var entries = links[id];
    if (!entries) return;
    list.hidden = true;
    list.textContent = '';
    if (entries.length === 1) {
      button.href = entries[0].url;
      button.title = entries[0].label;
    } else {
      button.removeAttribute('href');
      button.removeAttribute('title');
      entries.forEach(function (e) {
        var a = document.createElement('a');
        a.href = e.url;
        a.textContent = e.label;
        list.appendChild(a);
      });
    }
    wrap.hidden = false;
  }

  button.addEventListener('click', function (e) {
    if (button.hasAttribute('href')) return;
    e.preventDefault();
    list.hidden = !list.hidden;
  });
  document.addEventListener('click', function (e) {
    if (!wrap.contains(e.target)) list.hidden = true;
  });

  function fromHash() {
    show(decodeURIComponent(location.hash.slice(1)));
  }
  window.addEventListener('hashchange', fromHash);
  fromHash();
})();
