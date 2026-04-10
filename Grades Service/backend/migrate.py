import asyncio
import sys
import os

# Ensure the root app dir is in path if needed
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.models import Grade
from app.routers.grades import _notify_student_service

async def run_migration():
    db = SessionLocal()
    grades = db.query(Grade).filter(Grade.status.in_(["PASSED", "FAILED"])).all()
    count = 0
    for grade in grades:
        print(f"Migrating grade {grade.id} for student {grade.student_id} (Course {grade.course_id})")
        await _notify_student_service(grade)
        count += 1
    print(f"Migrated {count} historic grades.")

if __name__ == "__main__":
    asyncio.run(run_migration())
