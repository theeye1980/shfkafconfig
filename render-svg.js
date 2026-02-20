/**
 * render-svg.js — SVG-ВИЗУАЛИЗАЦИЯ ШКАФЧИКА (ВИД СПЕРЕДИ)
 * ==========================================================
 * Самый большой модуль. Отвечает за отрисовку 2D-вида шкафчика в SVG.
 *
 * Содержит:
 *
 * 1. renderSVG() — основная функция отрисовки. Читает state и CONFIG,
 *    вычисляет масштаб, координаты, и генерирует SVG-элементы:
 *    - Ниша (фон стены — прямоугольник)
 *    - Каркас основной секции (боковины, верх, низ — цвет мебельного щита)
 *    - Разделительная полка (между зоной створок и открытой зоной снизу)
 *    - Полки (горизонтальные, равномерно распределены в зоне створок)
 *    - Створки: ЛДСП (прямоугольники с ручками) или жалюзи (ламели + рамка)
 *    - Боковая секция (если включена): каркас, полки, привязка к стороне
 *    - Размерные линии: общая высота, общая ширина, высота створок,
 *      ширина основной и боковой секций
 *    - Подпись высоты открытой полки снизу
 *
 * 2. SVG-хелперы (генерируют строки SVG-разметки):
 *    - svgRect(x, y, w, h, fill, stroke, strokeWidth, opacity) — прямоугольник
 *    - dimLine(x1, y1, x2, y2, color) — пунктирная размерная линия
 *    - dimArrow(x, y, dir, color) — стрелка размерной линии (up/down/left/right)
 *    - dimText(x, y, text, color, size, anchor, rotate) — текст размера
 *    - darken(hex, amount) — затемнение hex-цвета на amount единиц (для обводок)
 *    - r(val) — округление до 1 знака после запятой (чтобы SVG не раздувался)
 *
 * Зависимости: config.js, state.js (функции getDoorHeightCm, getBottomOpenCm,
 *              getFrameHex, getShelfHex, getDoorHex и state)
 *
 * Вставляет результат в элемент с id="cabinetSVG" (innerHTML).
 */


/** Округление до 1 знака — для чистого SVG */
function r(val) {
  return Math.round(val * 10) / 10;
}


/** Основная функция отрисовки SVG */
function renderSVG() {
  const svg = document.getElementById('cabinetSVG');
  const S = CONFIG.svg;
  const frameColor = getFrameHex();
  const shelfColor = getShelfHex();
  const doorColor = getDoorHex();

  const ft = CONFIG.frameThickness;
  const dt = CONFIG.dividerThickness;

  // Ширина ниши и секций
  const nicheWidthCm = state.width;
  const sideSectionCm = state.sideShelf ? (state.sideShelfWidth + dt) : 0;
  const mainWidthCm = nicheWidthCm - sideSectionCm;

  // Масштаб: вписываем шкаф в область рисования
  const drawW = S.width - S.padding * 2;
  const drawH = S.height - S.padding * 2;
  const scale = Math.min(drawW / (nicheWidthCm + 12), drawH / (state.height + 12));

  // Пиксельные размеры
  const nicheWpx = r(nicheWidthCm * scale);
  const cabH = r(state.height * scale);
  const mainWpx = r(mainWidthCm * scale);
  const sideWpx = r(sideSectionCm * scale);

  // Начальные координаты (центрируем)
  const startX = r((S.width - nicheWpx) / 2);
  const startY = r(S.padding + (drawH - cabH) / 2);

  // Позиции основной и боковой секций
  let mainX, sideX;
  if (!state.sideShelf) {
    mainX = startX;
    sideX = 0;
  } else if (state.sideShelfSide === 'left') {
    sideX = startX;
    mainX = r(startX + sideWpx);
  } else {
    mainX = startX;
    sideX = r(startX + mainWpx);
  }

  // Пиксельные толщины
  const ftPx = r(ft * scale);
  const dtPx = r(dt * scale);
  const stPx = r(CONFIG.shelfThickness * scale);
  const gap = S.nicheExtraGap;

  // Створки: размеры
  const doorHcm = getDoorHeightCm();
  const doorHpx = r(doorHcm * scale);
  const mainInnerHcm = state.height - 2 * ft;
  const bottomOpenCm = mainInnerHcm - doorHcm;
  const bottomOpenPx = r(bottomOpenCm * scale);

  const doorTopY = r(startY + ftPx);
  const doorBottomY = r(doorTopY + doorHpx);

  let parts = [];

  // ======== НИША (фон стены) ========
  parts.push(svgRect(
    r(startX - gap), r(startY - gap),
    r(nicheWpx + gap * 2), r(cabH + gap * 2),
    CONFIG.nicheColor, CONFIG.nicheStroke, 1
  ));

  // ======== КАРКАС ОСНОВНОЙ СЕКЦИИ ========
  // Высота боковины зависит от наличия открытой зоны и боковой полки
  const dividerH = (bottomOpenCm > 1) ? r(doorBottomY - startY) : cabH;

  // Левая боковина основной секции
  if (state.sideShelf && state.sideShelfSide === 'left') {
    // Левая боковина = разделитель (укороченная если есть открытая зона)
    parts.push(svgRect(mainX, startY, ftPx, dividerH, frameColor, darken(frameColor, 30), 1));
    // Правая — на всю высоту
    parts.push(svgRect(r(mainX + mainWpx - ftPx), startY, ftPx, cabH, frameColor, darken(frameColor, 30), 1));
  } else if (state.sideShelf && state.sideShelfSide === 'right') {
    // Левая — на всю высоту
    parts.push(svgRect(mainX, startY, ftPx, cabH, frameColor, darken(frameColor, 30), 1));
    // Правая = разделитель (укороченная)
    parts.push(svgRect(r(mainX + mainWpx - ftPx), startY, ftPx, dividerH, frameColor, darken(frameColor, 30), 1));
  } else {
    // Без боковой секции — обе на всю высоту
    parts.push(svgRect(mainX, startY, ftPx, cabH, frameColor, darken(frameColor, 30), 1));
    parts.push(svgRect(r(mainX + mainWpx - ftPx), startY, ftPx, cabH, frameColor, darken(frameColor, 30), 1));
  }

  // Верхняя и нижняя планки
  parts.push(svgRect(r(mainX + ftPx), startY, r(mainWpx - 2 * ftPx), ftPx, frameColor, darken(frameColor, 30), 1));
  parts.push(svgRect(r(mainX + ftPx), r(startY + cabH - ftPx), r(mainWpx - 2 * ftPx), ftPx, frameColor, darken(frameColor, 30), 1));

  // ======== РАЗДЕЛИТЕЛЬНАЯ ПОЛКА (между створками и открытой зоной) ========
  /*if (bottomOpenCm > 1) {
    const divShelfLeft = r(startX + ftPx);
    const divShelfRight = r(startX + nicheWpx - ftPx);
    const divShelfW = r(divShelfRight - divShelfLeft);
    parts.push(svgRect(
      divShelfLeft, r(doorBottomY - stPx / 2), divShelfW, stPx,
      shelfColor, darken(shelfColor, 25), 0.9
    ));*/

  if (bottomOpenCm > 1) {
    const divShelfLeft = r(startX + ftPx);
    const divShelfRight = r(startX + nicheWpx - ftPx);
    const divShelfW = r(divShelfRight - divShelfLeft);
    parts.push(svgRect(
      divShelfLeft, r(doorBottomY), divShelfW, stPx,
      shelfColor, darken(shelfColor, 25), 0.9
    ));

    // Подпись открытой зоны
    const openZoneCenterY = r(doorBottomY + bottomOpenPx / 2);
    const openZoneCenterX = r(startX + nicheWpx / 2);
    parts.push(dimText(openZoneCenterX, openZoneCenterY,
      `${bottomOpenCm.toFixed(1)} см`, '#888', 11, 'middle', 0));
  }

  // ======== ПОЛКИ (в зоне створок, равномерно) ========
  if (state.shelves > 0) {
    const segments = state.shelves + 1;
    for (let i = 1; i <= state.shelves; i++) {
      const shelfY = r(doorTopY + (doorHpx / segments) * i - stPx / 2);
      parts.push(svgRect(
        r(mainX + ftPx), shelfY, r(mainWpx - 2 * ftPx), stPx,
        shelfColor, darken(shelfColor, 25), 0.8
      ));
    }
  }

  // ======== СТВОРКИ ========
  const doorCount = state.doors;
  const doorGapPx = 2; // зазор между створками
  const totalDoorW = r(mainWpx - 2 * ftPx - (doorCount - 1) * doorGapPx);
  const singleDoorW = r(totalDoorW / doorCount);

  for (let i = 0; i < doorCount; i++) {
    const doorX = r(mainX + ftPx + i * (singleDoorW + doorGapPx));

    if (state.doorType === 'ldsp') {
      // ЛДСП створка
      parts.push(svgRect(doorX, doorTopY, singleDoorW, doorHpx,
        doorColor, darken(doorColor, 40), 0.85));
      // Ручка
      const handleW = 3, handleH = 20;
      const handleX = r((i % 2 === 0) ? doorX + singleDoorW - handleW - 8 : doorX + 8);
      const handleY = r(doorTopY + doorHpx / 2 - handleH / 2);
      parts.push(svgRect(handleX, handleY, handleW, handleH, darken(doorColor, 60), 'none', 1));
    } else {
      // Жалюзийная створка
      const jColor = CONFIG.jaluziColor.hex;
      const frameW = 3; // ширина рамки жалюзи (px)
      const lamelH = 4, lamelGap = 3;
      const lamelArea = doorHpx - 2 * frameW;
      const lamelCount = Math.floor(lamelArea / (lamelH + lamelGap));
      const lamelStartY = r(doorTopY + frameW);

      // Ламели
      for (let j = 0; j < lamelCount; j++) {
        const ly = r(lamelStartY + j * (lamelH + lamelGap));
        parts.push(svgRect(
          r(doorX + frameW), ly, r(singleDoorW - 2 * frameW), lamelH,
          jColor, darken(jColor, 25), 0.9
        ));
      }

      // Рамка жалюзи (верх, низ, лево, право)
      parts.push(svgRect(doorX, doorTopY, singleDoorW, frameW, jColor, darken(jColor, 30), 1));
      parts.push(svgRect(doorX, r(doorTopY + doorHpx - frameW), singleDoorW, frameW, jColor, darken(jColor, 30), 1));
      parts.push(svgRect(doorX, doorTopY, frameW, doorHpx, jColor, darken(jColor, 30), 1));
      parts.push(svgRect(r(doorX + singleDoorW - frameW), doorTopY, frameW, doorHpx, jColor, darken(jColor, 30), 1));
    }
  }

  // ======== БОКОВАЯ СЕКЦИЯ ========
  if (state.sideShelf) {
    const sideTopY = startY;
    const sideBottomY = (bottomOpenCm > 1) ? doorBottomY : r(startY + cabH);
    const sideSectionH = r(sideBottomY - sideTopY);

    if (state.sideShelfSide === 'left') {
      // Внешняя левая боковина
      parts.push(svgRect(sideX, sideTopY, ftPx, cabH, frameColor, darken(frameColor, 30), 1));

      const sideShelfContentLeft = r(sideX + ftPx);
      const sideShelfContentRight = mainX;
      const sideShelfContentW = r(sideShelfContentRight - sideShelfContentLeft);

      // Верхняя планка боковой секции
      parts.push(svgRect(sideShelfContentLeft, sideTopY, sideShelfContentW, ftPx, frameColor, darken(frameColor, 30), 1));

      // Нижняя планка (на уровне разделительной полки или низа)
      if (bottomOpenCm <= 1) {
        parts.push(svgRect(sideShelfContentLeft, r(sideTopY + sideSectionH - ftPx), sideShelfContentW, ftPx, frameColor, darken(frameColor, 30), 1));
      }
      if (bottomOpenCm > 1) {
        parts.push(svgRect(sideShelfContentLeft, r(startY + cabH - ftPx), sideShelfContentW, ftPx, frameColor, darken(frameColor, 30), 1));
      }

      // Полки в боковой секции
      const sideInnerTop = r(sideTopY + ftPx);
      const sideInnerBottom = (bottomOpenCm > 1) ? r(doorBottomY - stPx / 2) : r(sideTopY + sideSectionH - ftPx);
      const sideInnerH = r(sideInnerBottom - sideInnerTop);
      const sideSegments = state.sideShelves + 1;

      for (let i = 1; i <= state.sideShelves; i++) {
        const sy = r(sideInnerTop + (sideInnerH / sideSegments) * i - stPx / 2);
        parts.push(svgRect(sideShelfContentLeft, sy, sideShelfContentW, stPx,
          shelfColor, darken(shelfColor, 25), 0.8));
      }

    } else {
      // Внешняя правая боковина
      const outerSideX = r(sideX + sideWpx - ftPx);
      parts.push(svgRect(outerSideX, sideTopY, ftPx, cabH, frameColor, darken(frameColor, 30), 1));

      const sideShelfContentLeft = r(mainX + mainWpx);
      const sideShelfContentRight = outerSideX;
      const sideShelfContentW = r(sideShelfContentRight - sideShelfContentLeft);

      // Верхняя планка
      parts.push(svgRect(sideShelfContentLeft, sideTopY, sideShelfContentW, ftPx, frameColor, darken(frameColor, 30), 1));

      // Нижняя планка
      if (bottomOpenCm <= 1) {
        parts.push(svgRect(sideShelfContentLeft, r(sideTopY + sideSectionH - ftPx), sideShelfContentW, ftPx, frameColor, darken(frameColor, 30), 1));
      }
      if (bottomOpenCm > 1) {
        parts.push(svgRect(sideShelfContentLeft, r(startY + cabH - ftPx), sideShelfContentW, ftPx, frameColor, darken(frameColor, 30), 1));
      }

      // Полки в боковой секции
      const sideInnerTop = r(sideTopY + ftPx);
      const sideInnerBottom = (bottomOpenCm > 1) ? r(doorBottomY - stPx / 2) : r(sideTopY + sideSectionH - ftPx);
      const sideInnerH = r(sideInnerBottom - sideInnerTop);
      const sideSegments = state.sideShelves + 1;

      for (let i = 1; i <= state.sideShelves; i++) {
        const sy = r(sideInnerTop + (sideInnerH / sideSegments) * i - stPx / 2);
        parts.push(svgRect(sideShelfContentLeft, sy, sideShelfContentW, stPx,
          shelfColor, darken(shelfColor, 25), 0.8));
      }
    }
  }

  // ======== РАЗМЕРНЫЕ ЛИНИИ ========
  const dimOff = S.dimLineOffset;
  const dimCol = S.dimColor;
  const fontSize = S.dimFontSize;

  // Высота (справа)
  const rightEdge = r(startX + nicheWpx);
  parts.push(dimLine(r(rightEdge + gap + dimOff), startY, r(rightEdge + gap + dimOff), r(startY + cabH), dimCol));
  parts.push(dimArrow(r(rightEdge + gap + dimOff), startY, 'up', dimCol));
  parts.push(dimArrow(r(rightEdge + gap + dimOff), r(startY + cabH), 'down', dimCol));
  parts.push(dimText(r(rightEdge + gap + dimOff + 6), r(startY + cabH / 2),
    state.height + ' см', dimCol, fontSize, 'start', -90));

  // Ширина (сверху)
  parts.push(dimLine(startX, r(startY - gap - dimOff), r(startX + nicheWpx), r(startY - gap - dimOff), dimCol));
  parts.push(dimArrow(startX, r(startY - gap - dimOff), 'left', dimCol));
  parts.push(dimArrow(r(startX + nicheWpx), r(startY - gap - dimOff), 'right', dimCol));
  parts.push(dimText(r(startX + nicheWpx / 2), r(startY - gap - dimOff - 6),
    state.width + ' см (ниша)', dimCol, fontSize, 'middle', 0));

  // Ширина секций (если есть боковая)
  if (state.sideShelf) {
    const dimY2 = r(startY - gap - dimOff - 24);

    // Основная секция
    parts.push(dimLine(mainX, dimY2, r(mainX + mainWpx), dimY2, '#999'));
    parts.push(dimArrow(mainX, dimY2, 'left', '#999'));
    parts.push(dimArrow(r(mainX + mainWpx), dimY2, 'right', '#999'));
    parts.push(dimText(r(mainX + mainWpx / 2), r(dimY2 - 6),
      mainWidthCm.toFixed(1) + ' см', '#999', 11, 'middle', 0));

    // Боковая секция
    const sideStartX2 = sideX;
    const sideEndX = r(sideStartX2 + sideWpx);
    parts.push(dimLine(sideStartX2, dimY2, sideEndX, dimY2, '#999'));
    parts.push(dimArrow(sideStartX2, dimY2, 'left', '#999'));
    parts.push(dimArrow(sideEndX, dimY2, 'right', '#999'));
    parts.push(dimText(r((sideStartX2 + sideEndX) / 2), r(dimY2 - 6),
      sideSectionCm.toFixed(1) + '', '#999', 11, 'middle', 0));
  }

  // Высота створок (слева, если есть открытая зона)
  if (bottomOpenCm > 1) {
    const leftEdge = mainX;
    const dlX = r(leftEdge - gap - dimOff);
    parts.push(dimLine(dlX, doorTopY, dlX, doorBottomY, '#4a7c59'));
    parts.push(dimArrow(dlX, doorTopY, 'up', '#4a7c59'));
    parts.push(dimArrow(dlX, doorBottomY, 'down', '#4a7c59'));
    parts.push(dimText(r(dlX - 6), r(doorTopY + doorHpx / 2),
      doorHcm.toFixed(1) + '', '#4a7c59', 11, 'end', -90));
  }

  svg.innerHTML = parts.join('\n');
}


// ======== SVG-ХЕЛПЕРЫ ========

/** Прямоугольник */
function svgRect(x, y, w, h, fill, stroke, strokeWidth, opacity) {
  const f = fill || 'none';
  const s = stroke || 'none';
  const sw = strokeWidth || 0;
  const op = opacity !== undefined ? ` opacity="${opacity}"` : '';
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}" stroke="${s}" stroke-width="${sw}"${op} />`;
}

/** Пунктирная размерная линия */
function dimLine(x1, y1, x2, y2, color) {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="1" stroke-dasharray="4 2" />`;
}

/** Стрелка размерной линии */
function dimArrow(x, y, dir, color) {
  const s = 5;
  let points;
  switch (dir) {
    case 'up':    points = `${x},${y} ${x-s},${y+s*1.5} ${x+s},${y+s*1.5}`; break;
    case 'down':  points = `${x},${y} ${x-s},${y-s*1.5} ${x+s},${y-s*1.5}`; break;
    case 'left':  points = `${x},${y} ${x+s*1.5},${y-s} ${x+s*1.5},${y+s}`; break;
    case 'right': points = `${x},${y} ${x-s*1.5},${y-s} ${x-s*1.5},${y+s}`; break;
  }
  return `<polygon points="${points}" fill="${color}" />`;
}

/** Текст размера */
function dimText(x, y, text, color, size, anchor, rotate) {
  const transform = rotate ? ` transform="rotate(${rotate} ${x} ${y})"` : '';
  return `<text x="${x}" y="${y}" fill="${color}" font-size="${size}" font-family="sans-serif" text-anchor="${anchor}" dominant-baseline="middle"${transform}>${text}</text>`;
}

/** Затемнение hex-цвета на amount единиц (для обводок и теней) */
function darken(hex, amount) {
  if (!hex || hex === 'none') return '#000';
  let rv = parseInt(hex.slice(1, 3), 16);
  let g = parseInt(hex.slice(3, 5), 16);
  let b = parseInt(hex.slice(5, 7), 16);
  rv = Math.max(0, rv - amount);
  g = Math.max(0, g - amount);
  b = Math.max(0, b - amount);
  return '#' + [rv, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}