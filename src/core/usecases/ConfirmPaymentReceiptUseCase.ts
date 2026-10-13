import { PaymentMethod, PaymentReceipt } from '../domain/models';
import { PaymentReceiptRepository } from '../domain/repositories/PaymentReceiptRepository';

export interface ConfirmPaymentReceiptRequest {
  appointmentId: string;
  method: PaymentMethod | string;
  operatorUserId: string;
  operatorRole: string;
  idempotencyKey?: string | null;
}

export class ConfirmPaymentReceiptUseCase {
  constructor(private receiptRepository: PaymentReceiptRepository) {}

  async execute(request: ConfirmPaymentReceiptRequest): Promise<PaymentReceipt> {
    const { appointmentId, method, operatorUserId, operatorRole, idempotencyKey } = request;

    if (!['RECEPTIONIST', 'ADMIN'].includes(operatorRole)) {
      throw new Error('Acesso negado: apenas atendentes e administradores podem confirmar recebimentos no caixa.');
    }

    if (!['MONEY', 'PIX', 'CARD'].includes(method)) {
      throw new Error('Forma de pagamento inválida. Selecione Dinheiro, Pix ou Cartão.');
    }

    if (!appointmentId) {
      throw new Error('Identificador do atendimento é obrigatório.');
    }

    return await this.receiptRepository.confirmPayment({
      appointmentId,
      method,
      confirmedById: operatorUserId,
      idempotencyKey: idempotencyKey || null,
    });
  }
}
