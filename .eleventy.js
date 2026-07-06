const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { liturgicalTermsRegex, numberedBookPartsRegex, NUMERAL_PATTERN } = require('./lib/cu_liturgical');
const { getPeriod } = require('./src/assets/js/liturgical-period.js');
const registerTodayRedirectors = require('./eleventy/today_redirectors');

const decodeEntities = (html) => html
  .replace(/&nbsp;/g, " ")
  .replace(/&amp;/g, "&")
  .replace(/&lt;/g, "<")
  .replace(/&gt;/g, ">")
  .replace(/&quot;/g, '"')
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(parseInt(n)))
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)));

const stripTags = (html) =>
  decodeEntities(html.replace(/<[^>]+>/g, "")).normalize("NFC").trim();

const CONTENT_ROOT = path.join(__dirname, 'src/content');
const ORNAMENT_SIZES = new Set(['xsmall', 'small', 'medium', 'large', 'xlarge']);

// Precompiled regexes for slavonicNumeralNoBreak — built once at module scope
const _LT  = liturgicalTermsRegex();
const _NP  = NUMERAL_PATTERN;
const _BP  = numberedBookPartsRegex();
const RX_TERM_NUM          = new RegExp(`(^|\\s|>|\\[)(${_LT})\\s+(${_NP})`, 'gi');
const RX_TERM_COMMA_NUM    = new RegExp(`(^|\\s|>|\\[)(${_LT}),\\s+(${_NP})`, 'gi');
const RX_TERM_LINKED       = new RegExp(`(^|\\s|>|\\[)(${_LT})\\s+(<a [^>]*>${_NP}<\\/a>)`, 'gim');
const RX_TERM_COMMA_LINKED = new RegExp(`(^|\\s|>|\\[)(${_LT}),\\s+(<a [^>]*>${_NP}<\\/a>)`, 'gim');
const RX_NUM_WEEK          = new RegExp(`(^|\\s)(${_NP}) ([НнСс]ед\\S*)`, 'gm');
const RX_NUM_BOOK          = new RegExp(`(^|\\s|>|\\[)(${_NP}) (${_BP})`, 'g');

module.exports = function(eleventyConfig) {

  const cacheResets = [];

  // PERFORMANCE OPTIMIZATION: Cache navigation data
  let navigationCache = null;        cacheResets.push(() => { navigationCache = null; });
  let navByKey = null;               cacheResets.push(() => { navByKey = null; });
  let navByParent = null;            cacheResets.push(() => { navByParent = null; });
  const breadcrumbCache = new Map(); cacheResets.push(() => breadcrumbCache.clear());
  const chapterNavCache = new Map(); cacheResets.push(() => chapterNavCache.clear());

  function initNavCaches(collection) {
    if (navigationCache) return;
    navigationCache = collection.filter(page => page.data.navigation);
    navByKey = new Map();
    navByParent = new Map();
    for (const page of navigationCache) {
      const nav = page.data.navigation;
      if (nav.key) navByKey.set(nav.key, page);
      const parent = nav.parent || null;
      if (!navByParent.has(parent)) navByParent.set(parent, []);
      navByParent.get(parent).push(page);
    }
    for (const arr of navByParent.values()) {
      arr.sort((a, b) => (a.data.navigation.order || 0) - (b.data.navigation.order || 0));
    }
  }

  // PERFORMANCE OPTIMIZATION: Cache disk reads for shortcodes
  const fileCache = new Map();   cacheResets.push(() => fileCache.clear());
  let ornamentManifest = null;   cacheResets.push(() => { ornamentManifest = null; });

  function readCached(absPath) {
    if (fileCache.has(absPath)) return fileCache.get(absPath);
    const content = fs.readFileSync(absPath, 'utf8');
    fileCache.set(absPath, content);
    return content;
  }

  function loadOrnamentManifest() {
    if (ornamentManifest) return ornamentManifest;
    try {
      ornamentManifest = JSON.parse(
        readCached(path.join(__dirname, 'src/assets/ornaments/manifest.json'))
      );
    } catch (e) {
      console.error('ornament manifest not found:', e.message);
      ornamentManifest = { roles: {} };
    }
    return ornamentManifest;
  }

  eleventyConfig.on('eleventy.before', () => cacheResets.forEach(fn => fn()));

  registerTodayRedirectors(eleventyConfig);

  eleventyConfig.addFilter("striptags", (s) => stripTags(String(s ?? "")));

  eleventyConfig.addFilter("navMode", (data) => {
    if (!data.navigation || !data.navigation.key) return 'none';
    if (data.standalone || data.noSwipe) return 'standalone';
    if (data.type && data.navigation.parent) return 'chapter';
    if (!data.type && data.navigation.parent) return 'toc';
    return 'none';
  });

  // Custom navigation filter with caching
  eleventyConfig.addFilter("customNavigation", function(collection, parentKey = null) {
    initNavCaches(collection);
    return navByParent.get(parentKey) || [];
  });

  // Custom breadcrumb filter with caching
  eleventyConfig.addFilter("customBreadcrumbs", function(collection, currentKey) {
    // Return cached result if available
    if (breadcrumbCache.has(currentKey)) {
      return breadcrumbCache.get(currentKey);
    }

    initNavCaches(collection);

    const breadcrumbs = [];
    let current = navByKey.get(currentKey);

    while (current) {
      if (!current.data.skipBreadcrumb) {
        breadcrumbs.unshift(current);
      }
      if (current.data.navigation.parent) {
        current = navByKey.get(current.data.navigation.parent);
      } else {
        break;
      }
    }

    // Cache the result
    breadcrumbCache.set(currentKey, breadcrumbs);
    return breadcrumbs;
  });

  // Copy static assets - CSS, JS, and lectionary data
  eleventyConfig.addPassthroughCopy({"src/assets/css": "assets/css"});
  eleventyConfig.addPassthroughCopy({"src/assets/js": "assets/js"});
  eleventyConfig.addPassthroughCopy({"src/assets/data": "assets/data"});
  eleventyConfig.addPassthroughCopy({"src/assets/ornaments": "assets/ornaments"});

  // Copy favicon images
  eleventyConfig.addPassthroughCopy({"src/assets/images": "assets/images"});

  // Copy robots.txt to root
  eleventyConfig.addPassthroughCopy({"src/assets/robots.txt": "robots.txt"});

  eleventyConfig.addPassthroughCopy({"src/assets/fonts": "assets/fonts"});

  eleventyConfig.addWatchTarget("./src/assets/ornaments/manifest.json");

  // Add filter for numerical sorting (for dynamic subsection indexes)
  eleventyConfig.addFilter("sortByNumber", function(collection) {
    return collection.sort((a, b) => {
      const aNum = parseInt(a.fileSlug.replace(/-/g, ''));
      const bNum = parseInt(b.fileSlug.replace(/-/g, ''));
      return aNum - bNum;
    });
  });

  // Collections for dynamic subsection indexes
  eleventyConfig.addCollection("psalterParts", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/content/psalter/*/*.md");
  });

  eleventyConfig.addCollection("prayerParts", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/content/prayers/*/*.md");
  });

  eleventyConfig.addCollection("serviceParts", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/content/service/*/*.md");
  });

  eleventyConfig.addCollection("canonParts", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/content/canons/*/*.md");
  });

  eleventyConfig.addCollection("variousParts", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/content/various/*/*.md");
  });

  eleventyConfig.addCollection("bibleBooks", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/content/bible/*.md")
      .filter(item => !item.inputPath.endsWith('index.njk') && item.fileSlug !== 'bible')
      .sort((a, b) => (a.data.navigation?.order || 0) - (b.data.navigation?.order || 0));
  });

  // Collections for chapter navigation (FIXED to prevent conflicts)
  eleventyConfig.addCollection("chaptersByWork", function(collectionApi) {
    const allChapters = collectionApi.getAll().filter(item => {
      return item.data.navigation && item.data.navigation.parent && item.data.type;
    });

    const works = {};

    allChapters.forEach(chapter => {
      const workKey = chapter.data.navigation.parent;
      if (!works[workKey]) {
        works[workKey] = [];
      }
      works[workKey].push(chapter);
    });

    // Sort chapters within each work by order
    Object.keys(works).forEach(workKey => {
      works[workKey].sort((a, b) => {
        return (a.data.navigation.order || 0) - (b.data.navigation.order || 0);
      });
    });

    return works;
  });

// Chapter navigation filter with caching
  eleventyConfig.addFilter("getChapterNavigation", function(collection, currentKey) {
    // Return cached result if available
    if (chapterNavCache.has(currentKey)) {
      return chapterNavCache.get(currentKey);
    }

    initNavCaches(collection);

    const current = navByKey.get(currentKey);
    if (!current || !current.data.navigation.parent) {
      chapterNavCache.set(currentKey, null);
      return null;
    }

    // Standalone single-work pages opt out of chapter nav
    if (current.data.standalone) {
      chapterNavCache.set(currentKey, null);
      return null;
    }

    const workKey = current.data.navigation.parent;

    // Siblings: same parent, have a type (i.e. chapter leaves), exclude standalone pages
    // navByParent arrays are pre-sorted by navigation.order.
    const siblings = (navByParent.get(workKey) || []).filter(page =>
      page.data.type && !page.data.standalone
    );

    const currentIndex = siblings.findIndex(page => page.data.navigation.key === currentKey);

    const result = {
      current: current,
      siblings: siblings,
      previous: currentIndex > 0 ? siblings[currentIndex - 1] : null,
      next: currentIndex < siblings.length - 1 ? siblings[currentIndex + 1] : null,
      total: siblings.length,
      position: currentIndex + 1
    };

    // Cache the result
    chapterNavCache.set(currentKey, result);
    return result;
  });

  // ORNAMENT SHORTCODE - Embeds SVG ornaments from src/assets/ornaments/
  // Usage: {% ornament "role-name" %} (logical name resolved via manifest.json)
  //        {% ornament "category/file" %} (direct path, for power use)
  // Sizes: "xsmall" (3rem box), "small" (5rem box), "medium" (8rem box), "large" (18rem, vw-capped for mobile), "xlarge" (18rem desktop, scales with text on tablets), or omit for default (25rem cap).
  // Size resolution order: explicit arg → manifest role.size → none.
  // Each size is a square bounding box: wide SVGs hit the width cap, tall SVGs hit the height cap.
  // manifest.json maps logical role names to { category, size?, candidates: [{file, period?}, ...] }.
  // When candidates.length > 1, data-* attrs are emitted for ornament-rotation.js to swap at runtime.
  eleventyConfig.addShortcode("ornament", function(name, size) {
    const manifest = loadOrnamentManifest();

    let svgRelPath;
    let candidates = null;
    let category = null;
    let chosenFile = null;
    const role = manifest.roles[name];
    if (role) {
      candidates = role.candidates;
      category = role.category;
      const buildPeriod = getPeriod(new Date());
      const chosen = candidates.find(c => c.period === buildPeriod)
                  || candidates.find(c => !c.period)
                  || candidates[0];
      chosenFile = chosen.file;
      svgRelPath = `${category}/${chosenFile}`;
    } else {
      svgRelPath = name; // direct path fallback: "category/file"
    }
    const svgPath = path.join(__dirname, 'src/assets/ornaments', `${svgRelPath}.svg`);

    const effectiveSize = size || (role && role.size);
    let classes = 'ornament';
    if (ORNAMENT_SIZES.has(effectiveSize)) {
      classes += ` ornament-${effectiveSize}`;
    }

    try {
      let svg = readCached(svgPath);
      svg = svg.replace(/<\?xml[^?]*\?>\s*/g, '');
      svg = svg.replace(/<!DOCTYPE[^>]*>\s*/g, '');
      let dataAttrs = '';
      if (candidates && candidates.length > 1) {
        // data-file = the file already inlined; client early-returns if it still matches.
        dataAttrs = ` data-file="${chosenFile}" data-category="${category}" data-candidates='${JSON.stringify(candidates)}'`;
      }
      return `<div class="${classes}"${dataAttrs}>${svg}</div>`;
    } catch (error) {
      console.error(`Ornament '${name}' not found at ${svgPath}`);
      return `<!-- Ornament '${name}' not found -->`;
    }
  });

  // TRANSCLUSION SHORTCODES - Fixed path resolution

  // Helper function to strip footnote references (default behavior for transclusions)
  function stripFootnotes(content) {
    // Remove footnote reference links like <a href="#fn1" id="ref1-a">꙾</a>
    return content.replace(/<a\s+href="#fn[^"]*"[^>]*>[^<]*<\/a>/g, '');
  }

  // Helper function to strip formatting elements
  function stripFormatting(content, stripOptions = {}) {
    let processedContent = content;

    if (stripOptions.versals) {
      // Remove <versal> tags but keep the letter content
      processedContent = processedContent.replace(/<versal[^>]*>([^<]+)<\/versal>/g, '$1');
    }

    if (stripOptions.red) {
      // Remove <red> tags but keep the letter content
      processedContent = processedContent.replace(/<red[^>]*>([^<]+)<\/red>/g, '$1');
    }

    // Clean up extra whitespace after removals
    processedContent = processedContent.replace(/\n\s*\n\s*\n/g, '\n\n');

    return processedContent.trim();
  }

  function finishTransclude(text, options) {
    text = stripFootnotes(text);
    if (options.strip) text = stripFormatting(text, options.strip);
    if (options.wrap) return `{${options.wrap}}\n${text}\n{/fold}`;
    return text;
  }

  // Transclusion shortcode for sections marked with HTML comments
  eleventyConfig.addShortcode("transcludeSection", function(filePath, sectionName, options = {}) {
    const fullPath = path.join(CONTENT_ROOT, filePath);

    try {
      let content = readCached(fullPath);

      // Extract section between HTML comments
      const startPattern = new RegExp(`<!-- transclude:${sectionName} -->`);
      const endPattern = new RegExp(`<!-- /transclude:${sectionName} -->`);

      const startMatch = content.search(startPattern);
      const endMatch = content.search(endPattern);

      if (startMatch !== -1 && endMatch !== -1) {
        let sectionContent = content.substring(
          startMatch + content.match(startPattern)[0].length,
          endMatch
        ).trim();

        return finishTransclude(sectionContent, options);
      }

      return `<!-- Section '${sectionName}' not found in ${filePath} -->`;
    } catch (error) {
      console.error(`Error transcluding section from ${filePath}:`, error.message);
      return `<!-- Error: Could not transclude section from ${filePath} -->`;
    }
  });

  // Transclusion shortcode for entire file (minus frontmatter only)
  eleventyConfig.addShortcode("transclude", function(filePath, options = {}) {
    const fullPath = path.join(CONTENT_ROOT, filePath);

    try {
      let content = readCached(fullPath);

      // Remove frontmatter if present
      content = content.replace(/^---[\s\S]*?---\n/, '');

      return finishTransclude(content, options);
    } catch (error) {
      console.error(`Error transcluding ${filePath}:`, error.message);
      return `<!-- Error: Could not transclude ${filePath} -->`;
    }
  });

  // Transclusion shortcode for line ranges
  eleventyConfig.addShortcode("transcludeLines", function(filePath, startLine, endLine, options = {}) {
    const fullPath = path.join(CONTENT_ROOT, filePath);

    try {
      let content = readCached(fullPath);

      // Remove frontmatter if present
      content = content.replace(/^---[\s\S]*?---\n/, '');

      const lines = content.split('\n');

      // Extract specified lines (1-indexed)
      const extractedLines = lines.slice(startLine - 1, endLine);
      let extractedContent = extractedLines.join('\n').trim();

      // strip option intentionally omitted — transcludeLines preserves original asymmetry.
      return finishTransclude(extractedContent, { wrap: options.wrap });
    } catch (error) {
      console.error(`Error transcluding lines from ${filePath}:`, error.message);
      return `<!-- Error: Could not transclude lines from ${filePath} -->`;
    }
  });

  // Conservative transform to add non-breaking space before Church Slavonic numerals
  eleventyConfig.addTransform("slavonicNumeralNoBreak", function(content, outputPath) {
    if (outputPath && outputPath.endsWith(".html")) {
      content = content.replace(RX_TERM_NUM, '$1$2&nbsp;$3');
      content = content.replace(RX_TERM_COMMA_NUM, '$1$2,&nbsp;$3');
      content = content.replace(RX_TERM_LINKED, '$1$2&nbsp;$3');
      content = content.replace(RX_TERM_COMMA_LINKED, '$1$2,&nbsp;$3');

      // Non-breaking space after inline rubric verse/chapter numbers (e.g. <rubric class="inline vn" id="...">ѳ҃:</rubric>)
      content = content.replace(/(<rubric class="inline[^"]*"[^>]*>[а-ѱѡцѳѻꙋ][҃҂][^<]*:<\/rubric>) /g, '$1&nbsp;');

      // Non-breaking space after inline rubric verse numbers without colon (e.g. <rubric class="inline vn" id="...">ѕ҃і</rubric>)
      content = content.replace(/(<rubric class="inline[^"]*"[^>]*>[а-ѱѡцѳѻꙋ][҃҂][^\s<:]*<\/rubric>) /g, '$1&nbsp;');

      // Bible chapter openings have their leading verse-number rubric hidden by CSS
      // (p:has(> versal) > rubric.inline.vn:first-of-type { display: none }) so it does
      // not collide with the versal drop-cap. The &nbsp; inserted just above would then
      // leave a visible gap before the versal — strip whitespace whenever a vn rubric is
      // directly adjacent to a versal, regardless of verse id (Psalms with title
      // superscriptions open at chNv2 or chNv3, not chNv1).
      content = content.replace(/(<rubric class="inline vn"[^>]*>[^<]+<\/rubric>)(?:&nbsp;| )(<versal\b)/g, '$1$2');

      // Non-breaking space after linked numerals, with or without a trailing </rubric>
      // (e.g. <a href="...">в҃</a>, <a href="...">[в҃]</a></rubric>, or <a href="...">є҃:</a></rubric>)
      content = content.replace(/(<a [^>]*>\[?[а-ѱѡцѳѻꙋ][҃҂][^\s<]*<\/a>(?:<\/rubric>)?) /g, '$1&nbsp;');

      content = content.replace(RX_NUM_WEEK, '$1$2&nbsp;$3');
      content = content.replace(RX_NUM_BOOK, '$1$2&nbsp;$3');
    }
    return content;
  });

  // Enhanced transform to handle fold sections with styled summaries - CLEAN VERSION
  eleventyConfig.addTransform("foldSections", function(content, outputPath) {
    if (outputPath && outputPath.endsWith(".html")) {

      const addEndMarker = (body) =>
        body
          ? body + '<div class="fold-end-marker" data-fold-toggle onclick="">▲</div>'
          : body;

      const foldHtml = (isOpen, styleClass, summary, body) =>
        `<details${isOpen ? ' open' : ''}><summary><span class="triangle">▶</span>` +
        `<span class="${styleClass}">${summary}</span></summary>${addEndMarker(body)}</details>`;

      // FIRST PASS: Process inner/nested folds with [[fold]] syntax
      content = content.replace(
        /\[\[fold-(red|rubric|h1|h2|toc)-open:((?:[^\]]|\](?!\]))+)\]\]([\s\S]*?)\[\[\/fold\]\]/g,
        (_m, style, summary, body) => foldHtml(true, `summary-${style}`, summary, body)
      );
      content = content.replace(
        /\[\[fold-(red|rubric|h1|h2|toc):((?:[^\]]|\](?!\]))+)\]\]([\s\S]*?)\[\[\/fold\]\]/g,
        (_m, style, summary, body) => foldHtml(false, `summary-${style}`, summary, body)
      );
      content = content.replace(
        /\[\[fold-open:((?:[^\]]|\](?!\]))+)\]\]([\s\S]*?)\[\[\/fold\]\]/g,
        (_m, summary, body) => foldHtml(true, 'summary-default', summary, body)
      );
      content = content.replace(
        /\[\[fold:((?:[^\]]|\](?!\]))+)\]\]([\s\S]*?)\[\[\/fold\]\]/g,
        (_m, summary, body) => foldHtml(false, 'summary-default', summary, body)
      );

      // SECOND PASS: Process outer folds with {fold} syntax
      content = content.replace(
        /\{fold-(red|rubric|h1|h2|toc)-open:([^}]+)\}([\s\S]*?)\{\/fold\}/g,
        (_m, style, summary, body) => foldHtml(true, `summary-${style}`, summary, body)
      );
      content = content.replace(
        /\{fold-(red|rubric|h1|h2|toc):([^}]+)\}([\s\S]*?)\{\/fold\}/g,
        (_m, style, summary, body) => foldHtml(false, `summary-${style}`, summary, body)
      );
      content = content.replace(
        /\{fold-open:([^}]+)\}([\s\S]*?)\{\/fold\}/g,
        (_m, summary, body) => foldHtml(true, 'summary-default', summary, body)
      );
      content = content.replace(
        /\{fold:([^}]+)\}([\s\S]*?)\{\/fold\}/g,
        (_m, summary, body) => foldHtml(false, 'summary-default', summary, body)
      );

      // FINAL CLEANUP: Fix paragraph wrapping that breaks triangle rotation
      // Remove <p> tags immediately before <details> and </p> tags immediately after </details>
      content = content.replace(/<p>(<details[^>]*>)/g, '$1');
      content = content.replace(/(<\/details>)<\/p>/g, '$1');

      return content;
    }
    return content;
  });

  // Add id attributes to headings and fold <details> elements for anchor linking.
  // Runs after foldSections so <details>/<summary> are already in place.
  eleventyConfig.addTransform("headingIds", function(content, outputPath) {
    if (!outputPath || !outputPath.endsWith(".html")) return content;

    const hashId = (text) =>
      "h-" + crypto.createHash("sha1").update(text).digest("hex").slice(0, 8);

    const seen = new Map();
    const uniqueId = (base) => {
      const n = (seen.get(base) || 0) + 1;
      seen.set(base, n);
      return n === 1 ? base : `${base}-${n}`;
    };

    content = content.replace(
      /<(h[1-6])(?![^>]*\bid=)([^>]*)>([\s\S]*?)<\/\1>/g,
      (m, tag, attrs, inner) =>
        `<${tag} id="${uniqueId(hashId(stripTags(inner)))}"${attrs}>${inner}</${tag}>`
    );

    content = content.replace(
      /<details(?![^>]*\bid=)([^>]*)>\s*<summary>([\s\S]*?)<\/summary>/g,
      (m, attrs, summaryInner) =>
        `<details id="${uniqueId(hashId(stripTags(summaryInner)))}"${attrs}><summary>${summaryInner}</summary>`
    );

    return content;
  });

  // Basic configuration
  return {
    dir: {
      input: "src/content",
      output: "_site",
      includes: "../_includes"
    },
    templateFormats: ["md", "njk", "html"],
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk"
  };
};
