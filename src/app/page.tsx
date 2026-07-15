import { PrismaBarberRepository } from '@/infra/repositories/PrismaBarberRepository';
import { PrismaServiceRepository } from '@/infra/repositories/PrismaServiceRepository';
import { auth } from '@/auth';
import BookingFlow from '@/components/BookingFlow';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { User, LogOut } from 'lucide-react';
import Image from 'next/image';

export default async function Home() {
  const session = await auth();

  if (session?.user) {
    if (session.user.role === 'BARBER') {
      redirect('/barber/dashboard');
    }
    if (session.user.role === 'ADMIN') {
      redirect('/admin/dashboard');
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
        specialty: specialty || 'Especialista em Cortes & Barba',
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
    <div className="flex flex-col min-h-screen bg-preto-profundo text-branco selection:bg-dourado-premium/30">
      {/* Mobile-first top bar */}
      <header className="sticky top-0 z-40 bg-preto-profundo/80 backdrop-blur-xl border-b border-branco/5">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between max-w-md">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full border border-dourado-premium/30 overflow-hidden">
              <Image src="/logo.png" alt="Logo" width={32} height={32} className="object-cover" />
            </div>
            <span className="text-sm font-bold tracking-widest uppercase text-branco">
              Corte & <span className="text-dourado-premium">Estilo</span>
            </span>
          </Link>
          
          <nav className="flex items-center">
            {session ? (
              <div className="flex items-center gap-4">
                <Link href="/dashboard" className="text-branco/50 hover:text-dourado-premium transition-colors">
                  <User className="w-5 h-5" />
                </Link>
                <Link href="/api/auth/signout?callbackUrl=/" className="text-branco/50 hover:text-red-400 transition-colors">
                  <LogOut className="w-5 h-5" />
                </Link>
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="text-xs font-bold uppercase tracking-wider text-dourado-premium px-4 py-2 rounded-full border border-dourado-premium/30 hover:bg-dourado-premium/10 transition-all"
              >
                Entrar
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Main Flow */}
      <main className="flex-grow container mx-auto px-4 py-6 max-w-md">
        <BookingFlow initialServices={services} initialBarbers={barbers} />
      </main>

      {/* Minimal Footer */}
      <footer className="py-6 text-center text-xs text-branco/30 uppercase tracking-widest max-w-md mx-auto w-full border-t border-branco/5">
        <p>© {new Date().getFullYear()} Corte & Estilo.</p>
      </footer>
    </div>
  );
}
