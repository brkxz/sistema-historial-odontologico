// ============================================================
// routes/ai-knowledge.js
// CRUD de la base de conocimiento dental de Denty
// Requiere autenticación para modificar; lectura pública (para el chat)
// ============================================================

import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import AIKnowledge from '../models/AIKnowledge.js';

const router = Router();

// ──────────────────────────────────────────────────────────
// GET /api/ai-knowledge/active — Conocimiento activo (para el chat)
// No requiere auth — lo usa el sistema internamente
// ──────────────────────────────────────────────────────────
router.get('/active', async (req, res) => {
  try {
    const entries = await AIKnowledge.findAll({
      where: { is_active: true },
      order: [['priority', 'DESC'], ['created_at', 'ASC']],
      attributes: ['id', 'category', 'question', 'answer'],
    });
    res.json({ knowledge: entries });
  } catch (error) {
    console.error('[AIKnowledge] Error al obtener conocimiento:', error);
    res.status(500).json({ error: 'Error al obtener la base de conocimiento' });
  }
});

// ──────────────────────────────────────────────────────────
// GET /api/ai-knowledge — Listar todo (requiere auth)
// ──────────────────────────────────────────────────────────
router.get('/', authenticateToken, async (req, res) => {
  try {
    const entries = await AIKnowledge.findAll({
      order: [['priority', 'DESC'], ['category', 'ASC'], ['created_at', 'ASC']],
    });
    res.json({ knowledge: entries });
  } catch (error) {
    console.error('[AIKnowledge] Error al listar:', error);
    res.status(500).json({ error: 'Error al obtener la base de conocimiento' });
  }
});

// ──────────────────────────────────────────────────────────
// POST /api/ai-knowledge — Crear nueva entrada (requiere auth)
// ──────────────────────────────────────────────────────────
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { category, question, answer, priority = 0, is_active = true } = req.body;

    if (!category || !question || !answer) {
      return res.status(400).json({ error: 'category, question y answer son requeridos' });
    }

    const entry = await AIKnowledge.create({
      category: category.trim().slice(0, 80),
      question: question.trim().slice(0, 2000),
      answer: answer.trim().slice(0, 5000),
      priority: parseInt(priority) || 0,
      is_active: Boolean(is_active),
      created_by: req.user?.id || null,
      created_at: new Date(),
      updated_at: new Date(),
    });

    res.status(201).json({ message: 'Conocimiento agregado exitosamente', entry });
  } catch (error) {
    console.error('[AIKnowledge] Error al crear:', error);
    res.status(500).json({ error: 'Error al guardar el conocimiento' });
  }
});

// ──────────────────────────────────────────────────────────
// PUT /api/ai-knowledge/:id — Actualizar entrada (requiere auth)
// ──────────────────────────────────────────────────────────
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const entry = await AIKnowledge.findByPk(req.params.id);
    if (!entry) return res.status(404).json({ error: 'Entrada no encontrada' });

    const { category, question, answer, priority, is_active } = req.body;

    await entry.update({
      ...(category !== undefined && { category: category.trim().slice(0, 80) }),
      ...(question !== undefined && { question: question.trim().slice(0, 2000) }),
      ...(answer !== undefined && { answer: answer.trim().slice(0, 5000) }),
      ...(priority !== undefined && { priority: parseInt(priority) || 0 }),
      ...(is_active !== undefined && { is_active: Boolean(is_active) }),
      updated_at: new Date(),
    });

    res.json({ message: 'Actualizado correctamente', entry });
  } catch (error) {
    console.error('[AIKnowledge] Error al actualizar:', error);
    res.status(500).json({ error: 'Error al actualizar el conocimiento' });
  }
});

// ──────────────────────────────────────────────────────────
// DELETE /api/ai-knowledge/:id — Eliminar entrada (requiere auth)
// ──────────────────────────────────────────────────────────
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const entry = await AIKnowledge.findByPk(req.params.id);
    if (!entry) return res.status(404).json({ error: 'Entrada no encontrada' });

    await entry.destroy();
    res.json({ message: 'Entrada eliminada correctamente' });
  } catch (error) {
    console.error('[AIKnowledge] Error al eliminar:', error);
    res.status(500).json({ error: 'Error al eliminar' });
  }
});

export default router;
