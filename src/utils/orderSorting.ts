import { OrderItem, Product, RestaurantId } from '../types';
import { INITIAL_PRODUCTS } from '../data/initialData';

/**
 * Buyer Route Department Order strictly specified:
 * 1. Овощи
 * 2. Мясо
 * 3. Бакалея
 * 4. Бар
 * 5. Хоз-ка
 * 6. Прочее
 */
export function getDepartmentRank(deptOrCat?: string | null, productName?: string): number {
  const pName = (productName || '').trim().toLowerCase();

  // Tier 1: Semantic keyword check from product name (highest reliability)
  // This protects against dummy/corrupt data like department '1' or missing categories.
  if (pName) {
    // 5. Хоз-ка (Household & Consumables)
    if (
      pName.includes('контейнер') ||
      pName.includes('фольг') ||
      pName.includes('салфетк') ||
      pName.includes('пергамент') ||
      pName.includes('пленк') ||
      pName.includes('плёнк') ||
      pName.includes('пакет') ||
      pName.includes('губк') ||
      pName.includes('тряпк') ||
      pName.includes('моющее') ||
      pName.includes('мыло') ||
      pName.includes('хлор') ||
      pName.includes('белизн') ||
      pName.includes('дезинфекц') ||
      pName.includes('перчатк') ||
      pName.includes('шапочк') ||
      pName.includes('полотенц') ||
      pName.includes('микрофибр') ||
      pName.includes('мусорн') ||
      pName.includes('соусник') ||
      pName.includes('ланчбокс') ||
      pName.includes('термобокс') ||
      pName.includes('зубочистк') ||
      pName.includes('бахил') ||
      pName.includes('скотч') ||
      pName.includes('уголь') ||
      pName.includes('бумага') ||
      pName.includes('резинк') ||
      pName.includes('трубочк') ||
      pName.includes('чеков') ||
      pName.includes('шпажк') ||
      pName.includes('розжиг') ||
      pName.includes('спичк') ||
      pName.includes('зажигалк')
    ) {
      return 5;
    }

    // 1. Овощи & Фрукты & Зелень
    if (
      pName.includes('картоф') ||
      pName.includes('лук') ||
      pName.includes('морков') ||
      pName.includes('свекл') ||
      pName.includes('свёкл') ||
      pName.includes('томат') ||
      pName.includes('помидор') ||
      pName.includes('черри') ||
      pName.includes('огур') ||
      pName.includes('чеснок') ||
      pName.includes('зелень') ||
      pName.includes('петрушк') ||
      pName.includes('укроп') ||
      pName.includes('кинз') ||
      pName.includes('базилик') ||
      pName.includes('редис') ||
      pName.includes('салат') ||
      pName.includes('айсберг') ||
      pName.includes('романо') ||
      pName.includes('латук') ||
      pName.includes('руккол') ||
      pName.includes('шпинат') ||
      pName.includes('капуст') ||
      pName.includes('пекинск') ||
      pName.includes('брокколи') ||
      pName.includes('баклажан') ||
      pName.includes('кабачок') ||
      pName.includes('цукини') ||
      pName.includes('тыкв') ||
      pName.includes('гриб') ||
      pName.includes('шампиньон') ||
      pName.includes('вешенк') ||
      pName.includes('авокадо') ||
      pName.includes('имбирь') ||
      pName.includes('лимон') ||
      pName.includes('лайм') ||
      pName.includes('яблок') ||
      pName.includes('груш') ||
      pName.includes('апельсин') ||
      pName.includes('мандарин') ||
      pName.includes('ананас') ||
      pName.includes('банан') ||
      pName.includes('киви') ||
      pName.includes('виноград') ||
      pName.includes('гранат') ||
      pName.includes('манго') ||
      pName.includes('ягод') ||
      pName.includes('клубник') ||
      pName.includes('малин') ||
      pName.includes('черник') ||
      pName.includes('голубик') ||
      pName.includes('смородин') ||
      pName.includes('вишн') ||
      pName.includes('черешн') ||
      pName.includes('брусник') ||
      pName.includes('клюкв') ||
      pName.includes('розмарин') ||
      pName.includes('тимьян') ||
      pName.includes('мята') ||
      pName.includes('тархун') ||
      pName.includes('порей') ||
      pName.includes('сельдерей') ||
      pName.includes('спарж') ||
      pName.includes('перец болгар') ||
      pName.includes('перец сладк') ||
      pName.includes('перец чили') ||
      pName.includes('перец остр') ||
      pName.includes('перец халапеньо')
    ) {
      return 1;
    }

    // 2. Мясо & Птица & Рыба & Морепродукты
    if (
      pName.includes('куриц') ||
      pName.includes('кур.') ||
      pName.includes('грудк') ||
      pName.includes('филе') ||
      pName.includes('мясо') ||
      pName.includes('говядин') ||
      pName.includes('телятин') ||
      pName.includes('свинин') ||
      pName.includes('баранин') ||
      pName.includes('индейк') ||
      pName.includes('крыл') ||
      pName.includes('бедр') ||
      pName.includes('окорок') ||
      pName.includes('фарш') ||
      pName.includes('бекон') ||
      pName.includes('сало') ||
      pName.includes('шпик') ||
      pName.includes('кост') ||
      pName.includes('ребр') ||
      pName.includes('стейк') ||
      pName.includes('рибай') ||
      pName.includes('вырезк') ||
      pName.includes('ветчин') ||
      pName.includes('сосиск') ||
      pName.includes('колбас') ||
      pName.includes('салями') ||
      pName.includes('язык') ||
      pName.includes('печен') ||
      pName.includes('утка') ||
      pName.includes('утиная') ||
      pName.includes('цыплен') ||
      pName.includes('шашлык') ||
      pName.includes('рыб') ||
      pName.includes('лосос') ||
      pName.includes('семг') ||
      pName.includes('форел') ||
      pName.includes('сибас') ||
      pName.includes('дорад') ||
      pName.includes('судак') ||
      pName.includes('скумбри') ||
      pName.includes('сельдь') ||
      pName.includes('сельд') ||
      pName.includes('креветк') ||
      pName.includes('кальмар') ||
      pName.includes('мидии') ||
      pName.includes('осьминог') ||
      pName.includes('тунец') ||
      pName.includes('палтус') ||
      pName.includes('треск')
    ) {
      return 2;
    }

    // 4. Бар (Beverages & Bar Supplies)
    if (
      pName.includes('сироп') ||
      pName.includes('содов') ||
      pName.includes('кола') ||
      pName.includes('спрайт') ||
      pName.includes('фанта') ||
      pName.includes('тоник') ||
      pName.includes('чай ') ||
      pName.includes('чай-') ||
      pName.includes('кофе') ||
      pName.includes('сок ') ||
      pName.includes('сок-') ||
      pName.includes('морс') ||
      pName.includes('компот') ||
      pName.includes('пиво') ||
      pName.includes('вино ') ||
      pName.includes('водк') ||
      pName.includes('ром ') ||
      pName.includes('виски') ||
      pName.includes('коньяк') ||
      pName.includes('джин ') ||
      pName.includes('ликер') ||
      pName.includes('ликёр') ||
      pName.includes('коктейл') ||
      pName.includes('настойк') ||
      pName.includes('вода') ||
      pName.includes('минералк')
    ) {
      return 4;
    }

    // 3. Бакалея & Молочные продукты & Хлеб
    if (
      pName.includes('сыр') ||
      pName.includes('молок') ||
      pName.includes('сливк') ||
      pName.includes('сметан') ||
      pName.includes('творог') ||
      pName.includes('масло') ||
      pName.includes('майонез') ||
      pName.includes('яйц') ||
      pName.includes('мука') ||
      pName.includes('крупа') ||
      pName.includes('рис') ||
      pName.includes('макарон') ||
      pName.includes('спагетти') ||
      pName.includes('паст') ||
      pName.includes('сахар') ||
      pName.includes('соль') ||
      pName.includes('специ') ||
      pName.includes('приправ') ||
      pName.includes('перец черн') ||
      pName.includes('перец свежемол') ||
      pName.includes('перец-горошек') ||
      pName.includes('паприк') ||
      pName.includes('кориандр') ||
      pName.includes('кунжут') ||
      pName.includes('орех') ||
      pName.includes('соус') ||
      pName.includes('кетчуп') ||
      pName.includes('дрожж') ||
      pName.includes('фасол') ||
      pName.includes('горох') ||
      pName.includes('чечевиц') ||
      pName.includes('консерв') ||
      pName.includes('оливк') ||
      pName.includes('маслин') ||
      pName.includes('каперс') ||
      pName.includes('уксус') ||
      pName.includes('мёд') ||
      pName.includes('мед') ||
      pName.includes('хлеб') ||
      pName.includes('лаваш') ||
      pName.includes('багет') ||
      pName.includes('булочк') ||
      pName.includes('пита')
    ) {
      return 3;
    }
  }

  // Tier 2: Check deptOrCat string
  if (deptOrCat) {
    const s = String(deptOrCat).trim().toLowerCase();

    // 1. Овощи
    if (s === 'vegetables' || s.includes('овощ') || s.includes('фрукт') || s.includes('зелен') || s.includes('ягод')) return 1;

    // 2. Мясо
    if (s === 'meat' || s.includes('мяс') || s.includes('птиц') || s.includes('рыб') || s.includes('морепродукт')) return 2;

    // 3. Бакалея
    if (s === 'grocery' || s === 'dairy' || s === 'bread' || s.includes('бакал') || s.includes('молоч') || s.includes('сыр') || s.includes('хлеб')) return 3;

    // 4. Бар
    if (s === 'bar' || s === 'tincture' || s.includes('бар') || s.includes('напит') || s.includes('настойк') || s.includes('алког')) return 4;

    // 5. Хоз-ка
    if (s === 'consumables' || s.includes('хоз') || s.includes('расход') || s.includes('упаковк') || s.includes('хими')) return 5;

    // Strict numerical check (only if not conflicting with names)
    if (s === '1' || s.startsWith('1.') || s.startsWith('1 ')) return 1;
    if (s === '2' || s.startsWith('2.') || s.startsWith('2 ')) return 2;
    if (s === '3' || s.startsWith('3.') || s.startsWith('3 ')) return 3;
    if (s === '4' || s.startsWith('4.') || s.startsWith('4 ')) return 4;
    if (s === '5' || s.startsWith('5.') || s.startsWith('5 ')) return 5;
    if (s === '6' || s.startsWith('6.') || s.startsWith('6 ')) return 6;
  }

  // 6. Прочее (Default)
  return 6;
}

export const DEPARTMENT_NAMES: Record<number, string> = {
  1: 'ОВОЩИ',
  2: 'МЯСО',
  3: 'БАКАЛЕЯ',
  4: 'БАР',
  5: 'ХОЗ-КА',
  6: 'ПРОЧЕЕ',
};

export const DEPARTMENT_ICONS: Record<number, string> = {
  1: '🥬',
  2: '🥩',
  3: '🥫',
  4: '🍷',
  5: '📦',
  6: '📋',
};

export function getDepartmentDisplayName(rank: number): string {
  switch (rank) {
    case 1: return 'Овощи';
    case 2: return 'Мясо';
    case 3: return 'Бакалея';
    case 4: return 'Бар';
    case 5: return 'Хоз-ка';
    default: return 'Прочее';
  }
}

export interface DepartmentGroup {
  rank: number;
  name: string;
  icon: string;
  items: OrderItem[];
}

/**
 * Groups items strictly by buyer route departments:
 * 1. ОВОЩИ
 * 2. МЯСО
 * 3. БАКАЛЕЯ
 * 4. БАР
 * 5. ХОЗ-КА
 * 6. ПРОЧЕЕ
 * 
 * Only departments with at least 1 item are returned.
 */
export function groupOrderItemsByDepartment(
  items: OrderItem[],
  products: Product[] = INITIAL_PRODUCTS,
  restaurantId?: RestaurantId
): DepartmentGroup[] {
  const sorted = sortOrderItems(items, products, restaurantId);
  const groupsMap = new Map<number, OrderItem[]>();

  for (const item of sorted) {
    const rank = getDepartmentRank(item.department, item.name);
    const list = groupsMap.get(rank) || [];
    list.push(item);
    groupsMap.set(rank, list);
  }

  const result: DepartmentGroup[] = [];
  const ranks = [1, 2, 3, 4, 5, 6];

  for (const r of ranks) {
    const deptItems = groupsMap.get(r);
    if (deptItems && deptItems.length > 0) {
      result.push({
        rank: r,
        name: DEPARTMENT_NAMES[r] || 'ПРОЧЕЕ',
        icon: DEPARTMENT_ICONS[r] || '📦',
        items: deptItems,
      });
    }
  }

  return result;
}

/**
 * Sorts order items strictly according to the buyer route departments:
 * 1. Овощи
 * 2. Мясо
 * 3. Бакалея
 * 4. Бар
 * 5. Хоз-ка
 * 6. Прочее
 *
 * Inside each department, preserves the existing product order from the catalog.
 * Guaranteed to be robust against missing products, undefined departments, or corrupt data.
 */
export function sortOrderItems(
  items: OrderItem[],
  products: Product[] = INITIAL_PRODUCTS,
  restaurantId?: RestaurantId
): OrderItem[] {
  if (!items || items.length <= 1) return items ? [...items] : [];

  // Build lookup maps by ID and by lowercase trimmed name
  // Combine passed products with INITIAL_PRODUCTS for 100% catalog coverage
  const prodMapById = new Map<string, { product: Product; index: number }>();
  const prodMapByName = new Map<string, { product: Product; index: number }>();

  // First seed from INITIAL_PRODUCTS (complete base catalog)
  INITIAL_PRODUCTS.forEach((p, idx) => {
    prodMapById.set(p.id, { product: p, index: idx });
    prodMapByName.set(p.name.trim().toLowerCase(), { product: p, index: idx });
  });

  // Then override with runtime products (custom additions / edits)
  if (Array.isArray(products) && products.length > 0) {
    products.forEach((p, idx) => {
      prodMapById.set(p.id, { product: p, index: idx });
      prodMapByName.set(p.name.trim().toLowerCase(), { product: p, index: idx });
    });
  }

  const decorated = items.map((item, originalIndex) => {
    const cleanName = (item.name || '').trim().toLowerCase();
    const matched = (item.productId && prodMapById.get(item.productId)) ||
                    prodMapByName.get(cleanName);

    const prod = matched?.product;
    const catalogIndex = matched !== undefined 
      ? (typeof prod?.order === 'number' ? prod.order : matched.index) 
      : (999000 + originalIndex);

    // Get candidate department from item, restaurant overrides, or product category
    const existingDept = item.department && item.department !== '1' ? item.department.trim() : '';
    const prodDept = (restaurantId && prod?.departmentsByRestaurant?.[restaurantId]) ||
                     prod?.defaultDepartment ||
                     prod?.category ||
                     '';
    const candidateDept = existingDept || prodDept;

    const rank = getDepartmentRank(candidateDept, item.name || prod?.name);
    const resolvedDeptName = getDepartmentDisplayName(rank);

    return {
      item: {
        ...item,
        department: resolvedDeptName,
      },
      rank,
      catalogIndex,
      originalIndex,
    };
  });

  decorated.sort((a, b) => {
    // 1. Department order (1. Овощи, 2. Мясо, 3. Бакалея, 4. Бар, 5. Хоз-ка, 6. Прочее)
    if (a.rank !== b.rank) {
      return a.rank - b.rank;
    }
    // 2. Catalog order inside each department
    if (a.catalogIndex !== b.catalogIndex) {
      return a.catalogIndex - b.catalogIndex;
    }
    // 3. Original order fallback
    return a.originalIndex - b.originalIndex;
  });

  return decorated.map(d => d.item);
}
