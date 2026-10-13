import { auth } from '@/auth';
import { ForbiddenView } from '@/components/auth/ForbiddenView';
import { UnauthorizedView } from '@/components/auth/UnauthorizedView';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function LegacyBarberAgendaPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return <UnauthorizedView callbackUrl="/barber/agenda" />;
  }

  if (session.user.role !== 'BARBER' && session.user.role !== 'ADMIN') {
    return (
      <ForbiddenView
        currentRole={session.user.role}
        allowedRoles={['BARBER', 'ADMIN']}
        message="A agenda profissional é restrita a barbeiros e administradores."
      />
    );
  }

  redirect('/barber/agenda');
}
