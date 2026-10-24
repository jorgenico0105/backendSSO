import { PartialType } from '@nestjs/mapped-types';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { TipoReporte } from '../common/enums';

export class CrearClasificacionDto {
  @IsEnum(TipoReporte) tipo: TipoReporte;
  @IsString() @IsNotEmpty() @MaxLength(80) nombre: string;
  @IsOptional() @IsString() @MaxLength(1000) medida?: string;
  @IsOptional() @IsInt() orden?: number;
  @IsOptional() @IsBoolean() activo?: boolean;
}

export class ActualizarClasificacionDto extends PartialType(
  CrearClasificacionDto,
) {}
