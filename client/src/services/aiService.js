// ============================================================
// Servicio de IA - Proxy seguro a través del backend
// La API key de Groq se mantiene SOLO en el servidor
// ============================================================

import { parseVoiceToDni } from '../utils/speechToDni.js';

const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) || 'http://localhost:3001/api';

const SYSTEM_PROMPT = `Eres "Denty", un asistente de inteligencia artificial especializado en odontología clínica integrado en el Sistema de Historial Odontológico Digital del Hospital San Ramón en Chanchamayo, Perú.

CAPACIDAD DE ACCIÓN (MUY IMPORTANTE):
Cuando el usuario quiera navegar o hacer algo en el sistema, DEBES incluir una etiqueta de acción al INICIO de tu respuesta con este formato exacto:
[ACTION:navigate:/ruta]

Rutas disponibles:
- Nueva Atención o Registrar: [ACTION:navigate:/nueva-atencion]
- Buscar Paciente: [ACTION:navigate:/buscar]
- Ver Historial: [ACTION:navigate:/historial]
- Odontograma: [ACTION:navigate:/odontograma]
- Reportes: [ACTION:navigate:/reportes]
- Lista Pacientes: [ACTION:navigate:/pacientes]
- Usuarios del sistema: [ACTION:navigate:/usuarios]
- Mi perfil / cambiar contraseña: [ACTION:navigate:/perfil]
- Logs de auditoría: [ACTION:navigate:/auditoria]
- Inicio: [ACTION:navigate:/]

Ejemplos de cuándo usar acción:
- "quiero registrar", "registra al paciente", "nueva atención" → [ACTION:navigate:/nueva-atencion]
- "busca al paciente", "quiero buscar", "DNI..." → [ACTION:navigate:/buscar]
- "ver historial", "atenciones anteriores" → [ACTION:navigate:/historial]
- "quiero ver los reportes" → [ACTION:navigate:/reportes]
- "mi perfil", "cambiar mi contraseña", "editar mi cuenta" → [ACTION:navigate:/perfil]
- "ver auditoría", "logs del sistema", "ver registros de actividad" → [ACTION:navigate:/auditoria]

TÚ SÍ PUEDES navegar. NUNCA digas que no tienes acceso a la interfaz.

Tu rol es ayudar a los odontólogos con:
1. Navegación del sistema (usando las etiquetas ACTION)
2. Sugerencias clínicas: tratamientos, materiales, procedimientos
3. Farmacología dental: prescripciones, dosis, contraindicaciones
4. Redacción clínica: observaciones, diagnósticos, planes de tratamiento
5. Consultas odontológicas generales

Reglas:
- Responde SIEMPRE en español
- Sé conciso (máximo 2-3 párrafos)
- Incluye emojis para hacer la conversación amigable
- Cuando sugieras medicamentos, recuerda verificar alergias del paciente
- Hospital: San Ramón, Perú | Nomenclatura FDI | Formato fecha dd/mm/yyyy`;

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
      parts: [{ text: '¡Hola Doctor! 👋 Soy Denty, tu asistente odontológico inteligente. Estoy aquí para ayudarte con diagnósticos, tratamientos, recetas y cualquier consulta clínica. ¿En qué puedo asistirte?' }]
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
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!rawText) {
    throw new Error('La IA no generó una respuesta');
  }

  // Parsear etiquetas de acción [ACTION:navigate:/ruta]
  const actionMatch = rawText.match(/\[ACTION:navigate:([^\]]+)\]/);
  const action = actionMatch ? { type: 'navigate', route: actionMatch[1] } : null;
  // Limpiar etiquetas del texto visible
  const text = rawText.replace(/\[ACTION:[^\]]+\]/g, '').trim();

  return { text, action };
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

  // 1. Detección de comandos para el Odontograma por voz (ej. "marcar caries en la pieza 16", "poner sano en la 21")
  const odontoActionMatch = text.match(/(?:marcar|poner|colocar|registrar|anotar)?\s*(caries|sano|obturado|ausente|fracturado|endodoncia|corona|puente|sellante|protesis)\s*(?:en\s*(?:la\s*)?(?:pieza|diente)?)?\s*(\d{2})/);
  if (odontoActionMatch) {
    const condition = odontoActionMatch[1];
    const toothNumber = odontoActionMatch[2];
    return {
      type: 'odontogram_mark',
      condition,
      toothNumber,
      confirm: `🦷 Registrado: Pieza ${toothNumber} marcada con ${condition}.`,
    };
  }

  // 2. Comandos operativos de Acción Clínica en Formulario (Guardar, Imprimir, Limpiar)
  if (text.includes('guardar atencion') || text.includes('guardar tratamiento') || text.includes('guarda la atencion') || text.includes('grabar atencion')) {
    return {
      type: 'action_submit_treatment',
      confirm: '💾 Guardando atención médica del paciente...',
    };
  }
  if (text.includes('imprimir atencion') || text.includes('imprime la atencion') || text.includes('imprimir ficha') || text.includes('imprimir receta')) {
    return {
      type: 'action_print_treatment',
      confirm: '🖨️ Generando ficha para impresión...',
    };
  }
  if (text.includes('limpiar formulario') || text.includes('borrar campos') || text.includes('nueva atencion en blanco')) {
    return {
      type: 'action_reset_treatment',
      confirm: '🧹 Limpiando formulario de atención.',
    };
  }

  // 3. Extracción inteligente de DNI hablado (si se menciona un DNI de 8 cifras, tiene máxima prioridad)
  const extractedDni = parseVoiceToDni(transcript);
  if (extractedDni && extractedDni.length === 8) {
    return {
      type: 'search_dni',
      dni: extractedDni,
      confirm: `🔍 Buscando paciente con DNI ${extractedDni}...`,
    };
  }

  // 4. Comandos de navegación con sinónimos enriquecidos en lenguaje natural
  const navCommands = [
    {
      route: '/buscar',
      label: 'Buscar Paciente',
      confirm: '🔍 ¡Claro! Abriendo el buscador de pacientes.',
      patterns: [
        'buscar paciente', 'buscar dni', 'busqueda', 'quiero buscar',
        'necesito buscar', 'busca al paciente', 'buscar historial',
        'encontrar paciente', 'buscar un paciente', 'ir a buscar',
        'buscar a', 'quiero encontrar', 'busca paciente', 'consultar paciente',
        'ubicar paciente', 'buscar por dni',
      ],
    },
    {
      route: '/nueva-atencion',
      label: 'Nueva Atención',
      confirm: '📋 ¡Listo! Abriendo el registro de nueva atención.',
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
        'abrir formulario', 'nueva cita', 'atender ahora',
      ],
    },
    {
      route: '/historial',
      label: 'Historial',
      confirm: '📂 ¡Aquí tienes! Abriendo el historial clínico.',
      patterns: [
        'historial', 'ver historial', 'atenciones anteriores',
        'consultas anteriores', 'tratamientos anteriores', 'ver atenciones',
        'historico', 'ver registros', 'ir al historial', 'abrir historial',
        'consultas pasadas', 'historia clinica',
      ],
    },
    {
      route: '/odontograma',
      label: 'Odontograma',
      confirm: '🦷 Abriendo el odontograma interactivo.',
      patterns: [
        'odontograma', 'ver odontograma', 'mapa dental', 'dientes',
        'abrir odontograma', 'ir al odontograma', 'diagrama dental',
        'ver la boca', 'piezas dentales',
      ],
    },
    {
      route: '/reportes',
      label: 'Reportes',
      confirm: '📊 Abriendo el módulo de reportes y estadísticas.',
      patterns: [
        'reportes', 'ver reportes', 'estadisticas', 'informe',
        'ver estadisticas', 'ir a reportes', 'abrir reportes', 'graficas',
        'metricas', 'resumen del mes',
      ],
    },
    {
      route: '/pacientes',
      label: 'Lista de Pacientes',
      confirm: '👥 Mostrando el directorio de pacientes.',
      patterns: [
        'pacientes', 'ver pacientes', 'lista pacientes', 'todos los pacientes',
        'ir a pacientes', 'abrir pacientes', 'ver lista', 'directorio de pacientes',
      ],
    },
    {
      route: '/',
      label: 'Inicio',
      confirm: '🏠 Regresando al panel principal.',
      patterns: [
        'panel', 'inicio', 'dashboard', 'ir al inicio', 'pagina principal',
        'ir al panel', 'volver al inicio', 'home', 'pantalla de inicio',
      ],
    },
    {
      route: '/usuarios',
      label: 'Usuarios',
      confirm: '👤 Abriendo la gestión de usuarios del sistema.',
      patterns: [
        'usuarios', 'gestion usuarios', 'administrar usuarios',
        'ver usuarios', 'agregar usuario', 'lista de doctores',
      ],
    },
    {
      route: '/perfil',
      label: 'Mi Perfil',
      confirm: '👤 Abriendo tu perfil y ajustes de cuenta.',
      patterns: [
        'mi perfil', 'ver perfil', 'editar perfil', 'perfil de usuario',
        'cambiar contrasena', 'cambiar clave', 'cambiar password',
        'editar mi cuenta', 'mi cuenta', 'configurar perfil',
      ],
    },
    {
      route: '/auditoria',
      label: 'Auditoría',
      confirm: '📋 Abriendo los registros de auditoría y seguridad.',
      patterns: [
        'auditoria', 'ver auditoria', 'logs del sistema', 'registros de actividad',
        'historial de actividad', 'log de auditoria', 'ver logs',
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

  // Si no es un comando directo del sistema, se envía como consulta clínica a la IA
  return { type: 'chat', content: transcript };
}

export default {
  sendMessage,
  getClinicalSuggestion,
  formatClinicalNotes,
  parseVoiceCommand,
  checkAIStatus,
};
