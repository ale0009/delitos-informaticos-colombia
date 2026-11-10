// Página principal: busca un lugar, pide su ficha a datos.gov.co y la pinta.
import { iniciarTema } from './tema.js';
import { cargarBase, cargarFicha, RESPALDO } from './datos.js';
import { departamentos, ranking, perfil, nivelAmenaza, NOMBRES_NIVEL, compararPromedio, tendencia } from './agregar.js';
import { construirIndice, resolverLugar, sugerencias, etiqueta, aHash, deHash, mismoLugar } from './lugares.js';
import { fichaArticulo } from './ley1273.js';
import { svgTendencia } from './graficas.js';
import { miles, pct, dec, titulo } from './texto.js';

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const EJEMPLO = { tipo: 'municipio', municipio: 'MEDELLIN', departamento: 'ANTIOQUIA' };
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const fechaCorta = (iso) => { const [a, m, d] = iso.split('-').map(Number); return `${d} ${MESES[m - 1]} ${a}`; };

let ctx = null;
let indice = [];
let deptos = [];
let actual = null;
let turno = 0;
const VISIBLES = 4;

function pintarEstado(origen, error, extra = '') {
  const e = $('estado');
  const hasta = ctx?.resumen ? ` · último hecho: ${fechaCorta(ctx.resumen.hasta)}` : '';
  if (origen === 'vivo') {
    e.innerHTML = `<span class="chip chip-vivo">En vivo</span><span>datos.gov.co${hasta}</span>${extra}`;
  } else {
    e.innerHTML = `<span class="chip chip-error">Sin conexión: datos de ejemplo del ${RESPALDO.fecha}</span><span class="motivo">Motivo: ${esc(error ?? 'desconocido')}.${hasta}</span>${extra}`;
  }
}

function aviso(html) {
  pintarEstado(ctx?.origen ?? 'respaldo', ctx?.error, `<span class="aviso">${html}</span>`);
}

function botonLugar(l, txt = etiqueta(l)) {
  return `<button type="button" class="enlace" data-hash="${esc(aHash(l))}">${esc(txt)}</button>`;
}

/* ---------- pintar la ficha ---------- */
function pintarCabecera(lugar, f) {
  const total = f.articulos.total;
  $('lugar').textContent = etiqueta(lugar);
  const r = ctx.resumen;
  $('h-total').textContent = miles(total);
  $('h-rango').textContent = `${r.desde.slice(0, 4)} – ${fechaCorta(r.hasta)}`;

  let sub;
  let pares;
  let comp;
  let promTxt;
  if (lugar.tipo === 'municipio') {
    sub = `Municipio de ${titulo(lugar.departamento)}`;
    pares = ctx.catalogo.map((c) => c.total);
    comp = compararPromedio(total, r.total, ctx.catalogo.length);
    promTxt = `el promedio por municipio (${miles(comp.promedio)} casos)`;
  } else if (lugar.tipo === 'departamento') {
    const d = deptos.find((x) => x.departamento === lugar.departamento);
    sub = `Departamento · ${d ? miles(d.municipios) : '–'} municipios con denuncias`;
    pares = deptos.map((x) => x.total);
    comp = compararPromedio(total, r.total, deptos.length);
    promTxt = `el promedio por departamento (${miles(comp.promedio)} casos)`;
  } else {
    sub = `Todo el país · ${miles(ctx.catalogo.length)} municipios con denuncias`;
  }
  $('sub').textContent = sub;

  const barras = [...$('h-barras').children];
  if (pares) {
    const nv = nivelAmenaza(total, pares);
    $('h-nivel').textContent = `${nv.nivel}/5 · ${NOMBRES_NIVEL[nv.nivel]}`;
    $('h-pct').textContent = `puesto ${miles(nv.puesto)} de ${miles(nv.de)} ${lugar.tipo === 'municipio' ? 'municipios' : 'departamentos'} con denuncias`;
    barras.forEach((b, i) => b.classList.toggle('on', i < nv.nivel));
    $('h-barras').dataset.nivel = nv.nivel;
    $('h-razon').textContent = comp.razon >= 10 ? `×${miles(comp.razon)}` : `×${dec(comp.razon, comp.razon < 1 ? 2 : 1)}`;
    $('h-prom').textContent = `veces ${promTxt} · calculado aquí`;
  } else {
    $('h-nivel').textContent = 'País';
    $('h-pct').textContent = 'el nivel compara municipios o departamentos';
    barras.forEach((b) => b.classList.remove('on'));
    $('h-razon').textContent = miles(r.total / ctx.catalogo.length);
    $('h-prom').textContent = 'casos de promedio por municipio · calculado aquí';
  }
}

function pintarRanking(f) {
  const filas = ranking(f.articulos.porCodigo);
  const per = Object.fromEntries(perfil(f.articulos.porCodigo, ctx.nacional.articulos.porCodigo).map((p) => [p.codigo, p]));
  if (!filas.length) { $('ranking').innerHTML = '<li class="vacio">No hay denuncias registradas aquí.</li>'; return; }
  const escala = Math.max(...filas.map((x) => Math.max(x.parte, per[x.codigo].nacional)));
  $('ranking').innerHTML = filas.map((x, i) => {
    const a = fichaArticulo(x.codigo);
    const nac = per[x.codigo].nacional;
    const dif = per[x.codigo].diferencia;
    const peso = Math.abs(dif) >= 0.03 ? `<span class="peso ${dif > 0 ? 'mas' : 'menos'}">${dif > 0 ? 'pesa más' : 'pesa menos'} que en el país (${pct(nac)})</span>` : `<span class="peso">igual que en el país (${pct(nac)})</span>`;
    const otros = a.controles.slice(1);
    const control = a.principal
      ? `<p class="control"><span class="et">Lo previene</span> <b>ISO 27001 · ${a.principal.codigo}</b> ${esc(a.principal.nombre)}${otros.length ? ` <details><summary>+${otros.length} controles</summary><ul>${otros.map((c) => `<li><b>${c.codigo}</b> ${esc(c.nombre)} <small>(${c.tema})</small></li>`).join('')}</ul></details>` : ''}</p>`
      : `<p class="control"><span class="et">Nota</span> ${esc(a.nota)}</p>`;
    return `<li class="art${i === 0 ? ' dominante' : ''}${i >= VISIBLES ? ' resto' : ''}">
      ${i === 0 ? '<span class="alerta" role="note" aria-label="Artículo dominante">¡ALERTA!</span>' : ''}
      <div class="art-cab"><span class="cod">${x.codigo}</span><span class="art-nom">${esc(a.nombre)}</span><span class="art-n">${miles(x.n)} <small>${pct(x.parte)}</small></span></div>
      <div class="barra" role="img" aria-label="${pct(x.parte)} aquí frente a ${pct(nac)} en el país"><span class="relleno" style="width:${((x.parte / escala) * 100).toFixed(1)}%"></span><span class="marca" style="left:${((nac / escala) * 100).toFixed(1)}%"></span></div>
      <p class="pena"><span class="et">Pena</span> ${esc(a.pena)}${a.fuente.startsWith('matriz') ? ' <small>(matriz)</small>' : ''} ${peso}</p>
      ${control}
    </li>`;
  }).join('');
  const resto = filas.length - VISIBLES;
  const b = $('ver-resto');
  b.hidden = resto <= 0;
  $('ranking').classList.remove('abierto');
  b.setAttribute('aria-expanded', 'false');
  b.textContent = `Ver los ${resto} artículos restantes`;
}

function pintarTendencia(f) {
  const hasta = ctx.resumen.hasta;
  const parcial = hasta.endsWith('-12-31') ? null : Number(hasta.slice(0, 4));
  let serie = f.anios;
  const ini = serie.findIndex((s) => s.n > 0);
  serie = ini < 0 ? [] : serie.slice(ini);
  $('g-anios').innerHTML = svgTendencia(serie, { parcial, titulo: `Casos por año en ${etiqueta(actual)}` });
  const t = tendencia(serie, parcial);
  if (!t) { $('ten-nota').textContent = ''; return; }
  const cambio = t.cambio == null ? '' : `, ${t.cambio >= 0 ? '+' : ''}${pct(t.cambio, 0)} frente a ${t.previo.anio} (calculado aquí)`;
  $('ten-nota').innerHTML = `Pico: <b>${t.pico.anio}</b> con ${miles(t.pico.n)} casos. Último año completo: <b>${t.ultimo?.anio ?? '–'}</b> con ${miles(t.ultimo?.n ?? 0)}${cambio}.${parcial ? ` La barra rayada (${parcial}) va solo hasta el ${fechaCorta(hasta)}.` : ''}`;
}

function pintarDeptos(lugar) {
  const sel = lugar?.departamento ?? null;
  const top = deptos[0]?.total || 1;
  $('deptos').innerHTML = deptos.map((d, i) => `<li><button type="button" class="dep${d.departamento === sel ? ' activo' : ''}" data-hash="${esc(aHash({ tipo: 'departamento', departamento: d.departamento }))}" ${d.departamento === sel ? 'aria-current="true"' : ''}>
    <span class="dep-i">${i + 1}</span><span class="dep-nom">${esc(titulo(d.departamento))}</span><span class="dep-barra"><span style="width:${Math.max(0.6, (d.total / top) * 100).toFixed(1)}%"></span></span><span class="dep-n">${miles(d.total)}</span></button></li>`).join('');
}

async function mostrar(lugar, { ejemplo = false, alternativas = [] } = {}) {
  const yo = ++turno;
  actual = lugar;
  $('ficha').setAttribute('aria-busy', 'true');
  document.body.classList.add('cargando');
  $('lugar').textContent = etiqueta(lugar);
  $('sub').textContent = 'Consultando datos.gov.co…';
  const f = await cargarFicha(lugar, ctx);
  if (yo !== turno) return; // llegó otra búsqueda mientras tanto
  document.body.classList.remove('cargando');
  $('ficha').setAttribute('aria-busy', 'false');
  $('ejemplo').hidden = !ejemplo;
  pintarCabecera(lugar, f);
  pintarRanking(f);
  pintarTendencia(f);
  pintarDeptos(lugar);
  const extra = alternativas.length ? `<span class="aviso">¿Buscabas otro? ${alternativas.map((a) => botonLugar(a)).join(' · ')}</span>` : '';
  pintarEstado(f.origen, f.error, extra);
  if (f.articulos.total === 0 && lugar.tipo !== 'nacional') aviso('Sin denuncias registradas para este lugar.');
}

function ir(lugar, opciones = {}) {
  const h = aHash(lugar);
  if (location.hash !== h) history.replaceState(null, '', h);
  return mostrar(lugar, opciones);
}

function buscar(texto) {
  const r = resolverLugar(texto, indice);
  if (!r) {
    const sug = sugerencias(texto.slice(0, 4), indice, 4);
    aviso(`No encontramos «${esc(texto)}» en los datos.${sug.length ? ` ¿Quizás ${sug.map((l) => botonLugar(l)).join(' ')}?` : ''}`);
    return;
  }
  $('buscar').value = etiqueta(r.lugar);
  ir(r.lugar, { alternativas: r.alternativas });
}

async function iniciar() {
  iniciarTema($('tema'));
  ctx = await cargarBase();
  indice = construirIndice(ctx.catalogo);
  deptos = departamentos(ctx.catalogo);
  $('lista-lugares').innerHTML = indice
    .slice().sort((a, b) => b.total - a.total)
    .map((e) => `<option value="${esc(etiqueta(e.lugar))}"></option>`).join('');

  $('form').addEventListener('submit', (ev) => { ev.preventDefault(); buscar($('buscar').value); });
  $('buscar').addEventListener('change', () => { if ($('buscar').value.trim()) buscar($('buscar').value); });
  document.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-q], [data-hash]');
    if (!b) return;
    if (b.dataset.q) buscar(b.dataset.q);
    else { const l = deHash(b.dataset.hash); if (l) { $('buscar').value = etiqueta(l); ir(l); } }
  });
  $('ver-resto').addEventListener('click', () => {
    const abierto = $('ranking').classList.toggle('abierto');
    $('ver-resto').setAttribute('aria-expanded', String(abierto));
    $('ver-resto').textContent = abierto ? 'Ver menos' : `Ver los ${$('ranking').querySelectorAll('.resto').length} artículos restantes`;
  });
  window.addEventListener('hashchange', () => { const l = deHash(location.hash); if (l && !mismoLugar(l, actual)) mostrar(l); });

  const inicial = deHash(location.hash);
  if (inicial) { $('buscar').value = etiqueta(inicial); mostrar(inicial); } else mostrar(EJEMPLO, { ejemplo: true });
}

iniciar().catch((e) => {
  $('lugar').textContent = 'No se pudo cargar';
  $('sub').textContent = 'Ni la API ni el respaldo respondieron.';
  $('estado').innerHTML = `<span class="chip chip-error">Error</span><span class="motivo">${esc(e?.message ?? e)}</span>`;
});
