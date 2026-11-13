# Rotina do almoxarifado com o app (Fase 1)

Documento para o Mário aprovar. Ele muda os POPs 02, 03 e 06 e os prompts dos agentes SAIDA, EQUIP e FECHAMENTO.

## 1. O dia do Jean

| Hora | Antes (papel + 15h30) | Com o app |
|---|---|---|
| Alguém retira material | Escreve no caderno, a pessoa assina, foto no fim do dia | Abre o app › **Saída** › quem › itens › assinatura (tela **ou** linha do caderno) › **SIM**. Pronto, já está na planilha |
| Alguém devolve | Linha DEV no caderno | App › **Devolução**: o app mostra o que a pessoa tem em mãos. Danificado: toca em "Danificado / usado" |
| Ferramenta | Folha de Ferramentas do caderno | App › **Ferramentas** › toca no item › **Retirar** ou **Devolver** |
| "Tem joelho de 25?" | Liga para alguém ou vai olhar | App › **Consultar saldo** |
| Item que não acha na lista | Escreve ITEM NOVO | App › **Não achei o item** (vira pendência). **Não inventa código.** |
| 15h30 | Fotos de **tudo** no Claude: ENTRADA, SAIDA, EQUIPAMENTOS | Só **notas fiscais (ENTRADA)**, **transferências** e as **pendências** do app (botão 📋 Hoje) |
| Fechamento | FECHAMENTO | Igual |

### Assinatura: as duas formas valem

- **Na tela (✍️):** a pessoa assina com o dedo no celular do Jean. O número é `APP-00001`, sequencial e sem buraco. A imagem fica no Drive, em `REQUISIÇÕES/ASSINATURAS APP/aaaa-mm/`.
- **No caderno (📒):** a pessoa assina a Folha do Caderno como hoje. No app, o Jean confirma a **folha** e a **linha**, que o app já sugere. O número gravado é o mesmo que o agente usaria (`CAD-FFF-LL` / `CEQ-FFF-LL`). A foto da folha continua indo para o grupo no fim do dia, como prova da assinatura.

> Enquanto não houver tablet ou celular da obra, a forma do caderno pode ser a principal. Quando houver aparelho, a assinatura na tela substitui o papel e o caderno é encerrado. Esse é o argumento para pedir o aparelho.

## 2. Texto para acrescentar nos prompts dos agentes

### PROMPT SAIDA (seção nova 5-E)

> **5-E. LANÇAMENTOS FEITOS PELO APP.** O almoxarife também lança saídas e devoluções direto pelo App do Almoxarifado. Essas linhas têm na coluna B um número `APP-nnnnn`, ou `CAD-FFF-LL` com observação "lançado pelo app". Antes de gravar uma linha da Folha do Caderno, procure o `CAD-FFF-LL` nas abas Saidas e Entradas, como você já faz. **Se já existe, foi lançado pelo app: não grave de novo** e diga ao Jean "já estava lançado pelo app". As pendências do app ficam na planilha *App Almoxarifado - Registro*, aba Pendencias. Ao resolver uma (POP-04 ou POP-08), lance pelo procedimento normal e escreva RESOLVIDA na coluna G da pendência (essa é a única alteração permitida naquela planilha).

### PROMPT EQUIP (seção nova 5-B)

> **5-B. LANÇAMENTOS FEITOS PELO APP.** Retiradas e devoluções também chegam pelo App do Almoxarifado, com observação `app APP-nnnnn` ou `caderno, folha FFF, CEQ-FFF-LL · lançado pelo app`. Antes de gravar uma linha da folha, procure o `CEQ-FFF-LL` na coluna H da aba Movimentacao. Se já existe, não grave de novo. Item de lote que voltou com defeito aparece nas Pendencias do Registro ("FERRAMENTA COM DEFEITO"). Proponha a manutenção e marque RESOLVIDA.

### PROMPT FECHAMENTO (item novo na lista "O que conferir")

> **10. App do Almoxarifado.** Leia a planilha *App Almoxarifado - Registro*:
> - aba **Log**: quantos lançamentos o app fez no período, por tipo;
> - aba **Pendencias**: as que estão ABERTA entram nos alertas, com quem resolve.
>
> Na numeração, a sequência `APP-nnnnn` não pode ter buraco. Na seção "Transição", conte as saídas do app junto com as da requisição: são lançamentos com assinatura conferida.

### INSTRUÇÕES DO PROJETO (linha nova em "ONDE ESTÃO AS COISAS")

> Registro do App: planilha *App Almoxarifado - Registro* (pasta do almoxarifado), abas Log e Pendencias.

## 3. Medir se o app vale o investimento (para o pedido do aparelho)

Anotar por 2 semanas, comparando antes e depois:

1. **Tempo do lote das 15h30.** Esperado: cair bastante, porque saída, devolução e ferramenta já estão lançadas.
2. **Linhas com CONFERIR por letra ilegível.** Com o app, deve ficar perto de zero.
3. **Atraso do saldo.** Antes, até 1 dia; com o app, minutos.
4. **Ferramenta "sumida".** O botão 📋 Hoje mostra quem está com o quê, desde quando.
5. **Quantas saídas foram assinadas na tela e quantas no caderno.** Mostra quanto do papel ainda depende de ter um segundo aparelho.

O Log do app já registra tudo isso: data e hora, tipo, número, pessoa e forma de assinatura.

## 4. Próximas fases

- **Fase 2:** Entrada de nota fiscal pelo app. Foto da NF, leitura por IA, conferência item a item e o mesmo quadro do POP-01. Também transferência entre obras.
- **Fase 3:** Contagem do inventário pelo celular, com QR code nas prateleiras e nas etiquetas EQP, painel para o Mário e fechamento automático no WhatsApp.
