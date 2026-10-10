import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { Client } from 'pg';
import { afterAll,beforeEach,describe,expect,it } from 'vitest';
import { prisma } from '../db/prisma-client';
import { processReminders } from '../notifications/process-reminders';
import { PrismaAppointmentReportRepository } from './PrismaAppointmentReportRepository';
import { PrismaAppointmentRepository } from './PrismaAppointmentRepository';
import { PrismaUserRepository } from './PrismaUserRepository';

const repo = new PrismaAppointmentRepository();
const reports = new PrismaAppointmentReportRepository();
let clientId: string, barberId: string, barberUserId: string, serviceId: string;
const clients: string[] = [], services: string[] = [];
beforeEach(async () => {
  const tag = randomUUID();
  const client = await prisma.user.create({ data: { email: `client-${tag}@example.test`, name: 'Cliente' } });
  const barber = await prisma.barber.create({ data: { workDays: [1,2,3,4,5], workStart: '09:00', workEnd: '18:00', user: { create: { email: `barber-${tag}@example.test`, name: 'Barbeiro', role: 'BARBER' } } } });
  const service = await prisma.service.create({ data: { name: `Corte ${tag}`, price: '35.75', commissionRate: '0.4000', durationMinutes: 30 } });
  clientId = client.id; barberId = barber.id; barberUserId = barber.userId; serviceId = service.id;
  clients.push(clientId, barberUserId); services.push(serviceId);
});
afterAll(async () => {
  await prisma.user.deleteMany({ where: { id: { in: clients } } });
  await prisma.service.deleteMany({ where: { id: { in: services } } });
  await prisma.$disconnect();
});
async function book(start = new Date(Date.now() + 86400000)) {
  return repo.createTransactional({ clientId, barberId, serviceId, startTime: start, endTime: new Date(start.getTime()+1800000) }, ['PENDING','COMPLETED']);
}
describe('PostgreSQL transactions and historical reports', () => {
  it('allows only one of two concurrent overlapping reservations', async () => {
    const start = new Date(Date.now()+86400000);
    const results = await Promise.all([book(start), book(start)]);
    expect(results.filter(Boolean)).toHaveLength(1);
    expect(await prisma.appointment.count({where:{barberId}})).toBe(1);
  });
  it('keeps charged price and commission after a catalog change', async () => {
    const a = await book(); expect(a).not.toBeNull();
    await repo.updateStatus(a!.id, 'COMPLETED', 'PENDING');
    await prisma.service.update({where:{id:serviceId},data:{price:'99.99',commissionRate:'0.9000'}});
    const report = await reports.getBarberDetailedMetrics(barberId,new Date(0),new Date('2100-01-01'));
    expect(report.totalRevenue).toBe(35.75);
    expect(report.servicesDistribution[0].revenue).toBe(35.75);
    const finance = await reports.getFinanceReport();
    expect(finance.barbersCommissions.find(b=>b.barberId===barberId)?.commission).toBe(14.30);
    expect((await repo.findById(a!.id))?.priceCents).toBe(3575);
  });
  it('serializes duplicate reminder workers', async () => {
    const now = new Date(); const a = await book(new Date(now.getTime()+30*60000));
    await Promise.all([processReminders(now),processReminders(now)]);
    expect(await prisma.notification.count({where:{userId:clientId}})).toBe(1);
    expect((await repo.findById(a!.id))?.reminded1h).toBe(true);
  });
  it('records a no-show once even if a scheduler missed multiple hours', async () => {
    const now = new Date();const a=await book(new Date(now.getTime()-3*3600000));
    await Promise.all([processReminders(now),processReminders(now)]);
    expect((await repo.findById(a!.id))?.status).toBe('NO_SHOW');
    expect(await prisma.notification.count({where:{userId:clientId}})).toBe(1);
  });
  it('rolls back a reminder flag if notification insertion fails', async () => {
    const now = new Date(); const a = await book(new Date(now.getTime()+30*60000));
    await prisma.$executeRawUnsafe(`ALTER TABLE "Notification" ADD CONSTRAINT test_reject_reminder CHECK (title <> 'Lembrete de agendamento') NOT VALID`);
    try {
      await expect(processReminders(now)).rejects.toThrow();
      expect((await repo.findById(a!.id))?.reminded1h).toBe(false);
      expect(await prisma.notification.count({where:{userId:clientId}})).toBe(0);
    } finally {
      await prisma.$executeRawUnsafe('ALTER TABLE "Notification" DROP CONSTRAINT test_reject_reminder');
    }
    await processReminders(now);
    expect(await prisma.notification.count({where:{userId:clientId}})).toBe(1);
  });
  it('resets reminders on reschedule and retains the original price', async () => {
    const a = await book();
    await prisma.appointment.update({where:{id:a!.id},data:{reminded24h:true,reminded1h:true}});
    const start = new Date(Date.now()+2*86400000);
    const updated = await repo.rescheduleTransactional(a!.id,start,new Date(start.getTime()+1800000),['PENDING','COMPLETED']);
    expect(updated).toMatchObject({reminded24h:false,reminded1h:false,priceCents:3575,commissionCents:1430});
  });
  it('does not overwrite a concurrent cancellation', async () => {
    const a = await book();
    await repo.updateStatus(a!.id,'CANCELED','PENDING');
    await expect(repo.updateStatus(a!.id,'COMPLETED','PENDING')).rejects.toThrow();
    expect((await repo.findById(a!.id))?.status).toBe('CANCELED');
  });
  it('invalidates old sessions when an account is deactivated', async () => {
    const users = new PrismaUserRepository();
    await users.softDelete(barberUserId);
    expect(await prisma.user.findUnique({where:{id:barberUserId}})).toMatchObject({active:false,sessionVersion:1});
    await users.update(barberUserId,{active:true});
    expect(await prisma.user.findUnique({where:{id:barberUserId}})).toMatchObject({active:true,sessionVersion:1});
  });
  it('applies every migration from empty and backfills legacy bookings', async () => {
    const sqlClient = new Client({ connectionString: process.env.TEST_DATABASE_URL });
    await sqlClient.connect();
    const schema = `migration_${randomUUID().replaceAll('-','')}`;
    try {
      await sqlClient.query(`CREATE SCHEMA "${schema}"`);
      await sqlClient.query(`SET search_path TO "${schema}"`);
      for (const folder of ['20260609170838_init','20260609184246_add_phone_to_user']) {
        await sqlClient.query(readFileSync(`prisma/migrations/${folder}/migration.sql`,'utf8'));
      }
      await sqlClient.query(`INSERT INTO "User" (id,email,"updatedAt") VALUES ('legacy','legacy@example.test',NOW());
        INSERT INTO "Barber" (id,"userId","workDays","workStart","workEnd","updatedAt") VALUES ('b','legacy',ARRAY[1],'09:00','18:00',NOW());
        INSERT INTO "Service" (id,name,price,"durationMinutes","commissionRate","updatedAt") VALUES ('s','Corte',35.75,30,0.4,NOW());
        INSERT INTO "Appointment" (id,"clientId","barberId","serviceId","startTime","endTime","updatedAt") VALUES ('a','legacy','b','s',NOW(),NOW()+interval '30 minutes',NOW());`);
      await sqlClient.query(readFileSync('prisma/migrations/20260908120000_sync_schema_and_financial_history/migration.sql','utf8'));
      const result = await sqlClient.query('SELECT "priceCents", "commissionCents" FROM "Appointment"');
      expect(result.rows[0]).toEqual({ priceCents:3575, commissionCents:1430 });
      expect((await sqlClient.query('SELECT "active", "sessionVersion" FROM "User"')).rows[0]).toEqual({active:true,sessionVersion:0});
      expect((await sqlClient.query('SELECT count(*)::int AS count FROM "Notification"')).rows[0].count).toBe(0);
    } finally {
      await sqlClient.query('SET search_path TO public');
      await sqlClient.query(`DROP SCHEMA "${schema}" CASCADE`);
      await sqlClient.end();
    }
  });
});
