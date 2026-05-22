"""Modelos Pydantic del agregado Solicitud (HU04).

Define los DTOs y entidades del flujo "Envio de solicitud a dependencia":
el usuario autenticado registra una solicitud dirigida a una dependencia,
con fecha de ingreso, fecha maxima de respuesta y estado inicial
``Pendiente``. Las invariantes (longitudes minimas, ventana temporal valida,
estados permitidos) se aplican aqui para que la capa de servicios reciba
datos ya consistentes.
"""

from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Annotated
from uuid import uuid4

from pydantic import BaseModel, ConfigDict, Field, model_validator

DETALLE_MIN_LENGTH: int = 10
DETALLE_MAX_LENGTH: int = 2000
USUARIO_ID_MIN_LENGTH: int = 1
USUARIO_ID_MAX_LENGTH: int = 64


class EstadoSolicitud(str, Enum):
    """Estados validos del ciclo de vida de una solicitud."""

    PENDIENTE = "Pendiente"
    EN_PROCESO = "En Proceso"
    ATENDIDA = "Atendida"
    RECHAZADA = "Rechazada"


class Prioridad(str, Enum):
    """Nivel de prioridad de la solicitud."""

    NORMAL = "Normal"
    URGENTE = "Urgente"


class TipoTramite(str, Enum):
    """Tipo de tramite."""

    TRAMITE = "Tramite"
    RECLAMO = "Reclamo"
    CONSULTA = "Consulta"


class Dependencia(str, Enum):
    """Dependencias internas elegibles como destinatarias."""

    MESA_DE_PARTES = "MesaDePartes"
    TRAMITE_DOCUMENTARIO = "TramiteDocumentario"
    ASESORIA_LEGAL = "AsesoriaLegal"
    RECURSOS_HUMANOS = "RecursosHumanos"
    LOGISTICA = "Logistica"
    TESORERIA = "Tesoreria"
    SECRETARIA_GENERAL = "SecretariaGeneral"


def _ahora_utc() -> datetime:
    """Devuelve un ``datetime`` aware en UTC (evita fechas naive)."""
    return datetime.now(tz=timezone.utc)


def _nuevo_id() -> str:
    """Genera un identificador unico hex (UUID4) para una solicitud."""
    return uuid4().hex


class SolicitudInput(BaseModel):
    """Payload de entrada para registrar una nueva solicitud por un ciudadano."""

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    usuario_id: Annotated[
        str,
        Field(
            min_length=USUARIO_ID_MIN_LENGTH,
            max_length=USUARIO_ID_MAX_LENGTH,
            description="Identificador (DNI) del ciudadano.",
        ),
    ]
    tipo_tramite: Annotated[
        TipoTramite,
        Field(description="Tipo de tramite (Tramite, Reclamo, Consulta)."),
    ]
    prioridad: Annotated[
        Prioridad,
        Field(description="Prioridad de la solicitud (Normal, Urgente)."),
    ]
    asunto: Annotated[
        str,
        Field(
            min_length=5,
            max_length=200,
            description="Asunto o titulo de la solicitud.",
        ),
    ]
    detalle_solicitud: Annotated[
        str,
        Field(
            min_length=DETALLE_MIN_LENGTH,
            max_length=DETALLE_MAX_LENGTH,
            description="Detalle explicativo de la solicitud.",
        ),
    ]


class Solicitud(BaseModel):
    """Entidad de dominio persistible para una solicitud ingresada."""

    model_config = ConfigDict(extra="forbid", frozen=True, use_enum_values=False)

    id: Annotated[
        str,
        Field(
            default_factory=_nuevo_id,
            min_length=1,
            description="Identificador unico de la solicitud.",
        ),
    ]
    usuario_id: Annotated[
        str,
        Field(
            min_length=USUARIO_ID_MIN_LENGTH,
            max_length=USUARIO_ID_MAX_LENGTH,
        ),
    ]
    tipo_tramite: TipoTramite
    prioridad: Prioridad
    asunto: str
    detalle_solicitud: Annotated[
        str,
        Field(
            min_length=DETALLE_MIN_LENGTH,
            max_length=DETALLE_MAX_LENGTH,
        ),
    ]
    dependencia_asignada: Dependencia | None = None
    fecha_ingreso: Annotated[
        datetime,
        Field(default_factory=_ahora_utc),
    ]
    fecha_maxima_respuesta: datetime
    estado: Annotated[
        EstadoSolicitud,
        Field(default=EstadoSolicitud.PENDIENTE),
    ]
    observaciones: str = ""

    @model_validator(mode="after")
    def _validar_ventana_temporal(self) -> "Solicitud":
        """Garantiza que la fecha maxima sea posterior al ingreso."""
        if self.fecha_maxima_respuesta <= self.fecha_ingreso:
            raise ValueError(
                "fecha_maxima_respuesta debe ser posterior a fecha_ingreso."
            )
        return self


OBSERVACIONES_MAX_LENGTH: int = 500


class DerivacionInput(BaseModel):
    """Payload del administrador para derivar una solicitud a otra dependencia."""

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    dependencia_asignada: Annotated[
        Dependencia,
        Field(description="Nueva dependencia destinataria."),
    ]
    observaciones: Annotated[
        str,
        Field(
            default="",
            max_length=OBSERVACIONES_MAX_LENGTH,
            description="Notas internas del administrador sobre la derivacion.",
        ),
    ] = ""


class EstadoUpdateInput(BaseModel):
    """Payload del administrador para cambiar el estado de una solicitud."""

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    estado: Annotated[
        EstadoSolicitud,
        Field(description="Nuevo estado de la solicitud."),
    ]
    observaciones: Annotated[
        str,
        Field(
            default="",
            max_length=OBSERVACIONES_MAX_LENGTH,
            description="Observaciones sobre el cambio de estado.",
        ),
    ] = ""


class SolicitudDerivada(BaseModel):
    """Respuesta del endpoint de derivacion (HU04)."""

    model_config = ConfigDict(extra="forbid", frozen=True)

    id: str
    usuario_id: str
    tipo_tramite: TipoTramite
    prioridad: Prioridad
    asunto: str
    detalle_solicitud: str
    dependencia_asignada: Dependencia | None
    fecha_ingreso: datetime
    fecha_maxima_respuesta: datetime
    estado: EstadoSolicitud
    observaciones: str = ""

