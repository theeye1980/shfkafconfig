/**
 * ui.js — УПРАВЛЕНИЕ ИНТЕРФЕЙСОМ (DOM-контролы, палитры, видимость)
 * ====================================================================
 * Самый «связующий» модуль. Отвечает за всё взаимодействие пользователя
 * с панелью управления и синхронизацию DOM с объектом state.
 *
 * Содержит:
 *
 * 1. ПАЛИТРЫ ЦВЕТОВ:
 *    - buildPalettes() — создаёт палитры основного цвета (#paletteMain)
 *      и цвета створок (#paletteDoor), вешает обработчики кликов
 *    - buildColorPalette(containerId, activeId, onClick) — генерирует
 *      div.color-swatch для каждого цвета из CONFIG.colors
 *    - updatePaletteActive(paletteId, activeId) — переключает класс 'active'
 *    - isColorDark(hex) — определяет, тёмный ли цвет (для контрастной рамки)
 *
 * 2. ВИДИМОСТЬ СЕКЦИЙ ЦВЕТА:
 *    - updateColorVisibility() — показывает/скрывает секции выбора цвета
 *      в зависимости от doorType (jaluzi → цвет не выбирается,
 *      ldsp → основной + опционально отдельный для створок)
 *
 * 3. КОНТРОЛЫ РАЗМЕРОВ СТВОРОК:
 *    - buildDoorSizeControls() — инициализация
 *    - updateDoorSizeUI() — переключает видимость ЛДСП/жалюзи-контролов
 *    - syncLdspDoorLimits() — синхронизирует min/max слайдера высоты ЛДСП-створок
 *      с текущей внутренней высотой каркаса
 *    - populateJaluziSelects() — заполняет <select> доступными размерами жалюзи,
 *      фильтруя по макс. высоте
 *    - updateBottomOpenInfo() — обновляет подпись «Открытая полка снизу: X см»
 *      или предупреждение о превышении
 *
 * 4. ПРИВЯЗКА ВСЕХ КОНТРОЛОВ:
 *    - bindControls() — главная функция, вешает обработчики на:
 *      * слайдеры высоты/ширины/глубины/ширины боковой полки/высоты ЛДСП-створок
 *      * счётчики полок/створок/полок боковой секции (+/-)
 *      * радиокнопки типа створок (ldsp/jaluzi)
 *      * чекбокс боковой полки и её стороны
 *      * чекбокс «отдельный цвет створок»
 *      * select жалюзи
 *      * кнопки модального окна (заказ, отмена, отправка, клик по оверлею)
 *    - bindSlider(sliderId, valId, setter, suffix) — утилита привязки слайдера:
 *      читает значение → вызывает setter → обновляет текст → render()
 *    - bindCounter(minBtnId, plusBtnId, valId, min, max, getter, setter) —
 *      утилита привязки счётчика +/-
 *
 * 5. ИНИЦИАЛИЗАЦИЯ ДЕФОЛТОВ СТВОРОК:
 *    - initDoorDefaults() — вычисляет начальную высоту створок:
 *      для ЛДСП = внутренняя высота − defaultBottomOpenHeight,
 *      для жалюзи = ближайший размер из каталога
 *    - findClosestIdx(arr, target) — поиск ближайшего значения в массиве
 *
 * Зависимости: config.js, state.js, render-svg.js, price.js, modal.js
 * (вызывает render(), openModal(), closeModal(), sendOrder())
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

    // Тёмные цвета — видимая рамка
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
  const jaluziColorNote = document.getElementById('jaluziColorNote');

  if (state.doorType === 'jaluzi') {
    // Жалюзи: цвет фиксированный, палитра скрыта
    colorSection.classList.add('disabled-section');
    jaluziColorNote.classList.remove('hidden');
    document.getElementById('mainColorGroup').classList.add('hidden');
    doorColorGroup.classList.add('hidden');
    document.getElementById('separateDoorColorGroup').classList.add('hidden');
  } else {
    // ЛДСП: основной цвет видим + опционально отдельный для створок
    colorSection.classList.remove('disabled-section');
    jaluziColorNote.classList.add('hidden');
    document.getElementById('mainColorGroup').classList.remove('hidden');
    document.getElementById('separateDoorColorGroup').classList.remove('hidden');

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

/** Инициализация контролов размеров створок */
function buildDoorSizeControls() {
  updateDoorSizeUI();
}

/** Переключает видимость ЛДСП / жалюзи контролов */
function updateDoorSizeUI() {
  const ldspControls = document.getElementById('ldspDoorControls');
  const jaluziControls = document.getElementById('jaluziDoorControls');

  if (state.doorType === 'ldsp') {
    ldspControls.classList.remove('hidden');
    jaluziControls.classList.add('hidden');
    syncLdspDoorLimits();
  } else {
    ldspControls.classList.add('hidden');
    jaluziControls.classList.remove('hidden');
    populateJaluziSelects();
  }

  updateBottomOpenInfo();
}

/** Синхронизирует min/max слайдера высоты ЛДСП-створок с текущим каркасом */
function syncLdspDoorLimits() {
  const innerH = state.height - 2 * CONFIG.frameThickness;
  const maxH = Math.min(CONFIG.ldspDoorHeight.max, Math.floor(innerH));
  const minH = CONFIG.ldspDoorHeight.min;

  const sliderH = document.getElementById('sliderLdspDoorH');
  sliderH.min = minH;
  sliderH.max = maxH;

  // Ограничиваем текущее значение
  if (state.ldspDoorHeight > maxH) state.ldspDoorHeight = maxH;
  if (state.ldspDoorHeight < minH) state.ldspDoorHeight = minH;
  sliderH.value = state.ldspDoorHeight;
  document.getElementById('valLdspDoorH').textContent = state.ldspDoorHeight + ' см';
}

/** Заполняет <select> доступными размерами жалюзи (фильтр по макс. высоте) */
function populateJaluziSelects() {
  const selH = document.getElementById('selectJaluziH');
  const innerH = state.height - 2 * CONFIG.frameThickness;
  const maxHmm = Math.floor(innerH * 10);

  selH.innerHTML = '';
  CONFIG.jaluziHeights.forEach((h, idx) => {
    if (h <= maxHmm) {
      const opt = document.createElement('option');
      opt.value = idx;
      opt.textContent = h + ' мм (' + (h / 10).toFixed(1) + ' см)';
      if (idx === state.jaluziHeightIdx) opt.selected = true;
      selH.appendChild(opt);
    }
  });

  // Если текущий выбор вышел за пределы — выбрать максимально доступный
  if (state.jaluziHeightIdx >= CONFIG.jaluziHeights.length ||
      CONFIG.jaluziHeights[state.jaluziHeightIdx] > maxHmm) {
    let best = 0;
    CONFIG.jaluziHeights.forEach((h, idx) => { if (h <= maxHmm) best = idx; });
    state.jaluziHeightIdx = best;
    selH.value = best;
  }
}

/** Обновляет информацию об открытой полке снизу */
function updateBottomOpenInfo() {
  const bottomCm = getBottomOpenCm();
  const info = document.getElementById('infoDoorHeight');

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
    if (state.doorType === 'ldsp') syncLdspDoorLimits();
    else populateJaluziSelects();
    updateBottomOpenInfo();
  }, 'см');

  bindSlider('sliderWidth', 'valWidth', v => { state.width = v; }, 'см');
  bindSlider('sliderDepth', 'valDepth', v => { state.depth = v; }, 'см');

  // --- ЛДСП створки: высота ---
  bindSlider('sliderLdspDoorH', 'valLdspDoorH', v => {
    state.ldspDoorHeight = v;
    updateBottomOpenInfo();
  }, 'см');

  // --- Жалюзи: select высоты ---
  document.getElementById('selectJaluziH').addEventListener('change', e => {
    state.jaluziHeightIdx = parseInt(e.target.value);
    updateBottomOpenInfo();
    render();
  });

  // --- Счётчики: полки и створки ---
  bindCounter('shelvesMin', 'shelvesPlus', 'valShelves', 1, 5,
    () => state.shelves, v => { state.shelves = v; });

  bindCounter('doorsMin', 'doorsPlus', 'valDoors', 1, 4,
    () => state.doors, v => { state.doors = v; });

  // --- Тип створок (радиокнопки) ---
  document.querySelectorAll('input[name="doorType"]').forEach(radio => {
    radio.addEventListener('change', e => {
      state.doorType = e.target.value;
      updateDoorSizeUI();
      updateColorVisibility();
      render();
    });
  });

  // --- Боковая полка: чекбокс + настройки ---
  const chk = document.getElementById('chkSideShelf');
  const opts = document.getElementById('sideShelfOptions');
  chk.addEventListener('change', () => {
    state.sideShelf = chk.checked;
    opts.classList.toggle('hidden', !chk.checked);
    render();
  });

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
  chkDoorColor.addEventListener('change', () => {
    state.separateDoorColor = chkDoorColor.checked;
    updateColorVisibility();
    render();
  });

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
  document.getElementById(minBtnId).addEventListener('click', () => {
    let v = getter();
    if (v > min) { setter(v - 1); valEl.textContent = v - 1; render(); }
  });
  document.getElementById(plusBtnId).addEventListener('click', () => {
    let v = getter();
    if (v < max) { setter(v + 1); valEl.textContent = v + 1; render(); }
  });
}


// ============================================================
// ИНИЦИАЛИЗАЦИЯ ДЕФОЛТОВ СТВОРОК
// ============================================================

/** Вычисляет начальные размеры створок на основе текущего каркаса */
function initDoorDefaults() {
  const innerH = state.height - 2 * CONFIG.frameThickness;

  // ЛДСП: внутренняя высота − дефолтная открытая зона
  state.ldspDoorHeight = Math.max(60, Math.min(130, Math.round(innerH - CONFIG.defaultBottomOpenHeight)));

  // Жалюзи: ближайший размер из каталога
  const targetH = innerH - CONFIG.defaultBottomOpenHeight;
  state.jaluziHeightIdx = findClosestIdx(CONFIG.jaluziHeights, targetH * 10);
}

/** Поиск индекса ближайшего значения в массиве */
function findClosestIdx(arr, target) {
  let best = 0;
  let bestDiff = Math.abs(arr[0] - target);
  for (let i = 1; i < arr.length; i++) {
    const diff = Math.abs(arr[i] - target);
    if (diff < bestDiff) { bestDiff = diff; best = i; }
  }
  return best;
}