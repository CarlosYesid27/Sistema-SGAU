import os
import httpx
from app.security import create_internal_token

AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "http://auth_backend:8001")
COURSE_SERVICE_URL = os.getenv("COURSE_SERVICE_URL", "http://course_backend:8000")
ENROLLMENT_SERVICE_URL = os.getenv("ENROLLMENT_SERVICE_URL", "http://enrollment_backend:8000")
GRADES_SERVICE_URL = os.getenv("GRADES_SERVICE_URL", "http://grades_backend:8000")
PAYMENT_SERVICE_URL = os.getenv("PAYMENT_SERVICE_URL", "http://payment_backend:8000")


def _headers() -> dict:
    token = create_internal_token()
    return {"Authorization": f"Bearer {token}"}


async def fetch_users() -> list:
    async with httpx.AsyncClient(timeout=10) as client:
        res = await client.get(f"{AUTH_SERVICE_URL}/auth/users", headers=_headers())
        res.raise_for_status()
        return res.json()


async def fetch_courses() -> list:
    async with httpx.AsyncClient(timeout=10) as client:
        res = await client.get(f"{COURSE_SERVICE_URL}/courses/", headers=_headers())
        res.raise_for_status()
        return res.json()


async def fetch_all_enrollments() -> list:
    """Obtiene inscripciones agrupadas por curso para todos los cursos."""
    courses = await fetch_courses()
    all_enrollments = []
    async with httpx.AsyncClient(timeout=10) as client:
        for c in courses:
            try:
                res = await client.get(
                    f"{ENROLLMENT_SERVICE_URL}/enrollments/course/{c['id']}",
                    headers=_headers()
                )
                if res.status_code == 200:
                    for e in res.json():
                        e["course_name"] = c.get("name", "")
                        e["course_credits"] = c.get("credits", 0)
                        all_enrollments.append(e)
            except Exception:
                pass
    return all_enrollments


async def fetch_grades_for_course(course_id: int) -> list:
    async with httpx.AsyncClient(timeout=10) as client:
        res = await client.get(
            f"{GRADES_SERVICE_URL}/grades/course/{course_id}",
            headers=_headers()
        )
        if res.status_code == 200:
            return res.json()  # cada elemento tiene "enrollment_id" y "average"
    return []


async def fetch_student_enrollments(student_id: int) -> list:
    """Obtiene las inscripciones de un estudiante con nombre de materia adjunto."""
    courses = await fetch_courses()
    course_map = {c["id"]: c for c in courses}
    async with httpx.AsyncClient(timeout=10) as client:
        res = await client.get(
            f"{ENROLLMENT_SERVICE_URL}/enrollments/course/0",  # placeholder, usamos la ruta de admin
            headers=_headers()
        )
    # Mejor: traemos todas y filtramos
    all_enr = await fetch_all_enrollments()
    student_enr = [e for e in all_enr if e.get("student_id") == student_id]
    return student_enr


async def fetch_student_grades(student_id: int) -> dict:
    """Retorna un mapa {enrollment_id: average} para un estudiante."""
    all_enr = await fetch_all_enrollments()
    student_enr = [e for e in all_enr if e.get("student_id") == student_id]
    grades_map = {}
    # Buscar notas en cada curso donde está inscrito
    course_ids = list({e["course_id"] for e in student_enr})
    for cid in course_ids:
        grades = await fetch_grades_for_course(cid)
        for g in grades:
            if g.get("student_id") == student_id:
                grades_map[g.get("enrollment_id")] = g.get("average")
    return grades_map


async def fetch_courses_by_teacher(teacher_id: int) -> list:
    """Retorna los cursos asignados a un docente."""
    all_courses = await fetch_courses()
    return [c for c in all_courses if c.get("teacher_id") == teacher_id]
