// Carga de datos (navegador): API SoQL de datos.gov.co con tiempo límite y respaldo local fechado.
import { consultaCatalogo, consultaResumen, consultaArticulos, consultaAnios } from './soql.js';
import { parsearCatalogo, porArticulo, porAnio, catalogoRespaldo, fichaRespaldo } from './agregar.js';

export const RESPALDO = { ruta: 'datos/respaldo-2026-11-10.json', fecha: '10 nov 2026' };
const LIMITE_MS = 15000;

function motivo(err) {
  if (err?.name === 'AbortError') return 'datos.gov.co tardó más de 15 s en responder';
  if (err?.estado) return `datos.gov.co respondió con el código HTTP ${err.estado}`;
  if (err instanceof TypeError) return 'no hay conexión o el navegador bloqueó la petición';
  return err?.message || 'error desconocido';
}

async function pedirJSON(url, senal) {
  const r = await fetch(url, { signal: senal, headers: { Accept: 'application/json' } });
  if (!r.ok) throw Object.assign(new Error(`HTTP ${r.status}`), { estado: r.status });
  return r.json();
}

async function conLimite(fn) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), LIMITE_MS);
  try { return await fn(ctl.signal); } finally { clearTimeout(t); }
}

let respaldoCache = null;
async function respaldo(base) {
  respaldoCache ??= pedirJSON(`${base}${RESPALDO.ruta}`);
  return respaldoCache;
}

const forzado = () => new URLSearchParams(globalThis.location?.search ?? '').has('sin-conexion');

/**
 * Datos de arranque: { catalogo, resumen, nacional: {articulos, anios}, origen: 'vivo'|'respaldo', error }.
 */
export async function cargarBase(base = '') {
  let error = 'modo sin conexión forzado con ?sin-conexion';
  if (!forzado()) {
    try {
      return await conLimite(async (s) => {
        const nac = { tipo: 'nacional' };
        const [cat, [res], art, ani] = await Promise.all([
          pedirJSON(consultaCatalogo(), s), pedirJSON(consultaResumen(), s),
          pedirJSON(consultaArticulos(nac), s), pedirJSON(consultaAnios(nac), s),
        ]);
        return {
          catalogo: parsearCatalogo(cat),
          resumen: { total: Number(res.n), filas: Number(res.filas), desde: res.desde.slice(0, 10), hasta: res.hasta.slice(0, 10) },
          nacional: { articulos: porArticulo(art), anios: porAnio(ani) },
          origen: 'vivo',
          error: null,
        };
      });
    } catch (e) {
      error = motivo(e);
    }
  }
  const r = await respaldo(base);
  return { catalogo: catalogoRespaldo(r), resumen: r.resumen, nacional: fichaRespaldo(r, { tipo: 'nacional' }), origen: 'respaldo', error };
}

/** Ficha de un lugar: { articulos, anios, origen, error }. Si la API falla, usa el respaldo. */
export async function cargarFicha(lugar, ctx, base = '') {
  if (lugar.tipo === 'nacional') return { ...ctx.nacional, origen: ctx.origen, error: null };
  if (ctx.origen === 'vivo') {
    try {
      return await conLimite(async (s) => {
        const [art, ani] = await Promise.all([pedirJSON(consultaArticulos(lugar), s), pedirJSON(consultaAnios(lugar), s)]);
        const desde = ctx.nacional.anios[0]?.anio ?? null;
        const hasta = ctx.nacional.anios.at(-1)?.anio ?? null;
        return { articulos: porArticulo(art), anios: porAnio(ani, desde, hasta), origen: 'vivo', error: null };
      });
    } catch (e) {
      const r = await respaldo(base);
      return { ...fichaRespaldo(r, lugar), origen: 'respaldo', error: motivo(e) };
    }
  }
  const r = await respaldo(base);
  return { ...fichaRespaldo(r, lugar), origen: 'respaldo', error: ctx.error };
}
