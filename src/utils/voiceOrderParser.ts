import type { Product, ProductCategory } from '../types.ts';

export interface VoiceParseResult {
  type: 'add_item' | 'navigation' | 'unknown_product' | 'clarification' | 'unknown_command';
  productId?: string | null;
  productName?: string | null;
  quantity?: number | null;
  unit?: string | null;
  department?: ProductCategory | 'all' | null;
  suggestedNewProductName?: string | null;
  clarificationQuestion?: string | null;
  spokenResponse: string;
}

export interface PendingClarification {
  productId?: string;
  productName: string;
  unit?: string;
  timestamp: number;
}

// Word-to-number mapping for Russian speech
const RUSSIAN_NUMBER_WORDS: Record<string, number> = {
  'ноль': 0,
  'нуль': 0,
  'один': 1,
  'одна': 1,
  'одно': 1,
  'одну': 1,
  'два': 2,
  'две': 2,
  'три': 3,
  'четыре': 4,
  'пять': 5,
  'шесть': 6,
  'семь': 7,
  'восемь': 8,
  'девять': 9,
  'десять': 10,
  'одиннадцать': 11,
  'двенадцать': 12,
  'тринадцать': 13,
  'четырнадцать': 14,
  'пятнадцать': 15,
  'шестнадцать': 16,
  'семнадцать': 17,
  'восемнадцать': 18,
  'девятнадцать': 19,
  'двадцать': 20,
  'тридцать': 30,
  'сорок': 40,
  'пятьдесят': 50,
  'шестьдесят': 60,
  'семьдесят': 70,
  'восемьдесят': 80,
  'девяносто': 90,
  'сто': 100,
  'двести': 200,
  'триста': 300,
  'четыреста': 400,
  'пятьсот': 500,
};

function normalizeRu(str: string): string {
  return str.toLowerCase().replace(/ё/g, 'е').trim();
}

/**
 * Extracts a numeric quantity from Russian natural language text.
 */
export function extractRussianQuantity(text: string, defaultUnit?: string): { quantity: number; unit?: string; cleanText: string } | null {
  const lower = text.toLowerCase().trim();

  // 1. "полкило", "пол кило", "полкилограмма"
  if (/пол[\s-]?кило(?:грамм[а-я]*)?/i.test(lower)) {
    const clean = lower.replace(/пол[\s-]?кило(?:грамм[а-я]*)?/gi, '').trim();
    return { quantity: 0.5, unit: 'кг', cleanText: clean };
  }

  // 2. "ноль пять", "ноль целых пять десятых", "ноль точка пять"
  if (/ноль[\s,.]+(?:пять|целых\s+пять\s+десятых|точка\s+пять)/i.test(lower)) {
    const clean = lower.replace(/ноль[\s,.]+(?:пять|целых\s+пять\s+десятых|точка\s+пять)/gi, '').trim();
    return { quantity: 0.5, unit: 'кг', cleanText: clean };
  }

  // 3. "полтора", "полторы", "полтора кило"
  if (/полтор[аы](?:[\s-]*(?:кило(?:грамм[а-я]*)?|штуки?|пачки?|упаковки?))?/i.test(lower)) {
    const clean = lower.replace(/полтор[аы]/gi, '').trim();
    return { quantity: 1.5, unit: defaultUnit || 'кг', cleanText: clean };
  }

  // 4. "N с половиной" (e.g. "два с половиной", "три с половиной", "2 с половиной килограмма")
  const withHalfMatch = lower.match(/(?:(\d+)|(один|два|две|три|четыре|пять|шесть|семь|восемь|девять|десять))\s+с\s+половиной(?:\s*(?:кило(?:грамм[а-я]*)?|кг|пач[а-я]*|упаков[а-я]*|штук[а-я]*|шт|литр[а-я]*|л))?/i);
  if (withHalfMatch) {
    const whole = withHalfMatch[1] ? parseFloat(withHalfMatch[1]) : (RUSSIAN_NUMBER_WORDS[withHalfMatch[2]?.toLowerCase()] || 0);
    const clean = lower.replace(withHalfMatch[0], '').trim();
    return { quantity: whole + 0.5, unit: defaultUnit || 'кг', cleanText: clean };
  }

  // 5. "500 грамм", "пятьсот грамм" -> 0.5 кг if unit is кг
  if (/(?:500|пятьсот)\s*(?:грамм[а-я]*|г\b)/i.test(lower)) {
    const clean = lower.replace(/(?:500|пятьсот)\s*(?:грамм[а-я]*|г\b)/gi, '').trim();
    return { quantity: 0.5, unit: 'кг', cleanText: clean };
  }

  // 6. "250 грамм", "двести пятьдесят грамм", "четверть кило"
  if (/(?:250|двести\s+пятьдесят)\s*(?:грамм[а-я]*|г\b)|четверть\s+кило(?:грамм[а-я]*)?/i.test(lower)) {
    const clean = lower.replace(/(?:250|двести\s+пятьдесят)\s*(?:грамм[а-я]*|г\b)|четверть\s+кило(?:грамм[а-я]*)?/gi, '').trim();
    return { quantity: 0.25, unit: 'кг', cleanText: clean };
  }

  // 7. Explicit digits like "0.5", "0,5", "5", "10", "1.5"
  const digitRegex = /(?:^|\s)(\d+(?:[.,]\d+)?)\s*(кг|килограмм[а-я]*|кило|пач[а-я]*|упаков[а-я]*|шт[а-я]*|штук[а-я]*|бутыл[а-я]*|бут|банок|банк[а-я]*|литр[а-я]*|л\b)?/i;
  const digitMatch = lower.match(digitRegex);
  if (digitMatch) {
    const num = parseFloat(digitMatch[1].replace(',', '.'));
    if (!isNaN(num) && num > 0) {
      const rawUnit = digitMatch[2]?.toLowerCase();
      let matchedUnit = defaultUnit;
      if (rawUnit) {
        if (rawUnit.startsWith('кг') || rawUnit.startsWith('кило')) matchedUnit = 'кг';
        else if (rawUnit.startsWith('пач') || rawUnit.startsWith('упаков')) matchedUnit = 'упаковка';
        else if (rawUnit.startsWith('шт')) matchedUnit = 'шт';
        else if (rawUnit.startsWith('бутыл') || rawUnit === 'бут') matchedUnit = 'бутылка';
        else if (rawUnit.startsWith('банк')) matchedUnit = 'банка';
        else if (rawUnit.startsWith('литр') || rawUnit === 'л') matchedUnit = 'л';
      }
      const clean = lower.replace(digitMatch[0], '').trim();
      return { quantity: num, unit: matchedUnit, cleanText: clean };
    }
  }

  // 8. Word-based numbers: "две пачки", "пять кило", "три штуки", "один килограмм"
  const wordTokens = lower.split(/\s+/);
  for (let i = 0; i < wordTokens.length; i++) {
    const token = wordTokens[i];
    if (RUSSIAN_NUMBER_WORDS[token] !== undefined) {
      let num = RUSSIAN_NUMBER_WORDS[token];
      if (i + 1 < wordTokens.length && RUSSIAN_NUMBER_WORDS[wordTokens[i + 1]] !== undefined && num >= 20 && RUSSIAN_NUMBER_WORDS[wordTokens[i + 1]] < 10) {
        num += RUSSIAN_NUMBER_WORDS[wordTokens[i + 1]];
        i++;
      }

      let matchedUnit = defaultUnit;
      if (i + 1 < wordTokens.length) {
        const nextWord = wordTokens[i + 1];
        if (nextWord.startsWith('кило') || nextWord === 'кг') {
          matchedUnit = 'кг';
        } else if (nextWord.startsWith('пач') || nextWord.startsWith('упаков')) {
          matchedUnit = 'упаковка';
        } else if (nextWord.startsWith('штук') || nextWord === 'шт') {
          matchedUnit = 'шт';
        } else if (nextWord.startsWith('литр') || nextWord === 'л') {
          matchedUnit = 'л';
        } else if (nextWord.startsWith('бутыл')) {
          matchedUnit = 'бутылка';
        } else if (nextWord.startsWith('банк')) {
          matchedUnit = 'банка';
        }
      }

      const clean = lower
        .replace(new RegExp(`(?:^|\\s)${token}(?:\\s|$)`, 'gi'), ' ')
        .replace(/(?:^|\s)(?:кило(?:грамм[а-я]*)?|кг|пач[а-я]*|упаков[а-я]*|штук[а-я]*|шт|литр[а-я]*|л|бутыл[а-я]*|банк[а-я]*)(?:\s|$)/gi, ' ')
        .trim();

      return { quantity: num, unit: matchedUnit, cleanText: clean };
    }
  }

  return null;
}

/**
 * Normalizes text for catalog search (lowercasing, removing filler words and unit words)
 */
function cleanSearchText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '')
    .replace(/(?:^|\s)(?:давай|пожалуйста|возьми|добавь|плюс|запиши|надо|нужно|еще|ещё|мне|нам|сделай|поставь|открой|перейдем|перейдём|в|на)(?:\s|$)/gi, ' ')
    .replace(/(?:^|\s)(?:кило(?:грамм[а-я]*)?|кг|пач[а-я]*|упаков[а-я]*|штук[а-я]*|шт|литр[а-я]*|л|бутыл[а-я]*|банк[а-я]*|грамм[а-я]*|г)(?:\s|$)/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Checks if the spoken text is a department navigation command.
 */
export function checkNavigationCommand(text: string): VoiceParseResult | null {
  const lower = text.toLowerCase().trim();

  // Navigation keywords check
  const isNav = /отдел|перейд|откро|покажи|давай|переключ/i.test(lower) || 
    /^(?:овощи|мясо|бакалея|бар|хозка|хоз-ка|хозтовары|молочка|молочные|хлеб|прочее|все|всё)$/i.test(lower);

  if (!isNav && !/овощной|мясной|бакалейный|барный|молочный|хлебный/i.test(lower)) {
    return null;
  }

  if (/овощ|зелен|фрукт/i.test(lower)) {
    return {
      type: 'navigation',
      department: 'vegetables',
      spokenResponse: 'Открыл отдел Овощи.',
    };
  }

  if (/мяс|рыб|птиц|колбас/i.test(lower)) {
    return {
      type: 'navigation',
      department: 'meat',
      spokenResponse: 'Открыл отдел Мясо.',
    };
  }

  if (/бакале/i.test(lower)) {
    return {
      type: 'navigation',
      department: 'grocery',
      spokenResponse: 'Открыл отдел Бакалея.',
    };
  }

  if (/(?:^|\s)бар(?:\s|$)|напит/i.test(lower)) {
    return {
      type: 'navigation',
      department: 'bar',
      spokenResponse: 'Открыл отдел Бар.',
    };
  }

  if (/хоз|расходник|хим|салфет|пакет|мыло/i.test(lower)) {
    return {
      type: 'navigation',
      department: 'consumables',
      spokenResponse: 'Открыл отдел Хоз-ка.',
    };
  }

  if (/молоч/i.test(lower)) {
    return {
      type: 'navigation',
      department: 'dairy',
      spokenResponse: 'Открыл отдел Молочные.',
    };
  }

  if (/хлеб/i.test(lower)) {
    return {
      type: 'navigation',
      department: 'bread',
      spokenResponse: 'Открыл отдел Хлеб.',
    };
  }

  if (/проч/i.test(lower)) {
    return {
      type: 'navigation',
      department: 'other',
      spokenResponse: 'Открыл отдел Прочее.',
    };
  }

  if (/(?:^|\s)вс[её](?:\s|$)|все товары/i.test(lower)) {
    return {
      type: 'navigation',
      department: 'all',
      spokenResponse: 'Открыл все товары.',
    };
  }

  return null;
}

function getRussianStem(word: string): string {
  let w = normalizeRu(word);
  w = w.replace(/(?:ок|ек|ов|ев|ей|ам|ами|ах|ом|ем|ой|ею|ую|юю|ыми|ими|ых|их|ого|его|ому|ему)$/, '');
  w = w.replace(/[аяоеуюыиэьъ]$/, '');
  return w.length >= 3 ? w : normalizeRu(word);
}

/**
 * Searches the catalog for the best matching product.
 * Returns product and score.
 */
function findMatchingProduct(productQuery: string, catalog: Product[]): { product: Product; score: number } | null {
  const query = normalizeRu(productQuery);
  if (!query) return null;

  let bestProduct: Product | null = null;
  let highestScore = 0;

  for (const p of catalog) {
    const name = normalizeRu(p.name);
    const aliases = (p.aliases || []).map(a => normalizeRu(a));

    // 1. Exact match on name or alias
    if (name === query || aliases.includes(query)) {
      return { product: p, score: 100 };
    }

    // 2. Query contains exact name or name contains query
    if (name.includes(query) || query.includes(name)) {
      const score = 85 + (Math.min(name.length, query.length) / Math.max(name.length, query.length)) * 10;
      if (score > highestScore) {
        highestScore = score;
        bestProduct = p;
      }
    }

    // 3. Check aliases
    for (const alias of aliases) {
      if (alias.includes(query) || query.includes(alias)) {
        const score = 80;
        if (score > highestScore) {
          highestScore = score;
          bestProduct = p;
        }
      }
    }

    // 4. Common root/stem checks in Russian
    const words = query.split(/\s+/).filter(w => w.length >= 3);
    for (const w of words) {
      const stem = getRussianStem(w);
      if (name.includes(stem) || getRussianStem(name).includes(stem)) {
        const score = 75;
        if (score > highestScore) {
          highestScore = score;
          bestProduct = p;
        }
      }
      for (const a of aliases) {
        if (a.includes(stem) || getRussianStem(a).includes(stem)) {
          const score = 70;
          if (score > highestScore) {
            highestScore = score;
            bestProduct = p;
          }
        }
      }
    }
  }

  return bestProduct && highestScore >= 60 ? { product: bestProduct, score: highestScore } : null;
}

/**
 * Intelligent local voice transcript parser with full Russian colloquial support.
 */
export function parseVoiceTranscriptLocally(
  transcript: string,
  catalog: Product[],
  activeCategory?: string,
  pendingClarification?: PendingClarification | null
): VoiceParseResult {
  const trimmed = transcript.trim();
  if (!trimmed) {
    return {
      type: 'unknown_command',
      spokenResponse: 'Я вас не услышал. Пожалуйста, повторите.',
    };
  }

  // 1. Check navigation commands
  const navResult = checkNavigationCommand(trimmed);
  if (navResult) {
    return navResult;
  }

  // 2. Check if answering a previous clarifying question
  if (pendingClarification && pendingClarification.productId) {
    const targetProduct = catalog.find(p => p.id === pendingClarification.productId);
    if (targetProduct) {
      const qtyRes = extractRussianQuantity(trimmed, targetProduct.defaultUnit);
      if (qtyRes && qtyRes.quantity > 0) {
        const unit = qtyRes.unit || targetProduct.defaultUnit || 'кг';
        const formattedQty = String(qtyRes.quantity).replace('.', ',');
        return {
          type: 'add_item',
          productId: targetProduct.id,
          productName: targetProduct.name,
          quantity: qtyRes.quantity,
          unit,
          spokenResponse: `Принято. ${targetProduct.name} — ${formattedQty} ${unit}.`,
        };
      }
    }
  }

  // 3. Extract quantity from the utterance
  const qtyResult = extractRussianQuantity(trimmed);
  const remainingText = qtyResult ? qtyResult.cleanText : trimmed;
  const cleanedSearch = cleanSearchText(remainingText);

  // If no product text remained
  if (!cleanedSearch && qtyResult) {
    return {
      type: 'clarification',
      spokenResponse: 'Какой товар добавить в количестве ' + qtyResult.quantity + '?',
      clarificationQuestion: 'Укажите, какой товар добавить',
    };
  }

  // 4. Search in catalog
  const match = findMatchingProduct(cleanedSearch, catalog);

  if (match) {
    const product = match.product;
    const unit = (qtyResult && qtyResult.unit) || product.defaultUnit || 'кг';

    // If quantity was specified: Success!
    if (qtyResult && qtyResult.quantity > 0) {
      const formattedQty = String(qtyResult.quantity).replace('.', ',');
      return {
        type: 'add_item',
        productId: product.id,
        productName: product.name,
        quantity: qtyResult.quantity,
        unit,
        spokenResponse: `Принято. ${product.name} — ${formattedQty} ${unit}.`,
      };
    }

    // Product found, but quantity is missing or unclear -> Ask clarifying question!
    let question = `Сколько ${product.defaultUnit === 'кг' ? 'килограммов' : product.defaultUnit === 'упаковка' ? 'упаковок' : 'штук'} добавить?`;
    if (product.name.toLowerCase().endsWith('ы') || product.name.toLowerCase().endsWith('и')) {
      question = `Сколько ${product.name.toLowerCase()} добавить?`;
    } else {
      question = `Сколько добавить «${product.name}»?`;
    }

    return {
      type: 'clarification',
      productId: product.id,
      productName: product.name,
      unit: product.defaultUnit,
      clarificationQuestion: question,
      spokenResponse: question,
    };
  }

  // 5. Product was NOT found in catalog!
  // Clean suggested name from any numbers or filler words
  const cleanCandidate = cleanSearchText(remainingText);
  const suggestedName = cleanCandidate
    ? cleanCandidate.charAt(0).toUpperCase() + cleanCandidate.slice(1)
    : 'Новый товар';

  return {
    type: 'unknown_product',
    suggestedNewProductName: suggestedName,
    spokenResponse: 'Такого товара нет в списке. Добавить товар?',
  };
}

/**
 * Universal voice speech synthesis (TTS) helper with completion callback.
 */
export function speakResponse(text: string, onEnd?: () => void): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    if (onEnd) onEnd();
    return;
  }

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ru-RU';
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const ruVoice = voices.find(v => v.lang.startsWith('ru') && !v.name.includes('Compact')) ||
      voices.find(v => v.lang.startsWith('ru'));
    if (ruVoice) {
      utterance.voice = ruVoice;
    }

    let hasEnded = false;
    const finish = () => {
      if (!hasEnded) {
        hasEnded = true;
        if (onEnd) onEnd();
      }
    };

    utterance.onend = finish;
    utterance.onerror = finish;

    // Safety timeout in case TTS onend event fails or is suppressed in browser
    const estDurationMs = Math.max(1200, Math.min(text.length * 85 + 700, 4500));
    setTimeout(finish, estDurationMs);

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('Speech synthesis error:', err);
    if (onEnd) onEnd();
  }
}
