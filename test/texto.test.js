import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizar, plegar, titulo, miles, pct, dec } from '../js/texto.js';

test('normalizar: tildes, mayúsculas, signos y espacios; conserva la Ñ', () => {
  assert.equal(normalizar('  Medellín '), 'MEDELLIN');
  assert.equal(normalizar('bogotá, d.c.'), 'BOGOTA DC');
  assert.equal(normalizar('Nariño'), 'NARIÑO');
  assert.equal(normalizar('NARIÑO'), 'NARIÑO');
  assert.equal(normalizar('San  Andrés-de   Sotavento'), 'SAN ANDRES DE SOTAVENTO');
  assert.equal(normalizar('Ibagué'), normalizar('IBAGUE'));
  assert.equal(normalizar(undefined), '');
});

test('titulo: palabras menores en minúscula y D.C.', () => {
  assert.equal(titulo('CARTAGENA DE INDIAS'), 'Cartagena de Indias');
  assert.equal(titulo('BOGOTA D.C.'), 'Bogota D.C.');
  assert.equal(titulo('LA UNION'), 'La Union');
  assert.equal(titulo('NARIÑO'), 'Nariño');
});

test('formatos numéricos colombianos', () => {
  assert.equal(miles(268144), '268.144');
  assert.equal(miles(535034.4), '535.034');
  assert.equal(miles(-1500), '-1.500');
  assert.equal(pct(0.4567), '45,7 %');
  assert.equal(dec(2.345, 1), '2,3');
});

test('plegar: clave de búsqueda sin Ñ', () => {
  assert.equal(plegar('Nariño'), 'NARINO');
  assert.equal(plegar('narino'), plegar('NARIÑO'));
});
