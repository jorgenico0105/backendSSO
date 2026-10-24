// Lectura determinista de la probabilidad y la consecuencia dictadas. La IA solo señala el
// fragmento literal de la transcripción que habla de cada peligro; aquí se leen las palabras
// (baja / media / alta, ligeramente dañino / dañino / extremadamente dañino, siglas B M A LD D ED)
// para que lo dictado mande siempre sobre la valoración del modelo.

type Nivel = 1 | 2 | 3;

/** Minúsculas, sin tildes ni signos, espacios simples. */
export function normalizarDictado(s: string): string {
  return ` ${s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9ñ]+/g, ' ')
    .trim()} `;
}

const GRADO: [RegExp, Nivel][] = [
  [/^(baj[oa]s?|b|poca|poco|minima|minimo)$/, 1],
  [/^(medi[oa]s?|m|moderad[oa]s?|regular)$/, 2],
  [/^(alt[oa]s?|a|elevad[oa]s?|muy alta|maxima|maximo)$/, 3],
];

const grado = (palabra: string): Nivel | undefined =>
  GRADO.find(([re]) => re.test(palabra))?.[1];

/** Palabras de relleno que pueden ir entre "probabilidad" y su valor ("probabilidad es media"). */
const RELLENO = new Set([
  'es',
  'de',
  'la',
  'el',
  'con',
  'una',
  'un',
  'seria',
  'sera',
  'esta',
  'nivel',
  'en',
  'por',
  'lo',
  'tanto',
  'que',
  'ocurra',
  'ocurrencia',
  'sea',
  'se',
  'considera',
  'considero',
  'diria',
  'yo',
  'le',
  'pongo',
  'doy',
]);

/** Valor que sigue a la palabra clave, saltando el relleno; las siglas de una letra solo justo detrás. */
function valorTras(palabras: string[], i: number): Nivel | undefined {
  for (let j = i + 1, saltos = 0; j < palabras.length && saltos <= 5; j++) {
    const w = palabras[j];
    if (w.length === 1 && j !== i + 1) return undefined;
    const g = grado(w);
    if (g) return g;
    if (!RELLENO.has(w)) return undefined;
    saltos++;
  }
  return undefined;
}

export function probabilidadDictada(fragmento: string): Nivel | undefined {
  const t = normalizarDictado(fragmento);
  const p = t.trim().split(' ');
  for (let i = 0; i < p.length; i++) {
    if (!/^probabilidad(es)?$/.test(p[i])) continue;
    const despues = valorTras(p, i);
    if (despues) return despues;
    // Orden inverso: "baja probabilidad".
    const antes = p[i - 1] && p[i - 1].length > 1 ? grado(p[i - 1]) : undefined;
    if (antes) return antes;
  }
  if (/ (poco probable|improbable) /.test(t)) return 1;
  if (/ muy probable /.test(t)) return 3;
  return undefined;
}

export function consecuenciaDictada(fragmento: string): Nivel | undefined {
  const t = normalizarDictado(fragmento);
  if (
    / (extremadamente|sumamente|muy) danin[oa]s? /.test(t) ||
    / consecuencias? e ?d /.test(t)
  )
    return 3;
  if (
    / (ligeramente|levemente|poco) danin[oa]s? /.test(t) ||
    / consecuencias? l ?d /.test(t)
  )
    return 1;
  if (/ danin[oa]s? /.test(t) || / consecuencias? d /.test(t)) return 2;
  const p = t.trim().split(' ');
  for (let i = 0; i < p.length; i++) {
    if (!/^consecuencias?$/.test(p[i])) continue;
    const sig = p.slice(i + 1, i + 4).join(' ');
    if (
      /^(es |de |seria )?(muy grave|gravisima|grave grave|mortal|fatal)/.test(
        sig,
      )
    )
      return 3;
    if (/^(es |de |seria )?(leve|ligera|menor)/.test(sig)) return 1;
    if (/^(es |de |seria )?grave/.test(sig)) return 2;
    const g = valorTras(p, i);
    if (g) return g;
  }
  return undefined;
}

/** ¿El fragmento sale de verdad del dictado? (evita usar una paráfrasis del modelo) */
export function estaEnDictado(
  fragmento: string,
  transcripcion: string,
): boolean {
  const f = normalizarDictado(fragmento).trim();
  return f.length >= 6 && normalizarDictado(transcripcion).includes(` ${f} `);
}

/**
 * Sustituye la probabilidad y la consecuencia de cada peligro por las dictadas en su fragmento.
 * Lo que no se dictó queda con la estimación de la IA.
 */
export function aplicarValoresDictados<
  T extends { fragmento: string; probabilidad: number; consecuencia: number },
>(peligros: T[], transcripcion: string): T[] {
  return peligros.map((p) => {
    if (!p.fragmento || !estaEnDictado(p.fragmento, transcripcion)) return p;
    return {
      ...p,
      probabilidad: probabilidadDictada(p.fragmento) ?? p.probabilidad,
      consecuencia: consecuenciaDictada(p.fragmento) ?? p.consecuencia,
    };
  });
}
