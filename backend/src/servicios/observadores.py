"""Patron Observer para el ciclo de vida de las solicitudes.

Define la interfaz de observador, el sujeto y los observadores concretos
para auditoria, registro de logs e imitacion de notificaciones externas.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import TYPE_CHECKING, List

from src.logging_config import get_logger

if TYPE_CHECKING:
    from src.modelos.solicitud import Solicitud

logger = get_logger(__name__)


class SolicitudObserver(ABC):
    """Interfaz (ABC) para los observadores de eventos de solicitud."""

    @abstractmethod
    def actualizar(self, solicitud: Solicitud, evento: str) -> None:
        """Metodo invocado por el sujeto ante cambios en la solicitud.

        Args:
            solicitud: Entidad Solicitud que sufrio el cambio.
            evento: Nombre o descripcion del evento (ej. "registro", "derivacion", "cambio_estado").
        """


class SolicitudSubject:
    """Clase base o auxiliar para objetos observables en el dominio."""

    def __init__(self) -> None:
        self._observers: List[SolicitudObserver] = []

    def suscribir(self, observer: SolicitudObserver) -> None:
        """Registra un nuevo observador en la lista de suscripciones."""
        if observer not in self._observers:
            self._observers.append(observer)

    def desuscribir(self, observer: SolicitudObserver) -> None:
        """Remueve un observador de la lista de suscripciones."""
        if observer in self._observers:
            self._observers.remove(observer)

    def notificar(self, solicitud: Solicitud, evento: str) -> None:
        """Notifica del evento a todos los observadores registrados."""
        for observer in self._observers:
            try:
                observer.actualizar(solicitud, evento)
            except Exception as exc:
                # Evitamos que un fallo en un observador interrumpa el flujo principal
                logger.error(
                    "Error en observador %s procesando evento %s: %s",
                    observer.__class__.__name__,
                    evento,
                    exc,
                )


# Implementaciones concretas de observadores

class LogObserver(SolicitudObserver):
    """Observador que registra logs estructurados del sistema."""

    def actualizar(self, solicitud: Solicitud, evento: str) -> None:
        logger.info(
            "[SYSTEM-EVENT] Solicitud ID=%s | Evento=%s | Estado=%s | Dependencia=%s",
            solicitud.id,
            evento.upper(),
            solicitud.estado.value,
            solicitud.dependencia_asignada.value if solicitud.dependencia_asignada else "Ninguna",
        )


class AuditObserver(SolicitudObserver):
    """Observador que genera registros historicos para auditorias.

    Guarda los logs en una estructura interna estatica para fines de prueba
    y demostracion (historico_auditoria).
    """

    historico_auditoria: List[dict] = []

    def actualizar(self, solicitud: Solicitud, evento: str) -> None:
        from datetime import datetime, timezone
        registro = {
            "timestamp": datetime.now(tz=timezone.utc).isoformat(),
            "solicitud_id": solicitud.id,
            "usuario_id": solicitud.usuario_id,
            "evento": evento,
            "estado": solicitud.estado.value,
            "dependencia": solicitud.dependencia_asignada.value if solicitud.dependencia_asignada else None,
        }
        self.historico_auditoria.append(registro)
        logger.info("[AUDIT] Registro guardado para solicitud %s", solicitud.id)


class NotificationObserver(SolicitudObserver):
    """Observador que simula el envio de correos/SMS de aviso al ciudadano."""

    def actualizar(self, solicitud: Solicitud, evento: str) -> None:
        # En una aplicacion real, aqui se integraria con AWS SES, Twilio, etc.
        logger.info(
            "[NOTIFICACION] Enviando correo simulado a ciudadano (Usuario ID: %s) "
            "notificando evento '%s' sobre solicitud #%s. Estado actual: %s",
            solicitud.usuario_id,
            evento,
            solicitud.id,
            solicitud.estado.value,
        )
