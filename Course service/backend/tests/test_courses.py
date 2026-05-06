"""
Pruebas Unitarias - Course Service (SGAU V2)
============================================
Cobertura:
  - Schemas: Validacion de datos de cursos con Pydantic
  - Logica de Negocio: Creditos, nombres y campos obligatorios
  - Endpoints: Health check y seguridad de rutas protegidas
"""
import pytest
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
# 1. Pruebas de Schemas de Cursos
# ─────────────────────────────────────────────

class TestCourseSchemas:
    """Verifica la validacion de datos de entrada para la gestion de cursos."""

    def test_valid_course_creation_schema(self):
        """Un payload de creacion de curso completo y valido debe ser aceptado."""
        from app.schemas import CourseCreate
        course = CourseCreate(
            name="Calculo Diferencial",
            description="Introduccion al calculo",
            credits=3,
            schedule="Lunes 8-10am",
            academic_program="Ingenieria de Sistemas",
            is_offered=True
        )
        assert course.name == "Calculo Diferencial"
        assert course.credits == 3
        assert course.is_offered is True

    def test_course_requires_name_and_credits(self):
        """Un curso sin nombre o creditos debe ser rechazado."""
        from app.schemas import CourseCreate
        from pydantic import ValidationError
        with pytest.raises(ValidationError):
            CourseCreate(credits=3)

    def test_course_update_allows_partial_data(self):
        """Una actualizacion parcial (solo algunos campos) debe ser valida."""
        from app.schemas import CourseUpdate
        update = CourseUpdate(credits=4, is_offered=False)
        assert update.credits == 4
        assert update.is_offered is False
        assert update.name is None

    def test_course_response_includes_id(self):
        """La respuesta de un curso debe siempre incluir su ID."""
        from app.schemas import CourseResponseSimple
        course = CourseResponseSimple(
            id=10,
            name="Algebra Lineal",
            credits=3,
            is_offered=True
        )
        assert course.id == 10

    def test_course_credits_must_be_integer(self):
        """Los creditos de un curso deben ser un numero entero."""
        from app.schemas import CourseCreate
        from pydantic import ValidationError
        with pytest.raises(ValidationError):
            CourseCreate(
                name="Curso Test",
                credits="tres",
                is_offered=False
            )

    def test_prerequisite_requires_prerequisite_id(self):
        """Un prerequisito debe incluir el ID del curso requerido."""
        from app.schemas import PrerequisiteCreate
        from pydantic import ValidationError
        with pytest.raises(ValidationError):
            PrerequisiteCreate()

    def test_course_default_not_offered(self):
        """Por defecto, un curso nuevo no debe estar ofertado."""
        from app.schemas import CourseCreate
        course = CourseCreate(name="Nueva Materia", credits=2)
        assert course.is_offered is False, "Un curso nuevo estaba ofertado por defecto"

    def test_course_detail_response_has_prerequisites_list(self):
        """La respuesta detallada de un curso debe incluir una lista de prerequisitos."""
        from app.schemas import CourseResponseDetail
        course = CourseResponseDetail(
            id=5,
            name="Fisica II",
            credits=4,
            is_offered=True,
            prerequisites=[]
        )
        assert isinstance(course.prerequisites, list)


# ─────────────────────────────────────────────
# 2. Pruebas de Endpoints del Course Service
# ─────────────────────────────────────────────

class TestCourseEndpoints:
    """Verifica que los endpoints del Course Service respondan correctamente."""

    def test_root_health_check(self, client):
        """El endpoint raiz debe confirmar que el Course Service esta activo."""
        response = client.get("/")
        assert response.status_code == 200, "El health check del Course Service fallo"
        data = response.json()
        assert "message" in data, "La respuesta no contiene campo message"

    def test_list_courses_without_token_is_forbidden(self, client):
        """Listar cursos sin un token JWT debe ser rechazado."""
        response = client.get("/courses/")
        assert response.status_code in [401, 403], (
            "Se pudo acceder a la lista de cursos sin autenticacion"
        )

    def test_create_course_without_token_is_forbidden(self, client):
        """Crear un curso sin un token JWT de administrador debe ser rechazado."""
        response = client.post("/courses/", json={
            "name": "Curso No Autorizado",
            "credits": 3,
            "is_offered": False
        })
        assert response.status_code in [401, 403], (
            "Se pudo crear un curso sin autenticacion de administrador"
        )
