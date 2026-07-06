// liturgical-period.js — UMD module for liturgical period computation.
// Used at build time (Node/Eleventy) and in the browser (fallback for stale builds).
// Browser: window.getPeriod is set. Node: module.exports = { getPeriod }.
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.getPeriod = factory().getPeriod;
  }
}(typeof self !== 'undefined' ? self : this, function () {

  // Meeus Julian algorithm for Pascha (Old Style), converted to Gregorian.
  // NOTE: same algorithm duplicated in julian-date.js (calculatePascha). Keep in sync.
  function pascha(year) {
    var a = year % 4, b = year % 7, c = year % 19;
    var d = (19 * c + 15) % 30;
    var e = (2 * a + 4 * b - d + 34) % 7;
    var month = Math.floor((d + e + 114) / 31);
    var day   = ((d + e + 114) % 31) + 1;
    var offset = Math.floor(year / 100) - Math.floor(year / 400) - 2;
    return Date.UTC(year, month - 1, day + offset);
  }

  // Convert a Gregorian Date to Julian calendar { m: 1-12, d: 1-31 }.
  function toJulian(date) {
    var off = Math.floor(date.getFullYear() / 100)
            - Math.floor(date.getFullYear() / 400) - 2;
    var j = new Date(date.getFullYear(), date.getMonth(), date.getDate() - off);
    return { m: j.getMonth() + 1, d: j.getDate() };
  }

  // Fixed great feasts keyed by Julian "MM-DD".
  // Jan 1 = Circumcision; Jun 29 = Sts Peter & Paul (also ends Apostles' fast).
  var GREAT_FEASTS = {
    '01-01': 1, '01-06': 1,
    '02-02': 1,
    '03-25': 1,
    '06-24': 1, '06-29': 1,
    '08-06': 1, '08-15': 1, '08-29': 1,
    '09-08': 1, '09-14': 1,
    '10-01': 1,
    '11-21': 1,
    '12-25': 1
  };

  // Return a liturgical period string for the given date.
  // Period strings:
  //   pascha, bright-week
  //   lent-1 … lent-6 (lent-6 = Palm week incl. Palm Sunday)
  //   holy-week
  //   pentecost (Pentecost Sunday through Pentecost week)
  //   apostles-fast, dormition-fast, nativity-fast
  //   great-feast (any of the 12 + Ascension; overrides fasts and lent)
  //   ordinary (everything else)
  //
  // To add a finer period (e.g. a named pre-Lenten week), insert a check here
  // and tag ornament candidates with the new period string in manifest.json.
  function getPeriod(date) {
    var today = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
    var p = pascha(date.getFullYear());
    var diff = Math.round((today - p) / 86400000);

    // ── Bright Paschal period ────────────────────────────────────────────────
    if (diff === 0)              return 'pascha';
    if (diff >= 1  && diff <= 7) return 'bright-week';

    // ── Movable great feast: Ascension (nday 39) ─────────────────────────────
    if (diff === 39) return 'great-feast';

    // ── Julian date helpers (used for fixed feasts and fasts) ─────────────────
    var j   = toJulian(date);
    var pad = function (n) { return n < 10 ? '0' + n : '' + n; };
    var jmd = pad(j.m) + '-' + pad(j.d);

    // ── Fixed great feasts (override fasts and lenten periods) ───────────────
    if (GREAT_FEASTS[jmd]) return 'great-feast';

    // ── Holy Week ────────────────────────────────────────────────────────────
    if (diff >= -6  && diff <= -1)  return 'holy-week';

    // ── Great Lent (lent-6 includes Palm Saturday and Palm Sunday) ────────────
    if (diff >= -13 && diff <= -7)  return 'lent-6';
    if (diff >= -20 && diff <= -14) return 'lent-5';
    if (diff >= -27 && diff <= -21) return 'lent-4';
    if (diff >= -34 && diff <= -28) return 'lent-3';
    if (diff >= -41 && diff <= -35) return 'lent-2';
    if (diff >= -48 && diff <= -42) return 'lent-1';

    // ── Pentecost week (Pentecost Sunday through Saturday) ────────────────────
    if (diff >= 49  && diff <= 55)  return 'pentecost';

    // ── Apostles' fast: All-Saints+1 (diff 57) through June 28 Julian ─────────
    // Peter & Paul feast (June 29 Julian) is caught by GREAT_FEASTS above.
    if (diff >= 57 && (j.m < 6 || (j.m === 6 && j.d <= 28))) return 'apostles-fast';

    // ── Dormition fast: August 1–14 Julian ───────────────────────────────────
    // Transfiguration (Aug 6 Julian) is caught by GREAT_FEASTS above.
    if (j.m === 8 && j.d <= 14) return 'dormition-fast';

    // ── Nativity fast: November 15 – December 24 Julian ──────────────────────
    // Nativity (Dec 25 Julian) is caught by GREAT_FEASTS above.
    if ((j.m === 11 && j.d >= 15) || (j.m === 12 && j.d <= 24)) return 'nativity-fast';

    return 'ordinary';
  }

  return { getPeriod: getPeriod };
}));

// Self-test (Node only).
if (typeof module !== 'undefined' && module.exports && require.main === module) {
  var assert = require('assert');
  // Pascha 2026 = April 12 (Gregorian).
  var tests = [
    // diff=0
    { date: new Date(2026, 3, 12), expected: 'pascha',         label: '2026 Pascha day' },
    // diff=1
    { date: new Date(2026, 3, 13), expected: 'bright-week',    label: '2026 Bright Monday' },
    // diff=7
    { date: new Date(2026, 3, 19), expected: 'bright-week',    label: '2026 Bright Saturday' },
    // Great Lent week 1: diff = -48..-42 → lent-1. Apr 12 - 48 = Feb 23.
    { date: new Date(2026, 1, 23), expected: 'lent-1',         label: '2026 Lent week 1 start' },
    // Holy Week: diff=-6..-1. Apr 12 - 6 = Apr 6.
    { date: new Date(2026, 3, 6),  expected: 'holy-week',      label: '2026 Holy Monday' },
    // Nativity fast: Nov 15 Julian = Nov 28 Greg. Dec 24 Julian = Jan 6 Greg 2027.
    { date: new Date(2026, 10, 28), expected: 'nativity-fast', label: '2026 Nativity fast start (Greg)' },
    // Ordinary day: Aug 1, 2026 (Apostles fast ended July 12 Greg; Dormition fast starts Aug 14 Greg).
    { date: new Date(2026, 7, 1),  expected: 'ordinary',       label: '2026 Aug 1 ordinary' },
    // Great feast Jan 6 Julian = Jan 19 Greg 2026.
    { date: new Date(2026, 0, 19), expected: 'great-feast',    label: '2026 Theophany (Julian Jan 6)' },
    // Today: Jun 28 Greg = Apostles fast.
    { date: new Date(2026, 5, 28), expected: 'apostles-fast',  label: '2026 Jun 28 apostles-fast' },
  ];
  var passed = 0, failed = 0;
  var { getPeriod } = module.exports;
  tests.forEach(function (t) {
    var got = getPeriod(t.date);
    if (got === t.expected) {
      console.log('PASS ' + t.label);
      passed++;
    } else {
      console.error('FAIL ' + t.label + ': expected ' + t.expected + ', got ' + got);
      failed++;
    }
  });
  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exit(1);
}
