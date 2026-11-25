// Informe ampliatorio de investigación de accidentes e incidentes (formato RSE-04-00-02).
// Estructura del registro, normalización de lo que llega (IA o edición manual) y campos pendientes.
// La app replica estos tipos en mobile/src/domain/accidentes.ts.

export interface TrabajadorAccidentado {
  nombre: string;
  /** YYYY-MM-DD o "" si no se dijo. */
  fechaNacimiento: string;
  ocupacion: string;
  /** Resultado del accidente para este trabajador (lesión), o "Sin lesión" en un incidente. */
  resultado: string;
}

export interface DatosInforme {
  tipoEvento: 'accidente' | 'incidente';
  // 1. Datos de la investigación
  investigador: { nombre: string; cedula: string; competencia: string };
  /** YYYY-MM-DD */
  fechaInvestigacion: string;
  entrevistados: string[];
  tecnicas: string;
  // 2. Datos del trabajador/es accidentado
  trabajadores: TrabajadorAccidentado[];
  // 3. Introducción
  introduccion: string;
  lugar: string;
  /** Fecha del suceso, YYYY-MM-DD. */
  fecha: string;
  /** Hora aproximada del suceso, HH:MM. */
  hora: string;
  // 4 y 5
  consecuencia: string;
  descripcion: string;
  // Causalidad
  actos: string[];
  condiciones: string[];
  factoresTrabajador: string[];
  factoresTrabajo: string[];
  causasBasicas: string;
  // 6. Acciones correctivas
  acciones: string[];
  /** Firma del informe ("Atentamente"). */
  firma: { nombre: string; cargo: string };
}

/** Campos que la IA o la validación pueden marcar como pendientes de llenar a mano. */
export const CAMPOS_INFORME = [
  'investigador',
  'competencia',
  'fechaInvestigacion',
  'entrevistados',
  'tecnicas',
  'trabajadores',
  'lugar',
  'fecha',
  'hora',
  'consecuencia',
  'descripcion',
  'causasDirectas',
  'causasIndirectas',
  'causasBasicas',
  'acciones',
  'firma',
] as const;

export type CampoInforme = (typeof CAMPOS_INFORME)[number];

export interface FaltanteInforme {
  campo: CampoInforme;
  mensaje: string;
}

const ETIQUETA: Record<CampoInforme, string> = {
  investigador: 'el nombre y la cédula del técnico que investiga',
  competencia: 'la competencia (formación) del investigador',
  fechaInvestigacion: 'la fecha de la investigación',
  entrevistados: 'las personas entrevistadas',
  tecnicas: 'las técnicas y aparatos usados en la investigación',
  trabajadores:
    'los datos del trabajador accidentado (nombre, fecha de nacimiento, ocupación y resultado)',
  lugar: 'el lugar del suceso',
  fecha: 'la fecha del suceso',
  hora: 'la hora del suceso',
  consecuencia: 'la consecuencia del accidente',
  descripcion: 'la descripción de cómo ocurrió',
  causasDirectas:
    'las causas directas (actos y condiciones subestándar; "No se determina" si no hay)',
  causasIndirectas:
    'las causas indirectas (factores del trabajador y del trabajo; "No se determina" si no hay)',
  causasBasicas: 'las causas básicas',
  acciones: 'las acciones correctivas',
  firma: 'el nombre y cargo de quien firma el informe',
};

export const etiquetaCampo = (c: CampoInforme) => ETIQUETA[c];

export const hoy = () => new Date().toLocaleDateString('en-CA');

const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const HORA = /^([01]?\d|2[0-3]):[0-5]\d$/;

const txt = (v: unknown, max = 4000) =>
  typeof v === 'string' ? v.trim().slice(0, max) : '';
const fecha = (v: unknown) => {
  const s = txt(v, 10);
  return FECHA.test(s) && !Number.isNaN(Date.parse(s)) ? s : '';
};
const hora = (v: unknown) => {
  const s = txt(v, 5);
  if (!HORA.test(s)) return '';
  const [h, m] = s.split(':');
  return `${h.padStart(2, '0')}:${m}`;
};
const lista = (v: unknown, max = 30) =>
  Array.isArray(v)
    ? v
        .map((x) => txt(x, 1000))
        .filter(Boolean)
        .slice(0, max)
    : [];
const obj = (v: unknown): Record<string, unknown> =>
  v && typeof v === 'object' && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {};

/** Datos vacíos: punto de partida antes del dictado. */
export function informeVacio(): DatosInforme {
  return {
    tipoEvento: 'accidente',
    investigador: { nombre: '', cedula: '', competencia: '' },
    fechaInvestigacion: hoy(),
    entrevistados: [],
    tecnicas: '',
    trabajadores: [],
    introduccion: '',
    lugar: '',
    fecha: '',
    hora: '',
    consecuencia: '',
    descripcion: '',
    actos: [],
    condiciones: [],
    factoresTrabajador: [],
    factoresTrabajo: [],
    causasBasicas: '',
    acciones: [],
    firma: { nombre: '', cargo: '' },
  };
}

/**
 * Limpia lo que llega de la IA o de la app: recorta textos, valida fechas y horas y descarta
 * trabajadores vacíos. Lo que no viene en `v` se toma de `base`.
 */
export function normalizarInforme(
  v: unknown,
  base: DatosInforme,
): DatosInforme {
  const d = obj(v);
  const has = (k: string) => k in d;
  const inv = obj(d.investigador);
  const firma = obj(d.firma);
  const trabajadores = has('trabajadores')
    ? (Array.isArray(d.trabajadores) ? d.trabajadores : [])
        .map((t) => {
          const o = obj(t);
          return {
            nombre: txt(o.nombre, 150),
            fechaNacimiento: fecha(o.fechaNacimiento),
            ocupacion: txt(o.ocupacion, 150),
            resultado: txt(o.resultado, 500),
          };
        })
        .filter((t) => t.nombre || t.ocupacion || t.resultado)
        .slice(0, 10)
    : base.trabajadores;
  return {
    tipoEvento: has('tipoEvento')
      ? d.tipoEvento === 'incidente'
        ? 'incidente'
        : 'accidente'
      : base.tipoEvento,
    investigador: has('investigador')
      ? {
          nombre: txt(inv.nombre, 150),
          cedula: txt(inv.cedula, 13),
          competencia: txt(inv.competencia, 200),
        }
      : base.investigador,
    fechaInvestigacion: has('fechaInvestigacion')
      ? fecha(d.fechaInvestigacion)
      : base.fechaInvestigacion,
    entrevistados: has('entrevistados')
      ? lista(d.entrevistados, 20)
      : base.entrevistados,
    tecnicas: has('tecnicas') ? txt(d.tecnicas, 1000) : base.tecnicas,
    trabajadores,
    introduccion: has('introduccion')
      ? txt(d.introduccion, 2000)
      : base.introduccion,
    lugar: has('lugar') ? txt(d.lugar, 200) : base.lugar,
    fecha: has('fecha') ? fecha(d.fecha) : base.fecha,
    hora: has('hora') ? hora(d.hora) : base.hora,
    consecuencia: has('consecuencia')
      ? txt(d.consecuencia, 1000)
      : base.consecuencia,
    descripcion: has('descripcion')
      ? txt(d.descripcion, 10000)
      : base.descripcion,
    actos: has('actos') ? lista(d.actos) : base.actos,
    condiciones: has('condiciones') ? lista(d.condiciones) : base.condiciones,
    factoresTrabajador: has('factoresTrabajador')
      ? lista(d.factoresTrabajador)
      : base.factoresTrabajador,
    factoresTrabajo: has('factoresTrabajo')
      ? lista(d.factoresTrabajo)
      : base.factoresTrabajo,
    causasBasicas: has('causasBasicas')
      ? txt(d.causasBasicas, 4000)
      : base.causasBasicas,
    acciones: has('acciones') ? lista(d.acciones) : base.acciones,
    firma: has('firma')
      ? { nombre: txt(firma.nombre, 150), cargo: txt(firma.cargo, 200) }
      : base.firma,
  };
}

/** Campos obligatorios aún vacíos; usa el mensaje de la IA cuando lo dio. */
export function calcularFaltantesInforme(
  d: DatosInforme,
  mensajes: Partial<Record<CampoInforme, string>> = {},
): FaltanteInforme[] {
  const falta: Record<CampoInforme, boolean> = {
    investigador: !d.investigador.nombre || !d.investigador.cedula,
    competencia: !d.investigador.competencia,
    fechaInvestigacion: !d.fechaInvestigacion,
    entrevistados: !d.entrevistados.length,
    tecnicas: !d.tecnicas,
    trabajadores:
      !d.trabajadores.length ||
      d.trabajadores.some(
        (t) => !t.nombre || !t.fechaNacimiento || !t.ocupacion || !t.resultado,
      ),
    lugar: !d.lugar,
    fecha: !d.fecha,
    hora: !d.hora,
    consecuencia: !d.consecuencia,
    descripcion: !d.descripcion,
    causasDirectas: !d.actos.length && !d.condiciones.length,
    causasIndirectas: !d.factoresTrabajador.length && !d.factoresTrabajo.length,
    causasBasicas: !d.causasBasicas,
    acciones: !d.acciones.length,
    firma: !d.firma.nombre || !d.firma.cargo,
  };
  return CAMPOS_INFORME.filter((c) => falta[c]).map((campo) => ({
    campo,
    mensaje:
      mensajes[campo] || `Falta ${ETIQUETA[campo]}; complétalo manualmente.`,
  }));
}
