"""Configuracion de pytest: fija ADMIN_TOKEN antes de importar la app
y agrega el backend/ al sys.path para importar el paquete ``src``.
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

os.environ.setdefault("ADMIN_TOKEN", "RENIEC_ADMIN_SUPER_SECRET_2026")

BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))
