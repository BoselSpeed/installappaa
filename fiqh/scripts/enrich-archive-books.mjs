// ---------------------------------------------------------------------------
// enrich-archive-books.mjs
//
// Gives the archive.org-imported books that still carry an identifier as their
// title (e.g. "01-3742", "Bmtssimh") a real title and author, read out of the
// book's own OCR text.
//
//   node scripts/enrich-archive-books.mjs --report report.json
//   node scripts/enrich-archive-books.mjs --apply report.json
//
// How it works:
//   1. selects every book in src/data/books.js whose title is still the raw
//      identifier (a "garbage" title) — or, with --id, an explicit list;
//   2. for each, reads the item's OCR text from archive.org. Every scanned
//      item ships a `<name>_djvu.txt` derivative (the whole book OCR'd); the
//      first ~80 KB is enough to cover the cover, title page and catalog page;
//   3. extracts the most likely title and author from that text using the
//      signals Arabic title pages actually leave behind:
//        - the CIP block ("فهرسة مكتبة ... أثناء النشر" / "رقم الإيداع" /
//          "ردمك"), which prints the title cleanly on machine-set pages;
//        - the title page itself, a clean Arabic line near the top;
//        - the author, read from the CIP block or from a "تأليف" line;
//   4. scores each candidate with a confidence level and a quality gate, so
//      garbled OCR is *not* written over a neutral placeholder. `--report`
//      writes the candidates for review; `--apply` writes the reviewed file
//      back into books.js.
//
// Why only some books get better titles: many items are old scans whose title
// page was set in decorative type the OCR turned into gibberish, and their
// archive.org metadata carries nothing but the identifier. For those the
// placeholder is kept rather than a wrong title invented.
//
// Options:
//   --report <file>       write candidates (id, current title, title, author,
//                         confidence, context) to <file> and write nothing
//   --apply <file>        read a reviewed <file> and write it into books.js
//   --id <a,b,c>          only these book ids
//   --limit <n>           only the first n candidates (trial run)
//   --concurrency <n>     parallel archive.org requests (default 8)
//   --dry-run             with --apply: show what would change, write nothing
// ---------------------------------------------------------------------------

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const BOOKS_PATH = resolve(ROOT, 'src/data/books.js');
const OCR_HEAD = 80000; // bytes of `_djvu.txt` that cover front matter

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const option = (name, fallback = null) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : fallback;
};
const flag = (name) => args.includes(`--${name}`);

const reportPath = option('report');
const applyPath = option('apply');
const onlyIds = (option('id', '') || '').split(',').map((s) => s.trim()).filter(Boolean);
const limit = Number(option('limit', '0')) || 0;
const concurrency = Math.max(1, Number(option('concurrency', '8')) || 8);
const dryRun = flag('dry-run');

if (!reportPath && !applyPath) {
  console.error('Pass --report <file> to collect candidates or --apply <file> to write them.');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Text handling — the OCR is noisy, so normalise before judging anything.
// ---------------------------------------------------------------------------

const ARABIC = /[\u0600-\u06FF]/;

const arabicLetters = (s) => (s.match(/[\u0600-\u06FF]/g) || []).length;
const arabicRatio = (s) => arabicLetters(s) / Math.max(1, s.length);

/** Strip diacritics/tatweel, fold alef variants, and drop punctuation. */
function normalise(line) {
  return line
    .replace(/[\u064B-\u0652\u0670\u0640]/g, '')
    .replace(/[\u0622\u0623\u0625\u0671]/g, 'ا')
    .replace(/\u0649/g, 'ي')
    .replace(/[«»"'`“”\u00AB\u00BB]/g, '')
    .replace(/[\(\)\[\]]/g, ' ')
    .replace(/[.,،؛:.!؟؛]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Front-matter and publisher boilerplate — never a title. */
const BOILERPLATE =
  /الجامعة|الجامعية|النشر|المكتبة|مكتبة|الرياض|بيروت|جدة|مكة|المدينة|هاتف|فاكس|الطبعة|طبعة|الإيداع|الايداع|ردمك|فهرسة|حقوق|محفوظة|ISBN|المملكة|والتوزيع|التوزيع|بسم الله|الحمد لله|إن الحمد|أما بعد|عمادة|كلية|المعهد|المركز|رقم|الإصدار|وزارة|الشئون|الشؤون|للنشر|دار |السعودية|الأردن|مصر|القاهرة|اهداء|إهداء|الباحث|الطالب|الدرجة|ماجستير|دكتوراه|رسالة علمية|مقدمة|مقدمة الكتاب/i;

/** Words that signal "this line is a book title". */
const TITLE_WORDS =
  /كتاب|شرح|مختصر|تهذيب|معجم|أصول|فقه|تفسير|أحكام|حدود|طبقات|سيرة|قواعد|مستدرك|مسند|سنن|صحيح|منهج|مجموع|رسالة|دراسة|تحليل|تحقيق|إتقان|اتقان|إحياء|احياء|زاد|عمدة|كافي|بداية|مغني|كنز|بلوغ|عون|فتح|تيسير|الرائد|الروض|التوحيد|العقيدة|التوحيد|الأدب|الادب|البلاغة|النحو|اللغة|القراءات|الفوائد|المحرر|التقرير|الكافي|شذا|إرواء|ارواء|الميزان|الدرر|الكواكب|الأنوار|الانوار|المناهل|البحر|الزهر|الثمر|اللطيف|الغريب|المقاصد|المقالات|المجالس|المناقب|الفضائل|الزهد|الرقائق|الأحكام|الجنایات|الجنایات|في|على|من|نحو/i;

/**
 * Lines that read as a clean, usable title (high Arabic ratio, sane length,
 * no digits, no long garbage tokens).
 */
function looksLikeTitle(line) {
  const t = normalise(line);
  if (t.length < 12 || t.length > 70) return false;
  if (arabicRatio(t) < 0.88) return false;
  if (/\d/.test(t)) return false;
  if (BOILERPLATE.test(t)) return false;
  const words = t.split(' ');
  if (words.length < 2 || words.length > 12) return false;
  if (words.some((w) => w.length > 18)) return false; // one long garbled token
  return TITLE_WORDS.test(t);
}

// ---------------------------------------------------------------------------
// Title / author extraction
// ---------------------------------------------------------------------------

/** The CIP ("فهرسة مكتبة ... أثناء النشر") block, when the page has one. */
function cipTitle(text) {
  const block = text.match(/(?:فهرسة|فهرس)[^\n]{0,60}?(?:أثناء|اثناء) النشر[\s\S]{0,1200}/);
  if (!block) return null;
  const lines = block[0].split(/\r?\n/).map(normalise).filter((l) => l.length > 8);
  const titleWords = /كتاب|شرح|مختصر|تهذيب|معجم|أصول|فقه|أحكام|طبقات|سيرة|قواعد|مستدرك|مسند|سنن|صحيح|في|على|منهج|مجموع|رسالة|دراسة|منهاج|تيسير|عون|فتح|مغني/;
  const candidates = lines.filter((l) => looksLikeTitle(l) && titleWords.test(l));
  if (!candidates.length) return null;
  candidates.sort((a, b) => b.length - a.length);
  return candidates[0];
}

/** The title page: the first clean, title-like line in the front matter. */
function titlePageLine(text) {
  const lines = text.split(/\r?\n/).slice(0, 24);
  for (const line of lines) if (looksLikeTitle(line)) return normalise(line);
  return null;
}

/**
 * The author. The CIP block prints it on the line before the title; failing
 * that, look for "تأليف: فلان" / "تأليف فلان" in the front matter.
 */
function extractAuthor(text, cipBlock) {
  if (cipBlock) {
    const lines = cipBlock.split(/\r?\n/).map(normalise).filter((l) => l.length > 6);
    const titleIdx = lines.findIndex((l) => looksLikeTitle(l));
    const before = titleIdx > 0 ? lines[titleIdx - 1] : null;
    if (before && arabicRatio(before) > 0.85 && before.split(' ').length >= 2 && !BOILERPLATE.test(before)) {
      // CIP author line is often "الفلان، ابن فلان" or "فلان، فلان"
      return before.replace(/\s*،\s*/g, '، ').slice(0, 60);
    }
  }
  const head = text.split(/\r?\n/).slice(0, 60);
  for (const line of head) {
    const m = normalise(line).match(/(?:تأليف|تاليف|لـ)?\s*:?[\s:]*(?:للشيخ|للإمام|للامام|للعلامة)?\s*([^\u0600-\u06FF]*(?:[\u0600-\u06FF]+(?:\s+(?:بن|ابن)\s+[\u0600-\u06FF]+){0,3}))/);
    if (m && /بن|ابن/.test(m[1])) {
      const a = m[1].trim();
      if (a.split(' ').length >= 3 && arabicRatio(a) > 0.9) return a.slice(0, 60);
    }
  }
  return '';
}

/** How trustworthy a candidate is. Only high/medium are written by --apply. */
function classify({ hasCip, title }) {
  const len = title.length;
  if (hasCip && len >= 14) return 'high';
  if (len >= 12 && arabicRatio(title) >= 0.9) return 'medium';
  return 'low';
}

// ---------------------------------------------------------------------------
// archive.org access
// ---------------------------------------------------------------------------

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJson(url, tries = 3) {
  let last;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'fiqh-title-enrich/1.0' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      last = e;
      await sleep(400 * (i + 1));
    }
  }
  throw last;
}

/** Read the first OCR_HEAD bytes of an item's `_djvu.txt`, aborting the rest. */
async function fetchOcrHead(identifier) {
  const meta = await getJson(`https://archive.org/metadata/${encodeURIComponent(identifier)}`);
  const files = meta.files || [];
  const djvu = files.find((f) => /_djvu\.txt$/i.test(String(f?.name || '')));
  if (!djvu) return null;
  const url =
    `https://archive.org/download/${encodeURIComponent(identifier)}/` +
    encodeURIComponent(djvu.name);
  for (let t = 0; t < 4; t++) {
    const ctrl = new AbortController();
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'fiqh-title-enrich/1.0' }, signal: ctrl.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const reader = res.body.getReader();
      const chunks = [];
      let len = 0;
      while (len < OCR_HEAD) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        len += value.length;
      }
      ctrl.abort();
      return Buffer.concat(chunks).slice(0, OCR_HEAD).toString('utf8');
    } catch (e) {
      ctrl.abort();
      if (t === 3) throw e;
      await sleep(500 * (t + 1));
    }
  }
  return null;
}

async function pool(items, n, fn) {
  let i = 0;
  const worker = async () => {
    while (i < items.length) {
      const k = i++;
      await fn(items[k], k);
    }
  };
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, worker));
}

// ---------------------------------------------------------------------------
// books.js
// ---------------------------------------------------------------------------

function loadBooks() {
  const src = readFileSync(BOOKS_PATH, 'utf8');
  const body = src.replace(/export\s*\{\s*SEED_BOOKS\s*\}\s*;?/, 'module.exports=SEED_BOOKS;');
  const mod = { exports: {} };
  // eslint-disable-next-line no-new-func
  new Function('module', 'exports', body)(mod, mod.exports);
  return { src, books: mod.exports };
}

/** A title that is still the raw identifier — nothing a human would call a name. */
function isIdentifierTitle(book) {
  const t = (book.title_ar || '').trim();
  if (!t) return true;
  if (t === book.id) return true;
  if (book.source?.identifier && t === book.source.identifier) return true;
  // mostly latin/digits/separators, or starts with a digit
  return /^[0-9]/.test(t) || /^[0-9a-zA-Z._\-\s]+$/.test(t);
}

const quote = (value) =>
  `'${String(value)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\r?\n/g, ' ')
    .replace(/[\u2028\u2029]/g, '')}'`;

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

async function main() {
  const { src, books } = loadBooks();

  let targets = books.filter(isIdentifierTitle);
  if (onlyIds.length) targets = targets.filter((b) => onlyIds.includes(b.id));
  if (limit > 0) targets = targets.slice(0, limit);
  console.log(`${targets.length} book(s) with an identifier as title.`);

  if (applyPath) {
    const reviewed = JSON.parse(readFileSync(resolve(applyPath), 'utf8'));
    const byId = new Map(reviewed.filter((r) => r.apply && r.title).map((r) => [r.id, r]));
    console.log(`${byId.size} reviewed title(s) to apply.`);
    let changed = 0;
    let updated = src;
    for (const book of books) {
      const r = byId.get(book.id);
      if (!r) continue;
      const nextTitle = r.title.replace(/'/g, "\\'");
      const nextAuthor = (r.author || '').replace(/'/g, "\\'");
      const marker = `  id: '${book.id.replace(/'/g, "\\'")}',`;
      const start = updated.indexOf(marker);
      if (start < 0) continue;
      const end = updated.indexOf('\n  },', start);
      if (end < 0) continue;
      let block = updated.slice(start, end);
      block = block
        .replace(/title_ar:\s*'[^']*'/, `title_ar: ${quote(r.title)}`)
        .replace(/title_en:\s*'[^']*'/, `title_en: ${quote(r.title)}`);
      if (nextAuthor) {
        block = block.replace(/author_ar:\s*'[^']*'/, `author_ar: ${quote(r.author)}`);
        if (/author_en:\s*'[^']*'/.test(block)) {
          block = block.replace(/author_en:\s*'[^']*'/, `author_en: ${quote(r.author)}`);
        }
      }
      updated = updated.slice(0, start) + block + updated.slice(end);
      changed++;
    }
    if (!dryRun) writeFileSync(BOOKS_PATH, updated);
    console.log(`${dryRun ? 'Would update' : 'Updated'} ${changed} book(s).`);
    console.log('Run "npm run verify:content" to validate the library.');
    return;
  }

  // report mode
  const rows = [];
  let failures = 0;
  await pool(targets, concurrency, async (book, index) => {
    const identifier = book.source?.identifier || book.id;
    try {
      const text = await fetchOcrHead(identifier);
      if (!text) {
        rows.push({ id: book.id, identifier, current: book.title_ar, skip: 'no-ocr' });
        return;
      }
      const cipBlock = text.match(/(?:فهرسة|فهرس)[^\n]{0,60}?(?:أثناء|اثناء) النشر[\s\S]{0,1200}/)?.[0] || '';
      const cip = cipTitle(text);
      const top = titlePageLine(text);
      const title = cip || top;
      if (!title) {
        rows.push({ id: book.id, identifier, current: book.title_ar, skip: 'no-candidate' });
        return;
      }
      const author = extractAuthor(text, cipBlock);
      const confidence = classify({ hasCip: Boolean(cip), title });
      rows.push({
        id: book.id,
        identifier,
        current: book.title_ar,
        title,
        author,
        confidence,
        method: cip ? 'cip' : 'title-page',
        apply: confidence !== 'low'
      });
    } catch (e) {
      failures++;
      rows.push({ id: book.id, identifier, current: book.title_ar, skip: `error: ${e.message}` });
    }
    if ((index + 1) % 25 === 0) console.log(`  ${index + 1}/${targets.length}`);
  });

  writeFileSync(resolve(reportPath), JSON.stringify(rows, null, 2));

  const applied = rows.filter((r) => r.apply);
  const skipped = rows.filter((r) => r.skip);
  console.log('\nSummary');
  console.log(`  candidates   : ${applied.length} (reviewed with apply: true)`);
  console.log(`  high         : ${rows.filter((r) => r.confidence === 'high').length}`);
  console.log(`  medium       : ${rows.filter((r) => r.confidence === 'medium').length}`);
  console.log(`  no candidate : ${skipped.filter((r) => r.skip === 'no-candidate').length}`);
  console.log(`  no OCR       : ${skipped.filter((r) => r.skip === 'no-ocr').length}`);
  console.log(`  failed       : ${failures}`);
  console.log(`\nWrote ${reportPath}. Review it, set "apply": true on the good rows, then run --apply.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
