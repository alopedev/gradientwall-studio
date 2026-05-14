# Recovery preserva Allowance y solo extiende la Deadline

Cuando un comprador usa `/recover`, le devolvemos exactamente la posición que tenía: el **Allowance** se preserva tal cual (no se reinicia a 5) y la **Deadline** se ajusta a `max(now + 7d, stored.deadline)` para que recovery nunca penalice — solo ayude a quien está cerca del límite.

Consideramos resetear el contador a 5 en cada recovery (más generoso pero abre vía a "compra una vez, descarga ilimitada") y mantener Deadline fija a `now + 7d` siempre (lo que hacía el código antes: penalizaba al comprador que pedía recovery los primeros días).

Recovery rechaza Orders con Allowance agotado o Deadline pasada: devuelve `ok: true, reason: "expired" | "exhausted"` para mantener anti-enumeration sin mandar emails inútiles.
