// Genera datos/respaldo-AAAA-MM-DD.json: agregado por municipio × artículo y municipio × año.
// Uso: node scripts/generar-respaldo.mjs   (necesita Internet; Node 20+ trae fetch)
import { writeFile } from 'node:fs/promises';
import { urlConsulta, consultaCatalogo, consultaResumen } from '../js/soql.js';
import { parsearCatalogo, construirRespaldo } from '../js/agregar.js';

const pedir = async (url) => {
  const r = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!r.ok) throw new Error(`HTTP ${r.status} en ${url}`);
  return r.json();
};

const [cat, filasArticulo, filasAnio, [res]] = await Promise.all([
  pedir(consultaCatalogo()),
  pedir(urlConsulta({ select: 'cod_muni,descripcion_conducta,sum(cantidad) as n', group: 'cod_muni,descripcion_conducta', limit: 50000 })),
  pedir(urlConsulta({ select: 'cod_muni,date_extract_y(fecha_hecho) as anio,sum(cantidad) as n', group: 'cod_muni,anio', limit: 50000 })),
  pedir(consultaResumen()),
]);

const generado = new Date().toISOString();
const resumen = { total: Number(res.n), filas: Number(res.filas), desde: res.desde.slice(0, 10), hasta: res.hasta.slice(0, 10) };
const r = construirRespaldo({ catalogo: parsearCatalogo(cat), filasArticulo, filasAnio, resumen, generado });
const ruta = new URL(`../datos/respaldo-${generado.slice(0, 10)}.json`, import.meta.url);
await writeFile(ruta, JSON.stringify(r));
console.log(`OK ${ruta.pathname}: ${r.municipios.length} municipios, ${resumen.total} casos, ${resumen.desde} a ${resumen.hasta}`);
