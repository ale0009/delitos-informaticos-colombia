# ¿Qué delito informático pasa en tu municipio?

[English](README.en.md)

Escribe un municipio o departamento de Colombia y mira su «ficha» de delitos informáticos, en vivo desde los datos abiertos del Gobierno:

- total de casos denunciados y un **nivel de amenaza** de 1 a 5 (su puesto entre los municipios o departamentos);
- comparación con el promedio nacional;
- **ranking por artículo de la Ley 1273** (269A–269J), con la pena y el **control ISO/IEC 27001:2022** que lo previene; el artículo dominante lleva un «¡ALERTA!»;
- tendencia por año (SVG) y ranking de los 33 departamentos.

Al abrirla aparece Medellín como ejemplo. Puedes compartir una ficha con su enlace (`#m=MEDELLIN|ANTIOQUIA`, `#d=ANTIOQUIA`). La página `/proceso/` cuenta la investigación y cómo se hizo.

> **Divulgación, no asesoría legal.** Son denuncias registradas, no todos los delitos que ocurren.

## Cómo usarla

Es una página estática, sin compilación ni claves:

```bash
python3 -m http.server 8000   # y abre http://localhost:8000
node --test                   # pruebas de la lógica (Node 20+)
node scripts/generar-respaldo.mjs   # regenera datos/respaldo-AAAA-MM-DD.json
```

Se puede publicar tal cual en GitHub Pages. Con `?sin-conexion` en la URL se fuerza el modo sin conexión para probarlo.

## Datos

- **API:** dataset [`4v6r-wu98` «Delitos informáticos»](https://www.datos.gov.co/d/4v6r-wu98) del Ministerio de Defensa Nacional en datos.gov.co (CC BY-SA 4.0), consultado con SoQL directamente desde el navegador (CORS abierto). Cada ficha hace dos consultas, una por artículo y otra por año.
- **Respaldo:** `datos/respaldo-2026-11-10.json` (121 KB), con los casos por municipio, artículo y año. Si la API falla, la página lo usa y lo avisa: «Sin conexión: datos de ejemplo del 10 nov 2026».
- **Penas:** de la investigación; las de 269E y 269F, de la matriz del repo `cumplimiento-ley-1273`; las de 269H, 269I y 269J, corregidas con el texto oficial de la ley (ver la fe de erratas en `/proceso/`).
- **Controles ISO 27001:** de la matriz Ley 1273 ↔ ISO/IEC 27001:2022 del repo `cumplimiento-ley-1273`.

## De qué trabajo sale

De la investigación académica «Prevención frente a los Delitos Informáticos. Responsabilidad legal en TIC» (asignatura de auditoría de seguridad y normas), que repasa la Ley 1273 de 2009, la Ley 1581 de 2012, el Decreto 1377 de 2013, las penas, los casos y los controles de prevención. Esta herramienta la cruza con el registro público de denuncias.

## Estructura

```
index.html            herramienta
proceso/index.html    investigación y método
js/soql.js            construcción de consultas SoQL (con escape de comillas)
js/agregar.js         agregaciones, nivel de amenaza, respaldo
js/ley1273.js         artículo → pena → controles ISO 27001
js/lugares.js         búsqueda de municipios/departamentos (tildes, homónimos)
js/texto.js           normalización y formatos
js/graficas.js        SVG propio
test/                 pruebas node --test
```

## Créditos

[Mario Puerta](https://github.com/ale0009) (github.com/ale0009) × [David Rincón «Kuronoma»](https://www.linkedin.com/in/davidalexanderrinconcorredorkuronoma/) (LinkedIn).

Código bajo licencia MIT (ver `LICENSE`). Los datos del dataset son del Ministerio de Defensa Nacional (CC BY-SA 4.0), y el respaldo agregado conserva esa licencia.
