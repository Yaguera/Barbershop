import { processReminders } from '@/infra/notifications/process-reminders';
import { timingSafeEqual } from 'node:crypto';
export const runtime = 'nodejs';
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return Response.json({ error: 'Agendador não configurado.' }, { status: 503 });
  const expected = Buffer.from('Bearer ' + secret);
  const supplied = Buffer.from(request.headers.get('authorization') || '');
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) {
    return Response.json({ error: 'Não autorizado.' }, { status: 401 });
  }
  try { return Response.json({ success: true, ...await processReminders() }); }
  catch (error) {
    console.error('Falha ao processar lembretes:', error);
    return Response.json({ error: 'Erro interno.' }, { status: 500 });
  }
}
// GET supports external schedulers and requires the same secret.
export async function GET(request: Request) { return POST(request); }
