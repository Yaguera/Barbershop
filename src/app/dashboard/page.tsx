import { auth } from '@/auth';
import { UnauthorizedView } from '@/components/auth/UnauthorizedView';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function DashboardRedirectPage() {
  const session = await auth();

  if (!session?.user) {
    return <UnauthorizedView callbackUrl="/dashboard" />;
  }

  if (session.user.role === 'ADMIN') {
    redirect('/admin/dashboard');
  }

  if (session.user.role === 'BARBER') {
    redirect('/barber/dashboard');
  }

  if (session.user.role === 'RECEPTIONIST') {
    redirect('/atendente');
  }

  // Clientes vão para sua agenda de atendimentos
  redirect('/agenda');
}
