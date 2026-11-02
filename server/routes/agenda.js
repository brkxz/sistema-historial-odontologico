/**
 * agenda.js — Ruta API para la Agenda Semanal desde Google Sheets
 * GET /api/agenda/semanal?fechaInicio=YYYY-MM-DD
 */
import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { obtenerPacientesPorDia } from '../services/dentalbot.js';

const router = express.Router();

const DIAS_ES = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];

// GET /api/agenda/semanal?fechaInicio=2026-11-02
// Devuelve la agenda de la semana (lunes a sábado) que contiene la fechaInicio
router.get('/semanal', authenticateToken, async (req, res) => {
    try {
        // Calcular lunes de la semana solicitada
        const rawFecha = req.query.fechaInicio;
        let baseDate = rawFecha ? new Date(rawFecha + 'T12:00:00') : new Date();
        if (isNaN(baseDate.getTime())) baseDate = new Date();

        // Ir al lunes de esa semana
        const dow = baseDate.getDay(); // 0=domingo
        const diffToMonday = dow === 0 ? -6 : 1 - dow;
        const lunes = new Date(baseDate);
        lunes.setDate(lunes.getDate() + diffToMonday);

        // Generar los 6 días (lunes a sábado)
        const dias = [];
        const promises = [];
        for (let i = 0; i < 6; i++) {
            const d = new Date(lunes);
            d.setDate(lunes.getDate() + i);
            dias.push(d);
            promises.push(obtenerPacientesPorDia(d));
        }

        const results = await Promise.all(promises);

        const semana = dias.map((d, i) => {
            const pacientes = results[i] || [];
            // Agrupar por doctor
            const porDoctor = {};
            for (const p of pacientes) {
                const key = p.doctor;
                if (!porDoctor[key]) porDoctor[key] = [];
                porDoctor[key].push(p);
            }
            // Ordenar citas de cada doctor por hora
            for (const key of Object.keys(porDoctor)) {
                porDoctor[key].sort((a, b) => a.hora.localeCompare(b.hora));
            }
            return {
                fecha: d.toISOString().slice(0, 10),
                diaNombre: DIAS_ES[d.getDay()],
                totalPacientes: pacientes.length,
                doctores: Object.entries(porDoctor).map(([nombre, citas]) => ({ nombre, citas })),
            };
        });

        res.json({
            semanaInicio: lunes.toISOString().slice(0, 10),
            semana,
            total: semana.reduce((s, d) => s + d.totalPacientes, 0),
        });
    } catch (error) {
        console.error('[Agenda] Error:', error.message);
        res.status(500).json({ error: 'Error al obtener la agenda semanal' });
    }
});

export default router;

