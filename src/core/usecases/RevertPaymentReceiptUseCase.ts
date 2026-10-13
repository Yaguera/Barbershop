import { PaymentReversal } from '../domain/models';
import { PaymentReceiptRepository } from '../domain/repositories/PaymentReceiptRepository';

export interface RevertPaymentReceiptRequest {
  receiptId: string;
  reason: string;
  operatorUserId: string;
  operatorRole: string;
}

export class RevertPaymentReceiptUseCase {
  constructor(private receiptRepository: PaymentReceiptRepository) {}

  async execute(request: RevertPaymentReceiptRequest): Promise<PaymentReversal> {
    const { receiptId, reason, operatorUserId, operatorRole } = request;

    // Conforme especificação: reversão é restrita exclusivamente ao ADMIN na primeira versão
    if (operatorRole !== 'ADMIN') {
      throw new Error('Acesso negado: a reversão de recebimentos é exclusiva do administrador.');
    }

    const trimmedReason = (reason || '').trim();
    if (!trimmedReason || trimmedReason.length < 5) {
      throw new Error('Motivo da reversão é obrigatório para auditoria (mínimo de 5 caracteres).');
    }

    if (!receiptId) {
      throw new Error('Identificador do recebimento é obrigatório.');
    }

    return await this.receiptRepository.revertPayment({
      receiptId,
      reason: trimmedReason,
      revertedById: operatorUserId,
    });
  }
}
