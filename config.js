/**
 * config.js — КОНФИГУРАЦИЯ КОНФИГУРАТОРА
 */

const CONFIG = {
  // Палитра цветов ЛДСП
  colors: [
    { id: 'white',    name: 'Белый',      hex: '#F5F5F0' },
    { id: 'sonoma',   name: 'Дуб сонома', hex: '#C4A882' },
    { id: 'grey',     name: 'Серый',      hex: '#9E9E9E' },
    { id: 'antracit', name: 'Антрацит',   hex: '#424242' },
  ],

  // Цвет жалюзийных створок (фиксированный — сосна)
  jaluziColor: { name: 'Сосна натуральная', hex: '#D4B896' },

  // Конструктивные параметры (см)
  frameThickness: 1.8,
  shelfThickness: 1.6,
  dividerThickness: 1.8,
  defaultBottomOpenHeight: 30,

  // Ограничения высоты ЛДСП-створок (см)
  ldspDoorHeight: { min: 40, max: 130 },

  // Доступные высоты жалюзи (мм)
  jaluziHeights: [395, 467, 494, 590, 616, 695, 720, 845, 870, 993, 1020, 1094, 1120, 1197, 1245],

  // SVG-канвас
  svg: {
    width: 500,
    height: 500,
    padding: 50,
    dimLineOffset: 15,
    dimColor: '#555',
    dimFontSize: 12,
    nicheExtraGap: 4,
  },

  // Цвет ниши (фон стены)
  nicheColor: '#E8E0D0',
  nicheStroke: '#BFAE98',

  // Цены (объединённый блок)
  prices: {
    // если где-то используется CONFIG.prices.baseBody
    baseBody: 0,

    assemblyBase: 8600,
    assemblyLimit: { w: 105, h: 116, d: 30 },
    assemblyOverFee: 700,
    visit: 1500,

    materials: {
      baseBody: { ldsp: 3100, shield: 7900 },
      baseDoors: { ldsp: 3100, jaluzi: 4000 },
      sizeBase: { w: 105, h: 116, d: 30 },
      sizeOverPerCm: 60,
      hardwareFixed: 1200, // ← фурнитура и соединения
    },

    framePerM2: 800,
    ldspPerM2: 400,
    dvpPerM2: 400,
    jaluziPerDoor: 1200,
    jaluziPerM2: 2000,
    assembly: 3000,
  },

  // Endpoint для отправки заявки
  orderEndpoint: '/api/order',
};