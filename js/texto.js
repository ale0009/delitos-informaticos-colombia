// Utilidades de texto puras: normalizar nombres de lugares y darles formato legible.

/** "  Medellín " → "MEDELLIN"; "Bogotá, D.C." → "BOGOTA DC". Quita tildes (no la Ñ), signos y espacios dobles. */
export function normalizar(s) {
  return String(s ?? '')
    .replace(/ñ/g, '\u0000').replace(/Ñ/g, '\u0000')     // proteger la Ñ
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\u0000/g, 'Ñ')
    .toUpperCase()
    .replace(/[.,;:()'"´`’]/g, '')
    .replace(/[-_/]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Clave de búsqueda: como normalizar, pero además Ñ → N (quien escribe «Narino» busca «Nariño»). */
export function plegar(s) {
  return normalizar(s).replace(/Ñ/g, 'N');
}

const MENORES = new Set(['DE', 'DEL', 'LA', 'LAS', 'LOS', 'EL', 'Y', 'E', 'EN']);

/** "SAN JOSE DE LA MONTAÑA" → "San Jose de la Montaña"; respeta "D.C." */
export function titulo(s) {
  return String(s ?? '').trim().split(/\s+/).map((p, i) => {
    const u = p.toUpperCase();
    if (u === 'D.C.' || u === 'DC') return 'D.C.';
    if (i > 0 && MENORES.has(u)) return u.toLowerCase();
    return u.charAt(0) + u.slice(1).toLowerCase();
  }).join(' ');
}

/** Número con separador de miles colombiano: 268144 → "268.144". */
export function miles(n) {
  const v = Math.round(Number(n) || 0);
  const s = String(Math.abs(v)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return v < 0 ? `-${s}` : s;
}

/** Porcentaje con coma decimal: 0.4567 → "45,7 %". */
export function pct(x, dec = 1) {
  return `${(x * 100).toFixed(dec).replace('.', ',')} %`;
}

/** Decimal con coma: 2.345 → "2,3". */
export function dec(x, d = 1) {
  return Number(x).toFixed(d).replace('.', ',');
}
