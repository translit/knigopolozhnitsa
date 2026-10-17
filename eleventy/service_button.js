'use strict';

const fs = require('fs');
const path = require('path');
const { cuToArabic } = require('../lib/cu_numerals');
const { stripCombining } = require('../lib/cu_text');

// Typikon -> service book button. On Typikon pages, a fixed corner button
// leads to the service for the day anchor in the URL hash (men-MM-DD now;
// tri-N / pen-N later). The page gets only the map entries for its own
// anchors; the client side is src/assets/js/service-button.js.

const SERVICE_ROOT = path.join(__dirname, '../src/content/service');
const MONTHS = { sep: 9, oct: 10, nov: 11, dec: 12, jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8 };

const pad = (n) => String(n).padStart(2, '0');
const daysIn = (mo) => new Date(Date.UTC(2000, mo, 0)).getUTCDate(); // 2000 is leap: Feb has 29

const plain = (html) => html
  .replace(/<[^>]+>/g, '')
  .replace(/[ \t\r\n]+/g, ' ')
  .replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&')
  .trim();

// Dated services of one book: [{ month, day, order, url, label }].
// Titles are "<Month> <numeral>" (sometimes ", доп" or "‐й де́нь"); undated
// ones (movable Sundays, hours) are dropped later by the day check.
function readBook(book) {
  const dir = path.join(SERVICE_ROOT, book);
  const entries = [];
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith('.md') || file === 'index.md') continue;
    const src = fs.readFileSync(path.join(dir, file), 'utf8');
    const title = (src.match(/^title:\s*"?(.*?)"?\s*$/m) || [])[1] || '';
    const words = title.trim().split(/\s+/);
    if (words.length < 2) continue;
    const rubric = src.match(/<rubric>([\s\S]*?)<\/rubric>/);
    entries.push({
      month: words[0],
      day: cuToArabic(words[1]),
      order: Number((src.match(/^\s*order:\s*(\d+)/m) || [])[1] || 0),
      url: `/service/${book}/${file.replace(/\.md$/, '')}/`,
      label: plain(rubric ? rubric[1] : title).normalize('NFC'),
    });
  }
  return entries.sort((a, b) => a.order - b.order);
}

// Month words are spelled variously (І҆аннꙋа́рїа / І҆анꙋа́рїа, Феврꙋа́рїа /
// Феѵрꙋа́рїа); with ѵ read as в, the first three base letters tell all twelve
// apart (мар/маї, іꙋн/іꙋл).
const monthKey = (word) => stripCombining(word.normalize('NFC')).toLowerCase().replace(/ѵ/g, 'в').replace(/[^\p{L}]/gu, '').slice(0, 3);

// men-MM-DD -> [{ url, label }]: monthly Menaia first, then the additional
// Menaion, each by navigation.order. menaionfest is left out: it repeats the
// monthly books' feasts.
function buildMenaionMap() {
  const map = {};
  const add = (mo, e) => {
    if (!(mo && e.day >= 1 && e.day <= daysIn(mo))) return;
    const id = `men-${pad(mo)}-${pad(e.day)}`;
    (map[id] = map[id] || []).push({ url: e.url, label: e.label });
  };
  const monthOf = new Map();
  for (const [book, mo] of Object.entries(MONTHS)) {
    for (const e of readBook(`menaion${book}`)) {
      monthOf.set(monthKey(e.month), mo);
      add(mo, e);
    }
  }
  for (const e of readBook('menaionadd')) add(monthOf.get(monthKey(e.month)), e);
  const missing = [];
  for (let mo = 1; mo <= 12; mo++) {
    for (let d = 1; d <= daysIn(mo); d++) {
      if (!map[`men-${pad(mo)}-${pad(d)}`]) missing.push(`${pad(mo)}-${pad(d)}`);
    }
  }
  if (missing.length) console.warn(`[serviceButton] ${missing.length} days without a Menaion service: ${missing.slice(0, 10).join(' ')}${missing.length > 10 ? ' …' : ''}`);
  return map;
}

module.exports = function register(eleventyConfig) {
  let serviceMap = null;
  eleventyConfig.on('eleventy.before', () => { serviceMap = null; });

  eleventyConfig.addTransform('serviceButton', function(content, outputPath) {
    if (!outputPath || !/[\\/]service[\\/]typikon[\\/].+\.html$/.test(outputPath)) return content;
    if (!serviceMap) serviceMap = buildMenaionMap();
    const links = {};
    for (const m of content.matchAll(/<a id="((?:men|tri|pen)-[0-9-]+)"/g)) {
      if (serviceMap[m[1]]) links[m[1]] = serviceMap[m[1]];
    }
    if (!Object.keys(links).length) return content;
    const json = JSON.stringify(links).replace(/</g, '\\u003c');
    const html =
      `<script type="application/json" id="service-links">${json}</script>\n` +
      `<script src="/assets/js/service-button.js"></script>\n`;
    return content.replace('</body>', `${html}</body>`);
  });
};

module.exports.buildMenaionMap = buildMenaionMap;
