# Barbershop — Corte & Estilo

Aplicação de agendamento com áreas de cliente, barbeiro e administração. Next.js 16, React 19, TypeScript, Auth.js, Prisma 7 e PostgreSQL.

## Instalação

Requisitos: Node.js 22.12+ e PostgreSQL 16+.

1. Copie `.env.example` para `.env` e configure banco e segredos.
2. Execute `npm ci`, que também gera o cliente Prisma.
3. Execute `npm run db:migrate`.
4. Opcionalmente, em banco vazio, defina `SEED_ADMIN_PASSWORD` e `SEED_BARBER_PASSWORD` e execute `npm run db:seed`.
5. Execute `npm run dev` e abra http://localhost:3000.

O seed cria serviços e contas de demonstração, incluindo `admin@barber.com`, com senhas fornecidas pelas variáveis de ambiente. Recusa bancos com usuários ou serviços e não apaga dados. Não o execute para atualizar uma instalação.

Para produção: aplique as migrações antes de iniciar a nova versão, execute `npm run build` e `npm start`. A fonte Poppins está incluída em `src/app/fonts` sob a licença OFL desse diretório; a compilação não depende do Google Fonts.

## Estrutura

| Diretório | Responsabilidade |
| --- | --- |
| `src/app` | Páginas, rotas HTTP e ações autenticadas |
| `src/components` | Interface; filtros, gráficos e formulário administrativo separados |
| `src/core/domain` | Tipos independentes do Prisma e contratos de repositórios |
| `src/core/usecases` | Regras de agendamento, autorização e relatórios |
| `src/core/utils` | Datas, redirecionamentos e política de lembretes |
| `src/infra/repositories` | Persistência, consultas de apresentação e relatórios |
| `src/infra/notifications` | Processamento transacional dos lembretes |
| `prisma/migrations` | Histórico de alterações do banco |

O cliente usa `/agenda` e `/historico`, com 30 registros por página. A agenda do barbeiro fica em `/barber/agenda`; `/barbeiro/agenda` redireciona para ela. Consultas de agenda carregam as relações em conjunto, evitando buscar serviço e cliente individualmente por agendamento.

## Segurança e regras

- A sessão consulta usuário ativo, perfil e versão atuais no servidor. Desativação e troca de senha invalidam sessões anteriores. Sessões antigas sem versão exigem novo login.
- O proxy filtra a navegação; ações e rotas verificam novamente autenticação e autorização.
- Barbeiros alteram apenas seus próprios agendamentos. Clientes só cancelam os próprios agendamentos futuros permitidos pela regra de estado. Estados finais não podem ser reabertos como pendentes.
- Reservas concorrentes são serializadas por barbeiro. Mudanças de estado são condicionais para evitar sobrescrever outra alteração.
- Serviços e barbeiros inativos não aceitam novas reservas. Redirecionamentos de autenticação permanecem na origem configurada em `AUTH_URL`.

## Valores e migração

O catálogo usa decimais. Cada reserva salva `priceCents` e `commissionCents`, preservados ao reagendar. Relatórios usam esses valores históricos: mudar o catálogo não altera reservas anteriores.

A migração `20260908120000_sync_schema_and_financial_history` completa campos, notificações, índices e controle de sessão. Reservas antigas sem histórico são preenchidas com o preço e a comissão do catálogo no momento da migração. Valores nunca registrados não podem ser reconstruídos. Faça backup e revise esse efeito antes de aplicar em um banco existente. Os testes usam banco separado e não atualizam o banco de produção.

Limites de períodos comerciais usam UTC−03 e agrupamentos SQL usam `America/Sao_Paulo`. Revise essa política caso a localização ou as regras de fuso mudem.

## Lembretes

Configure um agendador externo para chamar a cada minuto `POST /api/cron/check-notifications` (GET também aceito), com o cabeçalho `Authorization: Bearer <CRON_SECRET>`. Guarde o segredo apenas no servidor e no agendador. A rota retorna 503 sem configuração e 401 para credenciais inválidas.

Cada lote processa até 200 agendamentos. Se `batchFull` for verdadeiro, o agendador pode chamar novamente para esvaziar a fila. Notificações e marcações de envio são gravadas na mesma transação, evitando duplicação entre execuções simultâneas e permitindo nova tentativa após falhas. Pendências com mais de 15 minutos de atraso viram `NO_SHOW` (falta). A execução retoma itens vencidos após interrupções do cron.

## Verificação

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

Para integração, crie um banco PostgreSQL local exclusivo cujo nome termine em `_test` e configure `TEST_DATABASE_URL`. Aplique previamente as migrações nesse banco, com `DATABASE_URL` e `DIRECT_URL` apontando explicitamente para ele, e execute `npm run test:integration`. O executor rejeita bancos remotos e nomes fora desse padrão. Nunca use o banco real para testes.

Os testes cobrem autorização, sessão, datas, lembretes, concorrência, valores históricos, reversão de transação e migrações em esquema isolado. `.github/workflows/ci.yml` executa migrações, análise estática, testes, comparação de esquema e compilação com PostgreSQL exclusivo.

Antes de publicar, confira no navegador: login de cada perfil, reserva, reagendamento, cancelamento, conclusão pelo barbeiro, paginação, relatórios e lembretes. OAuth e integrações externas precisam de credenciais próprias e validação no ambiente de destino.
