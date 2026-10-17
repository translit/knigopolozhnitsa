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

  // Afterfeast (попразднство) spans of the fixed great feasts, as [julianMonth, firstDay, lastDay].
  // Each span runs from the day after the feast through its отдание (leavetaking), which is
  // canonically the last day of the afterfeast. Spans were derived as feast+1 … отдание and
  // cross-checked against Ponomar's own "Afterfeast of…"/"Apodosis of…" day tags, the azbyka.ru
  // table of предпразднства/попразднства/отдания, and ru.wikipedia "Отдание праздника".
  //   Рождество Богородицы 09-08 → 09-09…09-12     Богоявление   01-06 → 01-07…01-14
  //   Воздвижение          09-14 → 09-15…09-21     Преображение  08-06 → 08-07…08-13
  //   Введение             11-21 → 11-22…11-25     Успение       08-15 → 08-16…08-23
  //   Рождество Христово   12-25 → 12-26…12-31
  // Сретение (02-02) and Благовещение (03-25) depend on Pascha and are handled in getPeriod.
  // The other five GREAT_FEASTS entries (01-01, 06-24, 06-29, 08-29, 10-01) have no afterfeast.
  var AFTERFEAST_SPANS = [
    [1,   7, 14],
    [8,   7, 13],
    [8,  16, 23],
    [9,   9, 12],
    [9,  15, 21],
    [11, 22, 25],
    [12, 26, 31]
  ];

  function inFixedAfterfeast(j) {
    for (var i = 0; i < AFTERFEAST_SPANS.length; i++) {
      var s = AFTERFEAST_SPANS[i];
      if (j.m === s[0] && j.d >= s[1] && j.d <= s[2]) return true;
    }
    return false;
  }

  // Сретение (02-02 Julian): its afterfeast is cut short by Great Lent, so the last day of the
  // period is a function of the feast's own nday. Key = nday of 02-02, value = nday of the last
  // day of the period; null = no afterfeast at all. Feast nday <= -66 is unconstrained and takes
  // the plain feast + 7. Table re-derived from Ponomar's Cmd guards on 02/03–02/09
  // (CId 37302 = Apodosis, 37303 = Afterfeast, both under SId 373).
  // NOTE on -65: Ponomar's 02/09 guard is `nday < -58`, so feast + 7 = exactly -58 fires nowhere
  // and Ponomar shows no отдание those years (1946, 1952, 1957, 2036, 2041, 2047) while still
  // tagging 02-08 as попразднство — almost certainly `<` where `<=` was meant. We follow Ponomar
  // and end the span at -59. Set this to -58 to take feast + 7 instead.
  var SRETENIE_LAST_DAY = {
    '-65': -59,
    '-64': -58, '-63': -58, '-62': -58, '-61': -58,
    '-60': -54, '-59': -54, '-58': -54, '-57': -54,
    '-56': -52, '-55': -52,
    '-54': -50, '-53': -50,
    '-52': -49, '-51': -49, '-50': -49,
    '-49': null, '-48': null
  };

  // Gregorian Date for a Julian MM-DD in the given Gregorian year (inverse of toJulian).
  // Only used for February and March, where the two calendars share the Gregorian year.
  function fromJulian(year, m, d) {
    var off = Math.floor(year / 100) - Math.floor(year / 400) - 2;
    return new Date(year, m - 1, d + off);
  }

  // Days from Pascha (nday) of a Julian MM-DD in the given Gregorian year.
  function ndayOfJulian(year, m, d) {
    var g = fromJulian(year, m, d);
    return Math.round(
      (Date.UTC(g.getFullYear(), g.getMonth(), g.getDate()) - pascha(year)) / 86400000
    );
  }

  // Return a liturgical period string for the given date.
  // Period strings:
  //   pascha, bright-week
  //   lent-1 … lent-6 (lent-6 = Palm week incl. Palm Sunday)
  //   holy-week
  //   pentecost (Pentecost Sunday through Pentecost week)
  //   apostles-fast, dormition-fast, nativity-fast
  //   great-feast (any of the 12 + Ascension; overrides fasts and lent)
  //   afterfeast (попразднство through отдание; overrides the fasts, yields to lent/holy-week)
  //   ordinary (everything else)
  //
  // Precedence: pascha/bright-week > great-feast > holy-week > lent-* > afterfeast > pentecost
  // > the three fasts > ordinary.
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

    // ── Afterfeast: попразднство through отдание ─────────────────────────────
    // Ponomar labels the fixed feasts' and the Ascension's afterfeasts in full, plus the
    // isolated отдание of Pascha (nday 38). Pascha's own nday 8…37 it leaves unlabelled, and
    // Pentecost's afterfeast is already covered by the 'pentecost' period below.
    if (diff === 38)              return 'afterfeast';  // отдание Пасхи
    if (diff >= 40 && diff <= 47) return 'afterfeast';  // Вознесение (nday 39) + отдание 47
    if (inFixedAfterfeast(j))     return 'afterfeast';
    if (j.m === 2 && j.d >= 3 && j.d <= 9) {
      var feast = ndayOfJulian(date.getFullYear(), 2, 2);
      var last  = feast <= -66 ? feast + 7 : SRETENIE_LAST_DAY[feast];
      if (typeof last === 'number' && diff > feast && diff <= last) return 'afterfeast';
    }
    // Благовещение has no попразднство, only an отдание on 03-26, and not even that when the
    // feast falls on Lazarus Saturday through Bright Saturday (nday -8…7). Unreachable under the
    // precedence above — 03-26 can only land on nday -30…-8, always inside Great Lent — but kept
    // so the rule is explicit if the precedence ever changes.
    if (j.m === 3 && j.d === 26 && ndayOfJulian(date.getFullYear(), 3, 25) < -8) {
      return 'afterfeast';
    }

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

    // ── Afterfeast (попразднство). Julian → Gregorian offset is 13 days in 2026. ──────────
    // Рождество Богородицы: Julian 09-09…09-12 = Greg 09-22…09-25; 09-13 (предпразднство
    // Воздвижения) is not an afterfeast day.
    { date: new Date(2026, 8, 22), expected: 'afterfeast',    label: '2026 Sep 22 (Jul 09-09) afterfeast' },
    { date: new Date(2026, 8, 25), expected: 'afterfeast',    label: '2026 Sep 25 (Jul 09-12) отдание' },
    { date: new Date(2026, 8, 26), expected: 'ordinary',      label: '2026 Sep 26 (Jul 09-13) not afterfeast' },
    // Богоявление: отдание Julian 01-14 = Greg 01-27.
    { date: new Date(2026, 0, 27), expected: 'afterfeast',    label: '2026 Jan 27 (Jul 01-14) отдание Богоявления' },
    { date: new Date(2026, 0, 28), expected: 'ordinary',      label: '2026 Jan 28 (Jul 01-15) not afterfeast' },
    // Afterfeast outranks the fasts: Преображение inside the Dormition fast, Введение inside
    // the Nativity fast.
    { date: new Date(2026, 7, 20), expected: 'afterfeast',    label: '2026 Aug 20 (Jul 08-07) beats dormition-fast' },
    { date: new Date(2026, 11, 5), expected: 'afterfeast',    label: '2026 Dec 5 (Jul 11-22) beats nativity-fast' },
    // Ascension nday 39 stays great-feast; 40…47 are afterfeast; 48 is ordinary.
    { date: new Date(2026, 4, 21), expected: 'great-feast',   label: '2026 Ascension (nday 39)' },
    { date: new Date(2026, 4, 22), expected: 'afterfeast',    label: '2026 nday 40 afterfeast of Ascension' },
    { date: new Date(2026, 4, 29), expected: 'afterfeast',    label: '2026 nday 47 отдание Вознесения' },
    { date: new Date(2026, 4, 30), expected: 'ordinary',      label: '2026 nday 48 ordinary' },
    // отдание Пасхи = nday 38; nday 37 is left ordinary (Ponomar labels no Paschal afterfeast).
    { date: new Date(2026, 4, 20), expected: 'afterfeast',    label: '2026 nday 38 отдание Пасхи' },
    { date: new Date(2026, 4, 19), expected: 'ordinary',      label: '2026 nday 37 ordinary' },
    // Сретение 2026: Julian 02-02 = Greg Feb 15 = nday -56, so the period ends at nday -52 = Feb 19.
    { date: new Date(2026, 1, 16), expected: 'afterfeast',    label: '2026 Feb 16 попразднство Сретения' },
    { date: new Date(2026, 1, 19), expected: 'afterfeast',    label: '2026 Feb 19 отдание Сретения' },
    { date: new Date(2026, 1, 20), expected: 'ordinary',      label: '2026 Feb 20 after отдание Сретения' },
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
