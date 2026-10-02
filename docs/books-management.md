# إدارة الكتب — نظام الكتب والمجلدات

## عربي

هذا المستند يشرح كيفية إضافة وتعديل الكتب في التطبيق.

### أين تقع بيانات الكتب؟

كل الكتب تُدار من ملف واحد فقط:

```
src/data/books.js
```

التطبيق يقرأ هذا الملف ويبني مكتبة الكتب منه. إضافة كتاب جديد أو تعديل كتاب
موجود لا يتطلب تغيير أي كود آخر في التطبيق، فقط تعديل هذا الملف.

### بنية الكتاب

```js
{
  id: 'معرّف-فريد',          // معرّف الكتاب (لا تكرره مع كتاب آخر)
  title_ar: 'اسم الكتاب بالعربية',
  title_en: 'Book name in English',
  author_ar: 'اسم المؤلف',
  author_en: 'Author name',
  muhaqqiq_ar: 'المحقق',     // اتركه فارغًا إن لم يوجد
  muhaqqiq_en: '',
  translator_ar: 'المترجم',  // اتركه فارغًا إن لم يوجد
  translator_en: '',
  publisher_ar: 'الناشر',    // اختياري
  publisher_en: '',
  edition_ar: 'الطبعة',      // اختياري
  edition_en: '',
  year_ar: 'سنة النشر',      // اختياري
  year_en: '',
  language_ar: 'العربية',
  language_en: 'Arabic',
  category_ar: 'التصنيف',
  category_en: 'Category',
  madhab_ar: '',             // عند الحاجة فقط
  madhab_en: '',
  description_ar: 'نبذة عن الكتاب',
  description_en: 'Book description',
  coverImage: '/covers/اسم-الغلاف.svg', // ضع الصورة في public/covers/ أو اتركه null
  order: 5,                   // ترتيب ظهور الكتاب في المكتبة
  volumes: [
    // المجلد الأول — مدمج مع التطبيق (يعمل دون إنترنت)
    {
      id: 'v1',
      number: 1,
      title_ar: 'المجلد الأول',
      title_en: 'Volume 1',
      bundled: true,                       // مهم: true للمجلد المدمج
      pdfUrl: '/books/اسم-الملف.pdf',      // ضع ملف PDF في public/books/
      downloadUrl: null,
      sizeMb: 3.1                          // الحجم التقريبي
    },
    // المجلد الثاني — يُقرأ من موقعه الأصلي خارج التطبيق
    {
      id: 'v2',
      number: 2,
      title_ar: 'المجلد الثاني',
      title_en: 'Volume 2',
      bundled: false,                      // مهم: false للمجلدات غير المدمجة
      pdfUrl: null,
      downloadUrl: 'https://.../vol2.pdf', // رابط مباشر لملف PDF
      sizeMb: 150
    }
  ]
}
```

### مدمج أم غير مدمج؟ أهم نقطة في الملف

- **مجلد مدمج** (`bundled: true` مع `pdfUrl` يشير إلى ملف داخل `public/books/`)
  يُقرأ **داخل التطبيق**، وفي نسخة أندرويد عبر القارئ الأصلي، ويعمل دون
  إنترنت.
- **مجلد غير مدمج** (`bundled: false`) يُقرأ من موقعه الأصلي في المتصفح، ولا
  يُنزَّل إلى داخل التطبيق.

السبب أن المتصفح يمنع التطبيق من جلب ملفات من نطاق آخر (CORS)، وهذه النسخة من
التطبيق لا تحتوي على خادم وسيط يمكنه تجاوز ذلك. عرض زر «تنزيل» لمجلد لا يمكن
تنزيله كان سيعطي المستخدم زرًا لا ينجح أبدًا، لذا تعرض بطاقة المجلد بدلًا منه
شارة «يُفتح خارج التطبيق» وزر «فتح في المتصفح».

**لجعل مجلد يُقرأ داخل التطبيق:** ضع ملفه في `public/books/` واجعله
`bundled: true`.

### قواعد مهمة

1. **المجلد الأول** `bundled: true` مع `pdfUrl` يشير إلى ملف داخل
   `public/books/`.
2. أي مجلد تريد قراءته داخل التطبيق يجب أن يكون مدمجًا.
3. أي حقل تتركه فارغًا لن يظهر للمستخدم — لا شيء يُحذف ولا شيء ينكسر.
4. لا تغيّر `id` كتاب موجود إلا إذا أردت إنشاء كتاب جديد.
5. لا تحذف ملفات PDF الموجودة في `public/books/` ولا الملفات في `public/covers/`.
6. التطبيق لا يضيف الكتب أو يعدّلها تلقائيًا — أنت من يتحكم بالمحتوى بالكامل
   من خلال هذا الملف.
7. بعد أي تعديل شغّل `npm run verify:content` للتأكد من وجود كل ملف مذكور.

### كتاب كامل داخل أرشيف ZIP واحد على Google Drive (لمجلدات كثيرة)

رفع كل مجلدات الكتاب في ملف ZIP واحد على Google Drive يبقى وسيلة عملية للوصول
إليها، لكن التطبيق لن يستخرج منها المجلدات. وجّه الكتاب إلى صفحة Drive
مباشرة:

```js
{
  id: 'اسم-الكتاب',
  // ...
  source: {
    type: 'zip',
    // رابط صفحة Drive — يستخدمه التطبيق لفتح المجلد في المتصفح
    pageUrl: 'https://drive.google.com/file/d/FILE_ID/view'
  },
  volumes: [
    {
      id: 'v1',
      number: 1,
      bundled: true,                       // المجلد الأول مدمج مع التطبيق
      pdfUrl: '/books/اسم-الكتاب-v1.pdf', // ضعه في public/books/
      downloadUrl: null,
      path: '0001-0343.pdf',               // اسم الملف داخل الـ ZIP (توثيق فقط)
      sizeMb: 9.3
    },
    {
      id: 'v2',
      number: 2,
      bundled: false,
      pdfUrl: null,
      downloadUrl: null,
      path: '0344-0686.pdf',
      sizeMb: 8.5
    }
    // ... بقية المجلدات
  ]
}
```

المجلد الأول يُقرأ داخل التطبيق لأنه مدمج. أما بقية المجلدات فتفتح في صفحة
Drive عند الضغط عليها.

لماذا لا يستخرج التطبيق المجلد من الـ ZIP؟ لأن الاستخراج يحتاج طلبات `Range`،
والمتصفح يمنعها عبر CORS لأن `Range` ليس من الترويسات المسموح بها بلا خادم.
التوجيه إلى صفحة Drive أوضح للمستخدم من زر تنزيل لا ينجح.

الشروط المطلوبة:

1. **شارك ملف الـ ZIP بـ «أي شخص لديه الرابط»** (Viewer).
2. انسخ `FILE_ID` من رابط المشاركة: `https://drive.google.com/file/d/FILE_ID/view`.
3. انسخ اسم كل ملف داخل الـ ZIP **حرفًا بحرفًا** في حقل `path` (حقل توثيقي
   فقط، ودقته لا تؤثر على عمل التطبيق لأن القراءة تتم من صفحة Drive).
4. `bundled: true` للمجلد الأول فقط مع نسخة منه داخل `public/books/`؛ البقية
   `bundled: false` حتى لا يضخم حجم التطبيق.

---

### إضافة كتاب متعدد المجلدات (أي عدد من المجلدات)

أضف أي عدد تريده من الكائنات داخل مصفوفة `volumes` بالترتيب المطلوب. التطبيق
يعاملها كلها ككتاب واحد، ويعرضها داخل صفحة الكتاب الواحدة.

---

## English

This document explains how to add and edit books in the app.

### Where is the book data?

All books are managed from a single file:

```
src/data/books.js
```

The app reads this file to build the library. Adding a new book or editing an
existing one requires no other code changes — just edit this file.

### Adding books

Copy an existing entry from `src/data/books.js` and fill in the fields:

- `title_ar` / `title_en` — the book title in both languages.
- `author_ar` / `author_en` — the author.
- `muhaqqiq`, `translator`, `publisher`, `edition`, `year`, `language`,
  `category`, `madhab` — optional metadata (empty fields are hidden in the UI).
- `description_ar` / `description_en` — a short description.
- `coverImage` — put an image in `public/covers/` and reference it, or keep
  `null` for a styled placeholder.
- `order` — the book's position in the library.
- `volumes` — the volumes of the book:
  - **Bundled** (`bundled: true`) with a `pdfUrl` inside `public/books/` — opens
    in the app, in the Android native reader, and offline.
  - **Not bundled** (`bundled: false`) with a `downloadUrl` — opens at that URL
    in the browser. Not downloaded into the app.
  - **Whole book inside one ZIP on Google Drive** — set
    `source: { type: 'zip', pageUrl }` on the book and give each volume a `path`
    (the member filename inside the ZIP, for your own reference). Each
    unbundled volume opens the archive's Drive page.

### Rules

1. Keep volume 1 bundled with the app (offline-first).
2. Bundle any volume that must be readable inside the app.
3. Empty fields are hidden — nothing is deleted or broken.
4. Never change the `id` of an existing book unless creating a new one.
5. Never delete existing PDFs in `public/books/` or images in `public/covers/`.
6. The app never adds or edits books automatically — you control the content
   entirely through this file.
7. Run `npm run verify:content` after editing.