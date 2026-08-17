import sanitizeHtml from 'sanitize-html';

// El editor de texto enriquecido genera HTML válido por construcción
// (solo puede producir los nodos que su esquema conoce), PERO un actor
// malicioso podría mandar HTML propio directo al server action sin
// pasar por el editor. Por eso sanitizamos siempre server-side antes
// de guardar — nunca confiamos en el HTML que llega del cliente.
export function sanitizeRichText(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      'p', 'br', 'strong', 'em', 'u', 's', 'h2', 'h3', 'ul', 'ol', 'li', 'a', 'blockquote', 'img',
    ],
    allowedAttributes: {
      a: ['href', 'target', 'rel'],
      img: ['src', 'alt'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer', target: '_blank' }),
    },
  });
}
