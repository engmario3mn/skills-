/*
 * Gera teste/preview.html: a interface real (Index + Styles + App) rodando no navegador,
 * com o Code.gs real por trás e planilhas simuladas. Serve para ver as telas sem o Google.
 * Rodar: node teste/montar_preview.js  -> abrir teste/preview.html
 */
const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '../apps-script');
const ler = (n) => fs.readFileSync(path.join(dir, n), 'utf8');

const itens = [
  ['HID-JO-9025', 'Joelho 90° soldável 25mm', 24], ['HID-JO-9032', 'Joelho 90° soldável 32mm', 12], ['HID-JO-4532', 'Joelho 45° soldável 32mm', 9],
  ['HID-TE-25', 'TE soldável 25mm', -14], ['HID-TE-32', 'TE soldável 32mm', 6], ['HID-LU-25', 'Luva soldável 25mm', 30], ['HID-RD-3225', 'Redução soldável 32x25', 8],
  ['HID-013', 'Adaptador soldável 25mm', 11], ['HID-020', 'Registro 3/4', 3], ['SAN-JO-9040', 'Joelho 90° ESG 40mm', 40], ['SAN-JO-4540', 'Joelho 45° ESG 40mm', 18],
  ['SAN-JO-90100', 'Joelho 90° ESG 100mm', 7], ['SAN-LU-100', 'Luva simples ESG 100mm', 15], ['SAN-CP-100', 'CAP ESG 100mm', -10], ['SAN-TE-R10050', 'TE de redução ESG 100x50', 4],
  ['SAN-001', 'Caixa de gordura', -6], ['ELE-LU-20', 'Luva eletroduto 3/4"', 120], ['ELE-BA-20', 'Eletroduto 3/4"', 64], ['ELE-005', 'Curva eletroduto 3/4"', 33],
  ['ELE-003', 'Caixa elétrica 4x4', 22], ['CON-004', 'Cola pequena', 5], ['CON-008', 'Fita veda rosca', 12], ['CON-009', 'Lixa', 20], ['CON-007', 'Fita isolante', 8],
  ['FER-001', 'Lâmina de serra', 6], ['EPI-001', 'Luva de vaqueta', 14], ['DIV-008', 'Barra roscada (vara)', 9]
];
const dados = {
  cadastro: itens.map(([c, d]) => [c, d, 'UN', '', c.split('-')[0], '', '', 'Ativo', '26/10/2026']),
  estoque: itens.map(([c, d, s]) => [c, d, 'UN', s < 0 ? '' : '08/10/2026', 0, 0, 0, 0, s, '', s < 0 ? 'NEGATIVO - conferir' : 'OK'])
};

const html = ler('Index.html').replace('<meta charset="utf-8">', '<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">')
  .replace("<?!= include('Styles'); ?>", ler('Styles.html'))
  .replace("<?!= include('App'); ?>", `<script>
// ---- simulador das planilhas e do Google (só para o preview)
var DADOS = ${JSON.stringify(dados)};
function Sheet(nome, linhas, auto) { this.nome = nome; this.dados = linhas; this.auto = auto || []; }
Sheet.prototype = {
  getName: function () { return this.nome; },
  cel: function (r, c) { var l = this.dados[r - 1]; return l && l[c - 1] !== undefined ? l[c - 1] : ''; },
  getLastRow: function () { for (var i = this.dados.length - 1; i >= 0; i--) if ((this.dados[i] || []).some(function (x) { return x !== '' && x != null; })) return i + 1; return 0; },
  getLastColumn: function () { return Math.max.apply(null, [1].concat(this.dados.map(function (l) { return l.length; }))); },
  getMaxRows: function () { return 5000; }, insertRowsAfter: function () {}, setFrozenRows: function () {},
  appendRow: function (v) { this.dados.push(v.slice()); },
  getRange: function (r, c, nr, nc) { var sh = this; nr = nr || 1; nc = nc || 1; return {
    getValues: function () { var o = []; for (var i = 0; i < nr; i++) { var l = []; for (var j = 0; j < nc; j++) l.push(sh.cel(r + i, c + j)); o.push(l); } return o; },
    setValues: function (v) { for (var i = 0; i < nr; i++) { while (sh.dados.length < r + i) sh.dados.push([]); for (var j = 0; j < nc; j++) { if (sh.auto.indexOf(c + j) >= 0) throw new Error('coluna automática!'); sh.dados[r + i - 1][c + j - 1] = v[i][j]; } } },
    getNumberFormats: function () { return [Array(nc).fill('')]; }, setNumberFormats: function () {} }; }
};
function SS(nome, abas) { this.nome = nome; this.abas = abas; }
SS.prototype.getSheetByName = function (n) { return this.abas[n] || null; };
SS.prototype.getName = function () { return this.nome; };
var hojeD = new Date(); hojeD.setHours(0, 0, 0, 0);
var ontem = new Date(hojeD.getTime() - 86400000);
var PL = {
  EST: new SS('Estoque', {
    Estoque: new Sheet('Estoque', [['Código']].concat(DADOS.estoque)),
    Cadastro: new Sheet('Cadastro', [['Código']].concat(DADOS.cadastro)),
    Saidas: new Sheet('Saidas', [['Data'], [ontem, 'CAD-012-02', 'HID-JO-9025', 'x', 6, '', 'José Silva', 'caderno, folha 012'], [ontem, 'CAD-012-03', 'CON-008', 'x', 2, '', 'José Silva', 'caderno, folha 012'], [ontem, 'CAD-012-04', 'ELE-LU-20', 'x', 20, '', 'Raimundo', 'caderno, folha 012']], [4]),
    Entradas: new Sheet('Entradas', [['Data']], [5, 8]),
    Setores: new Sheet('Setores', [['c'], ['IMP-01', 'Bloco Pedagógico'], ['IMP-02', 'Quadra Poliesportiva'], ['T-01', 'Biblioteca + Sala dos Professores'], ['T-04', 'Refeitório']])
  }),
  EQ: new SS('Equip', {
    Equipamentos: new Sheet('Equipamentos', [['Código'],
      ['EQP-001', 'Caçamba estacionária 4m³', 'Caçamba', '', '', '', '', 'Ativo', 'Obra', '', '', '', 1],
      ['EQP-002', 'Gerador de energia bivolt', 'Gerador', '', '', '', '', 'Ativo', 'Fora do almoxarifado', 'Raimundo', '', '', 1],
      ['EQP-003', 'Motor de acionamento dupla isolação 220V', 'Motor', '', '', '', '', 'Em manutenção', 'Almoxarifado', '', '', '', 1],
      ['EQP-010', 'Furadeira de impacto', 'Ferramenta', '', '', '', '', 'Ativo', 'Almoxarifado', '', '', '', 1],
      ['EQP-045', 'Martelo', 'Ferramenta', '', '', '', '', 'Ativo', 'Parcial: 2 fora', 'José Silva (2)', '', '', 10]]),
    Movimentacao: new Sheet('Movimentacao', [['Data'],
      [ontem, 'EQP-002', '', 'saída', '', 'Raimundo', '', 'caderno, folha 003, CEQ-003-07 · estado na saída: OK', 1],
      [hojeD, 'EQP-045', '', 'saída', '', 'José Silva', '', 'caderno, folha 003, CEQ-003-08 · estado na saída: OK', 2]], [3])
  }),
  REG: new SS('Registro', { Log: new Sheet('Log', [['ID']]), Pendencias: new Sheet('Pendencias', [['Data']]) })
};
var PROPS = { MODO: 'TESTE', PLANILHA_ESTOQUE_ID: 'EST', PLANILHA_EQUIP_ID: 'EQ', PLANILHA_REGISTRO_ID: 'REG', PASTA_ASSINATURAS_ID: 'P', SEQ_APP: '0' };
var SpreadsheetApp = { openById: function (id) { return PL[id]; } };
var PropertiesService = { getScriptProperties: function () { return { getProperties: function () { return Object.assign({}, PROPS); }, getProperty: function (k) { return PROPS[k]; }, setProperty: function (k, v) { PROPS[k] = v; }, setProperties: function (o) { Object.assign(PROPS, o); } }; } };
var LockService = { getScriptLock: function () { return { waitLock: function () {}, releaseLock: function () {} }; } };
var Session = { getScriptTimeZone: function () { return 'America/Fortaleza'; } };
var Utilities = { formatDate: function (d, tz, f) { function p(n) { return ('0' + n).slice(-2); } return f.replace('yyyy', d.getFullYear()).replace('MM', p(d.getMonth() + 1)).replace('dd', p(d.getDate())).replace('HH', p(d.getHours())).replace('mm', p(d.getMinutes())); },
  newBlob: function (b, t, n) { return { nome: n }; }, base64Decode: function () { return []; } };
var DriveApp = { getFolderById: function () { var f = { getFoldersByName: function () { return { hasNext: function () { return false; } }; }, createFolder: function () { return f; }, createFile: function (b) { return { getUrl: function () { return 'drive://' + b.nome; } }; } }; return f; } };
var HtmlService = {}; var Logger = { log: function () {} };
${ler('Code.gs').replace(/^const /gm, 'var ')}
window.SEM_SINAL = false;
var google = { script: { get run() {
  var ok, falha;
  var o = { withSuccessHandler: function (f) { ok = f; return o; }, withFailureHandler: function (f) { falha = f; return o; } };
  ['api_iniciar', 'api_registrar', 'api_hoje'].forEach(function (fn) {
    o[fn] = function () { var a = JSON.parse(JSON.stringify(Array.prototype.slice.call(arguments)));
      setTimeout(function () { if (window.SEM_SINAL) return falha(new Error('NetworkError')); ok(window[fn].apply(null, a)); }, 250); };
  });
  return o;
} } };
</script>
${ler('App.html')}`);
fs.writeFileSync(path.join(__dirname, 'preview.html'), html);
console.log('ok: teste/preview.html');
