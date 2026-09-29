const DAY = 86400000;
const SOURCE = /^[a-z0-9][a-z0-9_-]{0,59}$/i;
const PRICE_KEYS = [
  ['tooCheap', 'priceTooCheap', 'price_too_cheap'],
  ['bargain', 'priceBargain', 'price_bargain'],
  ['expensive', 'priceExpensive', 'price_expensive'],
  ['tooExpensive', 'priceTooExpensive', 'price_too_expensive'],
];

function nullableNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function nullableText(value) {
  return typeof value === 'string' && value ? value : null;
}

// Normalizes the optional design and pricing answers for either storage driver.
export function feedbackExtras(input) {
  const designRating = nullableNumber(input.designRating);
  return {
    designRating: designRating === null ? null : Math.max(1, Math.min(5, Math.round(designRating))),
    designNote: nullableText(input.designNote),
    payer: nullableText(input.payer),
    priceModel: nullableText(input.priceModel),
    priceTooCheap: nullableNumber(input.priceTooCheap),
    priceBargain: nullableNumber(input.priceBargain),
    priceExpensive: nullableNumber(input.priceExpensive),
    priceTooExpensive: nullableNumber(input.priceTooExpensive),
  };
}

function field(row, camel, snake) {
  return row?.[camel] ?? row?.[snake] ?? null;
}

function tally(counts, key) {
  if (key) counts[key] = (counts[key] || 0) + 1;
}

function average(values) {
  if (!values.length) return null;
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 100) / 100;
}

function median(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  const value = sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
  return Math.round(value * 100) / 100;
}

// The first answered price at which a falling curve meets a rising one.
function crossing(prices, falling, rising) {
  for (const price of prices) {
    if (falling(price) <= rising(price)) return price;
  }
  return null;
}

// Van Westendorp price-sensitivity summary. Only complete answer sets whose
// four prices do not decrease are used; others are counted as inconsistent.
export function priceSensitivity(sets) {
  const valid = sets.filter((set) => PRICE_KEYS.every(([key]) => set[key] !== null)
    && set.tooCheap <= set.bargain && set.bargain <= set.expensive && set.expensive <= set.tooExpensive);
  const share = (predicate) => valid.filter(predicate).length / valid.length;
  const prices = [...new Set(valid.flatMap((set) => PRICE_KEYS.map(([key]) => set[key])))].sort((a, b) => a - b);
  const tooCheap = (price) => share((set) => set.tooCheap >= price);
  const cheap = (price) => share((set) => set.bargain >= price);
  const expensive = (price) => share((set) => set.expensive <= price);
  const tooExpensive = (price) => share((set) => set.tooExpensive <= price);
  return {
    responses: valid.length,
    inconsistent: sets.filter((set) => PRICE_KEYS.every(([key]) => set[key] !== null)).length - valid.length,
    medians: Object.fromEntries(PRICE_KEYS.map(([key]) => [key, median(valid.map((set) => set[key]))])),
    // Acceptable range: marginal cheapness to marginal expensiveness.
    pointOfMarginalCheapness: valid.length ? crossing(prices, tooCheap, (price) => 1 - cheap(price)) : null,
    optimalPricePoint: valid.length ? crossing(prices, tooCheap, tooExpensive) : null,
    indifferencePricePoint: valid.length ? crossing(prices, cheap, expensive) : null,
    pointOfMarginalExpensiveness: valid.length ? crossing(prices, (price) => 1 - expensive(price), tooExpensive) : null,
  };
}

// Aggregate beta feedback for private operator review. Returns counts and
// price statistics only: never messages, design notes, emails or identifiers.
export function feedbackReport(rows, { sinceDays = 90, now = Date.now() } = {}) {
  const since = now - Math.max(1, Number(sinceDays) || 90) * DAY;
  const inWindow = rows.filter((row) => {
    const time = Date.parse(field(row, 'createdAt', 'created_at') ?? '');
    return Number.isFinite(time) && time >= since && time <= now;
  });
  const byRole = {};
  const bySource = {};
  const payer = {};
  const priceModel = {};
  const keepUsing = [];
  const design = [];
  const priceSets = { all: [] };
  for (const row of inWindow) {
    const role = typeof row.role === 'string' ? row.role : 'other';
    tally(byRole, role);
    const source = field(row, 'source', 'source');
    tally(bySource, typeof source === 'string' && SOURCE.test(source) ? source.toLowerCase() : 'direct');
    tally(payer, field(row, 'payer', 'payer'));
    tally(priceModel, field(row, 'priceModel', 'price_model'));
    const rating = nullableNumber(row.rating);
    if (rating !== null) keepUsing.push(rating);
    const designRating = nullableNumber(field(row, 'designRating', 'design_rating'));
    if (designRating !== null) design.push(designRating);
    const set = Object.fromEntries(PRICE_KEYS.map(([key, camel, snake]) => [key, nullableNumber(field(row, camel, snake))]));
    if (PRICE_KEYS.some(([key]) => set[key] !== null)) {
      priceSets.all.push(set);
      (priceSets[role] ||= []).push(set);
    }
  }
  return {
    since: new Date(since).toISOString(),
    asOf: new Date(now).toISOString(),
    responses: inWindow.length,
    byRole,
    bySource,
    keepUsingRating: { responses: keepUsing.length, average: average(keepUsing) },
    designRating: { responses: design.length, average: average(design) },
    payer,
    priceModel,
    monthlyPrice: Object.fromEntries(Object.entries(priceSets).map(([group, sets]) => [group, priceSensitivity(sets)])),
  };
}
