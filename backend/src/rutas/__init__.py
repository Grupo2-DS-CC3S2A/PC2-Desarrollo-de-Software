"""Routers HTTP de la aplicacion."""

from src.rutas.admin_solicitudes import router as admin_solicitudes_router
from src.rutas.solicitudes import router as solicitudes_router

__all__ = ["admin_solicitudes_router", "solicitudes_router"]
