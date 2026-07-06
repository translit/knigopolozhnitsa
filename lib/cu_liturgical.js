'use strict';

// Church Slavonic liturgical vocabulary.
// SHARED LIBRARY — do not delete. Use in any script needing liturgical element
// names, section markers, or the &nbsp;-before-numeral term list.
// require('./lib/cu_liturgical')

// ── Section markers ───────────────────────────────────────────────────────────

// The three canonical Glory/Now markers used throughout liturgical texts.
const LITURGICAL_MARKERS = {
  slava:     'Сла́ва',
  iNyne:     'И҆ ны́нѣ',
  slavaINyne:'Сла́ва и҆ ны́нѣ',
};

// ── Liturgical element table ──────────────────────────────────────────────────

// Canonical label → { type, variants } mapping for normalize/tag scripts.
// type: string category for classification.
// variants: all attested spellings (accented, titlo-abbreviation, lowercase).
//
// When adding a new element: add the canonical form as the key, list every
// attested variant in the content corpus as variants. Order within variants
// does not matter here (use LITURGICAL_NUMERIC_TERMS for regex order).
const LITURGICAL_ELEMENTS = [
  {
    lemma:    'тропа́рь',
    type:     'tropar',
    variants: ['тропа́рь', 'тропарь', 'тропаⷬ҇', 'тропа́р.', 'тропа́рѧ'],
  },
  {
    lemma:    'конда́къ',
    type:     'kondak',
    variants: ['конда́къ', 'конда́к', 'кондакъ', 'кондак', 'кондаⷦ҇'],
  },
  {
    lemma:    'сѣда́ленъ',
    type:     'sedalen',
    variants: ['сѣда́ленъ', 'сѣдаⷧ҇', 'сѣда́ленъ'],
  },
  {
    lemma:    'и҆́косъ',
    type:     'ikos',
    variants: ['и҆́косъ', 'і҆́косъ', 'и҆́косъ'],
  },
  {
    lemma:    'и҆рмо́съ',
    type:     'irmos',
    variants: ['и҆рмо́съ', 'ирмо́съ', 'и҆рмⷪ҇съ'],
  },
  {
    lemma:    'бг҃оро́диченъ',
    type:     'bogorodichen',
    variants: [
      'Бг҃оро́диченъ', 'бг҃оро́диченъ',
      'Крⷭ҇тобг҃оро́диченъ', 'крⷭ҇тобг҃оро́диченъ',
      'Трⷪ҇ченъ', 'трⷪ҇ченъ',
      'Мꙋ́чениченъ', 'мꙋ́чениченъ',
      'Поко́инъ', 'поко́инъ',
      'Мч҃нчны',
    ],
  },
  {
    lemma:    'гла́съ',
    type:     'glas',
    variants: ['гла́съ', 'гла́въ', 'глава̀', 'гл\\.'],
  },
  {
    lemma:    'пѣ́снь',
    type:     'pesn',
    variants: ['пѣ́снь', 'Пѣ́сн\\.'],
  },
  {
    lemma:    'зача́ло',
    type:     'zachalo',
    variants: ['зача́ло'],
  },
  {
    lemma:    'каѳі́сма',
    type:     'kathisma',
    variants: ['каѳі́сма', 'каѳі́смꙋ', 'каѳі̑смы'],
  },
];

// ── Numeric-context term lists ────────────────────────────────────────────────

// Regex-ready strings for the &nbsp;-before-numeral Eleventy transform
// (slavonicNumeralNoBreak in .eleventy.js). Each entry is already regex-escaped
// (literal periods written as '\\.'). Order within this list is significant —
// longer/more-specific entries appear before shorter ones to prevent partial
// shadowing in the joined alternation.
//
// To add a new abbreviation: append it here AND verify the build output with
// `npx @11ty/eleventy` and a spot-check of the affected page.
const LITURGICAL_NUMERIC_TERMS = [
  // Multi-word Canon-law source abbreviations (longest first)
  'Трет\\. посл\\. Карѳ\\.',
  'Дїонѵ́с\\. а҆леѯ\\.',
  'Григ\\. неокес\\.',
  'Григ\\. нѵ́сс\\.',
  'Дїон\\. а҆леѯ\\.',
  'Петр\\. а҆леѯ\\.',
  'Слич\\. Двꙋкр\\.',
  'Григ\\. неок\\.',
  'Та́мъ же',
  // Single-word Canon-law source abbreviations
  'Премꙋ́др\\.',
  'А҆гкѵ́р\\.',
  'А҆нтїох\\.',
  'А҆по́ст\\.',
  'Дїонѵ́с\\.',
  'Ѳео́фїл\\.',
  'А҆гѵ́р\\.',
  'А҆пост\\.',
  'Васі́л\\.',
  'Га́нгр\\.',
  'Кѵрі́л\\.',
  'Кѷрі́л\\.',
  'Двꙋкр\\.',
  'Пе́рв\\.',
  'Тїмоѳ\\.',
  'Ѳео́ф\\.',
  'А҆гк\\.',
  'А҆нт\\.',
  'Карѳ\\.',
  'Лаод\\.',
  'Неок\\.',
  'Перв\\.',
  'Сард\\.',
  'Седм\\.',
  'Трет\\.',
  'Четв\\.',
  'Шест\\.',
  'Вас\\.',
  // Bible book abbreviations (see also lib/cu_bible_books.js for full table)
  'А҆мѡ́с\\.',
  'Быт\\.',
  'Второзак\\.',
  'Второз\\.',
  'Втор\\.',
  'Галат\\.',
  'Дан\\.',
  'Дѣѧ́н\\.',
  'Є҆вр\\.',
  'Є҆ккл\\.',
  'Є҆фес\\.',
  'И҆сх\\.',
  'і҆ѡа́н\\.',
  'І҆а́к\\.',
  'І҆езек\\.',
  'І҆ерем\\.',
  'І҆исꙋ́с\\.',
  'І҆ис\\.',
  'І҆ѡа́н\\.',
  'І҆́ѡв\\.',
  'Колос\\.',
  'кор\\.',
  'Леѵ\\.',
  'Лꙋк\\.',
  'Ма́рк\\.',
  'Матѳ\\.',
  'Мїх\\.',
  'Наꙋ́м\\.',
  'Наꙋм\\.',
  'петр\\.',
  'Пла́ч\\.',
  'При́тч\\.',
  'Пѣ́сн\\.',
  'Ри́м\\.',
  'Рим\\.',
  'Сїра́х\\.',
  'сол\\.',
  'Софо́н\\.',
  'ст\\.',
  'Тїт\\.',
  'Фїлїп\\.',
  'ца́р\\.',
  'цар\\.',
  'Ѱал\\.',
  'ті́т\\.',
  'тїм\\.',
  'тїмоѳ\\.',
  // Liturgical numeric terms
  'а҆нтїфѡ́нъ',
  'гла́въ',
  'глава̀',
  'гла́съ',
  'гл\\.',
  'зача́ло',
  'і҆́косъ',
  'каѳі́смꙋ',
  'каѳі̑смы',
  'каѳі́сма',
  'конда́къ',
  'ли́стъ',
  'мета̑нїѧ',
  'мине́и',
  'мл҃тва',
  'Мч҃нчны',
  'на',
  'пѣ́снь',
  'покло́ны',
  'самогла́сны',
  'Сті́хъ',
  'стїхѡ́въ',
  'трипѣ́снца',
  'ча́съ',
  'ча́сть',
  'ѱало́мъ',
  'ѱалма̀',
];

// Regex-ready second-word strings for the а҃/в҃/г҃ + numeral + book-part &nbsp; transform.
// These are the parts that FOLLOW the ordinal numeral in numbered Bible book citations
// (e.g. 'в҃ Цар.' — here 'Цар\\.' is the book part). See lib/cu_bible_books.js for
// the full book-abbreviation table keyed on the complete abbreviation string.
const NUMBERED_BOOK_PARTS = [
  'Мѡѷс\\.',
  'Царⷭ҇\\.', 'Царⷭ҇',
  'цр҃тв\\.', 'Ца́р\\.', 'Цар\\.', 'ца́р\\.', 'цар\\.',
  'Парал\\.',
  'Є҆здр\\.',
  'Мак\\.',
  'Петра̀', 'Петр\\.', 'петр\\.',
  'І҆ѡа́н\\.', 'і҆ѡа́н\\.', 'І҆ѡа́н',
  'Корі́нѳ\\.', 'Корі́н\\.', 'Корїн\\.', 'корі́нѳ', 'Кор\\.', 'кор\\.',
  'Солꙋ́н\\.', 'Сол\\.', 'сол\\.',
  'Тїмоѳ\\.', 'тїмоѳ\\.', 'Тїм\\.', 'тїм\\.',
];

// Church Slavonic numeral token pattern (regex string, not RegExp object).
// Matches a single CS numeral with combining marks, optional trailing period/colon.
const NUMERAL_PATTERN = '[а-ѱѡцѳѻꙋ]{1,2}[҃҂]+[а-ѱѡцѳѻꙋ҃҂]*\\.?:?';

// Return the liturgical-term alternation string for use in RegExp constructors.
function liturgicalTermsRegex() {
  return LITURGICAL_NUMERIC_TERMS.join('|');
}

// Return the numbered-book-part alternation string for use in RegExp constructors.
function numberedBookPartsRegex() {
  return NUMBERED_BOOK_PARTS.join('|');
}

module.exports = {
  LITURGICAL_MARKERS,
  LITURGICAL_ELEMENTS,
  LITURGICAL_NUMERIC_TERMS,
  NUMBERED_BOOK_PARTS,
  NUMERAL_PATTERN,
  liturgicalTermsRegex,
  numberedBookPartsRegex,
};

// Self-test: node lib/cu_liturgical.js
if (require.main === module) {
  let pass = 0, fail = 0;
  function check(label, got, expected) {
    const ok = got === expected;
    console.log(`${ok ? 'OK  ' : 'FAIL'} ${label}: got ${String(got)}, expected ${String(expected)}`);
    ok ? pass++ : fail++;
  }

  // Structural checks
  check('LITURGICAL_ELEMENTS is array',   Array.isArray(LITURGICAL_ELEMENTS), true);
  check('LITURGICAL_ELEMENTS non-empty',  LITURGICAL_ELEMENTS.length > 0, true);
  check('LITURGICAL_NUMERIC_TERMS non-empty', LITURGICAL_NUMERIC_TERMS.length > 0, true);
  check('NUMBERED_BOOK_PARTS non-empty',  NUMBERED_BOOK_PARTS.length > 0, true);

  // Markers
  check('LITURGICAL_MARKERS.slava',  LITURGICAL_MARKERS.slava,     'Сла́ва');
  check('LITURGICAL_MARKERS.iNyne',  LITURGICAL_MARKERS.iNyne,     'И҆ ны́нѣ');

  // Every element has required fields
  let allOk = true;
  for (const el of LITURGICAL_ELEMENTS) {
    if (!el.lemma || !el.type || !Array.isArray(el.variants) || el.variants.length === 0) {
      allOk = false;
      console.log(`FAIL element malformed: ${JSON.stringify(el)}`);
      fail++;
    }
  }
  if (allOk) { console.log('OK   all LITURGICAL_ELEMENTS well-formed'); pass++; }

  // liturgicalTermsRegex produces a working RegExp
  const re = new RegExp(`(${liturgicalTermsRegex()})`);
  check('regex matches гла́съ',    re.test('гла́съ'), true);
  check('regex matches зача́ло',   re.test('зача́ло'), true);
  check('regex matches пѣ́снь',   re.test('пѣ́снь'), true);
  check('regex matches Наꙋ́м\\.', re.test('Наꙋ́м.'), true);

  // numberedBookPartsRegex
  const re2 = new RegExp(`(${numberedBookPartsRegex()})`);
  check('book parts regex matches Цар\\.', re2.test('Цар.'), true);
  check('book parts regex matches Мак\\.', re2.test('Мак.'), true);

  // NUMERAL_PATTERN
  const re3 = new RegExp(NUMERAL_PATTERN);
  check('numeral pattern matches а҃',    re3.test('а҃'), true);
  check('numeral pattern matches к҃в',  re3.test('к҃в'), true);
  check('numeral pattern matches рд҃і', re3.test('рд҃і'), true);
  check('numeral pattern matches сп҃в', re3.test('сп҃в'), true);
  check('numeral pattern no match abc', re3.test('abc'), false);

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail > 0 ? 1 : 0);
}
