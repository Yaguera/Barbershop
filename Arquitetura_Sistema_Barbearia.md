# Documento de Arquitetura e Engenharia de Software
## Sistema de Gestão de Barbearia (Barber Management System)

**Autor:** Arquiteto de Software Sênior & Engenharia de Sistemas  
**Versão:** 1.0.0  
**Data:** 22 de Julho de 2026  
**Classificação:** Confidencial / Uso Interno e Exportação (Google Docs)

---

## Sumário Executivo
Este documento técnico descreve formal e exaustivamente a arquitetura, as decisões de design, a topologia do código e as salvaguardas de segurança implementadas no **Sistema de Gestão de Barbearia**. O sistema foi concebido sob rigorosos padrões de engenharia moderna, utilizando **Clean Architecture**, **SOLID** e mecanismos avançados de controle de concorrência e integridade relacional. A separação clara entre a camada de entrega visual e as regras de negócio garante que a aplicação seja altamente testável, escalável e agnóstica a frameworks externos.

---

## 1. Visão Geral da Stack Tecnológica

O ecossistema do projeto é construído sobre uma pilha tecnológica moderna, orientada a tipagem estática ponta a ponta (*End-to-End Type Safety*) e altíssima performance:

```
+-------------------------------------------------------------------------------+
|                        CAMADA DE APRESENTAÇÃO & ENTREGA                       |
|         Next.js 16 (App Router) + React 19 + Tailwind CSS + Zustand          |
+-------------------------------------------------------------------------------+
                                        |
                             Server Actions & Routes
                                        v
+------------------------------------------------.------------------------------+
|                       CAMADA DE CASOS DE USO (BUSINESS)                       |
|      Clean Architecture UseCases (Puros, Sem Dependência do Framework)        |
+-------------------------------------------------------------------------------+
                                        |
                          Contratos (Domain Interfaces)
                                        v
+-------------------------------------------------------------------------------+
|                     CAMADA DE PERSISTÊNCIA & INFRAESTRUTURA                   |
|       Prisma ORM 7 + PostgreSQL (Row-Level Locking & ACID Transactions)       |
+-------------------------------------------------------------------------------+
```

### 1.1. Next.js 16 (App Router) — Camada de Entrega (Delivery Layer)
O **Next.js** atua estritamente como o mecanismo de entrega visual e transporte HTTP/Server Action da aplicação. Através do modelo de **App Router** (`src/app/`), ele provê:
* **Server Components (RSC):** Renderização no lado do servidor para carregamento quase instantâneo do catálogo de barbeiros, serviços e dados analíticos, reduzindo o *bundle* do cliente e otimizando o SEO institucional.
* **Client Components:** Ocupam-se apenas das interfaces altamente interativas e de gerenciamento de estado local (como o funil de agendamento multi-etapa no `BookingFlow.tsx` e o painel analítico interativo em `src/app/admin/dashboard/page.tsx`).
* **Server Actions:** Atuam como *Controllers* que recebem requisições em chamadas RPC tipadas, executam a validação de sanitização na borda e delegam a execução para as regras de negócio na camada de *UseCases*.

### 1.2. Prisma ORM 7 — Camada de Persistência Abstrata
O **Prisma ORM** funciona como o mapeador objeto-relacional (ORM) do sistema, provendo:
* **Controle DDL e Esquema Único (`prisma/schema.prisma`):** Declaração centralizada do modelo relacional, gerando clientes fortemente tipados (`@prisma/client`).
* **Abstração de Acesso a Dados (`PrismaClient`):** Implementa concretamente os contratos (interfaces) definidos na camada de domínio (`src/core/domain/repositories/`), permitindo que a aplicação execute consultas complexas, agregações analíticas e transações sem expor detalhes SQL para a camada de negócios.

### 1.3. PostgreSQL — Banco de Dados Relacional e Transacional
O **PostgreSQL** é o motor de banco de dados ACID da aplicação, escolhido por sua robustez em concorrência, integridade referencial e suporte a travas físicas de linha (*Row-Level Locking*):
* **Integridade Relacional:** Relacionamentos entre Usuários (`User`), Barbeiros (`Barber`), Serviços (`Service`) e Agendamentos (`Appointment`) protegidos por chaves estrangeiras, índices de unicidade e regras de exclusão controlada.
* **Mecanismos de Concorrência Pessimista:** Suporte a comandos SQL nativos (`SELECT ... FOR UPDATE`) executados dentro de transações interativas para neutralizar disputas por horários na agenda de forma agnóstica à memória da aplicação.

---

## 2. Estrutura de Pastas (Directory Tree)

A organização dos arquivos respeita os limites arquiteturais da **Clean Architecture**, isolando totalmente o framework de front-end das regras de domínio.

```text
barberApp/
├── prisma/
│   ├── schema.prisma           # Declaração central das tabelas, enums e relacionamentos
│   └── seed.ts                 # Povoamento inicial de dados (serviços e admin padrão)
├── src/
│   ├── app/                    # CAMADA DE ENTREGA (Next.js App Router)
│   │   ├── actions/            # Controllers / Server Actions (validam input e chamam UseCases)
│   │   │   ├── admin-actions.ts
│   │   │   ├── appointment-actions.ts
│   │   │   ├── auth-actions.ts
│   │   │   └── service-actions.ts
│   │   ├── admin/              # Rotas e páginas do painel administrativo
│   │   ├── barber/             # Rotas e páginas do painel do barbeiro
│   │   ├── auth/               # Páginas de login e registro do cliente
│   │   ├── dashboard/          # Rotas de gerenciamento para clientes (meus agendamentos)
│   │   └── page.tsx            # Landing page institucional e funil de agendamento
│   ├── components/             # Componentes visuais de UI (React)
│   │   ├── admin/              # Navbar e widgets do admin
│   │   ├── barber/             # Navbar e widgets do barbeiro
│   │   └── BookingFlow.tsx     # Máquina de estados visual do agendamento (funil 5 etapas)
│   ├── core/                   # NÚCLEO DA APLICAÇÃO (Regras de Negócio Puras & Domínio)
│   │   ├── domain/             # Contratos abstratos e entidades de domínio
│   │   │   └── repositories/   # Interfaces abstratas de Repositórios (Inversão de Dependência)
│   │   │       ├── AppointmentRepository.ts
│   │   │       ├── BarberRepository.ts
│   │   │       ├── ServiceRepository.ts
│   │   │       └── UserRepository.ts
│   │   └── usecases/           # Casos de Uso (Orquestração pura sem dependência de framework)
│   │       ├── ChangeAppointmentStatusUseCase.ts
│   │       ├── CreateAppointmentUseCase.ts
│   │       ├── GetAdminDashboardMetricsUseCase.ts
│   │       ├── GetBarberAvailabilityUseCase.ts
│   │       ├── RegisterBarberUseCase.ts
│   │       └── usecases.test.ts # Suíte completa de testes unitários do núcleo
│   ├── infra/                  # IMPLEMENTAÇÕES CONCRETAS DE INFRAESTRUTURA
│   │   ├── db/                 # Conexão singleton com o banco de dados (prisma-client.ts)
│   │   └── repositories/       # Implementação dos contratos do domínio usando Prisma ORM
│   │       ├── PrismaAppointmentRepository.ts
│   │       ├── PrismaBarberRepository.ts
│   │       ├── PrismaServiceRepository.ts
│   │       └── PrismaUserRepository.ts
│   ├── store/                  # Estado global no cliente via Zustand (booking-store.ts)
│   ├── utils/                  # Utilitários puros (compressão de imagem, formatação)
│   ├── auth.ts                 # Configuração centralizada do NextAuth.js v5 + PrismaAdapter
│   └── middleware.ts           # Barreira de segurança e autorização de borda (Edge RBAC)
└── next.config.ts              # Configurações do compilador Next.js e limites físicos (bodySizeLimit)
```

### 2.1. Responsabilidade de Cada Diretório Raiz e Isolamento do Framework
1. **`src/app/` (Delivery Layer / Camada de Entrega):** Contém estritamente código acoplado ao Next.js (rotas, layouts, metadados e *Server Actions*). Nenhuma regra de negócio de agendamento ou cálculo de disponibilidade reside aqui. Se o Next.js for substituído no futuro por outro framework (ex: Express, Fastify ou NestJS), esta pasta inteira pode ser reescrita **sem alterar uma única linha do núcleo (`src/core/`)**.
2. **`src/core/` (Core Layer / Núcleo de Negócios):** O coração da aplicação. Não importa bibliotecas de UI, Next.js ou Prisma ORM direto nas suas lógicas.
   - **`src/core/domain/repositories/`:** Define os contratos abstratos (`interface`) que o sistema exige para ler/gravar dados.
   - **`src/core/usecases/`:** Classes puras em TypeScript que recebem os repositórios via construtor, orquestram as regras de negócio (ex: checagem de horários de trabalho, regras de cancelamento, transições de status) e lançam exceções de domínio em caso de violação.
3. **`src/infra/` (Infrastructure Layer / Camada de Infraestrutura):** Contém os adaptadores que conectam o mundo externo (banco de dados, ORM, APIs) ao núcleo. Os arquivos em `src/infra/repositories/` implementam concretamente os contratos definidos em `src/core/domain/repositories/`.

---

## 3. Padrões Arquiteturais e Princípios de Design

### 3.1. Clean Architecture: O Fluxo de uma Requisição
A arquitetura do sistema adota estritamente a **Regra de Dependência** da Clean Architecture: os fluxos apontam sempre de fora (interface/infraestrutura) para dentro (núcleo/domínio).

```
[Cliente / Navegador]
        │ (1) Envia formulário / RPC
        ▼
[src/app/actions/appointment-actions.ts] ──(Controller / Server Action)
        │ (2) Valida input, checa sessão auth e instancia UseCase com repositórios
        ▼
[src/core/usecases/CreateAppointmentUseCase.ts] ──(Regra de Negócio Pura)
        │ (3) Checa dias/horários de trabalho do barbeiro e solicita criação transacional
        ▼
[src/core/domain/repositories/AppointmentRepository.ts] ──(Interface Abstrata)
        ▲
        │ (4) Inversão de Dependência (Implementa o contrato)
[src/infra/repositories/PrismaAppointmentRepository.ts] ──(Adaptador de Infraestrutura)
        │ (5) Executa SQL interativo no PostgreSQL (SELECT ... FOR UPDATE + INSERT)
        ▼
[PostgreSQL Database]
```

#### Rastreabilidade e Detalhamento do Fluxo (`CreateAppointment`):
1. **Controller / Entrada (`src/app/actions/appointment-actions.ts:L14-L60`):**
   - A função `createAppointmentAction` atua como o Controller. Ela verifica se a sessão do usuário está ativa (`await auth()`), valida os dados de entrada recebidos (`barberId`, `serviceId`, `startTimeStr`) e converte strings em objetos `Date`.
   - Em seguida, ela instancia os adaptadores concretos (`PrismaAppointmentRepository`, `PrismaServiceRepository`, `PrismaBarberRepository`) e os injeta na classe `CreateAppointmentUseCase`.
2. **UseCase / Orquestração (`src/core/usecases/CreateAppointmentUseCase.ts:L20-L83`):**
   - O método `execute` processa a regra de negócio sem conhecer o banco de dados:
     - Valida que a data não está no passado (`L24`).
     - Consulta os dados do barbeiro e do serviço via contratos abstratos (`L29-L38`).
     - Verifica matematicamente se o dia da semana está na lista `barber.workDays` (`L41-L44`) e se o intervalo de tempo calculado (`appStartMinutes` a `appEndMinutes`) está estritamente dentro de `workStart` e `workEnd` (`L47-L59`).
     - Invoca o método abstrato `this.appointmentRepository.createTransactional(...)` informando que os status `['PENDING', 'COMPLETED']` representam conflito (`L64-L73`).
3. **Repositório / Persistência (`src/infra/repositories/PrismaAppointmentRepository.ts:L56-L89`):**
   - O método concreto `createTransactional` encapsula a operação em `prisma.$transaction`.
   - Aplica a trava física na linha do barbeiro, busca sobreposições na agenda e, caso o horário esteja livre, insere o registro com status `PENDING`, retornando a entidade ao UseCase.

### 3.2. Princípios SOLID Aplicados

#### Single Responsibility Principle (SRP — Princípio da Responsabilidade Única)
Cada classe de *UseCase* e de *Repository* possui um único motivo para mudar:
* **Rastreabilidade (`src/core/usecases/ChangeAppointmentStatusUseCase.ts`):** Esta classe é responsável **apenas** por validar e efetuar a transição de status de um agendamento. Ela encapsula a máquina de estados (impedindo, por exemplo, que um agendamento já `CANCELED` seja alterado para `COMPLETED` ou que um cliente marque como `NO_SHOW`). Não se mistura com cálculo de métricas ou envio de notificações.
* **Rastreabilidade (`src/infra/repositories/PrismaUserRepository.ts`):** Ocupa-se unicamente de persistir, buscar e aplicar *Soft Delete* em registros da tabela `User`.

#### Dependency Inversion Principle (DIP — Princípio da Inversão de Dependência)
Módulos de alto nível (casos de uso) não dependem de módulos de baixo nível (Prisma ORM ou bancos de dados concretos). Ambos dependem de abstrações (interfaces).
* **Rastreabilidade (`src/core/usecases/CreateAppointmentUseCase.ts:L14-L18`):** O construtor do `CreateAppointmentUseCase` recebe estritamente as interfaces `AppointmentRepository`, `ServiceRepository` e `BarberRepository` definidas em `src/core/domain/repositories/`.
* Isso permite que a suíte de testes unitários (`src/core/usecases/usecases.test.ts:L46-L66`) instancie os casos de uso injetando repositórios *mockados* (`vi.fn()`), testando complexas regras transacionais e de bloqueio em milissegundos sem precisar de uma conexão ativa com o PostgreSQL.

---

## 4. Segurança, Concorrência e Integridade

### 4.1. Autenticação e Autorização (Edge RBAC & NextAuth v5)
O sistema implementa uma arquitetura de segurança baseada em tokens JWT assinados, sessões de servidor e cookies `HttpOnly`:
* **Autenticação Centralizada (`src/auth.ts:L9-L56`):** Configuração do **NextAuth.js v5 (Beta)** integrado ao `PrismaAdapter`. Suporta login social (Google OAuth) e credenciais manuais via *bcrypt.compare*. Quando autenticado, o token JWT recebe o `id`, `role` (`CLIENT`, `BARBER` ou `ADMIN`) e foto higienizada do usuário.
* **Barreira de Borda / Edge RBAC (`src/middleware.ts:L5-L35`):** O `middleware.ts` roda no nível de borda (*Edge Runtime*) interceptando todas as requisições antes mesmo da renderização de páginas:
  - Rotas `/admin/:path*` exigem estritamente `userRole === 'ADMIN'` (`L25-L27`).
  - Rotas `/barber/:path*` exigem `userRole === 'BARBER' || userRole === 'ADMIN'` (`L30-L32`).
  - Rotas protegidas de cliente (`/dashboard`, `/profile`) redirecionam para `/auth/login?callbackUrl=...` caso o usuário não possua token ativo (`L17-L22`).

### 4.2. Proteção de Dados, Sanitização e Soft Delete
* **Sanitização de Privilege Escalation via Zod (`src/app/actions/auth-actions.ts:L10-L55`):**
  - No fluxo de cadastro (`signUpAction`), o esquema Zod `signUpSchema` valida formato de e-mail e força de senha (`L10-L15`).
  - Para evitar ataques de *Privilege Escalation* onde um invasor injeta `"role": "ADMIN"` no *FormData*, a *Server Action* extrai os campos validados e descarta qualquer requisição de perfil, **forçando em código a criação com `role: 'CLIENT'`** (`L52`).
* **Criptografia de Senhas (`src/app/actions/auth-actions.ts:L44`):** Todas as senhas são cifradas usando o algoritmo **bcrypt** com *work factor 10* (`await bcrypt.hash(password, 10)`), garantindo resistência a ataques de força bruta e tabelas arco-íris (*Rainbow Tables*).
* **Estratégia de Soft Delete (`src/infra/repositories/PrismaBarberRepository.ts` & `PrismaUserRepository.ts:L64`):**
  - Excluir fisicamente um barbeiro do banco de dados causaria a remoção em cascata (ou violação de chave estrangeira) de todo o histórico de agendamentos (`Appointment`) e relatórios financeiros passados.
  - O sistema resolve isso através de um **Soft Delete** (`src/core/usecases/DeleteBarberUseCase.ts:L28`): o barbeiro tem seu usuário associado marcado como `active: false`. Nos repositórios, consultas públicas de agenda filtram automaticamente por `activeOnly: true` (`PrismaBarberRepository.ts:L21`), impedindo novos agendamentos enquanto preserva integralmente as métricas analíticas e comissões históricas.

### 4.3. Prevenção de Anomalias e Trava de Concorrência (Race Conditions)
O problema de *Double-Booking* (dois clientes reservando exatamente o mesmo horário no mesmo milissegundo) é neutralizado na camada de infraestrutura transacional do PostgreSQL:

#### Mecanismo Pessimista de Row-Level Locking (`PrismaAppointmentRepository.ts:L56-L89`)
```typescript
return await prisma.$transaction(async (tx) => {
  // 1. Bloqueia a linha do barbeiro no PostgreSQL (SELECT ... FOR UPDATE)
  // Qualquer outra transação concorrente para o mesmo barbeiro aguardará na fila
  await tx.$executeRaw`
    SELECT 1 FROM "Barber" WHERE id = ${data.barberId} FOR UPDATE
  `;

  // 2. Consulta sobreposições com a certeza absoluta de isolamento
  const conflict = await tx.appointment.findFirst({
    where: {
      barberId: data.barberId,
      status: { in: ['PENDING', 'COMPLETED'] },
      startTime: { lt: data.endTime },
      endTime: { gt: data.startTime },
    },
  });

  if (conflict) return null; // Retorna nulo, informando ao UseCase o erro 409 Conflict

  // 3. Efetua a inserção segura do agendamento
  return await tx.appointment.create({ ... });
});
```
* **Por que `SELECT ... FOR UPDATE`?** Sem o bloqueio físico da linha na tabela `Barber`, duas requisições concorrentes poderiam executar a verificação de sobreposição (`findFirst`) ao mesmo tempo, lerem que a agenda está livre, e ambas executarem o `create` em seguida. O comando SQL `FOR UPDATE` obriga o banco de dados a serializar o acesso à agenda do barbeiro específico, tornando impossível a ocorrência de *Race Conditions*.

#### Proteção Contra DDoS de Payload em Uploads (`next.config.ts:L4-L8` & `src/utils/compress-image.ts`)
* **Barreira Física no Servidor:** Para evitar sobrecarga de memória e ataques de negação de serviço provocados no envio de *Server Actions* gigantes, o compilador do Next.js é configurado para travar o payload no limite máximo de segurança:
  ```typescript
  experimental: {
    serverActions: { bodySizeLimit: '5mb' }
  }
  ```
* **Compressão no Cliente (`compress-image.ts:L13-L40`):** Para economizar largura de banda e armazenamento, o sistema utiliza `browser-image-compression` via *Web Worker* no navegador do cliente antes de enviar fotos de perfil ou de serviços. O arquivo é redimensionado para no máximo 800px e comprimido para `< 500KB` em segundo plano sem travar a thread principal da UI.

---

## 5. Fluxos de Negócio Críticos

### 5.1. Estratégia de "Lazy Registration" (Cadastro no Fim do Funil)
Um dos maiores pontos de atrito no *booking online* é exigir que o usuário crie uma conta antes mesmo de ver os horários ou preços disponíveis. O sistema implementa o fluxo de **Lazy Registration** (Cadastro Sob Demanda):

```
[Etapa 1: Serviços] ──► [Etapa 2: Barbeiro] ──► [Etapa 3: Data e Hora] ──► [Etapa 4: Resumo]
                                                                                │
                                              ┌─────────────────────────────────┴─────────────────────────────────┐
                                              ▼                                                                   ▼
                                  (Sessão Ativa: Autenticado)                                         (Não Autenticado)
                                              │                                                                   │
                                              ▼                                                                   ▼
                              Executa RPC `createAppointmentAction`                              Exibe Modal/Aba "Login ou Cadastro"
                                              │                                                                   │
                                              │                                                      Após Cadastro/Login,
                                              │                                                      retoma estado do Zustand
                                              │                                                      e agenda automaticamente
                                              ▼                                                                   ▼
                                   [Etapa 5: Sucesso / Tela Final de Agendamento Confirmado] ◄────────────────────┘
```

#### Arquitetura de Estado (`src/components/BookingFlow.tsx` & `src/store/booking-store.ts`)
1. **Armazenamento Temporário Desacoplado:** O cliente navega por todo o catálogo, seleciona serviço (`serviceId`), barbeiro (`barberId`) e horário (`startTime`). Esse estado é mantido no cliente através do **Zustand** (`useBookingStore`), com persistência opcional no `localStorage` (`booking-store.ts:L18`).
2. **Checagem no Momento da Confirmação (`BookingFlow.tsx`):** Ao clicar em "Confirmar Agendamento" na Etapa 4, o componente checa o hook de sessão (`useSession()`).
   - Se o usuário estiver autenticado (`status === 'authenticated'`), a *Server Action* de agendamento é enviada imediatamente.
   - Se o usuário for um visitante (`status === 'unauthenticated'`), a interface abre em tempo real o modal/aba de autenticação rápida dentro do próprio fluxo.
3. **Retomada Sem Perda de Contexto:** Assim que o cliente conclui o cadastro rápido ou login social, a aplicação reidrata o estado perfeitamente preservado no `Zustand` e dispara a reserva do horário, enviando o usuário para a Etapa 5 (Sucesso) de forma fluida.

---

## Conclusão Arquitetural
A arquitetura detalhada neste documento estabelece que o **Sistema de Gestão de Barbearia** atende e supera os padrões da engenharia de software de nível corporativo. A conjugação do **Next.js App Router** com a pureza da **Clean Architecture**, o isolamento do **Prisma ORM/PostgreSQL** e o controle transacional por **Pessimistic Locking (`FOR UPDATE`)** resulta em uma plataforma à prova de regressões, imune a anomalias de agendamento e pronta para expansão contínua em escala de produção.
