# Reestruturação das demais páginas da área do barbeiro

Data: 12/10/2026. Escopo: orientações para implementação futura; nenhuma alteração de código nesta entrega.

## 1. Objetivo e referências

Estender o padrão profissional da página inicial a Agenda, Análises, Conta e elementos compartilhados. O objetivo é permitir que o barbeiro trabalhe com clareza, reconheça os mesmos controles em todas as telas e tenha confiança no resultado das ações.

Esta especificação complementa [Redesign do início](./redesign-inicio-barbeiro.md) e [Plano geral do frontend](./refatoracao-frontend.md). Usa o código local consultado em 12/10/2026 e os resumos dos vídeos fornecidos pelo usuário. Não há novas capturas das páginas internas; problemas de interação e composição são identificados pelo código e precisam de validação visual na aplicação executando.

Os princípios utilizados são: hierarquia, alinhamento, contraste, informação relevante próxima da ação, linguagem transparente, padrões inteligentes reversíveis e preservação do trabalho. Não há previsão de aumento de conversão baseada nos percentuais dos vídeos.

### Inventário confirmado

| Área | Rota/arquivo | Objetivo principal |
| --- | --- | --- |
| Início | `/barber/dashboard` | Entender o dia e localizar próximo compromisso |
| Agenda | `/barber/agenda` | Consultar e registrar resultado dos atendimentos |
| Análises | `/barber/metricas` | Entender desempenho e comissão do próprio profissional |
| Conta | `/profile`, compartilhada entre perfis | Editar identidade, contato, foto e segurança |
| Navegação e notificações | `src/components/barber/BarberNavbar.tsx` | Circular entre tarefas e consultar avisos |
| Navegação móvel | `src/components/barber/BarberBottomNavigation.tsx` | Acesso persistente aos quatro destinos |

Não foram encontradas outras páginas em `src/app/barber`. Configuração de expediente, bloqueios, férias, recebimentos e detalhes próprios do atendimento são possibilidades futuras, não telas existentes a redesenhar. Não incluir destinos novos no menu antes de implementá-los.

### Melhorias já presentes

O início agora usa lista de atendimentos, comissão mensal, utilitário de data e proteção de respostas antigas. A barra móvel já apresenta Início, Agenda, Análises e Conta, sem o avatar central elevado. Análises já possui filtro de período, data do intervalo, atualização manual, erro com nova tentativa e proteção contra respostas antigas.

Preservar essas melhorias e verificar sua integração. O documento anterior sobre o início registra o diagnóstico da versão consultada naquele momento; itens já implementados não devem ser executados novamente como se continuassem ausentes.

## 2. Contrato visual de todas as páginas

| Elemento | Padrão proposto |
| --- | --- |
| Identidade | Fundo `#0D0D0D`, cartões `#151515`, elevação discreta `#1C1C1C`, dourado `#D4AF37` |
| Marca e estados | Dourado para marca/seleção/ação principal; cores de estado acompanhadas de texto/ícone |
| Fonte | Família compartilhada do tema, pesos 400/500/600/700; evitar caixa alta em frases e peso máximo em todo título |
| Cabeçalho de conteúdo | Título curto de 24–28 px no celular e contexto útil abaixo; sem etiqueta promocional acima de cada título |
| Texto | Corpo próximo de 16 px e auxiliar de 14 px como ponto de partida; não usar 10 px para encaixar informação essencial |
| Alinhamento | Uma margem de 16–24 px por composição, aplicada ao título, filtros, cartões e listas |
| Espaçamento | Escala de 4, 8, 12, 16, 24 e 32 px |
| Cartões e campos | Raio inicial de 16 px em cartões, 12 px em controles; padding de 16–20 px |
| Ações | Botão principal preenchido; secundário discreto; destrutivo com significado explícito |
| Ícones | Conjunto existente, normalmente 18–24 px; decoração subordinada à informação |
| Navegação | Início, Agenda, Análises e Conta, com nomes idênticos no desktop, menu e celular |

Os valores são diretrizes iniciais, ajustáveis após validar conteúdo e acessibilidade. Usar tokens de `src/app/globals.css` e componentes comuns, sem copiar novas sequências de cores por página. Conferir contraste real, foco visível e área de toque confortável de 44×44 px; essa área é meta interna, não afirmação de mínimo universal de acessibilidade.

Cada tela deve apresentar, nesta ordem: onde estou → contexto/período → tarefa ou dados principais → ferramentas secundárias. Nenhuma precisa começar com cartão de boas-vindas, selo VIP ou descrição longa do recurso.

## 3. Agenda — priorizar a rotina do dia

### Diagnóstico confirmado

Em `src/app/barber/agenda/page.tsx`:

- O título “Meus Atendimentos & Agenda” vem acompanhado de “Gestão de Cadeira & Horários”. Há repetição e linguagem decorativa.
- O calendário mensal completo antecede a lista diária, exigindo rolagem para a tarefa mais frequente.
- O banner “Chegada Imediata” depende somente de uma janela de tempo entre 15 minutos atrás e 30 minutos à frente; não há confirmação de chegada do cliente.
- “Iniciar / Concluir” e “Atender” acionam a alteração para COMPLETED. Não existe uma ação de início equivalente nesses botões.
- Cancelar e registrar falta enviam alteração diretamente; a confirmação existente cobre conclusão antes do horário.
- `updatingId` identifica somente uma operação por vez, sem um bloqueio global explícito para impedir uma segunda ação em outro registro.
- Lista e ocupação mensal têm consultas separadas sem proteção de respostas fora de ordem equivalente à tela de análises. Falha na ocupação não tem apresentação própria.
- A troca de mês usa `setMonth` preservando o dia do objeto. Em datas como dia 31, isso pode saltar o mês esperado por transbordamento.

### Composição proposta

**Celular:** título Agenda → data selecionada com Anterior/Hoje/Próximo e “Escolher data” → resumo/pendências → lista diária → calendário expandido somente quando solicitado.

**Desktop:** seletor mensal compacto em coluna lateral e lista diária na coluna principal. A data da lista permanece explícita; mudar mês de exploração não pode mudar silenciosamente o dia consultado.

### Como executar

1. Simplificar cabeçalho para “Agenda” e data completa. Remover etiqueta “Gestão de Cadeira & Horários”. Usar descrição curta somente se esclarecer algo não evidente.
2. Mostrar a lista diária antes do calendário no celular. Abrir o calendário por “Escolher data”, em expansão ou diálogo acessível, preservando a seleção.
3. Manter calendário mensal disponível: sua remoção completa prejudicaria quem organiza semanas futuras. A mudança é de prioridade e localização.
4. Adicionar atalhos Hoje, dia anterior e próximo dia. Nomear acessivelmente as setas e manter mês/ano identificáveis.
5. Navegar meses a partir de uma data normalizada, como primeiro dia do mês, sem herdar dia 29/30/31. Testar janeiro/fevereiro, ano bissexto e dezembro/janeiro.
6. Cada atendimento deve priorizar horário, cliente, serviço e estado; preço e duração ficam como complemento. A consulta compartilhada já retorna início/fim; alinhar o tipo usado pela tela se for necessário exibir duração.
7. Usar o mesmo vocabulário de estados do início e das análises. PENDING pode aparecer como “Agendado”, sem sugerir confirmação extra não prevista no negócio. Concluído, Cancelado e Falta continuam distintos.
8. Oferecer filtro de estado como evolução simples da lista recebida, preservando data. Se houver paginação futura no servidor, a filtragem precisa alcançar o conjunto completo, não apenas uma página.
9. Substituir “Chegada Imediata” por “Próximo horário” ou “Horário próximo”, quando suportado. Não afirmar presença ou atendimento em andamento por cálculo de tempo. Remover brilho pulsante.
10. Padronizar a regra de próximo compromisso com a home. Pendência passada é resultado ainda não registrado, sem virar falta automaticamente.

### Ações com significado inequívoco

| Atual | Ação real identificada | Texto proposto |
| --- | --- | --- |
| Iniciar / Concluir | Marca como COMPLETED | Concluir atendimento |
| Atender | Marca como COMPLETED | Concluir atendimento |
| Faltou | Marca como NO_SHOW | Registrar falta |
| Cancelar | Marca como CANCELED | Cancelar agendamento |
| Sim, Confirmar | Confirma conclusão antecipada | Concluir mesmo assim |

Não criar estado “Em atendimento” somente para justificar o botão antigo. Essa evolução exige regra de negócio, contrato, autorização e armazenamento próprios.

### Segurança de interação e recuperação

1. Antes de cancelar ou registrar falta, apresentar cliente, serviço, data/horário e consequência real. Diferenciar “Voltar” de “Cancelar agendamento” no diálogo para evitar ambiguidade.
2. Preservar confirmação de conclusão antecipada, com texto explícito: o atendimento será registrado como concluído, e não apenas iniciado. Completar gerenciamento de foco, Escape e retorno ao acionador; o diálogo já tem semântica básica.
3. Preservar restrições do servidor para horários e transições. A interface só oferece o que o perfil pode realizar; não liberar alterações para igualar o aspecto visual ao administrador.
4. Escolher estratégia clara de envio: bloquear todas as mutações durante uma operação ou controlar envios por identificador. Com um único `updatingId`, não permitir uma segunda operação que faça a primeira parecer liberada.
5. Desabilitar também o botão do banner enquanto a mesma reserva estiver sendo atualizada. Prevenir clique repetido não substitui validação de concorrência no servidor.
6. Manter lista e rolagem durante atualização de uma linha; erros próximos do item e estado preservado em falha. Evitar desaparecer toda a agenda a cada conclusão.
7. Separar erro de consulta, de mutação e de ocupação mensal. Acrescentar nova tentativa por bloco e finalização de carregamento também em exceções.
8. Ignorar respostas antigas ao trocar data/mês. Se um envio começar em uma data e o usuário navegar, o resultado não deve sobrescrever a lista de outra data.
9. Definir “ocupação”: número de reservas não equivale a percentual de capacidade ou vagas livres. Usar legenda de quantidade e conferir quais estados entram na contagem.

**Aceite:** chegar à lista do dia sem atravessar calendário grande; nenhuma ação promete iniciar quando conclui; mudança rápida de data não mistura registros; falha não vira vazio; conclusão atualiza início e análises quando consultados novamente.

## 4. Análises — clareza dos números e consistência visual

### Preservar o que já funciona

`src/app/barber/metricas/page.tsx` já possui opções Hoje, Esta semana, Este mês, Este ano e Geral, intervalo retornado pelo relatório, atualização manual, horário da atualização, tratamento de erro e controle de respostas antigas. Há receita, comissão, concluídos, ticket, evolução temporal, distribuição e ranking por receita.

Não reconstruir consultas corretas apenas para alterar aparência. A refatoração deve concentrar-se na composição, semântica, responsividade e integração com componentes compartilhados.

### Composição proposta

Título Análises → período e intervalo → indicadores → evolução → serviços → detalhe por serviço. Distinguir a comissão do profissional da receita dos atendimentos e de pagamento efetivamente recebido.

### Como executar

1. Reutilizar cabeçalho de página, filtro, cartão de indicador e aviso do padrão comum. Manter a identidade do barbeiro implícita na autorização, sem seletor de outros profissionais.
2. No celular estreito, substituir a linha rígida de cinco períodos por seletor rotulado ou quebra de linha legível. Não reduzir texto até caber. No desktop, manter opções segmentadas se houver espaço.
3. Preservar período na URL e testar voltar/avançar do navegador. A inicialização atual lê o parâmetro uma vez; validar sincronização posterior, inclusive acesso direto e valor inválido.
4. Durante troca de período, não mostrar indicadores antigos sob novo contexto como se fossem atuais. Exibir atualização identificada ou placeholders; o intervalo do relatório e os valores precisam representar o mesmo resultado.
5. Ordenar indicadores conforme necessidade: Comissão calculada, Atendimentos concluídos, Receita dos serviços e Ticket médio por atendimento. Validar prioridade com barbeiros antes de fixar a ordem.
6. Trocar “Comissão líquida dos atendimentos” por uma definição sustentada pelo cálculo. Se só existe soma de `commissionCents`, usar “Comissão calculada”; não prometer descontos, liquidez ou pagamento.
7. Diferenciar campo indisponível de valor zero. O componente usa `totalCommission ?? 0`; conferir garantia do contrato antes de apresentar ausência como ausência de comissão.
8. Manter definições acessíveis próximas aos indicadores: receita de concluídos, comissão calculada conforme registros, ticket como receita dividida por concluídos. Sem concluídos, “Sem base” pode ser mais claro que um ticket monetário de zero.
9. Simplificar cartões: mesmo raio, padding, bordas e hierarquia da home. Reduzir caixa alta e ornamentação. Não apresentar contorno de botão em indicador sem ação.
10. Manter evolução temporal com eixo de datas e unidade monetária claros, dias sem movimento e indicação de ano quando necessário. Evitar depender do tooltip para entender os dados.
11. A distribuição atual é uma rosca sem legenda textual persistente. Acrescentar lista/tabela com serviço, quantidade e percentual; considerar barras horizontais quando houver muitas categorias. Não depender de hover no celular.
12. Preservar diferença entre distribuição por quantidade e ranking por receita. O ranking já tem nome correspondente à receita; não voltar a ordená-lo por quantidade. Permitir nomes longos em mais de uma linha.
13. Reutilizar cores estáveis dos serviços e manter unidade/legendas iguais às análises administrativas, sem compartilhar dados além do permitido.
14. Incluir vazio real por seção, erro com recuperação e resumo textual dos gráficos. Redução de movimento deve ser respeitada; não animar toda a tela a cada consulta.

**Aceite:** mês e profissional equivalentes produzem os mesmos valores nas visões autorizadas; período permanece ao voltar; controles cabem em 320 px; dados podem ser compreendidos sem hover e sem distinguir somente cores.

## 5. Conta — manter o contexto profissional e separar operações

### Diagnóstico confirmado

`src/app/profile/page.tsx` é compartilhada. Atualmente utiliza `Header` e `BottomNavigation` da área do cliente, com “Minha Conta VIP”. O barbeiro acessa essa rota pela navegação profissional e passa a ver outra estrutura.

O formulário único salva dados pessoais e depois tenta alterar a senha. Se a segunda operação falhar, a primeira pode ter sido concluída sem atualização clara da sessão. Foto tem upload com confirmação posterior ao salvar, entrada manual de URL e fallback externo de avatar. Campos já têm algumas configurações de autocomplete e senha visível; preservar os comportamentos corretos.

### Composição proposta

Título Conta → Foto → Dados pessoais → Segurança. Cada seção com ação, carregamento, erro e sucesso próprios. No desktop, a foto pode ficar em coluna secundária; no celular, limitar seu tamanho para não dominar a edição.

### Como executar

1. Selecionar a estrutura de página a partir do perfil autenticado: barbeiro continua com navegação profissional; cliente conserva a própria experiência. Evitar dois cabeçalhos/barras simultâneos.
2. Preservar `/profile` como rota compartilhada se atender à arquitetura. Não é necessário criar `/barber/profile` só para mudar a aparência. A autorização e as regras de alteração continuam no servidor.
3. Usar Conta como título, sem VIP automático, e indicar o destino atual na navegação. Voltar deve levar a contexto profissional válido, inclusive em acesso direto.
4. Separar salvar dados e alterar senha em operações independentes. Mostrar resultado da primeira antes de tentar a segunda; atualizar sessão conforme o resultado efetivo.
5. Manter nome, e-mail conforme permissões existentes e telefone com rótulos associados por identificador, mensagens junto ao campo e autocomplete adequado. Não sugerir que e-mail é editável se a operação real não permite.
6. Revisar máscara do telefone para permitir digitação, colagem, exclusão e edição intermediária sem saltos. Não endurecer regra de país silenciosamente; alinhar ao público e à validação do servidor.
7. Foto deve mostrar prévia, envio e persistência como estados diferentes. Se upload já terminou, mas vínculo ao perfil ainda não foi salvo, informar isso de forma localizada.
8. Remover entrada técnica de URL da experiência comum; se necessária, tratá-la como opção avançada. Validar formatos/limites conforme backend e não apenas conforme legenda.
9. Usar fallback local de iniciais/ícone para imagem quebrada. O fallback atual altera o estado de URL para serviço externo e pode acabar persistido; separar estado visual de erro do valor a salvar.
10. Acrescentar remover foto somente com operação e regra de persistência válidas. Não apresentar botão inoperante.
11. Em senha, preservar mostrar/ocultar e autocomplete. Exibir requisitos antes do envio, permitir colagem e não persistir credenciais. Explicar novo login conforme política real de invalidação de sessões.
12. Diferenciar contas com provedor externo quando necessário: não exigir senha atual local inexistente. Identificar o fluxo disponível pelo contrato de autenticação, sem deduzir isso pela foto do usuário.
13. Evitar que atualização de sessão sobrescreva campos em edição. Inicializar/restaurar dados conscientemente e proteger alterações não salvas com aviso apenas quando houver edição real.
14. Garantir ação de salvar próxima da seção, visível com teclado virtual e sem competir com barra inferior. Não acrescentar outra barra fixa sem necessidade.

**Aceite:** barbeiro permanece na área profissional; erro de senha não deixa dúvida sobre dados salvos; foto quebrada não muda URL silenciosamente; alterações não desaparecem após atualização de sessão; cliente não recebe navegação do barbeiro.

## 6. Notificações, menus e navegação compartilhada

### Barra inferior e cabeçalho

A barra de quatro destinos já existe. Preservar a estrutura, melhorar a semântica de links, indicar destino atual de forma acessível e validar foco/contraste. Rótulos de 10 px ainda merecem revisão para conforto; ampliar quando possível sem cortar nomes. Tratar foto inválida no item Conta.

Conferir implementação efetiva de área segura e espaço reservado no conteúdo em cada página, sem pressupor que nomes como `pb-safe` asseguram o comportamento. Padronizar marca e contexto; eliminar qualificadores automáticos como Master/VIP e remover e-mail fictício de fallback do cabeçalho.

### Notificações

Em `BarberNavbar.tsx`, marcar como lida atualiza a interface antes de aguardar o resultado, sem recuperação explícita; datas mostram apenas hora. A lista tem largura fixa e depende de clique para parte das ações.

1. Preservar polling/atualização por foco quando adequado, evitando consultas sobrepostas e atividade desnecessária em aba oculta. Não chamar isso de confirmação de presença ou dados em tempo real.
2. Diferenciar consulta carregando, falha e nenhuma notificação. Falha não deve mostrar “Nenhum alerta”.
3. Reverter estado otimista ou reconciliar com servidor quando marcar lida falhar. Não reduzir contador novamente se o mesmo aviso já foi tratado.
4. Mostrar hora para avisos do dia e data/hora para antigos. Ordenação e fuso devem ser coerentes com a agenda.
5. Limitar dropdown ao viewport e altura disponível. No celular, considerar painel acessível quando o conteúdo não couber com segurança.
6. Usar botões/links acessíveis, estado expandido, Escape e retorno de foco. Não tratar painel comum como menu ARIA se seu conteúdo não seguir esse padrão.
7. Levar à reserva relacionada somente se a notificação tiver identificador/rota autorizados. Hoje o tipo exibido não comprova esse vínculo; não inventar destino a partir do texto.
8. Evitar brilho pulsante contínuo do contador. Destaque estático e nome acessível com quantidade de não lidas são suficientes.

### Componentes antigos

`src/components/barber/BarberSidebar.tsx` foi encontrado, mas a busca atual não mostrou uso em outras telas. Antes de refatorá-lo, confirmar se está ativo. Se desnecessário, planejar remoção após verificar referências; se utilizado, migrar ao mesmo contrato de navegação. Não manter dois menus independentes por precaução. Retirar texto de implementação como “Clean Architecture” da interface do produto.

**Aceite:** menus e avisos funcionam por teclado; painel não ultrapassa a tela; falha de leitura não anuncia sucesso; navegação apresenta os mesmos quatro destinos em todas as páginas do barbeiro.

## 7. Componentes e regras a compartilhar

| Componente/conceito proposto | Uso | Responsabilidade |
| --- | --- | --- |
| Estrutura profissional | Todas as telas, incluindo Conta no perfil BARBER | Cabeçalho, navegação, largura e área segura |
| Cabeçalho de página | Agenda, Análises e Conta | Título, contexto e ação secundária |
| Estado de agendamento | Início e Agenda | Tradução/semântica comum dos estados, sem inferência por data |
| Item de atendimento | Resumo da home e lista da agenda | Horário, cliente, serviço, estado e ações autorizadas |
| Indicador | Início e Análises | Valor, unidade, definição, carregamento e indisponibilidade |
| Seletor de período/data | Conforme tarefa | Seleção explícita, rótulo e preservação de contexto |
| Aviso e nova tentativa | Todas as consultas | Mensagem localizada e recuperação |
| Confirmação de operação | Agenda e descarte de edição | Consequência clara, foco e envio protegido |
| Seção de formulário | Conta | Campos, validação e resultado independente |

Compartilhar apresentação não significa unificar todos os estados e consultas. Dados diários, relatórios e perfil continuam com contratos próprios; autorização nunca é responsabilidade de um componente visual.

Centralizar o fuso e as regras de data. Preservar data/filtro em URL quando fizer sentido e validar parâmetros. Acesso direto, recarregar e voltar devem funcionar, sem depender de memória de navegação.

## 8. Ordem de execução e critérios de liberação

| Etapa | Entrega | Condição para avançar |
| --- | --- | --- |
| 1 | Vocabulário, navegação e componentes comuns | Início, Agenda, Análises e Conta reconhecíveis como mesma área |
| 2 | Corrigir ações ambíguas, confirmação e concorrência na Agenda | Nenhum botão inicia algo que na prática conclui; falhas recuperáveis |
| 3 | Reorganizar Agenda e calendário | Lista diária acessível primeiro no celular; seleção de data previsível |
| 4 | Padronizar Análises | Números, período e unidades coerentes, com leitura móvel e textual |
| 5 | Conta por perfil e operações independentes | Contexto profissional preservado e resultados localizados |
| 6 | Menus, notificações e auditoria transversal | Teclado, foco, área segura, acesso direto e recuperação aprovados |

Priorizar correções de significado e resultado antes do acabamento. Fazer entregas revisáveis por fluxo; não trocar a stack ou reconstruir relatórios já corretos como condição para padronizar aparência. Antes de implementar Next.js, ler os guias relevantes em `node_modules/next/dist/docs/`, conforme `AGENTS.md`.

## 9. Matriz de validação

| Cenário | Resultado esperado |
| --- | --- |
| Agenda em celular | Data e atendimentos acessíveis sem atravessar calendário mensal grande |
| Concluir atendimento futuro | Diálogo explica conclusão antecipada, sem prometer início |
| Registrar falta/cancelar | Reserva identificada, consequência clara e regra autorizada pelo servidor |
| Duplo clique ou duas operações rápidas | Sem envio repetido/concorrência invisível; estado por operação coerente |
| Falha de atualização | Item mantém estado anterior; mensagem e tentativa disponíveis |
| Troca rápida de dia/mês | Respostas antigas não substituem seleção atual |
| Navegação em dia 31 e fevereiro | Mês seguinte/anterior correto, inclusive ano bissexto |
| Ocupação falha, lista funciona | Cada bloco representa seu resultado, sem inventar zero |
| Alterar período e usar voltar/avançar | Filtro, URL, intervalo e relatório correspondem entre si |
| Comissão ausente ou nenhum concluído | Ausência/sem base distinguida de zero legítimo |
| Gráficos no celular/teclado | Dados compreensíveis por legenda/tabela, sem hover obrigatório |
| Barbeiro abre Conta | Mantém navegação profissional e destino atual |
| Cliente abre a mesma Conta | Mantém navegação de cliente |
| Dados salvos, senha falha | Resultado independente e sessão coerente com o que foi salvo |
| Upload concluído sem salvar | Estado de foto pendente explícito; nenhuma falsa persistência |
| Foto inválida | Fallback local, sem alterar silenciosamente o endereço salvo |
| Marcar notificação lida falha | Estado recuperado/reconciliado e mensagem clara |
| Nome/serviço longo, zoom, rede lenta | Sem conteúdo essencial cortado, escondido ou apresentado como zero |
| URL direta, logout e acesso não autorizado | Navegação recuperável e dados protegidos no servidor |

Validar 320, 375, 390, 768 e 1440 px, zoom, teclado virtual, leitor de tela, foco e redução de movimento. Usar dados de teste, sem publicar dados pessoais das capturas.

Na implementação, executar verificações e testes existentes e acrescentar cenários de comportamento para transições, confirmação, calendário, corrida de consultas, contexto por perfil e falhas parciais. Não criar testes que apenas reproduzem classes CSS. Comparar capturas no mesmo viewport e realizar tarefas com barbeiros: localizar horário, concluir, registrar falta, consultar comissão e editar contato.

## 10. Checklist de conclusão

- [ ] Mesmos tokens, tipografia, componentes e nomes em todas as páginas.
- [ ] Agenda mostra tarefa diária antes de ornamentação ou calendário expandido.
- [ ] Botões descrevem exatamente o estado que será alterado.
- [ ] Falta, cancelamento, agendado e concluído permanecem distintos.
- [ ] Consultas, mutações e ocupação têm carregamento/erro/recuperação próprios.
- [ ] Datas, fuso, filtro e navegação mensal são consistentes.
- [ ] Análises separa receita, comissão calculada e pagamento real.
- [ ] Gráficos possuem alternativa textual e controles legíveis no celular.
- [ ] Conta respeita perfil e separa dados, foto e senha.
- [ ] Notificações e menus funcionam com teclado e recuperam falhas.
- [ ] Nenhum recurso futuro aparece como funcionalidade pronta.
- [ ] Fluxos e estados validados; alterações prontas para revisão incremental.
