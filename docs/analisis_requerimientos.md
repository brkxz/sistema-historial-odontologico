# Sistema de Historial Odontológico Digital v2.0
## Documento de Análisis de Requerimientos y Especificación del Sistema

**Institución:** Hospital San Ramón — Chanchamayo, Perú  
**Área:** Servicio de Odontología  
**Versión:** 2.0  
**Fecha:** Octubre 2026  
**Tipo:** Proyecto de Tesis de Pregrado  

---

## 1. INTRODUCCIÓN

### 1.1 Propósito del Documento

Este documento especifica los requerimientos funcionales y no funcionales del **Sistema de Historial Odontológico Digital**, desarrollado para modernizar la gestión clínica del Servicio de Odontología del Hospital San Ramón, ubicado en Chanchamayo, región Junín, Perú.

### 1.2 Alcance del Sistema

El sistema abarca:
- **Gestión de pacientes** con búsqueda por DNI via RENIEC
- **Historial clínico digital** con registro de atenciones odontológicas
- **Odontograma digital interactivo** con los 32 dientes
- **Agenda de citas** con detección automática de conflictos de horario
- **Reportes estadísticos** para toma de decisiones gerenciales
- **Asistente IA "Denty"** con capacidad de voz y wake word
- **Exportación PDF** de historiales clínicos
- **Aplicación móvil Android** nativa vía Capacitor

### 1.3 Definiciones y Acrónimos

| Término | Definición |
|---------|-----------|
| DNI | Documento Nacional de Identidad (Perú) |
| RENIEC | Registro Nacional de Identificación y Estado Civil |
| JWT | JSON Web Token — mecanismo de autenticación sin estado |
| JTI | JWT ID — identificador único del token |
| Odontograma | Gráfico dental de los 32 dientes con su estado clínico |
| Soft Delete | Eliminación lógica que conserva el registro con fecha de eliminación |
| PWA | Progressive Web App — aplicación web instalable |
| ORM | Object-Relational Mapping (Sequelize) |

---

## 2. DESCRIPCIÓN GENERAL

### 2.1 Perspectiva del Producto

El sistema reemplaza el registro físico en papel del Servicio de Odontología del Hospital San Ramón. Permite a los odontólogos acceder al historial completo del paciente desde cualquier dispositivo, incluyendo tablets y smartphones Android.

### 2.2 Funciones del Producto (Resumen)

```
┌─────────────────────────────────────────────────────────────┐
│              SISTEMA ODONTOLÓGICO DIGITAL v2.0              │
├────────────────────┬────────────────────┬───────────────────┤
│  GESTIÓN CLÍNICA   │   ADMINISTRACIÓN   │   TECNOLOGÍA      │
├────────────────────┼────────────────────┼───────────────────┤
│ • Registro pacientes│ • Gestión usuarios │ • IA con voz     │
│ • Historial médico │ • Reportes estadís.│ • App Android     │
│ • Odontograma      │ • Auditoría segura │ • PDF export      │
│ • Agenda de citas  │ • Panel de control │ • PWA offline     │
│ • Búsqueda por DNI │ • RENIEC integrado │ • Google OAuth    │
└────────────────────┴────────────────────┴───────────────────┘
```

### 2.3 Usuarios del Sistema

| Rol | Descripción | Permisos |
|-----|------------|---------|
| **Administrador** | Director del Servicio / Jefatura | Acceso total: usuarios, reportes, auditoría |
| **Odontólogo** | Profesional de salud | Pacientes, atenciones, odontograma, citas propias |

---

## 3. REQUERIMIENTOS FUNCIONALES

### RF-01: Autenticación y Seguridad

| ID | Descripción | Prioridad |
|----|------------|-----------|
| RF-01.1 | El sistema debe permitir inicio de sesión con usuario y contraseña | Alta |
| RF-01.2 | El sistema debe permitir inicio de sesión con cuenta Google | Alta |
| RF-01.3 | Las contraseñas deben tener mínimo 8 caracteres, 1 mayúscula y 1 número | Alta |
| RF-01.4 | La cuenta debe bloquearse tras 5 intentos fallidos por 15 minutos | Alta |
| RF-01.5 | El cierre de sesión debe invalidar el token JWT en el servidor | Alta |
| RF-01.6 | Las sesiones deben expirar automáticamente tras 8 horas de inactividad | Media |
| RF-01.7 | El sistema debe mantener registro de auditoría de todas las acciones | Alta |

### RF-02: Gestión de Pacientes

| ID | Descripción | Prioridad |
|----|------------|-----------|
| RF-02.1 | El sistema debe registrar pacientes con datos personales completos | Alta |
| RF-02.2 | El sistema debe consultar datos del paciente por DNI via RENIEC | Alta |
| RF-02.3 | El sistema debe validar que el DNI sea exactamente 8 dígitos numéricos | Alta |
| RF-02.4 | El sistema debe permitir búsqueda por DNI, nombre o apellido | Alta |
| RF-02.5 | La eliminación de pacientes debe ser lógica (soft delete), conservando el historial | Alta |
| RF-02.6 | El sistema debe registrar antecedentes médicos, alergias y medicamentos | Alta |
| RF-02.7 | El sistema debe mostrar datos paginados (máximo 100 por página) | Media |

### RF-03: Historial Clínico

| ID | Descripción | Prioridad |
|----|------------|-----------|
| RF-03.1 | El sistema debe registrar atenciones odontológicas por paciente | Alta |
| RF-03.2 | Cada atención debe incluir: fecha, motivo, procedimiento, observaciones | Alta |
| RF-03.3 | El sistema debe permitir programar fecha de próximo control | Media |
| RF-03.4 | El sistema debe exportar el historial completo a PDF | Alta |
| RF-03.5 | El PDF debe incluir datos del paciente, antecedentes y todas las atenciones | Alta |
| RF-03.6 | El sistema debe mostrar el historial en orden cronológico descendente | Media |

### RF-04: Odontograma Digital

| ID | Descripción | Prioridad |
|----|------------|-----------|
| RF-04.1 | El odontograma debe representar los 32 dientes del adulto | Alta |
| RF-04.2 | Cada diente debe poder marcar condiciones clínicas (caries, extracción, etc.) | Alta |
| RF-04.3 | El odontograma debe mostrar superficies dentales (mesial, distal, oclusal, etc.) | Media |
| RF-04.4 | El sistema debe vincular el estado del diente con la atención correspondiente | Alta |

### RF-05: Agenda de Citas

| ID | Descripción | Prioridad |
|----|------------|-----------|
| RF-05.1 | El sistema debe permitir registrar citas con fecha, hora y duración | Alta |
| RF-05.2 | El sistema debe detectar y bloquear conflictos de horario automáticamente | Alta |
| RF-05.3 | El sistema debe gestionar estados de cita: pendiente, confirmada, cancelada, completada | Alta |
| RF-05.4 | El sistema debe mostrar las citas del día en el panel de control | Alta |
| RF-05.5 | El sistema debe mostrar las próximas 7 días de citas | Media |
| RF-05.6 | La cancelación de cita debe registrar el motivo | Media |

### RF-06: Reportes y Estadísticas

| ID | Descripción | Prioridad |
|----|------------|-----------|
| RF-06.1 | El sistema debe mostrar totales: pacientes, atenciones del día/mes | Alta |
| RF-06.2 | El sistema debe generar reporte de atenciones por fecha | Alta |
| RF-06.3 | El sistema debe generar reporte de atenciones por odontólogo | Alta |
| RF-06.4 | Los reportes deben poder filtrarse por rango de fechas | Media |
| RF-06.5 | Los reportes deben poder exportarse a CSV y PDF | Media |

### RF-07: Asistente de IA "Denty"

| ID | Descripción | Prioridad |
|----|------------|-----------|
| RF-07.1 | El asistente debe responder preguntas sobre odontología | Media |
| RF-07.2 | El asistente debe activarse por voz con la palabra "Denty" | Baja |
| RF-07.3 | El asistente debe usar síntesis de voz para responder | Baja |
| RF-07.4 | El asistente debe usar Groq AI con fallback a OpenRouter | Media |

---

## 4. REQUERIMIENTOS NO FUNCIONALES

### RNF-01: Seguridad

| ID | Descripción |
|----|------------|
| RNF-01.1 | Las contraseñas deben almacenarse con hash bcrypt (salt=12) |
| RNF-01.2 | Todas las comunicaciones deben usar HTTPS en producción |
| RNF-01.3 | Los tokens JWT deben tener tiempo de expiración de 8 horas |
| RNF-01.4 | Los tokens revocados deben registrarse en BD para logout real |
| RNF-01.5 | Los inputs deben sanitizarse para prevenir XSS e inyección SQL |
| RNF-01.6 | Los headers HTTP deben configurarse con Helmet.js |
| RNF-01.7 | El acceso a la API debe limitarse con rate limiting (100 req/15min) |
| RNF-01.8 | Toda acción crítica debe registrarse en el log de auditoría |
| RNF-01.9 | Los logs del servidor deben persistirse en archivos rotativos |

### RNF-02: Rendimiento

| ID | Descripción |
|----|------------|
| RNF-02.1 | El tiempo de respuesta de la API debe ser menor a 2 segundos en condiciones normales |
| RNF-02.2 | Las consultas deben usar índices de base de datos para DNI y fechas |
| RNF-02.3 | El frontend debe cargar en menos de 3 segundos (lazy loading de páginas) |
| RNF-02.4 | Los errores de red deben reintentarse automáticamente (máximo 2 reintentos) |

### RNF-03: Usabilidad

| ID | Descripción |
|----|------------|
| RNF-03.1 | La interfaz debe ser responsiva para pantallas desde 320px |
| RNF-03.2 | La aplicación debe funcionar como PWA instalable en Android |
| RNF-03.3 | Los formularios deben mostrar mensajes de error descriptivos |
| RNF-03.4 | El sistema debe funcionar en modo oscuro (dark mode) |

### RNF-04: Disponibilidad

| ID | Descripción |
|----|------------|
| RNF-04.1 | El sistema debe estar disponible 24/7 en producción |
| RNF-04.2 | El backend se desplegará en Render.com con reinicio automático |
| RNF-04.3 | El frontend se desplegará en Vercel con CDN global |

### RNF-05: Mantenibilidad

| ID | Descripción |
|----|------------|
| RNF-05.1 | El código debe tener una cobertura de tests mínima del 50% en middleware |
| RNF-05.2 | La API debe estar documentada con OpenAPI 3.0 (Swagger) |
| RNF-05.3 | Las validaciones deben centralizarse con Zod schemas |
| RNF-05.4 | El código debe seguir el estándar ESM (ES Modules) |

---

## 5. HISTORIAS DE USUARIO

### Módulo: Autenticación

**HU-001** — Como **odontólogo**, quiero iniciar sesión con mi cuenta Google para no recordar otra contraseña.
> Criterios: Login con Google OAuth funciona. Si la cuenta no está aprobada, muestra mensaje de "pendiente de aprobación".

**HU-002** — Como **administrador**, quiero que las cuentas se bloqueen automáticamente tras 5 intentos fallidos para proteger el sistema de accesos no autorizados.
> Criterios: Tras 5 intentos fallidos, la cuenta se bloquea 15 minutos. Tras 10 intentos, se bloquea 1 hora.

### Módulo: Pacientes

**HU-003** — Como **odontólogo**, quiero buscar un paciente por DNI y que el sistema autocomplete sus datos desde RENIEC para reducir errores de digitación.
> Criterios: Al ingresar un DNI de 8 dígitos, el sistema consulta RENIEC y completa nombre, apellido automáticamente.

**HU-004** — Como **administrador**, quiero poder eliminar un paciente pero mantener su historial médico por razones legales.
> Criterios: Al eliminar, el paciente aparece como "eliminado" pero sus atenciones y odontograma se conservan en BD.

### Módulo: Citas

**HU-005** — Como **odontólogo**, quiero registrar citas para mis pacientes y que el sistema me avise si tengo un conflicto de horario para evitar citas superpuestas.
> Criterios: Al crear una cita que se superpone con otra cita del mismo odontólogo, el sistema retorna error 409 con mensaje explicativo.

**HU-006** — Como **administrador**, quiero ver las citas del día en el panel de control para tener una visión rápida de la agenda.
> Criterios: El dashboard muestra las citas de hoy ordenadas por hora, con nombre del paciente y odontólogo.

### Módulo: Historial Clínico

**HU-007** — Como **odontólogo**, quiero exportar el historial clínico completo de un paciente a PDF para entregárselo como referencia médica.
> Criterios: El PDF incluye: datos del paciente, antecedentes médicos (con alerta visual si hay alergias), y todas las atenciones con sus fechas, procedimientos y observaciones.

**HU-008** — Como **odontólogo**, quiero marcar los dientes afectados en el odontograma durante una atención para tener registro visual del estado dental del paciente.
> Criterios: Puedo hacer clic en cualquier diente del odontograma, seleccionar su condición y guardar. Los cambios se vinculan a la atención actual.

---

## 6. CASOS DE USO PRINCIPALES

### CU-001: Registrar Nueva Atención

**Actor principal:** Odontólogo  
**Precondición:** El odontólogo está autenticado y el paciente existe en el sistema.

| Paso | Actor | Sistema |
|------|-------|---------|
| 1 | Busca al paciente por DNI o nombre | Muestra lista de resultados |
| 2 | Selecciona el paciente | Muestra historial y botón "Nueva Atención" |
| 3 | Completa el formulario (motivo, procedimiento, observaciones) | Valida campos con Zod |
| 4 | Selecciona dientes afectados en el odontograma | Resalta dientes seleccionados |
| 5 | Guarda la atención | Crea registro en BD, registra en auditoría, muestra confirmación |

**Flujo alternativo:** Si el paciente no existe → Sistema ofrece registrarlo consultando RENIEC con el DNI ingresado.

### CU-002: Gestionar Cita con Conflicto

**Actor principal:** Odontólogo / Recepcionista  
**Precondición:** El odontólogo tiene al menos una cita registrada.

| Paso | Actor | Sistema |
|------|-------|---------|
| 1 | Abre módulo "Agenda de Citas" | Muestra citas filtradas por odontólogo |
| 2 | Hace clic en "Nueva Cita" | Muestra formulario modal |
| 3 | Selecciona paciente, fecha, hora y duración | Valida campos |
| 4 | Guarda | Verifica conflictos en BD |
| 4a | *(Conflicto)* | Retorna error 409: "El odontólogo ya tiene una cita en ese horario" |
| 5 | *(Sin conflicto)* | Crea cita, muestra confirmación con detalles |

---

## 7. MODELO DE DATOS (RESUMEN)

### Entidades Principales

| Entidad | Descripción | Registros estimados |
|---------|------------|-------------------|
| `users` | Odontólogos y administradores del sistema | ~5-20 |
| `patients` | Pacientes del servicio (con soft delete) | ~500-2000 |
| `treatments` | Atenciones odontológicas realizadas | ~2000-10000 |
| `appointments` | Citas programadas y su historial | ~200-1000/mes |
| `teeth` | Catálogo fijo de 32 dientes | 32 (seed) |
| `treatment_teeth` | Dientes afectados por atención (N:M) | ~5000-30000 |
| `odontogram` | Estado actual del odontograma por paciente | ~10000+ |
| `audit_logs` | Registro de todas las acciones del sistema | ~50000+ |
| `revoked_tokens` | Tokens JWT revocados (limpieza automática) | ~100-500 |

---

## 8. TECNOLOGÍAS SELECCIONADAS

### Justificación de Tecnologías

| Componente | Tecnología | Justificación |
|-----------|-----------|--------------|
| **Frontend** | React 19 + Vite 8 | Ecosistema maduro, componentes reutilizables, rendimiento óptimo |
| **Backend** | Node.js + Express | JavaScript en ambos lados, curva de aprendizaje baja, gran ecosistema |
| **ORM** | Sequelize v6 | Soporta SQLite (dev) y PostgreSQL (prod) con la misma API |
| **Autenticación** | JWT + bcrypt | Estándar de industria, sin estado (scalable) |
| **Validación** | Zod | Type-safe, mensajes de error descriptivos en español |
| **Logging** | Winston | Logs persistentes con rotación, múltiples transportes |
| **Mobile** | Capacitor 8 | Convierte la PWA en APK nativo sin reescribir código |
| **BD Dev** | SQLite | Sin configuración, ideal para desarrollo y pruebas |
| **BD Prod** | PostgreSQL | Robusto, escalable, soportado por Render.com |
| **Deploy** | Render + Vercel | Gratuito para proyectos académicos, CI/CD automático |
| **IA** | Groq + OpenRouter | Gratuito con alta disponibilidad, especializado en texto |
| **Tests** | Vitest | Nativo para ESM, compatible con el stack actual |

---

## 9. PLAN DE PRUEBAS

### 9.1 Tests Implementados (56 tests, cobertura ~70%)

| Suite | Archivo | Tests | Resultado |
|-------|---------|-------|-----------|
| Autenticación JWT | `tests/auth.test.js` | 9 | ✅ Todos pasan |
| Validaciones Zod | `tests/schemas.test.js` | 31 | ✅ Todos pasan |
| Control de acceso | `tests/roles.test.js` | 7 | ✅ Todos pasan |
| Sanitización XSS | `tests/sanitize.test.js` | 9 | ✅ Todos pasan |

### 9.2 Casos de Prueba Críticos

| Caso | Resultado esperado | Estado |
|------|--------------------|--------|
| Login con contraseña incorrecta 5 veces | Cuenta bloqueada 15 min | ✅ |
| Logout → reutilizar el mismo token | Error 401 "Sesión cerrada" | ✅ |
| `limit=99999` en GET /patients | Reducido automáticamente a 100 | ✅ |
| DNI de 7 dígitos en registro | Error 422 "8 dígitos requeridos" | ✅ |
| Contraseña sin mayúscula | Error 422 "requiere mayúscula" | ✅ |
| Crear cita con horario ocupado | Error 409 "conflicto de horario" | ✅ |
| Input con `<script>alert(1)</script>` | Sanitizado, sin ejecución | ✅ |
| Usuario con rol `odontologo` accede a ruta admin | Error 403 Forbidden | ✅ |

---

## 10. CONCLUSIONES

El **Sistema de Historial Odontológico Digital v2.0** cumple con todos los requerimientos funcionales y no funcionales definidos en este documento. Las principales contribuciones académicas del proyecto son:

1. **Seguridad robusta** — Implementación de JWT con blacklist para logout real, validación Zod en todos los endpoints, auditoría completa de acciones, y bloqueo progresivo de cuentas.

2. **Funcionalidad diferenciadora** — Integración de IA conversacional con voz (wake word "Denty"), integración RENIEC para autocompletar datos, y odontograma digital interactivo.

3. **Multi-plataforma** — Una sola base de código que funciona como web, PWA y APK Android nativo.

4. **Calidad de código** — 56 tests unitarios con cobertura del 70% en middleware crítico, documentación Swagger completa.

---

*Documento generado automáticamente. Versión 2.0 — Sistema de Historial Odontológico Digital*
