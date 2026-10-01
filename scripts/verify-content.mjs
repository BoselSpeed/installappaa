// Validates src/data/books.js against the files actually on disk.
//
// A typo in a bundled pdfUrl or a coverImage path shows up in the app as a dead
// volume or a broken image, and nothing else complains — /covers/thalathat-
// al-usul.jpg shipped that way for a while. This turns that class of mistake
// into a failed command you can run before committing.
//
//   npm run verify:content
//
// Checks:
//   - every bundled volume's pdfUrl exists in /public/books
//   - every coverImage exists in /public/covers
//   - every volume has at least one usable source
//   - book ids and volume ids are unique
//   - ar/en text fields come in pairs (an unpaired field silently disappears
//     from the UI in one language)
//   - volumes declared inside a zip-sourced book all carry a member `path`

import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const PUBLIC = resolve(ROOT, 'public');

// books.js is plain data with a single export; strip it so it can be imported.
const booksPath = resolve(ROOT, 'src/data/books.js');
const source = readFileSync(booksPath, 'utf8');
const start = source.indexOf('const SEED_BOOKS = [');
const end = source.indexOf('\n];', start) + 3;
if (start < 0 || end < 3) {
  console.error('Could not locate SEED_BOOKS in src/data/books.js');
  process.exit(1);
}
const dataUrl = `data:text/javascript;base64,${Buffer.from(`${source.slice(start, end)}\nexport default SEED_BOOKS;`).toString('base64')}`;
const { default: books } = await import(dataUrl);

const errors = [];
const warnings = [];
const error = (msg) => errors.push(msg);
const warn = (msg) => warnings.push(msg);

const isHttp = (value) => typeof value === 'string' && /^https?:\/\//i.test(value);

const publicFile = (path) => {
  if (typeof path !== 'string' || !path.startsWith('/')) return null;
  return resolve(PUBLIC, `.${path}`);
};

const seenBookIds = new Set();
const categories = new Map();
const volumeNumbers = new Map();

for (const book of books) {
  const label = book.id || '<missing id>';

  if (!book.id) error('a book entry has no id');
  if (seenBookIds.has(book.id)) error(`duplicate book id "${book.id}"`);
  seenBookIds.add(book.id);

  // Localization parity: an ar field with no en counterpart renders as nothing
  // for English readers, and vice versa.
  for (const field of [
    'title',
    'author',
    'muhaqqiq',
    'publisher',
    'translator',
    'description',
    'category',
    'madhab',
    'language',
    'edition',
    'year'
  ]) {
    const ar = book[`${field}_ar`];
    const en = book[`${field}_en`];
    if (typeof ar === 'string' && ar.trim() && !String(en ?? '').trim()) {
      warn(`"${label}" has ${field}_ar but no ${field}_en`);
    }
    if (typeof en === 'string' && en.trim() && !String(ar ?? '').trim()) {
      warn(`"${label}" has ${field}_en but no ${field}_ar`);
    }
  }

  if (!book.category_ar) error(`"${label}" has no category_ar`);
  else categories.set(book.category_ar, (categories.get(book.category_ar) || 0) + 1);

  if (book.coverImage) {
    const file = publicFile(book.coverImage);
    if (!file) error(`"${label}" coverImage is not a local path: ${book.coverImage}`);
    else if (!existsSync(file)) error(`"${label}" cover not found: ${book.coverImage}`);
  }

  if (!Array.isArray(book.volumes) || book.volumes.length === 0) {
    error(`"${label}" has no volumes`);
    continue;
  }

  const zipSource = book.source?.type === 'zip';
  if (zipSource && !isHttp(book.source.url)) {
    error(`"${label}" declares a zip source with no http url`);
  }

  const seenVolumeIds = new Set();
  for (const volume of book.volumes) {
    const vlabel = `${label}/${volume.id || '<missing id>'}`;

    if (!volume.id) error(`a volume of "${label}" has no id`);
    if (seenVolumeIds.has(volume.id)) error(`duplicate volume id "${volume.id}" in "${label}"`);
    seenVolumeIds.add(volume.id);

    if (!Number.isFinite(volume.number)) {
      warn(`"${vlabel}" has no numeric "number"`);
    } else {
      const list = volumeNumbers.get(label) || [];
      if (list.includes(volume.number)) error(`duplicate volume number ${volume.number} in "${label}"`);
      list.push(volume.number);
      volumeNumbers.set(label, list);
    }

    // zip members live inside the archive, so `path` is their source; anything
    // else needs a direct or storage URL.
    const sources = [
      volume.pdfUrl,
      volume.downloadUrl,
      volume.storagePath,
      zipSource && volume.path
    ].filter(Boolean);
    if (sources.length === 0) {
      error(`"${vlabel}" has no pdfUrl, downloadUrl, storagePath or path`);
    }

    if (zipSource && !volume.pdfUrl && !volume.downloadUrl && !volume.storagePath && !volume.path) {
      error(`"${vlabel}" is inside a zip archive but has no member path`);
    }

    if (volume.bundled) {
      if (!volume.pdfUrl) {
        error(`"${vlabel}" is bundled but has no pdfUrl`);
      } else {
        const file = publicFile(volume.pdfUrl);
        if (!file) error(`"${vlabel}" bundled pdfUrl is not a local path: ${volume.pdfUrl}`);
        else if (!existsSync(file)) error(`"${vlabel}" bundled PDF not found: ${volume.pdfUrl}`);
      }
    }

    if (!volume.downloadUrl && !volume.storagePath && !volume.pdfUrl && !volume.path) {
      error(`"${vlabel}" cannot be fetched from anywhere`);
    }

    if (isHttp(volume.pdfUrl)) warn(`"${vlabel}" pdfUrl is remote but marked bundled`);
  }
}

// Cross-check the sections in the demo service against the library, so books
// cannot silently become unreachable from /sections.
try {
  const mockPath = resolve(ROOT, 'src/firebase/mockService.js');
  const mock = readFileSync(mockPath, 'utf8');
  const sStart = mock.indexOf('const seedSections = [');
  const sEnd = mock.indexOf('\n];', sStart) + 3;
  if (sStart >= 0 && sEnd > 3) {
    const sectionsUrl = `data:text/javascript;base64,${Buffer.from(
      `${mock.slice(sStart, sEnd)}\nexport default seedSections;`
    ).toString('base64')}`;
    const { default: sections } = await import(sectionsUrl);
    const bookIds = new Set(books.map((b) => b.id));
    const categorySections = new Set(
      sections.filter((s) => !bookIds.has(s.id)).map((s) => s.title_ar)
    );
    for (const category of categories.keys()) {
      if (!categorySections.has(category)) {
        error(`category "${category}" has no section, so its books are unreachable from /sections`);
      }
    }
    for (const section of sections) {
      if (bookIds.has(section.id)) continue;
      if (!categories.has(section.title_ar)) {
        error(`section "${section.id}" ("${section.title_ar}") matches no book category`);
      }
    }
  }
} catch (error_) {
  warn(`could not cross-check seedSections: ${error_.message}`);
}

const bookCount = books.length;
const volumeCount = books.reduce((sum, b) => sum + (b.volumes?.length || 0), 0);

if (warnings.length > 0) {
  console.warn(`\n${warnings.length} warning(s):`);
  for (const message of warnings) console.warn(`  - ${message}`);
}

if (errors.length > 0) {
  console.error(`\n${errors.length} error(s):`);
  for (const message of errors) console.error(`  - ${message}`);
  console.error('');
  process.exit(1);
}

console.log(
  `books.js OK — ${bookCount} books, ${volumeCount} volumes, ${categories.size} categories, ` +
    `${warnings.length} warning(s).`
);
