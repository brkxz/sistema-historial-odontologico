# 🦷 Sistema de Historial Odontológico Digital

> Sistema web clínico para la gestión de pacientes, historiales y atenciones del **Servicio de Odontología — Hospital San Ramón, Chanchamayo, Perú**.

---

## 📋 Descripción

Plataforma fullstack que permite al personal médico gestionar de forma eficiente:

- Registro y búsqueda de pacientes por DNI (con consulta a RENIEC)
- Historial clínico completo por paciente
- Odontograma interactivo digital
- Registro de atenciones y tratamientos
- Reportes estadísticos por fecha y dentista
- Auditoría de acciones del sistema
- Asistente IA integrado (Denty) con soporte por voz

---

## 🗂️ Estructura del Proyecto

```
sistema-historial-odontologico/
├── client/               # Frontend — React + Vite (PWA)
│   └── src/
│       ├── components/   # Componentes reutilizables
│       ├── context/      # Contextos globales (Auth, AI)
│       ├── hooks/        # Custom hooks
│       ├── pages/        # Páginas de la aplicación
│       ├── services/     # Llamadas a la API
│       ├── styles/       # CSS global y por módulo
│       └── utils/        # Utilidades y helpers
├── server/               # Backend — Node.js + Express
│   ├── config/           # Configuración de base de datos
│   ├── middleware/        # Auth, auditoría, rate limiting
│   ├── models/           # Modelos Sequelize (ORM)
│   ├── routes/           # Endpoints de la API REST
│   ├── seeders/          # Datos iniciales
│   └── utils/            # Utilidades del servidor
├── database/             # Base de datos SQLite (local dev)
├── docs/                 # Documentación y prototipos
└── releases/             # APKs de la app Android
```

---

## 🚀 Inicio Rápido

### Requisitos

- Node.js v18 o superior
- npm v9 o superior

### Instalación

```bash
# Clonar el repositorio
git clone <url-del-repo>
cd sistema-historial-odontologico

# Instalar todas las dependencias
npm run install:all
```

### Configuración

Copia el archivo de ejemplo y configura las variables:

```bash
cp server/.env.example server/.env
```

Edita `server/.env` con tus credenciales:

```env
JWT_SECRET=tu_clave_secreta_aqui
GEMINI_API_KEY=tu_api_key_de_gemini
RENIEC_API_TOKEN=tu_token_reniec          # opcional
APIPERU_DEV_TOKEN=tu_token_apiperu       # opcional
```

### Ejecutar en desarrollo

```bash
# Servidor backend (puerto 3001)
npm run dev:server

# Cliente frontend (puerto 5173)
npm run dev:client
```

---

## 🛠️ Tecnologías

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18, Vite, React Router v6 |
| Estilos | Vanilla CSS (Design System propio) |
| Backend | Node.js, Express |
| Base de datos | SQLite (dev) / PostgreSQL (prod) |
| ORM | Sequelize |
| Autenticación | JWT + bcrypt |
| IA | Google Gemini API |
| PWA | Vite PWA Plugin + Workbox |
| Mobile | Capacitor (Android) |

---

## 📡 API Endpoints principales

| Método | Endpoint | Descripción |
|--------|---------|-------------|
| POST | `/api/auth/login` | Autenticación de usuarios |
| GET | `/api/patients/search/:dni` | Búsqueda por DNI |
| POST | `/api/patients` | Registrar paciente |
| GET | `/api/treatments/patient/:id` | Historial de atenciones |
| POST | `/api/treatments` | Nueva atención |
| GET | `/api/odontogram/:patientId` | Odontograma del paciente |
| GET | `/api/reniec/dni/:numero` | Consulta RENIEC |
| POST | `/api/ai/chat` | Asistente IA Denty |
| GET | `/api/reports/summary` | Estadísticas generales |

---

## 👨‍⚕️ Personal del Sistema

El sistema diferencia dos roles:

- **Admin** — acceso completo, gestión de usuarios y auditoría
- **Odontólogo** — atención a pacientes, historial y odontograma

---

## 📄 Licencia

Uso interno — Hospital San Ramón, Chanchamayo, Perú. Todos los derechos reservados.
