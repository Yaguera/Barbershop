import { Receptionist, User } from '../models';

export type ReceptionistWithUser = Receptionist & {
  user: User;
};

export interface ReceptionistRepository {
  findById(id: string): Promise<ReceptionistWithUser | null>;
  findByUserId(userId: string): Promise<Receptionist | null>;
  findAll(): Promise<ReceptionistWithUser[]>;
  create(userId: string): Promise<Receptionist>;
  softDelete(userId: string): Promise<void>;
}
