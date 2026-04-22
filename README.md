# 🎓 Sistema SGAU V2 — Sistema de Gestión Académica Universitaria

<p align="center">
  <img src="https://img.shields.io/badge/Arquitectura-Microservicios-6c63ff?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi" />
  <img src="https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?style=for-the-badge&logo=react" />
  <img src="https://img.shields.io/badge/Gateway-Kong-003459?style=for-the-badge" />
  <img src="https://img.shields.io/badge/DB-PostgreSQL-336791?style=for-the-badge&logo=postgresql" />
  <img src="https://img.shields.io/badge/Deploy-Docker%20Compose-2496ED?style=for-the-badge&logo=docker" />
</p>

---

## 📋 Descripción

**SGAU V2** es una plataforma académica universitaria basada en **arquitectura de microservicios**. Permite gestionar usuarios, materias, inscripciones, calificaciones, pagos y generación de reportes, todo desde una interfaz web unificada y un API Gateway centralizado con **Kong**.

---

## 🧩 Microservicios

| Servicio | Puerto interno | Prefijo Kong | Base de datos | Descripción |
|---|---|---|---|---|
| **Auth Service** | 8001 | `/auth` | `sgau_auth` (5433) | Autenticación JWT, registro y gestión de identidades |
| **User Service** | 8000 | `/users` | `sgau_users` (5432) | Perfiles de usuario y datos biográficos |
| **Course Service** | 8000 | `/courses` | `sgau_courses` (5434) | Catálogo de materias y prerrequisitos |
| **Enrollment Service** | 8000 | `/enrollments` | `sgau_enrollment` (5435) | Inscripciones con patrón Saga |
| **Grades Service** | 8000 | `/grades` | `sgau_grades` (5436) | Registro y cálculo de calificaciones |
| **Student Service** | 8000 | `/students` | `sgau_students` (5437) | Historial académico (kardex) |
| **Payment Service** | 8000 | `/payments` | `sgau_payments` (5438) | Pagos vía MercadoPago Checkout Pro |
| **Reporting Service** | 8000 | `/reports` | — (sin BD) | Generación de reportes PDF y CSV |
| **Kong Gateway** | 8000 | — | — | API Gateway centralizado |
| **Frontend** | 5173 | — | — | SPA React (Vite) |

---

## 🔐 Roles y Funcionalidades

### 👤 Administrador
- Gestión completa de usuarios (crear, editar, eliminar)
- Administración del catálogo de materias y prerrequisitos
- Gestión de oferta académica (habilitar/deshabilitar materias)
- Generación de reportes académicos y financieros (PDF/CSV) por estudiante, materia o sistema

### 🎓 Estudiante
- Inscripción en materias ofertadas (con validación de prerrequisitos, cupos y horarios)
- Visualización de calificaciones y notas parciales
- Historial académico (kardex con promedio acumulado)
- Centro de pagos con integración MercadoPago
- Descarga de reportes académicos y financieros personales (PDF/CSV)

### 📚 Docente
- Registro y gestión de calificaciones de sus estudiantes
- Reportes de sus cursos con notas (PDF/CSV)
- Visualización de su perfil

---

## ⚙️ Patrones de Diseño Implementados

- **Saga Orchestrator** — Inscripciones con compensación automática (rollback si falla algún paso)
- **API Gateway** — Kong como punto de entrada único y enrutador de peticiones
- **Shared JWT Secret** — Todos los servicios validan el mismo token emitido por Auth Service
- **M2M (Machine-to-Machine)** — Comunicación interna entre servicios con tokens sintéticos de corta duración
- **Split Identity/Profile** — Identidad en Auth Service, datos biográficos en User Service

---

## 🚀 Despliegue con Docker Compose

### Requisitos previos
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado y corriendo
- Git

### 1. Clonar el repositorio

```bash
git clone https://github.com/CarlosYesid27/Sistema-SGAU.git
cd Sistema-SGAU
```

### 2. Configurar variables de entorno (opcional)

El archivo `.env` del Gateway gestiona el token de MercadoPago:

```bash
cd Gateway
cp .env.example .env    # Si existe, o crear manualmente
```

Contenido del `.env` en `Gateway/`:
```env
MERCADOPAGO_ACCESS_TOKEN=TU_ACCESS_TOKEN_AQUI
```

> Si no configuras el token, los pagos quedarán no funcionales pero el resto del sistema operará con normalidad.

### 3. Levantar todos los servicios

```bash
cd Gateway
docker compose up -d --build
```

El primer arranque toma ~3-5 minutos mientras construye las imágenes y levanta los contenedores.

### 4. Verificar que todo esté corriendo

```bash
docker compose ps
```

Debes ver todos los contenedores en estado `Up` o `healthy`.

### 5. Acceder a la aplicación

| Recurso | URL |
|---|---|
| 🌐 **Aplicación Web** | http://localhost:5173 |
| 🔀 **API Gateway** | http://localhost:8000 |
| 📄 **Docs Auth API** | http://localhost:8000/auth/docs |
| 📄 **Docs Course API** | http://localhost:8000/courses/docs |
| 📊 **Kong Admin** | http://localhost:8004 |

### 6. Detener los servicios

```bash
docker compose down
```

Para eliminar también los volúmenes de bases de datos:
```bash
docker compose down -v
```

---

## 👤 Usuario por defecto

Al iniciar el sistema por primera vez, **debes registrar el primer usuario administrador** a través de la pantalla de registro. Luego cambia su rol a `admin` directamente en la base de datos o desde otro administrador.

---

## 🗂️ Estructura del Repositorio

```
Sistema-SGAU/
├── Gateway/
│   ├── docker-compose.yml    # Orquestación de todos los servicios
│   ├── kong.yml              # Configuración declarativa del API Gateway
│   └── .env                  # Variables de entorno (no versionado)
│
├── Auth service/backend/     # FastAPI — Autenticación JWT
├── User Service/
│   ├── backend/              # FastAPI — Perfiles de usuario
│   └── frontend/             # React + Vite — SPA principal
├── Course service/backend/   # FastAPI — Materias y prerrequisitos
├── Enrollment Service/backend/ # FastAPI — Inscripciones (Saga)
├── Grades Service/backend/   # FastAPI — Calificaciones
├── Student Service/backend/  # FastAPI — Historial académico
├── Payment Service/backend/  # FastAPI — Pagos con MercadoPago
└── Reporting Service/backend/ # FastAPI — Reportes PDF y CSV
```

---

## 🛠️ Tecnologías

| Capa | Tecnología |
|---|---|
| Backend | Python 3.13, FastAPI, SQLAlchemy, Pydantic v2, Uvicorn |
| Frontend | React 18, Vite, Axios |
| Base de datos | PostgreSQL 17 |
| Gateway | Kong 3.7 (DB-less, declarativo) |
| ORM / Migraciones | SQLAlchemy (auto-migrate en startup) |
| Autenticación | JWT (PyJWT), passlib (pbkdf2_sha256) |
| Pagos | MercadoPago Checkout Pro |
| Reportes | ReportLab (PDF), csv (Python stdlib) |
| Contenedores | Docker, Docker Compose |

---

## 📄 Licencia

Este proyecto fue desarrollado con fines académicos.

---

<p align="center">Desarrollado por <strong>Carlos Yesid</strong> · SGAU V2 · 2025-2026</p>
