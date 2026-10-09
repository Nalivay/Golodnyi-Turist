import { ARMENIA_RECIPES } from './armeniaRecipes';
import { Recipe, RecipeCategory, RestaurantId } from '../types';

export const RECIPE_CATEGORIES: { id: RecipeCategory; label: string; icon: string }[] = [
  { id: 'salads', label: 'Салаты', icon: '🥗' },
  { id: 'soups', label: 'Супы', icon: '🍲' },
  { id: 'mains', label: 'Вторые блюда', icon: '🍛' },
  { id: 'appetizers', label: 'Закуски', icon: '🥘' },
  { id: 'pastry', label: 'Выпечка', icon: '🍕' },
  { id: 'drinks', label: 'Напитки', icon: '🍹' },
  { id: 'desserts', label: 'Десерты', icon: '🍰' },
  { id: 'other', label: 'Другое', icon: '📦' },
];

export const MINSK_RECIPES: Recipe[] = [
  {
    id: 'rec-vareniki-kartoshka',
    title: 'Вареники с картошкой',
    category: 'mains',
    restaurantId: 'golodnyy_turist',
    description: 'Домашние вареники с нежной картофельной начинкой и золотистым лучком. Подаются со сметаной и сливочным маслом.',
    mainPhoto: '/assets/vareniki_kartoshka.png',
    extraPhotos: [],
    ingredients: [
      { id: 'var-1', name: 'Тесто пельменное домашнее', quantity: '100', unit: 'г' },
      { id: 'var-2', name: 'Картофель отварной для начинки', quantity: '150', unit: 'г' },
      { id: 'var-3', name: 'Лук репчатый пассерованный', quantity: '50', unit: 'г' },
      { id: 'var-4', name: 'Масло сливочное 82.5%', quantity: '30', unit: 'г' },
      { id: 'var-5', name: 'Сметана 20% для подачи', quantity: '50', unit: 'г' },
      { id: 'var-6', name: 'Укроп свежий рубленый', quantity: '5', unit: 'г' },
    ],
    yieldWeight: '240/50 г',
    prepTime: '15 минут',
    technology: `1. Лук нарезать мелким кубиком, медленно пассеровать на сливочном масле до золотистого оттенка.
2. Горячий отварной картофель тщательно размять, соединить с пассерованным луком, солью и перцем, охладить.
3. Раскатать тесто, сформировать вареники с аккуратным защипом.
4. Опустить в подсоленный кипяток, после всплытия варить 4 минуты.
5. Осторожно извлечь шумовкой, заправить горячим растопленным сливочным маслом и луком.`,
    plating: 'Выложить на блюдо строго согласно эталонной фотографии раскладки. Полить золотистым лучком со сливочным маслом, украсить зеленью, соусник со сметаной поставить рядом.',
    importantNotes: 'Точно соблюдать форму и раскладку по фотографии! Картофельная начинка должна быть полностью остывшей перед лепкой.',
    chefTip: 'Сливочное масло для лука должно томиться медленно, сохраняя мягкий сливочный вкус.',
    currentVersion: '1.0',
    published: true,
    createdAt: '2026-09-22',
    updatedAt: '2026-09-22',
  },
  {
    id: 'rec-svekla-chesnok',
    title: 'Свекла с чесноком',
    category: 'salads',
    restaurantId: 'golodnyy_turist',
    description: 'Классический салат из отборной запеченной свеклы с пикантным молодым чесноком, дробленым грецким орехом и майонезом.',
    mainPhoto: '/assets/svekla_chesnok.png',
    extraPhotos: [],
    ingredients: [
      { id: 'sv-1', name: 'Свекла запеченная столовая', quantity: '150', unit: 'г' },
      { id: 'sv-2', name: 'Орехи грецкие дробленые', quantity: '25', unit: 'г' },
      { id: 'sv-3', name: 'Чеснок свежий прессованный', quantity: '6', unit: 'г' },
      { id: 'sv-4', name: 'Майонез (или сметана 20%)', quantity: '35', unit: 'г' },
      { id: 'sv-5', name: 'Соль поваренная и перец', quantity: '2', unit: 'г' },
      { id: 'sv-6', name: 'Зелень петрушки свежей', quantity: '5', unit: 'г' },
    ],
    yieldWeight: '180 г',
    prepTime: '10 минут',
    technology: `1. Свеклу запечь в кожуре до готовности, охладить, очистить и натереть на средней терке.
2. Грецкие орехи слегка подсушить и порубить ножом.
3. Чеснок пропустить через пресс.
4. Соединить свеклу, чеснок и орехи, заправить майонезом, равномерно перемешать.`,
    plating: 'Сервировать строго по эталонной фотографии подачи. Выложить формованной шайбой, сверху украсить половинкой ореха и листиком свежей зелени.',
    importantNotes: 'Запекание в кожуре делает свеклу насыщенной и без излишней водянистости. Строго придерживаться подачи с фото.',
    chefTip: 'Чеснок вводить строго по граммам, чтобы вкус оставался сбалансированным.',
    currentVersion: '1.0',
    published: true,
    createdAt: '2026-09-22',
    updatedAt: '2026-09-22',
  },
  {
    id: 'rec-draniki',
    title: 'Драники',
    category: 'mains',
    restaurantId: 'golodnyy_turist',
    description: 'Традиционные хрустящие картофельные драники со сметаной и золотистой корочкой.',
    mainPhoto: '/assets/draniki_minsk.jpg',
    extraPhotos: [],
    ingredients: [
      { id: 'dr-1', name: 'Картофель свежий крахмалистый', quantity: '300', unit: 'г' },
      { id: 'dr-2', name: 'Лук репчатый', quantity: '40', unit: 'г' },
      { id: 'dr-3', name: 'Яйцо куриное C1', quantity: '1', unit: 'шт' },
      { id: 'dr-4', name: 'Мука пшеничная в/с', quantity: '20', unit: 'г' },
      { id: 'dr-5', name: 'Масло растительное для жарки', quantity: '40', unit: 'мл' },
      { id: 'dr-6', name: 'Сметана 20% для подачи', quantity: '50', unit: 'г' },
      { id: 'dr-7', name: 'Соль, свежемолотый перец', quantity: '3', unit: 'г' },
    ],
    yieldWeight: '220/50 г',
    prepTime: '20 минут',
    technology: `1. Очищенный картофель натереть на мелкой колючей терке вместе с луком (лук предотвращает потемнение картофельной массы).
2. Слегка отжать излишнюю влагу, добавить яйцо, муку, соль и перец. Быстро перемешать.
3. Разогреть сковороду с растительным маслом.
4. Выкладывать ложкой аккуратные оладьи толщиной 7–8 мм.
5. Обжаривать с двух сторон на среднем огне до плотной золотисто-румяной корочки (по 3–4 минуты с каждой стороны).
6. Выложить на бумажное полотенце на 30 секунд для удаления лишнего масла.`,
    plating: 'Выложить горячие драники стопочкой или веером на теплую тарелку. Подавать со свежей густой сметаной в соуснике и веточкой укропа.',
    importantNotes: 'Жарить только из свеженатертой массы, не давать тесту застаиваться. Строго соблюдать температуру масла.',
    chefTip: 'Натирайте лук поочередно с картофелем — картофель останется светлым и золотистым при обжарке.',
    currentVersion: '1.0',
    published: true,
    createdAt: '2026-09-22',
    updatedAt: '2026-09-22',
  },
  {
    id: 'rec-blinchiki-tvorog',
    title: 'Блинчики с творогом',
    category: 'pastry',
    restaurantId: 'golodnyy_turist',
    description: 'Нежные тонкие блинчики на молоке с мягкой творожной начинкой с ванилью.',
    mainPhoto: '/assets/blinchiki_tvorog.jpg',
    extraPhotos: [],
    ingredients: [
      { id: 'bl-1', name: 'Творог 9% отборный', quantity: '180', unit: 'г' },
      { id: 'bl-2', name: 'Блинчики классические готовые (3 шт)', quantity: '120', unit: 'г' },
      { id: 'bl-3', name: 'Сахарная пудра с ванилью', quantity: '25', unit: 'г' },
      { id: 'bl-4', name: 'Сметана 20%', quantity: '40', unit: 'г' },
      { id: 'bl-5', name: 'Масло сливочное для подрумянивания', quantity: '20', unit: 'г' },
      { id: 'bl-6', name: 'Мята свежая и ягоды для декора', quantity: '5', unit: 'г' },
    ],
    yieldWeight: '220/40 г',
    prepTime: '15 минут',
    technology: `1. Творог протереть через сито или взбить блендером до кремовой текстуры.
2. Ввести сахарную пудру, натуральную ваниль и ложку сметаны.
3. На каждый тонкий блинчик выложить по 60 г творожной начинки, завернуть плотным конвертиком.
4. Разогреть сливочное масло на сковороде, быстро прогреть блинчики со шва, подрумянив до легкого хруста.`,
    plating: 'Выложить блинчики под углом по диагонали тарелки. Посыпать тончайшим слоем сахарной пудры, полить сметаной, украсить листочком мяты.',
    importantNotes: 'Блинчики должны быть теплыми внутри с нежной, не пересушенной творожной начинкой.',
    chefTip: 'Сливочное масло при подрумянивании придает карамельный сливочный аромат.',
    currentVersion: '1.0',
    published: true,
    createdAt: '2026-09-22',
    updatedAt: '2026-09-22',
  },
  {
    id: 'rec-holodnik',
    title: 'Холодник',
    category: 'soups',
    restaurantId: 'golodnyy_turist',
    description: 'Освежающий холодный свекольный суп на кефире со свежими огурцами, редисом, зеленым луком и перепелиным яйцом.',
    mainPhoto: '/assets/holodnik_soup.jpg',
    extraPhotos: [],
    ingredients: [
      { id: 'hol-1', name: 'Свекла отварная / маринованная', quantity: '120', unit: 'г' },
      { id: 'hol-2', name: 'Кефир 3.2% охлажденный', quantity: '250', unit: 'мл' },
      { id: 'hol-3', name: 'Огурец грунтовой свежий', quantity: '60', unit: 'г' },
      { id: 'hol-4', name: 'Редис свежий', quantity: '30', unit: 'г' },
      { id: 'hol-5', name: 'Яйцо отварное (половинки)', quantity: '1', unit: 'шт' },
      { id: 'hol-6', name: 'Лук зеленый и свежий укроп', quantity: '15', unit: 'г' },
      { id: 'hol-7', name: 'Сметана 20%', quantity: '30', unit: 'г' },
    ],
    yieldWeight: '350/30 г',
    prepTime: '10 минут',
    technology: `1. Свеклу отварить, охладить, натереть соломкой на крупной терке.
2. Огурцы и редис нарезать тонкой аккуратной соломкой.
3. Зеленый лук и укроп мелко порубить, слегка растереть с щепоткой соли для выделения сока.
4. Соединить овощную основу, залить ледяным кефиром со свекольным настоем, отрегулировать соль и кислоту.`,
    plating: 'Подавать в глубокой охлажденной суповой тарелке. По центру выложить половинки отварного яйца, ложку сметаны и щедрую щепотку свежей зелени.',
    importantNotes: 'Суп подается исключительно холодным (+6...+8°C). Идеально в жаркую погоду.',
    chefTip: 'Слегка растереть зелень с солью перед заливкой — это раскрывает яркий аромат.',
    currentVersion: '1.0',
    published: true,
    createdAt: '2026-09-22',
    updatedAt: '2026-09-22',
  },
  {
    id: 'rec-gulyash-grechka',
    title: 'Гуляш с гречкой',
    category: 'mains',
    restaurantId: 'golodnyy_turist',
    description: 'Ароматный гуляш из томленой говядины в густом томатно-овощном соусе с рассыпчатой отварной гречневой кашей.',
    mainPhoto: '/assets/gulyash_grechka.jpg',
    extraPhotos: [],
    ingredients: [
      { id: 'gul-1', name: 'Говядина мякоть тушеная', quantity: '150', unit: 'г' },
      { id: 'gul-2', name: 'Гречневая крупа отварная рассыпчатая', quantity: '180', unit: 'г' },
      { id: 'gul-3', name: 'Соус томатно-мясной для гуляша', quantity: '90', unit: 'мл' },
      { id: 'gul-4', name: 'Масло сливочное в кашу', quantity: '20', unit: 'г' },
      { id: 'gul-5', name: 'Зелень петрушки свежей', quantity: '5', unit: 'г' },
    ],
    yieldWeight: '180/150/90 г',
    prepTime: '25 минут',
    technology: `1. Говядину нарезать кубиком 2x2 см, обжарить до корочки, затем томить с пассерованным луком, морковью и томатом 1.5–2 часа до мягкости.
2. Гречневую крупу сварить в соотношении 1:2 до идеальной рассыпчатости, заправить сливочным маслом.
3. Прогреть гуляш в ароматной мясной подливе.`,
    plating: 'На овальное или круглое блюдо горкой выложить горячую гречневую кашу, рядом выложить кусочки томленого гуляша и обильно полить густым соусом. Посыпать свежей зеленью.',
    importantNotes: 'Мясо должно быть тающим во рту, соус — глянцевым и насыщенным.',
    chefTip: 'Сливочное масло в гречку добавлять сразу после выключения огня под крышку.',
    currentVersion: '1.0',
    published: true,
    createdAt: '2026-09-22',
    updatedAt: '2026-09-22',
  },
  {
    id: 'rec-pure-kotlety',
    title: 'Пюре с котлетами',
    category: 'mains',
    restaurantId: 'golodnyy_turist',
    description: 'Воздушное картофельное пюре на сливках и сливочном масле с сочными домашними мясными котлетами.',
    mainPhoto: '/assets/pure_kotlety.jpg',
    extraPhotos: [],
    ingredients: [
      { id: 'pk-1', name: 'Котлеты домашние мясные (2 шт)', quantity: '160', unit: 'г' },
      { id: 'pk-2', name: 'Пюре картофельное на молоке и масле', quantity: '200', unit: 'г' },
      { id: 'pk-3', name: 'Соус мясной / сливочный демиглас', quantity: '50', unit: 'мл' },
      { id: 'pk-4', name: 'Огурчик соленый бочковой (слайсы)', quantity: '40', unit: 'г' },
      { id: 'pk-5', name: 'Зелень свежего укропа', quantity: '5', unit: 'г' },
    ],
    yieldWeight: '200/160/50 г',
    prepTime: '20 минут',
    technology: `1. Отварной картофель протереть, ввести горячее молоко и сливочное масло, взбить до воздушной бархатистой консистенции.
2. Котлеты обжарить с двух сторон до золотистой корочки и довести в пароконвектомате при 170°C 8 минут.
3. Прогреть соус.`,
    plating: 'Выложить пюре волной или полукругом. Рядом уложить две сочные котлеты, полить соусом по стыку. Сервировать слайсами соленого огурчика и зеленью.',
    importantNotes: 'Пюре подавать строго горячим, ни в коем случае не допускать остывания или образования комочков.',
    chefTip: 'Молоко для пюре должно быть горячим, иначе пюре потеряет воздушность и станет серым.',
    currentVersion: '1.0',
    published: true,
    createdAt: '2026-09-22',
    updatedAt: '2026-09-22',
  },
  {
    id: 'rec-pelmeni',
    title: 'Пельмени',
    category: 'mains',
    restaurantId: 'golodnyy_turist',
    description: 'Классические домашние пельмени ручной лепки со сочным фаршем из свинины и говядины, сливочным маслом и сметаной.',
    mainPhoto: '/assets/pelmeni_classic.jpg',
    extraPhotos: [],
    ingredients: [
      { id: 'pel-1', name: 'Пельмени ручной лепки (порция 15-18 шт)', quantity: '240', unit: 'г' },
      { id: 'pel-2', name: 'Масло сливочное 82.5%', quantity: '25', unit: 'г' },
      { id: 'pel-3', name: 'Сметана 20% домашняя', quantity: '50', unit: 'г' },
      { id: 'pel-4', name: 'Бульон мясной или отвар с лавровым листом', quantity: '30', unit: 'мл' },
      { id: 'pel-5', name: 'Зелень свежего укропа рубленая', quantity: '5', unit: 'г' },
      { id: 'pel-6', name: 'Перец черный свежемолотый', quantity: '1', unit: 'г' },
    ],
    yieldWeight: '250/50 г',
    prepTime: '12 минут',
    technology: `1. Воду довести до бурного кипения, добавить соль, лавровый лист и перец горошком.
2. Опустить пельмени, аккуратно перемешать шумовкой, чтобы не прилипли ко дну.
3. После всплытия варить на умеренном кипении 5–6 минут.
4. Извлечь шумовкой, слить лишнюю воду, выложить в подогретую посуду и перемешать со сливочным маслом.`,
    plating: 'Подавать в глубокой керамической миске или глиняном горшочке. Сверху посыпать свежим укропом и свежемолотым перцем. Отдельно в соуснике подать густую сметану.',
    importantNotes: 'Пельмени не переваривать, тесто должно сохранить упругость al dente.',
    chefTip: 'Добавление ложки сливочного масла прямо в воду при варке делает тесто шелковистым.',
    currentVersion: '1.0',
    published: true,
    createdAt: '2026-09-22',
    updatedAt: '2026-09-22',
  },
  {
    id: 'rec-pelmeni-zharenye',
    title: 'Пельмени жареные',
    category: 'mains',
    restaurantId: 'golodnyy_turist',
    description: 'Хрустящие жареные пельмени с золотистой корочкой, подаются с пикантным сметанно-чесночным соусом.',
    mainPhoto: '/assets/zharenye_pelmeni.jpg',
    extraPhotos: [],
    ingredients: [
      { id: 'pz-1', name: 'Пельмени мясные', quantity: '240', unit: 'г' },
      { id: 'pz-2', name: 'Масло сливочное и растительное для жарки', quantity: '35', unit: 'мл' },
      { id: 'pz-3', name: 'Соус сметанно-чесночный с зеленью', quantity: '50', unit: 'г' },
      { id: 'pz-4', name: 'Зеленый лук рубленый', quantity: '10', unit: 'г' },
    ],
    yieldWeight: '220/50 г',
    prepTime: '15 минут',
    technology: `1. На широкой толстостенной сковороде разогреть смесь растительного и сливочного масел.
2. Выложить пельмени в один слой, обжарить на сильном огне до румяной корочки со всех сторон (4–5 минут).
3. Влить 50 мл горячей воды, накрыть крышкой на 2–3 минуты для пропаривания начинки.
4. Снять крышку и дожарить до полного выпаривания влаги и восстановления хрустящей корочки.`,
    plating: 'Выложить горкой на плоскую тарелку. Посыпать мелко рубленным зеленым луком. Рядом сервировать плошку с соусом.',
    importantNotes: 'Следить за корочкой: она должна быть равномерно золотистой, без подгорания.',
    chefTip: 'Смесь сливочного и растительного масла дает идеальный цвет без чада.',
    currentVersion: '1.0',
    published: true,
    createdAt: '2026-09-22',
    updatedAt: '2026-09-22',
  },
  {
    id: 'rec-olivie',
    title: 'Оливье',
    category: 'salads',
    restaurantId: 'golodnyy_turist',
    description: 'Любимый праздничный салат с отварным мясом, картофелем, зеленым горошком, маринованными огурчиками и классической заправкой.',
    mainPhoto: '/assets/olivie_salad.jpg',
    extraPhotos: [],
    ingredients: [
      { id: 'ol-1', name: 'Картофель отварной кубиком', quantity: '50', unit: 'г' },
      { id: 'ol-2', name: 'Морковь отварная кубиком', quantity: '30', unit: 'г' },
      { id: 'ol-3', name: 'Мясо отварное / ветчина', quantity: '60', unit: 'г' },
      { id: 'ol-4', name: 'Огурцы соленые бочковые', quantity: '40', unit: 'г' },
      { id: 'ol-5', name: 'Горошек зеленый консервированный', quantity: '30', unit: 'г' },
      { id: 'ol-6', name: 'Яйцо куриное отварное', quantity: '1', unit: 'шт' },
      { id: 'ol-7', name: 'Майонез классический 67%', quantity: '40', unit: 'г' },
    ],
    yieldWeight: '220 г',
    prepTime: '15 минут',
    technology: `1. Все ингредиенты нарезать аккуратным мелким кубиком размером с горошину (5х5 мм).
2. Огурцы слегка отжать от лишнего рассола.
3. Соединить компоненты в охлажденной емкости, добавить майонез, соль и черный перец.
4. Осторожно перемешать движениями снизу вверх.`,
    plating: 'Выложить через кулинарное кольцо в центр тарелки. Сверху украсить перепелиным яйцом, горошком и веточкой петрушки.',
    importantNotes: 'Все отварные овощи должны быть полностью охлаждены перед нарезкой, чтобы салат сохранил форму.',
    chefTip: 'Нарезка одинакового калибра — признак профессиональной кухни.',
    currentVersion: '1.0',
    published: true,
    createdAt: '2026-09-22',
    updatedAt: '2026-09-22',
  },
  {
    id: 'rec-shuba',
    title: 'Сельдь под шубой',
    category: 'salads',
    restaurantId: 'golodnyy_turist',
    description: 'Традиционный слоеный салат со слабосоленой сельдью, запеченными овощами и воздушным желтком.',
    mainPhoto: '/assets/shuba_salad.jpg',
    extraPhotos: [],
    ingredients: [
      { id: 'sh-1', name: 'Филе сельди слабосоленое мелким кубиком', quantity: '70', unit: 'г' },
      { id: 'sh-2', name: 'Картофель запеченный тертый', quantity: '60', unit: 'г' },
      { id: 'sh-3', name: 'Лук репчатый маринованный', quantity: '20', unit: 'г' },
      { id: 'sh-4', name: 'Морковь отварная тертая', quantity: '40', unit: 'г' },
      { id: 'sh-5', name: 'Свекла запеченная тертая', quantity: '70', unit: 'г' },
      { id: 'sh-6', name: 'Яйцо отварное (белок и желток)', quantity: '1', unit: 'шт' },
      { id: 'sh-7', name: 'Майонез', quantity: '45', unit: 'г' },
    ],
    yieldWeight: '240 г',
    prepTime: '20 минут',
    technology: `1. Сельдь нарезать мелким кубиком, лук ошпарить и замариновать с каплей уксуса.
2. Выкладывать слоями через сервировочное кольцо:
   - 1 слой: отварной картофель + тонкая сеточка майонеза
   - 2 слой: сельдь с луком + капля масла
   - 3 слой: натертый белок яйца + майонез
   - 4 слой: морковь + майонез
   - 5 слой: свекла + плотный слой майонеза
3. Верх украсить тертым воздушным желтком и зеленью.`,
    plating: 'Подавать в прозрачном кольце или аккуратной порционной башенкой. Украсить зеленым луком.',
    importantNotes: 'Дать настояться в холодильнике минимум 30 минут перед подачей.',
    chefTip: 'Запекание овощей вместо варки делает вкус насыщенным и концентрированным.',
    currentVersion: '1.0',
    published: true,
    createdAt: '2026-09-22',
    updatedAt: '2026-09-22',
  },
  {
    id: 'rec-krevetki-tempura',
    title: 'Креветки темпура',
    category: 'appetizers',
    restaurantId: 'golodnyy_turist',
    description: 'Крупные тигровые креветки в легком воздушном кляре темпура с кисло-сладким соусом.',
    mainPhoto: '/assets/krevetki_tempura.jpg',
    extraPhotos: [],
    ingredients: [
      { id: 'kr-1', name: 'Креветки тигровые очищенные с хвостиком (6 шт)', quantity: '150', unit: 'г' },
      { id: 'kr-2', name: 'Мука темпурная со льдом', quantity: '60', unit: 'г' },
      { id: 'kr-3', name: 'Сухари панко хрустящие', quantity: '30', unit: 'г' },
      { id: 'kr-4', name: 'Масло фритюрное для жарки', quantity: '200', unit: 'мл' },
      { id: 'kr-5', name: 'Соус сладкий чили / спайси майо', quantity: '40', unit: 'мл' },
      { id: 'kr-6', name: 'Долька лимона для подачи', quantity: '1', unit: 'шт' },
    ],
    yieldWeight: '160/40 г',
    prepTime: '10 минут',
    technology: `1. Креветки распрямить, сделав 2–3 неглубоких надреза по брюшку.
2. Приготовить кляр темпура на ледяной воде (не вымешивать до однородности, должны оставаться комочки).
3. Обмакнуть креветку в муку, затем в кляр и в сухари панко.
4. Обжаривать во фритюре при 180°C ровно 2.5–3 минуты до золотистого цвета.
5. Обсушить на решетке или бумажном полотенце.`,
    plating: 'Выложить креветки хвостиками вверх на узкую тарелку. Подать с соусом чили и долькой свежего лимона.',
    importantNotes: 'Кляр должен быть строго ледяным, масло — строго 180°C. Подавать мгновенно из-под ножа.',
    chefTip: 'Ледяная вода в кляре дает взрывной хруст при контакте с горячим фритюром.',
    currentVersion: '1.0',
    published: true,
    createdAt: '2026-09-22',
    updatedAt: '2026-09-22',
  },
];

export const INITIAL_RECIPES: Recipe[] = [
  ...MINSK_RECIPES.map(r => ({ ...r, restaurantId: 'golodnyy_turist' as const })),
  ...ARMENIA_RECIPES.map(r => ({ ...r, restaurantId: 'golodnyy_turist' as const })),
];

export const ALL_RECIPE_IDS = new Set(INITIAL_RECIPES.map(r => r.id));

export const ALL_TITLES_LOWER = new Set(
  INITIAL_RECIPES.map(r => r.title.trim().toLowerCase())
);

/**
 * Accurately determines restaurant ID for a recipe (always 'golodnyy_turist' in unified mode).
 */
export function getCanonicalRestaurantId(_recipe?: {
  title?: string;
  id?: string;
  restaurantId?: string;
}): RestaurantId {
  return 'golodnyy_turist';
}

/**
 * Reconciles any loaded or existing recipe list against canonical recipes:
 * 1. Unifies all 51 dishes (12 + 39) into the single «Голодный Турист» collection.
 * 2. Deduplicates dishes by title/id without repeats.
 * 3. Preserves all user-uploaded photos, versions, ingredients and notes.
 * 4. Ensures all baseline dishes are present.
 */
export function reconcileRecipes(existingList: Recipe[]): Recipe[] {
  const map = new Map<string, Recipe>();

  // 1. Initialize with all canonical dishes (51 dishes)
  INITIAL_RECIPES.forEach(baseRecipe => {
    map.set(baseRecipe.title.trim().toLowerCase(), { ...baseRecipe, restaurantId: 'golodnyy_turist' });
  });

  // 2. Overlay user modifications and preserve uploaded photos/versions
  existingList.forEach(existing => {
    if (!existing || !existing.title) return;
    const existingNorm = existing.title.trim().toLowerCase();

    if (map.has(existingNorm)) {
      const current = map.get(existingNorm)!;

      // Check version and timestamp: never allow older incoming data to overwrite newer current data!
      const currentVer = parseFloat(current.currentVersion || '1.0') || 1.0;
      const incomingVer = parseFloat(existing.currentVersion || '1.0') || 1.0;
      const currentTs = current.updatedAt ? new Date(current.updatedAt).getTime() : 0;
      const incomingTs = existing.updatedAt ? new Date(existing.updatedAt).getTime() : 0;

      if (currentVer > incomingVer || (currentVer === incomingVer && currentTs > incomingTs && incomingTs > 0)) {
        return;
      }

      // Incoming is newer or equal -> apply incoming changes onto current
      map.set(existingNorm, {
        ...current,
        ...existing,
        id: current.id,
        restaurantId: 'golodnyy_turist',
        title: (existing.title && existing.title.trim()) ? existing.title.trim() : current.title,
        mainPhoto: (existing.mainPhoto && existing.mainPhoto.trim() !== '') ? existing.mainPhoto.trim() : current.mainPhoto,
        extraPhotos: (existing.extraPhotos && existing.extraPhotos.length > 0) ? existing.extraPhotos : (current.extraPhotos || []),
        description: existing.description !== undefined && existing.description !== '' ? existing.description : current.description,
        technology: existing.technology !== undefined && existing.technology !== '' ? existing.technology : current.technology,
        plating: existing.plating !== undefined && existing.plating !== '' ? existing.plating : current.plating,
        importantNotes: existing.importantNotes !== undefined ? existing.importantNotes : current.importantNotes,
        chefTip: existing.chefTip !== undefined ? existing.chefTip : current.chefTip,
        ingredients: (existing.ingredients && existing.ingredients.length > 0) ? existing.ingredients : current.ingredients,
        currentVersion: existing.currentVersion || current.currentVersion || '1.0',
        updatedAt: existing.updatedAt || current.updatedAt,
        history: (existing.history && existing.history.length >= (current.history?.length || 0)) ? existing.history : current.history,
      });
    } else {
      map.set(existingNorm, {
        ...existing,
        restaurantId: 'golodnyy_turist',
      });
    }
  });

  return Array.from(map.values());
}
