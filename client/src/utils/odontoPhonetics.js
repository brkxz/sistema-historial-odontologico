// ============================================================
// Diccionario de Corrección Fonética Odontológica (STT Trainer)
// Corrige transcripciones imperfectas del Speech-to-Text de Google
// adaptadas a odontología en Perú y Latinoamérica.
// ============================================================

// Mapeo de términos clínicos comunes mal reconocidos
const PHONETIC_CORRECTIONS = [
  // Términos y procedimientos
  { pattern: /\b(endo doncia|endo doncias|endodoncias)\b/gi, replacement: 'endodoncia' },
  { pattern: /\b(orto doncia|ortodoncias)\b/gi, replacement: 'ortodoncia' },
  { pattern: /\b(perio doncia|periodoncias)\b/gi, replacement: 'periodoncia' },
  { pattern: /\b(obturacion|obturasao|obturado|opturacion)\b/gi, replacement: 'obturación' },
  { pattern: /\b(protesis|prótesis|protesis fija|protesis removible)\b/gi, replacement: 'prótesis' },
  { pattern: /\b(profilaxis|profilaxi|profilasis)\b/gi, replacement: 'profilaxis' },
  { pattern: /\b(gingivitis|yinllivitis|gingivitis marginal)\b/gi, replacement: 'gingivitis' },
  { pattern: /\b(periodontitis|perio dontitis)\b/gi, replacement: 'periodontitis' },
  { pattern: /\b(pulpitis|pulpi tis|pulpitis irreversible|pulpitis reversible)\b/gi, replacement: 'pulpitis' },
  { pattern: /\b(fluorizacion|fluor|fluoruro|fluoruros)\b/gi, replacement: 'fluorización' },
  { pattern: /\b(tartrectomia|destartraje|tartrectomía)\b/gi, replacement: 'destartraje' },
  { pattern: /\b(curacion|curaciones)\b/gi, replacement: 'curación' },
  { pattern: /\b(amalgama|amalgamas)\b/gi, replacement: 'amalgama' },
  { pattern: /\b(resina|resinas|resina compuesta|resina fluida)\b/gi, replacement: 'resina' },
  { pattern: /\b(ionomero|ionómero|yonomero)\b/gi, replacement: 'ionómero vítreo' },
  { pattern: /\b(exodoncia|extraccion|extracciones|exodoncia simple|exodoncia compleja)\b/gi, replacement: 'exodoncia' },
  { pattern: /\b(fistula|fístula|absceso periapical|abseso)\b/gi, replacement: 'absceso' },
  { pattern: /\b(alveolitis|alveolitis seca)\b/gi, replacement: 'alveolitis' },
  { pattern: /\b(halitosis|mal aliento)\b/gi, replacement: 'halitosis' },
  { pattern: /\b(bruxismo|apretamiento)\b/gi, replacement: 'bruxismo' },
  { pattern: /\b(apicectomia|apicectomía)\b/gi, replacement: 'apicectomía' },
  { pattern: /\b(pulpotomia|pulpotomía)\b/gi, replacement: 'pulpotomía' },
  { pattern: /\b(pulpectomia|pulpectomía)\b/gi, replacement: 'pulpectomía' },

  // Anestésicos y farmacología clínica
  { pattern: /\b(lidocaina|lido|lidocaína|lidocaina con epinefrina|lidocaina al 2)\b/gi, replacement: 'lidocaína al 2%' },
  { pattern: /\b(mepivacaina|mepivacaína|mepivacaina al 3)\b/gi, replacement: 'mepivacaína al 3%' },
  { pattern: /\b(articaina|articaína|articaina al 4)\b/gi, replacement: 'articaína al 4%' },
  { pattern: /\b(amoxi|amoxisilina|amoxocilina|amoxicilina)\b/gi, replacement: 'amoxicilina' },
  { pattern: /\b(clavulanico|clavu|acido clavulanico)\b/gi, replacement: 'ácido clavulánico' },
  { pattern: /\b(ibuprofeno|ibufeno|ibuprofeno 400|ibuprofeno 600)\b/gi, replacement: 'ibuprofeno' },
  { pattern: /\b(paracetamol|parasetamol|panadol)\b/gi, replacement: 'paracetamol' },
  { pattern: /\b(clindamicina|clinda|clindamicina 300)\b/gi, replacement: 'clindamicina' },
  { pattern: /\b(ketorolaco|queterolaco|ketorolac)\b/gi, replacement: 'ketorolaco' },
  { pattern: /\b(clorhexidina|clorexidina|clorhexidina al 0\.12)\b/gi, replacement: 'clorhexidina 0.12%' },
  { pattern: /\b(dexametasona|deza)\b/gi, replacement: 'dexametasona' },
  { pattern: /\b(naproxeno|naproxen)\b/gi, replacement: 'naproxeno' },
  { pattern: /\b(tramadol|tramal)\b/gi, replacement: 'tramadol' },

  // Superficies dentales
  { pattern: /\b(oclusal|oclusivo|oclusalmente)\b/gi, replacement: 'oclusal' },
  { pattern: /\b(mesial|mestial)\b/gi, replacement: 'mesial' },
  { pattern: /\b(distal|distales)\b/gi, replacement: 'distal' },
  { pattern: /\b(vestibular|vestíbulo)\b/gi, replacement: 'vestibular' },
  { pattern: /\b(palatino|palatina)\b/gi, replacement: 'palatino' },
  { pattern: /\b(lingual|linguales)\b/gi, replacement: 'lingual' },
  { pattern: /\b(incisal|incisivo)\b/gi, replacement: 'incisal' },
  { pattern: /\b(cervical|cervicales)\b/gi, replacement: 'cervical' },

  // Notación y nombres de piezas dentales
  { pattern: /\b(premolar|premolares)\b/gi, replacement: 'premolar' },
  { pattern: /\b(molar|molares)\b/gi, replacement: 'molar' },
  { pattern: /\b(canino|caninos)\b/gi, replacement: 'canino' },
  { pattern: /\b(incisivo central|centrales)\b/gi, replacement: 'incisivo central' },
  { pattern: /\b(incisivo lateral|laterales)\b/gi, replacement: 'incisivo lateral' },
  { pattern: /\b(tercer molar|terceros molares|muela del juicio)\b/gi, replacement: 'tercer molar' },

  // Comandos y términos del sistema
  { pattern: /\b(odontograma|odonto grama|odonto gran|mapa dental)\b/gi, replacement: 'odontograma' },
  { pattern: /\b(historial|historial clinico|record)\b/gi, replacement: 'historial' },
  { pattern: /\b(denty|denti|dente|denthye)\b/gi, replacement: 'Denty' },
];

// Mapas de números hablados para piezas dentales FDI (ej: "uno uno" -> 11, "dieciseis" -> 16)
const FDI_TEETH_SPOKEN = {
  // Cuadrante 1 (Superior Derecho)
  'uno uno': '11', 'uno punto uno': '11', 'once': '11',
  'uno dos': '12', 'uno punto dos': '12', 'doce': '12',
  'uno tres': '13', 'uno punto tres': '13', 'trece': '13',
  'uno cuatro': '14', 'uno punto cuatro': '14', 'catorce': '14',
  'uno cinco': '15', 'uno punto cinco': '15', 'quince': '15',
  'uno seis': '16', 'uno punto seis': '16', 'dieciseis': '16', 'dieciséis': '16',
  'uno siete': '17', 'uno punto siete': '17', 'diecisiete': '17',
  'uno ocho': '18', 'uno punto ocho': '18', 'dieciocho': '18',

  // Cuadrante 2 (Superior Izquierdo)
  'dos uno': '21', 'dos punto uno': '21', 'veintiuno': '21', 'veintiún': '21', 'veintiun': '21',
  'dos dos': '22', 'dos punto dos': '22', 'veintidos': '22', 'veintidós': '22',
  'dos tres': '23', 'dos punto tres': '23', 'veintitres': '23', 'veintitrés': '23',
  'dos cuatro': '24', 'dos punto cuatro': '24', 'veinticuatro': '24',
  'dos cinco': '25', 'dos punto cinco': '25', 'veinticinco': '25',
  'dos seis': '26', 'dos punto seis': '26', 'veintiseis': '26', 'veintiséis': '26',
  'dos siete': '27', 'dos punto siete': '27', 'veintisiete': '27',
  'dos ocho': '28', 'dos punto ocho': '28', 'veintiocho': '28',

  // Cuadrante 3 (Inferior Izquierdo)
  'tres uno': '31', 'tres punto uno': '31', 'treinta y uno': '31',
  'tres dos': '32', 'tres punto dos': '32', 'treinta y dos': '32',
  'tres tres': '33', 'tres punto tres': '33', 'treinta y tres': '33',
  'tres cuatro': '34', 'tres punto cuatro': '34', 'treinta y cuatro': '34',
  'tres cinco': '35', 'tres punto cinco': '35', 'treinta y cinco': '35',
  'tres seis': '36', 'tres punto seis': '36', 'treinta y seis': '36',
  'tres siete': '37', 'tres punto siete': '37', 'treinta y siete': '37',
  'tres ocho': '38', 'tres punto ocho': '38', 'treinta y ocho': '38',

  // Cuadrante 4 (Inferior Derecho)
  'cuatro uno': '41', 'cuatro punto uno': '41', 'cuarenta y uno': '41',
  'cuatro dos': '42', 'cuatro punto dos': '42', 'cuarenta y dos': '42',
  'cuatro tres': '43', 'cuatro punto tres': '43', 'cuarenta y tres': '43',
  'cuatro cuatro': '44', 'cuatro punto cuatro': '44', 'cuarenta y cuatro': '44',
  'cuatro cinco': '45', 'cuatro punto cinco': '45', 'cuarenta y cinco': '45',
  'cuatro seis': '46', 'cuatro punto seis': '46', 'cuarenta y seis': '46',
  'cuatro siete': '47', 'cuatro punto siete': '47', 'cuarenta y siete': '47',
  'cuatro ocho': '48', 'cuatro punto ocho': '48', 'cuarenta y ocho': '48',

  // Dientes Temporales / Deciduos (Odontopediatría)
  'cinco uno': '51', 'cincuenta y uno': '51',
  'cinco dos': '52', 'cincuenta y dos': '52',
  'cinco tres': '53', 'cincuenta y tres': '53',
  'cinco cuatro': '54', 'cincuenta y cuatro': '54',
  'cinco cinco': '55', 'cincuenta y cinco': '55',

  'seis uno': '61', 'sesenta y uno': '61',
  'seis dos': '62', 'sesenta y dos': '62',
  'seis tres': '63', 'sesenta y tres': '63',
  'seis cuatro': '64', 'sesenta y cuatro': '64',
  'seis cinco': '65', 'sesenta y cinco': '65',

  'siete uno': '71', 'setenta y uno': '71',
  'siete dos': '72', 'setenta y dos': '72',
  'siete tres': '73', 'setenta y tres': '73',
  'siete cuatro': '74', 'setenta y cuatro': '74',
  'siete cinco': '75', 'setenta y cinco': '75',

  'ocho uno': '81', 'ochenta y uno': '81',
  'ocho dos': '82', 'ochenta y dos': '82',
  'ocho tres': '83', 'ochenta y tres': '83',
  'ocho cuatro': '84', 'ochenta y cuatro': '84',
  'ocho cinco': '85', 'ochenta y cinco': '85',
};

/**
 * Normaliza y entrena la transcripción con correcciones odontológicas
 * @param {string} rawTranscript - Texto captado por SpeechRecognition
 * @returns {string} - Texto corregido con terminología clínica adecuada
 */
export function trainOdontoSpeech(rawTranscript) {
  if (!rawTranscript || typeof rawTranscript !== 'string') return '';

  let text = rawTranscript;

  // 1. Normalizar patrones de pieza dental hablada
  // Ejemplos: "pieza uno uno", "diente veinticuatro", "pieza número dieciséis"
  for (const [spoken, fdi] of Object.entries(FDI_TEETH_SPOKEN)) {
    const pattern = new RegExp(`\\b(pieza|diente|órgano dentario|molar|premolar)?\\s*(?:número|no\\.?|num)?\\s*${spoken}\\b`, 'gi');
    text = text.replace(pattern, (match, prefix) => {
      return prefix ? `${prefix} ${fdi}` : `pieza ${fdi}`;
    });
  }

  // 2. Aplicar correcciones fonéticas clínicas
  for (const item of PHONETIC_CORRECTIONS) {
    text = text.replace(item.pattern, item.replacement);
  }

  // 3. Normalizar puntuación y espacios
  text = text
    .replace(/\s+/g, ' ')
    .trim();

  return text;
}

export default trainOdontoSpeech;
