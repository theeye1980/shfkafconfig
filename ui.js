function buildPalettes() {
  buildColorPalette('paletteBody', state.bodyColorId, (id) => {
    state.bodyColorId = id;
    updatePaletteActive('paletteBody', id);
    render();
  });

  buildColorPalette('paletteDoor', state.doorColorId, (id) => {
    state.doorColorId = id;
    updatePaletteActive('paletteDoor', id);
    render();
  });
}

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

function updatePaletteActive(paletteId, activeId) {
  document.querySelectorAll(`#${paletteId} .color-swatch`).forEach(el => {
    el.classList.toggle('active', el.dataset.id === activeId);
    if (isColorDark(el.style.backgroundColor)) {
      el.style.borderColor = el.dataset.id === activeId ? '#4a7c59' : '#888';
    }
  });
}

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

function updateColorVisibility() {
  const doorColorGroup = document.getElementById('doorColorGroup');
  const bodyColorGroup = document.getElementById('bodyColorGroup');

  if (state.doorType === 'jaluzi') {
    doorColorGroup.classList.add('hidden');
    bodyColorGroup.classList.remove('hidden');
  } else {
    doorColorGroup.classList.remove('hidden');
    bodyColorGroup.classList.remove('hidden');
  }
}

function syncDoorHeightLimits() {
  const maxH = state.height - 4;
  const minH = CONFIG.ldspDoorHeight.min;

  const slider = document.getElementById('sliderDoorH');
  if (!slider) return;

  slider.min = minH;
  slider.max = maxH;

  if (state.doorHeight > maxH) state.doorHeight = maxH;
  if (state.doorHeight < minH) state.doorHeight = minH;

  slider.value = state.doorHeight;
  document.getElementById('valDoorH').textContent = state.doorHeight + ' см';
}

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

function renderInfoPanel() {
  const panel = document.getElementById('infoPanel');
  if (!panel) return;

  const bottomCm = getBottomOpenCm();
  const hasBottom = bottomCm > 1;

  const bodyTitle = state.bodyType === 'ldsp'
    ? 'Материал корпуса: ЛДСП'
    : 'Материал корпуса: Мебельный щит';
  const bodyText = state.bodyType === 'ldsp'
    ? 'ЛДСП дешевле, стабильный материал, подходит для влажных помещений.'
    : 'Массив, выше стоимость, но теплее и «живее» выглядит.';

  const doorTitle = state.doorType === 'ldsp'
    ? 'Материал створок: ЛДСП'
    : 'Материал створок: Жалюзийная дверь';
  const doorText = state.doorType === 'ldsp'
    ? 'Можно подобрать цвет под интерьер.'
    : 'Рекомендуется покрыть защитой. Створки можно покрыть после монтажа.';

  const bottomTitle = hasBottom
    ? `Открытая полка снизу: ${bottomCm.toFixed(1)} см`
    : 'Открытая полка снизу: нет';
  const bottomText = hasBottom
    ? 'Удобно для хранения бытовой химии или корзин.'
    : 'Створки закрывают весь проём.';

  const sideTitle = state.sideShelf ? 'Боковая полка: есть' : 'Боковая полка: нет';
  const sideText = state.sideShelf
    ? `Сторона: ${state.sideShelfSide === 'left' ? 'слева' : 'справа'}, полок: ${state.sideShelves}.`
    : 'Можно добавить боковую секцию для мелочей.';

  panel.innerHTML = `
    <div class="info-title">Выбранные материалы и опции</div>
    <details class="info-item" open>
      <summary>${bodyTitle}</summary>
      <div class="info-text">${bodyText}</div>
    </details>
    <details class="info-item">
      <summary>${doorTitle}</summary>
      <div class="info-text">${doorText}</div>
    </details>
    <details class="info-item">
      <summary>${bottomTitle}</summary>
      <div class="info-text">${bottomText}</div>
    </details>
    <details class="info-item">
      <summary>${sideTitle}</summary>
      <div class="info-text">${sideText}</div>
    </details>
  `;
}

function bindControls() {
  bindSlider('sliderHeight', 'valHeight', v => {
    state.height = v;
    syncDoorHeightLimits();
    updateBottomOpenInfo();
  }, 'см');

  bindSlider('sliderWidth', 'valWidth', v => { state.width = v; }, 'см');
  bindSlider('sliderDepth', 'valDepth', v => { state.depth = v; }, 'см');

  bindSlider('sliderDoorH', 'valDoorH', v => {
    state.doorHeight = v;
    updateBottomOpenInfo();
  }, 'см');

  bindCounter('shelvesMin', 'shelvesPlus', 'valShelves', 1, 5,
    () => state.shelves, v => { state.shelves = v; });

  bindCounter('doorsMin', 'doorsPlus', 'valDoors', 1, 4,
    () => state.doors, v => { state.doors = v; });

  document.querySelectorAll('input[name="doorType"]').forEach(radio => {
    radio.addEventListener('change', e => {
      state.doorType = e.target.value;
      updateColorVisibility();
      render();
    });
  });

  document.querySelectorAll('input[name="bodyType"]').forEach(radio => {
    radio.addEventListener('change', e => {
      state.bodyType = e.target.value;
      render();
    });
  });

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

  document.getElementById('btnOrder').addEventListener('click', openModal);
  document.getElementById('btnCancel').addEventListener('click', closeModal);
  document.getElementById('btnSend').addEventListener('click', sendOrder);
  document.getElementById('modalOverlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal();
  });
}

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

function initDoorDefaults() {
  const innerH = state.height - 2 * CONFIG.frameThickness;
  state.doorHeight = Math.max(
    CONFIG.ldspDoorHeight.min,
    Math.min(CONFIG.ldspDoorHeight.max, Math.round(innerH - CONFIG.defaultBottomOpenHeight))
  );
}