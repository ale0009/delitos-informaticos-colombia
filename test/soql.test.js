import { test } from 'node:test';
import assert from 'node:assert/strict';
import { literal, urlConsulta, filtroLugar, consultaArticulos, consultaAnios, consultaCatalogo, BASE } from '../js/soql.js';

const params = (url) => Object.fromEntries(new URL(url).searchParams);

test('literal: comillas simples se duplican', () => {
  assert.equal(literal('BOGOTA D.C.'), "'BOGOTA D.C.'");
  assert.equal(literal("O'HIGGINS"), "'O''HIGGINS'");
  assert.equal(literal("'; DROP"), "'''; DROP'");
  assert.equal(literal(null), "''");
});

test('urlConsulta omite partes vacías y codifica', () => {
  assert.equal(urlConsulta({}), BASE);
  const p = params(urlConsulta({ select: 'a,sum(cantidad) as n', where: "municipio='X'", limit: 5 }));
  assert.deepEqual(p, { $select: 'a,sum(cantidad) as n', $where: "municipio='X'", $limit: '5' });
});

test('filtroLugar por tipo, con escape', () => {
  assert.equal(filtroLugar({ tipo: 'nacional' }), '');
  assert.equal(filtroLugar(null), '');
  assert.equal(filtroLugar({ tipo: 'departamento', departamento: 'ANTIOQUIA' }), "departamento='ANTIOQUIA'");
  assert.equal(filtroLugar({ tipo: 'municipio', municipio: "SAN JOSE D'X", departamento: 'CALDAS' }), "municipio='SAN JOSE D''X' AND departamento='CALDAS'");
  assert.throws(() => filtroLugar({ tipo: 'barrio' }));
});

test('consultas por artículo y año del lugar', () => {
  const a = params(consultaArticulos({ tipo: 'municipio', municipio: 'BARBOSA', departamento: 'SANTANDER' }));
  assert.equal(a.$group, 'descripcion_conducta');
  assert.match(a.$select, /sum\(cantidad\) as n/);
  assert.equal(a.$where, "municipio='BARBOSA' AND departamento='SANTANDER'");
  const y = params(consultaAnios({ tipo: 'nacional' }));
  assert.equal(y.$where, undefined);
  assert.match(y.$select, /date_extract_y\(fecha_hecho\) as anio/);
  assert.equal(y.$order, 'anio');
  assert.equal(params(consultaCatalogo()).$group, 'cod_muni,municipio,cod_depto,departamento');
});
