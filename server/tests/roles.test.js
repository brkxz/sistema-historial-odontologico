// tests/roles.test.js — Tests del middleware de control de acceso por roles
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requireAdmin, requireDentistOrAdmin } from '../middleware/roles.js';

describe('requireAdmin', () => {
  let req, res, next;

  beforeEach(() => {
    res  = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    next = vi.fn();
  });

  it('debe permitir paso si el usuario es admin', () => {
    req = { user: { role: 'admin', username: 'admin1' } };
    requireAdmin(req, res, next);
    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('debe bloquear si el usuario es odontologo', () => {
    req = { user: { role: 'odontologo', username: 'dr_perez' } };
    requireAdmin(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('debe retornar 401 si no hay usuario en req (sin autenticar)', () => {
    req = {};
    requireAdmin(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('debe bloquear roles desconocidos', () => {
    req = { user: { role: 'superuser' } };
    requireAdmin(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});

describe('requireDentistOrAdmin', () => {
  let req, res, next;

  beforeEach(() => {
    res  = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    next = vi.fn();
  });

  it('debe permitir paso si el usuario es admin', () => {
    req = { user: { role: 'admin' } };
    requireDentistOrAdmin(req, res, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it('debe permitir paso si el usuario es odontologo', () => {
    req = { user: { role: 'odontologo' } };
    requireDentistOrAdmin(req, res, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it('debe retornar 401 si no hay usuario (sin autenticar)', () => {
    req = {};
    requireDentistOrAdmin(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
