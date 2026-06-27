import { prisma } from '../src/infra/db/prisma-client';
import * as bcrypt from 'bcryptjs';

async function main() {
  console.log('Seeding database with new José Carlos Barber Shop data...');

  // 1. Create Super Admin with default profile photo
  const adminEmail = 'admin@barber.com';
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.create({
      data: {
        name: 'José Carlos (Admin)',
        email: adminEmail,
        passwordHash,
        role: 'ADMIN',
        image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150', // Premium Admin profile photo
      },
    });
    console.log(`Created Super Admin: ${admin.email}`);
  } else {
    await prisma.user.update({
      where: { email: adminEmail },
      data: {
        name: 'José Carlos (Admin)',
        image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
      },
    });
    console.log('Super Admin updated.');
  }

  // 2. Seed services (deleting old ones first) (RF09.2)
  console.log('Re-seeding services...');
  await prisma.service.deleteMany();

  const services = [
    { name: 'Social', price: 25.0, durationMinutes: 30, commissionRate: 0.40 },
    { name: 'Barba', price: 25.0, durationMinutes: 30, commissionRate: 0.40 },
    { name: 'Degradê', price: 30.0, durationMinutes: 30, commissionRate: 0.40 },
    { name: 'Sobrancelha', price: 5.0, durationMinutes: 15, commissionRate: 0.30 },
    { name: 'Social + Tesoura', price: 35.0, durationMinutes: 45, commissionRate: 0.40 },
    { name: 'Luzes', price: 75.0, durationMinutes: 90, commissionRate: 0.45 },
    { name: 'Nevou', price: 100.0, durationMinutes: 120, commissionRate: 0.45 },
    { name: 'Pigmentação', price: 20.0, durationMinutes: 30, commissionRate: 0.40 },
    { name: 'Pezinho', price: 10.0, durationMinutes: 15, commissionRate: 0.30 },
    { name: 'Hidratação', price: 15.0, durationMinutes: 30, commissionRate: 0.40 },
    { name: 'Lavagem Simples', price: 10.0, durationMinutes: 15, commissionRate: 0.30 },
    { name: 'Barboterapia', price: 60.0, durationMinutes: 45, commissionRate: 0.40 },
    { name: 'Combo Social', price: 45.0, durationMinutes: 60, commissionRate: 0.45 },
    { name: 'Corte Kids', price: 35.0, durationMinutes: 30, commissionRate: 0.40 },
  ];

  for (const s of services) {
    const created = await prisma.service.create({
      data: s,
    });
    console.log(`Created Service: ${created.name} (${created.price})`);
  }

  // 3. Check if there are any default barbers to seed
  // Let's create an initial barber "Marcos Barber" if none exists, so there's a barber to book immediately!
  const barbers = await prisma.barber.findMany();
  if (barbers.length === 0) {
    const barberEmail = 'marcos@barber.com';
    let barberUser = await prisma.user.findUnique({ where: { email: barberEmail } });
    
    if (!barberUser) {
      const passwordHash = await bcrypt.hash('barber123', 10);
      barberUser = await prisma.user.create({
        data: {
          name: 'Marcos de Souza',
          email: barberEmail,
          passwordHash,
          role: 'BARBER',
          image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150', // Premium Barber photo
        }
      });
    }

    await prisma.barber.create({
      data: {
        userId: barberUser.id,
        workDays: [1, 2, 3, 4, 5, 6], // Mon-Sat
        workStart: '09:00',
        workEnd: '19:00',
      }
    });
    console.log('Seeded default Barber: Marcos de Souza');
  }

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
