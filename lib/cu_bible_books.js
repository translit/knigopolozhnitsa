'use strict';

// Church Slavonic biblical book abbreviations → /bible/<slug> URL slugs.
// Codepoints verified against actual file content.
// Listed longest-first within each book group so longer variants match first.
// NFC-normalized at module load.
//
// Covers all books in src/content/bible/ with abbreviation variants found in
// src/content/various/ and src/content/service/.
const BOOK_ENTRIES_RAW = [

  // ── Old Testament: Pentateuch ─────────────────────────────────────────────

  // Genesis — Быт. / Бытїѧ̀
  ['Бытїѧ̀', 'Gen'],   // Бытїѧ̀ (genitive, no period)
  ['Быт.',                         'Gen'],   // Быт.
  // Also: а҃ Мѡѷс. (1st book of Moses)
  ['а҃ Мѡѷс.',      'Gen'],   // а҃ Мѡѷс.

  // Exodus — И҆схо́д. / И҆сх. / И҆схоⷣ (titlo form)
  ['И҆схо́да',  'Exod'],  // И҆схо́да (genitive)
  ['И҆схо́д.', 'Exod'],  // И҆схо́д.
  ['И҆схоⷣ',   'Exod'],  // И҆схоⷣ (superscript д abbrev, no period)
  ['И҆сх.',                   'Exod'],  // И҆сх.
  ['в҃ Мѡѷс.',      'Exod'],  // в҃ Мѡѷс.

  // Leviticus — Леѵі́т. / Леѵ. / Лев.
  ['Леѵі́тскихъ кни́гъ', 'Lev'],  // Леѵі́тскихъ кни́гъ (genitive)
  ['Леѵі́т.',        'Lev'],  // Леѵі́т.
  ['Леѵ.',                          'Lev'],  // Леѵ.
  ['Лев.',                          'Lev'],  // Лев. (without izhitsa)
  ['г҃ Мѡѷс.',       'Lev'],  // г҃ Мѡѷс.

  // Numbers — Числ. / Чис. / Чи́сл.
  ['Чи́слъ',                   'Num'],  // Чи́слъ (genitive)
  ['Числ.',                    'Num'],  // Числ.
  ['Чи́сл.',                   'Num'],  // Чи́сл. (accented)
  ['чи́сл.',                   'Num'],  // чи́сл. (lowercase)
  ['Чис.',                          'Num'],  // Чис.
  ['д҃ Мѡѷс.',       'Num'],  // д҃ Мѡѷс.

  // Deuteronomy — Второзак. / Второз. / Втор. / второз. / є҃ Мѡѷс.
  ['Втора́гѡ зако́на', 'Deut'],  // Втора́гѡ зако́на (genitive)
  ['Второзак.', 'Deut'],  // Второзак.
  ['Второз.',               'Deut'],  // Второз.
  ['второз.',               'Deut'],  // второз. (lowercase)
  ['Втор.',                           'Deut'],  // Втор.
  ['є҃ Мѡѷс.',              'Deut'],  // є҃ Мѡѷс.

  // ── Old Testament: Historical ─────────────────────────────────────────────

  // Joshua — І҆исꙋ́с. Наѵ. / І҆ис. Наѵ. (always two-word in CS)
  // Titlo forms first (longest), then regular accented, then unaccented
  ['І҆исꙋ́са наѵи́на', 'Josh'],  // І҆исꙋ́са наѵи́на (genitive)
  ['І҆исꙋⷭ҇ Наѵⷩ҇.', 'Josh'],  // І҆исꙋⷭ҇ Наѵⷩ҇. (superscript titlo form)
  ['І҆исꙋ́с. Наѵ.', 'Josh'],   // І҆исꙋ́с. Наѵ.
  ['І҆исꙋ́с. наѵ.', 'Josh'],   // І҆исꙋ́с. наѵ. (izhitsa)
  ['І҆исꙋ́с. нав.', 'Josh'],   // І҆исꙋ́с. нав. (no izhitsa)
  ['І҆ис. Наѵ.',                    'Josh'],   // І҆ис. Наѵ.
  ['І҆ис. нав.',                    'Josh'],   // І҆ис. нав.

  // Judges — Сꙋд. / Сꙋ́дей / Сꙋде́й / Сꙋⷣ
  ['Сꙋ́дей',                  'Judg'],  // Сꙋ́дей (genitive, accented у)
  ['Сꙋде́й',                  'Judg'],  // Сꙋде́й (genitive, accented е)
  ['Сꙋⷣ',                     'Judg'],  // Сꙋⷣ (superscript д abbrev)
  ['Сꙋд.',                         'Judg'],  // Сꙋд.

  // Ruth — Рꙋ́ѳ. / Рꙋѳ.
  ['Рꙋ́ѳ.',                   'Ruth'],  // Рꙋ́ѳ.
  ['Рꙋѳ.',                         'Ruth'],  // Рꙋѳ.

  // 1 Samuel — а҃ Цар. / а҃ Царⷭ҇. / а҃ Ца́р. / а҃ цар. / а҃ цр҃тв.
  ['Ца́рствъ пе́рвыхъ',   '1Sam'],  // Ца́рствъ пе́рвыхъ (1st Kings/Samuel, genitive)
  ['а҃ Царⷭ҇.', '1Sam'],  // а҃ Царⷭ҇. (with period)
  ['а҃ Царⷭ҇',  '1Sam'],  // а҃ Царⷭ҇ (no period)
  ['а҃ цр҃тв.', '1Sam'],  // а҃ цр҃тв. (alternate Царство abbrev)
  ['а҃ Ца́р.',   '1Sam'],  // а҃ Ца́р. (accented)
  ['а҃ Цар.',              '1Sam'],  // а҃ Цар.
  ['а҃ цар.',              '1Sam'],  // а҃ цар. (lowercase)

  // 2 Samuel — в҃ Цар.
  ['в҃ Цар.',            '2Sam'],  // в҃ Цар.

  // 1 Kings — г҃ Цар. / г҃ Царⷭ҇ / г҃ Ца́р. / г҃ ца́р.
  ['Ца́рствъ тре́тїихъ', '1Kgs'],  // Ца́рствъ тре́тїихъ (3rd Kings, genitive)
  ['Црⷭ҇твъ тре́тїихъ',  '1Kgs'],  // Црⷭ҇твъ тре́тїихъ (abbreviated form)
  ['г҃ Царⷭ҇', '1Kgs'],  // г҃ Царⷭ҇ (no period)
  ['г҃ Ца́р.',   '1Kgs'],  // г҃ Ца́р. (accented)
  ['г҃ Цар.',             '1Kgs'],  // г҃ Цар.
  ['г҃ ца́р.',   '1Kgs'],  // г҃ ца́р. (lowercase, accented)

  // 2 Kings — д҃ Цар. / д҃ Ца́р. / д҃ ца́р.
  ['Ца́рствъ четве́ртыхъ', '2Kgs'],  // Ца́рствъ четве́ртыхъ (4th Kings, genitive)
  ['д҃ Ца́р.',   '2Kgs'],  // д҃ Ца́р. (accented)
  ['д҃ Цар.',            '2Kgs'],  // д҃ Цар.
  ['д҃ ца́р.',   '2Kgs'],  // д҃ ца́р. (lowercase, accented)

  // 1 Chronicles — а҃ Парал.
  ['а҃ Парал.', '1Chr'],  // а҃ Парал.

  // 2 Chronicles — в҃ Парал.
  ['в҃ Парал.', '2Chr'],  // в҃ Парал.

  // 1 Esdras — а҃ Є҆здр.
  ['а҃ Є҆здр.', '1Esd'],  // а҃ Є҆здр.

  // Ezra (= 2nd Esdras) — в҃ Є҆здр.
  ['в҃ Є҆здр.', 'Ezra'],  // в҃ Є҆здр.

  // 2 Esdras (= 3rd Esdras) — г҃ Є҆здр.
  ['г҃ Є҆здр.', '2Esd'],  // г҃ Є҆здр.

  // Nehemiah — Неем.
  ['Неем.',                   'Neh'],   // Неем.

  // Tobit — Тов. / Тѡві҃
  ['Тѡві҃',                   'Tob'],   // Тѡві҃ (alternate abbreviation)
  ['Тов.',                         'Tob'],   // Тов.

  // Judith — І҆ꙋді́ѳ.
  ['І҆ꙋді́ѳ.', 'Jdt'],   // І҆ꙋді́ѳ.

  // Esther — Є҆сѳ. / Є҆сѳіⷬ҇
  ['Є҆сѳіⷬ҇',               'Esth'],  // Є҆сѳіⷬ҇ (superscript л titlo form)
  ['Є҆сѳ.',                   'Esth'],  // Є҆сѳ.

  // 1 Maccabees — а҃ Мак.
  ['а҃ Мак.',            '1Macc'], // а҃ Мак.

  // 2 Maccabees — в҃ Мак.
  ['в҃ Мак.',            '2Macc'], // в҃ Мак.

  // 3 Maccabees — г҃ Мак.
  ['г҃ Мак.',            '3Macc'], // г҃ Мак.

  // ── Old Testament: Wisdom ─────────────────────────────────────────────────

  // Job — І҆́ѡва (genitive, no period) / І҆́ѡв.
  ['І҆́ѡва',        'Job'],   // І҆́ѡва
  ['І҆́ѡв.',             'Job'],   // І҆́ѡв.

  // Psalms — Ѱал. / ѱал.
  ['Ѱал.',                         'Ps'],    // Ѱал.
  ['ѱал.',                         'Ps'],    // ѱал. (lowercase)

  // Proverbs — При́тчей / При́тч. / Притч. / При́т. / Прит. / приⷮ. / прит.
  ['При́тчей', 'Prov'],  // При́тчей (genitive, no period)
  ['При́тч.',        'Prov'],  // При́тч.
  ['Притч.',              'Prov'],  // Притч.
  ['При́т.',              'Prov'],  // При́т.
  ['Прит.',                    'Prov'],  // Прит.
  ['приⷮ.',                    'Prov'],  // приⷮ. (superscript т titlo)
  ['прит.',                    'Prov'],  // прит. (lowercase)

  // Ecclesiastes — Є҆кклес. / Є҆клес. / Є҆ккл. / є҆ккл.
  ['Є҆кклес.', 'Eccl'],  // Є҆кклес.
  ['Є҆клес.',        'Eccl'],  // Є҆клес.
  ['Є҆ккл.',              'Eccl'],  // Є҆ккл.
  ['є҆ккл.',              'Eccl'],  // є҆ккл. (lowercase)

  // Song of Songs — (multiple two-word forms, longest first)
  ['Пѣ́снь пѣ́сней', 'Song'],  // Пѣ́снь пѣ́сней
  ['пѣ̑снь пѣ̑с.',    'Song'],  // пѣ̑снь пѣ̑с. (inverted breve accent variant)
  ['Пѣ́сни пѣ́сн.',   'Song'],  // Пѣ́сни пѣ́сн.
  ['Пѣ́снь пѣсн.',    'Song'],  // Пѣ́снь пѣсн.
  ['Пѣ́снь пѣ́сн.',   'Song'],  // Пѣ́снь пѣ́сн.
  ['Пѣ́снь пѣ́с.',    'Song'],  // Пѣ́снь пѣ́с.
  ['Пѣ́сн. пѣ́сн.',   'Song'],  // Пѣ́сн. пѣ́сн.
  ['Пѣ́сн. пѣ́с.',    'Song'],  // Пѣ́сн. пѣ́с.
  ['Пѣ́сн.',              'Song'],  // Пѣ́сн.

  // Wisdom of Solomon — Премꙋ́др. Сол. / Прем. Сол. / Прем. / прем. сол.
  ['Премꙋ́дрости соломѡ́новы', 'Wis'],  // Премꙋ́дрости соломѡ́новы (genitive)
  ['Премꙋ́дрости соломѡ́ни',   'Wis'],  // Премꙋ́дрости соломѡ́ни (genitive)
  ['Премꙋ́др. Сол.', 'Wis'],  // Премꙋ́др. Сол.
  ['Прем. Сол.',                          'Wis'],  // Прем. Сол.
  ['Прем. сол.',                          'Wis'],  // Прем. сол.
  ['прем. сол.',                          'Wis'],  // прем. сол. (lowercase)
  ['Премꙋ́др.',                      'Wis'],  // Премꙋ́др.
  ['Прем.',                    'Wis'],  // Прем.

  // Sirach — Сїра́х. / Сїраⷯ. / Сира́х. / Сїраⷯ / сїра́х.
  ['Премꙋ́дрости і҆исꙋ́са, сы́на сїра́хова', 'Sir'],  // Премꙋ́дрости і҆исꙋ́са, сы́на сїра́хова (genitive)
  ['Сїра́х.',        'Sir'],  // Сїра́х.
  ['Сїраⷯ.',              'Sir'],  // Сїраⷯ.
  ['Сїраⷯ',               'Sir'],  // Сїраⷯ (no period)
  ['Сира́х.',        'Sir'],  // Сира́х.
  ['сїра́х.',        'Sir'],  // сїра́х. (lowercase)

  // ── Old Testament: Prophets ───────────────────────────────────────────────

  // Isaiah — И҆са́їи / И҆са́їа / І҆са́їи (genitive, no period) / и҆са́.
  ['Прⷪ҇ро́чества и҆са́їина', 'Isa'],  // Прⷪ҇ро́чества и҆са́їина (service/ genitive)
  ['Проро́чества и҆са́їина',  'Isa'],  // Проро́чества и҆са́їина
  ['И҆са́їи', 'Isa'],  // И҆са́їи (И = U+0418)
  ['И҆са́їа',       'Isa'],  // И҆са́їа
  ['І҆са́їи', 'Isa'],  // І҆са́їи (І = U+0406, different first letter)
  ['и҆са́.',         'Isa'],  // и҆са́. (lowercase short form)

  // Jeremiah — І҆ерем. / Плач. І҆ерем. (lamentations two-word → Lam handled below)
  // Lowercase variants before uppercase so they don't false-match uppercase keys
  ['Прⷪ҇ро́чества і҆еремі́ина', 'Jer'],  // Прⷪ҇ро́чества і҆еремі́ина (service/ genitive)
  ['і҆ерем.',            'Jer'],  // і҆ерем. (lowercase)
  ['І҆ерем.',            'Jer'],  // І҆ерем.
  ['і҆ер.',              'Jer'],  // і҆ер. (lowercase short)
  ['І҆ерем',             'Jer'],  // І҆ерем (no period)

  // Lamentations — two-word forms first (all variants), then bare forms
  // Titlo forms
  ['Плаⷱ҇ І҆ерем.', 'Lam'],  // Плаⷱ҇ І҆ерем. (superscript ч titlo)
  // Accented forms with lowercase і҆ерем.
  ['Пла́чь і҆ерем.', 'Lam'],  // Пла́чь і҆ерем.
  ['Пла́ч. і҆ерем.', 'Lam'],  // Пла́ч. і҆ерем.
  // Standard uppercase two-word
  ['Плач. І҆ерем.', 'Lam'],  // Плач. І҆ерем.
  // Bare forms (after all two-word forms)
  ['Плаⷱ҇',               'Lam'],  // Плаⷱ҇ (bare titlo form)
  ['Пла́чь',              'Lam'],  // Пла́чь (with ь)
  ['Пла́ч.',              'Lam'],  // Пла́ч. (accented)
  ['Плач.',                        'Lam'],  // Плач.

  // Baruch — Вар.
  ['Прⷪ҇ро́чества варꙋ́хова', 'Bar'],  // Прⷪ҇ро́чества варꙋ́хова (service/ genitive)
  ['Вар.',                             'Bar'],  // Вар.

  // Ezekiel — І҆езек. / Є҆зек.
  ['Прⷪ҇ро́чества і҆езекі́илева', 'Ezek'],  // Прⷪ҇ро́чества і҆езекі́илева (service/ genitive)
  ['Проро́чества і҆езекі́илева',  'Ezek'],  // Проро́чества і҆езекі́илева
  ['Прⷪ҇ро́чества і҆езекїи́лева', 'Ezek'],  // Прⷪ҇ро́чества і҆езекїи́лева (variant spelling)
  ['І҆езек.',            'Ezek'], // І҆езек.
  ['Є҆зек.',                  'Ezek'], // Є҆зек.

  // Daniel — Данїи́л. / Дан.
  ['Прⷪ҇ро́чества данїи́лова', 'Dan'],  // Прⷪ҇ро́чества данїи́лова (service/ genitive)
  ['Данїи́л.',      'Dan'],  // Данїи́л.
  ['Дан.',                              'Dan'],  // Дан.

  // Hosea — Ѡ҆сі́и / Ѻ҆сі́и (genitive, no period; two omega variants)
  ['Ѻ҆сі́и',             'Hos'],  // Ѻ҆сі́и (U+047A round omega)
  ['Ѡ҆сі́и',             'Hos'],  // Ѡ҆сі́и (U+0460 standard omega)

  // Joel — І҆ѡ́ил. / І҆ѡ́илѧ (genitive)
  ['Прⷪ҇ро́чества і҆ѡ́илева', 'Joel'],  // Прⷪ҇ро́чества і҆ѡ́илева (service/ genitive)
  ['Проро́чества і҆ѡ́илева',  'Joel'],  // Проро́чества і҆ѡ́илева
  ['І҆ѡ́илѧ',            'Joel'], // І҆ѡ́илѧ (genitive form)
  ['І҆ѡ́ил.',            'Joel'], // І҆ѡ́ил.

  // Amos — А҆мѡ́с. / А҆мос.
  ['А҆мѡ́с.',            'Amos'], // А҆мѡ́с.
  ['А҆мос.',                  'Amos'], // А҆мос.

  // Obadiah — А҆вд.
  ['А҆вд.',                        'Obad'], // А҆вд.

  // Jonah — І҆ѡн. / І҆он.
  ['Прⷪ҇ро́чества і҆ѡ́нина', 'Jonah'],  // Прⷪ҇ро́чества і҆ѡ́нина (service/ genitive)
  ['І҆ѡн.',                        'Jonah'],// І҆ѡн.
  ['І҆он.',                        'Jonah'],// І҆он.

  // Micah — Мїх.
  ['Прⷪ҇ро́чества мїхе́ина', 'Mic'],  // Прⷪ҇ро́чества мїхе́ина (service/ genitive)
  ['Проро́чества мїхе́ина',  'Mic'],  // Проро́чества мїхе́ина
  ['Мїх.',                              'Mic'],  // Мїх.

  // Nahum — Наꙋм. / Наꙋ́м.
  ['Наꙋ́м.',                       'Nah'],  // Наꙋ́м. (accented)
  ['Наꙋм.',                        'Nah'],  // Наꙋм.

  // Habakkuk — А҆ввак.
  ['А҆ввак.',            'Hab'],  // А҆ввак.

  // Zephaniah — Софо́н. / Соф.
  ['Прⷪ҇ро́чества софо́нїева', 'Zeph'],  // Прⷪ҇ро́чества софо́нїева (service/ genitive)
  ['Прⷪ҇ро́чества софѡ́нїева', 'Zeph'],  // Прⷪ҇ро́чества софѡ́нїева (omega variant)
  ['Софо́н.',            'Zeph'], // Софо́н.
  ['Соф.',                              'Zeph'], // Соф.

  // Haggai — А҆гк. / А҆гге́а (genitive)
  ['А҆гге́а',            'Hag'],  // А҆гге́а (genitive form)
  ['А҆гк.',                        'Hag'],  // А҆гк.

  // Zechariah — Заха́р. / Зах.
  ['Прⷪ҇ро́чества заха́рїина', 'Zech'],  // Прⷪ҇ро́чества заха́рїина (service/ genitive)
  ['Проро́чества заха́рїина',  'Zech'],  // Проро́чества заха́рїина
  ['Заха́р.',            'Zech'], // Заха́р.
  ['Зах.',                              'Zech'], // Зах.

  // Malachi — Малах. / Мал.
  ['Прⷪ҇ро́чества малахі́ина', 'Mal'],  // Прⷪ҇ро́чества малахі́ина (service/ genitive)
  ['Проро́чества малахі́ина',  'Mal'],  // Проро́чества малахі́ина
  ['Малах.',                  'Mal'],  // Малах.
  ['Мал.',                              'Mal'],  // Мал.

  // ── New Testament: Gospels ────────────────────────────────────────────────

  // Matthew — Матѳ. / Мат. / матѳ. / маⷮ.
  ['Матѳ.',                   'Matt'],  // Матѳ.
  ['матѳ.',                   'Matt'],  // матѳ. (lowercase)
  ['маⷮ.',                    'Matt'],  // маⷮ. (superscript т titlo, lowercase)
  ['Мат.',                         'Matt'],  // Мат.

  // Mark — Ма́рк. / Марк. / Мар. / ма́рка (genitive)
  ['ма́рка',             'Mark'],  // ма́рка (genitive, lowercase)
  ['Ма́рк.',             'Mark'],  // Ма́рк.
  ['Марк.',                   'Mark'],  // Марк.
  ['Мар.',                         'Mark'],  // Мар.

  // Luke — Лꙋкѝ / Лꙋ́ки / Лꙋк. / лꙋкѝ
  ['Лꙋкѝ',                   'Luke'],  // Лꙋкѝ (voc.)
  ['лꙋкѝ',                   'Luke'],  // лꙋкѝ (lowercase)
  ['Лꙋ́ки',             'Luke'],  // Лꙋ́ки
  ['Лꙋк.',                         'Luke'],  // Лꙋк.

  // John — І҆ѡа́н. / І҆ѡан. / і҆ѡа́н. / і҆ѡан.
  ['І҆ѡа́н.',       'John'],  // І҆ѡа́н.
  ['і҆ѡа́н.',       'John'],  // і҆ѡа́н. (lowercase)
  ['І҆ѡа́н',        'John'],  // І҆ѡа́н (no period)
  ['І҆ѡан.',             'John'],  // І҆ѡан.
  ['і҆ѡан.',             'John'],  // і҆ѡан. (lowercase)

  // ── New Testament: Acts ───────────────────────────────────────────────────

  // Acts — Дѣѧ́н. / Дѣ́ѧн.
  ['Дѣѧ́н.',             'Acts'],  // Дѣѧ́н.
  ['Дѣ́ѧн.',             'Acts'],  // Дѣ́ѧн.

  // ── New Testament: Catholic Epistles ─────────────────────────────────────

  // James — І҆а́кѡв. / І҆а́к.
  ['Собо́рнагѡ посла́нїѧ і҆а́кѡвлѧ',   'Jas'],  // service/ genitive
  ['Ѿ собо́рнагѡ посла́нїѧ і҆а́кѡвлѧ', 'Jas'],  // with Ѿ preposition
  ['І҆а́кѡв.', 'Jas'],  // І҆а́кѡв.
  ['І҆а́к.',             'Jas'],   // І҆а́к.

  // 1 Peter — а҃ Петра̀ / а҃ Петр. / а҃ петр.
  ['Собо́рнагѡ посла́нїѧ петро́ва', '1Pet'],  // service/ genitive (1st epistle)
  ['а҃ Петра̀', '1Pet'],  // а҃ Петра̀
  ['а҃ Петр.',              '1Pet'],  // а҃ Петр.
  ['а҃ петр.',              '1Pet'],  // а҃ петр.

  // 2 Peter — в҃ Петр.
  ['в҃ Петр.',      '2Pet'],  // в҃ Петр.

  // 1 John — а҃ І҆ѡа́н. (must precede bare І҆ѡа́н.)
  ['Ѿ собо́рнагѡ посла́нїѧ і҆ѡа́ннова', '1John'],  // service/ genitive
  ['а҃ І҆ѡа́н.', '1John'],  // а҃ І҆ѡа́н.
  ['а҃ І҆ѡа́н',  '1John'],  // а҃ І҆ѡа́н (no period)
  ['а҃ і҆ѡа́н.', '1John'],  // а҃ і҆ѡа́н.

  // 2 John — в҃ І҆ѡа́н. (must precede bare І҆ѡа́н.)
  ['в҃ І҆ѡа́н.', '2John'],  // в҃ І҆ѡа́н.
  ['в҃ і҆ѡа́н.', '2John'],  // в҃ і҆ѡа́н.

  // 3 John — г҃ І҆ѡа́н. (must precede bare І҆ѡа́н.)
  ['г҃ І҆ѡа́н.', '3John'],  // г҃ І҆ѡа́н.
  ['г҃ і҆ѡа́н.', '3John'],  // г҃ і҆ѡа́н.

  // Jude — І҆ꙋ́д.
  ['Собо́рнагѡ посла́нїѧ і҆ꙋ́дина',   'Jude'],  // service/ genitive
  ['Ѿ собо́рнагѡ посла́нїѧ і҆ꙋ́дина', 'Jude'],  // with Ѿ preposition
  ['І҆ꙋ́д.',             'Jude'],  // І҆ꙋ́д.

  // ── New Testament: Pauline Epistles ──────────────────────────────────────

  // Romans — Ри́мл. / Ри́м. / Рим. / ри́мл. / ри́м.
  ['Ри́мл.',             'Rom'],   // Ри́мл.
  ['ри́мл.',             'Rom'],   // ри́мл. (lowercase)
  ['Ри́м.',                   'Rom'],   // Ри́м.
  ['ри́м.',                   'Rom'],   // ри́м. (lowercase)
  ['Рим.',                         'Rom'],   // Рим.

  // 1 Corinthians — а҃ Корі́нѳ. / а҃ Корі́н. / а҃ корі́нѳ / а҃ Кор. / а҃ кор.
  ['Къ корі́нѳѧнѡмъ посла́нїѧ ст҃а́гѡ а҆пⷭ҇ла па́ѵла', '1Cor'],  // service/ long form
  ['а҃ Корі́нѳ.', '1Cor'],  // а҃ Корі́нѳ.
  ['а҃ Корі́н.',       '1Cor'],  // а҃ Корі́н.
  ['а҃ корі́нѳ',  '1Cor'],  // а҃ корі́нѳ
  ['а҃ Кор.',                         '1Cor'],  // а҃ Кор.
  ['а҃ кор.',                         '1Cor'],  // а҃ кор.

  // 2 Corinthians — в҃ Корїн. / в҃ Корі́н. / в҃ Кор. / в҃ кор.
  ['в҃ Корїн.',  '2Cor'],  // в҃ Корїн.
  ['в҃ Корі́н.',  '2Cor'],  // в҃ Корі́н.
  ['в҃ Кор.',                    '2Cor'],  // в҃ Кор.
  ['в҃ кор.',                    '2Cor'],  // в҃ кор.

  // Galatians — Гала́т. / Галат. / Гал. / гал.
  ['Гала́т.',       'Gal'],   // Гала́т.
  ['Галат.',             'Gal'],   // Галат.
  ['Гал.',                         'Gal'],   // Гал.
  ['гал.',                         'Gal'],   // гал. (lowercase)

  // Ephesians — Є҆фес. / є҆фе́с.
  ['Є҆фес.',             'Eph'],   // Є҆фес.
  ['є҆фе́с.',             'Eph'],   // є҆фе́с. (lowercase, accented)

  // Philippians — Фїлїпп. / Фїлїп. / фїлїп.
  ['Фїлїпп.', 'Phil'],  // Фїлїпп.
  ['Фїлїп.',        'Phil'],  // Фїлїп.
  ['фїлїп.',        'Phil'],  // фїлїп. (lowercase)

  // Colossians — Колос. / Кол.
  ['Колос.',             'Col'],   // Колос.
  ['Кол.',                         'Col'],   // Кол.

  // 1 Thessalonians — а҃ Солꙋ́н. / а҃ сол. / а҃ Сол.
  ['а҃ Солꙋ́н.', '1Thess'],  // а҃ Солꙋ́н.
  ['а҃ сол.',                   '1Thess'],  // а҃ сол.
  ['а҃ Сол.',                   '1Thess'],  // а҃ Сол.

  // 2 Thessalonians — в҃ Солꙋ́н. / в҃ сол. / в҃ Сол.
  ['в҃ Солꙋ́н.', '2Thess'],  // в҃ Солꙋ́н.
  ['в҃ сол.',                   '2Thess'],  // в҃ сол.
  ['в҃ Сол.',                   '2Thess'],  // в҃ Сол.

  // 1 Timothy — а҃ Тїмоѳ. / а҃ Тїм. / а҃ тїмоѳ. / а҃ тїм.
  ['а҃ Тїмоѳ.', '1Tim'],  // а҃ Тїмоѳ.
  ['а҃ Тїм.',              '1Tim'],  // а҃ Тїм.
  ['а҃ тїмоѳ.',        '1Tim'],  // а҃ тїмоѳ.
  ['а҃ тїм.',                    '1Tim'],  // а҃ тїм.

  // 2 Timothy — в҃ Тїм. / в҃ тїм.
  ['в҃ Тїм.',      '2Tim'],  // в҃ Тїм.
  ['в҃ тїм.',            '2Tim'],  // в҃ тїм.

  // Titus — Ті́та / Ті́т. / Тїт. / ті́т.
  ['Ті́та',              'Titus'], // Ті́та
  ['Ті́т.',                   'Titus'], // Ті́т.
  ['Тїт.',                         'Titus'], // Тїт.
  ['ті́т.',                   'Titus'], // ті́т.

  // Philemon — Фїлим.
  ['Фїлим.',             'Phlm'],  // Фїлим.

  // Hebrews — Є҆вр.
  ['Є҆вр.',                   'Heb'],   // Є҆вр.

  // ── New Testament: Revelation ─────────────────────────────────────────────

  // Revelation — А҆пока́л. / А҆пок.
  ['А҆пока́л.', 'Rev'],  // А҆пока́л.
  ['А҆пок.',                   'Rev'],  // А҆пок.
];

// NFC-normalize all keys at startup (same as matching context)
const BOOK_ENTRIES = BOOK_ENTRIES_RAW.map(([key, slug]) => [key.normalize('NFC'), slug]);

// Return { key, slug, urlBase, endPos } if norm[pos..] starts with a known book
// abbreviation, or null if no match. urlBase = /bible/<slug>/.
function findBookAt(norm, pos) {
  for (const [key, slug] of BOOK_ENTRIES) {
    if (norm.startsWith(key, pos)) {
      return { key, slug, urlBase: `/bible/${slug}/`, endPos: pos + key.length };
    }
  }
  return null;
}

// Build URL base for a given bible slug.
function slugToBibleUrl(slug) {
  return `/bible/${slug}/`;
}

module.exports = { BOOK_ENTRIES, findBookAt, slugToBibleUrl };
