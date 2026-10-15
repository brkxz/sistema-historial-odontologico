# 🦷 Sistema de Historial Odontológico Digital v2.0

> Sistema web clínico para la gestión de pacientes, historiales y atenciones del **Servicio de Odontología — Hospital San Ramón, Chanchamayo, Perú**.  
> Proyecto de Tesis · Ingeniería de Sistemas

![Tests](https://img.shields.io/badge/Tests-56%20passing-brightgreen)
![Coverage](https://img.shields.io/badge/Coverage-70%25-green)
![Node](https://img.shields.io/badge/Node.js-ESM-blue)
![React](https://img.shields.io/badge/React-19-61dafb)
![License](https://img.shields.io/badge/License-Academic-orange)

---

## 📋 Descripción

Plataforma fullstack que permite al personal médico gestionar de forma eficiente:

- 👥 **Pacientes** — Registro con autocompletado via RENIEC, búsqueda por DNI/nombre
- 📋 **Historial Clínico** — Atenciones odontológicas con exportación a PDF
- 🦷 **Odontograma Digital** — Representación interactiva de los 32 dientes
- 📅 **Agenda de Citas** — Con detección automática de conflictos de horario
- 📊 **Reportes** — Estadísticas y exportación CSV/PDF
- 🤖 **Asistente IA "Denty"** — Con activación por voz (wake word)
- 📱 **App Android** — APK nativo via Capacitor 8

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│    React 19 + Vite 8  (client/)                            │
│    Auth Context · React Router · jsPDF · Lucide Icons      │
├─────────────────────────────────────────────────────────────┤
│    Express.js API  (server/)                                │
│    Helmet · CORS · Rate Limiter · Zod · JWT + Blacklist    │
│    Winston Logger · Swagger /api-docs                       │
├────────────────────┬────────────────────┬───────────────────┤
│  SQLite (dev)      │   PostgreSQL (prod) │  Servicios ext.  │
│  Sequelize ORM     │   Render.com        │  RENIEC · Groq   │
└────────────────────┴────────────────────┴───────────────────┘
```

---

## 🚀 Instalación y Configuración

### Prerrequisitos
- **Node.js** >= 20.x
- **npm** >= 9.x

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/sistema-historial-odontologico.git
cd "Sistema de Historial Odontologico"
```

### 2. Configurar el servidor (Backend)

```bash
cd server
npm install
```

Crear archivo `.env` en `/server`:

```env
# Obligatorio
JWT_SECRET=tu-secreto-super-seguro-minimo-32-caracteres
JWT_ISSUER=historial-odontologico
JWT_AUD=odonto-app

# Opcional (dev usa SQLite por defecto)
DATABASE_URL=postgresql://user:pass@host:5432/odontologia

# Servicios externos (opcionales)
GOOGLE_CLIENT_ID=tu-google-client-id
GROQ_API_KEY=tu-groq-api-key
OPENROUTER_API_KEY=tu-openrouter-key
RENIEC_API_KEY=tu-api-key-apiperu
```

```bash
npm run seed    # Carga datos iniciales (usuario admin)
npm run dev     # Inicia servidor en http://localhost:3001
```

### 3. Configurar el cliente (Frontend)

```bash
cd ../client
npm install
```

Crear archivo `.env` en `/client`:

```env
VITE_API_URL=http://localhost:3001/api
VITE_GOOGLE_CLIENT_ID=tu-google-client-id
```

```bash
npm run dev     # Inicia frontend en http://localhost:5173
```

---

## 🧪 Tests

```bash
cd server

npm test                 # Ejecutar 56 tests
npm run test:watch       # Modo watch (desarrollo)
npm run test:coverage    # Reporte de cobertura HTML
```

### Resultados de Tests

| Suite | Tests | Estado |
|-------|-------|--------|
| `auth.test.js` — JWT y middleware | 9 | ✅ |
| `schemas.test.js` — Validaciones Zod | 31 | ✅ |
| `roles.test.js` — Control de acceso | 7 | ✅ |
| `sanitize.test.js` — Sanitización XSS | 9 | ✅ |
| **TOTAL** | **56** | ✅ **All passing** |

---

## 📚 Documentación

| Documento | Ubicación |
|-----------|-----------|
| 📊 Diagrama ER | [`docs/diagramas/diagrama_ER.jpg`](docs/diagramas/diagrama_ER.jpg) |
| 🏗️ Diagrama de Arquitectura | [`docs/diagramas/diagrama_arquitectura.jpg`](docs/diagramas/diagrama_arquitectura.jpg) |
| 📋 Análisis de Requerimientos | [`docs/analisis_requerimientos.md`](docs/analisis_requerimientos.md) |
| 📖 Manual de Usuario | [`docs/manual_usuario.md`](docs/manual_usuario.md) |
| 🔌 API Swagger | `http://localhost:3001/api-docs` |

---

## 🛡️ Seguridad Implementada

| Medida | Implementación |
|--------|--------------|
| Contraseñas | bcrypt (salt=12) |
| Tokens | JWT con expiración 8h + JTI único |
| Logout | Blacklist en BD (revocación real) |
| Headers | Helmet.js (CSP, HSTS, X-Frame) |
| Rate Limiting | 100 req/15min global |
| Validación | Zod en todos los endpoints |
| Sanitización | XSS filter en body, query, params |
| Auditoría | Registro completo de acciones |
| Logs | Winston → `/server/logs/` |
| Account Lockout | 5 intentos → 15min bloqueado |

---

## 📂 Estructura del Proyecto

```
Sistema de Historial Odontologico/
├── 📁 client/                    # Frontend React
│   └── src/
│       ├── components/           # Componentes UI reutilizables
│       ├── context/              # AuthContext, AIContext
│       ├── pages/                # 15+ páginas de la app
│       ├── services/             # API service layer
│       └── utils/exportPDF.js    # Exportación a PDF
│
├── 📁 server/                    # Backend Node.js
│   ├── config/                   # Configuración DB
│   ├── middleware/               # Auth, RBAC, sanitize, logs
│   ├── models/                   # Modelos Sequelize (9 tablas)
│   ├── routes/                   # Endpoints API (10 módulos)
│   ├── utils/                    # Logger, Schemas Zod, Swagger
│   ├── tests/                    # 56 tests unitarios
│   └── logs/                     # Logs Winston (gitignored)
│
├── 📁 docs/                      # Documentación técnica
│   ├── diagramas/                # ER + Arquitectura
│   ├── analisis_requerimientos.md
│   └── manual_usuario.md
│
└── README.md
```

---

## 🌐 Deploy en Producción

### Backend (Render.com)
1. Crear nuevo Web Service en render.com
2. Conectar repositorio GitHub
3. Configurar variables de entorno
4. Build Command: `npm install`
5. Start Command: `npm start`

### Frontend (Vercel)
1. Importar proyecto en vercel.com
2. Framework preset: **Vite**
3. Root Directory: `client/`
4. Configurar `VITE_API_URL` con la URL del backend en Render

---

## 👤 Credenciales Iniciales (Seed)

> ⚠️ Cambiar inmediatamente en producción

| Usuario | Contraseña | Rol |
|---------|-----------|-----|
| `admin` | `Admin123` | Administrador |

---

## 📄 Licencia

Proyecto académico desarrollado como Tesis de Pregrado.  
Hospital San Ramón · Chanchamayo, Perú · 2026.
