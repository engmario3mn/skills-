/*
 * Teste do Code.gs fora do Google: simula SpreadsheetApp, DriveApp etc.
 * com as mesmas abas/colunas das planilhas reais e confere ONDE o app grava.
 * Rodar: node teste/teste_servidor.js
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

// ------------------------------------------------------------ simulador
const escritas = []; // {planilha, aba, linha, coluna, valor}

function fmtData(d, fmt) {
  const p = (n) => String(n).padStart(2, '0');
  return fmt.replace('yyyy', d.getFullYear()).replace('MM', p(d.getMonth() + 1)).replace('dd', p(d.getDate()))
    .replace('HH', p(d.getHours())).replace('mm', p(d.getMinutes()));
}

class Range {
  constructor(sh, r, c, nr, nc) { Object.assign(this, { sh, r, c, nr, nc }); }
  getValues() {
    const out = [];
    for (let i = 0; i < this.nr; i++) {
      const row = [];
      for (let j = 0; j < this.nc; j++) row.push(this.sh.cel(this.r + i, this.c + j));
      out.push(row);
    }
    return out;
  }
  setValues(v) {
    for (let i = 0; i < this.nr; i++) for (let j = 0; j < this.nc; j++) {
      this.sh.set(this.r + i, this.c + j, v[i][j]);
      escritas.push({ planilha: this.sh.ss.nome, aba: this.sh.nome, linha: this.r + i, coluna: this.c + j, valor: v[i][j] });
    }
    return this;
  }
  getNumberFormats() { return Array.from({ length: this.nr }, () => Array(this.nc).fill('General')); }
  setNumberFormats(f) { this.sh.formatos.push({ linha: this.r, col: this.c, f }); return this; }
}

class Sheet {
  constructor(ss, nome, linhas, auto) {
    this.ss = ss; this.nome = nome; this.dados = linhas.map((l) => l.slice()); this.formatos = [];
    this.auto = auto || []; // colunas com ARRAYFORMULA (não podem ser escritas)
    this.maxRows = Math.max(1000, linhas.length);
  }
  getName() { return this.nome; }
  cel(r, c) { const l = this.dados[r - 1]; return l && l[c - 1] !== undefined ? l[c - 1] : ''; }
  set(r, c, v) {
    if (this.auto.includes(c) && r > 1) throw new Error(`ESCREVEU EM COLUNA AUTOMÁTICA ${this.nome}!${c}`);
    while (this.dados.length < r) this.dados.push([]);
    this.dados[r - 1][c - 1] = v;
  }
  getLastRow() {
    for (let i = this.dados.length - 1; i >= 0; i--) if ((this.dados[i] || []).some((x) => x !== '' && x != null)) return i + 1;
    return 0;
  }
  getLastColumn() { return Math.max(1, ...this.dados.map((l) => l.length)); }
  getMaxRows() { return this.maxRows; }
  insertRowsAfter(_, n) { this.maxRows += n; }
  getRange(r, c, nr, nc) { return new Range(this, r, c, nr || 1, nc || 1); }
  appendRow(v) { const r = this.getLastRow() + 1; this.getRange(r, 1, 1, v.length).setValues([v]); }
  setFrozenRows() {}
}

class SS {
  constructor(id, nome, abas) { this.id = id; this.nome = nome; this.abas = {}; for (const [n, [l, auto]] of Object.entries(abas)) this.abas[n] = new Sheet(this, n, l, auto); }
  getSheetByName(n) { return this.abas[n] || null; }
  getName() { return this.nome; }
  getId() { return this.id; }
}

const d = (s) => { const [dd, mm, yy] = s.split('/').map(Number); return new Date(yy, mm - 1, dd); };

function montar() {
  const estoque = new SS('EST', 'Estoque', {
    Estoque: [[
      ['Código', 'Descrição', 'Unidade', 'Data da última contagem', 'Qtd contada', 'Entradas depois', 'Saídas depois', 'Ajustes depois', 'Saldo atual', 'Estoque mínimo', 'Situação'],
      ['HID-JO-9025', 'Joelho 90° soldável 25mm', 'UN', d('08/10/2026'), 30, 0, 6, 0, 24, '', 'OK'],
      ['SAN-CP-100', 'CAP ESG 100mm', 'UN', '', 0, 0, 10, 0, -10, '', 'NEGATIVO - conferir'],
      ['CON-008', 'Fita veda rosca', 'UN', d('08/10/2026'), 5, 0, 0, 0, 5, '', 'OK']
    ]],
    Cadastro: [[
      ['Código', 'Descrição', 'Unidade', 'Categoria', 'Sistema', 'Estoque mínimo', 'Código antigo', 'Status', 'Cadastrado em'],
      ['HID-JO-9025', 'Joelho 90° soldável 25mm', 'UN', 'Hidráulica', 'HID', '', '', 'Ativo', '26/10/2026'],
      ['SAN-CP-100', 'CAP ESG 100mm', 'UN', 'Esgoto', 'SAN', '', '', 'Ativo', '26/10/2026'],
      ['CON-008', 'Fita veda rosca', 'UN', 'Consumíveis', 'CON', '', '', 'Ativo', '26/10/2026']
    ]],
    // D = descrição automática (ARRAYFORMULA)
    Saidas: [[
      ['Data', 'Nº requisição', 'Código', 'Descrição (automática)', 'Quantidade', 'Setor', 'Retirante', 'Observação', 'Lançado em'],
      [d('10/10/2026'), 'CADERNO p.02', 'HID-JO-9025', 'Joelho 90° soldável 25mm', 6, '', '', 'Caderno: joelho'],
      [d('10/11/2026'), 'CAD-003-11', 'CON-008', 'Fita veda rosca', 2, '', 'José Silva', 'caderno, folha 003', d('10/11/2026')]
    ], [4]],
    // E = descrição automática, H = valor total automático
    Entradas: [[
      ['Data recebimento', 'Nº NF', 'Fornecedor', 'Código', 'Descrição (automática)', 'Quantidade', 'Valor unitário (R$)', 'Valor total (R$)', 'Observação', 'Lançado em'],
      [d('16/06/2026'), '653261', 'SV Elétrica', 'CON-008', 'Fita veda rosca', 2, 7.56, 15.12, 'x', '']
    ], [5, 8]],
    Setores: [[['Código do setor', 'Nome do setor'], ['IMP-01', 'Bloco Pedagógico'], ['T-01', 'Biblioteca']]]
  });
  const equip = new SS('EQ', 'Equip', {
    Equipamentos: [[
      ['Código', 'Equipamento', 'Tipo', 'Marca / modelo', 'Nº série / patrimônio', 'Propriedade', 'Data', 'Status', 'Local atual', 'Responsável atual', 'Próxima manutenção', 'Observação', 'Quantidade do lote'],
      ['EQP-002', 'Gerador de energia bivolt', 'Gerador', '', '', '', '', 'Ativo', 'Obra', '', '', '', 1],
      ['EQP-045', 'Martelo', 'Ferramenta', '', '', '', '', 'Ativo', 'Almoxarifado', '', '', '', 10]
    ]],
    Movimentacao: [[['Data', 'Código', 'Equipamento (automático)', 'Movimento (saída / devolução)', 'Setor', 'Responsável', 'Estado na devolução', 'Observação', 'Quantidade']], [3]],
    Manutencao: [[['Data', 'Código', 'Equipamento (automático)', 'Tipo', 'Serviço', 'Custo', 'Próxima']]]
  });
  const registro = new SS('REG', 'Registro', {
    Log: [[['ID', 'Data/hora', 'Tipo', 'Número', 'Pessoa', 'Itens', 'Assinatura', 'Avisos', 'Detalhe']]],
    Pendencias: [[['Data/hora', 'Tipo', 'Descrição', 'Quantidade', 'Pessoa', 'Observação', 'Situação', 'Número']]]
  });
  return { EST: estoque, EQ: equip, REG: registro };
}

function carregarCodigo(planilhas, props) {
  const arquivos = [];
  const pasta = {
    getFoldersByName: () => ({ hasNext: () => false }),
    createFolder: () => pasta,
    createFile: (b) => { arquivos.push(b); return { getUrl: () => 'https://drive/' + b.nome }; }
  };
  const ctx = {
    console,
    SpreadsheetApp: { openById: (id) => planilhas[id] },
    PropertiesService: {
      getScriptProperties: () => ({
        getProperties: () => Object.assign({}, props),
        getProperty: (k) => props[k] || null,
        setProperty: (k, v) => { props[k] = v; },
        setProperties: (o) => Object.assign(props, o)
      })
    },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    Session: { getScriptTimeZone: () => 'America/Fortaleza' },
    Utilities: {
      formatDate: (dt, tz, f) => fmtData(dt, f),
      newBlob: (bytes, tipo, nome) => ({ bytes, tipo, nome }),
      base64Decode: (s) => Buffer.from(s, 'base64')
    },
    DriveApp: { getFolderById: () => pasta },
    HtmlService: {},
    Logger: { log() {} }
  };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../apps-script/Code.gs'), 'utf8'), ctx);
  ctx.arquivos = arquivos;
  return ctx;
}

// ------------------------------------------------------------ casos
const hoje = fmtData(new Date(), 'yyyy-MM-dd');
const PNG = 'data:image/png;base64,' + Buffer.from('assinatura').toString('base64');
let falhas = 0;
function caso(nome, fn) {
  try { fn(); console.log('✔ ' + nome); } catch (e) { falhas++; console.log('✖ ' + nome + '\n   ' + e.message); }
}
function novo(extraProps) {
  escritas.length = 0;
  const p = montar();
  const props = Object.assign({ MODO: 'TESTE', PLANILHA_ESTOQUE_ID: 'EST', PLANILHA_EQUIP_ID: 'EQ', PLANILHA_REGISTRO_ID: 'REG', PASTA_ASSINATURAS_ID: 'P', SEQ_APP: '0' }, extraProps || {});
  return { p, props, g: carregarCodigo(p, props) };
}
const linhaDe = (sh, r) => sh.dados[r - 1];

caso('iniciar: lê cadastro, saldos, pessoas em aberto e próxima linha do caderno', () => {
  const { g } = novo();
  const r = g.api_iniciar('');
  assert.ok(r.ok, r.erro);
  assert.strictEqual(r.cadastro.length, 3);
  assert.strictEqual(r.saldos['SAN-CP-100'].saldo, -10);
  assert.strictEqual(JSON.stringify(r.proxCad), JSON.stringify({ folha: 3, linha: 12 }));
  assert.strictEqual(r.abertos['JOSE SILVA'].itens['CON-008'], 2);
  assert.ok(r.preInventario);
  assert.strictEqual(r.equip.find((x) => x.c === 'EQP-045').disp, 10);
});

caso('PIN errado é recusado', () => {
  const { g } = novo({ PIN: '1234' });
  assert.strictEqual(g.api_iniciar('9999').erro, 'PIN_INVALIDO');
  assert.ok(g.api_iniciar('1234').ok);
});

caso('saída com assinatura na tela: grava em Saidas A,B,C,E-I e nunca em D', () => {
  const { p, g } = novo();
  const r = g.api_registrar({ id: 'a1', tipo: 'SAIDA', data: hoje, pessoa: 'Carlos', setor: 'IMP-01',
    itens: [{ codigo: 'HID-JO-9025', qtd: 4 }, { codigo: 'SAN-CP-100', qtd: 2 }], assinatura: { modo: 'tela', png: PNG } });
  assert.ok(r.ok, r.erro);
  assert.strictEqual(r.numero, 'APP-00001');
  const sh = p.EST.abas.Saidas;
  const l = linhaDe(sh, 4);
  assert.strictEqual(l[1], 'APP-00001');
  assert.strictEqual(l[2], 'HID-JO-9025');
  assert.strictEqual(l[3], undefined, 'coluna D (automática) foi tocada');
  assert.strictEqual(l[4], 4);
  assert.strictEqual(l[5], 'IMP-01');
  assert.strictEqual(l[6], 'Carlos');
  assert.ok(l[7].includes('assinatura na tela'));
  assert.ok(Object.prototype.toString.call(l[0]) === '[object Date]' && l[0].getHours() === 0, 'data deve ser meia-noite');
  assert.ok(linhaDe(sh, 5)[7].includes('pré-inventário, saldo -12'), 'nota de pré-inventário');
  assert.ok(r.avisos.some((a) => a.includes('SAN-CP-100')));
  assert.ok(sh.formatos.some((f) => f.col === 1 && f.f[0][1] === '@'), 'nº deve ser texto');
  assert.strictEqual(g.arquivos.length, 1, 'assinatura salva no Drive');
  assert.strictEqual(p.REG.abas.Log.dados.length, 2);
});

caso('saída pelo caderno: um número CAD-FFF-LL por linha, e linha repetida é recusada', () => {
  const { p, g } = novo();
  const op = { id: 'b1', tipo: 'SAIDA', data: hoje, pessoa: 'Carlos', itens: [{ codigo: 'CON-008', qtd: 1 }, { codigo: 'HID-JO-9025', qtd: 2 }], assinatura: { modo: 'papel', folha: 4, linha: 1 } };
  const r = g.api_registrar(op);
  assert.ok(r.ok, r.erro);
  const sh = p.EST.abas.Saidas;
  assert.strictEqual(linhaDe(sh, 4)[1], 'CAD-004-01');
  assert.strictEqual(linhaDe(sh, 5)[1], 'CAD-004-02');
  assert.strictEqual(linhaDe(sh, 4)[5], '', 'caderno sem setor');
  assert.ok(linhaDe(sh, 4)[7].startsWith('caderno, folha 004'));
  const r2 = g.api_registrar(Object.assign({}, op, { id: 'b2' }));
  assert.ok(!r2.ok && r2.erro.includes('CAD-004-01'), 'deveria recusar linha repetida');
  const r3 = g.api_registrar(Object.assign({}, op, { id: 'b3', assinatura: { modo: 'papel', folha: 5, linha: 12 } }));
  assert.ok(!r3.ok && r3.erro.includes('passam da linha'), 'deveria recusar passar da linha 12');
});

caso('reenvio do mesmo lançamento (sinal caiu) não grava duas vezes', () => {
  const { p, g } = novo();
  const op = { id: 'c1', tipo: 'SAIDA', data: hoje, pessoa: 'Carlos', itens: [{ codigo: 'CON-008', qtd: 1 }], assinatura: { modo: 'tela', png: PNG } };
  assert.ok(g.api_registrar(op).ok);
  const r = g.api_registrar(op);
  assert.ok(r.ok && r.repetido);
  assert.strictEqual(p.EST.abas.Saidas.getLastRow(), 4);
});

caso('fora do pré-inventário: saldo negativo exige confirmação', () => {
  const { g } = novo({ PRE_INVENTARIO: 'NAO' });
  const op = { id: 'd1', tipo: 'SAIDA', data: hoje, pessoa: 'Carlos', itens: [{ codigo: 'CON-008', qtd: 9 }], assinatura: { modo: 'tela', png: PNG } };
  assert.ok(!g.api_registrar(op).ok);
  op.id = 'd2'; op.itens[0].confirmouNegativo = true;
  const r = g.api_registrar(op);
  assert.ok(r.ok, r.erro);
});

caso('regras: sem assinatura, data futura, código inexistente e EQP na saída são recusados', () => {
  const { g } = novo();
  const base = { tipo: 'SAIDA', data: hoje, pessoa: 'Carlos', itens: [{ codigo: 'CON-008', qtd: 1 }] };
  assert.ok(!g.api_registrar(Object.assign({}, base, { id: 'e1' })).ok);
  assert.ok(!g.api_registrar(Object.assign({}, base, { id: 'e2', data: '2099-01-01', assinatura: { modo: 'tela', png: PNG } })).ok);
  assert.ok(!g.api_registrar(Object.assign({}, base, { id: 'e3', itens: [{ codigo: 'XXX-1', qtd: 1 }], assinatura: { modo: 'tela', png: PNG } })).ok);
  assert.ok(!g.api_registrar(Object.assign({}, base, { id: 'e4', pessoa: ' ', assinatura: { modo: 'tela', png: PNG } })).ok);
});

caso('devolução: grava em Entradas sem tocar E/H, com origem e "devolvido por"', () => {
  const { p, g } = novo();
  const r = g.api_registrar({ id: 'f1', tipo: 'DEVOLUCAO', data: hoje, pessoa: 'josé silva',
    itens: [{ codigo: 'CON-008', qtd: 1, estado: 'OK' }], assinatura: { modo: 'papel', folha: 4, linha: 3 } });
  assert.ok(r.ok, r.erro);
  const l = linhaDe(p.EST.abas.Entradas, 3);
  assert.strictEqual(l[1], 'CAD-004-03');
  assert.strictEqual(l[2], 'DEVOLUÇÃO DE CAMPO');
  assert.strictEqual(l[3], 'CON-008');
  assert.strictEqual(l[4], undefined);
  assert.strictEqual(l[5], 1);
  assert.strictEqual(l[6], undefined, 'valor unitário fica vazio');
  assert.ok(l[8].includes('origem CAD-003-11') && l[8].includes('devolvido por josé silva'), l[8]);
});

caso('devolução maior que o que a pessoa retirou é recusada', () => {
  const { g } = novo();
  const r = g.api_registrar({ id: 'g1', tipo: 'DEVOLUCAO', data: hoje, pessoa: 'José Silva', itens: [{ codigo: 'CON-008', qtd: 3, estado: 'OK' }], assinatura: { modo: 'tela', png: PNG } });
  assert.ok(!r.ok && r.erro.includes('só tem 2'), r.erro);
});

caso('devolução: NÃO ACEITO vira pendência e mantém a numeração das linhas do caderno', () => {
  const { p, g } = novo();
  const r = g.api_registrar({ id: 'h1', tipo: 'DEVOLUCAO', data: hoje, pessoa: 'José Silva',
    itens: [{ codigo: 'HID-JO-9025', qtd: 1, estado: 'NAO_ACEITO' }, { codigo: 'CON-008', qtd: 1, estado: 'OK' }], assinatura: { modo: 'papel', folha: 4, linha: 1 } });
  assert.ok(r.ok, r.erro);
  assert.strictEqual(linhaDe(p.EST.abas.Entradas, 3)[1], 'CAD-004-02');
  assert.strictEqual(p.EST.abas.Entradas.getLastRow(), 3);
  assert.strictEqual(p.REG.abas.Pendencias.dados.length, 2);
  const r2 = g.api_registrar({ id: 'h2', tipo: 'DEVOLUCAO', data: hoje, pessoa: 'José Silva',
    itens: [{ codigo: 'CON-008', qtd: 1, estado: 'NAO_ACEITO' }], assinatura: { modo: 'nenhuma' } });
  assert.ok(r2.ok, r2.erro);
  assert.strictEqual(p.EST.abas.Entradas.getLastRow(), 3, 'só recusado não grava em Entradas');
});

caso('ferramenta: retirar peça única, bloquear 2ª retirada, devolver com defeito -> Em manutenção', () => {
  const { p, g } = novo();
  let r = g.api_registrar({ id: 'i1', tipo: 'RETIRADA_EQ', data: hoje, pessoa: 'Pedro', setor: 'T-01', itens: [{ codigo: 'EQP-002', qtd: 1, estado: 'OK' }], assinatura: { modo: 'papel', folha: 1, linha: 1 } });
  assert.ok(r.ok, r.erro);
  const m = linhaDe(p.EQ.abas.Movimentacao, 2);
  assert.strictEqual(m[1], 'EQP-002'); assert.strictEqual(m[2], undefined); assert.strictEqual(m[3], 'saída');
  assert.ok(m[7].includes('CEQ-001-01'));
  const e = linhaDe(p.EQ.abas.Equipamentos, 2);
  assert.strictEqual(e[8], 'T-01'); assert.strictEqual(e[9], 'Pedro');
  r = g.api_registrar({ id: 'i2', tipo: 'RETIRADA_EQ', data: hoje, pessoa: 'Ana', itens: [{ codigo: 'EQP-002', qtd: 1 }], assinatura: { modo: 'tela', png: PNG } });
  assert.ok(!r.ok && r.erro.includes('Pedro'), r.erro);
  r = g.api_registrar({ id: 'i3', tipo: 'DEVOLUCAO_EQ', data: hoje, pessoa: 'Pedro', itens: [{ codigo: 'EQP-002', qtd: 1, estado: 'Defeito' }], assinatura: { modo: 'tela', png: PNG } });
  assert.ok(r.ok, r.erro);
  const m2 = linhaDe(p.EQ.abas.Movimentacao, 3);
  assert.strictEqual(m2[3], 'devolução'); assert.strictEqual(m2[6], 'Defeito');
  assert.ok(m2[7].includes('ref. retirada CEQ-001-01'), m2[7]);
  const e2 = linhaDe(p.EQ.abas.Equipamentos, 2);
  assert.strictEqual(e2[7], 'Em manutenção'); assert.strictEqual(e2[8], 'Almoxarifado'); assert.strictEqual(e2[9], '');
  r = g.api_registrar({ id: 'i4', tipo: 'RETIRADA_EQ', data: hoje, pessoa: 'Ana', itens: [{ codigo: 'EQP-002', qtd: 1 }], assinatura: { modo: 'tela', png: PNG } });
  assert.ok(!r.ok && r.erro.includes('Em manutenção'), r.erro);
});

caso('ferramenta em lote: controla quantidade por pessoa', () => {
  const { p, g } = novo();
  assert.ok(g.api_registrar({ id: 'j1', tipo: 'RETIRADA_EQ', data: hoje, pessoa: 'Pedro', itens: [{ codigo: 'EQP-045', qtd: 3 }], assinatura: { modo: 'tela', png: PNG } }).ok);
  assert.ok(g.api_registrar({ id: 'j2', tipo: 'RETIRADA_EQ', data: hoje, pessoa: 'Ana', itens: [{ codigo: 'EQP-045', qtd: 2 }], assinatura: { modo: 'tela', png: PNG } }).ok);
  let e = linhaDe(p.EQ.abas.Equipamentos, 3);
  assert.strictEqual(e[8], 'Parcial: 5 fora');
  assert.strictEqual(e[9], 'Pedro (3), Ana (2)');
  const r = g.api_registrar({ id: 'j3', tipo: 'DEVOLUCAO_EQ', data: hoje, pessoa: 'Ana', itens: [{ codigo: 'EQP-045', qtd: 3 }], assinatura: { modo: 'tela', png: PNG } });
  assert.ok(!r.ok && r.erro.includes('só tem 2'), r.erro);
  assert.ok(g.api_registrar({ id: 'j4', tipo: 'DEVOLUCAO_EQ', data: hoje, pessoa: 'Ana', itens: [{ codigo: 'EQP-045', qtd: 2, estado: 'OK' }], assinatura: { modo: 'tela', png: PNG } }).ok);
  e = linhaDe(p.EQ.abas.Equipamentos, 3);
  assert.strictEqual(e[8], 'Parcial: 3 fora');
  assert.strictEqual(e[9], 'Pedro (3)');
  const ini = g.api_iniciar('');
  assert.strictEqual(ini.equip.find((x) => x.c === 'EQP-045').disp, 7);
  assert.strictEqual(ini.proxCeq.folha, 1);
});

caso('pendência (item não encontrado) e resumo do dia', () => {
  const { p, g } = novo();
  assert.ok(g.api_registrar({ id: 'k1', tipo: 'PENDENCIA', descricao: 'bucha de redução 50x40', qtd: 4, pessoa: 'Carlos', itens: [] }).ok);
  assert.ok(g.api_registrar({ id: 'k2', tipo: 'RETIRADA_EQ', data: hoje, pessoa: 'Pedro', itens: [{ codigo: 'EQP-002', qtd: 1 }], assinatura: { modo: 'tela', png: PNG } }).ok);
  const h = g.api_hoje('');
  assert.ok(h.ok, h.erro);
  assert.strictEqual(h.lancamentos.length, 2);
  assert.strictEqual(h.pendencias.length, 1);
  assert.strictEqual(h.fora.length, 1);
  assert.strictEqual(p.REG.abas.Pendencias.dados[1][6], 'ABERTA');
});

caso('app sem instalação avisa', () => {
  const p = montar();
  const g = carregarCodigo(p, {});
  assert.ok(g.api_iniciar('').erro.includes('instalarTeste'));
});

console.log(falhas ? `\n${falhas} FALHA(S)` : '\nTODOS OS TESTES PASSARAM');
process.exit(falhas ? 1 : 0);
