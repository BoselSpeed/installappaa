# تطبيق الفقه — Islamic Fiqh Learning App

موسوعة كتب التوحيد والعقيدة والتفسير والحديث والأدب، تعمل بدون إنترنت.

An offline-first library of Tawhid, Aqeedah, Tafsir, Hadith and Adab books,
bilingual (Arabic / English, RTL default), shipping as an installable PWA and as
an Android APK built from the same web bundle.

## Quick start

```bash
npm install
npm run dev        # dev server on http://localhost:3000
```

| Script | What it does |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | Production build into `تطبيق الفقه/` |
| `npm run preview` | Preview the production build locally |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint over the app and scripts |
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
    appService.js      the data layer every page imports
    localService.js    the on-device store behind it (localStorage)
    volumeStorage.js   volume URL resolution + IndexedDB downloads
  hooks/               context providers and data hooks
  i18n/                ar.json / en.json
scripts/verify-content.mjs
android/               Capacitor Android project
docs/                  content management and deployment guides
```

## Adding or changing books

Everything lives in `src/data/books.js` — no code changes needed. See
[`docs/books-management.md`](docs/books-management.md) (Arabic and English) for
the field reference and the ways to supply a volume PDF.

After editing, run `npm run verify:content`: it checks that every bundled PDF and
cover actually exists in `public/`, that every volume has a reachable source,
that ids are unique, and that every category is reachable from `/sections`.

## Deployment

The build is entirely static — `تطبيق الفقه/` is the whole app, so any static
host or CDN works, and no server-side code is required. See
[`docs/deployment.md`](docs/deployment.md).

Only PDFs bundled under `public/books/` are readable inside the app, on the web
and in the Android build. Volumes hosted elsewhere are opened at their original
location, because a static site cannot fetch another origin.

Preview locally with:

```bash
npm run build
npm run preview      # http://localhost:4173
```

## Data and accounts

There is no backend and no account. Content and progress live in
`localStorage`, and downloaded volumes in IndexedDB, so the app works offline
and there are no credentials to configure.

## License

Unlicensed / private.
