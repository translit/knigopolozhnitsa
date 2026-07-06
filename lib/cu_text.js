'use strict';

// Proper typographic hyphen (U+2010). Use for prose hyphens in CU content —
// never U+002D HYPHEN-MINUS. CLAUDE.md §Hyphens.
const U2010 = '‐';

// Strip combining diacritical marks (titlo, accents, etc.) from a CU string.
// U+0482 (thousands marker ҂) is NOT stripped — it carries semantic value.
function stripCombining(str) {
  return str.replace(/[̀-ͯ҃-҉᷀-᷿⃐-⃿︠-︯]/g, '');
}

// Returns true if codepoint is a combining mark.
function isCombining(code) {
  return (code >= 0x0300 && code <= 0x036F) ||
         (code >= 0x0483 && code <= 0x0489) ||
         (code >= 0x1DC0 && code <= 0x1DFF) ||
         (code >= 0x20D0 && code <= 0x20FF) ||
         (code >= 0xFE20 && code <= 0xFE2F);
}

// NFC normalize — always apply before processing CU content.
function nfc(str) {
  return str.normalize('NFC');
}

// Latin homoglyphs that can corrupt CU text. Source: CLAUDE.md §Common homoglyphs.
const LATIN_HOMOGLYPHS = new Set(['a','b','e','o','r','c','t','x','A','B','E','O','C','T','X']);

function isCyrillicCodePoint(code) {
  return (code >= 0x0400 && code <= 0x04FF) || (code >= 0xA640 && code <= 0xA69F);
}

// Returns true if str contains a Latin homoglyph adjacent to Cyrillic (combining
// marks count as Cyrillic context). Heuristic; catches the pattern from the
// historical corruption incident (CLAUDE.md: commit 8b2dafb06, 'ѡ҆bratи').
function hasLatinInCyrillic(str) {
  const chars = [...str];
  for (let i = 0; i < chars.length; i++) {
    if (!LATIN_HOMOGLYPHS.has(chars[i])) continue;
    const prevCode = i > 0 ? chars[i - 1].codePointAt(0) : null;
    const nextCode = i < chars.length - 1 ? chars[i + 1].codePointAt(0) : null;
    if ((prevCode !== null && (isCyrillicCodePoint(prevCode) || isCombining(prevCode))) ||
        (nextCode !== null && (isCyrillicCodePoint(nextCode) || isCombining(nextCode)))) {
      return true;
    }
  }
  return false;
}

// Returns true if str contains U+002D HYPHEN-MINUS between two Cyrillic letters.
// CLAUDE.md requires U+2010 instead; a PostToolUse hook warns on this.
const CYR_RE = /[Ѐ-ӿꙀ-ꚟ]/;
function isHyphenMinusBetweenCyrillic(str) {
  for (let i = 1; i < str.length - 1; i++) {
    if (str[i] === '-' && CYR_RE.test(str[i - 1]) && CYR_RE.test(str[i + 1])) return true;
  }
  return false;
}

module.exports = { U2010, stripCombining, isCombining, nfc, hasLatinInCyrillic, isHyphenMinusBetweenCyrillic };

// Self-test: node lib/cu_text.js
if (require.main === module) {
  let pass = 0, fail = 0;
  function check(label, got, expected) {
    const ok = got === expected;
    console.log(`${ok ? 'OK  ' : 'FAIL'} ${label}: got ${String(got)}, expected ${String(expected)}`);
    ok ? pass++ : fail++;
  }

  check('stripCombining titlo',  stripCombining('а҃'), 'а');
  check('stripCombining accent', stripCombining('а́'), 'а');
  check('stripCombining multi',  stripCombining('гла́съ'), 'гласъ');
  check('stripCombining keep ҂', stripCombining('҂з'), '҂з');

  check('isCombining U+0300', isCombining(0x0300), true);
  check('isCombining U+0483', isCombining(0x0483), true);
  check('isCombining U+0486', isCombining(0x0486), true);
  check('isCombining Cyrillic а', isCombining(0x0430), false);
  check('isCombining ASCII a',    isCombining(0x0061), false);

  check('nfc idempotent', nfc('тропа́рь') === nfc(nfc('тропа́рь')), true);

  // hasLatinInCyrillic
  check('latin in CU: ѡ҆bratи', hasLatinInCyrillic('ѡ҆bratи'), true);
  check('latin in CU: тaк',     hasLatinInCyrillic('тaк'), true);      // a=Latin, т/к=Cyrillic
  check('pure Cyrillic',        hasLatinInCyrillic('тропа́рь'), false);
  check('pure Latin word',      hasLatinInCyrillic('hello'), false);    // e has no CU neighbor
  check('CU+hyphen+CU no Latin', hasLatinInCyrillic('г҃‐й'), false);

  // isHyphenMinusBetweenCyrillic
  check('U+002D between CU',       isHyphenMinusBetweenCyrillic('г-й'), true);
  check('U+2010 between CU',       isHyphenMinusBetweenCyrillic('г‐й'), false);
  check('U+002D between ASCII',    isHyphenMinusBetweenCyrillic('a-b'), false);
  check('U+002D at end',           isHyphenMinusBetweenCyrillic('г-'), false);

  check('U2010 constant', U2010, '‐');

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail > 0 ? 1 : 0);
}
