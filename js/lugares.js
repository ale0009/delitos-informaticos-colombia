// Índice de búsqueda de municipios y departamentos (tolerante a tildes y mayúsculas).
// Hay nombres de municipio repetidos en varios departamentos: la clave siempre es municipio + departamento.
import { plegar as normalizar, titulo } from './texto.js';

const SEP = ' · ';

/** Etiqueta visible y única: "Medellin · Antioquia" o "Antioquia (departamento)". */
export function etiqueta(lugar) {
  if (!lugar || lugar.tipo === 'nacional') return 'Colombia (todo el país)';
  if (lugar.tipo === 'departamento') return `${titulo(lugar.departamento)} (departamento)`;
  return `${titulo(lugar.municipio)}${SEP}${titulo(lugar.departamento)}`;
}

/** catálogo (de agregar.parsearCatalogo) → entradas buscables de municipios y departamentos. */
export function construirIndice(catalogo) {
  const entradas = [];
  const deptos = new Map();
  for (const c of catalogo ?? []) {
    const lugar = { tipo: 'municipio', municipio: c.municipio, departamento: c.departamento };
    entradas.push({ lugar, clave: normalizar(c.municipio), completa: normalizar(etiqueta(lugar)), total: c.total });
    const d = deptos.get(c.departamento) ?? { total: 0, municipios: 0 };
    d.total += c.total;
    d.municipios += 1;
    deptos.set(c.departamento, d);
  }
  for (const [departamento, { total, municipios }] of deptos) {
    const lugar = { tipo: 'departamento', departamento };
    // Un "departamento" de un solo municipio (Bogotá D.C.) se trata como municipio al desempatar.
    entradas.push({ lugar, clave: normalizar(departamento), completa: normalizar(etiqueta(lugar)), total, comoMunicipio: municipios === 1 });
  }
  return entradas;
}

/**
 * Texto libre → { lugar, alternativas } o null.
 * Preferencia: etiqueta completa exacta > nombre exacto > empieza por > contiene.
 * Ante el mismo nombre, el departamento va antes que el municipio (salvo que se escriba «municipio»)
 * y, entre municipios homónimos, el de más casos; los demás quedan en `alternativas`.
 */
export function resolverLugar(texto, indice) {
  const q = normalizar(texto);
  if (!q) return null;
  if (['COLOMBIA', 'NACIONAL', 'TODO EL PAIS', 'COLOMBIA TODO EL PAIS'].includes(q)) return { lugar: { tipo: 'nacional' }, alternativas: [] };

  const exacta = indice.find((e) => e.completa === q);
  if (exacta) return { lugar: exacta.lugar, alternativas: [] };

  // "Barbosa, Santander" o "Barbosa Santander": municipio + departamento escritos a mano.
  const conDepto = indice.filter((e) => e.lugar.tipo === 'municipio' && (q === `${e.clave} ${normalizar(e.lugar.departamento)}`));
  if (conDepto.length) return { lugar: conDepto[0].lugar, alternativas: [] };

  // Con el mismo nombre exacto gana el departamento («Caldas», «Nariño»), salvo que se escriba «municipio».
  const quiereMuni = /\bMUNICIPIO\b/.test(q);
  // (Bogotá: departamento y municipio son lo mismo; ahí se prefiere el municipio.)
  const qs = q.replace(/\b(DEPARTAMENTO|MUNICIPIO)\b/g, '').replace(/^\s*DE[L]?\s+/, '').replace(/\s+DE[L]?\s*$/, '').trim() || q;
  const pref = (a, b) => {
    const esMuni = (e) => e.lugar.tipo === 'municipio' || !!e.comoMunicipio;
    const pa = esMuni(a) === quiereMuni ? 0 : 1;
    const pb = esMuni(b) === quiereMuni ? 0 : 1;
    return pa - pb || b.total - a.total;
  };
  const capas = [
    indice.filter((e) => e.clave === qs),
    indice.filter((e) => e.clave.startsWith(qs)),
    indice.filter((e) => e.completa.includes(qs)),
  ];
  for (const capa of capas) {
    if (capa.length) {
      capa.sort(pref);
      return { lugar: capa[0].lugar, alternativas: capa.slice(1, 6).map((e) => e.lugar) };
    }
  }
  return null;
}

/** Sugerencias para la lista desplegable (máx. n): primero las que empiezan por el texto, luego las de más casos. */
export function sugerencias(texto, indice, n = 8) {
  const q = normalizar(texto);
  if (!q) return [];
  return indice
    .filter((e) => e.completa.includes(q))
    .sort((a, b) => (Number(b.clave.startsWith(q)) - Number(a.clave.startsWith(q))) || b.total - a.total)
    .slice(0, n)
    .map((e) => e.lugar);
}

export const mismoLugar = (a, b) => !!a && !!b && a.tipo === b.tipo
  && (a.municipio ?? '') === (b.municipio ?? '') && (a.departamento ?? '') === (b.departamento ?? '');

/** Hash estable para compartir: #m=MEDELLIN|ANTIOQUIA, #d=ANTIOQUIA, #n. */
export function aHash(lugar) {
  if (!lugar || lugar.tipo === 'nacional') return '#n';
  if (lugar.tipo === 'departamento') return `#d=${encodeURIComponent(lugar.departamento)}`;
  return `#m=${encodeURIComponent(lugar.municipio)}|${encodeURIComponent(lugar.departamento)}`;
}

export function deHash(hash) {
  const h = String(hash ?? '').replace(/^#/, '');
  if (h === 'n') return { tipo: 'nacional' };
  try {
    if (h.startsWith('d=') && h.length > 2) return { tipo: 'departamento', departamento: decodeURIComponent(h.slice(2)) };
    if (h.startsWith('m=')) {
      const [m, d] = h.slice(2).split('|').map(decodeURIComponent);
      if (m && d) return { tipo: 'municipio', municipio: m, departamento: d };
    }
  } catch { /* hash mal formado */ }
  return null;
}
