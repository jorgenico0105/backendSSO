import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsIn,
  IsInt,
  IsJSON,
  IsObject,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { NivelRiesgo, TipoReporte } from '../../common/enums';

// Los campos de formularios multipart llegan como texto: se convierten a número.
const opcionalNumero = () =>
  Transform(({ value }) =>
    value === '' || value == null ? undefined : Number(value),
  );

/**
 * Campos que acompañan a la imagen en POST /empresas/:id/reportes/analizar.
 * El tipo (acto / condición) no se envía: lo decide el agente.
 */
export class AnalizarImagenDto {
  @IsOptional() @opcionalNumero() @IsInt() areaId?: number;
  @IsOptional() @IsString() @MaxLength(2000) descripcion?: string;
}

export class RegistrarReporteDto {
  @IsEnum(TipoReporte) tipo: TipoReporte;
  @IsOptional() @Type(() => Number) @IsInt() areaId?: number;
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  clasificaciones: string[];
  @IsEnum(NivelRiesgo) severidad: NivelRiesgo;
  @IsString()
  @IsNotEmpty({ message: 'La descripción es obligatoria' })
  @MaxLength(4000)
  descripcion: string;
  @IsOptional() @IsString() @MaxLength(6000) accionCorrectiva?: string;
}

/** Campos que acompañan al video o al audio. */
export class ContextoAnalisisDto {
  @IsOptional() @opcionalNumero() @IsInt() areaId?: number;
  @IsOptional() @opcionalNumero() @IsInt() puestoId?: number;
  @IsOptional() @IsString() @MaxLength(255) nombreArchivo?: string;
}

/** Campos que acompañan a la imagen o al video de una evaluación ergonómica. */
export class AnalizarErgoDto extends ContextoAnalisisDto {
  /** Lado evaluado en RULA/REBA; con "ambos" se toma el más comprometido. */
  @IsOptional() @IsIn(['izquierdo', 'derecho', 'ambos']) lado?:
    'izquierdo' | 'derecho' | 'ambos';
  /** JSON con FactoresRiesgo del servicio postural (carga_kg, agarre, ...). */
  @IsOptional() @IsJSON() factores?: string;
}

/** Datos que el auditor completa o corrige en una matriz de riesgos (se validan en el servicio). */
export class ActualizarMatrizDto {
  @IsOptional() @IsObject() cabecera?: Record<string, unknown>;
  @IsOptional() @IsArray() @ArrayMaxSize(100) peligros?: unknown[];
  @IsOptional() @IsArray() @ArrayMaxSize(100) planAccion?: unknown[];
}

/** PATCH /accidentes/:id — el informe completo o las secciones editadas (se normaliza en el servicio). */
export class ActualizarInformeDto {
  @IsObject() datos: Record<string, unknown>;
}
