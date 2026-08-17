'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function uploadGeneralDocuments(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const files = formData.getAll('files').filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return;

  for (const file of files) {
    const path = `${crypto.randomUUID()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from('general-documents')
      .upload(path, file);
    if (uploadError) continue;

    await supabase.from('general_documents').insert({
      file_name: file.name,
      file_path: path,
      file_size: file.size,
      uploaded_by: user.id,
    });
  }

  revalidatePath('/documentacion');
}

export async function deleteGeneralDocument(formData: FormData) {
  const supabase = await createClient();
  const resourceId = String(formData.get('resource_id') ?? '');
  const filePath = String(formData.get('file_path') ?? '');
  if (!resourceId) return;

  if (filePath) {
    await supabase.storage.from('general-documents').remove([filePath]);
  }
  await supabase.from('general_documents').delete().eq('id', resourceId);
  revalidatePath('/documentacion');
}
