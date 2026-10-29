import { auth } from '@/auth';
import BookingFlow from '@/components/BookingFlow';
import { PrismaBarberRepository } from '@/infra/repositories/PrismaBarberRepository';
import { PrismaServiceRepository } from '@/infra/repositories/PrismaServiceRepository';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

export default async function Home() {
  const session = await auth();

  if (session?.user) {
    if (session.user.role === 'BARBER') {
      redirect('/barber/dashboard');
    }
    if (session.user.role === 'ADMIN') {
      redirect('/admin/dashboard');
    }
    if (session.user.role === 'RECEPTIONIST') {
      redirect('/atendente');
    }
  }

  // 1. Fetch Barbers and Services from Repositories
  const barberRepo = new PrismaBarberRepository();
  const serviceRepo = new PrismaServiceRepository();

  const barbersResult = await barberRepo.findAll({ activeOnly: true });
  const servicesResult = await serviceRepo.findAll({ activeOnly: true });

  const barbers = await Promise.all(
    barbersResult.map(async (b) => {
      const specialty = await barberRepo.getBarberSpecialty(b.id);
      return {
        id: b.id,
        name: b.user?.name || 'Barbeiro',
        workDays: b.workDays,
        workStart: b.workStart,
        workEnd: b.workEnd,
        image: b.user?.image || null,
        active: b.user?.active ?? true,
        specialty: specialty || undefined,
      };
    })
  );

  const services = servicesResult.map((s) => ({
    id: s.id,
    name: s.name,
    price: s.price,
    durationMinutes: s.durationMinutes,
    image: s.image || null,
  }));

  return (
    <div className="flex flex-col min-h-screen bg-[#0D0D0D] text-[#FFFFFF] selection:bg-[#D4AF37]/30 font-sans">
      <main className="flex-grow w-full">
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-[#D4AF37] font-bold">Carregando experiência VIP...</div>}>
          <BookingFlow initialServices={services} initialBarbers={barbers} />
        </Suspense>
      </main>
    </div>
  );
}
