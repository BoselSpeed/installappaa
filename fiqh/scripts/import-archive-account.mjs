// ---------------------------------------------------------------------------
// import-archive-account.mjs
//
// Pulls every book an Internet Archive account has uploaded into
// src/data/books.js and saves the item cover of each book to public/covers/,
// so a whole account can be exercised as a download source without copying
// entries by hand.
//
//   node scripts/import-archive-account.mjs --uploader freework
//
// What it does:
//   1. lists every `mediatype:texts` item of the account (advancedsearch API);
//   2. reads each item's metadata to locate the PDFs inside it — when an item
//      ships both `<name>.pdf` (image container) and `<name>_text.pdf`
//      (scanned pages + OCR text layer) the text one wins, because the in-app
//      search reads that layer;
//   3. downloads https://archive.org/services/img/<id> as the book cover;
//   4. appends one book entry per item to src/data/books.js, using the
//      `source: { type: 'archive', identifier }` shape the app already knows.
//
// Books already present in books.js (same identifier) are skipped, so the
// script is safe to re-run after adding more items by hand.
//
// Options:
//   --uploader <name>      archive.org account whose items are imported
//   --category-ar <text>   Arabic category the imported books are filed under
//   --category-en <text>   English category label
//   --limit <n>            import only the first n items (trial run)
//   --concurrency <n>      parallel archive.org requests (default 10)
//   --dry-run              fetch and report, but write nothing
//
// The category must already exist as a seed section in
// src/services/localService.js, otherwise the books are unreachable from
// /sections (npm run verify:content fails on exactly that).
// ---------------------------------------------------------------------------

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const BOOKS_PATH = resolve(ROOT, 'src/data/books.js');
const SECTIONS_PATH = resolve(ROOT, 'src/services/localService.js');
const COVERS_DIR = resolve(ROOT, 'public/covers');

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const option = (name, fallback = null) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : fallback;
};
const flag = (name) => args.includes(`--${name}`);

const uploader = option('uploader', 'freework');
const categoryAr = option('category-ar', 'أرشيف الإنترنت');
const categoryEn = option('category-en', 'Internet Archive');
const limit = Number(option('limit', '0')) || 0;
const concurrency = Math.max(1, Number(option('concurrency', '10')) || 10);
const dryRun = flag('dry-run');

// ---------------------------------------------------------------------------
// archive.org access
// ---------------------------------------------------------------------------

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJson(url, tries = 3) {
  let lastError;
  for (let attempt = 0; attempt < tries; attempt++) {
    try {
      const response = await fetch(url, { headers: { 'User-Agent': 'fiqh-content-import/1.0' } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      lastError = error;
      await sleep(400 * (attempt + 1));
    }
  }
  throw lastError;
}

async function pool(items, limit_, fn) {
  const results = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await fn(items[index], index);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit_, items.length) }, worker));
  return results;
}

/**
 * Every `mediatype:texts` item of the account.
 *
 * Uses archive.org's cursor-based scrape API: plain advancedsearch paging is
 * scored, so pages overlap (the same identifier shows up twice) and a naive
 * "stop after numFound rows" loop silently misses items. The cursor never
 * repeats, and the seen-set keeps the list unique either way.
 */
async function listAccountItems(name) {
  const query = `uploader:"${name}" AND mediatype:texts`;
  const base =
    'https://archive.org/services/search/v1/scrape' +
    `?q=${encodeURIComponent(query)}&fields=identifier,title&count=1000`;
  const items = [];
  const seen = new Set();
  let cursor = null;
  for (let page = 0; page < 20; page++) {
    const url = cursor ? `${base}&cursor=${encodeURIComponent(cursor)}` : base;
    const data = await getJson(url);
    for (const doc of data?.items || []) {
      if (!doc?.identifier || seen.has(doc.identifier)) continue;
      seen.add(doc.identifier);
      items.push(doc);
    }
    cursor = data?.__cursor;
    if (!cursor) break;
  }
  return items;
}

// ---------------------------------------------------------------------------
// Metadata → book entry
// ---------------------------------------------------------------------------

const asText = (value) => {
  if (value == null) return '';
  if (Array.isArray(value)) return value.map(asText).filter(Boolean).join('، ');
  if (typeof value === 'object') return value.name ? String(value.name) : '';
  return String(value).trim();
};

const stripHtml = (value) =>
  asText(value)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const clip = (value, max = 600) =>
  value.length > max ? `${value.slice(0, max - 1).trimEnd()}…` : value;

const languagePair = (value) => {
  const raw = asText(value);
  if (!raw) return null;
  if (/[؀-ۿ]/.test(raw) || /arab|\bara\b/i.test(raw)) return ['العربية', 'Arabic'];
  if (/eng/i.test(raw)) return ['الإنجليزية', 'English'];
  return [raw, raw];
};

const yearPair = (value) => {
  const match = asText(value).match(/\b(1[0-9]{3}|20[0-9]{2})\b/);
  return match ? [match[1], match[1]] : ['', ''];
};

/**
 * The PDFs of an item, one per volume.
 *
 * archive.org derives two PDFs per scanned file: the image-only
 * `<name>.pdf` ("Image Container PDF") and `<name>_text.pdf` ("Additional
 * Text PDF"), which is the same page images plus an OCR text layer. The app
 * searches that layer, so the text derivative is preferred whenever both
 * exist.
 */
const pickPdfFiles = (files) => {
  const pdfs = (files || []).filter((file) => /\.pdf$/i.test(String(file?.name || '')));
  const textDerivatives = new Set(
    pdfs.filter((file) => /_text\.pdf$/i.test(file.name)).map((file) => file.name)
  );
  return pdfs
    .filter((file) => {
      if (/_text\.pdf$/i.test(file.name)) return true;
      const base = file.name.replace(/\.pdf$/i, '');
      return !textDerivatives.has(`${base}_text.pdf`);
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'en', { numeric: true, sensitivity: 'base' }));
};

const volumeTitle = (file, count) => {
  if (count === 1) return ['الكتاب كاملًا', 'Full Book'];
  const base = file.name
    .replace(/\.pdf$/i, '')
    .replace(/_text$/i, '')
    .replace(/[_-]+/g, ' ')
    .trim();
  return [base || file.name, base || file.name];
};

const sizeMb = (file) => {
  const bytes = Number(file?.size);
  if (!Number.isFinite(bytes) || bytes <= 0) return null;
  return Math.round((bytes / (1024 * 1024)) * 10) / 10;
};

function buildBook(item, metadata, order) {
  const identifier = item.identifier;
  const files = metadata?.files || [];
  const pdfs = pickPdfFiles(files);
  if (pdfs.length === 0) return { skip: 'no-pdf' };

  const meta = metadata?.metadata || {};
  const title = stripHtml(asText(item.title) || asText(meta.title) || identifier) || identifier;
  const author = stripHtml(meta.creator) || '';
  const description = clip(stripHtml(meta.description));
  // Items of a mostly-Arabic account often carry no `language` field; the
  // script of the title is the next best signal.
  const [languageAr, languageEn] =
    languagePair(meta.language) || (/[؀-ۿ]/.test(`${title}${author}`) ? ['العربية', 'Arabic'] : ['', '']);
  const [yearAr, yearEn] = yearPair(meta.year || meta.date);
  const publisher = stripHtml(meta.publisher) || '';

  const volumes = pdfs.map((file, index) => {
    const [titleAr, titleEn] = volumeTitle(file, pdfs.length);
    return {
      id: `v${index + 1}`,
      number: index + 1,
      title_ar: titleAr,
      title_en: titleEn,
      bundled: false,
      pdfUrl: null,
      downloadUrl: null,
      path: file.name,
      sizeMb: sizeMb(file)
    };
  });

  return {
    skip: null,
    book: {
      id: identifier,
      title_ar: title,
      title_en: title,
      author_ar: author,
      author_en: author,
      muhaqqiq_ar: '',
      muhaqqiq_en: '',
      translator_ar: '',
      translator_en: '',
      publisher_ar: publisher,
      publisher_en: publisher,
      edition_ar: '',
      edition_en: '',
      year_ar: yearAr,
      year_en: yearEn,
      language_ar: languageAr,
      language_en: languageEn,
      category_ar: categoryAr,
      category_en: categoryEn,
      madhab_ar: '',
      madhab_en: '',
      description_ar: description,
      description_en: description,
      coverImage: null,
      order,
      source: { type: 'archive', identifier },
      volumes
    }
  };
}

// ---------------------------------------------------------------------------
// books.js editing
// ---------------------------------------------------------------------------

const quote = (value) =>
  `'${String(value)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\r?\n/g, ' ')
    .replace(/[\u2028\u2029]/g, '')}'`;

const renderBook = (book) => {
  const lines = ['  {'];
  const scalar = (key, value) => lines.push(`    ${key}: ${quote(value ?? '')},`);
  [
    'id',
    'title_ar',
    'title_en',
    'author_ar',
    'author_en',
    'muhaqqiq_ar',
    'muhaqqiq_en',
    'translator_ar',
    'translator_en',
    'publisher_ar',
    'publisher_en',
    'edition_ar',
    'edition_en',
    'year_ar',
    'year_en',
    'language_ar',
    'language_en',
    'category_ar',
    'category_en',
    'madhab_ar',
    'madhab_en',
    'description_ar',
    'description_en'
  ].forEach((key) => scalar(key, book[key]));
  lines.push(`    coverImage: ${book.coverImage ? quote(book.coverImage) : null},`);
  lines.push(`    order: ${book.order},`);
  lines.push('    source: {');
  lines.push('      type: \'archive\',');
  lines.push(`      identifier: ${quote(book.source.identifier)}`);
  lines.push('    },');
  lines.push('    volumes: [');
  book.volumes.forEach((volume, index) => {
    const parts = [
      `id: ${quote(volume.id)}`,
      `number: ${volume.number}`,
      `title_ar: ${quote(volume.title_ar)}`,
      `title_en: ${quote(volume.title_en)}`,
      'bundled: false',
      'pdfUrl: null',
      'downloadUrl: null',
      `path: ${quote(volume.path)}`,
      volume.sizeMb == null ? 'sizeMb: null' : `sizeMb: ${volume.sizeMb}`
    ];
    const comma = index === book.volumes.length - 1 ? '' : ',';
    lines.push(`      { ${parts.join(', ')} }${comma}`);
  });
  lines.push('    ]');
  lines.push('  }');
  return lines.join('\n');
};

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

async function main() {
  const source = readFileSync(BOOKS_PATH, 'utf8');
  const start = source.indexOf('const SEED_BOOKS = [');
  const end = source.indexOf('\n];', start);
  if (start < 0 || end < 0) {
    console.error('Could not locate SEED_BOOKS in src/data/books.js');
    process.exit(1);
  }

  const existingIdentifiers = new Set();
  for (const match of source.matchAll(/identifier:\s*'([^']+)'/g)) existingIdentifiers.add(match[1]);
  const existingIds = new Set();
  for (const match of source.matchAll(/^ {4}id:\s*'([^']+)'/gm)) existingIds.add(match[1]);

  // The books are unreachable from /sections unless their category has a seed
  // section, so refuse to write content that verify:content would reject.
  const sections = readFileSync(SECTIONS_PATH, 'utf8');
  if (!sections.includes(`title_ar: '${categoryAr}'`)) {
    console.error(
      `Category "${categoryAr}" has no seed section in src/services/localService.js —\n` +
        'add one to seedSections first (title_ar must match exactly), then re-run.'
    );
    process.exit(1);
  }

  console.log(`Listing texts of archive.org account "${uploader}"…`);
  const items = await listAccountItems(uploader);
  console.log(`${items.length} text item(s) found.`);

  const pending = [];
  const queued = new Set();
  for (const item of items) {
    if (queued.has(item.identifier)) continue;
    if (existingIdentifiers.has(item.identifier) || existingIds.has(item.identifier)) continue;
    queued.add(item.identifier);
    pending.push(item);
  }
  const alreadyThere = items.length - pending.length;
  const queue = limit > 0 ? pending.slice(0, limit) : pending;
  console.log(`${alreadyThere} already in books.js, ${queue.length} to import.`);

  if (queue.length === 0) {
    console.log('Nothing to do.');
    return;
  }

  let nextOrder =
    Math.max(0, ...[...source.matchAll(/^ {4}order:\s*(\d+)/gm)].map((m) => Number(m[1]))) + 1;

  if (!dryRun) mkdirSync(COVERS_DIR, { recursive: true });

  console.log(`Reading item metadata (${concurrency} in parallel)…`);
  const built = [];
  let failures = 0;
  await pool(queue, concurrency, async (item, index) => {
    try {
      const metadata = await getJson(
        `https://archive.org/metadata/${encodeURIComponent(item.identifier)}`
      );
      const result = buildBook(item, metadata, nextOrder);
      if (result.skip) {
        built.push({ skip: result.skip, item });
      } else {
        nextOrder++;
        built.push({ book: result.book, item });
      }
    } catch (error) {
      failures++;
      built.push({ skip: `error: ${error.message}`, item });
    }
    if ((index + 1) % 100 === 0) console.log(`  ${index + 1}/${queue.length}`);
  });

  // Covers: the item tile, saved next to the app's own covers.
  const withCover = built.filter((entry) => entry.book);
  console.log(`Fetching ${withCover.length} cover(s)…`);
  let coversOk = 0;
  await pool(withCover, concurrency, async (entry) => {
    const safe = entry.book.id.replace(/[^A-Za-z0-9._-]/g, '_');
    const file = resolve(COVERS_DIR, `ia-${safe}.jpg`);
    const found = `/covers/ia-${safe}.jpg`;
    if (dryRun) {
      entry.book.coverImage = found;
      coversOk++;
      return;
    }
    if (existsSync(file)) {
      entry.book.coverImage = found;
      coversOk++;
      return;
    }
    try {
      const response = await fetch(
        `https://archive.org/services/img/${encodeURIComponent(entry.book.source.identifier)}`
      );
      const type = response.headers.get('content-type') || '';
      if (!response.ok || !type.startsWith('image/')) throw new Error(`${response.status} ${type}`);
      writeFileSync(file, Buffer.from(await response.arrayBuffer()));
      entry.book.coverImage = found;
      coversOk++;
    } catch (error) {
      entry.book.coverImage = null; // the UI falls back to the title placeholder
      console.warn(`  cover failed for ${entry.book.id}: ${error.message}`);
    }
  });

  const noCover = withCover.length - coversOk;
  const noPdf = built.filter((entry) => entry.skip === 'no-pdf');
  const skipped = built.filter((entry) => String(entry.skip || '').startsWith('error'));
  const created = built.filter((entry) => entry.book);

  if (dryRun) {
    console.log('\n[dry-run] nothing written.');
  } else if (created.length > 0) {
    const rendered = created.map((entry) => renderBook(entry.book));
    // Everything before the array's closing bracket, minus trailing space, plus
    // the new entries and — crucially — whatever followed the array (the
    // `export` line), which the slice above cut off.
    let updated = source.slice(0, end).replace(/\s*$/, '');
    if (!/,\s*$/.test(updated)) updated += ',';
    updated += `\n${rendered.join(',\n')}${source.slice(end)}`;
    writeFileSync(BOOKS_PATH, updated);
  }

  console.log('\nSummary');
  console.log(`  imported : ${created.length} book(s), orders ${nextOrder - created.length}–${nextOrder - 1}`);
  console.log(`  covers   : ${coversOk} resolved, ${noCover} without an image`);
  console.log(`  no PDF   : ${noPdf.length} item(s) skipped`);
  console.log(`  failed   : ${failures} request error(s)`);
  console.log(`  already  : ${alreadyThere} item(s) already in books.js`);

  if (noPdf.length > 0) {
    console.log('\nItems without any PDF (cannot be read or downloaded):');
    for (const entry of noPdf.slice(0, 30)) console.log(`  - ${entry.item.identifier}`);
    if (noPdf.length > 30) console.log(`  … and ${noPdf.length - 30} more`);
  }
  if (skipped.length > 0) {
    console.log('\nItems that failed:');
    for (const entry of skipped) console.log(`  - ${entry.item.identifier} (${entry.skip})`);
  }
  console.log('\nRun "npm run verify:content" to validate the library.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
