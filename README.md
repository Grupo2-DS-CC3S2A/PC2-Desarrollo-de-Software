# Mesa de Partes Electronica - RENIEC

Sistema de Mesa de Partes Electronica para la automatizacion del registro, derivacion y seguimiento de solicitudes en el Registro Nacional de Identificacion y Estado Civil (RENIEC). Permite a los ciudadanos ingresar tramites y a los administradores derivar y gestionar sus estados.

## Organizacion del Repositorio

```text
VotingSystem/
├── backend/                    # API REST con FastAPI (Python)
│   ├── app.py                  # Punto de entrada de la aplicacion
│   ├── requirements.txt        # Dependencias del backend
│   └── src/
│       ├── config.py           # Configuracion del entorno
│       ├── main.py             # Instanciacion de FastAPI y ruteo
│       ├── modelos/            # Entidades y esquemas de datos (Pydantic)
│       │   ├── factories.py    # Factory Method para creacion de Solicitud
│       │   └── solicitud.py    # Definicion de la clase Solicitud
│       ├── servicios/          # Logica de negocio y patrones de comportamiento
│       │   ├── estrategias.py  # Patron Strategy (calculo de plazos)
│       │   ├── observadores.py # Patron Observer (auditoria y logs)
│       │   └── solicitud_service.py # Coordinador del ciclo de vida
│       ├── repositorios/       # Capa de persistencia (Singleton)
│       │   └── solicitud_repo.py    # Repositorio en memoria thread-safe
│       ├── rutas/              # Endpoints HTTP expuestos
│       │   ├── solicitudes.py       # Operaciones del ciudadano
│       │   └── admin_solicitudes.py # Operaciones del administrador
│       ├── excepciones/        # Manejo de errores
│       ├── utilidades/         # Utilidades secundarias
│       └── logging_config.py   # Registro de logs del sistema
│
├── frontend/                   # Interfaz de Usuario con React + Vite
│   ├── index.html
│   └── src/
│       ├── App.tsx             # Componente raiz y layout institucional
│       ├── components/         # Componentes del Portal Ciudadano y Administrador
│       │   ├── SolicitudForm.tsx       # Registro de solicitudes
│       │   ├── SolicitudLookup.tsx     # Busqueda y consulta de tramites
│       │   ├── SolicitudReceipt.tsx    # Recibo de confirmacion
│       │   └── AdminDerivacionPanel.tsx # Panel de control del administrador
│       ├── api/                # Cliente HTTP para llamadas al backend
│       └── types/              # Tipos compartidos en TypeScript
│
└── README.md
```

## Patrones de Diseño Implementados

* **Singleton:** [solicitud_repo.py](file:///C:/Users/elmas/Downloads/2026-1/Desarrollo%20de%20Software%2025-2%20para%202026-1/DS-Project/VotingSystem/backend/src/repositorios/solicitud_repo.py) ([RepositorioSolicitudEnMemoria](file:///C:/Users/elmas/Downloads/2026-1/Desarrollo%20de%20Software%2025-2%20para%202026-1/DS-Project/VotingSystem/backend/src/repositorios/solicitud_repo.py#L97))
* **Factory Method:** [factories.py](file:///C:/Users/elmas/Downloads/2026-1/Desarrollo%20de%20Software%2025-2%20para%202026-1/DS-Project/VotingSystem/backend/src/modelos/factories.py) ([SolicitudFactory](file:///C:/Users/elmas/Downloads/2026-1/Desarrollo%20de%20Software%2025-2%20para%202026-1/DS-Project/VotingSystem/backend/src/modelos/factories.py#L21))
* **Strategy:** [estrategias.py](file:///C:/Users/elmas/Downloads/2026-1/Desarrollo%20de%20Software%2025-2%20para%202026-1/DS-Project/VotingSystem/backend/src/servicios/estrategias.py) ([CalculoFechaLimiteStrategy](file:///C:/Users/elmas/Downloads/2026-1/Desarrollo%20de%20Software%2025-2%20para%202026-1/DS-Project/VotingSystem/backend/src/servicios/estrategias.py#L13), [DiasHabilesCalculoStrategy](file:///C:/Users/elmas/Downloads/2026-1/Desarrollo%20de%20Software%2025-2%20para%202026-1/DS-Project/VotingSystem/backend/src/servicios/estrategias.py#L28), [DiasCalendariosCalculoStrategy](file:///C:/Users/elmas/Downloads/2026-1/Desarrollo%20de%20Software%2025-2%20para%202026-1/DS-Project/VotingSystem/backend/src/servicios/estrategias.py#L58))
* **Observer:** [observadores.py](file:///C:/Users/elmas/Downloads/2026-1/Desarrollo%20de%20Software%2025-2%20para%202026-1/DS-Project/VotingSystem/backend/src/servicios/observadores.py) ([SolicitudSubject](file:///C:/Users/elmas/Downloads/2026-1/Desarrollo%20de%20Software%2025-2%20para%202026-1/DS-Project/VotingSystem/backend/src/servicios/observadores.py#L33), [SolicitudObserver](file:///C:/Users/elmas/Downloads/2026-1/Desarrollo%20de%20Software%2025-2%20para%202026-1/DS-Project/VotingSystem/backend/src/servicios/observadores.py#L20), [LogObserver](file:///C:/Users/elmas/Downloads/2026-1/Desarrollo%20de%20Software%2025-2%20para%202026-1/DS-Project/VotingSystem/backend/src/servicios/observadores.py#L66), [AuditObserver](file:///C:/Users/elmas/Downloads/2026-1/Desarrollo%20de%20Software%2025-2%20para%202026-1/DS-Project/VotingSystem/backend/src/servicios/observadores.py#L79), [NotificationObserver](file:///C:/Users/elmas/Downloads/2026-1/Desarrollo%20de%20Software%2025-2%20para%202026-1/DS-Project/VotingSystem/backend/src/servicios/observadores.py#L102))

## Tecnologias Principales

* **Backend:** Python 3.10+, FastAPI (servicios asincronos), Pydantic v2 (validacion), Pytest (pruebas).
* **Frontend:** React 18, TypeScript, Vite, Chakra UI v3 (diseño institucional adaptado a RENIEC).

## Guia de Ejecucion Rapida

### Ejecutar el Backend
```bash
cd backend
python -m venv .venv
# Activar entorno virtual:
# Windows: .venv\Scripts\activate
# Linux/macOS: source .venv/bin/activate
pip install -r requirements.txt
uvicorn src.main:app --reload --port 8000
```
* **Swagger UI:** `http://localhost:8000/docs`

### Ejecutar el Frontend
```bash
cd frontend
npm install
npm run dev
```
* **Portal Local:** `http://localhost:5173`

## Integrante

* Alvaro Jesus Taipe Cotrina

