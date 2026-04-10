# Auth Service - SGAU

Microservicio de autenticación y seguridad para el sistema de gestión académica universitaria (SGAU). Maneja registro, login, asignación de roles y tokens JWT.

## 🔐 Características

- **Registro de usuarios** - Creación de nuevas cuentas
- **Autenticación** - Login seguro con email y contraseña
- **JWT Tokens** - Tokens de acceso con expiración (30 minutos)
- **Password Hashing** - Contraseñas hasheadas con bcrypt
- **Gestión de roles** - admin, docente, estudiante
- **Validación de tokens** - Verificación y decodificación de JWT
- **CORS** - Comunicación segura entre microservicios

## 📚 Stack Tecnológico

- **Backend**: FastAPI 0.115.0
- **Server**: Uvicorn 0.30.6
- **Base de datos**: PostgreSQL 17 (Alpine)
- **ORM**: SQLAlchemy 2.0.35
- **Autenticación**: JWT + PyJWT
- **Hash de contraseñas**: Passlib + bcrypt

## 🚀 Inicio Rápido

### Con Docker Compose (Recomendado)

```bash
cd Auth\ Service
docker compose up -d
```

Acceso:
- **API**: http://127.0.0.1:8001
- **Swagger UI**: http://127.0.0.1:8001/docs
- **Database**: localhost:5433 (usuario: postgres, contraseña: Yesid270318b)

### Desarrollo Local

#### 1. Crear entorno virtual

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # macOS/Linux
```

#### 2. Instalar dependencias

```bash
pip install -r requirements.txt
```

#### 3. Configurar base de datos

El archivo `.env` ya está configurado con PostgreSQL local. Asegúrate que PostgreSQL está corriendo en puerto 5432.

#### 4. Ejecutar servidor

```bash
python -m uvicorn app.main:app --reload --port 8001
```

## 📋 Endpoints

### Autenticación

#### Registrar usuario
```
POST /auth/register
Content-Type: application/json

{
  "first_name": "Juan",
  "last_name": "Pérez",
  "email": "juan@example.com",
  "password": "SecurePass123",
  "phone": "+57123456789",
  "role": "estudiante"
}
```

**Respuesta (201):**
```json
{
  "id": 1,
  "first_name": "Juan",
  "last_name": "Pérez",
  "email": "juan@example.com",
  "phone": "+57123456789",
  "role": "estudiante",
  "is_active": 1
}
```

#### Login
```
POST /auth/login
Content-Type: application/json

{
  "email": "juan@example.com",
  "password": "SecurePass123"
}
```

**Respuesta (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user_id": 1,
  "email": "juan@example.com",
  "first_name": "Juan",
  "last_name": "Pérez",
  "role": "estudiante"
}
```

#### Obtener datos del usuario actual
```
GET /auth/me
Authorization: Bearer {access_token}
```

**Respuesta (200):**
```json
{
  "id": 1,
  "first_name": "Juan",
  "last_name": "Pérez",
  "email": "juan@example.com",
  "phone": "+57123456789",
  "role": "estudiante",
  "is_active": 1
}
```

#### Verificar token
```
GET /auth/verify-token
Authorization: Bearer {access_token}
```

**Respuesta (200):**
```json
{
  "status": "valid",
  "user_id": 1,
  "email": "juan@example.com",
  "role": "estudiante"
}
```

## 🔑 Variables de entorno

```env
# Database
DATABASE_URL=postgresql+psycopg://postgres:Yesid270318b@localhost:5432/sgau_auth

# JWT
SECRET_KEY=sgau-super-secret-jwt-key-min-32-chars-for-production-use
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS
FRONTEND_ORIGIN=http://localhost:5173
USER_SERVICE_URL=http://localhost:8000
```

> ⚠️ **Importante**: En producción, cambia `SECRET_KEY` a un valor seguro y único.

## 📊 Modelos de datos

### User (base de datos)
- `id` (Integer, PK)
- `first_name` (String)
- `last_name` (String)
- `email` (String, único)
- `hashed_password` (String)
- `phone` (String, opcional)
- `role` (Enum: admin, docente, estudiante)
- `is_active` (Integer, default: 1)
- `created_at` (DateTime)
- `updated_at` (DateTime)

## 🔒 Seguridad

- **Contraseñas**: Hasheadas con bcrypt (10 rounds)
- **JWT**: Algoritmo HS256 con expiración de 30 minutos
- **CORS**: Configurado para comunicación segura entre servicios
- **Validación**: Email único, validación de formato

## 📝 Estructura de directorios

```
Auth Service/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI app
│   │   ├── database.py          # Configuración SQLAlchemy
│   │   ├── models.py            # Modelos ORM
│   │   ├── schemas.py           # Esquemas Pydantic
│   │   ├── security.py          # JWT y encriptación
│   │   ├── crud.py              # Operaciones DB
│   │   └── routes/
│   │       ├── __init__.py
│   │       └── auth.py          # Endpoints de auth
│   ├── requirements.txt
│   ├── .env
│   ├── .env.example
│   ├── Dockerfile
│   └── .dockerignore
├── docker-compose.yml
├── .dockerignore
└── README.md
```

## 🧪 Pruebas

### Con curl

```bash
# Registrar
curl -X POST http://127.0.0.1:8001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"first_name":"Test","last_name":"User","email":"test@test.com","password":"TestPass123"}'

# Login
curl -X POST http://127.0.0.1:8001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"TestPass123"}'

# Obtener usuario actual (reemplaza TOKEN)
curl -X GET http://127.0.0.1:8001/auth/me \
  -H "Authorization: Bearer TOKEN"
```

### Con Swagger UI

Accede a http://127.0.0.1:8001/docs para probar todos los endpoints interactivamente.

## 🐳 Docker

### Construir imagen
```bash
docker build -t sgau-auth-service ./backend
```

### Ejecutar contenedor
```bash
docker run -p 8001:8001 -e DATABASE_URL=postgresql+psycopg://postgres:password@db:5432/sgau_auth sgau-auth-service
```

## 📚 Documentación

- **Swagger UI**: http://127.0.0.1:8001/docs
- **ReDoc**: http://127.0.0.1:8001/redoc

## 🤝 Integración con User Service

Este servicio puede integrarse con User Service para:
- Validar usuarios
- Actualizar información de perfil
- Sincronizar roles

Actualmente funciona de forma independiente con su propia base de datos.

## 📄 Licencia

Proyecto SGAU - 2026

## 👨‍💻 Autor

Desarrollado para el Sistema de Gestión Académica Universitaria
