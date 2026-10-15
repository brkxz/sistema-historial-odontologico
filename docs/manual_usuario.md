# Manual de Usuario
## Sistema de Historial Odontológico Digital v2.0
### Hospital San Ramón — Servicio de Odontología

**Versión:** 2.0 · **Fecha:** Octubre 2026  
**Soporte:** sistemas@hospitalsanramon.pe

---

## 📋 TABLA DE CONTENIDOS

1. [Requisitos del Sistema](#1-requisitos-del-sistema)
2. [Acceso al Sistema](#2-acceso-al-sistema)
3. [Panel de Control](#3-panel-de-control)
4. [Gestión de Pacientes](#4-gestión-de-pacientes)
5. [Historial Clínico y Atenciones](#5-historial-clínico-y-atenciones)
6. [Odontograma Digital](#6-odontograma-digital)
7. [Agenda de Citas](#7-agenda-de-citas)
8. [Reportes y Estadísticas](#8-reportes-y-estadísticas)
9. [Asistente IA "Denty"](#9-asistente-ia-denty)
10. [Administración del Sistema](#10-administración-del-sistema)
11. [Exportar a PDF](#11-exportar-a-pdf)
12. [Aplicación Móvil Android](#12-aplicación-móvil-android)
13. [Preguntas Frecuentes](#13-preguntas-frecuentes)

---

## 1. REQUISITOS DEL SISTEMA

### Para el Navegador Web (PC / Laptop)
| Requisito | Mínimo | Recomendado |
|----------|--------|-------------|
| Navegador | Chrome 90+ / Firefox 90+ / Edge 90+ | Chrome 120+ |
| Conexión | 1 Mbps | 5 Mbps |
| Pantalla | 1024×768 | 1920×1080 |
| JavaScript | Activado | Activado |

### Para la App Android (Tablet / Celular)
- Android 8.0 (Oreo) o superior
- 100 MB de espacio libre
- Conexión a internet (recomendado) o red local del hospital

### URL de Acceso
- **Web:** `https://odontologia.hospitalsanramon.pe` *(o la URL asignada)*
- **API Docs:** `https://api.hospitalsanramon.pe/api-docs`

---

## 2. ACCESO AL SISTEMA

### 2.1 Iniciar Sesión con Usuario y Contraseña

1. Abra el navegador e ingrese a la URL del sistema
2. En la página de inicio, haga clic en **"Ir al Sistema"**
3. Ingrese su **nombre de usuario** y **contraseña**
4. Haga clic en **"Iniciar Sesión"**

> **⚠️ IMPORTANTE:** La contraseña debe tener mínimo **8 caracteres**, **1 letra mayúscula** y **1 número**.  
> Ejemplo: `Dental2024` ✅ | `dental123` ❌ | `Dental` ❌

### 2.2 Iniciar Sesión con Google

1. En la pantalla de login, haga clic en **"Continuar con Google"**
2. Seleccione su cuenta de Google institucional
3. Si su cuenta fue recientemente registrada, espere la aprobación del administrador

### 2.3 Política de Seguridad de Acceso

| Situación | Consecuencia | Solución |
|-----------|-------------|---------|
| 5 intentos fallidos | Cuenta bloqueada 15 minutos | Esperar o contactar administrador |
| 10 intentos fallidos | Cuenta bloqueada 1 hora | Contactar administrador |
| Token expirado (8 horas) | Sesión cerrada automáticamente | Volver a iniciar sesión |

### 2.4 Cerrar Sesión

Haga clic en su **avatar/nombre** en la esquina superior derecha → **"Cerrar Sesión"**.

> ✅ El cierre de sesión **invalida el token inmediatamente** en el servidor. Nadie podrá usar su sesión aunque tenga el enlace.

---

## 3. PANEL DE CONTROL

Al ingresar al sistema, verá el Panel de Control con:

### 3.1 Tarjetas de Estadísticas
- **Total Pacientes** — Número de pacientes registrados activos
- **Atenciones Hoy** — Atenciones registradas en el día actual
- **Citas de Hoy** — Citas programadas para hoy
- **Este Mes** — Atenciones del mes en curso

### 3.2 Tabla de Atenciones Recientes
Muestra las últimas 10 atenciones registradas con:
- Nombre del paciente y DNI
- Fecha y motivo de la atención
- Botones de acceso rápido al historial

### 3.3 Agenda del Día
Lista de citas programadas para hoy, ordenadas por hora, mostrando el estado (pendiente/confirmada).

---

## 4. GESTIÓN DE PACIENTES

### 4.1 Registrar Nuevo Paciente

1. En el menú lateral, haga clic en **"Pacientes"**
2. Haga clic en el botón **"+ Nuevo Paciente"**
3. En el formulario:
   - Ingrese el **DNI** (exactamente 8 dígitos)
   - El sistema consultará **RENIEC automáticamente** y completará nombre y apellido
   - Complete los demás campos: fecha de nacimiento, teléfono, dirección
   - En la sección **"Antecedentes Médicos"**, registre alergias y medicamentos actuales
4. Haga clic en **"Guardar Paciente"**

> **🔍 Autocompletar con RENIEC:** Al ingresar el DNI y presionar Tab o hacer clic fuera del campo, el sistema consulta el padrón de RENIEC y completa nombre, apellido y fecha de nacimiento automáticamente.

### 4.2 Buscar Pacientes

**Opción A — Búsqueda Rápida (Barra superior):**
1. Haga clic en el ícono de búsqueda 🔍 en la barra superior
2. Escriba el DNI, nombre o apellido del paciente
3. Los resultados aparecen en tiempo real

**Opción B — Búsqueda en la Lista:**
1. Vaya a **"Pacientes"** en el menú lateral
2. Use el campo de búsqueda para filtrar por DNI, nombre o apellido

### 4.3 Editar Datos del Paciente

1. En la lista de pacientes, haga clic en el **ícono de edición** (✏️) del paciente
2. Modifique los campos necesarios
3. Haga clic en **"Guardar Cambios"**

### 4.4 Eliminar Paciente

1. En la lista, haga clic en el **ícono de eliminar** (🗑️)
2. Confirme la eliminación en el cuadro de diálogo
3. El paciente se marca como eliminado pero su **historial médico se conserva**

> **📌 NOTA LEGAL:** La eliminación es **lógica** — el paciente no aparecerá en búsquedas pero sus atenciones y odontograma permanecen en la base de datos por razones médico-legales.

---

## 5. HISTORIAL CLÍNICO Y ATENCIONES

### 5.1 Ver Historial de un Paciente

1. Busque al paciente (por DNI o nombre)
2. Haga clic en su nombre o en el botón **"Ver Historial"**
3. Se mostrará la lista completa de atenciones en orden cronológico descendente

### 5.2 Registrar Nueva Atención

**Método 1 — Desde el historial del paciente:**
1. En el historial, haga clic en **"Nueva Atención"** (botón verde, esquina superior derecha)

**Método 2 — Desde el menú:**
1. Haga clic en **"Nueva Atención"** en el menú lateral
2. Busque el paciente usando el campo de búsqueda

**Completar el formulario de atención:**

| Campo | Obligatorio | Descripción |
|-------|-------------|-------------|
| Paciente | ✅ | Seleccionar paciente existente |
| Fecha | ✅ | Fecha de la atención (por defecto: hoy) |
| Motivo | ✅ | Razón de la consulta |
| Procedimiento realizado | ❌ | Tratamiento aplicado |
| Observaciones | ❌ | Notas adicionales |
| Próximo control | ❌ | Fecha de la siguiente cita sugerida |
| Dientes afectados | ❌ | Selección en el odontograma |

3. Una vez completo, haga clic en **"Guardar Atención"**

### 5.3 Ver Detalle de una Atención

En la lista del historial, haga clic en cualquier atención para expandir sus detalles, incluyendo:
- Procedimiento realizado
- Observaciones clínicas
- Dientes tratados
- Odontólogo responsable

### 5.4 Exportar Historial a PDF

1. En el historial del paciente, haga clic en **"📄 Exportar PDF"** (esquina superior derecha)
2. Se generará y descargará automáticamente el archivo `historial_DNI_FECHA.pdf`

**El PDF incluye:**
- Encabezado con logo del Hospital San Ramón
- Datos completos del paciente
- ⚠️ Alerta roja si tiene alergias o medicamentos registrados
- Todas las atenciones con fechas, procedimientos y observaciones
- Firma del odontólogo y espacio para firma del paciente

---

## 6. ODONTOGRAMA DIGITAL

### 6.1 Acceder al Odontograma

1. Haga clic en **"Odontograma"** en el menú lateral
2. Busque y seleccione al paciente
3. Verá la representación gráfica de los 32 dientes

### 6.2 Marcar Estado de un Diente

1. Haga clic en el diente que desea registrar
2. Se abrirá un panel con opciones:
   - **Condición:** Sano, Caries, Extracción, Corona, Puente, Implante, etc.
   - **Superficie:** Mesial, Distal, Oclusal, Vestibular, Lingual
   - **Notas:** Observaciones específicas del diente
3. Haga clic en **"Guardar"**

### 6.3 Códigos de Color del Odontograma

| Color | Condición |
|-------|-----------|
| 🟢 Verde | Sano |
| 🔴 Rojo | Caries activa |
| ⚫ Negro | Extracción indicada / Diente extraído |
| 🔵 Azul | Restauración (obturación) |
| 🟡 Amarillo | Tratamiento de conducto |
| 🟣 Morado | Corona o prótesis |

---

## 7. AGENDA DE CITAS

### 7.1 Ver la Agenda

1. Haga clic en **"Agenda de Citas"** en el menú lateral (ícono de calendario ✅)
2. Verá la lista de citas con filtros por fecha y estado

**Filtros disponibles:**
- **Fecha específica** — Ver citas de un día en particular
- **Estado** — Pendiente / Confirmada / Cancelada / Completada

### 7.2 Crear Nueva Cita

1. Haga clic en **"+ Nueva Cita"** (botón azul, esquina superior derecha)
2. En el modal que aparece:
   - **Buscar paciente:** Escriba el nombre o DNI
   - **Fecha:** Seleccione la fecha (no puede ser en el pasado)
   - **Hora:** Ingrese la hora en formato HH:MM
   - **Duración:** 15, 20, 30, 45, 60 o 90 minutos
   - **Motivo:** Descripción de la cita
   - **Notas:** Información adicional opcional
3. Haga clic en **"Crear Cita"**

> **⚠️ Detección automática de conflictos:** Si el odontólogo ya tiene una cita que se superpone con la nueva (considerando la duración), el sistema mostrará un error e impedirá guardarla.

### 7.3 Cambiar Estado de una Cita

En la tabla de citas, cada cita pendiente o confirmada muestra tres botones:

| Botón | Acción |
|-------|--------|
| ✏️ | Editar datos de la cita |
| ✅ (verde) | Marcar como Completada |
| ❌ (rojo) | Cancelar con motivo opcional |

### 7.4 Estados de las Citas

```
[Pendiente] → [Confirmada] → [Completada]
    ↓               ↓
[Cancelada]     [Cancelada]
```

---

## 8. REPORTES Y ESTADÍSTICAS

> **Solo disponible para Administradores.**

### 8.1 Acceder a Reportes

1. Haga clic en **"Reportes"** en el menú lateral
2. Verá las estadísticas generales en las 4 tarjetas superiores

### 8.2 Filtrar por Rango de Fechas

1. En la sección "Filtrar por Rango de Fechas"
2. Ingrese fecha **Desde** y fecha **Hasta**
3. Haga clic en **"Filtrar"**

### 8.3 Exportar Datos

- **CSV:** Haga clic en el botón **"📥 Exportar"** en cada tabla
- **PDF:** Haga clic en el botón **"📄 PDF"** para un reporte formateado

---

## 9. ASISTENTE IA "DENTY"

### 9.1 Acceder al Asistente

- Haga clic en el **ícono de micrófono** 🎤 en la esquina inferior derecha de cualquier página
- O use el chat de IA en la barra lateral

### 9.2 Usar el Asistente por Voz

1. Diga la palabra de activación: **"Denty"**
2. Espere el sonido de confirmación
3. Haga su pregunta
4. El asistente responderá en texto y voz

### 9.3 Preguntas que puede responder "Denty"

- "¿Cuáles son los síntomas de una pulpitis?"
- "¿Qué antibiótico se usa para absceso dental?"
- "Explícame la técnica de Block Mandibular"
- "¿Cuánto tiempo dura una amalgama?"

> **📌 NOTA:** Denty es un asistente de apoyo informativo. Las decisiones clínicas siempre deben ser tomadas por el profesional de salud.

---

## 10. ADMINISTRACIÓN DEL SISTEMA

> **Solo accesible para el rol Administrador.**

### 10.1 Gestión de Usuarios

1. Haga clic en **"Panel de Doctores"** en el menú
2. Verá la lista de todos los odontólogos registrados

**Crear nuevo usuario:**
1. Haga clic en **"+ Nuevo Doctor"**
2. Complete: nombre completo, usuario, contraseña temporal, especialidad
3. Asigne el rol: Administrador u Odontólogo
4. Haga clic en **"Crear Usuario"**

**Desactivar usuario (al retiro del personal):**
1. En la lista, haga clic en el toggle de estado del usuario
2. Confirme la desactivación

### 10.2 Registro de Auditoría

1. Haga clic en **"Auditoría"** en el menú lateral
2. Verá el registro completo de todas las acciones del sistema:
   - Quién realizó la acción
   - Qué acción fue (crear, editar, eliminar, login, logout)
   - Cuándo (fecha y hora exacta)
   - Desde qué dirección IP
   - Valores anteriores y nuevos (para ediciones)

**Filtros disponibles:** Por usuario, por tipo de acción, por fecha, por entidad.

---

## 11. EXPORTAR A PDF

### 11.1 Historial de Paciente

1. Abra el historial del paciente
2. Haga clic en **"📄 Exportar PDF"**
3. El archivo se descargará como `historial_[DNI]_[fecha].pdf`

**Contenido del PDF:**
- Encabezado del Hospital San Ramón
- Datos completos del paciente (incluyendo tipo de sangre)
- Sección de alergias y medicamentos (con alerta visual en rojo si aplica)
- Listado cronológico de todas las atenciones
- Dientes tratados en cada atención
- Pie de página con número de página y fecha de generación

### 11.2 Reportes Estadísticos

En la página de Reportes, haga clic en el botón **PDF** de cada tabla para exportar los datos con formato de tabla profesional.

---

## 12. APLICACIÓN MÓVIL ANDROID

### 12.1 Instalación

**Opción A — APK directo:**
1. Descargue el archivo `odontologia-app.apk` del enlace proporcionado
2. En su Android, active **"Fuentes desconocidas"** en Configuración → Seguridad
3. Abra el archivo APK y siga los pasos de instalación

**Opción B — PWA (sin instalar APK):**
1. Abra Chrome en su Android y vaya a la URL del sistema
2. Chrome mostrará un banner: **"Añadir a pantalla de inicio"**
3. Toque el banner e instale

### 12.2 Diferencias con la Versión Web

| Función | Web | Android |
|---------|-----|---------|
| Acceso sin instalar | ✅ | ❌ |
| Ícono en pantalla de inicio | PWA | ✅ |
| Login con Google | ✅ | ✅ |
| Asistente de voz | ✅ | ✅ |
| Exportar PDF | ✅ | ✅ |

---

## 13. PREGUNTAS FRECUENTES

**P: ¿Puedo usar el sistema sin internet?**  
R: No. El sistema requiere conexión para comunicarse con el servidor. Si el hospital tiene red local, puede funcionar en la intranet.

**P: ¿Qué hago si olvidé mi contraseña?**  
R: Contacte al administrador del sistema. Solo el administrador puede restablecer contraseñas.

**P: ¿El PDF del historial tiene validez médico-legal?**  
R: El PDF es un documento de referencia clínica. Para uso legal oficial, debe ser complementado con el sello y firma digital del profesional.

**P: ¿Se puede usar desde el celular del médico?**  
R: Sí. El sistema es responsivo y funciona en cualquier tamaño de pantalla. También puede instalarse como app Android.

**P: ¿Qué pasa si se va la luz o se cierra el navegador a mitad de un registro?**  
R: El sistema no guarda borradores automáticamente. Si cierra antes de guardar, los datos no registrados se perderán. Siempre haga clic en "Guardar" antes de cerrar.

**P: ¿La IA "Denty" tiene acceso a los datos de los pacientes?**  
R: No. Denty es un asistente de consulta general de odontología. No tiene acceso a la base de datos de pacientes.

**P: ¿Se pueden ver las citas de otros odontólogos?**  
R: Solo los administradores pueden ver citas de todos los odontólogos. Los odontólogos solo ven sus propias citas.

**P: ¿Cómo sé que mi sesión está segura?**  
R: El sistema usa HTTPS, tokens JWT con expiración de 8 horas, y el logout invalida el token inmediatamente en el servidor. Nadie puede usar su sesión después de cerrarla.

---

## 📞 SOPORTE TÉCNICO

| Tipo | Contacto |
|------|---------|
| Soporte técnico | sistemas@hospitalsanramon.pe |
| Urgencias del sistema | +51 XXX-XXXXXX |
| Documentación API | `/api-docs` en el servidor |
| Reporte de bugs | Formulario en la página de perfil |

---

*Manual de Usuario v2.0 — Sistema de Historial Odontológico Digital*  
*Hospital San Ramón · Chanchamayo, Perú · Octubre 2026*
