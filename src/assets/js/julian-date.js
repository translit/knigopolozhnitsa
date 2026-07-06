/**
 * Julian Calendar Date Display
 * Displays the current date and liturgical week in Church Slavonic
 */

(function() {
  'use strict';

  /*
   * ===== LITURGICAL DISPLAY CONFIGURATION =====
   * Edit names and format strings below.
   * Algorithm code follows after this section.
   */

  // Paschal weeks 2–7: named suffixes shown for Sunday and weekdays
  // Copied verbatim from gospel/25.md fold-rubric headers
  const PASCHAL_WEEKS = [
    'ѳѡмина̀',            // week 2 (Thomas)
    'мѷроно́сицъ',     // week 3 (Myrrh-bearers)
    'разсла́бленнагѡ',   // week 4 (Paralytic)
    'самарѧны́ни',       // week 5 (Samaritan)
    'ѡ҆ слѣпо́мъ',          // week 6 (Blind)
    'ст҃ы́хъ ѻ҆ц҃ъ',        // week 7 (Holy Fathers)
  ];

  // Lenten ordinals — feminine, for Недѣ́лѧ/Седми́ца
  // Copied verbatim from gospel/26.md section headers
  const LENTEN_ORDINALS = [
    'пе́рваѧ',    // 1st
    'втора́ѧ',    // 2nd
    'тре́тїѧ',    // 3rd
    'четве́ртаѧ', // 4th
    'пѧ́таѧ',     // 5th
    'шеста́ѧ',    // 6th
  ];

  // Named liturgical periods and display labels
  const LIT = {
    // Paschal period
    pascha:           'Па́сха',
    brightWeek:       'Свѣ́тлаѧ седми́ца',
    pentecost:        'Пѧтдесѧ́тница',
    afterPascha:      'по па́сцѣ',
    // Post-Pentecost
    holySpiritDay:    'Ст҃а́гѡ дх҃а',
    pentecostWeek:    'Седми́ца ст҃ы́ѧ пентїко́стїи',
    allSaintsDay:     'Всѣ́хъ ст҃ы́хъ',
    afterPentecost:   'по пѧтдесѧ́тницѣ', // post-Pentecost weeks
    // Pre-Lenten named weeks (from gospel/25.md)
    publicanPharisee: 'ѡ҆ мытарѝ и҆ фарїсе́и',
    prodigalSon:      'ѡ҆ блꙋ́днѣмъ сы́нѣ',
    meatfare:         'мѧсопꙋ́стнаѧ',
    cheesefare:       'сыропꙋ́стнаѧ',
    // Lenten
    lentenSuffix:     'поста̀',
    palmSunday:       'Недѣ́лѧ цвѣтоно́снаѧ',
    sedmitsaVaiy:     'Седми́ца ва́їй',
    holyWeek:         'Страстна́ѧ седми́ца',
    // Labels
    sunday:           'Недѣ́лѧ',
    sedmitsa:         'Седми́ца',
    glas:             'Гла́съ',
  };

  // Movable great feasts keyed by days-since-Pascha (nday)
  // Pascha (0), Palm Sunday (-7), Pentecost (49) omitted — already on line 2
  const GREAT_FEASTS_MOVABLE = {
    39: 'Вознесе́нїе гдⷭ҇а бг҃а и҆ сп҃са на́шегѡ і҆и҃са хрⷭ҇та̀',
  };

  // Fixed great feasts keyed by Julian 'MM-DD'
  const GREAT_FEASTS_FIXED = {
    '01-01': 'Є҆́же по пло́ти ѡ҆брѣ́занїе гдⷭ҇а на́шегѡ і҆и҃са хрⷭ҇та̀',
    '01-06': 'Бг҃оѧвле́нїе гдⷭ҇а бг҃а и҆ сп҃са на́шегѡ і҆и҃са хрⷭ҇та̀',
    '02-02': 'Срѣ́тенїе гдⷭ҇а бг҃а и҆ сп҃са на́шегѡ і҆и҃са хрⷭ҇та̀',
    '03-25': 'Бл҃говѣ́щенїе прест҃ы́ѧ влⷣчцы на́шеѧ бцⷣы, и҆ приснодв҃ы мр҃і́и',
    '06-24': 'Ржⷭ҇тво̀ чтⷭ҇на́гѡ сла́внагѡ прⷪ҇ро́ка, прⷣте́чи и҆ крⷭ҇ти́телѧ і҆ѡа́нна',
    '06-29': 'Ст҃ы́хъ сла́вныхъ и҆ всехва́льныхъ и҆ первоверхо́вныхъ а҆пⷭ҇лъ, петра̀ и҆ па́ѵла',
    '08-06': 'Преѡбраже́нїе гдⷭ҇а бг҃а и҆ сп҃са на́шегѡ і҆и҃са хрⷭ҇та̀',
    '08-15': 'Ѹ҆спе́нїе прест҃ы́ѧ влⷣчцы на́шеѧ бцⷣы, и҆ приснодв҃ы мр҃і́и',
    '08-29': 'Ѹ҆сѣкнове́нїе чтⷭ҇ны́ѧ главы̀ чтⷭ҇на́гѡ сла́внагѡ прⷪ҇ро́ка предте́чи и҆ крⷭ҇ти́телѧ і҆ѡа́нна',
    '09-08': 'Ржⷭ҇тво̀ прест҃ы́ѧ влⷣчцы на́шеѧ бцⷣы, и҆ приснодв҃ы мр҃і́и',
    '09-14': 'Воздви́женїе чⷭ҇тна́гѡ и҆ животворѧ́щагѡ крⷭ҇та̀',
    '10-01': 'Покро́въ прест҃ы́ѧ влⷣчцы на́шеѧ бцⷣы и҆ приснодв҃ы мр҃і́и',
    '11-21': 'Вхо́дъ во хра́мъ прест҃ы́ѧ влⷣчцы на́шеѧ бцⷣы, и҆ приснодв҃ы мр҃і́и',
    '12-25': 'Ржⷭ҇тво̀ гдⷭ҇а бг҃а и҆ сп҃са на́шегѡ і҆и҃са хрⷭ҇та̀',
  };

  // TEMP: set to true to restore "по пѧтдесѧ́тницѣ" suffix on post-Pentecost weeks.
  const SHOW_AFTER_PENTECOST_SUFFIX = false;

  /*
   * ===== END OF CONFIGURATION =====
   */

  /**
   * Calculate the offset between Gregorian and Julian calendars for a given year
   */
  function calculateJulianOffset(year) {
    const century = Math.floor(year / 100);
    const leapCenturies = Math.floor(year / 400);
    return century - leapCenturies - 2;
  }

  /**
   * Convert a Gregorian date to Julian calendar representation
   */
  function gregorianToJulian(date) {
    const offset = calculateJulianOffset(date.getFullYear());
    const julianDate = new Date(date);
    julianDate.setDate(julianDate.getDate() - offset);
    return julianDate;
  }

  /**
   * Convert an Arabic integer (1–999) to Church Slavonic numeral with titlo.
   * Titlo (U+0483) falls on the penultimate base letter:
   *   1-letter: "р҃"; 2-letter: "р҃і"; 3-letter: "рк҃а"
   * Teens (11–19) are written unit+і: "а҃і", "ра҃і".
   * Hundreds use project-specific variants: ѡ=800, ѻ=70.
   */
  function arabicToCU(n) {
    if (n < 1 || n > 999) return String(n);
    const U = ['', 'а', 'в', 'г', 'д', 'є', 'ѕ', 'з', 'и', 'ѳ'];
    const T = ['', 'і', 'к', 'л', 'м', 'н', 'ѯ', 'ѻ', 'п', 'ч'];
    const H = ['', 'р', 'с', 'т', 'у', 'ф', 'х', 'ѱ', 'ѡ', 'ц'];
    const h = Math.floor(n / 100);
    const rem = n % 100;
    let s = H[h] || '';
    if (rem >= 11 && rem <= 19) {
      s += U[rem - 10] + T[1]; // unit letter + і
    } else {
      s += (T[Math.floor(rem / 10)] || '') + (U[rem % 10] || '');
    }
    const len = s.length;
    if (len === 0) return String(n);
    if (len === 1) return s + '҃';
    return s.slice(0, len - 1) + '҃' + s[len - 1];
  }

  /**
   * Month names in Church Slavonic (genitive case)
   */
  const monthNames = [
    'і҆аннꙋа́рїа',
    'феврꙋа́рїа',
    'ма́рта',
    'а҆прі́ллїа',
    'ма́їа',
    'і҆ꙋ́нїа',
    'і҆ꙋ́лїа',
    'а҆́ѵгꙋста',
    'септе́мврїа',
    'ѻ҆ктѡ́врїа',
    'ное́мврїа',
    'деке́мврїа'
  ];

  /**
   * Day names in Church Slavonic (nominative)
   */
  const dayNames = [
    'Недѣ́лѧ',        // Sunday
    'Понедѣ́льникъ',  // Monday
    'Вто́рникъ',      // Tuesday
    'Среда̀',          // Wednesday
    'Четверто́къ',    // Thursday
    'Пѧто́къ',        // Friday
    'Сꙋббѡ́та'        // Saturday
  ];

  /**
   * Calculate Pascha (Easter) for a given Julian year
   * Returns a Date in "Julian representation" (same coordinate system as gregorianToJulian output)
   */
  // NOTE: same Meeus algorithm duplicated in liturgical-period.js (pascha). Keep in sync.
  function calculatePascha(year) {
    const a = year % 4;
    const b = year % 7;
    const c = year % 19;
    const d = (19 * c + 15) % 30;
    const e = (2 * a + 4 * b - d + 34) % 7;
    const month = Math.floor((d + e + 114) / 31); // 3 = March, 4 = April
    const day   = ((d + e + 114) % 31) + 1;

    const offset = calculateJulianOffset(year);
    const gregorianDate = new Date(year, month - 1, day);
    gregorianDate.setDate(gregorianDate.getDate() + offset);
    return gregorianToJulian(gregorianDate);
  }

  /**
   * Normalize a date to noon UTC to avoid DST boundary issues
   */
  function toNoonUTC(d) {
    return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 12);
  }

  /**
   * Compute signed day difference: days from d2 to d1 (positive = d1 after d2)
   */
  function dayDiff(d1, d2) {
    return Math.round((toNoonUTC(d1) - toNoonUTC(d2)) / 86400000);
  }

  /**
   * Calculate the current Octoechos tone (1–8), or null when no tone applies
   * (Bright Week and Pentecost Week have no Octoechos tone)
   */
  function calculateTone(date) {
    const julianDate = gregorianToJulian(date);
    const year = julianDate.getFullYear();

    let pascha = calculatePascha(year);
    if (julianDate < pascha) {
      pascha = calculatePascha(year - 1);
    }

    const nday = dayDiff(julianDate, pascha);

    // Bright Week (days 0–6): no tone
    if (nday >= 0 && nday < 7) return null;

    // Pentecost Week (days 49–55): no tone
    if (nday >= 49 && nday < 56) return null;

    // Count weeks since Thomas Sunday (Pascha + 7)
    const thomasSunday = new Date(pascha);
    thomasSunday.setDate(thomasSunday.getDate() + 7);
    const daysSince = dayDiff(julianDate, thomasSunday);
    const weeksSince = Math.floor(daysSince / 7) + 1;

    return ((weeksSince - 1) % 8) + 1;
  }

  /**
   * Determine the liturgical week/period for a given date.
   * Returns an object: { prefix: 'Недѣ́лѧ'|'Седми́ца'|'', name: string, hasTone: boolean }
   * where the display string is: prefix + numeral + name  (or just name for fixed-name periods)
   */
  function calculateLiturgicalWeek(date) {
    const julianDate = gregorianToJulian(date);
    const year = julianDate.getFullYear();
    const isSunday = date.getDay() === 0;

    const prevPascha = calculatePascha(year - 1);
    const thisPascha = calculatePascha(year);
    const nextPascha = calculatePascha(year + 1);

    const ndayThis = dayDiff(julianDate, thisPascha);  // negative before Pascha
    const ndayNext = dayDiff(julianDate, nextPascha);  // always negative (we're before next)

    let nday;
    if (ndayThis >= 0) {
      // After this year's Pascha
      if (ndayNext >= -70) {
        // Close enough to next Pascha: in the Triodion
        nday = ndayNext;
      } else {
        nday = ndayThis;
      }
    } else if (ndayThis >= -70) {
      // Before this year's Pascha but within Triodion window
      nday = ndayThis;
    } else {
      // Before Triodion: post-Pentecost from previous year's Pascha
      nday = dayDiff(julianDate, prevPascha);
    }

    return getWeekInfo(nday, isSunday);
  }

  /**
   * Map nday (days since Pascha, negative = before) and isSunday to a display descriptor.
   */
  function getWeekInfo(nday, isSunday) {
    // ── Paschal / Pentecostarion (nday 0 to 55) ─────────────────────────────

    if (nday === 0 && isSunday) {
      return { fixed: LIT.pascha };
    }

    if (nday >= 0 && nday < 7) {
      // Bright Week
      return { fixed: LIT.brightWeek };
    }

    if (nday >= 7 && nday < 49) {
      // Paschal weeks 2–7: same numeral for Sunday and weekdays
      const weekIdx = Math.floor(nday / 7) - 1; // 0 = Thomas (week 2), …, 5 = Holy Fathers (week 7)
      const num = weekIdx + 2; // 2–7
      const numeral = arabicToCU(num);
      const suffix = ' ' + LIT.afterPascha + (isSunday && PASCHAL_WEEKS[weekIdx] ? ', ' + PASCHAL_WEEKS[weekIdx] : '');
      const prefix = isSunday ? LIT.sunday : LIT.sedmitsa;
      return { prefix, numeral, suffix };
    }

    if (nday === 49 && isSunday) {
      return { fixed: LIT.pentecost };
    }

    if (nday === 50) {
      return { fixed: LIT.holySpiritDay };
    }

    if (nday >= 49 && nday < 56) {
      // Tue–Sat after Pentecost
      return { fixed: LIT.pentecostWeek };
    }

    // ── Post-Pentecost (nday 56+) ────────────────────────────────────────────

    if (nday === 56 && isSunday) {
      return { fixed: LIT.allSaintsDay };
    }

    if (nday >= 56) {
      const week = Math.floor((nday - 56) / 7) + 1;

      if (isSunday) {
        return { prefix: LIT.sunday, numeral: arabicToCU(week), suffix: SHOW_AFTER_PENTECOST_SUFFIX ? ' ' + LIT.afterPentecost : '' };
      } else {
        return { prefix: LIT.sedmitsa, numeral: arabicToCU(week + 1), suffix: SHOW_AFTER_PENTECOST_SUFFIX ? ' ' + LIT.afterPentecost : '' };
      }
    }

    // ── Pre-Lenten named weeks (nday -70 to -43) ─────────────────────────────

    if (nday >= -70 && nday < -63) {
      const label = isSunday ? LIT.sunday : LIT.sedmitsa;
      return { prefix: label, numeral: '', suffix: ' ' + LIT.publicanPharisee };
    }

    if (nday >= -63 && nday < -56) {
      const label = isSunday ? LIT.sunday : LIT.sedmitsa;
      return { prefix: label, numeral: '', suffix: ' ' + LIT.prodigalSon };
    }

    if (nday === -56) {
      // Meatfare Sunday
      return { prefix: LIT.sunday, numeral: '', suffix: ' ' + LIT.meatfare };
    }

    if (nday >= -55 && nday < -49) {
      // Cheesefare weekdays (Mon–Sat after Meatfare Sunday)
      return { prefix: LIT.sedmitsa, numeral: '', suffix: ' ' + LIT.cheesefare };
    }

    if (nday === -49) {
      // Cheesefare Sunday (Forgiveness Sunday)
      return { prefix: LIT.sunday, numeral: '', suffix: ' ' + LIT.cheesefare };
    }

    // ── Lenten period (nday -48 to -1) ───────────────────────────────────────

    if (nday >= -48 && nday < -7) {
      // Lenten sedmitsas 1–6 and Sundays 1–5
      // Sundays at nday: -42, -35, -28, -21, -14
      // Sedmitsas: 1→-48..-43, 2→-41..-36, 3→-34..-29, 4→-27..-22, 5→-20..-15, 6→-13..-8

      let ordinalIdx;
      let useSunday;

      if      (nday === -42)              { ordinalIdx = 0; useSunday = true;  }
      else if (nday === -35)              { ordinalIdx = 1; useSunday = true;  }
      else if (nday === -28)              { ordinalIdx = 2; useSunday = true;  }
      else if (nday === -21)              { ordinalIdx = 3; useSunday = true;  }
      else if (nday === -14)              { ordinalIdx = 4; useSunday = true;  }
      else if (nday >= -48 && nday < -42) { ordinalIdx = 0; useSunday = false; }
      else if (nday >= -41 && nday < -35) { ordinalIdx = 1; useSunday = false; }
      else if (nday >= -34 && nday < -28) { ordinalIdx = 2; useSunday = false; }
      else if (nday >= -27 && nday < -21) { ordinalIdx = 3; useSunday = false; }
      else if (nday >= -20 && nday < -14) { ordinalIdx = 4; useSunday = false; }
      else if (nday >= -13 && nday < -7)  { return { fixed: LIT.sedmitsaVaiy }; } // -13..-8
      else                                { ordinalIdx = 5; useSunday = false; } // unreachable

      const prefix = useSunday ? LIT.sunday : LIT.sedmitsa;
      return { prefix, numeral: '', suffix: ' ' + LENTEN_ORDINALS[ordinalIdx] + ' ' + LIT.lentenSuffix };
    }

    if (nday === -7) {
      return { fixed: LIT.palmSunday };
    }

    if (nday >= -6 && nday <= -1) {
      return { fixed: LIT.holyWeek };
    }

    // Fallback (should not happen)
    return { fixed: '' };
  }

  /**
   * Return the great-feast display string for the given date, or '' if none.
   */
  function calculateGreatFeast(date) {
    const julianDate = gregorianToJulian(date);
    const year = julianDate.getFullYear();

    let pascha = calculatePascha(year);
    if (julianDate < pascha) pascha = calculatePascha(year - 1);
    const nday = dayDiff(julianDate, pascha);

    if (GREAT_FEASTS_MOVABLE[nday] !== undefined) return GREAT_FEASTS_MOVABLE[nday];

    const mm = String(julianDate.getMonth() + 1).padStart(2, '0');
    const dd = String(julianDate.getDate()).padStart(2, '0');
    return GREAT_FEASTS_FIXED[mm + '-' + dd] || '';
  }

  /**
   * Render a week info descriptor to a display string
   */
  function renderWeekInfo(info) {
    if (info.fixed !== undefined) return info.fixed;
    return (info.prefix || '') + (info.numeral ? '\u00A0' + info.numeral : '') + (info.suffix || '');
  }

  /**
   * Convert tone number (1–8) to Church Slavonic "Гла́съ N" string
   */
  function toneToSlavonic(tone) {
    const toneNumerals = ['а҃', 'в҃', 'г҃', 'д҃', 'є҃', 'ѕ҃', 'з҃', 'и҃'];
    if (tone < 1 || tone > 8) return '';
    return LIT.glas + '\u00A0' + toneNumerals[tone - 1];
  }

  /**
   * Update line 1: Julian date (day name, month name, day numeral)
   */
  function updateDateDisplay() {
    const container = document.getElementById('julian-date');
    if (!container) return;

    const today = new Date();
    const julianDate = gregorianToJulian(today);

    const dayOfWeek = today.getDay();
    const dayName   = dayNames[dayOfWeek];
    const dayNumeral = arabicToCU(julianDate.getDate());
    const monthName  = monthNames[julianDate.getMonth()];

    container.textContent = dayName + ', ' + monthName + '\u00A0' + dayNumeral + '.';
  }

  /**
   * Update line 2: liturgical week/period + glas
   */
  function updateWeekDisplay() {
    const container = document.getElementById('liturgical-week');
    if (!container) return;

    const today = new Date();
    const weekInfo = calculateLiturgicalWeek(today);
    const weekStr  = renderWeekInfo(weekInfo);
    const tone     = calculateTone(today);
    const glasStr  = tone !== null ? toneToSlavonic(tone) : '';

    let text = weekStr;
    if (glasStr) text += '. ' + glasStr;
    if (text) text += '.';

    container.textContent = text;
  }

  /**
   * Update line 3: great feast name, if today is a great feast
   */
  function updateFeastDisplay() {
    const container = document.getElementById('great-feast');
    if (!container) return;
    const feast = calculateGreatFeast(new Date());
    container.textContent = feast ? feast + '.' : '';
  }

  /*
   * ===== DAILY READINGS (LECTIONARY) =====
   */

  // Short Slavonic abbreviations for Ponomar book keys
  const BOOK_ABBR = {
    'Mt': 'Матѳ.',   'Mk': 'Мар.',     'Lk': 'Лꙋк.',    'Jn': 'І҆ѡан.',
    'Acts':     'Дѣѧ́н.',  'Rom':      'Рим.',
    'I Cor':    'а҃ Кор.',  'II Cor':   'в҃ Кор.',
    'Gal':      'Гал.',    'Eph':      'Є҆фес.',
    'Phil':     'Фїлїп.',  'Philip':   'Фїлїп.',
    'Col':      'Кол.',
    'I Thess':  'а҃ Сол.',  'II Thess': 'в҃ Сол.',
    'I Tim':    'а҃ Тїм.',  'II Tim':   'в҃ Тїм.',
    'Tit':      'Тїт.',    'Heb':      'Є҆вр.',
    'James':    'І҆а́к.',  'Jas':      'І҆а́к.',
    'I Pet':    'а҃ Петр.', 'II Pet':   'в҃ Петр.',
    'I Jn':     'а҃ І҆ѡа́н.', 'II Jn': 'в҃ І҆ѡа́н.', 'III Jn': 'г҃ І҆ѡа́н.',
    'Jude':     'І҆ꙋ́д.',
  };

  // Gospel book key → zachalo anchor prefix
  const GOSPEL_PFX = { Mt: 'mtz', Mk: 'mkz', Lk: 'lkz', Jn: 'jnz' };

  // Resolve the movable-cycle lectionary entry for a given date.
  // Returns {a: {r, p}, g: {r, p}} or null when no TSV row covers this day.
  function resolveMovableReadings(date, lectData) {
    const julianDate = gregorianToJulian(date);
    const year = julianDate.getFullYear();
    const prevPascha = calculatePascha(year - 1);
    const thisPascha = calculatePascha(year);
    const nextPascha = calculatePascha(year + 1);
    const ndayThis = dayDiff(julianDate, thisPascha);
    const ndayNext = dayDiff(julianDate, nextPascha);
    let nday;
    if (ndayThis >= 0) {
      nday = ndayNext >= -70 ? ndayNext : ndayThis;
    } else if (ndayThis >= -70) {
      nday = ndayThis;
    } else {
      nday = dayDiff(julianDate, prevPascha);
    }
    // Post-Pentecost sedmitsas run Mon–Sun starting from Spirit Monday (nday=50).
    // floor(nday/7)-7 gives effweek=0 for both Pentecost Sunday (nday=49) AND
    // Spirit Monday (nday=50), so use a split formula:
    const effweek = nday >= 50
      ? Math.floor((nday - 50) / 7) + 1
      : Math.floor(nday / 7) - 7;
    const dow = date.getDay(); // 0 = Sunday (Ponomar convention)
    return lectData.movable[effweek + ':' + dow] || null;
  }

  // Returns the URL for a reading object {r, p}, or null if zachalo not found locally.
  function buildReadingUrl(rObj, zachData) {
    const under = rObj.r.indexOf('_');
    const book = under >= 0 ? rObj.r.slice(0, under).trim() : rObj.r;
    const p = rObj.p;
    const pfx = GOSPEL_PFX[book];
    const half = rObj.h === true;
    if (pfx) {
      const gmap = zachData.g[pfx];
      const file = gmap && gmap[p];
      if (!file) return null;
      let anchor = pfx + p;
      if (half && zachData.gh && zachData.gh[pfx] && zachData.gh[pfx].indexOf(p) !== -1) anchor += 'h';
      return '/service/gospel/' + file + '/#' + anchor;
    } else {
      const file = zachData.a[p];
      if (!file) return null;
      let anchor = 'z' + p;
      if (half && zachData.ah && zachData.ah.indexOf(p) !== -1) anchor += 'h';
      return '/service/apostle/' + file + '/#' + anchor;
    }
  }

  // Build HTML for one reading object {r: "Eph_5:8b-19", p: 229}.
  // Returns an <a> link when the zachalo exists locally, plain text otherwise.
  function buildReadingHtml(rObj, zachData) {
    const under = rObj.r.indexOf('_');
    const book = under >= 0 ? rObj.r.slice(0, under).trim() : rObj.r;
    const p = rObj.p;
    const sn = BOOK_ABBR[book] || book;
    const half = rObj.h === true;
    const label = sn + ' заⷱ҇ ' + arabicToCU(p) + (half ? ' ѿ полꙋ̀' : '');
    const url = buildReadingUrl(rObj, zachData);
    if (url) return '<a href="' + url + '">' + label + '</a>';
    return label;
  }


  // Populate #daily-readings with today's movable-cycle readings.
  function updateReadingsDisplay(lectData, zachData) {
    const container = document.getElementById('daily-readings');
    if (!container) return;
    const entry = resolveMovableReadings(new Date(), lectData);
    if (!entry) { container.textContent = ''; return; }
    const parts = [];
    if (entry.a && entry.a.p) parts.push(buildReadingHtml(entry.a, zachData));
    if (entry.g && entry.g.p) parts.push(buildReadingHtml(entry.g, zachData));
    container.innerHTML = parts.length ? parts.join('. ') + '.' : '';
  }

  // Run when DOM is ready
  function runDisplayUpdates() {
    updateDateDisplay();
    updateWeekDisplay();
    updateFeastDisplay();
    // Fetch lectionary JSON (non-blocking); silently skip if unavailable
    if (document.getElementById('daily-readings')) {
      Promise.all([
        fetch('/assets/data/lectionary.json').then(function(r) { return r.json(); }),
        fetch('/assets/data/zachala.json').then(function(r) { return r.json(); }),
      ]).then(function(d) { updateReadingsDisplay(d[0], d[1]); })
        .catch(function() {});
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runDisplayUpdates);
  } else {
    runDisplayUpdates();
  }

  // Resolve today's reading URLs without DOM side effects.
  // Returns Promise<{apostle: url|null, gospel: url|null}>. Exposed for redirector pages.
  async function getTodayReadingUrls(today) {
    today = today || new Date();
    const d = await Promise.all([
      fetch('/assets/data/lectionary.json').then(function(r) { return r.json(); }),
      fetch('/assets/data/zachala.json').then(function(r) { return r.json(); }),
    ]);
    const entry = resolveMovableReadings(today, d[0]);
    if (!entry) return { apostle: null, gospel: null };
    return {
      apostle: entry.a && entry.a.p ? buildReadingUrl(entry.a, d[1]) : null,
      gospel:  entry.g && entry.g.p ? buildReadingUrl(entry.g, d[1]) : null,
    };
  }
  window.kpToday = { getTodayReadingUrls: getTodayReadingUrls };

})();
