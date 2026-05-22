"""Patron Strategy para el calculo de la fecha limite de respuesta.

Define la interfaz de estrategia y las implementaciones concretas para dias
habiles y dias calendarios, adaptables en tiempo de ejecucion.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from datetime import date, datetime, time, timedelta, timezone


class CalculoFechaLimiteStrategy(ABC):
    """Interfaz (ABC) para las estrategias de calculo de fecha limite."""

    @abstractmethod
    def calcular_fecha_limite(self, inicio: datetime) -> datetime:
        """Calcula la fecha limite a partir de una fecha de inicio.

        Args:
            inicio: Fecha y hora de ingreso de la solicitud.

        Returns:
            La fecha limite calculada con zona horaria UTC.
        """


class DiasHabilesCalculoStrategy(CalculoFechaLimiteStrategy):
    """Estrategia para calcular fecha limite sumando dias habiles.

    Por defecto suma 30 dias habiles excluyendo fines de semana (sabado y domingo).
    Fija el limite al final del dia habil (23:59:59 UTC).
    """

    def __init__(self, dias_habiles: int = 30) -> None:
        self.dias_habiles = dias_habiles

    def calcular_fecha_limite(self, inicio: datetime) -> datetime:
        if self.dias_habiles < 0:
            raise ValueError("Los dias habiles a sumar deben ser >= 0.")
        
        cursor: date = inicio.date()
        restantes: int = self.dias_habiles
        weekend = {5, 6}  # 5: Sabado, 6: Domingo
        
        while restantes > 0:
            cursor = cursor + timedelta(days=1)
            if cursor.weekday() not in weekend:
                restantes -= 1
                
        return datetime.combine(
            cursor,
            time(hour=23, minute=59, second=59),
            tzinfo=timezone.utc,
        )


class DiasCalendariosCalculoStrategy(CalculoFechaLimiteStrategy):
    """Estrategia para calcular fecha limite sumando dias calendarios corridos.

    Por defecto suma 15 dias calendarios corridos para tramites urgentes.
    Fija el limite al final del dia (23:59:59 UTC).
    """

    def __init__(self, dias_calendarios: int = 15) -> None:
        self.dias_calendarios = dias_calendarios

    def calcular_fecha_limite(self, inicio: datetime) -> datetime:
        if self.dias_calendarios < 0:
            raise ValueError("Los dias calendarios a sumar deben ser >= 0.")
        
        limite: date = inicio.date() + timedelta(days=self.dias_calendarios)
        return datetime.combine(
            limite,
            time(hour=23, minute=59, second=59),
            tzinfo=timezone.utc,
        )
