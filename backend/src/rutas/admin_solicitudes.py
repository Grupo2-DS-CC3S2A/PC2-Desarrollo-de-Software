"""Endpoints HTTP del modulo administrativo de Mesa de Partes (HU04).

Expone las operaciones protegidas que permiten al administrador listar,
consultar, derivar y cambiar el estado de cualquier solicitud.
"""

from __future__ import annotations

import os
from typing import List
from fastapi import APIRouter, Depends, Header, status

from src.excepciones.errors import NoAutorizadoError
from src.logging_config import get_logger
from src.modelos.solicitud import (
    DerivacionInput,
    EstadoUpdateInput,
    Solicitud,
)
from src.servicios.solicitud_service import (
    SolicitudService,
    get_solicitud_service,
)

logger = get_logger(__name__)

router: APIRouter = APIRouter(
    prefix="/api/admin/solicitudes",
    tags=["admin", "mesa-de-partes"],
)


async def verificar_admin(
    x_admin_token: str | None = Header(default=None, alias="X-Admin-Token"),
) -> str:
    """Dependencia de autorizacion para el rol administrador.

    Valida un token secreto compartido configurable mediante la variable de
    entorno ADMIN_TOKEN.
    """
    esperado = os.getenv("ADMIN_TOKEN", "RENIEC_ADMIN_SUPER_SECRET_2026")
    if not x_admin_token or x_admin_token != esperado:
        raise NoAutorizadoError(
            "Se requiere un token administrativo valido para esta operacion."
        )
    return x_admin_token


@router.get(
    "",
    response_model=List[Solicitud],
    summary="Listar todas las solicitudes del sistema.",
)
async def listar_todas(
    servicio: SolicitudService = Depends(get_solicitud_service),
    _admin: str = Depends(verificar_admin),
) -> List[Solicitud]:
    """Retorna el listado completo de solicitudes para auditoria o gestion admin."""
    return servicio.listar()


@router.get(
    "/{solicitud_id}",
    response_model=Solicitud,
    summary="Consulta los detalles de una solicitud por su ID.",
)
async def obtener_solicitud(
    solicitud_id: str,
    servicio: SolicitudService = Depends(get_solicitud_service),
    _admin: str = Depends(verificar_admin),
) -> Solicitud:
    """Retorna los detalles de la solicitud de un ciudadano."""
    return servicio.obtener(solicitud_id)


@router.post(
    "/{solicitud_id}/derivar",
    response_model=Solicitud,
    summary="Deriva una solicitud a la dependencia correspondiente.",
)
async def derivar_solicitud(
    solicitud_id: str,
    payload: DerivacionInput,
    servicio: SolicitudService = Depends(get_solicitud_service),
    _admin: str = Depends(verificar_admin),
) -> Solicitud:
    """Deriva la solicitud a una dependencia interna."""
    solicitud = servicio.derivar(solicitud_id, payload)
    return solicitud


@router.put(
    "/{solicitud_id}/estado",
    response_model=Solicitud,
    summary="Actualiza el estado de la solicitud.",
)
async def actualizar_estado_solicitud(
    solicitud_id: str,
    payload: EstadoUpdateInput,
    servicio: SolicitudService = Depends(get_solicitud_service),
    _admin: str = Depends(verificar_admin),
) -> Solicitud:
    """Actualiza el estado (Pendiente, En Proceso, Atendida, Rechazada) de la solicitud."""
    solicitud = servicio.actualizar_estado(solicitud_id, payload)
    return solicitud
