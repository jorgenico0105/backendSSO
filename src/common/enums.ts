export enum Perfil {
  /** Administrador general: ve y gestiona todas las empresas. */
  ADMINISTRADOR = 'ADMINISTRADOR',
  /** Administra usuarios, áreas y puestos solo de sus empresas asignadas. */
  ADMIN_EMPRESA = 'ADMIN_EMPRESA',
  /** Técnico de campo: solo ve los registros que él mismo creó. */
  USUARIO = 'USUARIO',
}

export enum NivelRiesgo {
  BAJO = 'bajo',
  MEDIO = 'medio',
  ALTO = 'alto',
  CRITICO = 'critico',
}

export enum TipoReporte {
  ACTO = 'acto',
  CONDICION = 'condicion',
}

export enum EstadoAnalisis {
  /** Video en cola o en proceso en el servicio de análisis postural. */
  PROCESANDO = 'PROCESANDO',
  /** La IA ya respondió pero el usuario aún no confirma el reporte. */
  ANALIZADO = 'ANALIZADO',
  REGISTRADO = 'REGISTRADO',
  ERROR = 'ERROR',
}

/** Archivo de una evaluación ergonómica. */
export enum MedioAnalisis {
  VIDEO = 'video',
  IMAGEN = 'imagen',
}

/** Códigos de features = pestañas del menú inferior de la app. */
export enum FeatureCodigo {
  HUB = 'HUB',
  ACTOS = 'ACTOS',
  VOZ = 'VOZ',
  ERGO = 'ERGO',
  PERMISOS = 'PERMISOS',
  ACCIDENTES = 'ACCIDENTES',
}

/** Matriz de riesgos: BORRADOR mientras falten datos por llenar a mano. */
export enum EstadoMatriz {
  BORRADOR = 'BORRADOR',
  COMPLETA = 'COMPLETA',
}

/** Ciclo del permiso de trabajo (RSE-16-00-01). */
export enum EstadoPermiso {
  PENDIENTE = 'PENDIENTE',
  AUTORIZADO = 'AUTORIZADO',
  CERRADO = 'CERRADO',
}
