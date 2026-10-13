# Plano de tratamento de erros HTTP, autenticação e autorização

Data: 13/10/2026. Status: especificação de alterações futuras. Nenhum código, variável de ambiente ou banco alterado nesta entrega.

## 1. Objetivo e comportamento esperado

Substituir redirecionamentos indevidos por respostas coerentes com a causa da falha. Exemplo obrigatório: cliente autenticado acessa `/admin/dashboard` → **HTTP 403 e tela Acesso negado**, sem mandar para localhost, página inicial ou outro painel.

Este plano complementa a [Auditoria de redirecionamentos na Vercel](./auditoria-redirecionamentos-vercel.md), que confirmou login em localhost nas 17 páginas protegidas verificadas. A auditoria anterior registra resultados observados; este documento define o comportamento a implementar.

**Distinções centrais:**

- Sem sessão válida: 401, autenticação necessária.
- Com sessão válida, mas sem permissão de perfil: 403, acesso negado.
- Recurso inexistente: 404, quando o usuário está autorizado a consultar aquela área.
- Conflito com o estado atual: 409, sem fingir falta de permissão.
- Falha interna inesperada: 500, sem revelar detalhes técnicos.

Para eliminar também o redirecionamento problemático de visitantes, a política proposta para acesso direto a páginas protegidas é uma tela **401 na própria rota**, com botão Entrar e retorno interno validado. O usuário escolhe entrar; não há salto automático para localhost. O fluxo público de reserva continua solicitando login/cadastro antes da confirmação, conforme a regra já definida.

HTTP é o protocolo/status; HTTPS é a conexão segura. Corrigir os status não substitui corrigir a origem dos redirecionamentos de autenticação que continuam sendo necessários.

## 2. Catálogo de erros e apresentação

| HTTP | Situação | Mensagem de exemplo | Tratamento |
| --- | --- | --- | --- |
| 400 | Requisição malformada, data/identificador inválidos | Não foi possível interpretar os dados enviados | Corrigir requisição; sem gravação |
| 401 | Sessão ausente, expirada ou revogada | Entre na sua conta para continuar | Entrar, com retorno seguro; limpar dados privados antigos |
| 403 | Perfil autenticado sem acesso ou operação proibida | Sua conta não tem permissão para acessar esta área | Permanecer na rota; botão para área permitida |
| 404 | Página/recurso não encontrado | O registro solicitado não foi encontrado | Voltar para lista/área segura |
| 409 | Vaga ocupada, estado mudou, recebimento já confirmado ou chave reutilizada indevidamente | Este registro foi alterado. Atualize e tente novamente | Reconciliar estado; não repetir gravação cegamente |
| 422 | Conteúdo compreensível que viola validação/regra de negócio | Confira os campos destacados | Erros por campo ou orientação junto à ação |
| 429 | Limite de tentativas, se implementado | Aguarde antes de tentar novamente | Respeitar limite/Retry-After quando disponível |
| 500 | Erro inesperado | Não foi possível concluir. Tente novamente | Registrar diagnóstico privado e identificador de correlação |
| 503 | Dependência/configuração indisponível | Serviço temporariamente indisponível | Nova tentativa controlada, sem culpar credenciais |

Não criar limitação 429 apenas como texto; ela exige controle real. Para 401, definir os headers exigidos pelo mecanismo de autenticação aplicável; não declarar desafio Bearer onde só existe sessão por cookie. Referência de semântica: [RFC 9110 — HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110.html).

Aplicar autenticação e autorização antes de consultar/gravar dados protegidos. A política para recursos de outro titular deve ser consistente: este plano recomenda 404 quando revelar sua existência for inadequado; isso não substitui o 403 claro para cliente que tenta entrar na área administrativa.

## 3. Política por rota

Em todas as páginas protegidas abaixo: sem sessão válida → 401; com perfil permitido → executar autorização de dados e renderizar; com perfil inadequado → 403. Papéis de referência seguem as regras atuais, salvo pontos explicitamente assinalados.

| Rota/padrão | Perfis permitidos | Alteração principal |
| --- | --- | --- |
| `/admin/dashboard` | ADMIN | Cliente/barbeiro/atendente recebem 403 |
| `/admin/calendario` | ADMIN | Mesmo tratamento |
| `/admin/clientes` | ADMIN | Mesmo tratamento, sem consultar base antes de autorizar |
| `/admin/servicos` | ADMIN | Mesmo tratamento |
| `/admin/atendentes` | ADMIN | Mesmo tratamento |
| `/admin/barbeiros/[id]/metricas` | ADMIN | 403 por perfil; 404 para barbeiro inexistente após autorização |
| `/barber/dashboard` | BARBER, ADMIN conforme política atual | Outros perfis recebem 403; escopo do barbeiro validado |
| `/barber/agenda` | BARBER, ADMIN conforme política atual | Mesmo tratamento; não consultar fila alheia por parâmetro |
| `/barber/metricas` | BARBER, ADMIN conforme política atual | Mesmo tratamento; autorização por profissional |
| `/barbeiro/agenda` | Mesma política da agenda profissional | Autorizar antes do alias; redirecionamento relativo somente para usuário permitido |
| `/atendente` | RECEPTIONIST, ADMIN na consulta atual | CLIENT/BARBER recebem 403 |
| `/atendente/caixa` | RECEPTIONIST, ADMIN | CLIENT/BARBER recebem 403; operação de caixa revalida permissão |
| `/agenda` | CLIENT | Outros papéis recebem 403 em acesso direto à área de cliente |
| `/agenda/[id]` | CLIENT titular, na área do cliente | 403 para perfil errado; 404 para registro ausente/fora do escopo sem revelar titular |
| `/historico` | CLIENT | Outros papéis recebem 403 em acesso direto |
| `/profile` | Perfis autenticados reconhecidos | 401 sem sessão; contexto/edição restritos à própria conta |
| `/dashboard` | Perfis autenticados reconhecidos | 401 sem sessão; encaminhamento interno por papel é navegação legítima |

`/` continua sendo entrada pública: pode apresentar catálogo/fluxo público ou encaminhar usuário autenticado à sua área. `/auth/login` e `/auth/register` são públicas. Esses acessos não representam tentativa proibida e não devem virar 403 por causa do papel.

O encaminhamento intencional de `/` ou `/dashboard` para o painel do usuário é diferente de ocultar uma tentativa de acesso negado a `/admin`. Preservar o primeiro com origem segura e eliminar o segundo.

**Operações não são liberadas só porque a página é permitida:** ADMIN pode consultar recepção/caixa conforme política atual, mas a reserva manual para terceiros continua exclusiva de RECEPTIONIST, como definido pelo usuário. Uma tentativa direta dessa operação por ADMIN deve resultar em 403.

## 4. Proxy: cada desvio que precisa mudar

Arquivo: `src/proxy.ts`. Linhas referem-se à versão auditada e podem mudar na implementação.

| Trecho atual | Problema | Comportamento futuro |
| --- | --- | --- |
| Linhas 20–33: sem sessão → URL de login construída de req.url | Gera Location localhost com origem contaminada | Resposta 401 na rota, com opção de login segura |
| Linhas 36–41: RECEPTIONIST em cliente/admin/barbeiro/dashboard → `/atendente` | Mistura navegação legítima com negação de acesso | Área proibida → 403; `/` e `/dashboard` → destino próprio seguro |
| Linhas 45–47: BARBER em `/` → painel | Navegação legítima, origem vulnerável | Preservar encaminhamento corrigindo origem |
| Linhas 50–52: ADMIN em `/` → painel | Mesmo problema de origem | Preservar encaminhamento corrigindo origem |
| Linhas 55–57: não ADMIN em `/admin` → `/` | Esconde 403 e pode ir a localhost | 403 com tela de permissão na rota solicitada |
| Linhas 60–62: papel inadequado em barbeiro → `/` | Mesmo problema | 403 |
| Linhas 65–67: papel inadequado em atendente → `/` | Mesmo problema | 403 |
| Correspondência de caminhos por startsWith | Pode confundir prefixos semelhantes ao ampliar rotas | Comparar segmentos completos e manter política central de caminhos |

Não usar 302/307 para uma página `/403` que responde 200. O erro deve ser emitido na resposta da rota solicitada. Se houver rewrite interno para interface de erro, provar que preserva o status e não executa conteúdo protegido.

Proxy não é a única defesa: verificar novamente nas páginas/consultas e em toda mutação. Nenhuma operação é autorizada apenas por passar por uma página.

## 5. Páginas e estrutura de renderização

Hoje várias páginas são Client Components que consultam ações após montar. Isso não assegura HTTP 403 do documento HTML inicial. Uma mensagem de Acesso negado mostrada depois de carregar HTTP 200 não atende ao requisito de status correspondente.

### Alterações necessárias

1. Criar verificações reutilizáveis de sessão/perfil/escopo no servidor.
2. Nas páginas protegidas com interface cliente, separar entrada autorizada no servidor e componente interativo. Validar antes de renderizar dados privados ou iniciar streaming.
3. Não confiar apenas em layout para toda navegação: proteger também consultas e mutações, inclusive após sessão expirar.
4. Definir interfaces reutilizáveis de 401 e 403 com título, explicação, ação segura e estilo da plataforma.
5. Tela 401 oferece Entrar; tela 403 oferece Voltar/Minha área e, opcionalmente, trocar conta. Não fazer logout automático de conta válida por falta de permissão.
6. Não usar `error.tsx` genérico para transformar erro de permissão em falha 500. Criar tratamento específico.

**Arquivos a revisar:** todas as entradas de página da seção 3; em especial `src/app/agenda/page.tsx` e `src/app/historico/page.tsx`, que hoje também encaminham papéis para outros painéis; `src/app/profile/page.tsx`, que redireciona por sessão no cliente; `src/app/dashboard/page.tsx` e `src/app/page.tsx`, que devem manter somente encaminhamentos legítimos.

### Particularidades do Next.js instalado

Os guias locais consultados em `node_modules/next/dist/docs/` descrevem `forbidden()`, `unauthorized()`, os arquivos `forbidden.tsx`/`unauthorized.tsx` e a configuração `authInterrupts` como experimentais. Não tratá-los como solução estável obrigatória nem habilitar flag por consequência desta documentação.

Escolher antes da implementação entre recursos experimentais avaliados da versão instalada e resposta antecipada explícita no Proxy/handler com HTML/JSON apropriado. Para uso estável sem depender das interrupções experimentais, a resposta antecipada precisa emitir o status e interface acessível, não uma tela vazia ou um redirecionamento de erro.

Status deve ser definido antes de enviar a resposta. A documentação atual do Next.js alerta que uma interrupção depois de começar streaming pode manter 200, embora mostre interface de erro. Não aceitar isso como 403 HTTP verdadeiro. Fontes: [forbidden](https://nextjs.org/docs/app/api-reference/functions/forbidden) e [unauthorized](https://nextjs.org/docs/app/api-reference/functions/unauthorized). A documentação online pode ser de versão posterior; os guias locais e testes da versão instalada prevalecem na implementação.

Adicionar `Cache-Control` privado/sem armazenamento às respostas dependentes de sessão, conforme contexto, para evitar reutilização de conteúdo entre perfis. Validar headers e corpo em navegação direta e navegação pelo aplicativo.

## 6. Autenticação e origem: corrigir mesmo com telas de erro

| Local | Alteração |
| --- | --- |
| Ambiente Vercel: AUTH_URL/NEXTAUTH_URL | Conferir origem efetiva; eliminar localhost em Production e conflito de variáveis; publicar novo deploy |
| `src/auth.ts:117–130` | Unificar origem confiável por ambiente, validar hostname/protocolo e rever prioridade produção/preview |
| `src/core/utils/safe-redirect.ts` | Manter mesma origem com base validada; ampliar testes de retornos internos e origens inválidas |
| `src/app/auth/login/page.tsx:11,38,65` | Validar callback antes de `window.location.href`; impedir localhost/site externo/esquema inadequado |
| `src/app/auth/login/page.tsx:78` | Rever retorno Google fixo `/dashboard` quando houver contexto interno válido |
| `src/app/auth/register/page.tsx:12,44,164` | Normalizar callback; codificar query não equivale a validar destino |
| `src/components/BookingFlow.tsx:174` | Login intencional com retorno interno válido; preservar rascunho e confirmação explícita |
| `/api/auth/signin` e handlers de autenticação | Eliminar callback localhost observado, mantendo protocolo Auth.js/OAuth |

Não alterar `node_modules` para corrigir reqWithEnvURL: é evidência da causa, não local de manutenção do aplicativo. Trocar req.url por req.nextUrl sozinho não assegura origem correta, pois ambos podem ter sido reconstruídos.

Os redirecionamentos legítimos de OAuth, login e logout permanecem com origem correta. Não converter indiscriminadamente toda resposta 302/307 em erro. Tampouco transformar toda falha de credencial em 403: senha incorreta é falha de autenticação, não permissão de perfil.

### Logout: superfícies a validar

`src/components/SignOutButton.tsx`, `ClientNavbar.tsx`, `admin/AdminNavbar.tsx`, `barber/BarberNavbar.tsx`, `reception/ReceptionNavbar.tsx` e `lux/SideDrawerMenu.tsx` usam callback de logout. Corrigir origem central e validar todos, sem substituir logout bem-sucedido por 401/403.

## 7. Server Actions e APIs: status real versus resultado lógico

As ações atuais geralmente retornam `success: false` e texto. Um campo chamado `status: 403` nesse objeto **não altera automaticamente o status HTTP** do transporte do Next.js.

### Contrato esperado

Definir erro estruturado com código estável, status semântico, mensagem segura, campos inválidos quando aplicável e identificador de correlação. Exemplos de códigos: AUTHENTICATION_REQUIRED, FORBIDDEN, NOT_FOUND, SLOT_CONFLICT, PAYMENT_ALREADY_CONFIRMED, VALIDATION_ERROR e INTERNAL_ERROR.

Clientes não devem decidir fluxo por comparação de frases como “Não autorizado”. Preservar mensagens em português, mas usar código estável para escolher comportamento.

### Estratégia para garantir HTTP correspondente

- Route Handlers retornam status HTTP real e corpo JSON padronizado; não retornam HTML de login em chamada de API.
- Para operações cujo requisito seja status HTTP explícito em toda chamada, expor handlers HTTP autenticados e migrar seus consumidores. Reaproveitar os casos de uso, sem duplicar regras em uma segunda API.
- Server Actions mantidas precisam de contrato estruturado para a interface. Seu transporte é gerenciado pelo framework; não anunciar que um objeto de erro resolve o status da resposta.
- Se optar por interrupções de autenticação nas Actions, avaliar a API experimental e o transporte real da versão instalada antes de adotá-la. Não capturar a interrupção num catch genérico e devolver erro comum.
- Nenhum POST sem autorização pode gravar, independentemente do status emitido ou da proteção da página.

A decisão de transporte é necessária para cumprir o pedido em todos os pontos. Não concluir a tarefa apenas acrescentando número de status a todos os retornos existentes.

## 8. Inventário das operações que precisam de revisão

As operações abaixo não são todas redirecionamentos localhost; são os pontos de autorização/erro que precisam acompanhar a correção para o comportamento ser consistente de ponta a ponta.

| Arquivo | Funções a revisar | Tratamento |
| --- | --- | --- |
| `src/app/actions/admin-actions.ts` | registerBarberAction, deleteBarberAction, getClientManagementAction, getFinanceDashboardAction, getAdminDashboardAnalyticsAction, getAdminCalendarMetricsAction | 401 sem sessão; 403 sem ADMIN; validação/conflito/500 separados |
| Mesmo arquivo | getReceptionistsAction, registerReceptionistAction, deactivateReceptionistAction, revertPaymentReceiptAction | Mesma política; reversão também distingue estado financeiro conflitante |
| Mesmo arquivo | getBarberMetricsAction | 401, autorização por perfil/profissional, 403/404 conforme escopo |
| Mesmo arquivo | getBarbersAction, getServicesAction | Separar catálogo público de dados privados; não exigir login para todo dado público nem expor e-mail/expediente interno indiscriminadamente |
| `src/app/actions/reception-actions.ts` | getReceptionAgendaAction, searchClientsForReceptionAction, getCashRegisterDataAction, confirmPaymentReceiptAction | Separar 401 de 403; operação autorizada por recepção/admin conforme contrato; conflito de recebimento não vira erro de permissão |
| Mesmo arquivo | createManualAppointmentAction | 401 sem sessão; 403 para qualquer papel que não seja RECEPTIONIST; 409 de vaga; validação específica |
| `src/app/actions/appointment-actions.ts` | createAppointmentAction | Exigir cliente autenticado para reserva própria; não aceitar terceiro/contato manual; 409 em vaga ocupada |
| Mesmo arquivo | changeAppointmentStatusAction | 401, perfil/escopo, transição inválida e concorrência separados |
| Mesmo arquivo | getClientAppointmentsAction, getAppointmentDetailsAction | Autenticação, titularidade/escopo e recurso ausente sem vazamento |
| Mesmo arquivo | getBarberAppointmentsAction, getBarberMonthScheduleAction, getBarberMetricsDetailedAction | Autenticação e profissional autorizado; parâmetros inválidos não viram 500 |
| Mesmo arquivo | cancelAppointmentByClientAction, rescheduleAppointmentAction | Autenticação/titularidade, restrições de negócio e conflito distintos |
| `src/app/actions/service-actions.ts` | getServicesAdminAction, createServiceAction, updateServiceAction, deleteServiceAction | 401/403 separados; validação/recurso ausente/conflito |
| `src/app/actions/auth-actions.ts` | signUpAction, updateProfileAction, updatePasswordAction | Cadastro público validado; edição exige sessão/titular; erro de senha não é autorização administrativa |
| `src/app/actions/upload-actions.ts` | uploadProfileImageAction, uploadServiceImageAction | 401/403, arquivo inválido/tamanho excessivo e falha de armazenamento separados |
| `src/app/actions/notification-actions.ts` | getNotificationsAction, markAsReadAction, markAllAsReadAction, createNotificationAction | Autenticação, titularidade e criação administrativa explícitas; leitura falha não anuncia sucesso |

Em uploads, requisição acima do limite pode receber 413 do transporte antes de executar a ação; tratar também esse caso na interface. Expor erro interno de banco/storage pelo `err.message` não é mensagem pública adequada.

## 9. Endpoints existentes

| Endpoint | Diagnóstico/alteração |
| --- | --- |
| `/api/auth/[...nextauth]` | Preservar contrato do Auth.js; corrigir origem/configuração; não interceptar tudo com regra de perfil de página |
| `/api/barbers/[id]/availability` | Público para consulta de horários; já possui 400 para alguns inputs, mas catch devolve 500 amplo e mensagem de exceção. Validar data real/serviço/profissional, separar inexistente/indisponível/erro interno e limitar dados públicos |
| `/api/cron/check-notifications` | Já responde 401 para credencial inválida, 503 sem configuração e 500 em falha. Preservar autenticação de serviço e padronizar corpo/headers; nunca encaminhar cron para login |

Não colocar endpoints públicos legítimos sob exigência de login só para uniformizar status. Consultar disponibilidade não cria reserva; confirmar continua exigindo autenticação apropriada.

## 10. Casos de uso, repositórios e consumidores

Substituir erros genéricos por categorias de domínio nos casos de uso relevantes: CreateAppointment, CreateManualAppointment, ChangeAppointmentStatus, RescheduleAppointment, ConfirmPaymentReceipt, RevertPaymentReceipt, gestão de usuários/serviços e consultas protegidas.

O adaptador de transporte mapeia a categoria para HTTP. Não mapear erro por texto em inglês/português nem converter toda exceção de banco em 409. Conflito conhecido é 409; indisponibilidade/erro inesperado exige tratamento próprio e log privado.

Consumidores a revisar: todas as páginas administrativas; home/agenda/análises do barbeiro; recepção/caixa; perfil; agenda/detalhe/histórico do cliente; BookingFlow; formulários administrativos; notificações e uploads. Componentes não podem mostrar zero/vazio quando receberam 401/403 nem tentar novamente indefinidamente uma permissão negada.

401 durante edição: preservar somente rascunho apropriado e oferecer reautenticação. 403: interromper consulta/mutação, ocultar dados antigos e mostrar acesso negado; não enviar automaticamente a outro painel. 409: atualizar dados da operação. Erro de campo: manter formulário e orientar correção.

Não remover autorização no domínio ao adicionar respostas no Proxy. Permissão de perfil, titularidade e estado do recurso são validações distintas.

## 11. Sequência de implementação futura

1. Consolidar matriz de papéis/rotas/operações e política de 401 na página.
2. Corrigir origem de autenticação em produção e callbacks; isso continua necessário mesmo sem redirecionar acessos negados.
3. Definir erros estruturados e estratégia de status para páginas, Actions e handlers.
4. Substituir desvios de permissão no Proxy por resposta adequada, antes de renderizar conteúdo.
5. Adaptar entradas de página e interfaces 401/403; preservar apenas encaminhamentos de navegação legítimos.
6. Revisar cada operação da seção 8, reusando casos de uso e introduzindo handlers quando status de transporte precisar ser garantido.
7. Atualizar consumidores, autenticação, logout e mensagens localizadas.
8. Testar localmente e na implantação, verificando status, Location, conteúdo e ausência de gravação indevida.

Nenhuma fase deve mascarar 403 com 200/302. Não atualizar Next.js ou habilitar recursos experimentais como requisito implícito; avaliar a versão instalada antes.

## 12. Matriz de aceite

| Cenário | Resultado obrigatório |
| --- | --- |
| Cliente autenticado em cada `/admin/*` | 403 e tela Acesso negado; sem redirecionamento |
| Cliente em barbeiro/recepção/caixa | 403; nenhum dado protegido |
| Atendente tenta área administrativa/profissional/de cliente | 403; `/` e `/dashboard` continuam podendo encaminhar à própria área |
| Sem sessão nas 17 páginas protegidas | 401 na própria rota, opção Entrar com origem pública segura |
| Sessão revogada durante ação | Erro de autenticação, sem gravação nem retorno localhost |
| ADMIN chama criação manual exclusiva da atendente | 403 no servidor |
| Barbeiro tenta fila/recurso alheio | 403/404 conforme política de existência, sem leitura indevida |
| ID inexistente após autenticação/autorização da área | 404 |
| Vaga/pagamento em conflito | 409 ou resultado idempotente já existente conforme contrato |
| Campo/arquivo inválido | 400/422/413 apropriado; mensagem localizada |
| Falha interna | 500/503 correto, mensagem segura e log privado |
| Callback para localhost/site externo | Rejeitado; navegação segura |
| Alias legado permitido | Encaminha para destino interno correto; negado não executa alias |
| HTTP inicial versus navegação cliente/RSC | Interface coerente; status do documento/API verificado, sem confundir transporte interno |
| HTML já em streaming | Não considerar tela 403 com HTTP 200 como atendimento do requisito |
| OAuth/logout bem-sucedidos | Redirecionamentos legítimos preservados, sem loopback |

Testar todas as páginas inventariadas, todos os perfis e chamadas diretas aos endpoints/Actions. Usar contas e banco de teste; verificar ausência de consulta/gravação indevida, não apenas aparência da tela. Registrar status e Location antes de seguir redirects. Quando houver redirecionamento legítimo, verificar o destino de toda a cadeia.

## 13. Checklist final

- [ ] Cliente em painel administrativo recebe 403 real e mensagem clara.
- [ ] Sem sessão é distinguido de sem permissão.
- [ ] Nenhum erro de acesso é ocultado por encaminhamento para outro painel.
- [ ] Autenticação/OAuth/logout não geram origem localhost em produção.
- [ ] Páginas autorizam antes de renderizar/consultar conteúdo protegido.
- [ ] APIs retornam status e JSON correspondentes; Actions não fingem alterar HTTP por campo no objeto.
- [ ] Todos os pontos da seção 8 possuem contrato e tratamento definidos.
- [ ] Erros de validação, inexistência, conflito e infraestrutura são separados.
- [ ] Perfil/titularidade revalidados no servidor em toda operação.
- [ ] Implantação validada por status/corpo/Location, não somente por tela exibida.
