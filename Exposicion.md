# Exposicion — Sistema de Voto Electronico Seguro (HU04)

**Curso:** Desarrollo de Software (CC3S2-A) — Practicas Dirigidas 1 y 2
**Grupo:** 2
**Sprint:** 3
**Rama activa:** `feature/SCRUM-1-seguridad`
**Fecha de exposicion:** 2026-05-06

---

## 1. Resumen Ejecutivo

El Sistema VotingSystem es una **Mesa de Partes Electronica RENIEC** que automatiza el envio de solicitudes y el voto electronico cifrado. Esta construido bajo principios de **Clean Architecture** y **SOLID**, con separacion estricta entre capas (rutas, servicios, repositorios, modelos).

En el estado actual de la entrega:

- **Frontend** activo en `http://localhost:5173` — interfaz de votante con identidad visual institucional RENIEC.
- **Backend** activo en `http://localhost:8000` — API REST con FastAPI y documentacion automatica Swagger UI en `http://localhost:8000/docs`.
- **Persistencia** en memoria thread-safe (singleton via `lru_cache`), preparada para reemplazo por base de datos sin tocar la capa de servicios (Dependency Inversion Principle).

La interfaz fue rediseñada con un layout de dos columnas: panel izquierdo institucional (logo, lema *Seguro · Anonimo · Trazable*, descripcion del sistema) y panel derecho operativo (formulario de registro de solicitud / emision de voto).

---

## 2. Arquitectura del Sistema

### 2.1 Stack tecnologico

| Capa | Tecnologia | Responsabilidad |
|------|------------|-----------------|
| Frontend | React 18 + TypeScript + Vite + Chakra UI v3 | UI declarativa, custom hooks asincronos, tipado estricto |
| Backend | Python 3.10+ + FastAPI + Pydantic v2 | Endpoints REST, validacion de DTOs, inyeccion de dependencias |
| Seguridad | SHA-256 + Algoritmo Genetico evolutivo | Anonimato del votante, llave dinamica por voto |
| Persistencia | In-memory `dict` / `set` con `threading.Lock` | Repositorio thread-safe sustituible por SQL/NoSQL |

### 2.2 Diagrama logico de carpetas

```
VotingSystem/
├── backend/
│   └── src/
│       ├── main.py              # Application factory FastAPI
│       ├── config.py            # Settings (CORS, GA params)
│       ├── modelos/             # Pydantic DTOs (voto, solicitud)
│       ├── rutas/               # Endpoints HTTP (votos, admin_solicitudes)
│       ├── servicios/           # Logica de dominio (VotoService, SolicitudService)
│       ├── repositorios/        # Puerto + adaptador en memoria
│       ├── excepciones/         # Errores de dominio + handlers HTTP
│       └── utilidades/          # AlgoritmoGenetico, cifrado SHA-256
├── frontend/
│   └── src/
│       ├── App.tsx              # Composicion raiz (header + paneles)
│       ├── components/          # VotingForm, VotingReceipt, AdminPanel
│       ├── hooks/               # useVoting, useDerivacion (SRP)
│       ├── api/                 # votingApi, derivacionApi (fetch wrappers)
│       └── types/               # Tipos compartidos voting/derivacion
└── README.md
```

---

## 3. Funcionalidades HTTP — Endpoints de la API

La API expone dos modulos: **Votacion** (publico, ciudadano) y **Mesa de Partes Administrativa** (protegido por token, HU04).

### 3.1 Endpoint `POST /api/votar` — Registrar voto cifrado

**Funcionalidad:** Recibe el DNI del votante y el id del candidato, genera una llave evolutiva mediante el algoritmo genetico, calcula un hash SHA-256 sobre la tupla `(dni, candidato, llave)` y devuelve un comprobante anonimo. El DNI en crudo nunca se persiste — solo el hash final.

**Request body** (DTO `VotoInput`):

```json
{
  "dni_votante": "72718915",
  "id_candidato": 3
}
```

Validaciones automaticas Pydantic:
- `dni_votante` — exactamente 8 digitos numericos, no admite digitos repetidos (`00000000`, `11111111`).
- `id_candidato` — entero entre 1 y 9999.
- `extra="forbid"` — rechaza campos adicionales no contemplados.

**Response 201** (DTO `VotoCifrado`):

```json
{
  "hash_voto": "a7b9...c4d2",
  "clave_genetica": "1011001011...",
  "timestamp": 1746547419.873
}
```

**Codigos de error:**
- `422 Unprocessable Entity` — DNI invalido o id de candidato fuera de rango.
- `409 Conflict` — colision de hash (extremadamente improbable con la llave evolutiva).
- `500 Internal Server Error` — fallo no controlado.

### 3.2 Endpoint `GET /api/votos_audit` — Auditoria de votos

**Funcionalidad:** Devuelve la lista completa de comprobantes cifrados emitidos. Permite a un auditor verificar el conteo y la integridad del registro **sin poder reconstruir la identidad de ningun votante** (solo se exponen hashes y timestamps).

**Response 200** (DTO `AuditoriaVotos`):

```json
{
  "total": 5,
  "votos_cifrados": [
    { "hash_voto": "...", "clave_genetica": "...", "timestamp": 1746547419.873 },
    ...
  ]
}
```

### 3.3 Endpoint `POST /api/admin/solicitudes/derivar` — Derivar solicitud (HU04)

**Funcionalidad:** Operacion administrativa protegida que recibe una solicitud ciudadana y la deriva a una de las siete dependencias internas del catalogo (`MesaDePartes`, `TramiteDocumentario`, `AsesoriaLegal`, `RecursosHumanos`, `Logistica`, `Tesoreria`, `SecretariaGeneral`). El servicio:

1. Asigna automaticamente la `fecha_ingreso` al instante actual UTC.
2. Calcula la `fecha_maxima_respuesta` sumando **30 dias habiles** (saltando sabados y domingos) desde el ingreso, fijando la hora a 23:59:59 UTC.
3. Persiste la solicitud con estado inicial `Pendiente`.
4. Genera un identificador unico UUID4.

**Autorizacion:** Cabecera `X-Admin-Token` validada contra la variable de entorno `ADMIN_TOKEN`. Si falta o no coincide, devuelve `403 Forbidden`. Esta dependencia esta aislada para permitir migracion futura a JWT/OIDC sin tocar la logica de dominio.

**Request body** (DTO `DerivacionInput`):

```json
{
  "usuario_id": "ciudadano-001",
  "detalle_solicitud": "Solicito copia certificada de partida de nacimiento ...",
  "dependencia_asignada": "MesaDePartes",
  "observaciones": "Ciudadano adulto mayor, atencion preferencial."
}
```

Validaciones:
- `detalle_solicitud` — entre 10 y 2000 caracteres.
- `dependencia_asignada` — debe pertenecer al `enum Dependencia`.
- `observaciones` — opcional, hasta 500 caracteres.

**Response 201** (DTO `SolicitudDerivada`):

```json
{
  "id": "f3c1e9b8d4ab4a52...",
  "usuario_id": "ciudadano-001",
  "detalle_solicitud": "...",
  "dependencia_asignada": "MesaDePartes",
  "fecha_ingreso": "2026-05-06T16:23:39+00:00",
  "fecha_maxima_respuesta": "2026-06-17T23:59:59+00:00",
  "estado": "Pendiente",
  "observaciones": "..."
}
```

### 3.4 Endpoint `GET /api/admin/solicitudes/{solicitud_id}` — Consultar solicitud derivada

**Funcionalidad:** Devuelve los datos de auditoria de una solicitud previamente derivada. Util para que el administrador verifique el estado y los plazos sin reabrir el flujo. Tambien protegido por `X-Admin-Token`.

**Errores:**
- `404 Not Found` — `SolicitudNoEncontradaError` cuando el id no existe en el repositorio.
- `403 Forbidden` — token administrativo invalido.

### 3.5 Endpoint `GET /health` — Health check

**Funcionalidad:** Endpoint de liveness pensado para orquestadores (Kubernetes, Docker Compose healthchecks, balanceadores). Devuelve `{"status": "ok"}` con codigo 200 cuando la aplicacion levanto correctamente.

---

## 4. Funcionalidades de la Interfaz Web

### 4.1 Cabecera institucional

Barra superior fija en azul institucional `#1A3A6B` con el logo RENIEC y la leyenda *"Registro Nacional de Identificacion y Estado Civil"*. Establece la identidad visual de toda la aplicacion.

### 4.2 Panel izquierdo — Identidad y mensaje de confianza

Bloque azul oscuro con:
- Logo grande RENIEC con sombra suave.
- Titulo *"Mesa de Partes"*.
- Subtitulo *"Electronica RENIEC"*.
- Descripcion: *"Sistema de voto electronico seguro con cifrado SHA-256 y llaves evolutivas para garantizar anonimato e inmutabilidad."*
- Pildora con el lema *"Seguro · Anonimo · Trazable"* sobre fondo translucido.

Es responsivo: en pantallas pequeñas (`base`) este panel se oculta y el formulario ocupa todo el ancho.

### 4.3 Panel derecho — Formulario de Registro de Solicitud

Tarjeta blanca con sombra `2xl` que contiene:

**Encabezado:**
- Titulo *"Registro de Solicitud"*.
- Texto auxiliar: *"Ingresa tus datos para emitir tu voto de forma segura."*

**Campo `DNI del Votante`:**
- Input numerico con placeholder *"Ingresa tu DNI (8 digitos)"*.
- Sanitizacion en tiempo real: la regex `replace(/\D/g, "")` elimina cualquier caracter no numerico mientras el usuario escribe.
- `maxLength={8}` previene exceder la longitud.
- `inputMode="numeric"` activa el teclado numerico en moviles.

**Campo `ID de Candidato`:**
- Input tipo `number`, minimo 1.
- Placeholder *"Ej. 1"*.

**Boton `Emitir Voto Seguro`:**
- Color institucional azul.
- Estado `loading` con texto *"Procesando voto"* mientras la promesa esta pendiente.

**Validacion en cliente (componente `VotingForm`):**
- DNI debe matchear `/^\d{8}$/`.
- Id de candidato debe ser entero >= 1.
- Si falla, dispara un Toast de tipo `warning` con mensaje especifico.

**Pie:**
- Aviso legal: *"Sistema protegido bajo normas de la Ley N° 27269 — RENIEC 2026"*.

### 4.4 Comprobante de voto (`VotingReceipt`)

Cuando el backend responde 201, se renderiza una tarjeta verde con:
- Encabezado *"Voto Procesado Exitosamente"*.
- Hash SHA-256 cifrado (con `wordBreak="break-all"` para no romper layout).
- Llave genetica utilizada.
- Timestamp formateado a ISO 8601 UTC.

Todo en fuente `monospace` para evidenciar el caracter criptografico del recibo.

### 4.5 Sistema de notificaciones (Toaster)

El componente raiz `App.tsx` reacciona a los cambios de estado del hook `useVoting` mediante dos `useEffect`:

- Si `error` cambia → Toast `error` con titulo *"No se pudo registrar el voto"* y descripcion del mensaje del servidor.
- Si `comprobante` cambia → Toast `success` con titulo *"Voto registrado"* confirmando el cifrado.

### 4.6 Hook `useVoting` — Ciclo de vida de la peticion

Encapsula el estado `{ comprobante, cargando, error }` y expone `votar(payload)` y `reset()`. Aisla la UI del transporte HTTP. La capa `api/votingApi.ts` mapea fallos de red (`fetch` lanza) a `ApiError(0, "No se pudo conectar...")`, y respuestas no-OK a `ApiError(status, detail, tipo)` parseando el JSON del backend.

### 4.7 Panel administrativo `AdminDerivacionPanel` (HU04)

Disponible para el rol administrador (no expuesto por defecto en la ruta principal):
- Lista las solicitudes entrantes via `GET` al backend.
- Permite seleccionar una solicitud y la dependencia destino del catalogo.
- Calcula y muestra en vivo la **fecha maxima de respuesta** (preview) sumando dias habiles en el cliente, replicando la regla del servidor.
- Campo `observaciones` opcional (hasta 500 caracteres).
- Boton `Derivar Solicitud` con estado de carga.
- Toasts para exito y para errores de listado y derivacion.

---

## 5. Resultados Obtenidos hasta el Momento

### 5.1 Funcionalidades verificadas

| Funcionalidad | Estado | Evidencia |
|--------------|--------|-----------|
| Levantar backend con `uvicorn src.main:app --reload --port 8000` | OK | Swagger UI accesible en `/docs` |
| Levantar frontend con `npm run dev` | OK | UI renderizada en `localhost:5173` |
| Health check `GET /health` | OK | Respuesta `{"status":"ok"}` |
| `POST /api/votar` con payload valido | OK | Devuelve hash + llave + timestamp |
| `POST /api/votar` con DNI invalido (`00000000`) | OK | Devuelve `422` con detalle |
| `POST /api/votar` con campos extra | OK | Pydantic rechaza por `extra="forbid"` |
| `GET /api/votos_audit` | OK | Lista anonima de votos |
| `POST /api/admin/solicitudes/derivar` con token | OK | Devuelve solicitud con fechas calculadas |
| Derivacion sin token administrativo | OK | Devuelve `403 Forbidden` |
| Calculo de fecha maxima (30 dias habiles, salta fin de semana) | OK | Validado contra calendario manual |
| UI: rediseño de dos paneles con identidad RENIEC | OK | Captura de pantalla actual |
| UI: validacion en cliente (DNI 8 digitos, id >= 1) | OK | Toast `warning` se dispara correctamente |
| UI: comprobante visible tras voto exitoso | OK | Componente `VotingReceipt` muestra hash |
| UI: Toast de error cuando backend devuelve >=400 | OK | Mensaje del backend se propaga |

### 5.2 Mejoras visuales aplicadas en esta iteracion

- Layout de dos columnas con `Flex` responsivo (`base` columna unica, `md` dos columnas).
- Bordes redondeados asimetricos (`borderRadius="2xl 0 0 2xl"` izquierdo, `"0 2xl 2xl 0"` derecho) para fundir los paneles visualmente.
- Sombra `2xl` en panel derecho para resaltar el area de accion.
- Logo con `filter="drop-shadow(...)"` para integracion sobre fondo oscuro.
- Tipografia jerarquica: `Heading size="lg"` en titulo, `size="md"` en subtitulo, `Text fontSize="sm"` en descripcion.
- Pildora con borde semi-transparente (`whiteAlpha.300`) para el lema institucional.
- Aviso legal con tipografia tenue (`gray.400`) en el pie del formulario.

### 5.3 Calidad del codigo

- **Tipado estricto TypeScript** en todo el frontend, sin `any`.
- **Pydantic v2** con `ConfigDict(extra="forbid", frozen=True, str_strip_whitespace=True)` para inmutabilidad y limpieza de strings.
- **Inyeccion de dependencias** via `Depends(get_voto_service)` y `lru_cache(maxsize=1)` para singletons.
- **Thread safety** con `threading.Lock` en todos los repositorios en memoria.
- **Logging estructurado** con `logging_config.get_logger(__name__)` en cada modulo.
- **Handlers globales** de excepciones de dominio centralizados en `excepciones/errors.py`.

---

## 6. Errores Detectados y Posibles Causas

### 6.1 Issue #001 — Voto duplicado por DNI (CRITICO, ABIERTO)

**Sintoma observado:** El DNI `72718915` pudo emitir 5 votos exitosos en menos de 2 minutos:

| Hora UTC | Candidato | Resultado |
|----------|-----------|-----------|
| 16:23:39 | 3 | 201 OK |
| 16:24:08 | 3 | 201 OK |
| 16:24:21 | 3 | 201 OK |
| 16:24:36 | 5 | 201 OK |
| 16:24:44 | 5 | 201 OK |

Cada peticion devolvio un hash distinto y ninguna fue rechazada.

**Causa raiz:** El servicio `VotoService.registrar_voto` (`backend/src/servicios/voto_service.py`) verifica unicamente `if hash_voto in self._hashes` para detectar duplicados. **El hash incluye la llave genetica**, que es regenerada en cada llamada por `AlgoritmoGenetico.generar_llave()`. Por construccion, dos votos del mismo DNI al mismo candidato producen hashes distintos — la verificacion es insuficiente para garantizar el principio "un ciudadano, un voto".

Adicionalmente, el frontend (`useVoting.ts`) **no mantiene estado de "ya voto"** tras una emision exitosa: el formulario sigue habilitado y el usuario puede reenviar.

**Impacto:**
- Integridad electoral comprometida: un votante puede inflar votos para cualquier candidato.
- Falla del criterio de aceptacion CA3 de HU04 ("unicidad de solicitudes").
- Sistema no cumple el requisito basico de la Ley N° 27269 sobre unicidad del voto.

**Solucion planeada (referenciada en `ISSUES.md`):**

*Capa backend:*
1. Agregar `Set[str] _dnis_votantes` en `VotoService` que almacene el **hash SHA-256 del DNI en crudo** (no del DNI mismo, para preservar anonimato).
2. Antes de persistir, verificar si `sha256(dni)` ya esta en el set; si si, lanzar `VotoDuplicadoError` (ya devuelve `409 Conflict`).
3. Proteger el set con el mismo `threading.Lock` ya existente.

*Capa frontend:*
4. En `useVoting.ts` agregar estado `yaVoto: boolean` que se ponga en `true` cuando `comprobante != null`.
5. En `VotingForm.tsx` recibir `disabled={yaVoto}` y cambiar el texto del boton a *"Voto ya emitido"*.
6. Capturar especificamente `status === 409` y mostrar Toast `error` con mensaje *"Este DNI ya emitio su voto. No es posible votar dos veces."*

### 6.2 Otros errores y debilidades detectadas

#### 6.2.1 Frontend desconoce los codigos de estado HTTP

**Sintoma:** Los Toasts de error muestran el `detail` crudo del backend sin distinguir entre `422` (validacion), `409` (conflicto) y `500` (interno).

**Causa:** `useVoting.ts` no inspecciona `error.status` para personalizar el mensaje. Toda la informacion contextual (tipo de error, severidad) queda colapsada en un unico `error.message`.

**Posible solucion:** Discriminar por `error.status` en el `useEffect` del Toast y usar mapas de mensajes localizados por codigo.

#### 6.2.2 Persistencia volatil

**Sintoma:** Al reiniciar el servidor, todos los votos y solicitudes se pierden.

**Causa:** Los repositorios usan `dict` y `set` en memoria (`RepositorioSolicitudEnMemoria`, `VotoService._votos`). Es intencional para el sprint actual pero impide pruebas de continuidad.

**Posible solucion:** Implementar un adaptador SQLAlchemy (PostgreSQL/SQLite) que honre los puertos `SolicitudRepository` ya definidos. La capa de servicios no requiere cambios (DIP).

#### 6.2.3 Token administrativo en variable de entorno plana

**Sintoma:** `verificar_admin` compara `X-Admin-Token` contra `os.getenv("ADMIN_TOKEN")` sin rotacion ni firma.

**Causa:** Implementacion provisional para desbloquear las pruebas del flujo HU04. No es apta para produccion.

**Posible solucion:** Reemplazar por validacion de JWT firmado con clave publica del IdP corporativo, claims de rol y expiracion. La dependencia `verificar_admin` esta aislada justamente para este reemplazo.

#### 6.2.4 CORS abierto a todos los origenes

**Sintoma:** `allow_origins=settings.cors_origins` puede estar configurado de forma laxa en desarrollo.

**Causa:** Conveniencia para el equipo durante el sprint.

**Posible solucion:** Restringir a una whitelist en produccion (`https://reniec.gob.pe`, dominios oficiales).

#### 6.2.5 Falta de rate limiting

**Sintoma:** El endpoint `POST /api/votar` acepta peticiones sin restriccion de tasa por IP o por DNI.

**Causa:** No se ha incorporado un middleware tipo `slowapi` o `fastapi-limiter`.

**Posible solucion:** Anadir rate limiting por IP y por DNI hasheado, especialmente critico una vez resuelto el Issue #001.

#### 6.2.6 Calculo de dias habiles ignora feriados nacionales

**Sintoma:** `sumar_dias_habiles` solo salta sabados y domingos. Si el plazo cae en Fiestas Patrias o Navidad, la dependencia recibe un plazo erroneo.

**Causa:** El docstring de `solicitud_service.py` explicitamente declara: *"No considera feriados nacionales: ese requisito puede agregarse inyectando un calendario de feriados sin alterar la firma publica."*

**Posible solucion:** Inyectar un servicio `CalendarioFeriadosPeru` con la lista oficial publicada por el MTPE.

#### 6.2.7 Validacion del DNI puramente sintactica

**Sintoma:** Cualquier secuencia de 8 digitos no repetidos pasa la validacion (`12345678`, `99999998`, etc.).

**Causa:** No hay verificacion contra el padron real de RENIEC.

**Posible solucion:** Cuando el sistema se integre con el padron oficial, anadir una llamada de verificacion tras la validacion sintactica.

#### 6.2.8 Comprobante no firma temporalmente

**Sintoma:** El `timestamp` del comprobante es generado por el servidor sin firma criptografica. Un atacante con acceso al servidor podria reescribir registros.

**Causa:** El alcance del sprint solo cubrio cifrado de la identidad, no firma de auditoria.

**Posible solucion:** Encadenar los hashes (estilo blockchain ligero) o firmar cada comprobante con clave privada del servidor.

---

## 7. Tareas Futuras

### 7.1 Sprint inmediato (resolucion del Issue #001)

| ID | Tarea | Capa | Prioridad |
|----|-------|------|-----------|
| T01 | Agregar `_dnis_votantes: set[str]` a `VotoService` | Backend | CRITICA |
| T02 | Verificar hash de DNI antes de registrar y lanzar `VotoDuplicadoError` | Backend | CRITICA |
| T03 | Test de smoke: 1er voto 201, 2do voto mismo DNI 409, voto distinto DNI 201 | Backend | CRITICA |
| T04 | Estado `yaVoto` en `useVoting.ts` que bloquee el boton | Frontend | CRITICA |
| T05 | Mensaje especifico para `status === 409` en el Toast de error | Frontend | CRITICA |
| T06 | Mensaje informativo permanente en `VotingForm` cuando `yaVoto === true` | Frontend | ALTA |

### 7.2 Sprint siguiente — Endurecimiento de seguridad

| ID | Tarea | Detalle |
|----|-------|---------|
| T07 | Reemplazar `X-Admin-Token` plano por JWT con verificacion de firma y expiracion | Backend |
| T08 | Anadir middleware de rate limiting por IP y por hash de DNI | Backend |
| T09 | Restringir CORS a whitelist explicita en `settings.cors_origins` para produccion | Backend |
| T10 | Encadenar hashes de comprobantes (cada voto incluye el hash del anterior) | Backend |
| T11 | Logs de auditoria persistentes (archivo rotativo + envio a SIEM) | Infra |
| T12 | Pruebas de carga con `locust` o `k6` simulando 10K votos concurrentes | QA |

### 7.3 Sprint posterior — Persistencia y observabilidad

| ID | Tarea | Detalle |
|----|-------|---------|
| T13 | Adaptador `RepositorioSolicitudPostgres` cumpliendo el puerto `SolicitudRepository` | Backend |
| T14 | Migraciones con Alembic para `Solicitud` y `Voto` | Backend |
| T15 | Inyeccion de calendario de feriados peruanos en `sumar_dias_habiles` | Backend |
| T16 | Endpoint `GET /metrics` formato Prometheus (request rate, latencia, errores) | Backend |
| T17 | Dashboards Grafana de votos/min y solicitudes derivadas/dia | Infra |
| T18 | Trazas distribuidas con OpenTelemetry | Backend |

### 7.4 Sprint posterior — Producto y experiencia

| ID | Tarea | Detalle |
|----|-------|---------|
| T19 | Pantalla publica de resultados agregados (sin exponer hashes individuales) | Frontend |
| T20 | Soporte multidioma (es-PE / qu-PE / ay-PE) con `react-i18next` | Frontend |
| T21 | Modo accesibilidad WCAG 2.1 AA: contraste, navegacion por teclado, ARIA | Frontend |
| T22 | Vista responsive optimizada para movil (panel izquierdo se transforma en hero compacto) | Frontend |
| T23 | Integracion con padron oficial RENIEC para validacion real de DNI | Backend |
| T24 | Firma del comprobante con clave privada del servidor + verificacion en cliente | Full-stack |

### 7.5 Sprint posterior — Procesos y entrega

| ID | Tarea | Detalle |
|----|-------|---------|
| T25 | Pipeline CI con GitHub Actions: lint + tests + build de Docker images | DevOps |
| T26 | Imagenes Docker para backend y frontend + `docker-compose.yml` | DevOps |
| T27 | Despliegue continuo a entorno de staging con health checks automaticos | DevOps |
| T28 | Documentacion OpenAPI exportada y publicada para consumidores externos | Backend |
| T29 | Manual del administrador (uso del panel HU04, troubleshooting) | Documentacion |

---

## 8. Conclusiones

El sistema VotingSystem cumple con los criterios funcionales basicos de la HU04 — **derivacion de solicitudes a dependencias con calculo automatico de plazos** — y entrega ademas una capa de cifrado de votos como base para el modulo de votacion electronica.

La arquitectura limpia (puertos, adaptadores, inyeccion de dependencias) ha demostrado su valor: el reemplazo eventual de la persistencia en memoria por una base de datos real, o del token plano por JWT, no requiere modificar la capa de servicios ni los endpoints HTTP.

El hallazgo critico del **Issue #001 (voto duplicado por DNI)** es la prioridad inmediata del proximo sprint: el sistema actualmente **no garantiza unicidad del voto**, lo que invalida cualquier despliegue real. La solucion esta diseñada y esta a la espera de implementacion en ambas capas (backend + frontend).

Las mejoras visuales aplicadas en esta iteracion elevan la percepcion de profesionalismo del producto y refuerzan la identidad institucional RENIEC, lo cual es relevante para construir confianza ciudadana en un sistema de voto electronico.

---

*Documento generado el 2026-05-06 — Grupo 2, Sprint 3.*
