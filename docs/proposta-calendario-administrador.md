# Proposta de reestruturação do calendário do administrador

Status: proposta; nenhuma alteração no calendário foi implementada nesta entrega.

## 1. Objetivo e diagnóstico do código atual

O calendário deve responder primeiro “como está a agenda deste dia?” e depois permitir explorar meses e anos. Hoje `src/components/admin/AdminCalendarView.tsx` inicia na visão anual, combina breadcrumb, seletor Anual/Mensal/Diário e controles de avanço e concentra resumo e navegação no mesmo bloco. Isso aumenta o esforço para chegar à operação diária. A proteção contra respostas fora de ordem já existe e deve ser preservada.

O código atual já utiliza majoritariamente grafite e dourado; não é necessário introduzir uma nova identidade. Em `src/app/admin/calendario/page.tsx`, revisar as classes `bg-preto-classico` e `text-off-white`, que não estão definidas no tema atual. Há inconsistência entre o vocabulário de receita dos relatórios e o significado de pagamento confirmado.

## 2. Estrutura proposta

1. Cabeçalho simples: “Agenda da barbearia”, data legível e total de agendamentos.
2. Barra única com Hoje, Anterior, Próximo e seleção de data. Os controles avançam um dia, mês ou ano conforme a visão ativa. Informar a finalidade nos rótulos acessíveis.
3. Alternância Dia / Mês / Ano. Abrir em Dia para operação; manter Mês e Ano para exploração. Semana é uma evolução opcional, que exige novo contrato de consulta.
4. Filtros identificados: profissional, situação do atendimento e pagamento. Exibir filtros ativos e ação “Limpar filtros”. Incluir inativos nas consultas históricas, identificando-os.
5. Resumo compacto: agendados, concluídos, cancelamentos e faltas. Indicadores financeiros devem indicar explicitamente sua base.
6. Área de agenda ou calendário, seguida pelos detalhes selecionados.

No desktop, a visão diária pode usar colunas por profissional e linhas de horário. No celular, preferir lista cronológica agrupada por profissional, com filtro de profissional, evitando uma grade que exija rolagem horizontal. Um horário vazio não deve parecer uma reserva existente.

## 3. Navegação e detalhamento

Na visão mensal, cada dia mostra número de agendamentos e um indicador discreto de ocupação. Destacar hoje com contorno e o dia selecionado com fundo; não depender somente da cor. Selecionar um dia abre sua agenda sem exigir alternar manualmente a visão. Na visão anual, selecionar um mês abre a visão mensal.

Persistir visão, data e filtros na URL. Voltar no navegador deve recuperar a seleção. Ao fechar um atendimento, preservar posição de rolagem, dia e filtros. Não reabrir sempre no mês atual.

No detalhe, apresentar cliente/contato, serviço, profissional, horário de início e fim, origem da reserva e estados separados: atendimento e pagamento. Uma reserva concluída pode continuar sem pagamento confirmado. Não transformar conclusão em recebimento automaticamente.

## 4. Hierarquia visual e princípios dos vídeos

- Reduzir escolhas simultâneas: a visão diária inicia no dia atual e mantém as demais opções em um controle compacto.
- Transparência: informar exatamente o período e a base de cada valor, sem misturar caixa e produção.
- Relevância: colocar data, disponibilidade e profissional antes de descrições longas.
- Consistência: mesmos raios, margens, tipografia, bordas e estados do painel analítico. Usar dourado para seleção e ação; estados devem ter texto e ícone.
- Alvos confortáveis: controles de pelo menos 44 px, foco visível, navegação por teclado e contraste legível.
- Informação progressiva: resumo visível; detalhes ao selecionar um dia ou atendimento.

Não usar progresso artificial, urgência fictícia ou mensagens de aversão à perda para navegar pela agenda.

## 5. Contratos e regras de dados

Ampliar `getAdminCalendarMetricsAction` e seu caso de uso para aceitar filtros validados de profissional, situação e pagamento. A consulta diária precisa retornar pagamento confirmado separadamente do status do atendimento. Compartilhar as definições e unidades monetárias com os relatórios, evitando uma terceira fórmula financeira.

Definir dois contextos: agenda usa a data do atendimento; caixa usa a data da confirmação do recebimento. Não mostrar o caixa de hoje como se fosse apenas o valor dos atendimentos de hoje. Recebimentos revertidos devem ser excluídos da visão de recebimentos atualmente confirmados. Um histórico contábil completo de estornos/reconfirmações demanda evolução própria do modelo de pagamentos.

Preservar a autorização ADMIN no servidor, fuso America/Sao_Paulo, histórico de profissionais inativos, proteção contra respostas atrasadas e estados independentes de carregamento, erro e ausência de reservas. Renderizar “Não foi possível carregar” em falhas, nunca uma agenda vazia que pareça real.

## 6. Ordem de implementação futura

1. Validar os filtros e a definição das métricas com agenda e caixa.
2. Ajustar o contrato de consulta e testes de autorização, datas e pagamento.
3. Reorganizar cabeçalho e controles, preservando as três visões existentes.
4. Implementar a lista diária móvel e a navegação mês → dia.
5. Sincronizar URL e restauração de contexto.
6. Avaliar a grade diária desktop e, posteriormente, a visão semanal.

## 7. Critérios de aceite

- Em até duas ações, abrir a agenda de qualquer dia do mês visível.
- Em 360 px, não cortar controles nem exigir rolagem horizontal da página.
- Voltar no navegador recupera data, visão e filtros.
- Atendimentos concluídos sem pagamento aparecem claramente identificados.
- Um pagamento recebido hoje por serviço de ontem respeita o contexto selecionado.
- Datas de virada de mês/ano e horários próximos à meia-noite usam Brasília.
- Navegação por teclado, foco após fechar detalhes e leitores de tela permanecem utilizáveis.
- Trocas rápidas de período não exibem dados de uma consulta anterior como atuais.
