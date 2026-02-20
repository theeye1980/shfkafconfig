/**
 * config.js — КОНФИГУРАЦИЯ КОНФИГУРАТОРА
 * ========================================
 * Единственный файл, который нужно править для настройки параметров.
 *
 * Содержит:
 * - CONFIG.colors — палитра цветов ЛДСП (id, name, hex) для корпуса, полок, створок
 * - CONFIG.jaluziColor — фиксированный цвет жалюзийных створок (сосна)
 * - CONFIG.frameThickness — толщина боковин/верха/низа каркаса в см
 * - CONFIG.shelfThickness — толщина полки в см
 * - CONFIG.dividerThickness — толщина вертикальной перегородки (разделитель секций) в см
 * - CONFIG.defaultBottomOpenHeight — высота открытой полки снизу по умолчанию (см)
 * - CONFIG.ldspDoorHeight — ограничения высоты ЛДСП-створок (min/max в см)
 * - CONFIG.jaluziHeights — доступные высоты жалюзийных створок (массив в мм)
 * - CONFIG.svg — параметры SVG-канваса (ширина, высота, отступы, цвета размерных линий)
 * - CONFIG.nicheColor / nicheStroke — цвет ниши (фон стены)
 * - CONFIG.prices — ценовые коэффициенты (заглушки, заменить на реальные)
 * - CONFIG.orderEndpoint — URL для отправки заявки (POST JSON)
 */

const CONFIG = {
  // Палитра цветов ЛДСП
  colors: [
    { id: 'white',    name: 'Белый',         hex: '#F5F5F0' },
    { id: 'sonoma',   name: 'Дуб сонома',    hex: '#C4A882' },
    { id: 'grey',     name: 'Серый',         hex: '#9E9E9E' },
    { id: 'antracit', name: 'Антрацит',      hex: '#424242' },
    
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

  // Доступные высоты жалюзи (мм) — стандартные размеры из каталога
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

  // Цены (заглушки — заменить на реальные)
  prices: {
    framePerM2: 3500,     // мебельный щит за м²
    ldspPerM2: 1800,      // ЛДСП за м²
    dvpPerM2: 400,        // ДВП (задняя стенка) за м²
    jaluziPerDoor: 1200,  // базовая цена за одну жалюзийную створку
    jaluziPerM2: 2000,    // доп. коэффициент за площадь жалюзи
    assembly: 3000,       // сборка и установка
  },

  // Endpoint для отправки заявки
  orderEndpoint: '/api/order',
};