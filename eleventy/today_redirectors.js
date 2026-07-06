'use strict';

const crypto = require('crypto');
const fs = require('fs');

// Virtual Eleventy pages that redirect to today's Apostle/Gospel reading.
// Bookmarkable stable URLs; resolution runs client-side via window.kpToday.

// Cache-bust julian-date.js so stale iPhone caches pick up window.kpToday.
const scriptHash = crypto
  .createHash('md5')
  .update(fs.readFileSync('./src/assets/js/julian-date.js'))
  .digest('hex')
  .slice(0, 8);

const html = (book, fallback) => `<!doctype html>
<html lang="cu"><head>
<meta charset="utf-8">
<title>Чте́нїе днѐ</title>
<meta name="robots" content="noindex">
<script src="/assets/js/julian-date.js?v=${scriptHash}" defer></script>
<script defer>
document.addEventListener('DOMContentLoaded', async () => {
  try {
    if (!window.kpToday) { location.replace('${fallback}'); return; }
    const urls = await window.kpToday.getTodayReadingUrls();
    location.replace(urls.${book} || '${fallback}');
  } catch (e) {
    location.replace('${fallback}');
  }
});
</script>
</head><body></body></html>`;

module.exports = function register(eleventyConfig) {
  eleventyConfig.addTemplate(
    'today-apostle.njk',
    html('apostle', '/service/apostle/'),
    { permalink: '/today/apostle/', layout: false, eleventyExcludeFromCollections: true }
  );
  eleventyConfig.addTemplate(
    'today-gospel.njk',
    html('gospel', '/service/gospel/'),
    { permalink: '/today/gospel/', layout: false, eleventyExcludeFromCollections: true }
  );
};
