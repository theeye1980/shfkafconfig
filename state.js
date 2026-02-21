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
  doorHeight: 76,

  bodyType: 'ldsp',        // ldsp | shield
  bodyColorId: 'white',
  doorColorId: 'white',

  sideShelf: true,
  sideShelfSide: 'right',
  sideShelfWidth: 20,
  sideShelves: 2,
};
function getDoorHeightCm() {
  return state.doorHeight;
}

function getDoorWidthCm() {
  const ft = CONFIG.frameThickness;
  const sideSectionCm = state.sideShelf ? (state.sideShelfWidth + CONFIG.dividerThickness) : 0;
  const mainWidthCm = state.width - sideSectionCm;
  const innerWidth = mainWidthCm - 2 * ft;
  return innerWidth / state.doors;
}

function getBottomOpenCm() {
  const innerH = state.height - 2 * CONFIG.frameThickness;
  return innerH - getDoorHeightCm();
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