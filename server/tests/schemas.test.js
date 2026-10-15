// tests/schemas.test.js — Tests de validación Zod
import { describe, it, expect } from 'vitest';
import {
  loginSchema,
  createPatientSchema,
  createAppointmentSchema,
  changePasswordSchema,
  paginationSchema,
} from '../utils/schemas.js';

// ─── Login ────────────────────────────────────────────────────────────────────
describe('loginSchema', () => {
  it('debe aceptar credenciales válidas', () => {
    const result = loginSchema.safeParse({ username: 'admin', password: 'abc123' });
    expect(result.success).toBe(true);
  });

  it('debe rechazar username vacío', () => {
    const result = loginSchema.safeParse({ username: '', password: 'abc123' });
    expect(result.success).toBe(false);
  });

  it('debe rechazar password vacío', () => {
    const result = loginSchema.safeParse({ username: 'admin', password: '' });
    expect(result.success).toBe(false);
  });
});

// ─── Contraseña segura ────────────────────────────────────────────────────────
describe('changePasswordSchema', () => {
  it('debe aceptar contraseña con 8+ chars, mayúscula y número', () => {
    const r = changePasswordSchema.safeParse({
      current_password: 'cualquiera',
      new_password: 'Segura123',
    });
    expect(r.success).toBe(true);
  });

  it('debe rechazar contraseña menor a 8 caracteres', () => {
    const r = changePasswordSchema.safeParse({
      current_password: 'cualquiera',
      new_password: 'Abc1',
    });
    expect(r.success).toBe(false);
    const allMessages = r.error.issues.map(e => e.message).join(' ');
    expect(allMessages).toMatch(/8|ocho|caracteres/i);
  });

  it('debe rechazar contraseña sin mayúscula', () => {
    const r = changePasswordSchema.safeParse({
      current_password: 'cualquiera',
      new_password: 'sinmayusc123',
    });
    expect(r.success).toBe(false);
    const allMessages = r.error.issues.map(e => e.message).join(' ');
    expect(allMessages).toMatch(/mayúscula|mayuscula|uppercase/i);
  });

  it('debe rechazar contraseña sin número', () => {
    const r = changePasswordSchema.safeParse({
      current_password: 'cualquiera',
      new_password: 'SinNumeroAqui',
    });
    expect(r.success).toBe(false);
    const allMessages = r.error.issues.map(e => e.message).join(' ');
    expect(allMessages).toMatch(/número|numero|number/i);
  });

  it('debe rechazar contraseñas extremadamente largas (>128)', () => {
    const r = changePasswordSchema.safeParse({
      current_password: 'cualquiera',
      new_password: 'A1' + 'x'.repeat(130),
    });
    expect(r.success).toBe(false);
  });
});

// ─── Pacientes ─────────────────────────────────────────────────────────────────
describe('createPatientSchema', () => {
  const valid = {
    dni: '12345678',
    first_name: 'Juan',
    last_name: 'Pérez',
  };

  it('debe aceptar datos mínimos válidos', () => {
    expect(createPatientSchema.safeParse(valid).success).toBe(true);
  });

  it('debe rechazar DNI con menos de 8 dígitos', () => {
    const r = createPatientSchema.safeParse({ ...valid, dni: '1234567' });
    expect(r.success).toBe(false);
    const allMessages = r.error.issues.map(e => e.message).join(' ');
    expect(allMessages).toMatch(/8|dígito|digit/i);
  });

  it('debe rechazar DNI con más de 8 dígitos', () => {
    const r = createPatientSchema.safeParse({ ...valid, dni: '123456789' });
    expect(r.success).toBe(false);
  });

  it('debe rechazar DNI con letras', () => {
    const r = createPatientSchema.safeParse({ ...valid, dni: '1234567A' });
    expect(r.success).toBe(false);
  });

  it('debe rechazar first_name menor a 2 caracteres', () => {
    const r = createPatientSchema.safeParse({ ...valid, first_name: 'A' });
    expect(r.success).toBe(false);
  });

  it('debe aceptar tipo de sangre válido', () => {
    const r = createPatientSchema.safeParse({ ...valid, blood_type: 'AB+' });
    expect(r.success).toBe(true);
  });

  it('debe rechazar tipo de sangre inválido', () => {
    const r = createPatientSchema.safeParse({ ...valid, blood_type: 'Z+' });
    expect(r.success).toBe(false);
  });

  it('debe aceptar email válido', () => {
    const r = createPatientSchema.safeParse({ ...valid, email: 'juan@email.com' });
    expect(r.success).toBe(true);
  });

  it('debe rechazar email inválido', () => {
    const r = createPatientSchema.safeParse({ ...valid, email: 'no-es-email' });
    expect(r.success).toBe(false);
  });

  it('debe aceptar género M o F', () => {
    expect(createPatientSchema.safeParse({ ...valid, gender: 'M' }).success).toBe(true);
    expect(createPatientSchema.safeParse({ ...valid, gender: 'F' }).success).toBe(true);
  });

  it('debe rechazar género desconocido', () => {
    expect(createPatientSchema.safeParse({ ...valid, gender: 'X' }).success).toBe(false);
  });

  it('no debe requerir campos opcionales', () => {
    expect(createPatientSchema.safeParse({ dni: '87654321', first_name: 'Ana', last_name: 'Lopez' }).success).toBe(true);
  });
});

// ─── Paginación ────────────────────────────────────────────────────────────────
describe('paginationSchema', () => {
  it('debe usar valores por defecto si no se proveen', () => {
    const r = paginationSchema.parse({});
    expect(r.page).toBe(1);
    expect(r.limit).toBe(20);
  });

  it('debe convertir strings a números', () => {
    const r = paginationSchema.parse({ page: '3', limit: '50' });
    expect(r.page).toBe(3);
    expect(r.limit).toBe(50);
  });

  it('debe rechazar limit mayor a 100 (protección anti-DoS)', () => {
    const r = paginationSchema.safeParse({ limit: '99999' });
    expect(r.success).toBe(false);
  });

  it('debe rechazar page = 0 o negativo', () => {
    expect(paginationSchema.safeParse({ page: '0' }).success).toBe(false);
    expect(paginationSchema.safeParse({ page: '-1' }).success).toBe(false);
  });
});

// ─── Citas ────────────────────────────────────────────────────────────────────
describe('createAppointmentSchema', () => {
  const valid = {
    patient_id: 1,
    date: '2026-12-01',
    time: '09:30',
    reason: 'Control semestral',
  };

  it('debe aceptar datos válidos', () => {
    expect(createAppointmentSchema.safeParse(valid).success).toBe(true);
  });

  it('debe rechazar hora con formato incorrecto', () => {
    const r = createAppointmentSchema.safeParse({ ...valid, time: '9:30' });
    expect(r.success).toBe(false);
    const allMessages = r.error.issues.map(e => e.message).join(' ');
    expect(allMessages).toMatch(/HH:MM|formato|time/i);
  });

  it('debe rechazar duración menor a 15 minutos', () => {
    const r = createAppointmentSchema.safeParse({ ...valid, duration: 5 });
    expect(r.success).toBe(false);
  });

  it('debe rechazar duración mayor a 240 minutos', () => {
    const r = createAppointmentSchema.safeParse({ ...valid, duration: 300 });
    expect(r.success).toBe(false);
  });

  it('debe rechazar estados inválidos', () => {
    const r = createAppointmentSchema.safeParse({ ...valid, status: 'activa' });
    expect(r.success).toBe(false);
  });

  it('debe aceptar todos los estados válidos', () => {
    ['pending', 'confirmed', 'cancelled', 'completed'].forEach(s => {
      expect(createAppointmentSchema.safeParse({ ...valid, status: s }).success).toBe(true);
    });
  });

  it('debe usar duración por defecto de 30 minutos', () => {
    const r = createAppointmentSchema.parse(valid);
    expect(r.duration).toBe(30);
  });
});
