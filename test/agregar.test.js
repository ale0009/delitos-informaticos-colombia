import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  parsearCatalogo, departamentos, porArticulo, porAnio, ranking, nivelAmenaza, compararPromedio,
  perfil, tendencia, construirRespaldo, catalogoRespaldo, fichaRespaldo,
} from '../js/agregar.js';

const CAT = [
  { cod_muni: '05001', municipio: 'MEDELLIN', cod_depto: '05', departamento: 'ANTIOQUIA', n: '100' },
  { cod_muni: '05079', municipio: 'BARBOSA', cod_depto: '05', departamento: 'ANTIOQUIA', n: '5' },
  { cod_muni: '68077', municipio: 'BARBOSA', cod_depto: '68', departamento: 'SANTANDER', n: '7' },
  { cod_muni: '68001', municipio: 'BUCARAMANGA', cod_depto: '68', departamento: 'SANTANDER', n: '40' },
];

test('parsearCatalogo convierte números y ordena', () => {
  const c = parsearCatalogo(CAT);
  assert.equal(c[0].municipio, 'MEDELLIN');
  assert.equal(c[0].total, 100);
  assert.equal(c.at(-1).total, 5);
});

test('departamentos suma municipios', () => {
  const d = departamentos(parsearCatalogo(CAT));
  assert.deepEqual(d.map((x) => [x.departamento, x.total, x.municipios]), [['ANTIOQUIA', 105, 2], ['SANTANDER', 47, 2]]);
});

test('porArticulo agrupa por código y separa lo no reconocido', () => {
  const r = porArticulo([
    { descripcion_conducta: 'ARTICULO 269I. HURTO POR MEDIOS INFORMATICOS Y SEMEJANTES', n: '10' },
    { descripcion_conducta: 'ARTICULO 269A. ACCESO ABUSIVO A UN SISTEMA INFORMATICO', n: '4' },
    { descripcion_conducta: 'ARTICULO 269I. HURTO (variante)', n: '1' },
    { descripcion_conducta: 'OTRA COSA', n: '2' },
  ]);
  assert.equal(r.porCodigo['269I'], 11);
  assert.equal(r.porCodigo['269A'], 4);
  assert.equal(r.porCodigo['269B'], 0);
  assert.equal(r.total, 17);
  assert.equal(r.sinCodigo, 2);
});

test('porAnio rellena huecos y respeta el rango pedido', () => {
  assert.deepEqual(porAnio([{ anio: '2020', n: '3' }, { anio: '2022', n: '1' }]), [{ anio: 2020, n: 3 }, { anio: 2021, n: 0 }, { anio: 2022, n: 1 }]);
  assert.equal(porAnio([{ anio: '2021', n: '2' }], 2019, 2022).length, 4);
  assert.deepEqual(porAnio([]), []);
});

test('ranking ordena, quita ceros y calcula la parte', () => {
  const r = ranking({ '269A': 1, '269I': 3, '269B': 0 });
  assert.deepEqual(r.map((x) => x.codigo), ['269I', '269A']);
  assert.equal(r[0].parte, 0.75);
});

test('nivelAmenaza por percentil y puesto', () => {
  const pares = Array.from({ length: 100 }, (_, i) => i + 1); // 1..100
  assert.deepEqual(nivelAmenaza(100, pares), { nivel: 5, percentil: 0.99, puesto: 1, de: 100 });
  assert.equal(nivelAmenaza(92, pares).nivel, 4);
  assert.equal(nivelAmenaza(80, pares).nivel, 3);
  assert.equal(nivelAmenaza(60, pares).nivel, 2);
  assert.equal(nivelAmenaza(10, pares).nivel, 1);
  assert.equal(nivelAmenaza(10, []).nivel, 1);
});

test('compararPromedio', () => {
  assert.deepEqual(compararPromedio(50, 1000, 100), { promedio: 10, razon: 5 });
  assert.equal(compararPromedio(5, 0, 0).razon, 0);
});

test('perfil compara el peso local con el nacional', () => {
  const p = perfil({ '269I': 1, '269F': 1 }, { '269I': 3, '269F': 1 });
  const i = p.find((x) => x.codigo === '269I');
  assert.equal(i.local, 0.5);
  assert.equal(i.nacional, 0.75);
  assert.equal(i.diferencia, -0.25);
  assert.equal(p.length, 10);
});

test('tendencia ignora el año parcial', () => {
  const t = tendencia([{ anio: 2023, n: 10 }, { anio: 2024, n: 20 }, { anio: 2025, n: 15 }, { anio: 2026, n: 99 }], 2026);
  assert.equal(t.pico.anio, 2024);
  assert.equal(t.ultimo.anio, 2025);
  assert.equal(t.cambio, -0.25);
  assert.equal(tendencia([]), null);
});

test('respaldo: construir y reconstruir la ficha de un municipio homónimo y de un departamento', () => {
  const catalogo = parsearCatalogo(CAT);
  const r = construirRespaldo({
    catalogo,
    filasArticulo: [
      { cod_muni: '05079', descripcion_conducta: 'ARTICULO 269I. HURTO', n: '5' },
      { cod_muni: '68077', descripcion_conducta: 'ARTICULO 269A. ACCESO', n: '7' },
      { cod_muni: '05001', descripcion_conducta: 'ARTICULO 269F. DATOS', n: '100' },
    ],
    filasAnio: [{ cod_muni: '05079', anio: '2024', n: '5' }, { cod_muni: '68077', anio: '2025', n: '7' }, { cod_muni: '05001', anio: '2025', n: '100' }],
    resumen: { total: 112 }, generado: 'x',
  });
  assert.equal(r.desde, 2024);
  const f = fichaRespaldo(r, { tipo: 'municipio', municipio: 'BARBOSA', departamento: 'SANTANDER' });
  assert.equal(f.articulos.total, 7);
  assert.equal(f.articulos.porCodigo['269A'], 7);
  assert.deepEqual(f.anios, [{ anio: 2024, n: 0 }, { anio: 2025, n: 7 }]);
  assert.equal(fichaRespaldo(r, { tipo: 'departamento', departamento: 'ANTIOQUIA' }).articulos.total, 105);
  assert.equal(fichaRespaldo(r, { tipo: 'nacional' }).articulos.total, 112);
  assert.equal(catalogoRespaldo(r).length, 4);
});

test('el respaldo guardado cuadra con el resumen de la API', () => {
  const r = JSON.parse(readFileSync(new URL('../datos/respaldo-2026-11-10.json', import.meta.url)));
  const n = fichaRespaldo(r, { tipo: 'nacional' });
  assert.equal(n.articulos.total, r.resumen.total);
  assert.equal(n.anios.reduce((s, x) => s + x.n, 0), r.resumen.total);
  assert.equal(n.articulos.porCodigo['269I'], 268144);
  assert.equal(r.municipios.length, 1098);
});
