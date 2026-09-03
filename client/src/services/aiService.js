// ============================================================
// Servicio de IA - Proxy seguro a través del backend
// La API key de Gemini se mantiene SOLO en el servidor
// ============================================================

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

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
- Si te preguntan sobre navegación, indica las rutas: Inicio (/), Buscar Paciente (/buscar), Pacientes (/pacientes), Nueva Atención (/nueva-atencion), Historial (/historial), Odontograma (/odontograma), Reportes (/reportes)
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
 * Obtener token de autenticación
 */
function getAuthToken() {
  return localStorage.getItem('token') || '';
}

/**
 * Envía un mensaje al backend que hace proxy a Gemini
 */
export async function sendMessage(messages, context = {}) {
  const token = getAuthToken();
  if (!token) {
    throw new Error('No autenticado');
  }

  // Construir contexto adicional
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

  const response = await fetch(`${API_BASE}/ai/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ contents }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    if (response.status === 503) {
      throw new Error('API_KEY_MISSING');
    }
    throw new Error(err?.error || 'Error al comunicarse con la IA');
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!text) {
    throw new Error('La IA no generó una respuesta');
  }

  return text;
}

/**
 * Verifica si la IA está configurada en el servidor
 */
export async function checkAIStatus() {
  try {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE}/ai/status`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) return false;
    const data = await response.json();
    return data.configured;
  } catch {
    return false;
  }
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

export default {
  sendMessage,
  getClinicalSuggestion,
  formatClinicalNotes,
  parseVoiceCommand,
  checkAIStatus,
};
