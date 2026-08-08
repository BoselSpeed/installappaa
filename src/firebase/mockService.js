// Mock (demo) service layer used when Firebase is not configured.
// All data is persisted to localStorage and seeded with sample bilingual
// Fiqh content so the application is fully usable without backend access.

const KEYS = {
  sections: 'fiqh_demo_sections',
  lessons: 'fiqh_demo_lessons',
  content: 'fiqh_demo_lesson_content',
  quizzes: 'fiqh_demo_quizzes',
  progress: (uid) => `fiqh_demo_progress_${uid}`,
  settings: (uid) => `fiqh_demo_settings_${uid}`,
  userId: 'userId'
};

const DEMO_USER = { uid: 'demo-user', email: 'demo@fiqh.app' };

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

const seedSections = [
  {
    id: 'tahara',
    title_ar: 'الطهارة',
    title_en: 'Purification',
    description_ar: 'أحكام الطهارة من الحدث والخبث وأحكام الوضوء والغسل والتيمم.',
    description_en: 'Rulings of purity from minor and major ritual impurity, ablution, bathing and dry ablution.',
    order: 1
  },
  {
    id: 'salah',
    title_ar: 'الصلاة',
    title_en: 'Prayer',
    description_ar: 'أحكام الصلاة ومواقيتها وشروط صحتها وأركانها وسننها.',
    description_en: 'Rulings of prayer, its times, conditions of validity, pillars and recommended acts.',
    order: 2
  },
  {
    id: 'zakat',
    title_ar: 'الزكاة',
    title_en: 'Zakat',
    description_ar: 'أحكام الزكاة وأنواعها ونصاب الأموال ومصارفها.',
    description_en: 'Rulings of Zakat, its types, nisab thresholds on wealth and its recipients.',
    order: 3
  },
  {
    id: 'sawm',
    title_ar: 'الصيام',
    title_en: 'Fasting',
    description_ar: 'أحكام الصيام وشروطه ومبطلاته ومستحباته.',
    description_en: 'Rulings of fasting, its conditions, what invalidates it and its recommended practices.',
    order: 4
  },
  {
    id: 'hajj',
    title_ar: 'الحج والعمرة',
    title_en: 'Hajj and Umrah',
    description_ar: 'أركان الحج ومناسك العمرة وأحكام الإحرام.',
    description_en: 'The pillars of Hajj, the rituals of Umrah and the rulings of Ihram.',
    order: 5
  },
  {
    id: 'muamalat',
    title_ar: 'المعاملات',
    title_en: 'Transactions',
    description_ar: 'أحكام البيع والشراء والربا والعقود في المعاملات المالية.',
    description_en: 'Rulings of buying, selling, Riba and financial contracts in business dealings.',
    order: 6
  }
];

const seedLessons = [
  // Purification
  { id: 'tahara-1', sectionId: 'tahara', order: 1, level: 'beginner',
    title_ar: 'أهمية الطهارة وأنواعها', title_en: 'The Importance of Purity and Its Types' },
  { id: 'tahara-2', sectionId: 'tahara', order: 2, level: 'beginner',
    title_ar: 'أحكام الوضوء', title_en: 'Rulings of Ablution (Wudu)' },
  // Prayer
  { id: 'salah-1', sectionId: 'salah', order: 1, level: 'beginner',
    title_ar: 'مواقيت الصلاة', title_en: 'Prayer Times' },
  { id: 'salah-2', sectionId: 'salah', order: 2, level: 'intermediate',
    title_ar: 'شروط صحة الصلاة', title_en: 'Conditions for Valid Prayer' },
  // Zakat
  { id: 'zakat-1', sectionId: 'zakat', order: 1, level: 'intermediate',
    title_ar: 'تعريف الزكاة وحكمها', title_en: 'Definition and Ruling of Zakat' },
  { id: 'zakat-2', sectionId: 'zakat', order: 2, level: 'advanced',
    title_ar: 'زكاة المال ونصابها', title_en: 'Zakat on Wealth and Its Nisab' },
  // Fasting
  { id: 'sawm-1', sectionId: 'sawm', order: 1, level: 'beginner',
    title_ar: 'تعريف الصيام وحكمه', title_en: 'Definition and Ruling of Fasting' },
  { id: 'sawm-2', sectionId: 'sawm', order: 2, level: 'intermediate',
    title_ar: 'مبطلات الصيام', title_en: 'Things That Invalidate the Fast' },
  // Hajj
  { id: 'hajj-1', sectionId: 'hajj', order: 1, level: 'intermediate',
    title_ar: 'أركان الحج', title_en: 'Pillars of Hajj' },
  { id: 'hajj-2', sectionId: 'hajj', order: 2, level: 'intermediate',
    title_ar: 'مناسك العمرة', title_en: 'Rituals of Umrah' },
  // Transactions
  { id: 'muamalat-1', sectionId: 'muamalat', order: 1, level: 'intermediate',
    title_ar: 'أحكام البيع', title_en: 'Rulings of Sale' },
  { id: 'muamalat-2', sectionId: 'muamalat', order: 2, level: 'advanced',
    title_ar: 'الربا ومحرمات المعاملات', title_en: 'Riba and Prohibited Transactions' }
];

const seedContent = [
  {
    id: 'content-tahara-1', lessonId: 'tahara-1',
    blocks: [
      { type: 'heading', content_ar: 'الطهارة في الإسلام', content_en: 'Purity in Islam' },
      { type: 'paragraph', content_ar: 'الطهارة شرط لصحة كثير من العبادات، وهي من أهم الأمور التي اهتم بها الإسلام، قال الله تعالى: «إن الله يحب التوابين ويحب المتطهرين».', content_en: 'Purity is a condition for the validity of many acts of worship, and it is among the most important matters in Islam. Allah the Almighty said: "Indeed, Allah loves those who are constantly repentant and loves those who purify themselves."' },
      { type: 'paragraph', content_ar: 'تنقسم الطهارة إلى قسمين: طهارة من الحدث، وطهارة من الخبث. طهارة الحدث تكون بالوضوء أو الغسل أو التيمم، أما طهارة الخبث فتكون بتطهير الجسم والثوب والمكان من النجاسات.', content_en: 'Purity is divided into two kinds: purity from ritual impurity (hadath) and purity from filth (khabath). Purity from hadath is achieved through ablution (wudu), bathing (ghusl) or dry ablution (tayammum), while purity from khabath is achieved by cleansing the body, clothing and place from physical impurities.' },
      { type: 'note', content_ar: 'أقسام المياه المستعملة في التطهير: الماء المطلق الطاهر، والماء الطاهر لكنه غير مطهر كالماء المستعمل، والماء النجس.', content_en: 'Kinds of water used for purification: pure purifying water (mutlaq), pure but non-purifying water such as water already used, and impure water.' },
      { type: 'list', content_ar: 'أهمية الطهارة:\nأنها شرط لصحة الصلاة\nأنها مفتاح العبادة والتقرب إلى الله\nأنها سبب لمحبة الله تعالى', content_en: 'Importance of purity:\nIt is a condition for the validity of prayer\nIt is the key to worship and drawing closer to Allah\nIt is a cause of Allah\'s love' }
    ]
  },
  {
    id: 'content-tahara-2', lessonId: 'tahara-2',
    blocks: [
      { type: 'heading', content_ar: 'أحكام الوضوء', content_en: 'Rulings of Ablution' },
      { type: 'paragraph', content_ar: 'الوضوء هو استخدام الماء الطاهر في غسل الأعضاء الأربعة: الوجه، واليدين إلى المرفقين، ومسح الرأس، وغسل الرجلين إلى الكعبين.', content_en: 'Ablution (wudu) is the use of pure water to wash the four areas: the face, the hands up to the elbows, wiping the head, and washing the feet up to the ankles.' },
      { type: 'paragraph', content_ar: 'يجب الوضوء للصلاة، ويستحب عند قراءة القرآن وعند النوم. وهو من الأعمال التي يرفع الله بها الدرجات ويكفر بها الخطايا.', content_en: 'Wudu is obligatory before prayer and recommended before reciting the Quran and before sleeping. It is an act by which Allah raises ranks and expiates sins.' },
      { type: 'list', content_ar: 'فرائض الوضوء:\nغسل الوجه\nغسل اليدين إلى المرفقين\nمسح الرأس\nغسل الرجلين إلى الكعبين\nالترتيب والموالاة', content_en: 'Obligatory acts of ablution:\nWashing the face\nWashing the hands up to the elbows\nWiping the head\nWashing the feet up to the ankles\nSequence and continuity' },
      { type: 'note', content_ar: 'نواقض الوضوء من أبرزها: الخارج من السبيلين، والنوم المستغرق، وزوال العقل، ولمس المرأة بشهوة عند بعض الفقهاء.', content_en: 'Among the notable nullifiers of wudu: anything exiting from the two passages, deep sleep, loss of consciousness, and touching a woman with desire according to some scholars.' }
    ]
  },
  {
    id: 'content-salah-1', lessonId: 'salah-1',
    blocks: [
      { type: 'heading', content_ar: 'مواقيت الصلاة', content_en: 'Prayer Times' },
      { type: 'paragraph', content_ar: 'الصلاة عبادة موقتة بأوقات محددة شرعاً، قال تعالى: «إن الصلاة كانت على المؤمنين كتاباً موقوتاً». ولكل صلاة من الصلوات الخمس وقت معلوم يبدأ وينتهي بعلامات شرعية.', content_en: 'Prayer is an act of worship fixed at divinely appointed times. Allah said: "Indeed, prayer has been decreed upon the believers at specified times." Each of the five prayers has a known time that begins and ends according to religious signs.' },
      { type: 'list', content_ar: 'مواقيت الصلوات الخمس:\nالفجر: من طلوع الفجر الصادق إلى شروق الشمس\nالظهر: من زوال الشمس إلى أن يصير ظل كل شيء مثله\nالعصر: من خروج وقت الظهر إلى اصفرار الشمس\nالمغرب: من غروب الشمس إلى مغيب الشفق الأحمر\nالعشاء: من مغيب الشفق الأحمر إلى طلوع الفجر', content_en: 'Times of the five prayers:\nFajr: from true dawn until sunrise\nDhuhr: from the sun\'s zenith until an object\'s shadow equals its length\nAsr: from the end of Dhuhr time until the sun yellows\nMaghrib: from sunset until the red twilight disappears\nIsha: from the disappearance of the red twilight until dawn' },
      { type: 'note', content_ar: 'من نام عن صلاة أو نسيها فإنه يصليها متى ذكرها، ولا يصليها في أوقات الكراهة إلا عند النسيان.', content_en: 'Whoever sleeps through a prayer or forgets it must pray it as soon as they remember. One should not delay to disliked times except in cases of forgetfulness.' },
      { type: 'paragraph', content_ar: 'أداء الصلاة في أول وقتها من أفضل الأعمال، قال عليه الصلاة والسلام لما سُئل عن أحب الأعمال إلى الله: «الصلاة على وقتها».', content_en: 'Performing prayer at its earliest time is among the best deeds. When the Prophet was asked which deed is most beloved to Allah, he replied: "Prayer on time."' }
    ]
  },
  {
    id: 'content-salah-2', lessonId: 'salah-2',
    blocks: [
      { type: 'heading', content_ar: 'شروط صحة الصلاة', content_en: 'Conditions for Valid Prayer' },
      { type: 'paragraph', content_ar: 'شروط الصلاة هي ما يتوقف عليه صحة الصلاة قبل دخولها، ومنها: دخول الوقت، والطهارة من الحدث والنجس، وستر العورة، واستقبال القبلة، والنية.', content_en: 'The conditions of prayer are what its validity depends on before beginning it, including: the entrance of its time, purity from hadath and impurity, covering the awrah, facing the qiblah, and the intention.' },
      { type: 'list', content_ar: 'شروط صحة الصلاة:\nدخول الوقت\nالطهارة من الحدثين\nطهارة البدن والثوب والمكان\nستر العورة\nاستقبال القبلة\nالنية', content_en: 'Conditions for valid prayer:\nThe entrance of its time\nPurity from minor and major ritual impurity\nPurity of the body, clothing and place\nCovering the awrah\nFacing the qiblah\nThe intention' },
      { type: 'note', content_ar: 'النية محلها القلب، ولا يشترط التلفظ بها، وإنما يشترط استحضار الصلاة التي يصليها.', content_en: 'The intention resides in the heart; it is not required to be uttered. One only needs to be mindful of the specific prayer being performed.' },
      { type: 'paragraph', content_ar: 'إذا اختل شرط من هذه الشروط بطلت الصلاة، ويجب على المسلم أن يتعلم هذه الشروط لتصح عبادته.', content_en: 'If any of these conditions is breached, the prayer becomes invalid. A Muslim must learn these conditions so that their worship is correct.' }
    ]
  },
  {
    id: 'content-zakat-1', lessonId: 'zakat-1',
    blocks: [
      { type: 'heading', content_ar: 'تعريف الزكاة وحكمها', content_en: 'Definition and Ruling of Zakat' },
      { type: 'paragraph', content_ar: 'الزكاة في اللغة النماء والطهارة، وفي الشرع حق واجب في مال مخصوص لطائفة مخصوصة بشروط مخصوصة. وهي الركن الثالث من أركان الإسلام.', content_en: 'Linguistically, Zakat means growth and purification. In Islamic law, it is an obligatory right on specific wealth for specific recipients under specific conditions. It is the third pillar of Islam.' },
      { type: 'paragraph', content_ar: 'قال الله تعالى: «وأقيموا الصلاة وآتوا الزكاة». وقد أجمع المسلمون على وجوب الزكاة، ومن جحدها فقد خرج من الملة.', content_en: 'Allah said: "And establish prayer and give Zakat." Muslims are unanimous on its obligation; whoever denies it has left the fold of Islam.' },
      { type: 'note', content_ar: 'الزكاة تطهر المال وتنمي البركة، وفيها سد حاجة الفقراء وتقوية روابط المجتمع.', content_en: 'Zakat purifies wealth and increases its blessing; it meets the needs of the poor and strengthens the bonds of society.' },
      { type: 'list', content_ar: 'أنواع الزكاة:\nزكاة النقدين والذهب والفضة\nزكاة عروض التجارة\nزكاة الأنعام والحرث والثمار\nزكاة الفطر', content_en: 'Types of Zakat:\nZakat on cash, gold and silver\nZakat on trade goods\nZakat on livestock and crops\nZakat al-Fitr' }
    ]
  },
  {
    id: 'content-zakat-2', lessonId: 'zakat-2',
    blocks: [
      { type: 'heading', content_ar: 'زكاة المال ونصابها', content_en: 'Zakat on Wealth and Its Nisab' },
      { type: 'paragraph', content_ar: 'لا تجب الزكاة في المال حتى يبلغ النصاب ويمضي عليه حول كامل مع القدرة على التصرف فيه. ونصاب النقدين ما يعادل 85 غراماً من الذهب أو 595 غراماً من الفضة.', content_en: 'Zakat is not obligatory on wealth until it reaches the nisab and a full lunar year passes while one has full disposal over it. The nisab of currency is the equivalent of 85 grams of gold or 595 grams of silver.' },
      { type: 'list', content_ar: 'شروط وجوب الزكاة:\nالملك التام للمال\nبلوغ النصاب\nمضي الحول على المال\nأن يزيد المال عن الحاجات الأساسية', content_en: 'Conditions for the obligation of Zakat:\nFull ownership of the wealth\nReaching the nisab\nA full lunar year passing\nWealth exceeding basic needs' },
      { type: 'paragraph', content_ar: 'مقدار الزكاة ربع العشر أي 2.5% من رأس المال النقدي وعروض التجارة، وتخرج مرة واحدة كل عام.', content_en: 'The rate of Zakat is one quarter of a tenth, i.e. 2.5% of cash capital and trade goods, paid once every year.' },
      { type: 'note', content_ar: 'مصارف الزكاة ثمانية ذكرها الله تعالى في سورة التوبة، من أبرزها الفقراء والمساكين والعاملون عليها والمؤلفة قلوبهم.', content_en: 'The recipients of Zakat are the eight categories mentioned by Allah in Surah At-Tawbah, most notably the poor, the needy, those employed to collect it and those whose hearts are to be reconciled.' }
    ]
  },
  {
    id: 'content-sawm-1', lessonId: 'sawm-1',
    blocks: [
      { type: 'heading', content_ar: 'تعريف الصيام وحكمه', content_en: 'Definition and Ruling of Fasting' },
      { type: 'paragraph', content_ar: 'الصيام هو الإمساك عن المفطرات من طلوع الفجر إلى غروب الشمس بنية التقرب إلى الله تعالى. وهو الركن الرابع من أركان الإسلام.', content_en: 'Fasting is abstaining from all that breaks the fast from dawn until sunset with the intention of drawing closer to Allah. It is the fourth pillar of Islam.' },
      { type: 'paragraph', content_ar: 'قال تعالى: «يا أيها الذين آمنوا كتب عليكم الصيام كما كتب على الذين من قبلكم لعلكم تتقون». والصيام من أفضل العبادات وأعظمها أجراً.', content_en: 'Allah said: "O you who have believed, decreed upon you is fasting as it was decreed upon those before you that you may become righteous." Fasting is among the greatest and most rewarded acts of worship.' },
      { type: 'note', content_ar: 'يشرع صيام شهر رمضان وهو أحد أركان الإسلام، ويستحب صيام الاثنين والخميس وأيام البيض.', content_en: 'Fasting the month of Ramadan is prescribed as one of the pillars of Islam, and it is recommended to fast Mondays, Thursdays and the white days (13th-15th of the lunar month).' },
      { type: 'list', content_ar: 'شروط وجوب الصيام:\nالإسلام\nالبلوغ\nالعقل\nالقدرة على الصيام', content_en: 'Conditions for the obligation of fasting:\nIslam\nPuberty\nSanity\nAbility to fast' }
    ]
  },
  {
    id: 'content-sawm-2', lessonId: 'sawm-2',
    blocks: [
      { type: 'heading', content_ar: 'مبطلات الصيام', content_en: 'Things That Invalidate the Fast' },
      { type: 'paragraph', content_ar: 'ينبغي للصائم أن يحفظ صومه مما يبطله وينقص أجره، فمبطلات الصيام محدودة معلومة، ومن أبرزها الأكل والشرب عمداً، والجماع في نهار رمضان.', content_en: 'A fasting person should guard their fast against what invalidates or diminishes its reward. The invalidators are limited and known; most notably eating and drinking deliberately, and sexual intercourse during the day of Ramadan.' },
      { type: 'list', content_ar: 'من مبطلات الصيام:\nالأكل والشرب عمداً\nالجماع في نهار الصيام\nالقيء عمداً\nالحقن المغذية للبدن\nخروج دم الحيض والنفاس', content_en: 'Among the invalidators of the fast:\nEating and drinking deliberately\nSexual intercourse during the fast\nDeliberately induced vomiting\nNutritive injections\nMenstrual and postpartum bleeding' },
      { type: 'paragraph', content_ar: 'من أكل أو شرب ناسياً فليكمل صومه، فإن الله أطعمه وسقاه، ولا قضاء عليه إذا كان ناسياً غير متعمد.', content_en: 'Whoever eats or drinks out of forgetfulness should complete their fast, for it is Allah who fed and gave them drink. There is no expiation for the one who forgot.' },
      { type: 'note', content_ar: 'من أفطر عمداً في رمضان بلا عذر فقد ارتكب كبيرة، وعليه التوبة والقضاء، وفي الجماع كفارة هي عتق رقبة أو صيام شهرين متتابعين أو إطعام ستين مسكيناً.', content_en: 'Whoever breaks the fast of Ramadan deliberately without excuse has committed a major sin and must repent and make up the day. For intercourse, the expiation is freeing a slave, fasting two consecutive months, or feeding sixty poor people.' }
    ]
  },
  {
    id: 'content-hajj-1', lessonId: 'hajj-1',
    blocks: [
      { type: 'heading', content_ar: 'أركان الحج', content_en: 'Pillars of Hajj' },
      { type: 'paragraph', content_ar: 'الحج هو قصد بيت الله الحرام لأداء مناسك مخصوصة في زمان مخصوص، وهو الركن الخامس من أركان الإسلام على المستطيع.', content_en: 'Hajj is the pilgrimage to the Sacred House of Allah to perform specific rites at a specific time. It is the fifth pillar of Islam for those who are able.' },
      { type: 'list', content_ar: 'أركان الحج:\nالإحرام\nالوقوف بعرفة\nطواف الإفاضة\nالسعي بين الصفا والمروة', content_en: 'Pillars of Hajj:\nIhram\nStanding at Arafah\nTawaf al-Ifadah\nSa\'i between Safa and Marwah' },
      { type: 'paragraph', content_ar: 'الوقوف بعرفة هو الركن الأعظم، قال النبي صلى الله عليه وسلم: «الحج عرفة». ومن فاته الوقوف بعرفة فقد فاته الحج.', content_en: 'Standing at Arafah is the greatest pillar. The Prophet said: "Hajj is Arafah." Whoever misses the standing at Arafah has missed Hajj.' },
      { type: 'note', content_ar: 'شروط وجوب الحج: الإسلام، والبلوغ، والعقل، والحرية، والاستطاعة بالبدن والمال.', content_en: 'Conditions for the obligation of Hajj: Islam, puberty, sanity, freedom, and capability in body and wealth.' }
    ]
  },
  {
    id: 'content-hajj-2', lessonId: 'hajj-2',
    blocks: [
      { type: 'heading', content_ar: 'مناسك العمرة', content_en: 'Rituals of Umrah' },
      { type: 'paragraph', content_ar: 'العمرة هي زيارة بيت الله الحرام لأداء مناسك مخصوصة، وهي واجبة في العمر مرة عند جمهور العلماء، وتتكون من أربعة أركان.', content_en: 'Umrah is the visitation of the Sacred House to perform specific rites. It is obligatory once in a lifetime according to the majority of scholars and consists of four pillars.' },
      { type: 'list', content_ar: 'أركان العمرة:\nالإحرام\nالطواف بالبيت\nالسعي بين الصفا والمروة\nالحلق أو التقصير', content_en: 'Pillars of Umrah:\nIhram\nTawaf around the Kaaba\nSa\'i between Safa and Marwah\nShaving or shortening the hair' },
      { type: 'paragraph', content_ar: 'يستحب للإنسان أن يكثر من العمرة في حياته، فالعمرة إلى العمرة كفارة لما بينهما من الذنوب.', content_en: 'It is recommended to perform Umrah frequently, for one Umrah to the next expiates the sins committed between them.' },
      { type: 'note', content_ar: 'الطواف يكون سبعة أشواط يبدأ من الحجر الأسود وينتهي إليه، والسعي سبعة أشواط يبدأ من الصفا وينتهي بالمروة.', content_en: 'Tawaf consists of seven circuits beginning and ending at the Black Stone, while Sa\'i is seven circuits beginning at Safa and ending at Marwah.' }
    ]
  },
  {
    id: 'content-muamalat-1', lessonId: 'muamalat-1',
    blocks: [
      { type: 'heading', content_ar: 'أحكام البيع', content_en: 'Rulings of Sale' },
      { type: 'paragraph', content_ar: 'البيع عقد بين عاقدين على مبادلة مال بمال للتراضي، وقد أباحه الله تعالى فقال: «وأحل الله البيع وحرم الربا».', content_en: 'Sale is a contract between two parties exchanging wealth for wealth by mutual consent. Allah permitted it, saying: "And Allah has permitted trade and forbidden Riba."' },
      { type: 'list', content_ar: 'أركان البيع:\nالعاقدان: البائع والمشتري\nالمعقود عليه: السلعة والثمن\nالصيغة: الإيجاب والقبول', content_en: 'Elements of a sale:\nThe two parties: seller and buyer\nThe subject matter: goods and price\nThe formula: offer and acceptance' },
      { type: 'paragraph', content_ar: 'يشترط في البيع التراضي، فلا يصح بيع المكره، ويشترط العلم بالمعقود عليه والثمن، والخيار يثبت للعاقدين حتى يتفرقا.', content_en: 'Mutual consent is required in a sale; the sale of a coerced person is not valid. Knowledge of the goods and price is required, and both parties have the option until they separate.' },
      { type: 'note', content_ar: 'البيع الحاضر للبادي مكروه لما فيه من الضرر بالسوق، وبيع النجش محرم وهو الزيادة في الثمن لغير رغبة في السلعة.', content_en: 'Meeting caravans to buy goods before they reach the market is disliked due to the harm it causes, and Najash (bidder deception) is forbidden — inflating the price without genuine desire for the goods.' }
    ]
  },
  {
    id: 'content-muamalat-2', lessonId: 'muamalat-2',
    blocks: [
      { type: 'heading', content_ar: 'الربا ومحرمات المعاملات', content_en: 'Riba and Prohibited Transactions' },
      { type: 'paragraph', content_ar: 'الربا هو الزيادة في أحد البدلين عند التقابض في الأموال الربوية، وقد ورد فيه أعظم الوعيد في القرآن الكريم، قال تعالى: «وأحل الله البيع وحرم الربا».', content_en: 'Riba is an increase in either of the two exchanged amounts at the time of handover in ribawi (interest-bearing) commodities. It carries the severest warnings in the Quran; Allah said: "And Allah has permitted trade and forbidden Riba."' },
      { type: 'list', content_ar: 'من محرمات المعاملات:\nالربا بنوعيه: ربا الفضل وربا النسيئة\nبيع الغرر: وهو بيع المجهول\nالاحتكار مع الإضرار بالناس\nبيع النجش والتغرير بالمشتري', content_en: 'Among prohibited transactions:\nRiba in its two types: Riba al-Fadl and Riba an-Nasi\'ah\nGharar (uncertainty) sales of the unknown\nHoarding that harms people\nNajash and deceiving the buyer' },
      { type: 'paragraph', content_ar: 'لعن النبي صلى الله عليه وسلم آكل الربا وموكله وكاتبه وشاهديه، وقال: «هم سواء». فالواجب الابتعاد عنه وعن كل معاملة محرمة.', content_en: 'The Prophet cursed the one who consumes Riba, the one who pays it, the one who writes it and its witnesses, saying: "They are all alike." One must keep away from it and from every prohibited transaction.' },
      { type: 'note', content_ar: 'الغرر المحرم هو ما جهل فيه الإنسان عاقبة التعاقد أو عجز عن تسليم المعقود عليه، كبيع الجنين في بطن أمه.', content_en: 'Prohibited gharar is where the outcome of the contract is unknown or delivery of the subject matter is impossible, such as selling an unborn fetus.' }
    ]
  }
];

const seedQuizzes = [
  {
    id: 'quiz-tahara-1', lessonId: 'tahara-1',
    title_ar: 'اختبار الطهارة', title_en: 'Purification Quiz',
    questions: [
      { question_ar: 'ما الذي يكون به التطهر من الحدث؟', question_en: 'How is purification from hadath (ritual impurity) achieved?',
        options_ar: ['الوضوء أو الغسل أو التيمم', 'تطهير الثوب فقط', 'غسل البدن مرة واحدة', 'لا حاجة للتطهر'],
        options_en: ['Wudu, ghusl or tayammum', 'Cleaning the clothes only', 'Washing the body once', 'No purification needed'],
        correctAnswer: 0,
        explanation_ar: 'التطهر من الحدث يكون بالوضوء أو الغسل أو التيمم عند فقد الماء.', explanation_en: 'Purification from hadath is achieved through wudu, ghusl or tayammum when water is unavailable.' },
      { question_ar: 'كم نوعاً للطهارة في الإسلام؟', question_en: 'How many kinds of purity are there in Islam?',
        options_ar: ['نوعان: من الحدث ومن الخبث', 'ثلاثة أنواع', 'نوع واحد', 'أربعة أنواع'],
        options_en: ['Two: from hadath and from khabath', 'Three kinds', 'One kind', 'Four kinds'],
        correctAnswer: 0,
        explanation_ar: 'الطهارة قسمان: طهارة من الحدث وطهارة من الخبث.', explanation_en: 'Purity is of two kinds: purity from hadath and purity from khabath.' },
      { question_ar: 'قال تعالى: «إن الله يحب...»', question_en: 'Allah said: "Indeed, Allah loves..."',
        options_ar: ['التوابين والمتطهرين', 'المكثرين من المال', 'المتسابقين في الدنيا', 'المتنعمين'],
        options_en: ['Those who repent and purify themselves', 'Those with abundant wealth', 'Those who race for this world', 'Those who enjoy luxuries'],
        correctAnswer: 0,
        explanation_ar: 'الآية: «إن الله يحب التوابين ويحب المتطهرين».', explanation_en: 'The verse: "Indeed, Allah loves those who are constantly repentant and loves those who purify themselves."' }
    ]
  },
  {
    id: 'quiz-tahara-2', lessonId: 'tahara-2',
    title_ar: 'اختبار أحكام الوضوء', title_en: 'Wudu Rulings Quiz',
    questions: [
      { question_ar: 'من فرائض الوضوء؟', question_en: 'Which of the following is an obligatory act of wudu?',
        options_ar: ['غسل الوجه', 'المضمضة', 'الاستنشاق', 'غسل الأذنين'],
        options_en: ['Washing the face', 'Rinsing the mouth', 'Sniffing water into the nose', 'Washing the ears'],
        correctAnswer: 0,
        explanation_ar: 'من فرائض الوضوء غسل الوجه وغسل اليدين ومسح الرأس وغسل الرجلين.', explanation_en: 'Obligatory acts include washing the face, hands, wiping the head and washing the feet.' },
      { question_ar: 'متى يجب الوضوء؟', question_en: 'When is wudu obligatory?',
        options_ar: ['لأداء الصلاة', 'عند النوم', 'عند قراءة القرآن', 'عند دخول المنزل'],
        options_en: ['For performing prayer', 'Before sleeping', 'Before reading the Quran', 'When entering the home'],
        correctAnswer: 0,
        explanation_ar: 'يجب الوضوء للصلاة ويستحب لغيره.', explanation_en: 'Wudu is obligatory for prayer and recommended for other acts.' },
      { question_ar: 'من نواقض الوضوء؟', question_en: 'Which of the following nullifies wudu?',
        options_ar: ['النوم المستغرق', 'قراءة القرآن', 'الكلام في الصلاة', 'المشي في السوق'],
        options_en: ['Deep sleep', 'Reading the Quran', 'Speaking during prayer', 'Walking in the market'],
        correctAnswer: 0,
        explanation_ar: 'من نواقض الوضوء النوم المستغرق وزوال العقل والخارج من السبيلين.', explanation_en: 'Nullifiers of wudu include deep sleep, loss of consciousness and anything exiting from the two passages.' }
    ]
  },
  {
    id: 'quiz-salah-1', lessonId: 'salah-1',
    title_ar: 'اختبار مواقيت الصلاة', title_en: 'Prayer Times Quiz',
    questions: [
      { question_ar: 'متى يبدأ وقت صلاة الفجر؟', question_en: 'When does the time of Fajr prayer begin?',
        options_ar: ['من طلوع الفجر الصادق', 'من منتصف الليل', 'من شروق الشمس', 'بعد العشاء مباشرة'],
        options_en: ['At the true dawn', 'At midnight', 'At sunrise', 'Immediately after Isha'],
        correctAnswer: 0,
        explanation_ar: 'يبدأ وقت الفجر من طلوع الفجر الصادق إلى شروق الشمس.', explanation_en: 'Fajr time begins at true dawn and ends at sunrise.' },
      { question_ar: 'متى يبدأ وقت صلاة المغرب؟', question_en: 'When does Maghrib prayer time begin?',
        options_ar: ['عند غروب الشمس', 'عند زوال الشمس', 'عند اصفرار الشمس', 'عند مغيب الشفق'],
        options_en: ['At sunset', 'At the sun\'s zenith', 'When the sun yellows', 'When twilight disappears'],
        correctAnswer: 0,
        explanation_ar: 'يبدأ وقت المغرب بغروب الشمس وينتهي بمغيب الشفق الأحمر.', explanation_en: 'Maghrib begins at sunset and ends when the red twilight disappears.' },
      { question_ar: 'من نام عن صلاة فماذا يفعل؟', question_en: 'What should someone who sleeps through a prayer do?',
        options_ar: ['يصليها متى ذكرها', 'يقضيها في اليوم التالي فقط', 'لا يقضيها أبداً', 'يستبدلها بنافلة'],
        options_en: ['Pray it as soon as they remember', 'Make it up only the next day', 'Never make it up', 'Replace it with a voluntary prayer'],
        correctAnswer: 0,
        explanation_ar: 'من نام أو نسي صلاة فليصلها متى ذكرها.', explanation_en: 'Whoever sleeps through or forgets a prayer should pray it as soon as they remember.' }
    ]
  },
  {
    id: 'quiz-salah-2', lessonId: 'salah-2',
    title_ar: 'اختبار شروط الصلاة', title_en: 'Prayer Conditions Quiz',
    questions: [
      { question_ar: 'أي مما يلي من شروط صحة الصلاة؟', question_en: 'Which of the following is a condition for valid prayer?',
        options_ar: ['استقبال القبلة', 'رفع اليدين', 'قراءة سورة بعد الفاتحة', 'الجلوس للتشهد'],
        options_en: ['Facing the qiblah', 'Raising the hands', 'Reciting a surah after al-Fatihah', 'Sitting for tashahhud'],
        correctAnswer: 0,
        explanation_ar: 'من شروط الصلاة استقبال القبلة والطهارة ودخول الوقت.', explanation_en: 'Conditions include facing the qiblah, purity and the entrance of time.' },
      { question_ar: 'ما محلها النية في الصلاة؟', question_en: 'Where does the intention (niyyah) for prayer reside?',
        options_ar: ['القلب', 'اللسان', 'اليد', 'الرأس'],
        options_en: ['The heart', 'The tongue', 'The hand', 'The head'],
        correctAnswer: 0,
        explanation_ar: 'محل النية القلب ولا يشترط التلفظ بها.', explanation_en: 'The intention resides in the heart; it is not required to be uttered.' },
      { question_ar: 'إذا اختل شرط من شروط الصلاة فماذا يحدث؟', question_en: 'What happens if a condition of prayer is breached?',
        options_ar: ['تبطل الصلاة', 'تصح الصلاة', 'ينقص الأجر فقط', 'يجب إعادتها في وقت آخر'],
        options_en: ['The prayer becomes invalid', 'The prayer remains valid', 'Only the reward decreases', 'It must be repeated at another time'],
        correctAnswer: 0,
        explanation_ar: 'باختلال شرط من شروط الصلاة تبطل الصلاة.', explanation_en: 'Breaching a condition of prayer invalidates it.' }
    ]
  },
  {
    id: 'quiz-zakat-1', lessonId: 'zakat-1',
    title_ar: 'اختبار الزكاة', title_en: 'Zakat Quiz',
    questions: [
      { question_ar: 'ما الركن الذي تمثله الزكاة في الإسلام؟', question_en: 'Which pillar of Islam does Zakat represent?',
        options_ar: ['الركن الثالث', 'الركن الأول', 'الركن الخامس', 'الركن الثاني'],
        options_en: ['The third pillar', 'The first pillar', 'The fifth pillar', 'The second pillar'],
        correctAnswer: 0,
        explanation_ar: 'الزكاة هي الركن الثالث من أركان الإسلام.', explanation_en: 'Zakat is the third pillar of Islam.' },
      { question_ar: 'ما معنى الزكاة في اللغة؟', question_en: 'What does Zakat mean linguistically?',
        options_ar: ['النماء والطهارة', 'الكثرة والمال', 'السرعة والعمل', 'الصدقة اليومية'],
        options_en: ['Growth and purification', 'Abundance and wealth', 'Speed and work', 'Daily charity'],
        correctAnswer: 0,
        explanation_ar: 'الزكاة في اللغة النماء والطهارة.', explanation_en: 'Linguistically, Zakat means growth and purification.' },
      { question_ar: 'متى تجب الزكاة على المسلم؟', question_en: 'When does Zakat become obligatory on a Muslim?',
        options_ar: ['إذا بلغ المال النصاب ومر عليه حول', 'عند امتلاك أي مبلغ', 'مرة واحدة في العمر', 'عند الحصول على راتب'],
        options_en: ['When wealth reaches nisab and a year passes', 'Upon owning any amount', 'Once in a lifetime', 'Upon receiving a salary'],
        correctAnswer: 0,
        explanation_ar: 'تجب الزكاة ببلوغ النصاب ومضي الحول.', explanation_en: 'Zakat is due when wealth reaches nisab and a full year passes.' }
    ]
  },
  {
    id: 'quiz-zakat-2', lessonId: 'zakat-2',
    title_ar: 'اختبار زكاة المال', title_en: 'Wealth Zakat Quiz',
    questions: [
      { question_ar: 'ما مقدار زكاة النقدين؟', question_en: 'What is the rate of Zakat on currency?',
        options_ar: ['2.5%', '10%', '5%', '20%'],
        options_en: ['2.5%', '10%', '5%', '20%'],
        correctAnswer: 0,
        explanation_ar: 'مقدار الزكاة ربع العشر أي 2.5%.', explanation_en: 'The rate of Zakat is one quarter of a tenth, i.e. 2.5%.' },
      { question_ar: 'كم يعادل نصاب النقدين من الذهب؟', question_en: 'What is the nisab of currency in gold?',
        options_ar: ['85 غراماً من الذهب', '500 غرام من الذهب', '1000 غرام من الذهب', '20 غراماً من الذهب'],
        options_en: ['85 grams of gold', '500 grams of gold', '1000 grams of gold', '20 grams of gold'],
        correctAnswer: 0,
        explanation_ar: 'نصاب النقدين يعادل 85 غراماً من الذهب أو 595 غراماً من الفضة.', explanation_en: 'The nisab of currency is the equivalent of 85 grams of gold or 595 grams of silver.' },
      { question_ar: 'متى تخرج زكاة المال؟', question_en: 'When is Zakat on wealth paid?',
        options_ar: ['مرة كل عام بعد مضي الحول', 'كل شهر', 'مرة كل أسبوع', 'مرة واحدة في العمر'],
        options_en: ['Once a year after a full year passes', 'Every month', 'Once a week', 'Once in a lifetime'],
        correctAnswer: 0,
        explanation_ar: 'تخرج زكاة المال مرة كل عام بعد مضي الحول.', explanation_en: 'Zakat on wealth is paid once a year after a full year passes.' }
    ]
  },
  {
    id: 'quiz-sawm-1', lessonId: 'sawm-1',
    title_ar: 'اختبار الصيام', title_en: 'Fasting Quiz',
    questions: [
      { question_ar: 'ما هو الصيام شرعاً؟', question_en: 'What is fasting in Islamic law?',
        options_ar: ['الإمساك عن المفطرات من الفجر إلى الغروب بنية', 'ترك الطعام فقط', 'ترك النوم', 'الامتناع عن الكلام'],
        options_en: ['Abstaining from invalidators from dawn to sunset with intention', 'Giving up food only', 'Giving up sleep', 'Refraining from speech'],
        correctAnswer: 0,
        explanation_ar: 'الصيام هو الإمساك عن المفطرات من طلوع الفجر إلى غروب الشمس بنية التقرب إلى الله.', explanation_en: 'Fasting is abstaining from invalidators from dawn to sunset with the intention of drawing closer to Allah.' },
      { question_ar: 'ما الركن الذي يمثله الصيام؟', question_en: 'Which pillar of Islam does fasting represent?',
        options_ar: ['الركن الرابع', 'الركن الثالث', 'الركن الثاني', 'الركن الأول'],
        options_en: ['The fourth pillar', 'The third pillar', 'The second pillar', 'The first pillar'],
        correctAnswer: 0,
        explanation_ar: 'الصيام هو الركن الرابع من أركان الإسلام.', explanation_en: 'Fasting is the fourth pillar of Islam.' },
      { question_ar: 'متى يمسك الصائم عن المفطرات؟', question_en: 'When does a fasting person abstain from invalidators?',
        options_ar: ['من طلوع الفجر إلى غروب الشمس', 'من منتصف الليل إلى الظهر', 'من العصر إلى المغرب', 'من الفجر إلى الظهر فقط'],
        options_en: ['From dawn until sunset', 'From midnight to noon', 'From Asr to Maghrib', 'From dawn to noon only'],
        correctAnswer: 0,
        explanation_ar: 'يمسك الصائم من طلوع الفجر الصادق إلى غروب الشمس.', explanation_en: 'A fasting person abstains from true dawn until sunset.' }
    ]
  },
  {
    id: 'quiz-sawm-2', lessonId: 'sawm-2',
    title_ar: 'اختبار مبطلات الصيام', title_en: 'Fasting Invalidators Quiz',
    questions: [
      { question_ar: 'أي مما يلي من مبطلات الصيام؟', question_en: 'Which of the following invalidates the fast?',
        options_ar: ['الأكل والشرب عمداً', 'السواك', 'غسل الأسنان', 'شم رائحة الطعام'],
        options_en: ['Eating and drinking deliberately', 'Using a miswak', 'Brushing the teeth', 'Smelling food'],
        correctAnswer: 0,
        explanation_ar: 'من مبطلات الصيام الأكل والشرب عمداً.', explanation_en: 'Deliberately eating and drinking are among the invalidators of the fast.' },
      { question_ar: 'من أكل ناسياً وهو صائم ماذا يفعل؟', question_en: 'What should a fasting person who eats out of forgetfulness do?',
        options_ar: ['يكمل صومه ولا قضاء عليه', 'يفطر فوراً', 'يجب عليه القضاء', 'يصوم يومين'],
        options_en: ['Complete the fast with no make-up required', 'Break the fast immediately', 'Must make up the day', 'Fast two days'],
        correctAnswer: 0,
        explanation_ar: 'من أكل ناسياً فليكمل صومه، فإن الله أطعمه وسقاه ولا قضاء عليه.', explanation_en: 'Whoever eats out of forgetfulness should complete their fast, as Allah fed and gave them drink, with no make-up required.' },
      { question_ar: 'ما كفارة الجماع في نهار رمضان؟', question_en: 'What is the expiation for intercourse during the day in Ramadan?',
        options_ar: ['عتق رقبة أو صيام شهرين متتابعين أو إطعام ستين مسكيناً', 'قضاء يوم واحد', 'صيام ثلاثة أيام', 'إطعام عشرة مساكين'],
        options_en: ['Freeing a slave, fasting two consecutive months, or feeding sixty poor people', 'Making up one day', 'Fasting three days', 'Feeding ten poor people'],
        correctAnswer: 0,
        explanation_ar: 'الكفارة عتق رقبة أو صيام شهرين متتابعين أو إطعام ستين مسكيناً.', explanation_en: 'The expiation is freeing a slave, fasting two consecutive months, or feeding sixty poor people.' }
    ]
  },
  {
    id: 'quiz-hajj-1', lessonId: 'hajj-1',
    title_ar: 'اختبار أركان الحج', title_en: 'Hajj Pillars Quiz',
    questions: [
      { question_ar: 'ما الركن الأعظم من أركان الحج؟', question_en: 'What is the greatest pillar of Hajj?',
        options_ar: ['الوقوف بعرفة', 'طواف الإفاضة', 'السعي', 'الإحرام'],
        options_en: ['Standing at Arafah', 'Tawaf al-Ifadah', 'Sa\'i', 'Ihram'],
        correctAnswer: 0,
        explanation_ar: 'الوقوف بعرفة هو الركن الأعظم، قال عليه الصلاة والسلام: «الحج عرفة».', explanation_en: 'Standing at Arafah is the greatest pillar; the Prophet said: "Hajj is Arafah."' },
      { question_ar: 'كم عدد أركان الحج؟', question_en: 'How many pillars does Hajj have?',
        options_ar: ['أربعة أركان', 'ركن واحد', 'ثلاثة أركان', 'خمسة أركان'],
        options_en: ['Four pillars', 'One pillar', 'Three pillars', 'Five pillars'],
        correctAnswer: 0,
        explanation_ar: 'أركان الحج أربعة: الإحرام والوقوف بعرفة وطواف الإفاضة والسعي.', explanation_en: 'Hajj has four pillars: Ihram, standing at Arafah, Tawaf al-Ifadah and Sa\'i.' },
      { question_ar: 'من فاته الوقوف بعرفة ماذا يحدث؟', question_en: 'What happens to one who misses the standing at Arafah?',
        options_ar: ['فاته الحج', 'حجه صحيح', 'يقضي طوافاً إضافياً', 'لا شيء عليه'],
        options_en: ['They have missed Hajj', 'Their Hajj is valid', 'They perform an extra tawaf', 'Nothing is upon them'],
        correctAnswer: 0,
        explanation_ar: 'من فاته الوقوف بعرفة فقد فاته الحج.', explanation_en: 'Whoever misses the standing at Arafah has missed Hajj.' }
    ]
  },
  {
    id: 'quiz-hajj-2', lessonId: 'hajj-2',
    title_ar: 'اختبار مناسك العمرة', title_en: 'Umrah Rituals Quiz',
    questions: [
      { question_ar: 'من كم ركناً تتكون العمرة؟', question_en: 'How many pillars does Umrah consist of?',
        options_ar: ['أربعة أركان', 'ثلاثة أركان', 'خمسة أركان', 'ركنان'],
        options_en: ['Four pillars', 'Three pillars', 'Five pillars', 'Two pillars'],
        correctAnswer: 0,
        explanation_ar: 'أركان العمرة أربعة: الإحرام والطواف والسعي والحلق أو التقصير.', explanation_en: 'Umrah has four pillars: Ihram, Tawaf, Sa\'i, and shaving or shortening the hair.' },
      { question_ar: 'كم عدد أشواط الطواف؟', question_en: 'How many circuits does Tawaf consist of?',
        options_ar: ['سبعة أشواط', 'خمسة أشواط', 'عشرة أشواط', 'ثلاثة أشواط'],
        options_en: ['Seven circuits', 'Five circuits', 'Ten circuits', 'Three circuits'],
        correctAnswer: 0,
        explanation_ar: 'الطواف سبعة أشواط يبدأ من الحجر الأسود وينتهي إليه.', explanation_en: 'Tawaf consists of seven circuits beginning and ending at the Black Stone.' },
      { question_ar: 'أين يبدأ السعي؟', question_en: 'Where does Sa\'i begin?',
        options_ar: ['من الصفا', 'من المروة', 'من الحجر الأسود', 'من منى'],
        options_en: ['At Safa', 'At Marwah', 'At the Black Stone', 'At Mina'],
        correctAnswer: 0,
        explanation_ar: 'يبدأ السعي من الصفا وينتهي بالمروة.', explanation_en: 'Sa\'i begins at Safa and ends at Marwah.' }
    ]
  },
  {
    id: 'quiz-muamalat-1', lessonId: 'muamalat-1',
    title_ar: 'اختبار أحكام البيع', title_en: 'Sale Rulings Quiz',
    questions: [
      { question_ar: 'ما حكم البيع في الإسلام؟', question_en: 'What is the ruling on sale in Islam?',
        options_ar: ['حلال', 'حرام', 'مكروه', 'مباح بشرط'],
        options_en: ['Permissible', 'Forbidden', 'Disliked', 'Permitted with a condition'],
        correctAnswer: 0,
        explanation_ar: 'البيع حلال، قال تعالى: «وأحل الله البيع وحرم الربا».', explanation_en: 'Sale is permissible; Allah said: "And Allah has permitted trade and forbidden Riba."' },
      { question_ar: 'ما هي أركان البيع؟', question_en: 'What are the elements of a sale?',
        options_ar: ['العاقدان والمعقود عليه والصيغة', 'الثمن فقط', 'الشهود فقط', 'العقد المكتوب'],
        options_en: ['The parties, the subject matter and the formula', 'The price only', 'Witnesses only', 'A written contract'],
        correctAnswer: 0,
        explanation_ar: 'أركان البيع: العاقدان والمعقود عليه والصيغة.', explanation_en: 'The elements of a sale are the parties, the subject matter and the formula.' },
      { question_ar: 'ما هو بيع النجش؟', question_en: 'What is Najash (bidder deception)?',
        options_ar: ['الزيادة في الثمن لغير رغبة في السلعة', 'بيع الأجل', 'بيع الربح', 'البيع بالتقسيط'],
        options_en: ['Inflating the price without genuine desire for the goods', 'Credit sale', 'Profit sale', 'Installment sale'],
        correctAnswer: 0,
        explanation_ar: 'النجش هو الزيادة في الثمن لغير رغبة في السلعة وهو محرم.', explanation_en: 'Najash is inflating the price without genuine desire for the goods, and it is forbidden.' }
    ]
  },
  {
    id: 'quiz-muamalat-2', lessonId: 'muamalat-2',
    title_ar: 'اختبار الربا والمعاملات', title_en: 'Riba and Transactions Quiz',
    questions: [
      { question_ar: 'ما هو الربا؟', question_en: 'What is Riba?',
        options_ar: ['الزيادة في أحد البدلين عند التقابض في الأموال الربوية', 'الربح المشروع في التجارة', 'الزيادة على ثمن السلعة باتفاق', 'الأجرة على العمل'],
        options_en: ['An increase in either exchange at handover in ribawi commodities', 'Lawful trade profit', 'A mutually agreed price increase', 'Wages for work'],
        correctAnswer: 0,
        explanation_ar: 'الربا هو الزيادة في أحد البدلين عند التقابض في الأموال الربوية.', explanation_en: 'Riba is an increase in either of the two exchanged amounts at the time of handover in ribawi commodities.' },
      { question_ar: 'كم نوعاً للربا؟', question_en: 'How many types of Riba are there?',
        options_ar: ['نوعان: ربا الفضل وربا النسيئة', 'نوع واحد', 'ثلاثة أنواع', 'أربعة أنواع'],
        options_en: ['Two: Riba al-Fadl and Riba an-Nasi\'ah', 'One type', 'Three types', 'Four types'],
        correctAnswer: 0,
        explanation_ar: 'الربا نوعان: ربا الفضل وهو الزيادة في البدلين، وربا النسيئة وهو الزيادة مقابل التأجيل.', explanation_en: 'Riba has two types: Riba al-Fadl (increase in the exchanged items) and Riba an-Nasi\'ah (increase in exchange for deferral).' },
      { question_ar: 'من لعنه النبي صلى الله عليه وسلم في الربا؟', question_en: 'Whom did the Prophet curse in relation to Riba?',
        options_ar: ['آكل الربا وموكله وكاتبه وشاهديه', 'المشتري فقط', 'التاجر الصادق', 'المستثمر'],
        options_en: ['The one who consumes, pays, writes, and witnesses it', 'The buyer only', 'The honest trader', 'The investor'],
        correctAnswer: 0,
        explanation_ar: 'لعن النبي صلى الله عليه وسلم آكل الربا وموكله وكاتبه وشاهديه وقال هم سواء.', explanation_en: 'The Prophet cursed the one who consumes Riba, the one who pays it, the one who writes it and its witnesses, saying they are all alike.' }
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
const ensureSeedData = () => {
  if (!read(KEYS.sections, null)) write(KEYS.sections, seedSections);
  if (!read(KEYS.lessons, null)) write(KEYS.lessons, seedLessons);
  if (!read(KEYS.content, null)) write(KEYS.content, seedContent);
  if (!read(KEYS.quizzes, null)) write(KEYS.quizzes, seedQuizzes);
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
  signUp: async (email, password) => {
    await delay();
    return { ...DEMO_USER, email };
  },
  signIn: async (email, password) => {
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
      language: navigator.language.startsWith('ar') ? 'ar' : 'en',
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
  userProgress: mockUserProgressService,
  appSettings: mockAppSettingsService
};
