// tests/sanitize.test.js — Tests del middleware de sanitización de inputs
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sanitizeInputs } from '../middleware/sanitize.js';

describe('sanitizeInputs middleware', () => {
  let res, next;

  beforeEach(() => {
    res  = {};
    next = vi.fn();
  });

  it('debe llamar next() si no hay body', () => {
    const req = {};
    sanitizeInputs(req, res, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it('debe eliminar tags <script> del body', () => {
    const req = {
      body: { name: '<script>alert("XSS")</script>Juan' },
    };
    sanitizeInputs(req, res, next);
    expect(req.body.name).not.toContain('<script>');
    expect(next).toHaveBeenCalledOnce();
  });

  it('debe eliminar atributos onclick del body', () => {
    const req = {
      body: { input: '<img onclick="evil()" src="x">' },
    };
    sanitizeInputs(req, res, next);
    expect(req.body.input).not.toContain('onclick');
    expect(next).toHaveBeenCalledOnce();
  });

  it('debe sanitizar arrays de strings dentro del body', () => {
    const req = {
      body: { items: ['<b>normal</b>', '<script>bad()</script>'] },
    };
    sanitizeInputs(req, res, next);
    expect(req.body.items[0]).not.toContain('<b>');
    expect(req.body.items[1]).not.toContain('<script>');
  });

  it('debe preservar valores numéricos sin modificarlos', () => {
    const req = { body: { age: 25, id: 1 } };
    sanitizeInputs(req, res, next);
    expect(req.body.age).toBe(25);
    expect(req.body.id).toBe(1);
  });

  it('debe preservar valores booleanos', () => {
    const req = { body: { active: true, admin: false } };
    sanitizeInputs(req, res, next);
    expect(req.body.active).toBe(true);
    expect(req.body.admin).toBe(false);
  });

  it('debe sanitizar query params también', () => {
    const req = {
      body: {},
      query: { search: '<script>alert(1)</script>' },
    };
    sanitizeInputs(req, res, next);
    expect(req.query.search).not.toContain('<script>');
  });

  it('debe manejar inputs anidados (objetos dentro de objetos)', () => {
    const req = {
      body: { nested: { field: '<script>evil()</script>' } },
    };
    sanitizeInputs(req, res, next);
    expect(req.body.nested.field).not.toContain('<script>');
    expect(next).toHaveBeenCalledOnce();
  });

  it('debe manejar body null sin romperse', () => {
    const req = { body: null };
    expect(() => sanitizeInputs(req, res, next)).not.toThrow();
    expect(next).toHaveBeenCalledOnce();
  });
});
