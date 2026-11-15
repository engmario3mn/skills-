# App do Almoxarifado · Obra Escola de Bombeiros · 3 MN

App de celular para o almoxarife lançar **na hora** a saída, a devolução e o empréstimo de ferramentas. Ele grava direto nas **mesmas planilhas** que os agentes do Claude já usam. Nada muda para quem só consulta as planilhas.

**Fase 1 (esta versão):**

| Botão | POP | Onde grava |
|---|---|---|
| ➖ Saída de material | POP-02 | Estoque › aba **Saidas** |
| ↩️ Devolução | POP-03 | Estoque › aba **Entradas** (fornecedor DEVOLUÇÃO DE CAMPO) |
| 🔧 Ferramentas (retirar / devolver) | POP-06 | Ferramentas › abas **Movimentacao** e **Equipamentos** |
| 🔍 Consultar saldo | só leitura | aba Estoque |
| ❓ Não achei o item | POP-04 | Registro › Pendencias (resolvido no lote das 15h30) |
| 📋 Hoje | só leitura | lançamentos do dia, ferramentas fora, pendências |

Ficam com os agentes do Claude, como hoje: **nota fiscal (ENTRADA)**, **transferência**, **ajuste (POP-08)**, **contagem** e **fechamento**.

## Regras que o app segue (iguais às dos agentes)

- **Nada é gravado sem confirmação.** A última tela é o quadro "O QUE VOU FAZER" com **SIM, gravar** / **NÃO, voltar**.
- **Só acrescenta linhas.** Nunca apaga nem sobrescreve. Não escreve nas colunas automáticas (Descrição, Valor total, Equipamento).
- **Não aceita código inventado.** Item que não está no Cadastro vira pendência para o POP-04.
- **Duas formas de assinatura:**
  - ✍️ **Na tela:** quem retira assina com o dedo. O número é `APP-00001`, `APP-00002`… e a imagem da assinatura vai para o Drive (pasta *ASSINATURAS APP*, uma subpasta por mês).
  - 📒 **No caderno:** a pessoa assina a Folha do Caderno como hoje, e o app grava com o número da linha (`CAD-012-03` para material, `CEQ-012-03` para ferramenta). O app sugere a próxima linha e vira a folha depois da linha 12. **Linha já lançada é recusada.** Por isso o agente SAIDA/EQUIP das 15h30 não lança a mesma linha duas vezes.
- **Pré-inventário (POP-02):** saldo negativo não bloqueia. Grava e anota "pré-inventário, saldo n". Depois do inventário, o Mário roda `definirPreInventario(false)` e o app passa a pedir confirmação ("já falei com Julio ou Edton").
- **Devolução:** mostra o que a pessoa tem em mãos. Não deixa devolver mais do que saiu. Material danificado ou usado (**NÃO ACEITO**) não entra no saldo e vira pendência do POP-08.
- **Ferramentas:** não deixa retirar item que já está com alguém, que está "Em manutenção" ou "Baixado", nem mais do que o lote tem. Devolução com defeito põe o item "Em manutenção".
- **Sinal fraco:** o lançamento confirmado fica guardado no celular e sobe sozinho quando o sinal volta. Uma faixa avisa "⏳ N lançamentos esperando". Se a internet cair no meio do envio e o celular reenviar, o lançamento **não é gravado duas vezes**.
- **PIN** de acesso (opcional) e **faixa roxa "MODO TESTE"** enquanto estiver usando as cópias.

## Instalação (o Mário faz uma vez, no computador, ~15 minutos)

1. Entre em <https://script.google.com> com a conta dona das planilhas e clique em **Novo projeto**. Dê o nome **App Almoxarifado**.
2. Crie os arquivos e cole o conteúdo de cada um, desta pasta `apps-script/`:
   - `Code.gs`: cole no arquivo que já existe.
   - **+ › HTML**, com os nomes `Index`, `Styles` e `App` (sem ".html"), um para cada arquivo.
   - Em ⚙️ **Configurações do projeto**, marque *"Mostrar o arquivo de manifesto appsscript.json"* e cole o `appsscript.json`.
3. **Teste primeiro, nas cópias:** no topo, escolha a função `instalarTeste` e clique **Executar**. Autorize o acesso às Planilhas e ao Drive. Ela cria no Drive, dentro de **Claude Code › App Almoxarifado Bombeiros**, a pasta **"TESTE aaaa-mm-dd"** com:
   - cópias das duas planilhas;
   - a planilha **Registro** (Log + Pendências);
   - a pasta de assinaturas.

   **As planilhas reais não são tocadas.**
4. **PIN** (recomendado): em ⚙️ **Configurações do projeto › Propriedades do script**, adicione a propriedade `PIN` com 4 dígitos (ex.: `2580`). O Jean digita o PIN só na primeira vez. Sem PIN, qualquer pessoa com o link e uma conta Google consegue abrir.
5. **Implantar › Nova implantação › Tipo: App da Web**
   - Executar como: **Eu**
   - Quem pode acessar: **Qualquer pessoa com Conta do Google**
   - Copie o link que termina em `/exec`.
6. No celular do Jean, abra o link no **Chrome**, menu ⋮ › **Adicionar à tela inicial**. O app vira um ícone.

### Passar para as planilhas reais

Depois de alguns dias de teste:

1. Rode `instalarProducao()`. Ela cria a pasta *ASSINATURAS APP* dentro de REQUISIÇÕES e a planilha **App Almoxarifado - Registro** na pasta do almoxarifado.
2. **Implantar › Gerenciar implantações › ✏️ › Nova versão.** O link continua o mesmo.

A faixa roxa "MODO TESTE" some.

### Atualizar o app depois

Cole os arquivos novos e faça **Implantar › Gerenciar implantações › ✏️ › Versão: Nova versão**. O link não muda.

## Onde está cada coisa no Drive

| O quê | Pasta |
|---|---|
| Cópia do código, deste guia e a pasta de TESTE | Claude Code › **App Almoxarifado Bombeiros** |
| Prompts novos (SAIDA v1.3, EQUIP v1.3, FECHAMENTO v1.1, Instruções v1.1) | 2. Almoxarifado › PROCEDIMENTOS E TREINAMENTO › **Agentes de IA - Almoxarifado** |
| POP-09 (App do Almoxarifado) | … › **Pop`s almoxarifado** |
| Planilhas de Estoque e de Ferramentas | onde já estão (CONTROLE ESTOQUE) |
| Registro do App (Log e Pendências), em produção | pasta geral do almoxarifado |
| Assinaturas feitas na tela, em produção | REQUISIÇÕES › ASSINATURAS APP › aaaa-mm |

Os textos dos prompts e do POP-09 ficam em `documentos/` (fonte em .md e PDF em `documentos/pdf/`). Para gerar os PDFs de novo: `python3 documentos/gerar_pdfs.py`.

## O que muda na rotina e nos agentes

Veja [`docs/rotina-com-app.md`](docs/rotina-com-app.md). Resumo:

- O Jean lança na hora pelo app, e o caderno continua servindo de assinatura em papel enquanto não houver tablet.
- No lote das 15h30 sobram só as **notas fiscais**, as **transferências** e as **pendências** do app.
- Os prompts SAIDA, EQUIP e FECHAMENTO precisam de um parágrafo novo. O texto está pronto no mesmo documento.

## Testes (para quem mexer no código)

```bash
node teste/teste_servidor.js     # 14 testes do Code.gs com planilhas simuladas
node teste/montar_preview.js     # gera teste/preview.html (app rodando no navegador, sem Google)
```

Os testes conferem coluna por coluna onde cada valor é gravado. O simulador **falha se o app escrever numa coluna automática**.
