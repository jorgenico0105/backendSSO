import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  v2 as cloudinary,
  UploadApiOptions,
  UploadApiResponse,
} from 'cloudinary';

type Recurso = 'image' | 'video';

@Injectable()
export class CloudinaryService {
  private readonly log = new Logger(CloudinaryService.name);
  private readonly carpetaBase: string;
  private readonly configurado: boolean;

  constructor(config: ConfigService) {
    const cloud_name = config.get<string>('CLOUDINARY_CLOUD_NAME');
    const api_key = config.get<string>('CLOUDINARY_API_KEY');
    const api_secret = config.get<string>('CLOUDINARY_API_SECRET');
    this.configurado = !!(cloud_name && api_key && api_secret);
    cloudinary.config({ cloud_name, api_key, api_secret, secure: true });
    this.carpetaBase = config.get('CLOUDINARY_FOLDER', 'sst-prevencion');
  }

  /** false si faltan las credenciales CLOUDINARY_* (las subidas fallarían). */
  get disponible() {
    return this.configurado;
  }

  /**
   * Sube un archivo en memoria. Los audios se suben como `video` (así los trata Cloudinary).
   * `carpeta` es relativa a CLOUDINARY_FOLDER, ej. "empresas/3/actos".
   */
  subir(
    buffer: Buffer,
    carpeta: string,
    recurso: Recurso,
    extra: UploadApiOptions = {},
  ): Promise<UploadApiResponse> {
    if (!this.configurado) {
      throw new ServiceUnavailableException(
        'Cloudinary no está configurado (revisa CLOUDINARY_* en .env)',
      );
    }
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          ...extra,
          folder: `${this.carpetaBase}/${carpeta}`,
          resource_type: recurso,
        },
        (err, res) =>
          err || !res
            ? reject(new Error(err?.message ?? 'Cloudinary sin respuesta'))
            : resolve(res),
      );
      stream.end(buffer);
    });
  }

  /** URL de la imagen limitada a `ancho` px (para enviarla al agente sin pesar de más). */
  urlImagen(publicId: string, ancho = 1280): string {
    return cloudinary.url(publicId, {
      secure: true,
      transformation: [{ width: ancho, crop: 'limit' }, { quality: 'auto' }],
    });
  }

  async eliminar(publicId: string, recurso: Recurso = 'image') {
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: recurso });
    } catch (e) {
      this.log.warn(
        `No se pudo eliminar ${publicId} de Cloudinary: ${String(e)}`,
      );
    }
  }
}
