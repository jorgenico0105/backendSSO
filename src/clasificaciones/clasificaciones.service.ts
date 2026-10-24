import {
  ConflictException,
  Injectable,
  NotFoundException,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TipoReporte } from '../common/enums';
import {
  ActualizarClasificacionDto,
  CrearClasificacionDto,
} from './clasificacion.dto';
import { Clasificacion } from './clasificacion.entity';

const BASE: [TipoReporte, string, string][] = [
  [
    TipoReporte.ACTO,
    'Caída a distinto nivel',
    'Delimitar la zona y verificar protección colectiva (barandillas, redes) antes de reanudar.',
  ],
  [
    TipoReporte.ACTO,
    'Eléctrico',
    'Aplicar bloqueo y etiquetado (LOTO) y verificar ausencia de tensión antes de intervenir.',
  ],
  [
    TipoReporte.ACTO,
    'EPP incompleto',
    'Detener la tarea hasta dotar el EPP requerido por la evaluación del puesto.',
  ],
  [
    TipoReporte.ACTO,
    'Orden y limpieza',
    'Despejar vías de circulación y señalizar obstáculos (método 5S).',
  ],
  [
    TipoReporte.ACTO,
    'Manipulación de cargas',
    'Usar ayudas mecánicas o manipulación en equipo para cargas > 25 kg.',
  ],
  [
    TipoReporte.ACTO,
    'Uso indebido de equipos',
    'Retirar el equipo de servicio y reforzar la formación del operario.',
  ],
  [
    TipoReporte.CONDICION,
    'Caída a distinto nivel',
    'Delimitar la zona y verificar protección colectiva (barandillas, redes) antes de reanudar.',
  ],
  [
    TipoReporte.CONDICION,
    'Eléctrico',
    'Aplicar bloqueo y etiquetado (LOTO) y verificar ausencia de tensión antes de intervenir.',
  ],
  [
    TipoReporte.CONDICION,
    'Resguardo ausente',
    'Consignar la máquina y reinstalar el resguardo antes de su puesta en marcha.',
  ],
  [
    TipoReporte.CONDICION,
    'Orden y limpieza',
    'Despejar vías de circulación y señalizar obstáculos (método 5S).',
  ],
  [
    TipoReporte.CONDICION,
    'Iluminación deficiente',
    'Instalar iluminación provisional y medir los niveles de iluminación del puesto.',
  ],
  [
    TipoReporte.CONDICION,
    'Agente químico',
    'Ventilar, aislar el foco y verificar la hoja de seguridad (MSDS) del producto.',
  ],
];

/** Catálogo de clasificaciones inmediatas que usan el bot de actos/condiciones y la app. */
@Injectable()
export class ClasificacionesService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(Clasificacion)
    private readonly repo: Repository<Clasificacion>,
  ) {}

  /** Siembra las clasificaciones iniciales solo si la tabla está vacía. */
  async onApplicationBootstrap() {
    if (await this.repo.count()) return;
    await this.repo.save(
      BASE.map(([tipo, nombre, medida], i) =>
        this.repo.create({ tipo, nombre, medida, orden: i % 6 }),
      ),
    );
  }

  listar(incluirInactivas = false) {
    return this.repo.find({
      where: incluirInactivas ? {} : { activo: true },
      order: { tipo: 'ASC', orden: 'ASC', nombre: 'ASC' },
    });
  }

  /** Nombres activos por tipo, para el prompt del agente y para filtrar su respuesta. */
  async nombresPorTipo(): Promise<Record<TipoReporte, string[]>> {
    const out: Record<TipoReporte, string[]> = {
      [TipoReporte.ACTO]: [],
      [TipoReporte.CONDICION]: [],
    };
    for (const c of await this.listar()) out[c.tipo].push(c.nombre);
    return out;
  }

  async crear(dto: CrearClasificacionDto) {
    const nombre = dto.nombre.trim();
    await this.asegurarUnica(dto.tipo, nombre);
    return this.repo.save(
      this.repo.create({
        ...dto,
        nombre,
        medida: dto.medida?.trim() || null,
      }),
    );
  }

  async actualizar(id: number, dto: ActualizarClasificacionDto) {
    const c = await this.repo.findOneBy({ id });
    if (!c) throw new NotFoundException('Clasificación no encontrada');
    const nombre = dto.nombre?.trim() ?? c.nombre;
    const tipo = dto.tipo ?? c.tipo;
    if (nombre !== c.nombre || tipo !== c.tipo)
      await this.asegurarUnica(tipo, nombre, id);
    await this.repo.update(id, {
      ...dto,
      nombre,
      tipo,
      ...(dto.medida !== undefined && { medida: dto.medida.trim() || null }),
    });
    return this.repo.findOneByOrFail({ id });
  }

  /** Los reportes guardan el nombre como texto, así que borrar no rompe el historial. */
  async eliminar(id: number) {
    const r = await this.repo.delete({ id });
    if (!r.affected) throw new NotFoundException('Clasificación no encontrada');
    return { ok: true };
  }

  private async asegurarUnica(tipo: TipoReporte, nombre: string, id?: number) {
    const otra = await this.repo.findOneBy({ tipo, nombre });
    if (otra && otra.id !== id)
      throw new ConflictException(
        `Ya existe la clasificación "${nombre}" para ${tipo === TipoReporte.ACTO ? 'actos' : 'condiciones'}`,
      );
  }
}
