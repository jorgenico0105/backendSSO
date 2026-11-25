// Esquemas de salida estructurada del agente (OpenAI Structured Outputs).
// Todos los campos son obligatorios: Structured Outputs no admite opcionales.
import { z } from 'zod';
import { CAMPOS_INFORME } from '../analisis/accidentes/informe';
import { CAMPOS_MATRIZ } from '../analisis/matriz/matriz';

const tipo = z.enum(['acto', 'condicion']);
const severidad = z.enum(['bajo', 'medio', 'alto', 'critico']);

export const AnalisisImagenIA = z.object({
  esEntornoLaboral: z.boolean(),
  tipoPrincipal: tipo,
  severidad,
  clasificaciones: z.array(z.string()),
  resumen: z.string(),
  hallazgos: z.array(
    z.object({
      tipo,
      descripcion: z.string(),
      clasificacion: z.string(),
      severidad,
      ubicacionEnImagen: z.string(),
    }),
  ),
  medidasInmediatas: z.array(z.string()),
  medidasCorrectivas: z.array(
    z.object({
      jerarquia: z.enum([
        'eliminacion',
        'sustitucion',
        'ingenieria',
        'administrativa',
        'epp',
      ]),
      descripcion: z.string(),
      plazo: z.string(),
    }),
  ),
  eppRequerido: z.array(z.string()),
  normativaReferencia: z.array(z.string()),
  descripcionSugerida: z.string(),
  areaSugerida: z.string(),
  confianza: z.number(),
});
export type AnalisisImagenIA = z.infer<typeof AnalisisImagenIA>;

/**
 * Matriz de riesgos por dictado. Structured Outputs no admite opcionales: "" y -1 / 0 significan
 * "no se dijo en el dictado", y el servicio los convierte en campos por llenar a mano.
 */
export const MatrizVozIA = z.object({
  segmentos: z.array(
    z.object({
      texto: z.string(),
      resaltado: z.enum(['ninguno', 'rojo', 'amarillo']),
    }),
  ),
  puesto: z.string(),
  actividadesRutinarias: z.string(),
  actividadesNoRutinarias: z.string(),
  herramientas: z.string(),
  responsableDirecto: z.string(),
  tiempoExposicionHoras: z.number(),
  hombres: z.number().int(),
  mujeres: z.number().int(),
  discapacitados: z.number().int(),
  maternidad: z.boolean(),
  discapacidad: z.boolean(),
  edadesExtremas: z.boolean(),
  detalleVulnerable: z.string(),
  peligros: z.array(
    z.object({
      codigo: z.string(),
      fragmento: z.string(),
      especificacion: z.string(),
      probabilidad: z.number().int(),
      consecuencia: z.number().int(),
      justificacion: z.string(),
      medida: z.string(),
    }),
  ),
  faltantes: z.array(
    z.object({
      campo: z.enum(CAMPOS_MATRIZ),
      mensaje: z.string(),
    }),
  ),
  resumen: z.string(),
});
export type MatrizVozIA = z.infer<typeof MatrizVozIA>;

/**
 * Informe de investigación de accidentes (RSE-04-00-02) por dictado. "" y [] significan
 * "no se dijo"; el servicio los convierte en campos por llenar a mano.
 */
export const InformeAccidenteIA = z.object({
  tipoEvento: z.enum(['accidente', 'incidente']),
  investigadorNombre: z.string(),
  investigadorCedula: z.string(),
  investigadorCompetencia: z.string(),
  fechaInvestigacion: z.string(),
  entrevistados: z.array(z.string()),
  tecnicas: z.string(),
  trabajadores: z.array(
    z.object({
      nombre: z.string(),
      fechaNacimiento: z.string(),
      ocupacion: z.string(),
      resultado: z.string(),
    }),
  ),
  lugar: z.string(),
  fecha: z.string(),
  hora: z.string(),
  introduccion: z.string(),
  consecuencia: z.string(),
  descripcion: z.string(),
  actos: z.array(z.string()),
  condiciones: z.array(z.string()),
  factoresTrabajador: z.array(z.string()),
  factoresTrabajo: z.array(z.string()),
  causasBasicas: z.string(),
  acciones: z.array(z.string()),
  faltantes: z.array(
    z.object({
      campo: z.enum(CAMPOS_INFORME),
      mensaje: z.string(),
    }),
  ),
  resumen: z.string(),
});
export type InformeAccidenteIA = z.infer<typeof InformeAccidenteIA>;
