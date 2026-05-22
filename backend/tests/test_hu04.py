"""Tests de regresion HU04 - "Envio de solicitud a dependencia correspondiente".

Cubre los 3 criterios de aceptacion oficiales adaptados a la Mesa de Partes:
- CA1: Persistencia en base de datos de solicitudes.
- CA2: Calculo de fecha maxima de respuesta + estado inicial Pendiente.
- CA3: Derivacion efectiva a la dependencia indicada.

Adicionalmente verifica la autenticacion de administrador (header
``X-Admin-Token``) y la validacion de enums.

Uso:
    cd VotingSystem/backend
    pytest tests/test_hu04.py -v
"""

from __future__ import annotations

import re
from datetime import date, datetime, time, timedelta, timezone

import pytest
from fastapi.testclient import TestClient

from src.main import app
from src.servicios.estrategias import DiasHabilesCalculoStrategy
from src.repositorios.solicitud_repo import RepositorioSolicitudEnMemoria

URL_CREAR = "/api/solicitudes"
ADMIN_TOKEN = "RENIEC_ADMIN_SUPER_SECRET_2026"
HEADERS_OK = {"X-Admin-Token": ADMIN_TOKEN}
WEEKEND = {5, 6}
UUID_HEX_RE = re.compile(r"^[0-9a-f]{32}$")
DEPENDENCIAS = (
    "MesaDePartes",
    "TramiteDocumentario",
    "AsesoriaLegal",
    "RecursosHumanos",
    "Logistica",
    "Tesoreria",
    "SecretariaGeneral",
)


def _sumar_dias_habiles(inicio: date, dias: int) -> date:
    cursor = inicio
    restantes = dias
    while restantes > 0:
        cursor += timedelta(days=1)
        if cursor.weekday() not in WEEKEND:
            restantes -= 1
    return cursor


def _payload_crear(**overrides) -> dict:
    base = {
        "usuario_id": "ciudadano-001",
        "tipo_tramite": "Tramite",
        "prioridad": "Normal",
        "asunto": "Copia certificada de acta",
        "detalle_solicitud": "Necesito copia certificada de partida de nacimiento.",
    }
    base.update(overrides)
    return base


@pytest.fixture(autouse=True)
def reset_singleton_repo():
    """Reinicia el repositorio singleton entre tests para aislamiento."""
    repo = RepositorioSolicitudEnMemoria()
    with repo._lock:
        repo._solicitudes.clear()


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


# --------------------------------------------------------------------- CA1
class TestCA1Persistencia:
    """CA1: Ingreso a la base de datos de solicitudes."""

    def test_post_devuelve_201_e_id_uuid_hex(self, client: TestClient) -> None:
        resp = client.post(URL_CREAR, json=_payload_crear())
        assert resp.status_code == 201, resp.text
        body = resp.json()
        assert "id" in body, "respuesta sin campo 'id'"
        assert UUID_HEX_RE.match(body["id"]), f"id no es UUID hex: {body['id']}"

    def test_dos_posts_mismo_usuario_generan_dos_solicitudes(
        self, client: TestClient
    ) -> None:
        r1 = client.post(URL_CREAR, json=_payload_crear())
        r2 = client.post(URL_CREAR, json=_payload_crear())
        assert r1.status_code == 201 and r2.status_code == 201
        assert r1.json()["id"] != r2.json()["id"], (
            "mismo usuario debe poder crear varias solicitudes con ids distintos"
        )

    def test_solicitud_recuperable_via_get(self, client: TestClient) -> None:
        creada = client.post(URL_CREAR, json=_payload_crear()).json()
        sid = creada["id"]
        resp = client.get(f"/api/solicitudes/{sid}")
        assert resp.status_code == 200
        assert resp.json()["id"] == sid


# -------------------------------------------------------------------- CA2a
class TestCA2aFechaMaxima:
    """CA2 parte temporal: calculo correcto de fecha maxima."""

    def test_fecha_maxima_es_30_dias_habiles_para_prioridad_normal(
        self, client: TestClient
    ) -> None:
        resp = client.post(URL_CREAR, json=_payload_crear(prioridad="Normal"))
        body = resp.json()
        fi = datetime.fromisoformat(body["fecha_ingreso"])
        fm = datetime.fromisoformat(body["fecha_maxima_respuesta"])

        esperada_date = _sumar_dias_habiles(fi.date(), 30)
        esperada = datetime.combine(
            esperada_date, time(23, 59, 59), tzinfo=timezone.utc
        )
        assert fm == esperada

    def test_fecha_maxima_es_15_dias_calendarios_para_prioridad_urgente(
        self, client: TestClient
    ) -> None:
        resp = client.post(URL_CREAR, json=_payload_crear(prioridad="Urgente"))
        body = resp.json()
        fi = datetime.fromisoformat(body["fecha_ingreso"])
        fm = datetime.fromisoformat(body["fecha_maxima_respuesta"])

        esperada_date = fi.date() + timedelta(days=15)
        esperada = datetime.combine(
            esperada_date, time(23, 59, 59), tzinfo=timezone.utc
        )
        assert fm == esperada


# -------------------------------------------------------------------- CA2b
class TestCA2bEstadoPendiente:
    """CA2 parte estado: toda solicitud nueva queda en estado 'Pendiente'."""

    def test_estado_inicial_es_pendiente(self, client: TestClient) -> None:
        resp = client.post(URL_CREAR, json=_payload_crear())
        assert resp.status_code == 201
        assert resp.json()["estado"] == "Pendiente"


# --------------------------------------------------------------------- CA3
class TestCA3Derivacion:
    """CA3: la solicitud puede ser derivada por el admin."""

    def test_derivar_solicitud_actualiza_dependencia_y_estado(
        self, client: TestClient
    ) -> None:
        creada = client.post(URL_CREAR, json=_payload_crear()).json()
        sid = creada["id"]

        resp = client.post(
            f"/api/admin/solicitudes/{sid}/derivar",
            json={"dependencia_asignada": "AsesoriaLegal", "observaciones": "Derivacion inicial"},
            headers=HEADERS_OK,
        )
        assert resp.status_code == 200, resp.text
        body = resp.json()
        assert body["dependencia_asignada"] == "AsesoriaLegal"
        assert body["estado"] == "En Proceso"
        assert body["observaciones"] == "Derivacion inicial"

    def test_dependencia_invalida_es_rechazada_con_422(
        self, client: TestClient
    ) -> None:
        creada = client.post(URL_CREAR, json=_payload_crear()).json()
        sid = creada["id"]

        resp = client.post(
            f"/api/admin/solicitudes/{sid}/derivar",
            json={"dependencia_asignada": "DependenciaFalsa", "observaciones": "Derivacion mala"},
            headers=HEADERS_OK,
        )
        assert resp.status_code == 422


# ---------------------------------------------------------------- Seguridad
class TestSeguridadAdmin:
    """Endpoints administrativos protegidos por header X-Admin-Token."""

    def test_sin_token_devuelve_403(self, client: TestClient) -> None:
        resp = client.post("/api/admin/solicitudes/123/derivar", json={"dependencia_asignada": "AsesoriaLegal"})
        assert resp.status_code == 403
        assert resp.json()["tipo"] == "NoAutorizadoError"

    def test_token_invalido_devuelve_403(self, client: TestClient) -> None:
        resp = client.post(
            "/api/admin/solicitudes/123/derivar",
            json={"dependencia_asignada": "AsesoriaLegal"},
            headers={"X-Admin-Token": "token-falso"},
        )
        assert resp.status_code == 403
        assert resp.json()["tipo"] == "NoAutorizadoError"
