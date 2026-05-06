"""
Pruebas Unitarias - Enrollment Service (SGAU V2)
=================================================
Cobertura:
  - Schemas: Validacion de datos de matriculas y pagos
  - Logica de Negocio: Estados validos de matricula
  - Endpoints: Health check y seguridad de rutas protegidas
"""
import pytest
from datetime import datetime
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient


# ─────────────────────────────────────────────
# Fixture
# ─────────────────────────────────────────────

@pytest.fixture
def client():
    """Cliente de prueba sin base de datos real."""
    with patch("app.database.engine") as mock_engine:
        mock_engine.begin.return_value.__enter__ = MagicMock()
        mock_engine.begin.return_value.__exit__ = MagicMock(return_value=False)
        from app.main import app
        with TestClient(app) as c:
            yield c


# ─────────────────────────────────────────────
# 1. Pruebas de Schemas de Matricula
# ─────────────────────────────────────────────

class TestEnrollmentSchemas:
    """Verifica la validacion de datos de entrada para el sistema de matriculas."""

    def test_enrollment_create_requires_course_id(self):
        """Crear una matricula sin un ID de curso debe ser rechazado."""
        from app.schemas import EnrollmentCreate
        from pydantic import ValidationError
        with pytest.raises(ValidationError):
            EnrollmentCreate()

    def test_valid_enrollment_creation(self):
        """Una matricula con course_id valido debe ser aceptada."""
        from app.schemas import EnrollmentCreate
        enrollment = EnrollmentCreate(course_id=5)
        assert enrollment.course_id == 5

    def test_enrollment_response_has_required_fields(self):
        """La respuesta de una matricula debe incluir todos los campos esperados."""
        from app.schemas import EnrollmentResponse
        enrollment = EnrollmentResponse(
            id=1,
            student_id=10,
            course_id=5,
            enrollment_date=datetime.now(),
            status="activa",
            payment=None
        )
        assert enrollment.id == 1
        assert enrollment.student_id == 10
        assert enrollment.course_id == 5
        assert enrollment.status == "activa"
        assert enrollment.payment is None

    def test_enrollment_status_update_requires_status(self):
        """Actualizar el estado de una matricula sin el campo status debe fallar."""
        from app.schemas import EnrollmentStatusUpdate
        from pydantic import ValidationError
        with pytest.raises(ValidationError):
            EnrollmentStatusUpdate()

    def test_enrollment_status_update_valid(self):
        """Una actualizacion de estado con un valor string valido debe ser aceptada."""
        from app.schemas import EnrollmentStatusUpdate
        update = EnrollmentStatusUpdate(status="cancelada")
        assert update.status == "cancelada"

    def test_payment_commitment_response_has_all_fields(self):
        """El compromiso de pago debe incluir monto, fecha limite y estado."""
        from app.schemas import PaymentCommitmentResponse
        payment = PaymentCommitmentResponse(
            id=1,
            enrollment_id=10,
            amount=1500000.0,
            due_date=datetime.now(),
            status="pendiente",
            created_at=datetime.now()
        )
        assert payment.amount == 1500000.0
        assert payment.status == "pendiente"

    def test_payment_amount_must_be_float(self):
        """El monto del pago debe ser un numero, no un string."""
        from app.schemas import PaymentCommitmentResponse
        from pydantic import ValidationError
        with pytest.raises(ValidationError):
            PaymentCommitmentResponse(
                id=1,
                enrollment_id=10,
                amount="un millon",
                due_date=datetime.now(),
                status="pendiente",
                created_at=datetime.now()
            )


# ─────────────────────────────────────────────
# 2. Pruebas de Logica de Estados de Matricula
# ─────────────────────────────────────────────

class TestEnrollmentBusinessLogic:
    """Verifica la logica de negocio del flujo de matriculas."""

    VALID_STATUSES = ["activa", "cancelada", "pendiente", "completada"]

    def test_valid_enrollment_statuses_are_accepted(self):
        """Solo los estados validos del negocio deben existir en el sistema."""
        from app.schemas import EnrollmentStatusUpdate
        for status in self.VALID_STATUSES:
            update = EnrollmentStatusUpdate(status=status)
            assert update.status == status, f"El estado '{status}' fue rechazado"

    def test_enrollment_payment_is_optional(self):
        """Una matricula puede existir sin un compromiso de pago asociado."""
        from app.schemas import EnrollmentResponse
        enrollment = EnrollmentResponse(
            id=99,
            student_id=1,
            course_id=2,
            enrollment_date=datetime.now(),
            status="activa",
            payment=None
        )
        assert enrollment.payment is None, "El campo payment no es opcional"


# ─────────────────────────────────────────────
# 3. Pruebas de Endpoints del Enrollment Service
# ─────────────────────────────────────────────

class TestEnrollmentEndpoints:
    """Verifica que los endpoints del Enrollment Service respondan correctamente."""

    def test_health_check_responds_ok(self, client):
        """El endpoint /health debe responder con estado ok."""
        response = client.get("/health")
        assert response.status_code == 200, "El health check del Enrollment Service fallo"
        data = response.json()
        assert data.get("status") == "ok", "El estado reportado no es ok"
        assert data.get("service") == "Enrollment Service", "El nombre del servicio no coincide"

    def test_list_enrollments_without_token_is_forbidden(self, client):
        """Listar matriculas sin autenticacion debe ser rechazado."""
        response = client.get("/enrollments/")
        assert response.status_code in [401, 403], (
            "Se pudo acceder a las matriculas sin autenticacion"
        )

    def test_create_enrollment_without_token_is_forbidden(self, client):
        """Crear una matricula sin autenticacion debe ser rechazado."""
        response = client.post("/enrollments/", json={"course_id": 1})
        assert response.status_code in [401, 403], (
            "Se pudo crear una matricula sin autenticacion"
        )
