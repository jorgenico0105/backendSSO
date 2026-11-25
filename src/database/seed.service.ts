import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { hash } from 'bcryptjs';
import { Repository } from 'typeorm';
import { FeatureCodigo, Perfil } from '../common/enums';
import { Feature } from '../features/feature.entity';
import { UsuarioFeature } from '../features/usuario-feature.entity';
import { Usuario } from '../usuarios/usuario.entity';

const FEATURES: Pick<
  Feature,
  'codigo' | 'nombre' | 'descripcion' | 'icono' | 'ruta' | 'enMenu' | 'orden'
>[] = [
  {
    codigo: FeatureCodigo.HUB,
    nombre: 'Hub',
    descripcion: 'Panel operativo SST',
    icono: 'grid-view',
    ruta: '/',
    enMenu: true,
    orden: 1,
  },
  {
    codigo: FeatureCodigo.ACTOS,
    nombre: 'Actos/Cond',
    descripcion:
      'Bot de actos y condiciones subestándar con análisis de imagen por IA',
    icono: 'warning',
    ruta: '/actos',
    enMenu: true,
    orden: 2,
  },
  {
    codigo: FeatureCodigo.VOZ,
    nombre: 'Voz INSST',
    descripcion:
      'Matriz de identificación y estimación de riesgos por dictado de voz',
    icono: 'mic',
    ruta: '/voz',
    enMenu: true,
    orden: 3,
  },
  {
    codigo: FeatureCodigo.ERGO,
    nombre: 'Ergo Eval',
    descripcion: 'Evaluación ergonómica RULA / REBA / OWAS por video',
    icono: 'accessibility-new',
    ruta: '/ergo',
    enMenu: true,
    orden: 4,
  },
  {
    codigo: FeatureCodigo.PERMISOS,
    nombre: 'Permisos PT',
    descripcion: 'Permiso de trabajo seguro y ART (RSE-16-00-01 / 02)',
    icono: 'assignment',
    ruta: '/permisos',
    enMenu: false,
    orden: 5,
  },
  {
    codigo: FeatureCodigo.ACCIDENTES,
    nombre: 'Accidentes',
    descripcion:
      'Informe de investigación de accidentes e incidentes por voz (RSE-04-00-02)',
    icono: 'personal-injury',
    ruta: '/accidentes',
    enMenu: false,
    orden: 6,
  },
];

/** Datos base idempotentes: catálogo de features y el super administrador. */
@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly log = new Logger(SeedService.name);

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(Feature) private readonly features: Repository<Feature>,
    @InjectRepository(Usuario) private readonly usuarios: Repository<Usuario>,
    @InjectRepository(UsuarioFeature)
    private readonly usuarioFeatures: Repository<UsuarioFeature>,
  ) {}

  async onApplicationBootstrap() {
    for (const f of FEATURES) {
      const existe = await this.features.findOneBy({ codigo: f.codigo });
      if (!existe) await this.features.save(this.features.create(f));
    }

    const email = this.config
      .get<string>('SEED_ADMIN_EMAIL', 'admin@sstprevencion.com')
      .toLowerCase();
    if (await this.usuarios.existsBy({ email })) return;

    const admin = await this.usuarios.save(
      this.usuarios.create({
        nombres: 'Super',
        apellidos: 'Administrador',
        email,
        passwordHash: await hash(
          this.config.get<string>('SEED_ADMIN_PASSWORD', '1'),
          10,
        ),
        cargo: 'Administrador del sistema',
        perfil: Perfil.ADMINISTRADOR,
      }),
    );
    // El perfil ADMINISTRADOR ya accede a todo; se registran igualmente sus features.
    const todas = await this.features.find();
    await this.usuarioFeatures.save(
      todas.map((feature) =>
        this.usuarioFeatures.create({ usuario: admin, feature }),
      ),
    );
    this.log.log(`Super administrador creado: ${email}`);
  }
}
