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

El sistema utiliza cuatro patrones de diseño clasicos del catalogo GoF para estructurar la logica de negocio y facilitar su extension:

### 1. Singleton (Creacion)
* **Clase:** RepositorioSolicitudEnMemoria en `backend/src/repositorios/solicitud_repo.py`
* **Descripcion:** Garantiza la existencia de una unica instancia del repositorio de datos en memoria para toda la aplicacion. Utiliza un mecanismo de exclusion mutua (Lock) con doble comprobacion para asegurar un comportamiento thread-safe.

### 2. Factory Method (Creacion)
* **Clase:** SolicitudFactory en `backend/src/modelos/factories.py`
* **Descripcion:** Centraliza y aisla la logica de construccion de las solicitudes. A partir de los parametros de entrada del ciudadano, inicializa los estados iniciales por defecto y selecciona la estrategia adecuada para asignar los plazos de respuesta.

### 3. Strategy (Comportamiento)
* **Clases:** CalculoFechaLimiteStrategy, DiasHabilesCalculoStrategy y DiasCalendariosCalculoStrategy en `backend/src/servicios/estrategias.py`
* **Descripcion:** Define una interfaz comun para el calculo de plazos maximos de atencion.
  * **DiasHabilesCalculoStrategy:** Suma 30 dias habiles (excluyendo sabados y domingos) para tramites con prioridad Normal.
  * **DiasCalendariosCalculoStrategy:** Suma 15 dias calendarios corridos para tramites de prioridad Urgente.

### 4. Observer (Comportamiento)
* **Clases:** SolicitudSubject, SolicitudObserver, LogObserver, AuditObserver y NotificationObserver en `backend/src/servicios/observadores.py`
* **Descripcion:** Permite reaccionar a los eventos importantes del ciclo de vida de una solicitud (registro, derivacion y cambio de estado) sin acoplar la logica principal. Los observadores registran de manera independiente en los logs del sistema, generan un historico de auditoria y simulan el envio de notificaciones externas al ciudadano.

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

