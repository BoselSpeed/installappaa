// ---------------------------------------------------------------------------
// Books data — the single source of truth for the library content.
//
// How to add / edit books (no app rebuild needed, just this file):
//   1. Copy one of the entries below.
//   2. Fill in the fields (any field you leave empty will simply be hidden
//      in the UI — nothing is deleted or broken).
//   3. For each volume, provide a PDF in one of two ways:
//        - `bundled: true` with a `pdfUrl` pointing to a file inside
//          /public/books/ so it ships with the app, works offline, and opens
//          in the in-app reader.
//        - `downloadUrl` / `pdfUrl` pointing at a PDF hosted elsewhere. The app
//          cannot fetch another origin (no proxy server, and Google Drive sends
//          no CORS headers), so such a volume is opened at its original
//          location instead of being downloaded.
//   4. If a whole book is hosted as ONE remote ZIP archive, set
//      `source: { type: 'zip', pageUrl }` on the book so every volume links to
//      that archive's viewer page.
//   5. Put any cover image in /public/covers/ and reference it with
//      `coverImage` (or leave it null and a styled placeholder is shown).
//
// The local service reads this file and merges it with any books added through
// the books service API, so nothing that exists is ever replaced.
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
    coverImage: '/covers/kitab-al-tawhid.jpg',
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
    coverImage: '/covers/thalatha-al-usul.jpg',
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
    coverImage: '/covers/al-aqidah-al-wasitiyyah.jpg',
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
    coverImage: '/covers/kashf-al-shubuhat.jpg',
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
    coverImage: '/covers/tafsir-al-baghawi.jpg',
    order: 5,
    source: {
      type: 'zip',
      url: 'https://drive.usercontent.google.com/download?id=1FcgySndQ_tGecVHcl1Axu5bcjBdzajuF&export=download&confirm=t',
      pageUrl: 'https://drive.google.com/file/d/1FcgySndQ_tGecVHcl1Axu5bcjBdzajuF/view'
    },
    volumes: [
      { id: 'v1', number: 1, title_ar: 'المجلد ١', title_en: 'Volume 1', bundled: false, pdfUrl: null, downloadUrl: null, path: '0001-0343.pdf', sizeMb: 9.3 },
      { id: 'v2', number: 2, title_ar: 'المجلد ٢', title_en: 'Volume 2', bundled: false, pdfUrl: null, downloadUrl: null, path: '0344-0686.pdf', sizeMb: 8.5 },
      { id: 'v3', number: 3, title_ar: 'المجلد ٣', title_en: 'Volume 3', bundled: false, pdfUrl: null, downloadUrl: null, path: '0687-1029.pdf', sizeMb: 8.5 },
      { id: 'v4', number: 4, title_ar: 'المجلد ٤', title_en: 'Volume 4', bundled: false, pdfUrl: null, downloadUrl: null, path: '1030-1372.pdf', sizeMb: 8.7 },
      { id: 'v5', number: 5, title_ar: 'المجلد ٥', title_en: 'Volume 5', bundled: false, pdfUrl: null, downloadUrl: null, path: '1373-1715.pdf', sizeMb: 8.0 },
      { id: 'v6', number: 6, title_ar: 'المجلد ٦', title_en: 'Volume 6', bundled: false, pdfUrl: null, downloadUrl: null, path: '1716-2058.pdf', sizeMb: 8.4 },
      { id: 'v7', number: 7, title_ar: 'المجلد ٧', title_en: 'Volume 7', bundled: false, pdfUrl: null, downloadUrl: null, path: '2059-2401.pdf', sizeMb: 8.2 },
      { id: 'v8', number: 8, title_ar: 'المجلد ٨', title_en: 'Volume 8', bundled: false, pdfUrl: null, downloadUrl: null, path: '2402-2744.pdf', sizeMb: 8.2 },
      { id: 'v9', number: 9, title_ar: 'المجلد ٩', title_en: 'Volume 9', bundled: false, pdfUrl: null, downloadUrl: null, path: '2745-3087.pdf', sizeMb: 7.6 },
      { id: 'v10', number: 10, title_ar: 'المجلد ١٠', title_en: 'Volume 10', bundled: false, pdfUrl: null, downloadUrl: null, path: '3088-3430.pdf', sizeMb: 5.7 }
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
    coverImage: '/covers/musnad-abi-dawud.jpg',
    order: 6,
    source: {
      type: 'zip',
      url: 'https://drive.usercontent.google.com/download?id=1FJ9TVi7Ssb9z4v5PFZR9-LDhwAcFIZl0&export=download&confirm=t',
      pageUrl: 'https://drive.google.com/file/d/1FJ9TVi7Ssb9z4v5PFZR9-LDhwAcFIZl0/view'
    },
    volumes: [
      { id: 'v1', number: 1, title_ar: 'مقدمة التحقيق', title_en: 'Introduction', bundled: false, pdfUrl: null, downloadUrl: null, path: 'madt1p.pdf', sizeMb: 1.3 },
      { id: 'v2', number: 2, title_ar: 'المجلد الأول: الأحاديث 1 - 640', title_en: 'Volume 1: Hadiths 1 - 640', bundled: false, pdfUrl: null, downloadUrl: null, path: 'madt1.pdf', sizeMb: 8.6 },
      { id: 'v3', number: 3, title_ar: 'المجلد الثاني: الأحاديث 641 - 1469', title_en: 'Volume 2: Hadiths 641 - 1469', bundled: false, pdfUrl: null, downloadUrl: null, path: 'madt2.pdf', sizeMb: 11.1 },
      { id: 'v4', number: 4, title_ar: 'المجلد الثالث: الأحاديث 1470 - 2358', title_en: 'Volume 3: Hadiths 1470 - 2358', bundled: false, pdfUrl: null, downloadUrl: null, path: 'madt3.pdf', sizeMb: 10.5 },
      { id: 'v5', number: 5, title_ar: 'المجلد الرابع: الأحاديث 2359 - 2890', title_en: 'Volume 4: Hadiths 2359 - 2890', bundled: false, pdfUrl: null, downloadUrl: null, path: 'madt4.pdf', sizeMb: 10.4 }
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
    coverImage: '/covers/sahih-al-bukhari.jpg',
    order: 7,
    source: {
      type: 'zip',
      url: 'https://drive.usercontent.google.com/download?id=1Mzd6incsUn42wwhp3jq0a3nYB1n38Ej5&export=download&confirm=t',
      pageUrl: 'https://drive.google.com/file/d/1Mzd6incsUn42wwhp3jq0a3nYB1n38Ej5/view'
    },
    volumes: [
      { id: 'v1', number: 1, title_ar: 'المجلد ١', title_en: 'Volume 1', bundled: true, pdfUrl: '/books/sahih-al-bukhari-v1.pdf', downloadUrl: null, path: '0001-0200.pdf', sizeMb: 4.8 },
      { id: 'v2', number: 2, title_ar: 'المجلد ٢', title_en: 'Volume 2', bundled: false, pdfUrl: null, downloadUrl: null, path: '0201-0400.pdf', sizeMb: 4.2 },
      { id: 'v3', number: 3, title_ar: 'المجلد ٣', title_en: 'Volume 3', bundled: false, pdfUrl: null, downloadUrl: null, path: '0401-0600.pdf', sizeMb: 4.1 },
      { id: 'v4', number: 4, title_ar: 'المجلد ٤', title_en: 'Volume 4', bundled: false, pdfUrl: null, downloadUrl: null, path: '0601-0800.pdf', sizeMb: 4.5 },
      { id: 'v5', number: 5, title_ar: 'المجلد ٥', title_en: 'Volume 5', bundled: false, pdfUrl: null, downloadUrl: null, path: '0801-1000.pdf', sizeMb: 4.6 },
      { id: 'v6', number: 6, title_ar: 'المجلد ٦', title_en: 'Volume 6', bundled: false, pdfUrl: null, downloadUrl: null, path: '1001-1200.pdf', sizeMb: 4.8 },
      { id: 'v7', number: 7, title_ar: 'المجلد ٧', title_en: 'Volume 7', bundled: false, pdfUrl: null, downloadUrl: null, path: '1201-1400.pdf', sizeMb: 4.4 },
      { id: 'v8', number: 8, title_ar: 'المجلد ٨', title_en: 'Volume 8', bundled: false, pdfUrl: null, downloadUrl: null, path: '1401-1600.pdf', sizeMb: 4.2 },
      { id: 'v9', number: 9, title_ar: 'المجلد ٩', title_en: 'Volume 9', bundled: false, pdfUrl: null, downloadUrl: null, path: '1601-1800.pdf', sizeMb: 4.5 },
      { id: 'v10', number: 10, title_ar: 'المجلد ١٠', title_en: 'Volume 10', bundled: false, pdfUrl: null, downloadUrl: null, path: '1801-1944.pdf', sizeMb: 3.3 }
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
    coverImage: '/covers/sahih-muslim.jpg',
    order: 8,
    source: {
      type: 'zip',
      url: 'https://drive.usercontent.google.com/download?id=1oqAej4IjBw6o8Acl7O7ZETlNi2i_hmeZ&export=download&confirm=t',
      pageUrl: 'https://drive.google.com/file/d/1oqAej4IjBw6o8Acl7O7ZETlNi2i_hmeZ/view'
    },
    volumes: [
      { id: 'v1', number: 1, title_ar: 'المجلد ١', title_en: 'Volume 1', bundled: true, pdfUrl: '/books/sahih-muslim-v1.pdf', downloadUrl: null, path: '0001-0300.pdf', sizeMb: 6.5 },
      { id: 'v2', number: 2, title_ar: 'المجلد ٢', title_en: 'Volume 2', bundled: false, pdfUrl: null, downloadUrl: null, path: '0301-0600.pdf', sizeMb: 6.5 },
      { id: 'v3', number: 3, title_ar: 'المجلد ٣', title_en: 'Volume 3', bundled: false, pdfUrl: null, downloadUrl: null, path: '0601-0900.pdf', sizeMb: 6.6 },
      { id: 'v4', number: 4, title_ar: 'المجلد ٤', title_en: 'Volume 4', bundled: false, pdfUrl: null, downloadUrl: null, path: '0901-1200.pdf', sizeMb: 6.4 },
      { id: 'v5', number: 5, title_ar: 'المجلد ٥', title_en: 'Volume 5', bundled: false, pdfUrl: null, downloadUrl: null, path: '1201-1500.pdf', sizeMb: 6.5 },
      { id: 'v6', number: 6, title_ar: 'المجلد ٦', title_en: 'Volume 6', bundled: false, pdfUrl: null, downloadUrl: null, path: '1501-1800.pdf', sizeMb: 6.2 },
      { id: 'v7', number: 7, title_ar: 'المجلد ٧', title_en: 'Volume 7', bundled: false, pdfUrl: null, downloadUrl: null, path: '1801-2100.pdf', sizeMb: 6.2 },
      { id: 'v8', number: 8, title_ar: 'المجلد ٨', title_en: 'Volume 8', bundled: false, pdfUrl: null, downloadUrl: null, path: '2101-2400.pdf', sizeMb: 5.6 },
      { id: 'v9', number: 9, title_ar: 'المجلد ٩', title_en: 'Volume 9', bundled: false, pdfUrl: null, downloadUrl: null, path: '2401-2700.pdf', sizeMb: 2.7 },
      { id: 'v10', number: 10, title_ar: 'المجلد ١٠', title_en: 'Volume 10', bundled: false, pdfUrl: null, downloadUrl: null, path: '2701-2933.pdf', sizeMb: 3.5 }
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
    coverImage: '/covers/sunan-al-nasai.jpg',
    order: 9,
    source: {
      type: 'zip',
      url: 'https://drive.usercontent.google.com/download?id=1WaN7z9KBvvmGQrS_qB8derlWYJJGUoXe&export=download&confirm=t',
      pageUrl: 'https://drive.google.com/file/d/1WaN7z9KBvvmGQrS_qB8derlWYJJGUoXe/view'
    },
    volumes: [
      { id: 'v1', number: 1, title_ar: 'المجلد ١', title_en: 'Volume 1', bundled: false, pdfUrl: null, downloadUrl: null, path: '0001-0590.pdf', sizeMb: 9.2 },
      { id: 'v2', number: 2, title_ar: 'المجلد ٢', title_en: 'Volume 2', bundled: false, pdfUrl: null, downloadUrl: null, path: '0591-1180.pdf', sizeMb: 13.5 },
      { id: 'v3', number: 3, title_ar: 'المجلد ٣', title_en: 'Volume 3', bundled: false, pdfUrl: null, downloadUrl: null, path: '1181-1770.pdf', sizeMb: 13.5 },
      { id: 'v4', number: 4, title_ar: 'المجلد ٤', title_en: 'Volume 4', bundled: false, pdfUrl: null, downloadUrl: null, path: '1771-2360.pdf', sizeMb: 13.3 },
      { id: 'v5', number: 5, title_ar: 'المجلد ٥', title_en: 'Volume 5', bundled: false, pdfUrl: null, downloadUrl: null, path: '2361-2950.pdf', sizeMb: 13.5 },
      { id: 'v6', number: 6, title_ar: 'المجلد ٦', title_en: 'Volume 6', bundled: false, pdfUrl: null, downloadUrl: null, path: '2951-3540.pdf', sizeMb: 13.2 },
      { id: 'v7', number: 7, title_ar: 'المجلد ٧', title_en: 'Volume 7', bundled: false, pdfUrl: null, downloadUrl: null, path: '3541-4130.pdf', sizeMb: 13.0 },
      { id: 'v8', number: 8, title_ar: 'المجلد ٨', title_en: 'Volume 8', bundled: false, pdfUrl: null, downloadUrl: null, path: '4131-4720.pdf', sizeMb: 13.5 },
      { id: 'v9', number: 9, title_ar: 'المجلد ٩', title_en: 'Volume 9', bundled: false, pdfUrl: null, downloadUrl: null, path: '4721-5310.pdf', sizeMb: 13.5 },
      { id: 'v10', number: 10, title_ar: 'المجلد ١٠', title_en: 'Volume 10', bundled: false, pdfUrl: null, downloadUrl: null, path: '5311-5886.pdf', sizeMb: 10.8 }
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
    coverImage: '/covers/sunan-al-tirmidhi.jpg',
    order: 10,
    source: {
      type: 'zip',
      url: 'https://drive.usercontent.google.com/download?id=1k-BRprDbtC7VpB5saVTBagceu0PAgXKs&export=download&confirm=t',
      pageUrl: 'https://drive.google.com/file/d/1k-BRprDbtC7VpB5saVTBagceu0PAgXKs/view'
    },
    volumes: [
      { id: 'v1', number: 1, title_ar: 'المجلد ١', title_en: 'Volume 1', bundled: false, pdfUrl: null, downloadUrl: null, path: 'Sunan_Tirmithi01.pdf', sizeMb: 8.6 },
      { id: 'v2', number: 2, title_ar: 'المجلد ٢', title_en: 'Volume 2', bundled: false, pdfUrl: null, downloadUrl: null, path: 'Sunan_Tirmithi02.pdf', sizeMb: 7.2 },
      { id: 'v3', number: 3, title_ar: 'المجلد ٣', title_en: 'Volume 3', bundled: false, pdfUrl: null, downloadUrl: null, path: 'Sunan_Tirmithi03.pdf', sizeMb: 9.7 },
      { id: 'v4', number: 4, title_ar: 'المجلد ٤', title_en: 'Volume 4', bundled: false, pdfUrl: null, downloadUrl: null, path: 'Sunan_Tirmithi04.pdf', sizeMb: 10.8 },
      { id: 'v5', number: 5, title_ar: 'المجلد ٥', title_en: 'Volume 5', bundled: false, pdfUrl: null, downloadUrl: null, path: 'Sunan_Tirmithi05.pdf', sizeMb: 12.7 }
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
    coverImage: '/covers/tafsir-al-qurtubi.jpg',
    order: 11,
    source: {
      type: 'zip',
      url: 'https://drive.usercontent.google.com/download?id=1afH4OzfUWtundYWzuSS7vC__NK0regaa&export=download&confirm=t',
      pageUrl: 'https://drive.google.com/file/d/1afH4OzfUWtundYWzuSS7vC__NK0regaa/view'
    },
    volumes: [
      { id: 'v1', number: 1, title_ar: 'مقدمة', title_en: 'Introduction', bundled: false, pdfUrl: null, downloadUrl: null, path: '01_73651p.pdf', sizeMb: 0.6 },
      { id: 'v2', number: 2, title_ar: 'المجلد ١: الفاتحة - البقرة ٣٩', title_en: 'Volume 1', bundled: false, pdfUrl: null, downloadUrl: null, path: '01_73651.pdf', sizeMb: 12.4 },
      { id: 'v3', number: 3, title_ar: 'المجلد ٢: البقرة ٤٠ - ١٦٤', title_en: 'Volume 2', bundled: false, pdfUrl: null, downloadUrl: null, path: '02_73652.pdf', sizeMb: 12.1 },
      { id: 'v4', number: 4, title_ar: 'المجلد ٣: البقرة ١٦٥ - ٢٢٢', title_en: 'Volume 3', bundled: false, pdfUrl: null, downloadUrl: null, path: '03_73653.pdf', sizeMb: 11.6 },
      { id: 'v5', number: 5, title_ar: 'المجلد ٤: البقرة ٢٢٣ - آخرها', title_en: 'Volume 4', bundled: false, pdfUrl: null, downloadUrl: null, path: '04_73654.pdf', sizeMb: 11.9 },
      { id: 'v6', number: 6, title_ar: 'المجلد ٥: آل عمران', title_en: 'Volume 5', bundled: false, pdfUrl: null, downloadUrl: null, path: '05_73655.pdf', sizeMb: 11.9 },
      { id: 'v7', number: 7, title_ar: 'المجلد ٦: النساء ١ - ٩١', title_en: 'Volume 6', bundled: false, pdfUrl: null, downloadUrl: null, path: '06_73656.pdf', sizeMb: 10.0 },
      { id: 'v8', number: 8, title_ar: 'المجلد ٧: النساء ٩٢ - المائدة ٤٤', title_en: 'Volume 7', bundled: false, pdfUrl: null, downloadUrl: null, path: '07_73657.pdf', sizeMb: 9.7 },
      { id: 'v9', number: 9, title_ar: 'المجلد ٨: المائدة ٤٥ - الأنعام', title_en: 'Volume 8', bundled: false, pdfUrl: null, downloadUrl: null, path: '08_73658.pdf', sizeMb: 11.1 },
      { id: 'v10', number: 10, title_ar: 'المجلد ٩: الأنعام ١١٤ - الأنفال ٤٠', title_en: 'Volume 9', bundled: false, pdfUrl: null, downloadUrl: null, path: '09_73659.pdf', sizeMb: 11.4 },
      { id: 'v11', number: 11, title_ar: 'المجلد ١٠: الأنفال ٤١ - يونس ٤٦', title_en: 'Volume 10', bundled: false, pdfUrl: null, downloadUrl: null, path: '10_73660.pdf', sizeMb: 11.7 },
      { id: 'v12', number: 12, title_ar: 'المجلد ١١: يونس ٤٧ - يوسف', title_en: 'Volume 11', bundled: false, pdfUrl: null, downloadUrl: null, path: '11_73661.pdf', sizeMb: 10.6 },
      { id: 'v13', number: 13, title_ar: 'المجلد ١٢: الرعد - النحل', title_en: 'Volume 12', bundled: false, pdfUrl: null, downloadUrl: null, path: '12_73662.pdf', sizeMb: 10.3 },
      { id: 'v14', number: 14, title_ar: 'المجلد ١٣: الإسراء - مريم', title_en: 'Volume 13', bundled: false, pdfUrl: null, downloadUrl: null, path: '13_73663.pdf', sizeMb: 12.0 },
      { id: 'v15', number: 15, title_ar: 'المجلد ١٤: طه - الحج', title_en: 'Volume 14', bundled: false, pdfUrl: null, downloadUrl: null, path: '14_73664.pdf', sizeMb: 9.9 },
      { id: 'v16', number: 16, title_ar: 'المجلد ١٥: المؤمنون - الفرقان', title_en: 'Volume 15', bundled: false, pdfUrl: null, downloadUrl: null, path: '15_73665.pdf', sizeMb: 11.0 },
      { id: 'v17', number: 17, title_ar: 'المجلد ١٦: الشعراء - لقمان', title_en: 'Volume 16', bundled: false, pdfUrl: null, downloadUrl: null, path: '16_73666.pdf', sizeMb: 11.5 },
      { id: 'v18', number: 18, title_ar: 'المجلد ١٧: السجدة - يس', title_en: 'Volume 17', bundled: false, pdfUrl: null, downloadUrl: null, path: '17_73667.pdf', sizeMb: 11.2 },
      { id: 'v19', number: 19, title_ar: 'المجلد ١٨: الصافات - الشورى', title_en: 'Volume 18', bundled: false, pdfUrl: null, downloadUrl: null, path: '18_73668.pdf', sizeMb: 11.8 },
      { id: 'v20', number: 20, title_ar: 'المجلد ١٩: الزخرف - الطور', title_en: 'Volume 19', bundled: false, pdfUrl: null, downloadUrl: null, path: '19_73669.pdf', sizeMb: 10.8 },
      { id: 'v21', number: 21, title_ar: 'المجلد ٢٠', title_en: 'Volume 20', bundled: false, pdfUrl: null, downloadUrl: null, path: '20_73670.pdf', sizeMb: 11.5 },
      { id: 'v22', number: 22, title_ar: 'المجلد ٢١: التغابن - المرسلات', title_en: 'Volume 21', bundled: false, pdfUrl: null, downloadUrl: null, path: '21_73671.pdf', sizeMb: 10.9 },
      { id: 'v23', number: 23, title_ar: 'المجلد ٢٢: النبأ - الناس', title_en: 'Volume 22', bundled: false, pdfUrl: null, downloadUrl: null, path: '22_73672.pdf', sizeMb: 11.2 },
      { id: 'v24', number: 24, title_ar: 'المجلد ٢٣: الفهارس - الأحاديث والآثار والأشعار', title_en: 'Volume 23', bundled: false, pdfUrl: null, downloadUrl: null, path: '23_73673.pdf', sizeMb: 10.1 },
      { id: 'v25', number: 25, title_ar: 'المجلد ٢٤: الفهارس العامة - الأعلام والموضوعات واللغة', title_en: 'Volume 24', bundled: false, pdfUrl: null, downloadUrl: null, path: '24_73674.pdf', sizeMb: 4.5 }
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
    coverImage: '/covers/tafsir-al-tabari.jpg',
    order: 12,
    source: {
      type: 'zip',
      url: 'https://drive.usercontent.google.com/download?id=10qPAffk3lx1NgTNj3b73GsSsxOjA1IKQ&export=download&confirm=t',
      pageUrl: 'https://drive.google.com/file/d/10qPAffk3lx1NgTNj3b73GsSsxOjA1IKQ/view'
    },
    volumes: [
      { id: 'v1', number: 1, title_ar: 'مقدمة التحقيق', title_en: 'Introduction', bundled: false, pdfUrl: null, downloadUrl: null, path: 'taftabry01p.pdf', sizeMb: 4.6 },
      { id: 'v2', number: 2, title_ar: 'المجلد ١: الفاتحة - البقرة ٥٩', title_en: 'Volume 1', bundled: false, pdfUrl: null, downloadUrl: null, path: 'taftabry01.pdf', sizeMb: 12.7 },
      { id: 'v3', number: 3, title_ar: 'المجلد ٢: البقرة ٦٠ - ١٦٣', title_en: 'Volume 2', bundled: false, pdfUrl: null, downloadUrl: null, path: 'taftabry02.pdf', sizeMb: 13.1 },
      { id: 'v4', number: 4, title_ar: 'المجلد ٣: البقرة ١٦٤ - ٢٢٣', title_en: 'Volume 3', bundled: false, pdfUrl: null, downloadUrl: null, path: 'taftabry03.pdf', sizeMb: 13.0 },
      { id: 'v5', number: 5, title_ar: 'المجلد ٤: البقرة ٢٢٤ - ٢٦٧', title_en: 'Volume 4', bundled: false, pdfUrl: null, downloadUrl: null, path: 'taftabry04.pdf', sizeMb: 12.4 },
      { id: 'v6', number: 6, title_ar: 'المجلد ٥: البقرة ٢٦٨ - آل عمران ١٢٠', title_en: 'Volume 5', bundled: false, pdfUrl: null, downloadUrl: null, path: 'taftabry05.pdf', sizeMb: 12.9 },
      { id: 'v7', number: 7, title_ar: 'المجلد ٦: آل عمران ١٢١ - النساء ٣٥', title_en: 'Volume 6', bundled: false, pdfUrl: null, downloadUrl: null, path: 'taftabry06.pdf', sizeMb: 13.3 },
      { id: 'v8', number: 8, title_ar: 'المجلد ٧: النساء ٣٦ - آخرها', title_en: 'Volume 7', bundled: false, pdfUrl: null, downloadUrl: null, path: 'taftabry07.pdf', sizeMb: 14.7 },
      { id: 'v9', number: 9, title_ar: 'المجلد ٨: المائدة ١ - ٩٦', title_en: 'Volume 8', bundled: false, pdfUrl: null, downloadUrl: null, path: 'taftabry08.pdf', sizeMb: 13.0 },
      { id: 'v10', number: 10, title_ar: 'المجلد ٩: المائدة ٩٧ - الأنعام ١٥٤', title_en: 'Volume 9', bundled: false, pdfUrl: null, downloadUrl: null, path: 'taftabry09.pdf', sizeMb: 13.2 },
      { id: 'v11', number: 11, title_ar: 'المجلد ١٠: الأنعام ١٥٥ - الأعراف ٢٠٦', title_en: 'Volume 10', bundled: false, pdfUrl: null, downloadUrl: null, path: 'taftabry10.pdf', sizeMb: 12.5 },
      { id: 'v12', number: 12, title_ar: 'المجلد ١١', title_en: 'Volume 11', bundled: false, pdfUrl: null, downloadUrl: null, path: 'taftabry11.pdf', sizeMb: 13.5 },
      { id: 'v13', number: 13, title_ar: 'المجلد ١٢', title_en: 'Volume 12', bundled: false, pdfUrl: null, downloadUrl: null, path: 'taftabry12.pdf', sizeMb: 12.0 },
      { id: 'v14', number: 14, title_ar: 'المجلد ١٣', title_en: 'Volume 13', bundled: false, pdfUrl: null, downloadUrl: null, path: 'taftabry13.pdf', sizeMb: 12.4 },
      { id: 'v15', number: 15, title_ar: 'المجلد ١٤', title_en: 'Volume 14', bundled: false, pdfUrl: null, downloadUrl: null, path: 'taftabry14.pdf', sizeMb: 12.7 },
      { id: 'v16', number: 16, title_ar: 'المجلد ١٥', title_en: 'Volume 15', bundled: false, pdfUrl: null, downloadUrl: null, path: 'taftabry15.pdf', sizeMb: 10.8 },
      { id: 'v17', number: 17, title_ar: 'المجلد ١٦', title_en: 'Volume 16', bundled: false, pdfUrl: null, downloadUrl: null, path: 'taftabry16.pdf', sizeMb: 13.0 },
      { id: 'v18', number: 18, title_ar: 'المجلد ١٧', title_en: 'Volume 17', bundled: false, pdfUrl: null, downloadUrl: null, path: 'taftabry17.pdf', sizeMb: 11.5 },
      { id: 'v19', number: 19, title_ar: 'المجلد ١٨', title_en: 'Volume 18', bundled: false, pdfUrl: null, downloadUrl: null, path: 'taftabry18.pdf', sizeMb: 11.0 },
      { id: 'v20', number: 20, title_ar: 'المجلد ١٩', title_en: 'Volume 19', bundled: false, pdfUrl: null, downloadUrl: null, path: 'taftabry19.pdf', sizeMb: 11.5 },
      { id: 'v21', number: 21, title_ar: 'المجلد ٢٠: ص - الزخرف', title_en: 'Volume 20', bundled: false, pdfUrl: null, downloadUrl: null, path: 'taftabry20.pdf', sizeMb: 11.5 },
      { id: 'v22', number: 22, title_ar: 'المجلد ٢١: الدخان - الطور', title_en: 'Volume 21', bundled: false, pdfUrl: null, downloadUrl: null, path: 'taftabry21.pdf', sizeMb: 10.3 },
      { id: 'v23', number: 23, title_ar: 'المجلد ٢٢: النجم - المنافقون', title_en: 'Volume 22', bundled: false, pdfUrl: null, downloadUrl: null, path: 'taftabry22.pdf', sizeMb: 12.2 },
      { id: 'v24', number: 24, title_ar: 'المجلد ٢٣: التغابن - المرسلات', title_en: 'Volume 23', bundled: false, pdfUrl: null, downloadUrl: null, path: 'taftabry23.pdf', sizeMb: 10.9 },
      { id: 'v25', number: 25, title_ar: 'المجلد ٢٤: تفسير جزء عم', title_en: 'Volume 24', bundled: false, pdfUrl: null, downloadUrl: null, path: 'taftabry24.pdf', sizeMb: 11.8 },
      { id: 'v26', number: 26, title_ar: 'الفهارس: المجلدان ٢٥ و ٢٦', title_en: 'Indexes', bundled: false, pdfUrl: null, downloadUrl: null, path: 'taftabry25_26.pdf', sizeMb: 18.7 }
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
    coverImage: '/covers/tafsir-al-shawkani.jpg',
    order: 13,
    source: {
      type: 'zip',
      url: 'https://drive.usercontent.google.com/download?id=1qEWMYuHmlpH4WyhsqkvBqJgvyDWh0ugh&export=download&confirm=t',
      pageUrl: 'https://drive.google.com/file/d/1qEWMYuHmlpH4WyhsqkvBqJgvyDWh0ugh/view'
    },
    volumes: [
      { id: 'v1', number: 1, title_ar: 'المجلد ١: الفاتحة - النساء', title_en: 'Volume 1', bundled: false, pdfUrl: null, downloadUrl: null, path: 'فتح القدير الجامع بين فني الرواية والدراية من علم التفسير تفسير الشوكاني - الجزء الأول.pdf', sizeMb: 19.3 },
      { id: 'v2', number: 2, title_ar: 'المجلد ٢: المائدة - هود', title_en: 'Volume 2', bundled: false, pdfUrl: null, downloadUrl: null, path: 'فتح القدير الجامع بين فني الرواية والدراية من علم التفسير تفسير الشوكاني - الجزء الثاني.pdf', sizeMb: 17.0 },
      { id: 'v3', number: 3, title_ar: 'المجلد ٣: يوسف - المؤمنون', title_en: 'Volume 3', bundled: false, pdfUrl: null, downloadUrl: null, path: 'فتح القدير الجامع بين فني الرواية والدراية من علم التفسير تفسير الشوكاني الجزء الثالث.pdf', sizeMb: 15.2 },
      { id: 'v4', number: 4, title_ar: 'المجلد ٤: النور - الدخان', title_en: 'Volume 4', bundled: false, pdfUrl: null, downloadUrl: null, path: 'فتح القدير الجامع بين فني الرواية والدراية من علم التفسير تفسير الشوكاني الجزء الرابع.pdf', sizeMb: 17.0 },
      { id: 'v5', number: 5, title_ar: 'المجلد ٥: الجاثية - الناس', title_en: 'Volume 5', bundled: false, pdfUrl: null, downloadUrl: null, path: 'فتح القدير الجامع بين فني الرواية والدراية من علم التفسير تفسير الشوكاني الجزء الخامس.pdf', sizeMb: 15.4 }
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
    coverImage: '/covers/tafsir-ibn-kathir.jpg',
    order: 14,
    source: {
      type: 'zip',
      url: 'https://drive.usercontent.google.com/download?id=15TV24fFlE-mSRp4yDRNCXU4fc4ghNbfg&export=download&confirm=t',
      pageUrl: 'https://drive.google.com/file/d/15TV24fFlE-mSRp4yDRNCXU4fc4ghNbfg/view'
    },
    volumes: [
      { id: 'v1', number: 1, title_ar: 'المجلد ١', title_en: 'Volume 1', bundled: true, pdfUrl: '/books/tafsir-ibn-kathir-v1.pdf', downloadUrl: null, path: '0001-0450.pdf', sizeMb: 12.0 },
      { id: 'v2', number: 2, title_ar: 'المجلد ٢', title_en: 'Volume 2', bundled: false, pdfUrl: null, downloadUrl: null, path: '0451-0900.pdf', sizeMb: 12.0 },
      { id: 'v3', number: 3, title_ar: 'المجلد ٣', title_en: 'Volume 3', bundled: false, pdfUrl: null, downloadUrl: null, path: '0901-1350.pdf', sizeMb: 11.6 },
      { id: 'v4', number: 4, title_ar: 'المجلد ٤', title_en: 'Volume 4', bundled: false, pdfUrl: null, downloadUrl: null, path: '1351-1800.pdf', sizeMb: 11.6 },
      { id: 'v5', number: 5, title_ar: 'المجلد ٥', title_en: 'Volume 5', bundled: false, pdfUrl: null, downloadUrl: null, path: '1801-2250.pdf', sizeMb: 11.4 },
      { id: 'v6', number: 6, title_ar: 'المجلد ٦', title_en: 'Volume 6', bundled: false, pdfUrl: null, downloadUrl: null, path: '2251-2700.pdf', sizeMb: 11.4 },
      { id: 'v7', number: 7, title_ar: 'المجلد ٧', title_en: 'Volume 7', bundled: false, pdfUrl: null, downloadUrl: null, path: '2701-3150.pdf', sizeMb: 11.2 },
      { id: 'v8', number: 8, title_ar: 'المجلد ٨', title_en: 'Volume 8', bundled: false, pdfUrl: null, downloadUrl: null, path: '3151-3600.pdf', sizeMb: 11.1 },
      { id: 'v9', number: 9, title_ar: 'المجلد ٩', title_en: 'Volume 9', bundled: false, pdfUrl: null, downloadUrl: null, path: '3601-4050.pdf', sizeMb: 12.1 },
      { id: 'v10', number: 10, title_ar: 'المجلد ١٠', title_en: 'Volume 10', bundled: false, pdfUrl: null, downloadUrl: null, path: '4051-4500.pdf', sizeMb: 10.6 },
      { id: 'v11', number: 11, title_ar: 'المجلد ١١', title_en: 'Volume 11', bundled: false, pdfUrl: null, downloadUrl: null, path: '4501-4664.pdf', sizeMb: 3.5 }
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
    coverImage: '/covers/qisas-min-sahih-al-bukhari.jpg',
    order: 15,
    volumes: [
      {
        id: 'v1',
        number: 1,
        title_ar: 'الكتاب كاملًا',
        title_en: 'Full Book',
        bundled: true,
        pdfUrl: '/books/qisas-min-sahih-al-bukhari.pdf',
        downloadUrl: null,
        sizeMb: 2.4
      }
    ]
  },
  {
    id: 'diwan-al-hamasa',
    title_ar: 'ديوان الحماسة',
    title_en: 'Diwan al-Hamasa',
    author_ar: 'أبو تمام حبيب بن أوس الطائي',
    author_en: 'Abu Tammam Habib ibn Aws al-Ta\'i',
    muhaqqiq_ar: 'عبد المنعم صالح',
    muhaqqiq_en: 'Abd al-Munim Salih',
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
    category_ar: 'أدب',
    category_en: 'Adab',
    madhab_ar: '',
    madhab_en: '',
    description_ar:
      'من أشهر دواوين الشعر العربي، جمع فيه أبو تمام مختارات من أشعار العرب في الحماسة والفخر والمديح، مع تحقيق عبد المنعم صالح.',
    description_en:
      'One of the most famous Arabic poetry anthologies, compiled by Abu Tammam featuring selections of Arab poetry on heroism, pride, and praise, edited by Abd al-Munim Salih.',
    coverImage: '/covers/diwan-al-hamasa.jpg',
    order: 16,
    volumes: [
      {
        id: 'v1',
        number: 1,
        title_ar: 'الكتاب كاملًا',
        title_en: 'Full Book',
        bundled: false,
        pdfUrl: null,
        downloadUrl: 'https://drive.usercontent.google.com/download?id=16EaV9BzVyh6jnurTCLr2jZ0REjSpAg0h&export=download&confirm=t',
        sizeMb: 8.5
      }
    ]
  },
  {
    id: 'al-kafi-fi-ulum-al-balagha',
    title_ar: 'الكافي في علوم البلاغة العربية',
    title_en: 'Al-Kafi fi Ulum al-Balagha al-Arabiyya',
    author_ar: 'عيسى بن إبراهيم العاكوب، علي بن سعد الشتيوي',
    author_en: 'Isa ibn Ibrahim al-Aakub, Ali ibn Saad al-Shtaywi',
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
    category_ar: 'أدب',
    category_en: 'Adab',
    madhab_ar: '',
    madhab_en: '',
    description_ar:
      'كتاب في علوم البلاغة العربية (المعاني والبيان والبديع) بأسلوب تعليمي واضح، من تأليف عيسى العاكوب وعلي الشتيوي.',
    description_en:
      'A book on Arabic rhetorical sciences (meanings, expression, and embellishment) in a clear pedagogical style, by Isa al-Aakub and Ali al-Shtaywi.',
    coverImage: '/covers/al-kafi-fi-ulum-al-balagha.jpg',
    order: 17,
    volumes: [
      {
        id: 'v1',
        number: 1,
        title_ar: 'الكتاب كاملًا',
        title_en: 'Full Book',
        bundled: false,
        pdfUrl: null,
        downloadUrl: 'https://drive.usercontent.google.com/download?id=1DVExBCIucCRX-7wAU2ZedNJYcvhXnvqE&export=download&confirm=t',
        sizeMb: 12.3
      }
    ]
  },
  {
    id: 'al-mufaddaliyat',
    title_ar: 'المفضليات',
    title_en: 'Al-Mufaddaliyat',
    author_ar: 'المفضل بن محمد الضبي',
    author_en: 'Al-Mufaddal ibn Muhammad al-Dabbi',
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
    category_ar: 'أدب',
    category_en: 'Adab',
    madhab_ar: '',
    madhab_en: '',
    description_ar:
      'مجموعة مختارة من أشعار العرب في الجاهلية والإسلام، جمعها المفضل الضبي، وتُعد من أهم مصادر الشعر الجاهلي.',
    description_en:
      'A selected collection of pre-Islamic and early Islamic Arabic poetry, compiled by al-Mufaddal al-Dabbi, one of the most important sources of pre-Islamic poetry.',
    coverImage: '/covers/al-mufaddaliyat.jpg',
    order: 18,
    volumes: [
      {
        id: 'v1',
        number: 1,
        title_ar: 'الكتاب كاملًا',
        title_en: 'Full Book',
        bundled: false,
        pdfUrl: null,
        downloadUrl: 'https://drive.usercontent.google.com/download?id=1OI1ClN_xG1_z9jmEJ0jAUPXE1u5U2hB1&export=download&confirm=t',
        sizeMb: 9.7
      }
    ]
  },
  {
    id: 'sharh-lamiyat-al-arab',
    title_ar: 'شرح لامية العرب',
    title_en: 'Sharh Lamiyat al-Arab',
    author_ar: 'أبو إسحاق الزجاج',
    author_en: 'Abu Ishaq al-Zajjaj',
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
    category_ar: 'أدب',
    category_en: 'Adab',
    madhab_ar: '',
    madhab_en: '',
    description_ar:
      'شرح للامية العرب لابن الوردي أو الشماخ، في الحكمة والزهد، من أهم الشروح اللغوية والأدبية.',
    description_en:
      'Commentary on Lamiyat al-Arab (by Ibn al-Wardi or al-Shammakh), on wisdom and asceticism, one of the most important linguistic and literary commentaries.',
    coverImage: '/covers/sharh-lamiyat-al-arab.jpg',
    order: 19,
    volumes: [
      {
        id: 'v1',
        number: 1,
        title_ar: 'الكتاب كاملًا',
        title_en: 'Full Book',
        bundled: false,
        pdfUrl: null,
        downloadUrl: 'https://drive.usercontent.google.com/download?id=1Pi-D-bF6GcoRMTRSjbHvRdrKVNOss1sg&export=download&confirm=t',
        sizeMb: 6.8
      }
    ]
  },
  {
    id: 'al-mukhtasar-fi-al-balagha',
    title_ar: 'المختصر في البلاغة',
    title_en: 'Al-Mukhtasar fi al-Balagha',
    author_ar: 'د. عبد القادر حسين',
    author_en: 'Dr. Abd al-Qadir Husayn',
    muhaqqiq_ar: '',
    muhaqqiq_en: '',
    translator_ar: '',
    translator_en: '',
    publisher_ar: 'دار غريب للطباعة والنشر والتوزيع',
    publisher_en: 'Dar Gharib',
    edition_ar: '',
    edition_en: '',
    year_ar: '',
    year_en: '',
    language_ar: 'العربية',
    language_en: 'Arabic',
    category_ar: 'أدب',
    category_en: 'Adab',
    madhab_ar: '',
    madhab_en: '',
    description_ar:
      'مختصر في علم البلاغة (المعاني والبيان والبديع) يلخص القواعد الأساسية بأسلوب مبسط.',
    description_en:
      'A concise treatise on Arabic rhetoric (meanings, expression, and embellishment) summarizing the fundamental rules in a simplified style.',
    coverImage: '/covers/al-mukhtasar-fi-al-balagha.jpg',
    order: 20,
    volumes: [
      {
        id: 'v1',
        number: 1,
        title_ar: 'الكتاب كاملًا',
        title_en: 'Full Book',
        bundled: false,
        pdfUrl: null,
        downloadUrl: 'https://drive.usercontent.google.com/download?id=1QzQA9b0DX05yzsxTubC4x-1htg0U9_uG&export=download&confirm=t',
        sizeMb: 5.4
      }
    ]
  },
  {
    id: 'jamharat-ashar-al-arab',
    title_ar: 'جمهرة أشعار العرب',
    title_en: 'Jamharat Ash\'ar al-Arab',
    author_ar: 'أبو زيد القرشي',
    author_en: 'Abu Zayd al-Qurashi',
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
    category_ar: 'أدب',
    category_en: 'Adab',
    madhab_ar: '',
    madhab_en: '',
    description_ar:
      'من أمهات كتب الأدب، جمع فيها أبو زيد القرشي مختارات من أشعار العرب مع شرح غريبها، وهو من المصادر الأساسية للشعر الجاهلي والمخضرم.',
    description_en:
      'One of the foundational works of Arabic literature; Abu Zayd al-Qurashi compiled selections of Arab poetry with explanations of rare vocabulary, a primary source for pre-Islamic and mukhadram poetry.',
    coverImage: '/covers/jamharat-ashar-al-arab.jpg',
    order: 21,
    volumes: [
      {
        id: 'v1',
        number: 1,
        title_ar: 'الكتاب كاملًا',
        title_en: 'Full Book',
        bundled: false,
        pdfUrl: null,
        downloadUrl: 'https://drive.usercontent.google.com/download?id=1Z8BCtA878IcoydI_xOMSZXYKlBfTxt93&export=download&confirm=t',
        sizeMb: 11.2
      }
    ]
  },
  {
    id: 'al-muallaqat-al-sab',
    title_ar: 'المعلقات السبع',
    title_en: 'Al-Mu\'allaqat al-Sab\'',
    author_ar: 'الشاعرون السبعة (امرؤ القيس، طرفة، زهير، لبيد، عمرو بن كلثوم، عنترة، الحارث بن حلزة)',
    author_en: 'The Seven Poets (Imru al-Qays, Tarafa, Zuhayr, Labid, Amr ibn Kulthum, Antara, al-Harith ibn Hilliza)',
    muhaqqiq_ar: 'محمد عبد الغني الزوزني',
    muhaqqiq_en: 'Muhammad Abd al-Ghani al-Zawzani',
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
    category_ar: 'أدب',
    category_en: 'Adab',
    madhab_ar: '',
    madhab_en: '',
    description_ar:
      'المعلقات السبع الشهيرة مع شرح الزوزني، من أروع ما أنتجته الشعر العربي في الجاهلية.',
    description_en:
      'The famous Seven Mu\'allaqat with al-Zawzani\'s commentary, among the finest productions of pre-Islamic Arabic poetry.',
    coverImage: '/covers/al-muallaqat-al-sab.jpg',
    order: 22,
    volumes: [
      {
        id: 'v1',
        number: 1,
        title_ar: 'الكتاب كاملًا',
        title_en: 'Full Book',
        bundled: false,
        pdfUrl: null,
        downloadUrl: 'https://drive.usercontent.google.com/download?id=1_rgQgtHWAkJajC_lP3263PmiyaFjFp4d&export=download&confirm=t',
        sizeMb: 14.6
      }
    ]
  },
  {
    id: 'al-asmayat',
    title_ar: 'الأصمعيات',
    title_en: 'Al-Asma\'iyyat',
    author_ar: 'الأصمعي (عبد الملك بن قريب)',
    author_en: 'Al-Asma\'i (Abd al-Malik ibn Qarib)',
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
    category_ar: 'أدب',
    category_en: 'Adab',
    madhab_ar: '',
    madhab_en: '',
    description_ar:
      'مختارات الأصمعي من أشعار العرب، إحدى المجموعات الثلاث الكبرى (المفضليات، المعَدّات، الأصمعيات) التي جمعها علماء العربية في العصر العباسي المبكر.',
    description_en:
      'Al-Asma\'i\'s selections of Arab poetry, one of the three major canonical anthologies (alongside al-Mufaddaliyat and al-Mudaqqat) compiled by early Abbasid-era scholars.',
    coverImage: '/covers/al-asmayat.jpg',
    order: 23,
    volumes: [
      {
        id: 'v1',
        number: 1,
        title_ar: 'الكتاب كاملًا',
        title_en: 'Full Book',
        bundled: false,
        pdfUrl: null,
        downloadUrl: 'https://drive.usercontent.google.com/download?id=1cWBUeXXfAB3piFbaOknJ-aImdU4h4r7F&export=download&confirm=t',
        sizeMb: 7.9
      }
    ]
  },
  {
    id: 'al-itisam',
    title_ar: 'الاعتصام',
    title_en: 'Al-Itisam',
    author_ar: 'أحمد بن شمس الدين الشاطبي',
    author_en: 'Ahmad ibn Shams al-Din al-Shatibi',
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
    category_ar: 'أدب',
    category_en: 'Adab',
    madhab_ar: '',
    madhab_en: '',
    description_ar:
      'كتاب الإمام الشاطبي في الاعتصام بالكتاب والسنة والتحذير من البدع، من أهم كتب أصول الفقه والمنهج.',
    description_en:
      'Imam al-Shatibi\'s work on adhering to the Quran and Sunnah and warning against innovations, a foundational text in usul al-fiqh and methodology.',
    coverImage: '/covers/al-itisam.jpg',
    order: 24,
    volumes: [
      {
        id: 'v1',
        number: 1,
        title_ar: 'الكتاب كاملًا',
        title_en: 'Full Book',
        bundled: false,
        pdfUrl: null,
        downloadUrl: 'https://drive.usercontent.google.com/download?id=1o5cpb49vdHk_7bsojLrzYbn7ABs1_X3P&export=download&confirm=t',
        sizeMb: 18.3
      }
    ]
  },
  {
    id: 'jawahir-al-balagha',
    title_ar: 'جواهر البلاغة في المعاني والبيان والبديع',
    title_en: 'Jawahir al-Balagha',
    author_ar: 'السيد أحمد الهاشمي',
    author_en: 'Al-Sayyid Ahmad al-Hashimi',
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
    category_ar: 'أدب',
    category_en: 'Adab',
    madhab_ar: '',
    madhab_en: '',
    description_ar:
      'كتاب في علوم البلاغة الثلاثة (المعاني، البيان، البديع) بأسلوب جامع ومفصل، للسيد أحمد الهاشمي.',
    description_en:
      'A comprehensive and detailed work on the three rhetorical sciences (meanings, expression, embellishment) by Al-Sayyid Ahmad al-Hashimi.',
    coverImage: '/covers/jawahir-al-balagha.jpg',
    order: 25,
    volumes: [
      {
        id: 'v1',
        number: 1,
        title_ar: 'الكتاب كاملًا',
        title_en: 'Full Book',
        bundled: false,
        pdfUrl: null,
        downloadUrl: 'https://drive.usercontent.google.com/download?id=1tQT7qYYsDwZq4JYQbsiDHerbOEBYMGgZ&export=download&confirm=t',
        sizeMb: 15.7
      }
    ]
  },
  {
    id: 'al-balagha-al-wadiha',
    title_ar: 'البلاغة الواضحة',
    title_en: 'Al-Balagha al-Wadiha',
    author_ar: 'علي الجارم، مصطفى أمين',
    author_en: 'Ali al-Jarum, Mustafa Amin',
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
    category_ar: 'أدب',
    category_en: 'Adab',
    madhab_ar: '',
    madhab_en: '',
    description_ar:
      'من أشهر الكتب المدرسية في البلاغة العربية، قدمه علي الجارم ومصطفى أمين بأسلوب واضح ومنهجي للتعليم.',
    description_en:
      'One of the most famous Arabic rhetoric textbooks, presented by Ali al-Jarum and Mustafa Amin in a clear, systematic pedagogical style.',
    coverImage: '/covers/al-balagha-al-wadiha.jpg',
    order: 26,
    volumes: [
      {
        id: 'v1',
        number: 1,
        title_ar: 'الكتاب كاملًا',
        title_en: 'Full Book',
        bundled: false,
        pdfUrl: null,
        downloadUrl: 'https://drive.usercontent.google.com/download?id=1tUmjPZIpgXUANNQM-sfR5kLbRgKM76V1&export=download&confirm=t',
        sizeMb: 9.1
      }
    ]
  },
  {
    id: 'al-balagha-tatawwur-wa-tarikh',
    title_ar: 'البلاغة تطور وتاريخ',
    title_en: 'Al-Balagha: Tatawwur wa Tarikh',
    author_ar: 'شوقي ضيف',
    author_en: 'Shawqi Daif',
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
    category_ar: 'أدب',
    category_en: 'Adab',
    madhab_ar: '',
    madhab_en: '',
    description_ar:
      'دراسة تاريخية لتطور علم البلاغة العربية من النشأة إلى العصر الحديث، للدكتور شوقي ضيف، الطبعة التاسعة.',
    description_en:
      'A historical study of the development of Arabic rhetoric from its origins to the modern era, by Dr. Shawqi Daif, 9th edition.',
    coverImage: '/covers/al-balagha-tatawwur-wa-tarikh.jpg',
    order: 27,
    volumes: [
      {
        id: 'v1',
        number: 1,
        title_ar: 'الكتاب كاملًا',
        title_en: 'Full Book',
        bundled: false,
        pdfUrl: null,
        downloadUrl: 'https://drive.usercontent.google.com/download?id=1yNMH7CGCk1GVlw_kJqZNKuFZSQo6wutH&export=download&confirm=t',
        sizeMb: 13.4
      }
    ]
  },
  {
    id: 'mukhtarat-al-shiir-al-jahili',
    title_ar: 'مختارات الشعر الجاهلي ودواوين الشعراء الستة الجاهليين',
    title_en: 'Selections of Pre-Islamic Poetry and the Six Poets\' Diwans',
    author_ar: 'عبد المتعال الصعيدي',
    author_en: 'Abd al-Muta\'al al-Sa\'idi',
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
    category_ar: 'أدب',
    category_en: 'Adab',
    madhab_ar: '',
    madhab_en: '',
    description_ar:
      'مجموعة مختارات من الشعر الجاهلي تتضمن دواوين الشعراء الستة المشهورين، مرجع أساسي لدراسة الشعر العربي القديم.',
    description_en:
      'A collection of pre-Islamic poetry selections including the diwans of the six famous poets, a fundamental reference for the study of classical Arabic poetry.',
    coverImage: '/covers/mukhtarat-al-shiir-al-jahili.jpg',
    order: 28,
    volumes: [
      {
        id: 'v1',
        number: 1,
        title_ar: 'الكتاب كاملًا',
        title_en: 'Full Book',
        bundled: false,
        pdfUrl: null,
        downloadUrl: 'https://drive.usercontent.google.com/download?id=1ylvZm42Yf-zzdPyNK_DHNWCM5CSZ3tTm&export=download&confirm=t',
        sizeMb: 10.8
      }
    ]
  },
  {
    id: 'mawsuat-al-qabail-al-arabiyya',
    title_ar: 'موسوعة القبائل العربية',
    title_en: 'Mawsuat al-Qaba\'il al-Arabiyya',
    author_ar: 'محمد سليمان الطيب',
    author_en: 'Muhammad Sulayman al-Tayyib',
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
    category_ar: 'أدب',
    category_en: 'Adab',
    madhab_ar: '',
    madhab_en: '',
    description_ar:
      'موسوعة ضخمة في القبائل العربية، تتكون من عدة مجلدات تغطي أنساب القبائل وأخبارها وأشعارها. المجلد 9 غير متوفر في المصدر، والمتاح عشر مجلدات.',
    description_en:
      'A large encyclopedia of Arab tribes covering their lineages, histories, and poetry. Volume 9 is unavailable from the source; eleven volumes are available.',
    coverImage: '/covers/mawsuat-al-qabail-al-arabiyya.jpg',
    order: 29,
    volumes: [
      { id: 'v1', number: 1, title_ar: 'المجلد ١', title_en: 'Volume 1', bundled: false, pdfUrl: null, downloadUrl: 'https://drive.usercontent.google.com/download?id=1GKZErG6INtxlS45688XwFpQttzBrXsI1&export=download&confirm=t', sizeMb: 14.2 },
      { id: 'v2', number: 2, title_ar: 'المجلد ٢', title_en: 'Volume 2', bundled: false, pdfUrl: null, downloadUrl: 'https://drive.usercontent.google.com/download?id=1Gssm96R7mV7buTGalQIqmOltI-hekiQe&export=download&confirm=t', sizeMb: 15.1 },
      { id: 'v3', number: 3, title_ar: 'المجلد ٣', title_en: 'Volume 3', bundled: false, pdfUrl: null, downloadUrl: 'https://drive.usercontent.google.com/download?id=1fnLavSSYyx-ubuuXms1ZH6KIiYQ8nRXg&export=download&confirm=t', sizeMb: 12.3 },
      { id: 'v4', number: 4, title_ar: 'المجلد ٤', title_en: 'Volume 4', bundled: false, pdfUrl: null, downloadUrl: 'https://drive.usercontent.google.com/download?id=1I9vThAfv2O6tOByMWf3FMX76AbGFUmLB&export=download&confirm=t', sizeMb: 11.8 },
      { id: 'v5', number: 5, title_ar: 'المجلد ٥', title_en: 'Volume 5', bundled: false, pdfUrl: null, downloadUrl: 'https://drive.usercontent.google.com/download?id=1nuBCrz2OYU5e1FthoCkR1qQmgagutREI&export=download&confirm=t', sizeMb: 13.9 },
      { id: 'v6', number: 6, title_ar: 'المجلد ٦', title_en: 'Volume 6', bundled: false, pdfUrl: null, downloadUrl: 'https://drive.usercontent.google.com/download?id=1HLccW2FKHZuNTddCgV4QhoXgfo1wvpzi&export=download&confirm=t', sizeMb: 10.7 },
      { id: 'v7', number: 7, title_ar: 'المجلد ٧', title_en: 'Volume 7', bundled: false, pdfUrl: null, downloadUrl: 'https://drive.usercontent.google.com/download?id=1raqquMyLJYLWC2owQKoYx1gKb8E93alH&export=download&confirm=t', sizeMb: 16.4 },
      { id: 'v8', number: 8, title_ar: 'المجلد ٨', title_en: 'Volume 8', bundled: false, pdfUrl: null, downloadUrl: 'https://drive.usercontent.google.com/download?id=1D9fa1IG1tYUV-JCwx2h7wRq2MoVP9og7&export=download&confirm=t', sizeMb: 15.8 },
      { id: 'v10', number: 10, title_ar: 'المجلد ١٠', title_en: 'Volume 10', bundled: false, pdfUrl: null, downloadUrl: 'https://drive.usercontent.google.com/download?id=1_6YwpgiUf4DH6w3XJiHMEW5IZZnKnAzN&export=download&confirm=t', sizeMb: 16.1 },
      { id: 'v11', number: 11, title_ar: 'المجلد ١١', title_en: 'Volume 11', bundled: false, pdfUrl: null, downloadUrl: 'https://drive.usercontent.google.com/download?id=1_fdtM7jkZOF9ffQa_QAcCBzREn2xzQvO&export=download&confirm=t', sizeMb: 13.2 },
      { id: 'v12', number: 12, title_ar: 'المجلد ١٢', title_en: 'Volume 12', bundled: false, pdfUrl: null, downloadUrl: 'https://drive.usercontent.google.com/download?id=1957uQeJAU4iOMk8y1xfYM8GjS3zFwpua&export=download&confirm=t', sizeMb: 5.3 }
    ]
  }
];

export { SEED_BOOKS };
