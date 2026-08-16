// ---------------------------------------------------------------------------
// Books data — the single source of truth for the library content.
//
// How to add / edit books (no app rebuild needed, just this file):
//   1. Copy one of the entries below.
//   2. Fill in the fields (any field you leave empty will simply be hidden
//      in the UI — nothing is deleted or broken).
//   3. For each volume, provide a PDF in one of three ways:
//        - Volume 1 can be `bundled: true` with a `pdfUrl` pointing to a
//          file inside /public/books/ so it ships with the app and works
//          offline.
//        - A volume can have a `downloadUrl` (a direct https link to the
//          PDF). It is downloaded on demand and saved locally.
//        - If the whole book is hosted as ONE remote ZIP archive (e.g. on
//          Google Drive), set `source: { type: 'zip', url, pageUrl }` on the
//          book and give each volume a `path` (the member filename inside the
//          ZIP). The app downloads just that volume from the ZIP via HTTP
//          Range requests — the user never leaves the app.
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
  },
  {
    id: 'tafsir-al-baghawi',
    title_ar: 'معالم التنزيل في تفسير القرآن (تفسير البغوي)',
    title_en: "Ma'alim al-Tanzil (Tafsir al-Baghawi)",
    author_ar: 'أبو محمد الحسين بن مسعود البغوي',
    author_en: 'Abu Muhammad al-Husayn ibn Masud al-Baghawi',
    muhaqqiq_ar: '',
    muhaqqiq_en: '',
    translator_ar: '',
    translator_en: '',
    publisher_ar: 'دار طيبة',
    publisher_en: 'Dar Taybah',
    edition_ar: '',
    edition_en: '',
    year_ar: '',
    year_en: '',
    language_ar: 'العربية',
    language_en: 'Arabic',
    category_ar: 'التفسير',
    category_en: 'Tafsir',
    madhab_ar: '',
    madhab_en: '',
    description_ar:
      'تفسير جامع للإمام البغوي يجمع بين التفسير بالمأثور وعرض أقوال المفسرين بأسلوب متوسط، مع عناية بالقراءات وذكر أسباب النزول والأحكام المستنبطة.',
    description_en:
      "A comprehensive tafsir by Imam al-Baghawi combining transmitted interpretation with the views of early commentators in a moderate style, paying attention to the qira'at, occasions of revelation, and derived rulings.",
    coverImage: '/covers/tafsir-al-baghawi.svg',
    order: 5,
    source: {
      type: 'zip',
      url: 'https://drive.usercontent.google.com/download?id=1FcgySndQ_tGecVHcl1Axu5bcjBdzajuF&export=download&confirm=t',
      pageUrl: 'https://drive.google.com/file/d/1FcgySndQ_tGecVHcl1Axu5bcjBdzajuF/view'
    },
    volumes: [
      { id: 'v1', number: 1, title_ar: 'الجزء ١', title_en: 'Part 1', bundled: false, pdfUrl: null, downloadUrl: null, path: '0001-0343.pdf', sizeMb: 9.3 },
      { id: 'v2', number: 2, title_ar: 'الجزء ٢', title_en: 'Part 2', bundled: false, pdfUrl: null, downloadUrl: null, path: '0344-0686.pdf', sizeMb: 8.5 },
      { id: 'v3', number: 3, title_ar: 'الجزء ٣', title_en: 'Part 3', bundled: false, pdfUrl: null, downloadUrl: null, path: '0687-1029.pdf', sizeMb: 8.5 },
      { id: 'v4', number: 4, title_ar: 'الجزء ٤', title_en: 'Part 4', bundled: false, pdfUrl: null, downloadUrl: null, path: '1030-1372.pdf', sizeMb: 8.7 },
      { id: 'v5', number: 5, title_ar: 'الجزء ٥', title_en: 'Part 5', bundled: false, pdfUrl: null, downloadUrl: null, path: '1373-1715.pdf', sizeMb: 8.0 },
      { id: 'v6', number: 6, title_ar: 'الجزء ٦', title_en: 'Part 6', bundled: false, pdfUrl: null, downloadUrl: null, path: '1716-2058.pdf', sizeMb: 8.4 },
      { id: 'v7', number: 7, title_ar: 'الجزء ٧', title_en: 'Part 7', bundled: false, pdfUrl: null, downloadUrl: null, path: '2059-2401.pdf', sizeMb: 8.2 },
      { id: 'v8', number: 8, title_ar: 'الجزء ٨', title_en: 'Part 8', bundled: false, pdfUrl: null, downloadUrl: null, path: '2402-2744.pdf', sizeMb: 8.2 },
      { id: 'v9', number: 9, title_ar: 'الجزء ٩', title_en: 'Part 9', bundled: false, pdfUrl: null, downloadUrl: null, path: '2745-3087.pdf', sizeMb: 7.6 },
      { id: 'v10', number: 10, title_ar: 'الجزء ١٠', title_en: 'Part 10', bundled: false, pdfUrl: null, downloadUrl: null, path: '3088-3430.pdf', sizeMb: 5.7 }
    ]
  },
  {
    id: 'musnad-abi-dawud',
    title_ar: 'مسند أبي داود الطيالسي',
    title_en: 'Musnad Abi Dawud al-Tayalisi',
    author_ar: 'سليمان بن داود بن الجارود الطيالسي',
    author_en: 'Sulayman ibn Dawud al-Tayalisi',
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
    category_ar: 'الحديث',
    category_en: 'Hadith',
    madhab_ar: '',
    madhab_en: '',
    description_ar:
      'مسند الإمام الطيالسي أحد مسانيد الحديث المبكرة، جمع فيه أحاديث الصحابة مرفوعةً إلى النبي ﷺ، ويعد من أصول كتب السنة.',
    description_en:
      "One of the early hadith musnads compiled by Imam al-Tayalisi, gathering the marfu' ahadith of the Companions, and considered among the foundational books of the Sunnah.",
    coverImage: '/covers/musnad-abi-dawud.svg',
    order: 6,
    source: {
      type: 'zip',
      url: 'https://drive.usercontent.google.com/download?id=1FJ9TVi7Ssb9z4v5PFZR9-LDhwAcFIZl0&export=download&confirm=t',
      pageUrl: 'https://drive.google.com/file/d/1FJ9TVi7Ssb9z4v5PFZR9-LDhwAcFIZl0/view'
    },
    volumes: [
      { id: 'v1', number: 1, title_ar: 'مقدمة التحقيق', title_en: 'Introduction', bundled: false, pdfUrl: null, downloadUrl: null, path: 'madt1p.pdf', sizeMb: 1.3 },
      { id: 'v2', number: 2, title_ar: 'الجزء الأول: الأحاديث 1 - 640', title_en: 'Volume 1: Hadiths 1 - 640', bundled: false, pdfUrl: null, downloadUrl: null, path: 'madt1.pdf', sizeMb: 8.6 },
      { id: 'v3', number: 3, title_ar: 'الجزء الثاني: الأحاديث 641 - 1469', title_en: 'Volume 2: Hadiths 641 - 1469', bundled: false, pdfUrl: null, downloadUrl: null, path: 'madt2.pdf', sizeMb: 11.1 },
      { id: 'v4', number: 4, title_ar: 'الجزء الثالث: الأحاديث 1470 - 2358', title_en: 'Volume 3: Hadiths 1470 - 2358', bundled: false, pdfUrl: null, downloadUrl: null, path: 'madt3.pdf', sizeMb: 10.5 },
      { id: 'v5', number: 5, title_ar: 'الجزء الرابع: الأحاديث 2359 - 2890', title_en: 'Volume 4: Hadiths 2359 - 2890', bundled: false, pdfUrl: null, downloadUrl: null, path: 'madt4.pdf', sizeMb: 10.4 }
    ]
  },
  {
    id: 'sahih-al-bukhari',
    title_ar: 'صحيح البخاري',
    title_en: 'Sahih al-Bukhari',
    author_ar: 'أبو عبد الله محمد بن إسماعيل البخاري',
    author_en: 'Abu Abdillah Muhammad ibn Isma\'il al-Bukhari',
    muhaqqiq_ar: '',
    muhaqqiq_en: '',
    translator_ar: '',
    translator_en: '',
    publisher_ar: '',
    publisher_en: '',
    edition_ar: '',
    edition_en: '',
    year_ar: '2007',
    year_en: '2007',
    language_ar: 'العربية',
    language_en: 'Arabic',
    category_ar: 'الحديث',
    category_en: 'Hadith',
    madhab_ar: '',
    madhab_en: '',
    description_ar:
      'أصح كتاب بعد كتاب الله تعالى، جمع فيه الإمام البخاري أصح ما روي من أحاديث النبي ﷺ في العقائد والأحكام والآداب وغيرها، بعد تمحيص شديد واستيفاء لشروط الصحة.',
    description_en:
      "The most authentic book after the Book of Allah. Imam al-Bukhari compiled therein the soundest narrations of the Prophet in creed, rulings, and manners, after rigorous scrutiny and the strictest conditions of authenticity.",
    coverImage: '/covers/sahih-al-bukhari.svg',
    order: 7,
    source: {
      type: 'zip',
      url: 'https://drive.usercontent.google.com/download?id=1Mzd6incsUn42wwhp3jq0a3nYB1n38Ej5&export=download&confirm=t',
      pageUrl: 'https://drive.google.com/file/d/1Mzd6incsUn42wwhp3jq0a3nYB1n38Ej5/view'
    },
    volumes: [
      { id: 'v1', number: 1, title_ar: 'الجزء ١', title_en: 'Part 1', bundled: false, pdfUrl: null, downloadUrl: null, path: '0001-0200.pdf', sizeMb: 4.8 },
      { id: 'v2', number: 2, title_ar: 'الجزء ٢', title_en: 'Part 2', bundled: false, pdfUrl: null, downloadUrl: null, path: '0201-0400.pdf', sizeMb: 4.2 },
      { id: 'v3', number: 3, title_ar: 'الجزء ٣', title_en: 'Part 3', bundled: false, pdfUrl: null, downloadUrl: null, path: '0401-0600.pdf', sizeMb: 4.1 },
      { id: 'v4', number: 4, title_ar: 'الجزء ٤', title_en: 'Part 4', bundled: false, pdfUrl: null, downloadUrl: null, path: '0601-0800.pdf', sizeMb: 4.5 },
      { id: 'v5', number: 5, title_ar: 'الجزء ٥', title_en: 'Part 5', bundled: false, pdfUrl: null, downloadUrl: null, path: '0801-1000.pdf', sizeMb: 4.6 },
      { id: 'v6', number: 6, title_ar: 'الجزء ٦', title_en: 'Part 6', bundled: false, pdfUrl: null, downloadUrl: null, path: '1001-1200.pdf', sizeMb: 4.8 },
      { id: 'v7', number: 7, title_ar: 'الجزء ٧', title_en: 'Part 7', bundled: false, pdfUrl: null, downloadUrl: null, path: '1201-1400.pdf', sizeMb: 4.4 },
      { id: 'v8', number: 8, title_ar: 'الجزء ٨', title_en: 'Part 8', bundled: false, pdfUrl: null, downloadUrl: null, path: '1401-1600.pdf', sizeMb: 4.2 },
      { id: 'v9', number: 9, title_ar: 'الجزء ٩', title_en: 'Part 9', bundled: false, pdfUrl: null, downloadUrl: null, path: '1601-1800.pdf', sizeMb: 4.5 },
      { id: 'v10', number: 10, title_ar: 'الجزء ١٠', title_en: 'Part 10', bundled: false, pdfUrl: null, downloadUrl: null, path: '1801-1944.pdf', sizeMb: 3.3 }
    ]
  },
  {
    id: 'sahih-muslim',
    title_ar: 'صحيح مسلم',
    title_en: 'Sahih Muslim',
    author_ar: 'أبو الحسين مسلم بن الحجاج القشيري النيسابوري',
    author_en: 'Abu al-Husayn Muslim ibn al-Hajjaj al-Nisaburi',
    muhaqqiq_ar: '',
    muhaqqiq_en: '',
    translator_ar: '',
    translator_en: '',
    publisher_ar: '',
    publisher_en: '',
    edition_ar: '',
    edition_en: '',
    year_ar: '2010',
    year_en: '2010',
    language_ar: 'العربية',
    language_en: 'Arabic',
    category_ar: 'الحديث',
    category_en: 'Hadith',
    madhab_ar: '',
    madhab_en: '',
    description_ar:
      'أحد أصح كتب الحديث بعد صحيح البخاري، جمع الإمام مسلم فيه الحديث الصحيح مرتبًا على الأبواب، مع اهتمامه البالغ بالترتيب والجمع بين الطرق.',
    description_en:
      "One of the most authentic hadith collections after Sahih al-Bukhari. Imam Muslim compiled authentic hadiths arranged by chapters, with great attention to ordering and combining the chains and wordings.",
    coverImage: '/covers/sahih-muslim.svg',
    order: 8,
    source: {
      type: 'zip',
      url: 'https://drive.usercontent.google.com/download?id=1oqAej4IjBw6o8Acl7O7ZETlNi2i_hmeZ&export=download&confirm=t',
      pageUrl: 'https://drive.google.com/file/d/1oqAej4IjBw6o8Acl7O7ZETlNi2i_hmeZ/view'
    },
    volumes: [
      { id: 'v1', number: 1, title_ar: 'الجزء ١', title_en: 'Part 1', bundled: false, pdfUrl: null, downloadUrl: null, path: '0001-0300.pdf', sizeMb: 6.5 },
      { id: 'v2', number: 2, title_ar: 'الجزء ٢', title_en: 'Part 2', bundled: false, pdfUrl: null, downloadUrl: null, path: '0301-0600.pdf', sizeMb: 6.5 },
      { id: 'v3', number: 3, title_ar: 'الجزء ٣', title_en: 'Part 3', bundled: false, pdfUrl: null, downloadUrl: null, path: '0601-0900.pdf', sizeMb: 6.6 },
      { id: 'v4', number: 4, title_ar: 'الجزء ٤', title_en: 'Part 4', bundled: false, pdfUrl: null, downloadUrl: null, path: '0901-1200.pdf', sizeMb: 6.4 },
      { id: 'v5', number: 5, title_ar: 'الجزء ٥', title_en: 'Part 5', bundled: false, pdfUrl: null, downloadUrl: null, path: '1201-1500.pdf', sizeMb: 6.5 },
      { id: 'v6', number: 6, title_ar: 'الجزء ٦', title_en: 'Part 6', bundled: false, pdfUrl: null, downloadUrl: null, path: '1501-1800.pdf', sizeMb: 6.2 },
      { id: 'v7', number: 7, title_ar: 'الجزء ٧', title_en: 'Part 7', bundled: false, pdfUrl: null, downloadUrl: null, path: '1801-2100.pdf', sizeMb: 6.2 },
      { id: 'v8', number: 8, title_ar: 'الجزء ٨', title_en: 'Part 8', bundled: false, pdfUrl: null, downloadUrl: null, path: '2101-2400.pdf', sizeMb: 5.6 },
      { id: 'v9', number: 9, title_ar: 'الجزء ٩', title_en: 'Part 9', bundled: false, pdfUrl: null, downloadUrl: null, path: '2401-2700.pdf', sizeMb: 2.7 },
      { id: 'v10', number: 10, title_ar: 'الجزء ١٠', title_en: 'Part 10', bundled: false, pdfUrl: null, downloadUrl: null, path: '2701-2933.pdf', sizeMb: 3.5 }
    ]
  },
  {
    id: 'sunan-al-nasai',
    title_ar: 'سنن النسائي',
    title_en: "Sunan al-Nasa'i",
    author_ar: 'أبو عبد الرحمن أحمد بن شعيب النسائي',
    author_en: "Abu Abd al-Rahman Ahmad ibn Shu'ayb al-Nasa'i",
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
    category_ar: 'الحديث',
    category_en: 'Hadith',
    madhab_ar: '',
    madhab_en: '',
    description_ar:
      'من دواوين السنة الستة، صنفه الإمام النسائي في السنن والأحكام، ويتميز بمنهجه النقدي في علل الحديث، حتى قيل إنه أصح الكتب المصنفة في الأحكام.',
    description_en:
      "One of the six canonical hadith collections. Imam al-Nasa'i arranged it by rulings and is known for his critical method regarding hadith defects, such that it was described as the most authentic of the books compiled on rulings.",
    coverImage: '/covers/sunan-al-nasai.svg',
    order: 9,
    source: {
      type: 'zip',
      url: 'https://drive.usercontent.google.com/download?id=1WaN7z9KBvvmGQrS_qB8derlWYJJGUoXe&export=download&confirm=t',
      pageUrl: 'https://drive.google.com/file/d/1WaN7z9KBvvmGQrS_qB8derlWYJJGUoXe/view'
    },
    volumes: [
      { id: 'v1', number: 1, title_ar: 'الجزء ١', title_en: 'Part 1', bundled: false, pdfUrl: null, downloadUrl: null, path: '0001-0590.pdf', sizeMb: 9.2 },
      { id: 'v2', number: 2, title_ar: 'الجزء ٢', title_en: 'Part 2', bundled: false, pdfUrl: null, downloadUrl: null, path: '0591-1180.pdf', sizeMb: 13.5 },
      { id: 'v3', number: 3, title_ar: 'الجزء ٣', title_en: 'Part 3', bundled: false, pdfUrl: null, downloadUrl: null, path: '1181-1770.pdf', sizeMb: 13.5 },
      { id: 'v4', number: 4, title_ar: 'الجزء ٤', title_en: 'Part 4', bundled: false, pdfUrl: null, downloadUrl: null, path: '1771-2360.pdf', sizeMb: 13.3 },
      { id: 'v5', number: 5, title_ar: 'الجزء ٥', title_en: 'Part 5', bundled: false, pdfUrl: null, downloadUrl: null, path: '2361-2950.pdf', sizeMb: 13.5 },
      { id: 'v6', number: 6, title_ar: 'الجزء ٦', title_en: 'Part 6', bundled: false, pdfUrl: null, downloadUrl: null, path: '2951-3540.pdf', sizeMb: 13.2 },
      { id: 'v7', number: 7, title_ar: 'الجزء ٧', title_en: 'Part 7', bundled: false, pdfUrl: null, downloadUrl: null, path: '3541-4130.pdf', sizeMb: 13.0 },
      { id: 'v8', number: 8, title_ar: 'الجزء ٨', title_en: 'Part 8', bundled: false, pdfUrl: null, downloadUrl: null, path: '4131-4720.pdf', sizeMb: 13.5 },
      { id: 'v9', number: 9, title_ar: 'الجزء ٩', title_en: 'Part 9', bundled: false, pdfUrl: null, downloadUrl: null, path: '4721-5310.pdf', sizeMb: 13.5 },
      { id: 'v10', number: 10, title_ar: 'الجزء ١٠', title_en: 'Part 10', bundled: false, pdfUrl: null, downloadUrl: null, path: '5311-5886.pdf', sizeMb: 10.8 }
    ]
  },
  {
    id: 'sunan-al-tirmidhi',
    title_ar: 'سنن الترمذي',
    title_en: 'Sunan al-Tirmidhi',
    author_ar: 'أبو عيسى محمد بن عيسى الترمذي',
    author_en: 'Abu Isa Muhammad ibn Isa al-Tirmidhi',
    muhaqqiq_ar: '',
    muhaqqiq_en: '',
    translator_ar: '',
    translator_en: '',
    publisher_ar: 'المكتبة السلفية - الحلبي',
    publisher_en: 'Halabi',
    edition_ar: '',
    edition_en: '',
    year_ar: '',
    year_en: '',
    language_ar: 'العربية',
    language_en: 'Arabic',
    category_ar: 'الحديث',
    category_en: 'Hadith',
    madhab_ar: '',
    madhab_en: '',
    description_ar:
      'جامع الترمذي من دواوين السنة، يتميز ببيانه لدرجة كل حديث من الصحة والحسن والضعف، وبعنايته بعلل الأحاديث ومعرفة الرجال.',
    description_en:
      "Jami' al-Tirmidhi is one of the six canonical collections, distinguished by grading each hadith (authentic, good, or weak) and by its attention to hadith defects and narrators.",
    coverImage: '/covers/sunan-al-tirmidhi.svg',
    order: 10,
    source: {
      type: 'zip',
      url: 'https://drive.usercontent.google.com/download?id=1k-BRprDbtC7VpB5saVTBagceu0PAgXKs&export=download&confirm=t',
      pageUrl: 'https://drive.google.com/file/d/1k-BRprDbtC7VpB5saVTBagceu0PAgXKs/view'
    },
    volumes: [
      { id: 'v1', number: 1, title_ar: 'الجزء ١', title_en: 'Volume 1', bundled: false, pdfUrl: null, downloadUrl: null, path: 'Sunan_Tirmithi01.pdf', sizeMb: 8.6 },
      { id: 'v2', number: 2, title_ar: 'الجزء ٢', title_en: 'Volume 2', bundled: false, pdfUrl: null, downloadUrl: null, path: 'Sunan_Tirmithi02.pdf', sizeMb: 7.2 },
      { id: 'v3', number: 3, title_ar: 'الجزء ٣', title_en: 'Volume 3', bundled: false, pdfUrl: null, downloadUrl: null, path: 'Sunan_Tirmithi03.pdf', sizeMb: 9.7 },
      { id: 'v4', number: 4, title_ar: 'الجزء ٤', title_en: 'Volume 4', bundled: false, pdfUrl: null, downloadUrl: null, path: 'Sunan_Tirmithi04.pdf', sizeMb: 10.8 },
      { id: 'v5', number: 5, title_ar: 'الجزء ٥', title_en: 'Volume 5', bundled: false, pdfUrl: null, downloadUrl: null, path: 'Sunan_Tirmithi05.pdf', sizeMb: 12.7 }
    ]
  },
  {
    id: 'tafsir-al-qurtubi',
    title_ar: 'الجامع لأحكام القرآن (تفسير القرطبي)',
    title_en: "Al-Jami' li-Ahkam al-Qur'an (Tafsir al-Qurtubi)",
    author_ar: 'أبو عبد الله محمد بن أحمد الأنصاري القرطبي',
    author_en: 'Abu Abdillah Muhammad ibn Ahmad al-Qurtubi',
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
    category_ar: 'التفسير',
    category_en: 'Tafsir',
    madhab_ar: '',
    madhab_en: '',
    description_ar:
      'تفسير جامع لأحكام القرآن للعلامة القرطبي، يعنى بآيات الأحكام والاستنباطات الفقهية مع العناية باللغة والقراءات والناسخ والمنسوخ.',
    description_en:
      "A comprehensive commentary on the rulings of the Quran by al-Qurtubi, focusing on verses of rulings and juristic deductions, with attention to language, the qira'at, and abrogation.",
    coverImage: '/covers/tafsir-al-qurtubi.svg',
    order: 11,
    source: {
      type: 'zip',
      url: 'https://drive.usercontent.google.com/download?id=1afH4OzfUWtundYWzuSS7vC__NK0regaa&export=download&confirm=t',
      pageUrl: 'https://drive.google.com/file/d/1afH4OzfUWtundYWzuSS7vC__NK0regaa/view'
    },
    volumes: [
      { id: 'v1', number: 1, title_ar: 'مقدمة', title_en: 'Introduction', bundled: false, pdfUrl: null, downloadUrl: null, path: '01_73651p.pdf', sizeMb: 0.6 },
      { id: 'v2', number: 2, title_ar: 'الجزء ١: الفاتحة - البقرة ٣٩', title_en: 'Volume 1', bundled: false, pdfUrl: null, downloadUrl: null, path: '01_73651.pdf', sizeMb: 12.4 },
      { id: 'v3', number: 3, title_ar: 'الجزء ٢: البقرة ٤٠ - ١٦٤', title_en: 'Volume 2', bundled: false, pdfUrl: null, downloadUrl: null, path: '02_73652.pdf', sizeMb: 12.1 },
      { id: 'v4', number: 4, title_ar: 'الجزء ٣: البقرة ١٦٥ - ٢٢٢', title_en: 'Volume 3', bundled: false, pdfUrl: null, downloadUrl: null, path: '03_73653.pdf', sizeMb: 11.6 },
      { id: 'v5', number: 5, title_ar: 'الجزء ٤: البقرة ٢٢٣ - آخرها', title_en: 'Volume 4', bundled: false, pdfUrl: null, downloadUrl: null, path: '04_73654.pdf', sizeMb: 11.9 },
      { id: 'v6', number: 6, title_ar: 'الجزء ٥: آل عمران', title_en: 'Volume 5', bundled: false, pdfUrl: null, downloadUrl: null, path: '05_73655.pdf', sizeMb: 11.9 },
      { id: 'v7', number: 7, title_ar: 'الجزء ٦: النساء ١ - ٩١', title_en: 'Volume 6', bundled: false, pdfUrl: null, downloadUrl: null, path: '06_73656.pdf', sizeMb: 10.0 },
      { id: 'v8', number: 8, title_ar: 'الجزء ٧: النساء ٩٢ - المائدة ٤٤', title_en: 'Volume 7', bundled: false, pdfUrl: null, downloadUrl: null, path: '07_73657.pdf', sizeMb: 9.7 },
      { id: 'v9', number: 9, title_ar: 'الجزء ٨: المائدة ٤٥ - الأنعام', title_en: 'Volume 8', bundled: false, pdfUrl: null, downloadUrl: null, path: '08_73658.pdf', sizeMb: 11.1 },
      { id: 'v10', number: 10, title_ar: 'الجزء ٩: الأنعام ١١٤ - الأنفال ٤٠', title_en: 'Volume 9', bundled: false, pdfUrl: null, downloadUrl: null, path: '09_73659.pdf', sizeMb: 11.4 },
      { id: 'v11', number: 11, title_ar: 'الجزء ١٠: الأنفال ٤١ - يونس ٤٦', title_en: 'Volume 10', bundled: false, pdfUrl: null, downloadUrl: null, path: '10_73660.pdf', sizeMb: 11.7 },
      { id: 'v12', number: 12, title_ar: 'الجزء ١١: يونس ٤٧ - يوسف', title_en: 'Volume 11', bundled: false, pdfUrl: null, downloadUrl: null, path: '11_73661.pdf', sizeMb: 10.6 },
      { id: 'v13', number: 13, title_ar: 'الجزء ١٢: الرعد - النحل', title_en: 'Volume 12', bundled: false, pdfUrl: null, downloadUrl: null, path: '12_73662.pdf', sizeMb: 10.3 },
      { id: 'v14', number: 14, title_ar: 'الجزء ١٣: الإسراء - مريم', title_en: 'Volume 13', bundled: false, pdfUrl: null, downloadUrl: null, path: '13_73663.pdf', sizeMb: 12.0 },
      { id: 'v15', number: 15, title_ar: 'الجزء ١٤: طه - الحج', title_en: 'Volume 14', bundled: false, pdfUrl: null, downloadUrl: null, path: '14_73664.pdf', sizeMb: 9.9 },
      { id: 'v16', number: 16, title_ar: 'الجزء ١٥: المؤمنون - الفرقان', title_en: 'Volume 15', bundled: false, pdfUrl: null, downloadUrl: null, path: '15_73665.pdf', sizeMb: 11.0 },
      { id: 'v17', number: 17, title_ar: 'الجزء ١٦: الشعراء - لقمان', title_en: 'Volume 16', bundled: false, pdfUrl: null, downloadUrl: null, path: '16_73666.pdf', sizeMb: 11.5 },
      { id: 'v18', number: 18, title_ar: 'الجزء ١٧: السجدة - يس', title_en: 'Volume 17', bundled: false, pdfUrl: null, downloadUrl: null, path: '17_73667.pdf', sizeMb: 11.2 },
      { id: 'v19', number: 19, title_ar: 'الجزء ١٨: الصافات - الشورى', title_en: 'Volume 18', bundled: false, pdfUrl: null, downloadUrl: null, path: '18_73668.pdf', sizeMb: 11.8 },
      { id: 'v20', number: 20, title_ar: 'الجزء ١٩: الزخرف - الطور', title_en: 'Volume 19', bundled: false, pdfUrl: null, downloadUrl: null, path: '19_73669.pdf', sizeMb: 10.8 },
      { id: 'v21', number: 21, title_ar: 'الجزء ٢٠', title_en: 'Volume 20', bundled: false, pdfUrl: null, downloadUrl: null, path: '20_73670.pdf', sizeMb: 11.5 },
      { id: 'v22', number: 22, title_ar: 'الجزء ٢١: التغابن - المرسلات', title_en: 'Volume 21', bundled: false, pdfUrl: null, downloadUrl: null, path: '21_73671.pdf', sizeMb: 10.9 },
      { id: 'v23', number: 23, title_ar: 'الجزء ٢٢: النبأ - الناس', title_en: 'Volume 22', bundled: false, pdfUrl: null, downloadUrl: null, path: '22_73672.pdf', sizeMb: 11.2 },
      { id: 'v24', number: 24, title_ar: 'الجزء ٢٣: الفهارس - الأحاديث والآثار والأشعار', title_en: 'Volume 23', bundled: false, pdfUrl: null, downloadUrl: null, path: '23_73673.pdf', sizeMb: 10.1 },
      { id: 'v25', number: 25, title_ar: 'الجزء ٢٤: الفهارس العامة - الأعلام والموضوعات واللغة', title_en: 'Volume 24', bundled: false, pdfUrl: null, downloadUrl: null, path: '24_73674.pdf', sizeMb: 4.5 }
    ]
  },
  {
    id: 'tafsir-al-tabari',
    title_ar: 'جامع البيان عن تأويل آي القرآن (تفسير الطبري)',
    title_en: 'Jami\' al-Bayan (Tafsir al-Tabari)',
    author_ar: 'أبو جعفر محمد بن جرير الطبري',
    author_en: 'Abu Ja\'far Muhammad ibn Jarir al-Tabari',
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
    category_ar: 'التفسير',
    category_en: 'Tafsir',
    madhab_ar: '',
    madhab_en: '',
    description_ar:
      'أمّ التفاسير بالمأثور، روى فيه الإمام الطبري أقوال السلف بأسانيدها وعلّق عليها، فكان مرجعًا لكل من جاء بعده من المفسرين.',
    description_en:
      "The mother of transmitted tafsir. Imam al-Tabari narrated the sayings of the Salaf with their chains and commented upon them, making it the reference for every commentator after him.",
    coverImage: '/covers/tafsir-al-tabari.svg',
    order: 12,
    source: {
      type: 'zip',
      url: 'https://drive.usercontent.google.com/download?id=10qPAffk3lx1NgTNj3b73GsSsxOjA1IKQ&export=download&confirm=t',
      pageUrl: 'https://drive.google.com/file/d/10qPAffk3lx1NgTNj3b73GsSsxOjA1IKQ/view'
    },
    volumes: [
      { id: 'v1', number: 1, title_ar: 'مقدمة التحقيق', title_en: 'Introduction', bundled: false, pdfUrl: null, downloadUrl: null, path: 'taftabry01p.pdf', sizeMb: 4.6 },
      { id: 'v2', number: 2, title_ar: 'الجزء ١: الفاتحة - البقرة ٥٩', title_en: 'Volume 1', bundled: false, pdfUrl: null, downloadUrl: null, path: 'taftabry01.pdf', sizeMb: 12.7 },
      { id: 'v3', number: 3, title_ar: 'الجزء ٢: البقرة ٦٠ - ١٦٣', title_en: 'Volume 2', bundled: false, pdfUrl: null, downloadUrl: null, path: 'taftabry02.pdf', sizeMb: 13.1 },
      { id: 'v4', number: 4, title_ar: 'الجزء ٣: البقرة ١٦٤ - ٢٢٣', title_en: 'Volume 3', bundled: false, pdfUrl: null, downloadUrl: null, path: 'taftabry03.pdf', sizeMb: 13.0 },
      { id: 'v5', number: 5, title_ar: 'الجزء ٤: البقرة ٢٢٤ - ٢٦٧', title_en: 'Volume 4', bundled: false, pdfUrl: null, downloadUrl: null, path: 'taftabry04.pdf', sizeMb: 12.4 },
      { id: 'v6', number: 6, title_ar: 'الجزء ٥: البقرة ٢٦٨ - آل عمران ١٢٠', title_en: 'Volume 5', bundled: false, pdfUrl: null, downloadUrl: null, path: 'taftabry05.pdf', sizeMb: 12.9 },
      { id: 'v7', number: 7, title_ar: 'الجزء ٦: آل عمران ١٢١ - النساء ٣٥', title_en: 'Volume 6', bundled: false, pdfUrl: null, downloadUrl: null, path: 'taftabry06.pdf', sizeMb: 13.3 },
      { id: 'v8', number: 8, title_ar: 'الجزء ٧: النساء ٣٦ - آخرها', title_en: 'Volume 7', bundled: false, pdfUrl: null, downloadUrl: null, path: 'taftabry07.pdf', sizeMb: 14.7 },
      { id: 'v9', number: 9, title_ar: 'الجزء ٨: المائدة ١ - ٩٦', title_en: 'Volume 8', bundled: false, pdfUrl: null, downloadUrl: null, path: 'taftabry08.pdf', sizeMb: 13.0 },
      { id: 'v10', number: 10, title_ar: 'الجزء ٩: المائدة ٩٧ - الأنعام ١٥٤', title_en: 'Volume 9', bundled: false, pdfUrl: null, downloadUrl: null, path: 'taftabry09.pdf', sizeMb: 13.2 },
      { id: 'v11', number: 11, title_ar: 'الجزء ١٠: الأنعام ١٥٥ - الأعراف ٢٠٦', title_en: 'Volume 10', bundled: false, pdfUrl: null, downloadUrl: null, path: 'taftabry10.pdf', sizeMb: 12.5 },
      { id: 'v12', number: 12, title_ar: 'الجزء ١١', title_en: 'Volume 11', bundled: false, pdfUrl: null, downloadUrl: null, path: 'taftabry11.pdf', sizeMb: 13.5 },
      { id: 'v13', number: 13, title_ar: 'الجزء ١٢', title_en: 'Volume 12', bundled: false, pdfUrl: null, downloadUrl: null, path: 'taftabry12.pdf', sizeMb: 12.0 },
      { id: 'v14', number: 14, title_ar: 'الجزء ١٣', title_en: 'Volume 13', bundled: false, pdfUrl: null, downloadUrl: null, path: 'taftabry13.pdf', sizeMb: 12.4 },
      { id: 'v15', number: 15, title_ar: 'الجزء ١٤', title_en: 'Volume 14', bundled: false, pdfUrl: null, downloadUrl: null, path: 'taftabry14.pdf', sizeMb: 12.7 },
      { id: 'v16', number: 16, title_ar: 'الجزء ١٥', title_en: 'Volume 15', bundled: false, pdfUrl: null, downloadUrl: null, path: 'taftabry15.pdf', sizeMb: 10.8 },
      { id: 'v17', number: 17, title_ar: 'الجزء ١٦', title_en: 'Volume 16', bundled: false, pdfUrl: null, downloadUrl: null, path: 'taftabry16.pdf', sizeMb: 13.0 },
      { id: 'v18', number: 18, title_ar: 'الجزء ١٧', title_en: 'Volume 17', bundled: false, pdfUrl: null, downloadUrl: null, path: 'taftabry17.pdf', sizeMb: 11.5 },
      { id: 'v19', number: 19, title_ar: 'الجزء ١٨', title_en: 'Volume 18', bundled: false, pdfUrl: null, downloadUrl: null, path: 'taftabry18.pdf', sizeMb: 11.0 },
      { id: 'v20', number: 20, title_ar: 'الجزء ١٩', title_en: 'Volume 19', bundled: false, pdfUrl: null, downloadUrl: null, path: 'taftabry19.pdf', sizeMb: 11.5 },
      { id: 'v21', number: 21, title_ar: 'الجزء ٢٠: ص - الزخرف', title_en: 'Volume 20', bundled: false, pdfUrl: null, downloadUrl: null, path: 'taftabry20.pdf', sizeMb: 11.5 },
      { id: 'v22', number: 22, title_ar: 'الجزء ٢١: الدخان - الطور', title_en: 'Volume 21', bundled: false, pdfUrl: null, downloadUrl: null, path: 'taftabry21.pdf', sizeMb: 10.3 },
      { id: 'v23', number: 23, title_ar: 'الجزء ٢٢: النجم - المنافقون', title_en: 'Volume 22', bundled: false, pdfUrl: null, downloadUrl: null, path: 'taftabry22.pdf', sizeMb: 12.2 },
      { id: 'v24', number: 24, title_ar: 'الجزء ٢٣: التغابن - المرسلات', title_en: 'Volume 23', bundled: false, pdfUrl: null, downloadUrl: null, path: 'taftabry23.pdf', sizeMb: 10.9 },
      { id: 'v25', number: 25, title_ar: 'الجزء ٢٤: تفسير جزء عم', title_en: 'Volume 24', bundled: false, pdfUrl: null, downloadUrl: null, path: 'taftabry24.pdf', sizeMb: 11.8 },
      { id: 'v26', number: 26, title_ar: 'الفهارس: الجزءان ٢٥ و ٢٦', title_en: 'Indexes', bundled: false, pdfUrl: null, downloadUrl: null, path: 'taftabry25_26.pdf', sizeMb: 18.7 }
    ]
  },
  {
    id: 'tafsir-al-shawkani',
    title_ar: 'فتح القدير الجامع بين فني الرواية والدراية من علم التفسير (تفسير الشوكاني)',
    title_en: 'Fath al-Qadir (Tafsir al-Shawkani)',
    author_ar: 'محمد بن علي بن محمد الشوكاني',
    author_en: 'Muhammad ibn Ali ibn Muhammad al-Shawkani',
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
    category_ar: 'التفسير',
    category_en: 'Tafsir',
    madhab_ar: '',
    madhab_en: '',
    description_ar:
      'تفسير للإمام الشوكاني يجمع بين التفسير بالمأثور وبين الدراية والاستنباط، مع عناية بعلوم القرآن والبلاغة والترجيح بين الأقوال.',
    description_en:
      "A tafsir by Imam al-Shawkani combining transmitted interpretation with independent deduction, with attention to the Quranic sciences, eloquence, and weighing between views.",
    coverImage: '/covers/tafsir-al-shawkani.svg',
    order: 13,
    source: {
      type: 'zip',
      url: 'https://drive.usercontent.google.com/download?id=1qEWMYuHmlpH4WyhsqkvBqJgvyDWh0ugh&export=download&confirm=t',
      pageUrl: 'https://drive.google.com/file/d/1qEWMYuHmlpH4WyhsqkvBqJgvyDWh0ugh/view'
    },
    volumes: [
      { id: 'v1', number: 1, title_ar: 'الجزء ١: الفاتحة - النساء', title_en: 'Volume 1', bundled: false, pdfUrl: null, downloadUrl: null, path: 'فتح القدير الجامع بين فني الرواية والدراية من علم التفسير تفسير الشوكاني - الجزء الأول.pdf', sizeMb: 19.3 },
      { id: 'v2', number: 2, title_ar: 'الجزء ٢: المائدة - هود', title_en: 'Volume 2', bundled: false, pdfUrl: null, downloadUrl: null, path: 'فتح القدير الجامع بين فني الرواية والدراية من علم التفسير تفسير الشوكاني - الجزء الثاني.pdf', sizeMb: 17.0 },
      { id: 'v3', number: 3, title_ar: 'الجزء ٣: يوسف - المؤمنون', title_en: 'Volume 3', bundled: false, pdfUrl: null, downloadUrl: null, path: 'فتح القدير الجامع بين فني الرواية والدراية من علم التفسير تفسير الشوكاني الجزء الثالث.pdf', sizeMb: 15.2 },
      { id: 'v4', number: 4, title_ar: 'الجزء ٤: النور - الدخان', title_en: 'Volume 4', bundled: false, pdfUrl: null, downloadUrl: null, path: 'فتح القدير الجامع بين فني الرواية والدراية من علم التفسير تفسير الشوكاني الجزء الرابع.pdf', sizeMb: 17.0 },
      { id: 'v5', number: 5, title_ar: 'الجزء ٥: الجاثية - الناس', title_en: 'Volume 5', bundled: false, pdfUrl: null, downloadUrl: null, path: 'فتح القدير الجامع بين فني الرواية والدراية من علم التفسير تفسير الشوكاني الجزء الخامس.pdf', sizeMb: 15.4 }
    ]
  },
  {
    id: 'tafsir-ibn-kathir',
    title_ar: 'تفسير القرآن العظيم (تفسير ابن كثير)',
    title_en: 'Tafsir al-Qur\'an al-Azim (Tafsir Ibn Kathir)',
    author_ar: 'أبو الفداء إسماعيل بن عمر بن كثير القرشي الدمشقي',
    author_en: 'Abu al-Fida Isma\'il ibn Kathir',
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
    category_ar: 'التفسير',
    category_en: 'Tafsir',
    madhab_ar: '',
    madhab_en: '',
    description_ar:
      'من أشهر كتب التفسير بالمأثور، فسّر فيه الحافظ ابن كثير القرآن بالقرآن ثم بالحديث وأقوال الصحابة والتابعين، بأسلوب متميز في الترجيح والنقد.',
    description_en:
      "One of the most famous transmitted tafsirs. Ibn Kathir interpreted the Quran by the Quran, then by hadith and the sayings of the Companions and Successors, with a distinguished style of weighing and critique.",
    coverImage: '/covers/tafsir-ibn-kathir.svg',
    order: 14,
    source: {
      type: 'zip',
      url: 'https://drive.usercontent.google.com/download?id=15TV24fFlE-mSRp4yDRNCXU4fc4ghNbfg&export=download&confirm=t',
      pageUrl: 'https://drive.google.com/file/d/15TV24fFlE-mSRp4yDRNCXU4fc4ghNbfg/view'
    },
    volumes: [
      { id: 'v1', number: 1, title_ar: 'الجزء ١', title_en: 'Part 1', bundled: false, pdfUrl: null, downloadUrl: null, path: '0001-0450.pdf', sizeMb: 12.0 },
      { id: 'v2', number: 2, title_ar: 'الجزء ٢', title_en: 'Part 2', bundled: false, pdfUrl: null, downloadUrl: null, path: '0451-0900.pdf', sizeMb: 12.0 },
      { id: 'v3', number: 3, title_ar: 'الجزء ٣', title_en: 'Part 3', bundled: false, pdfUrl: null, downloadUrl: null, path: '0901-1350.pdf', sizeMb: 11.6 },
      { id: 'v4', number: 4, title_ar: 'الجزء ٤', title_en: 'Part 4', bundled: false, pdfUrl: null, downloadUrl: null, path: '1351-1800.pdf', sizeMb: 11.6 },
      { id: 'v5', number: 5, title_ar: 'الجزء ٥', title_en: 'Part 5', bundled: false, pdfUrl: null, downloadUrl: null, path: '1801-2250.pdf', sizeMb: 11.4 },
      { id: 'v6', number: 6, title_ar: 'الجزء ٦', title_en: 'Part 6', bundled: false, pdfUrl: null, downloadUrl: null, path: '2251-2700.pdf', sizeMb: 11.4 },
      { id: 'v7', number: 7, title_ar: 'الجزء ٧', title_en: 'Part 7', bundled: false, pdfUrl: null, downloadUrl: null, path: '2701-3150.pdf', sizeMb: 11.2 },
      { id: 'v8', number: 8, title_ar: 'الجزء ٨', title_en: 'Part 8', bundled: false, pdfUrl: null, downloadUrl: null, path: '3151-3600.pdf', sizeMb: 11.1 },
      { id: 'v9', number: 9, title_ar: 'الجزء ٩', title_en: 'Part 9', bundled: false, pdfUrl: null, downloadUrl: null, path: '3601-4050.pdf', sizeMb: 12.1 },
      { id: 'v10', number: 10, title_ar: 'الجزء ١٠', title_en: 'Part 10', bundled: false, pdfUrl: null, downloadUrl: null, path: '4051-4500.pdf', sizeMb: 10.6 },
      { id: 'v11', number: 11, title_ar: 'الجزء ١١', title_en: 'Part 11', bundled: false, pdfUrl: null, downloadUrl: null, path: '4501-4664.pdf', sizeMb: 3.5 }
    ]
  },
  {
    id: 'qisas-min-sahih-al-bukhari',
    title_ar: '50 من قصص صحيح البخاري',
    title_en: '50 Stories from Sahih al-Bukhari',
    author_ar: '',
    author_en: '',
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
    category_ar: 'القصص',
    category_en: 'Stories',
    madhab_ar: '',
    madhab_en: '',
    description_ar:
      'مجموعة من خمسين قصة منتقاة من صحيح البخاري بأسلوب مبسط مناسب للأطفال والناشئة، لترسيخ القيم والمعاني من السنة النبوية.',
    description_en:
      "A collection of fifty stories selected from Sahih al-Bukhari in a simple style suited for children and young readers, instilling values and lessons from the Prophetic Sunnah.",
    coverImage: '/covers/qisas-min-sahih-al-bukhari.svg',
    order: 15,
    volumes: [
      {
        id: 'v1',
        number: 1,
        title_ar: 'الكتاب كاملًا',
        title_en: 'Full Book',
        bundled: false,
        pdfUrl: null,
        downloadUrl: 'https://drive.usercontent.google.com/download?id=1t6Yg1wtcRkh2nJtXVUNw4H4PKo_suw6b&export=download&confirm=t',
        sizeMb: 2.4
      }
    ]
  }
];

export { SEED_BOOKS };
