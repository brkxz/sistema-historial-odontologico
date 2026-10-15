// =============================================
// VALIDACIÓN DE SCHEMAS — Zod
// Centraliza todas las reglas de validación
// =============================================
import { z } from 'zod';

// ─────────────────────────────────────────────
// Helpers comunes
// ─────────────────────────────────────────────

/** Contraseña segura: mínimo 8 chars, 1 mayúscula, 1 número */
const securePassword = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .max(128, 'La contraseña es demasiado larga')
  .regex(/[A-Z]/, 'La contraseña debe contener al menos una letra mayúscula')
  .regex(/[0-9]/, 'La contraseña debe contener al menos un número');

/** DNI peruano: exactamente 8 dígitos */
const dniField = z
  .string()
  .regex(/^\d{8}$/, 'El DNI debe tener exactamente 8 dígitos numéricos');

/** Paginación segura */
export const paginationSchema = z.object({
  page:  z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ─────────────────────────────────────────────
// Auth
// ─────────────────────────────────────────────
export const loginSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(1).max(128),
});

export const changePasswordSchema = z.object({
  current_password: z.string().min(1, 'La contraseña actual es requerida'),
  new_password: securePassword,
});

export const updateProfileSchema = z.object({
  full_name: z.string().min(2).max(150).optional(),
  email:     z.string().email('Email inválido').or(z.literal('')).optional(),
  specialty: z.string().max(100).optional(),
});

// ─────────────────────────────────────────────
// Usuarios
// ─────────────────────────────────────────────
export const createUserSchema = z.object({
  username:  z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/, 'Solo letras, números y guion bajo'),
  password:  securePassword,
  full_name: z.string().min(2).max(150),
  email:     z.string().email().optional().or(z.literal('')),
  role:      z.enum(['admin', 'odontologo']),
  specialty: z.string().max(100).optional(),
});

export const updateUserSchema = createUserSchema.partial().omit({ password: true });

// ─────────────────────────────────────────────
// Pacientes
// ─────────────────────────────────────────────
export const createPatientSchema = z.object({
  dni:             dniField,
  first_name:      z.string().min(2).max(100),
  last_name:       z.string().min(2).max(100),
  birth_date:      z.string().date().optional().or(z.literal('')),
  age:             z.coerce.number().int().min(0).max(150).optional(),
  gender:          z.enum(['M', 'F']).optional(),
  phone:           z.string().max(20).optional(),
  address:         z.string().max(255).optional(),
  email:           z.string().email().optional().or(z.literal('')),
  medical_history: z.string().optional(),
  allergies:       z.string().optional(),
  medications:     z.string().optional(),
  blood_type:      z.enum(['A+','A-','B+','B-','AB+','AB-','O+','O-']).optional(),
});

export const updatePatientSchema = createPatientSchema.partial();

// ─────────────────────────────────────────────
// Atenciones
// ─────────────────────────────────────────────
export const createTreatmentSchema = z.object({
  patient_id:          z.coerce.number().int().positive(),
  treatment_date:      z.string().date().optional(),
  reason:              z.string().min(3).max(255),
  procedure_performed: z.string().optional(),
  observations:        z.string().optional(),
  next_appointment:    z.string().date().optional().nullable(),
  teeth: z.array(z.object({
    tooth_id:  z.coerce.number().int().positive(),
    condition: z.string().max(100),
    surface:   z.string().max(50).optional(),
    notes:     z.string().optional(),
  })).optional(),
});

export const updateTreatmentSchema = createTreatmentSchema.partial();

// ─────────────────────────────────────────────
// Citas
// ─────────────────────────────────────────────
export const createAppointmentSchema = z.object({
  patient_id:  z.coerce.number().int().positive(),
  dentist_id:  z.coerce.number().int().positive().optional(),
  date:        z.string().date(),
  time:        z.string().regex(/^\d{2}:\d{2}$/, 'Formato de hora inválido (HH:MM)'),
  duration:    z.coerce.number().int().min(15).max(240).default(30),
  reason:      z.string().min(3).max(255),
  notes:       z.string().optional(),
  status:      z.enum(['pending','confirmed','cancelled','completed']).default('pending'),
});

export const updateAppointmentSchema = createAppointmentSchema.partial();

// ─────────────────────────────────────────────
// Middleware de validación genérico
// ─────────────────────────────────────────────

/**
 * Crea un middleware que valida req.body con el schema dado.
 * Si falla, retorna 422 con los errores de validación.
 */
export function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      // Zod v4 usa .issues; v3 usa .errors — soportar ambos
      const issues = result.error.issues ?? result.error.errors ?? [];
      const errors = issues.map(e => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return res.status(422).json({
        error: 'Datos de entrada inválidos',
        details: errors,
      });
    }
    // Reemplazar con datos validados y transformados (coerce, defaults, etc.)
    req[source] = result.data;
    next();
  };
}
