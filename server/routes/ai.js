import { Router } from 'express';
import { createHash } from 'crypto';
import { authenticateToken } from '../middleware/auth.js';
import AIConversation from '../models/AIConversation.js';
import AIKnowledge from '../models/AIKnowledge.js';

const router = Router();

// ============================================================
// CONFIGURACIÓN DE PROVEEDORES (Fallback: Groq → OpenRouter)
// ============================================================

const PROVIDERS = [
  {
    name: 'Groq',
    enabled: () => !!process.env.GROQ_API_KEY,
    call: async (messages) => {
      // Modelos activos verificados en Groq API (Oct 2026)
      const fallbackModels = [
        'openai/gpt-oss-120b',
        'qwen/qwen3.8-27b',
        'openai/gpt-oss-20b',
      ];
      const maxTokens = parseInt(process.env.GROQ_MAX_TOKENS || '1000');

      let lastGroqError = null;

      for (const model of fallbackModels) {
        try {
          const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
            },
            body: JSON.stringify({ model, messages, temperature: 0.7, max_tokens: maxTokens }),
          });

          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(`Groq [${model}] ${res.status}: ${err?.error?.message || 'error desconocido'}`);
          }

          const data = await res.json();
          let text = data?.choices?.[0]?.message?.content || '';
          text = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
          if (text) return text;
        } catch (err) {
          console.warn(`[AI-Groq] Error con modelo ${model}:`, err.message);
          lastGroqError = err;
        }
      }

      throw lastGroqError || new Error('No se pudo obtener respuesta de Groq');
    },
  },

  {
    name: 'OpenRouter',

    enabled: () => !!process.env.OPENROUTER_API_KEY,
    call: async (messages) => {
      // Modelos gratuitos en OpenRouter (sin necesidad de créditos)
      const model = process.env.OPENROUTER_MODEL || 'nex-agi/nex-n2.5-pro:free';

      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'https://hospital-san-ramon.pe',
          'X-Title': 'Sistema Historial Odontológico',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(`OpenRouter ${res.status}: ${err?.error?.message || 'error desconocido'}`);
      }

      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content || '';
      return text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    },
  },
];

// ============================================================
// UTILIDADES
// ============================================================

// Obtener conocimiento activo de la DB y convertirlo en texto para el prompt
async function buildKnowledgeSection() {
  try {
    const entries = await AIKnowledge.findAll({
      where: { is_active: true },
      order: [['priority', 'DESC'], ['created_at', 'ASC']],
      attributes: ['category', 'question', 'answer'],
    });

    if (entries.length === 0) return '';

    const byCategory = {};
    for (const e of entries) {
      const cat = e.category || 'General';
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push(`P: ${e.question}\nR: ${e.answer}`);
    }

    let section = '\n\n📚 BASE DE CONOCIMIENTO ADICIONAL (información específica del consultorio):\n';
    for (const [cat, items] of Object.entries(byCategory)) {
      section += `\n[${cat.toUpperCase()}]\n${items.join('\n\n')}\n`;
    }
    return section;
  } catch (err) {
    console.warn('[AI] No se pudo cargar base de conocimiento:', err.message);
    return '';
  }
}

// Hash de IP para privacidad
function hashIP(ip) {
  try {
    return createHash('sha256').update(ip + (process.env.IP_HASH_SALT || 'denty-salt')).digest('hex');
  } catch {
    return null;
  }
}

// ============================================================
// POST /api/ai/public-chat - Chat PÚBLICO para pacientes (sin auth)
// Rate limit más estricto para evitar abuso
// ============================================================
const publicChatLimits = new Map(); // IP -> { count, resetTime }
const PUBLIC_RATE_LIMIT = 20; // Max mensajes por IP
const PUBLIC_RATE_WINDOW = 10 * 60 * 1000; // Ventana de 10 minutos

router.post('/public-chat', async (req, res) => {
  try {
    // Rate limiting por IP para endpoint público
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    let ipLimit = publicChatLimits.get(clientIP);
    
    if (!ipLimit || now > ipLimit.resetTime) {
      ipLimit = { count: 0, resetTime: now + PUBLIC_RATE_WINDOW };
      publicChatLimits.set(clientIP, ipLimit);
    }
    
    ipLimit.count++;
    if (ipLimit.count > PUBLIC_RATE_LIMIT) {
      return res.status(429).json({ 
        error: 'Demasiadas consultas. Por favor espera unos minutos antes de intentar de nuevo.' 
      });
    }

    const { contents, session_id } = req.body;
    if (!contents || !Array.isArray(contents)) {
      return res.status(400).json({ error: 'Formato de mensaje inválido' });
    }

    // Limitar la longitud de los mensajes para el endpoint público
    const truncatedContents = contents.slice(0, 14); // Max 14 mensajes (system + greeting + 6 pares)

    // Extraer el mensaje del usuario (último mensaje)
    const userMessage = truncatedContents
      .filter(c => c.role === 'user')
      .slice(-1)[0]?.parts?.[0]?.text || '';

    // Cargar conocimiento adicional de la DB
    const knowledgeSection = await buildKnowledgeSection();

    // Convertir formato Gemini → OpenAI
    const messages = truncatedContents.map((c, i) => {
      const role = c.role === 'model' ? 'assistant' : c.role;
      let content = (c.parts?.[0]?.text || '').slice(0, 4000); // Limitar longitud
      // Inyectar conocimiento dinámico al system prompt (primer mensaje)
      if (i === 0 && role === 'user') {
        content = content + knowledgeSection;
        return { role: 'system', content };
      }
      return { role, content };
    });

    const activeProviders = PROVIDERS.filter(p => p.enabled());

    if (activeProviders.length === 0) {
      return res.status(503).json({ error: 'El asistente no está disponible en este momento.' });
    }

    let lastError = null;
    let usedProvider = null;
    let aiResponseText = null;

    for (const provider of activeProviders) {
      try {
        console.log(`[AI-Public] Intentando proveedor: ${provider.name}`);
        const text = await provider.call(messages);

        if (!text) throw new Error('Respuesta vacía');

        usedProvider = provider.name;
        aiResponseText = text;
        console.log(`[AI-Public] Respuesta obtenida de: ${provider.name}`);
        break;
      } catch (err) {
        console.warn(`[AI-Public] Falló ${provider.name}: ${err.message}`);
        lastError = err;
      }
    }

    if (!aiResponseText) {
      console.error('[AI-Public] Todos los proveedores fallaron:', lastError?.message);
      return res.status(503).json({
        error: 'El asistente no está disponible en este momento. Intenta de nuevo más tarde.',
      });
    }

    // Guardar conversación en DB (en segundo plano, no bloquea la respuesta)
    const sid = (session_id || 'anon').slice(0, 64);
    const ipHash = hashIP(clientIP);

    AIConversation.create({
      session_id: sid,
      user_message: userMessage.slice(0, 2000),
      ai_response: aiResponseText.slice(0, 5000),
      provider: usedProvider,
      ip_hash: ipHash,
      created_at: new Date(),
    }).catch(err => console.warn('[AI-Public] No se pudo guardar conversación:', err.message));

    return res.json({
      candidates: [{
        content: {
          parts: [{ text: aiResponseText }],
          role: 'model',
        },
      }],
    });

  } catch (error) {
    console.error('Error en chat público:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Limpiar rate limits expirados periódicamente
setInterval(() => {
  const now = Date.now();
  for (const [ip, limit] of publicChatLimits) {
    if (now > limit.resetTime) publicChatLimits.delete(ip);
  }
}, 5 * 60 * 1000); // Cada 5 minutos

// ============================================================
// POST /api/ai/rate-conversation — Calificar respuesta (sin auth)
// ============================================================
router.post('/rate-conversation', async (req, res) => {
  try {
    const { conversation_id, rating } = req.body;
    if (!conversation_id || ![1, -1].includes(rating)) {
      return res.status(400).json({ error: 'conversation_id y rating (1 o -1) requeridos' });
    }

    const conv = await AIConversation.findByPk(conversation_id);
    if (!conv) return res.status(404).json({ error: 'Conversación no encontrada' });

    await conv.update({ rating });
    res.json({ message: 'Calificación guardada' });
  } catch (error) {
    console.error('Error al calificar:', error);
    res.status(500).json({ error: 'Error interno' });
  }
});

// ============================================================
// RUTAS AUTENTICADAS (requieren token)
// ============================================================

// ============================================================
// GET /api/ai/conversations — Ver conversaciones guardadas (requiere auth)
// ============================================================
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const offset = parseInt(req.query.offset) || 0;
    const rating = req.query.rating; // 'positive', 'negative', 'unrated'

    const where = {};
    if (rating === 'positive') where.rating = 1;
    else if (rating === 'negative') where.rating = -1;
    else if (rating === 'unrated') where.rating = null;

    const { count, rows } = await AIConversation.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    res.json({ total: count, conversations: rows });
  } catch (error) {
    console.error('Error al obtener conversaciones:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ============================================================
// POST /api/ai/chat - Proxy con fallback automático (requiere auth)
// ============================================================
router.post('/chat', authenticateToken, async (req, res) => {
  try {
    const { contents } = req.body;
    if (!contents || !Array.isArray(contents)) {
      return res.status(400).json({ error: 'Formato de mensaje inválido' });
    }

    // Convertir formato Gemini (contents/parts) → formato OpenAI (messages)
    // El primer mensaje "user" es el SYSTEM_PROMPT → lo marcamos como "system"
    const messages = contents.map((c, i) => {
      const role = c.role === 'model' ? 'assistant' : c.role;
      const content = c.parts?.[0]?.text || '';
      // El primer mensaje siempre es el system prompt (enviado como 'user' desde el cliente)
      if (i === 0 && role === 'user') {
        return { role: 'system', content };
      }
      return { role, content };
    });

    const activeProviders = PROVIDERS.filter(p => p.enabled());

    if (activeProviders.length === 0) {
      return res.status(503).json({ error: 'Servicio de IA no configurado. Agrega al menos una API key (GROQ_API_KEY, GEMINI_API_KEY o OPENROUTER_API_KEY).' });
    }

    let lastError = null;
    let usedProvider = null;

    // Intentar cada proveedor en orden hasta que uno funcione
    for (const provider of activeProviders) {
      try {
        console.log(`[AI] Intentando proveedor: ${provider.name}`);
        const text = await provider.call(messages);

        if (!text) throw new Error('Respuesta vacía');

        usedProvider = provider.name;
        console.log(`[AI] Respuesta obtenida de: ${provider.name}`);

        return res.json({
          candidates: [{
            content: {
              parts: [{ text }],
              role: 'model',
            },
          }],
          _provider: provider.name, // Info de debug (no visible para el usuario)
        });
      } catch (err) {
        console.warn(`[AI] Falló ${provider.name}: ${err.message}`);
        lastError = err;
        // Continúa al siguiente proveedor
      }
    }

    // Todos los proveedores fallaron
    console.error('[AI] Todos los proveedores fallaron. Último error:', lastError?.message);
    res.status(503).json({
      error: 'El servicio de IA no está disponible en este momento. Intenta de nuevo más tarde.',
    });
  } catch (error) {
    console.error('Error en proxy de IA:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ============================================================
// GET /api/ai/status - Estado de todos los proveedores (requiere auth)
// ============================================================
router.get('/status', authenticateToken, (req, res) => {
  const providers = PROVIDERS.map(p => ({
    name: p.name,
    configured: p.enabled(),
  }));

  const configured = providers.some(p => p.configured);

  res.json({ configured, providers });
});

export default router;
