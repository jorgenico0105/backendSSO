import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export const PERMISOS_ESPECIALES = [
  'altura',
  'caliente',
  'energia',
  'confinado',
  'frio',
  'otros',
] as const;

export class CrearPermisoDto {
  @IsString()
  @IsNotEmpty({ message: 'Describe el trabajo a realizar' })
  @MaxLength(4000)
  descripcion: string;

  @IsOptional() @Type(() => Number) @IsInt() areaId?: number;
  @IsDateString() fechaInicio: string;
  @IsDateString() fechaFin: string;

  @IsArray()
  @ArrayMaxSize(PERMISOS_ESPECIALES.length)
  @IsIn(PERMISOS_ESPECIALES, { each: true })
  especiales: string[];

  @IsObject() datos: Record<string, unknown>;
  @IsOptional() @IsObject() art?: Record<string, unknown> | null;
}

export class ActualizarPermisoDto extends PartialType(CrearPermisoDto) {}
