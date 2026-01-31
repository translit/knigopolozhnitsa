/**
 * Julian Calendar Date Display
 * Displays the current date according to the Julian calendar in Church Slavonic
 */

(function() {
  'use strict';

  /**
   * Calculate the offset between Gregorian and Julian calendars for a given date
   * The offset increases by 1 day every non-leap century (years divisible by 100 but not 400)
   */
  function calculateJulianOffset(year) {
    // Formula: offset = century - leap_centuries - 2
    // where century = floor(year/100) and leap_centuries = floor(year/400)
    const century = Math.floor(year / 100);
    const leapCenturies = Math.floor(year / 400);
    return century - leapCenturies - 2;
  }

  /**
   * Convert a Gregorian date to Julian date
   */
  function gregorianToJulian(date) {
    const offset = calculateJulianOffset(date.getFullYear());
    const julianDate = new Date(date);
    julianDate.setDate(julianDate.getDate() - offset);
    return julianDate;
  }

  /**
   * Convert a number (1-31) to Church Slavonic numeral with titlo
   */
  function toSlavonicNumeral(num) {
    // Church Slavonic numerals with combining titlo (U+0483)
    const units = ['', 'а҃', 'в҃', 'г҃', 'д҃', 'є҃', 'ѕ҃', 'з҃', 'и҃', 'ѳ҃'];
    const tens = ['', 'і҃', 'к҃', 'л҃', 'м҃', 'н҃', 'ѯ҃', 'ѻ҃', 'п҃', 'ч҃'];

    if (num < 1 || num > 31) return '';

    if (num < 10) {
      return units[num];
    } else if (num === 10) {
      return tens[1];
    } else if (num < 20) {
      // Teens: unit digit before і҃ (e.g., а҃і for 11)
      const unit = num - 10;
      return units[unit] + 'і';
    } else {
      // 20-31: tens + units (e.g., к҃а for 21)
      const tensDigit = Math.floor(num / 10);
      const unitsDigit = num % 10;
      // Remove titlo from tens, add unit with titlo over the whole number
      const tensLetter = tens[tensDigit].replace('҃', '');
      const unitsLetter = unitsDigit > 0 ? units[unitsDigit].replace('҃', '') : '';
      return tensLetter + unitsLetter + '҃';
    }
  }

  /**
   * Month names in Church Slavonic (genitive case for "Xth of Month")
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
   * Day names in Church Slavonic
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
   * Format the Julian date in Church Slavonic
   */
  function formatJulianDate(date) {
    const day = date.getDate();
    const month = date.getMonth();
    const dayOfWeek = date.getDay();

    const dayName = dayNames[dayOfWeek];
    const dayNumeral = toSlavonicNumeral(day);
    const monthName = monthNames[month];

    return `${dayName}, ${monthName} ${dayNumeral}.`;
  }

  /**
   * Calculate Pascha (Easter) date using the Julian calendar Computus
   * Anonymous algorithm from 7th century
   * Returns Julian date of Pascha for the given year in Julian representation
   * (Date object compatible with gregorianToJulian output for comparison)
   */
  function calculatePascha(year) {
    const a = year % 4;
    const b = year % 7;
    const c = year % 19;
    const d = (19 * c + 15) % 30;
    const e = (2 * a + 4 * b - d + 34) % 7;
    const month = Math.floor((d + e + 114) / 31); // March = 3, April = 4
    const day = ((d + e + 114) % 31) + 1;

    // month and day are Julian calendar values
    // Convert to Gregorian calendar by adding offset
    const offset = calculateJulianOffset(year);
    const gregorianDate = new Date(year, month - 1, day);
    gregorianDate.setDate(gregorianDate.getDate() + offset);

    // Convert to Julian representation (for comparison with other Julian dates)
    return gregorianToJulian(gregorianDate);
  }

  /**
   * Calculate the current Octoechos tone (1-8)
   * Returns null during Bright Week (Pascha to Thomas Sunday)
   */
  function calculateTone(date) {
    // Get Julian calendar date
    const julianDate = gregorianToJulian(date);
    const year = julianDate.getFullYear();

    // Calculate Pascha for this year
    let pascha = calculatePascha(year);

    // If we're before Pascha this year, check if we're after Pascha from last year
    if (julianDate < pascha) {
      pascha = calculatePascha(year - 1);
    }

    // Calculate Thomas Sunday (first Sunday after Pascha)
    const thomasSunday = new Date(pascha);
    thomasSunday.setDate(thomasSunday.getDate() + 7);

    // During Bright Week (Pascha to Thomas Sunday), return null
    if (julianDate >= pascha && julianDate < thomasSunday) {
      return null;
    }

    // Calculate weeks since Thomas Sunday
    const daysDiff = Math.floor((julianDate - thomasSunday) / (1000 * 60 * 60 * 24));
    const weeksSinceThomasSunday = Math.floor(daysDiff / 7) + 1;

    // Calculate tone (1-8 cycle)
    const tone = ((weeksSinceThomasSunday - 1) % 8) + 1;

    return tone;
  }

  /**
   * Convert tone number (1-8) to Church Slavonic numeral with "Гла́съ" prefix
   */
  function toneToSlavonic(tone) {
    const toneNumerals = ['а҃', 'в҃', 'г҃', 'д҃', 'є҃', 'ѕ҃', 'з҃', 'и҃'];
    if (tone < 1 || tone > 8) return '';
    return `Гла́съ\u00A0${toneNumerals[tone - 1]}`;
  }

  /**
   * Update the date display on the page
   */
  function updateDateDisplay() {
    const container = document.getElementById('julian-date');
    if (!container) return;

    const today = new Date();
    const julianDate = gregorianToJulian(today);

    // Use today's day of the week, but Julian calendar date
    const dayOfWeek = today.getDay();
    const dayName = dayNames[dayOfWeek];
    const dayNumeral = toSlavonicNumeral(julianDate.getDate());
    const monthName = monthNames[julianDate.getMonth()];

    const tone = calculateTone(today);
    let formattedDate = `${dayName}, ${monthName} ${dayNumeral}`;
    if (tone !== null) {
      formattedDate += `. ${toneToSlavonic(tone)}`;
    }

    container.textContent = formattedDate;
  }

  /**
   * Update the tone display on the page
   */
  function updateToneDisplay() {
    const container = document.getElementById('current-tone');
    if (!container) return;

    const today = new Date();
    const tone = calculateTone(today);

    // Hide during Bright Week
    if (tone === null) {
      container.style.display = 'none';
      return;
    }

    container.style.display = 'block';
    container.textContent = toneToSlavonic(tone);
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      updateDateDisplay();
      updateToneDisplay();
    });
  } else {
    updateDateDisplay();
    updateToneDisplay();
  }
})();
