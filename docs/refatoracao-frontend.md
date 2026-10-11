# Plano de refatoração do frontend — Barbershop: princípios, telas e execução

Data: 11/10/2026. Revisão 2: incorpora os resumos fornecidos pelo usuário, cinco capturas de tela e nova conferência do código local. Status: especificação para implementação; nenhuma alteração de interface executada nesta entrega.

## 1. Objetivo e limites da análise

Criar uma experiência consistente para clientes, barbeiros e administradores, preservando as diferenças entre suas tarefas. A refatoração deve melhorar compreensão, controle, confiança e eficiência, além da aparência.

Esta especificação combina três evidências: o resumo dos vídeos fornecido pelo usuário, as cinco capturas anexadas e a leitura do código local. Os detalhes dos princípios abaixo vêm desse resumo; não foi possível obter as transcrições integrais na consulta anterior. Não se afirma uma revisão integral dos vídeos nem se tratam percentuais e efeitos citados no resumo como resultados comprovados para esta aplicação.

A numeração foi ajustada à mensagem mais recente: V1 é o vídeo de três redesigns; V2 é a auditoria da página de produto; V3 é o vídeo sobre princípios comportamentais, identificado no resumo pelo endereço `2TlIg3VokY8`. Este último substitui como referência principal o vídeo `U7jTCgIWS4w` da lista anterior. A recomendação de preservar informação útil continua válida como decisão de projeto.

O diagnóstico visual se limita às telas mostradas; o de comportamento vem do código. As imagens podem representar uma versão publicada anterior: quando houver divergência, ela está registrada. Não há captura da área do barbeiro neste conjunto; suas recomendações vêm do código e precisam de validação visual posterior. Contraste exato, interação, desempenho e facilidade de uso precisam ser conferidos na aplicação executando. Recursos novos que exigem backend estão identificados como dependências.

**Direção central:** manter a identidade escura e dourada, dar prioridade às tarefas e às informações para decidir, e aplicar a mesma linguagem visual em cliente, administração e barbeiro. Padronização significa compartilhar fundamentos e comportamentos; a área de gestão pode ser mais densa que a página inicial.

## 2. Referências e aplicação dos princípios

| Referência | Princípios do resumo fornecido | Aplicação proposta para a barbearia |
| --- | --- | --- |
| [V1 — Top 3 UX/UI Redesigns That Make You Design Like a Pro](https://www.youtube.com/watch?v=zr37ibqXl1U) | Transparência, preço claro, facilidade de comparação e conexão emocional | Mostrar preço e condições antes de confirmar; usar fotos relevantes; remover promessas sem suporte; descrever a ação real |
| [V2 — This UI/UX Redesign Will Teach You More Than 100 Tutorials Combined](https://www.youtube.com/watch?v=GGg61sdEjeI) | Contraste, imagens consistentes, alinhamento, hierarquia, relevância da informação e ação persistente | Refazer cartões de serviço, margens, fontes e controles; mostrar duração; manter resumo e ação acessíveis durante a reserva |
| [V3 — Princípios comportamentais, conforme resumo fornecido](https://www.youtube.com/watch?v=2TlIg3VokY8) | Padrões inteligentes, progresso, reciprocidade, personalização, aversão à perda e contraste | Pré-preencher escolhas reversíveis, representar progresso real, permitir explorar antes do cadastro e proteger rascunhos |

Os marcadores de V3 fornecidos pelo usuário são: padrões inteligentes 00:27, progresso 01:50, reciprocidade 03:54, personalização 05:40, aversão à perda 08:25 e contraste 09:41. Servem para localizar o material de referência, sem substituir uma transcrição ou comprovar efeito causal no Barbershop.

Regra de projeto: antes de retirar ou acrescentar um elemento, registrar qual decisão ele ajuda a tomar. Uma tela operacional pode precisar de mais dados visíveis que uma tela de apresentação.

### Aplicação responsável dos princípios

- Não adotar “Começar em 2 toques” enquanto o fluxo exigir mais etapas. Preferir “Escolher serviço” no início e “Confirmar agendamento” no final.
- Não mostrar progresso de 20% sem tarefa cumprida. Se o usuário já escolheu um serviço no catálogo, essa etapa pode aparecer concluída porque a escolha realmente existe.
- Não transformar preço variável em preço exato fictício. Exibir valor exato quando definido; caso contrário, explicar variação e determinar o total antes de confirmar.
- Não usar escassez, risco de perda, comparações de preço ou selos que não correspondam aos dados. Benefícios, lembretes, descontos e assinaturas precisam existir operacionalmente.
- Os números de adesão a defaults e a relação entre perda e ganho citados no resumo não são metas nem previsões desta plataforma. Tratar as melhorias como hipóteses a validar.

## 3. Diagnóstico das cinco telas e proposta de reorganização

As imagens são identificadas pela ordem de envio. As barras de endereço, controles do Safari e moldura do aparelho pertencem ao ambiente da captura e não são elementos a refatorar no produto. As dimensões propostas abaixo são pontos de partida para validar no viewport real, sem medir a moldura da imagem como se fosse a página.

### Imagem 1 — Início do cliente

**O que preservar:** identidade escura e dourada, foto contextual da barbearia, título curto e ação de agendar visível. A imagem emocional funciona na apresentação do ambiente; a orientação de fundo limpo do V2 se aplica especialmente ao catálogo, sem obrigar o hero a abandonar a atmosfera da barbearia.

**Problemas observados:** a área de apresentação ocupa boa parte da primeira tela, com grande trecho escuro antes do título. Abaixo, os atalhos ficam próximos da barra fixa. Há várias entradas para agendar, mas o botão central mostra apenas “+”. Logo, sino e perfil não seguem o mesmo cabeçalho exibido na gestão.

**Conferência no código:** `src/components/lux/HeroBanner.tsx` define altura mínima de 420 px no celular, várias camadas de escurecimento e texto auxiliar pequeno. `src/components/lux/BottomNavigation.tsx` tem botão central com nome acessível, mas sem rótulo visual. `src/components/lux/ClientLuxDashboard.tsx` coloca o hero antes de próximo agendamento e catálogo.

**Como alterar**

1. Criar duas composições: visitante/sem reserva com apresentação compacta; cliente com reserva com próximo horário em primeiro plano. Não esconder o catálogo em nenhum caso.
2. Testar hero inicial entre 280–340 px, ajustando ao texto e ao aparelho. Evitar altura rígida que corte conteúdo com zoom. Reduzir camadas de escurecimento até a foto transmitir o ambiente, mantendo contraste medido do texto.
3. Manter “Seu estilo, nosso cuidado” e complementar com informação verificável da unidade. Não acrescentar promessa de rapidez quantificada sem medir.
4. Nomear visualmente o botão central “Agendar”, preservando o acesso rápido durante a rolagem. A repetição do CTA no hero é aceitável como entrada contextual; não acrescentar outra barra de compra na mesma tela.
5. Reservar no conteúdo espaço igual à altura real da barra inferior e à área segura. Conferir a primeira e a última seção com as barras do Safari expandidas e recolhidas.
6. Reutilizar a mesma marca, tamanho de logo, tratamento de ícones e margens nas áreas de cliente e gestão; manter destinos adequados ao perfil.

**Composição esperada:** cabeçalho → apresentação compacta ou próxima reserva → serviços → informações da unidade/benefícios reais. Atalhos só entram quando reduzirem trabalho em relação à navegação principal.

**Validação:** em aparelho estreito, o usuário identifica como reservar, onde consultar sua reserva e como explorar serviços; nenhum controle fica encoberto. Comparar compreensão e tempo de tarefa com a versão atual, sem prometer ganho de conversão.

### Imagem 2 — Atalhos, serviços e Premium

**Problemas observados:** “Minha...” e “Indique e...” perdem significado por truncamento; o carrossel corta o nome de serviço; preços aparecem com “A partir de”; a duração não aparece; o banner “Benefícios exclusivos...” corta justamente a explicação da oferta. Margem dos cartões não parece seguir a mesma coluna do título; conferir no aparelho para distinguir overflow intencional de desalinhamento.

**Conferência no código:** `QuickAccess.tsx` usa quatro colunas e `line-clamp-1`. `ServiceCard.tsx` usa largura móvel de 144 px, `truncate`, textos de 10–12 px e “A partir de” incondicional; declara `duration`, mas não a usa na renderização. `ServicesCarousel.tsx` já recebe duração e preço, mas cria serviços de demonstração quando a lista está vazia. `PremiumBanner.tsx` trunca título e descrição. Em `ClientLuxDashboard.tsx`, “Serviços” e “Ver todos” abrem o agendamento, e Premium/indicação usam alertas com promessas fixas.

**Como alterar**

1. Fazer os atalhos caberem com texto completo: duas linhas por rótulo ou grade 2×2 no celular estreito. Usar “Conta” e “Indicação” se essas palavras comunicarem bem a função; manter explicação no destino.
2. Separar exploração de reserva: “Serviços”/“Ver todos” abre catálogo consultável; selecionar um serviço inicia o fluxo com essa escolha preenchida. Essa separação entrega valor antes do cadastro, conforme V3.
3. Adotar cartões com título de até duas linhas, preço exato do cadastro e duração visível. Exemplo de formato, sem valor comercial inventado: nome → “{duração} min” → “{preço cadastrado}” → ação de escolher.
4. Retirar “A partir de” dos serviços de preço fixo. Se houver variações, implementar a escolha da variação e apresentar o total antes da confirmação; não resolver somente com uma legenda.
5. Definir padrão fotográfico por categoria: recorte, proporção, iluminação e enquadramento comparáveis. Fotos de corte mostram o resultado; barba mostra o acabamento; procedimentos mostram o serviço correto. Repetir a mesma foto para serviços diferentes dificulta comparação.
6. Usar containers opacos ou de contraste suficiente em controles sobre fotos. O ícone circular atual está parcialmente fora de uma área com `overflow-hidden`; reposicioná-lo ou removê-lo se não acrescentar informação. Não confundir ícone decorativo com botão.
7. Manter o começo do carrossel alinhado ao título e demais seções; um próximo cartão parcialmente visível pode indicar continuidade, mas nome e preço do cartão atual devem estar completos. Oferecer alternativa ao gesto de arrastar e catálogo em grade.
8. Substituir catálogo vazio por estado real de vazio/erro. Remover os serviços fictícios usados como fallback.
9. Se existir clube, usar “Conhecer planos”, com benefício concreto que caiba sem reticências. Se não existir operação comercial, retirar a oferta da produção até sua definição. A assinatura não é requisito para reservar.

**Validação:** nome, preço e duração legíveis sem abrir cada serviço; catálogo acessível sem login; todos os itens com dados reais; controles funcionam com teclado; nenhum benefício prometido apenas por alerta.

### Imagem 3 — Análises administrativas

**Problemas observados na captura:** fundo azul, acentos verdes/ciano e outro estilo de cartões rompem com preto/dourado da área do cliente. “CRM Analítico & Gestão de Desempenho”, “alta densidade” e “DRILL-DOWN INTERATIVO” descrevem a implementação. Um grande cartão de apresentação do calendário ocupa o espaço em que os indicadores deveriam responder às perguntas de gestão.

**Diferença importante:** `src/components/admin/DashboardFilters.tsx` já apresenta “Análises da Barbearia”, fundo grafite, filtro de profissional, data do intervalo e atualização. `src/app/admin/dashboard/page.tsx` já usa dourado e “Visão Cronológica”. Portanto, não registrar o azul e o título antigo como comportamento confirmado da versão local. Verificar qual versão está publicada antes de contar essa correção como pendente.

**Como alterar**

1. Usar o cabeçalho compartilhado com título “Análises”, profissional/abrangência e intervalo concreto. Encurtar descrição para a finalidade: “Receita e atendimentos do período”.
2. Organizar filtros sem esmagar cinco opções em uma linha estreita. No celular, usar seletor de período com rótulo ou controles que quebrem linha; no desktop, manter opções segmentadas quando couberem.
3. Colocar receita e atendimentos logo após filtros, antes de qualquer convite a outra visualização. Manter todos os indicadores acessíveis; não esconder dados essenciais apenas para deixar a tela mais vazia.
4. Substituir o banner grande do calendário por alternância “Resumo / Calendário” ou link secundário “Ver calendário”. A opção deve mudar apresentação preservando profissional e período quando houver suporte de dados.
5. Remover promessas de “tempo real” se o comportamento for consulta/atualização manual. Mostrar “Atualizado às ...” e “Atualizar”, já existentes no código.
6. Aplicar os mesmos cartões, filtros e legendas às análises do barbeiro e à visão administrativa individual. O barbeiro vê seu escopo e comissão; o administrador recebe os filtros e permissões correspondentes.

**Composição esperada:** título → profissional e período → indicadores → evolução → distribuição de serviços → detalhe. Calendário é outra forma de explorar os dados, sem funcionar como publicidade interna.

**Validação:** o gestor encontra receita, volume e intervalo antes de rolar por apresentação de recurso; mudar o período não corta controles; mesmas definições produzem os mesmos valores nos perfis autorizados.

### Imagem 4 — Calendário e visão anual

**O que preservar:** período explícito, navegação anterior/próximo, quantidade e receita separadas. **Problemas observados:** cartões altos e ícones decorativos grandes consomem espaço; há repetição de ano no breadcrumb e no título; laranja, emojis e cantos diferem do restante; “Cancelados/Faltas” mistura motivos com implicações operacionais diferentes. “Hoje” não descreve com precisão o retorno quando a visão é anual.

**Conferência no código:** `src/components/admin/AdminCalendarView.tsx` mantém `rounded-3xl`, gradientes amber, emojis e soma cancelamentos com faltas em `totalCanceled`. Recebe os dois campos separadamente, portanto a separação visual não exige inventar dados. O componente inicia sempre em ano atual e não recebe filtro de barbeiro. Suas consultas não têm o controle de respostas antigas observado nas páginas de análises administrativa e profissional.

**Como alterar**

1. Reutilizar tokens e cartão de indicador da tela de análises. Reduzir ornamentação, sem diminuir o tamanho do valor ou dificultar leitura. Trocar emojis por ícones do conjunto já usado, se necessários.
2. Simplificar cabeçalho: “Calendário” → contexto “2026” → alternância “Ano / Mês / Dia”. Usar “Ano atual”, “Mês atual” ou “Hoje” de acordo com a visão.
3. Dar nomes acessíveis às setas de período. Deixar a data selecionada evidente e manter retorno claro para a visão anterior.
4. Mostrar quatro estados: agendados/pendentes, concluídos, cancelados e faltas, com definições iguais às análises. Não transformar esses marcadores em filtros clicáveis sem implementar a filtragem.
5. Substituir “Receita realizada” por “Receita de atendimentos concluídos” se não houver registro de recebimento. Atendimento concluído não comprova pagamento recebido.
6. Decidir o contrato de integração: atualmente o calendário é geral. Até implementar filtragem no servidor, identificá-lo como “Todos os profissionais” e informar a mudança de abrangência. Depois, propagar profissional/período via URL e consultas compatíveis.
7. Acrescentar proteção contra respostas fora de ordem ao trocar ano/mês/dia; seguir o comportamento já existente nas métricas. Não permitir que um resultado antigo apareça sob o título de um novo período.
8. Preservar altura estável no carregamento e distinguir falha de consulta de período sem atendimentos. Manter indicação de data atual sem usar somente cor.

**Validação:** navegar dezembro/janeiro, virada de ano e fim de mês; trocar rapidamente modos com rede lenta; separar contagens com amostra conhecida; voltar às análises preservando o contexto permitido. Não somar valores de ano/mês anteriores durante carregamento.

### Imagem 5 — Menu lateral e conta

**Problemas observados:** avatar mostra texto de imagem em vez de foto; “Menu VIP”, “Membro VIP” e “Novo Agendamento VIP” sugerem condição comercial sem explicação; resumo de perfil e descrições deixam o menu longo. Navegação repete destinos da barra inferior.

**Conferência no código:** `src/components/lux/SideDrawerMenu.tsx` escolhe imagem quando existe URL, mas não trata falha de carregamento. Qualquer usuário com papel CLIENT recebe “Membro VIP”; a marca verde no avatar é fixa, sem comprovar presença online. O menu é implementado com containers sobrepostos, sem comportamento completo de diálogo identificado no componente.

**Como alterar**

1. Usar título “Minha conta” ou “Menu”. Mostrar nome e avatar compacto; e-mail pode ficar na página de conta. Reservar status comercial para assinatura real verificada, sem deduzi-lo do papel de cliente.
2. Tratar URL inválida e erro de foto com iniciais ou ícone; não depender apenas de verificar se existe URL. Retirar indicador de online quando não houver estado de presença.
3. Padronizar “Agendar horário”, “Agenda”, “Histórico” e “Conta” entre menu e barra. Remover “VIP” dos nomes de tarefas comuns. Definir se o menu será o destino “Mais” ou se Conta será destino direto; não manter caminhos redundantes sem função.
4. Manter apenas opções secundárias no menu, como ajuda, contato, configurações e sair, além do acesso profissional autorizado. Descrições entram quando esclarecem uma opção ambígua, não automaticamente em todas.
5. Implementar semântica de diálogo quando modal, nome acessível do botão fechar, foco inicial, retenção/retorno do foco, Escape, bloqueio de rolagem do fundo e área segura. Menu longo deve rolar internamente, inclusive com zoom.
6. Centralizar a regra de indicação. Hoje um alerta promete R$ 20 e outro 20%; escolher a regra real, obter código individual quando existir backend e explicar elegibilidade/uso. Até lá, não divulgar código genérico como benefício operacional.

**Validação:** testar usuário visitante, cliente, barbeiro, administrador, nome longo, foto quebrada e conta sem foto; abrir/fechar por teclado; voltar ao acionador; garantir alcance de “Sair” em telas baixas e com zoom.

### Elemento flutuante presente nas capturas

Há um botão circular preto na lateral das cinco imagens. Sua origem e função não foram confirmadas no código consultado; não atribuí-lo automaticamente à aplicação. Identificar se vem de ferramenta externa, recurso do aparelho ou widget da página. Se pertencer ao produto, conferir nome acessível e posicionamento para que não cubra cartões ou controles. Não removê-lo apenas com base na captura.

## 4. Traduzir os princípios comportamentais em mudanças concretas

### 4.1 Padrões inteligentes: reduzir escolhas repetidas

**Onde:** `BookingFlow.tsx`, `src/store/booking-store.ts`, filtros das análises e futura ação “Agendar novamente”.

1. Ao vir de um cartão, preencher o serviço selecionado; ao repetir atendimento, sugerir serviço e profissional anteriores, se ainda ativos.
2. Mostrar claramente a sugestão e permitir alteração. Não selecionar horário definitivo silenciosamente nem enviar reserva por efeito de autenticação.
3. Sugerir primeira data com disponibilidade real; enquanto ela não for conhecida, mostrar consulta em andamento em vez de inventar vaga.
4. Nas análises, manter “Este mês” como ponto de partida e restaurar escolha explícita válida por URL. No barbeiro, aplicar sua identidade pelo servidor, sem seletor de outros profissionais.
5. Revalidar preço, duração, profissional e disponibilidade de qualquer rascunho. Não pré-marcar comunicações promocionais ou cobranças.

**Aceite:** sugestão editável, origem compreensível, ausência de confirmação automática e nenhum dado expirado aprovado silenciosamente.

### 4.2 Gradiente de meta: representar progresso verdadeiro

**Onde:** indicador de etapas de `BookingFlow.tsx`, atualmente composto por pontos/barras sem nomes.

1. Usar “Serviço / Profissional / Horário / Revisão”, destacando etapa atual e escolhas completas. No celular, “Etapa 2 de 4 — Profissional” pode acompanhar indicador compacto.
2. Ao selecionar um serviço no catálogo, iniciar na próxima etapa e registrar Serviço como concluído. Isso cria avanço real; não precisa começar arbitrariamente em 20%.
3. Permitir revisar etapas anteriores mantendo escolhas compatíveis. Alterar serviço deve invalidar horários incompatíveis, explicando a necessidade de nova escolha.
4. Login é uma interrupção para identificar o cliente, não a confirmação da reserva. Retomar a revisão e manter o botão final explícito.

**Aceite:** progresso corresponde aos dados válidos; voltar não perde tudo; 100% só significa fluxo concluído após sucesso do servidor, sem confundir revisão preenchida com reserva criada.

### 4.3 Reciprocidade: entregar utilidade antes de pedir cadastro

**Onde:** catálogo, `ClientLuxDashboard.tsx` e transição de autenticação em `BookingFlow.tsx`.

1. Deixar visitante consultar serviços, duração, preço, profissionais e disponibilidade pública permitida, sem expor agenda nominal de clientes.
2. Solicitar conta quando necessária à finalização, com explicação concreta: “Entre para confirmar e acompanhar seu agendamento”.
3. Preservar escolhas após autenticação e revalidar a vaga. Nunca prometer retenção de horário se não existir mecanismo de bloqueio temporário no servidor.

**Aceite:** visitante entende a oferta antes de fornecer dados; entrar não reinicia o fluxo nem cria reserva. Não requer oferecer desconto ou teste grátis sem suporte comercial.

### 4.4 Personalização e efeito de dotação: valorizar escolhas úteis

**Onde:** resumo do agendamento, rascunho e preferências reais da conta.

1. Atualizar um resumo visível à medida que serviço, profissional e horário são escolhidos, com links “Editar”.
2. Usar “Seu agendamento” para o rascunho, com estado “Ainda não confirmado”; após sucesso, mostrar comprovante real.
3. Manter rascunho durante login e navegação permitida; oferecer limpar/recomeçar. Definir expiração e evitar persistir observações pessoais desnecessárias.
4. Não criar etapas de personalização supérfluas somente para aumentar apego. Preferências extras só entram quando atendidas pela operação.

**Aceite:** usuário reconhece suas escolhas e consegue alterá-las sem refazer tudo; rascunho nunca parece uma vaga garantida.

### 4.5 Aversão à perda: proteger trabalho, sem pressionar

**Onde:** edição de perfil, saída de formulário e cancelamento de agendamento.

1. Alertar sobre alterações não salvas apenas se houver edição real; oferecer “Continuar editando” e “Descartar alterações”.
2. Ao cancelar, apresentar serviço/data/horário e a consequência real. Não afirmar perda de desconto ou multa sem regra operacional.
3. Recuperar rascunho quando possível. Em horário ocupado por outra reserva, explicar o ocorrido e oferecer alternativas, sem contagem regressiva fictícia.

**Aceite:** alertas preservam controle e informação; ausência de culpa, urgência artificial ou obstáculos desproporcionais para cancelar.

### 4.6 Contraste e ancoragem: facilitar comparação honesta

**Onde:** cartões de serviço, combos e eventual plano de assinatura.

1. Apresentar preço e duração próximos, permitindo comparar benefício e tempo, sem deixar o custo escondido em outra tela.
2. Comparar combo com serviços avulsos apenas se a composição for equivalente e os valores vierem do catálogo atual. “Economize ...” exige cálculo verificável; não inventar preço anterior.
3. Não usar “Mais barato” como selo fixo; se existir, deve comparar alternativas equivalentes disponíveis na mesma consulta. “Mais escolhido” exige dados e período definidos.
4. Antes de confirmar, mostrar total completo e todas as condições, inclusive taxas reais, se houver. Nas análises, contexto comparativo usa período anterior claramente definido.

**Aceite:** preço da revisão coincide com a regra do servidor; comparação não engana; não há diferença de custo revelada somente depois da ação final.

### 4.7 Transparência de assinatura e CTA persistente

**Assinatura, condicional:** o código atual apresenta um banner e alerta, não um ciclo completo de cobrança. Primeiro definir planos, cobrança, cancelamento, elegibilidade e backend. Se existir teste grátis real, mostrar linha do tempo com data de acesso, data do lembrete, início da cobrança e valor. Só prometer lembrete quando houver envio e monitoramento implementados. Separar consentimento da assinatura do agendamento comum. Sem teste, mostrar as condições reais, sem copiar uma linha do tempo fictícia.

**Ação persistente na reserva:** utilizar uma única barra inferior contextual com resumo de preço e botão adequado à etapa. Antes da revisão: “Continuar”; na revisão: “Confirmar agendamento · {total}”, desde que não corte a ação. Se o texto ficar longo, manter total em linha separada. No fluxo de reserva, substituir/ocultar a barra de navegação comum para evitar duas barras fixas concorrentes; preservar Voltar e saída acessível. Reservar espaço no conteúdo, respeitar área segura e teclado virtual. Durante envio, informar o estado e impedir repetição.

**Aceite:** total e ação acessíveis após rolar detalhes; nenhuma barra cobre erro ou campo; a ação diz exatamente o que acontecerá, sem sugerir pagamento online quando ele não existir.

## 5. Estado atual e prioridades

### Problemas ainda observados no código

- `BookingFlow` contém envio automático quando autenticação, serviço, profissional e horário estão preenchidos, independentemente do clique final.
- `AppointmentCard` conserva dados demonstrativos como fallback quando não encontra próximo agendamento.
- O histórico apresenta um agendamento pendente no passado como concluído.
- A seleção de datas do agendamento oferece somente sete dias; falha ao carregar disponibilidade e ausência de vagas não têm estados claramente distintos.
- Notas de profissionais, avaliações e benefícios contêm conteúdo fixo. A indicação promete R$ 20 em um ponto e 20% em outro.
- Login, cliente e gestão usam combinações distintas de cores, fontes, navegação e acabamento. Há nomes de classes antigos sem correspondência no tema atual.
- Perfil salva dados pessoais antes de tentar trocar a senha, podendo produzir sucesso parcial pouco claro.
- A navegação profissional aponta para uma página de configuração de horários não encontrada na estrutura atual.
- `ServiceCard` recebe duração, mas não a exibe; preço fixo é precedido de “A partir de”. O carrossel cria serviços fictícios quando a lista está vazia.
- O menu aplica “Membro VIP” a todo cliente, sem tratar erro de foto; a captura mostra avatar com falha aparente.
- O calendário conserva estilo próprio, junta cancelamentos/faltas e não recebe filtro de barbeiro nem proteção de resposta antiga como as análises.

### Melhorias já presentes que devem ser preservadas e testadas

A leitura atual encontrou comissão separada no relatório detalhado, ranking detalhado ordenado por receita, cores de serviço determinadas por função, tratamento de crescimento sem base anterior, agrupamento multianual e controle de respostas antigas nas páginas de análises administrativa e do barbeiro. O cabeçalho administrativo já usa grafite/dourado e linguagem mais simples que a Imagem 3. Não tratar essas observações anteriores como defeitos ainda confirmados em todas as telas. Conferir a apresentação, comparar com a versão publicada e reutilizar o que estiver correto; não presumir que a mesma proteção já existe no calendário.

| Prioridade | Objetivo | Entregas |
| --- | --- | --- |
| P0 | Evitar reservas involuntárias e informação falsa | Confirmação explícita, estados reais, remoção de fallbacks demonstrativos, tratamento de falhas |
| P1 | Dar consistência ao produto | Tema, componentes, navegação, autenticação, perfil e fluxo de reserva |
| P2 | Melhorar operação e leitura | Agenda profissional, gestão, análises e acessibilidade completa dos fluxos |
| P3 | Evoluir com evidência | Personalização, atalhos e experimentos, após medir a experiência básica |

## 6. Preparar a refatoração sem perder o que funciona

**Como executar**

1. Registrar capturas das páginas atuais em celular e desktop, com dados de teste e sem dados pessoais reais nos materiais compartilhados.
2. Inventariar cada rota, perfil autorizado, tarefa principal, ação principal e estados de carregamento, vazio e erro.
3. Registrar a linha de base dos fluxos: reservar, reagendar, cancelar, concluir atendimento, consultar análises e alterar perfil.
4. Produzir wireframes de baixa fidelidade para cada perfil e validar os caminhos antes do acabamento visual.
5. Criar o catálogo de componentes e aplicar uma mudança por fluxo completo. Evitar reconstruir toda a aplicação em uma única entrega.
6. Antes de implementar convenções do Next.js, consultar os guias locais de `node_modules/next/dist/docs/`, conforme `AGENTS.md`.

**Aceite:** todas as rotas possuem responsável funcional, tarefas e estados documentados; nenhuma funcionalidade existente desaparece sem decisão explícita. Não repetir a migração do banco já aplicada como parte desta refatoração visual.

## 7. Definir o sistema visual compartilhado

**Princípio:** hierarquia consistente torna ações e informação reconhecíveis entre telas — aplicação de V2.

**Como executar**

1. Consolidar nomes semânticos para fundo, superfície, superfície elevada, texto principal, secundário, borda, foco, marca e estados. Eliminar gradualmente classes antigas e cores isoladas.
2. Usar como ponto de partida o fundo `#0D0D0D`, superfícies `#151515` e `#1C1C1C` e dourado `#D4AF37` já presentes. Validar contraste por combinação antes de aprovar os tokens.
3. Reservar dourado para marca e ações principais. Verde indica resultado positivo, vermelho erro ou ação destrutiva. Pendente deve ter texto e ícone próprios, além da cor.
4. Confirmar a associação de Poppins ao tema e a `font-sans`. Usar os pesos existentes 400, 500, 600 e 700; evitar depender de pesos sintetizados sem decisão visual.
5. Adotar uma escala inicial de espaçamento de 4, 8, 12, 16, 24 e 32 px; cantos de 12 px para controles e 16 px para cartões como proposta de partida.
6. Usar corpo de 16 px, textos auxiliares normalmente de 14 px e títulos de página de 24–32 px. Ajustar após testar densidade; não reduzir dados essenciais para 10 px para fazê-los caber.
7. Limitar sombras e brilhos. Hover não deve fazer um cartão informativo parecer clicável quando não tem ação.
8. Definir conteúdo compacto para tabelas e agenda sem obrigar todas as telas a ter a mesma densidade.
9. Usar uma única coluna de alinhamento por composição. Começar com margem móvel de 16–24 px, padding de cartão de 16–20 px e distância entre seções de 24 px; escolher um valor por contexto e aplicá-lo a título, filtros, lista e conteúdo. Não mesclar margens e offsets sem motivo funcional.
10. Consolidar ícones do conjunto já utilizado, com tamanhos e traços comuns. Usar fundos para controles sobre fotos; ícones decorativos não precisam competir com valores. Evitar misturar emojis e ícones no mesmo tipo de indicador.
11. Padronizar seleção de filtros e botões de marca em dourado; verde permanece reservado a significados positivos, sem virar outra cor de marca na área administrativa. Estados neutros não precisam de brilho ou animação.

**Arquivos de entrada:** `src/app/globals.css`, `src/app/layout.tsx`, classes dos componentes existentes.

**Aceite:** uma página de referência demonstra botões, campos, cartões e estados; todas as áreas reutilizam os mesmos tokens. A uniformidade não depende de copiar longas sequências de classes.

## 8. Construir componentes de interface com contratos claros

**Como executar**

1. Planejar uma pasta compartilhada, por exemplo `src/components/ui`, com botão, campo, seletor, cartão, aviso, diálogo, estado vazio, esqueleto e marcador de estado.
2. Planejar componentes de composição para cabeçalho de página, filtros, cartão de indicador, gráfico e lista de agendamentos.
3. Para cada componente, especificar variantes, estados, acessibilidade e conteúdos longos. Um botão deve cobrir normal, foco, desabilitado e enviando.
4. Centralizar o vocabulário dos estados. `PENDING` pode ser apresentado como “Agendado” se essa for a regra aprovada; não inventar um estado de confirmação que não existe no negócio.
5. Separar componentes que mostram dados dos responsáveis por buscar e alterar dados. Remover valores demonstrativos dos componentes de produção.
6. Migrar primeiro um fluxo completo como referência; só depois substituir as cópias nas outras páginas.

**Aceite:** a mesma ação tem o mesmo aspecto e comportamento. Os componentes não assumem perfil, preço, data, avaliação ou disponibilidade sem receber dados válidos.

## 9. Reorganizar navegação e arquitetura de informação

**Princípio:** reduzir esforço sem esconder ferramentas necessárias; usar padrões previsíveis e entregar utilidade antes de pedir cadastro — aplicações de V2 e V3.

| Perfil | Navegação principal proposta | Informação mais importante |
| --- | --- | --- |
| Cliente | Início, Agenda, Histórico, Conta; ação “Agendar” | Próxima reserva e disponibilidade |
| Barbeiro | Hoje, Agenda, Análises, Conta | Próximo cliente e atendimentos do dia |
| Administrador | Visão geral, Agenda, Análises, Equipe, Serviços, Clientes | Situação da operação e tarefas de gestão |

**Como executar**

1. Criar uma estrutura de página por perfil usando elementos compartilhados e itens de navegação próprios.
2. No celular, oferecer até cinco destinos frequentes na barra inferior; no desktop, usar cabeçalho ou lateral compatível com a densidade da área.
3. Identificar o destino atual visualmente e com `aria-current`. Usar links para navegação.
4. Tornar “Agendar” uma ação com nome, além do ícone. Não duplicar cabeçalhos e barras no fluxo de reserva.
5. Ao abrir detalhes, preservar origem, data, página e filtros. Um link de retorno conhecido deve existir mesmo se o acesso foi por URL direta.
6. Mover gestão da equipe para uma área própria. Novas rotas como `/admin/equipe` são propostas e só devem entrar no menu quando estiverem implementadas.
7. Resolver o link profissional para `schedule/[id]`: implementar a página com regras de negócio definidas ou retirar o destino indisponível. Não redirecionar silenciosamente “Horários” para Perfil.

**Arquivos de entrada:** `AdminNavbar`, `BarberNavbar`, `BarberBottomNavigation`, `lux/BottomNavigation`, `lux/Header`, `lux/SideDrawerMenu` e páginas de detalhe.

**Aceite:** todas as opções chegam a destinos válidos; voltar preserva contexto; navegação por URL direta funciona; cada perfil identifica sua área sem perder a marca da barbearia.

## 10. Refazer a página inicial e a apresentação dos serviços

**Princípios:** hierarquia, confiança e informação útil para decidir — aplicações de V1, V2 e V3.

**Como executar**

1. Para cliente com reserva, colocar o próximo agendamento antes de conteúdo promocional. Para visitante ou cliente sem reserva, priorizar serviço e ação “Agendar horário”.
2. Exibir em cada serviço nome completo, preço, duração e descrição curta. Detalhes secundários podem ser expandidos.
3. Se preços variarem, mostrar a regra e o valor efetivo antes da confirmação. Não substituir preço definido por uma faixa vaga para parecer mais barato.
4. Usar imagens relacionadas ao serviço e fotos reais dos profissionais quando disponíveis; iniciais são um fallback mais honesto que uma foto genérica apresentada como pessoa real.
5. Disponibilizar catálogo consultável sem iniciar reserva. Busca e categorias entram quando o volume de serviços justificar.
6. Apresentar endereço, como chegar, funcionamento, contato e política de cancelamento em pontos previsíveis.
7. Retirar notas fixas, depoimentos fictícios e promessas de clube/indicação sem operação implementada. Para benefícios existentes, centralizar valor, elegibilidade e condições.
8. Remover a abertura temporizada com logo da navegação habitual; mostrar carregamento apenas quando houver trabalho real.

**Arquivos de entrada:** `ClientLuxDashboard`, `HeroBanner`, `ServicesCarousel`, `ServiceCard`, `QuickAccess`, `PremiumBanner`, `SplashScreen` e dashboard profissional.

**Aceite:** um visitante consegue descobrir serviço, preço e duração sem entrar na conta. Nenhuma informação de demonstração é confundida com dado real. “Serviços” e “Agendar” têm funções compreensíveis.

## 11. Refatorar o agendamento para garantir controle explícito

**Princípios:** ações claras, preço conhecido, contexto e confiança — aplicações de V1–V3.

**Fluxo proposto:** serviço → profissional → data e horário → revisão → confirmação explícita → comprovante. Login, quando necessário, interrompe e retoma a revisão, sem criar reserva automaticamente.

**Como executar**

1. Substituir o envio automático em efeito por uma ação exclusiva do botão final. Remover tentativas automáticas derivadas apenas de dados persistidos e autenticação.
2. Tratar o fluxo como estados explícitos, permitindo avançar somente com os dados exigidos. Voltar não deve enviar nem apagar tudo.
3. Manter resumo de serviço, preço, duração, profissional e data. Oferecer “Editar” em cada escolha relevante.
4. Validar o rascunho persistido: serviço ativo, profissional disponível, data futura e preço atualizado. Se expirou, informar e reabrir a etapa correta. Não restaurar intenção de envio.
5. Ampliar a seleção de datas com semanas seguintes ou calendário. Indicar mês e ano, folgas e dias lotados.
6. Selecionar a primeira data útil ou explicar por que hoje não permite reserva. “Qualquer profissional disponível” é uma evolução que depende de busca de disponibilidade compatível no backend.
7. Separar carregamento, falha de rede, dia sem expediente e dia sem vagas. Oferecer “Tentar novamente” e “Ver próxima data” conforme o caso.
8. Cancelar consultas HTTP antigas de horários ou ignorar respostas fora da seleção atual. Limpar o horário escolhido ao trocar a data ou profissional.
9. Na revisão, apresentar preço efetivo, política de cancelamento e botão “Confirmar agendamento”. Se não existe pagamento online, deixar claro o momento de pagamento conforme a regra real.
10. Bloquear cliques repetidos durante envio. Para proteção além do navegador, definir idempotência no servidor e retentativa segura, sem gerar duas reservas se a resposta se perder.
11. Em conflito, manter serviço e profissional, atualizar disponibilidade e pedir outro horário. Nunca mostrar sucesso antes da confirmação do servidor.
12. No comprovante, mostrar identificação da reserva e acesso à agenda; adicionar ao calendário é melhoria opcional. WhatsApp é compartilhamento iniciado pelo usuário e não condiciona a confirmação.

**Arquivos de entrada:** `BookingFlow`, `store/booking-store.ts`, ações de agendamento e rota de disponibilidade.

**Aceite:** escolher horário não cria reserva; login, reload e voltar não criam reserva; falha de rede não dispara repetição automática; conflito orienta recuperação; envio duplicado não produz duas reservas. Testar também dois clientes tentando o mesmo horário.

## 12. Padronizar agenda, detalhes e histórico do cliente

**Como executar**

1. Usar o mesmo cartão e vocabulário para serviço, profissional, preço histórico, data, hora e estado.
2. Renderizar os estados do backend. Um horário passado não significa atendimento concluído; não converter `PENDING` em `COMPLETED` na interface.
3. Em “Próximo horário”, tratar separadamente autenticação carregando, consulta carregando, reserva encontrada, nenhuma reserva e erro. Eliminar o fallback demonstrativo.
4. No detalhe, mostrar ações permitidas com suas condições. Se reagendamento não for permitido, explicar o motivo e oferecer contato quando apropriado.
5. Antes de cancelar, identificar exatamente qual reserva será afetada e explicar a consequência. Preservar o estado atual se a operação falhar.
6. No reagendamento, apresentar horário anterior e novo horário antes de salvar; depois atualizar agenda, cartão inicial e histórico relacionados.
7. Manter paginação com filtros e contexto. Página sem resultados não deve apresentar a mesma mensagem de alguém que nunca teve agendamentos.
8. Planejar filtros de histórico por estado e período, e “Agendar novamente” preenchendo serviço/profissional sem reutilizar data vencida.

**Arquivos de entrada:** `agenda/page.tsx`, `agenda/[id]/page.tsx`, `historico/page.tsx`, `AppointmentCard` e `Pagination`.

**Aceite:** estado exibido coincide com o banco; ausência de reserva nunca mostra exemplo; cancelar/reagendar reflete em todas as superfícies; erros não anunciam sucesso.

## 13. Refazer autenticação e perfil com feedback localizado

**Como executar**

1. Aplicar tema e componentes comuns ao login e cadastro, removendo classes antigas sem definição.
2. Associar rótulos a campos, configurar autocomplete e permitir colar credenciais. Acrescentar mostrar/ocultar senha com nome acessível.
3. Mostrar requisitos antes de enviar e erros junto aos campos; manter o que já foi preenchido quando possível.
4. Preservar o rascunho da reserva ao entrar/cadastrar. Validar destino de retorno também no cliente antes da navegação, mantendo a política de origem segura no servidor.
5. Recuperação de senha requer emissão e expiração de token, envio de e-mail e proteção contra abuso. Não apresentar um link sem fluxo implementado. Definir alternativa para conta Google conforme configuração real.
6. Separar dados pessoais, foto e senha em seções com ações independentes. Evitar que salvar dados seguido de falha na senha pareça falha de toda a atualização.
7. No upload, apresentar prévia, formatos e limite, indicar progresso e permitir remover foto. Ocultar entrada técnica de URL da experiência padrão.
8. Após trocar senha, explicar a necessidade de novo login conforme invalidação das sessões. Não anunciar uma continuidade de sessão que o servidor não garante.
9. Ao sair com alterações não salvas, oferecer uma confirmação contextual, sem bloquear navegação quando não há edição.

**Arquivos de entrada:** `auth/login`, `auth/register`, `profile/page.tsx` e ações correspondentes.

**Aceite:** erro de senha não deixa dúvida sobre dados pessoais já salvos; edição não se perde silenciosamente; reserva volta à revisão; recuperação de senha só aparece quando funcional.

## 14. Melhorar a área operacional dos barbeiros

**Como executar**

1. Na página Hoje, priorizar próximo atendimento e lista do dia. Reduzir espaço de apresentação pessoal e retirar avaliações demonstrativas.
2. Na agenda, usar data visível, atalhos Hoje/Anterior/Próximo e separação clara de próximos, concluídos, cancelados e faltas.
3. Mostrar nome do cliente, serviço, início, duração e estado antes de dados secundários. Dados pessoais adicionais devem ser acessíveis apenas quando necessários à tarefa e autorizados.
4. Dar às ações nomes exatos: “Concluir atendimento”, “Cancelar agendamento”. Manter ícone e texto, principalmente no celular.
5. Mostrar envio por atendimento, impedindo cliques repetidos no mesmo item. A lista inteira não precisa desaparecer para atualizar uma linha.
6. Confirmar ações destrutivas com identificação da reserva. Não oferecer reversões que a regra de estado proíbe.
7. Tratar atualização concorrente: se outro processo alterou o agendamento, informar e recarregar o item.

**Arquivos de entrada:** `barber/dashboard/page.tsx`, `barber/agenda/page.tsx` e componentes de navegação profissional.

**Aceite:** o barbeiro identifica próximo cliente sem procurar em gráficos; consegue concluir atendimento no celular; mensagens de falha ficam próximas do item; não consegue atuar em reserva alheia.

## 15. Reorganizar administração e padronizar análises

### Gestão

1. Separar Equipe, Serviços e Clientes das análises, com navegação persistente.
2. Em listas, oferecer pesquisa, filtro por estado e ordenação, preservando-os na URL quando apropriado.
3. Em volumes grandes, usar paginação e busca no servidor; não carregar todos os clientes para filtrar no navegador.
4. No desktop, avaliar tabelas para comparação; no celular, cartões com campos essenciais e detalhe expandido.
5. Padronizar criar/editar/desativar, exibindo campos inválidos e resultado de cada operação. Confirmar desativação explicando que histórico é preservado.
6. Só oferecer reativação quando houver ação e permissão implementadas.

### Análises compartilhadas

1. Aplicar a mesma sequência: título/contexto → filtros/intervalo → indicadores → evolução → serviços → detalhamento.
2. Reutilizar filtros, cartões e gráficos entre visão geral, barbeiro e visão administrativa individual. As métricas permitidas continuam diferentes por perfil.
3. Adotar períodos com nomes consistentes e exibir datas reais. Um período personalizado exige suporte validado nas consultas; não é só acrescentar dois campos.
4. Preservar filtros ao mudar para calendário ou detalhe; identificar o nome do profissional na visão individual.
5. Documentar cada indicador: fórmula, estados incluídos, intervalo, fuso e abrangência. Diferenciar receita gerada, comissão prevista e pagamento efetivamente realizado. Sem registro de pagamentos, não chamar comissão calculada de “recebida”.
6. Usar nomes como “Atendimentos concluídos” e “Ticket médio por atendimento”. Cancelamentos e faltas devem ter valores separados; percentuais precisam dizer qual é a base.
7. Conferir se o filtro de barbeiro se aplica a “Novos clientes”. Se for um dado global, identificá-lo; se for aquisição por profissional, definir primeira visita e vínculo.
8. Preservar as correções recentes de comissão, ranking por receita, crescimento sem base, cores e agrupamento por ano. Conferir se cobrem todas as visões, incluindo calendário e relatório individual.
9. Definir comparação anterior de forma explícita: calendário anterior ou intervalo equivalente decorrido. Mês parcial não deve sugerir comparação equivalente com mês completo sem explicação.
10. Exibir atualização em andamento, última atualização e nova tentativa. Não misturar dados do filtro antigo com o nome do filtro novo; respostas antigas não podem sobrescrever a seleção atual.
11. Padronizar receita em linha/área e quantidade em barras, ou permitir selecionar uma série. Evitar duas escalas sobrepostas como apresentação inicial.
12. Usar cores por identidade estável de serviço, com rótulos e tabela complementar. Preferir barras horizontais para muitos serviços. Incluir dias sem movimento e datas com ano quando necessário.

### Contrato visual e funcional por perfil

| Elemento | Administrador | Barbeiro | Regra comum |
| --- | --- | --- | --- |
| Cabeçalho | Análises da barbearia ou profissional selecionado | Minhas análises | Mesmo título, contexto, intervalo e posição de atualizar |
| Abrangência | Todos ou profissional autorizado | Próprio perfil, determinado no servidor | Nunca expor dado de outro profissional por mudança de URL |
| Período | Hoje, Esta semana, Este mês, Este ano, Geral | Mesmos nomes e períodos suportados | Seleção e intervalo legíveis no celular |
| Indicadores | Receita, atendimentos, ticket e estados conforme contrato | Receita de atendimentos, comissão calculada, atendimentos e ticket | Mesma unidade, fórmula e hierarquia para indicador equivalente |
| Gráficos | Evolução e serviços; comparações adicionais quando pertinentes | Evolução e serviços próprios | Mesmos eixos, legendas, cores estáveis e alternativa textual |
| Calendário | Geral hoje; escopo por profissional depende de ampliar contrato | Não há proposta de acesso ao calendário administrativo | Não reutilizar tela com permissões inadequadas para igualar aparência |
| Carregamento e erro | Consulta inicial, atualização, vazio e falha | Mesmos estados | Nunca mostrar zero como falha ou título novo com números antigos sem aviso |

**Mapa de implementação:** extrair a apresentação repetida de `src/components/admin/DashboardAnalytics.tsx`, `src/app/barber/metricas/page.tsx` e `src/app/admin/barbeiros/[id]/metricas/page.tsx` para componentes compartilhados. Manter adaptadores de dados separados por relatório/permissão. Reutilizar composição em `AdminCalendarView.tsx` sem misturar o estado do calendário com o dos filtros das análises. Uma aparência igual não exige unificar endpoints nem liberar os mesmos dados.

**Arquivos de entrada:** páginas `admin/*`, `barber/metricas`, `DashboardFilters`, `DashboardAnalytics`, `AdminCalendarView`, contratos e consultas de relatórios.

**Aceite:** mesmo profissional, período e indicador produzem o mesmo resultado nas visões autorizadas. Conferir com amostra conhecida de reservas concluídas, pendentes, canceladas e faltas. Índices e migração existentes não substituem essa validação funcional.

## 16. Padronizar acessibilidade, responsividade e mensagens

### Acessibilidade

Usar como referência [WCAG 2.2](https://www.w3.org/WAI/WCAG22/quickref/). Validar contraste de texto normal de pelo menos 4,5:1, texto grande de 3:1 e controles/informação visual relevante de 3:1, conforme os critérios aplicáveis. Como meta interna de conforto no celular, adotar áreas de toque de 44×44 px; não apresentar essa meta como o mínimo universal exigido pelo nível AA.

1. Garantir operação por teclado, foco visível, ordem lógica, rótulos e identificação de seleção sem depender somente da cor.
2. Aplicar o [padrão de diálogo modal do W3C](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/): foco inicial apropriado, contenção do foco, Escape e retorno ao acionador. Usar o padrão somente para interfaces realmente modais.
3. Anunciar atualizações relevantes com mensagens de estado; não anunciar a lista inteira a cada atualização periódica.
4. Fornecer alternativa textual aos gráficos, descrição adequada de imagens informativas e ocultação de ícones decorativos para leitores de tela.
5. Respeitar redução de movimento e eliminar animações contínuas sem propósito.

### Responsividade

1. Validar 320, 375, 768, 1024 e 1440 px, orientação horizontal, zoom e teclado virtual.
2. Garantir fluxo sem rolagem horizontal na página; tabelas que precisem de rolagem devem contê-la localmente.
3. Conferir áreas seguras do celular e espaçamento de barras fixas. A classe `pb-safe` precisa de implementação efetiva, não só do nome.
4. Não truncar preço, ação principal ou mensagem de erro. Nomes longos podem quebrar linha ou abrir detalhe acessível.
5. Permitir navegação de carrossel sem depender de arrastar.

### Mensagens e notificações

1. Usar linguagem direta: “Agendar horário”, “Salvar alterações”, “Não foi possível carregar. Tentar novamente”.
2. Retirar termos de implementação e promessas vagas como “alta densidade”, “agregações” ou atualização “em tempo real” sem comportamento correspondente.
3. Definir mensagens próprias para erro, vazio, primeira utilização, envio e atualização. Zero não representa falha de consulta.
4. Trocar alertas nativos por avisos e diálogos compartilhados. Não esconder erros essenciais apenas em notificações temporárias.
5. Em notificações, mostrar data quando não forem do dia, relacionar o aviso a um detalhe quando houver identificação disponível e recuperar o estado se marcar como lido falhar.

**Aceite:** os fluxos principais funcionam apenas com teclado; foco não fica coberto por barras; mensagens são compreensíveis fora de contexto; leitor de tela percebe confirmação e erro; nenhum botão visível é apenas decorativo.

## 17. Arquitetura, desempenho e dependências técnicas

Estas são diretrizes de implementação, não uma exigência de trocar a stack.

1. Manter Next.js, React, Tailwind, Prisma e ferramentas atuais enquanto atenderem às necessidades. Evitar adicionar bibliotecas só para padronizar aparência.
2. Concentrar dados e regras por funcionalidade: agendamento, agenda, perfil, gestão e análises. Componentes visuais não devem calcular regras de autorização ou estados de atendimento.
3. Preservar autenticação e autorização no servidor. Ocultar um botão no frontend não protege uma operação.
4. Separar estado transitório de interface, rascunho persistido e dados do servidor. Invalidar as consultas relacionadas após mutações.
5. Preferir dados iniciais no servidor quando adequado; evitar sequências de consultas que deixam a tela vazia. Usar estados de carregamento com dimensões estáveis.
6. Definir dimensões, recorte e tamanhos responsivos das imagens. Não carregar todas com prioridade; remover imagens decorativas grandes que atrasem a tarefa principal.
7. Carregar gráficos e ferramentas pesadas apenas nas áreas que os utilizam, mantendo informação textual utilizável durante o carregamento.
8. Medir carregamento e interação antes/depois sob as mesmas condições. Não afirmar ganho de desempenho a partir de estética ou de teste de compilação.

**Dependências que ultrapassam CSS e componentes:** idempotência de reserva, recuperação de senha, busca paginada, períodos personalizados, disponibilidade por qualquer profissional, configuração de horários, avaliações reais, benefícios e eventuais pagamentos. Cada uma precisa de contrato, validação, segurança e estados de erro antes de aparecer como funcionalidade pronta.

## 18. Sequência de entrega e critérios de liberação

| Etapa | Trabalho | Depende de | Critério para avançar |
| --- | --- | --- | --- |
| 1 | Inventário e correções P0 | Diagnóstico atual | Reservas só por confirmação; nenhum dado demonstrativo apresentado como real |
| 2 | Tokens, componentes e navegação | Inventário | Fluxo piloto consistente em celular e desktop |
| 3 | Início, catálogo e reserva | Etapas 1–2 | Caminho visitante → login → revisão → reserva testado |
| 4 | Agenda, histórico, perfil e autenticação | Componentes e estados comuns | Cancelar, reagendar e salvar com recuperação de falhas |
| 5 | Operação profissional e gestão | Navegação e componentes | Tarefas diárias completas sem destinos quebrados |
| 6 | Análises e calendário | Definições das métricas | Consistência de números, filtros e apresentação |
| 7 | Auditoria transversal e implantação gradual | Fluxos completos | Acessibilidade, responsividade, testes e monitoramento concluídos |

Não estimar prazo fechado antes de validar as dependências de backend e o volume de telas. Cada entrega deve poder ser revisada e revertida separadamente. Manter a implementação anterior disponível na revisão de versão, sem remover regras de negócio para simplificar a interface.

### Cenários de aceitação obrigatórios

| Cenário | Resultado esperado |
| --- | --- |
| Cliente escolhe um horário autenticado | Revisão aparece; nenhuma reserva antes do clique final |
| Visitante faz login com rascunho | Retorna à revisão e revalida disponibilidade |
| Rascunho antigo ou serviço desativado | Explicação e retorno à etapa apropriada |
| Duplo clique ou resposta de envio perdida | Sem duplicação; caminho de recuperação explícito |
| Dois clientes disputam horário | Um sucesso; outro recebe orientação para nova escolha |
| Cliente sem próximo atendimento | Estado vazio real, sem data/profissional de exemplo |
| Atendimento passado pendente | Não é apresentado como concluído por inferência |
| Falha de disponibilidade | Mensagem de falha e nova tentativa, sem afirmar falta de vagas |
| Troca rápida de data ou filtro | Só a seleção mais recente pode atualizar a apresentação |
| Cancelamento/reagendamento concluído | Agenda, detalhe e cartão inicial refletem a operação |
| Atualização parcial de perfil | Resultado de cada seção é claro e independente |
| Mesmo relatório em dois perfis autorizados | Mesma fórmula, intervalo e resultado |
| Acesso direto, voltar e recarregar | Contexto válido e navegação previsível |
| Teclado, leitor de tela, zoom e celular estreito | Tarefa completa sem controles inacessíveis ou conteúdo encoberto |
| Catálogo sem serviços ou com consulta falha | Vazio/erro real; nenhum serviço de demonstração selecionável |
| Nome longo de serviço e atalho em celular estreito | Rótulo compreensível, preço e duração sem corte |
| Imagem de perfil com URL inválida | Fallback de iniciais/ícone, sem texto de imagem quebrada |
| Cliente sem assinatura | Nenhum selo de membro pago inferido do papel CLIENT |
| Entrada na reserva pelo catálogo | Serviço escolhido conta como etapa concluída real |
| Barra contextual, teclado e área segura | Total e botão visíveis sem esconder campos, erros ou navegação |
| Calendário após filtro de profissional | Abrangência preservada quando implementada; mudança explícita enquanto geral |
| Troca rápida de ano/mês/dia com rede lenta | Última seleção vence; nenhum resultado antigo substitui a consulta atual |
| Contagens de cancelamento e falta | Valores separados e compatíveis com o relatório |
| Comparação de combo ou assinatura | Valores e condições verificáveis; sem economia, teste ou lembrete fictício |

Executar os scripts existentes de lint, typecheck, testes e build. Acrescentar testes de comportamento para reserva, estados, concorrência de consultas e navegação; não limitar a cobertura a snapshots de classes. Testes de integração devem continuar usando banco exclusivo, nunca dados reais.

### Validação com pessoas e medição

1. Fazer rodada formativa com representantes dos três perfis. Proposta inicial: cinco clientes e pelo menos dois profissionais/gestores, ajustando à disponibilidade; isso ajuda a encontrar dificuldades, mas não prova ganho estatístico.
2. Pedir tarefas sem explicar a interface: reservar, reagendar, achar próximo cliente, concluir atendimento e consultar receita de um período.
3. Medir conclusão sem ajuda, tempo, erros, retornos e dúvidas. Comparar com linha de base usando tarefas equivalentes.
4. Se instrumentar o funil, registrar eventos como início, etapa, revisão, tentativa, sucesso e conflito. Não enviar nomes, e-mails, telefones ou senhas nos eventos. Sucesso deve corresponder à reserva confirmada pelo servidor.
5. Fazer testes A/B apenas em hipóteses legítimas, como hierarquia do resumo ou texto da ação. Não experimentar envio sem consentimento nem manter defeitos como variante de controle. Definir métrica, amostra e duração antes de interpretar resultados.
6. Acompanhar também cancelamentos involuntários, reclamações e reservas duplicadas. Aumentar cliques não significa melhorar experiência.

### Evidências de revisão por entrega

Para tornar cada alteração verificável, anexar à revisão: captura anterior e posterior no mesmo viewport; rota e perfil; estados normal/vazio/erro/carregamento; cenário de aceitação executado; dependências ainda não liberadas. Para mudanças de hierarquia, registrar se preço, duração, próxima reserva ou indicador passaram a ser encontrados com menos esforço na rodada de usabilidade. Para defaults e progresso, registrar preservação e correção das escolhas, não apenas abandono do funil.

Os componentes nas imagens são exemplos de produção a corrigir; os valores de receita, preços, identidade pessoal e contagens das capturas não devem virar dados fixos de implementação ou massa pública de teste. O documento não precisa copiar e-mail ou nome pessoal mostrado nas imagens.

## 19. Decisões de produto a resolver durante o detalhamento

- Nome definitivo e informações reais da barbearia.
- Política de cancelamento/reagendamento e momento de pagamento.
- Prazo permitido para reservas e regra de escolha de qualquer profissional.
- Existência e condições de clube, indicação e avaliações verificadas.
- Diferença entre comissão calculada, devida e paga, conforme os dados disponíveis.
- Definição de novos clientes por profissional e comparação entre períodos.
- Fluxo de recuperação de acesso e configuração de horários.

Enquanto uma decisão estiver pendente, usar conteúdo neutro e funcionalidade efetivamente existente. Essas decisões não impedem corrigir P0 ou criar os componentes compartilhados.

## 20. Checklist de conclusão

- [ ] Reserva criada somente por confirmação explícita, com proteção contra duplicação.
- [ ] Estados e informações apresentados correspondem aos dados reais.
- [ ] Conteúdo promocional e prova social têm fonte e regras válidas.
- [ ] Tema, tipografia, componentes e mensagens são compartilhados.
- [ ] Navegação e retorno preservam contexto e só apontam para destinos existentes.
- [ ] Todos os fluxos possuem carregamento, vazio, erro, sucesso e recuperação.
- [ ] Filtros, calendário e indicadores têm definições consistentes.
- [ ] Formulários e diálogos são utilizáveis por teclado e leitor de tela.
- [ ] Layout validado no celular, desktop, zoom e teclado virtual.
- [ ] Testes funcionais, análise estática e build aprovados.
- [ ] Rodada de usabilidade realizada e problemas críticos corrigidos.
- [ ] Implantação e retorno de versão preparados, com monitoramento dos fluxos principais.
