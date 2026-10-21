/* Abre cada página num Chromium headless, imitando o visual HTML Content (CSS + dados + script),
   tira screenshots e falha se houver erro de JavaScript.
   Uso: node _staging/teste/renderizar.js <pasta_saida> [larguraxaltura] */
const fs = require('fs'), path = require('path');
const { chromium } = require(process.env.PW_PATH || 'playwright');
const JS = path.join(__dirname, '..', 'js');
const PAGINAS = require('./paginas.json');
const ler = (f) => fs.readFileSync(path.join(JS, f), 'utf8');
const saida = process.argv[2] || 'saida';
const [W, H] = (process.argv[3] || '1280x720').split('x').map(Number);
fs.mkdirSync(saida, { recursive: true });
const dados = fs.readFileSync(path.join(__dirname, 'dados.js'), 'utf8');

const ACOES = {
  Pilotos: async (pg, foto) => { await pg.click('.pl-it:nth-child(3)'); await pg.waitForTimeout(800); await foto('2'); await pg.selectOption('.pl-ano', '2021'); await pg.waitForTimeout(800); await foto('3'); },
  Duelo: async (pg, foto) => { await pg.click('.du-a .f1-sel-btn'); await pg.waitForTimeout(300); await foto('2'); await pg.keyboard.type('alon'); await pg.keyboard.press('Enter'); await pg.waitForTimeout(600); await foto('3'); },
  Temporada: async (pg, foto) => { await pg.click('.te-ano[data-a=\'2026\']'); await pg.click('.te-play'); await pg.waitForTimeout(2600); await foto('2'); await pg.click('.te-gp-it:nth-child(4)'); await pg.waitForTimeout(600); await foto('3'); },
  Circuitos: async (pg, foto) => { await pg.click('.ci-reg button[data-r=\'europa\']'); await pg.waitForTimeout(900); await foto('2'); },
  Simulador: async (pg, foto) => {
    await pg.click('.si-vel button[data-v=\'12\']'); await pg.click('.si-largar'); await pg.waitForTimeout(9000); await foto('2');
    await pg.click('.si-pular'); await pg.waitForTimeout(600); await foto('3');
    await pg.click('.si-mc'); await pg.waitForFunction(() => !document.querySelector('.si-mc').disabled, null, { timeout: 60000 }); await foto('4');
  },
  Quiz: async (pg, foto) => { await pg.click('.qz-go'); await pg.waitForTimeout(3000); await foto('2'); await pg.keyboard.press('1'); await pg.waitForTimeout(400); await foto('3');
    for (let i = 0; i < 9; i++) { await pg.click('.qz-prox'); await pg.waitForTimeout(150); await pg.keyboard.press(String(1 + (i % 4))); await pg.waitForTimeout(100); }
    await pg.click('.qz-prox'); await pg.waitForTimeout(400); await foto('4'); }
};

(async () => {
  const exe = process.env.CHROME_PATH; const nav = await chromium.launch(exe ? { executablePath: exe } : {});
  let falhas = 0;
  for (const [nome, arquivos] of Object.entries(PAGINAS)) {
    const css = ler('comum.css') + '\n' + ler(arquivos[arquivos.length - 1] + '.css');
    const js = ler('comum.js') + '\n' + arquivos.map((a) => ler(a + '.js')).join('\n');
    const html = `<!doctype html><html><head><meta charset='utf-8'><style>html,body{margin:0;height:100%;background:#000}${css}</style></head>` +
      `<body><div id='app-raiz'></div><script>${dados}</script><script>${js}</script></body></html>`;
    const pg = await nav.newPage({ viewport: { width: W, height: H } });
    const erros = [];
    pg.on('pageerror', (e) => erros.push('pageerror: ' + e.message));
    pg.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|ERR_|net::/.test(m.text())) erros.push('console: ' + m.text()); });
    await pg.route(/^https?:\/\//, (rt) => rt.abort());
    await pg.setContent(html);
    await pg.waitForTimeout(900);
    const foto = async (suf) => pg.screenshot({ path: path.join(saida, `${nome}-${suf}.png`) });
    await foto('1');
    try { if (ACOES[nome]) await ACOES[nome](pg, foto); } catch (e) { erros.push('ação: ' + e.message); }
    console.log(`${erros.length ? '✗' : '✓'} ${nome}${erros.length ? '\n   ' + erros.join('\n   ') : ''}`);
    falhas += erros.length;
    await pg.close();
  }
  await nav.close();
  process.exit(falhas ? 1 : 0);
})();
