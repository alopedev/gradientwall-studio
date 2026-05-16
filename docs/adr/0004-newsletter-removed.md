# Newsletter eliminada del scope

GradientWall no tendrá newsletter. Eliminado el handler `newsletter-subscribe`, el método `addContact` del cliente Loops y todas las referencias en docs. Loops se mantiene únicamente para el email transaccional "Your pack is ready".

La PRD original (`docs/PRD-tienda-packs.md`) listaba newsletter como feature de v1 (user stories 25–27, audience separada `newsletter_subscribers`, componente `NewsletterForm`, handler `newsletter-subscribe`). Esa parte de la PRD queda obsoleta — se conserva la PRD como histórico de intención con una nota de deprecación arriba.

Motivo: la newsletter introducía un canal de relación continua con el visitante que el dueño no quiere mantener. El producto se sostiene con dos puntos de contacto: el Studio (uso anónimo) y el email transaccional post-compra. Suficiente para el modelo de negocio.

**Consecuencia operativa**: no hay que crear audiencias en Loops; basta con la cuenta + la transactional. El `LOOPS_API_KEY` sigue siendo necesario, pero solo para `sendTransactional`.
