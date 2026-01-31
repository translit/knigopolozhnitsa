module.exports = function(eleventyConfig) {

  // PERFORMANCE OPTIMIZATION: Cache navigation data
  let navigationCache = null;
  let breadcrumbCache = new Map();
  let chapterNavCache = new Map();

  // Custom navigation filter with caching
  eleventyConfig.addFilter("customNavigation", function(collection, parentKey = null) {
    // Initialize cache once
    if (!navigationCache) {
      navigationCache = collection.filter(page => page.data.navigation);
    }

    // Filter by parent using cached data
    const filtered = navigationCache.filter(page => {
      if (parentKey === null) {
        return !page.data.navigation.parent; // Root level items
      }
      return page.data.navigation.parent === parentKey;
    });

    // Sort by order (keep this in case you want it later)
    return filtered.sort((a, b) => {
      return (a.data.navigation.order || 0) - (b.data.navigation.order || 0);
    });
  });

  // Custom breadcrumb filter with caching
  eleventyConfig.addFilter("customBreadcrumbs", function(collection, currentKey) {
    // Return cached result if available
    if (breadcrumbCache.has(currentKey)) {
      return breadcrumbCache.get(currentKey);
    }

    // Initialize navigation cache if needed
    if (!navigationCache) {
      navigationCache = collection.filter(page => page.data.navigation);
    }

    const breadcrumbs = [];
    let current = navigationCache.find(page => page.data.navigation.key === currentKey);

    while (current) {
      breadcrumbs.unshift(current);
      if (current.data.navigation.parent) {
        current = navigationCache.find(page => page.data.navigation.key === current.data.navigation.parent);
      } else {
        break;
      }
    }

    // Cache the result
    breadcrumbCache.set(currentKey, breadcrumbs);
    return breadcrumbs;
  });

  // Copy static assets - CSS and JS only
  eleventyConfig.addPassthroughCopy({"src/assets/css": "assets/css"});
  eleventyConfig.addPassthroughCopy({"src/assets/js": "assets/js"});

  // Copy favicon images
  eleventyConfig.addPassthroughCopy({"src/assets/images": "assets/images"});

  // Copy robots.txt to root
  eleventyConfig.addPassthroughCopy({"src/assets/robots.txt": "robots.txt"});

  // Copy only the fonts actually used in CSS
  eleventyConfig.addPassthroughCopy({"src/assets/fonts/Triodion-Regular.woff2": "assets/fonts/Triodion-Regular.woff2"});
  eleventyConfig.addPassthroughCopy({"src/assets/fonts/Vertograd-Regular.woff2": "assets/fonts/Vertograd-Regular.woff2"});
  eleventyConfig.addPassthroughCopy({"src/assets/fonts/Oglavie-Regular.woff2": "assets/fonts/Oglavie-Regular.woff2"});

  // Add filter for numerical sorting (for dynamic subsection indexes)
  eleventyConfig.addFilter("sortByNumber", function(collection) {
    return collection.sort((a, b) => {
      const aNum = parseInt(a.fileSlug);
      const bNum = parseInt(b.fileSlug);
      return aNum - bNum;
    });
  });

  // Collections for dynamic subsection indexes
  eleventyConfig.addCollection("akathistParts", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/content/akathists/*/*.md");
  });

  eleventyConfig.addCollection("canonParts", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/content/canons/*/*.md");
  });

  eleventyConfig.addCollection("psalterParts", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/content/psalter/*/*.md");
  });

  eleventyConfig.addCollection("prayerParts", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/content/prayers/*/*.md");
  });

  eleventyConfig.addCollection("serviceParts", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/content/service/*/*.md");
  });

  eleventyConfig.addCollection("variousParts", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/content/various/*/*.md");
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

    // Initialize navigation cache if needed
    if (!navigationCache) {
      navigationCache = collection.filter(page => page.data.navigation);
    }

    const current = navigationCache.find(page => page.data.navigation && page.data.navigation.key === currentKey);
    if (!current || !current.data.navigation.parent) {
      chapterNavCache.set(currentKey, null);
      return null;
    }

    // CRITICAL: Check if current page uses single-work layout
    if (current.data.layout === 'single-work.njk') {
      chapterNavCache.set(currentKey, null);
      return null;
    }

    const workKey = current.data.navigation.parent;

    // FIXED: Only include chapter pages, not single works
    const siblings = navigationCache.filter(page =>
      page.data.navigation &&
      page.data.navigation.parent === workKey &&  // Must match exact parent key
      page.data.layout === 'chapter.njk'          // Only chapter pages
    ).sort((a, b) => (a.data.navigation.order || 0) - (b.data.navigation.order || 0));

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

  // ILLUSTRATION SHORTCODE - Embeds SVG illustrations from src/assets/illustrations/
  // Usage: {% illustration "category/name" %} or {% illustration "category/name", "small" %}
  // Sizes: "xsmall" (2rem), "small" (3rem), "medium" (4.5rem), "large" (6.75rem), "xlarge" (10.125rem), or omit for full width
  eleventyConfig.addShortcode("illustration", function(name, size) {
    const fs = require('fs');
    const path = require('path');

    const svgPath = path.join(__dirname, 'src/assets/illustrations', `${name}.svg`);

    // Build class list
    let classes = 'illustration';
    if (size === 'xsmall' || size === 'small' || size === 'medium' || size === 'large' || size === 'xlarge') {
      classes += ` illustration-${size}`;
    }

    try {
      let svg = fs.readFileSync(svgPath, 'utf8');
      svg = svg.replace(/<\?xml[^?]*\?>\s*/g, '');  // Remove XML declaration
      svg = svg.replace(/<!DOCTYPE[^>]*>\s*/g, ''); // Remove DOCTYPE
      return `<div class="${classes}">${svg}</div>`;
    } catch (error) {
      console.error(`Illustration '${name}' not found at ${svgPath}`);
      return `<!-- Illustration '${name}' not found -->`;
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

  // Transclusion shortcode for sections marked with HTML comments
  eleventyConfig.addShortcode("transcludeSection", function(filePath, sectionName, options = {}) {
    const fs = require('fs');
    const path = require('path');

    // Use hardcoded path since this.eleventy.config.dir is not accessible
    const fullPath = path.join(__dirname, 'src/content', filePath);

    try {
      let content = fs.readFileSync(fullPath, 'utf8');

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

        // Strip footnote references by default (they point nowhere in transcluded content)
        sectionContent = stripFootnotes(sectionContent);

        // Apply formatting stripping if requested
        if (options.strip) {
          sectionContent = stripFormatting(sectionContent, options.strip);
        }

        // If wrap option provided, wrap content in fold syntax
        if (options.wrap) {
          return `{${options.wrap}}\n${sectionContent}\n{/fold}`;
        }
        return sectionContent;
      }

      return `<!-- Section '${sectionName}' not found in ${filePath} -->`;
    } catch (error) {
      console.error(`Error transcluding section from ${filePath}:`, error.message);
      return `<!-- Error: Could not transclude section from ${filePath} -->`;
    }
  });

  // Transclusion shortcode for entire file (minus frontmatter only)
  eleventyConfig.addShortcode("transclude", function(filePath, options = {}) {
    const fs = require('fs');
    const path = require('path');

    const fullPath = path.join(__dirname, 'src/content', filePath);

    try {
      let content = fs.readFileSync(fullPath, 'utf8');

      // Remove frontmatter if present
      content = content.replace(/^---[\s\S]*?---\n/, '');

      // Strip footnote references by default (they point nowhere in transcluded content)
      content = stripFootnotes(content);

      // Apply formatting stripping if requested
      if (options.strip) {
        content = stripFormatting(content, options.strip);
      }

      // If wrap option provided, wrap content in fold syntax
      if (options.wrap) {
        return `{${options.wrap}}\n${content}\n{/fold}`;
      }

      return content;
    } catch (error) {
      console.error(`Error transcluding ${filePath}:`, error.message);
      return `<!-- Error: Could not transclude ${filePath} -->`;
    }
  });

  // Transclusion shortcode for line ranges
  eleventyConfig.addShortcode("transcludeLines", function(filePath, startLine, endLine, options = {}) {
    const fs = require('fs');
    const path = require('path');

    const fullPath = path.join(__dirname, 'src/content', filePath);

    try {
      let content = fs.readFileSync(fullPath, 'utf8');

      // Remove frontmatter if present
      content = content.replace(/^---[\s\S]*?---\n/, '');

      const lines = content.split('\n');

      // Extract specified lines (1-indexed)
      const extractedLines = lines.slice(startLine - 1, endLine);
      let extractedContent = extractedLines.join('\n').trim();

      // Strip footnote references by default (they point nowhere in transcluded content)
      extractedContent = stripFootnotes(extractedContent);

      // If wrap option provided, wrap content in fold syntax
      if (options.wrap) {
        return `{${options.wrap}}\n${extractedContent}\n{/fold}`;
      }

      return extractedContent;
    } catch (error) {
      console.error(`Error transcluding lines from ${filePath}:`, error.message);
      return `<!-- Error: Could not transclude lines from ${filePath} -->`;
    }
  });

  // Conservative transform to add non-breaking space before Church Slavonic numerals
  eleventyConfig.addTransform("slavonicNumeralNoBreak", function(content, outputPath) {
    if (outputPath && outputPath.endsWith(".html")) {
      // Define the numeral pattern once
      const numeralPattern = '[а-ѱѡц][҃҂]+[а-ѱѡц҃҂]*\\.?:?';
      const liturgicalTerms = [
        'а҆нтїфѡ́нъ',
        'глава̀',
        'гла́съ',
        'зача́ло',
        'і҆́косъ',
        'каѳі́сма',
        'каѳі́смꙋ',
        'каѳі̑смы',
        'ли́стъ',
        'конда́къ',
        'мета̑нїѧ',
        'мине́и',
        'Мч҃нчны',
        'мл҃тва',
        'на',
        'пѣ́снь',
        'покло́ны',
        'самогла́сны',
        'ст\\.',
        'Сті́хъ',
        'стїхѡ́въ',
        'трипѣ́снца',
        'ча́съ',
        'ѱало́мъ',
        'ѱалма̀'
      ].join('|');

      // Only target specific liturgical contexts to avoid widespread &nbsp; pollution
      // Pattern: liturgical terms followed by space and numeral
      // Match only when preceded by whitespace, start of line, or HTML tag to avoid matching parts of words
      content = content.replace(
        new RegExp(`(^|\\s|>)(${liturgicalTerms})\\s+(${numeralPattern})`, 'gi'),
        '$1$2&nbsp;$3'
      );

      // Pattern: comma followed by space and numeral (only in specific contexts)
      // Match only when preceded by whitespace, start of line, or HTML tag to avoid matching parts of words
      content = content.replace(
        new RegExp(`(^|\\s|>)(${liturgicalTerms}),\\s+(${numeralPattern})`, 'gi'),
        '$1$2,&nbsp;$3'
      );
    }
    return content;
  });

  // Enhanced transform to handle fold sections with styled summaries - CLEAN VERSION
  eleventyConfig.addTransform("foldSections", function(content, outputPath) {
    if (outputPath && outputPath.endsWith(".html")) {

      // Helper function to add end marker for long folds
      const addEndMarker = (foldContent) => {
        const threshold = 0; // characters
        return foldContent.length > threshold
          ? foldContent + '<div class="fold-end-marker" data-fold-toggle onclick="">▲</div>'
          : foldContent;
      };

      // FIRST PASS: Process inner/nested folds with [[fold]] syntax
      // These can appear inside regular {fold} sections

      // Handle styled nested fold sections with dash syntax (open variant)
      content = content.replace(
        /\[\[fold-(red|rubric|h1|h2|toc)-open:([^\]]+)\]\]([\s\S]*?)\[\[\/fold\]\]/g,
        function(match, style, summary, foldContent) {
          const contentWithMarker = addEndMarker(foldContent);
          return `<details open><summary><span class="triangle">▶</span><span class="summary-${style}">${summary}</span></summary>${contentWithMarker}</details>`;
        }
      );

      // Handle styled nested fold sections with dash syntax (closed variant)
      content = content.replace(
        /\[\[fold-(red|rubric|h1|h2|toc):([^\]]+)\]\]([\s\S]*?)\[\[\/fold\]\]/g,
        function(match, style, summary, foldContent) {
          const contentWithMarker = addEndMarker(foldContent);
          return `<details><summary><span class="triangle">▶</span><span class="summary-${style}">${summary}</span></summary>${contentWithMarker}</details>`;
        }
      );

      // Handle open nested sections with default styling
      content = content.replace(
        /\[\[fold-open:([^\]]+)\]\]([\s\S]*?)\[\[\/fold\]\]/g,
        function(match, summary, foldContent) {
          const contentWithMarker = addEndMarker(foldContent);
          return `<details open><summary><span class="triangle">▶</span><span class="summary-default">${summary}</span></summary>${contentWithMarker}</details>`;
        }
      );

      // Handle closed nested sections with default styling
      content = content.replace(
        /\[\[fold:([^\]]+)\]\]([\s\S]*?)\[\[\/fold\]\]/g,
        function(match, summary, foldContent) {
          const contentWithMarker = addEndMarker(foldContent);
          return `<details><summary><span class="triangle">▶</span><span class="summary-default">${summary}</span></summary>${contentWithMarker}</details>`;
        }
      );

      // SECOND PASS: Process outer folds with {fold} syntax (original code)

      // Handle styled fold sections with dash syntax
      // Pattern: {fold-red:text}, {fold-rubric:text}, {fold-toc:text}, etc.
      content = content.replace(
        /\{fold-(red|rubric|h1|h2|toc)-open:([^}]+)\}([\s\S]*?)\{\/fold\}/g,
        function(match, style, summary, foldContent) {
          const contentWithMarker = addEndMarker(foldContent);
          return `<details open><summary><span class="triangle">▶</span><span class="summary-${style}">${summary}</span></summary>${contentWithMarker}</details>`;
        }
      );

      content = content.replace(
        /\{fold-(red|rubric|h1|h2|toc):([^}]+)\}([\s\S]*?)\{\/fold\}/g,
        function(match, style, summary, foldContent) {
          const contentWithMarker = addEndMarker(foldContent);
          return `<details><summary><span class="triangle">▶</span><span class="summary-${style}">${summary}</span></summary>${contentWithMarker}</details>`;
        }
      );

      // Handle open sections with default styling
      content = content.replace(
        /\{fold-open:([^}]+)\}([\s\S]*?)\{\/fold\}/g,
        function(match, summary, foldContent) {
          const contentWithMarker = addEndMarker(foldContent);
          return `<details open><summary><span class="triangle">▶</span><span class="summary-default">${summary}</span></summary>${contentWithMarker}</details>`;
        }
      );

      // Handle closed sections with default styling
      content = content.replace(
        /\{fold:([^}]+)\}([\s\S]*?)\{\/fold\}/g,
        function(match, summary, foldContent) {
          const contentWithMarker = addEndMarker(foldContent);
          return `<details><summary><span class="triangle">▶</span><span class="summary-default">${summary}</span></summary>${contentWithMarker}</details>`;
        }
      );

      // FINAL CLEANUP: Fix paragraph wrapping that breaks triangle rotation
      // Remove <p> tags immediately before <details> and </p> tags immediately after </details>
      content = content.replace(/<p>(<details[^>]*>)/g, '$1');
      content = content.replace(/(<\/details>)<\/p>/g, '$1');

      return content;
    }
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
