'use server';

import { createClient } from '@/lib/supabase/server';

export type UploadResult = { url: string } | { error: string };

// La usa el botón de imagen del editor de texto enriquecido — tanto en
// la descripción de una clase como en una noticia. Sube al bucket
// público "editor-media" (ver el esquema: mismo nivel de visibilidad
// que la descripción, no requiere estar inscripto).
export async function uploadEditorImage(formData: FormData): Promise<UploadResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado.' };

  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) return { error: 'Archivo inválido.' };
  if (!file.type.startsWith('image/')) return { error: 'Tiene que ser una imagen.' };

  const path = `${crypto.randomUUID()}-${file.name}`;
  const { error } = await supabase.storage.from('editor-media').upload(path, file);
  if (error) return { error: error.message };

  const { data } = supabase.storage.from('editor-media').getPublicUrl(path);
  return { url: data.publicUrl };
}
