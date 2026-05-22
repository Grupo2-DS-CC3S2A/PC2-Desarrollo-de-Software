"""Patron Factory Method para la creacion de entidades de tipo Solicitud.

Encapsula la instanciacion de solicitudes asociando por defecto la estrategia
adecuada de fecha limite segun la prioridad.
"""

from __future__ import annotations

from datetime import datetime, timezone

from src.modelos.solicitud import (
    Dependencia,
    EstadoSolicitud,
    Prioridad,
    Solicitud,
    TipoTramite,
)
# Los importes de estrategias se hacen localmente dentro de crear_solicitud para evitar dependencias circulares.


class SolicitudFactory:
    """Factoria para crear instancias de Solicitud con reglas por defecto."""

    @staticmethod
    def crear_solicitud(
        usuario_id: str,
        tipo_tramite: TipoTramite,
        prioridad: Prioridad,
        asunto: str,
        detalle_solicitud: str,
    ) -> Solicitud:
        """Crea una Solicitud aplicando politicas y calculos iniciales.

        Asigna la dependencia inicial de Mesa de Partes, establece el estado
        Pendiente y calcula la fecha maxima de respuesta utilizando la estrategia
        correspondiente segun la prioridad.

        Args:
            usuario_id: Identificador/DNI del ciudadano.
            tipo_tramite: Tipo de solicitud (Tramite, Reclamo, Consulta).
            prioridad: Nivel de prioridad (Normal, Urgente).
            asunto: Titulo o asunto abreviado.
            detalle_solicitud: Detalle explicativo de la peticion.

        Returns:
            Una entidad Solicitud inicializada y consistente.
        """
        ahora = datetime.now(tz=timezone.utc)

        from src.servicios.estrategias import (
            DiasCalendariosCalculoStrategy,
            DiasHabilesCalculoStrategy,
        )

        # Seleccionar estrategia de calculo basada en prioridad (Strategy Pattern)
        if prioridad == Prioridad.URGENTE:
            estrategia = DiasCalendariosCalculoStrategy(dias_calendarios=15)
        else:
            estrategia = DiasHabilesCalculoStrategy(dias_habiles=30)

        fecha_maxima = estrategia.calcular_fecha_limite(ahora)

        return Solicitud(
            usuario_id=usuario_id,
            tipo_tramite=tipo_tramite,
            prioridad=prioridad,
            asunto=asunto,
            detalle_solicitud=detalle_solicitud,
            dependencia_asignada=Dependencia.MESA_DE_PARTES,
            fecha_ingreso=ahora,
            fecha_maxima_respuesta=fecha_maxima,
            estado=EstadoSolicitud.PENDIENTE,
        )
