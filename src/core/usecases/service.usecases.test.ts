import { Service } from "@/core/domain/models";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ServiceRepository } from "../domain/repositories/ServiceRepository";
import { CreateServiceUseCase } from "./CreateServiceUseCase";
import { DeleteServiceUseCase } from "./DeleteServiceUseCase";
import { UpdateServiceUseCase } from "./UpdateServiceUseCase";

describe("Service UseCases", () => {
  let mockServiceRepository: ServiceRepository;
  let mockServices: Service[];

  beforeEach(() => {
    mockServices = [
      {
        id: "service-1",
        name: "Corte Degradê",
        price: 35.0,
        durationMinutes: 45,
        commissionRate: 0.4,
        image: "https://example.com/corte.jpg",
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    mockServiceRepository = {
      findById: vi.fn().mockImplementation(async (id: string) => {
        return mockServices.find((s) => s.id === id) || null;
      }),
      findAll: vi
        .fn()
        .mockImplementation(async (options?: { activeOnly?: boolean }) => {
          if (options?.activeOnly) {
            return mockServices.filter((s) => s.active);
          }
          return mockServices;
        }),
      create: vi
        .fn()
        .mockImplementation(
          async (data: Parameters<ServiceRepository["create"]>[0]) => {
            const newService: Service = {
              id: "new-service-id",
              name: data.name,
              price: data.price,
              durationMinutes: data.durationMinutes,
              commissionRate: data.commissionRate,
              image: data.image || null,
              active: data.active ?? true,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            mockServices.push(newService);
            return newService;
          },
        ),
      update: vi
        .fn()
        .mockImplementation(
          async (
            id: string,
            data: Parameters<ServiceRepository["update"]>[1],
          ) => {
            const index = mockServices.findIndex((s) => s.id === id);
            if (index === -1) throw new Error("Not found");
            const updated = { ...mockServices[index], ...data };
            mockServices[index] = updated;
            return updated;
          },
        ),
    };
  });

  describe("CreateServiceUseCase", () => {
    it("deve criar um serviço com sucesso quando executado por um ADMIN", async () => {
      const useCase = new CreateServiceUseCase(mockServiceRepository);
      const result = await useCase.execute({
        adminRole: "ADMIN",
        name: "Barba Terapia",
        price: 45.0,
        durationMinutes: 30,
        commissionRate: 0.45,
        image: "https://example.com/barba.jpg",
      });

      expect(result.name).toBe("Barba Terapia");
      expect(result.price).toBe(45.0);
      expect(result.active).toBe(true);
      expect(mockServiceRepository.create).toHaveBeenCalledWith({
        name: "Barba Terapia",
        price: 45.0,
        durationMinutes: 30,
        commissionRate: 0.45,
        image: "https://example.com/barba.jpg",
        active: true,
      });
    });

    it("deve lançar erro se o usuário não for ADMIN", async () => {
      const useCase = new CreateServiceUseCase(mockServiceRepository);
      await expect(
        useCase.execute({
          adminRole: "CLIENT",
          name: "Barba",
          price: 25.0,
          durationMinutes: 30,
          commissionRate: 0.4,
        }),
      ).rejects.toThrow("Apenas administradores podem cadastrar serviços.");
    });

    it("deve lançar erro se preço for menor ou igual a zero", async () => {
      const useCase = new CreateServiceUseCase(mockServiceRepository);
      await expect(
        useCase.execute({
          adminRole: "ADMIN",
          name: "Barba",
          price: 0,
          durationMinutes: 30,
          commissionRate: 0.4,
        }),
      ).rejects.toThrow("O preço deve ser um valor maior que zero.");
    });

    it("deve lançar erro se a taxa de comissão for inválida", async () => {
      const useCase = new CreateServiceUseCase(mockServiceRepository);
      await expect(
        useCase.execute({
          adminRole: "ADMIN",
          name: "Barba",
          price: 25.0,
          durationMinutes: 30,
          commissionRate: 1.5,
        }),
      ).rejects.toThrow(
        "A taxa de comissão deve estar entre 0 e 1 (ex: 0.40 para 40%).",
      );
    });
  });

  describe("UpdateServiceUseCase", () => {
    it.each([0, 0.4, 0.5, 0.4555, 1])(
      "permite definir comissão %s sem alterar preço ou reservas",
      async (commissionRate) => {
        await new UpdateServiceUseCase(mockServiceRepository).execute({
          adminRole: "ADMIN",
          serviceId: "service-1",
          commissionRate,
        });
        expect(mockServiceRepository.update).toHaveBeenCalledWith("service-1", {
          commissionRate,
        });
      },
    );
    it.each([-0.1, 1.01, NaN, Infinity, 0.45555])(
      "rejeita comissão inválida %s sem gravar",
      async (commissionRate) => {
        await expect(
          new UpdateServiceUseCase(mockServiceRepository).execute({
            adminRole: "ADMIN",
            serviceId: "service-1",
            commissionRate,
          }),
        ).rejects.toThrow();
        expect(mockServiceRepository.update).not.toHaveBeenCalled();
      },
    );
    it("impede que barbeiros alterem comissão", async () => {
      await expect(
        new UpdateServiceUseCase(mockServiceRepository).execute({
          adminRole: "BARBER",
          serviceId: "service-1",
          commissionRate: 1,
        }),
      ).rejects.toThrow();
      expect(mockServiceRepository.update).not.toHaveBeenCalled();
    });
    it("deve atualizar um serviço com sucesso", async () => {
      const useCase = new UpdateServiceUseCase(mockServiceRepository);
      const result = await useCase.execute({
        adminRole: "ADMIN",
        serviceId: "service-1",
        name: "Corte Degradê Premium",
        price: 40.0,
      });

      expect(result.name).toBe("Corte Degradê Premium");
      expect(result.price).toBe(40.0);
      expect(mockServiceRepository.update).toHaveBeenCalledWith("service-1", {
        name: "Corte Degradê Premium",
        price: 40.0,
      });
    });

    it("deve lançar erro se o serviço não existir", async () => {
      const useCase = new UpdateServiceUseCase(mockServiceRepository);
      await expect(
        useCase.execute({
          adminRole: "ADMIN",
          serviceId: "inexistente",
          name: "Corte",
        }),
      ).rejects.toThrow("Serviço não encontrado.");
    });
  });

  describe("DeleteServiceUseCase (Soft Delete)", () => {
    it("deve realizar Soft Delete (active: false) e não excluir fisicamente", async () => {
      const useCase = new DeleteServiceUseCase(mockServiceRepository);
      const result = await useCase.execute({
        adminRole: "ADMIN",
        serviceId: "service-1",
      });

      expect(result.active).toBe(false);
      expect(mockServiceRepository.update).toHaveBeenCalledWith("service-1", {
        active: false,
      });
    });

    it("deve lançar erro se o usuário não for ADMIN", async () => {
      const useCase = new DeleteServiceUseCase(mockServiceRepository);
      await expect(
        useCase.execute({
          adminRole: "BARBER",
          serviceId: "service-1",
        }),
      ).rejects.toThrow("Apenas administradores podem excluir serviços.");
    });
  });
});
