/**
 * state.js — СОСТОЯНИЕ КОНФИГУРАТОРА И ВЫЧИСЛЯЕМЫЕ СВОЙСТВА
 * ===========================================================
 * Содержит:
 *
 * 1. Объект `state` — текущие значения всех параметров шкафчика:
 *    - height, width, depth — габариты ниши (см)
 *    - shelves — количество полок в основной секции
 *    - doors — количество створок
 *    - doorType — тип створок ('ldsp' | 'jaluzi')
 *    - ldspDoorHeight — высота ЛДСП-створки (см, произвольная)
 *    - jaluziHeightIdx — индекс выбранного размера жалюзи из CONFIG.jaluziHeights
 *    - mainColorId — id цвета корпуса/полок (из CONFIG.colors)
 *    - doorColorId — id цвета створок (если separateDoorColor = true)
 *    - separateDoorColor — флаг: отдельный цвет для створок
 *    - sideShelf — флаг: есть ли боковая открытая секция
 *    - sideShelfSide — с какой стороны ('left' | 'right')
 *    - sideShelfWidth — ширина боковой секции (см)
 *    - sideShelves — количество полок в боковой секции
 *
 * 2. Вычисляемые функции (чистые, без побочных эффектов):
 *    - getDoorHeightCm() — текущая высота створки в см (с учётом типа)
 *    - getDoorWidthCm() — ширина одной створки (внутренняя ширина / кол-во дверей)
 *    - getBottomOpenCm() — высота открытой полки снизу (под створками)
 *    - getFrameHex() — hex-цвет каркаса
 *    - getShelfHex() — hex-цвет полок
 *    - getDoorHex() — hex-цвет створок
 *    - getMainColorName() — название цвета каркаса
 *    - getDoorColorName() — название цвета створок
 */

const state = {
  height: 110,
  width: 90,
  depth: 30,
  shelves: 2,
  doors: 2,
  doorType: 'ldsp',           // 'ldsp' | 'jaluzi'

  // Для ЛДСП створок — произвольная высота (см)
  ldspDoorHeight: 76,

  // Для жалюзи — индекс выбранного размера из CONFIG.jaluziHeights
  jaluziHeightIdx: 0,

  // Цвета
  mainColorId: 'white',       // корпус + полки
  doorColorId: 'white',       // створки (отдельно, если separateDoorColor = true)
  separateDoorColor: false,   // галочка «отдельный цвет створок»

  // Боковая открытая секция
  sideShelf: true,
  sideShelfSide: 'right',
  sideShelfWidth: 20,
  sideShelves: 2,
};


// --- Вычисляемые свойства ---

/** Текущая высота створки в см */
function getDoorHeightCm() {
  if (state.doorType === 'jaluzi') {
    return CONFIG.jaluziHeights[state.jaluziHeightIdx] / 10;
  }
  return state.ldspDoorHeight;
}

/** Ширина одной створки в см (внутренняя ширина основной секции / кол-во створок) */
function getDoorWidthCm() {
  const ft = CONFIG.frameThickness;
  const sideSectionCm = state.sideShelf ? (state.sideShelfWidth + CONFIG.dividerThickness) : 0;
  const mainWidthCm = state.width - sideSectionCm;
  const innerWidth = mainWidthCm - 2 * ft;
  return innerWidth / state.doors;
}

/** Высота открытой полки снизу (под створками) в см */
function getBottomOpenCm() {
  const innerH = state.height - 2 * CONFIG.frameThickness;
  return innerH - getDoorHeightCm();
}

/** Hex-цвет каркаса (мебельного щита) */
function getFrameHex() {
  if (state.doorType === 'jaluzi') return CONFIG.jaluziColor.hex;
  return CONFIG.colors.find(c => c.id === state.mainColorId)?.hex || '#F5F5F0';
}

/** Hex-цвет полок */
function getShelfHex() {
  if (state.doorType === 'jaluzi') return CONFIG.jaluziColor.hex;
  return CONFIG.colors.find(c => c.id === state.mainColorId)?.hex || '#F5F5F0';
}

/** Hex-цвет створок */
function getDoorHex() {
  if (state.doorType === 'jaluzi') return CONFIG.jaluziColor.hex;
  if (state.separateDoorColor) {
    return CONFIG.colors.find(c => c.id === state.doorColorId)?.hex || '#F5F5F0';
  }
  return CONFIG.colors.find(c => c.id === state.mainColorId)?.hex || '#F5F5F0';
}

/** Название цвета каркаса */
function getMainColorName() {
  if (state.doorType === 'jaluzi') return CONFIG.jaluziColor.name;
  return CONFIG.colors.find(c => c.id === state.mainColorId)?.name || '';
}

/** Название цвета створок */
function getDoorColorName() {
  if (state.doorType === 'jaluzi') return CONFIG.jaluziColor.name;
  if (state.separateDoorColor) {
    return CONFIG.colors.find(c => c.id === state.doorColorId)?.name || '';
  }
  return getMainColorName();
}