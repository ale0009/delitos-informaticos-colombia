import { test } from 'node:test';
import assert from 'node:assert/strict';
import { techo, svgTendencia, svgBarrasH } from '../js/graficas.js';

test('techo redondea a 1-2-5', () => {
  assert.equal(techo(7400), 10000);
  assert.equal(techo(1600), 2000);
  assert.equal(techo(420), 500);
  assert.equal(techo(0), 1);
});

test('svgTendencia: una barra por año, máximo destacado, parcial rayado', () => {
  const s = svgTendencia([{ anio: 2024, n: 10 }, { anio: 2025, n: 5 }, { anio: 2026, n: 3 }], { parcial: 2026 });
  assert.equal((s.match(/<rect class="g-barra/g) || []).length, 3);
  assert.match(s, /g-barra g-dest[^>]*><title>2024/);
  assert.match(s, /g-parcial/);
  assert.match(svgTendencia([]), /Sin casos/);
});

test('svgBarrasH escapa etiquetas', () => {
  const s = svgBarrasH([{ etiqueta: 'A<B', n: 3, destacado: true }]);
  assert.match(s, /A&lt;B/);
  assert.match(s, /g-dest/);
});
