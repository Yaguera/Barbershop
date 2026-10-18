# Especificação do painel administrativo e da inteligência de gestão

Data: 18/10/2026. Status: planejamento para implementação futura. Nenhuma funcionalidade descrita como proposta neste documento deve ser considerada implementada.

Este documento consolida os pedidos do proprietário do projeto e uma leitura estática do código atual. Seu objetivo é orientar uma IA ou equipe de desenvolvimento. Não autoriza implantação, mudanças no banco de produção, contratação de serviços ou alteração de regras financeiras sem validação do escopo correspondente.

## 1. Resultado esperado e decisões de produto

Transformar a entrada do administrador em um painel de gestão: ao acessar `/admin/dashboard` sem filtros explícitos, mostrar imediatamente números e gráficos do mês atual, com comparação contextual e caminhos claros para aprofundar a análise.

O administrador deve conseguir responder:

- Quanto produzimos, quanto recebemos e quanto ainda não tem recebimento registrado?
- Quanto foi gasto, quanto devemos pagar e qual é o resultado gerencial?
- Como o período se compara ao anterior ou ao mesmo período de outro ano?
- Quais profissionais apresentam maior volume, receita e contribuição, considerando os serviços que executam e suas jornadas?
- Quais serviços trazem demanda e contribuição por hora?
- Quais clientes retornam, deixam de retornar ou geram mais receita?
- Onde existem horários ociosos, faltas e problemas de recebimento?
- Que registros explicam cada valor apresentado?

### 1.1. A página inicial deve ser analítica

Requisito explícito: remover da página inicial todos os formulários e controles de administração da equipe, cadastro de barbeiros, configuração de permissões e configuração de comissões.

Na leitura do código, foi encontrado `CommissionSettings`, de configuração de **comissões**, dentro da página inicial. Isso é diferente de **permissões de acesso**. Ambos os assuntos deverão ficar em páginas próprias; não substituir um pelo outro ao implementar este pedido.

O ranking e os gráficos de desempenho dos barbeiros permanecem no dashboard. Eles são análises, diferentes da lista administrativa de funcionários com cadastro, edição ou desativação.

Não inserir grandes boas-vindas, cartões de perfil ou banners que empurrem os primeiros indicadores e gráficos para baixo.

### 1.2. Rotas e navegação propostas

| Destino | Situação atual / proposta | Responsabilidade |
|---|---|---|
| `/admin/dashboard` | Existe; reorganizar | Resumo executivo e análises, sem cadastros. |
| `/admin/financeiro` | Proposta nova | Despesas, contas, caixa, recebíveis, resultado e repasses. |
| `/admin/barbeiros` | Proposta de página de gestão | Lista, cadastro, edição e desativação de profissionais. |
| `/admin/barbeiros/[id]/metricas` | Existe | Aprofundamento analítico individual, preservando contexto. |
| `/admin/servicos` | Existe | Gestão de serviços; análise acessível em contexto próprio. |
| `/admin/clientes` | Existe | Gestão e histórico dos clientes. |
| `/admin/atendentes` | Existe | Gestão das atendentes. |
| `/admin/configuracoes/comissoes` | Proposta nova | Política de comissão e histórico das alterações. |
| `/admin/configuracoes/permissoes` | Proposta nova | Gestão de acesso; primeira versão pode apresentar os papéis fixos, sem criar editor de permissões arbitrárias. |
| `/admin/calendario` | Existe | Agenda e caixa por data, integrados aos filtros compatíveis. |

Os caminhos novos são sugestões de arquitetura, não inventário de rotas já disponíveis. Validar convenções do projeto antes da implementação. Navegação sugerida: Painel, Calendário, Financeiro, Clientes, Equipe, Serviços e Configurações. Equipe pode agrupar Barbeiros e Atendentes.

## 2. Inventário do projeto e limitações verificadas

Raiz de referência: `C:/Users/ya-go/OneDrive/Documentos/Programação/antigravityProjects/barberApp`.

| Arquivo relativo à raiz | Evidência / papel atual | Orientação futura |
|---|---|---|
| `src/app/admin/dashboard/page.tsx` | Carrega `getAdminInsightsAction`, usa período e um barbeiro na URL; padrão mensal. Renderiza comissões e gestão da equipe na mesma tela. | Manter entrada mensal; separar gestão e configurações; ampliar o estado de filtros. |
| `src/components/admin/DashboardAnalytics.tsx` | Indicadores de caixa, serviços, pendências, divisão, evolução, rankings e clientes; detalhes clicáveis. | Evoluir a base existente, sem reconstruir funcionalidades já presentes sem motivo. |
| `src/components/admin/DashboardFilters.tsx` | Hoje, semana, mês, ano, geral e um profissional. | Adicionar intervalos, comparação, multisseleção e filtros avançados. |
| `src/components/admin/InsightDetailsDialog.tsx` | Detalhes paginados, totais gerais do recorte e divisão do serviço. | Reutilizar comportamento; permitir página completa para análises extensas. |
| `src/components/admin/AdminNavbar.tsx` | Navegação administrativa atual. | Separar Painel, Equipe, Financeiro e Configurações com estados ativos claros. |
| `src/app/actions/admin-insights-actions.ts` | Entrada do painel novo, com autenticação e caso de uso. | Preservar autorização no servidor e evoluir contrato validado. |
| `src/core/usecases/GetAdminInsightsUseCase.ts` | Valida ADMIN, período, IDs, paginação e detalhe contido no período. | Ampliar validação para filtros e comparações, sem retirar limites de segurança. |
| `src/core/domain/repositories/AdminInsightsRepository.ts` | Contratos de resumo, grupos e detalhes. | Definir contrato analítico único e versionado. |
| `src/infra/repositories/PrismaAdminInsightsRepository.ts` | Produção por `Appointment.startTime`; caixa por `PaymentReceipt.confirmedAt`; leitura consistente em transação. | Preservar as bases diferentes; adicionar dimensões e trilha de movimentações. |
| `src/core/utils/admin-insights.ts` | Agregações, dias sem movimento, clientes por dias distintos, divisão histórica em centavos. | Centralizar fórmulas e não duplicá-las nos componentes. |
| `src/core/utils/report-period.ts` e `date-utils.ts` | Períodos e datas de negócio; partes da implementação usam deslocamento fixo de -03:00. | Revisar limites e centralizar calendário de negócio. |
| `src/infra/repositories/PrismaAppointmentReportRepository.ts` | Relatórios antigos coexistem com o novo; há nomenclatura `netRevenue` sem despesas e fallback de realizado como receita em método legado. | Mapear consumidores antes de migrar; impedir divergência sem afirmar que o painel novo usa esse fallback. |
| `src/core/usecases/GetFinanceDashboardUseCase.ts` | Outro caminho de relatório, com limites baseados no fuso do processo. | Unificar calendário e semântica com o painel atual. |
| `src/infra/repositories/PrismaPaymentReceiptRepository.ts` | Recebimento único por atendimento; estorno único por recibo; reconfirmação atualiza o mesmo recibo. | Projetar histórico imutável de movimentos, sem apagar o passado. |
| `prisma/schema.prisma` | Entidades atuais e valores históricos de preço/comissão. | Acrescentar dados necessários mediante migração preservadora. |

Já existem testes específicos de insights, filtros, comissões e calendário. Foram inspecionados exemplos de testes de insights e repositório, mas não executados nesta análise. Não houve auditoria do banco real nem validação visual da aplicação em execução.

### 2.1. O que já existe

- Atendimento com status, origem, serviço, barbeiro, cliente cadastrado ou contato da recepção.
- Preço e comissão registrados em centavos no agendamento.
- Comissão atual configurada por serviço; não por profissional individual.
- Recebimento confirmado por atendente ou administrador, forma de pagamento e data de confirmação.
- Registro de reversão de recebimento.
- Resumo que distingue produção, caixa e serviços do período sem recebimento confirmado.
- Rankings, recorrência por dias distintos e abertura de detalhes paginados.

### 2.2. Dados ainda ausentes ou insuficientes para o escopo ampliado

- Despesas, obrigações a pagar, categorias de custo e pagamentos de despesas.
- Registro de repasse das comissões e saldo devido a cada profissional.
- Livro de movimentos que preserve sucessivas confirmações, reversões e devoluções.
- Tarifas de pagamento, descontos, custo de material e regras de rateio.
- Histórico de jornada, férias, bloqueios e pausas para ocupação confiável.
- Início e fim reais dos serviços; hoje os horários de agenda não provam duração real.
- Identidade reconciliada entre contato e usuário cadastrado.
- Datas e motivos históricos de alterações de status, metas e orçamento.
- Plano de eventos de aquisição/conversão e atribuição documentado.

Não exibir indicadores dependentes desses dados como se já fossem medidos. Usar “Ainda não disponível” ou “Cadastro de despesas incompleto”, com ação para resolver.

## 3. Diagnóstico de prontidão da mensuração

Índice preliminar: **60/100 — Unreliable / insuficiente para decisões sobre todo o escopo ampliado**. É uma avaliação de prontidão por inspeção estática, não uma medição empírica da exatidão dos relatórios existentes nem certificação da produção.

| Critério | Nota / máximo | Justificativa |
|---|---:|---|
| Alinhamento com decisões | 23/25 | Perguntas de gestão claras; falta fechar políticas de custos e repasses. |
| Clareza do modelo de eventos | 8/20 | Estados de negócio existem, mas faltam eventos/históricos e plano unificado. |
| Exatidão e integridade | 11/20 | Centavos, snapshots e testes presentes; despesas ausentes e histórico de reversões limitado; produção não auditada. |
| Definição das conversões | 10/15 | Confirmação, conclusão e pagamento são distintos; jornada digital não está documentada. |
| Atribuição e contexto | 3/10 | Origem do agendamento existe; campanha, continuidade e identidade têm lacunas. |
| Governança e manutenção | 5/10 | Há documentação e testes, mas falta catálogo único de métricas e reconciliação operacional. |

Faixas da metodologia: 85–100 pronto; 70–84 utilizável com lacunas; 55–69 insuficiente; abaixo de 55 interromper otimizações e corrigir a base primeiro. Reavaliar após instrumentação e testes reais; não elevar a nota só porque novos gráficos foram desenhados.

Ordem de remediação: definir contratos financeiros e calendário; preservar históricos; reconciliar dados; instrumentar somente os eventos necessários; validar resumos contra detalhes; liberar novos indicadores conforme a disponibilidade das fontes.

## 4. Página inicial: comportamento e composição

### 4.1. Entrada padrão

- Sem parâmetros explícitos, abrir o mês calendário atual, do primeiro dia até o instante de referência, no fuso de negócio.
- Exibir nome do mês, datas efetivas, base temporal e horário da última apuração fornecido pelo servidor.
- Mostrar todos os profissionais e serviços, incluindo a atividade histórica dos inativos.
- Comparação padrão: mês anterior até o mesmo dia e horário, com regras da seção 7.
- Filtros de acesso direto por URL prevalecem sobre o padrão. Uma nova entrada limpa não deve restaurar silenciosamente um recorte antigo.
- Não mostrar apenas seletores esperando uma ação para carregar. Os indicadores e os gráficos devem carregar automaticamente.
- Na agenda mensal, dias futuros podem aparecer com reservas previstas; não misturar esses valores com produção ou caixa realizado.

### 4.2. Hierarquia sugerida

1. Cabeçalho compacto: “Visão geral”, mês atual e última apuração.
2. Barra principal: período, comparar com, profissionais e botão “Mais filtros”.
3. Indicadores principais: recebido, serviços realizados, despesas reconhecidas e resultado gerencial. Sem dados de despesas, substituir os dois últimos por comissão calculada e parte da barbearia, com identificação clara da limitação.
4. Evolução do mês: série principal e período comparado; alternar entre recebido, realizado, atendimentos e, quando disponível, despesas/resultado.
5. Resumo operacional compacto: atendimentos, clientes, pendências, faltas e ocupação disponível.
6. Desempenho dos profissionais e composição dos serviços.
7. Clientes e alertas que exigem ação.
8. Links para análises completas e exportação.

No desktop, o primeiro gráfico deve começar na área inicial ou logo após a primeira linha de indicadores em resolução de referência 1366×768. No celular de referência 390×844, priorizar contexto, indicadores e início do gráfico com rolagem curta, sem formulário administrativo acima deles. Validar por inspeção visual, não por comprimir textos até ficarem ilegíveis.

Não carregar todos os gráficos avançados na entrada. O painel é completo por oferecer aprofundamento, não por exibir todas as possibilidades simultaneamente.

### 4.3. Visões analíticas

Oferecer Resumo, Financeiro, Barbeiros, Serviços, Clientes e Operação como navegação analítica consistente. Podem ser subpáginas ou abas com URL própria, preservando o contrato dos filtros compatíveis. Configurações e gestão da equipe ficam fora dessas visões.

## 5. Dicionário financeiro obrigatório

Implementar estas definições antes de construir gráficos adicionais. Valores monetários são BRL e calculados em centavos; percentuais nunca substituem valores históricos já gravados.

| Métrica | Definição e base | Observações |
|---|---|---|
| Valor dos serviços realizados | Soma dos preços históricos dos atendimentos COMPLETED cuja data de serviço pertence ao período. | Atualmente a data é `startTime` agendada; informar isso até existir registro de execução confiável. |
| Recebimentos confirmados | Entradas efetivamente confirmadas no caixa no período de confirmação. | Não usar preço dos serviços como substituto quando o caixa for zero. |
| Serviços do período sem recebimento confirmado | Soma do valor em aberto dos concluídos do recorte de produção. | Métrica de coorte; não representa todo o saldo histórico em aberto. |
| Saldo total a receber na data de corte | Valores devidos por serviços até o corte menos liquidações e ajustes válidos até o corte. | Pode incluir serviços de outros meses; exige reconstrução histórica e política para devoluções. |
| Comissão calculada | Soma de `commissionCents` dos serviços elegíveis no recorte de produção. | Não significa recebida pela barbearia ou paga ao barbeiro. |
| Percentual efetivo de comissão | Comissão calculada ÷ valor dos serviços da mesma população × 100. | Média ponderada pelos valores; não média simples das taxas. |
| Parte da barbearia antes das despesas | Valor dos serviços − comissão calculada. | Não nomear como lucro líquido. |
| Despesas reconhecidas | Custos/despesas atribuídos à competência do período, excluindo itens já deduzidos separadamente. | A competência pode ser diferente da data de pagamento. |
| Despesas pagas | Saídas de caixa de despesas na data do pagamento. | Não confundir com despesas reconhecidas. |
| Resultado gerencial de competência | Receita de serviços líquida dos ajustes de competência − comissões reconhecidas − demais custos/despesas reconhecidos. | Mostrar cobertura dos dados; não apresentar como resultado completo se custos estiverem incompletos. |
| Margem gerencial | Resultado gerencial ÷ receita líquida de competência × 100. | Sem receita, mostrar não aplicável; resultado negativo continua visível. |
| Fluxo líquido de caixa | Entradas externas efetivas − devoluções em dinheiro − despesas pagas − repasses pagos, no período. | Aportes, retiradas e empréstimos ficam separados do resultado operacional. |
| Saldo de caixa | Saldo inicial + movimentos líquidos das contas selecionadas. | Sem saldo inicial reconciliado, mostrar movimento do período, não saldo disponível. |
| Ticket médio de serviço | Valor realizado ÷ atendimentos concluídos. | Um atendimento atual equivale a um serviço; não é ticket por visita. |
| Ticket por visita | Valor realizado ÷ visitas distintas. | Uma visita é cliente + dia local; pode reunir serviços no mesmo dia. |
| Taxa de recebimento da coorte | Valor liquidado, até o corte, dos serviços do recorte ÷ valor devido desses mesmos serviços. | Não dividir caixa do mês por serviços do mês: são populações diferentes. |

Custos de materiais, taxas, impostos, salários fixos e comissões devem ter classificação explícita para evitar dupla dedução. Repasse pago de uma comissão já reconhecida reduz caixa e a obrigação, mas não cria outra despesa de competência.

### 5.1. Exemplo obrigatório de reconciliação

Exemplo fictício: corte de R$ 30 realizado e concluído em 31/10, comissão histórica de 50%, com pagamento confirmado em 01/11.

- Outubro: produção de R$ 30, comissão calculada de R$ 15 e parte da barbearia de R$ 15; caixa desse atendimento igual a zero.
- Novembro: recebimento de R$ 30, sem recriar produção de outubro.
- Se a comissão for paga em novembro, registrar saída de R$ 15 e baixar o valor devido ao profissional, sem deduzir outra vez no resultado de outubro.
- Uma mudança posterior da taxa para 40% não altera esses R$ 15 já registrados.

### 5.2. Estorno operacional e devolução financeira

Uma reversão de registro incorreto não prova que houve saída de dinheiro. Distinguir:

1. Correção de registro: anula ou retifica um lançamento errado, com vínculo, motivo e autoria.
2. Devolução ao cliente: movimento real de saída, na data em que ocorreu, com vínculo ao recebimento original.
3. Reconhecimento/cancelamento do valor devido: ajuste da obrigação do cliente, que pode ou não acompanhar a devolução.

Propor livro de movimentos acrescentados, sem sobrescrever eventos anteriores. Um recebimento de outubro devolvido em novembro deve continuar explicável em outubro, com a saída em novembro. Permitir visões “movimentos do período” e “posição na data de corte”; alterações retroativas autorizadas precisam de trilha e indicação de reabertura do período.

O modelo atual de recibo único atualizado na reconfirmação não é suficiente para reconstruir todos esses cenários. Não converter automaticamente cada `PaymentReversal` legado em devolução real sem confirmação.

## 6. Filtros: contrato e experiência

### 6.1. Filtros disponíveis

| Grupo | Opções | Aplicação |
|---|---|---|
| Período | Hoje, ontem, semana atual, mês atual, mês anterior, ano atual, últimos 7/30/90 dias e intervalo personalizado. | Distinguir período calendário de janela móvel. |
| Comparação | Desativada; período anterior; mesmo período do ano anterior; intervalo personalizado. | Mostrar datas dos dois lados. |
| Base de análise | Serviços, movimentos de caixa ou posição na data de corte. | Cada métrica declara sua data; não trocar tudo silenciosamente. |
| Profissionais | Todos, seleção de vários, ativos/inativos. | Inativos continuam aparecendo em seu histórico. |
| Serviços | Um ou vários serviços e categoria, se cadastrada futuramente. | Filtrar por ID, não por nome. |
| Atendimento | Agendado, concluído, cancelado, falta. | Desabilitar combinações que descaracterizem uma métrica fixa; explicar o motivo. |
| Recebimento | Sem confirmação, confirmado, revertido e demais estados efetivamente suportados. | Não confundir status financeiro com status do atendimento. |
| Origem | ONLINE, WHATSAPP e WALK_IN. | Origem atual não indica se foi bot, campanha ou atendimento humano. |
| Pagamento | Dinheiro, Pix e cartão; ampliar somente se suportado. | Aplicável a registros financeiros, não a serviços sem pagamento. |
| Clientes | Cadastrados/contatos, novos/retornantes e cliente específico em detalhes. | Segmentação novo/retornante exige histórico anterior ao período. |
| Operação | Dia da semana, faixa de horário e disponibilidade. | Critério local e dimensão temporal compatível com a métrica. |
| Despesas | Categoria, fornecedor, conta, competência, vencimento e situação. | Depende do novo módulo financeiro. |

Dentro de uma dimensão, múltiplas opções usam OU. Entre dimensões, usar E. Exemplo: profissionais A OU B, E serviços Corte OU Barba, E origem WhatsApp.

### 6.2. Filtros não aplicáveis e custos compartilhados

- Nunca ignorar um filtro sem informar. Mostrar sua cobertura ou desabilitá-lo naquela visualização.
- Filtrar barbeiro e serviço deve atualizar numerador, denominador, comparativo e detalhes da análise de produção.
- Filtrar forma de pagamento restringe caixa; não altera a produção total como se serviços não pagos tivessem método conhecido.
- Despesa comum, como aluguel, não pertence automaticamente a um serviço ou profissional.
- Na visão por barbeiro/serviço, mostrar “contribuição antes dos custos compartilhados” ou usar rateio explícito, configurado, versionado e identificado como estimativa.
- Disponibilidade do profissional não diminui porque o filtro selecionou apenas barba. Ocupação de barba usa minutos de barba sobre a jornada disponível completa; a participação de barba nos minutos ocupados é outro indicador.
- Totais de clientes únicos não são necessariamente somáveis entre profissionais; o mesmo cliente pode aparecer em vários grupos.

### 6.3. Interação

- Barra principal sempre identificável; filtros avançados em painel lateral no desktop e folha/modal no celular.
- Seleção avançada com “Aplicar filtros”, “Cancelar” e “Limpar”. Mostrar contagem de filtros ativos e chips removíveis.
- Atalhos de período podem aplicar imediatamente; não disparar consultas a cada opção marcada em uma multisseleção ainda em edição.
- URL reproduz o recorte sem nome, telefone ou e-mail de clientes. Parâmetros são validados no servidor.
- Voltar/avançar do navegador restaura a análise. Ao retornar de um detalhe, preservar filtros e posição de rolagem.
- Exibir “Nenhum registro para estes filtros”; erro de consulta não pode aparecer como resultado zero.
- Não deixar comparativos, valores anteriores ou exportações de outro recorte visíveis como se fossem os filtros atuais.
- Ao atualizar o mesmo recorte, manter os dados visíveis identificados como em atualização. Na troca de recorte, usar placeholders ou identificar claramente dados anteriores até concluir.

## 7. Comparações temporais sem distorção

### 7.1. Modos obrigatórios

| Modo | Regra |
|---|---|
| Dia anterior | Hoje até o instante de referência versus ontem até o mesmo horário, por padrão. Oferecer dias completos identificados. |
| Mês anterior | Mês atual até o mesmo dia/horário do mês anterior. Limitar ao último dia válido quando não houver dia correspondente. |
| Ano anterior | Ano atual acumulado até a data/horário equivalente do ano anterior. |
| Períodos encerrados | Comparar intervalos completos, mostrando durações e dias úteis quando diferentes. |
| Janela móvel | N dias versus os N dias imediatamente anteriores, com limites sem sobreposição. |
| Personalizado | Dois intervalos explícitos; alertar se as durações forem diferentes, sem bloquear análises legítimas. |
| Mesmo dia da semana | Opção para operação, distinta de “dia anterior” ou “mesma data do ano passado”. |

Para 29/02, usar 28/02 no ano sem dia correspondente e informar o ajuste. Semana padrão: domingo a sábado, preservando a convenção atual, com rótulo explícito. Mudanças futuras dessa convenção devem ser globais, não isoladas por componente.

Os limites de consulta devem ser preferencialmente início inclusivo e próximo início exclusivo. Armazenar instantes em UTC e calcular calendário no fuso de negócio `America/Sao_Paulo`, sem depender do fuso do servidor. Revisar o deslocamento fixo atual antes de prometer suporte a históricos ou outras regiões.

### 7.2. Cálculos

- Variação absoluta: atual − referência.
- Variação percentual: (atual − referência) ÷ referência × 100, quando referência for positiva.
- Referência zero e atual positivo: “Sem base percentual”; mostrar aumento absoluto.
- Ambos zero: “Sem movimento”; pode mostrar diferença absoluta zero, sem inventar crescimento.
- Referência negativa em resultado/margem: priorizar diferença absoluta e explicar a mudança; não aplicar a fórmula comum de crescimento sem política própria.
- Taxas: comparar em pontos percentuais. De 10% para 15% = +5 p.p.; variação relativa, se oferecida, é outra informação.
- Comparar médias usando totais e denominadores de cada período, não média de percentuais diários.
- Mesmos filtros em ambos os períodos; mudanças de jornada, preços e composição dos serviços devem ser visíveis como contexto.
- Não classificar crescimento de despesas, cancelamentos e faltas como positivo só porque o número subiu.

Todos os cartões comparativos mostram valor atual, valor de referência, diferença e período comparado. Não apresentar apenas uma seta e um percentual sem base identificável.

## 8. Catálogo de gráficos e ações

Cada gráfico tem pergunta, fonte, métrica, filtros, denominador, regra de comparação e detalhamento. Gráficos sem decisão associada não são prioridade.

| Visão / gráfico | Pergunta e representação | Detalhamento ao selecionar |
|---|---|---|
| Evolução financeira | Linhas ou barras por hora/dia/semana/mês; atual e comparação com mesma escala/unidade. | Movimentos ou serviços do intervalo selecionado, segundo a série. |
| Produção versus recebimento | Duas séries claramente rotuladas, cada uma com sua data de origem. | Serviços ou pagamentos, sem restringir caixa pela data do serviço. |
| Formação do resultado | Cascata: serviços líquidos, comissões, custos diretos, despesas e resultado. | Lançamentos de cada parcela; só após fontes completas. |
| Entradas e saídas | Barras por data e saldo acumulado apenas com saldo inicial conhecido. | Extrato de movimentos com origem e vínculo. |
| Despesas por categoria | Barras horizontais e tabela, com valor e participação. | Despesas da categoria e situação. |
| Pagamentos por método | Barras de dinheiro, Pix e cartão. | Recebimentos e taxas registradas do método. |
| Pendências por idade | Faixas de dias desde vencimento; sem vencimento, nomear “dias desde o serviço”, não atraso. | Serviços/obrigações em cada faixa. |
| Orçado versus realizado | Barras de custo ou resultado, metas e desvios. | Rubricas e regras do orçamento do período. |
| Ranking de barbeiros | Volume, realizado, recebido, comissão e contribuição em barras/tabela. | Serviços do profissional e filtros já aplicados. |
| Barbeiro × serviço | Matriz/tabela ou barras agrupadas por profissional e serviço. | Combinação exata dos dois e do intervalo. |
| Produção por hora | Valor/contribuição por hora disponível ou hora ocupada, com denominador declarado. | Jornada e serviços que explicam o cálculo. |
| Evolução individual | Séries por profissional, com poucos selecionados e opção de tabela para muitos. | Histórico no ponto selecionado. |
| Mix de serviços | Volume, receita, contribuição e participação, em barras horizontais. | Atendimentos do serviço. |
| Clientes recorrentes | Ranking por visitas em dias distintos e distribuição de retorno. | Visitas, serviços e pagamentos do cliente autorizado. |
| Novos versus retornantes | Barras por período usando primeira visita histórica. | Clientes de cada grupo. |
| Retenção por coorte | Matriz de retorno por mês desde a primeira visita. | Coorte, janela, numerador e denominador. |
| Ocupação da agenda | Mapa de calor por dia da semana e hora. | Agenda do intervalo e capacidade considerada. |
| Cancelamentos e faltas | Contagem e taxa separadas por período, serviço, origem e profissional. | Registros e motivos, quando coletados. |
| Funil de agendamento | Início → seleção válida → confirmação; pagamento analisado como etapa posterior com janela própria. | Volume e perdas por etapa/canal, sem dados pessoais em ferramenta externa. |

Preferir duas ou três séries por gráfico na leitura inicial. Evitar gráfico 3D, excesso de roscas, eixos monetários/quantidade misturados sem clareza e comparação de períodos com escalas diferentes.

### 8.1. Performance dos barbeiros

Mostrar atendimentos concluídos; visitas/clientes distintos; realizado; recebido; comissão calculada; repasses pagos e saldo devido quando implementados; contribuição; ticket; participação da equipe; faltas; cancelamentos; minutos disponíveis e ocupados.

Permitir seleção simultânea de profissionais e serviços. Exemplo obrigatório: comparar A e B apenas em Corte e Barba, no mês atual e no mesmo mês do ano anterior.

Mostrar contribuição por hora ocupada e produtividade por hora disponível separadamente. Um profissional com menos dias trabalhados não pode ser apresentado como pior apenas pelo volume absoluto. Ranking descritivo não deve gerar julgamento automático nem uma pontuação opaca de “melhor funcionário”.

Serviço marcado concluído prova o status registrado, não pontualidade ou satisfação. Não inventar avaliações, qualidade técnica, tempo real ou atraso a partir de horários planejados.

### 8.2. Clientes e retenção

- Visita: mesmo identificador de cliente, em um dia local, com ao menos um serviço concluído.
- Recorrente no período: pelo menos duas visitas em dias diferentes dentro do recorte. Manter essa definição atual como indicador próprio.
- Retornante: primeira visita anterior ao início do recorte e pelo menos uma visita nele. É diferente de “recorrente no período”.
- Novo cliente atendido: primeira visita concluída no histórico acontece no período; não usar data de criação da conta como substituto.
- Intervalo médio de retorno: média entre visitas sucessivas na população/janela declarada; com uma visita, mostrar “Sem intervalo calculável”.
- Receita histórica observada do cliente: soma dentro da cobertura disponível; não nomear como LTV preditivo sem modelo e horizonte definidos.
- Retenção em 30 dias: clientes de uma coorte que retornam em até 30 dias ÷ clientes dessa coorte cuja janela de 30 dias já terminou. Coortes imaturas ficam identificadas e fora do denominador consolidado.
- Sem retorno há N dias: segmentação configurável baseada na última visita; não afirmar cancelamento definitivo do relacionamento.

Contatos e usuários não devem ser unidos automaticamente por nome ou telefone. Projetar identidade canônica e processo auditável de vinculação, com prevenção de mesclas incorretas. Até lá, informar a contagem de identidades separadas e sua limitação.

### 8.3. Operação e ocupação

- Minutos disponíveis: união de intervalos de jornada válidos, descontando pausas, bloqueios, férias e exceções.
- Minutos agendados: união de intervalos de reservas válidas, evitando dupla contagem de sobreposição.
- Ocupação prevista: minutos agendados ÷ minutos disponíveis.
- Ocupação concluída planejada: duração prevista dos concluídos ÷ minutos disponíveis; nomear como estimativa até registrar tempos reais.
- Para intervalos que atravessam a borda do período, recortar os minutos à interseção com o período e a jornada.
- Denominador zero: mostrar não aplicável e indicar agenda sem jornada configurada.
- Taxas de falta e cancelamento: usar agenda com data de serviço já transcorrida e status final conhecido; excluem reservas futuras. Denominador elegível = concluídos + faltas + cancelados, com explicação do critério.
- Mostrar separadamente quantidade de cancelamentos e horários efetivamente perdidos; uma vaga cancelada pode ter sido preenchida por outra pessoa.

## 9. Detalhamento interativo e calendário

Todo indicador clicável deve informar o que será aberto e possuir alternativa acessível em tabela/botão. Não depender apenas de clicar em uma barra estreita.

Ao selecionar uma série, profissional, serviço ou ponto:

1. Preservar os filtros globais compatíveis e acrescentar o filtro contextual.
2. Mostrar intervalo, base temporal, filtros e horário de apuração no cabeçalho do detalhe.
3. Apresentar total de registros e total monetário de todo o recorte, não apenas da página visível.
4. Oferecer paginação, ordenação estável e link para consulta completa.
5. Exibir vínculo ao atendimento e, no financeiro, ao movimento original e sua autoria.
6. Permitir abrir o calendário no mesmo dia/recorte suportado; o calendário deve informar filtros não suportados em vez de descartá-los silenciosamente.

Detalhes de resultado/contribuição precisam mostrar a composição. Abrir serviços com preço cheio sem subtotal de comissão e contribuição não explica sozinho o valor de um cartão de contribuição.

A soma dos itens deve reconciliar com o cartão/gráfico, considerando a mesma apuração. Se novos lançamentos ocorrerem depois, informar nova atualização e oferecer recarregamento; não prometer consistência entre requisições independentes sem mecanismo de versão/corte.

## 10. Novos registros necessários

Os nomes a seguir são conceituais, não esquemas de banco prontos.

| Registro | Dados mínimos | Cuidados |
|---|---|---|
| Despesa/obrigação | Categoria, descrição, valor, competência, vencimento, fornecedor opcional, situação, autoria. | Pagamento pode ser outro registro; não marcar quitada por ter vencido. |
| Pagamento de despesa | Obrigação, valor, data efetiva, conta/método, operador e vínculo de reversão. | Prever pagamentos parciais somente com regra implementada. |
| Movimento financeiro | Tipo, valor em centavos, ocorrência, registro, conta, origem, correlação, autor e estorno vinculado. | Acrescentar eventos, sem editar o passado destrutivamente; unicidade/idempotência. |
| Obrigação e repasse de comissão | Profissional, serviços elegíveis, valor, política, período, pagamento e ajustes. | Não contabilizar comissão duas vezes ao pagar. |
| Custo direto/tarifa | Serviço ou recebimento relacionado, valor histórico, competência e pagamento. | Não aplicar a tarifa atual retroativamente. |
| Jornada e exceções | Profissional, vigência, dias, intervalos, pausas, bloqueios. | Preservar histórico; alteração de jornada atual não recalcula capacidade antiga sem explicação. |
| Histórico de atendimento | Mudança de status, ocorrência, registro, ator, motivo e valores antes/depois quando aplicável. | Adicionar `completedAt` não recupera magicamente execução real do legado. |
| Identidade de cliente | Referências a usuário/contato, vínculo validado, autor e histórico de mescla/desmescla. | Não perder rastreabilidade dos atendimentos. |
| Meta/orçamento | Métrica, período, dimensão, valor, versão, autor. | Meta de percentual não deve ser somada entre meses; respeitar a unidade. |
| Origem/atribuição | Canal operacional, origem digital, campanha, identificação não pessoal da jornada. | Campo ausente é desconhecido; não presumir campanha ou bot. |

Regra inicial de comissão: sugerir 50% para novos cadastros, permitir configuração por serviço e preservar os valores capturados no agendamento. Alterar 50% para 40% vale para novos agendamentos; reservas já criadas e reagendamentos conservam a divisão original, conforme comportamento documentado atual. Exceção futura requer ajuste explícito e auditado, nunca recálculo silencioso.

Liberação do repasse: proposta padrão de elegibilidade somente após serviço concluído e pagamento confirmado. Manter visíveis comissão calculada, elegível para repasse, paga e pendente. A configuração de prazo de repasse não pode modificar retroativamente o valor histórico da comissão.

O schema atual contém exclusões em cascata que podem atingir o histórico. Revisar política de exclusão antes de ampliar o financeiro: preferir desativação de profissionais/serviços e retenção de referências históricas, sem remover registros financeiros por exclusão de cadastro.

## 11. Plano de eventos e rastreamento

### 11.1. Separação de fontes

- Banco transacional e movimentos auditáveis: fonte de valores financeiros e de atendimentos.
- Eventos internos: suporte a estados, reconciliação, funis e diagnóstico.
- Ferramentas externas de analytics: opcionais para navegação/conversão, nunca fonte de verdade do caixa.

Não é obrigatório adicionar GA4, GTM ou outra plataforma para construir este dashboard. Uma ferramenta externa pode perder eventos, depender de consentimento ou bloqueadores; esses fatores não podem alterar a receita calculada pelo sistema.

Usar nomes minúsculos em inglês com underscore, contexto em propriedades e versão do evento. Eventos de estado devem nascer no servidor após confirmação da transação; entrega repetida não pode duplicar a ocorrência econômica.

### 11.2. Eventos propostos

| Evento | Descrição | Propriedades mínimas | Disparo | Decisão apoiada |
|---|---|---|---|---|
| `booking_started` | Jornada de agendamento iniciada | journey_id, channel, schema_version | Primeiro passo real da jornada | Identificar início e abandono. |
| `booking_details_selected` | Escolha válida de serviço/profissional/data | journey_id, service_id, barber_id | Etapa validada, sem repetir a cada render | Identificar fricção antes da confirmação. |
| `appointment_created` | Reserva persistida | event_id, appointment_id, origin, actor_role | Após gravação confirmada | Medir conversão efetiva. |
| `appointment_completed` | Serviço passou a concluído | event_id, appointment_id, occurred_at | Transição de estado confirmada | Produção e auditoria. |
| `appointment_canceled` | Cancelamento registrado | event_id, appointment_id, reason_code | Transição confirmada | Motivos de perda de agenda. |
| `appointment_no_show_marked` | Falta registrada | event_id, appointment_id | Transição confirmada | Reduzir faltas. |
| `payment_confirmed` | Entrada registrada | event_id, movement_id, appointment_id, amount_cents, method | Commit do movimento | Reconciliação de recebimentos. |
| `payment_record_reversed` | Correção de registro | event_id, original_movement_id, reason_code | Commit da reversão | Qualidade e auditoria do caixa. |
| `payment_refunded` | Devolução efetiva | event_id, movement_id, original_movement_id, amount_cents | Commit da saída real | Caixa e devoluções. |
| `expense_recognized` | Despesa reconhecida | event_id, expense_id, category_id, amount_cents | Registro confirmado | Custos e resultado. |
| `expense_paid` | Pagamento de despesa | event_id, expense_id, movement_id | Commit da saída | Fluxo e contas a pagar. |
| `commission_paid` | Repasse realizado | event_id, payout_id, barber_id, amount_cents | Commit do repasse | Saldo devido aos profissionais. |
| `report_exported` | Exportação concluída | report_id, schema_version, filter_signature, format | Arquivo pronto para entrega | Uso e auditoria; não conversão comercial. |

IDs e valores detalhados desses eventos pertencem ao ambiente interno autorizado. Para ferramentas externas, enviar apenas propriedades estritamente necessárias e previamente aprovadas; não enviar nomes, telefones, e-mails, textos livres, tokens, senhas, URLs com dados pessoais ou detalhes financeiros individuais por padrão. IDs pseudonimizados também precisam de controle de acesso e retenção.

### 11.3. Conversões e contagem

| Conversão / marco | Evento | Contagem | Uso |
|---|---|---|---|
| Agendamento confirmado | `appointment_created` | Uma reserva por ID; requisições repetidas não geram nova conversão. | Conversão do agendamento. |
| Atendimento concluído | `appointment_completed` | Uma conclusão válida por atendimento na visão de estado; auditoria preserva reaberturas. | Produção e comparecimento. |
| Recebimento | `payment_confirmed` | Movimento econômico único; correções/devoluções em eventos próprios. | Financeiro. |

Taxa digital de confirmação: jornadas online válidas com reserva criada ÷ jornadas online iniciadas na mesma coorte, com janela proposta de 7 dias. Agendamentos manuais ficam em funil operacional separado; não dividir todas as reservas pelo número de visitantes online. Deduplicar retorno após login e preservar a atribuição conhecida. Não alegar rastreio entre dispositivos sem mecanismo validado.

A automação do WhatsApp é futura. Reservar extensão para conversa, link e reserva, mas não apresentar conversões do bot enquanto não existir integração e vínculo verificável. Login continua obrigatório para o cliente normal; apenas recepção autorizada cria reservas manuais de convidados.

### 11.4. Responsabilidade e validação

Responsável de negócio: administrador confirma significado das métricas. Responsável técnico: mantém contratos, eventos, testes e reconciliação. Toda alteração de definição recebe versão e registro de mudança; dashboards/exportações identificam a versão quando material.

Validar duplicatas, eventos fora de ordem, falhas de entrega, mobile/desktop, retorno do login, consentimento quando aplicável e ausência de dados pessoais nas cargas externas. Definir retenção e procedimentos de acesso/exclusão compatíveis com as obrigações do negócio, sem presumir uma política jurídica pronta.

## 12. Interface, acessibilidade e organização visual

O template Analytics Dashboard foi consultado como referência de organização: período selecionado, data de atualização, indicadores, metas, desvios e gráficos ligados às fontes. Seus dados sintéticos e métricas SaaS, como MRR ou trial-to-paid, não se aplicam automaticamente à barbearia. Não criar planilha nem importar valores fictícios para o produto.

- Reutilizar a identidade escura/dourada existente com cores funcionais consistentes; não criar uma paleta diferente em cada visão.
- Reservar dourado para destaque e ação, vermelho para risco e verde para situações favoráveis; não depender somente de cor.
- Usar uma família tipográfica, hierarquia clara, alinhamento dos números e espaçamento uniforme.
- Título de cartão diz o que foi medido; descrição informa população/data; ajuda explica fórmula e limitação.
- Base monetária e unidade sempre visíveis. Não arredondar todos os valores para “mil” sem acesso ao valor completo.
- Tooltips acessíveis por teclado/foco e toque; tabela alternativa para gráficos.
- Modal com título, foco controlado, fechamento por teclado e retorno ao elemento de origem; ações visíveis sem depender de hover.
- Mobile: indicadores em duas colunas quando legíveis, filtros em painel próprio, gráficos responsivos e tabelas com alternativa de leitura. Sem rolagem horizontal da página inteira.
- Estados distintos: carregando, atualizando, sem movimento, fonte ausente, erro, sem permissão e dados incompletos.
- Alertas indicam regra, evidência e ação: exemplo “3 atendimentos concluídos sem pagamento registrado”. Não gerar recomendações automáticas de preço/corte de equipe a partir de amostra pequena.

## 13. Arquitetura de consulta e desempenho

1. Definir um contrato de filtros e métricas compartilhado por resumo, gráficos, detalhes, comparações, calendário compatível e exportação.
2. Manter regras de negócio nos casos de uso/utilitários, consultas nos repositórios e apresentação nos componentes.
3. Usar agregações no banco; não enviar todos os atendimentos ao navegador para calcular indicadores.
4. Evitar multiplicação de valores em joins de serviços, pagamentos, despesas e repasses. Pré-agregar cada fato na granularidade correta antes de combinar.
5. Fornecer metadados da resposta: filtros efetivos, intervalos, fuso, base, versão da métrica, corte/apuração e avisos de cobertura.
6. Paginar detalhes e limitar quantidade de pontos/séries. Definir granularidade automática e permitir ajuste dentro de limites razoáveis.
7. Evitar N+1 por profissional ou gráfico; consultar agregados de maneira controlada e consistente.
8. Chaves de cache incluem usuário/escopo autorizado, filtros, base, comparação e versão. Invalidar ao mudar atendimento, pagamento, estorno, custo ou repasse relevante.
9. Evitar consultas grandes sem limites; exportações extensas podem exigir processamento assíncrono com autorização e expiração do arquivo.
10. Criar índices somente após analisar consultas e plano de execução; não indexar indiscriminadamente todas as combinações.

Alvos iniciais para validação, não promessas: resumo mensal em até 2 s e comparação anual em até 4 s de resposta do servidor no percentil 95, usando base de referência proposta com 100 mil atendimentos e 10 profissionais. Registrar ambiente e revisar o orçamento de desempenho com dados reais. Medir tempo de renderização no celular separadamente.

O projeto atual não possui entidade de empresa/unidade. Manter o escopo da instalação atual e não adicionar filtro de unidade fictício. Para SaaS multiempresa, primeiro implementar isolamento e autorização por empresa em todos os dados, consultas, caches e exportações.

## 14. Segurança e autorização

- Financeiro completo, relatórios gerais e configurações: ADMIN.
- Barbeiro: somente sua agenda e métricas autorizadas; jamais dados de outros profissionais por manipulação de parâmetros.
- Atendente: agenda e caixa conforme atribuições atuais; acesso ao caixa não concede automaticamente relatórios completos de custos, lucro ou permissões.
- Cliente: apenas seus dados e reservas; não acessa métricas internas.
- Validar autorização em cada operação de servidor, inclusive detalhes, exportações e links do calendário.
- Rotas HTTP devem distinguir não autenticado (401 quando aplicável) e sem permissão (403), sem localhost nem exposição de dados. Em Server Actions, preservar o contrato de erro estruturado e a semântica correspondente, sem presumir que um campo de erro altera por si o status HTTP do protocolo.
- Identificadores não provam autorização. Evitar revelar existência de registros privados em consultas indevidas.
- Auditar alterações de custos, recebimentos, estornos, comissões, repasses e permissões.

## 15. Metas, projeções e exportação

Metas são opcionais e cadastradas pelo administrador em página própria. Sem meta, ocultar comparação com meta ou mostrar “Não definida”; não preencher números inventados.

Metas propostas: receita recebida, produção, contribuição, ocupação, teto de despesas e faltas. Definir direção desejada e unidade. Metas de produção e caixa não são intercambiáveis.

Projeção de fim de mês, se implementada, deve ser identificada como estimativa, declarar método e quantidade de dias observados, separar reservas futuras de receita realizada e não ser exibida com histórico insuficiente. É uma etapa posterior ao núcleo confiável.

Exportação deve preservar filtros, período comparado, base, fuso, datas de apuração, definições e cobertura. CSV serve a dados tabulares; PDF a leitura; XLSX, se necessário, a análise. Não é necessário implementar todos na primeira etapa. Evitar injeção de fórmulas em arquivos tabulares e acesso público permanente a dados exportados.

## 16. Plano de implementação por fases

### P0 — Fundamentos e reorganização obrigatória

- Consolidar dicionário financeiro, datas e filtros; inventariar consumidores dos relatórios legados.
- Separar configurações de comissão, permissões e gestão da equipe do dashboard, preservando funcionalidades nas páginas novas.
- Manter entrada com mês atual, indicadores, evolução e ranking analítico.
- Confirmar reconciliação do painel atual, preço/comissão históricos e regras de autorização.
- Publicar matriz de disponibilidade: cada métrica existe, depende de novo dado ou está desabilitada.

Aceite: entrada não contém formulários administrativos; mês atual carrega automaticamente; histórico preservado; zero em caixa não vira produção; testes existentes pertinentes continuam passando na futura implementação.

### P1 — Filtros e comparações

- Datas personalizadas, modos de comparação, profissionais e serviços múltiplos, origem e método quando aplicáveis.
- Estado de filtros na URL; detalhes e calendário com contexto; tabela acessível.
- Gráficos de comparação e matriz profissional × serviço.

Aceite: mesmos filtros em atual/referência/detalhes; mês parcial não compara silenciosamente com mês inteiro; denominadores coerentes; nenhum retorno de resposta antiga substitui o recorte novo.

### P2 — Financeiro completo

- Despesas, obrigações e pagamentos; movimentos imutáveis; repasses; custos diretos/tarifas; saldos e reconciliação.
- Histórico de correções e devoluções com efeitos distintos.
- Cascata do resultado, caixa, despesas, pendências e orçamento.

Aceite: competência e caixa separados; comissão deduzida uma vez; relatório explica todos os lançamentos; fontes incompletas impedem rótulo de resultado completo.

### P3 — Clientes, capacidade e operação

- Identidade canônica com vinculação controlada, primeira visita histórica, coortes e retenção.
- Jornada com vigência/exceções; ocupação e produtividade com denominador confiável.
- Motivos de faltas/cancelamentos e alertas acionáveis.

Aceite: não unir homônimos; coortes maduras; jornada antiga preservada; métricas estimadas identificadas.

### P4 — Instrumentação e evolução

- Eventos internos mínimos, funil digital, atribuição e governança.
- Exportações avançadas, metas, análises salvas e projeções identificadas.
- Integração futura com WhatsApp quando existir e tiver escopo aprovado.

Aceite: deduplicação, privacidade e custo de coleta validados; fontes externas não substituem caixa; nova avaliação do índice de prontidão.

## 17. Cenários obrigatórios de validação futura

| Cenário | Resultado esperado |
|---|---|
| Serviço de R$ 30 concluído e não pago | Realizado 30; caixa 0; comissão 15 a 50%; parte da barbearia 15. |
| Serviço em outubro pago em novembro | Produção em outubro e caixa em novembro. |
| Nenhum pagamento, mas vários concluídos | Caixa permanece zero, inclusive em consumidores legados migrados. |
| Comissão de 50% alterada para 40% | Antigos mantêm snapshots; novos usam a nova regra. |
| Requisição de pagamento repetida | Uma ocorrência econômica; nenhum valor duplicado. |
| Correção e reconfirmação | Histórico anterior preservado e posição explicável. |
| Pagamento em outubro, devolução em novembro | Entrada e saída em suas datas; ajuste de receita conforme regra declarada. |
| Comissão reconhecida e depois paga | Resultado não sofre segunda dedução; caixa registra saída. |
| Duas visitas no mesmo dia com serviços diferentes | Dois atendimentos e uma visita. |
| Contato e usuário com mesmo nome | Permanecem distintos até vínculo validado. |
| Novo cadastro de cliente antigo | Não conta como primeira visita histórica. |
| Coorte de 30 dias ainda imatura | Não incluída indevidamente na retenção consolidada. |
| Profissional inativo com histórico | Aparece no recorte histórico pertinente. |
| Filtro de barba em dois profissionais | Todos os componentes relevantes usam o mesmo recorte. |
| Aluguel sem centro de custo | Não atribuído arbitrariamente a um barbeiro. |
| Receita anterior zero ou resultado anterior negativo | Sem divisão indevida ou percentual enganoso. |
| Fevereiro, ano bissexto e virada de ano | Datas válidas e agrupamentos sem colisão de anos. |
| Hoje em servidor UTC | Limites do negócio corretos; sem mudança de dia indevida. |
| Serviço atravessa limite do período | Minutos de ocupação recortados corretamente. |
| Lista com várias páginas | Total reconciliado com todas as páginas. |
| Filtros alterados rapidamente | Apenas resposta do recorte atual é apresentada como atual. |
| Erro, fonte ausente e movimento zero | Estados diferentes e compreensíveis. |
| Atualização concorrente entre gráfico e detalhe | Mesmo corte quando suportado ou aviso de nova apuração. |
| Cliente/barbeiro tenta relatório geral | Acesso bloqueado no servidor, inclusive exportação. |
| Navegação desktop/mobile e teclado | Filtros, gráficos e detalhes utilizáveis sem depender de hover. |
| Exportação e dashboard | Mesmos filtros, fórmulas, corte e totais. |

Testes de regras e consultas devem validar fórmulas e populações, não apenas repetir a implementação. Incluir integração com PostgreSQL para timezone, joins, transações e histórico; usar dados de teste isolados. Não executar migrações, estornos ou exclusões no banco de produção para validar cenários.

## 18. Instruções para a IA que implementar

1. Ler este documento, `AGENTS.md`, documentação local relevante de Next.js em `node_modules/next/dist/docs/` e os documentos existentes de caixa, comissões e calendário antes de escrever código.
2. Confirmar o estado real da branch, arquivos e banco de teste. Este inventário é uma fotografia de 18/10/2026 e pode estar desatualizado.
3. Entregar por fases; P0 e definições financeiras precedem novos indicadores dependentes de despesas e históricos.
4. Não reconstruir dados passados desconhecidos como fatos. Na migração, marcar origem, cobertura, data inicial confiável e limitações de cada valor legado.
5. Não recalcular snapshots de preço/comissão usando a configuração atual. Não somar dinheiro com ponto flutuante na lógica financeira.
6. Não tratar produção como recebimento, recebimento como lucro, comissão calculada como repasse pago ou reversão cadastral como devolução real.
7. Não unir clientes por nome, não inventar tempos reais e não medir ocupação sem jornada verificável.
8. Não expor gestão de equipe, permissões e comissões na página inicial. Mantê-las em páginas próprias acessíveis pela navegação.
9. Não contratar analytics externo nem habilitar integração de WhatsApp apenas por constarem no roadmap.
10. Registrar decisões pendentes antes da fase afetada, com padrão proposto e impacto; não interromper tarefas independentes que já tenham definição.
11. Validar autorização, filtros, totais, comparações, acessibilidade e desempenho. Documentar o que passou, não passou e não foi validado.
12. Atualizar documentação de métricas e migrações ao concluir cada fase; apresentar evidência de que os gráficos reconciliam com os registros.

## 19. Decisões a confirmar antes das fases dependentes

| Tema | Padrão proposto | Momento de confirmação |
|---|---|---|
| Repasse | Elegível após conclusão e recebimento; valor histórico preservado. | Antes de P2. |
| Despesas | Competência, vencimento e pagamento separados; sem rateio automático de custos comuns. | Antes de P2. |
| Descontos/parciais/devoluções | Não presumir suporte; modelar explicitamente antes de liberar. | Antes de P2. |
| Histórico financeiro | Não fabricar movimentos ausentes; migração identifica abertura e cobertura. | Antes de migrar dados. |
| Meta e orçamento | Opcionais e definidos pelo administrador; sem números sintéticos. | Antes de publicar comparativos com meta. |
| Nova permissão granular | Começar pelos papéis existentes; editor granular é escopo adicional. | Antes da página de permissões. |
| Tempo real de atendimento | Manter estimativa por agenda até haver registro confiável. | Antes de P3. |
| Janela de funil digital | Proposta de 7 dias e separação online/manual. | Antes de P4. |
| Multibarberias | Fora do escopo desta instalação; depende de isolamento estrutural. | Antes de vender acesso compartilhado entre empresas. |

O produto estará pronto para o escopo aqui descrito quando o administrador entrar e compreender o mês atual, conseguir comparar e aprofundar o recorte sem perder contexto, consultar custos/resultados com fontes completas e encontrar configurações apenas nas páginas destinadas à gestão.
