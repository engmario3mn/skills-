"""Gera os PDFs dos prompts e POPs a partir dos .md desta pasta.
Uso: python3 documentos/gerar_pdfs.py  (precisa de: pip install markdown, e do Playwright/Chromium)"""
import glob, os, re, subprocess, sys, tempfile
import markdown

AQUI = os.path.dirname(os.path.abspath(__file__))
SAIDA = os.path.join(AQUI, 'pdf')
os.makedirs(SAIDA, exist_ok=True)
CSS = """
@page { size: A4; margin: 16mm 15mm 18mm; }
body { font-family: Arial, Helvetica, sans-serif; font-size: 10.5pt; line-height: 1.38; color: #111; }
h1 { font-size: 16pt; margin: 0 0 4pt; color: #9b1c1c; }
h2 { font-size: 12.5pt; margin: 14pt 0 5pt; border-bottom: 1px solid #999; padding-bottom: 2pt; break-after: avoid; }
h3 { font-size: 11pt; margin: 10pt 0 3pt; break-after: avoid; }
p { margin: 4pt 0; } ul, ol { margin: 3pt 0; padding-left: 18pt; } li { margin: 1.5pt 0; }
table { border-collapse: collapse; margin: 6pt 0; width: 100%; break-inside: avoid; }
th, td { border: 1px solid #888; padding: 3pt 6pt; text-align: left; vertical-align: top; }
th { background: #eee; }
pre { background: #f3f3f3; border: 1px solid #ccc; padding: 6pt 8pt; font-size: 8.8pt; white-space: pre-wrap; break-inside: avoid; }
code { font-family: "DejaVu Sans Mono", monospace; font-size: 9.2pt; }
a { color: #111; text-decoration: none; word-break: break-all; }
"""
JS = """
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage();
  for (let i = 2; i < process.argv.length; i += 3) {
    await p.goto('file://' + process.argv[i]);
    await p.pdf({ path: process.argv[i + 1], format: 'A4', printBackground: true, displayHeaderFooter: true,
      headerTemplate: '<span></span>',
      footerTemplate: '<div style="font-size:7.5pt;width:100%;padding:0 15mm;color:#555;display:flex;justify-content:space-between"><span>' + process.argv[i + 2] + ' · Escola de Bombeiros · 3 MN</span><span>Pág. <span class="pageNumber"></span> de <span class="totalPages"></span></span></div>' });
  }
  await b.close(); })();
"""
tmp = tempfile.mkdtemp()
args = []
for md in sorted(glob.glob(os.path.join(AQUI, '*.md'))):
    nome = os.path.basename(md)[:-3]
    texto = open(md, encoding='utf-8').read()
    # a biblioteca markdown só reconhece sublista com 4 espaços de recuo
    texto = re.sub(r'^ {2,3}(?=\S)', '    ', texto, flags=re.M)
    corpo = markdown.markdown(texto, extensions=['tables', 'fenced_code', 'sane_lists'])
    h = os.path.join(tmp, nome + '.html')
    open(h, 'w', encoding='utf-8').write('<!doctype html><meta charset="utf-8"><style>%s</style>%s' % (CSS, corpo))
    args += [h, os.path.join(SAIDA, nome + '.pdf'), nome.replace('_', ' ')]
js = os.path.join(tmp, 'pdf.js'); open(js, 'w').write(JS)
subprocess.run(['node', js] + args, check=True, env=dict(os.environ, NODE_PATH=subprocess.run(['npm', 'root', '-g'], capture_output=True, text=True).stdout.strip()))
print('\n'.join(sorted(os.listdir(SAIDA))))
