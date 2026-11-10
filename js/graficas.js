// Gráficas SVG propias (cadenas de texto puras: se pueden probar sin navegador).
import { miles } from './texto.js';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/** Escala "bonita" para el eje Y: máximo redondeado a 1, 2 o 5 × 10^k. */
export function techo(max) {
  if (!(max > 0)) return 1;
  const p = 10 ** Math.floor(Math.log10(max));
  for (const m of [1, 2, 5, 10]) if (m * p >= max) return m * p;
  return 10 * p;
}

/**
 * Barras verticales de la serie anual.
 * opciones: { parcial: año incompleto (rayado), titulo, ancho, alto }
 */
export function svgTendencia(serie, { parcial = null, titulo = 'Casos por año', ancho = 640, alto = 260 } = {}) {
  if (!serie?.length) return `<p class="vacio">Sin casos registrados.</p>`;
  const m = { izq: 52, der: 10, arr: 14, aba: 30 };
  const w = ancho - m.izq - m.der;
  const h = alto - m.arr - m.aba;
  const top = techo(Math.max(...serie.map((s) => s.n)));
  const paso = w / serie.length;
  const bw = Math.max(2, paso * 0.72);
  const y = (v) => m.arr + h - (v / top) * h;
  const maxN = Math.max(...serie.map((s) => s.n));
  const cada = serie.length > 14 ? 4 : serie.length > 8 ? 2 : 1;
  let s = `<svg class="grafica" viewBox="0 0 ${ancho} ${alto}" role="img" aria-label="${esc(titulo)}">`;
  s += `<defs><pattern id="rayado" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" class="g-raya-fondo"/><line x1="0" y1="0" x2="0" y2="6" class="g-raya"/></pattern></defs>`;
  for (let i = 0; i <= 4; i++) {
    const v = (top / 4) * i;
    s += `<line class="g-reji" x1="${m.izq}" x2="${ancho - m.der}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}"/>`;
    s += `<text class="g-eje" x="${m.izq - 6}" y="${(y(v) + 4).toFixed(1)}" text-anchor="end">${miles(v)}</text>`;
  }
  serie.forEach((p, i) => {
    const x = m.izq + i * paso + (paso - bw) / 2;
    const cls = p.anio === parcial ? 'g-barra g-parcial' : p.n === maxN ? 'g-barra g-dest' : 'g-barra';
    const hh = Math.max(p.n > 0 ? 1.5 : 0, (p.n / top) * h);
    s += `<rect class="${cls}" x="${x.toFixed(1)}" y="${(m.arr + h - hh).toFixed(1)}" width="${bw.toFixed(1)}" height="${hh.toFixed(1)}"><title>${p.anio}: ${miles(p.n)} casos${p.anio === parcial ? ' (año incompleto)' : ''}</title></rect>`;
    if ((serie.length - 1 - i) % cada === 0) {
      s += `<text class="g-eje" x="${(x + bw / 2).toFixed(1)}" y="${alto - 10}" text-anchor="middle">${p.anio}</text>`;
    }
  });
  s += `<line class="g-base" x1="${m.izq}" x2="${ancho - m.der}" y1="${m.arr + h}" y2="${m.arr + h}"/></svg>`;
  return s;
}

/** Barras horizontales: filas [{etiqueta, n, destacado?}]. */
export function svgBarrasH(filas, { titulo = 'Casos', ancho = 640, alto_fila = 30 } = {}) {
  if (!filas?.length) return `<p class="vacio">Sin datos.</p>`;
  const izq = 250;
  const der = 70;
  const alto = filas.length * alto_fila + 8;
  const top = Math.max(...filas.map((f) => f.n)) || 1;
  const w = ancho - izq - der;
  let s = `<svg class="grafica" viewBox="0 0 ${ancho} ${alto}" role="img" aria-label="${esc(titulo)}">`;
  filas.forEach((f, i) => {
    const y = 4 + i * alto_fila;
    const bw = Math.max(1.5, (f.n / top) * w);
    s += `<text class="g-eti" x="${izq - 8}" y="${y + alto_fila / 2 + 4}" text-anchor="end">${esc(f.etiqueta)}</text>`;
    s += `<rect class="g-barra${f.destacado ? ' g-dest' : ''}" x="${izq}" y="${y + 4}" width="${bw.toFixed(1)}" height="${alto_fila - 10}"/>`;
    s += `<text class="g-num" x="${(izq + bw + 6).toFixed(1)}" y="${y + alto_fila / 2 + 4}">${miles(f.n)}</text>`;
  });
  return `${s}</svg>`;
}
