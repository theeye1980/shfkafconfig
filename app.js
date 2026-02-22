/**
 * app.js — ТОЧКА ВХОДА (инициализация приложения)
 * ==================================================
 * Содержит:
 *
 * 1. DOMContentLoaded-обработчик — запускается при загрузке страницы:
 *    - initDoorDefaults() — вычисляет начальные размеры створок
 *    - buildPalettes() — создаёт цветовые палитры в DOM
 *    - buildDoorSizeControls() — инициализирует контролы размеров створок
 *    - bindControls() — вешает все обработчики событий
 *    - updateColorVisibility() — настраивает видимость секций цвета
 *    - render() — первая отрисовка SVG + расчёт цены
 *
 * 2. render() — центральная функция перерисовки. Вызывается при любом
 *    изменении параметров. Делает две вещи:
 *    - renderSVG() — перерисовывает SVG-визуализацию
 *    - renderPrice() — пересчитывает и отображает цену
 *
 * Зависимости: все остальные модули (config, state, render-svg, price, modal, ui)
 *
 * Порядок подключения в HTML:
 *   config.js → state.js → render-svg.js → price.js → modal.js → ui.js → app.js
 */

function render() {
  renderSVG();
  renderPrice();
  updateColorVisibility();
  renderInfoPanel();
}

window.addEventListener('DOMContentLoaded', () => {
  initDoorDefaults();
  buildPalettes();
  bindControls();
  updateColorVisibility();
  syncDoorHeightLimits();
  updateBottomOpenInfo();
  render();
});