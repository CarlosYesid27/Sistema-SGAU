# Auth Service - Inicio Rápido

## 1️⃣ Con Docker (30 segundos)

```bash
cd Auth\ Service
docker compose up -d
```

✅ Acceso: http://127.0.0.1:8001/docs

## 2️⃣ Registro de usuario

```bash
curl -X POST http://127.0.0.1:8001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Juan",
    "last_name": "Pérez",
    "email": "juan@example.com",
    "password": "SecurePass123",
    "role": "estudiante"
  }'
```

## 3️⃣ Login (obtener JWT token)

```bash
curl -X POST http://127.0.0.1:8001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "juan@example.com",
    "password": "SecurePass123"
  }'
```

Respuesta incluirá `access_token`

## 4️⃣ Usar token para obtener perfil

```bash
curl -X GET http://127.0.0.1:8001/auth/me \
  -H "Authorization: Bearer {access_token}"
```

## 📊 Puertos

- **API**: 8001
- **Database**: 5433
- **User Service**: 8000 (otro microservicio)

## 🔧 Desarrollo local

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8001
```

## 🛑 Detener servicios

```bash
docker compose down
```

---

Más detalles en [README.md](README.md)
