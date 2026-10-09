import React, { useState, useEffect, useMemo } from 'react';
import { Product, RestaurantId, ProductCategory, PriceStatus } from '../types';
import { AVAILABLE_ICONS, COMMON_UNITS, PRODUCT_CATEGORIES } from '../data/initialData';
import { X, Check, Plus, Minus, Store, Sparkles, AlertTriangle, Image as ImageIcon } from 'lucide-react';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (productData: Omit<Product, 'id' | 'order'>, quantity?: number) => void;
  onDelete?: (id: string) => void;
  editingProduct?: Product | null;
  initialName?: string;
  selectedRestaurant?: RestaurantId;
}

const SMART_ICON_MAP: Record<string, string> = {
  'лук': '🧅',
  'картоф': '🥔',
  'помидор': '🍅',
  'томат': '🍅',
  'огур': '🥒',
  'морков': '🥕',
  'чеснок': '🧄',
  'говядин': '🥩',
  'мясо': '🥩',
  'телятин': '🥩',
  'куриц': '🍗',
  'птиц': '🍗',
  'индейк': '🍗',
  'крыл': '🍗',
  'свинин': '🐖',
  'фарш': '🥩',
  'яйц': '🥚',
  'рис': '🍚',
  'масло': '🫗',
  'перец': '🫑',
  'зелень': '🌿',
  'петрушк': '🌿',
  'укроп': '🌿',
  'кинз': '🌿',
  'базилик': '🌿',
  'тимьян': '🌿',
  'розмарин': '🌿',
  'мята': '🌿',
  'руккол': '🥬',
  'салат': '🥬',
  'капуст': '🥬',
  'пекинск': '🥬',
  'сыр': '🧀',
  'моцарелл': '🧀',
  'пармезан': '🧀',
  'сулугуни': '🧀',
  'фета': '🧀',
  'молок': '🥛',
  'сливк': '🥛',
  'сметан': '🥛',
  'творог': '🧀',
  'йогурт': '🥛',
  'кефир': '🥛',
  'майонез': '🥫',
  'мука': '🌾',
  'крупа': '🌾',
  'хлопь': '🌾',
  'сахар': '🧂',
  'соль': '🧂',
  'специ': '🧂',
  'приправ': '🧂',
  'лимон': '🍋',
  'лайм': '🍋',
  'яблок': '🍎',
  'груш': '🍐',
  'апельсин': '🍊',
  'мандарин': '🍊',
  'грейпфрут': '🍊',
  'виноград': '🍇',
  'клубник': '🍓',
  'ягод': '🍓',
  'малин': '🍓',
  'черник': '🫐',
  'банан': '🍌',
  'ананас': '🍍',
  'хлеб': '🍞',
  'лаваш': '🥖',
  'багет': '🥖',
  'булочк': '🥯',
  'тост': '🍞',
  'лепешк': '🫓',
  'рыб': '🐟',
  'лосос': '🐟',
  'семг': '🐟',
  'форел': '🐟',
  'сибас': '🐟',
  'дорад': '🐟',
  'судак': '🐟',
  'скумбри': '🐟',
  'креветк': '🍤',
  'кальмар': '🦑',
  'мидии': '🦪',
  'осьминог': '🐙',
  'бекон': '🥓',
  'колбас': '🥓',
  'сосиск': '🌭',
  'ветчин': '🥓',
  'шпик': '🥓',
  'сало': '🥓',
  'гриб': '🍄',
  'шампиньон': '🍄',
  'вешенк': '🍄',
  'кукуруз': '🌽',
  'горох': '🫛',
  'фасол': '🫘',
  'нут': '🫘',
  'чечевиц': '🫘',
  'авокадо': '🥑',
  'соус': '🥫',
  'паст': '🥫',
  'кетчуп': '🥫',
  'горчиц': '🥫',
  'уксус': '🫗',
  'кофе': '☕',
  'чай': '🫖',
  'сок': '🧃',
  'вод': '💧',
  'водк': '🍶',
  'вино': '🍷',
  'пиво': '🍺',
  'салфетк': '🧻',
  'полотенц': '🧻',
  'пакет': '🛍️',
  'фольг': '📦',
  'контейнер': '🥡',
  'ланчбокс': '🥡',
  'микрофибр': '🧽',
  'перчатк': '🧤',
  'мыло': '🧼',
  'химия': '🧴',
};

function guessIconFromName(name: string): string {
  const lower = name.toLowerCase().trim();
  for (const [key, emoji] of Object.entries(SMART_ICON_MAP)) {
    if (lower.includes(key)) {
      return emoji;
    }
  }
  return '📦';
}

function guessCategoryFromName(name: string): ProductCategory {
  const lower = name.toLowerCase().trim();
  if (lower.includes('настойк') || lower.includes('сироп') || lower.includes('с/м') || lower.includes('ягодный микс') || lower.includes('смородина') || lower.includes('малина')) {
    return 'tincture';
  }
  if (lower.includes('содов') || lower.includes('спрайт') || lower.includes('кола') || lower.includes('чай') || lower.includes('кофе') || lower.includes('ментос') || lower.includes('сок') || lower.includes('трубочк') || lower.includes('чеков') || lower.includes('зубочистк') || lower.includes('бутылк')) {
    return 'bar';
  }
  if (lower.includes('салфетк') || lower.includes('пергамент') || lower.includes('губк') || lower.includes('контейнер') || lower.includes('соусник') || lower.includes('пакет') || lower.includes('плёнк') || lower.includes('пленк') || lower.includes('фольг') || lower.includes('моющее') || lower.includes('хлор') || lower.includes('мусорн') || lower.includes('шапочк') || lower.includes('полотенц') || lower.includes('микрофибр') || lower.includes('перчатк') || lower.includes('мыло')) {
    return 'consumables';
  }
  if (lower.includes('хлеб') || lower.includes('багет') || lower.includes('булочк') || lower.includes('лаваш') || lower.includes('бумаг') || lower.includes('уголь') || lower.includes('термобокс') || lower.includes('резинк') || lower.includes('вода') || lower.includes('вод')) {
    return 'other';
  }
  if (lower.includes('говядин') || lower.includes('свинин') || lower.includes('куриц') || lower.includes('кур.') || lower.includes('мясо') || lower.includes('лосос') || lower.includes('рыб') || lower.includes('фарш') || lower.includes('шпик') || lower.includes('сало') || lower.includes('кост') || lower.includes('скумбри') || lower.includes('бекон') || lower.includes('салями') || lower.includes('язык') || lower.includes('сосиск') || lower.includes('креветк') || lower.includes('тилапи') || lower.includes('каре') || lower.includes('рибай') || lower.includes('тамогавк') || lower.includes('баранин') || lower.includes('хвост') || lower.includes('цыплен') || lower.includes('утиная')) {
    return 'meat';
  }
  if (lower.includes('сыр') || lower.includes('молок') || lower.includes('сливк') || lower.includes('сметан') || lower.includes('творог') || lower.includes('масло') || lower.includes('майонез') || lower.includes('яйц') || lower.includes('орех') || lower.includes('мука') || lower.includes('фри') || lower.includes('кетчуп') || lower.includes('соль') || lower.includes('сахар') || lower.includes('кунжут') || lower.includes('рис') || lower.includes('макарон') || lower.includes('маслин') || lower.includes('дрожж') || lower.includes('паст') || lower.includes('фасол') || lower.includes('кориандр') || lower.includes('орегано') || lower.includes('паприк') || lower.includes('перец-горошек') || lower.includes('соевый') || lower.includes('кориц') || lower.includes('мёд') || lower.includes('мед') || lower.includes('брусник') || lower.includes('уксус') || lower.includes('каперс')) {
    return 'grocery';
  }
  return 'vegetables';
}

export const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  editingProduct,
  initialName = '',
  selectedRestaurant = 'golodnyy_turist',
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ProductCategory>('vegetables');
  const [icon, setIcon] = useState('📦');
  const [imageUrl, setImageUrl] = useState('');
  const [userCustomizedIcon, setUserCustomizedIcon] = useState(false);
  const [defaultUnit, setDefaultUnit] = useState<string>('кг');
  const [defaultPrice, setDefaultPrice] = useState('');
  const [priceStatus, setPriceStatus] = useState<PriceStatus>('confirmed');
  const [priceRangeNote, setPriceRangeNote] = useState('');
  const [aliasesText, setAliasesText] = useState('');
  const [quantity, setQuantity] = useState<string>('1');
  const [restaurantScope, setRestaurantScope] = useState<'current' | 'both'>('current');
  const [customIconInput, setCustomIconInput] = useState('');
  const [error, setError] = useState('');

  // Significant price change warning tracking
  const [originalPrice, setOriginalPrice] = useState<string>('');
  const [confirmedPriceChange, setConfirmedPriceChange] = useState(false);

  // Synchronize state on open or editingProduct change
  useEffect(() => {
    if (!isOpen) return;

    if (editingProduct) {
      setName(editingProduct.name || '');
      setCategory((editingProduct.category as ProductCategory) || guessCategoryFromName(editingProduct.name || ''));
      setIcon(editingProduct.icon || '📦');
      setImageUrl(editingProduct.imageUrl || '');
      setUserCustomizedIcon(true);
      setDefaultUnit(editingProduct.defaultUnit || 'кг');
      
      const restPrice = editingProduct.pricesByRestaurant?.[selectedRestaurant] || editingProduct.defaultPrice || '';
      setDefaultPrice(restPrice);
      setOriginalPrice(restPrice);
      setConfirmedPriceChange(false);

      setPriceStatus(editingProduct.priceStatus || (editingProduct.priceRangeNote ? 'needs_confirmation' : 'confirmed'));
      setPriceRangeNote(editingProduct.priceRangeNote || '');
      setAliasesText((editingProduct.aliases || []).join(', '));
      setQuantity('1');

      const isBoth = !editingProduct.restaurants || editingProduct.restaurants.length === 0 || editingProduct.restaurants.length > 1;
      setRestaurantScope(isBoth ? 'both' : 'current');
      setCustomIconInput('');
      setError('');
    } else {
      const initial = initialName.trim();
      setName(initial);
      setCategory(guessCategoryFromName(initial));
      const guessed = initial ? guessIconFromName(initial) : '🧅';
      setIcon(guessed);
      setImageUrl('');
      setUserCustomizedIcon(false);
      setDefaultUnit('кг');
      setDefaultPrice('');
      setOriginalPrice('');
      setConfirmedPriceChange(false);
      setPriceStatus('confirmed');
      setPriceRangeNote('');
      setAliasesText('');
      setQuantity('1');
      setRestaurantScope('current');
      setCustomIconInput('');
      setError('');
    }
  }, [isOpen, editingProduct, initialName, selectedRestaurant]);

  // Detect significant price change
  const hasSignificantPriceChange = useMemo(() => {
    if (!editingProduct) return false;
    const oldVal = parseFloat(originalPrice);
    const newVal = parseFloat(defaultPrice);

    if (isNaN(oldVal) || oldVal <= 0) {
      return false;
    }
    if (isNaN(newVal) || newVal <= 0) {
      return false;
    }

    const diff = Math.abs(newVal - oldVal);
    // Warning if price changes by 30% or more, or by 30฿ or more
    const percentDiff = diff / oldVal;
    return percentDiff >= 0.3 || diff >= 30;
  }, [editingProduct, originalPrice, defaultPrice]);

  // Handle typing name with smart icon suggestion if not customized
  const handleNameChange = (val: string) => {
    setName(val);
    setError('');
    if (!userCustomizedIcon && !customIconInput) {
      const guessed = guessIconFromName(val);
      setIcon(guessed);
    }
    if (!editingProduct) {
      setCategory(guessCategoryFromName(val));
    }
  };

  if (!isOpen) return null;

  const currentRestName = 'Голодный Турист';

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setError('Пожалуйста, укажите название товара или продукта');
      return;
    }

    if (hasSignificantPriceChange && !confirmedPriceChange) {
      setError('Пожалуйста, подтвердите изменение цены перед сохранением');
      return;
    }

    const assignedRestaurants: RestaurantId[] = ['golodnyy_turist'];
    const cleanPrice = defaultPrice.trim();

    // Parse aliases
    const aliases = aliasesText
      .split(',')
      .map(s => s.trim().toLowerCase())
      .filter(Boolean);

    const productPayload: Omit<Product, 'id' | 'order'> = {
      name: cleanName,
      category,
      icon: customIconInput.trim() || icon || '📦',
      imageUrl: imageUrl.trim() || undefined,
      defaultUnit,
      defaultPrice: cleanPrice,
      pricePerKg: defaultUnit === 'кг' ? (cleanPrice || (priceStatus === 'needs_confirmation' ? priceRangeNote : undefined)) : undefined,
      priceStatus,
      priceRangeNote: priceStatus === 'needs_confirmation' ? priceRangeNote.trim() : undefined,
      aliases: aliases.length > 0 ? aliases : undefined,
      pricesByRestaurant: {
        golodnyy_turist: cleanPrice,
        ...(editingProduct?.pricesByRestaurant || {}),
        [selectedRestaurant]: cleanPrice,
      },
      restaurants: assignedRestaurants,
    };

    const numQty = parseFloat(quantity);
    const parsedQty = !isNaN(numQty) && numQty > 0 ? numQty : undefined;

    onSave(productPayload, parsedQty);
    onClose();
  };

  const isWeightBased = defaultUnit === 'кг';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-[#FFFDF8] rounded-3xl p-5 sm:p-6 shadow-2xl border-2 border-[#E2D8C3] max-h-[92vh] overflow-y-auto flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-stone-200">
            <div>
              <h3 className="text-lg sm:text-xl font-black text-[#2A1E17] flex items-center gap-2">
                <span>{editingProduct ? 'Редактировать товар' : 'Добавить товар в каталог'}</span>
              </h3>
              <p className="text-[11px] font-semibold text-stone-600 mt-0.5">
                {editingProduct 
                  ? 'Изменение параметров в справочнике товаров' 
                  : `Сохранится в каталоге для последующих заказов`}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-stone-500 hover:text-stone-800 rounded-full hover:bg-stone-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSave} className="mt-4 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl font-bold border border-red-200 animate-in shake">
                {error}
              </div>
            )}

            {/* Product Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                Название товара / продукта *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Например: Чеснок, Лосось, Сметана..."
                className="w-full px-4 py-2.5 bg-white rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold text-stone-800 text-sm sm:text-base shadow-2xs"
                autoFocus
              />
            </div>

            {/* Category Selector */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                Категория в каталоге
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ProductCategory)}
                className="w-full px-3 py-2.5 bg-white rounded-xl border border-stone-300 font-bold text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {PRODUCT_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Unit and Price Row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                  Единица измерения
                </label>
                <select
                  value={defaultUnit}
                  onChange={(e) => setDefaultUnit(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white rounded-xl border border-stone-300 font-bold text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {COMMON_UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-stone-500 mt-1 font-medium">
                  {isWeightBased ? 'Весовой товар (цена за 1 кг)' : 'Штучный / фасованный товар'}
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                  {isWeightBased ? 'Цена за 1 кг (₽)' : `Цена за 1 ${defaultUnit} (₽)`}
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={defaultPrice}
                  onChange={(e) => setDefaultPrice(e.target.value)}
                  placeholder={priceStatus === 'needs_confirmation' ? 'Не установлена' : '0'}
                  className="w-full px-3 py-2.5 bg-white rounded-xl border border-stone-300 font-black text-stone-900 text-base focus:outline-none focus:ring-2 focus:ring-amber-500 text-center"
                />
                <p className="text-[10px] text-stone-500 mt-1 font-medium">
                  Сумма = {isWeightBased ? 'вес × цена за кг' : `кол-во × цена`}
                </p>
              </div>
            </div>

            {/* Price Status & Range Note */}
            <div className="p-3 bg-[#F5EFE1] rounded-2xl border border-[#E5DCBE] space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase tracking-wider text-stone-800">
                  Статус цены
                </label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPriceStatus('confirmed')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      priceStatus === 'confirmed'
                        ? 'bg-emerald-700 text-white shadow-2xs'
                        : 'bg-white text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    ✓ Подтверждена
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriceStatus('needs_confirmation')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      priceStatus === 'needs_confirmation'
                        ? 'bg-amber-600 text-white shadow-2xs'
                        : 'bg-white text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    ⚠️ Требует подтверждения
                  </button>
                </div>
              </div>

              {priceStatus === 'needs_confirmation' && (
                <div>
                  <label className="block text-[11px] font-bold text-amber-900 mb-1">
                    Диапазон цен или примечание:
                  </label>
                  <input
                    type="text"
                    value={priceRangeNote}
                    onChange={(e) => setPriceRangeNote(e.target.value)}
                    placeholder="Например: 50–100 ₽/кг, 20–40 ₽/кг..."
                    className="w-full px-3 py-2 bg-white rounded-xl border border-amber-300 font-semibold text-stone-800 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <p className="text-[10px] text-stone-500 mt-1">
                    Сотрудники увидят предупреждение о необходимости уточнить текущую цену
                  </p>
                </div>
              )}
            </div>

            {/* Significant Price Change Warning Banner (Requirement 10) */}
            {hasSignificantPriceChange && (
              <div className="p-3.5 bg-amber-100 border-2 border-amber-400 rounded-2xl animate-in fade-in space-y-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-800 shrink-0 mt-0.5" />
                  <div className="flex-1 text-xs text-amber-950 font-bold">
                    <p className="font-black text-sm text-amber-950">Цена существенно изменилась!</p>
                    <p className="mt-0.5">
                      Прежняя цена: <span className="line-through font-mono">{originalPrice} ₽</span> → Новая цена: <span className="font-mono text-emerald-900 font-black">{defaultPrice} ₽</span>
                    </p>
                    <p className="mt-1 text-[11px] text-amber-800 font-medium">
                      «Цена изменилась. Проверьте новую цену перед сохранением».
                    </p>
                  </div>
                </div>

                <label className="flex items-center gap-2 pt-1 border-t border-amber-200 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={confirmedPriceChange}
                    onChange={(e) => setConfirmedPriceChange(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-800 focus:ring-amber-600 cursor-pointer"
                  />
                  <span className="text-xs font-black text-amber-900">
                    Да, подтверждаю установку новой цены {defaultPrice} ₽
                  </span>
                </label>
              </div>
            )}

            {/* Aliases / Synonyms for fast search */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                Синонимы / альтернативные названия (через запятую)
              </label>
              <input
                type="text"
                value={aliasesText}
                onChange={(e) => setAliasesText(e.target.value)}
                placeholder="Например: честнок, чеснок свежий, garlic..."
                className="w-full px-3 py-2 bg-white rounded-xl border border-stone-300 text-xs font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <p className="text-[10px] text-stone-500 mt-1">
                Поиск сразу найдет этот товар, даже если сотрудник наберет синоним или сделает опечатку
              </p>
            </div>

            {/* Quantity for Current Order (if adding new product) */}
            {!editingProduct && (
              <div className="p-3.5 bg-[#F6F0E2] rounded-2xl border border-[#E5DCBE]">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-black uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
                    <span>Количество в текущий заказ</span>
                  </label>
                  <span className="text-[11px] text-stone-600 font-semibold">
                    сразу включить в заявку
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const cur = parseFloat(quantity) || 0;
                      const step = isWeightBased ? 0.5 : 1;
                      if (cur > step) setQuantity(String(Math.max(step, cur - step)));
                    }}
                    className="w-10 h-10 rounded-xl bg-white border border-stone-300 flex items-center justify-center text-stone-700 hover:bg-stone-50 active:scale-95 font-bold shadow-2xs"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="1"
                    className="flex-1 h-10 bg-white rounded-xl border border-stone-300 text-center font-black text-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const cur = parseFloat(quantity) || 0;
                      const step = isWeightBased ? 0.5 : 1;
                      setQuantity(String(cur + step));
                    }}
                    className="w-10 h-10 rounded-xl bg-stone-900 text-white flex items-center justify-center hover:bg-stone-800 active:scale-95 font-bold shadow-2xs"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Restaurant Scope Info */}
            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-amber-800" />
                <span className="text-xs font-black text-stone-800">
                  Ресторан «{currentRestName}»
                </span>
              </div>
              <span className="text-[10px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full">
                Единый каталог
              </span>
            </div>

            {/* Icon and Image URL */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-stone-600">
                  Иконка / Эмодзи
                </label>
                <span className="text-[10px] text-amber-900 font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Авто-подбор по названию</span>
                </span>
              </div>
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-12 h-12 rounded-xl bg-amber-50 border-2 border-amber-300 flex items-center justify-center text-2xl shadow-xs shrink-0">
                  {customIconInput.trim() || icon}
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    value={customIconInput}
                    onChange={(e) => {
                      setCustomIconInput(e.target.value);
                      setUserCustomizedIcon(true);
                    }}
                    placeholder="Вставьте эмодзи или выберите ниже"
                    className="w-full px-3 py-2 bg-white rounded-xl border border-stone-300 text-xs text-stone-800"
                  />
                </div>
              </div>

              {/* Quick Icon Grid */}
              <div className="grid grid-cols-8 gap-1 p-2 bg-[#F6F0E2] rounded-xl border border-[#E5DCBE] max-h-24 overflow-y-auto">
                {AVAILABLE_ICONS.slice(0, 32).map((ic) => (
                  <button
                    type="button"
                    key={ic}
                    onClick={() => {
                      setIcon(ic);
                      setCustomIconInput('');
                      setUserCustomizedIcon(true);
                    }}
                    className={`text-xl p-1 rounded-lg hover:bg-white transition-all flex items-center justify-center ${
                      icon === ic && !customIconInput ? 'bg-white shadow-xs scale-110' : ''
                    }`}
                  >
                    {ic}
                  </button>
                ))}
              </div>

              {/* Image URL (Optional) */}
              <div className="mt-2.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1 flex items-center gap-1">
                  <ImageIcon className="w-3.5 h-3.5 text-stone-500" />
                  <span>Ссылка на изображение товара (необязательно)</span>
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/product.jpg"
                  className="w-full px-3 py-2 bg-white rounded-xl border border-stone-300 text-xs font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Bottom Modal Actions */}
            <div className="pt-3 border-t border-stone-200 flex items-center justify-between gap-2">
              {editingProduct && onDelete ? (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Удалить продукт «${editingProduct.name}» из каталога?`)) {
                      onDelete(editingProduct.id);
                      onClose();
                    }
                  }}
                  className="px-3.5 py-2.5 text-xs font-black text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-xl border border-red-200 transition-colors cursor-pointer"
                >
                  Удалить
                </button>
              ) : <div />}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 font-bold text-xs sm:text-sm hover:bg-stone-100 transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={hasSignificantPriceChange && !confirmedPriceChange}
                  className={`px-5 py-2.5 rounded-xl text-white font-black text-xs sm:text-sm shadow-md transition-all flex items-center gap-1.5 ${
                    hasSignificantPriceChange && !confirmedPriceChange
                      ? 'bg-stone-400 cursor-not-allowed'
                      : 'bg-[#2A1E17] hover:bg-[#3E2C22] active:scale-95 cursor-pointer'
                  }`}
                >
                  <Check className="w-4 h-4 text-amber-300 stroke-[3]" />
                  <span>
                    {editingProduct 
                      ? 'Сохранить изменения' 
                      : (quantity && parseFloat(quantity) > 0 
                          ? `В каталог и заказ (${quantity} ${defaultUnit})` 
                          : 'Сохранить в каталог')}
                  </span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
