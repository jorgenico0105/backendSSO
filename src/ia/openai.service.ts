import {
  BadGatewayException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI, { toFile } from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import type { ResponseInputContent } from 'openai/resources/responses/responses';
import { z } from 'zod';
import { PROMPT_TRANSCRIPCION } from './agente-sst.prompts';

export type Contenido = ResponseInputContent;

export const texto = (text: string): Contenido => ({
  type: 'input_text',
  text,
});
export const imagen = (image_url: string): Contenido => ({
  type: 'input_image',
  image_url,
  detail: 'high',
});

@Injectable()
export class OpenAiService {
  private readonly log = new Logger(OpenAiService.name);
  private readonly client: OpenAI | null;
  readonly modelo: string;
  private readonly modeloTranscripcion: string;

  constructor(config: ConfigService) {
    const apiKey = config.get<string>('OPENAI_API_KEY');
    this.client = apiKey
      ? new OpenAI({ apiKey, timeout: 180_000, maxRetries: 1 })
      : null;
    this.modelo = config.get('OPENAI_MODEL', 'gpt-5.4-mini');
    this.modeloTranscripcion = config.get(
      'OPENAI_TRANSCRIBE_MODEL',
      'gpt-4o-transcribe',
    );
  }

  private get api(): OpenAI {
    if (!this.client)
      throw new ServiceUnavailableException(
        'OPENAI_API_KEY no está configurada en .env',
      );
    return this.client;
  }

  /** Llama al agente y devuelve la salida validada contra el esquema zod. */
  async estructurado<S extends z.ZodType>(
    esquema: S,
    nombre: string,
    instrucciones: string,
    contenido: Contenido[],
  ): Promise<{ datos: z.infer<S>; duracionMs: number }> {
    const inicio = Date.now();
    try {
      const res = await this.api.responses.parse({
        model: this.modelo,
        instructions: instrucciones,
        input: [{ role: 'user', content: contenido }],
        text: { format: zodTextFormat(esquema, nombre) },
      });
      if (!res.output_parsed)
        throw new Error(`Respuesta vacía del modelo (estado: ${res.status})`);
      return {
        datos: res.output_parsed as z.infer<S>,
        duracionMs: Date.now() - inicio,
      };
    } catch (e) {
      throw this.error(e);
    }
  }

  async transcribir(
    audio: Buffer,
    nombreArchivo: string,
    mime: string,
    prompt = PROMPT_TRANSCRIPCION,
  ): Promise<string> {
    try {
      const r = await this.api.audio.transcriptions.create({
        file: await toFile(audio, nombreArchivo, { type: mime }),
        model: this.modeloTranscripcion,
        language: 'es',
        prompt,
      });
      return r.text.trim();
    } catch (e) {
      throw this.error(e);
    }
  }

  private error(e: unknown) {
    if (e instanceof ServiceUnavailableException) return e;
    this.log.error(e instanceof Error ? (e.stack ?? e.message) : String(e));
    const msg =
      e instanceof OpenAI.APIError
        ? e.message
        : e instanceof Error
          ? e.message
          : 'error desconocido';
    return new BadGatewayException(
      `El agente IA no pudo completar el análisis: ${msg}`,
    );
  }
}
