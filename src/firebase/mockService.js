// Mock (demo) service layer used when Firebase is not configured.
// All data is persisted to localStorage and seeded with the uploaded books
// (Kitab al-Tawhid, Thalathat al-Usul, Al-Aqidah al-Wasitiyyah, and
// Kashf al-Shubuhat, read as PDFs inside the application).

import { SEED_BOOKS } from '../data/books';

  const KEYS = {
    seedVersion: 'fiqh_demo_seed_version',
    sections: 'fiqh_demo_sections',
    lessons: 'fiqh_demo_lessons',
    content: 'fiqh_demo_lesson_content',
    quizzes: 'fiqh_demo_quizzes',
    books: 'fiqh_demo_books',
    notes: 'fiqh_demo_notes',
    searchHistory: 'fiqh_demo_search_history',
    progress: (uid) => `fiqh_demo_progress_${uid}`,
    settings: (uid) => `fiqh_demo_settings_${uid}`,
    userId: 'userId'
  };

const DEMO_USER = { uid: 'demo-user', email: 'demo@fiqh.app' };

// Bump this whenever the seeded content changes so returning users get the
// new demo data instead of a stale localStorage copy.
const SEED_VERSION = 'quiz-v6';

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

const seedSections = [
  {
    id: 'kitab-al-tawhid',
    title_ar: 'كتاب التوحيد',
    title_en: 'Kitab al-Tawhid',
    description_ar: 'كتاب للإمام المجدد محمد بن عبد الوهاب في توحيد العبادة وما يناقضه من الشرك الأكبر والأصغر، مع أدلته من الكتاب والسنة وآثار السلف، وبيان ما يجب على العبد من توحيد الله وحده.',
    description_en: 'A book by the Reviver Imam Muhammad ibn Abd al-Wahhab on the oneness of worship (Tawhid) and what negates it of major and minor shirk, with evidence from the Quran, Sunnah, and the Salaf, explaining what is incumbent upon the servant in singling out Allah alone.',
    order: 1
  },
  {
    id: 'thalatha-al-usul',
    title_ar: 'متن ثلاثة الأصول وأدلتها',
    title_en: 'Thalathat al-Usul',
    description_ar: 'متن للإمام محمد بن عبد الوهاب في الأصول الثلاثة التي يجب على كل مسلم معرفتها والعمل بها: معرفة العبد ربه، ومعرفة دينه، ومعرفة نبيه ﷺ، مع أدلتها من الكتاب والسنة.',
    description_en: 'A text by Imam Muhammad ibn Abd al-Wahhab on the three fundamentals every Muslim must know and act upon: knowing his Lord, his religion, and his Prophet, with their evidences from the Quran and Sunnah.',
    order: 2
  },
  {
    id: 'al-aqidah-al-wasitiyyah',
    title_ar: 'العقيدة الواسطية',
    title_en: 'Al-Aqidah al-Wasitiyyah',
    description_ar: 'رسالة لشيخ الإسلام ابن تيمية في بيان عقيدة أهل السنة والجماعة في أسماء الله وصفاته والقدر والإيمان واليوم الآخر، بأسلوب يعتمد على نصوص الكتاب والسنة وإجماع السلف.',
    description_en: 'A treatise by Shaykh al-Islam Ibn Taymiyyah expounding the creed of Ahl al-Sunnah wal-Jama\'ah regarding Allah\'s names and attributes, Qadar, faith, and the Hereafter, grounded in the Quran, Sunnah, and the consensus of the Salaf.',
    order: 3
  },
  {
    id: 'kashf-al-shubuhat',
    title_ar: 'كتاب كشف الشبهات',
    title_en: 'Kashf al-Shubuhat',
    description_ar: 'رسالة للإمام محمد بن عبد الوهاب تكشف الشبهات التي يثيرها المخالفون حول التوحيد وعبادة الله وحده، مع الرد عليها بالأدلة من الكتاب والسنة.',
    description_en: 'A treatise by Imam Muhammad ibn Abd al-Wahhab unveiling the ambiguities raised against Tawheed and the worship of Allah alone, responding to them with evidence from the Quran and Sunnah.',
    order: 4
  },
  {
    id: 'tafsir-al-baghawi',
    title_ar: 'تفسير البغوي',
    title_en: 'Tafsir al-Baghawi',
    description_ar: 'تفسير جامع للإمام البغوي يجمع بين التفسير بالمأثور وعرض أقوال المفسرين بأسلوب متوسط، مع عناية بالقراءات وذكر أسباب النزول والأحكام المستنبطة.',
    description_en: 'A comprehensive tafsir by Imam al-Baghawi combining transmitted interpretation with the views of early commentators in a moderate style.',
    order: 5
  },
  {
    id: 'musnad-abi-dawud',
    title_ar: 'مسند أبي داود الطيالسي',
    title_en: 'Musnad Abi Dawud al-Tayalisi',
    description_ar: 'مسند الإمام الطيالسي أحد مسانيد الحديث المبكرة، جمع فيه أحاديث الصحابة مرفوعةً إلى النبي ﷺ، ويعد من أصول كتب السنة.',
    description_en: "One of the early hadith musnads compiled by Imam al-Tayalisi, gathering the marfu' ahadith of the Companions.",
    order: 6
  },
  {
    id: 'sahih-al-bukhari',
    title_ar: 'صحيح البخاري',
    title_en: 'Sahih al-Bukhari',
    description_ar: 'أصح كتاب بعد كتاب الله تعالى، جمع فيه الإمام البخاري أصح ما روي من أحاديث النبي ﷺ في العقائد والأحكام والآداب وغيرها، بعد تمحيص شديد واستيفاء لشروط الصحة.',
    description_en: 'The most authentic book after the Book of Allah, compiling the soundest narrations of the Prophet in creed, rulings, and manners.',
    order: 7
  },
  {
    id: 'sahih-muslim',
    title_ar: 'صحيح مسلم',
    title_en: 'Sahih Muslim',
    description_ar: 'أحد أصح كتب الحديث بعد صحيح البخاري، جمع الإمام مسلم فيه الحديث الصحيح مرتبًا على الأبواب، مع اهتمامه البالغ بالترتيب والجمع بين الطرق.',
    description_en: 'One of the most authentic hadith collections, compiled by Imam Muslim arranged by chapters.',
    order: 8
  },
  {
    id: 'sunan-al-nasai',
    title_ar: 'سنن النسائي',
    title_en: "Sunan al-Nasa'i",
    description_ar: 'من دواوين السنة الستة، صنفه الإمام النسائي في السنن والأحكام، ويتميز بمنهجه النقدي في علل الحديث.',
    description_en: "One of the six canonical hadith collections, known for its critical method regarding hadith defects.",
    order: 9
  },
  {
    id: 'sunan-al-tirmidhi',
    title_ar: 'سنن الترمذي',
    title_en: 'Sunan al-Tirmidhi',
    description_ar: 'جامع الترمذي من دواوين السنة، يتميز ببيانه لدرجة كل حديث من الصحة والحسن والضعف، وبعنايته بعلل الأحاديث ومعرفة الرجال.',
    description_en: 'Jami\' al-Tirmidhi, one of the six canonical collections, distinguished by grading each hadith.',
    order: 10
  },
  {
    id: 'tafsir-al-qurtubi',
    title_ar: 'تفسير القرطبي',
    title_en: 'Tafsir al-Qurtubi',
    description_ar: 'تفسير جامع لأحكام القرآن للعلامة القرطبي، يعنى بآيات الأحكام والاستنباطات الفقهية مع العناية باللغة والقراءات والناسخ والمنسوخ.',
    description_en: "A comprehensive commentary on the rulings of the Quran by al-Qurtubi.",
    order: 11
  },
  {
    id: 'tafsir-al-tabari',
    title_ar: 'تفسير الطبري',
    title_en: 'Tafsir al-Tabari',
    description_ar: 'أمّ التفاسير بالمأثور، روى فيه الإمام الطبري أقوال السلف بأسانيدها وعلّق عليها، فكان مرجعًا لكل من جاء بعده من المفسرين.',
    description_en: 'The mother of transmitted tafsir, narrating the sayings of the Salaf with their chains.',
    order: 12
  },
  {
    id: 'tafsir-al-shawkani',
    title_ar: 'تفسير الشوكاني',
    title_en: 'Tafsir al-Shawkani',
    description_ar: 'تفسير للإمام الشوكاني يجمع بين التفسير بالمأثور وبين الدراية والاستنباط، مع عناية بعلوم القرآن والبلاغة والترجيح بين الأقوال.',
    description_en: 'A tafsir by Imam al-Shawkani combining transmitted interpretation with independent deduction.',
    order: 13
  },
  {
    id: 'tafsir-ibn-kathir',
    title_ar: 'تفسير ابن كثير',
    title_en: 'Tafsir Ibn Kathir',
    description_ar: 'من أشهر كتب التفسير بالمأثور، فسّر فيه الحافظ ابن كثير القرآن بالقرآن ثم بالحديث وأقوال الصحابة والتابعين، بأسلوب متميز في الترجيح والنقد.',
    description_en: 'One of the most famous transmitted tafsirs, interpreting the Quran by the Quran then by hadith.',
    order: 14
  },
  {
    id: 'qisas-min-sahih-al-bukhari',
    title_ar: '50 من قصص صحيح البخاري',
    title_en: '50 Stories from Sahih al-Bukhari',
    description_ar: 'مجموعة من خمسين قصة منتقاة من صحيح البخاري بأسلوب مبسط مناسب للأطفال والناشئة، لترسيخ القيم والمعاني من السنة النبوية.',
    description_en: 'A collection of fifty stories selected from Sahih al-Bukhari in a simple style suited for children and young readers.',
    order: 15
  },
  {
    id: 'adab',
    title_ar: 'أدب',
    title_en: 'Adab',
    description_ar: ' كتب الأدب والشعر والبلاغة العربية: دواوين الشعر الجاهلي، المعلقات، كتب البلاغة، وكتب الأدب الكلاسيكية.',
    description_en: 'Books of Arabic literature, poetry, and rhetoric: pre-Islamic poetry diwans, the Mu\'allaqat, rhetoric works, and classical literary texts.',
    order: 16,
    booksCount: 14
  },
  // Category entries. A section whose id is not a book id is treated as a
  // category browser: SectionsPage links it to /books?category=<title_ar>, so
  // every category in books.js needs one or its books are unreachable from
  // /sections (see SectionsPage.categoryLabel / sectionLink).
  {
    id: 'cat-tawhid-aqeedah',
    title_ar: 'التوحيد والعقيدة',
    title_en: 'Tawhid and Aqeedah',
    description_ar: 'كتب العقيدة والتوحيد: العقيدة الواسطية، كتاب التوحيد، متن الأصول الثلاثة، وكشف الشبهات — مباني الدين وأصول الإيمان.',
    description_en: 'Works on Aqeedah and Tawhid: Al-Aqidah al-Wasitiyyah, Kitab al-Tawhid, Thalathat al-Usul, and Kashf al-Shubuhat — the foundations of the religion and of faith.',
    order: 17,
    booksCount: 4
  },
  {
    id: 'cat-hadith',
    title_ar: 'الحديث',
    title_en: 'Hadith',
    description_ar: 'دواوين السنة: صحيح البخاري، صحيح مسلم، سنن أبي داود، سنن الترمذي، وسنن النسائي.',
    description_en: 'The canonical hadith collections: Sahih al-Bukhari, Sahih Muslim, Sunan Abi Dawud, Jami’ al-Tirmidhi, and Sunan al-Nasa’i.',
    order: 18,
    booksCount: 5
  },
  {
    id: 'cat-tafsir',
    title_ar: 'التفسير',
    title_en: 'Tafsir',
    description_ar: 'كتب تفسير القرآن الكريم: تفسير ابن كثير، والقرطبي، والطبري، والبغوي، والشوكاني.',
    description_en: 'Commentaries on the Quran: Ibn Kathir, al-Qurtubi, al-Tabari, al-Baghawi, and al-Shawkani.',
    order: 19,
    booksCount: 5
  },
  {
    id: 'cat-stories',
    title_ar: 'القصص',
    title_en: 'Stories',
    description_ar: 'قصص مختارة من صحيح البخاري بأسلوب مبسط مناسب للناشئة، ترسيخًا لقيم السنة ومعانيها.',
    description_en: 'Selected stories from Sahih al-Bukhari in a simple style suited for young readers, instilling the values and meanings of the Sunnah.',
    order: 20,
    booksCount: 1
  }
];

const seedLessons = [
  {
    id: 'tawhid-book',
    sectionId: 'kitab-al-tawhid',
    order: 1,
    level: 'beginner',
    pdfUrl: '/books/kitab-al-tawhid.pdf',
    pages: 168,
    title_ar: 'كتاب التوحيد — النص الكامل (PDF)',
    title_en: 'Kitab al-Tawhid — Full Text (PDF)'
  },
  {
    id: 'thalatha-book',
    sectionId: 'thalatha-al-usul',
    order: 1,
    level: 'beginner',
    pdfUrl: '/books/thalathat-al-usul.pdf',
    pages: 21,
    title_ar: 'متن ثلاثة الأصول وأدلتها — النص الكامل (PDF)',
    title_en: 'Thalathat al-Usul — Full Text (PDF)'
  },
  {
    id: 'wasitiyyah-book',
    sectionId: 'al-aqidah-al-wasitiyyah',
    order: 1,
    level: 'intermediate',
    pdfUrl: '/books/al-aqidah-al-wasitiyyah.pdf',
    pages: 160,
    title_ar: 'العقيدة الواسطية — النص الكامل (PDF)',
    title_en: 'Al-Aqidah al-Wasitiyyah — Full Text (PDF)'
  },
  {
    id: 'kashf-book',
    sectionId: 'kashf-al-shubuhat',
    order: 1,
    level: 'intermediate',
    pdfUrl: '/books/kashf-al-shubuhat.pdf',
    pages: 60,
    title_ar: 'كشف الشبهات — النص الكامل (PDF)',
    title_en: 'Kashf al-Shubuhat — Full Text (PDF)'
  }
];

// Text blocks are only rendered for lessons without a `pdfUrl`
// (LessonDetailPage prefers the PDF reader), and every seeded lesson is
// PDF-backed, so no text blocks are seeded.
const seedContent = [];

// One quiz per seeded lesson. Every seeded lesson is PDF-backed and shows a
// "quiz" button, so an empty list meant /quiz/:lessonId always hit its
// "no quiz" empty state.
//
// Shape (per docs/superpowers/specs): questions[] carry localized question and
// options text plus the index of the correct option.
const seedQuizzes = [
  {
    id: 'quiz-tawhid-book',
    lessonId: 'tawhid-book',
    title_ar: 'اختبار كتاب التوحيد',
    title_en: 'Kitab al-Tawhid Quiz',
    questions: [
      {
        question_ar: 'من هو مؤلف كتاب التوحيد؟',
        question_en: 'Who is the author of Kitab al-Tawhid?',
        options_ar: [
          'الإمام محمد بن عبد الوهاب',
          'شيخ الإسلام ابن تيمية',
          'الإمام أحمد بن حنبل',
          'الإمام الشافعي'
        ],
        options_en: [
          'Imam Muhammad ibn Abd al-Wahhab',
          'Shaykh al-Islam Ibn Taymiyyah',
          'Imam Ahmad ibn Hanbal',
          'Imam al-Shafi’i'
        ],
        correctAnswer: 0,
        explanation_ar:
          'كتاب التوحيد من كتب العقيدة التي كتبها الإمام محمد بن عبد الوهاب، بتخريج شيخ الإسلام ابن تيمية وغيره، وهو أشهر كتب العقيدة المعاصرة.',
        explanation_en:
          'Kitab al-Tawhid is one of the Aqeedah works of Imam Muhammad ibn Abd al-Wahhab, edited by Shaykh al-Islam Ibn Taymiyyah and others, and it is the best-known modern work on the subject.'
      },
      {
        question_ar: 'ما المقصود بتوحيد الألوهية؟',
        question_en: 'What does Tawhid al-Uluhiyyah mean?',
        options_ar: [
          'إفراد الله تعالى وحده بالعبادة التي لا يحق لأحد سواه',
          'تصحيح أخطاء الطباعة في الكتب',
          'بيان أحكام التجارة في الأسواق',
          'ترجمة الكتب إلى اللغات الأخرى'
        ],
        options_en: [
          'Singling out Allah alone for the worship that belongs to no one but Him',
          'Correcting typographical errors in books',
          'Setting out the rulings of trade in the markets',
          'Translating books into other languages'
        ],
        correctAnswer: 0,
        explanation_ar:
          'أصل توحيد الألوهية إفراد الله تعالى وحده بما يختص به من العبادات والدعوات، فكل عبادة لا يصح أن تذهب إلى غير الله فهي شرك.',
        explanation_en:
          'Tawhid al-Uluhiyyah means dedicating to Allah alone the acts of worship that belong to no one but Him; any worship directed elsewhere is shirk.'
      },
      {
        question_ar: 'ما الحكمة التي من أجلها وضع المؤلف هذا الكتاب؟',
        question_en: 'Why did the author write this book?',
        options_ar: [
          'بيان حقيقة توحيد العبادة وحده لله تعالى، وبيان ما بطل من هذه الحقيقة بسبب الشرك',
          'جمع شعر الشعراء الجاهليين',
          'شرح قوانين الدولة التي تحكم المسلمين',
          'تهذيب كتب النحو والصرف'
        ],
        options_en: [
          'To set out the reality of worshipping Allah alone, and what spoils it through shirk',
          'To collect pre-Islamic poetry',
          'To explain the laws by which Muslims are governed',
          'To refine grammar and morphology books'
        ],
        correctAnswer: 0,
        explanation_ar:
          'صرّح المؤلف في مقدمته أن الحكمة من الكتاب بيان توحيد العبادة لله وحده، وبيان أن هذه الحقيقة بطل منها ما كان قبل الإسلام.',
        explanation_en:
          'The author states in his preface that the purpose is to explain worshipping Allah alone and to expose the shirk that spoiled it before Islam.'
      },
      {
        question_ar: 'ما نوعا الشرك اللذان حذّر المؤلف منهما؟',
        question_en: 'Which two kinds of shirk does the author warn against?',
        options_ar: [
          'الشرك الأكبر والشرك الأصغر',
          'الشرك الظاهر والشرك الخفي',
          'شرك العبادة وشرك المحبة',
          'شرك الحول وقوة الشبح'
        ],
        options_en: [
          'Major shirk and minor shirk',
          'Apparent shirk and hidden shirk',
          'Shirk of worship and shirk of love',
          'Shirk of hul (assimilating God to creation) and the strength of a jinn'
        ],
        correctAnswer: 0,
        explanation_ar:
          'بيّن المؤلف أن ضد توحيد الألوهية هو الشرك، وأن منه صغيرًا كالسريان، وكبيرًا كسوء العتق بغير الله، وكلاهما محرم.',
        explanation_en:
          'The author shows that the opposite of Tawhid al-Uluhiyyah is shirk, both minor (such as riya) and major (such as enslaving what is other than Allah to Him), and both are forbidden.'
      },
      {
        question_ar: 'أي هذه الأمثلة أشهر ما استدل به المؤلف على الشرك الأصغر؟',
        question_en: 'Which of these is the author’s best-known example of minor shirk?',
        options_ar: ['الرياء', 'الكذب', 'الغيبة', 'الظلم'],
        options_en: ['Riya (showing off)', 'Lying', 'Gheebah (backbiting)', 'Oppression'],
        correctAnswer: 0,
        explanation_ar:
          'الرياء من أشهر أمثلة الشرك الأصغر؛ لأنه قصد الاستغناء بالنظر، فصار العمل لأجل من يعلمه من الخلق لا لأجل الله تعالى.',
        explanation_en:
          'Riya is one of the clearest examples of minor shirk, because it makes the deed partly for people to see rather than for Allah alone.'
      }
    ]
  },
  {
    id: 'quiz-thalatha-book',
    lessonId: 'thalatha-book',
    title_ar: 'اختبار متن الأصول الثلاثة',
    title_en: 'Thalathat al-Usul Quiz',
    questions: [
      {
        question_ar: 'ما الأصول التي يجب على كل مسلم معرفتها والعمل بها؟',
        question_en: 'What are the fundamentals every Muslim must know and act upon?',
        options_ar: [
          'معرفة العبد ربه، ومعرفة دينه، ومعرفة نبيه ﷺ',
          'الأركان الأربعة',
          'أركان الإيمان',
          'مبادئ فقه المعاملات'
        ],
        options_en: [
          'Knowing his Lord, knowing his religion, and knowing his Prophet ﷺ',
          'The four pillars',
          'The pillars of faith',
          'The principles of transactional fiqh'
        ],
        correctAnswer: 0,
        explanation_ar:
          'هذا هو الموضوع الذي عقده المؤلف لكتابه، وقد بين أن الأصول ثلاثة لا رابع لها.',
        explanation_en:
          'This is the very subject the author set out to cover, and he shows that there are three fundamentals and no fourth.'
      },
      {
        question_ar: 'ما أركان الإيمان التي عقدها المؤلف في متنه؟',
        question_en: 'Which pillars of faith did the author establish in his text?',
        options_ar: [
          'الإيمان بالله، والإيمان برسوله، والإيمان باليوم الآخر',
          'الإيمان بالله، والإيمان بالملائكة، والإيمان بالكتب فقط',
          'الإيمان بالقدر، والإيمان بأصحابه، والإيمان بالسلف',
          'الإيمان بالاجتهاد، والإيمان بالمذاهب، والإيمان بالمساجد'
        ],
        options_en: [
          'Belief in Allah, belief in His Messenger, and belief in the Last Day',
          'Belief in Allah, the angels, and the books only',
          'Belief in Qadar, the Companions, and the Salaf',
          'Belief in ijtihad, the schools, and the mosques'
        ],
        correctAnswer: 0,
        explanation_ar:
          'عقد المؤلف أركان الإيمان الثلاثة: الإيمان بالله، وب رسوله، وباليوم الآخر، ثم ذكر تفصيل كل ركن منها.',
        explanation_en:
          'The author establishes the three pillars: belief in Allah, in His Messenger, and in the Last Day, then details each one.'
      },
      {
        question_ar: 'على كم أصل بُني متن الأصول الثلاثة؟',
        question_en: 'How many fundamentals is Thalathat al-Usul built on?',
        options_ar: ['ثلاثة', 'أربعة', 'خمسة', 'ستة'],
        options_en: ['Three', 'Four', 'Five', 'Six'],
        correctAnswer: 0,
        explanation_ar: 'سُمّي المتن بذلك لكونه مختصرًا في بيان الأصول الثلاثة وأدلتها من الكتاب والسنة.',
        explanation_en:
          'It is named Thalathat (three) al-Usul because it briefly sets out the three fundamentals together with their evidences.'
      },
      {
        question_ar: 'من أين استدل المؤلف على أصوله؟',
        question_en: 'What are the author’s sources for these fundamentals?',
        options_ar: ['الكتاب والسنة', 'العقل المجرد', 'أقوال الفلاسفة', 'الذوق والسلوك'],
        options_en: ['The Quran and the Sunnah', 'Pure reason', 'The philosophers', 'Taste and spiritual states'],
        correctAnswer: 0,
        explanation_ar:
          'صرّح المؤلف في أول المتن أن أصوله أدلتها من الكتاب والسنة، ولم يستند في أصل إلى قول أحد من القائلين.',
        explanation_en:
          'The author states at the outset that the evidences for his fundamentals come from the Quran and the Sunnah.'
      },
      {
        question_ar: 'ما الذي أمر به المتن على من أراد أن يتعلم الدين ويتقنه؟',
        question_en: 'What does the text command of one who wants to learn the religion properly?',
        options_ar: [
          'أن يتعلم الدين على يد عالم من أهل العلم بالسنة والكتاب',
          'أن يعتمد على ما يقود إليه قلبه من الفطرة',
          'أن يقرأ كتب الفلسفة والكلام',
          'أن يجتهد في آراء الفقهاء فقط'
        ],
        options_en: [
          'To learn the religion from a scholar versed in the Book and the Sunnah',
          'To rely on whatever his innate disposition leads him to',
          'To read the works of the philosophers and theologians',
          'To follow the opinions of the jurists alone'
        ],
        correctAnswer: 0,
        explanation_ar:
          'بيّن المؤلف أن طلب العلم الشرعي لا يكون إلا طلبًا للعلم، وبيّن في مقدمة المتن فضل ذلك الطلب.',
        explanation_en:
          'The author shows that religious knowledge is only to be sought from those who know the Book and the Sunnah, and praises that pursuit.'
      }
    ]
  },
  {
    id: 'quiz-wasitiyyah-book',
    lessonId: 'wasitiyyah-book',
    title_ar: 'اختبار العقيدة الواسطية',
    title_en: 'Al-Aqidah al-Wasitiyyah Quiz',
    questions: [
      {
        question_ar: 'من هو مؤلف العقيدة الواسطية؟',
        question_en: 'Who is the author of Al-Aqidah al-Wasitiyyah?',
        options_ar: [
          'شيخ الإسلام ابن تيمية',
          'الإمام ابن القيم',
          'الإمام الذهبي',
          'ابن رجب الحنبلي'
        ],
        options_en: [
          'Shaykh al-Islam Ibn Taymiyyah',
          'Imam Ibn al-Qayyim',
          'Imam al-Dhahabi',
          'Ibn Rajab al-Hanbali'
        ],
        correctAnswer: 0,
        explanation_ar:
          'العقيدة الواسطية من أشهر رسائل شيخ الإسلام ابن تيمية في العقيدة، وقد شرحها كثير من أهل السنة من بعده.',
        explanation_en:
          'Al-Aqidah al-Wasitiyyah is one of Shaykh al-Islam Ibn Taymiyyah’s best-known treatises on Aqeedah, and it has been commented on by many Ahl al-Sunnah since.'
      },
      {
        question_ar: 'ما موضوع هذه الرسالة؟',
        question_en: 'What is the subject of this treatise?',
        options_ar: [
          'بيان عقيدة أهل السنة والجماعة في الأسماء والصفات والقدر وما سوى ذلك',
          'بيان أحكام المعاملات في الأسواق',
          'شرح مختصر لكتب النحو',
          'ترجمة سيرة النبي ﷺ'
        ],
        options_en: [
          'Setting out the creed of Ahl al-Sunnah wal-Jama’ah concerning the names and attributes, Qadar, and the rest',
          'Setting out the rulings of commercial transactions',
          'A brief commentary on grammar books',
          'Translating the life of the Prophet ﷺ'
        ],
        correctAnswer: 0,
        explanation_ar:
          'قصد المؤلف في الرسالة بيان ما اتفق عليه أهل السنة من العقيدة، وبيان مسائل الخلاف وذكر أقوال الأئمة فيها.',
        explanation_en:
          'The author’s aim is to state the creed on which Ahl al-Sunnah agree, and to lay out the disputed questions with the views of the leading scholars.'
      },
      {
        question_ar: 'ما المنهج الذي سلكه المؤلف في عرض مسائل العقيدة؟',
        question_en: 'What method did the author follow in presenting the issues of Aqeedah?',
        options_ar: [
          'بيان الاتفاق والاختلاف بين أهل السنة، وذكر أقوال الأئمة وأدلتهم',
          'إسقاط أقوال المخالفين دون ذكر',
          'الاكتفاء بالمذهب المختار دون غيره',
          'الترتيب على أبواب الفقه'
        ],
        options_en: [
          'Stating where Ahl al-Sunnah agree and differ, with the views and proofs of the scholars',
          'Passing over the views of the opponents in silence',
          'Giving only the chosen school with no mention of others',
          'Arranging the material under the chapters of fiqh'
        ],
        correctAnswer: 0,
        explanation_ar:
          'هذه من سمات الرسالة؛ فهو يعرض المسألة ويذكر قول الأئمة فيها، ثم يبيّن الصواب وما له وجوه من الأدلة.',
        explanation_en:
          'This is characteristic of the treatise: each issue is presented with the views of the scholars, then the correct position and its reasons.'
      },
      {
        question_ar: 'ماذا يفعل المؤلف حين يذكر أقوال الأئمة المختلفين في مسألة؟',
        question_en: 'What does the author do when he mentions scholars who differ on an issue?',
        options_ar: [
          'يبيّن قول كل واحد، ويصوب ويخطئ، ويذكر دليله',
          'يحذف القول المخالف ولا يذكره',
          'ينقله دون بيان أيّها الصحيح',
          'يجرح صاحب القول ولا يذكره'
        ],
        options_en: [
          'He explains each view, states which is correct, and gives its proof',
          'He deletes the contrary view without mentioning it',
          'He reports it without saying which one is correct',
          'He disparages its author and passes it by'
        ],
        correctAnswer: 0,
        explanation_ar:
          'منهج أهل السنة في الاختلاف أن يذكر كل ويبين الصحيح منه، لا أن يحذف ولا أن يجرح، وهذا ما سلكه المؤلف.',
        explanation_en:
          'The Salaf’s method is to report each view and clarify which is sound — neither to suppress it nor to attack its author.'
      },
      {
        question_ar: 'من أين تُثبت الصفات أو تُنفي على قول أهل السنة؟',
        question_en: 'According to Ahl al-Sunnah, from where are the attributes established and negated?',
        options_ar: [
          'من الكتاب والسنة الصحيحة، مع إثباتها وعدم نفيها وحفظها',
          'من العقل وحده دون نص',
          'من آراء أهل الخلاف',
          'من الفطرة وحدها'
        ],
        options_en: [
          'From the Book and the sound Sunnah, affirming them without negating them and preserving them',
          'From reason alone, with no textual proof',
          'From the opinions of the schools of difference',
          'From innate human nature alone'
        ],
        correctAnswer: 0,
        explanation_ar:
          'قاعدة أهل السنة في الصفات أن يثبتوا ما أثبته الكتاب والسنة لله، ولا ينفون شيئًا منها، وينفون ضدّها فقط.',
        explanation_en:
          'Ahl al-Sunnah affirm whatever the Book and Sunnah establish for Allah, negate nothing of them, and reject only their opposites.'
      }
    ]
  },
  {
    id: 'quiz-kashf-book',
    lessonId: 'kashf-book',
    title_ar: 'اختبار كشف الشبهات',
    title_en: 'Kashf al-Shubuhat Quiz',
    questions: [
      {
        question_ar: 'من هو مؤلف كشف الشبهات؟',
        question_en: 'Who is the author of Kashf al-Shubuhat?',
        options_ar: [
          'الإمام محمد بن عبد الوهاب',
          'شيخ الإسلام ابن تيمية',
          'الإمام مالك بن أنس',
          'الإمام أبو حنيفة'
        ],
        options_en: [
          'Imam Muhammad ibn Abd al-Wahhab',
          'Shaykh al-Islam Ibn Taymiyyah',
          'Imam Malik ibn Anas',
          'Imam Abu Hanifah'
        ],
        correctAnswer: 0,
        explanation_ar:
          'كشف الشبهات رسالة قصيرة ألّفها الإمام محمد بن عبد الوهاب، وهي من أشهر ما كُتب في رد الشبهات عن التوحيد.',
        explanation_en:
          'Kashf al-Shubuhat is a short treatise by Imam Muhammad ibn Abd al-Wahhab, among the best-known works refuting doubts about Tawheed.'
      },
      {
        question_ar: 'ما موضوع الرسالة؟',
        question_en: 'What is the subject of the treatise?',
        options_ar: [
          'كشف شبهات المخالفين في التوحيد والرد عليها بالبيان والبرهان',
          'شرح مختصر لأحكام الربا',
          'بيان أصول السياسية الداخلية',
          'جمع الأحاديث الضعيفة'
        ],
        options_en: [
          'Uncovering the doubts raised against Tawheed and refuting them with proof and demonstration',
          'A brief explanation of the rulings of riba (usury)',
          'A statement of internal political principles',
          'Collecting weak hadith'
        ],
        correctAnswer: 0,
        explanation_ar:
          'المؤلف في هذه الرسالة يفك الشبهات التي يحتاج إلى توضيحها طالب الحق، ويورد شبه المخالفين ثم يبيّن فسادها.',
        explanation_en:
          'The author sets out the doubts a seeker of truth needs answered, quoting the opponent’s objection and then showing its falsity.'
      },
      {
        question_ar: 'ما الأسلوب الذي استخدمه المؤلف في الرد على الشبهات؟',
        question_en: 'What method did the author use to answer the doubts?',
        options_ar: [
          'البيان والبرهان، وإثبات الأدلة من الكتاب والسنة',
          'الاكتفاء بالسخرية من المخالف',
          'ترك الشبهات دون جواب',
          'الاعتماد على الآراء والأقوال'
        ],
        options_en: [
          'Clear demonstration and proof, establishing the evidence from the Book and the Sunnah',
          'Answering with nothing but ridicule of the opponent',
          'Leaving the doubts unanswered',
          'Relying on opinions and sayings'
        ],
        correctAnswer: 0,
        explanation_ar:
          'صرّح المؤلف بأنه بيّن الشبه وأبطلها بالبيان والبرهان، وكل ذلك بأدلة الكتاب والسنة وآثار السلف.',
        explanation_en:
          'The author states that he uncovers the doubts and invalidates them by demonstration and proof, drawing on the Book, the Sunnah, and the Salaf.'
      },
      {
        question_ar: 'لماذا سُمّيت الرسالة بهذا الاسم؟',
        question_en: 'Why is the treatise given this name?',
        options_ar: [
          'لأنها تكشف ما في نفوس الناس من الشبهات وتبيّن فسادها',
          'لأنها تجمع كتب المؤلف الأخرى',
          'لأنها تتناول علوم الفلك',
          'لأنها رسالة قصيرة جدًّا'
        ],
        options_en: [
          'Because it uncovers the doubts lurking in people’s hearts and shows their falsity',
          'Because it collects the author’s other works',
          'Because it ventures into the sciences of astronomy',
          'Because it is an extremely short letter'
        ],
        correctAnswer: 0,
        explanation_ar:
          'سُمّيت كشف الشبهات لبيان أن ما في القلب من شكوك إنما أثر فاسد، وأدلة الكتاب والسنة تبيّن بطلانه.',
        explanation_en:
          'It is named Kashf al-Shubuhat because the doubts in the heart are unsound, and the proofs of the Book and Sunnah show their falsity.'
      },
      {
        question_ar: 'ماذا يلزم من عاد بعد بيان بطلان الشبه إلى ما أُبطل؟',
        question_en: 'What follows for one who, after the falsity has been shown, returns to the doubts?',
        options_ar: [
          'يكون قد اختار البطل بعد بيانه',
          'يكون قد أحسن الظن بالمؤلف',
          'يجوز له العودة إلى رأيه',
          'لا يلزمه شيء من ذلك'
        ],
        options_en: [
          'He has knowingly chosen falsehood after it was made clear',
          'He has shown good faith towards the author',
          'He is free to return to his own view',
          'Nothing at all follows from that'
        ],
        correctAnswer: 0,
        explanation_ar:
          'بيّن المؤلف أن من عاد بعد البيان إلى ما أُبطل فهو مسؤول عن ذلك، واستدل بقوله تعالى: (فَمَن يُرِدِ اللَّهُ بِهِ خَيْرًا فَهُوَ خَيْرٌ لَهُ).',
        explanation_en:
          'The author notes that whoever returns to what has been refuted after the proof bears the responsibility himself, citing the verse: whoever Allah intends good for, He will guide.'
      }
    ]
  }
];

// ---------------------------------------------------------------------------
// localStorage helpers
// ---------------------------------------------------------------------------

const delay = (ms = 120) => new Promise((resolve) => setTimeout(resolve, ms));

const read = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    console.error(`Error reading mock data [${key}]:`, error);
    return fallback;
  }
};

const write = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing mock data [${key}]:`, error);
  }
};

// Seed demo data + a default user id on first run so progress persists.
// When the stored seed version differs, the seeded content is refreshed.
const ensureSeedData = () => {
  if (read(KEYS.seedVersion, null) !== SEED_VERSION) {
    write(KEYS.sections, seedSections);
    write(KEYS.lessons, seedLessons);
    write(KEYS.content, seedContent);
    write(KEYS.quizzes, seedQuizzes);
    write(KEYS.seedVersion, SEED_VERSION);
  }
  if (!localStorage.getItem(KEYS.userId)) {
    localStorage.setItem(KEYS.userId, DEMO_USER.uid);
  }
};

try {
  ensureSeedData();
} catch (error) {
  console.error('Failed to seed demo data:', error);
}

// ---------------------------------------------------------------------------
// Services
// ---------------------------------------------------------------------------

export const mockAuthService = {
  signUp: async (email, _password) => {
    await delay();
    return { ...DEMO_USER, email };
  },
  signIn: async (email, _password) => {
    await delay();
    return { ...DEMO_USER, email };
  },
  signInWithGoogle: async () => {
    await delay();
    return { ...DEMO_USER };
  },
  signOut: async () => {
    await delay();
  },
  onAuthStateChanged: (callback) => {
    const timer = setTimeout(() => callback({ ...DEMO_USER }), 0);
    return () => clearTimeout(timer);
  },
  getCurrentUser: () => ({ ...DEMO_USER })
};

export const mockSectionsService = {
  getAllSections: async () => {
    await delay();
    return read(KEYS.sections, []);
  },
  getSectionById: async (sectionId) => {
    await delay();
    const sections = read(KEYS.sections, []);
    return sections.find((s) => s.id === sectionId) || null;
  },
  addSection: async (sectionData) => {
    await delay();
    const sections = read(KEYS.sections, []);
    const newSection = { ...sectionData, id: sectionData.id || `s-${Date.now()}` };
    write(KEYS.sections, [...sections, newSection]);
    return newSection.id;
  },
  updateSection: async (sectionId, sectionData) => {
    await delay();
    const sections = read(KEYS.sections, []);
    write(KEYS.sections, sections.map((s) => (s.id === sectionId ? { ...s, ...sectionData } : s)));
  },
  deleteSection: async (sectionId) => {
    await delay();
    write(KEYS.sections, read(KEYS.sections, []).filter((s) => s.id !== sectionId));
  },
  onSectionsChange: (callback) => {
    const push = () => callback(read(KEYS.sections, []));
    const timer = setTimeout(push, 0);
    return () => clearTimeout(timer);
  }
};

export const mockLessonsService = {
  getAllLessons: async () => {
    await delay();
    return read(KEYS.lessons, []);
  },
  getLessonsBySection: async (sectionId) => {
    await delay();
    return read(KEYS.lessons, [])
      .filter((l) => l.sectionId === sectionId)
      .sort((a, b) => a.order - b.order);
  },
  getLessonById: async (lessonId) => {
    await delay();
    return read(KEYS.lessons, []).find((l) => l.id === lessonId) || null;
  },
  addLesson: async (lessonData) => {
    await delay();
    const lessons = read(KEYS.lessons, []);
    const newLesson = { ...lessonData, id: lessonData.id || `l-${Date.now()}` };
    write(KEYS.lessons, [...lessons, newLesson]);
    return newLesson.id;
  },
  updateLesson: async (lessonId, lessonData) => {
    await delay();
    const lessons = read(KEYS.lessons, []);
    write(KEYS.lessons, lessons.map((l) => (l.id === lessonId ? { ...l, ...lessonData } : l)));
  },
  deleteLesson: async (lessonId) => {
    await delay();
    write(KEYS.lessons, read(KEYS.lessons, []).filter((l) => l.id !== lessonId));
  }
};

// The library is seeded from src/data/books.js (the single place where books
// are maintained). Books added or edited through the service API are stored
// separately in localStorage and merged over the seed, so existing books are
// never replaced and new books can be added at any time.
const mergeBooks = (seed, custom) => {
  const map = new Map();
  seed.forEach((book) => map.set(book.id, book));
  custom.forEach((book) => map.set(book.id, book));
  return Array.from(map.values()).sort((a, b) => (a.order || 0) - (b.order || 0));
};

const getAllBooks = async () => {
  await delay();
  return mergeBooks(SEED_BOOKS, read(KEYS.books, []));
};

export const mockBooksService = {
  getAllBooks,
  getBookById: async (bookId) => {
    const books = await getAllBooks();
    return books.find((b) => b.id === bookId) || null;
  },
  addBook: async (bookData) => {
    await delay();
    const custom = read(KEYS.books, []);
    const newBook = { ...bookData, id: bookData.id || `book-${Date.now()}` };
    write(KEYS.books, [...custom, newBook]);
    return newBook.id;
  },
  updateBook: async (bookId, bookData) => {
    await delay();
    const custom = read(KEYS.books, []);
    const existing = custom.find((b) => b.id === bookId);
    // Merge with the full (seed + custom) book so updating a field never
    // drops the book's other data such as volumes, titles, or covers.
    const current = existing || (await mockBooksService.getBookById(bookId)) || {};
    const updated = { ...current, ...bookData, id: bookId };
    write(KEYS.books, [...custom.filter((b) => b.id !== bookId), updated]);
  },
  deleteBook: async (bookId) => {
    await delay();
    write(KEYS.books, read(KEYS.books, []).filter((b) => b.id !== bookId));
  },
  addVolume: async (bookId, volumeData) => {
    await delay();
    const book = await mockBooksService.getBookById(bookId);
    if (!book) throw new Error('Book not found');
    const volumes = book.volumes || [];
    const newVolume = { ...volumeData, id: volumeData.id || `v-${Date.now()}` };
    await mockBooksService.updateBook(bookId, { volumes: [...volumes, newVolume] });
    return newVolume.id;
  },
  updateVolume: async (bookId, volumeId, volumeData) => {
    await delay();
    const book = await mockBooksService.getBookById(bookId);
    if (!book) throw new Error('Book not found');
    const volumes = (book.volumes || []).map((v) =>
      v.id === volumeId ? { ...v, ...volumeData } : v
    );
    await mockBooksService.updateBook(bookId, { volumes });
  },
  deleteVolume: async (bookId, volumeId) => {
    await delay();
    const book = await mockBooksService.getBookById(bookId);
    if (!book) throw new Error('Book not found');
    const volumes = (book.volumes || []).filter((v) => v.id !== volumeId);
    await mockBooksService.updateBook(bookId, { volumes });
  }
};

export const mockLessonContentService = {
  getLessonContent: async (lessonId) => {
    await delay();
    const contents = read(KEYS.content, []);
    const found = contents.find((c) => c.lessonId === lessonId);
    if (found) return found;
    return { id: '', lessonId, blocks: [] };
  },
  saveLessonContent: async (contentData) => {
    await delay();
    const contents = read(KEYS.content, []);
    const existing = contents.find((c) => c.lessonId === contentData.lessonId);
    if (existing) {
      const updated = { ...existing, ...contentData };
      write(KEYS.content, contents.map((c) => (c.id === existing.id ? updated : c)));
      return existing.id;
    }
    const newContent = { ...contentData, id: contentData.id || `c-${Date.now()}` };
    write(KEYS.content, [...contents, newContent]);
    return newContent.id;
  }
};

export const mockQuizzesService = {
  getQuizByLesson: async (lessonId) => {
    await delay();
    return read(KEYS.quizzes, []).filter((q) => q.lessonId === lessonId);
  },
  getQuizById: async (quizId) => {
    await delay();
    return read(KEYS.quizzes, []).find((q) => q.id === quizId) || null;
  },
  addQuiz: async (quizData) => {
    await delay();
    const quizzes = read(KEYS.quizzes, []);
    const newQuiz = { ...quizData, id: quizData.id || `q-${Date.now()}` };
    write(KEYS.quizzes, [...quizzes, newQuiz]);
    return newQuiz.id;
  },
  updateQuiz: async (quizId, quizData) => {
    await delay();
    const quizzes = read(KEYS.quizzes, []);
    write(KEYS.quizzes, quizzes.map((q) => (q.id === quizId ? { ...q, ...quizData } : q)));
  },
  deleteQuiz: async (quizId) => {
    await delay();
    write(KEYS.quizzes, read(KEYS.quizzes, []).filter((q) => q.id !== quizId));
  }
};

export const mockNotesService = {
  getNotesByLesson: async (lessonId) => {
    await delay();
    const notes = read(KEYS.notes, []);
    return notes.filter((n) => n.lessonId === lessonId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },
  addNote: async (noteData) => {
    await delay();
    const notes = read(KEYS.notes, []);
    const newNote = {
      ...noteData,
      id: noteData.id || `note-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    write(KEYS.notes, [...notes, newNote]);
    return newNote.id;
  },
  updateNote: async (noteId, noteData) => {
    await delay();
    const notes = read(KEYS.notes, []);
    write(KEYS.notes, notes.map((n) => (n.id === noteId ? { ...n, ...noteData, updatedAt: new Date().toISOString() } : n)));
  },
  deleteNote: async (noteId) => {
    await delay();
    write(KEYS.notes, read(KEYS.notes, []).filter((n) => n.id !== noteId));
  }
};

export const mockSearchHistoryService = {
  getSearchHistory: async () => {
    await delay();
    return read(KEYS.searchHistory, []);
  },
  addSearch: async (query) => {
    await delay();
    const history = read(KEYS.searchHistory, []);
    const trimmed = query.trim();
    if (!trimmed) return;
    const filtered = history.filter((item) => item.query !== trimmed);
    const updated = [{ query: trimmed, timestamp: new Date().toISOString() }, ...filtered].slice(0, 20);
    write(KEYS.searchHistory, updated);
  },
  clearSearchHistory: async () => {
    await delay();
    write(KEYS.searchHistory, []);
  }
};

export const mockUserProgressService = {
  getUserProgress: async (userId) => {
    await delay();
    if (!userId) return null;
    const stored = read(KEYS.progress(userId), null);
    if (stored) return stored;
    const now = new Date().toISOString();
    return {
      id: userId,
      userId,
      completedLessons: [],
      bookmarkedLessons: [],
      lastOpened: null,
      streaks: 0,
      readingTimeMinutes: 0,
      totalQuizzesTaken: 0,
      totalQuizScore: 0,
      averageQuizScore: 0,
      achievements: [],
      dailyGoal: 30,
      dailyGoalCompleted: false,
      lastDailyGoalDate: null,
      createdAt: now,
      updatedAt: now
    };
  },
  saveUserProgress: async (progressData) => {
    await delay();
    if (!progressData.userId) return null;
    const existing = read(KEYS.progress(progressData.userId), null);
    const dataToSave = {
      ...progressData,
      id: progressData.userId,
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    write(KEYS.progress(progressData.userId), dataToSave);
    return progressData.userId;
  },
  addCompletedLesson: async (userId, lessonId) => {
    const progress = await mockUserProgressService.getUserProgress(userId);
    if (progress) {
      const completedLessons = [...new Set([...progress.completedLessons, lessonId])];
      await mockUserProgressService.saveUserProgress({
        ...progress,
        completedLessons,
        lastOpened: lessonId
      });
    }
  },
  addBookmarkedLesson: async (userId, lessonId) => {
    const progress = await mockUserProgressService.getUserProgress(userId);
    if (progress) {
      const bookmarkedLessons = [...new Set([...progress.bookmarkedLessons, lessonId])];
      await mockUserProgressService.saveUserProgress({ ...progress, bookmarkedLessons });
    }
  },
  removeBookmarkedLesson: async (userId, lessonId) => {
    const progress = await mockUserProgressService.getUserProgress(userId);
    if (progress) {
      const bookmarkedLessons = progress.bookmarkedLessons.filter((id) => id !== lessonId);
      await mockUserProgressService.saveUserProgress({ ...progress, bookmarkedLessons });
    }
  },
  updateReadingStats: async (userId, minutesSpent) => {
    const progress = await mockUserProgressService.getUserProgress(userId);
    if (progress) {
      const readingTimeMinutes = (progress.readingTimeMinutes || 0) + minutesSpent;
      const totalQuizzesTaken = progress.totalQuizzesTaken || 0;
      const totalQuizScore = progress.totalQuizScore || 0;
      const averageQuizScore = totalQuizzesTaken > 0 ? Math.round((totalQuizScore / totalQuizzesTaken) * 100) / 100 : 0;
      const newAchievements = [...(progress.achievements || [])];
      if (readingTimeMinutes >= 60 && !newAchievements.includes('first_hour')) {
        newAchievements.push('first_hour');
      }
      if (readingTimeMinutes >= 300 && !newAchievements.includes('five_hours')) {
        newAchievements.push('five_hours');
      }
      if (progress.completedLessons.length >= 1 && !newAchievements.includes('first_lesson')) {
        newAchievements.push('first_lesson');
      }
      if (progress.completedLessons.length >= 5 && !newAchievements.includes('five_lessons')) {
        newAchievements.push('five_lessons');
      }
      if (progress.completedLessons.length >= 10 && !newAchievements.includes('ten_lessons')) {
        newAchievements.push('ten_lessons');
      }
      if (progress.streaks >= 3 && !newAchievements.includes('streak_3')) {
        newAchievements.push('streak_3');
      }
      if (progress.streaks >= 7 && !newAchievements.includes('streak_7')) {
        newAchievements.push('streak_7');
      }
      if (progress.streaks >= 30 && !newAchievements.includes('streak_30')) {
        newAchievements.push('streak_30');
      }
      const today = new Date().toISOString().split('T')[0];
      const lastDate = progress.lastDailyGoalDate;
      const dailyGoalCompleted = lastDate === today && progress.dailyGoalCompleted;
      await mockUserProgressService.saveUserProgress({
        ...progress,
        readingTimeMinutes,
        totalQuizzesTaken,
        totalQuizScore,
        averageQuizScore,
        achievements: newAchievements,
        dailyGoalCompleted,
        lastDailyGoalDate: lastDate
      });
    }
  },
  recordQuizResult: async (userId, score, total) => {
    const progress = await mockUserProgressService.getUserProgress(userId);
    if (progress) {
      const totalQuizzesTaken = (progress.totalQuizzesTaken || 0) + 1;
      const totalQuizScore = (progress.totalQuizScore || 0) + score;
      const averageQuizScore = totalQuizzesTaken > 0 ? Math.round((totalQuizScore / totalQuizzesTaken) * 100) / 100 : 0;
      const newAchievements = [...(progress.achievements || [])];
      if (score === total && !newAchievements.includes('perfect_quiz')) {
        newAchievements.push('perfect_quiz');
      }
      if (totalQuizzesTaken >= 3 && !newAchievements.includes('three_quizzes')) {
        newAchievements.push('three_quizzes');
      }
      if (averageQuizScore >= 0.8 && !newAchievements.includes('high_average')) {
        newAchievements.push('high_average');
      }
      await mockUserProgressService.saveUserProgress({
        ...progress,
        totalQuizzesTaken,
        totalQuizScore,
        averageQuizScore,
        achievements: newAchievements
      });
    }
  },
  checkDailyGoal: async (userId) => {
    const progress = await mockUserProgressService.getUserProgress(userId);
    if (!progress) return;
    const today = new Date().toISOString().split('T')[0];
    const lastDate = progress.lastDailyGoalDate;
    if (lastDate !== today) {
      const dailyGoalCompleted = (progress.readingTimeMinutes || 0) >= (progress.dailyGoal || 30);
      await mockUserProgressService.saveUserProgress({
        ...progress,
        dailyGoalCompleted,
        lastDailyGoalDate: today
      });
    }
  }
};

export const mockAppSettingsService = {
  getAppSettings: async (userId) => {
    await delay();
    if (!userId) return null;
    const stored = read(KEYS.settings(userId), null);
    if (stored) return stored;
    const now = new Date().toISOString();
    return {
      id: userId,
      userId,
      language: 'ar',
      fontSize: 'medium',
      theme: 'light',
      createdAt: now,
      updatedAt: now
    };
  },
  saveAppSettings: async (settingsData) => {
    await delay();
    if (!settingsData.userId) return null;
    const existing = read(KEYS.settings(settingsData.userId), null);
    const dataToSave = {
      ...settingsData,
      id: settingsData.userId,
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    write(KEYS.settings(settingsData.userId), dataToSave);
    return settingsData.userId;
  }
};

export default {
  auth: mockAuthService,
  sections: mockSectionsService,
  lessons: mockLessonsService,
  lessonContent: mockLessonContentService,
  quizzes: mockQuizzesService,
  books: mockBooksService,
  userProgress: mockUserProgressService,
  appSettings: mockAppSettingsService,
  notes: mockNotesService,
  searchHistory: mockSearchHistoryService
};
