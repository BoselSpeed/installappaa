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
  madhab_ar: 'المذهب',       // عند الحاجة فقط
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
      bundled: true,                       // مهم: true للمجلد الأول
      pdfUrl: '/books/اسم-الملف.pdf',      // ضع ملف PDF في public/books/
      downloadUrl: null,
      sizeMb: 3.1                          // حجم الملف التقريبي
    },
    // المجلد الثاني — يُنزَّل من الإنترنت عند الطلب
    {
      id: 'v2',
      number: 2,
      title_ar: 'المجلد الثاني',
      title_en: 'Volume 2',
      bundled: false,                      // مهم: false للمجلدات الإضافية
      pdfUrl: null,
      downloadUrl: 'https://.../vol2.pdf', // رابط مباشر لملف PDF
      sizeMb: 150
    }
  ]
}
```

### قواعد مهمة

1. **المجلد الأول** دائماً `bundled: true` مع `pdfUrl` يشير إلى ملف داخل
   `public/books/` حتى يكون متوفرًا مع التطبيق دون إنترنت.
2. **المجلدات الأخرى** تكون `bundled: false` مع `downloadUrl` (رابط مباشر
   لملف PDF). عند الضغط على «تنزيل» يُحفظ الملف محليًا على الجهاز، ويمكن
   فتحه لاحقًا دون إنترنت.
3. أي حقل تتركه فارغًا لن يظهر للمستخدم — لا شيء يُحذف ولا شيء ينكسر.
4. لا تغيّر `id` كتاب موجود إلا إذا أردت إنشاء كتاب جديد.
5. لا تحذف ملفات PDF الموجودة في `public/books/` ولا الملفات في `public/covers/`.
6. التطبيق لا يضيف الكتب أو يعدّلها تلقائيًا — أنت من يتحكم بالمحتوى بالكامل
   من خلال هذا الملف.

### إضافة كتاب متعدد المجلدات (أي عدد من المجلدات)

أضف أي عدد تريده من الكائنات داخل مصفوفة `volumes` بالترتيب المطلوب
(المجلد الأول، ثم الثاني، ثم الثالث...). التطبيق يعاملها كلها ككتاب واحد،
ويعرضها داخل صفحة الكتاب الواحدة.

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
  - **Volume 1** must be `bundled: true` with a `pdfUrl` pointing to a PDF
    inside `public/books/`. It ships with the app and works offline.
  - **Later volumes** must be `bundled: false` with a `downloadUrl` (a direct
    link to the PDF). They are downloaded on demand and stored locally on the
    device, so they can be opened offline afterwards.

### Rules

1. Keep volume 1 bundled with the app (offline-first).
2. Volumes 2+ use `downloadUrl`; the app downloads and stores them locally.
3. Empty fields are hidden — nothing is deleted or broken.
4. Never change the `id` of an existing book unless creating a new one.
5. Never delete existing PDFs in `public/books/` or images in `public/covers/`.
6. The app never adds or edits books automatically — you control the content
   entirely through this file.
