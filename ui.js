/**
 * ui.js — УПРАВЛЕНИЕ ИНТЕРФЕЙСОМ (DOM-контролы, палитры, видимость)
 * ====================================================================
 * Жалюзи и ЛДСП используют единый слайдер высоты створки (state.doorHeight).
 * Различие только в цвете: жалюзи — фиксированный CONFIG.jaluziColor.hex.
 *
 * Содержит:
 *
 * 1. ПАЛИТРЫ ЦВЕТОВ:
 *    - buildPalettes() — создаёт палитры основного цвета (#paletteMain)
 *      и цвета створок (#paletteDoor)
 *    - buildColorPalette(containerId, activeId, onClick)
 *    - updatePaletteActive(paletteId, activeId)
 *    - isColorDark(hex)
 *
 * 2. ВИДИМОСТЬ СЕКЦИЙ ЦВЕТА:
 *    - updateColorVisibility()
 *
 * 3. КОНТРОЛЫ РАЗМЕРОВ СТВОРОК:
 *    - syncDoorHeightLimits() — синхронизирует min/max слайдера высоты створок
 *    - updateBottomOpenInfo() — подпись «Открытая полка снизу: X см»
 *
 * 4. ПРИВЯЗКА КОНТРОЛОВ:
 *    - bindControls()
 *    - bindSlider() / bindCounter()
 *
 * 5. ИНИЦИАЛИЗАЦИЯ ДЕФОЛТОВ:
 *    - initDoorDefaults()
 *
 * Зависимости: config.js, state.js, render-svg.js, price.js, modal.js
 */


// ============================================================
// ПАЛИТРЫ ЦВЕТОВ
// ============================================================

/** Создаёт обе палитры (основной цвет и цвет створок) */
function buildPalettes() {
  buildColorPalette('paletteMain', state.mainColorId, (id) => {
    state.mainColorId = id;
    updatePaletteActive('paletteMain', id);
    render();
  });

  buildColorPalette('paletteDoor', state.doorColorId, (id) => {
    state.doorColorId = id;
    updatePaletteActive('paletteDoor', id);
    render();
  });
}

/** Генерирует сетку цветных квадратов в контейнере */
function buildColorPalette(containerId, activeId, onClick) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';

  CONFIG.colors.forEach(c => {
    const div = document.createElement('div');
    div.className = 'color-swatch' + (c.id === activeId ? ' active' : '');
    div.style.background = c.hex;

    if (isColorDark(c.hex)) {
      div.style.border = '3px solid ' + (c.id === activeId ? '#4a7c59' : '#888');
    }

    div.dataset.id = c.id;
    div.innerHTML = `<span class="tooltip">${c.name}</span>`;
    div.addEventListener('click', () => onClick(c.id));
    container.appendChild(div);
  });
}

/** Переключает класс active на палитре */
function updatePaletteActive(paletteId, activeId) {
  document.querySelectorAll(`#${paletteId} .color-swatch`).forEach(el => {
    el.classList.toggle('active', el.dataset.id === activeId);
    if (isColorDark(el.style.backgroundColor)) {
      el.style.borderColor = el.dataset.id === activeId ? '#4a7c59' : '#888';
    }
  });
}

/** Определяет, тёмный ли цвет (для контрастной рамки). Поддерживает hex и rgb() */
function isColorDark(hex) {
  if (hex.startsWith('rgb')) {
    const m = hex.match(/(\d+)/g);
    if (m) return (parseInt(m[0]) * 0.299 + parseInt(m[1]) * 0.587 + parseInt(m[2]) * 0.114) < 128;
  }
  if (!hex.startsWith('#')) return false;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 0.299 + g * 0.587 + b * 0.114) < 128;
}


// ============================================================
// ВИДИМОСТЬ СЕКЦИЙ ЦВЕТА
// ============================================================

/** Показывает/скрывает секции выбора цвета в зависимости от типа створок */
function updateColorVisibility() {
  const colorSection = document.getElementById('colorSection');
  const doorColorGroup = document.getElementById('doorColorGroup');
  const mainColorGroup = document.getElementById('mainColorGroup');
  const separateDoorColorGroup = document.getElementById('separateDoorColorGroup');

  if (state.doorType === 'jaluzi') {
    // Жалюзи: палитра основного цвета видна (каркас/полки),
    // но отдельный цвет створок скрыт (створки всегда CONFIG.jaluziColor)
    colorSection.classList.remove('disabled-section');
    mainColorGroup.classList.remove('hidden');
    separateDoorColorGroup.classList.add('hidden');
    doorColorGroup.classList.add('hidden');
  } else {
    // ЛДСП: основной цвет + опционально отдельный для створок
    colorSection.classList.remove('disabled-section');
    mainColorGroup.classList.remove('hidden');
    separateDoorColorGroup.classList.remove('hidden');

    if (state.separateDoorColor) {
      doorColorGroup.classList.remove('hidden');
    } else {
      doorColorGroup.classList.add('hidden');
    }
  }
}


// ============================================================
// КОНТРОЛЫ РАЗМЕРОВ СТВОРОК
// ============================================================

/** Синхронизирует min/max слайдера высоты створок с текущим каркасом */
function syncDoorHeightLimits() {
  const innerH = state.height - 2 * CONFIG.frameThickness;
  const maxH = Math.min(CONFIG.ldspDoorHeight.max, Math.floor(innerH));
  const minH = CONFIG.ldspDoorHeight.min;

  const slider = document.getElementById('sliderDoorH');
  if (!slider) return;

  slider.min = minH;
  slider.max = maxH;

  // Ограничиваем текущее значение
  if (state.doorHeight > maxH) state.doorHeight = maxH;
  if (state.doorHeight < minH) state.doorHeight = minH;
  slider.value = state.doorHeight;
  document.getElementById('valDoorH').textContent = state.doorHeight + ' см';
}

/** Обновляет информацию об открытой полке снизу */
function updateBottomOpenInfo() {
  const bottomCm = getBottomOpenCm();
  const info = document.getElementById('infoDoorHeight');
  if (!info) return;

  if (bottomCm > 1) {
    info.textContent = `Открытая полка снизу: ${bottomCm.toFixed(1)} см`;
    info.style.color = '#4a7c59';
  } else if (bottomCm < -0.5) {
    info.textContent = `⚠ Створки не влезают! Превышение: ${Math.abs(bottomCm).toFixed(1)} см`;
    info.style.color = '#c62828';
  } else {
    info.textContent = 'Открытая полка снизу: нет';
    info.style.color = '#888';
  }
}


// ============================================================
// ПРИВЯЗКА КОНТРОЛОВ
// ============================================================

/** Главная функция привязки всех обработчиков событий */
function bindControls() {

  // --- Слайдеры габаритов ---
  bindSlider('sliderHeight', 'valHeight', v => {
    state.height = v;
    syncDoorHeightLimits();
    updateBottomOpenInfo();
  }, 'см');

  bindSlider('sliderWidth', 'valWidth', v => { state.width = v; }, 'см');
  bindSlider('sliderDepth', 'valDepth', v => { state.depth = v; }, 'см');

  // --- Высота створки (единый слайдер для ЛДСП и жалюзи) ---
  bindSlider('sliderDoorH', 'valDoorH', v => {
    state.doorHeight = v;
    updateBottomOpenInfo();
  }, 'см');

  // --- Счётчики: полки и створки ---
  bindCounter('shelvesMin', 'shelvesPlus', 'valShelves', 1, 5,
    () => state.shelves, v => { state.shelves = v; });

  bindCounter('doorsMin', 'doorsPlus', 'valDoors', 1, 4,
    () => state.doors, v => { state.doors = v; });

  // --- Тип створок (радиокнопки) ---
  document.querySelectorAll('input[name="doorType"]').forEach(radio => {
    radio.addEventListener('change', e => {
      state.doorType = e.target.value;
      updateColorVisibility();
      render();
    });
  });

  // --- Боковая полка: чекбокс + настройки ---
  const chk = document.getElementById('chkSideShelf');
  const opts = document.getElementById('sideShelfOptions');
  if (chk && opts) {
    chk.addEventListener('change', () => {
      state.sideShelf = chk.checked;
      opts.classList.toggle('hidden', !chk.checked);
      render();
    });
  }

  document.querySelectorAll('input[name="sideShelfSide"]').forEach(radio => {
    radio.addEventListener('change', e => {
      state.sideShelfSide = e.target.value;
      render();
    });
  });

  bindSlider('sliderSideShelfW', 'valSideShelfW', v => { state.sideShelfWidth = v; }, 'см');

  bindCounter('sideShelvesMinus', 'sideShelvesPlus', 'valSideShelves', 1, 5,
    () => state.sideShelves, v => { state.sideShelves = v; });

  // --- Отдельный цвет створок ---
  const chkDoorColor = document.getElementById('chkSeparateDoorColor');
  if (chkDoorColor) {
    chkDoorColor.addEventListener('change', () => {
      state.separateDoorColor = chkDoorColor.checked;
      updateColorVisibility();
      render();
    });
  }

  // --- Модальное окно ---
  document.getElementById('btnOrder').addEventListener('click', openModal);
  document.getElementById('btnCancel').addEventListener('click', closeModal);
  document.getElementById('btnSend').addEventListener('click', sendOrder);
  document.getElementById('modalOverlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal();
  });
}

/** Утилита: привязка слайдера к state-полю */
function bindSlider(sliderId, valId, setter, suffix) {
  const slider = document.getElementById(sliderId);
  const val = document.getElementById(valId);
  if (!slider || !val) return;
  slider.addEventListener('input', () => {
    const v = parseInt(slider.value);
    setter(v);
    val.textContent = v + ' ' + suffix;
    render();
  });
}

/** Утилита: привязка счётчика +/- к state-полю */
function bindCounter(minBtnId, plusBtnId, valId, min, max, getter, setter) {
  const valEl = document.getElementById(valId);
  const minBtn = document.getElementById(minBtnId);
  const plusBtn = document.getElementById(plusBtnId);
  if (!minBtn || !plusBtn || !valEl) return;

  minBtn.addEventListener('click', () => {
    let v = getter();
    if (v > min) { setter(v - 1); valEl.textContent = v - 1; render(); }
  });
  plusBtn.addEventListener('click', () => {
    let v = getter();
    if (v < max) { setter(v + 1); valEl.textContent = v + 1; render(); }
  });
}


// ============================================================
// ИНИЦИАЛИЗАЦИЯ ДЕФОЛТОВ СТВОРОК
// ============================================================

/** Вычисляет начальную высоту створок на основе текущего каркаса */
function initDoorDefaults() {
  const innerH = state.height - 2 * CONFIG.frameThickness;

  // Высота створки = внутренняя высота − дефолтная открытая зона снизу
  state.doorHeight = Math.max(
    CONFIG.ldspDoorHeight.min,
    Math.min(CONFIG.ldspDoorHeight.max, Math.round(innerH - CONFIG.defaultBottomOpenHeight))
  );
}