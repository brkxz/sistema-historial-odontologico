// =============================================
// SWAGGER / OpenAPI 3.0 — Documentación de la API
// Accesible en: /api-docs
// =============================================
import swaggerUi from 'swagger-ui-express';

export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Sistema de Historial Odontológico Digital — API',
    version: '2.0.0',
    description: `
## Sistema de Historial Odontológico Digital
API REST del sistema clínico para el **Servicio de Odontología — Hospital San Ramón, Chanchamayo, Perú**.

### Autenticación
La mayoría de endpoints requieren un token JWT en el header:
\`\`\`
Authorization: Bearer <token>
\`\`\`
El token se obtiene mediante \`POST /api/auth/login\`.

### Roles
- **admin** — Acceso completo al sistema
- **odontologo** — Acceso a pacientes, tratamientos y odontograma
    `,
    contact: {
      name: 'Hospital San Ramón',
      email: 'sistemas@hospitalsanramon.pe',
    },
    license: { name: 'Uso interno — Todos los derechos reservados' },
  },
  servers: [
    { url: 'http://localhost:3001/api', description: 'Desarrollo local' },
    { url: 'https://tu-backend.onrender.com/api', description: 'Producción (Render)' },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Token JWT obtenido desde /api/auth/login',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'Mensaje de error' },
        },
      },
      ValidationError: {
        type: 'object',
        properties: {
          error:   { type: 'string', example: 'Datos de entrada inválidos' },
          details: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field:   { type: 'string' },
                message: { type: 'string' },
              },
            },
          },
        },
      },
      User: {
        type: 'object',
        properties: {
          id:        { type: 'integer' },
          username:  { type: 'string' },
          full_name: { type: 'string' },
          email:     { type: 'string', format: 'email' },
          role:      { type: 'string', enum: ['admin', 'odontologo'] },
          specialty: { type: 'string', nullable: true },
        },
      },
      Patient: {
        type: 'object',
        properties: {
          id:              { type: 'integer' },
          dni:             { type: 'string', pattern: '^\\d{8}$', example: '12345678' },
          first_name:      { type: 'string' },
          last_name:       { type: 'string' },
          birth_date:      { type: 'string', format: 'date', nullable: true },
          age:             { type: 'integer', nullable: true },
          gender:          { type: 'string', enum: ['M', 'F'], nullable: true },
          phone:           { type: 'string', nullable: true },
          address:         { type: 'string', nullable: true },
          email:           { type: 'string', format: 'email', nullable: true },
          medical_history: { type: 'string', nullable: true },
          allergies:       { type: 'string', nullable: true },
          medications:     { type: 'string', nullable: true },
          blood_type:      { type: 'string', nullable: true },
        },
      },
      Treatment: {
        type: 'object',
        properties: {
          id:                  { type: 'integer' },
          patient_id:          { type: 'integer' },
          dentist_id:          { type: 'integer' },
          treatment_date:      { type: 'string', format: 'date' },
          reason:              { type: 'string' },
          procedure_performed: { type: 'string', nullable: true },
          observations:        { type: 'string', nullable: true },
          next_appointment:    { type: 'string', format: 'date', nullable: true },
        },
      },
      Appointment: {
        type: 'object',
        properties: {
          id:         { type: 'integer' },
          patient_id: { type: 'integer' },
          dentist_id: { type: 'integer' },
          date:       { type: 'string', format: 'date' },
          time:       { type: 'string', pattern: '^\\d{2}:\\d{2}$', example: '09:30' },
          duration:   { type: 'integer', description: 'Duración en minutos', example: 30 },
          reason:     { type: 'string' },
          notes:      { type: 'string', nullable: true },
          status:     { type: 'string', enum: ['pending', 'confirmed', 'cancelled', 'completed'] },
        },
      },
    },
  },
  security: [{ BearerAuth: [] }],
  paths: {
    // ─── AUTH ──────────────────────────────────────────────────────────────
    '/auth/login': {
      post: {
        tags: ['Autenticación'],
        summary: 'Iniciar sesión',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['username', 'password'],
                properties: {
                  username: { type: 'string', example: 'admin' },
                  password: { type: 'string', example: 'Admin1234' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Login exitoso', content: { 'application/json': { schema: { type: 'object', properties: { token: { type: 'string' }, user: { $ref: '#/components/schemas/User' } } } } } },
          401: { description: 'Credenciales incorrectas', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          423: { description: 'Cuenta bloqueada por intentos fallidos', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Autenticación'],
        summary: 'Cerrar sesión (invalida el token)',
        responses: {
          200: { description: 'Sesión cerrada correctamente' },
          401: { description: 'No autenticado' },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Autenticación'],
        summary: 'Obtener usuario autenticado',
        responses: {
          200: { description: 'Datos del usuario', content: { 'application/json': { schema: { type: 'object', properties: { user: { $ref: '#/components/schemas/User' } } } } } },
        },
      },
    },
    '/auth/change-password': {
      post: {
        tags: ['Autenticación'],
        summary: 'Cambiar contraseña',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['current_password', 'new_password'],
                properties: {
                  current_password: { type: 'string' },
                  new_password:     { type: 'string', description: 'Mínimo 8 chars, 1 mayúscula, 1 número' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Contraseña actualizada' },
          401: { description: 'Contraseña actual incorrecta' },
          422: { description: 'Contraseña no cumple requisitos de seguridad', content: { 'application/json': { schema: { $ref: '#/components/schemas/ValidationError' } } } },
        },
      },
    },
    // ─── PATIENTS ──────────────────────────────────────────────────────────
    '/patients': {
      get: {
        tags: ['Pacientes'],
        summary: 'Listar pacientes',
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Buscar por DNI, nombre o apellido' },
          { name: 'page',   in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit',  in: 'query', schema: { type: 'integer', default: 20, maximum: 100 } },
        ],
        responses: {
          200: { description: 'Lista de pacientes paginada' },
        },
      },
      post: {
        tags: ['Pacientes'],
        summary: 'Registrar nuevo paciente',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['dni', 'first_name', 'last_name'],
                properties: {
                  dni:             { type: 'string', pattern: '^\\d{8}$' },
                  first_name:      { type: 'string' },
                  last_name:       { type: 'string' },
                  birth_date:      { type: 'string', format: 'date' },
                  gender:          { type: 'string', enum: ['M', 'F'] },
                  phone:           { type: 'string' },
                  blood_type:      { type: 'string', enum: ['A+','A-','B+','B-','AB+','AB-','O+','O-'] },
                  medical_history: { type: 'string' },
                  allergies:       { type: 'string' },
                  medications:     { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Paciente creado', content: { 'application/json': { schema: { type: 'object', properties: { patient: { $ref: '#/components/schemas/Patient' } } } } } },
          409: { description: 'DNI ya registrado' },
          422: { description: 'Datos inválidos', content: { 'application/json': { schema: { $ref: '#/components/schemas/ValidationError' } } } },
        },
      },
    },
    '/patients/{id}': {
      get: {
        tags: ['Pacientes'],
        summary: 'Obtener paciente por ID',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Datos del paciente' },
          404: { description: 'Paciente no encontrado' },
        },
      },
      put: {
        tags: ['Pacientes'],
        summary: 'Actualizar paciente',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Paciente actualizado' },
        },
      },
      delete: {
        tags: ['Pacientes'],
        summary: 'Eliminar paciente (eliminación lógica)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Paciente eliminado' },
          404: { description: 'Paciente no encontrado' },
        },
      },
    },
    // ─── APPOINTMENTS ──────────────────────────────────────────────────────
    '/appointments': {
      get: {
        tags: ['Citas'],
        summary: 'Listar citas',
        parameters: [
          { name: 'date',       in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'status',     in: 'query', schema: { type: 'string', enum: ['pending','confirmed','cancelled','completed'] } },
          { name: 'dentist_id', in: 'query', schema: { type: 'integer' } },
          { name: 'patient_id', in: 'query', schema: { type: 'integer' } },
        ],
        responses: { 200: { description: 'Lista de citas' } },
      },
      post: {
        tags: ['Citas'],
        summary: 'Crear nueva cita',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['patient_id', 'date', 'time', 'reason'],
                properties: {
                  patient_id: { type: 'integer' },
                  date:       { type: 'string', format: 'date' },
                  time:       { type: 'string', example: '09:30' },
                  duration:   { type: 'integer', default: 30 },
                  reason:     { type: 'string' },
                  notes:      { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Cita creada' },
          409: { description: 'Conflicto de horario' },
        },
      },
    },
    '/appointments/today': {
      get: { tags: ['Citas'], summary: 'Citas del día', responses: { 200: { description: 'Citas de hoy' } } },
    },
    '/appointments/upcoming': {
      get: { tags: ['Citas'], summary: 'Próximas citas (7 días)', responses: { 200: { description: 'Próximas citas' } } },
    },
    '/appointments/{id}/cancel': {
      patch: {
        tags: ['Citas'],
        summary: 'Cancelar cita',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: { type: 'object', properties: { reason: { type: 'string' } } },
            },
          },
        },
        responses: { 200: { description: 'Cita cancelada' } },
      },
    },
    '/appointments/{id}/complete': {
      patch: {
        tags: ['Citas'],
        summary: 'Marcar cita como completada',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Cita completada' } },
      },
    },
    // ─── TREATMENTS ────────────────────────────────────────────────────────
    '/treatments/patient/{patientId}': {
      get: {
        tags: ['Tratamientos'],
        summary: 'Historial de atenciones del paciente',
        parameters: [
          { name: 'patientId', in: 'path', required: true, schema: { type: 'integer' } },
          { name: 'page',      in: 'query', schema: { type: 'integer', default: 1 } },
        ],
        responses: { 200: { description: 'Lista de atenciones' } },
      },
    },
    '/treatments': {
      post: {
        tags: ['Tratamientos'],
        summary: 'Registrar nueva atención',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object', required: ['patient_id', 'reason'], properties: { patient_id: { type: 'integer' }, reason: { type: 'string' }, procedure_performed: { type: 'string' }, observations: { type: 'string' }, next_appointment: { type: 'string', format: 'date' } } },
            },
          },
        },
        responses: { 201: { description: 'Atención registrada' } },
      },
    },
    // ─── REPORTS ───────────────────────────────────────────────────────────
    '/reports/summary': {
      get: {
        tags: ['Reportes'],
        summary: 'Resumen estadístico general',
        responses: { 200: { description: 'Estadísticas del sistema', content: { 'application/json': { schema: { type: 'object', properties: { totalPatients: { type: 'integer' }, totalTreatments: { type: 'integer' }, todayTreatments: { type: 'integer' }, monthTreatments: { type: 'integer' }, upcomingAppointments: { type: 'integer' } } } } } } },
      },
    },
    // ─── RENIEC ────────────────────────────────────────────────────────────
    '/reniec/dni/{numero}': {
      get: {
        tags: ['RENIEC'],
        summary: 'Consultar datos por DNI peruano',
        parameters: [{ name: 'numero', in: 'path', required: true, schema: { type: 'string', pattern: '^\\d{8}$' }, example: '12345678' }],
        responses: {
          200: { description: 'Datos del ciudadano obtenidos de RENIEC' },
          400: { description: 'DNI con formato inválido' },
          404: { description: 'DNI no encontrado en RENIEC' },
          503: { description: 'Servicio RENIEC no disponible' },
        },
      },
    },
    // ─── AI ────────────────────────────────────────────────────────────────
    '/ai/chat': {
      post: {
        tags: ['Asistente IA'],
        summary: 'Chat con Denty (asistente IA odontológico)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object', properties: { contents: { type: 'array', items: { type: 'object' } } } },
            },
          },
        },
        responses: { 200: { description: 'Respuesta del asistente IA' } },
      },
    },
  },
};

export function setupSwagger(app) {
  const options = {
    customSiteTitle: '🦷 Odontología API Docs',
    customCss: `
      .swagger-ui .topbar { background: #0D9488; }
      .swagger-ui .topbar .download-url-wrapper { display: none; }
      .swagger-ui .info .title { color: #0D9488; }
    `,
    swaggerOptions: {
      persistAuthorization: true,
    },
  };

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, options));
  app.get('/api-docs.json', (req, res) => res.json(swaggerSpec));
}
