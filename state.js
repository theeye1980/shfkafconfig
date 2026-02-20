/**
 * state.js — СОСТОЯНИЕ КОНФИГУРАТОРА И ВЫЧИСЛЯЕМЫЕ СВОЙСТВА
 */
const state = {
  height: 110,
  width: 90,
  depth: 30,
  shelves: 2,
  doors: 2,
  doorType: 'ldsp',

  // Единая высота створок (см) — и для ЛДСП, и для жалюзи
  doorHeight: 76,              // ← было ldspDoorHeight

  // jaluziHeightIdx — УДАЛИТЬ, больше не нужен

  mainColorId: 'white',
  doorColorId: 'white',
  separateDoorColor: false,

  sideShelf: true,
  sideShelfSide: 'right',
  sideShelfWidth: 20,
  sideShelves: 2,
};

/** Текущая высота створки в см */
function getDoorHeightCm() {
  return state.doorHeight;       // ← было state.ldspDoorHeight
}

/** Ширина одной створки в см */
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

/** Hex-цвет каркаса */
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