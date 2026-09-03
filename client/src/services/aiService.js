// ============================================================
// Servicio de IA - Proxy seguro a través del backend
// La API key de Gemini se mantiene SOLO en el servidor
// ============================================================

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const SYSTEM_PROMPT = `Eres "Denty", un asistente de inteligencia artificial especializado en odontología clínica. 
Trabaj as dentro del Sistema de Historial Odontológico Digital del Hospital San Ramón en Chanchamayo, Perú.

Tu rol es ayudar a los odontólogos con:
1. **Navegación del sistema**: Cuando el usuario quiere ir a alguna sección, dile que lo llevarás allí y que lo está llevando. TÚ SÍ PUEDES navegar entre páginas del sistema.
2. **Sugerencias clínicas**: Recomendar tratamientos, materiales, y procedimientos basados en diagnósticos
3. **Farmacología dental**: Prescripciones comunes, dosis, contraindicaciones
4. **Redacción clínica**: Ayudar a formular observaciones, diagnósticos y planes de tratamiento
5. **Consultas rápidas**: Responder dudas odontológicas generales

CAPACIDADES DE NAVEGACIÓN (MUY IMPORTANTE):
- Si el usuario dice que quiere registrar, anotar, crear o agregar una atención → responde que lo llevas a Nueva Atención
- Si el usuario dice que quiere buscar un paciente → responde que lo llevas a Buscar Paciente
- Si el usuario quiere ver el historial → responde que lo llevas al Historial
- Si el usuario quiere ver el odontograma → responde que lo llevas al Odontograma
- NUNCA digas que no puedes navegar o que no tienes acceso a la interfaz

Reglas:
- Responde SIEMPRE en español
- Sé conciso pero completo (máximo 3-4 párrafos)
- Usa terminología odontológica profesional
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
 * Interpreta un comando de voz/texto y determina la acción a realizar
 */
export function parseVoiceCommand(transcript) {
  const text = transcript.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Comandos de navegación con muchos sinónimos en lenguaje natural
  const navCommands = [
    {
      route: '/buscar',
      label: 'Buscar Paciente',
      confirm: '🔍 ¡Claro! Te llevo a la búsqueda de pacientes.',
      patterns: [
        'buscar paciente', 'buscar dni', 'busqueda', 'quiero buscar',
        'necesito buscar', 'busca al paciente', 'buscar historial',
        'encontrar paciente', 'buscar un paciente', 'ir a buscar',
        'buscar a', 'quiero encontrar', 'busca paciente',
      ],
    },
    {
      route: '/nueva-atencion',
      label: 'Nueva Atención',
      confirm: '📋 ¡Perfecto! Abriendo el formulario para registrar una nueva atención.',
      patterns: [
        'nueva atencion', 'registrar atencion', 'nuevo tratamiento',
        'registrar tratamiento', 'agregar atencion', 'nueva consulta',
        'registrar consulta', 'quiero registrar', 'registra una atencion',
        'hacer una atencion', 'anotar atencion', 'crear atencion',
        'registrar paciente', 'nueva visita', 'agregar tratamiento',
        'ingresar atencion', 'quiero anotar', 'atender paciente',
        'registres', 'registralo', 'registra al', 'lo registres',
        'quiero que lo registr', 'registra la atencion', 'pon la atencion',
        'anota la atencion', 'ingresa la atencion', 'nueva atencion medica',
        'registra la consulta', 'crea la atencion', 'haz el registro',
      ],
    },
    {
      route: '/historial',
      label: 'Historial',
      confirm: '📂 ¡Aquí vamos! Abriendo el historial de atenciones.',
      patterns: [
        'historial', 'ver historial', 'atenciones anteriores',
        'consultas anteriores', 'tratamientos anteriores', 'ver atenciones',
        'historico', 'ver registros', 'ir al historial', 'abrir historial',
      ],
    },
    {
      route: '/odontograma',
      label: 'Odontograma',
      confirm: '🦷 Abriendo el odontograma interactivo.',
      patterns: [
        'odontograma', 'ver odontograma', 'mapa dental', 'dientes',
        'abrir odontograma', 'ir al odontograma', 'diagrama dental',
      ],
    },
    {
      route: '/reportes',
      label: 'Reportes',
      confirm: '📊 Abriendo la sección de reportes y estadísticas.',
      patterns: [
        'reportes', 'ver reportes', 'estadisticas', 'informe',
        'ver estadisticas', 'ir a reportes', 'abrir reportes', 'graficas',
      ],
    },
    {
      route: '/pacientes',
      label: 'Lista de Pacientes',
      confirm: '👥 Mostrando la lista completa de pacientes.',
      patterns: [
        'pacientes', 'ver pacientes', 'lista pacientes', 'todos los pacientes',
        'ir a pacientes', 'abrir pacientes', 'ver lista',
      ],
    },
    {
      route: '/',
      label: 'Inicio',
      confirm: '🏠 Regresando al inicio.',
      patterns: [
        'panel', 'inicio', 'dashboard', 'ir al inicio', 'pagina principal',
        'ir al panel', 'volver al inicio', 'home',
      ],
    },
    {
      route: '/usuarios',
      label: 'Usuarios',
      confirm: '👤 Abriendo la gestión de usuarios.',
      patterns: [
        'usuarios', 'gestion usuarios', 'administrar usuarios',
        'ver usuarios', 'agregar usuario',
      ],
    },
  ];

  for (const cmd of navCommands) {
    for (const pattern of cmd.patterns) {
      if (text.includes(pattern)) {
        return {
          type: 'navigate',
          route: cmd.route,
          label: cmd.label,
          confirm: cmd.confirm,
        };
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
