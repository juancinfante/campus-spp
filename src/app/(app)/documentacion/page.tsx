import { getViewer } from '@/lib/viewer';
import { ConfirmButton } from '@/components/ui/ConfirmButton';
import { uploadGeneralDocuments, deleteGeneralDocument } from './actions';

function formatSize(bytes: number | null) {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function DocumentacionPage() {
  const { supabase, user, profile } = await getViewer();
  if (!user || !profile) return null;

  const isTeacher = profile.role === 'teacher';

  const { data: documents } = await supabase
    .from('general_documents')
    .select('id, file_name, file_path, file_size, uploaded_at, profiles(full_name)')
    .order('uploaded_at', { ascending: false });

  const documentsWithUrls = await Promise.all(
    (documents ?? []).map(async (d) => {
      const { data } = await supabase.storage
        .from('general-documents')
        .createSignedUrl(d.file_path, 60 * 10);
      return { ...d, signedUrl: data?.signedUrl ?? null };
    })
  );

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Documentación</h1>
        <p className="mt-1 text-muted">
          Material general para todo el personal, sin ligar a ninguna clase en particular.
        </p>
      </div>

      {documentsWithUrls.length === 0 ? (
        <p className="text-sm text-muted">Todavía no hay documentos cargados.</p>
      ) : (
        <ul className="divide-y divide-line rounded-lg border border-line bg-white">
          {documentsWithUrls.map((d) => (
            <li key={d.id} className="flex items-center justify-between gap-3 px-5 py-3">
              <div>
                <p className="text-sm text-ink">{d.file_name}</p>
                <p className="text-xs text-muted">
                  {d.profiles?.full_name}
                  {d.file_size != null && ` · ${formatSize(d.file_size)}`}
                  {' · '}
                  {new Date(d.uploaded_at).toLocaleDateString('es-AR')}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {d.signedUrl ? (
                  <a href={d.signedUrl} className="text-sm font-medium text-teal hover:underline">
                    ↓ Descargar
                  </a>
                ) : (
                  <span className="text-xs text-muted">No disponible</span>
                )}
                {isTeacher && (
                  <form action={deleteGeneralDocument}>
                    <input type="hidden" name="resource_id" value={d.id} />
                    <input type="hidden" name="file_path" value={d.file_path} />
                    <ConfirmButton
                      confirmText={`¿Eliminar "${d.file_name}"?`}
                      className="text-xs font-medium text-danger hover:underline"
                    >
                      Eliminar
                    </ConfirmButton>
                  </form>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {isTeacher && (
        <form
          action={uploadGeneralDocuments}
          className="flex flex-wrap items-center gap-2.5 rounded-lg border border-dashed border-line p-5"
        >
          <input
            type="file"
            name="files"
            multiple
            required
            className="flex-1 text-sm text-muted file:mr-3 file:rounded-md file:border file:border-line file:bg-paper file:px-3 file:py-1.5 file:text-sm file:text-ink"
          />
          <button
            type="submit"
            className="rounded-md bg-teal px-4 py-2 text-sm font-medium text-white hover:bg-teal-dark"
          >
            Subir
          </button>
          <p className="w-full text-xs text-muted">Podés seleccionar varios archivos a la vez.</p>
        </form>
      )}
    </div>
  );
}
