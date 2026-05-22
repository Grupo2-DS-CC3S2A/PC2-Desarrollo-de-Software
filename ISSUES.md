# ISSUES - Sistema de Voto Electronico (VotingSystem)

## Issue #001 — Voto Duplicado por DNI (CRITICO)

**Reportado por:** Alvaro Jesus Taipe Cotrina  
**Fecha:** 2026-05-06  
**Severidad:** CRITICA — Compromete la integridad total del sistema de votacion  
**Estado:** ABIERTO  
**Vinculado a:** SCRUM-14 (HU04), Historia HU-VOTOS

---

### Descripcion del Problema

El sistema actualmente permite que un mismo DNI emita multiples votos sin ningun tipo de restriccion. Se comprobaron los siguientes escenarios de abuso:

1. **Voto repetido al mismo candidato:** El DNI `72718915` pudo votar al candidato `3` en tres ocasiones distintas, recibiendo un hash diferente en cada ocasion (a las 16:23:39, 16:24:08 y 16:24:21 UTC), siendo todos aceptados como exitosos.
2. **Voto a candidatos diferentes con el mismo DNI:** El DNI `72718915` ademas pudo cambiar su voto al candidato `5` en dos ocasiones mas (16:24:36 y 16:24:44 UTC), lo que representa una violacion directa del principio "un ciudadano, un voto".
3. **Ausencia de mensaje de error:** El sistema no devuelve ninguna advertencia, bloqueo ni notificacion al usuario indicando que ese DNI ya emitio un voto previo. El formulario simplemente procesa el nuevo voto como si fuera el primero.

### Evidencia Visual

Se adjuntan 5 capturas de pantalla mostrando el mismo DNI votando exitosamente multiples veces con distintos hashes y timestamps distintos.

### Impacto

- **Integridad electoral:** Un votante puede inflar artificialmente el conteo de votos de cualquier candidato.
- **Confianza en el sistema:** El sistema no cumple el requisito basico de "un voto por ciudadano".
- **Falla de criterio de aceptacion:** El CA3 de HU04 ("Envio de solicitud a dependencia") asume unicidad de solicitudes; la capa de votos debe heredar la misma garantia.

---

### Comportamiento Esperado

1. Al intentar votar con un DNI que ya registro un voto, el backend debe devolver un error HTTP `409 Conflict`.
2. El frontend debe capturar ese error `409` y mostrar un Toast de tipo `error` (no `warning`) con el mensaje: **"Este DNI ya emitio su voto. No es posible votar dos veces."**
3. El formulario debe quedar bloqueado (boton deshabilitado) una vez que el voto fue procesado exitosamente en esa sesion, hasta que la pagina sea recargada manualmente.
4. El bloqueo debe operar tanto a nivel de sesion (frontend) como a nivel de persistencia (backend), para que incluso si el usuario recarga la pagina, el DNI quede bloqueado en el repositorio de votos.

---

### Prompt para Claude Code (Resolucion Completa)

Copiar y pegar el siguiente prompt en Claude Code para resolver el issue de raiz:

---

```
Actua como Arquitecto de Software Senior especializado en sistemas de votacion electronica segura.
Existe un bug CRITICO en el sistema VotingSystem (FastAPI + React + Chakra UI v3).

BUG CONFIRMADO:
Un mismo DNI puede emitir multiples votos. El sistema no tiene ninguna restriccion ni bloqueo.
Se comprobaron 5 votos exitosos del mismo DNI en menos de 2 minutos.

SOLUCION REQUERIDA EN DOS CAPAS:

--- CAPA BACKEND (VotingSystem/backend/) ---

1. En src/repositorios/ (o donde esten los votos en memoria), agrega un Set<str> llamado
   `_dnis_votantes` que registre el hash SHA-256 del DNI de cada votante que ya voto.
   USA el hash, no el DNI en crudo, para preservar el anonimato.

2. En el servicio que procesa el voto (src/servicios/ o src/rutas/votos.py), ANTES de
   persistir el nuevo voto, verifica si el hash del DNI ya existe en `_dnis_votantes`.
   - Si YA existe: lanza una excepcion que resulte en HTTP 409 Conflict con el mensaje:
     {"detail": "Este DNI ya emitio su voto.", "tipo": "VotoDuplicadoError"}
   - Si NO existe: registra el hash en `_dnis_votantes` y procede con el guardado normal.

3. El Set `_dnis_votantes` debe ser thread-safe (usa threading.Lock igual que el repositorio
   de solicitudes ya implementado en src/repositorios/solicitud_repo.py).

4. En src/excepciones/errors.py agrega VotoDuplicadoError y su handler que devuelva 409.

5. Smoke test: despues de implementar, verifica que:
   - El primer POST /api/votos con DNI "12345678" devuelve 201.
   - El segundo POST /api/votos con el mismo DNI devuelve 409.
   - Un tercer POST con un DNI diferente devuelve 201 (no hay colision entre distintos DNIs).

--- CAPA FRONTEND (VotingSystem/frontend/) ---

6. En src/hooks/useVoting.ts, una vez que el voto fue registrado exitosamente (comprobante != null),
   agrega un estado booleano `yaVoto: boolean` que se ponga en `true`.

7. En src/components/VotingForm.tsx, el boton "Emitir Voto Seguro" debe recibir la prop
   `disabled={yaVoto}` y mostrar el texto "Voto ya emitido" cuando yaVoto sea true.
   Ademas el formulario completo debe mostrar un mensaje informativo:
   "Tu DNI ya fue registrado en esta sesion. Solo se permite un voto por ciudadano."

8. En src/hooks/useVoting.ts, cuando el error capturado tenga status 409, el mensaje
   del Toast debe ser especificamente: "Este DNI ya emitio su voto. No es posible votar dos veces."
   (tipo "error", no "warning").

Mantiene Clean Architecture, tipado estricto TypeScript y aplica principio SRP.
No rompas los tests existentes ni la integracion con HU04.
```
