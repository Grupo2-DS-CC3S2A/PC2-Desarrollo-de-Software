"""Unit tests to verify design pattern implementations in the backend.

Covers:
- Singleton: RepositorioSolicitudEnMemoria instance uniqueness and safety.
- Factory Method: SolicitudFactory correct instantiation.
- Strategy: Deadline calculations (business days vs calendar days).
- Observer: Subject-Observer notification flow and audit records.
"""

from __future__ import annotations

from datetime import datetime, timezone
import pytest

from src.modelos.solicitud import (
    Dependencia,
    EstadoSolicitud,
    Prioridad,
    TipoTramite,
    SolicitudInput,
)
from src.modelos.factories import SolicitudFactory
from src.repositorios.solicitud_repo import (
    RepositorioSolicitudEnMemoria,
    get_solicitud_repository,
)
from src.servicios.estrategias import (
    DiasCalendariosCalculoStrategy,
    DiasHabilesCalculoStrategy,
)
from src.servicios.observadores import AuditObserver, SolicitudSubject


def test_singleton_pattern():
    """Verifica que RepositorioSolicitudEnMemoria cumpla con el patron Singleton."""
    repo1 = RepositorioSolicitudEnMemoria()
    repo2 = RepositorioSolicitudEnMemoria()
    repo3 = get_solicitud_repository()
    
    assert repo1 is repo2
    assert repo2 is repo3
    
    # Verificar que el lock existe
    assert hasattr(repo1, "_lock")
    assert hasattr(repo1, "_solicitudes")


def test_strategy_pattern_dias_calendarios():
    """Verifica la estrategia de calculo de dias calendarios corridos."""
    inicio = datetime(2026, 5, 1, 10, 0, 0, tzinfo=timezone.utc)  # Viernes
    estrategia = DiasCalendariosCalculoStrategy(dias_calendarios=15)
    limite = estrategia.calcular_fecha_limite(inicio)
    
    # 1 de mayo + 15 dias calendarios = 16 de mayo
    assert limite.year == 2026
    assert limite.month == 5
    assert limite.day == 16
    assert limite.hour == 23
    assert limite.minute == 59
    assert limite.second == 59


def test_strategy_pattern_dias_habiles():
    """Verifica la estrategia de calculo de dias habiles excluyendo fines de semana."""
    # 22 de mayo 2026 es Viernes
    inicio = datetime(2026, 5, 22, 10, 0, 0, tzinfo=timezone.utc)
    # Sumar 3 dias habiles: lunes 25, martes 26, miercoles 27
    estrategia = DiasHabilesCalculoStrategy(dias_habiles=3)
    limite = estrategia.calcular_fecha_limite(inicio)
    
    assert limite.year == 2026
    assert limite.month == 5
    assert limite.day == 27
    assert limite.hour == 23
    assert limite.minute == 59


def test_factory_method_pattern():
    """Verifica que la factoria cree la solicitud correspondiente."""
    solicitud = SolicitudFactory.crear_solicitud(
        usuario_id="77889900",
        tipo_tramite=TipoTramite.RECLAMO,
        prioridad=Prioridad.URGENTE,
        asunto="Reclamo por duplicado",
        detalle_solicitud="Detalle del reclamo super largo",
    )
    
    assert solicitud.usuario_id == "77889900"
    assert solicitud.tipo_tramite == TipoTramite.RECLAMO
    assert solicitud.prioridad == Prioridad.URGENTE
    assert solicitud.asunto == "Reclamo por duplicado"
    assert solicitud.detalle_solicitud == "Detalle del reclamo super largo"
    assert solicitud.estado == EstadoSolicitud.PENDIENTE
    assert solicitud.dependencia_asignada == Dependencia.MESA_DE_PARTES
    # Prioridad URGENTE -> 15 dias calendarios
    delta = solicitud.fecha_maxima_respuesta - solicitud.fecha_ingreso
    assert delta.days >= 14  # Aprox 15 dias


def test_observer_pattern():
    """Verifica el flujo del patron Observer y la persistencia de auditoria."""
    # Limpiar el historial estatico
    AuditObserver.historico_auditoria.clear()
    
    subject = SolicitudSubject()
    audit_observer = AuditObserver()
    subject.suscribir(audit_observer)
    
    solicitud = SolicitudFactory.crear_solicitud(
        usuario_id="12345678",
        tipo_tramite=TipoTramite.TRAMITE,
        prioridad=Prioridad.NORMAL,
        asunto="Tramite de partida",
        detalle_solicitud="Solicitud detallada de partida",
    )
    
    subject.notificar(solicitud, "registro")
    
    assert len(AuditObserver.historico_auditoria) == 1
    registro = AuditObserver.historico_auditoria[0]
    assert registro["solicitud_id"] == solicitud.id
    assert registro["evento"] == "registro"
    assert registro["estado"] == "Pendiente"
