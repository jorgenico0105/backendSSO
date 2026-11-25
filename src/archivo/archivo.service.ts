import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AnalisisImagen } from '../analisis/entities/analisis-imagen.entity';
import { AnalisisVideo } from '../analisis/entities/analisis-video.entity';
import { InformeAccidente } from '../analisis/entities/informe-accidente.entity';
import { MatrizRiesgo } from '../analisis/entities/matriz-riesgo.entity';
import { esAdmin, type UsuarioSesion } from '../common/decorators';
import {
  EstadoAnalisis,
  FeatureCodigo,
  MedioAnalisis,
  TipoReporte,
} from '../common/enums';
import { EmpresasService } from '../empresas/empresas.service';
import { PermisoTrabajo } from '../permisos/permiso.entity';

export type TipoArchivo =
  'matriz' | 'reporte' | 'ergo' | 'permiso' | 'accidente';

/** Una fila del archivo de la empresa: lo justo para listarla; el detalle se pide al abrirla. */
export interface ItemArchivo {
  tipo: TipoArchivo;
  id: number;
  codigo: string | null;
  titulo: string;
  detalle: string;
  area: string | null;
  fecha: Date;
  estado: string;
  /** Severidad del reporte, nivel más alto de la matriz (T…IN) o puntaje REBA. */
  nivel: string | null;
  autor: string | null;
}

const ORDEN_NIVEL = ['T', 'TO', 'MO', 'I', 'IN'];

const autor = (u?: { nombres: string; apellidos: string } | null) =>
  u ? `${u.nombres} ${u.apellidos}`.trim() : null;

/**
 * Archivo de la empresa: matrices, reportes de actos y condiciones, evaluaciones ergonómicas,
 * permisos e informes de accidentes en una sola lista, la más reciente primero. Solo incluye los módulos que el usuario
 * tiene habilitados y, para el perfil USUARIO, solo lo que él creó; la app la agrupa por mes.
 */
@Injectable()
export class ArchivoService {
  constructor(
    @InjectRepository(MatrizRiesgo)
    private readonly matrices: Repository<MatrizRiesgo>,
    @InjectRepository(AnalisisImagen)
    private readonly reportes: Repository<AnalisisImagen>,
    @InjectRepository(AnalisisVideo)
    private readonly ergo: Repository<AnalisisVideo>,
    @InjectRepository(PermisoTrabajo)
    private readonly permisos: Repository<PermisoTrabajo>,
    @InjectRepository(InformeAccidente)
    private readonly accidentes: Repository<InformeAccidente>,
    private readonly empresas: EmpresasService,
  ) {}

  async listar(u: UsuarioSesion, empresaId: number): Promise<ItemArchivo[]> {
    this.empresas.asegurarAcceso(u, empresaId);
    const puede = (f: FeatureCodigo) => esAdmin(u) || u.features.includes(f);
    const empresa = { id: empresaId };
    // El perfil USUARIO solo ve en su archivo lo que él creó.
    const autoria = this.empresas.autoria(u);
    const persona = { nombres: true, apellidos: true } as const;

    const [matrices, reportes, ergo, permisos, accidentes] = await Promise.all([
      puede(FeatureCodigo.VOZ)
        ? this.matrices.find({
            where: { empresa, ...autoria },
            relations: { area: true, puesto: true, creadoPor: true },
            select: {
              id: true,
              codigo: true,
              estado: true,
              peligros: true,
              createdAt: true,
              area: { nombre: true },
              puesto: { nombre: true },
              creadoPor: persona,
            },
          })
        : [],
      puede(FeatureCodigo.ACTOS)
        ? this.reportes.find({
            where: { empresa, estado: EstadoAnalisis.REGISTRADO, ...autoria },
            relations: { area: true, creadoPor: true },
            select: {
              id: true,
              codigo: true,
              tipo: true,
              severidad: true,
              descripcion: true,
              clasificaciones: true,
              registradoEn: true,
              createdAt: true,
              area: { nombre: true },
              creadoPor: persona,
            },
          })
        : [],
      puede(FeatureCodigo.ERGO)
        ? this.ergo.find({
            where: {
              empresa,
              ...autoria,
              estado: In([EstadoAnalisis.ANALIZADO, EstadoAnalisis.PROCESANDO]),
            },
            relations: { area: true, puesto: true, creadoPor: true },
            select: {
              id: true,
              codigo: true,
              medio: true,
              estado: true,
              nombreArchivo: true,
              puntajeRula: true,
              puntajeReba: true,
              puntajeOwas: true,
              createdAt: true,
              area: { nombre: true },
              puesto: { nombre: true },
              creadoPor: persona,
            },
          })
        : [],
      puede(FeatureCodigo.PERMISOS)
        ? this.permisos.find({
            where: { empresa, ...autoria },
            relations: { area: true, creadoPor: true },
            select: {
              id: true,
              codigo: true,
              estado: true,
              descripcion: true,
              especiales: true,
              fechaInicio: true,
              createdAt: true,
              area: { nombre: true },
              creadoPor: persona,
            },
          })
        : [],
      puede(FeatureCodigo.ACCIDENTES)
        ? this.accidentes.find({
            where: { empresa, ...autoria },
            relations: { area: true, creadoPor: true },
            select: {
              id: true,
              codigo: true,
              estado: true,
              datos: true,
              resumen: true,
              createdAt: true,
              area: { nombre: true },
              creadoPor: persona,
            },
          })
        : [],
    ]);

    const items: ItemArchivo[] = [
      ...matrices.map((m): ItemArchivo => {
        const max = m.peligros.reduce(
          (a, p) => Math.max(a, ORDEN_NIVEL.indexOf(p.nivel)),
          -1,
        );
        return {
          tipo: 'matriz',
          id: m.id,
          codigo: m.codigo,
          titulo: m.puesto?.nombre ?? m.area?.nombre ?? 'Matriz de riesgos',
          detalle: `${m.peligros.length} peligro${m.peligros.length === 1 ? '' : 's'}`,
          area: m.area?.nombre ?? null,
          fecha: m.createdAt,
          estado: m.estado,
          nivel: max >= 0 ? ORDEN_NIVEL[max] : null,
          autor: autor(m.creadoPor),
        };
      }),
      ...reportes.map((r): ItemArchivo => ({
        tipo: 'reporte',
        id: r.id,
        codigo: r.codigo,
        titulo:
          r.tipo === TipoReporte.CONDICION
            ? 'Condición subestándar'
            : 'Acto subestándar',
        detalle:
          r.descripcion?.slice(0, 140) ?? r.clasificaciones?.join(', ') ?? '',
        area: r.area?.nombre ?? null,
        fecha: r.registradoEn ?? r.createdAt,
        estado: 'REGISTRADO',
        nivel: r.severidad,
        autor: autor(r.creadoPor),
      })),
      ...ergo.map((v): ItemArchivo => ({
        tipo: 'ergo',
        id: v.id,
        codigo: v.codigo,
        titulo: v.puesto?.nombre ?? v.nombreArchivo ?? 'Evaluación postural',
        detalle:
          v.estado === EstadoAnalisis.PROCESANDO
            ? 'Video en análisis'
            : `${v.medio === MedioAnalisis.IMAGEN ? 'Imagen' : 'Video'} • RULA ${v.puntajeRula ?? '—'} • REBA ${v.puntajeReba ?? '—'} • OWAS ${v.puntajeOwas ?? '—'}`,
        area: v.area?.nombre ?? null,
        fecha: v.createdAt,
        estado: v.estado,
        nivel: v.puntajeReba != null ? String(v.puntajeReba) : null,
        autor: autor(v.creadoPor),
      })),
      ...permisos.map((p): ItemArchivo => ({
        tipo: 'permiso',
        id: p.id,
        codigo: p.codigo,
        titulo: p.descripcion.slice(0, 120),
        detalle: p.especiales.join(', '),
        area: p.area?.nombre ?? null,
        fecha: p.fechaInicio ?? p.createdAt,
        estado: p.estado,
        nivel: null,
        autor: autor(p.creadoPor),
      })),
      ...accidentes.map((a): ItemArchivo => {
        const nombres = a.datos.trabajadores
          .map((t) => t.nombre)
          .filter(Boolean);
        return {
          tipo: 'accidente',
          id: a.id,
          codigo: a.codigo,
          titulo:
            a.datos.consecuencia ||
            (a.datos.tipoEvento === 'incidente'
              ? 'Investigación de incidente'
              : 'Investigación de accidente'),
          detalle: [a.datos.lugar, nombres.join(', ')]
            .filter(Boolean)
            .join(' • '),
          area: a.area?.nombre ?? null,
          // Fecha del suceso; si aún no se completó, la del informe.
          fecha: a.datos.fecha
            ? new Date(`${a.datos.fecha}T12:00:00`)
            : a.createdAt,
          estado: a.estado,
          nivel: a.datos.tipoEvento,
          autor: autor(a.creadoPor),
        };
      }),
    ];
    return items.sort((a, b) => +new Date(b.fecha) - +new Date(a.fecha));
  }
}
