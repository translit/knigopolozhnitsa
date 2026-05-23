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
    pentecost:        'Пѧтидесѧ́тница',
    afterPascha:      'по па́сцѣ',
    // Post-Pentecost
    allSaintsSuffix:  'всѣ́хъ ст҃ы́хъ',   // All Saints Sunday qualifier
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
   * Convert a number (1–40) to Church Slavonic numeral with titlo
   */
  function toSlavonicNumeral(num) {
    const units = ['', 'а҃', 'в҃', 'г҃', 'д҃', 'є҃', 'ѕ҃', 'з҃', 'и҃', 'ѳ҃'];
    const tens  = ['', 'і҃', 'к҃', 'л҃', 'м҃', 'н҃', 'ѯ҃', 'ѻ҃', 'п҃', 'ч҃'];

    if (num < 1 || num > 40) return '';

    if (num < 10) {
      return units[num];
    } else if (num === 10) {
      return tens[1];
    } else if (num < 20) {
      // Teens: unit digit before і (e.g. а҃і for 11)
      const unit = num - 10;
      return units[unit] + 'і';
    } else {
      // 20–40: tens + units, titlo at end
      const tensDigit  = Math.floor(num / 10);
      const unitsDigit = num % 10;
      const tensLetter  = tens[tensDigit].replace('҃', '');
      const unitsLetter = unitsDigit > 0 ? units[unitsDigit].replace('҃', '') : '';
      return tensLetter + unitsLetter + '҃';
    }
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
      const numeral = toSlavonicNumeral(num);
      const suffix = ' ' + LIT.afterPascha + (isSunday && PASCHAL_WEEKS[weekIdx] ? ', ' + PASCHAL_WEEKS[weekIdx] : '');
      const prefix = isSunday ? LIT.sunday : LIT.sedmitsa;
      return { prefix, numeral, suffix };
    }

    if (nday === 49 && isSunday) {
      return { fixed: LIT.pentecost };
    }

    if (nday >= 49 && nday < 56) {
      // Sedmitsa 1 after Pentecost (Mon–Sat)
      return { prefix: LIT.sedmitsa, numeral: 'а҃', suffix: ' ' + LIT.afterPentecost };
    }

    // ── Post-Pentecost (nday 56+) ────────────────────────────────────────────

    if (nday >= 56) {
      const week = Math.floor((nday - 56) / 7) + 1;

      if (isSunday) {
        const suffix = ' ' + LIT.afterPentecost + (week === 1 ? ', ' + LIT.allSaintsSuffix : '');
        return { prefix: LIT.sunday, numeral: toSlavonicNumeral(week), suffix };
      } else {
        return { prefix: LIT.sedmitsa, numeral: toSlavonicNumeral(week + 1), suffix: ' ' + LIT.afterPentecost };
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
    const dayNumeral = toSlavonicNumeral(julianDate.getDate());
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

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      updateDateDisplay();
      updateWeekDisplay();
      updateFeastDisplay();
    });
  } else {
    updateDateDisplay();
    updateWeekDisplay();
    updateFeastDisplay();
  }

})();
