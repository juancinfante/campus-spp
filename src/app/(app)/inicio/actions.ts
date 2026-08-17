'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { sanitizeRichText } from '@/lib/sanitize';
import { stripHtml } from '@/lib/strip-html';

export type NewsFormState = { error: string } | undefined;

export async function createNewsPost(
  _prevState: NewsFormState,
  formData: FormData
): Promise<NewsFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado.' };

  const title = String(formData.get('title') ?? '').trim();
  const contentHtml = sanitizeRichText(String(formData.get('content') ?? ''));

  if (!title) return { error: 'El título es obligatorio.' };
  if (stripHtml(contentHtml).length === 0) return { error: 'Escribí algo de contenido.' };

  const { error } = await supabase
    .from('news_posts')
    .insert({ author_id: user.id, title, content: contentHtml });

  if (error) return { error: error.message };

  revalidatePath('/inicio');
}

export async function deleteNewsPost(formData: FormData) {
  const supabase = await createClient();
  const postId = String(formData.get('post_id') ?? '');
  if (!postId) return;

  await supabase.from('news_posts').delete().eq('id', postId);
  revalidatePath('/inicio');
}
