import { GetBarberAvailabilityUseCase } from '@/core/usecases/GetBarberAvailabilityUseCase';
import { PrismaAppointmentRepository } from '@/infra/repositories/PrismaAppointmentRepository';
import { PrismaBarberRepository } from '@/infra/repositories/PrismaBarberRepository';
import { PrismaServiceRepository } from '@/infra/repositories/PrismaServiceRepository';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  // We specify correct segment params typing for App Router
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get('date'); // YYYY-MM-DD
    const serviceId = searchParams.get('serviceId') || undefined;

    if (!dateStr) {
      return NextResponse.json(
        {
          success: false,
          code: 'BAD_REQUEST',
          status: 400,
          error: 'Parâmetro de data é obrigatório (formato: YYYY-MM-DD).',
        },
        { status: 400 }
      );
    }

    const date = new Date(`${dateStr}T12:00:00`); // Avoid timezone shifts by setting mid-day
    if (isNaN(date.getTime())) {
      return NextResponse.json(
        {
          success: false,
          code: 'BAD_REQUEST',
          status: 400,
          error: 'Formato de data inválido.',
        },
        { status: 400 }
      );
    }

    const barberRepo = new PrismaBarberRepository();
    const appointmentRepo = new PrismaAppointmentRepository();
    const serviceRepo = new PrismaServiceRepository();

    const useCase = new GetBarberAvailabilityUseCase(
      barberRepo,
      appointmentRepo,
      serviceRepo
    );

    const slots = await useCase.execute({
      barberId: params.id,
      date,
      serviceId,
    });

    return NextResponse.json(slots);
  } catch (error: unknown) {
    console.error('Error getting availability:', error);
    const err = error as Error;
    if (err.message === 'Barber not found' || err.message === 'Service not found') {
      return NextResponse.json(
        {
          success: false,
          code: 'NOT_FOUND',
          status: 404,
          error: err.message === 'Barber not found' ? 'Barbeiro não encontrado.' : 'Serviço não encontrado.',
        },
        { status: 404 }
      );
    }
    return NextResponse.json(
      {
        success: false,
        code: 'INTERNAL_ERROR',
        status: 500,
        error: 'Erro ao consultar horários disponíveis.',
      },
      { status: 500 }
    );
  }
}
