"""Endpoints HTTP para el portal de Ciudadano de Mesa de Partes.

Expone operaciones que permiten al ciudadano registrar nuevas solicitudes
y consultar su estado mediante ID de solicitud o su DNI.
"""

from __future__ import annotations

from typing import List
from fastapi import APIRouter, Depends, status

from src.logging_config import get_logger
from src.modelos.solicitud import Solicitud, SolicitudInput
from src.servicios.solicitud_service import (
    SolicitudService,
    get_solicitud_service,
)

logger = get_logger(__name__)

router: APIRouter = APIRouter(
    prefix="/api/solicitudes",
    tags=["ciudadano", "mesa-de-partes"],
)


@router.post(
    "",
    response_model=Solicitud,
    status_code=status.HTTP_201_CREATED,
    summary="Registra una nueva solicitud de Mesa de Partes.",
)
async def registrar_solicitud(
    payload: SolicitudInput,
    servicio: SolicitudService = Depends(get_solicitud_service),
) -> Solicitud:
    """Registra la solicitud del ciudadano.

    Calcula la fecha maxima de respuesta utilizando el patron Strategy
    segun la prioridad y notifica a los observadores.
    """
    solicitud = servicio.crear_solicitud(payload)
    return solicitud


@router.get(
    "/{solicitud_id}",
    response_model=Solicitud,
    summary="Consulta una solicitud por su ID.",
)
async def obtener_solicitud(
    solicitud_id: str,
    servicio: SolicitudService = Depends(get_solicitud_service),
) -> Solicitud:
    """Recupera los datos de una solicitud por su ID."""
    return servicio.obtener(solicitud_id)


@router.get(
    "/usuario/{usuario_id}",
    response_model=List[Solicitud],
    summary="Lista todas las solicitudes asociadas a un DNI de ciudadano.",
)
async def listar_solicitudes_por_usuario(
    usuario_id: str,
    servicio: SolicitudService = Depends(get_solicitud_service),
) -> List[Solicitud]:
    """Lista las solicitudes del ciudadano utilizando su DNI."""
    return servicio.listar_por_usuario(usuario_id)
