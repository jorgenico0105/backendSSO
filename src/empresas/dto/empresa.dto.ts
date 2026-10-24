import { PartialType } from '@nestjs/mapped-types';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import { NivelRiesgo } from '../../common/enums';

const RUC = /^\d{13}$/;
const CEDULA = /^\d{10}$/;

export class CrearEmpresaDto {
  @IsString() @IsNotEmpty() @MaxLength(200) razonSocial: string;
  @IsOptional() @IsString() @MaxLength(200) nombreComercial?: string;
  @Matches(RUC, { message: 'El RUC debe tener 13 dígitos' }) ruc: string;
  @IsOptional() @IsString() @MaxLength(60) tipoContribuyente?: string;
  @IsOptional() @IsString() @MaxLength(255) actividadEconomica?: string;
  @IsOptional() @IsString() @MaxLength(20) codigoCiiu?: string;
  @IsOptional() @IsString() @MaxLength(100) sector?: string;
  @IsOptional() @IsDateString() fechaConstitucion?: string;
  @IsOptional() @IsString() @MaxLength(30) numeroPatronalIess?: string;

  @IsString() @IsNotEmpty() @MaxLength(150) representanteLegalNombre: string;
  @Matches(CEDULA, {
    message: 'La cédula del representante debe tener 10 dígitos',
  })
  representanteLegalCedula: string;
  @IsOptional() @IsString() @MaxLength(100) representanteLegalCargo?: string;
  @IsOptional() @IsEmail() representanteLegalEmail?: string;
  @IsOptional() @IsString() @MaxLength(20) representanteLegalTelefono?: string;

  @IsOptional() @IsString() @MaxLength(150) responsableSstNombre?: string;
  @IsOptional()
  @Matches(CEDULA, {
    message: 'La cédula del responsable SST debe tener 10 dígitos',
  })
  responsableSstCedula?: string;
  @IsOptional() @IsEmail() responsableSstEmail?: string;
  @IsOptional() @IsString() @MaxLength(20) responsableSstTelefono?: string;

  @IsOptional() @IsString() @MaxLength(255) slogan?: string;
  @IsOptional()
  @Matches(/^#[0-9a-fA-F]{6}$/, { message: 'Color en formato #RRGGBB' })
  colorMarca?: string;
  @IsOptional() @IsString() descripcion?: string;
  @IsOptional() @IsString() mision?: string;
  @IsOptional() @IsString() vision?: string;

  @IsOptional() @IsString() @MaxLength(80) pais?: string;
  @IsOptional() @IsString() @MaxLength(80) provincia?: string;
  @IsOptional() @IsString() @MaxLength(80) ciudad?: string;
  @IsOptional() @IsString() @MaxLength(255) direccion?: string;
  @IsOptional() @IsString() @MaxLength(20) telefono?: string;
  @IsOptional() @IsString() @MaxLength(20) celular?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() @MaxLength(200) sitioWeb?: string;

  @IsOptional() @IsInt() @Min(0) numeroEmpleados?: number;
  @IsOptional() @IsEnum(NivelRiesgo) nivelRiesgo?: NivelRiesgo;
  @IsOptional() @IsString() @MaxLength(60) turno?: string;
  @IsOptional() @IsString() @MaxLength(30) horarioLaboral?: string;
  @IsOptional() @IsDateString() fechaUltimoAccidente?: string;
  @IsOptional() @IsInt() @Min(1) metaDiasSinAccidentes?: number;
  @IsOptional() @IsBoolean() activo?: boolean;
}

export class ActualizarEmpresaDto extends PartialType(CrearEmpresaDto) {}

export class CrearAreaDto {
  @IsString() @IsNotEmpty() @MaxLength(120) nombre: string;
  @IsOptional() @IsString() descripcion?: string;
  @IsOptional() @IsString() @MaxLength(200) ubicacion?: string;
  @IsOptional() @IsString() @MaxLength(150) responsable?: string;
  @IsOptional() @IsEnum(NivelRiesgo) nivelRiesgo?: NivelRiesgo;
  @IsOptional() @IsBoolean() activo?: boolean;
}

export class ActualizarAreaDto extends PartialType(CrearAreaDto) {}

export class CrearPuestoDto {
  @IsString() @IsNotEmpty() @MaxLength(120) nombre: string;
  @IsOptional() @IsString() descripcion?: string;
  @IsOptional() @IsString() funciones?: string;
  @IsOptional() @IsString() @MaxLength(60) cicloTrabajo?: string;
  @IsOptional() @IsNumber() @Min(0) jornadaHoras?: number;
  @IsOptional() @IsInt() @Min(0) numeroTrabajadores?: number;
  @IsOptional() @IsEnum(NivelRiesgo) nivelRiesgo?: NivelRiesgo;
  @IsOptional() @IsArray() @IsString({ each: true }) eppRequerido?: string[];
  /** null para desvincular del área. */
  @IsOptional() @IsInt() areaId?: number | null;
  @IsOptional() @IsBoolean() activo?: boolean;
}

export class ActualizarPuestoDto extends PartialType(CrearPuestoDto) {}
