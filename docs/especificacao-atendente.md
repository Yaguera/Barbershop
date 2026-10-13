# Especificação da área da atendente: agenda, agendamentos e caixa

Data: 13/10/2026. Versão consolidada. Status: documentação para implementação futura; nenhum código, conta ou banco alterado nesta entrega.

## 1. Objetivo e regra central

Criar uma área própria para a atendente da barbearia com duas responsabilidades integradas: organizar os agendamentos dos profissionais e registrar os pagamentos recebidos no caixa.

A atendente poderá visualizar as agendas diárias de todos os barbeiros, criar reservas para clientes que entram em contato por WhatsApp ou presencialmente e confirmar o recebimento de atendimentos concluídos.

**Regra central: concluir um atendimento não significa receber seu pagamento.** O barbeiro registra o serviço como concluído; a atendente verifica o pagamento no caixa e confirma o recebimento; somente então o valor entra nas métricas de recebido do administrador. Quantidade de concluídos e valor dos serviços realizados continuam sendo indicadores operacionais separados.

**Regra obrigatória de acesso ao agendamento:** o cliente comum precisa estar autenticado para confirmar e criar sua reserva. Ele pode percorrer as etapas de escolha como visitante, mas, ao chegar à finalização, deve entrar em sua conta ou realizar cadastro e autenticar-se. Somente a atendente autenticada no perfil RECEPTIONIST pode criar uma reserva manual para uma pessoa sem conta, preenchendo seu nome e demais dados necessários. Isso não é agendamento anônimo: a atendente é identificada como autora, enquanto a pessoa atendida pode não ter login.

Este documento reúne e substitui as especificações anteriores da atendente e do fluxo de caixa. Base: texto fornecido pelo usuário, solicitações desta conversa e diagnóstico do código local realizado em 13/10/2026. Entidades, campos e rotas propostos ainda precisam ser implementados. Seguir os padrões visuais de [Refatoração do frontend](./refatoracao-frontend.md) e [Área do barbeiro](./redesign-area-barbeiro.md); para recebimentos, prevalecem as definições desta especificação.

## 2. Responsabilidades e escopo

| Perfil | Responsabilidade |
| --- | --- |
| Barbeiro | Consultar a própria agenda e registrar o resultado do atendimento conforme as regras existentes |
| Atendente | Consultar agendas da equipe, criar reservas manuais, conferir pagamento no caixa e registrar recebimento |
| Administrador | Gerenciar acessos, acompanhar operação e financeiro, e realizar correções auditáveis |
| Cliente | Confirmar reserva somente após login/cadastro e autenticação; consultar os próprios registros autorizados |

### Incluído na primeira versão

- Login individual da atendente e cadastro/desativação pelo administrador.
- Agenda por data, visão da equipe e filtro por barbeiro.
- Busca limitada de clientes existentes e cadastro de contato sem conta.
- Reserva manual com origem WhatsApp ou Presencial, disponibilidade e confirmação explícita.
- Registro de autoria e origem da reserva.
- Fila persistente de serviços concluídos aguardando pagamento, inclusive de dias anteriores.
- Confirmação integral de recebimento, com forma, valor histórico, responsável e data/hora.
- Resumo operacional do caixa e histórico de recebimentos.
- Financeiro administrativo separado em realizado, recebido e em aberto.
- Correção administrativa de recebimento por reversão auditável.

### Fora do escopo inicial

A atendente não poderá cancelar/reagendar, concluir serviços, registrar faltas, alterar preços, conceder descontos, alterar expediente ou consultar comissões e financeiro consolidado da empresa. São extensões futuras, sujeitas a regras específicas.

Também ficam fora: automação de WhatsApp, integração bancária/adquirente, pagamentos parciais ou divididos, adiantamentos, gorjetas, vendas de produtos, abertura/fechamento formal de turno, sangria, suprimento, reembolso bancário e repasse de comissão.

Registrar pagamento no sistema é confirmar um recebimento verificado no caixa. Não significa que o aplicativo cobrou cartão, validou Pix ou conciliou saldo bancário automaticamente. Não exibir controles para funções ainda indisponíveis.

## 3. Diagnóstico da estrutura atual

| Código atual confirmado | Adaptação necessária |
| --- | --- |
| `User.role` é String, com regras para ADMIN, BARBER e CLIENT | Introduzir RECEPTIONIST com permissões próprias |
| `Barber` é perfil vinculado a User | Definir perfil da atendente sem duplicar autenticação |
| `Appointment.clientId` é obrigatório; User exige e-mail | Representar pessoa atendida sem obrigar criação de conta |
| `createAppointmentAction` usa a sessão como cliente | Separar cliente da reserva e autor da criação |
| `getBarberAppointmentsAction` restringe perfis e usa primeiro barbeiro no fluxo de administrador | Criar consulta explícita por data/equipe para recepção |
| `GetBarberAvailabilityUseCase` valida disponibilidade e gera grade de 30 minutos | Reaproveitar regras e alinhar ocupação por blocos/duração real |
| `CreateAppointmentUseCase` valida expediente, serviço/profissional ativo e horário futuro | Manter as mesmas restrições para reserva manual |
| `PrismaAppointmentRepository.createTransactional` bloqueia registro do barbeiro e verifica sobreposição | Preservar proteção contra reservas concorrentes |
| Preço e comissão históricos ficam no Appointment | Usar valores do servidor, sem recalcular pelo catálogo ao receber |
| Relatórios somam vários valores com base em COMPLETED | Separar produção de recebimento confirmado |
| Não foi encontrada entidade própria de pagamento no schema consultado | Acrescentar recebimentos e reversões com trilha |
| Lembretes/notificações pressupõem cliente User | Adaptar para contato sem conta e destinatários reais |
| Login, Proxy e dashboards reconhecem os perfis atuais | Incluir nova área, redirecionamentos e contexto de Conta |

Não basta alterar rótulos: consultas financeiras, regras de autorização, contratos e processamento de lembretes também precisam acompanhar a nova estrutura.

## 4. Identidade, acesso e gestão da atendente

Usar User para autenticação e RECEPTIONIST como papel. Proposta de perfil: Receptionist, com identificador, vínculo único ao usuário e datas de criação/alteração, seguindo a separação já usada em Barber.

Nome, e-mail, senha e estado de acesso permanecem em User. Não duplicar essas informações nem criar estados de ativação contraditórios. Não copiar expediente ou comissão de Barber.

Um papel em User, sem tabela adicional, também atende aos requisitos funcionais atuais. Escolher a alternativa antes da migração; a proposta é o perfil vinculado, sem tratar o novo papel como cliente ou administrador.

### Cadastro e desativação

Propor `/admin/atendentes` com lista, cadastro e desativação:

1. Autorizar somente ADMIN, inclusive por chamada direta ao servidor.
2. Validar nome, e-mail normalizado e unicidade. Criar identidade/perfil na mesma transação.
3. Não converter silenciosamente conta existente de outro perfil. O modelo atual usa papel único; múltiplos papéis exigem decisão própria.
4. Usar convite para definir senha somente quando houver infraestrutura funcional. Caso contrário, definir mecanismo provisório com senha por hash e entrega orientada, sem publicar credenciais.
5. Manter cadastro público restrito a CLIENT; ignorar/rejeitar tentativa de solicitar papel privilegiado.
6. Ao desativar, revogar sessões conforme `active`/`sessionVersion` e negar novas ações. Preservar reservas, recebimentos e autoria.
7. Não excluir fisicamente a conta como procedimento de retirada de acesso. Cada pessoa do caixa usa credencial individual.

## 5. Matriz de permissões

| Operação | Barbeiro | Atendente | Administrador |
| --- | --- | --- | --- |
| Consultar agendas | Próprios registros autorizados | Toda a equipe, dados necessários | Sim |
| Buscar clientes para reserva | Conforme experiência existente | Busca limitada | Sim |
| Criar contato/reserva manual para pessoa sem conta | Não | Sim, autenticada como RECEPTIONIST | Não; função exclusiva da atendente nesta especificação |
| Concluir serviço | Próprios, conforme regras atuais | Não | Conforme regras atuais |
| Ver estado financeiro do atendimento | Próprios, sem dados sensíveis de pagamento | Sim, necessário ao caixa | Sim |
| Confirmar recebimento de concluído | Não | Sim | Sim, com mesma trilha |
| Consultar resumo operacional do caixa | Não geral | Sim | Sim |
| Reverter recebimento confirmado | Não | Não na primeira versão | Sim, com motivo e auditoria |
| Alterar preço histórico | Não neste fluxo | Não | Operação separada, fora desta versão |
| Consultar financeiro/comissões da equipe | Não | Não | Sim |
| Gerenciar atendentes | Não | Não | Sim |

Toda ação verifica sessão, conta ativa e autorização no servidor. Proxy e menus são camadas de navegação, não autorização suficiente. Não adicionar RECEPTIONIST indiscriminadamente às permissões de ações administrativas/profissionais existentes.

Visitante e CLIENT não podem acessar criação de ClientContact ou reserva manual, nem enviando requisição diretamente. ADMIN gerencia o acesso da atendente, mas não recebe automaticamente sua permissão de agendar pessoas sem conta. A exclusividade decorre da regra solicitada pelo usuário; eventual ampliação futura exige decisão explícita.

## 6. Dados e entidades propostos

### 6.1 Cliente existente e contato sem conta

Manter User para cliente autenticado. Criar ClientContact para cadastro operacional sem login, preenchido exclusivamente pela atendente autenticada no fluxo manual. Não disponibilizar esse cadastro na jornada pública do cliente:

| Informação | Regra proposta |
| --- | --- |
| Identificador | Gerado pelo servidor |
| Nome | Obrigatório, validado e limitado |
| Telefone | Obrigatório para origem WhatsApp; opcional para presencial |
| E-mail | Opcional, sem conceder acesso |
| Datas de criação/alteração | Geradas pelo servidor |

A reserva aponta para User ou ClientContact. Propor `clientId` e `clientContactId` opcionais, com restrição de exatamente um preenchido, no domínio e no banco. Dados antigos continuam ligados a User.

Não criar e-mail fictício, senha padrão ou conta compartilhada para atender quem não tem cadastro. Não vincular histórico automaticamente por coincidência de nome, telefone ou e-mail digitado pela recepção.

Busca por nome/telefone deve ter mínimo de caracteres, limite de resultados e paginação quando necessária. Mostrar somente dados suficientes para distinguir pessoas. Homônimos e telefone compartilhado exigem seleção explícita; não fazem fusão automática. Cadastro de novo contato é uma opção separada, com indicação de possíveis duplicados.

A atendente não altera dados de conta autenticada por meio da reserva. Eventual vinculação de contato a futura conta exige verificação e fluxo próprio.

### 6.2 Agendamento e autoria

Reutilizar barbeiro, serviço, início/fim, estado e valores históricos. Acrescentar:

- Tipo de cliente: User ou ClientContact, conforme regra exclusiva.
- Origem: ONLINE, WHATSAPP ou WALK_IN, validada pelo servidor.
- Autor: User autenticado que criou a reserva, separado da pessoa atendida.
- Identificador da operação manual, para repetição segura sem duplicação.

No histórico sem evidência, manter origem/autoria desconhecidas ou de legado. Não atribuir retroativamente tudo à atendente/administrador. Observações livres não são necessárias nesta versão; se incluídas depois, limitar conteúdo, tamanho e leitores.

### 6.3 Recebimento e reversão

Criar PaymentReceipt vinculado ao Appointment, em vez de um booleano sem autoria:

| Informação | Regra |
| --- | --- |
| Identificador e atendimento | Vínculos gerados/validados pelo servidor |
| Valor em centavos | Preço histórico devido; sem edição arbitrária no navegador |
| Forma | Dinheiro, Pix ou Cartão; crédito/débito se definido pela operação |
| Responsável | Conta autorizada que confirmou |
| Data/hora | Horário do servidor para confirmação corrente |
| Chave de operação | Vinculada ao autor e conteúdo para idempotência |
| Situação | Confirmado ou revertido, com uma única entrada válida por atendimento |

Registrar reversão como evento administrativo vinculado ao recebimento original, com valor, motivo, autor e data. Nunca apagar o lançamento ou sobrescrever sua autoria/data para ajustar totais.

Primeira versão: recebimento integral, um válido por atendimento. Reversão preserva original e pode permitir nova confirmação. Totais vêm dos lançamentos, não de um saldo livre editável.

## 7. Estados operacionais e financeiros

Manter PENDING, COMPLETED, CANCELED e NO_SHOW para atendimento. Não inserir PAID nessa mesma lista; pagamento é outra dimensão.

| Situação | Estado apresentado | Consequência |
| --- | --- | --- |
| Agendado, não concluído | Pagamento ainda não disponível | Não é recebido nem dívida de serviço realizado |
| Concluído, sem recebimento válido | Aguardando pagamento | Fila do caixa e valor em aberto |
| Concluído, recebimento confirmado | Pago | Recebido aumenta; pendência sai da fila |
| Concluído, recebimento revertido | Aguardando pagamento · registro revertido | Ajuste financeiro e retorno à pendência quando aplicável |
| Cancelado/falta sem cobrança específica | Não aplicável | Não gera dívida ou recebimento automaticamente |
| Legado sem evidência de pagamento | Pagamento não verificado | Conferência administrativa separada |

Derivar estado financeiro dos eventos válidos ou manter resumo atualizado na mesma transação. Não permitir que resumo e lançamentos discordem.

O cliente sair sem pagar não desfaz a conclusão. Não mudar para falta/cancelado para esconder valor em aberto.

## 8. Telas e navegação

### 8.1 Área da atendente

Rotas propostas: `/atendente` para agenda, `/atendente/caixa` para caixa e `/profile` com contexto de recepção para Conta. Criar rota própria de Conta somente se houver necessidade arquitetural. Navegação: Agenda, Caixa e Conta; Novo agendamento é ação.

Usar preto/grafite/dourado, tipografia e componentes compartilhados. Sem hero, foto grande, selo VIP ou painel financeiro da empresa. Validar foco, teclado, leitura por tecnologia assistiva, contraste e áreas seguras de barras fixas.

### 8.2 Agenda da equipe

Título → data/Hoje/Anterior/Próximo → filtro Todos/Barbeiro → Novo agendamento → agendas agrupadas.

Desktop/tablet: colunas por profissional quando couberem; equipe grande usa filtro e lista agrupada. Celular: lista por profissional, sem comprimir várias colunas. Cada registro mostra horário, cliente, serviço, duração e estado; contato aparece quando necessário.

Barbeiro sem reservas tem vazio explícito. Profissional desativado pode aparecer em datas com reservas antigas, mas não aceita nova reserva. Data da barbearia usa America/Sao_Paulo. Preservar filtros/retorno; erro não representa agenda vazia e resposta antiga não substitui a seleção atual.

### 8.3 Caixa

Título → resumo operacional → Aguardando pagamento/Recebidos → busca e filtro de profissional → lista/detalhe → confirmação.

Resumo: recebido hoje, quantidade recebida hoje, total em aberto e quantidade de pendências. Informar se totais seguem filtros. Pendências incluem dias anteriores; não restringir automaticamente à data da agenda. Separar legado não verificado de novas cobranças.

Lista: cliente, profissional, serviço, data do atendimento, valor e estado financeiro. Histórico recebido acrescenta forma, responsável, confirmação e identificador interno. Esse registro não substitui nota fiscal ou comprovante bancário.

Formulário: resumo da reserva, valor histórico, forma obrigatória e “Confirmar recebimento de {valor}”. Explicar: confirmar após verificar o pagamento no caixa. Não selecionar estado Pago antes do sucesso. Se calcular troco, registrar como receita somente o preço devido, não todo o dinheiro entregue.

### 8.4 Administração e barbeiro

Administrador: gerenciamento de atendentes e indicadores separados de realizado, recebido e a receber, com detalhamento por forma/profissional/intervalo autorizado.

Barbeiro: continua concluindo o serviço, vê situação de pagamento dos próprios atendimentos e não confirma recebimento. Aviso de pagamento pendente não significa serviço não realizado.

## 9. Fluxos de reserva: autenticação e agendamento manual

### 9.1 Cliente comum — login obrigatório antes de confirmar

1. Visitante pode consultar e escolher serviço, profissional e horário, conforme a experiência pública permitida.
2. Ao chegar à finalização sem sessão válida, solicitar Entrar ou Criar conta. Nenhuma reserva é criada antes disso.
3. Após cadastro, concluir a autenticação; criar uma conta não significa, por si só, estar autenticado.
4. Preservar as escolhas ao retornar e revalidar serviço, preço e disponibilidade. O rascunho não garante a vaga.
5. Voltar à revisão e exigir clique em Confirmar agendamento. Login/cadastro não devem disparar criação automática.
6. No servidor, exigir sessão de cliente válida e usar a identidade autenticada como cliente da reserva. Não aceitar ClientContact, clientId de terceiro ou origem manual enviados pelo cliente.
7. Se a sessão expirar antes do envio, pedir autenticação novamente, preservando o rascunho quando possível, sem gravar reserva.

Não oferecer Continuar como convidado ou formulário público de reserva apenas com nome/telefone. A exceção para pessoa sem conta existe somente no atendimento manual feito pela atendente.

### 9.2 Atendente — reserva manual para pessoa com ou sem conta

Pré-condição: sessão válida de atendente ativa com perfil RECEPTIONIST. Ela deve estar autenticada durante todo o processo; a dispensa de conta se aplica exclusivamente à pessoa atendida.

1. Abrir Novo agendamento com data/profissional de origem quando disponíveis.
2. Escolher WhatsApp ou Presencial explicitamente.
3. Selecionar cliente existente ou cadastrar contato sem conta.
4. Escolher serviço ativo, com preço/duração visíveis, e barbeiro ativo.
5. Consultar disponibilidade no fuso da operação. Trocar serviço/profissional/data invalida horário incompatível.
6. Selecionar vaga. Separar carregamento, folga, falta de vagas e erro.
7. Revisar cliente, origem, profissional, serviço, data, início/fim e total.
8. Acionar Confirmar agendamento; somente essa ação cria reserva.
9. Servidor revalida dados e grava contato/reserva/autoria atomicamente, com proteção de conflito e duplicação.
10. Mostrar identificação da reserva e atualizar agenda. Em conflito, manter escolhas e solicitar outro horário; em resposta perdida, recuperar resultado sem duplicar.

Reserva manual nasce PENDING, sem afirmar pagamento, presença ou conclusão. WhatsApp é origem; não há envio automático. Compartilhar informação, se implementado, é ação explícita da atendente.

### Presencial imediato e grade

Primeira versão usa próximo horário futuro disponível. O código atual oferece inícios em grade de 30 minutos e arredonda duração para verificar disponibilidade, enquanto a criação considera duração real. Alinhar a política antes de ampliar opções; não criar regra de encaixe exclusiva da recepção.

Se for necessário Atendimento agora entre blocos, definir fluxo próprio com horário do servidor, duração válida, expediente e ausência de sobreposição. Não desativar validação de passado nem permitir sobreposição por ser presencial.

## 10. Fluxo B — conclusão e recebimento

1. Barbeiro conclui o atendimento autorizado.
2. Servidor registra COMPLETED. Concluídos/valor realizado aumentam; recebido não muda.
3. Atendimento entra na fila persistente Aguardando pagamento; notificação é apenas complemento.
4. Atendente confere cliente, serviço, profissional e valor.
5. Cliente paga no caixa; atendente verifica dinheiro, Pix ou resultado da maquininha.
6. Atendente informa a forma e confirma o recebimento explicitamente.
7. Servidor revalida conclusão, autorização, preço e ausência de recebimento válido; grava lançamento e autoria em transação.
8. Pago aparece após sucesso; financeiro recebido aumenta e pendência sai do saldo atual.
9. Erro mantém estado correto e permite recuperar; resposta perdida não autoriza criar novo lançamento sem verificar o anterior.

Não concluir automaticamente para permitir pagamento. Adiantamento antes do serviço está fora desta versão.

## 11. Regras transacionais e recuperação

### Reserva

- Manter serviço/profissional ativos, dia de trabalho, horário futuro e duração integral dentro do expediente.
- Preservar bloqueio por barbeiro e sobreposição de PENDING/COMPLETED conforme regra atual.
- Disponibilidade consultada não garante vaga; revalidar dentro da transação de criação.
- Preço/comissão vêm do servidor e permanecem históricos.
- Contato, reserva e autoria são atômicos, evitando órfãos/duplicações por falha.

### Recebimento

- Exigir atendimento concluído e autor autorizado/ativo.
- Obter preço histórico no servidor; cliente não envia autor/valor confiáveis.
- Bloquear/reler atendimento antes de confirmar; duas atendentes não geram duas entradas.
- Manter um recebimento integral válido por atendimento com garantia transacional/de banco.
- Bloquear mudança incompatível de preço/serviço/estado após recebido; encaminhar correção ao fluxo administrativo.

### Repetição e interface

Chaves de idempotência por operação: mesma chave/conteúdo retorna resultado existente; mesma chave com conteúdo diferente é rejeitada. Botão desabilitado sozinho não protege de concorrência.

Após mutação, atualizar agenda/caixa/detalhes/relatórios pertinentes. Mostrar última consulta e revalidar ao retornar à aba. Evitar consultas sobrepostas e dados de filtros antigos.

Falha de notificação posterior não desfaz operação já salva nem deve induzir novo envio. Separar sucesso principal e recuperação do aviso. Menus e diálogos preservam foco/contexto e oferecem mensagens localizadas.

## 12. Métricas e comissões

| Indicador | Critério | Data de referência |
| --- | --- | --- |
| Atendimentos concluídos | COMPLETED | Data do atendimento conforme política operacional |
| Valor dos serviços realizados | Preço histórico dos concluídos | Data do atendimento |
| Recebido bruto | Confirmações de recebimento | Data/hora de confirmação |
| Ajustes/reversões | Eventos de reversão | Data/hora do ajuste |
| Recebido líquido registrado | Confirmações menos ajustes no intervalo | Data de cada evento financeiro |
| A receber | Concluídos sem recebimento válido, com legado tratado separadamente | Saldo atual; filtro por serviço quando solicitado |
| Ticket médio realizado | Valor realizado dividido por concluídos | Data do atendimento |
| Valor médio por recebimento | Recebido bruto dividido pela quantidade recebida | Data do recebimento |

Exemplo: serviço de R$ 50 concluído em 13/10 e pago em 14/10. Em 13/10: um concluído, R$ 50 realizados, R$ 0 recebidos e R$ 50 em aberto. Após confirmação em 14/10: R$ 50 recebidos nesse dia, sem pendência atual; a realização continua em 13/10.

Saldo atual não equivale a saldo histórico ao fim de uma data. Consultar posição histórica exige considerar eventos até aquele instante; não prometer esse recurso com um simples filtro da lista atual.

Calendário e gráficos devem identificar se mostram operação ou caixa. Recebido usa confirmação; não continuar filtrando apenas `startTime`/COMPLETED. Comparações entre períodos usam mesma definição e fuso.

### Meios de pagamento

Separar totais de Dinheiro, Pix e Cartão. Só dinheiro aumenta numerário físico; todos os meios aumentam recebido registrado. Taxa de cartão, prazo de repasse e saldo bancário não estão modelados; não apresentar valor bruto como lucro ou saldo líquido disponível.

### Comissão

Preservar `commissionCents` histórico. Diferenciar comissão calculada de serviços concluídos, comissão de serviços recebidos se usada para liberação, e comissão efetivamente paga ao profissional.

O pedido define quando o recebido do administrador aumenta; não define vencimento/repasse da comissão. Não alterar silenciosamente esse acordo. A política de liberação permanece decisão de produto, e repasse ao barbeiro não é inferido do pagamento do cliente.

## 13. Correções, notificações e histórico

### Reversão administrativa

Somente administrador na primeira versão, com motivo, confirmação de efeito, responsável e data. Preservar lançamento original; reversão única não pode descontar duas vezes. Reserva continua concluída e retorna à pendência quando aplicável.

Reverter registro corrige a escrituração interna, sem comprovar devolução física/bancária. Reembolso é outro fluxo. Não disponibilizar simples alternância Pago/Não pago sem trilha.

### Notificações e clientes sem conta

Avisar barbeiro sobre reserva manual; cliente com conta pode receber aviso existente. Contato sem conta não é destinatário User: adaptar `process-reminders.ts`, filtrar destinatários reais e preservar avisos do profissional cabíveis.

Conclusão pode avisar recepção, mas fila de cobrança vem do banco e independe do aviso. Conferir regra atual de falta automática após tolerância e compatibilidade com presencial. Origem presencial não prova conclusão/presença; eventual check-in requer regra própria.

### Histórico e relatórios

Revisar todos os acessos que presumem `appointment.client` obrigatório. Contato deve aparecer corretamente na agenda, detalhe e administração. Distinguir usuários cadastrados de pessoas atendidas; não contar criação de contato como nova conta autenticada.

Recebimento/produção independem de o cliente ter conta. Histórico autenticado permanece restrito ao titular, sem liberar por telefone ou identificação pública. Desativação de atendente não elimina autoria de reservas/recebimentos.

## 14. Mapa de alterações futuras

| Arquivo/área | Alteração |
| --- | --- |
| `prisma/schema.prisma` e migrações | Perfil, contato, relações exclusivas de cliente, autoria/origem, recebimento/reversão e idempotência |
| `src/core/domain/models.ts` e contratos | Separar cliente, autor, atendimento e recebimento |
| `src/core/usecases/CreateAppointmentUseCase.ts` | Reaproveitar validações, adaptar cliente sem conta e autoria |
| Novo caso de uso de reserva manual | Autorização e criação atômica de contato/reserva |
| `src/core/usecases/ChangeAppointmentStatusUseCase.ts` | Concluir sem receber; proteger transições incompatíveis com pagamento |
| Novos casos de uso de caixa | Fila, confirmação, consulta e reversão administrativa |
| `src/infra/repositories/PrismaAppointmentRepository.ts` | Preservar conflito/bloqueio e acrescentar contratos transacionais |
| `src/infra/repositories/appointment-queries.ts` | Agenda explícita por equipe/data e apresentação de User/ClientContact |
| `src/app/actions/appointment-actions.ts` | Separar ator/cliente e atualizar pendência sem pagamento automático |
| Novas ações de recepção/caixa | Autorizar cada operação e devolver dados mínimos |
| `src/app/actions/admin-actions.ts` e `/admin/atendentes` | Gerenciamento exclusivo do administrador |
| `src/proxy.ts`, `src/app/page.tsx`, `src/app/dashboard/page.tsx` | Proteção e redirecionamento do novo papel |
| `src/app/profile/page.tsx` e navegação | Contexto correto para atendente, Agenda/Caixa/Conta |
| `src/infra/notifications/process-reminders.ts` | Contatos sem conta e destinatários válidos |
| `src/infra/repositories/PrismaAppointmentReportRepository.ts` | Realizado/recebido/em aberto e datas corretas |
| `src/core/domain/repositories/AppointmentReportRepository.ts` | Contratos claros, evitando `totalRevenue` ambíguo |
| Painéis administrativos, calendário e área do barbeiro | Novos indicadores/estados sem confundir operação e caixa |

Não editar arquivos Prisma gerados manualmente nem retornar hashes, tokens, credenciais OAuth ou finanças irrestritas nas consultas de recepção. Antes de escrever código Next.js, ler guias relevantes em `node_modules/next/dist/docs/`, conforme `AGENTS.md`.

## 15. Migração e ordem de execução

1. Definir decisões de produto pendentes e contratos finais.
2. Preparar identidade/contatos/reservas e estruturas financeiras com restrições de integridade.
3. Adaptar leitores, relatórios e lembretes antes de permitir reserva sem clientId e confirmação no caixa.
4. Implementar permissões e gerenciamento de atendentes.
5. Implementar agendamento manual e proteção transacional.
6. Implementar conclusão → fila → recebimento, ajustes e métricas.
7. Implementar telas e validar jornadas completas.
8. Testar migração em dados de teste e publicar aplicação/banco de forma coordenada.

### Tratamento do legado

Não classificar todos os COMPLETED antigos como pagos nem como dívida verificada. Definir marco de início do caixa e separar pagamento não verificado de novas pendências. Preservar preços/comissões e relações antigas; não inventar autoria/origem.

Se houver conferência de comprovantes pelo administrador, registrar origem da evidência, responsável, data informada do recebimento e data do lançamento separadas. Não inventar datas precisas. Explicar mudança de base no painel para não parecer perda de histórico.

### Retorno de versão

Não apagar contatos/reservas manuais/recebimentos. Em problema, desabilitar novas operações e manter leitores compatíveis. Código antigo que exige clientId e interpreta COMPLETED como recebido pode ser incompatível após a ativação.

Esta documentação não aplica migração nem cria contas. Implementação e publicação são etapas futuras.

## 16. Matriz de validação

| Cenário | Resultado esperado |
| --- | --- |
| Perfil não autorizado chama ação diretamente | Negado sem leitura/gravação indevida |
| Atendente desativada com sessão aberta | Perde acesso; autoria antiga preservada |
| Agenda da equipe e data no fuso local | Profissionais/data corretos, incluindo vazio e histórico de inativo |
| Presencial sem e-mail/telefone | Contato/reserva permitidos conforme regra proposta |
| WhatsApp sem telefone | Validação localizada |
| Homônimos ou telefone compartilhado | Seleção explícita, sem fusão automática |
| Reserva com cliente existente | Histórico do cliente; autoria da atendente |
| Horário passado, fora do expediente ou sobreposto | Rejeitado no servidor sem gravação parcial |
| Cliente online e atendente disputam horário | Uma reserva, conflito recuperável no outro fluxo |
| Visitante chega à finalização | Solicita login/cadastro; nenhuma reserva criada |
| Cadastro concluído sem sessão autenticada | Confirmação bloqueada até autenticar |
| Login após escolhas | Retorna à revisão e revalida vaga; não agenda automaticamente |
| Cliente tenta reserva pública só com nome/telefone | Negada no servidor; sem ClientContact ou agendamento |
| CLIENT, BARBER ou ADMIN chama criação manual sem papel RECEPTIONIST | Negado; exceção exclusiva da atendente |
| Sessão expira no envio | Pede autenticação; não grava reserva sem autor válido |
| Duplo envio/queda de rede na reserva | Uma operação/contato, resultado recuperável |
| Barbeiro conclui | Concluídos aumenta; recebido não; pendência entra no caixa |
| Atendente tenta receber agendado não concluído | Negado, sem concluir implicitamente |
| Atendente confirma pagamento válido | Uma entrada e remoção da pendência atual |
| Duas atendentes recebem a mesma reserva | Um recebimento válido |
| Valor, origem ou autor adulterados | Servidor valida/deriva informações confiáveis |
| Mesma chave com conteúdo diferente | Rejeitado sem reutilização indevida |
| Serviço ontem, pagamento hoje | Realizado ontem, recebido hoje |
| Pendência anterior ao dia aberto | Permanece acessível; legado não verificado distinguido |
| Contato sem conta recebe lembrete/paga | Sem destinatário nulo; caixa funciona sem login do cliente |
| Reversão administrativa repetida | Um ajuste, motivo/autor preservados; serviço continua concluído |
| Mudança incompatível após recebido | Bloqueio ou correção auditável |
| Totais por forma | Conferência correta, sem chamar Pix/cartão de dinheiro físico |
| Falha de notificação após sucesso | Reserva/pagamento preservados; sem nova gravação induzida |
| Troca rápida de filtro e rede lenta | Seleção atual prevalece; falha não vira vazio/zero |
| Migração de histórico | Sem pagamento presumido nem perda de valores |
| Teclado, zoom, foco e celular estreito | Jornada completa utilizável, conteúdo não encoberto |

Executar testes de domínio/autorização, integração transacional em PostgreSQL exclusivo de testes e jornadas de interface. Não usar banco real para testes destrutivos. Conferir amostra conhecida de reservas, recebimentos e reversões, incluindo valores em centavos.

Validar com a atendente: consultar profissional, reservar WhatsApp, reservar presencial, recuperar conflito, localizar concluído e confirmar pagamento. Conferir depois no painel administrativo; build aprovado não comprova correção dos números.

## 17. Decisões definidas e propostas pendentes

| Tema | Situação |
| --- | --- |
| Perfil e tela próprios da atendente | Solicitados pelo usuário |
| Agenda diária de cada barbeiro e reserva manual | Solicitadas pelo usuário |
| Cliente comum precisa de login/cadastro e autenticação para confirmar | Regra obrigatória definida pelo usuário |
| Reserva para pessoa sem conta | Exclusiva da atendente autenticada como RECEPTIONIST |
| Barbeiro conclui; atendente confirma pagamento | Regra definida pelo usuário |
| Recebido aumenta somente após confirmação | Regra definida pelo usuário |
| Receptionist vinculado a User | Proposta técnica; confirmar modelagem |
| ClientContact sem e-mail obrigatório | Proposta para atender cliente sem conta |
| Telefone obrigatório para WhatsApp e opcional presencial | Proposta operacional |
| Confirmação integral, formas Dinheiro/Pix/Cartão | Proposta de primeira versão |
| Reversão restrita ao administrador | Proposta de controle administrativo |
| Comissão devida/liberada e seu repasse | Política a aprovar, sem inferência automática |
| Marco de início e conferência do legado | Definir antes de migrar/publicar |
| Atendimento presencial entre blocos | Evolução separada se necessária |
| Convite ou senha provisória da atendente | Definir conforme infraestrutura disponível |

## 18. Checklist de entrega futura

- [ ] Identidade individual, gestão administrativa e revogação de acesso.
- [ ] Cliente comum só confirma após autenticação, sem criação automática ao entrar/cadastrar.
- [ ] Reserva manual para pessoa sem conta exclusiva da atendente autenticada, com autoria registrada.
- [ ] Agenda por profissional/data e reserva manual para conta ou contato.
- [ ] Origem, autoria, integridade e idempotência de reserva.
- [ ] Serviço concluído separado do recebimento.
- [ ] Fila de pagamento persistente, inclusive pendências anteriores.
- [ ] Confirmação auditável com valor histórico, forma e horário.
- [ ] Recebimento/reversão protegidos contra concorrência e repetição.
- [ ] Realizado, recebido e a receber com definições/datas próprias.
- [ ] Comissão calculada e repasse efetivo diferenciados.
- [ ] Notificações, relatórios e histórico compatíveis com cliente sem conta.
- [ ] Legado sem classificação financeira presumida.
- [ ] Telas acessíveis, permissões verificadas e jornadas testadas.
- [ ] Migração/publicação/retorno planejados sem apagar registros.
