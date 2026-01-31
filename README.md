# Книгополо́жница

A digital library of Church Slavonic liturgical texts, built as a static website using Eleventy (11ty).

## About

Knigopolozhnitsa (Church Slavonic: Книгополо́жница, meaning "Book Repository") is a personal collection of Orthodox Christian liturgical texts in Church Slavonic, including akathists, canons, the Psalter, prayers, and various liturgical services.

The site is optimised for reading on Apple devices (Mac, iPhone, iPad) with full offline support and mobile-friendly layout.

## Building the Site

### Prerequisites

- Node.js (v14 or higher)
- npm

### Installation

```bash
npm install
```

### Build

```bash
npx @11ty/eleventy
```

The generated site will be in the `_site/` directory.

### Development Server

```bash
npx @11ty/eleventy --serve
```

This will start a local development server with live reload.

## Features

- **Church Slavonic Typography**: Custom fonts and proper handling of Church Slavonic Unicode characters with combining diacritical marks
- **Transclusion System**: Reusable content with `transclude`, `transcludeSection`, and `transcludeLines` shortcodes
- **Folding Sections**: Collapsible content sections for improved reading experience
- **Illustrations**: SVG illustrations from the Orthodox Illustration Project
- **Hierarchical Navigation**: Complex navigation system using frontmatter
- **Offline Reading**: Designed to work fully offline once loaded

## Credits

### Texts
Texts compiled and prepared by Alexander Semeniuk (https://www.alexsem.org)

### Fonts
Church Slavonic fonts provided by the [Ponomar Project](https://sci.ponomar.net/legal.html):
- Triodion Regular
- Vertograd Regular
- Oglavie Regular

### Illustrations
SVG illustrations from the [Orthodox Illustration Project](https://drive.google.com/file/d/18Z7G2KTbCaC6rDZSqBFVl8yTkqVHOZdI/view?usp=sharing) (see license document for terms)

## License

This work is licensed under a [Creative Commons Attribution 4.0 International License](LICENSE).

Copyright Alexander Semeniuk, 2026.
