/**
 * APP ALMOXARIFADO · Obra Escola de Bombeiros · 3 MN Instalações
 * Fase 1: consulta de saldo, saída, devolução de campo, ferramentas e equipamentos.
 *
 * O app grava nas MESMAS planilhas que os agentes do Claude usam, seguindo
 * os POPs 02, 03 e 06:
 *  - só acrescenta linhas novas (nunca apaga nem sobrescreve);
 *  - não escreve nas colunas automáticas (Descrição, Valor total, Equipamento);
 *  - grava na primeira linha vazia;
 *  - nada é gravado sem a tela de confirmação ("O QUE VOU FAZER" + CONFIRMAR).
 *
 * Instalação: veja o README.md. Rode instalarTeste() primeiro.
 */

const VERSAO_APP = '1.0';
const LINHAS_POR_FOLHA = 12; // Folha do Caderno (material e ferramentas) tem 12 linhas

// IDs reais (pasta do almoxarifado no Drive). Só são usados por instalarTeste()
// (para fazer as cópias) e instalarProducao().
const IDS_REAIS = {
  ESTOQUE: '1E816n7h6zXAJ47p1JEkcS7CCNX9xPlq13qANaS8jW1Y',
  EQUIP: '1kSNYdh87fQ_Hm6r_DbHXnukBR6tvC9njNzgiYotb_fo',
  PASTA_ALMOX: '1JYmPSOvkyddaPlMW5lghFruH60WkpKEC',
  PASTA_REQUISICOES: '1LE6jpaFZ704GND7XM7mQL31mB7SFjdZ6',
  PASTA_APP: '1dod2jP1oGUegqbCFlPcHVVk70JTqWkcF' // Drive > Claude Code > App Almoxarifado Bombeiros
};

const PECAS = {
  JO: 'Joelho', LU: 'Luva', TE: 'Tê', CU: 'Curva', CP: 'Cap', JU: 'Junção',
  RE: 'Registro', AD: 'Adaptador', RD: 'Redução', BA: 'Barra / tubo'
};

// ---------------------------------------------------------------- Web app

function doGet() {
  return HtmlService.createTemplateFromFile('Index').evaluate()
    .setTitle('Almoxarifado · Escola de Bombeiros')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no')
    .addMetaTag('mobile-web-app-capable', 'yes');
}

function include(nome) {
  return HtmlService.createHtmlOutputFromFile(nome).getContent();
}

// ---------------------------------------------------------------- Instalação

/** Cria CÓPIAS das planilhas numa pasta de teste e aponta o app para elas. */
function instalarTeste() {
  const hoje = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  // a pasta de teste fica dentro de "Claude Code > App Almoxarifado Bombeiros"
  const pasta = DriveApp.getFolderById(IDS_REAIS.PASTA_APP).createFolder('TESTE ' + hoje);
  const est = DriveApp.getFileById(IDS_REAIS.ESTOQUE).makeCopy('TESTE - Controle de Estoque - Materiais', pasta);
  const eq = DriveApp.getFileById(IDS_REAIS.EQUIP).makeCopy('TESTE - Controle de Ferramentas e Equipamentos', pasta);
  const ass = pasta.createFolder('ASSINATURAS APP');
  const reg = criarRegistro_(pasta, 'TESTE - App Almoxarifado - Registro');
  salvarConfig_({
    MODO: 'TESTE',
    PLANILHA_ESTOQUE_ID: est.getId(),
    PLANILHA_EQUIP_ID: eq.getId(),
    PLANILHA_REGISTRO_ID: reg,
    PASTA_ASSINATURAS_ID: ass.getId(),
    SEQ_APP: '0'
  });
  Logger.log('TESTE pronto. Pasta: ' + pasta.getUrl());
  return pasta.getUrl();
}

/** Aponta o app para as planilhas REAIS. Só rode depois de testar. */
function instalarProducao() {
  const reqs = DriveApp.getFolderById(IDS_REAIS.PASTA_REQUISICOES);
  const ass = obterOuCriarPasta_(reqs, 'ASSINATURAS APP');
  const almox = DriveApp.getFolderById(IDS_REAIS.PASTA_ALMOX);
  const c = cfg_();
  const reg = (c.MODO === 'PRODUCAO' && c.PLANILHA_REGISTRO_ID) ? c.PLANILHA_REGISTRO_ID
    : criarRegistro_(almox, 'App Almoxarifado - Registro');
  salvarConfig_({
    MODO: 'PRODUCAO',
    PLANILHA_ESTOQUE_ID: IDS_REAIS.ESTOQUE,
    PLANILHA_EQUIP_ID: IDS_REAIS.EQUIP,
    PLANILHA_REGISTRO_ID: reg,
    PASTA_ASSINATURAS_ID: ass.getId(),
    SEQ_APP: c.MODO === 'PRODUCAO' ? (c.SEQ_APP || '0') : '0'
  });
  Logger.log('PRODUÇÃO configurada.');
}

/** PIN de 4 dígitos para abrir o app. definirPin('') desliga o PIN. */
function definirPin(pin) {
  salvarConfig_({ PIN: String(pin || '') });
}

/** Modo pré-inventário (POP-02): SIM = saldo negativo não bloqueia; NAO = pede confirmação. */
function definirPreInventario(sim) {
  salvarConfig_({ PRE_INVENTARIO: sim ? 'SIM' : 'NAO' });
}

function verConfig() {
  Logger.log(JSON.stringify(cfg_(), null, 2));
}

function criarRegistro_(pasta, nome) {
  const ss = SpreadsheetApp.create(nome);
  const log = ss.getSheets()[0];
  log.setName('Log');
  log.appendRow(['ID da operação', 'Data/hora', 'Tipo', 'Número', 'Pessoa', 'Itens', 'Assinatura', 'Avisos', 'Detalhe (JSON)']);
  log.setFrozenRows(1);
  const pend = ss.insertSheet('Pendencias');
  pend.appendRow(['Data/hora', 'Tipo', 'Descrição', 'Quantidade', 'Pessoa', 'Observação', 'Situação', 'Número']);
  pend.setFrozenRows(1);
  const leia = ss.insertSheet('LEIA-ME');
  leia.getRange(1, 1, 4, 1).setValues([
    ['Registro do App do Almoxarifado. Não apagar linhas.'],
    ['Log: cada lançamento feito pelo app (quem, quando, o que, assinatura).'],
    ['Pendencias: item não encontrado no Cadastro, material NÃO ACEITO (POP-08) e ferramenta com defeito.'],
    ['As pendências são resolvidas no lote das 15h30 pelos agentes (POP-04 / POP-08) e marcadas como RESOLVIDA.']
  ]);
  DriveApp.getFileById(ss.getId()).moveTo(pasta);
  return ss.getId();
}

function obterOuCriarPasta_(pai, nome) {
  const it = pai.getFoldersByName(nome);
  return it.hasNext() ? it.next() : pai.createFolder(nome);
}

function cfg_() {
  return PropertiesService.getScriptProperties().getProperties();
}

function salvarConfig_(obj) {
  PropertiesService.getScriptProperties().setProperties(obj, false);
}

function exigirCfg_() {
  const c = cfg_();
  if (!c.PLANILHA_ESTOQUE_ID || !c.PLANILHA_EQUIP_ID || !c.PLANILHA_REGISTRO_ID) {
    throw new Error('O app ainda não foi instalado. Peça ao Mário para rodar instalarTeste().');
  }
  return c;
}

function checarPin_(c, pin) {
  if (c.PIN && String(pin || '') !== String(c.PIN)) throw new Error('PIN_INVALIDO');
}

// ---------------------------------------------------------------- Utilidades

function norm_(s) {
  return String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toUpperCase().replace(/\s+/g, ' ').trim();
}

function num_(v) {
  if (typeof v === 'number') return v;
  const s = String(v == null ? '' : v).trim();
  if (!s) return 0;
  const n = Number(s.indexOf(',') >= 0 ? s.replace(/\./g, '').replace(',', '.') : s);
  return isNaN(n) ? 0 : n;
}

/** Converte célula (Date ou 'dd/mm/aaaa') em 'aaaa-mm-dd'. */
function eData_(v) {
  return Object.prototype.toString.call(v) === '[object Date]' && !isNaN(v.getTime());
}

function chaveData_(v) {
  if (eData_(v)) return Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const m = String(v || '').match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) return m[3] + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[1]).slice(-2);
  return '';
}

/** 'aaaa-mm-dd' -> Date à meia-noite (fuso do script). */
function dataDeChave_(k) {
  const m = String(k || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) throw new Error('Data inválida.');
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

function hojeChave_() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function dataBR_(k) {
  const m = String(k).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? m[3] + '/' + m[2] + '/' + m[1] : String(k);
}

function aba_(ss, nome) {
  const sh = ss.getSheetByName(nome);
  if (!sh) throw new Error('Não achei a aba "' + nome + '" na planilha ' + ss.getName() + '.');
  return sh;
}

function valores_(sh) {
  const n = sh.getLastRow();
  const m = sh.getLastColumn();
  if (n < 1 || m < 1) return [];
  return sh.getRange(1, 1, n, m).getValues();
}

/** Primeira linha vazia olhando a coluna A (as colunas automáticas não contam). */
function proximaLinha_(sh) {
  const n = sh.getLastRow();
  if (n < 2) return 2;
  const col = sh.getRange(1, 1, n, 1).getValues();
  for (let i = n - 1; i >= 0; i--) {
    if (String(col[i][0]).trim() !== '') return i + 2;
  }
  return 2;
}

/**
 * Grava uma linha só nas colunas informadas, em blocos contíguos,
 * sem tocar nas outras (fórmulas automáticas).
 * cels: { coluna(1-based): valor }, texto: [colunas gravadas como texto], datas: [colunas de data]
 */
function gravarLinha_(sh, linha, cels, texto, datas) {
  if (linha > sh.getMaxRows()) sh.insertRowsAfter(sh.getMaxRows(), 50);
  const cols = Object.keys(cels).map(Number).sort(function (a, b) { return a - b; });
  let i = 0;
  while (i < cols.length) {
    let j = i;
    while (j + 1 < cols.length && cols[j + 1] === cols[j] + 1) j++;
    const ini = cols[i];
    const vals = [];
    for (let k = i; k <= j; k++) vals.push(cels[cols[k]]);
    const rg = sh.getRange(linha, ini, 1, vals.length);
    const fmts = [];
    for (let k = i; k <= j; k++) {
      const c = cols[k];
      fmts.push((texto || []).indexOf(c) >= 0 ? '@' : (datas || []).indexOf(c) >= 0 ? 'dd/mm/yyyy' : null);
    }
    if (fmts.some(function (f) { return f; })) {
      const atuais = rg.getNumberFormats()[0];
      rg.setNumberFormats([fmts.map(function (f, idx) { return f || atuais[idx]; })]);
    }
    rg.setValues([vals]);
    i = j + 1;
  }
}

function temTexto_(x) {
  return x != null && String(x).trim() !== '';
}

function pad_(n, t) {
  return ('000000' + n).slice(-t);
}

function proximoApp_() {
  const p = PropertiesService.getScriptProperties();
  const n = Number(p.getProperty('SEQ_APP') || '0') + 1;
  p.setProperty('SEQ_APP', String(n));
  return 'APP-' + pad_(n, 5);
}

// ---------------------------------------------------------------- Leitura

function lerCadastro_(ss) {
  const v = valores_(aba_(ss, 'Cadastro'));
  const out = [];
  for (let i = 1; i < v.length; i++) {
    const cod = String(v[i][0]).trim();
    if (!cod) continue;
    out.push({ c: cod, d: String(v[i][1]), u: String(v[i][2]), s: String(v[i][4] || cod.split('-')[0]), st: String(v[i][7] || '') });
  }
  return out;
}

function lerSaldos_(ss) {
  const v = valores_(aba_(ss, 'Estoque'));
  const out = {};
  for (let i = 1; i < v.length; i++) {
    const cod = String(v[i][0]).trim();
    if (!cod) continue;
    out[cod] = { saldo: num_(v[i][8]), sit: String(v[i][10] || ''), ult: chaveData_(v[i][3]), un: String(v[i][2] || '') };
  }
  return out;
}

function lerSetores_(ss) {
  const v = valores_(aba_(ss, 'Setores'));
  const out = [];
  for (let i = 1; i < v.length; i++) if (String(v[i][0]).trim()) out.push({ c: String(v[i][0]).trim(), n: String(v[i][1]) });
  return out;
}

const RE_DEVOLVIDO = /devolvido por\s+([^·|]+)/i;

/** Saídas e devoluções de material, por pessoa e por item. */
function lerMovMaterial_(ss) {
  const s = valores_(aba_(ss, 'Saidas'));
  const e = valores_(aba_(ss, 'Entradas'));
  const saidas = [];
  for (let i = 1; i < s.length; i++) {
    if (!String(s[i][0]).trim() && !String(s[i][2]).trim()) continue;
    saidas.push({ data: chaveData_(s[i][0]), num: String(s[i][1]).trim(), cod: String(s[i][2]).trim(), qtd: num_(s[i][4]), pessoa: String(s[i][6]).trim() });
  }
  const devs = [];
  const numsEntradas = [];
  for (let i = 1; i < e.length; i++) {
    numsEntradas.push(String(e[i][1]).trim());
    if (norm_(e[i][2]) !== 'DEVOLUCAO DE CAMPO') continue;
    const m = String(e[i][8] || '').match(RE_DEVOLVIDO);
    devs.push({ data: chaveData_(e[i][0]), num: String(e[i][1]).trim(), cod: String(e[i][3]).trim(), qtd: num_(e[i][5]), pessoa: m ? m[1].trim() : '' });
  }
  return { saidas: saidas, devs: devs, numsSaidas: saidas.map(function (x) { return x.num; }), numsEntradas: numsEntradas };
}

/** O que cada pessoa retirou e ainda não devolveu: { PESSOA_NORM: { nome, itens: {cod: qtd} } } */
function emAbertoPorPessoa_(mov) {
  const out = {};
  function add(p, cod, q) {
    if (!p) return;
    const k = norm_(p);
    if (!out[k]) out[k] = { nome: p, itens: {} };
    out[k].itens[cod] = (out[k].itens[cod] || 0) + q;
  }
  mov.saidas.forEach(function (x) { add(x.pessoa, x.cod, x.qtd); });
  mov.devs.forEach(function (x) { add(x.pessoa, x.cod, -x.qtd); });
  Object.keys(out).forEach(function (k) {
    Object.keys(out[k].itens).forEach(function (c) { if (out[k].itens[c] <= 0) delete out[k].itens[c]; });
  });
  return out;
}

function maxFolhaLinha_(lista, prefixo) {
  const re = new RegExp(prefixo + '-(\\d{3})-(\\d{2})');
  let f = 0, l = 0;
  lista.forEach(function (s) {
    const m = String(s).match(re);
    if (!m) return;
    const ff = Number(m[1]), ll = Number(m[2]);
    if (ff > f || (ff === f && ll > l)) { f = ff; l = ll; }
  });
  return { folha: f, linha: l };
}

function proximaFolhaLinha_(ult) {
  if (!ult.folha) return { folha: 1, linha: 1 };
  if (ult.linha >= LINHAS_POR_FOLHA) return { folha: ult.folha + 1, linha: 1 };
  return { folha: ult.folha, linha: ult.linha + 1 };
}

function lerEquip_(sseq) {
  const ev = valores_(aba_(sseq, 'Equipamentos'));
  const mv = valores_(aba_(sseq, 'Movimentacao'));
  const movs = [];
  for (let i = 1; i < mv.length; i++) {
    const cod = String(mv[i][1]).trim();
    if (!cod) continue;
    movs.push({
      data: chaveData_(mv[i][0]), cod: cod, mov: norm_(mv[i][3]).indexOf('DEV') === 0 ? 'DEV' : 'RET',
      pessoa: String(mv[i][5]).trim(), estado: String(mv[i][6]), obs: String(mv[i][7]), qtd: num_(mv[i][8]) || 1
    });
  }
  const itens = [];
  for (let i = 1; i < ev.length; i++) {
    const cod = String(ev[i][0]).trim();
    if (!cod) continue;
    const lote = num_(ev[i][12]) || 1;
    // quem está com o quê (pelas linhas de Movimentacao)
    const com = {};
    let desde = '';
    movs.filter(function (m) { return m.cod === cod; }).forEach(function (m) {
      const k = norm_(m.pessoa);
      if (!com[k]) com[k] = { nome: m.pessoa, qtd: 0, desde: '' };
      com[k].qtd += m.mov === 'RET' ? m.qtd : -m.qtd;
      if (m.mov === 'RET') com[k].desde = m.data;
    });
    const fora = [];
    let qtdFora = 0;
    Object.keys(com).forEach(function (k) {
      if (com[k].qtd > 0) { fora.push(com[k]); qtdFora += com[k].qtd; if (!desde || com[k].desde < desde) desde = com[k].desde; }
    });
    const resp = String(ev[i][9]).trim();
    // peça única: o responsável atual da aba Equipamentos manda
    if (lote === 1 && resp && !fora.length) { fora.push({ nome: resp, qtd: 1, desde: '' }); qtdFora = 1; }
    itens.push({
      linha: i + 1, c: cod, n: String(ev[i][1]), tipo: String(ev[i][2]), st: String(ev[i][7] || ''),
      local: String(ev[i][8] || ''), resp: resp, lote: lote, fora: fora, qtdFora: qtdFora,
      disp: Math.max(0, lote - qtdFora), desde: desde
    });
  }
  return { itens: itens, movs: movs };
}

function bloqueado_(st) {
  const s = norm_(st);
  return s.indexOf('MANUTEN') >= 0 || s.indexOf('BAIXAD') >= 0;
}

// ---------------------------------------------------------------- API: abrir

function api_iniciar(pin) {
  try {
    const c = exigirCfg_();
    checarPin_(c, pin);
    const ss = SpreadsheetApp.openById(c.PLANILHA_ESTOQUE_ID);
    const sseq = SpreadsheetApp.openById(c.PLANILHA_EQUIP_ID);
    const mov = lerMovMaterial_(ss);
    const eq = lerEquip_(sseq);
    const abertos = emAbertoPorPessoa_(mov);

    // pessoas: mais recentes primeiro
    const vistos = {};
    const pessoas = [];
    mov.saidas.concat(mov.devs).concat(eq.movs).slice().reverse().forEach(function (x) {
      const k = norm_(x.pessoa);
      if (k && !vistos[k]) { vistos[k] = 1; pessoas.push(x.pessoa); }
    });

    return {
      ok: true,
      versao: VERSAO_APP,
      teste: c.MODO !== 'PRODUCAO',
      preInventario: c.PRE_INVENTARIO !== 'NAO',
      hoje: hojeChave_(),
      cadastro: lerCadastro_(ss),
      saldos: lerSaldos_(ss),
      setores: lerSetores_(ss),
      pessoas: pessoas.slice(0, 40),
      abertos: abertos,
      equip: eq.itens.map(function (x) { delete x.linha; return x; }),
      proxCad: proximaFolhaLinha_(maxFolhaLinha_(mov.numsSaidas.concat(mov.numsEntradas), 'CAD')),
      proxCeq: proximaFolhaLinha_(maxFolhaLinha_(eq.movs.map(function (m) { return m.obs; }), 'CEQ')),
      linhasPorFolha: LINHAS_POR_FOLHA,
      pecas: PECAS,
      atualizadoEm: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM HH:mm')
    };
  } catch (e) {
    return { ok: false, erro: e.message };
  }
}

// ---------------------------------------------------------------- API: lançar

/**
 * Recebe uma operação confirmada pelo Jean. Idempotente pelo op.id
 * (se a internet cair e o celular reenviar, não grava duas vezes).
 */
function api_registrar(op) {
  let lock;
  try {
    const c = exigirCfg_();
    checarPin_(c, op && op.pin);
    if (!op || !op.id || !op.tipo) throw new Error('Operação incompleta.');
    lock = LockService.getScriptLock();
    lock.waitLock(30000);
    const reg = SpreadsheetApp.openById(c.PLANILHA_REGISTRO_ID);
    const anterior = buscarLog_(reg, op.id);
    if (anterior) return { ok: true, repetido: true, numero: anterior.numero, avisos: ['Este lançamento já tinha sido gravado. Nada foi repetido.'] };

    let res;
    if (op.tipo === 'SAIDA') res = registrarSaida_(c, op);
    else if (op.tipo === 'DEVOLUCAO') res = registrarDevolucao_(c, op, reg);
    else if (op.tipo === 'RETIRADA_EQ' || op.tipo === 'DEVOLUCAO_EQ') res = registrarEquip_(c, op, reg);
    else if (op.tipo === 'PENDENCIA') res = registrarPendencia_(reg, op);
    else throw new Error('Tipo de operação desconhecido: ' + op.tipo);

    gravarLog_(reg, op, res);
    return { ok: true, numero: res.numero, linhas: res.linhas, avisos: res.avisos || [] };
  } catch (e) {
    return { ok: false, erro: e.message };
  } finally {
    if (lock) try { lock.releaseLock(); } catch (x) { /* nada */ }
  }
}

function buscarLog_(reg, id) {
  const sh = aba_(reg, 'Log');
  const n = sh.getLastRow();
  if (n < 2) return null;
  const v = sh.getRange(2, 1, n - 1, 4).getValues();
  for (let i = v.length - 1; i >= 0; i--) if (String(v[i][0]) === String(id)) return { numero: String(v[i][3]) };
  return null;
}

function gravarLog_(reg, op, res) {
  const itens = (op.itens || []).map(function (i) { return (i.codigo || i.descricao) + ' x' + i.qtd + (i.estado ? ' (' + i.estado + ')' : ''); }).join('; ');
  const det = JSON.parse(JSON.stringify(op));
  if (det.assinatura) delete det.assinatura.png;
  delete det.pin;
  aba_(reg, 'Log').appendRow([
    op.id, new Date(), op.tipo, res.numero || '', op.pessoa || '', itens,
    res.assinatura || '', (res.avisos || []).join(' | '), JSON.stringify(det)
  ]);
}

function validarBase_(op, precisaItens) {
  if (!String(op.pessoa || '').trim()) throw new Error('Falta o nome de quem retira ou devolve.');
  const k = String(op.data || '');
  dataDeChave_(k);
  if (k > hojeChave_()) throw new Error('A data não pode ser no futuro.');
  if (precisaItens && (!op.itens || !op.itens.length)) throw new Error('Nenhum item na lista.');
  (op.itens || []).forEach(function (i) {
    if (!(num_(i.qtd) > 0)) throw new Error('Quantidade inválida para ' + (i.codigo || i.descricao) + '.');
  });
  const a = op.assinatura || {};
  const soRecusados = op.tipo === 'DEVOLUCAO' && (op.itens || []).every(function (i) { return i.estado === 'NAO_ACEITO'; });
  if (soRecusados) return; // nada entra no saldo: só vira pendência (POP-08)
  if (a.modo === 'tela') {
    if (!a.png || String(a.png).indexOf('data:image/png;base64,') !== 0) throw new Error('Falta a assinatura na tela.');
  } else if (a.modo === 'papel') {
    if (!(Number(a.folha) > 0) || !(Number(a.linha) > 0)) throw new Error('Falta a folha e a linha do caderno.');
    if (Number(a.linha) + (op.itens || [1]).length - 1 > LINHAS_POR_FOLHA) {
      throw new Error('Os itens passam da linha ' + LINHAS_POR_FOLHA + ' da folha. Use a folha seguinte para o resto.');
    }
  } else {
    throw new Error('Escolha como foi a assinatura: na tela ou no caderno.');
  }
}

/** Números de documento por item: papel = CAD-FFF-LL (um por linha); tela = APP-nnnnn (um para todos). */
function numerosDoc_(op, prefixo, existentes, filtro) {
  const a = op.assinatura;
  const out = [];
  if (a.modo === 'papel') {
    // cada item ocupa uma linha do caderno, na ordem da lista (inclusive os NÃO ACEITO)
    for (let i = 0; i < op.itens.length; i++) {
      if (filtro && !filtro(op.itens[i])) continue;
      const n = prefixo + '-' + pad_(Number(a.folha), 3) + '-' + pad_(Number(a.linha) + i, 2);
      if (existentes(n)) throw new Error('A linha ' + n + ' já foi lançada antes. Confira a folha e a linha do caderno.');
      out.push(n);
    }
  }
  return out;
}

function salvarAssinatura_(c, op, numero) {
  if (!op.assinatura || op.assinatura.modo !== 'tela') return '';
  const raiz = DriveApp.getFolderById(c.PASTA_ASSINATURAS_ID);
  const pasta = obterOuCriarPasta_(raiz, String(op.data).slice(0, 7));
  const b64 = String(op.assinatura.png).split(',')[1];
  const blob = Utilities.newBlob(Utilities.base64Decode(b64), 'image/png', op.data + '_' + numero + '_' + norm_(op.pessoa).replace(/[^A-Z0-9]+/g, '-') + '.png');
  return pasta.createFile(blob).getUrl();
}

function textoAssinatura_(op, numero) {
  return op.assinatura.modo === 'papel'
    ? 'caderno, folha ' + pad_(Number(op.assinatura.folha), 3) + ' · lançado pelo app'
    : 'app ' + numero + ' · assinatura na tela';
}

// ----- SAÍDA DE MATERIAL (POP-02) -> aba Saidas

function registrarSaida_(c, op) {
  validarBase_(op, true);
  const ss = SpreadsheetApp.openById(c.PLANILHA_ESTOQUE_ID);
  const cad = {};
  lerCadastro_(ss).forEach(function (x) { cad[x.c] = x; });
  const saldos = lerSaldos_(ss);
  const mov = lerMovMaterial_(ss);
  const setores = lerSetores_(ss).map(function (s) { return s.c; });
  if (op.setor && setores.indexOf(op.setor) < 0) throw new Error('Setor ' + op.setor + ' não existe na aba Setores.');

  const pre = c.PRE_INVENTARIO !== 'NAO';
  const avisos = [];
  const consumo = {};
  const obsItem = [];
  op.itens.forEach(function (it) {
    const item = cad[it.codigo];
    if (!item) throw new Error('O código ' + it.codigo + ' não está no Cadastro.');
    if (it.codigo.indexOf('EQP-') === 0) throw new Error(it.codigo + ' é ferramenta/equipamento: use o botão Ferramentas.');
    consumo[it.codigo] = (consumo[it.codigo] || 0) + num_(it.qtd);
    const sal = saldos[it.codigo];
    const antes = sal ? sal.saldo : 0;
    const depois = antes - consumo[it.codigo];
    let nota = '';
    if (!sal || depois < 0 || norm_(sal && sal.sit).indexOf('SEM CONTAGEM') >= 0) {
      if (pre) {
        nota = 'pré-inventário, saldo ' + depois;
        avisos.push(it.codigo + ': saldo ficou ' + depois + ' (pré-inventário).');
      } else if (depois < 0) {
        if (!it.confirmouNegativo) throw new Error('A saída de ' + it.codigo + ' deixa o saldo negativo (' + depois + '). Fale com Julio ou Edton e confirme na tela.');
        nota = 'saldo negativo, conferir entradas';
        avisos.push(it.codigo + ': saldo negativo (' + depois + '). Avisar Julio ou Edton.');
      }
    }
    obsItem.push(nota);
  });

  const existe = function (n) { return mov.numsSaidas.indexOf(n) >= 0 || mov.numsEntradas.indexOf(n) >= 0; };
  let nums = numerosDoc_(op, 'CAD', existe);
  let numero;
  if (op.assinatura.modo === 'tela') {
    numero = proximoApp_();
    nums = op.itens.map(function () { return numero; });
  } else {
    numero = nums.length > 1 ? nums[0] + ' a ' + nums[nums.length - 1].slice(-2) : nums[0];
  }
  const urlAss = salvarAssinatura_(c, op, numero);

  const sh = aba_(ss, 'Saidas');
  let linha = proximaLinha_(sh);
  const data = dataDeChave_(op.data);
  const hoje = dataDeChave_(hojeChave_());
  op.itens.forEach(function (it, i) {
    const obs = [textoAssinatura_(op, numero), obsItem[i], it.obs, op.obs].filter(temTexto_).join(' · ');
    // A data · B nº · C código · [D automática] · E qtd · F setor · G retirante · H obs · I lançado em
    gravarLinha_(sh, linha, { 1: data, 2: nums[i], 3: it.codigo, 5: num_(it.qtd), 6: op.setor || '', 7: op.pessoa.trim(), 8: obs, 9: hoje }, [2], [1, 9]);
    linha++;
  });
  return { numero: numero, linhas: op.itens.length, avisos: avisos, assinatura: urlAss };
}

// ----- DEVOLUÇÃO DE CAMPO (POP-03) -> aba Entradas

function registrarDevolucao_(c, op, reg) {
  validarBase_(op, true);
  const ss = SpreadsheetApp.openById(c.PLANILHA_ESTOQUE_ID);
  const cad = {};
  lerCadastro_(ss).forEach(function (x) { cad[x.c] = x; });
  const mov = lerMovMaterial_(ss);
  const abertos = emAbertoPorPessoa_(mov);
  const pessoaK = norm_(op.pessoa);
  const avisos = [];

  const aceitos = op.itens.filter(function (i) { return i.estado !== 'NAO_ACEITO'; });
  const recusados = op.itens.filter(function (i) { return i.estado === 'NAO_ACEITO'; });

  const usado = {};
  const origens = [];
  aceitos.forEach(function (it) {
    if (!cad[it.codigo]) throw new Error('O código ' + it.codigo + ' não está no Cadastro.');
    usado[it.codigo] = (usado[it.codigo] || 0) + num_(it.qtd);
    const comPessoa = (abertos[pessoaK] && abertos[pessoaK].itens[it.codigo]) || 0;
    const saidasPessoa = mov.saidas.filter(function (s) { return s.cod === it.codigo && norm_(s.pessoa) === pessoaK; });
    if (saidasPessoa.length) {
      if (usado[it.codigo] > comPessoa) {
        throw new Error(op.pessoa + ' só tem ' + comPessoa + ' de ' + it.codigo + ' para devolver. Devolução maior que a saída é divergência: não gravei.');
      }
      origens.push('origem ' + saidasPessoa[saidasPessoa.length - 1].num);
    } else {
      const totSai = mov.saidas.filter(function (s) { return s.cod === it.codigo; }).reduce(function (a, s) { return a + s.qtd; }, 0);
      const totDev = mov.devs.filter(function (s) { return s.cod === it.codigo; }).reduce(function (a, s) { return a + s.qtd; }, 0);
      if (usado[it.codigo] > totSai - totDev) {
        throw new Error('Devolução de ' + it.codigo + ' maior do que tudo que já saiu. É divergência: não gravei.');
      }
      origens.push('origem não localizada');
      avisos.push(it.codigo + ': não achei a saída de ' + op.pessoa + '. Gravei com "origem não localizada".');
    }
  });

  let numero = '';
  let linhas = 0;
  let urlAss = '';
  if (aceitos.length) {
    const existe = function (n) { return mov.numsSaidas.indexOf(n) >= 0 || mov.numsEntradas.indexOf(n) >= 0; };
    let nums = numerosDoc_(op, 'CAD', existe, function (i) { return i.estado !== 'NAO_ACEITO'; });
    if (op.assinatura.modo === 'tela') {
      numero = proximoApp_();
      nums = aceitos.map(function () { return numero; });
    } else {
      numero = nums.length > 1 ? nums[0] + ' a ' + nums[nums.length - 1].slice(-2) : nums[0];
    }
    urlAss = salvarAssinatura_(c, op, numero);
    const sh = aba_(ss, 'Entradas');
    let linha = proximaLinha_(sh);
    const data = dataDeChave_(op.data);
    const hoje = dataDeChave_(hojeChave_());
    aceitos.forEach(function (it, i) {
      const obs = [textoAssinatura_(op, numero), origens[i], 'devolvido por ' + op.pessoa.trim(), op.setor ? 'setor ' + op.setor : '', it.obs, op.obs].filter(temTexto_).join(' · ');
      // A data · B nº · C fornecedor · D código · [E auto] · F qtd · [G vazio] · [H auto] · I obs · J lançado em
      gravarLinha_(sh, linha, { 1: data, 2: nums[i], 3: 'DEVOLUÇÃO DE CAMPO', 4: it.codigo, 6: num_(it.qtd), 9: obs, 10: hoje }, [2], [1, 10]);
      linha++;
    });
    linhas = aceitos.length;
  }
  recusados.forEach(function (it) {
    pendencia_(reg, 'NÃO ACEITO (POP-08)', (it.codigo || '') + ' ' + (it.descricao || ''), it.qtd, op.pessoa,
      'Devolução recusada: material danificado ou usado. Seguir POP-08 (AJUSTE) com Julio ou Edton.', numero);
    avisos.push((it.codigo || it.descricao) + ' x' + it.qtd + ': NÃO ACEITO. Ficou na lista de pendências (POP-08).');
  });
  if (!numero) numero = 'SEM LANÇAMENTO';
  return { numero: numero, linhas: linhas, avisos: avisos, assinatura: urlAss };
}

// ----- FERRAMENTAS E EQUIPAMENTOS (POP-06) -> abas Movimentacao e Equipamentos

function registrarEquip_(c, op, reg) {
  validarBase_(op, true);
  const ret = op.tipo === 'RETIRADA_EQ';
  const sseq = SpreadsheetApp.openById(c.PLANILHA_EQUIP_ID);
  const eq = lerEquip_(sseq);
  const porCod = {};
  eq.itens.forEach(function (x) { porCod[x.c] = x; });
  if (op.setor) {
    const ss = SpreadsheetApp.openById(c.PLANILHA_ESTOQUE_ID);
    if (lerSetores_(ss).map(function (s) { return s.c; }).indexOf(op.setor) < 0) throw new Error('Setor ' + op.setor + ' não existe.');
  }
  const pessoaK = norm_(op.pessoa);
  const avisos = [];
  const refs = [];

  op.itens.forEach(function (it) {
    const x = porCod[it.codigo];
    if (!x) throw new Error('O código ' + it.codigo + ' não está na aba Equipamentos.');
    const q = num_(it.qtd);
    if (ret) {
      if (bloqueado_(x.st)) throw new Error(x.c + ' está "' + x.st + '" e não pode sair.');
      if (x.lote === 1 && x.qtdFora > 0) throw new Error(x.c + ' (' + x.n + ') já está com ' + x.fora[0].nome + '.');
      if (q > x.disp) throw new Error(x.c + ': só tem ' + x.disp + ' disponível no almoxarifado.');
      refs.push('');
    } else {
      const com = x.fora.filter(function (f) { return norm_(f.nome) === pessoaK; })[0];
      if (!com) {
        if (!x.fora.length) throw new Error(x.c + ' consta como no almoxarifado. Não há o que devolver.');
        if (!it.confirmaOutraPessoa) throw new Error(x.c + ' está com ' + x.fora.map(function (f) { return f.nome; }).join(', ') + ', não com ' + op.pessoa + '.');
        avisos.push(x.c + ': estava com ' + x.fora[0].nome + ' e foi devolvido por ' + op.pessoa + '.');
      } else if (q > com.qtd) {
        throw new Error(op.pessoa + ' só tem ' + com.qtd + ' de ' + x.c + '. Não dá para devolver ' + q + '.');
      }
      // referência da retirada (CEQ ou APP) mais recente desta pessoa
      const rets = eq.movs.filter(function (m) { return m.cod === x.c && m.mov === 'RET' && norm_(m.pessoa) === norm_(com ? com.nome : x.fora[0].nome); });
      const ult = rets.length ? (rets[rets.length - 1].obs.match(/(CEQ-\d{3}-\d{2}|APP-\d{5})/) || [])[0] : '';
      refs.push(ult ? 'ref. retirada ' + ult : 'ref. retirada não localizada');
      if (it.estado && it.estado !== 'OK') avisos.push(x.c + ' voltou ' + it.estado.toUpperCase() + '. Avisar Julio, Edton e Mário hoje e separar o item.');
    }
  });

  const existe = function (n) { return eq.movs.some(function (m) { return m.obs.indexOf(n) >= 0; }); };
  let nums = numerosDoc_(op, 'CEQ', existe);
  let numero;
  if (op.assinatura.modo === 'tela') {
    numero = proximoApp_();
    nums = op.itens.map(function () { return numero; });
  } else {
    numero = nums.length > 1 ? nums[0] + ' a ' + nums[nums.length - 1].slice(-2) : nums[0];
  }
  const urlAss = salvarAssinatura_(c, op, numero);

  const shM = aba_(sseq, 'Movimentacao');
  const shE = aba_(sseq, 'Equipamentos');
  let linha = proximaLinha_(shM);
  const data = dataDeChave_(op.data);
  op.itens.forEach(function (it, i) {
    const x = porCod[it.codigo];
    const q = num_(it.qtd);
    const base = op.assinatura.modo === 'papel'
      ? 'caderno, folha ' + pad_(Number(op.assinatura.folha), 3) + ', ' + nums[i] + ' · lançado pelo app'
      : 'app ' + numero + ' · assinatura na tela';
    const obs = [base, ret ? 'estado na saída: ' + (it.estado || 'OK') : refs[i], it.obs, op.obs].filter(temTexto_).join(' · ');
    // A data · B código · [C auto] · D movimento · E setor · F responsável · G estado devolução · H obs · I qtd
    const cels = { 1: data, 2: x.c, 4: ret ? 'saída' : 'devolução', 5: op.setor || '', 6: op.pessoa.trim(), 8: obs, 9: q };
    if (!ret) cels[7] = it.estado || 'OK';
    gravarLinha_(shM, linha, cels, [], [1]);
    linha++;

    // Atualiza status / local / responsável (só H, I, J da linha do item)
    const linE = eq.itens.filter(function (y) { return y.c === x.c; })[0].linha;
    const foraDepois = x.qtdFora + (ret ? q : -q);
    let local, resp, status = x.st;
    if (x.lote === 1) {
      local = ret ? (op.setor || 'Fora do almoxarifado') : 'Almoxarifado';
      resp = ret ? op.pessoa.trim() : '';
      if (!ret && it.estado && it.estado !== 'OK') status = 'Em manutenção';
    } else {
      local = foraDepois <= 0 ? 'Almoxarifado' : 'Parcial: ' + foraDepois + ' fora';
      const mapa = {};
      x.fora.forEach(function (f) { mapa[norm_(f.nome)] = { nome: f.nome, qtd: f.qtd }; });
      const k = ret ? pessoaK : (mapa[pessoaK] ? pessoaK : norm_(x.fora[0] && x.fora[0].nome));
      if (!mapa[k]) mapa[k] = { nome: op.pessoa.trim(), qtd: 0 };
      mapa[k].qtd += ret ? q : -q;
      resp = Object.keys(mapa).filter(function (kk) { return mapa[kk].qtd > 0; }).map(function (kk) { return mapa[kk].nome + ' (' + mapa[kk].qtd + ')'; }).join(', ');
      if (!ret && it.estado && it.estado !== 'OK') {
        pendencia_(reg, 'FERRAMENTA COM DEFEITO', x.c + ' ' + x.n, q, op.pessoa, 'Voltou ' + it.estado + ' (item de lote: status não foi alterado). Separar e avisar Julio, Edton e Mário.', numero);
      }
    }
    gravarLinha_(shE, linE, { 8: status, 9: local, 10: resp }, [], []);
    x.qtdFora = foraDepois; // caso o mesmo item apareça de novo na lista
  });
  return { numero: numero, linhas: op.itens.length, avisos: avisos, assinatura: urlAss };
}

// ----- PENDÊNCIA (item que o Jean não achou no Cadastro) -> Registro/Pendencias

function registrarPendencia_(reg, op) {
  if (!String(op.descricao || '').trim()) throw new Error('Escreva a descrição do material.');
  if (!(num_(op.qtd) > 0)) throw new Error('Quantidade inválida.');
  pendencia_(reg, 'ITEM NÃO ENCONTRADO (' + (op.movimento || 'SAÍDA') + ')', op.descricao, num_(op.qtd), op.pessoa || '',
    'Lançar no lote das 15h30 pelo agente certo (POP-04). ' + (op.obs || ''), '');
  return { numero: 'PENDÊNCIA', linhas: 0, avisos: ['Anotado nas pendências. No lote das 15h30 o agente cadastra o item (POP-04) e lança.'] };
}

function pendencia_(reg, tipo, desc, qtd, pessoa, obs, numero) {
  aba_(reg, 'Pendencias').appendRow([new Date(), tipo, desc, qtd, pessoa, obs, 'ABERTA', numero || '']);
}

// ---------------------------------------------------------------- API: resumo do dia

function api_hoje(pin) {
  try {
    const c = exigirCfg_();
    checarPin_(c, pin);
    const reg = SpreadsheetApp.openById(c.PLANILHA_REGISTRO_ID);
    const tz = Session.getScriptTimeZone();
    const hoje = hojeChave_();
    const lv = valores_(aba_(reg, 'Log'));
    const lanc = [];
    for (let i = 1; i < lv.length; i++) {
      const d = eData_(lv[i][1]) ? Utilities.formatDate(lv[i][1], tz, 'yyyy-MM-dd') : '';
      if (d !== hoje) continue;
      lanc.push({ hora: Utilities.formatDate(lv[i][1], tz, 'HH:mm'), tipo: lv[i][2], numero: lv[i][3], pessoa: lv[i][4], itens: lv[i][5], avisos: lv[i][7] });
    }
    const pv = valores_(aba_(reg, 'Pendencias'));
    const pend = [];
    for (let i = 1; i < pv.length; i++) {
      if (norm_(pv[i][6]) !== 'ABERTA') continue;
      pend.push({ quando: eData_(pv[i][0]) ? Utilities.formatDate(pv[i][0], tz, 'dd/MM HH:mm') : '', tipo: pv[i][1], desc: pv[i][2], qtd: pv[i][3], pessoa: pv[i][4] });
    }
    const eq = lerEquip_(SpreadsheetApp.openById(c.PLANILHA_EQUIP_ID));
    const fora = [];
    eq.itens.forEach(function (x) {
      x.fora.forEach(function (f) {
        fora.push({ c: x.c, n: x.n, nome: f.nome, qtd: f.qtd, desde: f.desde ? dataBR_(f.desde) : '', mais24h: !!(f.desde && f.desde < hoje) });
      });
    });
    return { ok: true, lancamentos: lanc, pendencias: pend, fora: fora };
  } catch (e) {
    return { ok: false, erro: e.message };
  }
}
