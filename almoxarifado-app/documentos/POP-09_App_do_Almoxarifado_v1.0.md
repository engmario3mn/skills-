# POP-09 · App do Almoxarifado (lançamento na hora, pelo celular)

Obra Escola de Bombeiros · Jacarecanga, Fortaleza/CE · 3 MN Instalações · Versão 1.0 · 15/11/2026

**Quando:** toda vez que sai material, volta material, ou uma ferramenta é retirada ou devolvida, e o celular do almoxarife está à mão.

**Quem:** Jean (almoxarife) opera o app. Os outros só consultam as planilhas. Apoio: Julio e Edton (suprimentos). Responsável: Mário.

**Objetivo:** a saída, a devolução e o empréstimo entram na planilha na hora, sem esperar o lote das 15h30, com as mesmas regras dos POP-02, POP-03 e POP-06.

**Este POP complementa os POP-02, 03 e 06.** O que ele não muda continua valendo como está escrito lá. Onde houver diferença, para lançamento feito pelo app vale este POP.

## O que o app faz e o que não faz

| Pelo app (na hora) | Continua só com os agentes (15h30) |
|---|---|
| Saída de material (POP-02) | Nota fiscal · agente ENTRADA (POP-01) |
| Devolução de campo (POP-03) | Transferência entre obras (POP-05) |
| Retirada e devolução de ferramenta (POP-06) | Ajuste de saldo · AJUSTE (POP-08) |
| Consulta de saldo | Item novo no Cadastro (POP-04) |
| Anotar pendência ("Não achei o item") | Contagem, inventário e fechamento |

## Fase de teste

Enquanto aparecer a faixa roxa "MODO TESTE" no alto da tela, o app grava em cópias das planilhas. Nessa fase **nada do que é lançado no app vale**: o caderno e o lote das 15h30 continuam exatamente como antes. O Mário avisa quando o app passar a valer.

## Passo a passo (igual para saída, devolução e ferramenta)

1. Jean toca no botão: **Saída de material**, **Devolução** ou **Ferramentas**.
2. Escolhe ou escreve o nome de quem retira ou devolve.
3. Escolhe o item: digita um pedaço do nome ("joelho 25") ou toca no tipo de material e na peça. O código vem do Cadastro. Jean nunca digita nem inventa código.
4. Confere a quantidade. Se souber, escolhe o setor.
5. **Assinatura** (uma das duas, as duas valem):
   - **Na tela:** quem retira ou devolve assina com o dedo no celular. O lançamento recebe o número APP-00001, APP-00002... A imagem da assinatura fica guardada no Drive.
   - **No caderno:** quem retira ou devolve assina na linha da Folha do Caderno, como no POP-02 e no POP-06. No app, Jean confere a folha e a linha que o app mostra. O número gravado é o da linha: CAD-folha-linha (material) ou CEQ-folha-linha (ferramenta).
6. O app mostra o quadro **"O QUE VOU FAZER"**. Jean lê e toca em **SIM, gravar**. Se algo estiver errado, toca em **NÃO, voltar e mudar**.
7. Aparece **"Gravado"** com o número. Se a assinatura foi no caderno, Jean escreve na linha da folha "Lançado / data".

## Regras da assinatura

- Sem assinatura (na tela ou no caderno), o app não grava. Não há exceção de urgência.
- Quem assina é quem retira ou devolve, nunca o Jean no lugar da pessoa.
- Assinatura no caderno: a folha continua sendo fotografada no fim do dia e enviada ao grupo, como hoje. Ela é a prova da assinatura.
- Um lançamento é feito uma vez só: pelo app **ou** pelo agente, nunca pelos dois. Linha do caderno que já foi lançada pelo app é recusada se alguém tentar lançar de novo.
- Autorização do Mestre de Obra e do Engenheiro Residente: na Etapa 1 (caderno) não é exigida, como já diz o POP-02. Quando a obra passar para as Etapas 2 e 3 (requisição com autorização), este POP será revisto antes.

## O que o app confere sozinho

- **Saldo.** Antes do inventário (pré-inventário), saldo negativo não bloqueia: o app grava e anota "pré-inventário, saldo n". Depois que o Mário avisar que o inventário foi gravado, saída que deixa o saldo negativo só é gravada depois de o Jean falar com o Julio ou o Edton e marcar isso na tela.
- **Devolução.** O app mostra o que a pessoa tem em mãos. Não aceita devolver mais do que saiu. Se não achar a saída, grava com "origem não localizada" e avisa.
- **Material danificado ou usado.** Jean toca em "Danificado / usado". O item não entra no saldo e vai para a lista de pendências, para o POP-08.
- **Ferramenta.** Não sai se já está com outra pessoa, se está "Em manutenção" ou "Baixado", ou se o lote não tem quantidade. Voltou com defeito ou quebrada: Jean separa o item e avisa o Julio, o Edton e o Mário no mesmo dia.
- **Data.** Não aceita data no futuro.

## Quando não achar o item

Jean toca em **"Não achei o item"** e escreve a descrição como a pessoa chama, a quantidade e quem retirou. A pessoa assina a linha no caderno. No lote das 15h30, o agente SAIDA cadastra o item (POP-04) e lança. Nunca inventar código.

## Sem sinal

Se o celular estiver sem sinal, o lançamento confirmado fica guardado no celular e sobe sozinho quando o sinal voltar. Uma faixa no alto mostra quantos estão esperando. Jean pode continuar trabalhando. Antes de ir embora, Jean confere que a faixa sumiu.

Se o app não abrir ou der erro: lançar no caderno e pelo agente, como nos POP-02 e POP-06, e avisar o Mário.

## Lote das 15h30 com o app

1. Jean abre o botão **"Hoje"** no app e vê: o que foi lançado, as ferramentas fora e as pendências abertas.
2. No projeto "Almoxarifado" no Claude, Jean chama os agentes só para o que o app não fez: ENTRADA (notas), SAIDA (transferências, pendências do app e linhas do caderno que não passaram pelo app) e EQUIPAMENTOS (pendências de ferramenta com defeito).
3. O agente resolve cada pendência do app pelo procedimento normal e, com o SIM do Jean, escreve RESOLVIDA na pendência. É a única célula que um agente pode alterar; todo o resto continua sendo só linha nova.
4. FECHAMENTO, como no POP-07. O fechamento passa a mostrar também os lançamentos do app e as pendências abertas.

## Onde fica cada coisa

| O quê | Onde |
|---|---|
| Saídas do app | Planilha de Estoque, aba Saidas |
| Devoluções do app | Planilha de Estoque, aba Entradas (fornecedor DEVOLUÇÃO DE CAMPO) |
| Ferramentas | Planilha de Ferramentas e Equipamentos, abas Movimentacao e Equipamentos |
| Histórico do app e pendências | Planilha "App Almoxarifado - Registro" (abas Log e Pendencias), na pasta do almoxarifado |
| Assinaturas feitas na tela | Pasta REQUISIÇÕES, subpasta ASSINATURAS APP, uma subpasta por mês |
| Código do app e guia de instalação | Drive, pasta Claude Code, subpasta App Almoxarifado Bombeiros |

## Regras fixas

- Nada é gravado sem o SIM na tela "O QUE VOU FAZER".
- O app só acrescenta linhas. Nunca apaga nem corrige lançamento. Erro se corrige com lançamento novo, pelo app ou pelo agente.
- A quantidade registrada é sempre a entregue.
- Um lançamento, uma vez só: app ou agente.
- Só o Jean opera o app. O PIN do app não é passado a outras pessoas.
- Nota fiscal, transferência, ajuste e contagem não passam pelo app.

&nbsp;

| Mário Marques de Medeiros Neto | Jean | Julio / Edton |
|---|---|---|
| Aprovação | Almoxarife (ciente) | Suprimentos (ciente) |
