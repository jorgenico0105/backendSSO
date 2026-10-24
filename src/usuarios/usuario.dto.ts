import { PartialType } from '@nestjs/mapped-types';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Perfil } from '../common/enums';

export class CrearUsuarioDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombres: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  apellidos?: string;

  @IsEmail({}, { message: 'Correo electrónico no válido' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  password: string;

  @IsOptional()
  @IsString()
  @MaxLength(13)
  cedula?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  telefono?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  cargo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  licencia?: string;

  @IsOptional()
  @IsEnum(Perfil)
  perfil?: Perfil;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  /** Empresas que podrá auditar. */
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  empresaIds?: number[];

  /** Códigos de features (pestañas) a las que tendrá acceso. */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  featureCodigos?: string[];
}

export class ActualizarUsuarioDto extends PartialType(CrearUsuarioDto) {}
