// Términos y condiciones, política de privacidad, soporte y eliminación de cuenta.
// Se publican como páginas web (exigidas por App Store y Google Play) y la app enlaza a ellas.
// Cambiar el contenido de términos o privacidad requiere subir VERSION_LEGAL: la app pedirá
// aceptarlos de nuevo.

export const VERSION_LEGAL = '2026-10-23';

export interface DatosTitular {
  /** Persona o empresa que ofrece el servicio. */
  titular: string;
  /** RUC o cédula del titular (opcional). */
  identificacion: string;
  /** Correo de soporte y de privacidad. */
  email: string;
  ciudad: string;
}

const esc = (s: string) =>
  s.replace(
    /[&<>"]/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!,
  );

const fecha = new Date(`${VERSION_LEGAL}T12:00:00`).toLocaleDateString(
  'es-EC',
  { day: 'numeric', month: 'long', year: 'numeric' },
);

function pagina(titulo: string, cuerpo: string, d: DatosTitular) {
  const contacto = d.email
    ? `<a href="mailto:${esc(d.email)}">${esc(d.email)}</a>`
    : '<b>[correo de contacto pendiente de configurar]</b>';
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${esc(titulo)} · SST Prevención</title>
<style>
  *, *::before, *::after { box-sizing:border-box; }
  body { overflow-wrap:anywhere; margin:0; background:#f5f0e8; color:#1a1a1a; font:16px/1.6 -apple-system, Segoe UI, Roboto, Arial, sans-serif; }
  main { max-width:760px; margin:0 auto; padding:24px 18px 48px; }
  header { border-bottom:4px solid #1a1a1a; padding-bottom:12px; margin-bottom:20px; }
  .tag { display:inline-block; background:#ffcc00; border:2px solid #1a1a1a; font-weight:700; text-transform:uppercase; font-size:12px; padding:2px 8px; }
  h1 { font-size:28px; text-transform:uppercase; margin:10px 0 4px; letter-spacing:-0.5px; }
  h2 { font-size:18px; text-transform:uppercase; border-bottom:2px solid #1a1a1a; padding-bottom:4px; margin-top:28px; }
  .box { background:#fff; border:2px solid #1a1a1a; box-shadow:4px 4px 0 #1a1a1a; padding:14px; margin:16px 0; }
  table { border-collapse:collapse; width:100%; table-layout:fixed; background:#fff; font-size:14px; } td, th { border:2px solid #1a1a1a; padding:6px; text-align:left; vertical-align:top; overflow-wrap:anywhere; hyphens:auto; }
  @media (max-width: 520px) { body { font-size:15px; } table { font-size:12.5px; } h1 { font-size:24px; } }
  th { background:#eee9e0; }
  nav a { margin-right:14px; color:#0055ff; } a { color:#0055ff; }
  footer { margin-top:36px; border-top:2px solid #1a1a1a; padding-top:10px; font-size:13px; color:#4a4a4a; }
</style></head><body><main>
<header><span class="tag">SST Prevención</span><h1>${esc(titulo)}</h1>
<div>Vigente desde el ${fecha} · versión ${VERSION_LEGAL}</div></header>
<nav><a href="/terminos">Términos</a><a href="/privacidad">Privacidad</a><a href="/soporte">Soporte</a><a href="/eliminar-cuenta">Eliminar cuenta</a></nav>
${cuerpo
  .replaceAll('{{CONTACTO}}', contacto)
  .replaceAll('{{TITULAR}}', esc(d.titular))
  .replaceAll('{{ID}}', d.identificacion ? ` (${esc(d.identificacion)})` : '')
  .replaceAll('{{CIUDAD}}', esc(d.ciudad))}
<footer>{{TITULAR}}${d.identificacion ? ` · ${esc(d.identificacion)}` : ''} · ${esc(d.ciudad)} · Contacto: ${contacto}</footer>
</main></body></html>`.replaceAll('{{TITULAR}}', esc(d.titular));
}

export function terminos(d: DatosTitular) {
  return pagina(
    'Términos y condiciones',
    `
<div class="box"><b>Resumen:</b> SST Prevención es una herramienta profesional para empresas. Las cuentas las crea el administrador de cada empresa cliente; no hay registro abierto ni compras dentro de la app. Los análisis automáticos (IA y medición postural) apoyan, pero no reemplazan, el criterio de un profesional de Seguridad y Salud en el Trabajo.</div>

<h2>1. Quién ofrece el servicio</h2>
<p>La aplicación móvil y el servicio web "SST Prevención" (en adelante, el "Servicio") son ofrecidos por {{TITULAR}}{{ID}}, con domicilio en {{CIUDAD}}. Para cualquier consulta escríbenos a {{CONTACTO}}.</p>

<h2>2. Qué es el Servicio</h2>
<p>El Servicio ayuda a técnicos y responsables de Seguridad y Salud en el Trabajo (SST) de empresas clientes a:</p>
<ul>
<li>registrar actos y condiciones subestándar con fotografías, con una clasificación sugerida por inteligencia artificial;</li>
<li>elaborar matrices de identificación y estimación de riesgos a partir de un dictado de voz;</li>
<li>evaluar posturas de trabajo (RULA, REBA y OWAS) a partir de fotos o videos;</li>
<li>gestionar permisos de trabajo y análisis de riesgo de tarea (ART), y exportar reportes en PDF.</li>
</ul>

<h2>3. Cuentas y acceso</h2>
<ul>
<li>El Servicio se contrata por empresas. Las cuentas de usuario las crea y administra el administrador de la empresa cliente o el titular del Servicio; no existe registro público.</li>
<li>Cada usuario solo accede a las empresas y módulos que su administrador le asigne.</li>
<li>Eres responsable de mantener la confidencialidad de tu contraseña y de toda actividad realizada con tu cuenta. Avísanos de inmediato si sospechas un uso no autorizado.</li>
<li>Puedes eliminar tu cuenta en cualquier momento desde la app (Mi cuenta → Eliminar mi cuenta) o según se indica en <a href="/eliminar-cuenta">/eliminar-cuenta</a>.</li>
</ul>

<h2>4. Contratación y pagos</h2>
<p>Las condiciones comerciales (módulos habilitados, número de usuarios y precio) se acuerdan directamente entre {{TITULAR}} y cada empresa cliente, fuera de la aplicación. La app no vende contenidos ni suscripciones ni procesa pagos.</p>

<h2>5. Uso aceptable</h2>
<p>Te comprometes a:</p>
<ul>
<li>usar el Servicio solo con fines de prevención de riesgos laborales de las empresas que tengas asignadas;</li>
<li>no subir contenido ilícito, ofensivo o ajeno a la actividad laboral;</li>
<li>no intentar acceder a datos de otras empresas, vulnerar la seguridad del Servicio ni usarlo de forma que afecte su funcionamiento;</li>
<li>fotografiar o grabar a personas solo cuando la empresa cliente cuente con la autorización correspondiente de sus trabajadores y conforme a la normativa aplicable.</li>
</ul>

<h2>6. Análisis automáticos e inteligencia artificial</h2>
<ul>
<li>Las clasificaciones de actos y condiciones, las matrices generadas por voz y las mediciones posturales son <b>sugerencias técnicas</b> producidas por modelos automáticos y pueden contener errores u omisiones.</li>
<li>Toda evaluación debe ser revisada, corregida y validada por un profesional competente antes de tomar decisiones. La app permite editar cada resultado y te indica los datos que faltan.</li>
<li>El Servicio no sustituye las evaluaciones, mediciones higiénicas, exámenes médicos ni obligaciones legales de la empresa en materia de Seguridad y Salud en el Trabajo.</li>
<li>Las funciones que usan inteligencia artificial de terceros solo se activan si das tu consentimiento expreso (ver la <a href="/privacidad">Política de privacidad</a>).</li>
</ul>

<h2>7. Información y contenido</h2>
<p>Los datos, fotografías, audios y documentos que se registran pertenecen a la empresa cliente. {{TITULAR}} los trata por cuenta de ella para prestar el Servicio, según la <a href="/privacidad">Política de privacidad</a>. El software, el diseño y las marcas del Servicio son propiedad de {{TITULAR}} o de sus licenciantes.</p>

<h2>8. Disponibilidad</h2>
<p>Procuramos que el Servicio esté disponible de forma continua, pero puede haber interrupciones por mantenimiento, fallas de conexión o de proveedores. Recomendamos exportar los reportes importantes en PDF.</p>

<h2>9. Suspensión y terminación</h2>
<p>El acceso puede suspenderse o terminarse si se incumplen estos términos, si la empresa cliente lo solicita o si finaliza su contrato.</p>

<h2>10. Responsabilidad</h2>
<p>En la medida permitida por la ley, {{TITULAR}} no responde por daños derivados de decisiones tomadas sin la validación profesional indicada en la sección 6, del uso indebido del Servicio o de interrupciones ajenas a su control.</p>

<h2>11. Cambios a estos términos</h2>
<p>Podemos actualizar estos términos. Si los cambios son relevantes, la app te pedirá aceptarlos de nuevo antes de continuar.</p>

<h2>12. Ley aplicable</h2>
<p>Estos términos se rigen por las leyes de la República del Ecuador.</p>
`,
    d,
  );
}

export function privacidad(d: DatosTitular) {
  return pagina(
    'Política de privacidad',
    `
<div class="box"><b>Resumen:</b> tratamos los datos de tu cuenta y la información de seguridad laboral que registras para prestar el Servicio a tu empresa. Las fotos y audios solo se envían al proveedor de inteligencia artificial (OpenAI) si lo autorizas. No vendemos datos, no mostramos publicidad y no te rastreamos entre apps.</div>

<h2>1. Responsable</h2>
<p>{{TITULAR}}{{ID}}, {{CIUDAD}}. Contacto de privacidad: {{CONTACTO}}. Respecto de la información de seguridad laboral, actuamos por encargo de la empresa cliente que te dio acceso.</p>

<h2>2. Datos que tratamos</h2>
<table>
<tr><th>Tipo</th><th>Datos</th><th>Para qué</th></tr>
<tr><td>Cuenta</td><td>Nombres, correo, cédula, teléfono, cargo y licencia profesional (los registra el administrador); contraseña cifrada; fecha del último acceso.</td><td>Identificarte, darte acceso a tus empresas y módulos.</td></tr>
<tr><td>Reportes de campo</td><td>Fotografías, descripción, área, clasificación y severidad de actos y condiciones.</td><td>Registrar y analizar riesgos de la empresa.</td></tr>
<tr><td>Dictados de voz</td><td>Audio grabado y su transcripción; datos del puesto (actividades, número de trabajadores, peligros).</td><td>Generar la matriz de riesgos.</td></tr>
<tr><td>Evaluaciones posturales</td><td>Fotos o videos de puestos de trabajo y los puntos del esqueleto medidos.</td><td>Calcular RULA, REBA y OWAS.</td></tr>
<tr><td>Permisos de trabajo</td><td>Datos del trabajo, nombres, cédulas, ocupación y celular del personal involucrado, firmantes.</td><td>Gestionar permisos y ART.</td></tr>
<tr><td>Empresa</td><td>Datos legales y de contacto de la empresa, áreas y puestos.</td><td>Organizar la información por empresa.</td></tr>
</table>
<p>Las fotos y videos pueden mostrar a trabajadores. La empresa cliente es responsable de informarles y de contar con la base legal necesaria. No pedimos ni usamos tu ubicación, contactos ni identificadores publicitarios.</p>

<h2>3. Permisos del dispositivo</h2>
<p>La app pide acceso a la <b>cámara</b>, el <b>micrófono</b> y las <b>fotos</b> solo cuando usas una función que los necesita (tomar evidencia, dictar, evaluar posturas, subir el logo). Puedes revocarlos en los ajustes del teléfono.</p>

<h2>4. Inteligencia artificial y proveedores</h2>
<table>
<tr><th>Proveedor</th><th>Qué recibe</th><th>Para qué</th><th>Ubicación</th></tr>
<tr><td><b>OpenAI</b> (OpenAI, L.L.C.)</td><td>La foto de un reporte, el audio de un dictado y su transcripción, con el contexto de la empresa, área y puesto. <b>Solo si diste tu consentimiento para IA.</b></td><td>Clasificar actos y condiciones, transcribir dictados y estructurar la matriz de riesgos.</td><td>Estados Unidos</td></tr>
<tr><td>Cloudinary</td><td>Fotos, logos, audios y fotogramas.</td><td>Almacenar y servir los archivos.</td><td>Estados Unidos / Unión Europea</td></tr>
<tr><td>Hetzner Online</td><td>Base de datos y servidores del Servicio.</td><td>Alojamiento.</td><td>Unión Europea (Finlandia)</td></tr>
</table>
<p>La medición postural (RULA, REBA y OWAS) se hace en nuestro propio servidor con MediaPipe; esas fotos y videos <b>no</b> se envían a OpenAI. Según sus políticas para la API, OpenAI no usa los datos enviados por la API para entrenar sus modelos y puede conservarlos por un tiempo limitado para prevenir abusos.</p>
<p>Puedes dar o retirar tu consentimiento para la IA en cualquier momento en la app (Mi cuenta → Privacidad e IA). Si lo retiras, los módulos que usan IA se desactivan para tu usuario; el resto de la app sigue funcionando.</p>

<h2>5. Base legal</h2>
<p>Tratamos los datos para ejecutar el contrato con la empresa cliente y prestarte el Servicio; el envío a proveedores de IA se basa en tu consentimiento expreso. Cumplimos la Ley Orgánica de Protección de Datos Personales del Ecuador.</p>

<h2>6. Conservación</h2>
<p>Los datos se conservan mientras la empresa cliente mantenga el Servicio o hasta que solicite su eliminación. Si eliminas tu cuenta, tus datos personales de cuenta se borran o anonimizan; los reportes que creaste pertenecen a la empresa y se conservan sin tus datos de contacto, salvo que la empresa pida borrarlos.</p>

<h2>7. Tus derechos</h2>
<p>Puedes solicitar acceso, rectificación, actualización, eliminación, oposición, portabilidad y suspensión del tratamiento de tus datos escribiendo a {{CONTACTO}}. Responderemos en los plazos que establece la ley. También puedes presentar un reclamo ante la Superintendencia de Protección de Datos Personales.</p>

<h2>8. Seguridad</h2>
<p>Usamos conexiones cifradas (HTTPS), contraseñas cifradas con bcrypt, acceso por empresa y módulo, y respaldos diarios de la base de datos.</p>

<h2>9. Menores</h2>
<p>El Servicio es de uso profesional y no está dirigido a menores de 18 años.</p>

<h2>10. Lo que no hacemos</h2>
<p>No vendemos datos, no mostramos publicidad y no realizamos seguimiento entre apps o sitios web de terceros.</p>

<h2>11. Cambios</h2>
<p>Si actualizamos esta política de forma relevante, la app te pedirá aceptarla de nuevo.</p>
`,
    d,
  );
}

export function soporte(d: DatosTitular) {
  return pagina(
    'Soporte',
    `
<div class="box">Escríbenos a {{CONTACTO}}. Indica tu correo de usuario, la empresa y, si es posible, una captura del problema.</div>
<h2>Preguntas frecuentes</h2>
<p><b>¿Cómo obtengo una cuenta?</b><br/>SST Prevención se contrata por empresas. El administrador de tu empresa crea tu usuario y te asigna empresas y módulos. Si tu empresa aún no usa el Servicio, escríbenos.</p>
<p><b>Olvidé mi contraseña.</b><br/>Pide al administrador de tu empresa que la restablezca, o escríbenos.</p>
<p><b>No veo un módulo (Actos, Voz, Ergo o Permisos).</b><br/>Tu administrador debe habilitarlo para tu usuario.</p>
<p><b>La app dice que necesito aceptar el uso de IA.</b><br/>Los módulos de Actos y Voz envían fotos y audio a OpenAI para analizarlos. Puedes aceptarlo en Mi cuenta → Privacidad e IA. La evaluación postural no usa IA de terceros.</p>
<p><b>¿Cómo elimino mi cuenta?</b><br/>Ver <a href="/eliminar-cuenta">Eliminar cuenta</a>.</p>
`,
    d,
  );
}

export function eliminarCuenta(d: DatosTitular) {
  return pagina(
    'Eliminar cuenta',
    `
<h2>Desde la app</h2>
<ol><li>Abre SST Prevención e inicia sesión.</li><li>Entra en <b>Mi cuenta</b> (ícono de persona en el Hub).</li><li>Pulsa <b>Eliminar mi cuenta</b>, confirma con tu contraseña y acepta.</li></ol>
<p>La eliminación es inmediata: se cierra tu sesión y ya no podrás volver a entrar con esa cuenta.</p>
<h2>Sin acceso a la app</h2>
<p>Escribe a {{CONTACTO}} desde el correo de tu cuenta con el asunto "Eliminar cuenta". La procesamos en un máximo de 15 días.</p>
<h2>Qué se elimina y qué se conserva</h2>
<table>
<tr><th>Se elimina o anonimiza</th><th>Se conserva (pertenece a la empresa)</th></tr>
<tr><td>Nombres, correo, cédula, teléfono, cargo, licencia, contraseña, accesos a empresas y módulos, consentimientos.</td><td>Reportes, matrices, evaluaciones y permisos que registraste, sin tus datos de contacto. La empresa puede pedir su eliminación.</td></tr>
</table>
`,
    d,
  );
}
