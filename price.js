function fmt(n) {
  return Number(n).toLocaleString('ru-RU', { maximumFractionDigits: 0 });
}
function calculatePrice() {
  const P = CONFIG.prices;

  // Материалы
  const matBaseBody = P.materials.baseBody[state.bodyType];
  const matBaseDoors = P.materials.baseDoors[state.doorType];
  const overW = Math.max(0, state.width  - P.materials.sizeBase.w);
  const overH = Math.max(0, state.height - P.materials.sizeBase.h);
  const overD = Math.max(0, state.depth  - P.materials.sizeBase.d);
  const matExtra = (overW + overH + overD) * P.materials.sizeOverPerCm;
  const materials = matBaseBody + matBaseDoors + matExtra;

  // Распил/сборка/монтаж
  const overCount =
    (state.width  > P.assemblyLimit.w ? 1 : 0) +
    (state.height > P.assemblyLimit.h ? 1 : 0) +
    (state.depth  > P.assemblyLimit.d ? 1 : 0);
  const assembly = P.assemblyBase + overCount * P.assemblyOverFee;

  // Выезд
  const visit = P.visit;

  const total = materials + assembly + visit;

  return {
    materials: Math.round(materials),
    assembly: Math.round(assembly),
    visit: Math.round(visit),
    total: Math.round(total),
  };
}

function renderPrice() {
  const p = calculatePrice();

  const lines = `
    <h3>Расчёт стоимости</h3>
    <div class="price-line"><span>Материалы*</span><span>${fmt(p.materials)} ₽</span></div>
    <div class="price-line"><span>Распил, сборка, монтаж</span><span>${fmt(p.assembly)} ₽</span></div>
    <div class="price-line"><span>Выезд на объект</span><span>${fmt(p.visit)} ₽</span></div>
    <div class="price-line"><span>Черновая уборка/вынос мусора</span><span><u>Бесплатно</u></span></div>
    <div class="price-total"><span>Итого</span><span>${fmt(p.total)} ₽</span></div>
    <div class="price-note">
      *Материалы — приблизительная стоимость. Точный расчёт после обработки заявки мастером/менеджером.
      Цена зависит от фурнитуры и текущих цен поставщиков (Лемана.про, Петрович и др.).
      Материалы в стандартном виде заказываются самостоятельно. Менеджер соберёт корзину и отправит ссылку.
    </div>
  `;

  document.getElementById('priceBlock').innerHTML = lines;
}