import 'dotenv/config';
import { prisma } from '../src/infra/db/prisma-client';
import * as bcrypt from 'bcryptjs';

async function main() {
  console.log('Limpando todos os dados antigos de usuários, agendamentos e serviços...');
  await prisma.appointment.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.barber.deleteMany();
  await prisma.service.deleteMany();
  await prisma.user.deleteMany();

  console.log('Seeding database with new José Carlos Barber Shop data...');

  // 1. Create Super Admin with default profile photo
  const adminEmail = 'admin@barber.com';
  const passwordHash = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.create({
    data: {
      name: 'José Carlos (Admin)',
      email: adminEmail,
      passwordHash,
      role: 'ADMIN',
      active: true,
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
    },
  });
  console.log(`Created Super Admin: ${admin.email}`);

  // 2. Seed services (RF09.2)
  console.log('Re-seeding services...');

  const services = [
    { name: 'Social', price: 25.0, durationMinutes: 30, commissionRate: 0.40, image: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&q=80&w=300', active: true },
    { name: 'Barba', price: 25.0, durationMinutes: 30, commissionRate: 0.40, image: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&q=80&w=300', active: true },
    { name: 'Degradê', price: 30.0, durationMinutes: 30, commissionRate: 0.40, image: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&q=80&w=300', active: true },
    { name: 'Sobrancelha', price: 5.0, durationMinutes: 15, commissionRate: 0.30, image: null, active: true },
    { name: 'Social + Tesoura', price: 35.0, durationMinutes: 45, commissionRate: 0.40, image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=300', active: true },
    { name: 'Luzes', price: 75.0, durationMinutes: 90, commissionRate: 0.45, image: null, active: true },
    { name: 'Nevou', price: 100.0, durationMinutes: 120, commissionRate: 0.45, image: null, active: true },
    { name: 'Pigmentação', price: 20.0, durationMinutes: 30, commissionRate: 0.40, image: null, active: true },
    { name: 'Pezinho', price: 10.0, durationMinutes: 15, commissionRate: 0.30, image: null, active: true },
    { name: 'Hidratação', price: 15.0, durationMinutes: 30, commissionRate: 0.40, image: null, active: true },
    { name: 'Lavagem Simples', price: 10.0, durationMinutes: 15, commissionRate: 0.30, image: null, active: true },
    { name: 'Barboterapia', price: 60.0, durationMinutes: 45, commissionRate: 0.40, image: null, active: true },
    { name: 'Combo Social', price: 45.0, durationMinutes: 60, commissionRate: 0.45, image: null, active: true },
    { name: 'Corte Kids', price: 35.0, durationMinutes: 30, commissionRate: 0.40, image: null, active: true },
  ];

  for (const s of services) {
    const created = await prisma.service.create({
      data: s,
    });
    console.log(`Created Service: ${created.name} (${created.price})`);
  }

  // 3. Check if there are any default barbers to seed
  // Let's create an initial barber "Marcos Barber" if none exists, so there's a barber to book immediately!
  // 3. Create initial barber "Marcos de Souza"
  const barberEmail = 'marcos@barber.com';
  const passwordHashBarber = await bcrypt.hash('barber123', 10);
  const barberUser = await prisma.user.create({
    data: {
      name: 'Marcos de Souza',
      email: barberEmail,
      passwordHash: passwordHashBarber,
      role: 'BARBER',
      active: true,
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150',
    }
  });

  await prisma.barber.create({
    data: {
      userId: barberUser.id,
      workDays: [1, 2, 3, 4, 5, 6], // Mon-Sat
      workStart: '09:00',
      workEnd: '19:00',
    }
  });
  console.log('Seeded default Barber: Marcos de Souza');

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
