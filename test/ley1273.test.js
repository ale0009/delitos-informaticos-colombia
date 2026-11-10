import { test } from 'node:test';
import assert from 'node:assert/strict';
import { codigoArticulo, fichaArticulo, textoPena, ARTICULOS, CONTROLES, CODIGOS } from '../js/ley1273.js';

test('codigoArticulo extrae 269A–269J de la descripción del dataset', () => {
  assert.equal(codigoArticulo('ARTICULO 269F. VIOLACION DE DATOS PERSONALES'), '269F');
  assert.equal(codigoArticulo('ARTICULO 269I. HURTO POR MEDIOS INFORMATICOS Y SEMEJANTES'), '269I');
  assert.equal(codigoArticulo('artículo 269 j transferencia'), '269J');
  assert.equal(codigoArticulo('ARTICULO 239. HURTO'), null);
  assert.equal(codigoArticulo(undefined), null);
});

test('mapeo artículo → pena', () => {
  assert.equal(textoPena(ARTICULOS['269A']), '48–96 meses de prisión · multa de 100–1.000 SMMLV');
  assert.equal(textoPena(ARTICULOS['269C']), '36–72 meses de prisión · sin multa');
  assert.equal(textoPena(ARTICULOS['269I']), '48–120 meses de prisión · multa según cuantía');
  assert.equal(textoPena(ARTICULOS['269J']), '48–120 meses de prisión · multa de 200–1.500 SMMLV');
  assert.equal(textoPena(ARTICULOS['269H']), 'Agrava la pena del delito base');
});

test('mapeo artículo → control ISO 27001 principal', () => {
  assert.equal(fichaArticulo('269I').principal.codigo, '8.5');
  assert.equal(fichaArticulo('269I').principal.nombre, 'Autenticación segura');
  assert.equal(fichaArticulo('269F').principal.nombre, 'Privacidad y protección de datos personales');
  assert.equal(fichaArticulo('269G').principal.codigo, '8.23');
  assert.equal(fichaArticulo('269H').principal, null);
  assert.equal(fichaArticulo('269Z'), null);
});

test('todos los controles citados existen en el catálogo ISO', () => {
  assert.equal(CODIGOS.length, 10);
  for (const c of CODIGOS) for (const k of ARTICULOS[c].controles) assert.ok(CONTROLES[k], `${c} cita ${k}`);
  assert.equal(Object.keys(CONTROLES).length, 31);
});

test('269E y 269F citan la matriz (la investigación no los detalla)', () => {
  assert.match(ARTICULOS['269E'].fuente, /matriz/);
  assert.match(ARTICULOS['269F'].fuente, /matriz/);
  assert.equal(ARTICULOS['269A'].fuente, 'investigación');
});
