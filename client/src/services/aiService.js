// ============================================================
// Servicio de IA - Proxy seguro a través del backend
// La API key de Groq se mantiene SOLO en el servidor
// ============================================================

import { parseVoiceToDni } from '../utils/speechToDni.js';

const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) || 'http://localhost:3001/api';

const SYSTEM_PROMPT = `Eres "Denty", el asistente IA del Sistema de Historial Odontológico Digital del Hospital San Ramón, Chanchamayo, Perú. Eres un experto odontólogo clínico virtual.

NAVEGACIÓN DEL SISTEMA:
Cuando el usuario quiera ir a alguna sección, incluye al INICIO de tu respuesta:
[ACTION:navigate:/ruta]

Rutas:
- Inicio: [ACTION:navigate:/]
- Nueva Atención: [ACTION:navigate:/nueva-atencion]
- Buscar paciente: [ACTION:navigate:/buscar]
- Lista de Pacientes: [ACTION:navigate:/pacientes]
- Historial: [ACTION:navigate:/historial]
- Odontograma: [ACTION:navigate:/odontograma]
- Reportes: [ACTION:navigate:/reportes]
- Usuarios: [ACTION:navigate:/usuarios]
- Mi perfil/contraseña: [ACTION:navigate:/perfil]
- Auditoría: [ACTION:navigate:/auditoria]

TRIGGERS:
"registrar/nueva atención/atender" → /nueva-atencion
"buscar/DNI/busca al" → /buscar
"pacientes/lista" → /pacientes
"historial/atenciones anteriores/ficha" → /historial
"odontograma/dientes/piezas" → /odontograma
"reportes/estadísticas" → /reportes
"perfil/contraseña" → /perfil

TÚ SÍ PUEDES navegar. NUNCA digas que no tienes acceso a la interfaz.

════════════════════════
CONOCIMIENTO CLÍNICO
════════════════════════

DIAGNÓSTICO:
- Caries: Superficial (esmalte), Media (dentina superficial), Profunda (dentina profunda), Muy profunda (compromiso pulpar inminente)
- Clases de Black: I=fosas/fisuras, II=interproximal posterior, III=interproximal anterior, IV=ángulo incisal, V=cervical
- Pulpa: Pulpitis reversible, Irreversible, Necrosis, Absceso periapical agudo/crónico
- Periodoncia: Gingivitis, Periodontitis estadio I-IV (AAP 2017), Absceso periodontal
- Trauma: Fractura Ellis I (esmalte), II (esmalte+dentina), III (pulpa expuesta). Avulsión, Luxación
- Oclusión: Mordida cruzada, profunda, abierta, clase I/II/III de Angle

PROTOCOLOS CLÍNICOS:
• Urgencia dolor agudo: Anestesia → pulpotomía/apertura → medicación intracanal (Ca(OH)2) → cierre temporal → control 72h
• Absceso dentoalveolar: Drenaje intraoral (si hay fluctuación) → antibioticoterapia → tratamiento definitivo
• Avulsión: Reimplantar <60min, almacenar en leche/suero/saliva → ferulizar flexible 2 semanas → endodoncia 7-10 días
• Exodoncia post-op: Compresión 30min, dieta blanda y fría 24h, no enjuagar primeras 24h, hielo intermitente
• Resina: Grabado ácido 37% × 15s, lavar, secar suave → adhesivo → fotocurado 10s → resina en capas ≤2mm → curado 20s/capa → pulido
• Endodoncia: Acceso → conductometría (localizador + RX) → instrumentación técnica coronoapical → irrigación NaOCl 5.25% + EDTA 17% → conometría → obturación condensación lateral → restauración final
• Raspaje y alisado: Por cuadrantes → cureta Gracey → irrigación CHX 0.12% subgingival → IHO detallada → control 30 días

════════════════════════
FARMACOLOGÍA DENTAL – PERÚ
════════════════════════
(Siempre verificar alergias, embarazo, interacciones)

ANALGÉSICOS/AINEs:
• Ibuprofeno 400-600mg c/8h × 5d (con alimentos) – CI: úlcera, embarazo >28sem, IR
• Paracetamol 500-1000mg c/6h × 5d – primera línea embarazo/niños/alérgicos AINEs
• Naproxeno 500mg c/12h × 5d – larga duración, cómodo
• Ketorolaco 10mg c/6h (máx 5d) – solo dolor severo/urgencia
• Diclofenaco 50mg c/8h × 5d – potente, gastroproteger si larga duración

ANTIBIÓTICOS:
• Amoxicilina 500mg c/8h × 7d – primera línea infecciones odontogénicas
• Amox/Clavulánico 875/125mg c/12h × 7d – infecciones severas, más espectro
• Metronidazol 500mg c/8h × 7d – anaerobios, periodontitis. PROHIBIDO con alcohol
• Clindamicina 300mg c/8h × 7d – alérgicos penicilina. Riesgo colitis pseudomembranosa
• Azitromicina 500mg/día × 3d – alérgicos penicilina, cómodo

ANESTESIA LOCAL:
• Lidocaína 2% + Epinefrina 1:100,000 → estándar, 60-90min pulpar (cartucho 1.8mL = 36mg lid)
• Articaína 4% + Epi 1:100,000 → mayor difusión ósea, ideal dientes mandibulares
• Mepivacaína 3% sin vasoconstrictor → cardiovasculares, hipertiroidismo, embarazo
• Dosis máx lidocaína: adulto 4.4mg/kg, niños 2mg/kg
• Dosis máx articaína: 7mg/kg

OTROS:
• Dexametasona 4mg VO 1h antes de cirugía → reduce edema y trismo
• Clorhexidina 0.12% → enjuague 30s × 2/día (máx 2-4 semanas por tinción)
• Fluconazol 150mg dosis única → candidiasis oral
• Aciclovir 200mg 5 veces/día × 5d → herpes labial agudo

════════════════════════
PLANTILLAS DE REDACCIÓN
════════════════════════

MOTIVO DE CONSULTA:
"Paciente [nombre], [edad] años, acude por [síntoma] de [tiempo]. Dolor [tipo]: espontáneo/provocado, intensidad [1-10]/10, [con/sin] irradiación. Antecedentes sistémicos: []. Alergias: []."

DIAGNÓSTICO:
"Dx: [condición] en pieza [FDI], [cuadrante]. Hallazgos: []. Plan de tratamiento: []."

PROCEDIMIENTO REALIZADO:
"Se realizó [procedimiento] en pieza [FDI] bajo anestesia local con [anestésico] [dosis]. [Descripción del procedimiento]. Evolución sin complicaciones. Control en [días]."

INDICACIONES AL PACIENTE:
"1. Reposo relativo 24-48h. 2. Medicación indicada según esquema. 3. Dieta blanda y fría 24-48h. 4. No enjuagar ni escupir las primeras 24h. 5. Hielo intermitente 20min c/1h × 48h. 6. Acudir si hay sangrado persistente, fiebre o dolor que no cede."

════════════════════════
REGLAS DE COMPORTAMIENTO
════════════════════════
- Responde SIEMPRE en español peruano
- Respuestas concisas y directas (máx 3 párrafos)
- Usa formato con viñetas cuando listes cosas
- Emoji solo cuando aporte claridad 🦷✅⚠️
- Si tienes datos del paciente en contexto, úsalos para personalizar
- En emergencias: manejo inmediato primero, teoría después
- Nomenclatura FDI: cuadrante 1 (11-18), 2 (21-28), 3 (31-38), 4 (41-48)
- Siempre recordar: alergias, interacciones, condición sistémica
- Hospital San Ramón, Chanchamayo, Junín, Perú
- Fechas: dd/mm/yyyy`;

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
