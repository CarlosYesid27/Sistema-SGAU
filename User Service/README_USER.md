# SGAU User Service (MVP)

CRUD de usuarios para un sistema de gestión académica universitaria.

## Stack
- Backend: FastAPI + SQLAlchemy + PostgreSQL
- Frontend: React + Vite + Axios
- Con ejecución local y con Docker

## Campos del usuario
- `first_name`
- `last_name`
- `email` (único)
- `phone`
- `document_type`: `C.C`, `T.I`
- `document_number`
- `role`: `admin`, `docente`, `estudiante`

## 1) Configurar PostgreSQL local
Crea una base de datos llamada `sgau_users`.

Ejemplo en `psql`:
```sql
CREATE DATABASE sgau_users;
```

## 2) Backend (FastAPI)
```bash
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

La API estará en: `http://127.0.0.1:8000`

## 3) Frontend (React)
```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

La app estará en: `http://localhost:5173`

## 4) Levantar con Docker
Desde la raíz del proyecto (`User Service`):

```bash
docker compose up --build -d
```

Servicios:
- Frontend: `http://localhost:5173`
- Backend: `http://127.0.0.1:8000`
- Docs API: `http://127.0.0.1:8000/docs`

Para apagar:

```bash
docker compose down
```

Para apagar y borrar volumen de base de datos:

```bash
docker compose down -v
```

## Endpoints principales
- `GET /users/` - Listar usuarios
- `GET /users/{id}` - Obtener usuario por ID
- `POST /users/` - Crear usuario
- `PUT /users/{id}` - Actualizar usuario
- `DELETE /users/{id}` - Eliminar usuario
