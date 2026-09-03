import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Todas las rutas de IA requieren autenticación
router.use(authenticateToken);

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

// POST /api/ai/chat - Proxy seguro para Gemini API
router.post('/chat', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ error: 'Servicio de IA no configurado' });
    }

    const { contents, systemInstruction } = req.body;
    if (!contents || !Array.isArray(contents)) {
      return res.status(400).json({ error: 'Formato de mensaje inválido' });
    }

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        systemInstruction,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Gemini API error:', response.status, errorData);
      return res.status(response.status).json({ 
        error: errorData?.error?.message || 'Error en el servicio de IA' 
      });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error en proxy de IA:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/ai/status - Verificar si la IA está configurada
router.get('/status', authenticateToken, (req, res) => {
  res.json({ configured: !!process.env.GEMINI_API_KEY });
});

export default router;
