/**
 * modal.js — МОДАЛЬНОЕ ОКНО ЗАЯВКИ
 * ===================================
 * Содержит:
 *
 * 1. openModal() — открывает модальное окно (добавляет класс 'show' к #modalOverlay).
 *    Формирует текстовое описание текущей конфигурации и вставляет в #modalConfig:
 *    - Размеры ниши (Ш×В×Г)
 *    - Ширина основной секции
 *    - Количество полок и створок (тип, размер)
 *    - Боковая полка (если есть): сторона, ширина, кол-во полок
 *    - Цвет каркаса, цвет створок (если отдельный)
 *    - Итоговая цена
 *
 * 2. closeModal() — закрывает модальное окно (убирает класс 'show').
 *
 * 3. sendOrder() — собирает данные формы (имя, телефон, комментарий)
 *    и все параметры конфигурации в JSON-payload, отправляет fetch POST
 *    на CONFIG.orderEndpoint. При ошибке сети — показывает alert
 *    и дублирует payload в console.log для отладки.
 *
 *    Структура payload:
 *    {
 *      name, phone, comment,
 *      config: { nicheWidth, nicheHeight, nicheDepth, mainSectionWidth,
 *                shelves, doors, doorType, doorWidthCm, doorHeightCm,
 *                mainColor, mainColorName, doorColor, doorColorName,
 *                separateDoorColor, sideShelf, sideShelfSide,
 *                sideShelfWidth, sideShelves },
 *      price: { frame, shelves, sideShelves, back, doors, assembly, total },
 *      timestamp: ISO-строка
 *    }
 *
 * Зависимости: config.js, state.js, price.js (calculatePrice, fmt,
 *              getDoorWidthCm, getDoorHeightCm, getMainColorName, getDoorColorName)
 */


/** Открыть модальное окно заявки */
function openModal() {
  const consent = document.getElementById('consentCheckbox');
  const consentError = document.getElementById('consentError');

  if (!consent || !consent.checked) {
    if (consentError) consentError.style.display = 'block';
    if (consent) consent.parentElement.classList.add('error');
    return; // не открываем модалку
  }

  if (consentError) consentError.style.display = 'none';
  if (consent) consent.parentElement.classList.remove('error');

  document.getElementById('modalOverlay').classList.add('show');
  document.getElementById('modalOverlay').classList.add('show');

  const p = calculatePrice();
  const doorTypeLabel = state.doorType === 'ldsp' ? 'ЛДСП' : 'Жалюзи';
  const sideSectionCm = state.sideShelf ? (state.sideShelfWidth + CONFIG.dividerThickness) : 0;
  const mainWidthCm = state.width - sideSectionCm;
  const doorSize = `${getDoorWidthCm().toFixed(1)}×${getDoorHeightCm().toFixed(1)}`;

  let configText = `Ниша ${state.width}×${state.height}×${state.depth} см`;
  configText += ` | Основная ${mainWidthCm.toFixed(1)} см`;
  configText += ` | ${state.shelves} полок`;
  configText += ` | ${state.doors} створок (${doorTypeLabel} ${doorSize}см)`;

  if (state.sideShelf) {
    configText += ` | боковая полка ${state.sideShelfSide === 'left' ? 'слева' : 'справа'} ${state.sideShelfWidth}см (${state.sideShelves} полок)`;
  }

  configText += ` | ${getMainColorName()}`;

  if (state.doorType === 'ldsp' && state.separateDoorColor) {
    configText += ` / створки: ${getDoorColorName()}`;
  }

  configText += ` | ${fmt(p.total)} ₽`;

  document.getElementById('modalConfig').textContent = configText;
}


/** Закрыть модальное окно */
function closeModal() {
  document.getElementById('modalOverlay').classList.remove('show');
}


/** Отправить заявку */
function sendOrder() {

    const consent = document.getElementById('consentCheckbox');
    const consentError = document.getElementById('consentError');
  
    if (!consent || !consent.checked) {
        if (consentError) consentError.style.display = 'block';
        if (consent) consent.parentElement.classList.add('error');
        return;
    }
    
    if (consentError) consentError.style.display = 'none';
    if (consent) consent.parentElement.classList.remove('error');

  const name = document.getElementById('inputName').value.trim();
  const phone = document.getElementById('inputPhone').value.trim();
  const comment = document.getElementById('inputComment').value.trim();

  if (!name || !phone) {
    alert('Пожалуйста, укажите имя и телефон.');
    return;
  }

  const p = calculatePrice();
  const sideSectionCm = state.sideShelf ? (state.sideShelfWidth + CONFIG.dividerThickness) : 0;

  const payload = {
    name,
    phone,
    comment,
    config: {
      nicheWidth: state.width,
      nicheHeight: state.height,
      nicheDepth: state.depth,
      mainSectionWidth: +(state.width - sideSectionCm).toFixed(1),
      shelves: state.shelves,
      doors: state.doors,
      doorType: state.doorType,
      doorWidthCm: getDoorWidthCm(),
      doorHeightCm: getDoorHeightCm(),
      mainColor: state.doorType === 'jaluzi' ? 'pine' : state.mainColorId,
      mainColorName: getMainColorName(),
      doorColor: state.doorType === 'jaluzi' ? 'pine' : (state.separateDoorColor ? state.doorColorId : state.mainColorId),
      doorColorName: getDoorColorName(),
      separateDoorColor: state.separateDoorColor && state.doorType === 'ldsp',
      sideShelf: state.sideShelf,
      sideShelfSide: state.sideShelfSide,
      sideShelfWidth: state.sideShelfWidth,
      sideShelves: state.sideShelves,
    },
    price: p,
    timestamp: new Date().toISOString(),
  };

  console.log('📤 Отправка заявки:', payload);

  fetch(CONFIG.orderEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  .then(res => {
    if (res.ok) {
      alert('Заявка отправлена! Я свяжусь с вами в ближайшее время.');
    } else {
      alert('Заявка сформирована (сервер пока не подключён). Данные в консоли.');
    }
    closeModal();
  })
  .catch(() => {
    alert('Заявка сформирована (сервер не доступен). Данные в консоли (F12).');
    closeModal();
  });
}