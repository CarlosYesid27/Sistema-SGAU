from sqlalchemy.orm import Session
from app import models, schemas

def get_or_create_record(db: Session, student_id: int):
    record = db.query(models.AcademicRecord).filter(models.AcademicRecord.student_id == student_id).first()
    if not record:
        record = models.AcademicRecord(student_id=student_id)
        db.add(record)
        db.commit()
        db.refresh(record)
    return record

def recalculate_record(db: Session, student_id: int):
    record = get_or_create_record(db, student_id)
    history = db.query(models.AcademicHistory).filter(models.AcademicHistory.student_id == student_id).all()
    
    total_credits = 0
    total_points = 0.0
    passed_credits = 0
    
    for h in history:
        total_credits += h.credits
        total_points += h.final_grade * h.credits
        if h.passed:
            passed_credits += h.credits
            
    record.cumulative_gpa = round(total_points / total_credits, 2) if total_credits > 0 else 0.0
    record.total_credits_earned = passed_credits
    
    db.commit()
    db.refresh(record)
    return record

def add_history_entry(db: Session, entry: schemas.AcademicHistoryCreate):
    # Ensure record exists
    get_or_create_record(db, entry.student_id)
    
    # Check if a history entry already exists for this course to avoid duplicates if re-taken/re-passed
    existing = db.query(models.AcademicHistory).filter(
        models.AcademicHistory.student_id == entry.student_id,
        models.AcademicHistory.course_id == entry.course_id
    ).first()
    
    if existing:
        existing.final_grade = entry.final_grade
        existing.passed = entry.passed
        existing.term_name = entry.term_name
        existing.credits = entry.credits
        existing.course_name = entry.course_name
    else:
        new_entry = models.AcademicHistory(
            student_id=entry.student_id,
            course_id=entry.course_id,
            course_name=entry.course_name,
            term_name=entry.term_name,
            final_grade=entry.final_grade,
            credits=entry.credits,
            passed=entry.passed
        )
        db.add(new_entry)
        
    db.commit()
    
    return recalculate_record(db, entry.student_id)

def get_record(db: Session, student_id: int):
    return get_or_create_record(db, student_id)
