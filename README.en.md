# Which cybercrime happens in your municipality?

[Español](README.md)

Type a Colombian municipality or department and get its cybercrime "profile", live from the government's open data:

- total reported cases and a **threat level** from 1 to 5 (its rank among municipalities or departments);
- comparison with the national average;
- **ranking by article of Law 1273** (269A–269J), with the penalty and the **ISO/IEC 27001:2022 control** that prevents it; the dominant article gets an "¡ALERTA!" burst;
- yearly trend (SVG) and a ranking of the 33 departments.

It opens with Medellín as an example. You can share a profile by its link (`#m=MEDELLIN|ANTIOQUIA`, `#d=ANTIOQUIA`). The `/proceso/` page (in Spanish) explains the research and the method.

> **Outreach, not legal advice.** These are reported complaints, not all crimes that happen.

## Usage

A static page, no build and no keys:

```bash
python3 -m http.server 8000   # then open http://localhost:8000
node --test                   # logic tests (Node 20+)
node scripts/generar-respaldo.mjs   # regenerates datos/respaldo-YYYY-MM-DD.json
```

It works on GitHub Pages as is. Add `?sin-conexion` to the URL to force offline mode.

## Data

- **API:** dataset [`4v6r-wu98` "Delitos informáticos"](https://www.datos.gov.co/d/4v6r-wu98) from the Colombian Ministry of Defense on datos.gov.co (CC BY-SA 4.0), queried with SoQL straight from the browser (open CORS). Each profile runs two queries, one by article and one by year.
- **Fallback:** `datos/respaldo-2026-11-10.json` (121 KB), with cases by municipality, article and year. If the API fails, the page uses it and says so ("offline: example data from 10 Nov 2026").
- **Penalties:** from the research; for 269E and 269F, from the matrix in the `cumplimiento-ley-1273` repo; 269H, 269I and 269J were corrected against the official text of the law (see the errata in `/proceso/`).
- **ISO 27001 controls:** from the Law 1273 ↔ ISO/IEC 27001:2022 matrix in the `cumplimiento-ley-1273` repo.

## Where it comes from

The academic research "Prevención frente a los Delitos Informáticos. Responsabilidad legal en TIC" (security audit and standards course), which covers Law 1273 of 2009, Law 1581 of 2012, Decree 1377 of 2013, penalties, cases and prevention controls. This tool crosses it with the public complaint records.

## Credits

[Mario Puerta](https://github.com/ale0009) (github.com/ale0009) × [David Rincón "Kuronoma"](https://www.linkedin.com/in/davidalexanderrinconcorredorkuronoma/) (LinkedIn).

Code under the MIT license (see `LICENSE`). Dataset data belongs to the Colombian Ministry of Defense (CC BY-SA 4.0), and the aggregated fallback keeps that license.
