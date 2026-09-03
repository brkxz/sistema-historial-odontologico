// ============================================================
// Servicio de IA - Conexión con Google Gemini API
// Asistente Odontológico Inteligente
// ============================================================

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// La API key se toma de la variable de entorno, con localStorage como fallback
const getApiKey = () => localStorage.getItem('gemini_api_key') || import.meta.env.VITE_GEMINI_API_KEY || '';

const SYSTEM_PROMPT = `Eres "OdontoIA", un asistente de inteligencia artificial especializado en odontología clínica. 
Trabajas dentro del Sistema de Historial Odontológico Digital del Hospital San Ramón en Chanchamayo, Perú.

Tu rol es ayudar a los odontólogos con:
1. **Sugerencias clínicas**: Recomendar tratamientos, materiales, y procedimientos basados en diagnósticos
2. **Farmacología dental**: Prescripciones comunes, dosis, contraindicaciones
3. **Redacción clínica**: Ayudar a formular observaciones, diagnósticos y planes de tratamiento
4. **Flujo de trabajo**: Guiar en el uso del sistema, navegar entre secciones
5. **Consultas rápidas**: Responder dudas odontológicas generales

Reglas:
- Responde SIEMPRE en español
- Sé conciso pero completo (máximo 3-4 párrafos)
- Usa terminología odontológica profesional
- Si te preguntan sobre navegación, indica las rutas: Panel Principal (/), Buscar Paciente (/buscar), Pacientes (/pacientes), Nueva Atención (/nueva-atencion), Historial (/historial), Odontograma (/odontograma), Reportes (/reportes)
- Nunca inventes datos de pacientes reales
- Si no estás seguro de algo médico, indícalo claramente
- Incluye emojis relevantes para hacer la conversación más amigable
- Cuando sugieras medicamentos, siempre recuerda que el doctor debe verificar alergias del paciente

Contexto del sistema:
- Hospital: San Ramón, Red de Salud Chanchamayo
- País: Perú
- Nomenclatura dental: FDI (sistema de numeración de dos dígitos)
- Formato de fecha: dd/mm/yyyy (Perú)`;

/**
 * Envía un mensaje al modelo Gemini y retorna la respuesta
 */
export async function sendMessage(messages, context = {}) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('API_KEY_MISSING');
  }

  // Construir el prompt con contexto
  let contextInfo = '';
  if (context.currentPage) {
    contextInfo += `\n[Página actual: ${context.currentPage}]`;
  }
  if (context.currentPatient) {
    const p = context.currentPatient;
    contextInfo += `\n[Paciente en pantalla: ${p.first_name} ${p.last_name}, DNI: ${p.dni}, Edad: ${p.age || 'N/D'}]`;
  }
  if (context.doctorName) {
    contextInfo += `\n[Doctor: ${context.doctorName}]`;
  }

  const contents = [
    {
      role: 'user',
      parts: [{ text: SYSTEM_PROMPT + contextInfo }]
    },
    {
      role: 'model',
      parts: [{ text: '¡Hola Doctor! 👋 Soy OdontoIA, tu asistente odontológico inteligente. Estoy aquí para ayudarte con diagnósticos, tratamientos, recetas y cualquier consulta clínica. ¿En qué puedo asistirte?' }]
    },
    ...messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }))
  ];

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      ]
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    if (response.status === 400 && err?.error?.message?.includes('API key')) {
      throw new Error('API_KEY_INVALID');
    }
    throw new Error(err?.error?.message || 'Error al comunicarse con la IA');
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!text) {
    throw new Error('La IA no generó una respuesta');
  }

  return text;
}

/**
 * Genera una sugerencia clínica basada en el contexto del tratamiento
 */
export async function getClinicalSuggestion(diagnosis, teeth, patientAge) {
  const prompt = `Como odontólogo experto, sugiere un plan de tratamiento breve para:
- Diagnóstico: ${diagnosis}
- Piezas dentales: ${teeth || 'General'}
- Edad del paciente: ${patientAge || 'Adulto'}

Incluye: procedimiento recomendado, materiales, medicación post-tratamiento si aplica, y observaciones. Sé conciso (máximo 5 líneas).`;

  return sendMessage([{ role: 'user', content: prompt }]);
}

/**
 * Formatea y mejora notas clínicas dictadas por voz
 */
export async function formatClinicalNotes(rawText, fieldType) {
  const fieldNames = {
    reason: 'motivo de consulta',
    procedure_performed: 'procedimiento realizado',
    observations: 'observaciones y receta'
  };

  const prompt = `Formatea y corrige la siguiente nota clínica odontológica dictada por voz. 
Campo: ${fieldNames[fieldType] || fieldType}
Texto original: "${rawText}"

Corrige ortografía, añade puntuación apropiada, y usa terminología odontológica correcta. 
Devuelve SOLO el texto corregido, sin explicaciones.`;

  return sendMessage([{ role: 'user', content: prompt }]);
}

/**
 * Interpreta un comando de voz y determina la acción a realizar
 */
export function parseVoiceCommand(transcript) {
  const text = transcript.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Comandos de navegación
  const navCommands = [
    { patterns: ['buscar paciente', 'buscar dni', 'busqueda'], route: '/buscar' },
    { patterns: ['nueva atencion', 'registrar atencion', 'nuevo tratamiento'], route: '/nueva-atencion' },
    { patterns: ['historial', 'ver historial'], route: '/historial' },
    { patterns: ['odontograma', 'ver odontograma'], route: '/odontograma' },
    { patterns: ['reportes', 'ver reportes', 'estadisticas'], route: '/reportes' },
    { patterns: ['pacientes', 'ver pacientes', 'lista pacientes'], route: '/pacientes' },
    { patterns: ['panel', 'inicio', 'dashboard', 'ir al inicio'], route: '/' },
    { patterns: ['usuarios', 'gestion usuarios'], route: '/usuarios' },
  ];

  for (const cmd of navCommands) {
    for (const pattern of cmd.patterns) {
      if (text.includes(pattern)) {
        return { type: 'navigate', route: cmd.route, label: cmd.patterns[0] };
      }
    }
  }

  // Comando de búsqueda por DNI
  const dniMatch = text.match(/buscar\s*(?:el\s*)?(?:dni\s*)?(\d{8})/);
  if (dniMatch) {
    return { type: 'search_dni', dni: dniMatch[1] };
  }

  // Si no es un comando, es una pregunta para la IA
  return { type: 'chat', content: transcript };
}

/**
 * Verifica si la API key es válida
 */
export async function validateApiKey(key) {
  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: 'Hola' }] }],
        generationConfig: { maxOutputTokens: 10 }
      })
    });
    return response.ok;
  } catch {
    return false;
  }
}

export default {
  sendMessage,
  getClinicalSuggestion,
  formatClinicalNotes,
  parseVoiceCommand,
  validateApiKey,
  getApiKey,
};
