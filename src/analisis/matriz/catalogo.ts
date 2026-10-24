// Catálogo de peligros de la matriz de identificación y estimación cualitativa de riesgos
// (formato F-PSSO-IMEC-02). Generado desde "Matrices INSST UNL 2026.xlsx": 7 factores y la
// medida de control que la plantilla propone por defecto para cada peligro.

export interface FactorRiesgo {
  id: number;
  nombre: string;
}

export interface PeligroCatalogo {
  codigo: string;
  factor: number;
  nombre: string;
  /** Requiere precisar el agente (gases de..., vapores de...). */
  especificar: boolean;
  medida: string;
}

export const FACTORES: FactorRiesgo[] = [
  { id: 1, nombre: 'Factores de seguridad' },
  { id: 2, nombre: 'Factores físicos' },
  { id: 3, nombre: 'Factores químicos' },
  { id: 4, nombre: 'Factores biológicos' },
  { id: 5, nombre: 'Factores ergonómicos' },
  { id: 6, nombre: 'Factores psicosociales' },
  { id: 7, nombre: 'Otros / accidentes mayores' },
];

const p = (
  codigo: string,
  nombre: string,
  medida: string,
): PeligroCatalogo => ({
  codigo,
  factor: Number(codigo.split('.')[0]),
  nombre,
  especificar: /especificar/i.test(nombre),
  medida,
});

export const CATALOGO_PELIGROS: PeligroCatalogo[] = [
  p(
    '1.1',
    'Caída de persona a distinto nivel',
    'Señalética y cintas antideslizantes',
  ),
  p(
    '1.2',
    'Caída de personas al mismo nivel',
    'Organización y distribución del espacio de trabajo',
  ),
  p('1.3', 'Caída por objetos por desplome', 'Uso obligatorio EPP'),
  p('1.4', 'Caída de objetos en manipulación', 'Uso obligatorio EPP'),
  p(
    '1.5',
    'Obstáculos en el piso',
    'Organización y distribución del espacio de trabajo',
  ),
  p(
    '1.6',
    'Golpes contra objetos inmóviles',
    'Organización y distribución del espacio de trabajo',
  ),
  p(
    '1.7',
    'Golpes o contactos con elementos móviles de la máquina',
    'Uso EPP y capacitación del uso correcto',
  ),
  p(
    '1.8',
    'Golpes o cortes por objetos o herramientas',
    'Uso EPP y capacitación del uso correcto',
  ),
  p('1.9', 'Proyección de fragmentos o partículas', 'Uso EPP'),
  p(
    '1.10',
    'Atrapamiento por o entre objetos',
    'Uso EPP y capacitación del uso correcto',
  ),
  p(
    '1.11',
    'Atrapamiento por vuelco de máquinas o vehículos',
    'Uso EPP y capacitación del uso correcto',
  ),
  p(
    '1.12',
    'Atropello o golpes por vehículos',
    'Señalética de límite de seguridad y capacitación de conducción a la defensiva',
  ),
  p(
    '1.13',
    'Atropello, golpes o choques contra o con vehículos',
    'Señalética de límite de seguridad y capacitación de conducción a la defensiva',
  ),
  p(
    '1.14',
    'Accidente de tráfico',
    'Señalética de límite de seguridad y capacitación de conducción a la defensiva',
  ),
  p('1.15', 'Trabajos en espacios confinados', 'Uso EPP'),
  p('1.16', 'Trabajos de mantenimiento', 'Uso EPP y señalización'),
  p('2.1', 'Estrés térmico', 'Ventilación del área de trabajo'),
  p('2.2', 'Contactos térmicos', 'Uso EPP'),
  p(
    '2.3',
    'Contactos eléctricos directos',
    'Uso EPP y protección de los contactos',
  ),
  p(
    '2.4',
    'Contactos eléctricos indirectos',
    'Uso EPP y protección de los contactos',
  ),
  p('2.5', 'Iluminación insuficiente', 'Implementar iluminación'),
  p('2.6', 'Ruido', 'Uso EPP'),
  p('2.7', 'Vibración', 'Uso EPP'),
  p(
    '2.8',
    'Exposición a radiaciones NO Ionizantes',
    'Uso EPPs y corta exposición',
  ),
  p('3.1', 'Polvo Orgánico', 'Uso EPP'),
  p('3.2', 'Polvo inorgánico (mineral o metálico)', 'Uso EPP'),
  p('3.3', 'Gases (especificar)', 'Uso EPP'),
  p('3.4', 'Vapores (especificar)', 'Uso EPP'),
  p('3.5', 'Nieblas (especificar)', 'Uso EPP'),
  p('3.6', 'Aerosoles sólidos y particulados (especificar)', 'Uso EPP'),
  p('3.7', 'Aerosoles líquidos (especificar)', 'Uso EPP'),
  p('3.8', 'Exposición a sustancias cáusticas y/o corrosivas', 'Uso EPP'),
  p('3.9', 'Exposición a desinfectantes y sustancias de limpieza', 'Uso EPP'),
  p('3.10', 'SMOG (Contaminación ambiental)', 'Uso EPP'),
  p('4.1', 'Elementos en descomposición', 'Uso EPP y desecho de elementos'),
  p('4.2', 'Animales peligrosos (salvajes o domésticos)', ''),
  p('4.3', 'Animales venenosos o ponzoñosos', ''),
  p(
    '4.4',
    'Contagio por SARS-COV-2 u otros microorganismos',
    'Uso EPP y vigilancia médica',
  ),
  p(
    '4.5',
    'Insalubridad - Agentes biológicos (microorganismos, virus, bacterias, hongos, parásitos)',
    'Limpieza y desinfección',
  ),
  p(
    '4.6',
    'Consumo de alimentos no garantizados',
    'Tabla de contenido y valoración',
  ),
  p(
    '4.7',
    'Alergenos de origen animal o vegetal',
    'Uso EPP y vigilancia médica',
  ),
  p(
    '5.1',
    'Sobreesfuerzo físico',
    'Pausas activas, capacitación y campañas ergonómicas',
  ),
  p('5.2', 'Levantamiento Manual de Objetos', 'campaña y capacitación'),
  p('5.3', 'Movimiento corporal repetitivo', 'campaña y capacitación'),
  p('5.4', 'Disconfort acústico', 'Uso EPP'),
  p('5.5', 'Disconfort térmico', 'Uso EPP'),
  p('5.6', 'Disconfort lumínico', 'Implementación iluminación'),
  p('5.7', 'Calidad de aire', 'Uso EPP'),
  p(
    '5.8',
    'Posición forzada y prolongada (de pie, sentada, encorvada, acostada)',
    'Pausas activas',
  ),
  p(
    '5.9',
    'Uso inadecuado de pantallas de visualización PVDS',
    'Readecuación del área de trabajo y campaña ergonómica',
  ),
  p('6.1', 'Turnos rotativos', 'Vigilancia médica'),
  p('6.2', 'Trabajo nocturno', 'Vigilancia médica'),
  p('6.3', 'Trabajo a presión', 'Pausas activas'),
  p('6.4', 'Alta responsabilidad', 'Pausas activas y actividades recreativas'),
  p('6.5', 'Sobrecarga mental', 'Pausas activas y actividades recreativas'),
  p('6.6', 'Minuciosidad de tarea', 'Pausas activas y actividades recreativas'),
  p('6.7', 'Trabajo monótono', 'Pausas activas y actividades recreativas'),
  p(
    '6.8',
    'Inestabilidad en el empleo',
    'Regulación de los puestos de trabajo',
  ),
  p(
    '6.9',
    'Déficit de comunicación',
    'Canales de comunicación oficiales y generalizados',
  ),
  p('6.10', 'Inadecuada supervisión', 'Programas y campañas de liderazgo'),
  p(
    '6.11',
    'Relaciones interpersonales inadecuadas o deterioradas',
    'Vigilancia médica y apoyo de Trabajo Social',
  ),
  p(
    '6.12',
    'Desmotivación',
    'Campaña de identificación empresarial y personal',
  ),
  p(
    '6.13',
    'Desarraigo familiar',
    'Vigilancia médica y apoyo de Trabajo Social',
  ),
  p(
    '6.14',
    'Agresión o maltrato (Palabra y obra)',
    'Seguridad física y vigilancia',
  ),
  p('6.15', 'Trato con clientes y usuarios', 'Seguridad física y vigilancia'),
  p('6.16', 'Amenaza delincuencial', 'Seguridad física y vigilancia'),
  p('6.17', 'Inestabilidad emocional', 'Vigilancia médica'),
  p('6.18', 'Manifestaciones psicosomáticas', ''),
  p(
    '7.1',
    'Manejo de inflamables y/o explosivos',
    'Capacitación del uso adecuado',
  ),
  p(
    '7.2',
    'Recipientes o elementos a presión',
    'Capacitación de uso adecuado y EPP',
  ),
  p(
    '7.3',
    'Sistema eléctrico defectuoso',
    'Implementación del sistema eléctrico adecuado',
  ),
  p('7.4', 'Presencia de puntos de ignición', 'Sistema contra incendios'),
  p(
    '7.5',
    'Transporte y almacenamiento de productos químicos y material radioactivo',
    'Uso EPP y adecuación del lugar de almacenamiento',
  ),
  p('7.6', 'Depósito y acumulación de polvo', 'Uso EPP y limpieza'),
  p('7.7', 'Alta carga combustible', ''),
  p('7.8', 'Ubicación en zonas con riesgo de desastres', ''),
];

export const PELIGRO_POR_CODIGO = new Map(
  CATALOGO_PELIGROS.map((x) => [x.codigo, x]),
);

/** Probabilidad: 1 = baja, 2 = media, 3 = alta. Consecuencia: 1 = ligeramente dañino, 2 = dañino, 3 = extremadamente dañino. */
export const PROBABILIDAD = ['B', 'M', 'A'] as const;
export const CONSECUENCIA = ['LD', 'D', 'ED'] as const;

/** Estimación del riesgo = probabilidad + consecuencia (2..6). */
export const NIVELES = {
  2: { sigla: 'T', nombre: 'Trivial' },
  3: { sigla: 'TO', nombre: 'Tolerable' },
  4: { sigla: 'MO', nombre: 'Moderado' },
  5: { sigla: 'I', nombre: 'Importante' },
  6: { sigla: 'IN', nombre: 'Intolerable' },
} as const;
export type SiglaNivel = (typeof NIVELES)[keyof typeof NIVELES]['sigla'];

export function estimar(probabilidad: number, consecuencia: number) {
  const valor = Math.min(6, Math.max(2, probabilidad + consecuencia)) as
    2 | 3 | 4 | 5 | 6;
  return { valor, sigla: NIVELES[valor].sigla };
}

/** Plazo orientativo (meses) para cerrar la acción según el nivel de riesgo. */
export const PLAZO_MESES: Record<SiglaNivel, number> = {
  IN: 0,
  I: 1,
  MO: 3,
  TO: 6,
  T: 12,
};
