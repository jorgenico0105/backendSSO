// Esquemas de salida estructurada del agente (OpenAI Structured Outputs).
// Todos los campos son obligatorios: Structured Outputs no admite opcionales.
import { z } from 'zod';
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
