# La clave primaria de Order es un UUID nuestro, no el `orderId` de Lemon Squeezy

La **Order** persistida en Blobs se identifica por un UUID que generamos al recibir el webhook `order_created`. El `orderId` de Lemon Squeezy se guarda en un campo aparte (`lsOrderId`) e indexado en un puntero secundario `lsOrderId → orderId` para que `/recover` siga aceptando el ID que el comprador ve en su email de LS.

La alternativa rechazada fue usar el `orderId` de LS como clave primaria (más simple, un solo ID en juego). Se descartó por lock-in: cambiar de proveedor de pago obligaría a migrar todas las keys del store y reemitir todos los JWT vivos. Con esta decisión, llegar a un segundo proveedor es solo "añadir un campo `paddleOrderId`" — no una migración.

**Coste asumido**: dos IDs que coordinar; `/recover` hace una indirección de lectura más (puntero → Order). En la escala del MVP es despreciable y Blobs no penaliza la operación.
