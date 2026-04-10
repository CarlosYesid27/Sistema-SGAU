import enum

class UserRole(str, enum.Enum):
    admin = "admin"
    docente = "docente"
    estudiante = "estudiante"

class DocumentType(str, enum.Enum):
    cc = "C.C"
    ti = "T.I"
