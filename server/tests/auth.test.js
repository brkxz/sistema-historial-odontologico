// tests/auth.test.js — Tests de autenticación y seguridad
import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';

// ─── Mock de dependencias de BD ──────────────────────────────────────────────
vi.mock('../models/index.js', () => ({
  User: {
    findOne:   vi.fn(),
    findByPk:  vi.fn(),
    create:    vi.fn(),
  },
}));

vi.mock('../models/RevokedToken.js', () => ({
  isTokenRevoked: vi.fn().mockResolvedValue(false),
  revokeToken:    vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../middleware/audit.js', () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
}));

// ─── Tests de generateToken ───────────────────────────────────────────────────
describe('generateToken', () => {
  it('debe generar un token JWT válido con payload correcto', async () => {
    const { generateToken } = await import('../middleware/auth.js');
    const user = { id: 1, username: 'admin', role: 'admin' };

    const token = generateToken(user);
    expect(token).toBeTruthy();
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3); // Header.Payload.Signature
  });

  it('el token debe contener id, username y role correctos', async () => {
    const { generateToken } = await import('../middleware/auth.js');
    const user = { id: 42, username: 'dra_perez', role: 'odontologo' };

    const token = generateToken(user);
    const decoded = jwt.decode(token);

    expect(decoded.id).toBe(42);
    expect(decoded.username).toBe('dra_perez');
    expect(decoded.role).toBe('odontologo');
  });

  it('el token debe incluir un JTI (ID único) para poder revocarlo', async () => {
    const { generateToken } = await import('../middleware/auth.js');
    const token1 = generateToken({ id: 1, username: 'u1', role: 'admin' });
    const token2 = generateToken({ id: 1, username: 'u1', role: 'admin' });

    const d1 = jwt.decode(token1);
    const d2 = jwt.decode(token2);

    // Cada token debe tener un JTI distinto
    expect(d1.jti).toBeTruthy();
    expect(d2.jti).toBeTruthy();
    expect(d1.jti).not.toBe(d2.jti);
  });

  it('el token debe tener issuer y audience correctos', async () => {
    const { generateToken } = await import('../middleware/auth.js');
    const token = generateToken({ id: 1, username: 'test', role: 'admin' });
    const decoded = jwt.decode(token);

    expect(decoded.iss).toBe('historial-odontologico');
    expect(decoded.aud).toBe('odonto-app');
  });

  it('el token debe expirar en 8 horas', async () => {
    const { generateToken } = await import('../middleware/auth.js');
    const token = generateToken({ id: 1, username: 'test', role: 'admin' });
    const decoded = jwt.decode(token);
    const hoursUntilExpiry = (decoded.exp - decoded.iat) / 3600;

    expect(hoursUntilExpiry).toBe(8);
  });
});

// ─── Tests de authenticateToken (middleware) ─────────────────────────────────
describe('authenticateToken middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req  = { headers: {}, ip: '127.0.0.1' };
    res  = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    next = vi.fn();
  });

  it('debe retornar 401 si no hay token', async () => {
    const { authenticateToken } = await import('../middleware/auth.js');
    await authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining('Token') })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('debe retornar 403 si el token está malformado', async () => {
    const { authenticateToken } = await import('../middleware/auth.js');
    req.headers['authorization'] = 'Bearer token-invalido-xyz';
    await authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('debe retornar 401 si el token está expirado', async () => {
    const { authenticateToken } = await import('../middleware/auth.js');

    const expiredToken = jwt.sign(
      { id: 1, username: 'test', role: 'admin', jti: 'test-jti' },
      process.env.JWT_SECRET,
      { expiresIn: -1, issuer: 'historial-odontologico', audience: 'odonto-app', algorithm: 'HS256' }
    );

    req.headers['authorization'] = `Bearer ${expiredToken}`;
    await authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining('expirado') })
    );
  });

  it('debe retornar 401 si el token está revocado', async () => {
    const { isTokenRevoked } = await import('../models/RevokedToken.js');
    isTokenRevoked.mockResolvedValueOnce(true);

    const { authenticateToken } = await import('../middleware/auth.js');

    const { User } = await import('../models/index.js');
    User.findByPk.mockResolvedValueOnce({
      id: 1, username: 'admin', role: 'admin',
      is_active: true, locked_until: null,
      toJSON: () => ({}),
    });

    const token = jwt.sign(
      { id: 1, username: 'test', role: 'admin', jti: 'revoked-jti' },
      process.env.JWT_SECRET,
      { issuer: 'historial-odontologico', audience: 'odonto-app', expiresIn: '1h', algorithm: 'HS256' }
    );

    req.headers['authorization'] = `Bearer ${token}`;
    await authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });
});
