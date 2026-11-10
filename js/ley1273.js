// Ley 1273 de 2009 (arts. 269A–269J del Código Penal): nombre, pena y controles ISO/IEC 27001:2022.
// Penas: de la investigación «Prevención frente a los Delitos Informáticos» (Mario Puerta y David Rincón).
// 269E y 269F no aparecen detallados en esa presentación: su pena sale de la matriz del repo
// portafolio/cumplimiento-ley-1273 (datos/delitos.csv), igual que todos los controles.

export const CONTROLES = {
  '5.3': ['Segregación de funciones', 'Organizacional'],
  '5.7': ['Inteligencia de amenazas', 'Organizacional'],
  '5.12': ['Clasificación de la información', 'Organizacional'],
  '5.14': ['Transferencia de información', 'Organizacional'],
  '5.15': ['Control de acceso', 'Organizacional'],
  '5.16': ['Gestión de identidades', 'Organizacional'],
  '5.17': ['Información de autenticación', 'Organizacional'],
  '5.18': ['Derechos de acceso', 'Organizacional'],
  '5.24': ['Planificación y preparación de la gestión de incidentes', 'Organizacional'],
  '5.29': ['Seguridad de la información durante una interrupción', 'Organizacional'],
  '5.34': ['Privacidad y protección de datos personales', 'Organizacional'],
  '6.3': ['Concienciación y formación en seguridad', 'Personas'],
  '7.12': ['Seguridad del cableado', 'Físico'],
  '8.2': ['Derechos de acceso privilegiado', 'Tecnológico'],
  '8.3': ['Restricción de acceso a la información', 'Tecnológico'],
  '8.5': ['Autenticación segura', 'Tecnológico'],
  '8.6': ['Gestión de la capacidad', 'Tecnológico'],
  '8.7': ['Protección contra malware', 'Tecnológico'],
  '8.8': ['Gestión de vulnerabilidades técnicas', 'Tecnológico'],
  '8.11': ['Enmascaramiento de datos', 'Tecnológico'],
  '8.12': ['Prevención de fuga de datos', 'Tecnológico'],
  '8.13': ['Copias de seguridad de la información', 'Tecnológico'],
  '8.14': ['Redundancia de las instalaciones de procesamiento', 'Tecnológico'],
  '8.15': ['Registro de eventos', 'Tecnológico'],
  '8.16': ['Actividades de monitoreo', 'Tecnológico'],
  '8.19': ['Instalación de software en sistemas operativos', 'Tecnológico'],
  '8.20': ['Seguridad de redes', 'Tecnológico'],
  '8.21': ['Seguridad de los servicios de red', 'Tecnológico'],
  '8.23': ['Filtrado web', 'Tecnológico'],
  '8.24': ['Uso de criptografía', 'Tecnológico'],
  '8.32': ['Gestión de cambios', 'Tecnológico'],
};

const INV = 'investigación';
const MAT = 'matriz cumplimiento-ley-1273';

/** prision/multa en meses y SMMLV; `nota` cuando la fuente no da cifra o hay discrepancia. */
export const ARTICULOS = {
  '269A': { nombre: 'Acceso abusivo a un sistema informático', corto: 'Acceso abusivo',
    prision: [48, 96], multa: [100, 1000], fuente: INV, controles: ['5.15', '5.16', '5.17', '5.18', '8.2', '8.5', '8.15', '8.16'] },
  '269B': { nombre: 'Obstaculización ilegítima de sistema informático o red', corto: 'Obstaculización',
    prision: [48, 96], multa: [100, 1000], fuente: INV, controles: ['8.6', '8.14', '8.16', '8.20', '5.29', '5.24'] },
  '269C': { nombre: 'Interceptación de datos informáticos', corto: 'Interceptación',
    prision: [36, 72], multa: null, fuente: INV, controles: ['8.20', '8.21', '8.24', '5.14', '7.12'] },
  '269D': { nombre: 'Daño informático', corto: 'Daño informático',
    prision: [48, 96], multa: [100, 1000], fuente: INV, controles: ['8.13', '8.3', '8.32', '5.15', '8.15'] },
  '269E': { nombre: 'Uso de software malicioso', corto: 'Software malicioso',
    prision: [48, 96], multa: [100, 1000], fuente: MAT, controles: ['8.7', '8.8', '8.19', '8.23', '6.3'] },
  '269F': { nombre: 'Violación de datos personales', corto: 'Datos personales',
    prision: [48, 96], multa: [100, 1000], fuente: MAT, controles: ['5.34', '8.11', '8.12', '5.12', '5.15', '8.24'] },
  '269G': { nombre: 'Suplantación de sitios web para capturar datos personales', corto: 'Suplantación web',
    prision: [48, 96], multa: [100, 1000], fuente: INV, controles: ['8.23', '8.20', '6.3', '5.7', '8.16'] },
  '269H': { nombre: 'Circunstancias de agravación punitiva', corto: 'Agravantes',
    prision: null, multa: null, fuente: INV, nota: 'No es un delito aparte: aumenta la pena del delito base (la investigación lo resume como «hasta la mitad»).', controles: [] },
  '269I': { nombre: 'Hurto por medios informáticos y semejantes', corto: 'Hurto informático',
    prision: [48, 120], multa: null, multaTexto: 'según cuantía', fuente: INV, nota: 'La ley remite a las penas del hurto calificado (art. 240 C.P.); ver fe de erratas.', controles: ['8.5', '5.17', '8.2', '8.15', '5.3'] },
  '269J': { nombre: 'Transferencia no consentida de activos', corto: 'Transferencia no consentida',
    prision: [48, 120], multa: [200, 1500], fuente: INV, nota: 'La investigación dice «multa según perjuicio»; la cifra en SMMLV viene de la matriz.', controles: ['5.3', '8.5', '8.15', '8.16', '8.32', '5.24'] },
};

export const CODIGOS = Object.keys(ARTICULOS);

/** "ARTICULO 269F. VIOLACION DE DATOS PERSONALES" → "269F" (null si no reconoce el artículo). */
export function codigoArticulo(descripcion) {
  const m = String(descripcion ?? '').toUpperCase().match(/269\s*([A-J])\b/);
  return m ? `269${m[1]}` : null;
}

const miles = (n) => n.toLocaleString('es-CO');

/** Texto corto de la pena: "48–96 meses · 100–1.000 SMMLV". */
export function textoPena(art) {
  if (!art?.prision) return 'Agrava la pena del delito base';
  const p = `${art.prision[0]}–${art.prision[1]} meses de prisión`;
  if (art.multa) return `${p} · multa de ${miles(art.multa[0])}–${miles(art.multa[1])} SMMLV`;
  if (art.multaTexto) return `${p} · multa ${art.multaTexto}`;
  return `${p} · sin multa`;
}

/** Ficha completa de un artículo: pena en texto, controles con nombre, control principal. */
export function fichaArticulo(codigo) {
  const art = ARTICULOS[codigo];
  if (!art) return null;
  const controles = art.controles.map((c) => ({ codigo: c, nombre: CONTROLES[c]?.[0] ?? '¿?', tema: CONTROLES[c]?.[1] ?? '' }));
  return { codigo, ...art, pena: textoPena(art), controles, principal: controles[0] ?? null };
}
