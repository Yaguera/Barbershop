import { NextRequest, NextResponse } from 'next/server';
import { PrismaBarberRepository } from '@/infra/repositories/PrismaBarberRepository';
import { PrismaAppointmentRepository } from '@/infra/repositories/PrismaAppointmentRepository';
import { PrismaServiceRepository } from '@/infra/repositories/PrismaServiceRepository';
import { GetBarberAvailabilityUseCase } from '@/core/usecases/GetBarberAvailabilityUseCase';

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
        { error: 'Date query parameter is required (format: YYYY-MM-DD)' },
        { status: 400 }
      );
    }

    const date = new Date(`${dateStr}T12:00:00`); // Avoid timezone shifts by setting mid-day
    if (isNaN(date.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
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
    const errMsg = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json(
      { error: errMsg },
      { status: 500 }
    );
  }
}
