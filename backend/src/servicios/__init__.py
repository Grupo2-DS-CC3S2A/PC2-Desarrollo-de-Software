"""Servicios de dominio (logica de negocio)."""

from src.servicios.solicitud_service import (
    SolicitudService,
    get_solicitud_service,
)

__all__ = [
    "SolicitudService",
    "get_solicitud_service",
]
