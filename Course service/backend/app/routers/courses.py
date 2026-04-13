from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app import crud, models, schemas
from app.database import get_db
from app.security import check_admin, get_current_user, TokenPayload
from app.user_integration import verify_teacher

router = APIRouter(
    prefix="/courses",
    tags=["Courses"],
)

@router.post("/", response_model=schemas.CourseResponseSimple, status_code=status.HTTP_201_CREATED)
async def create_course(
    course: schemas.CourseCreate,
    _current_user: TokenPayload = Depends(check_admin),
    db: Session = Depends(get_db)
):
    """Crear una nueva materia (Solo Administradores)"""
    # Verificar si el nombre ya existe
    db_course = crud.get_course_by_name(db, name=course.name)
    if db_course:
        raise HTTPException(status_code=400, detail="Ya existe una materia con este nombre.")
        
    # Si tiene teacher_id, validar que exista y sea docente en el User Service
    if course.teacher_id is not None:
        await verify_teacher(course.teacher_id)
        
    new_course = crud.create_course(db=db, course=course)
    return new_course

@router.get("/", response_model=List[schemas.CourseResponseDetail])
async def list_courses(
    skip: int = 0, 
    limit: int = 100,
    _current_user: TokenPayload = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Listar todas las materias (Todos los autenticados)"""
    courses = crud.get_courses(db, skip=skip, limit=limit)
    if _current_user.role == "estudiante":
        courses = [c for c in courses if c.is_offered]
    return courses

@router.get("/{course_id}", response_model=schemas.CourseResponseDetail)
async def get_course(
    course_id: int,
    _current_user: TokenPayload = Depends(check_admin),
    db: Session = Depends(get_db)
):
    """Obtener detalle de una materia y sus prerrequisitos (Solo Administradores)"""
    db_course = crud.get_course(db, course_id=course_id)
    if db_course is None:
        raise HTTPException(status_code=404, detail="Materia no encontrada.")
        
    # Obtener el nombre del profesor desde User Service (Opcional, pero bueno para el detalle)
    teacher_name = None
    if db_course.teacher_id:
        try:
            teacher_data = await verify_teacher(db_course.teacher_id)
            teacher_name = f"{teacher_data.get('first_name')} {teacher_data.get('last_name')}"
        except HTTPException:
            teacher_name = "Docente Invalido/No Encontrado"
            
    response = schemas.CourseResponseDetail.model_validate(db_course)
    response.teacher_name = teacher_name
    return response

@router.put("/{course_id}", response_model=schemas.CourseResponseSimple)
async def update_course(
    course_id: int,
    course_update: schemas.CourseUpdate,
    _current_user: TokenPayload = Depends(check_admin),
    db: Session = Depends(get_db)
):
    """Modificar una materia (Solo Administradores)"""
    # Si están enviando un nuevo teacher_id, validarlo
    if course_update.teacher_id is not None:
        await verify_teacher(course_update.teacher_id)
        
    # Verificar si el nuevo nombre ya está tomado
    if course_update.name is not None:
        existing = crud.get_course_by_name(db, name=course_update.name)
        if existing and existing.id != course_id:
            raise HTTPException(status_code=400, detail="Este nombre de materia ya está en uso.")
            
    updated_course = crud.update_course(db, course_id=course_id, course_update=course_update)
    if updated_course is None:
        raise HTTPException(status_code=404, detail="Materia no encontrada.")
    return updated_course

@router.delete("/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_course(
    course_id: int,
    _current_user: TokenPayload = Depends(check_admin),
    db: Session = Depends(get_db)
):
    """Eliminar una materia (Solo Administradores)"""
    success = crud.delete_course(db, course_id)
    if not success:
        raise HTTPException(status_code=404, detail="Materia no encontrada.")
    return None

# --- Prerrequisitos ---

@router.post("/{course_id}/prerequisites", response_model=schemas.CourseResponseDetail)
async def add_prerequisite(
    course_id: int,
    prerequisite_data: schemas.PrerequisiteCreate,
    _current_user: TokenPayload = Depends(check_admin),
    db: Session = Depends(get_db)
):
    """Añadir un prerrequisito a una materia (Solo Administradores)"""
    try:
        updated_course = crud.add_prerequisite(db, course_id, prerequisite_data.prerequisite_id)
        return schemas.CourseResponseDetail.model_validate(updated_course)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{course_id}/prerequisites/{prereq_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_prerequisite(
    course_id: int,
    prereq_id: int,
    _current_user: TokenPayload = Depends(check_admin),
    db: Session = Depends(get_db)
):
    """Eliminar un prerrequisito de una materia (Solo Administradores)"""
    success = crud.remove_prerequisite(db, course_id, prereq_id)
    if not success:
        raise HTTPException(status_code=404, detail="Relación de prerrequisito no encontrada.")
    return None
