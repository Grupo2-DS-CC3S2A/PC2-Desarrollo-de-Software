"""Modelos Pydantic del dominio."""

from src.modelos.solicitud import (
    Dependencia,
    DerivacionInput,
    EstadoSolicitud,
    Prioridad,
    TipoTramite,
    Solicitud,
    SolicitudDerivada,
    SolicitudInput,
    EstadoUpdateInput,
)
from src.modelos.factories import SolicitudFactory

__all__ = [
    "Dependencia",
    "DerivacionInput",
    "EstadoSolicitud",
    "Prioridad",
    "TipoTramite",
    "Solicitud",
    "SolicitudDerivada",
    "SolicitudInput",
    "EstadoUpdateInput",
    "SolicitudFactory",
]
