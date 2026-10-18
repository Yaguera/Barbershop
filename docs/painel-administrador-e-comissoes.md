# Painel analítico, navegação administrativa e configuração de comissões (Fase P0)

## 1. Arquitetura de rotas do administrador (Fase P0)

O painel administrativo (`/admin/dashboard`) é exclusivamente analítico. Todos os cadastros operacionais e configurações de regras estão distribuídos em rotas dedicadas:

| Rota | Propósito |
| --- | --- |
| `/admin/dashboard` | Visão geral analítica (abre por padrão no mês calendário atual em `America/Sao_Paulo`), cards financeiros, evolução temporal com alternância de série, resumo operacional, ranking de barbeiros, serviços e clientes recorrentes com drill-down paginado |
| `/admin/calendario` | Calendário operacional e financeiro com visões Dia/Semana/Mês e alternância explícita de contexto (`Agenda` por `Appointment.date` vs `Caixa` por `PaymentReceipt.paidAt`) |
| `/admin/financeiro` | Reconciliação financeira completa (Caixa vs Produção), taxa de recebimento da coorte, folha de comissões por profissional e Matriz de Disponibilidade de Métricas |
| `/admin/clientes` | Base unificada de clientes cadastrados (`User`) e contatos manuais da recepção (`ClientContact`) com histórico individual |
| `/admin/barbeiros` | Gestão da equipe de barbeiros: cadastro (`RegisterBarberForm`), listagem de ativos e inativos, link para métricas individuais (`/admin/barbeiros/[barberId]/metricas`) e desativação com preservação histórica |
| `/admin/atendentes` | Gestão de contas de recepção (`RECEPTIONIST`): cadastro, ativação e desativação com revogação imediata de sessão (`sessionVersion`) |
| `/admin/servicos` | Catálogo de serviços: criação, edição de preço/duração/comissão, ativação e inativação |
| `/admin/configuracoes/comissoes` | Política de comissão por serviço (`CommissionSettings`) com prévia em centavos e regras de snapshot imutável |
| `/admin/configuracoes/permissoes` | Matriz RBAC fixa (`ADMIN`, `BARBER`, `RECEPTIONIST`, `CLIENT`), rotas permitidas e garantias de segurança HTTP 401/403 |

## 2. Dicionário financeiro e base temporal

Todos os recortes de data usam o fuso oficial da barbearia (`America/Sao_Paulo`) por meio de `reportPeriod(period)`:

- **Recebido no caixa (`receivedCents`)**: Soma de `PaymentReceipt.amountCents` com `status = CONFIRMED` filtrada por `paidAt` no intervalo selecionado. **Regra inegociável:** quando nenhum pagamento foi confirmado no período, `receivedCents` é `R$ 0,00` — nunca usa `realizedCents` como substituto.
- **Serviços realizados (`realizedCents`)**: Soma de `Appointment.priceCents` com `status = COMPLETED` filtrada por `Appointment.date` no intervalo selecionado.
- **Concluídos sem recebimento (`pendingCents`)**: Soma de `Appointment.priceCents` dos atendimentos `COMPLETED` realizados no período cujo `PaymentReceipt` não está `CONFIRMED` (`null` ou `PENDING`).
- **Taxa de recebimento da coorte (`cohortReceiptRate`)**: `((realizedCents - pendingCents) / realizedCents) * 100`, medindo o percentual do valor produzido na coorte do período que já foi liquidado no caixa.
- **Comissão calculada (`commissionCents`) e Taxa efetiva (`effectiveCommissionRate`)**: Soma de `Appointment.commissionCents` dos atendimentos `COMPLETED` do período e razão ponderada `commissionCents / realizedCents`.
- **Parte da barbearia antes das despesas (`contributionCents`)**: Soma exata de `priceCents - commissionCents` por atendimento concluído, garantindo que `commissionCents + contributionCents === realizedCents` em centavos.
- **Ticket médio por serviço (`averageServiceTicketCents`) e por visita (`averageVisitTicketCents`)**: Divisão de `realizedCents` pelo total de serviços concluídos (`completed`) e pelo total de visitas distintas (`(cliente, dia)`).

## 3. Inventário e saneamento dos relatórios legados

Na Fase P0, os consumidores legados foram inventariados e saneados para impedir divergência com o dicionário oficial:

1. `PrismaAdminInsightsRepository` + `buildAdminInsights` (`src/core/utils/admin-insights.ts`): Motor principal usado por `/admin/dashboard` e `/admin/financeiro` via `getAdminInsightsAction`.
2. `PrismaAppointmentReportRepository.getAdminDashboardMetrics` (`GetAdminDashboardMetricsUseCase` / `getAdminDashboardAnalyticsAction`): Removido o fallback legado `totalRevenue = totalReceived > 0 ? totalReceived : totalRealized`. Agora `totalRevenue` e `prevTotalRevenue` refletem estritamente o caixa confirmado (`totalReceived`), mantendo `totalRealized` e `totalPendingPayment` separados.
3. `GetFinanceDashboardUseCase` (`getFinanceDashboardAction`): Unificado para usar `reportPeriod(period)` em `America/Sao_Paulo` e lançar `ForbiddenError` padronizado.

## 4. Matriz de disponibilidade de métricas (Fase P0)

| Métrica / Indicador | Status | Fonte de dados | Observação |
| --- | --- | --- | --- |
| Recebido no caixa, Serviços realizados, Pendentes de caixa | **Disponível agora (P0)** | `PaymentReceipt` (`paidAt`) e `Appointment` (`date`) | Separados por competência vs caixa; auditáveis por drill-down |
| Comissão calculada, Taxa efetiva e Parte da barbearia (antes das despesas) | **Disponível agora (P0)** | Snapshot `Appointment.priceCents` e `commissionCents` | Soma exata em centavos preservada para todo o histórico |
| Taxa de recebimento da coorte, Ticket médio por serviço e por visita | **Disponível agora (P0)** | `buildAdminInsights` | Calculados sobre a coorte de produção do período |
| Ranking de barbeiros, Serviços no período e Clientes recorrentes | **Disponível agora (P0)** | `PrismaAdminInsightsRepository` | Com abertura da lista paginada de agendamentos |
| Repasse pago ao barbeiro vs saldo a pagar | **Parcial (P0)** | `Appointment.commissionCents` | O sistema calcula a comissão devida, mas ainda não possui tabela de liquidação/pagamento de comissão (`CommissionPayout`) |
| Despesas operacionais, contas a pagar e resultado líquido após despesas | **Ainda não disponível (Fase P2)** | Requer entidade `Expense` | Não existe tabela de despesas no schema atual; o painel rotula explicitamente como "antes das despesas" |
| Capacidade contratada, horas disponíveis e taxa de ocupação real | **Ainda não disponível (Fase P2)** | `Barber.workStart` / `workEnd` | Requer motor de disponibilidade líquida descontando pausas e bloqueios |
| Recebimentos por meio de pagamento (`PIX`, `MONEY`, `CARD`) | **Disponível agora (P1)** | `PaymentReceipt.method` | Agregação analítica dedicada no dashboard com drill-down por forma de pagamento |
| Matriz Profissional × Serviço | **Disponível agora (P1)** | `buildAdminInsights` | Cruzamento interativo de barbeiro e serviço com abertura dos registros correspondentes |
| Comparações temporais (`prev_period`, `yoy`, `custom`) e multisseleção | **Disponível agora (P1)** | `resolveComparisonRange` + `buildInsightComparison` | Mês parcial acumulado (MTD) compara contra os mesmos dias decorridos da referência |

## 5. Filtros avançados e comparações temporais (Fase P1)

- **Períodos suportados**: `today` (Hoje), `yesterday` (Ontem), `week` (Esta semana), `month` (Mês atual), `prev_month` (Mês anterior), `last_7_days`, `last_30_days`, `last_90_days`, `year` (Este ano), `custom` (Intervalo personalizado) e `all` (Geral).
- **Modos de comparação**:
  - `prev_period`: Período anterior equivalente. Quando o mês atual está em andamento, compara apenas os primeiros $N$ dias decorridos do mês contra os primeiros $N$ dias do mês anterior (MTD), evitando comparar mês parcial contra mês inteiro.
  - `yoy`: Mesmo período do ano anterior, ajustando `29/02` para `28/02` quando necessário e informando o ajuste no cabeçalho.
  - `custom`: Intervalo de comparação personalizado, emitindo aviso explícito quando a quantidade de dias difere do período atual.
- **Filtros dimensionais e URL**: Multisseleção de barbeiros (`barbers`), serviços (`services`), origens (`origins`: `ONLINE`, `WHATSAPP`, `WALK_IN`) e formas de pagamento (`methods`: `PIX`, `MONEY`, `CARD`) sincronizada na URL. Filtrar forma de pagamento restringe exclusivamente o caixa confirmado, sem alterar a produção realizada.

## 6. Como alterar a comissão e preservação do histórico

Em **Configurações → Comissões** (`/admin/configuracoes/comissoes`), cada serviço apresenta seu percentual atual, preço e prévia da divisão em reais. `PrismaAppointmentRepository.createTransactional` grava `priceCents` e `commissionCents` no ato da criação do agendamento. Alterar a taxa de um serviço afeta apenas novos agendamentos criados após o salvamento, preservando integralmente o histórico passado e os agendamentos já existentes.


