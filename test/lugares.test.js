import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parsearCatalogo } from '../js/agregar.js';
import { construirIndice, resolverLugar, sugerencias, etiqueta, aHash, deHash, mismoLugar } from '../js/lugares.js';

const indice = construirIndice(parsearCatalogo([
  { cod_muni: '11001', municipio: 'BOGOTA D.C.', departamento: 'BOGOTA D.C.', n: '1000' },
  { cod_muni: '05001', municipio: 'MEDELLIN', departamento: 'ANTIOQUIA', n: '400' },
  { cod_muni: '05079', municipio: 'BARBOSA', departamento: 'ANTIOQUIA', n: '5' },
  { cod_muni: '68077', municipio: 'BARBOSA', departamento: 'SANTANDER', n: '7' },
  { cod_muni: '52001', municipio: 'PASTO', departamento: 'NARIÑO', n: '30' },
  { cod_muni: '05129', municipio: 'CALDAS', departamento: 'ANTIOQUIA', n: '9' },
  { cod_muni: '17001', municipio: 'MANIZALES', departamento: 'CALDAS', n: '50' },
  { cod_muni: '17174', municipio: 'CHINCHINA', departamento: 'CALDAS', n: '6' },
]));

test('resuelve con tildes y minúsculas', () => {
  assert.deepEqual(resolverLugar('medellín', indice).lugar, { tipo: 'municipio', municipio: 'MEDELLIN', departamento: 'ANTIOQUIA' });
  assert.equal(resolverLugar('Bogotá', indice).lugar.municipio, 'BOGOTA D.C.');
  assert.deepEqual(resolverLugar('nariño', indice).lugar, { tipo: 'departamento', departamento: 'NARIÑO' });
  assert.equal(resolverLugar('narino', indice).lugar.departamento, 'NARIÑO'); // sin Ñ también vale
});

test('homónimos: elige el de más casos y ofrece los demás; la etiqueta completa desempata', () => {
  const r = resolverLugar('Barbosa', indice);
  assert.equal(r.lugar.departamento, 'SANTANDER');
  assert.equal(r.alternativas[0].departamento, 'ANTIOQUIA');
  assert.equal(resolverLugar('Barbosa · Antioquia', indice).lugar.departamento, 'ANTIOQUIA');
  assert.equal(resolverLugar('barbosa, antioquia', indice).lugar.departamento, 'ANTIOQUIA');
});

test('municipio vs departamento con el mismo nombre', () => {
  const c = resolverLugar('Caldas', indice);
  assert.equal(c.lugar.tipo, 'departamento');
  assert.equal(c.alternativas[0].municipio, 'CALDAS'); // el municipio queda como alternativa
  assert.equal(resolverLugar('municipio de Caldas', indice).lugar.tipo, 'municipio');
  assert.equal(resolverLugar('departamento de Caldas', indice).lugar.tipo, 'departamento');
  assert.equal(resolverLugar('Caldas · Antioquia', indice).lugar.tipo, 'municipio');
  assert.equal(resolverLugar('Caldas (departamento)', indice).lugar.tipo, 'departamento');
  assert.equal(resolverLugar('Antioquia', indice).lugar.tipo, 'departamento');
});

test('país, prefijos, vacíos y no encontrados', () => {
  assert.equal(resolverLugar('Colombia', indice).lugar.tipo, 'nacional');
  assert.equal(resolverLugar('mede', indice).lugar.municipio, 'MEDELLIN');
  assert.equal(resolverLugar('   ', indice), null);
  assert.equal(resolverLugar('Gotham', indice), null);
});

test('sugerencias y etiquetas', () => {
  assert.deepEqual(sugerencias('barb', indice).map(etiqueta), ['Barbosa · Santander', 'Barbosa · Antioquia']);
  assert.equal(etiqueta({ tipo: 'departamento', departamento: 'VALLE DEL CAUCA' }), 'Valle del Cauca (departamento)');
  assert.equal(etiqueta({ tipo: 'nacional' }), 'Colombia (todo el país)');
});

test('hash de ida y vuelta', () => {
  for (const l of [{ tipo: 'nacional' }, { tipo: 'departamento', departamento: 'NARIÑO' }, { tipo: 'municipio', municipio: 'BOGOTA D.C.', departamento: 'BOGOTA D.C.' }]) {
    assert.ok(mismoLugar(deHash(aHash(l)), l));
  }
  assert.equal(deHash('#m=%E0%A4%A'), null);
  assert.equal(deHash('#otra'), null);
});
