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

document.getElementById('btnDownload').addEventListener('click', exportJPG);

function exportJPG(){
  const svg = document.getElementById('cabinetSVG');
  const info = document.getElementById('infoPanel').innerText.trim();

  // размеры из viewBox
  const vb = svg.viewBox.baseVal;
  const svgW = vb && vb.width  ? vb.width  : svg.getBoundingClientRect().width;
  const svgH = vb && vb.height ? vb.height : svg.getBoundingClientRect().height;

  // клон с явными размерами
  const clone = svg.cloneNode(true);
  clone.setAttribute('width', svgW);
  clone.setAttribute('height', svgH);

  const svgData = new XMLSerializer().serializeToString(clone);
  const svgBlob = new Blob([svgData], {type:'image/svg+xml;charset=utf-8'});
  const url = URL.createObjectURL(svgBlob);

  const img = new Image();
  img.onload = () => {
    const pad = 24;
    const fontSize = 11;
    const lineH = 14;
    const scale = 3;

    const canvas = document.createElement('canvas');
    let ctx = canvas.getContext('2d');

    ctx.font = `${fontSize}px Arial`;
    const lines = wrapText(ctx, info, svgW - pad*2);
    const extraH = info ? (lines.length*lineH + pad*2) : 0;

    canvas.width  = svgW * scale;
    canvas.height = (svgH + extraH) * scale;

    ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.scale(scale, scale);

    ctx.fillStyle = '#fff';
    ctx.fillRect(0,0,canvas.width/scale,canvas.height/scale);
    ctx.drawImage(img, 0, 0, svgW, svgH);

    if(info){
      ctx.fillStyle = '#222';
      ctx.font = `${fontSize}px Arial`;
      ctx.textBaseline = 'top';
      let y = svgH + pad;
      lines.forEach(line => {
        ctx.fillText(line, pad, y);
        y += lineH;
      });
    }

    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/jpeg', 0.98);
    a.download = 'cabinet.jpg';
    a.click();

    URL.revokeObjectURL(url);
  };
  img.src = url;
}

function wrapText(ctx, text, maxWidth){
  if(!text) return [];
  const words = text.replace(/\s+/g,' ').split(' ');
  const lines = [];
  let line = '';
  words.forEach(w => {
    const test = line ? `${line} ${w}` : w;
    if(ctx.measureText(test).width > maxWidth){
      if(line) lines.push(line);
      line = w;
    } else line = test;
  });
  if(line) lines.push(line);
  return lines;
}