"""
user_sync.py
Sincronización interna entre Auth Service y User Service.
Las llamadas son tolerantes a fallos: si el User Service no está disponible,
se registra el error en el log pero la operación principal continúa.
"""

import logging
import os
from typing import Any, Optional

import httpx
from dotenv import load_dotenv
from app.security import create_access_token

load_dotenv()

logger = logging.getLogger(__name__)

USER_SERVICE_URL = os.getenv("USER_SERVICE_URL", "http://user_backend:8000")
TIMEOUT = 5.0  # segundos


def _get_auth_header() -> dict:
    """Genera un token de servicio para comunicación interna."""
    # Usamos un ID ficticio 0 y rol admin para la sincronización interna
    token = create_access_token(user_id=0, email="system@sgau.internal", role="admin")
    return {"Authorization": f"Bearer {token}"}

def _build_profile(user: Any, user_id: int) -> dict:
    """Construye el payload de perfil incluyendo el ID compartido."""
    return {
        "id": user_id,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "email": user.email,
        "phone": user.phone,
        "document_type": user.document_type if isinstance(user.document_type, str) else user.document_type.value,
        "document_number": user.document_number,
        "role": user.role if isinstance(user.role, str) else user.role.value,
        "academic_program": getattr(user, "academic_program", None),
    }


async def sync_create_user(user_data: Any, user_id: int) -> None:
    """
    Crea el perfil del usuario en el User Service con un ID compartido.
    TOLERANTE A FALLOS: si el User Service falla, el registro en Auth continúa.
    """
    url = f"{USER_SERVICE_URL}/users/"
    payload = _build_profile(user_data, user_id)
    headers = _get_auth_header()
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            response = await client.post(url, json=payload, headers=headers)
            if response.status_code not in (200, 201):
                logger.warning(
                    "[user_sync] sync_create_user falló — status=%s body=%s",
                    response.status_code,
                    response.text,
                )
            else:
                logger.info(
                    "[user_sync] Perfil creado en User Service para user_id=%s", user_id
                )
    except httpx.RequestError as exc:
        logger.error("[user_sync] sync_create_user error de red: %s", exc)
    except Exception as exc:
        logger.error("[user_sync] sync_create_user error inesperado: %s", exc)


async def sync_update_user(user_id: int, update_data: dict) -> None:
    """
    Actualiza el perfil del usuario en el User Service.
    Se llama después de que el Auth Service actualiza exitosamente un usuario.
    `update_data` debe ser un dict con sólo los campos que cambiaron.
    """
    url = f"{USER_SERVICE_URL}/users/{user_id}"
    # Convertir Enums a string si los hay
    serialized = {
        k: (v.value if hasattr(v, "value") else v)
        for k, v in update_data.items()
    }
    headers = _get_auth_header()
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            response = await client.put(url, json=serialized, headers=headers)
            if response.status_code not in (200, 201):
                logger.warning(
                    "[user_sync] sync_update_user falló — user_id=%s status=%s body=%s",
                    user_id,
                    response.status_code,
                    response.text,
                )
            else:
                logger.info(
                    "[user_sync] Perfil actualizado en User Service para user_id=%s", user_id
                )
    except httpx.RequestError as exc:
        logger.error("[user_sync] sync_update_user error de red: %s", exc)


async def sync_delete_user(user_id: int) -> None:
    """
    Elimina el perfil del usuario en el User Service.
    Se llama después de que el Auth Service elimina exitosamente un usuario.
    """
    url = f"{USER_SERVICE_URL}/users/{user_id}"
    headers = _get_auth_header()
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            response = await client.delete(url, headers=headers)
            if response.status_code not in (200, 204):
                logger.warning(
                    "[user_sync] sync_delete_user falló — user_id=%s status=%s body=%s",
                    user_id,
                    response.status_code,
                    response.text,
                )
            else:
                logger.info(
                    "[user_sync] Perfil eliminado en User Service para user_id=%s", user_id
                )
    except httpx.RequestError as exc:
        logger.error("[user_sync] sync_delete_user error de red: %s", exc)


async def get_user_profile(user_id: int) -> Optional[dict]:
    """
    Obtiene el perfil del usuario desde el User Service.
    Se usa para combinar datos de identidad con datos biográficos.
    """
    url = f"{USER_SERVICE_URL}/users/{user_id}"
    headers = _get_auth_header()
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            response = await client.get(url, headers=headers)
            if response.status_code == 200:
                return response.json()
            else:
                logger.warning(
                    "[user_sync] get_user_profile falló — user_id=%s status=%s",
                    user_id,
                    response.status_code,
                )
                return None
    except httpx.RequestError as exc:
        logger.error("[user_sync] get_user_profile error de red: %s", exc)
        return None
