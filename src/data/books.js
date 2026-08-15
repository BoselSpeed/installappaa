// ---------------------------------------------------------------------------
// Books data — the single source of truth for the library content.
//
// How to add / edit books (no app rebuild needed, just this file):
//   1. Copy one of the entries below.
//   2. Fill in the fields (any field you leave empty will simply be hidden
//      in the UI — nothing is deleted or broken).
//   3. For each volume, provide a PDF:
//        - Volume 1 should be `bundled: true` with a `pdfUrl` pointing to a
//          file inside /public/books/ so it ships with the app and works
//          offline.
//        - Later volumes should be `bundled: false` with a `downloadUrl`
//          (a direct https link to the PDF). They are downloaded on demand
//          and saved locally on the device.
//   4. Put any cover image in /public/covers/ and reference it with
//      `coverImage` (or leave it null and a styled placeholder is shown).
//
// The demo (mock) service reads this file and merges it with any books added
// through the books service API, so nothing that exists is ever replaced.
// ---------------------------------------------------------------------------

const SEED_BOOKS = [
  {
    id: 'kitab-al-tawhid',
    title_ar: 'كتاب التوحيد',
    title_en: 'Kitab al-Tawhid',
    author_ar: 'الإمام محمد بن عبد الوهاب',
    author_en: 'Imam Muhammad ibn Abd al-Wahhab',
    muhaqqiq_ar: '',
    muhaqqiq_en: '',
    translator_ar: '',
    translator_en: '',
    publisher_ar: '',
    publisher_en: '',
    edition_ar: '',
    edition_en: '',
    year_ar: '',
    year_en: '',
    language_ar: 'العربية',
    language_en: 'Arabic',
    category_ar: 'التوحيد والعقيدة',
    category_en: 'Tawhid and Aqeedah',
    madhab_ar: '',
    madhab_en: '',
    description_ar:
      'كتاب للإمام المجدد محمد بن عبد الوهاب في توحيد العبادة وما يناقضه من الشرك الأكبر والأصغر، مع أدلته من الكتاب والسنة وآثار السلف، وبيان ما يجب على العبد من توحيد الله وحده.',
    description_en:
      'A book by the Reviver Imam Muhammad ibn Abd al-Wahhab on the oneness of worship (Tawhid) and what negates it of major and minor shirk, with evidence from the Quran, Sunnah, and the Salaf, explaining what is incumbent upon the servant in singling out Allah alone.',
    coverImage: '/covers/kitab-al-tawhid.svg',
    order: 1,
    volumes: [
      {
        id: 'v1',
        number: 1,
        title_ar: 'المجلد الأول',
        title_en: 'Volume 1',
        bundled: true,
        pdfUrl: '/books/kitab-al-tawhid.pdf',
        downloadUrl: null,
        sizeMb: 2.9
      }
    ]
  },
  {
    id: 'thalatha-al-usul',
    title_ar: 'متن ثلاثة الأصول وأدلتها',
    title_en: 'Thalathat al-Usul',
    author_ar: 'الإمام محمد بن عبد الوهاب',
    author_en: 'Imam Muhammad ibn Abd al-Wahhab',
    muhaqqiq_ar: '',
    muhaqqiq_en: '',
    translator_ar: '',
    translator_en: '',
    publisher_ar: '',
    publisher_en: '',
    edition_ar: '',
    edition_en: '',
    year_ar: '',
    year_en: '',
    language_ar: 'العربية',
    language_en: 'Arabic',
    category_ar: 'التوحيد والعقيدة',
    category_en: 'Tawhid and Aqeedah',
    madhab_ar: '',
    madhab_en: '',
    description_ar:
      'متن للإمام محمد بن عبد الوهاب في الأصول الثلاثة التي يجب على كل مسلم معرفتها والعمل بها: معرفة العبد ربه، ومعرفة دينه، ومعرفة نبيه ﷺ، مع أدلتها من الكتاب والسنة.',
    description_en:
      'A text by Imam Muhammad ibn Abd al-Wahhab on the three fundamentals every Muslim must know and act upon: knowing his Lord, his religion, and his Prophet, with their evidences from the Quran and Sunnah.',
    coverImage: '/covers/thalathat-al-usul.svg',
    order: 2,
    volumes: [
      {
        id: 'v1',
        number: 1,
        title_ar: 'المجلد الأول',
        title_en: 'Volume 1',
        bundled: true,
        pdfUrl: '/books/thalathat-al-usul.pdf',
        downloadUrl: null,
        sizeMb: 2.4
      }
    ]
  },
  {
    id: 'al-aqidah-al-wasitiyyah',
    title_ar: 'العقيدة الواسطية',
    title_en: 'Al-Aqidah al-Wasitiyyah',
    author_ar: 'شيخ الإسلام ابن تيمية',
    author_en: "Shaykh al-Islam Ibn Taymiyyah",
    muhaqqiq_ar: '',
    muhaqqiq_en: '',
    translator_ar: '',
    translator_en: '',
    publisher_ar: '',
    publisher_en: '',
    edition_ar: '',
    edition_en: '',
    year_ar: '',
    year_en: '',
    language_ar: 'العربية',
    language_en: 'Arabic',
    category_ar: 'التوحيد والعقيدة',
    category_en: 'Tawhid and Aqeedah',
    madhab_ar: '',
    madhab_en: '',
    description_ar:
      'رسالة لشيخ الإسلام ابن تيمية في بيان عقيدة أهل السنة والجماعة في أسماء الله وصفاته والقدر والإيمان واليوم الآخر، بأسلوب يعتمد على نصوص الكتاب والسنة وإجماع السلف.',
    description_en:
      "A treatise by Shaykh al-Islam Ibn Taymiyyah expounding the creed of Ahl al-Sunnah wal-Jama'ah regarding Allah's names and attributes, Qadar, faith, and the Hereafter, grounded in the Quran, Sunnah, and the consensus of the Salaf.",
    coverImage: '/covers/al-aqidah-al-wasitiyyah.svg',
    order: 3,
    volumes: [
      {
        id: 'v1',
        number: 1,
        title_ar: 'المجلد الأول',
        title_en: 'Volume 1',
        bundled: true,
        pdfUrl: '/books/al-aqidah-al-wasitiyyah.pdf',
        downloadUrl: null,
        sizeMb: 2.2
      }
    ]
  },
  {
    id: 'kashf-al-shubuhat',
    title_ar: 'كتاب كشف الشبهات',
    title_en: 'Kashf al-Shubuhat',
    author_ar: 'الإمام محمد بن عبد الوهاب',
    author_en: 'Imam Muhammad ibn Abd al-Wahhab',
    muhaqqiq_ar: '',
    muhaqqiq_en: '',
    translator_ar: '',
    translator_en: '',
    publisher_ar: '',
    publisher_en: '',
    edition_ar: '',
    edition_en: '',
    year_ar: '',
    year_en: '',
    language_ar: 'العربية',
    language_en: 'Arabic',
    category_ar: 'التوحيد والعقيدة',
    category_en: 'Tawhid and Aqeedah',
    madhab_ar: '',
    madhab_en: '',
    description_ar:
      'رسالة للإمام محمد بن عبد الوهاب تكشف الشبهات التي يثيرها المخالفون حول التوحيد وعبادة الله وحده، مع الرد عليها بالأدلة من الكتاب والسنة.',
    description_en:
      "A treatise by Imam Muhammad ibn Abd al-Wahhab unveiling the ambiguities raised against Tawheed and the worship of Allah alone, responding to them with evidence from the Quran and Sunnah.",
    coverImage: '/covers/kashf-al-shubuhat.svg',
    order: 4,
    volumes: [
      {
        id: 'v1',
        number: 1,
        title_ar: 'المجلد الأول',
        title_en: 'Volume 1',
        bundled: true,
        pdfUrl: '/books/kashf-al-shubuhat.pdf',
        downloadUrl: null,
        sizeMb: 3.1
      }
    ]
  }
];

export { SEED_BOOKS };
