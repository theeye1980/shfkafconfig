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

  bottomOpenHeight: 30, // ← новое
  bodyType: 'ldsp',
  bodyColorId: 'white',
  doorColorId: 'white',

  sideShelf: true,
  sideShelfSide: 'left',
  sideShelfWidth: 17,
  sideShelves: 2,
};

function getDoorHeightCm() {
  const innerH = state.height - 2 * CONFIG.frameThickness;
  return innerH - state.bottomOpenHeight;
}

function getDoorWidthCm() {
  const ft = CONFIG.frameThickness;
  const sideSectionCm = state.sideShelf ? (state.sideShelfWidth + CONFIG.dividerThickness) : 0;
  const mainWidthCm = state.width - sideSectionCm;
  const innerWidth = mainWidthCm - 2 * ft;
  return innerWidth / state.doors;
}

function getBottomOpenCm() {
  return state.bottomOpenHeight;
}

function initDoorDefaults() {
  state.bottomOpenHeight = CONFIG.defaultBottomOpenHeight;
}

function getSideShelfSectionHeightCm() {
  if (!state.sideShelf) return 0;

  const ft = CONFIG.frameThickness;
  const st = CONFIG.shelfThickness;
  const innerH = state.height - 2 * ft;

  const bottomOpenCm = getBottomOpenCm();
  const sideInnerH = (bottomOpenCm > 1)
    ? (innerH - bottomOpenCm - st / 2)
    : innerH;

  const segments = state.sideShelves + 1;
  return Math.max(0, sideInnerH / segments);
}

function getFrameHex() {
  return CONFIG.colors.find(c => c.id === state.bodyColorId)?.hex || '#F5F5F0';
}

function getShelfHex() {
  return getFrameHex();
}

function getDoorHex() {
  if (state.doorType === 'jaluzi') return CONFIG.jaluziColor.hex;
  return CONFIG.colors.find(c => c.id === state.doorColorId)?.hex || '#F5F5F0';
}

function getMainColorName() {
  return CONFIG.colors.find(c => c.id === state.bodyColorId)?.name || '';
}

function getDoorColorName() {
  if (state.doorType === 'jaluzi') return CONFIG.jaluziColor.name;
  return CONFIG.colors.find(c => c.id === state.doorColorId)?.name || '';
}