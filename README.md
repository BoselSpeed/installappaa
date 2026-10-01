# تطبيق الفقه — Islamic Fiqh Learning App

موسوعة كتب التوحيد والعقيدة والتفسير والحديث والأدب، تعمل بدون إنترنت.

An offline-first library of Tawhid, Aqeedah, Tafsir, Hadith and Adab books,
bilingual (Arabic / English, RTL default), shipping as an installable PWA and as
native Android and iOS builds from the same codebase.

## Quick start

```bash
npm install
npm run dev        # dev server on http://localhost:3000
```

| Script | What it does |
|---|---|
| `npm run dev` | Vite dev server (includes the download proxy) |
| `npm run build` | Production build into `تطبيق الفقه/` |
| `npm run preview` | Preview the build (Vite — proxy available) |
| `npm run serve` | **Serve the build in production** (static files + download proxy) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint over app, server and scripts |
| `npm run verify:content` | Validate `src/data/books.js` against `public/` |
| `npm run verify` | typecheck + lint + content check |
| `npm run android:apk` | Build the web app and assemble a debug APK |

## Layout

```
src/
  data/books.js        the entire library — 29 books / 146 volumes, the only
                       file you edit to add or change content
  pages/               14 routed screens
  components/
    UI/                design-system primitives
    Content/           feature components (PDF reader, volume cards, covers)
    Navigation/        nav bar, sidebar, footer
    ErrorBoundary.jsx  render-error containment
  services/
    zipRangeReader.js  pulls one PDF out of a remote ZIP via HTTP Range
    volumeStorage.js   IndexedDB store for downloaded volumes
    supabaseStorage.js volume URL resolution
  firebase/            Firestore/Auth wrappers + a localStorage demo service
  hooks/               context providers and data hooks
  i18n/                ar.json / en.json
server/serve.mjs       zero-dependency static server + /__drive-proxy
scripts/verify-content.mjs
android/               Capacitor Android project
ايفون/                  Capacitor iOS (Xcode) project
docs/                  content management and deployment guides
```

## Adding or changing books

Everything lives in `src/data/books.js` — no code changes needed. See
[`docs/books-management.md`](docs/books-management.md) (Arabic and English) for
the field reference and the three ways to supply a volume PDF.

After editing, run `npm run verify:content`: it checks that every bundled PDF and
cover actually exists in `public/`, that every volume has a reachable source,
that ids are unique, and that every category is reachable from `/sections`.

## Deployment

The web build needs one server-side endpoint beyond static hosting — see
[`docs/deployment.md`](docs/deployment.md). Without it, bundled volumes work
offline but downloading the rest of the library fails in the browser (the app
tells the reader so and offers the original file). The Android and iOS builds do
not need it: they download through the native HTTP client.

Quickest path:

```bash
npm run build
npm run serve        # http://localhost:4173
```

## Data and accounts

The app runs in demo mode out of the box: content and progress live in
`localStorage` and downloaded volumes in IndexedDB. It switches to real
Firebase and Supabase once you fill in `src/firebase/config.js` and
`src/supabase/config.js` — both are placeholders in this repository.

## License

Unlicensed / private.
