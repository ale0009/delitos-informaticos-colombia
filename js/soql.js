// Construcción de consultas SoQL para el dataset 4v6r-wu98 de datos.gov.co (Socrata).
// SoQL es el "SQL" de Socrata: se manda por la URL con $select, $where, $group, $order y $limit.

export const DATASET = '4v6r-wu98';
export const BASE = `https://www.datos.gov.co/resource/${DATASET}.json`;

/** Literal de texto SoQL: entre comillas simples, y cada comilla simple se duplica ('' ). */
export function literal(texto) {
  return `'${String(texto ?? '').replace(/'/g, "''")}'`;
}

/** Arma la URL; omite partes vacías. El orden de parámetros es fijo para que sea predecible. */
export function urlConsulta({ select, where, group, order, limit } = {}, base = BASE) {
  const p = new URLSearchParams();
  if (select) p.set('$select', select);
  if (where) p.set('$where', where);
  if (group) p.set('$group', group);
  if (order) p.set('$order', order);
  if (limit) p.set('$limit', String(limit));
  const q = p.toString();
  return q ? `${base}?${q}` : base;
}

/**
 * Filtro $where de un lugar.
 * lugar = { tipo: 'municipio', municipio, departamento } | { tipo: 'departamento', departamento } | { tipo: 'nacional' }
 * Los nombres se comparan tal como vienen en el dataset (MAYÚSCULAS sin tildes), escapados.
 */
export function filtroLugar(lugar) {
  if (!lugar || lugar.tipo === 'nacional') return '';
  if (lugar.tipo === 'departamento') return `departamento=${literal(lugar.departamento)}`;
  if (lugar.tipo === 'municipio') {
    const m = `municipio=${literal(lugar.municipio)}`;
    return lugar.departamento ? `${m} AND departamento=${literal(lugar.departamento)}` : m;
  }
  throw new Error(`tipo de lugar desconocido: ${lugar.tipo}`);
}

const SUMA = 'sum(cantidad) as n';

/** Casos por artículo (descripcion_conducta) en un lugar. */
export function consultaArticulos(lugar) {
  return urlConsulta({ select: `descripcion_conducta,${SUMA}`, where: filtroLugar(lugar), group: 'descripcion_conducta', order: 'n DESC', limit: 50 });
}

/** Casos por año del hecho en un lugar. */
export function consultaAnios(lugar) {
  return urlConsulta({ select: `date_extract_y(fecha_hecho) as anio,${SUMA}`, where: filtroLugar(lugar), group: 'anio', order: 'anio', limit: 100 });
}

/** Catálogo de municipios con su total (sirve para buscar, para el ranking y para el «nivel»). */
export function consultaCatalogo() {
  return urlConsulta({ select: `cod_muni,municipio,cod_depto,departamento,${SUMA}`, group: 'cod_muni,municipio,cod_depto,departamento', order: 'n DESC', limit: 5000 });
}

/** Resumen: total, filas y fechas extremas. */
export function consultaResumen() {
  return urlConsulta({ select: `${SUMA},count(*) as filas,min(fecha_hecho) as desde,max(fecha_hecho) as hasta` });
}
