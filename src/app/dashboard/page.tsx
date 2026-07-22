import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function DashboardRedirectPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/auth/login');
  }

  if (session.user.role === 'ADMIN') {
    redirect('/admin/dashboard');
  }

  if (session.user.role === 'BARBER') {
    redirect('/barber/dashboard');
  }

  // Clients go to their luxury agenda/appointments experience
  redirect('/agenda');
}
