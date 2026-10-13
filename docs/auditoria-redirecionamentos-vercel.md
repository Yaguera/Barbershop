# Auditoria de URLs e redirecionamentos na Vercel

Data: 13/10/2026. Escopo: leitura do projeto e consultas HTTP públicas sem autenticação. Entrega somente documental; código, variáveis da Vercel e contas não foram alterados.

Especificação posterior: [Plano de erros HTTP e autorização](./plano-erros-http-autorizacao.md). Esta auditoria preserva os resultados observados; o plano define a substituição dos desvios indevidos por 401/403 e os pontos de implementação, sem manter redirecionamento automático como tratamento de acesso negado.

## 1. Resultado principal

O problema relatado foi reproduzido: **todas as 17 páginas protegidas verificadas retornaram HTTP 307 com destino de login em `http://localhost:3000`**, incluindo dois padrões de rota dinâmica testados com identificador fictício.

Não foi encontrada uma lista de links de página com localhost escrito diretamente no destino. A falha se concentra na construção da origem dos redirecionamentos e na configuração da autenticação. Por isso, alterar o link de `/atendente` isoladamente não resolve as outras áreas.

Evidências complementares:

- `.env` local define `NEXTAUTH_URL` com origem `http://localhost:3000`.
- `.env.example` define `AUTH_URL` com origem local, apropriada para desenvolvimento, mas inadequada se copiada para produção.
- A versão instalada de NextAuth pode substituir a origem da requisição por AUTH_URL/NEXTAUTH_URL antes de executar o Proxy do projeto.
- O Proxy monta o destino com `req.url`, recebendo potencialmente a origem já substituída.
- `/api/auth/signin` também devolveu callback com localhost, embora o destino imediato de login seja relativo.

**Limite da conclusão:** não foram consultadas as variáveis do painel da Vercel nem os logs privados da implantação. O mecanismo no código foi confirmado; a origem exata da configuração de produção ainda exige conferir o ambiente implantado. O valor local não prova, por si só, que a mesma variável está cadastrada na Vercel.

## 2. Método e limites da auditoria

1. Inventário das páginas e endpoints em `src/app`.
2. Busca por localhost, loopback, variáveis de URL, callbacks e APIs de redirecionamento em código/configuração/documentação, excluindo artefatos gerados.
3. Leitura de autenticação, Proxy, login/cadastro, logout e utilitário de retorno seguro.
4. Inspeção restrita de variáveis locais relacionadas à origem, sem divulgar segredos ou conexões privadas.
5. GET público por página, sem cookies/credenciais, capturando somente status e Location, sem seguir os redirecionamentos.
6. Consulta à documentação primária do Auth.js e leitura do código da versão instalada.

A primeira tentativa de rede no ambiente restrito não resolveu o host. As consultas posteriores, com acesso de rede autorizado, retornaram os resultados abaixo. Não houve login, logout autenticado, criação de registros ou alteração de produção.

As rotas dinâmicas foram testadas com `auditoria-inexistente`. O resultado comprova o redirecionamento antes da consulta de existência/permissão do registro; não comprova acesso a um cliente ou barbeiro real.

## 3. Todas as páginas verificadas

Origem consultada: `https://barbeariajosecarlos-chi.vercel.app`.

Na tabela, “Login localhost” significa Location absoluta iniciando em `http://localhost:3000/auth/login`, com `callbackUrl` contendo o caminho indicado e codificado para URL.

| Rota/padrão existente | Caminho consultado | HTTP | Destino observado |
| --- | --- | --- | --- |
| `/atendente` | `/atendente` | 307 | Login localhost; callback `/atendente` |
| `/atendente/caixa` | `/atendente/caixa` | 307 | Login localhost; callback `/atendente/caixa` |
| `/admin/dashboard` | `/admin/dashboard` | 307 | Login localhost; callback `/admin/dashboard` |
| `/admin/calendario` | `/admin/calendario` | 307 | Login localhost; callback `/admin/calendario` |
| `/admin/clientes` | `/admin/clientes` | 307 | Login localhost; callback `/admin/clientes` |
| `/admin/servicos` | `/admin/servicos` | 307 | Login localhost; callback `/admin/servicos` |
| `/admin/atendentes` | `/admin/atendentes` | 307 | Login localhost; callback `/admin/atendentes` |
| `/admin/barbeiros/[id]/metricas` | `/admin/barbeiros/auditoria-inexistente/metricas` | 307 | Login localhost; callback do caminho consultado |
| `/barber/dashboard` | `/barber/dashboard` | 307 | Login localhost; callback `/barber/dashboard` |
| `/barber/agenda` | `/barber/agenda` | 307 | Login localhost; callback `/barber/agenda` |
| `/barber/metricas` | `/barber/metricas` | 307 | Login localhost; callback `/barber/metricas` |
| `/barbeiro/agenda` | `/barbeiro/agenda` | 307 | Login localhost; callback `/barbeiro/agenda` |
| `/dashboard` | `/dashboard` | 307 | Login localhost; callback `/dashboard` |
| `/profile` | `/profile` | 307 | Login localhost; callback `/profile` |
| `/agenda` | `/agenda` | 307 | Login localhost; callback `/agenda` |
| `/agenda/[id]` | `/agenda/auditoria-inexistente` | 307 | Login localhost; callback do caminho consultado |
| `/historico` | `/historico` | 307 | Login localhost; callback `/historico` |
| `/` | `/` | 200 | Sem redirecionamento HTTP |
| `/auth/login` | `/auth/login` | 200 | Sem redirecionamento HTTP |
| `/auth/register` | `/auth/register` | 200 | Sem redirecionamento HTTP |

São 20 páginas/padrões: 17 protegidos afetados e 3 públicos sem redirecionamento nos acessos testados. HTTP 200 não valida todos os botões, scripts e fluxos de uma página; significa que o acesso público consultado não devolveu Location.

### Consultas adicionais

| Requisição | Resultado |
| --- | --- |
| `/api/auth/signin` | HTTP 302; Location `/auth/login?callbackUrl=http%3A%2F%2Flocalhost%3A3000` |
| `/atendente?data=2026-10-13` | HTTP 307; Location `http://localhost:3000/auth/login?callbackUrl=%2Fatendente` |

O segundo resultado comprova perda da query string no retorno, além da origem errada.

Exemplo exato principal: `/atendente` retornou `http://localhost:3000/auth/login?callbackUrl=%2Fatendente`. Após correção, o destino deve permanecer na origem pública autorizada, com callback interno correspondente, nunca no computador de quem está acessando.

## 4. Achados por prioridade

### A1 — Origem contaminada no Proxy: problema confirmado em produção

**Prioridade:** alta. **Arquivo:** `src/proxy.ts`.

O redirecionamento sem sessão, nas linhas 31–33 da versão auditada, usa `new URL('/auth/login', req.url)`. As linhas 41, 47, 52, 57, 62 e 67 usam a mesma base para outros desvios por papel/permissão.

A biblioteca instalada executa `reqWithEnvURL` antes do handler do Proxy. Em `node_modules/next-auth/lib/env.js`, linhas 4–11, AUTH_URL ou NEXTAUTH_URL podem substituir a origem da requisição. Em `node_modules/next-auth/lib/index.js`, o handler recebe essa requisição alterada.

**Encadeamento compatível com o observado:** URL pública → autenticação reconstrói origem local → Proxy usa req.url alterada → Location aponta para localhost.

O callback `redirect` de `src/auth.ts` não corrige automaticamente um `NextResponse.redirect` criado diretamente pelo Proxy. A defesa presente nesse callback cobre outro caminho de autenticação, não todos os redirecionamentos do aplicativo.

**Alcance:** login sem sessão confirmado nas 17 páginas. Desvios autenticados por papel usam o mesmo padrão e também estão expostos ao problema; não foram executados com contas reais, portanto seu comportamento em produção é risco identificado no código, não reprodução autenticada.

**Correção recomendada:** resolver a configuração de origem e adotar política comum de origem confiável para redirecionamentos. Não presumir que trocar req.url por req.nextUrl basta: ambos podem refletir a requisição já reconstruída. Se usar headers de proxy, confiar somente no contexto de implantação validado; não aceitar Host/Forwarded arbitrário como destino.

### A2 — Configuração de ambiente local e autenticação inconsistente

**Prioridade:** alta para revisão de produção. **Evidências:** `.env`, `.env.example`, `src/auth.ts:117` e código instalado do NextAuth.

O `.env` define NEXTAUTH_URL local; o exemplo usa AUTH_URL local. No código instalado, AUTH_URL tem precedência sobre NEXTAUTH_URL na reconstrução da origem. Corrigir uma variável e deixar outra valor efetivo pode manter o erro.

A documentação oficial explica que no Auth.js v5 o host normalmente é inferido dos headers, e descreve configuração atrás de proxy e OAuth. Referência: [Auth.js — Deployment](https://authjs.dev/getting-started/deployment).

**Correção recomendada para esta produção:** conferir AUTH_URL e NEXTAUTH_URL no ambiente Production, evitando localhost. Se a aplicação mantiver origem canônica explícita, usar `https://barbeariajosecarlos-chi.vercel.app` como origem de produção e eliminar a configuração legada conflitante. Depois gerar novo deploy que use as alterações.

Também conferir escopos Preview e Development. Não copiar a origem de produção indiscriminadamente para previews, nem remover variáveis sem revisar o callback personalizado atual. Não alterar segredos por causa desta auditoria: o foco são origem e escopo.

### A3 — Callback de retorno sem validação no login do cliente

**Prioridade:** alta. **Arquivo:** `src/app/auth/login/page.tsx:11`, `:38` e `:65`.

Após login com credenciais, a página lê `callbackUrl` da query, faz ajustes por papel em alguns casos e executa `window.location.href = destination`. Não há validação geral de mesma origem/caminho interno nesse ponto.

**Consequência:** um callback absoluto de localhost ou outro site pode ser utilizado pelo navegador após sucesso. O callback absoluto de localhost observado em `/api/auth/signin` é um exemplo de valor que pode chegar à tela. A validação de `safeRedirect` no servidor não cobre automaticamente essa atribuição direta do cliente.

Não houve tentativa de autenticar ou explorar o fluxo. O achado resulta da leitura do código.

**Correção recomendada:** normalizar o retorno antes de navegar. Preferir caminho interno autorizado, preservando query válida; rejeitar origem externa, localhost em produção, URL protocol-relative e protocolos não HTTP(S). Reaproveitar a política de `safeRedirect` de forma adequada também no cliente, com origem correta, e conferir perfil antes de aceitar destino.

### A4 — Callback personalizado trata origem de forma incompleta

**Prioridade:** média. **Arquivo:** `src/auth.ts:117–130`; utilitário `src/core/utils/safe-redirect.ts`.

A lógica tenta evitar localhost, usando URL configurada, domínio de produção Vercel, domínio do deploy e fallback fixo. Pontos a revisar:

- `includes('localhost')` é comparação textual, sem validação de hostname. Não cobre todas as formas de loopback, como `127.0.0.1` e `[::1]`.
- VERCEL_PROJECT_PRODUCTION_URL vem antes de VERCEL_URL. Em preview, essa prioridade pode levar o usuário à produção. É risco de política de ambiente, não desvio observado nesta auditoria.
- O domínio de produção fixo funciona somente para aquela origem e precisa ser revisto se houver domínio próprio.
- `safeRedirect` limita a mesma origem, mas assume que a base fornecida é confiável. Base errada continua gerando destino errado.
- `trustHost: true` já está presente. Acrescentá-lo novamente, sozinho, não corrige AUTH_URL/NEXTAUTH_URL incorretos nem o callback direto do cliente.

**Correção recomendada:** definir uma única política explícita por ambiente, validar protocolo/hostname e separar origem de produção de preview. Manter proteção contra retorno externo e remover fallbacks contraditórios. Não substituir tudo por URLs de produção fixas em cada componente.

### A5 — Perda de filtros/query no retorno ao login

**Prioridade:** média. **Arquivo:** `src/proxy.ts:32`.

O Proxy salva somente `pathname` em callbackUrl. A consulta de `/atendente?data=2026-10-13` retornou callback `/atendente`, sem a data. O mesmo padrão afeta parâmetros de filtros de outras páginas protegidas.

**Correção recomendada:** preservar caminho e query interna validada. Evitar carregar parâmetros sensíveis para URLs de autenticação. Testar retorno à data/período/profissional selecionados, sem perder a verificação de permissão.

### A6 — Google ignora o destino original escolhido

**Prioridade:** média. **Arquivo:** `src/app/auth/login/page.tsx:78`.

O login Google usa callback fixo `/dashboard`, enquanto credenciais tenta usar callbackUrl recebido. Isso é um destino relativo, sem localhost literal, mas pode perder contexto de reserva/agenda.

**Correção recomendada:** definir retorno por papel e intenção de navegação usando destino validado. Conferir no provedor Google a URL autorizada de produção `https://barbeariajosecarlos-chi.vercel.app/api/auth/callback/google`, separada das URLs de desenvolvimento. Configuração do console Google não foi consultada.

### A7 — Cadastro preserva callback sem saneamento próprio

**Prioridade:** média. **Arquivo:** `src/app/auth/register/page.tsx:12`, `:44` e `:164`.

O cadastro lê callbackUrl e o transporta para login usando `encodeURIComponent`. A codificação é apropriada para query, mas não valida se o destino é permitido. Não há localhost literal nesses links; eles podem propagar um callback já contaminado até o login.

**Correção recomendada:** aplicar a mesma normalização de retorno em toda a jornada cadastro/login, sem perda de rascunho nem criação automática de reserva.

## 5. Inventário dos demais redirecionamentos

| Área/arquivo | Destinos atuais | Avaliação |
| --- | --- | --- |
| `src/app/page.tsx` | `/barber/dashboard`, `/admin/dashboard`, `/atendente` | Relativos; sem localhost literal. Desvios autenticados não testados |
| `src/app/dashboard/page.tsx` | Login e painel por papel; cliente vai à agenda | Relativos; entrada sem sessão interceptada pelo Proxy com erro confirmado |
| `src/app/agenda/page.tsx` | Login com callback agenda e áreas por papel | Relativos no arquivo; Proxy antecede e erra a origem no acesso público |
| `src/app/historico/page.tsx` | Login com callback histórico e áreas por papel | Mesmo diagnóstico da agenda |
| `src/app/barbeiro/agenda/page.tsx` | `/barber/agenda` | Alias legado relativo; sem sessão sofre erro antes de executar o alias |
| `src/components/BookingFlow.tsx:174` | `/auth/login?callbackUrl=/?action=agendar` | Relativo; sem localhost literal. Padronizar montagem/codificação e validar retorno |
| `src/components/SignOutButton.tsx:9` | Origem atual do navegador | Sem localhost literal quando acessado no domínio público; fluxo Auth.js ainda depende da origem correta |
| `src/components/ClientNavbar.tsx:83`, `:184` | Origem atual do navegador | Mesma avaliação |
| `src/components/admin/AdminNavbar.tsx:136`, `:284` | Origem atual do navegador | Mesma avaliação |
| `src/components/barber/BarberNavbar.tsx:473` | Origem atual do navegador | Mesma avaliação |
| `src/components/reception/ReceptionNavbar.tsx:288` | `/auth/login` | Callback relativo; validar integração Auth.js após corrigir origem |
| `src/components/lux/SideDrawerMenu.tsx:111` | `/auth/login` | Callback relativo; mesma dependência |

Logout exige sessão e não foi executado. Não classificar as linhas acima como redirecionamentos comprovadamente quebrados só porque usam Auth.js; documentá-las como superfícies a validar após correção comum.

### Endpoints existentes

- `/api/auth/[...nextauth]`: início de login foi testado e propagou callback localhost. Session, CSRF, login OAuth, callback e logout precisam de testes próprios; não foram executadas operações autenticadas.
- `/api/barbers/[id]/availability`: constrói URL apenas para ler parâmetros da requisição; não foi identificado destino localhost no handler.
- `/api/cron/check-notifications`: não é rota de navegação de usuário e não foi acionada nesta auditoria, para evitar efeitos de processamento.

Não foram identificadas regras de redirects/rewrites ou origem pública em `next.config.ts`. Não foi encontrado `vercel.json` na raiz consultada. Regras do painel Vercel, proxies externos e valores secretos da implantação não foram inspecionados.

## 6. Ocorrências de localhost que não são defeitos de navegação

| Local | Uso | Tratamento |
| --- | --- | --- |
| `.env` | NEXTAUTH_URL local | Correto para execução local; não reutilizar como origem de produção |
| `.env.example` | AUTH_URL local e banco local | Exemplo de desenvolvimento; separar instruções de produção |
| `.github/workflows/ci.yml:29` | AUTH_URL local em CI | Ambiente de testes; não trocar pelo domínio real sem necessidade |
| `.github/workflows/ci.yml:25–27` | PostgreSQL loopback de teste | Sem relação com retorno ao login |
| `README.md:13` | Abrir localhost no desenvolvimento | Instrução local legítima |
| `vitest.integration.config.ts:7–8` | Exigir banco local terminado em `_test` | Proteção de testes; preservar |
| `src/infra/db/prisma-client.ts:27` | Detectar conexão local do banco | Sem relação com origem HTTP de autenticação |
| `src/auth.ts` | Tentativa de detectar localhost no fallback | Já analisada em A4; não é link de navegação literal |

A busca em arquivos de ambiente foi limitada às variáveis de origem/autenticação. Segredos, senhas e URLs privadas não são necessários para documentar o defeito e não foram incluídos.

## 7. Ordem de correção recomendada

1. Conferir variáveis de URL no projeto Vercel e no deploy afetado: Production, Preview e Development separados. Identificar qual valor efetivo está sendo consumido.
2. Corrigir a origem de produção e eliminar conflito AUTH_URL/NEXTAUTH_URL. Publicar novo deploy com a configuração revisada.
3. Unificar origem confiável usada pelo Proxy e Auth.js, sem confiar cegamente na requisição já alterada ou em headers externos.
4. Validar callbackUrl no login/cadastro antes de navegação e preservar query interna autorizada.
5. Ajustar política de preview, callback Google e fallbacks de domínio.
6. Testar todas as páginas/ações de autenticação listadas, incluindo contas de cada papel e acesso negado.

A documentação oficial permite inferência de host em v5, mas este projeto também possui callback personalizado. Remover variáveis sem revisar essa interação não é garantia de correção. Escolher uma política coerente e verificá-la no domínio publicado.

## 8. Critérios de validação após implementação

| Cenário | Resultado esperado |
| --- | --- |
| Cada uma das 17 páginas protegidas, sem cookies | Login na origem pública correta; nenhum Location com loopback |
| Acesso `/atendente?data=...` | Retorno interno preserva parâmetros autorizados |
| `/api/auth/signin` | Login e callback coerentes com a origem pública |
| Credenciais com retorno interno válido | Destino autorizado, na origem correta |
| Callback absoluto localhost/loopback/site externo/protocol-relative | Rejeitado ou substituído por destino interno seguro |
| Google e cadastro | Retorno consistente e sem perda indevida de rascunho |
| Sessão expirada | Login público correto, sem criação automática de reserva |
| Usuário com papel inadequado | Desvio interno correto, sem ciclo ou origem local |
| Logout de cada menu | Permanece em domínio autorizado e encerra sessão corretamente |
| Preview e domínio próprio, quando existentes | Política definida; sem salto involuntário a produção |
| Execução local | Continua funcional no ambiente de desenvolvimento |

Há testes da política `safeRedirect` em `src/core/utils/policies.test.ts`; eles não comprovam comportamento do Proxy nem a navegação direta do login. Acrescentar testes desses caminhos, mais verificações HTTP na implantação corrigida. Não é necessário autenticar usuários reais para repetir a matriz pública de status/Location.

## 9. Pendências de confirmação externa

- Valor efetivo de AUTH_URL/NEXTAUTH_URL e sua origem no deploy Vercel.
- Ambiente e versão/commit da implantação afetada em relação ao código local.
- Configuração OAuth Google em produção e preview.
- Regras adicionais de domínio/redirecionamento no painel Vercel.
- Comportamento autenticado por papel, logout e expiração de sessão.

O defeito público está confirmado. A causa mais provável é uma origem de autenticação/configuração local aplicada à requisição de produção, mecanismo comprovado na biblioteca instalada. Atribuir a um valor específico do painel Vercel exige a conferência externa acima.
