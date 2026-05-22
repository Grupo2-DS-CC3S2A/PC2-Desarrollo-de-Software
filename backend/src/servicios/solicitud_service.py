"""Servicio de dominio Mesa de Partes (HU04).

Coordinador del ciclo de vida de las solicitudes, integrando los patrones de
diseño Factory Method, Strategy y Observer. Utiliza el Repositorio de
solicitudes Singleton para la persistencia de datos.
"""

from __future__ import annotations

from functools import lru_cache
from typing import List

from src.excepciones.errors import SolicitudNoEncontradaError
from src.logging_config import get_logger
from src.modelos.solicitud import (
    DerivacionInput,
    EstadoSolicitud,
    EstadoUpdateInput,
    Solicitud,
    SolicitudInput,
)
from src.modelos.factories import SolicitudFactory
from src.repositorios.solicitud_repo import (
    SolicitudRepository,
    get_solicitud_repository,
)
from src.servicios.observadores import (
    AuditObserver,
    LogObserver,
    NotificationObserver,
    SolicitudSubject,
)

logger = get_logger(__name__)


class SolicitudService:
    """Coordina el ciclo de vida de las solicitudes.

    Usa el repositorio singleton e implementa la logica de negocio
    notificando a los observadores ante cualquier cambio.
    """

    def __init__(self, repo: SolicitudRepository | None = None) -> None:
        self._repo = repo or get_solicitud_repository()
        self._subject = SolicitudSubject()
        
        # Inscribir los observadores (Observer Pattern)
        self._subject.suscribir(LogObserver())
        self._subject.suscribir(AuditObserver())
        self._subject.suscribir(NotificationObserver())

    def crear_solicitud(self, payload: SolicitudInput) -> Solicitud:
        """Registra una nueva solicitud creada por un ciudadano.

        Usa el Factory Method (SolicitudFactory) para crear la solicitud con
        su respectiva estrategia de fecha limite segun la prioridad.

        Args:
            payload: Datos de entrada del ciudadano.

        Returns:
            La solicitud registrada y persistida.
        """
        solicitud = SolicitudFactory.crear_solicitud(
            usuario_id=payload.usuario_id,
            tipo_tramite=payload.tipo_tramite,
            prioridad=payload.prioridad,
            asunto=payload.asunto,
            detalle_solicitud=payload.detalle_solicitud,
        )

        self._repo.guardar(solicitud)
        self._subject.notificar(solicitud, "registro")
        return solicitud

    def derivar(self, solicitud_id: str, payload: DerivacionInput) -> Solicitud:
        """Deriva una solicitud existente a una dependencia especifica.

        Actualiza la solicitud en el repositorio y notifica a los observadores.

        Args:
            solicitud_id: Identificador de la solicitud.
            payload: Datos de la derivacion.

        Returns:
            La solicitud actualizada.
        """
        solicitud = self._repo.obtener_por_id(solicitud_id)

        # Si estaba pendiente, pasa a En Proceso al derivarse
        nuevo_estado = (
            EstadoSolicitud.EN_PROCESO
            if solicitud.estado == EstadoSolicitud.PENDIENTE
            else solicitud.estado
        )

        solicitud_actualizada = solicitud.model_copy(
            update={
                "dependencia_asignada": payload.dependencia_asignada,
                "observaciones": payload.observaciones,
                "estado": nuevo_estado,
            }
        )

        self._repo.actualizar(solicitud_actualizada)
        self._subject.notificar(solicitud_actualizada, "derivacion")
        return solicitud_actualizada

    def actualizar_estado(
        self, solicitud_id: str, payload: EstadoUpdateInput
    ) -> Solicitud:
        """Actualiza el estado de una solicitud con observaciones opcionales.

        Args:
            solicitud_id: Identificador de la solicitud.
            payload: Nuevo estado y observaciones.

        Returns:
            La solicitud actualizada.
        """
        solicitud = self._repo.obtener_por_id(solicitud_id)

        solicitud_actualizada = solicitud.model_copy(
            update={
                "estado": payload.estado,
                "observaciones": payload.observaciones,
            }
        )

        self._repo.actualizar(solicitud_actualizada)
        self._subject.notificar(solicitud_actualizada, "cambio_estado")
        return solicitud_actualizada

    def obtener(self, solicitud_id: str) -> Solicitud:
        """Recupera una solicitud por id."""
        return self._repo.obtener_por_id(solicitud_id)

    def listar(self) -> List[Solicitud]:
        """Lista todas las solicitudes."""
        return self._repo.listar_todas()

    def listar_por_usuario(self, usuario_id: str) -> List[Solicitud]:
        """Lista todas las solicitudes creadas por un DNI especifico."""
        return self._repo.listar_por_usuario(usuario_id)


@lru_cache(maxsize=1)
def get_solicitud_service() -> SolicitudService:
    """Provee la instancia singleton del servicio para la inyeccion de dependencias."""
    return SolicitudService()
