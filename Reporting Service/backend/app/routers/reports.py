from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from app.security import check_admin, get_current_user, TokenPayload
from app import data_fetcher, report_generator

router = APIRouter(prefix="/reports", tags=["Reports"])

fmt = lambda s: s.encode("utf-8")


# ─── REPORTE ACADÉMICO ────────────────────────────────────────────────────────

@router.get("/academic/pdf", summary="Reporte académico general (PDF)")
async def academic_pdf(_admin: TokenPayload = Depends(check_admin)):
    """Descarga un PDF con todos los estudiantes, sus materias, estados y notas."""
    try:
        users = await data_fetcher.fetch_users()
        enrollments = await data_fetcher.fetch_all_enrollments()

        # Construir mapa de notas por enrollment_id
        grades_map = {}
        courses = await data_fetcher.fetch_courses()
        for c in courses:
            grades = await data_fetcher.fetch_grades_for_course(c["id"])
            for g in grades:
                grades_map[g.get("enrollment_id")] = g.get("average")

        pdf_bytes = report_generator.generate_academic_pdf(users, enrollments, grades_map)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=reporte_academico.pdf"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generando reporte: {str(e)}")


@router.get("/academic/csv", summary="Reporte académico general (CSV)")
async def academic_csv(_admin: TokenPayload = Depends(check_admin)):
    """Descarga un CSV con todos los estudiantes, sus materias, estados y notas."""
    try:
        users = await data_fetcher.fetch_users()
        enrollments = await data_fetcher.fetch_all_enrollments()
        grades_map = {}
        courses = await data_fetcher.fetch_courses()
        for c in courses:
            grades = await data_fetcher.fetch_grades_for_course(c["id"])
            for g in grades:
                grades_map[g.get("enrollment_id")] = g.get("average")

        csv_str = report_generator.generate_academic_csv(users, enrollments, grades_map)
        return Response(
            content=fmt(csv_str),
            media_type="text/csv; charset=utf-8",
            headers={"Content-Disposition": "attachment; filename=reporte_academico.csv"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generando reporte: {str(e)}")


# ─── REPORTE FINANCIERO ───────────────────────────────────────────────────────

@router.get("/financial/pdf", summary="Reporte financiero general (PDF)")
async def financial_pdf(_admin: TokenPayload = Depends(check_admin)):
    """Descarga un PDF con el estado de todos los pagos del sistema."""
    try:
        users = await data_fetcher.fetch_users()
        enrollments = await data_fetcher.fetch_all_enrollments()
        pdf_bytes = report_generator.generate_financial_pdf(users, enrollments)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=reporte_financiero.pdf"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generando reporte: {str(e)}")


@router.get("/financial/csv", summary="Reporte financiero general (CSV)")
async def financial_csv(_admin: TokenPayload = Depends(check_admin)):
    """Descarga un CSV con el estado de todos los pagos del sistema."""
    try:
        users = await data_fetcher.fetch_users()
        enrollments = await data_fetcher.fetch_all_enrollments()
        csv_str = report_generator.generate_financial_csv(users, enrollments)
        return Response(
            content=fmt(csv_str),
            media_type="text/csv; charset=utf-8",
            headers={"Content-Disposition": "attachment; filename=reporte_financiero.csv"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generando reporte: {str(e)}")


# ─── REPORTE POR CURSO ────────────────────────────────────────────────────────

@router.get("/course/{course_id}/pdf", summary="Reporte por materia (PDF)")
async def course_pdf(course_id: int, _admin: TokenPayload = Depends(check_admin)):
    """Descarga un PDF con todos los estudiantes de un curso y sus notas."""
    try:
        courses = await data_fetcher.fetch_courses()
        course = next((c for c in courses if c["id"] == course_id), None)
        if not course:
            raise HTTPException(status_code=404, detail="Materia no encontrada.")

        users = await data_fetcher.fetch_users()
        enrollments = await data_fetcher.fetch_all_enrollments()
        course_enrollments = [e for e in enrollments if e.get("course_id") == course_id]
        grades = await data_fetcher.fetch_grades_for_course(course_id)

        pdf_bytes = report_generator.generate_course_pdf(course, course_enrollments, users, grades)
        safe_name = course.get("name", f"curso_{course_id}").replace(" ", "_")
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=reporte_{safe_name}.pdf"}
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generando reporte: {str(e)}")


@router.get("/course/{course_id}/csv", summary="Reporte por materia (CSV)")
async def course_csv(course_id: int, _admin: TokenPayload = Depends(check_admin)):
    """Descarga un CSV con todos los estudiantes de un curso y sus notas."""
    try:
        courses = await data_fetcher.fetch_courses()
        course = next((c for c in courses if c["id"] == course_id), None)
        if not course:
            raise HTTPException(status_code=404, detail="Materia no encontrada.")

        users = await data_fetcher.fetch_users()
        enrollments = await data_fetcher.fetch_all_enrollments()
        course_enrollments = [e for e in enrollments if e.get("course_id") == course_id]
        grades = await data_fetcher.fetch_grades_for_course(course_id)

        csv_str = report_generator.generate_course_csv(course, course_enrollments, users, grades)
        safe_name = course.get("name", f"curso_{course_id}").replace(" ", "_")
        return Response(
            content=fmt(csv_str),
            media_type="text/csv; charset=utf-8",
            headers={"Content-Disposition": f"attachment; filename=reporte_{safe_name}.csv"}
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generando reporte: {str(e)}")


# ─── HEALTH ───────────────────────────────────────────────────────────────────

@router.get("/health", include_in_schema=False)
async def health():
    return {"status": "ok", "service": "Reporting Service"}


# ─── REPORTE PERSONAL ESTUDIANTE ─────────────────────────────────────────────

@router.get("/me/academic/pdf", summary="Mi reporte académico (PDF)")
async def my_academic_pdf(current_user=Depends(get_current_user)):
    """El estudiante descarga su propio reporte de materias y notas."""
    if current_user.role != "estudiante":
        raise HTTPException(status_code=403, detail="Solo estudiantes pueden acceder a este reporte.")
    try:
        users = await data_fetcher.fetch_users()
        student = next((u for u in users if u["id"] == current_user.sub), {})
        enrollments = await data_fetcher.fetch_student_enrollments(current_user.sub)
        grades_map = await data_fetcher.fetch_student_grades(current_user.sub)
        pdf_bytes = report_generator.generate_student_pdf(student, enrollments, grades_map)
        return Response(
            content=pdf_bytes, media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=mi_reporte_academico.pdf"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generando reporte: {str(e)}")


@router.get("/me/academic/csv", summary="Mi reporte académico (CSV)")
async def my_academic_csv(current_user=Depends(get_current_user)):
    """El estudiante descarga su propio reporte de materias y notas en CSV."""
    if current_user.role != "estudiante":
        raise HTTPException(status_code=403, detail="Solo estudiantes pueden acceder a este reporte.")
    try:
        users = await data_fetcher.fetch_users()
        student = next((u for u in users if u["id"] == current_user.sub), {})
        enrollments = await data_fetcher.fetch_student_enrollments(current_user.sub)
        grades_map = await data_fetcher.fetch_student_grades(current_user.sub)
        csv_str = report_generator.generate_student_csv(student, enrollments, grades_map)
        return Response(
            content=fmt(csv_str), media_type="text/csv; charset=utf-8",
            headers={"Content-Disposition": "attachment; filename=mi_reporte_academico.csv"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generando reporte: {str(e)}")


@router.get("/me/financial/pdf", summary="Mi reporte financiero (PDF)")
async def my_financial_pdf(current_user=Depends(get_current_user)):
    """El estudiante descarga su propio reporte financiero."""
    if current_user.role != "estudiante":
        raise HTTPException(status_code=403, detail="Solo estudiantes pueden acceder a este reporte.")
    try:
        users = await data_fetcher.fetch_users()
        student = next((u for u in users if u["id"] == current_user.sub), {})
        doc_num = student.get("document_number", "000")
        enrollments = await data_fetcher.fetch_student_enrollments(current_user.sub)
        pdf_bytes = report_generator.generate_student_financial_pdf(student, enrollments)
        return Response(
            content=pdf_bytes, media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=mi_reporte_financiero_{doc_num}.pdf"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generando reporte: {str(e)}")

@router.get("/me/financial/csv", summary="Mi reporte financiero (CSV)")
async def my_financial_csv(current_user=Depends(get_current_user)):
    """El estudiante descarga su propio reporte financiero en CSV."""
    if current_user.role != "estudiante":
        raise HTTPException(status_code=403, detail="Solo estudiantes pueden acceder a este reporte.")
    try:
        users = await data_fetcher.fetch_users()
        student = next((u for u in users if u["id"] == current_user.sub), {})
        doc_num = student.get("document_number", "000")
        enrollments = await data_fetcher.fetch_student_enrollments(current_user.sub)
        csv_str = report_generator.generate_student_financial_csv(student, enrollments)
        return Response(
            content=fmt(csv_str), media_type="text/csv; charset=utf-8",
            headers={"Content-Disposition": f"attachment; filename=mi_reporte_financiero_{doc_num}.csv"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generando reporte: {str(e)}")


# ─── REPORTE PERSONAL DOCENTE ─────────────────────────────────────────────────

@router.get("/me/courses/pdf", summary="Reporte de mis cursos (PDF)")
async def my_courses_pdf(current_user=Depends(get_current_user)):
    """El docente descarga el reporte de todos sus cursos con estudiantes y notas."""
    if current_user.role != "docente":
        raise HTTPException(status_code=403, detail="Solo docentes pueden acceder a este reporte.")
    try:
        users = await data_fetcher.fetch_users()
        teacher = next((u for u in users if u["id"] == current_user.sub), {})
        teacher_courses = await data_fetcher.fetch_courses_by_teacher(current_user.sub)
        all_enrollments = await data_fetcher.fetch_all_enrollments()
        user_map = {u["id"]: u for u in users}

        courses_data = []
        for c in teacher_courses:
            grades = await data_fetcher.fetch_grades_for_course(c["id"])
            grade_map = {g["enrollment_id"]: g.get("average") for g in grades}
            course_enr = [e for e in all_enrollments if e.get("course_id") == c["id"]]
            rows = []
            for e in course_enr:
                u = user_map.get(e["student_id"])
                rows.append({
                    "name": f"{u.get('first_name','')} {u.get('last_name','')}" if u else f"ID {e['student_id']}",
                    "doc": u.get("document_number", "-") if u else "-",
                    "status": e.get("status", "-"),
                    "grade": grade_map.get(e["id"])
                })
            courses_data.append({"course": c, "rows": rows})

        pdf_bytes = report_generator.generate_teacher_pdf(teacher, courses_data)
        return Response(
            content=pdf_bytes, media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=reporte_mis_cursos.pdf"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generando reporte: {str(e)}")


@router.get("/me/courses/csv", summary="Reporte de mis cursos (CSV)")
async def my_courses_csv(current_user=Depends(get_current_user)):
    """El docente descarga el reporte en CSV de todos sus cursos."""
    if current_user.role != "docente":
        raise HTTPException(status_code=403, detail="Solo docentes pueden acceder a este reporte.")
    try:
        users = await data_fetcher.fetch_users()
        teacher = next((u for u in users if u["id"] == current_user.sub), {})
        teacher_courses = await data_fetcher.fetch_courses_by_teacher(current_user.sub)
        all_enrollments = await data_fetcher.fetch_all_enrollments()
        user_map = {u["id"]: u for u in users}

        courses_data = []
        for c in teacher_courses:
            grades = await data_fetcher.fetch_grades_for_course(c["id"])
            grade_map = {g["enrollment_id"]: g.get("average") for g in grades}
            course_enr = [e for e in all_enrollments if e.get("course_id") == c["id"]]
            rows = []
            for e in course_enr:
                u = user_map.get(e["student_id"])
                rows.append({
                    "name": f"{u.get('first_name','')} {u.get('last_name','')}" if u else f"ID {e['student_id']}",
                    "doc": u.get("document_number", "-") if u else "-",
                    "status": e.get("status", "-"),
                    "grade": grade_map.get(e["id"])
                })
            courses_data.append({"course": c, "rows": rows})

        csv_str = report_generator.generate_teacher_csv(teacher, courses_data)
        return Response(
            content=fmt(csv_str), media_type="text/csv; charset=utf-8",
            headers={"Content-Disposition": "attachment; filename=reporte_mis_cursos.csv"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generando reporte: {str(e)}")

