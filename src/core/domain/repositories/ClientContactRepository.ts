import { ClientContact } from '../models';

export interface ClientContactRepository {
  findById(id: string): Promise<ClientContact | null>;
  create(data: { name: string; phone?: string | null; email?: string | null }): Promise<ClientContact>;
  search(query: string, limit?: number): Promise<ClientContact[]>;
}
