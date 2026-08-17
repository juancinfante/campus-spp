import ExcelJS from 'exceljs';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Excel con TODAS las notas del examen (sin paginar — la paginación es
// solo para la pantalla). Devuelve 404 si no sos el profesor dueño.
export async function GET(_request: Request, { params }: { params: Promise<{ quizId: string }> }) {
  const { quizId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse('No autorizado', { status: 401 });

  const { data: quiz } = await supabase
    .from('quizzes')
    .select('id, title, courses!inner(title, teacher_id)')
    .eq('id', quizId)
    .single();

  if (!quiz || quiz.courses?.teacher_id !== user.id) {
    return new NextResponse('No encontrado', { status: 404 });
  }

  const { data: attempts } = await supabase
    .from('quiz_attempts')
    .select('score, submitted_at, profiles(full_name)')
    .eq('quiz_id', quizId)
    .eq('status', 'submitted')
    .order('submitted_at', { ascending: false });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Calificaciones');
  sheet.columns = [
    { header: 'Alumno', key: 'name', width: 34 },
    { header: 'Puntaje (%)', key: 'score', width: 14 },
    { header: 'Fecha', key: 'date', width: 20 },
  ];
  sheet.getRow(1).font = { bold: true };

  for (const a of attempts ?? []) {
    sheet.addRow({
      name: a.profiles?.full_name ?? '—',
      score: a.score ?? '',
      date: new Date(a.submitted_at).toLocaleString('es-AR'),
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const safeTitle = quiz.title.replace(/[^a-zA-Z0-9-]+/g, '-').toLowerCase();

  return new NextResponse(buffer as Buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="calificaciones-${safeTitle}.xlsx"`,
    },
  });
}
