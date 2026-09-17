# Excepciones de seguridad revisadas

## `public.merge_applications(uuid, uuid)` — SECURITY DEFINER

Aviso del escáner: *"Signed-In Users Can Execute SECURITY DEFINER Function"*.

**Estado: excepción aceptada y revisada (17 de septiembre de 2026).** No se cambia a
`SECURITY INVOKER` ni se silencia el aviso.

Revisión realizada sobre la definición real en la base de datos:

| Requisito | Resultado |
| --- | --- |
| Exige usuario autenticado | Sí. `auth.uid()` es `NULL` sin sesión, y la comparación `IS DISTINCT FROM auth.uid()` lanza excepción. |
| Verifica que ambas candidaturas son del usuario | Sí. Comprueba `user_id` de la canónica y de la duplicada contra `auth.uid()` antes de cualquier escritura. |
| `anon` no puede ejecutarla | Sí. ACL real: `postgres=X`, `authenticated=X`, `service_role=X`. `anon` no tiene EXECUTE (revocado a PUBLIC). |
| No permite actuar sobre datos de otro usuario | Sí. Sin coincidencia de propietario aborta con excepción; además bloquea ambas filas con `FOR UPDATE` antes de validar. |
| `search_path` seguro | Sí. `SET search_path TO 'public'` y todas las tablas referenciadas con esquema explícito (`public.…`). |
| SQL dinámico inseguro | No existe. Ningún `EXECUTE`/`format()`; solo sentencias estáticas con parámetros `uuid`. |

Validaciones adicionales: rechaza `NULL` y `canonical_id = duplicate_id`, y exige que
ambas candidaturas existan antes de fusionar. Todo ocurre en una única transacción,
así que un fallo no deja registros parciales.

Es el mismo patrón que ya usa `handle_new_user()` en este proyecto.
