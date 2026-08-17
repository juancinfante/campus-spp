// Para previews (cards, listados) donde necesitamos texto plano, no
// el HTML completo del editor.
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}
