function fmt(n) {
  return Number(n).toLocaleString('ru-RU', { maximumFractionDigits: 0 });
}
function calculatePrice() {
  const P = CONFIG.prices;

  const matBaseBody = P.materials.baseBody[state.bodyType];
  const matBaseDoors = P.materials.baseDoors[state.doorType];

  const overW = Math.max(0, state.width  - P.materials.sizeBase.w);
  const overH = Math.max(0, state.height - P.materials.sizeBase.h);
  const overD = Math.max(0, state.depth  - P.materials.sizeBase.d);
  const matExtra = (overW + overH + overD) * P.materials.sizeOverPerCm;

  // Разбивка материалов (заглушка)
  const materialsBody     = matBaseBody + matExtra * 0.5;
  const materialsDoors    = matBaseDoors + matExtra * 0.4;
  const materialsHardware = P.materials.hardwareFixed;

  const materials = matBaseBody + matBaseDoors + matExtra + materialsHardware;

  const overCount =
    (state.width  > P.assemblyLimit.w ? 1 : 0) +
    (state.height > P.assemblyLimit.h ? 1 : 0) +
    (state.depth  > P.assemblyLimit.d ? 1 : 0);
  const assembly = P.assemblyBase + overCount * P.assemblyOverFee;

  const visit = P.visit;
  const total = materials + assembly + visit;

  return {
    materialsBody: Math.round(matBaseBody + matExtra * 0.5),
    materialsDoors: Math.round(matBaseDoors + matExtra * 0.4),
    materialsHardware: Math.round(materialsHardware),
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

    <div class="price-line"><span>Материал корпуса</span><span>${fmt(p.materialsBody)} ₽</span></div>
    <div class="price-line"><span>Материал створок</span><span>${fmt(p.materialsDoors)} ₽</span></div>
    <div class="price-line"><span>Фурнитура и соединения</span><span>${fmt(p.materialsHardware)} ₽</span></div>

    <div class="price-line price-subtotal"><span>Материалы, всего*</span><span>${fmt(p.materials)} ₽</span></div>
    
     <div class="price-line"><span>Распил, сборка, монтаж</span><span>${fmt(p.assembly)} ₽</span></div>
    <div class="price-line"><span>Выезд на объект</span><span>${fmt(p.visit)} ₽</span></div>
    <div class="price-line"><span>Черновая уборка/вынос мусора</span><span><u>Бесплатно</u></span></div>
    <div class="price-total"><span>Итого</span><span>${fmt(p.total)} ₽</span></div>

    <div class="price-note">
      *Ориентировочная стоимость. Точный расчёт после обработки заявки мастером/менеджером.
       Материалы заказываются самостоятельно. Мастер соберёт корзину и отправит ссылку для заказа.
    </div>
    <div class="consent-block">
        <label class="consent-label">
            <input type="checkbox" id="consentCheckbox">
            <span>Согласен с <a href="policy.html" target="_blank">политикой обработки персональных данных</a></span>
        </label>
        <div id="consentError" class="consent-error" style="display:none;">
            Необходимо согласие на обработку персональных данных
        </div>
    </div>
  `;

  document.getElementById('priceBlock').innerHTML = lines;
}