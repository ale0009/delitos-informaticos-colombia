// Agregaciones puras sobre las respuestas de la API (o del respaldo guardado).
import { codigoArticulo, CODIGOS } from './ley1273.js';

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/** Filas {cod_muni, municipio, cod_depto, departamento, n} → catálogo ordenado por total. */
export function parsearCatalogo(filas) {
  return (filas ?? [])
    .filter((f) => f && f.municipio)
    .map((f) => ({ cod: f.cod_muni ?? '', municipio: f.municipio, codDepto: f.cod_depto ?? '', departamento: f.departamento ?? '', total: num(f.n) }))
    .sort((a, b) => b.total - a.total || a.municipio.localeCompare(b.municipio));
}

/** Suma el catálogo por departamento → [{departamento, codDepto, total, municipios}] de mayor a menor. */
export function departamentos(catalogo) {
  const m = new Map();
  for (const c of catalogo ?? []) {
    const d = m.get(c.departamento) ?? { departamento: c.departamento, codDepto: c.codDepto, total: 0, municipios: 0 };
    d.total += c.total;
    d.municipios += 1;
    m.set(c.departamento, d);
  }
  return [...m.values()].sort((a, b) => b.total - a.total || a.departamento.localeCompare(b.departamento));
}

/** Filas {descripcion_conducta, n} → { porCodigo: {269A: n…}, total, sinCodigo }. Suma si un artículo viene repetido. */
export function porArticulo(filas) {
  const porCodigo = Object.fromEntries(CODIGOS.map((c) => [c, 0]));
  let total = 0;
  let sinCodigo = 0;
  for (const f of filas ?? []) {
    const n = num(f.n);
    total += n;
    const c = codigoArticulo(f.descripcion_conducta);
    if (c) porCodigo[c] += n; else sinCodigo += n;
  }
  return { porCodigo, total, sinCodigo };
}

/** Filas {anio, n} → [{anio, n}] continuo (rellena con 0 los años sin casos). */
export function porAnio(filas, desde = null, hasta = null) {
  const m = new Map();
  for (const f of filas ?? []) {
    const a = parseInt(f.anio, 10);
    if (Number.isFinite(a)) m.set(a, (m.get(a) ?? 0) + num(f.n));
  }
  if (!m.size && (desde == null || hasta == null)) return [];
  const anios = [...m.keys()];
  const ini = desde ?? Math.min(...anios);
  const fin = hasta ?? Math.max(...anios);
  const out = [];
  for (let a = ini; a <= fin; a++) out.push({ anio: a, n: m.get(a) ?? 0 });
  return out;
}

/** {269A: n…} → [{codigo, n, parte}] de mayor a menor, sin ceros. */
export function ranking(porCodigo) {
  const total = Object.values(porCodigo ?? {}).reduce((s, n) => s + n, 0);
  return Object.entries(porCodigo ?? {})
    .filter(([, n]) => n > 0)
    .map(([codigo, n]) => ({ codigo, n, parte: total ? n / total : 0 }))
    .sort((a, b) => b.n - a.n || a.codigo.localeCompare(b.codigo));
}

/**
 * Nivel de amenaza 1–5 según el percentil del total entre sus pares (calculado aquí).
 * percentil = fracción de pares con MENOS casos; puesto = 1 + pares con MÁS casos. Cortes: 50 %, 75 %, 90 %, 98 %.
 */
export function nivelAmenaza(total, totalesPares) {
  const pares = (totalesPares ?? []).filter((t) => Number.isFinite(t));
  if (!pares.length) return { nivel: 1, percentil: 0, puesto: 1, de: 0 };
  const menores = pares.filter((t) => t < total).length;
  const puesto = pares.filter((t) => t > total).length + 1;
  const percentil = menores / pares.length;
  const nivel = percentil >= 0.98 ? 5 : percentil >= 0.9 ? 4 : percentil >= 0.75 ? 3 : percentil >= 0.5 ? 2 : 1;
  return { nivel, percentil, puesto, de: pares.length };
}

export const NOMBRES_NIVEL = ['', 'Bajo', 'Moderado', 'Alto', 'Muy alto', 'Crítico'];

/** Compara con el promedio de sus pares: { promedio, razon } (razon = total / promedio). */
export function compararPromedio(total, totalNacional, unidades) {
  const promedio = unidades > 0 ? totalNacional / unidades : 0;
  return { promedio, razon: promedio > 0 ? total / promedio : 0 };
}

/** Peso de cada artículo aquí frente al país: [{codigo, local, nacional, diferencia}] (en fracciones). */
export function perfil(localPorCodigo, nacionalPorCodigo) {
  const tl = Object.values(localPorCodigo ?? {}).reduce((s, n) => s + n, 0);
  const tn = Object.values(nacionalPorCodigo ?? {}).reduce((s, n) => s + n, 0);
  return CODIGOS.map((codigo) => {
    const local = tl ? (localPorCodigo[codigo] ?? 0) / tl : 0;
    const nacional = tn ? (nacionalPorCodigo[codigo] ?? 0) / tn : 0;
    return { codigo, local, nacional, diferencia: local - nacional };
  });
}

/** Resumen de la serie anual: pico, último año completo y su cambio frente al anterior. */
export function tendencia(serie, anioParcial = null) {
  if (!serie?.length) return null;
  const completos = serie.filter((s) => s.anio !== anioParcial);
  const pico = [...completos].sort((a, b) => b.n - a.n)[0] ?? serie[0];
  const ultimo = completos.at(-1) ?? null;
  const previo = completos.at(-2) ?? null;
  const cambio = ultimo && previo && previo.n > 0 ? (ultimo.n - previo.n) / previo.n : null;
  return { pico, ultimo, previo, cambio };
}

/* ---------- respaldo (JSON agregado y fechado) ---------- */

/** Construye el respaldo compacto a partir de filas por municipio×artículo y municipio×año. */
export function construirRespaldo({ catalogo, filasArticulo, filasAnio, resumen, generado }) {
  const anios = [...new Set(filasAnio.map((f) => parseInt(f.anio, 10)).filter(Number.isFinite))].sort((a, b) => a - b);
  const desde = anios[0];
  const hasta = anios.at(-1);
  const idx = new Map(catalogo.map((c, i) => [c.cod, i]));
  const art = catalogo.map(() => CODIGOS.map(() => 0));
  const ani = catalogo.map(() => Array(hasta - desde + 1).fill(0));
  for (const f of filasArticulo) {
    const i = idx.get(f.cod_muni);
    const c = CODIGOS.indexOf(codigoArticulo(f.descripcion_conducta));
    if (i != null && c >= 0) art[i][c] += num(f.n);
  }
  for (const f of filasAnio) {
    const i = idx.get(f.cod_muni);
    const a = parseInt(f.anio, 10);
    if (i != null && Number.isFinite(a)) ani[i][a - desde] += num(f.n);
  }
  return {
    generado,
    fuente: `https://www.datos.gov.co/resource/4v6r-wu98.json`,
    licencia: 'CC BY-SA 4.0 (datos de MinDefensa en datos.gov.co); agregado por municipio, artículo y año',
    resumen,
    codigos: CODIGOS,
    desde,
    hasta,
    municipios: catalogo.map((c, i) => [c.cod, c.municipio, c.codDepto, c.departamento, art[i], ani[i]]),
  };
}

/** Catálogo a partir del respaldo. */
export function catalogoRespaldo(r) {
  return parsearCatalogo(r.municipios.map(([cod, municipio, codDepto, departamento, a]) => ({
    cod_muni: cod, municipio, cod_depto: codDepto, departamento, n: a.reduce((s, n) => s + n, 0),
  })));
}

function coincide(lugar, fila) {
  if (!lugar || lugar.tipo === 'nacional') return true;
  if (lugar.tipo === 'departamento') return fila[3] === lugar.departamento;
  return fila[1] === lugar.municipio && (!lugar.departamento || fila[3] === lugar.departamento);
}

/** Ficha de un lugar desde el respaldo, con la misma forma que la de la API: { articulos, anios }. */
export function fichaRespaldo(r, lugar) {
  const porCodigo = Object.fromEntries(r.codigos.map((c) => [c, 0]));
  const serie = Array(r.hasta - r.desde + 1).fill(0);
  let total = 0;
  for (const f of r.municipios) {
    if (!coincide(lugar, f)) continue;
    f[4].forEach((n, i) => { porCodigo[r.codigos[i]] += n; total += n; });
    f[5].forEach((n, i) => { serie[i] += n; });
  }
  return {
    articulos: { porCodigo, total, sinCodigo: 0 },
    anios: serie.map((n, i) => ({ anio: r.desde + i, n })),
  };
}
