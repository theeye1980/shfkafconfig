/**
 * price.js — РАСЧЁТ И ОТОБРАЖЕНИЕ СТОИМОСТИ
 * =============================================
 * Содержит:
 *
 * 1. calculatePrice() — вычисляет стоимость всех компонентов шкафчика.
 *    Возвращает объект с полями:
 *    - frame    — стоимость каркаса (мебельный щит): боковины + верх/низ + доп. для боковой секции
 *    - shelves  — стоимость полок основной секции (ЛДСП)
 *    - sideShelves — стоимость полок боковой секции (ЛДСП)
 *    - back     — стоимость задней стенки (ДВП)
 *    - doors    — стоимость створок (ЛДСП по площади или жалюзи по фиксу + площадь)
 *    - assembly — стоимость сборки и установки (фиксированная)
 *    - total    — итого
 *
 *    Формулы — ЗАГЛУШКИ. Коэффициенты берутся из CONFIG.prices.
 *    Логика: площадь каждого элемента в м² × цена за м².
 *
 * 2. renderPrice() — генерирует HTML с построчной разбивкой цены
 *    и вставляет в элемент с id="priceBlock".
 *    Показывает: каркас, полки, боковые полки (если есть), заднюю стенку,
 *    створки (с указанием типа и размера), сборку, итого.
 *
 * 3. fmt(n) — форматирование числа с пробелами-разделителями тысяч (1234 → "1 234")
 *
 * Зависимости: config.js, state.js (getDoorWidthCm, getDoorHeightCm,
 *              getMainColorName, getDoorColorName, state)
 */


/** Расчёт стоимости всех компонентов */
function calculatePrice() {
  const P = CONFIG.prices;
  const h = state.height / 100;   // высота в метрах
  const d = state.depth / 100;    // глубина в метрах
  const ft = CONFIG.frameThickness / 100; // толщина каркаса в метрах

  // Ширина боковой секции и основной секции в метрах
  const sideSectionM = state.sideShelf ? (state.sideShelfWidth + CONFIG.dividerThickness) / 100 : 0;
  const mainW = state.width / 100 - sideSectionM;

  // Площадь каркаса: 2 боковины + верх + низ
  const frameSides = 2 * h * d;
  const frameTopBot = 2 * (mainW - 2 * ft) * d;
  let frameArea = frameSides + frameTopBot;

  // Боковая секция добавляет: внешнюю боковину + верх/низ боковой секции
  let sideShelvesPrice = 0;
  if (state.sideShelf) {
    const sw = state.sideShelfWidth / 100;
    frameArea += h * d;           // дополнительная внешняя боковина
    frameArea += 2 * sw * d;      // верх + низ боковой секции
    const sideShelfArea = sw * d;
    sideShelvesPrice = state.sideShelves * sideShelfArea * P.ldspPerM2;
  }
  const framePrice = frameArea * P.framePerM2;

  // Полки основной секции
  const shelfW = mainW - 2 * ft;
  const shelfArea = shelfW * d;
  const shelvesPrice = state.shelves * shelfArea * P.ldspPerM2;

  // Задняя стенка (ДВП)
  const backH = h - 2 * ft;
  let backArea = (mainW - 2 * ft) * backH;
  if (state.sideShelf) {
    const sw = state.sideShelfWidth / 100;
    backArea += sw * backH;
  }
  const backPrice = backArea * P.dvpPerM2;

  // Створки
  let doorsPrice = 0;
  const doorWcm = getDoorWidthCm();
  const doorHcm = getDoorHeightCm();
  const doorWm = doorWcm / 100;
  const doorHm = doorHcm / 100;

  if (state.doorType === 'ldsp') {
    doorsPrice = state.doors * doorWm * doorHm * P.ldspPerM2;
  } else {
    // Жалюзи: фиксированная цена за створку + небольшая добавка за площадь
    doorsPrice = state.doors * (P.jaluziPerDoor + doorWm * doorHm * P.jaluziPerM2 * 0.3);
  }

  // Сборка
  const assemblyPrice = P.assembly;

  // Итого
  const total = framePrice + shelvesPrice + sideShelvesPrice + backPrice + doorsPrice + assemblyPrice;

  return {
    frame: Math.round(framePrice),
    shelves: Math.round(shelvesPrice),
    sideShelves: Math.round(sideShelvesPrice),
    back: Math.round(backPrice),
    doors: Math.round(doorsPrice),
    assembly: Math.round(assemblyPrice),
    total: Math.round(total),
  };
}


/** Генерация HTML с разбивкой цены */
function renderPrice() {
  const p = calculatePrice();
  const doorTypeLabel = state.doorType === 'ldsp' ? 'ЛДСП' : 'Жалюзи';
  const doorSize = `${getDoorWidthCm().toFixed(1)}×${getDoorHeightCm().toFixed(1)} см`;

  let lines = `
    <h3>Расчёт стоимости</h3>
    <div class="price-line"><span>Каркас (${getMainColorName()})</span><span>${fmt(p.frame)} ₽</span></div>
    <div class="price-line"><span>Полки × ${state.shelves}</span><span>${fmt(p.shelves)} ₽</span></div>`;

  if (state.sideShelf && p.sideShelves > 0) {
    lines += `<div class="price-line"><span>Полки боковые × ${state.sideShelves}</span><span>${fmt(p.sideShelves)} ₽</span></div>`;
  }

  lines += `
    <div class="price-line"><span>Задняя стенка</span><span>${fmt(p.back)} ₽</span></div>
    <div class="price-line"><span>Створки × ${state.doors} (${doorTypeLabel}, ${doorSize})</span><span>${fmt(p.doors)} ₽</span></div>
    <div class="price-line"><span>Сборка и установка</span><span>${fmt(p.assembly)} ₽</span></div>
    <div class="price-total"><span>Итого</span><span>${fmt(p.total)} ₽</span></div>`;

  document.getElementById('priceBlock').innerHTML = lines;
}


/** Форматирование числа с пробелами-разделителями тысяч: 12345 → "12 345" */
function fmt(n) {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}