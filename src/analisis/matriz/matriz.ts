// Estructura y reglas de la matriz de identificación y estimación de riesgos (F-PSSO-IMEC-02).
// Código puro: lo usan la evaluación por voz y las ediciones manuales del auditor.
import {
  estimar,
  PELIGRO_POR_CODIGO,
  PLAZO_MESES,
  SiglaNivel,
} from './catalogo';

export interface CabeceraMatriz {
  departamento: string;
  puesto: string;
  provincia: string;
  canton: string;
  tiempoExposicionHoras: number | null;
  trabajadores: {
    hombres: number | null;
    mujeres: number | null;
    discapacitados: number | null;
  };
  responsableDirecto: string;
  responsableSso: string;
  actividadesRutinarias: string;
  actividadesNoRutinarias: string;
  herramientas: string;
  poblacionVulnerable: {
    maternidad: boolean;
    discapacidad: boolean;
    edadesExtremas: boolean;
    detalle: string;
  };
  tipoEvaluacion: 'inicial' | 'periodica';
  /** YYYY-MM-DD */
  fechaEvaluacion: string;
  fechaUltimaEvaluacion: string | null;
  elaboradoPor: string;
}

export interface PeligroMatriz {
  codigo: string;
  factor: number;
  nombre: string;
  especificacion: string;
  probabilidad: 1 | 2 | 3;
  consecuencia: 1 | 2 | 3;
  estimacion: number;
  nivel: SiglaNivel;
  medida: string;
  justificacion: string;
}

export interface AccionPlan {
  codigo: string;
  accion: string;
  responsable: string;
  fechaInicio: string;
  fechaFin: string;
  fechaCierre: string | null;
}

/** Campos que la IA o la validación pueden marcar como pendientes de llenar a mano. */
export const CAMPOS_MATRIZ = [
  'departamento',
  'puesto',
  'provincia',
  'canton',
  'tiempoExposicion',
  'trabajadores',
  'responsableDirecto',
  'responsableSso',
  'actividadesRutinarias',
  'actividadesNoRutinarias',
  'herramientas',
  'poblacionVulnerable',
  'peligros',
  'especificacion',
  'planAccion',
] as const;
export type CampoMatriz = (typeof CAMPOS_MATRIZ)[number];

export interface Faltante {
  campo: CampoMatriz;
  mensaje: string;
}

const ETIQUETA: Record<CampoMatriz, string> = {
  departamento: 'el departamento (área)',
  puesto: 'el puesto de trabajo',
  provincia: 'la provincia',
  canton: 'el cantón',
  tiempoExposicion: 'el tiempo de exposición (h/día)',
  trabajadores:
    'el número de trabajadores (hombres / mujeres / con discapacidad)',
  responsableDirecto: 'el responsable directo del puesto',
  responsableSso: 'el responsable de Seguridad y Salud Ocupacional',
  actividadesRutinarias: 'las actividades rutinarias',
  actividadesNoRutinarias: 'las actividades no rutinarias (o "Ninguna")',
  herramientas: 'los útiles, herramientas, maquinaria y equipo',
  poblacionVulnerable: 'la población vulnerable',
  peligros: 'los peligros del puesto',
  especificacion: 'el agente de los peligros que piden especificar',
  planAccion: 'el responsable y las fechas del plan de acción',
};

const texto = (v: unknown, max = 2000) =>
  typeof v === 'string' ? v.trim().slice(0, max) : '';
const entero = (v: unknown, min: number, max: number) => {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) && v !== '' && v !== null
    ? Math.min(max, Math.max(min, Math.round(n)))
    : null;
};
const nivel13 = (v: unknown) => (entero(v, 1, 3) ?? 2) as 1 | 2 | 3;
const fecha = (v: unknown) =>
  typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v) ? v.slice(0, 10) : '';

/** Fecha local del servidor (YYYY-MM-DD); toISOString daría la del día siguiente por la noche. */
export const hoy = () => new Date().toLocaleDateString('en-CA');

function sumarMeses(iso: string, meses: number) {
  const d = new Date(`${iso}T00:00:00Z`);
  if (meses === 0) d.setUTCDate(d.getUTCDate() + 7);
  else d.setUTCMonth(d.getUTCMonth() + meses);
  return d.toISOString().slice(0, 10);
}

export function normalizarCabecera(
  c: Partial<CabeceraMatriz> | undefined,
  base: CabeceraMatriz,
): CabeceraMatriz {
  const t = c?.trabajadores;
  const pv = c?.poblacionVulnerable;
  const horas = c?.tiempoExposicionHoras;
  return {
    departamento:
      c?.departamento !== undefined
        ? texto(c.departamento, 150)
        : base.departamento,
    puesto: c?.puesto !== undefined ? texto(c.puesto, 150) : base.puesto,
    provincia:
      c?.provincia !== undefined ? texto(c.provincia, 80) : base.provincia,
    canton: c?.canton !== undefined ? texto(c.canton, 80) : base.canton,
    tiempoExposicionHoras:
      horas !== undefined
        ? horas === null
          ? null
          : Math.min(24, Math.max(0, Number(horas) || 0)) || null
        : base.tiempoExposicionHoras,
    trabajadores: t
      ? {
          hombres: entero(t.hombres, 0, 100000),
          mujeres: entero(t.mujeres, 0, 100000),
          discapacitados: entero(t.discapacitados, 0, 100000),
        }
      : base.trabajadores,
    responsableDirecto:
      c?.responsableDirecto !== undefined
        ? texto(c.responsableDirecto, 150)
        : base.responsableDirecto,
    responsableSso:
      c?.responsableSso !== undefined
        ? texto(c.responsableSso, 150)
        : base.responsableSso,
    actividadesRutinarias:
      c?.actividadesRutinarias !== undefined
        ? texto(c.actividadesRutinarias)
        : base.actividadesRutinarias,
    actividadesNoRutinarias:
      c?.actividadesNoRutinarias !== undefined
        ? texto(c.actividadesNoRutinarias)
        : base.actividadesNoRutinarias,
    herramientas:
      c?.herramientas !== undefined ? texto(c.herramientas) : base.herramientas,
    poblacionVulnerable: pv
      ? {
          maternidad: !!pv.maternidad,
          discapacidad: !!pv.discapacidad,
          edadesExtremas: !!pv.edadesExtremas,
          detalle: texto(pv.detalle, 500),
        }
      : base.poblacionVulnerable,
    tipoEvaluacion:
      c?.tipoEvaluacion === 'inicial' || c?.tipoEvaluacion === 'periodica'
        ? c.tipoEvaluacion
        : base.tipoEvaluacion,
    fechaEvaluacion: fecha(c?.fechaEvaluacion) || base.fechaEvaluacion,
    fechaUltimaEvaluacion:
      c?.fechaUltimaEvaluacion !== undefined
        ? fecha(c.fechaUltimaEvaluacion) || null
        : base.fechaUltimaEvaluacion,
    elaboradoPor:
      c?.elaboradoPor !== undefined
        ? texto(c.elaboradoPor, 150)
        : base.elaboradoPor,
  };
}

/** Descarta códigos fuera del catálogo y duplicados; recalcula la estimación de cada peligro. */
export function normalizarPeligros(lista: unknown): PeligroMatriz[] {
  if (!Array.isArray(lista)) return [];
  const vistos = new Set<string>();
  const out: PeligroMatriz[] = [];
  for (const raw of lista as Partial<PeligroMatriz>[]) {
    const cat = PELIGRO_POR_CODIGO.get(texto(raw?.codigo, 10));
    if (!cat || vistos.has(cat.codigo)) continue;
    vistos.add(cat.codigo);
    const probabilidad = nivel13(raw.probabilidad);
    const consecuencia = nivel13(raw.consecuencia);
    const e = estimar(probabilidad, consecuencia);
    out.push({
      codigo: cat.codigo,
      factor: cat.factor,
      nombre: cat.nombre,
      especificacion: cat.especificar ? texto(raw.especificacion, 150) : '',
      probabilidad,
      consecuencia,
      estimacion: e.valor,
      nivel: e.sigla,
      medida: texto(raw.medida, 500) || cat.medida,
      justificacion: texto(raw.justificacion, 500),
    });
  }
  return out.sort((a, b) => ordenCodigo(a.codigo) - ordenCodigo(b.codigo));
}

const ordenCodigo = (c: string) => {
  const [f, n] = c.split('.').map(Number);
  return f * 100 + n;
};

/**
 * Una acción por peligro identificado (como en la plantilla). Conserva lo que el auditor ya
 * editó y propone responsable y plazo según el nivel para los peligros nuevos.
 */
export function sincronizarPlan(
  peligros: PeligroMatriz[],
  plan: unknown,
  responsableDefecto: string,
  inicio = hoy(),
): AccionPlan[] {
  const previas = new Map<string, Partial<AccionPlan>>();
  if (Array.isArray(plan))
    for (const a of plan as Partial<AccionPlan>[])
      if (a?.codigo) previas.set(String(a.codigo), a);
  return peligros.map((p) => {
    const a = previas.get(p.codigo);
    const fechaInicio = a ? fecha(a.fechaInicio) : inicio;
    return {
      codigo: p.codigo,
      accion: (a ? texto(a.accion, 500) : '') || p.medida,
      responsable: a ? texto(a.responsable, 150) : responsableDefecto,
      fechaInicio,
      fechaFin: a
        ? fecha(a.fechaFin)
        : sumarMeses(fechaInicio || inicio, PLAZO_MESES[p.nivel]),
      fechaCierre: a ? fecha(a.fechaCierre) || null : null,
    };
  });
}

/**
 * Lo que sigue vacío y debe llenarse a mano. Usa el mensaje de la IA cuando lo dio (explica
 * qué faltó en el dictado) y un texto genérico en otro caso.
 */
export function calcularFaltantes(
  c: CabeceraMatriz,
  peligros: PeligroMatriz[],
  plan: AccionPlan[],
  mensajesIa: Partial<Record<CampoMatriz, string>> = {},
): Faltante[] {
  const vacio: CampoMatriz[] = [];
  if (!c.departamento) vacio.push('departamento');
  if (!c.puesto) vacio.push('puesto');
  if (!c.provincia) vacio.push('provincia');
  if (!c.canton) vacio.push('canton');
  if (!c.tiempoExposicionHoras) vacio.push('tiempoExposicion');
  const t = c.trabajadores;
  if (t.hombres === null || t.mujeres === null || t.discapacitados === null)
    vacio.push('trabajadores');
  if (!c.responsableDirecto) vacio.push('responsableDirecto');
  if (!c.responsableSso) vacio.push('responsableSso');
  if (!c.actividadesRutinarias) vacio.push('actividadesRutinarias');
  if (!c.actividadesNoRutinarias) vacio.push('actividadesNoRutinarias');
  if (!c.herramientas) vacio.push('herramientas');
  if (!peligros.length) vacio.push('peligros');
  const sinEspecificar = peligros.filter(
    (p) => PELIGRO_POR_CODIGO.get(p.codigo)?.especificar && !p.especificacion,
  );
  if (sinEspecificar.length) vacio.push('especificacion');
  if (plan.some((a) => !a.responsable || !a.fechaInicio || !a.fechaFin))
    vacio.push('planAccion');

  return vacio.map((campo) => ({
    campo,
    mensaje:
      mensajesIa[campo]?.trim() ||
      (campo === 'especificacion'
        ? `Especifica el agente de: ${sinEspecificar.map((p) => `${p.codigo} ${p.nombre}`).join('; ')}.`
        : `No se indicó ${ETIQUETA[campo]}. Complétalo manualmente.`),
  }));
}
