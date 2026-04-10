from sqlalchemy.orm import Session
from app import models, schemas
from fastapi import HTTPException

# --- COURSES ---

def get_courses(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Course).offset(skip).limit(limit).all()

def get_course(db: Session, course_id: int):
    return db.query(models.Course).filter(models.Course.id == course_id).first()

def get_course_by_name(db: Session, name: str):
    return db.query(models.Course).filter(models.Course.name == name).first()

def create_course(db: Session, course: schemas.CourseCreate):
    db_course = models.Course(**course.model_dump())
    db.add(db_course)
    db.commit()
    db.refresh(db_course)
    return db_course

def update_course(db: Session, course_id: int, course_update: schemas.CourseUpdate):
    db_course = get_course(db, course_id)
    if not db_course:
        return None
        
    update_data = course_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_course, key, value)
        
    db.commit()
    db.refresh(db_course)
    return db_course

def delete_course(db: Session, course_id: int):
    db_course = get_course(db, course_id)
    if db_course:
        db.delete(db_course)
        db.commit()
        return True
    return False

# --- PREREQUISITES ---

def add_prerequisite(db: Session, course_id: int, prerequisite_id: int):
    # Validar que no se agregue a sí mismo
    if course_id == prerequisite_id:
        raise ValueError("Una materia no puede ser prerrequisito de sí misma.")
        
    db_course = get_course(db, course_id)
    db_prereq = get_course(db, prerequisite_id)
    
    if not db_course or not db_prereq:
        raise ValueError("Materia principal o prerrequisito no existe.")
        
    # Verificar si ya existe
    existing = db.query(models.CoursePrerequisite).filter(
        models.CoursePrerequisite.course_id == course_id,
        models.CoursePrerequisite.prerequisite_id == prerequisite_id
    ).first()
    
    if existing:
        return db_course
        
    new_prereq = models.CoursePrerequisite(
        course_id=course_id,
        prerequisite_id=prerequisite_id
    )
    db.add(new_prereq)
    db.commit()
    db.refresh(db_course)
    return db_course

def remove_prerequisite(db: Session, course_id: int, prerequisite_id: int):
    db_prereq = db.query(models.CoursePrerequisite).filter(
        models.CoursePrerequisite.course_id == course_id,
        models.CoursePrerequisite.prerequisite_id == prerequisite_id
    ).first()
    
    if db_prereq:
        db.delete(db_prereq)
        db.commit()
        return True
    return False
