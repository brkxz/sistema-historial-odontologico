// ============================================================
// Convertidor inteligente de voz a números DNI en español
// Convierte palabras habladas ("setenta y cuatro", "cero", etc.)
// a dígitos numéricos limpios de 8 cifras.
// ============================================================

const SPANISH_NUM_WORDS = {
  'cero': '0', 'zero': '0',
  'uno': '1', 'un': '1', 'una': '1',
  'dos': '2',
  'tres': '3',
  'cuatro': '4',
  'cinco': '5',
  'seis': '6',
  'siete': '7',
  'ocho': '8',
  'nueve': '9',
  'diez': '10',
  'once': '11',
  'doce': '12',
  'trece': '13',
  'catorce': '14',
  'quince': '15',
  'dieciseis': '16', 'dieciséis': '16',
  'diecisiete': '17',
  'dieciocho': '18',
  'diecinueve': '19',
  'veinte': '20',
  'veintiuno': '21', 'veintiun': '21', 'veintiún': '21',
  'veintidos': '22', 'veintidós': '22',
  'veintitres': '23', 'veintitrés': '23',
  'veinticuatro': '24',
  'veinticinco': '25',
  'veintiseis': '26', 'veintiséis': '26',
  'veintisiete': '27',
  'veintiocho': '28',
  'veintinueve': '29',
  'treinta': '30',
  'cuarenta': '40',
  'cincuenta': '50',
  'sesenta': '60',
  'setenta': '70',
  'ochenta': '80',
  'noventa': '90',
  'cien': '100', 'ciento': '100',
};

const COMPOUND_TENS = {
  'treinta': 30,
  'cuarenta': 40,
  'cincuenta': 50,
  'sesenta': 60,
  'setenta': 70,
  'ochenta': 80,
  'noventa': 90,
};

const ONES = {
  'uno': 1, 'un': 1, 'una': 1,
  'dos': 2, 'tres': 3, 'cuatro': 4,
  'cinco': 5, 'seis': 6, 'siete': 7,
  'ocho': 8, 'nueve': 9,
};

/**
 * Procesa la transcripción de voz y extrae un DNI de 8 dígitos.
 * Soporta números dictados dígito a dígito o en pares/palabras.
 * @param {string} transcript
 * @returns {string} - Cadena con los dígitos encontrados (ej. "74839201")
 */
export function parseVoiceToDni(transcript) {
  if (!transcript || typeof transcript !== 'string') return '';

  // 1. Primero intentar extraer si ya vinieron dígitos directos
  const directDigits = transcript.replace(/\D/g, '');
  if (directDigits.length >= 8) {
    return directDigits.slice(0, 8);
  }

  // 2. Normalizar texto hablado
  let text = transcript
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar tildes
    .replace(/[^\w\s]/g, ' ')
    .trim();

  // 3. Resolver combinaciones como "setenta y cuatro" -> "74"
  for (const [tenWord, tenVal] of Object.entries(COMPOUND_TENS)) {
    for (const [oneWord, oneVal] of Object.entries(ONES)) {
      const pattern = new RegExp(`\\b${tenWord}\\s+y\\s+${oneWord}\\b`, 'g');
      text = text.replace(pattern, String(tenVal + oneVal));
    }
  }

  // 4. Reemplazar palabras individuales por sus números
  const words = text.split(/\s+/);
  const resultDigits = [];

  for (const word of words) {
    if (/^\d+$/.test(word)) {
      resultDigits.push(word);
    } else if (SPANISH_NUM_WORDS[word] !== undefined) {
      resultDigits.push(SPANISH_NUM_WORDS[word]);
    }
  }

  const combined = resultDigits.join('').replace(/\D/g, '');
  return combined.slice(0, 8);
}
