import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { detectarGenero } from '../utils/genderDetector.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// =============================================
// Proveedor 1: decolecta.com (GET) — Primario
// =============================================
async function consultarDecolecta(numero) {
  const token = process.env.RENIEC_API_TOKEN;
  if (!token || token === 'tu_token_de_apis_net_pe_aqui') {
    return { success: false, reason: 'no_token' };
  }

  try {
    const response = await fetch(`https://api.decolecta.com/v1/reniec/dni?numero=${numero}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return { success: false, reason: 'http_error', status: response.status };
    }

    const data = await response.json();

    // Si devuelve error
    if (data.message && !data.first_name) {
      return { success: false, reason: 'api_error', status: 404 };
    }

    const nombres = data.first_name || data.nombres || '';

    return {
      success: true,
      provider: 'decolecta.com',
      data: {
        dni: data.document_number || numero,
        nombres,
        apellidoPaterno: data.first_last_name || data.apellidoPaterno || '',
        apellidoMaterno: data.second_last_name || data.apellidoMaterno || '',
        nombreCompleto: data.full_name || data.nombreCompleto || '',
        fechaNacimiento: data.birth_date || data.fecha_nacimiento || data.fechaNacimiento || '',
        direccion: data.address || data.direccion || '',
        departamento: data.department || data.departamento || '',
        provincia: data.province || data.provincia || '',
        distrito: data.district || data.distrito || '',
        genero: detectarGenero(nombres),
      },
    };
  } catch (error) {
    console.error('Error decolecta.com:', error.message);
    return { success: false, reason: 'connection_error', error: error.message };
  }
}

// =============================================
// Proveedor 2: apiperu.dev (POST) — Fallback
// =============================================
async function consultarApiPeruDev(numero) {
  const token = process.env.APIPERU_DEV_TOKEN;
  if (!token || token === 'tu_token_de_apiperu_dev_aqui') {
    return { success: false, reason: 'no_token' };
  }

  try {
    const response = await fetch('https://api.apiperu.dev/dni', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ dni: numero }),
    });

    if (!response.ok) {
      return { success: false, reason: 'http_error', status: response.status };
    }

    const data = await response.json();

    // apiperu.dev devuelve: { success, data: { nombres, apellido_paterno, apellido_materno, ... } }
    const info = data.data || data;

    const nombres = info.nombres || '';

    return {
      success: true,
      provider: 'apiperu.dev',
      data: {
        dni: info.numero || info.dni || numero,
        nombres,
        apellidoPaterno: info.apellido_paterno || info.apellidoPaterno || '',
        apellidoMaterno: info.apellido_materno || info.apellidoMaterno || '',
        nombreCompleto: info.nombre_completo || info.nombreCompleto || `${nombres} ${info.apellido_paterno || info.apellidoPaterno || ''} ${info.apellido_materno || info.apellidoMaterno || ''}`.trim(),
        fechaNacimiento: info.fecha_nacimiento || info.fechaNacimiento || '',
        direccion: info.direccion || '',
        departamento: info.departamento || '',
        provincia: info.provincia || '',
        distrito: info.distrito || '',
        genero: detectarGenero(nombres),
      },
    };
  } catch (error) {
    console.error('Error apiperu.dev:', error.message);
    return { success: false, reason: 'connection_error', error: error.message };
  }
}

// =============================================
// GET /api/reniec/dni/:numero
// Intenta decolecta.com primero, luego apiperu.dev
// =============================================
router.get('/dni/:numero', async (req, res) => {
  try {
    const { numero } = req.params;

    // Validar formato de DNI (8 dígitos)
    if (!/^\d{8}$/.test(numero)) {
      return res.status(400).json({
        error: 'El DNI debe tener exactamente 8 dígitos numéricos',
      });
    }

    // Verificar que al menos un token esté configurado
    const token1 = process.env.RENIEC_API_TOKEN;
    const token2 = process.env.APIPERU_DEV_TOKEN;
    const hasToken1 = token1 && token1 !== 'tu_token_de_apis_net_pe_aqui';
    const hasToken2 = token2 && token2 !== 'tu_token_de_apiperu_dev_aqui';

    if (!hasToken1 && !hasToken2) {
      return res.status(503).json({
        error: 'No hay tokens de RENIEC configurados. Configure al menos RENIEC_API_TOKEN o APIPERU_DEV_TOKEN en el archivo .env del servidor.',
      });
    }

    // Intentar con el proveedor primario (decolecta.com)
    let result = await consultarDecolecta(numero);

    // Si falló, intentar con el fallback (apiperu.dev)
    if (!result.success && hasToken2) {
      console.log(`decolecta.com falló (${result.reason}), intentando apiperu.dev...`);
      result = await consultarApiPeruDev(numero);
    }

    // Si ambos fallaron
    if (!result.success) {
      if (result.status === 404) {
        return res.status(404).json({ error: 'DNI no encontrado en RENIEC' });
      }
      if (result.status === 401 || result.status === 403) {
        return res.status(401).json({ error: 'Token(s) de RENIEC inválido(s) o expirado(s). Verifique su configuración.' });
      }
      if (result.status === 429) {
        return res.status(429).json({ error: 'Se ha excedido el límite de consultas. Intente más tarde.' });
      }
      return res.status(503).json({
        error: 'No se pudo consultar RENIEC en ningún proveedor. Intente más tarde.',
      });
    }

    // Respuesta exitosa
    res.json({
      success: true,
      provider: result.provider,
      data: result.data,
    });
  } catch (error) {
    console.error('Error al consultar RENIEC:', error);

    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        error: 'No se pudo conectar con el servicio de RENIEC. Verifique su conexión a internet.',
      });
    }

    res.status(500).json({
      error: 'Error interno al consultar RENIEC',
    });
  }
});

export default router;
