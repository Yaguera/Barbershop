# Redesign da página inicial do barbeiro

Data: 12/10/2026. Status: orientação para implementação futura. Nenhum código de interface foi alterado nesta entrega.

## 1. Objetivo e base da proposta

Transformar `/barber/dashboard` em uma página de trabalho: identificar o próximo atendimento, entender o dia e acessar a agenda. A identidade escura e dourada deve permanecer, com menos ornamentação e maior clareza.

Esta proposta usa a captura enviada, a leitura atual do código e os resumos dos vídeos fornecidos pelo usuário. Não pressupõe revisão integral das falas dos vídeos. A imagem mostra somente parte da página; avaliações e comportamentos de consulta abaixo citados foram identificados no código, não inferidos da captura.

Referências:

- [Três redesigns de UX/UI](https://www.youtube.com/watch?v=zr37ibqXl1U): transparência, relevância da informação, clareza das ações e apresentação contextual.
- [Auditoria visual de página de produto](https://www.youtube.com/watch?v=GGg61sdEjeI): alinhamento, contraste, tipografia, consistência e proximidade entre informação e ação.
- [Princípios comportamentais, conforme resumo fornecido](https://www.youtube.com/watch?v=2TlIg3VokY8): padrões inteligentes, progresso real e preservação de escolhas.

As recomendações são específicas para uma ferramenta operacional. Linha do tempo de assinatura, ancoragem comercial e técnicas de venda não devem ser transplantadas para a rotina do barbeiro sem uma necessidade real.

Documento relacionado: [Plano geral de refatoração](./refatoracao-frontend.md). Esta especificação detalha a página inicial e os elementos de navegação que afetam sua composição.

## 2. Diagnóstico da tela e do código

O bloco destacado em vermelho ocupa grande parte da área útil para apresentar o próprio usuário. Ele combina foto grande, borda dourada, brilho, selo profissional, estado “Ativo”, saudação em várias linhas, texto de boas-vindas e botão. A principal informação operacional — quem será atendido e quando — não aparece nesse espaço.

Isso cria competição entre elementos, pouca separação entre principal e secundário e um aspecto promocional. O problema não é a cor dourada ou a foto em si: é o peso que recebem em relação à tarefa diária.

| Evidência | Consequência | Orientação |
| --- | --- | --- |
| Foto no cabeçalho, no cartão e no centro da barra inferior | Identidade repetida ocupa espaço sem acrescentar contexto | Manter um avatar compacto no cabeçalho; retirar os outros dois desta composição |
| “Barbeiro Master”, “Barbeiro Profissional”, “painel executivo” | Vários títulos para o mesmo papel; linguagem pouco objetiva | Usar marca da barbearia e contexto “Área do barbeiro” uma vez |
| Nome longo no cartão | Saudação domina o bloco e quebra em várias linhas | Saudação curta, com primeiro nome derivado com cuidado ou sem nome; nome completo em Conta |
| Selo “Ativo” fixo no JSX | Pode sugerir disponibilidade ou expediente sem dado correspondente | Remover; só apresentar estado funcional quando sua origem e significado estiverem definidos |
| Resumo do mês antes da rotina diária | Exige rolagem para tarefas mais frequentes | Priorizar próximo atendimento e resumo de hoje; colocar mês abaixo |
| Botão com foto e destino Perfil, além de outro item Perfil | Duas entradas para a mesma página e destaque à tarefa secundária | Barra inferior com quatro destinos equivalentes |
| Cartões com brilhos, sombras profundas, caixa alta e ícones grandes | Valores disputam atenção com decoração | Superfícies simples, valores claros, rótulos legíveis e ícones discretos |
| Avaliações ilustrativas no código | Conteúdo demonstrativo ocupa área de trabalho | Retirar da página operacional de produção |

No código atual, as avaliações já são identificadas como demonstração. Não descrevê-las como avaliações reais nem como conteúdo sem identificação; ainda assim, não são necessárias à rotina desta página.

## 3. Estrutura proposta

### Celular, de cima para baixo

1. Cabeçalho compacto: logo/marca, contexto profissional, notificações e conta.
2. Título “Hoje”, data completa legível e saudação discreta opcional.
3. Próximo atendimento: horário, cliente, serviço, duração e ação “Ver agenda”.
4. Resumo de hoje: agendados e concluídos, com definição clara dos estados.
5. Lista curta dos próximos atendimentos do dia, quando houver mais de um, com “Ver agenda completa”.
6. Resumo do mês: atendimentos concluídos e comissão calculada, com “Ver análises”. Receita de serviços pode aparecer como dado secundário, claramente separado da comissão.
7. Navegação inferior: Início, Agenda, Análises e Conta.

Não é obrigatório colocar tudo na primeira dobra. O objetivo é mostrar a tarefa principal antes de grandes blocos de apresentação. A altura deve acompanhar conteúdo, zoom e tamanho do aparelho.

### Desktop

Usar o mesmo conteúdo e ordem de importância. Coluna principal com próximo atendimento e agenda do dia; coluna secundária com resumo diário/mensal. Evitar esticar o antigo cartão de apresentação por toda a largura. Limitar a largura de leitura e manter a navegação apropriada ao desktop, sem duplicar a barra móvel.

## 4. Substituir o cartão destacado

**Arquivo principal:** `src/app/barber/dashboard/page.tsx`, seção “Header de Perfil do Barbeiro”.

### Como executar

1. Retirar o cartão de perfil grande e sua foto de 80–96 px, o halo dourado e os dois selos.
2. Criar um cabeçalho de conteúdo simples, fora de cartão: “Hoje” e uma data como “Segunda-feira, 12 de outubro”. A data deve vir do fuso adotado pela operação, sem texto fixo.
3. Se mantiver saudação, usar “Olá, {nome de exibição}” como texto secundário. Não obrigar o nome completo a caber em uma linha nem substituí-lo por reticências no título principal. Definir fallback neutro durante carregamento.
4. Inserir abaixo um cartão funcional “Próximo atendimento”. Priorizar horário; depois nome do cliente e serviço. Mostrar duração calculada por início/fim válidos. Preço só entra se for útil à operação e não deve superar o horário em destaque.
5. Usar “Ver agenda” como ação principal nesta primeira entrega, apontando para a rota existente `/barber/agenda`. Não criar botão “Iniciar atendimento” se não existir estado e ação correspondente.
6. Se o próximo atendimento já estiver no horário ou houver pendência anterior, apresentar a situação real; não rotular automaticamente como em atendimento, concluído ou falta.

### Modelo de conteúdo, sem dados fictícios de produção

| Campo | Conteúdo esperado |
| --- | --- |
| Contexto | Hoje · data da operação |
| Rótulo do cartão | Próximo atendimento |
| Destaque | Hora de início |
| Identificação | Nome do cliente e serviço retornados pelo servidor |
| Complemento | Duração e estado do agendamento |
| Ação | Ver agenda |

**Aceite:** ao abrir a página, o barbeiro encontra o próximo compromisso antes do resumo mensal. Nome longo não desloca a ação para fora do cartão. Não há status de disponibilidade inferido da autenticação.

## 5. Definir corretamente o próximo atendimento e o resumo diário

O dashboard hoje busca a lista do dia, mas conserva somente sua quantidade. `src/infra/repositories/appointment-queries.ts` já retorna registros ordenados por início, com identificador, cliente, serviço, início, fim e estado. A nova composição pode aproveitar esses dados, respeitando o contrato e a autorização existentes.

### Como executar

1. Manter a lista retornada pela consulta para alimentar o cartão e o resumo, em vez de depender somente de `appointments.length`.
2. Separar os estados reais: `PENDING`, `COMPLETED`, `CANCELED` e `NO_SHOW`. A tradução de PENDING deve ser uniforme, por exemplo “Agendado”, conforme a regra aprovada do produto.
3. Definir próximo atendimento como o primeiro agendamento pendente cujo início ainda não passou. Tratar separadamente pendências com início passado: elas podem exigir registro do resultado, mas não comprovam atraso do cliente, falta ou conclusão.
4. Se houver pendência anterior, mostrar aviso neutro “Há atendimento com resultado pendente” com acesso à agenda. Não adicionar mutação direta nesta página antes de definir regras e testes.
5. Definir “Agendados hoje” como quantidade de registros do dia no estado PENDING e “Concluídos hoje” como quantidade no estado COMPLETED. Se o produto preferir um total de compromissos, chamá-lo explicitamente de total e explicar os estados incluídos.
6. Não chamar quantidade de registros de “clientes” quando a mesma pessoa puder ter mais de uma reserva no dia. Cancelamentos e faltas não devem aumentar o número anunciado como atendimento ainda agendado.
7. Para a lista curta, sugerir até três próximos registros válidos, sem repetir o atendimento em destaque. O acesso à agenda completa permanece disponível.
8. Quando não houver novos horários, distinguir “Nenhum atendimento agendado hoje”, “Todos os atendimentos de hoje foram concluídos” e “Sem próximos atendimentos hoje”. Usar somente a mensagem sustentada pelos dados; pendências anteriores impedem afirmar conclusão total.

### Correção necessária de data

O dashboard usa `new Date().toISOString().split('T')[0]`, que extrai a data UTC e pode consultar o dia seguinte durante a noite no Brasil. A agenda usa outro caminho de formatação. Centralizar a definição de dia no fuso da operação e alinhar consulta, título e indicadores. Conferir também os limites de início/fim do dia no servidor; trocar apenas a legenda não resolve a divergência.

**Aceite:** testar início e fim do dia no fuso da barbearia, lista vazia, todos concluídos, cancelados, faltas, pendências passadas e múltiplas reservas da mesma pessoa. Dashboard e agenda devem representar o mesmo dia e os mesmos estados.

## 6. Simplificar indicadores e resumo mensal

### Como executar

1. Separar “Hoje” de “Este mês”. O cartão diário atual está dentro de “Resumo do Mês Atual”, o que mistura dois intervalos.
2. Nomear o indicador mensal “Atendimentos concluídos”. O relatório detalhado já conta registros COMPLETED; evitar o rótulo amplo “Total de atendimentos” acompanhado de outra definição em texto pequeno.
3. Priorizar a comissão calculada do profissional se esse for o objetivo da área. `totalCommission` já existe no relatório, mas o dashboard atual conserva somente `totalAppointments` e `totalRevenue`. Validar contrato e disponibilidade antes de exibir; ausência de campo não deve virar zero silenciosamente.
4. Separar “Receita dos serviços” de “Comissão calculada”. Não chamar a comissão de saldo, pagamento recebido ou valor disponível sem registro financeiro correspondente.
5. Mostrar o intervalo do mês e link “Ver análises”. Não acrescentar filtro avançado à home; essa tarefa pertence à página de análises.
6. Remover grandes ícones decorativos, brilhos e hover que sugira ação em cartão não clicável. Usar um componente de indicador compartilhado com a área analítica.
7. No celular, dois indicadores compactos podem ficar lado a lado quando rótulos e valores couberem. Em larguras menores ou com zoom, empilhar sem reduzir fonte para forçar encaixe.

**Aceite:** os mesmos período e indicador têm o mesmo valor no início e nas análises. A tela não confunde receita gerada com remuneração recebida.

## 7. Especificação visual

| Elemento | Orientação inicial |
| --- | --- |
| Fundo | Manter `#0D0D0D` |
| Superfície de cartão | `#151515`; elevação discreta com `#1C1C1C` |
| Marca/ação principal | Dourado `#D4AF37`, sem halo permanente |
| Cor de estado | Verde para concluído/positivo; vermelho para erro; texto e ícone acompanham cor |
| Fonte | Família definida no tema, com pesos 400, 500, 600 e 700; conferir associação de `font-sans` |
| Título de página | Aproximadamente 24–28 px no celular, peso 600–700 |
| Horário/valor principal | Aproximadamente 28–32 px, conforme espaço |
| Texto de conteúdo | 16 px como ponto de partida |
| Texto auxiliar | 14 px como ponto de partida; evitar dados essenciais em 10–12 px |
| Margem móvel | Uma coluna de alinhamento com 16–24 px, conforme largura |
| Espaçamento | Escala de 4, 8, 12, 16, 24 e 32 px |
| Cartões | Padding inicial de 16–20 px e raio de 16 px |
| Controles | Raio inicial de 12 px; área de toque confortável de 44×44 px |
| Ícones | Conjunto já utilizado, normalmente 18–24 px, sem competir com números |

Os valores são proposta de partida, não medidas extraídas da moldura do telefone. Validar combinações de contraste, texto ampliado e conteúdo longo. Usar tokens compartilhados de `src/app/globals.css`, sem espalhar novas cores isoladas pela página.

**Regras de composição:** alinhar título, cartões e listas à mesma margem; limitar caixa alta a contextos curtos; usar separação por espaço e hierarquia antes de bordas adicionais; reservar dourado à marca, seleção e ação principal. Profissionalismo deve resultar da clareza e consistência, não de mais selos, sombras ou adjetivos.

## 8. Corrigir navegação e cabeçalho

**Arquivos:** `src/components/barber/BarberNavbar.tsx` e `src/components/barber/BarberBottomNavigation.tsx`.

1. Usar marca real da barbearia e “Área do barbeiro” como contexto, evitando um título de status como “Barbeiro Master” para todos.
2. Manter avatar pequeno no cabeçalho, com fallback para ausência e erro de imagem. Nome acessível do acionador: “Abrir opções da conta”, sem pressupor conta Google.
3. Retirar o avatar central elevado da barra inferior e distribuir quatro destinos com o mesmo peso: Início, Agenda, Análises, Conta. Não substituir por botão “+”, porque criar reserva não foi definido como tarefa principal desse perfil.
4. Usar ícone de usuário para Conta, em vez de calendário. Reutilizar nomes no menu e na barra; trocar expressões como “Painel Executivo” e “Minhas Métricas & Rendimento” por termos claros.
5. Implementar navegação com links, indicação acessível do destino atual e foco visível. Não depender somente da cor dourada.
6. Garantir reserva de espaço para barra fixa e área segura; `pb-safe` é referenciada, mas sua implementação não foi encontrada em `globals.css` na leitura atual. Validar a origem real da regra e definir o comportamento se ausente.
7. Conferir dropdowns em tela estreita: os painéis atuais usam larguras fixas de 288–320 px, que precisam respeitar o espaço disponível e as margens. Incluir Escape, foco apropriado, estado expandido e retorno ao acionador.

O botão circular preto próximo da barra na captura tem origem não confirmada. Identificar se é widget da página ou ferramenta do ambiente antes de propor remoção. As barras do Safari e a moldura do aparelho não fazem parte da interface a redesenhar.

**Aceite:** não há dois itens Perfil/Conta na mesma barra; navegação funciona por teclado; dropdown não sai da tela; último item do conteúdo não fica coberto.

## 9. Estados de consulta e confiança

O código inicializa métricas com zero e trata falhas principalmente no console. Respostas com `success: false` podem deixar os valores iniciais visíveis como se fossem resultados. Isso precisa ser corrigido junto da apresentação.

1. Separar autenticação carregando, carregamento inicial, sucesso, vazio e erro. Iniciar consultas quando a sessão autorizada estiver disponível; preservar validação no servidor.
2. Tratar falha retornada pela ação, além de exceções. Separar o resultado da agenda diária do resultado mensal: falha em um bloco não deve apagar o outro.
3. Mostrar placeholders com dimensões estáveis durante primeira consulta; não mostrar zero para consulta ainda não concluída.
4. Em falha, apresentar mensagem junto ao bloco e “Tentar novamente”. Se mantiver dados anteriores, identificá-los como última consulta e indicar atualização malsucedida.
5. Reutilizar a estratégia de proteção contra respostas antigas já presente em `src/app/barber/metricas/page.tsx`. Evitar que consultas anteriores substituam dados de nova sessão ou data.
6. Exibir atualização manual e horário da última consulta bem-sucedida, sem prometer dados em tempo real. Ao voltar da agenda após uma alteração, revalidar o resumo.
7. Recalcular o dia ao cruzar meia-noite ou retornar à aba, conforme a estratégia adotada. Evitar consultas duplicadas e atualizações que movam foco ou façam a página inteira piscar.
8. Retirar a seção `mockReviews` da home de produção. Avaliações reais, se implementadas futuramente, pertencem a uma área secundária com fonte, período e estados próprios.

**Aceite:** falha não aparece como zero; agenda pode continuar utilizável se métricas falharem; reentrada e virada do dia mostram contexto correto; nenhum dado de demonstração integra o painel operacional.

## 10. Aplicar os princípios dos vídeos nesta página

| Princípio | Aplicação adequada | Evitar |
| --- | --- | --- |
| Hierarquia e alinhamento | Próximo horário primeiro; margens comuns; dados agrupados por período | Foto e selo mais destacados que a tarefa |
| Transparência | Explicar origem de comissão, estado e atualização | “Ativo” fixo, falsa disponibilidade e valores sem definição |
| Padrões inteligentes | Abrir no dia da operação; oferecer acesso direto à agenda | Selecionar ou concluir atendimento automaticamente |
| Progresso real | Opcionalmente mostrar concluídos/compromissos elegíveis do dia, com denominador definido | Progresso inicial fictício, metas não configuradas ou elogios por resultados inexistentes |
| Informação próxima da ação | Horário, cliente e serviço junto de “Ver agenda” | Botão genérico separado do contexto |
| Preservação de trabalho | Manter data/contexto ao entrar e voltar da agenda quando suportado | Recomeçar navegação ou descartar edição sem aviso |
| Clareza de linguagem | Hoje, Agenda, Análises, Conta | Master, VIP e executivo como qualificadores automáticos |

Não incluir barra de progresso apenas para aplicar uma técnica. Ela só entra se ajudar a entender o expediente, com estados e total bem definidos; caso contrário, dois números claros são suficientes. Não usar percentuais do resumo dos vídeos como previsão de ganho para a plataforma.

## 11. Ordem de implementação futura

| Etapa | Trabalho | Arquivos principais | Critério de avanço |
| --- | --- | --- | --- |
| 1 | Definir dia, estados e indicadores; tratar erros | Dashboard, ações e consultas relacionadas | Contagens e mensagens representam dados reais |
| 2 | Substituir apresentação de perfil por rotina do dia | `src/app/barber/dashboard/page.tsx` | Próximo compromisso e ação aparecem antes do mês |
| 3 | Aplicar tokens e componentes compartilhados | Dashboard e `src/app/globals.css` | Hierarquia, margens e cartões consistentes com análises |
| 4 | Simplificar cabeçalho e barra inferior | `BarberNavbar.tsx`, `BarberBottomNavigation.tsx` | Quatro destinos sem duplicação; foco e área segura corretos |
| 5 | Validar fluxo e comparar telas | Dashboard, agenda, análises e conta | Estados, números, retorno e responsividade aprovados |

Antes de escrever código Next.js, consultar os guias locais de `node_modules/next/dist/docs/`, conforme `AGENTS.md`. Reutilizar a stack e as regras de autorização existentes; esta proposta não exige biblioteca visual nova nem migração de banco para ajustar layout.

Primeira entrega sugerida: leitura operacional com acesso à agenda existente. Concluir, cancelar ou registrar falta diretamente na home é uma evolução separada, que precisa reaproveitar regras, confirmação, concorrência e mensagens da agenda. Não criar funcionalidades sem contrato para preencher espaço visual.

## 12. Checklist de validação

- [ ] O bloco destacado foi substituído por contexto diário e informação operacional.
- [ ] Foto aparece apenas onde contribui para identificação; não há avatar central duplicado.
- [ ] Não há “Ativo”, VIP ou título profissional inventado como estado do sistema.
- [ ] Próximo atendimento e pendências são derivados dos estados reais, sem mudança automática.
- [ ] Cancelamentos e faltas não são anunciados como novos atendimentos agendados.
- [ ] Data do título e da consulta coincide com o fuso da operação, inclusive à noite.
- [ ] Resumo diário e mensal estão separados; comissão e receita não se confundem.
- [ ] Valores equivalentes coincidem com a página de análises.
- [ ] Carregamento, vazio, erro e atualização têm apresentações distintas.
- [ ] Conteúdo demonstrativo foi retirado da home de produção.
- [ ] Nomes longos, foto inválida, valores altos e listas extensas não quebram a composição.
- [ ] Validado em 320, 375, 390, 768 e 1440 px, com zoom e barras do navegador expandidas/recolhidas.
- [ ] Área segura, dropdowns, foco e navegação por teclado funcionam sem conteúdo encoberto.
- [ ] Rodada de usabilidade confirma que o barbeiro encontra próximo cliente, abre agenda e consulta o mês sem orientação.

Na implementação, executar verificações estáticas e testes existentes, acrescentando cenários de data/fuso, estados, falhas parciais e seleção do próximo atendimento. Comparar capturas antes/depois no mesmo viewport. Avaliar tempo de localização do próximo compromisso e sucesso das tarefas; não declarar melhoria de usabilidade somente porque a compilação passou.
