#  Sistema SGAU — Sistema de Gestión Académica Universitaria

<p align="center">
  <img src="https://img.shields.io/badge/Arquitectura-Microservicios-6c63ff?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi" />
  <img src="https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?style=for-the-badge&logo=react" />
  <img src="https://img.shields.io/badge/Gateway-Kong-003459?style=for-the-badge" />
  <img src="https://img.shields.io/badge/DB-PostgreSQL-336791?style=for-the-badge&logo=postgresql" />
  <img src="https://img.shields.io/badge/Deploy-Docker%20Compose-2496ED?style=for-the-badge&logo=docker" />
</p>

---

##  Descripción

**SGAU V** es una plataforma académica universitaria basada en **arquitectura de microservicios**. Permite gestionar usuarios, materias, inscripciones, calificaciones, pagos y generación de reportes, todo desde una interfaz web unificada y un API Gateway centralizado con **Kong**.

---
---

##  Microservicios

| Servicio | Puerto interno | Prefijo Kong | Base de datos | Descripción |
|---|---|---|---|---|
| **Auth Service** | 8001 | `/auth` | `sgau_auth` (5433) | Autenticación JWT, registro y gestión de identidades |
| **User Service** | 8000 | `/users` | `sgau_users` (5432) | Perfiles de usuario y datos biográficos |
| **Course Service** | 8000 | `/courses` | `sgau_courses` (5434) | Catálogo de materias y prerrequisitos |
| **Enrollment Service** | 8000 | `/enrollments` | `sgau_enrollment` (5435) | Inscripciones con patrón Saga |
| **Grades Service** | 8000 | `/grades` | `sgau_grades` (5436) | Registro y cálculo de calificaciones |
| **Student Service** | 8000 | `/students` | `sgau_students` (5437) | Historial académico |
| **Payment Service** | 8000 | `/payments` | `sgau_payments` (5438) | Pagos vía MercadoPago Checkout Pro |
| **Reporting Service** | 8000 | `/reports` | — (sin BD) | Generación de reportes PDF y CSV |
| **Kong Gateway** | 8000 | — | — | API Gateway centralizado |
| **Frontend** | 5173 | — | — | SPA React (Vite) |

---

##  Roles y Funcionalidades

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

##  Patrones de Diseño Implementados

- **Saga Orchestrator** — Inscripciones con compensación automática (rollback si falla algún paso)
- **API Gateway** — Kong como punto de entrada único y enrutador de peticiones
- **Shared JWT Secret** — Todos los servicios validan el mismo token emitido por Auth Service
- **Split Identity/Profile** — Identidad en Auth Service, datos biográficos en User Service

---

## 🚀 Despliegue Local paso a paso

### Requisitos previos

Antes de empezar asegúrate de tener instalado:
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) — corriendo en segundo plano
- [Git](https://git-scm.com/)

### 1. Clonar el repositorio

```bash
git clone https://github.com/CarlosYesid27/Sistema-SGAU.git
cd Sistema-SGAU
```

### 2. Crear el archivo de variables de entorno

El archivo `Gateway/.env` **no se incluye en el repositorio** por seguridad. Debes crearlo manualmente a partir del ejemplo:

```bash
cd Gateway
copy .env.example .env
```

Luego edita el archivo `Gateway/.env` y reemplaza el token de MercadoPago con el tuyo:

```env
MERCADOPAGO_ACCESS_TOKEN=APP_USR-TU_TOKEN_REAL_AQUI
```

> **¿Dónde obtengo el token?** → [MercadoPago Developers](https://www.mercadopago.com.co/developers/panel/credentials)
>
> Si no tienes token, igualmente puedes usar el sistema — solo el módulo de pagos quedará inactivo.

### 3. Levantar todos los servicios

```bash
docker compose up -d --build
```

El **primer arranque** tarda entre 3 y 6 minutos mientras Docker construye las 9 imágenes y levanta los contenedores.

Los arranques posteriores (sin `--build`) son mucho más rápidos:
```bash
docker compose up -d
```

### 4. Verificar que todo esté corriendo

```bash
docker compose ps
```

Todos los contenedores deben mostrar estado `Up` o `healthy`. Si alguno aparece como `Exit`, revisa sus logs:

```bash
docker compose logs <nombre_del_servicio>
```

### 5. Acceder a la aplicación

| Recurso | URL |
|---|---|
| 🌐 **Aplicación Web** | http://localhost:5173 |
| 🔀 **API Gateway (Kong)** | http://localhost:8000 |
| 📄 **Docs Auth API** | http://localhost:8001/docs *(acceso directo)* |
| 📊 **Kong Admin** | http://localhost:8004 |


### 7. Detener los servicios

```bash
docker compose down
```

Para borrar también las bases de datos (todos los datos se perderán):
```bash
docker compose down -v
```

---

## 🗂️ Estructura del Repositorio

```
Sistema-SGAU/
├── Gateway/
│   ├── docker-compose.yml      # Orquestador de todos los servicios
│   ├── kong.yml                # Configuración declarativa del API Gateway
│   └── .env.example            # Plantilla de variables de entorno
│
├── Auth service/backend/       # FastAPI — Autenticación JWT
├── User Service/
│   ├── backend/                # FastAPI — Perfiles de usuario
│   └── frontend/               # React + Vite — SPA principal
├── Course service/backend/     # FastAPI — Materias y prerrequisitos
├── Enrollment Service/backend/ # FastAPI — Inscripciones (Saga)
├── Grades Service/backend/     # FastAPI — Calificaciones
├── Student Service/backend/    # FastAPI — Historial académico
├── Payment Service/backend/    # FastAPI — Pagos con MercadoPago
└── Reporting Service/backend/  # FastAPI — Reportes PDF y CSV
```

---

## 🛠️ Tecnologías

| Capa | Tecnología |
|---|---|
| Backend | Python 3.13, FastAPI, SQLAlchemy, Pydantic v2, Uvicorn |
| Frontend | React 18, Vite, Axios |
| Base de datos | PostgreSQL 17 |
| Gateway | Kong 3.7 (DB-less, declarativo) |
| Autenticación | JWT (PyJWT), passlib (pbkdf2_sha256) |
| Pagos | MercadoPago Checkout Pro |
| Reportes | ReportLab (PDF), csv (stdlib Python) |
| Contenedores | Docker, Docker Compose |

---

## ❓ Problemas comunes

**Un contenedor queda en `Exit` al arrancar**
→ Espera 30 segundos y ejecuta `docker compose up -d` de nuevo. Algunos servicios dependen de que la base de datos esté `healthy` antes de arrancar.

**El frontend no carga (error de red)**
→ Verifica que Kong esté corriendo: `docker compose ps sgau_kong`. Si aparece `Exit`, reinícialo con `docker compose restart kong`.

**Error 401 / Token inválido en todas las peticiones**
→ Asegúrate de que todos los servicios usen la misma `SECRET_KEY`. En el `docker-compose.yml` ya está configurada igual para todos.

---

## 📄 Licencia

Este proyecto fue desarrollado con fines académicos.

---

<p align="center">Desarrollado por <strong>Carlos Yesid Atencia - Juan Andres Serna - Nohemi Martinez - Juan Salgado</strong> · SGAU2 · 2025-2026</p>
