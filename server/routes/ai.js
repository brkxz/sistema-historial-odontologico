import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Todas las rutas de IA requieren autenticación
router.use(authenticateToken);

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant'; // Groq free - 30 RPM, rápido

// POST /api/ai/chat - Proxy seguro para Groq API (OpenAI-compatible)
router.post('/chat', async (req, res) => {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ error: 'Servicio de IA no configurado' });
    }

    const { contents } = req.body;
    if (!contents || !Array.isArray(contents)) {
      return res.status(400).json({ error: 'Formato de mensaje inválido' });
    }

    // Convertir formato Gemini → formato OpenAI/Groq
    const messages = contents.map(c => ({
      role: c.role === 'model' ? 'assistant' : c.role,
      content: c.parts?.[0]?.text || '',
    }));

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Groq API error:', response.status, errorData);
      return res.status(response.status).json({
        error: errorData?.error?.message || 'Error en el servicio de IA',
      });
    }

    const data = await response.json();

    // Convertir respuesta Groq → formato Gemini (que espera el cliente)
    const text = data?.choices?.[0]?.message?.content || '';
    res.json({
      candidates: [{
        content: {
          parts: [{ text }],
          role: 'model',
        },
      }],
    });
  } catch (error) {
    console.error('Error en proxy de IA:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/ai/status - Verificar si la IA está configurada
router.get('/status', authenticateToken, (req, res) => {
  res.json({ configured: !!process.env.GROQ_API_KEY });
});

export default router;
