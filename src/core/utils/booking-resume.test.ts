import { describe, expect, it } from 'vitest';
import { canResumeBooking, type BookingResumeInput } from './booking-resume';

const draft: BookingResumeInput = {
  authenticated: true, serviceId: 'corte', servicePrice: 30, barberId: 'barbeiro',
  startTime: '2026-11-10T13:00:00Z', now: Date.parse('2026-11-01T12:00:00Z'),
  services: [{ id: 'corte', price: 30 }], barbers: [{ id: 'barbeiro', active: true }],
};

describe('retorno à revisão do agendamento', () => {
  it('permite retomar uma seleção completa e válida após entrar', () => {
    expect(canResumeBooking(draft)).toBe(true);
  });
  it.each([
    ['sem autenticação', { authenticated: false }],
    ['horário ausente', { startTime: null }],
    ['horário inválido', { startTime: 'inválido' }],
    ['horário passado', { startTime: '2026-10-01T12:00:00Z' }],
    ['serviço removido', { services: [] }],
    ['preço alterado', { services: [{ id: 'corte', price: 40 }] }],
    ['profissional inativo', { barbers: [{ id: 'barbeiro', active: false }] }],
  ])('exige nova seleção quando há %s', (_description, change) => {
    expect(canResumeBooking({ ...draft, ...change })).toBe(false);
  });
});
