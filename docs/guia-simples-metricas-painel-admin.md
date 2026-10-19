# Guia Simples do Painel do Administrador: Entendendo Cada Número sem "Economês"

Este documento foi feito para traduzir todos os termos técnicos do **Painel Administrativo (`/admin/dashboard`)** e do **Módulo Financeiro (`/admin/financeiro`)** para a linguagem real do dia a dia de uma barbearia.

Você não precisa ser contador nem analista de dados para entender o seu negócio. Abaixo, explicamos **o que cada termo significa na prática**, **por que ele existe** e **um exemplo real de barbearia** para cada um.

---

## 1. A Grande Diferença: "Produção (Competência)" vs. "Caixa"

Antes de ver os cartões, existe um único conceito que separa uma barbearia organizada de uma barbearia que mistura tudo: **fazer o corte na cadeira não é a mesma coisa que o dinheiro já estar na conta**.

| Termo no Sistema | Tradução Simples | Exemplo Real na Barbearia |
| :--- | :--- | :--- |
| **Serviços Realizados** *(ou Produção / Competência)* | **"Quanto trabalho nós entregamos na cadeira"** | O barbeiro cortou o cabelo do João hoje (R\$ 50). Esse trabalho foi feito hoje, mesmo que o João tenha esquecido a carteira e vá pagar amanhã. |
| **Recebido no Caixa** *(ou Regime de Caixa)* | **"Quanto dinheiro entrou de verdade no bolso/banco"** | É o dinheiro vivo, Pix ou Cartão que a recepção confirmou como recebido. Se não clicou em "Confirmar Pagamento", não entrou no caixa. |
| **Concluídos sem Recebimento** *(ou Pendências de Caixa)* | **"Cortes já feitos que ainda não foram dados como pagos"** | O barbeiro finalizou o atendimento, mas a recepção esqueceu de dar baixa no pagamento ou o cliente ficou devendo ("fiado"). |

---

## 2. Dicionário Financeiro: Explicando os Termos "Difíceis"

### 2.1. Resultado Gerencial (ou Cascata de Competência)
* **Em bom português:** **"A barbearia deu lucro ou prejuízo pelo trabalho feito neste mês?"**
* **Por que tem esse nome?** Em contabilidade, "Resultado" significa simplesmente **Lucro ou Prejuízo**. Ele olha para tudo que foi produzido no mês e desconta as comissões dos barbeiros e as contas daquele mês (aluguel, luz, produtos), independentemente do dia exato em que você pagou o boleto.
* **Como funciona passo a passo (A "Cascata"):**
  1. **(+) Produção Realizada Bruta:** Tudo que os barbeiros cortaram no mês (ex.: `R$ 10.000`).
  2. **(-) Estornos e Descontos:** Cortes que precisaram ter o valor devolvido ou abatido (ex.: `- R$ 100`).
  3. **(=) Receita Líquida de Produção:** O que sobrou válido dos cortes (`R$ 9.900`).
  4. **(-) Comissão Reconhecida dos Barbeiros:** A parte que pertence aos barbeiros por esses cortes (ex.: 50% = `- R$ 4.950`).
  5. **(=) Contribuição da Barbearia (Parte da Casa):** O que sobra para o dono pagar as contas da loja (`R$ 4.950`).
  6. **(-) Despesas Operacionais do Mês:** Aluguel, energia, internet, café, pomadas, sistema (ex.: `- R$ 2.000`).
  7. **(=) Resultado Gerencial (Lucro Líquido da Operação):** Quanto a barbearia **lucrou de verdade** no mês (`R$ 2.950`).

---

### 2.2. Fluxo Líquido de Caixa do Período
* **Em bom português:** **"Sobrou ou faltou dinheiro vivo na conta bancária/gaveta neste período?"**
* **Qual a diferença para o Resultado Gerencial?**
  * O **Resultado Gerencial** pergunta: *"O mês de Outubro deu lucro?"*
  * O **Fluxo Líquido de Caixa** pergunta: *"Entrou mais dinheiro do que saiu da conta bancária neste período?"*
* **Exemplo prático de como os dois podem ser diferentes:**
  Imagine que em Outubro os barbeiros cortaram `R$ 10.000` e todos os clientes pagaram em Pix (`R$ 10.000` entraram). Só que você ainda **não transferiu** a comissão dos barbeiros (vai pagar só no dia 5 de Novembro) e ainda **não pagou** a conta de luz que vence dia 10.
  * No **Fluxo Líquido de Caixa**, parece que você tem `R$ 10.000` sobrando na conta!
  * Mas no **Resultado Gerencial**, o sistema te avisa: *"Calma! Desses R\$ 10.000, R\$ 5.000 são dos barbeiros e R\$ 2.000 são das contas do mês. O seu lucro real é R\$ 3.000."*
  * **Fórmula do Fluxo Líquido de Caixa:**
    $$\text{Dinheiro Recebido dos Clientes} - \text{Reembolsos em Dinheiro} - \text{Contas Pagas} - \text{Comissões Já Transferidas aos Barbeiros}$$

---

### 2.3. Passivo Elegível de Comissão (vs. Comissão Reconhecida vs. Comissão Paga)
Na tela do Financeiro, dividimos a comissão do barbeiro em 4 palavras para você **nunca pagar comissão duas vezes** e **nunca pagar comissão de um corte que o cliente deu calote**:

| Termo na Tela | Tradução Simples ("Sem Economês") | Exemplo Prático (Corte de R\$ 100 com 50% de comissão) |
| :--- | :--- | :--- |
| **1. Comissão Reconhecida** | **"Quanto o barbeiro gerou de comissão na cadeira"** | O barbeiro terminou o corte de R\$ 100. Ele gerou R\$ 50 de comissão. |
| **2. Passivo Elegível** *(Comissão Elegível)* | **"Comissão liberada para pagar (porque o cliente já pagou)"** | *"Passivo"* = dívida com o barbeiro. *"Elegível"* = liberada. Ou seja: o cliente **já pagou** os R\$ 100 no caixa, então esses R\$ 50 de comissão estão **liberados para você transferir para o barbeiro**. (Se o cliente ainda não pagou o corte, a comissão fica bloqueada até o cliente pagar). |
| **3. Comissão Paga** *(Liquidada)* | **"Quanto você já transferiu para o barbeiro"** | Você fez o Pix de R\$ 30 de adiantamento ou fechamento para o barbeiro e registrou no sistema. |
| **4. Saldo Elegível a Pagar** | **"Quanto falta você depositar na conta do barbeiro hoje"** | Dos R\$ 50 liberados, você já pagou R\$ 30. Então ainda deve **R\$ 20** para ele. |

---

### 2.4. Taxa de Recebimento da Coorte (e o que significa a palavra "Coorte")
* **O que significa a palavra "Coorte"?**
  "Coorte" (do inglês *Cohort*) significa simplesmente **"um grupo fechado de pessoas ou de cortes de um mesmo período"**.
  Quando dizemos *"a coorte de Outubro"*, estamos falando **apenas dos cortes que aconteceram na cadeira em Outubro**.
* **Em bom português (Taxa de Recebimento da Coorte):**
  **"De todos os cortes feitos na cadeira neste período, quantos por cento já foram pagos no caixa?"**
* **Exemplo prático:**
  * Hoje foram feitos **10 cortes de R\$ 50** na cadeira (Total produzido = `R$ 500`).
  * Desses 10 clientes, **9 já pagaram** na recepção (`R$ 450`) e **1 cliente saiu sem a recepção dar baixa** (`R$ 50` pendente).
  * A **Taxa de Recebimento da Coorte** é de **90%** (`R$ 450` recebidos de `R$ 500` cortados).
* **Para que serve?** O ideal é que esse número esteja sempre em **100%**. Se estiver em **85%**, significa que **15% dos cortes concluídos pelos barbeiros ficaram sem baixa de pagamento na recepção**.

---

### 2.5. Aging Financeiro (Vencimentos em Duas Séries)
* **Em bom português:** **"Quais contas ou recebimentos estão atrasados e há quantos dias?"**
* **Por que tem esse nome?** *Aging* significa "envelhecimento" da dívida (1 a 7 dias de atraso, 8 a 30 dias, mais de 30 dias).
* **As duas listas que o sistema mostra:**
  1. **Série A — Cortes sem baixa no caixa (Recebíveis de Clientes):** Mostra os cortes concluídos que ninguém deu baixa no pagamento, separados por tempo de atraso (ex.: há 3 dias, há 15 dias, há mais de 30 dias).
  2. **Série B — Contas da Barbearia a Pagar (Despesas):** Mostra os boletos/contas da loja que vão vencer nos próximos 7 dias ou que já estão vencidos.

---

## 3. Dicionário de Operação, Agenda e Clientes (Fase P3)

### 3.1. Retenção por Coorte em 30 Dias (Coorte Madura vs. Coorte em Maturação)
* **Em bom português:** **"Dos clientes que vieram cortar o cabelo em determinada semana/mês, quantos voltaram para cortar de novo em até 30 dias?"**
* **Por que o sistema separa "Coorte Madura" de "Coorte em Maturação (Imatura)"?**
  Imagine que o cliente Lucas cortou o cabelo **ontem**. Faz sentido cobrar que ele já tenha voltado para cortar o cabelo hoje? **Claro que não!** Ninguém corta o cabelo dois dias seguidos. É preciso esperar pelo menos **30 dias** para saber se o Lucas voltou ou sumiu.
  * **Coorte Madura (Consolidada):** São os clientes que vieram **há mais de 30 dias**. Como já se passaram 30 dias inteiros desde a visita deles, já sabemos com certeza quem voltou e quem não voltou. **Só eles entram na nota oficial de retorno da barbearia.**
  * **Coorte em Maturação (Janela Aberta):** São os clientes que vieram **há menos de 30 dias** (por exemplo, na semana passada). Eles ainda estão dentro do prazo de 30 dias para voltar, então o sistema mostra separado para não derrubar injustamente a sua média!

---

### 3.2. Capacidade Contratada vs. Disponibilidade Líquida vs. Ocupação Real
* **Em bom português:** **"Quanto tempo da agenda dos barbeiros foi realmente preenchido com clientes?"**

| Termo no Painel | O que significa na prática | Exemplo de 1 dia de um barbeiro |
| :--- | :--- | :--- |
| **Capacidade Contratada** | O horário padrão de abertura ao fechamento do barbeiro. | Das 09h às 19h = **10 horas (600 min)**. |
| **Exceções / Bloqueios / Pausas** | Horário de almoço, saída para médico, folga ou feriado cadastrados. | 1 hora de almoço + 1 hora no dentista = **2 horas (120 min)**. |
| **Disponibilidade Líquida** | O tempo em que o barbeiro estava **realmente disponível para atender**. | 10h contratadas menos 2h de pausa = **8 horas disponíveis (480 min)**. |
| **Ocupação Real (%)** | Dos minutos em que o barbeiro estava disponível, quantos % ele passou cortando cabelo. | Se ele atendeu clientes durante **6 horas** das **8 horas disponíveis**, a ocupação real dele foi de **75%**. |
| **Ociosidade Líquida** | Tempo em que o barbeiro estava na loja pronto para atender, mas a cadeira ficou vazia. | Das 8 horas disponíveis, **2 horas** ficaram sem cliente (**25% ocioso**). |

---

### 3.3. Minutos Cancelados Reaproveitados vs. Efetivamente Perdidos
* **Em bom português:** **"Quando um cliente desmarcou, nós perdemos aquele horário ou conseguimos encaixar outra pessoa no lugar?"**
* **Exemplo prático:**
  * O Pedro tinha um corte marcado das **14:00 às 15:00** (60 minutos), mas cancelou de manhã.
  * Às 11:00, o Marcos ligou no WhatsApp e a recepcionista agendou o Marcos das **14:00 às 14:40** (40 minutos) com o mesmo barbeiro.
  * **Minutos Reaproveitados (Recuperados):** **40 minutos** (você salvou esse tempo!).
  * **Minutos Efetivamente Perdidos:** Apenas **20 minutos** ficaram realmente vazios.

---

### 3.4. Vínculo Canônico de Identidade de Clientes
* **Em bom português:** **"Juntar o cadastro do cliente do WhatsApp/Balcão com a conta que ele criou no site, sem misturar clientes com o mesmo nome."**
* **Por que existe?**
  Muitas vezes o cliente "João Silva" agenda a primeira vez pelo WhatsApp (a recepcionista cria um *Contato*). No mês seguinte, esse mesmo João Silva entra no site e cria uma conta com e-mail e senha (*Usuário Cadastrado*).
  * O sistema **nunca junta sozinho** dois "João Silva" porque podem ser duas pessoas diferentes.
  * Quando você (administrador) confirma no painel que o contato do balcão e a conta do site são a **mesma pessoa** (pelo telefone verificável), o sistema cria esse **Vínculo Canônico**: a partir daí, todas as visitas dele no WhatsApp e no site passam a contar como **um único cliente fiel**, sem duplicar!

---

## 4. Dicionário de Governança, Funil e Projeção (Fase P4)

### 4.1. Funil Digital de Agendamento Online (4 Etapas)
* **Em bom português:** **"De todas as pessoas que abriram a tela de agendar no site/celular, quantas foram até o fim e realmente cortaram o cabelo?"**
* Funciona como um funil de vendas em 4 passos:
  1. **Jornada Iniciada:** Quantas pessoas abriram a página de agendamento e escolheram um serviço.
  2. **Profissional/Horário Selecionado:** Quantas escolheram o barbeiro, o dia e a hora.
  3. **Agendamento Confirmado:** Quantas finalizaram o agendamento.
  4. **Atendimento Concluído:** Quantas realmente apareceram na barbearia e fizeram o corte.
* **Para que serve?** Se 100 pessoas começam a agendar, mas só 20 confirmam, você descobre onde elas estão desistindo (por exemplo, falta de horários livres na agenda).

---

### 4.2. Piso Garantido vs. Projeção Linear de Fechamento do Mês
* **Em bom português:** **"Se o mês continuar no ritmo atual, com quanto dinheiro vamos fechar o mês no dia 30?"**
* **Piso Garantido (Observado + Agendado):** É a soma do que **já foi cortado do dia 1 até hoje** + os agendamentos que **já estão marcados na agenda para o resto do mês**. É o mínimo esperado se os agendados comparecerem.
* **Projeção Linear pelo Ritmo Diário:**
  * Exemplo: Estamos no **dia 10** de um mês de **30 dias**. Nesses 10 primeiros dias, a barbearia já produziu **R\$ 5.000** (média de **R\$ 500 por dia**).
  * Mantendo esse ritmo de R\$ 500 por dia durante os 30 dias do mês, a **Projeção Linear** estima que você fechará o mês com **R\$ 15.000**.

---

### 4.3. Comparação Temporal Equivalente (MTD / YoY)
* **Em bom português:** **"Comparar maçãs com maçãs: os primeiros 15 dias deste mês contra os primeiros 15 dias do mês passado."**
* **Por que isso é importante?**
  Se hoje é dia **10 de Outubro** e você faturou `R$ 4.000`, seria um erro comparar `R$ 4.000` (10 dias) contra os `R$ 12.000` do mês inteiro de Setembro (30 dias) — pareceria que sua barbearia caiu 67%!
  Por isso, quando o mês ainda não acabou, o sistema compara automaticamente **os dias que já passaram deste mês (1 a 10 de Outubro)** contra **exatamente a mesma quantidade de dias do mês anterior (1 a 10 de Setembro)**.

---

### 4.4. Exportação CSV Segura (Proteção contra Injeção de Fórmula)
* **Em bom português:** **"Baixar a planilha para abrir no Excel com total segurança."**
* **O que faz?** Gera um arquivo `.csv` compatível com o Excel em português (separado por ponto e vírgula `;` e com acentos funcionando perfeitamente) e bloqueia códigos maliciosos caso alguém tenha digitado sinais de fórmula (`=`, `+`, `-`, `@`) no nome de um cliente ou observação.

---

## 5. Resumo Rápido de Bolso (Cola Rápida para o Dono da Barbearia)

Sempre que abrir o painel, faça estas **5 perguntas rápidas**:

1. **Alguém esqueceu de dar baixa no caixa?**
   👉 Olhe para **"Concluídos sem recebimento"** e **"Taxa da Coorte"**. Se "Concluídos sem recebimento" for maior que `R$ 0,00`, clique nele para ver quais cortes estão sem pagamento confirmado.
2. **A operação deste mês está dando lucro?**
   👉 Em `/admin/financeiro`, olhe o último número da coluna **"Cascata de Competência (Resultado Gerencial)"**.
3. **Quanto eu já posso transferir de comissão para os barbeiros sem tirar dinheiro de cortes não pagos?**
   👉 Em `/admin/financeiro`, olhe a tabela de comissões na coluna **"Saldo Elegível a Pagar"**.
4. **Meus barbeiros estão com a agenda cheia ou ficando parados?**
   👉 No final do `/admin/dashboard`, olhe a **"Taxa de Ocupação Líquida"** e o **"Mapa de Calor (Dia × Hora)"** para ver quais horários da semana ficam vazios (para criar promoções nesses dias).
5. **Os clientes novos estão voltando no mês seguinte?**
   👉 Olhe a **"Taxa de Retorno em 30 Dias (Coorte Madura)"**. Quanto mais alta, mais fiéis estão os clientes!
