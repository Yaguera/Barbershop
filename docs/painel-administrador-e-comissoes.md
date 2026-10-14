# Painel analítico e configuração de comissões

## Funcionalidades

O painel distingue recebimentos atualmente confirmados no caixa, serviços concluídos, serviços sem recebimento registrado e a parcela da barbearia antes das despesas. A evolução financeira alterna entre data do caixa e data do atendimento. Barras e a lista de datas abrem atendimentos com paginação de 30 itens, mantendo período e profissional. Os totais do detalhe abrangem todos os registros filtrados, não apenas a página visível.

O ranking de barbeiros ordena por atendimentos, valor dos serviços ou parte da barbearia. Cada profissional apresenta comissão, percentual efetivo e divisão financeira. Serviços e clientes também abrem seus atendimentos. Recorrência significa dias distintos com serviço concluído no intervalo; dois serviços no mesmo dia contam uma visita. Contatos da recepção e usuários cadastrados não são automaticamente mesclados por nome.

## Como alterar a comissão

No painel do administrador, acessar **Configurar comissões**. Cada serviço apresenta seu percentual atual, preço e prévia da divisão. Digitar de 0 a 100%, com até duas casas decimais, ou selecionar **Usar 50%**; clicar **Salvar** no serviço desejado. Serviços existentes mantêm suas taxas até o administrador salvar uma alteração. O cadastro de novos serviços passa a sugerir 50%.

Exemplo: serviço de R$ 30,00 a 50% gera R$ 15,00 de comissão e R$ 15,00 para a barbearia. A 40%, os valores são R$ 12,00 e R$ 18,00. A diferença sempre é calculada subtraindo a comissão em centavos, preservando a soma mesmo quando há arredondamento.

A configuração é por serviço e se aplica igualmente aos profissionais que o executarem. Não há taxa individual por barbeiro nesta entrega. Essa escolha aproveita `Service.commissionRate`, evitando duas fontes concorrentes para a taxa.

## Preservação do histórico

`PrismaAppointmentRepository.createTransactional` já captura `priceCents` e `commissionCents` na criação do agendamento. Os relatórios utilizam esses valores, sem recalcular o histórico a partir da comissão atual do serviço. Uma mudança também não altera reservas futuras que já tenham sido criadas; vale para novos agendamentos. Reagendamentos preservam a divisão original.

O painel inicial e as métricas do barbeiro exibem comissão e parte da barbearia, incluindo o percentual efetivo do intervalo. Nas métricas, a divisão por serviço separa valores registrados diferentes, inclusive quando houve mudança de taxa. O percentual agregado é ponderado pelos valores dos serviços, não uma média simples das taxas.

## Limites financeiros

Comissão calculada não é comprovante de repasse ao barbeiro. A parte da barbearia não é lucro líquido: o projeto não desconta aluguel, materiais e outras despesas. Recebido no caixa depende da confirmação de pagamento, sem usar o valor dos serviços como substituto quando o caixa é zero. A visão segue o estado atual dos recebimentos; não constitui um livro contábil imutável de estornos e reconfirmações.

O fluxo de pagamentos e o banco em produção permanecem preservados. O calendário foi implementado posteriormente conforme `docs/proposta-calendario-administrador.md`, com contextos separados de Agenda e Caixa.
