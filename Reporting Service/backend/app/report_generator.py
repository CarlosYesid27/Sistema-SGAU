import io
import csv
from datetime import datetime
from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT


# ─── Paleta de colores SGAU ──────────────────────────────────────────────────
SGAU_BLUE = colors.HexColor("#1e3a5f")
SGAU_ACCENT = colors.HexColor("#3b82f6")
SGAU_LIGHT = colors.HexColor("#eff6ff")
SGAU_GRAY = colors.HexColor("#64748b")
SGAU_GREEN = colors.HexColor("#059669")
SGAU_RED = colors.HexColor("#dc2626")

# ─── Traducción de estados ────────────────────────────────────────────────────
STATUS_ES = {
    "ENROLLED": "Inscrito",
    "PENDING": "Pago Pendiente",
    "PASSED": "Aprobado",
    "FAILED": "Reprobado",
    "CANCELLED": "Cancelado",
    "PAID": "Pagado",
    "PENDING_PAYMENT": "Pago Pendiente",
    "IN_PROGRESS": "En curso",
}

def t(status: str) -> str:
    """Traduce un estado en inglés al español."""
    return STATUS_ES.get(str(status), status)

styles = getSampleStyleSheet()
title_style = ParagraphStyle("sgau_title", parent=styles["Title"], textColor=SGAU_BLUE, fontSize=18, spaceAfter=6)
subtitle_style = ParagraphStyle("sgau_sub", parent=styles["Normal"], textColor=SGAU_GRAY, fontSize=10, spaceAfter=16)
header_style = ParagraphStyle("sgau_hdr", parent=styles["Normal"], textColor=colors.white, fontSize=9, fontName="Helvetica-Bold")


def _base_table_style(header_rows: int = 1):
    return TableStyle([
        ("BACKGROUND", (0, 0), (-1, header_rows - 1), SGAU_BLUE),
        ("TEXTCOLOR", (0, 0), (-1, header_rows - 1), colors.white),
        ("FONTNAME", (0, 0), (-1, header_rows - 1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, header_rows - 1), 9),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ROWBACKGROUNDS", (0, header_rows), (-1, -1), [colors.white, SGAU_LIGHT]),
        ("FONTSIZE", (0, header_rows), (-1, -1), 8),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#e2e8f0")),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ])


def _status_color(status: str) -> str:
    mapping = {
        "ENROLLED": "#059669", "PASSED": "#7c3aed", "FAILED": "#dc2626",
        "PENDING": "#b45309", "CANCELLED": "#6b7280", "PAID": "#059669",
        "PENDING_PAYMENT": "#b45309",
    }
    return mapping.get(status, "#334155")


# ─── GENERADORES PDF ─────────────────────────────────────────────────────────

def generate_academic_pdf(users: list, enrollments: list, grades_map: dict) -> bytes:
    """Reporte académico general: todos los estudiantes, materias y notas."""
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=landscape(letter),
                            leftMargin=0.5*inch, rightMargin=0.5*inch,
                            topMargin=0.6*inch, bottomMargin=0.4*inch)

    students = {u["id"]: u for u in users if u.get("role") == "estudiante"}
    now = datetime.now().strftime("%d/%m/%Y %H:%M")

    elements = [
        Paragraph("SGAU · Reporte Académico General", title_style),
        Paragraph(f"Generado el {now}  ·  Total estudiantes: {len(students)}", subtitle_style),
    ]

    headers = ["Estudiante", "Documento", "Materia", "Créditos", "Estado Inscripción", "Nota Final"]
    data = [headers]

    for e in enrollments:
        sid = e.get("student_id")
        u = students.get(sid)
        student_name = f"{u.get('first_name','')} {u.get('last_name','')}" if u else f"ID {sid}"
        doc_num = u.get("document_number", "-") if u else "-"
        grade_val = grades_map.get(e.get("id"), "-")
        note_str = str(round(grade_val, 2)) if isinstance(grade_val, (int, float)) else "-"
        data.append([
            student_name, doc_num, e.get("course_name", "-"),
            str(e.get("course_credits", "-")),
            t(e.get("status", "-")), note_str
        ])

    if len(data) == 1:
        data.append(["Sin datos registrados", "", "", "", "", ""])

    col_widths = [2.2*inch, 1.2*inch, 2.4*inch, 0.8*inch, 1.5*inch, 0.9*inch]
    tbl = Table(data, colWidths=col_widths, repeatRows=1)
    tbl.setStyle(_base_table_style())
    elements.append(tbl)
    doc.build(elements)
    return buf.getvalue()


def generate_financial_pdf(users: list, enrollments: list) -> bytes:
    """Reporte financiero: estado de pagos por estudiante."""
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=landscape(letter),
                            leftMargin=0.5*inch, rightMargin=0.5*inch,
                            topMargin=0.6*inch, bottomMargin=0.4*inch)

    student_map = {u["id"]: u for u in users if u.get("role") == "estudiante"}
    now = datetime.now().strftime("%d/%m/%Y %H:%M")

    elements = [
        Paragraph("SGAU · Reporte Financiero General", title_style),
        Paragraph(f"Generado el {now}", subtitle_style),
    ]

    fmt = lambda n: f"${int(n):,}".replace(",", ".") if n else "-"
    headers = ["Estudiante", "Documento", "Materia", "Créditos", "Monto", "Estado Pago", "Vencimiento"]
    data = [headers]

    for e in enrollments:
        payment = e.get("payment")
        if not payment:
            continue
        sid = e.get("student_id")
        u = student_map.get(sid)
        student_name = f"{u.get('first_name','')} {u.get('last_name','')}" if u else f"ID {sid}"
        doc_num = u.get("document_number", "-") if u else "-"
        due = payment.get("due_date", "-")
        if due and due != "-":
            due = due[:10]
        data.append([
            student_name, doc_num, e.get("course_name", "-"),
            str(e.get("course_credits", "-")),
            fmt(payment.get("amount")),
            t(payment.get("status", "-")), due
        ])

    if len(data) == 1:
        data.append(["Sin datos registrados", "", "", "", "", "", ""])

    col_widths = [2.0*inch, 1.2*inch, 2.0*inch, 0.8*inch, 1.0*inch, 1.4*inch, 1.0*inch]
    tbl = Table(data, colWidths=col_widths, repeatRows=1)
    tbl.setStyle(_base_table_style())
    elements.append(tbl)
    doc.build(elements)
    return buf.getvalue()


def generate_course_pdf(course: dict, enrollments: list, users: list, grades: list) -> bytes:
    """Reporte por materia: todos los estudiantes inscritos con notas."""
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=letter,
                            leftMargin=0.5*inch, rightMargin=0.5*inch,
                            topMargin=0.6*inch, bottomMargin=0.4*inch)

    user_map = {u["id"]: u for u in users}
    grade_map = {g["enrollment_id"]: g.get("average") for g in grades}
    now = datetime.now().strftime("%d/%m/%Y %H:%M")

    elements = [
        Paragraph(f"SGAU · Reporte de Materia: {course.get('name','')}", title_style),
        Paragraph(
            f"Créditos: {course.get('credits','-')}  ·  Horario: {course.get('schedule','-')}  ·  Generado: {now}",
            subtitle_style
        ),
    ]

    headers = ["Estudiante", "Documento", "Estado", "Nota Final"]
    data = [headers]
    for e in enrollments:
        sid = e.get("student_id")
        u = user_map.get(sid)
        name = f"{u.get('first_name','')} {u.get('last_name','')}" if u else f"ID {sid}"
        doc_num = u.get("document_number", "-") if u else "-"
        g_val = grade_map.get(e.get("id"))
        note_str = str(round(g_val, 2)) if isinstance(g_val, (int, float)) else "-"
        data.append([name, doc_num, t(e.get("status", "-")), note_str])

    if len(data) == 1:
        data.append(["Sin estudiantes inscritos", "", "", ""])

    col_widths = [2.8*inch, 1.4*inch, 1.4*inch, 1.0*inch]
    tbl = Table(data, colWidths=col_widths, repeatRows=1)
    tbl.setStyle(_base_table_style())
    elements.append(tbl)
    doc.build(elements)
    return buf.getvalue()


# ─── GENERADORES CSV ─────────────────────────────────────────────────────────

def generate_academic_csv(users: list, enrollments: list, grades_map: dict) -> str:
    buf = io.StringIO()
    w = csv.writer(buf)
    students = {u["id"]: u for u in users if u.get("role") == "estudiante"}
    w.writerow(["Estudiante", "Documento", "Materia", "Créditos", "Estado Inscripción", "Nota Final"])
    for e in enrollments:
        sid = e.get("student_id")
        u = students.get(sid)
        name = f"{u.get('first_name','')} {u.get('last_name','')}" if u else f"ID {sid}"
        g_val = grades_map.get(e.get("id"))
        note_str = str(round(g_val, 2)) if isinstance(g_val, (int, float)) else "-"
        w.writerow([
            name, u.get("document_number", "-") if u else "-",
            e.get("course_name", "-"), e.get("course_credits", "-"),
            t(e.get("status", "-")), note_str
        ])
    return buf.getvalue()


def generate_financial_csv(users: list, enrollments: list) -> str:
    buf = io.StringIO()
    w = csv.writer(buf)
    student_map = {u["id"]: u for u in users if u.get("role") == "estudiante"}
    w.writerow(["Estudiante", "Documento", "Materia", "Créditos", "Monto (COP)", "Estado Pago", "Vencimiento"])
    for e in enrollments:
        payment = e.get("payment")
        if not payment:
            continue
        sid = e.get("student_id")
        u = student_map.get(sid)
        name = f"{u.get('first_name','')} {u.get('last_name','')}" if u else f"ID {sid}"
        due = (payment.get("due_date") or "-")[:10]
        w.writerow([
            name, u.get("document_number", "-") if u else "-",
            e.get("course_name", "-"), e.get("course_credits", "-"),
            payment.get("amount", "-"), t(payment.get("status", "-")), due
        ])
    return buf.getvalue()


def generate_course_csv(course: dict, enrollments: list, users: list, grades: list) -> str:
    buf = io.StringIO()
    w = csv.writer(buf)
    user_map = {u["id"]: u for u in users}
    grade_map = {g["enrollment_id"]: g.get("average") for g in grades}
    w.writerow(["Materia", "Créditos", "Horario"])
    w.writerow([course.get("name"), course.get("credits"), course.get("schedule", "-")])
    w.writerow([])
    w.writerow(["Estudiante", "Documento", "Estado", "Nota Final"])
    for e in enrollments:
        sid = e.get("student_id")
        u = user_map.get(sid)
        name = f"{u.get('first_name','')} {u.get('last_name','')}" if u else f"ID {sid}"
        g_val = grade_map.get(e.get("id"))
        note_str = str(round(g_val, 2)) if isinstance(g_val, (int, float)) else "-"
        w.writerow([name, u.get("document_number", "-") if u else "-",
                    t(e.get("status", "-")), note_str])
    return buf.getvalue()


# ─── REPORTE PERSONAL DEL ESTUDIANTE ─────────────────────────────────────────

def generate_student_pdf(student: dict, enrollments: list, grades_map: dict) -> bytes:
    """Reporte personal del estudiante: sus materias, estados y notas."""
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=letter,
                            leftMargin=0.5*inch, rightMargin=0.5*inch,
                            topMargin=0.6*inch, bottomMargin=0.4*inch)
    now = datetime.now().strftime("%d/%m/%Y %H:%M")
    full_name = f"{student.get('first_name', '')} {student.get('last_name', '')}"
    elements = [
        Paragraph(f"SGAU · Reporte Académico Personal", title_style),
        Paragraph(f"Estudiante: {full_name}  ·  Doc.: {student.get('document_number', '-')}  ·  Generado: {now}", subtitle_style),
    ]
    headers = ["Materia", "Créditos", "Estado", "Nota Final"]
    data = [headers]
    for e in enrollments:
        g_val = grades_map.get(e.get("id"))
        note_str = str(round(g_val, 2)) if isinstance(g_val, (int, float)) else "-"
        data.append([
            e.get("course_name", "-"), str(e.get("course_credits", "-")),
            t(e.get("status", "-")), note_str
        ])
    if len(data) == 1:
        data.append(["Sin materias registradas", "", "", ""])
    col_widths = [3.0*inch, 1.0*inch, 1.4*inch, 1.0*inch]
    tbl = Table(data, colWidths=col_widths, repeatRows=1)
    tbl.setStyle(_base_table_style())
    elements.append(tbl)
    doc.build(elements)
    return buf.getvalue()


def generate_student_csv(student: dict, enrollments: list, grades_map: dict) -> str:
    buf = io.StringIO()
    w = csv.writer(buf)
    full_name = f"{student.get('first_name', '')} {student.get('last_name', '')}"
    w.writerow(["Estudiante", "Documento"])
    w.writerow([full_name, student.get("document_number", "-")])
    w.writerow([])
    w.writerow(["Materia", "Créditos", "Estado", "Nota Final"])
    for e in enrollments:
        g_val = grades_map.get(e.get("id"))
        note_str = str(round(g_val, 2)) if isinstance(g_val, (int, float)) else "-"
        w.writerow([
            e.get("course_name", "-"), e.get("course_credits", "-"),
            t(e.get("status", "-")), note_str
        ])
    return buf.getvalue()


# ─── REPORTE DEL DOCENTE (sus materias + sus estudiantes) ────────────────────

def generate_teacher_pdf(teacher: dict, courses_data: list) -> bytes:
    """
    courses_data: lista de dicts con claves
      {course, enrollments: [{...e, student_name, doc_num, grade}], ...}
    """
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=landscape(letter),
                            leftMargin=0.5*inch, rightMargin=0.5*inch,
                            topMargin=0.6*inch, bottomMargin=0.4*inch)
    now = datetime.now().strftime("%d/%m/%Y %H:%M")
    full_name = f"{teacher.get('first_name', '')} {teacher.get('last_name', '')}"
    elements = [
        Paragraph(f"SGAU · Reporte Docente", title_style),
        Paragraph(f"Docente: {full_name}  ·  Generado: {now}", subtitle_style),
    ]
    for cd in courses_data:
        c = cd["course"]
        elements.append(Paragraph(
            f"<b>{c.get('name', '')}</b> · {c.get('credits', '-')} créditos · Horario: {c.get('schedule', 'Por asignar')}",
            subtitle_style
        ))
        headers = ["Estudiante", "Documento", "Estado", "Nota Final"]
        data = [headers]
        for row in cd.get("rows", []):
            g_val = row.get("grade")
            note_str = str(round(g_val, 2)) if isinstance(g_val, (int, float)) else "-"
            data.append([row.get("name", "-"), row.get("doc", "-"), t(row.get("status", "-")), note_str])
        if len(data) == 1:
            data.append(["Sin estudiantes inscritos", "", "", ""])
        col_widths = [2.8*inch, 1.4*inch, 1.4*inch, 1.0*inch]
        tbl = Table(data, colWidths=col_widths, repeatRows=1)
        tbl.setStyle(_base_table_style())
        elements.append(tbl)
        elements.append(Spacer(1, 16))
    doc.build(elements)
    return buf.getvalue()


def generate_teacher_csv(teacher: dict, courses_data: list) -> str:
    buf = io.StringIO()
    w = csv.writer(buf)
    full_name = f"{teacher.get('first_name', '')} {teacher.get('last_name', '')}"
    w.writerow(["Docente", full_name])
    for cd in courses_data:
        c = cd["course"]
        w.writerow([])
        w.writerow(["Materia", c.get("name"), "Créditos", c.get("credits"), "Horario", c.get("schedule", "-")])
        w.writerow(["Estudiante", "Documento", "Estado", "Nota Final"])
        for row in cd.get("rows", []):
            g_val = row.get("grade")
            note_str = str(round(g_val, 2)) if isinstance(g_val, (int, float)) else "-"
            w.writerow([row.get("name", "-"), row.get("doc", "-"), t(row.get("status", "-")), note_str])
    return buf.getvalue()

def generate_student_financial_pdf(student: dict, enrollments: list) -> bytes:
    """Reporte personal financiero del estudiante: estados de pagos vinculados a sus materias."""
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=landscape(letter),
                            leftMargin=0.5*inch, rightMargin=0.5*inch,
                            topMargin=0.6*inch, bottomMargin=0.4*inch)
    now = datetime.now().strftime("%d/%m/%Y %H:%M")
    full_name = f"{student.get('first_name', '')} {student.get('last_name', '')}"
    elements = [
        Paragraph(f"SGAU · Reporte Financiero Personal", title_style),
        Paragraph(f"Estudiante: {full_name}  ·  Doc.: {student.get('document_number', '-')}  ·  Generado: {now}", subtitle_style),
    ]
    
    fmt = lambda n: f"${int(n):,}".replace(",", ".") if n else "-"
    headers = ["Materia", "Créditos", "Monto (COP)", "Estado Pago", "Vencimiento"]
    data = [headers]
    for e in enrollments:
        payment = e.get("payment")
        if not payment:
            continue
        due = payment.get("due_date", "-")
        if due and due != "-":
            due = due[:10]
        data.append([
            e.get("course_name", "-"), str(e.get("course_credits", "-")),
            fmt(payment.get("amount")),
            t(payment.get("status", "-")), due
        ])
        
    if len(data) == 1:
        data.append(["Sin pagos registrados", "", "", "", ""])
        
    col_widths = [3.0*inch, 1.0*inch, 1.6*inch, 1.6*inch, 1.4*inch]
    tbl = Table(data, colWidths=col_widths, repeatRows=1)
    tbl.setStyle(_base_table_style())
    elements.append(tbl)
    doc.build(elements)
    return buf.getvalue()

def generate_student_financial_csv(student: dict, enrollments: list) -> str:
    buf = io.StringIO()
    w = csv.writer(buf)
    full_name = f"{student.get('first_name', '')} {student.get('last_name', '')}"
    w.writerow(["Estudiante", "Documento"])
    w.writerow([full_name, student.get("document_number", "-")])
    w.writerow([])
    w.writerow(["Materia", "Créditos", "Monto (COP)", "Estado Pago", "Vencimiento"])
    for e in enrollments:
        payment = e.get("payment")
        if not payment:
            continue
        due = (payment.get("due_date") or "-")[:10]
        w.writerow([
            e.get("course_name", "-"), e.get("course_credits", "-"),
            payment.get("amount", "-"), t(payment.get("status", "-")), due
        ])
    return buf.getvalue()

