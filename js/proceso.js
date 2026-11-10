// Página /proceso/: gráficas nacionales desde el respaldo agregado (fechado) del dataset.
import { iniciarTema } from './tema.js';
import { RESPALDO } from './datos.js';
import { fichaRespaldo, ranking, catalogoRespaldo, departamentos } from './agregar.js';
import { ARTICULOS } from './ley1273.js';
import { svgTendencia, svgBarrasH } from './graficas.js';
import { titulo } from './texto.js';

const $ = (id) => document.getElementById(id);

async function iniciar() {
  iniciarTema($('tema'));
  try {
    const r = await (await fetch(`../${RESPALDO.ruta}`)).json();
    const nac = fichaRespaldo(r, { tipo: 'nacional' });
    const filas = ranking(nac.articulos.porCodigo).map((x, i) => ({ etiqueta: `${x.codigo} ${ARTICULOS[x.codigo].corto}`, n: x.n, destacado: i === 0 }));
    $('g-articulos').innerHTML = svgBarrasH(filas, { titulo: 'Casos denunciados por artículo de la Ley 1273, todo el país' });
    const serie = nac.anios.filter((a) => a.anio >= 2009);
    $('g-anual').innerHTML = svgTendencia(serie, { parcial: Number(r.resumen.hasta.slice(0, 4)), titulo: 'Casos denunciados por año, todo el país' });
    const dep = departamentos(catalogoRespaldo(r)).slice(0, 10).map((d, i) => ({ etiqueta: titulo(d.departamento), n: d.total, destacado: i === 0 }));
    $('g-deptos').innerHTML = svgBarrasH(dep, { titulo: 'Los 10 departamentos con más denuncias' });
  } catch (e) {
    for (const id of ['g-articulos', 'g-anual', 'g-deptos']) $(id).innerHTML = `<p class="vacio">No se pudo cargar el respaldo de datos (${e.message}).</p>`;
  }
}

iniciar();
