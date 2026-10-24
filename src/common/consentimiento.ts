import { ForbiddenException } from '@nestjs/common';
import { UsuarioSesion } from './decorators';

/** Las funciones que envían fotos o audio a OpenAI exigen el consentimiento expreso del usuario. */
export function exigirConsentimientoIa(u: UsuarioSesion) {
  if (!u.consentimientoIa)
    throw new ForbiddenException(
      'Esta función envía fotos o audio a un proveedor de inteligencia artificial. Acéptalo en Mi cuenta → Privacidad e IA para usarla.',
    );
}
