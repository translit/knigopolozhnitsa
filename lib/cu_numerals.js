'use strict';

const { stripCombining, isCombining } = require('./cu_text');

// Church Slavonic numeral letter values
// Source: CLAUDE.md / Unicode Technical Note #41
const LETTER_VALUES = new Map([
  // Units (1-9)
  ['а', 1], ['в', 2], ['г', 3], ['д', 4], ['є', 5],
  ['ѕ', 6], ['з', 7], ['и', 8], ['ѳ', 9],
  // Tens (10-90)
  ['і', 10], ['к', 20], ['л', 30], ['м', 40], ['н', 50],
  ['ѯ', 60], ['о', 70], ['п', 80], ['ч', 90],
  // Hundreds (100-900)
  ['р', 100], ['с', 200], ['т', 300], ['у', 400], ['ф', 500],
  ['х', 600], ['ѱ', 700], ['ѿ', 800], ['ц', 900],
  // Variants
  ['ѡ', 800], // This project uses ѡ for 800 (instead of ѿ)
  ['ѻ', 70],  // Variant of о (70)
  ['ꙋ', 400], // Variant of у (400)
]);

// Convert a Church Slavonic numeral string to an Arabic integer.
// No validation — converts whatever base letters are present; caller must
// pre-validate with isVerse() or isCanonicalNumeral() to avoid false positives
// from nomina sacra (гл҃а → 34, і҆и҃ли → 10, etc.).
// Algorithm: strip combining marks, sum values of all known base letters.
// Handles ҂ (U+0482): each ҂ before a letter multiplies that letter by 1000^n.
// Example: ҂з = 7000, ҂зфл҃г = 7533.
// Note: space-separated тьмы form (>10000 with a space) is not supported.
function cuToArabic(cuStr) {
  if (!cuStr) return 0;
  const stripped = stripCombining(cuStr.normalize('NFC'));
  let total = 0;
  let tisyacha = 0; // count of pending ҂ signs
  for (const ch of stripped) {
    if (ch === '҂') { // ҂ thousands marker
      tisyacha++;
      continue;
    }
    const val = LETTER_VALUES.get(ch);
    if (val !== undefined) {
      total += tisyacha > 0 ? val * Math.pow(1000, tisyacha) : val;
      tisyacha = 0;
    } else {
      tisyacha = 0; // non-numeral char resets pending ҂
    }
  }
  return total;
}

// Returns true if the string is a canonically well-formed CU numeral.
// Default (strict) delegates to isCanonicalNumeral — rejects nomina sacra like
// гл҃а, і҆и҃ли, ст҃а́го whose letters happen to be numeral letters.
// Pass { permissive: true } only for noisy/OCR source where false positives are
// tolerable (any combination of numeral base letters passes).
// cuToArabic has no built-in guard — always validate with isVerse() first.
function isVerse(content, { permissive = false } = {}) {
  const str = content.normalize('NFC').trim();
  if (!str) return false;
  if (permissive) {
    const stripped = stripCombining(str);
    if (!stripped) return false;
    return [...stripped].every(ch => LETTER_VALUES.has(ch) || ch === '҂');
  }
  return isCanonicalNumeral(str);
}

// Returns true if the string is a canonically well-formed CU numeral.
// Mirrors the validation logic of Perl-Lingua-CU cyrillicToAscii/isNumericCu,
// with additions for project-specific variants (ѡ=800, ꙋ=400, ѻ=70).
//
// Canonical structure (sub-1000 part): one optional hundreds letter, one
// optional tens letter (к-ч class), one optional units letter (а-ѳ class);
// OR one optional hundreds, one optional units, then і (for 10, 11-19, etc.).
// Thousands prefix: zero or more ҂[letter] clusters before the sub-1000 part.
function isCanonicalNumeral(str) {
  if (!str) return false;
  const norm = stripCombining(str.normalize('NFC').trim());
  if (!norm) return false;

  // Character classes matching Perl's %digits, with project variants
  const o = 'авгдєѕзиѳ';      // units 1-9
  const t = 'клмнѯопчѻ';      // tens 20-90 (і handled separately, as in Perl)
  const h = 'рстуфхѱѿцѡꙋ';  // hundreds 100-900 (incl. project variants ѡ, ꙋ)

  // Full pattern: optional thousands prefix, then either standard or і-ending form
  const re = new RegExp(
    `^(?:҂[${h}${t}${o}])*(?:[${h}]?[${t}]?[${o}]?|҂?[${h}]?[${o}]?і)$`
  );
  return re.test(norm) && norm.length > 0;
}

// Extract and convert the FIRST CU numeral from content that may include
// range notation, e.g. "в҃і и҆ з҃і:" → 12, "а҃і, л҃д:" → 11, "а҃:" → 1,
// "҂зфл҃г:" → 7533.
function extractFirstNumeral(content) {
  const str = content.normalize('NFC');
  let numeralStr = '';
  let foundStart = false;

  for (const ch of str) {
    const code = ch.codePointAt(0);
    // Combining marks: accumulate if we have started a numeral
    if (isCombining(code)) {
      if (foundStart) numeralStr += ch;
      continue;
    }
    if (code === 0x0482) { // ҂ thousands marker — part of a numeral
      foundStart = true;
      numeralStr += ch;
      continue;
    }
    if (LETTER_VALUES.has(ch)) {
      foundStart = true;
      numeralStr += ch;
    } else if (foundStart) {
      break; // First non-numeral character after the numeral ends it
    }
  }

  return cuToArabic(numeralStr);
}

module.exports = { cuToArabic, isVerse, extractFirstNumeral, isCanonicalNumeral, LETTER_VALUES };

// Self-test when run directly: node cu_numerals.js
if (require.main === module) {
  let pass = 0, fail = 0;

  function check(label, got, expected) {
    const ok = got === expected;
    console.log(`${ok ? 'OK  ' : 'FAIL'} ${label}: got ${got}, expected ${expected}`);
    ok ? pass++ : fail++;
  }

  // cuToArabic tests
  check('а҃ = 1', cuToArabic('а҃'), 1);
  check('в҃ = 2', cuToArabic('в҃'), 2);
  check('ѳ҃ = 9', cuToArabic('ѳ҃'), 9);
  check('і҃ = 10', cuToArabic('і҃'), 10);
  check('а҃і = 11', cuToArabic('а҃і'), 11);
  check('в҃і = 12', cuToArabic('в҃і'), 12);
  check('ѳ҃і = 19', cuToArabic('ѳ҃і'), 19);
  check('к҃ = 20', cuToArabic('к҃'), 20);
  check('к҃а = 21', cuToArabic('к҃а'), 21);
  check('к҃в = 22', cuToArabic('к҃в'), 22);
  check('к҃и = 28', cuToArabic('к҃и'), 28);
  check('л҃ = 30', cuToArabic('л҃'), 30);
  check('м҃ = 40', cuToArabic('м҃'), 40);
  check('н҃ = 50', cuToArabic('н҃'), 50);
  check('ѯ҃ = 60', cuToArabic('ѯ҃'), 60);
  check('п҃ = 80', cuToArabic('п҃'), 80);
  check('ч҃ = 90', cuToArabic('ч҃'), 90);
  check('р҃ = 100', cuToArabic('р҃'), 100);
  check('р҃ѕ = 106', cuToArabic('р҃ѕ'), 106);
  check('р҃ѕі = 116', cuToArabic('р҃ѕі'), 116);

  // Thousands (҂) support — Perl-parity
  check('҂а = 1000', cuToArabic('҂а'), 1000);
  check('҂в = 2000', cuToArabic('҂в'), 2000);
  check('҂і = 10000', cuToArabic('҂і'), 10000);
  check('҂зфл҃г = 7533', cuToArabic('҂зфл҃г'), 7533);
  // ҂ applies to the single letter immediately after it (consistent with Perl cyrillicToAscii regex).
  // For unambiguous multi-letter thousands, each letter carries its own ҂:
  check('҂р҂л҂г = 133000', cuToArabic('҂р҂л҂г'), 133000);
  check('҂рл҃г = 100033', cuToArabic('҂рл҃г'), 100033); // ҂ on р only → 100000+30+3

  // extractFirstNumeral tests
  check('extract а҃: → 1', extractFirstNumeral('а҃:'), 1);
  check('extract к҃в: → 22', extractFirstNumeral('к҃в:'), 22);
  check('extract в҃і и҆ з҃і: → 12', extractFirstNumeral('в҃і и҆ з҃і:'), 12);
  check('extract а҃і, л҃д: → 11', extractFirstNumeral('а҃і, л҃д:'), 11);
  check('extract ҂зфл҃г: → 7533', extractFirstNumeral('҂зфл҃г:'), 7533);

  // isCanonicalNumeral — valid forms
  check('isCanon а = true',     isCanonicalNumeral('а'), true);
  check('isCanon і = true',     isCanonicalNumeral('і'), true);
  check('isCanon к҃ = true',    isCanonicalNumeral('к҃'), true);
  check('isCanon р҃ = true',    isCanonicalNumeral('р҃'), true);
  check('isCanon а҃і = true',   isCanonicalNumeral('а҃і'), true);   // 11
  check('isCanon р҃ѕі = true',  isCanonicalNumeral('р҃ѕі'), true);  // 116
  check('isCanon ѡ = true',     isCanonicalNumeral('ѡ'), true);     // 800 variant
  check('isCanon ꙋ = true',     isCanonicalNumeral('ꙋ'), true);     // 400 variant
  check('isCanon ѻ = true',     isCanonicalNumeral('ѻ'), true);     // 70 variant
  check('isCanon ҂а = true',    isCanonicalNumeral('҂а'), true);    // 1000
  check('isCanon ҂зфл҃г = true', isCanonicalNumeral('҂зфл҃г'), true); // 7533

  // isCanonicalNumeral — invalid forms
  check('isCanon аа = false',   isCanonicalNumeral('аа'), false);   // duplicate units
  check('isCanon іа = false',   isCanonicalNumeral('іа'), false);   // і before unit — wrong order
  check('isCanon гла = false',  isCanonicalNumeral('гла'), false);  // nomina-sacra-like
  check('isCanon empty = false', isCanonicalNumeral(''), false);

  // isVerse: default strict, permissive opt-in
  check('isVerse гл҃а default = false',     isVerse('гл҃а'), false);                    // nomina sacra rejected by default
  check('isVerse гл҃а permissive = true',   isVerse('гл҃а', {permissive:true}), true);  // false positive, permissive mode
  check('isVerse і҆и҃ли default = false',    isVerse('і҆и҃ли'), false);                   // nomina sacra (Israel)
  check('isVerse ст҃а́го default = false',   isVerse('ст҃а́го'), false);                  // nomina sacra (святаго)
  check('isVerse а default = true',        isVerse('а'), true);                         // canonical numeral
  check('isVerse а permissive = true',     isVerse('а', {permissive:true}), true);     // valid in both modes

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail > 0 ? 1 : 0);
}
