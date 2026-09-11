import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Todas las rutas de IA requieren autenticación
router.use(authenticateToken);

// ============================================================
// CONFIGURACIÓN DE PROVEEDORES (Fallback: Groq → Gemini → OpenRouter)
// ============================================================

const PROVIDERS = [
  {
    name: 'Groq',
    enabled: () => !!process.env.GROQ_API_KEY,
    call: async (messages) => {
      const model = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
      const maxTokens = parseInt(process.env.GROQ_MAX_TOKENS || '1000');

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
        throw new Error(`Groq ${res.status}: ${err?.error?.message || 'error desconocido'}`);
      }

      const data = await res.json();
      let text = data?.choices?.[0]?.message?.content || '';
      // Eliminar bloques <think>...</think> de modelos con reasoning
      text = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
      return text;
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
// POST /api/ai/chat - Proxy con fallback automático entre proveedores
// ============================================================
router.post('/chat', async (req, res) => {
  try {
    const { contents } = req.body;
    if (!contents || !Array.isArray(contents)) {
      return res.status(400).json({ error: 'Formato de mensaje inválido' });
    }

    // Convertir formato Gemini (contents/parts) → formato OpenAI (messages)
    const messages = contents.map(c => ({
      role: c.role === 'model' ? 'assistant' : c.role,
      content: c.parts?.[0]?.text || '',
    }));

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
// GET /api/ai/status - Estado de todos los proveedores
// ============================================================
router.get('/status', (req, res) => {
  const providers = PROVIDERS.map(p => ({
    name: p.name,
    configured: p.enabled(),
  }));

  const configured = providers.some(p => p.configured);

  res.json({ configured, providers });
});

export default router;
