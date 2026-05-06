"""
Pruebas Unitarias - Auth Service (SGAU V2)
==========================================
Cobertura:
  - Seguridad: Hashing y verificacion de contrasenas
  - JWT: Creacion y verificacion de tokens de acceso
  - Schemas: Validacion de datos de entrada con Pydantic
  - Endpoints: Health check y rutas de la API (sin BD)
"""
import pytest
from datetime import timedelta
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

# ─────────────────────────────────────────────
# Fixtures
# ─────────────────────────────────────────────

@pytest.fixture
def client():
    """Cliente de prueba que no necesita una base de datos real.
    Usamos mocks para simular la conexion a PostgreSQL."""
    with patch("app.database.engine") as mock_engine, \
         patch("sqlalchemy.orm.Session") as mock_session:

        mock_engine.begin.return_value.__enter__ = MagicMock()
        mock_engine.begin.return_value.__exit__ = MagicMock(return_value=False)

        from app.main import app
        with TestClient(app) as c:
            yield c


# ─────────────────────────────────────────────
# 1. Pruebas de Seguridad (hash de contrasenas)
# ─────────────────────────────────────────────

class TestPasswordSecurity:
    """Verifica que las contrasenas se almacenen siempre hasheadas (nunca en texto plano)."""

    def test_password_is_hashed(self):
        """Una contrasena nunca debe guardarse igual a como el usuario la escribio."""
        from app.security import hash_password
        password = "MiContraseniaSegura123"
        hashed = hash_password(password)
        assert hashed != password, "La contrasena no fue hasheada"

    def test_correct_password_verifies_successfully(self):
        """La contrasena original debe pasar la verificacion contra su hash."""
        from app.security import hash_password, verify_password
        password = "MiContraseniaSegura123"
        hashed = hash_password(password)
        assert verify_password(password, hashed), "La contrasena correcta no fue verificada"

    def test_wrong_password_fails_verification(self):
        """Una contrasena incorrecta nunca debe pasar la verificacion."""
        from app.security import hash_password, verify_password
        hashed = hash_password("ContraseniaReal123")
        assert not verify_password("ContraseniaFalsa999", hashed), "Una contrasena incorrecta paso la verificacion"

    def test_two_hashes_of_same_password_are_different(self):
        """El hash debe ser unico cada vez (uso de salt), incluso para la misma contrasena."""
        from app.security import hash_password
        password = "MismaContrasenia123"
        hash1 = hash_password(password)
        hash2 = hash_password(password)
        assert hash1 != hash2, "Dos hashes de la misma contrasena son identicos (sin salt)"


# ─────────────────────────────────────────────
# 2. Pruebas de JWT (Tokens de Acceso)
# ─────────────────────────────────────────────

class TestJWTTokens:
    """Verifica la integridad y seguridad del sistema de autenticacion con JWT."""

    def test_token_is_created_successfully(self):
        """Debe ser posible crear un token sin errores."""
        from app.security import create_access_token
        token = create_access_token(user_id=1, email="test@sgau.edu.co", role="estudiante")
        assert token is not None
        assert isinstance(token, str)
        assert len(token) > 0, "El token esta vacio"

    def test_token_contains_correct_user_data(self):
        """El token debe contener exactamente los datos del usuario que lo solicito."""
        from app.security import create_access_token, verify_token
        token = create_access_token(user_id=42, email="carlos@sgau.edu.co", role="admin")
        payload = verify_token(token)
        assert payload.sub == 42, "El ID del usuario en el token no coincide"
        assert payload.email == "carlos@sgau.edu.co", "El email en el token no coincide"
        assert payload.role == "admin", "El rol en el token no coincide"

    def test_expired_token_is_rejected(self):
        """Un token expirado debe ser rechazado con un error 401."""
        from app.security import create_access_token
        from fastapi import HTTPException
        token = create_access_token(
            user_id=1,
            email="test@sgau.edu.co",
            role="estudiante",
            expires_delta=timedelta(seconds=-1)
        )
        with pytest.raises(HTTPException) as exc_info:
            from app.security import verify_token
            verify_token(token)
        assert exc_info.value.status_code == 401, "Un token expirado no devolvio error 401"

    def test_tampered_token_is_rejected(self):
        """Un token manipulado (falsificado) debe ser rechazado."""
        from app.security import verify_token
        from fastapi import HTTPException
        fake_token = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI5OTkiLCJlbWFpbCI6ImhhY2tlckBtYWwuY29tIn0.firma_falsa"
        with pytest.raises(HTTPException) as exc_info:
            verify_token(fake_token)
        assert exc_info.value.status_code == 401, "Un token falsificado no fue rechazado"


# ─────────────────────────────────────────────
# 3. Pruebas de Schemas (Validacion de Datos)
# ─────────────────────────────────────────────

class TestSchemaValidation:
    """Verifica que Pydantic rechace datos incorrectos antes de que lleguen a la BD."""

    def test_valid_user_registration_schema(self):
        """Un payload de registro completo y valido debe ser aceptado."""
        from app.schemas import UserRegister
        user = UserRegister(
            first_name="Carlos",
            last_name="Yesid",
            email="carlos@universidad.edu.co",
            password="Segura1234",
            document_number="1234567890",
            role="estudiante"
        )
        assert user.email == "carlos@universidad.edu.co"
        assert user.role == "estudiante"

    def test_invalid_email_is_rejected(self):
        """Un email con formato incorrecto debe ser rechazado por el schema."""
        from app.schemas import UserRegister
        from pydantic import ValidationError
        with pytest.raises(ValidationError):
            UserRegister(
                first_name="Test",
                last_name="User",
                email="esto-no-es-un-email",
                password="Segura1234",
                document_number="123",
            )

    def test_short_password_is_rejected(self):
        """Una contrasena de menos de 8 caracteres debe ser rechazada."""
        from app.schemas import UserRegister
        from pydantic import ValidationError
        with pytest.raises(ValidationError):
            UserRegister(
                first_name="Test",
                last_name="User",
                email="test@test.com",
                password="corta",
                document_number="123",
            )

    def test_login_schema_requires_email_and_password(self):
        """El schema de login debe requerir email y contrasena obligatoriamente."""
        from app.schemas import UserLogin
        from pydantic import ValidationError
        with pytest.raises(ValidationError):
            UserLogin(email="solo-email@test.com")


# ─────────────────────────────────────────────
# 4. Pruebas de Endpoints (API)
# ─────────────────────────────────────────────

class TestHealthEndpoints:
    """Verifica que los endpoints de salud del servicio respondan correctamente."""

    def test_root_health_check(self, client):
        """El endpoint raiz debe indicar que el servicio esta activo."""
        response = client.get("/")
        assert response.status_code == 200, "El endpoint raiz no responde con 200"
        data = response.json()
        assert "message" in data or "status" in data, "La respuesta no contiene campo de estado"

    def test_auth_health_check(self, client):
        """El endpoint /auth/health debe confirmar que el Auth Service esta corriendo."""
        response = client.get("/auth/health")
        assert response.status_code == 200, "El health check del Auth Service fallo"
        data = response.json()
        assert "status" in data, "La respuesta no contiene campo status"

    def test_login_with_wrong_credentials_returns_401(self, client):
        """Intentar hacer login con credenciales incorrectas debe retornar 401."""
        with patch("app.crud.authenticate_user", return_value=None):
            response = client.post("/auth/login", json={
                "email": "noexiste@test.com",
                "password": "contraseñaincorrecta"
            })
        assert response.status_code == 401, "Credenciales incorrectas no retornaron 401"

    def test_protected_route_without_token_returns_403(self, client):
        """Acceder a una ruta protegida sin token debe retornar 403."""
        response = client.get("/auth/me")
        assert response.status_code in [401, 403], "Una ruta protegida fue accesible sin token"
