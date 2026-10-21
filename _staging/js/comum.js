/* F1 Analytics - nucleo comum a todas as paginas em JavaScript.
   Le window.F1_DADOS (gerado pela medida [JS Dados]), monta indices e oferece utilitarios.
   Regra do projeto: nenhum arquivo .js pode conter aspas duplas (o build verifica). */
(function () {
  'use strict';
  const W = window;
  if (W.F1 && typeof W.F1.destruir === 'function') { try { W.F1.destruir(); } catch (e) { /* ignora */ } }
  const D = W.F1_DADOS || {};
  const F1 = { D: D, vivo: true };
  W.F1 = F1;

  // ---------- ciclo de vida (o visual re-executa o script a cada atualizacao) ----------
  const timers = [], ouvintes = [];
  F1.intervalo = (fn, ms) => { const id = setInterval(fn, ms); timers.push(id); return id; };
  F1.espera = (fn, ms) => { const id = setTimeout(fn, ms); timers.push(id); return id; };
  F1.parar = (id) => { clearInterval(id); clearTimeout(id); };
  F1.ouvir = (alvo, ev, fn, opc) => { alvo.addEventListener(ev, fn, opc); ouvintes.push([alvo, ev, fn, opc]); };
  F1.anim = (fn) => {
    const loop = (t) => { if (!F1.vivo) return; if (fn(t) !== false) requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  };
  F1.destruir = () => {
    F1.vivo = false;
    timers.forEach((id) => { clearInterval(id); clearTimeout(id); });
    ouvintes.forEach(([a, e, f, o]) => a.removeEventListener(e, f, o));
  };

  // ---------- armazenamento local (pode nao existir dentro do visual) ----------
  const memoria = {};
  F1.ler = (k, padrao) => {
    try { const v = W.localStorage.getItem('f1a.' + k); if (v != null) return JSON.parse(v); } catch (e) { /* sem storage */ }
    return k in memoria ? memoria[k] : padrao;
  };
  F1.gravar = (k, v) => { memoria[k] = v; try { W.localStorage.setItem('f1a.' + k, JSON.stringify(v)); } catch (e) { /* sem storage */ } };

  // ---------- cores ----------
  const hslHex = (h, s, l) => {
    s /= 100; l /= 100;
    const k = (n) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
    const f = (n) => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))))).toString(16).padStart(2, '0');
    return '#' + f(0) + f(8) + f(4);
  };
  const corHash = (txt) => { let h = 0; for (const ch of String(txt)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return hslHex(h % 360, 62, 56); };
  F1.corHash = corHash;
  F1.rgb = (hex) => { const h = String(hex || '#888888').replace('#', ''); const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  F1.alfa = (hex, a) => { const [r, g, b] = F1.rgb(hex); return `rgba(${r},${g},${b},${a})`; };
  F1.luz = (hex) => { const [r, g, b] = F1.rgb(hex); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; };
  F1.contraste = (hex) => (F1.luz(hex) > 0.6 ? '#0B0D12' : '#FFFFFF');
  F1.distCor = (a, b) => { const x = F1.rgb(a), y = F1.rgb(b); return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]); };

  // ---------- dados ----------
  const pilotos = new Map(), equipes = new Map(), circuitos = new Map(), corridas = new Map();
  (D.pl || []).forEach((a) => {
    const nome = a[4] || '', sob = a[5] || '';
    pilotos.set(a[0], {
      k: a[0], id: a[1], cod: a[2] || sob.normalize('NFD').replace(/[̀-ͯ]/g, '').slice(0, 3).toUpperCase(),
      num: a[3] || '', nome: nome, sobrenome: sob, completo: (nome + ' ' + sob).trim(), nasc: a[6] || '', nac: a[7] || '', foto: a[8] || ''
    });
  });
  (D.eq || []).forEach((a) => equipes.set(a[0], { k: a[0], id: a[1], nome: a[2], nac: a[3], cor: a[4] || corHash(a[1]) }));
  (D.ci || []).forEach((a) => circuitos.set(a[0], { k: a[0], id: a[1], nome: a[2], cidade: a[3], pais: a[4], lat: +a[5], lng: +a[6] }));
  (D.co || []).forEach((a) => corridas.set(a[0], {
    k: a[0], ano: Math.floor(a[0] / 100), rod: a[0] % 100, circ: a[1], gp: a[2], data: a[3], voltas: a[4] || 0, tempo: a[5] || 0
  }));
  const resultados = (D.rs || []).map((a) => ({ c: a[0], ano: Math.floor(a[0] / 100), p: a[1], e: a[2], grid: a[3], pos: a[4], pts: +a[5], st: a[6], vr: a[7] }));
  const sprints = (D.sp || []).map((a) => ({ c: a[0], ano: Math.floor(a[0] / 100), p: a[1], e: a[2], pos: a[3], pts: +a[4] }));
  const vitorias = (D.vi || []).map((a) => ({ c: a[0], ano: Math.floor(a[0] / 100), p: a[1], e: a[2], grid: a[3] }));
  const classP = (D.cp || []).map((a) => ({ ano: a[0], rod: a[1], pos: a[2], p: a[3], e: a[4], pts: +a[5], vit: a[6] }));
  const classE = (D.ce || []).map((a) => ({ ano: a[0], rod: a[1], pos: a[2], e: a[3], pts: +a[4], vit: a[5] }));
  const hist = (D.ch || []).map((a) => ({ ano: a[0], nome: a[1], equipe: a[2], p: a[3] }));

  const agrupar = (lista, chave) => {
    const m = new Map();
    lista.forEach((x) => { const k = chave(x); let g = m.get(k); if (!g) m.set(k, (g = [])); g.push(x); });
    return m;
  };
  F1.agrupar = agrupar;
  const resPorPiloto = agrupar(resultados, (r) => r.p);
  const resPorCorrida = agrupar(resultados, (r) => r.c);
  resPorCorrida.forEach((l) => l.sort((a, b) => a.pos - b.pos));
  const spPorPiloto = agrupar(sprints, (r) => r.p);
  const spPorCorrida = agrupar(sprints, (r) => r.c);
  const corridasPorAno = agrupar([...corridas.values()], (c) => c.ano);
  corridasPorAno.forEach((l) => l.sort((a, b) => a.rod - b.rod));
  const corridasPorCircuito = agrupar([...corridas.values()], (c) => c.circ);
  const vitPorPiloto = agrupar(vitorias, (v) => v.p);
  const vitPorCorrida = agrupar(vitorias, (v) => v.c);

  Object.assign(F1, {
    pilotos, equipes, circuitos, corridas, resultados, sprints, vitorias, classP, classE, hist,
    resPorPiloto, resPorCorrida, spPorPiloto, spPorCorrida, corridasPorAno, corridasPorCircuito, vitPorPiloto, vitPorCorrida
  });

  const anos = [...new Set(resultados.map((r) => r.ano))].sort((a, b) => a - b);
  F1.anos = anos;
  F1.periodo = anos.length ? [anos[0], anos[anos.length - 1]] : [0, 0];
  F1.periodoTexto = !anos.length ? 'sem dados' : anos[0] === anos[anos.length - 1] ? String(anos[0]) : anos[0] + '–' + anos[anos.length - 1];

  // classificacao final disponivel por temporada
  const finalP = agrupar(classP, (x) => x.ano), finalE = agrupar(classE, (x) => x.ano);
  finalP.forEach((l) => l.sort((a, b) => (a.pos || 999) - (b.pos || 999)));
  finalE.forEach((l) => l.sort((a, b) => (a.pos || 999) - (b.pos || 999)));
  F1.finalP = finalP; F1.finalE = finalE;
  const ultimaRodada = (ano) => { const l = corridasPorAno.get(ano); return l && l.length ? l[l.length - 1].rod : 0; };
  F1.ultimaRodada = ultimaRodada;
  F1.temporadaCompleta = (ano) => { const l = finalP.get(ano); return !!(l && l.length && l[0].rod >= ultimaRodada(ano)); };
  F1.corridaRealizada = (c) => resPorCorrida.has(c);

  // campeoes: tabela historica + classificacao final da API (que prevalece)
  const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z]/g, '');
  F1.norm = norm;
  const porNome = new Map();
  pilotos.forEach((p) => { if (!porNome.has(norm(p.completo))) porNome.set(norm(p.completo), p.k); });
  const campeoes = new Map();
  hist.forEach((h) => campeoes.set(h.ano, { ano: h.ano, p: h.p > 0 ? h.p : porNome.get(norm(h.nome)) || 0, nome: h.nome, equipe: h.equipe, e: 0 }));
  finalP.forEach((l, ano) => {
    if (!F1.temporadaCompleta(ano) || !l[0] || l[0].pos !== 1) return;
    const p = pilotos.get(l[0].p), e = equipes.get(l[0].e);
    campeoes.set(ano, { ano: ano, p: l[0].p, nome: p ? p.completo : '', equipe: e ? e.nome : '', e: l[0].e });
  });
  F1.campeoes = campeoes;
  F1.campeoesEq = new Map();
  finalE.forEach((l, ano) => { if (F1.temporadaCompleta(ano) && l[0] && l[0].pos === 1) F1.campeoesEq.set(ano, l[0].e); });
  const titulos = new Map();
  campeoes.forEach((c) => { if (c.p) { if (!titulos.has(c.p)) titulos.set(c.p, []); titulos.get(c.p).push(c.ano); } });
  titulos.forEach((l) => l.sort((a, b) => a - b));
  F1.titulos = (p) => titulos.get(p) || [];
  F1.vitoriasCarreira = (p) => (vitPorPiloto.get(p) || []).length;

  // ---------- consultas ----------
  F1.p = (k) => pilotos.get(k) || { k: k, cod: '???', nome: '', sobrenome: '?', completo: '?', num: '', nac: '', foto: '' };
  F1.e = (k) => equipes.get(k) || { k: k, id: '', nome: '—', nac: '', cor: '#777777' };
  F1.equipeDoPiloto = (p, ano) => {
    const l = (resPorPiloto.get(p) || []).filter((r) => !ano || r.ano === ano);
    if (l.length) return l.reduce((a, b) => (b.c > a.c ? b : a)).e;
    const v = vitPorPiloto.get(p);
    return v && v.length ? v[v.length - 1].e : 0;
  };
  F1.corPiloto = (p, ano) => F1.e(F1.equipeDoPiloto(p, ano)).cor;
  F1.pilotosDoPeriodo = (ano) => {
    const s = new Set();
    resultados.forEach((r) => { if (!ano || r.ano === ano) s.add(r.p); });
    return [...s];
  };

  const cacheEst = new Map();
  F1.estat = (p, ano) => {
    const chave = p + '|' + (ano || 0);
    if (cacheEst.has(chave)) return cacheEst.get(chave);
    const lista = (resPorPiloto.get(p) || []).filter((r) => !ano || r.ano === ano);
    const sps = (spPorPiloto.get(p) || []).filter((r) => !ano || r.ano === ano);
    const s = { largadas: 0, vit: 0, pod: 0, pol: 0, pts: 0, dnf: 0, dsq: 0, vr: 0, nosPontos: 0, melhor: 0, nMelhor: 0, mediaPos: NaN, mediaGrid: NaN, ganho: 0, pontosPct: 0, anos: [], equipes: [] };
    let somaPos = 0, nPos = 0, somaGrid = 0, nGrid = 0, somaGanho = 0, nGanho = 0, melhor = 99;
    const anosSet = new Set(), eqMap = new Map();
    lista.forEach((r) => {
      s.pts += r.pts;
      if (r.st === 4) return; // nao largou
      s.largadas++;
      anosSet.add(r.ano);
      if (!eqMap.has(r.e)) eqMap.set(r.e, new Set());
      eqMap.get(r.e).add(r.ano);
      const cls = r.st <= 1;
      if (r.pos === 1 && cls) s.vit++;
      if (r.pos <= 3 && cls) s.pod++;
      if (r.grid === 1) s.pol++;
      if (r.vr) s.vr++;
      if (r.st === 2) s.dnf++;
      if (r.st === 3) s.dsq++;
      if (r.pts > 0) s.nosPontos++;
      if (r.grid > 0) { somaGrid += r.grid; nGrid++; }
      if (cls) {
        somaPos += r.pos; nPos++;
        if (r.pos < melhor) { melhor = r.pos; s.nMelhor = 0; }
        if (r.pos === melhor) s.nMelhor++;
        if (r.grid > 0) { somaGanho += r.grid - r.pos; nGanho++; }
      }
    });
    sps.forEach((r) => { s.pts += r.pts; });
    s.melhor = melhor === 99 ? 0 : melhor;
    s.mediaPos = nPos ? somaPos / nPos : NaN;
    s.mediaGrid = nGrid ? somaGrid / nGrid : NaN;
    s.ganho = nGanho ? somaGanho / nGanho : 0;
    s.pontosPct = s.largadas ? s.nosPontos / s.largadas : 0;
    s.anos = [...anosSet].sort((a, b) => a - b);
    s.equipes = [...eqMap.entries()].map(([e, a]) => ({ e: e, anos: [...a].sort((x, y) => x - y) })).sort((a, b) => a.anos[0] - b.anos[0]);
    cacheEst.set(chave, s);
    return s;
  };

  // atributos 40-99 por percentil entre os pilotos com amostra minima no periodo
  let cacheAtr = null;
  F1.ATRIBUTOS = [
    ['cla', 'Classificação', 'Posição média de largada'],
    ['cor', 'Ritmo de corrida', 'Posição média de chegada (classificado)'],
    ['ult', 'Ultrapassagem', 'Posições ganhas por corrida'],
    ['con', 'Regularidade', '% de corridas nos pontos'],
    ['cnf', 'Confiabilidade', '% de corridas sem abandono'],
    ['exp', 'Experiência', 'Largadas no período']
  ];
  F1.atributos = (p) => {
    if (!cacheAtr) {
      cacheAtr = new Map();
      const base = [];
      pilotos.forEach((pp) => { const s = F1.estat(pp.k); if (s.largadas >= 10 && !isNaN(s.mediaPos)) base.push([pp.k, s]); });
      if (base.length < 6) pilotos.forEach((pp) => { const s = F1.estat(pp.k); if (s.largadas > 0 && s.largadas < 10 && !isNaN(s.mediaPos)) base.push([pp.k, s]); });
      const f = {
        cla: (s) => -(isNaN(s.mediaGrid) ? 22 : s.mediaGrid), cor: (s) => -s.mediaPos, ult: (s) => s.ganho,
        con: (s) => s.pontosPct, cnf: (s) => 1 - (s.dnf + s.dsq) / Math.max(1, s.largadas), exp: (s) => s.largadas
      };
      const ord = {};
      Object.keys(f).forEach((m) => { ord[m] = base.map(([, s]) => f[m](s)).sort((a, b) => a - b); });
      const pct = (arr, v) => {
        let menor = 0, igual = 0;
        arr.forEach((x) => { if (x < v) menor++; else if (x === v) igual++; });
        return arr.length > 1 ? (menor + igual / 2 - 0.5) / (arr.length - 1) : 0.5;
      };
      base.forEach(([k, s]) => {
        const o = {};
        Object.keys(f).forEach((m) => { o[m] = Math.round(40 + 59 * Math.max(0, Math.min(1, pct(ord[m], f[m](s))))); });
        o.geral = Math.round(o.cla * 0.22 + o.cor * 0.3 + o.ult * 0.08 + o.con * 0.22 + o.cnf * 0.08 + o.exp * 0.1);
        cacheAtr.set(k, o);
      });
    }
    return cacheAtr.get(p) || null;
  };

  // pontos acumulados por rodada (corrida + sprint) de uma temporada
  F1.pontosAcumulados = (ano, porEquipe) => {
    const rodadas = (corridasPorAno.get(ano) || []).filter((c) => resPorCorrida.has(c.k));
    const tot = new Map(), vit = new Map(), quadros = [];
    rodadas.forEach((c) => {
      const soma = (r) => {
        const k = porEquipe ? r.e : r.p;
        tot.set(k, (tot.get(k) || 0) + r.pts);
      };
      (resPorCorrida.get(c.k) || []).forEach((r) => {
        soma(r);
        const k = porEquipe ? r.e : r.p;
        if (!tot.has(k)) tot.set(k, 0);
        if (r.pos === 1 && r.st <= 1) vit.set(k, (vit.get(k) || 0) + 1);
      });
      (spPorCorrida.get(c.k) || []).forEach(soma);
      quadros.push({ corrida: c, pts: new Map(tot), vit: new Map(vit) });
    });
    return quadros;
  };

  // ---------- nacionalidades e paises ----------
  const NAC = {
    British: ['gb', 'Reino Unido'], English: ['gb', 'Reino Unido'], Scottish: ['gb', 'Reino Unido'], Dutch: ['nl', 'Holanda'], Spanish: ['es', 'Espanha'],
    Monegasque: ['mc', 'Mônaco'], Mexican: ['mx', 'México'], Australian: ['au', 'Austrália'], French: ['fr', 'França'], German: ['de', 'Alemanha'],
    'East German': ['de', 'Alemanha'], 'West German': ['de', 'Alemanha'], Finnish: ['fi', 'Finlândia'], Canadian: ['ca', 'Canadá'],
    Danish: ['dk', 'Dinamarca'], Japanese: ['jp', 'Japão'], Thai: ['th', 'Tailândia'], Chinese: ['cn', 'China'], American: ['us', 'EUA'],
    'American-Italian': ['us', 'EUA'], Italian: ['it', 'Itália'], 'New Zealander': ['nz', 'Nova Zelândia'], Brazilian: ['br', 'Brasil'],
    Argentine: ['ar', 'Argentina'], Argentinian: ['ar', 'Argentina'], 'Argentine-Italian': ['ar', 'Argentina'], Belgian: ['be', 'Bélgica'],
    Swedish: ['se', 'Suécia'], Swiss: ['ch', 'Suíça'], Austrian: ['at', 'Áustria'], Russian: ['ru', 'Rússia'], Polish: ['pl', 'Polônia'],
    Venezuelan: ['ve', 'Venezuela'], Indonesian: ['id', 'Indonésia'], Indian: ['in', 'Índia'], Colombian: ['co', 'Colômbia'],
    Portuguese: ['pt', 'Portugal'], 'South African': ['za', 'África do Sul'], Hungarian: ['hu', 'Hungria'], Irish: ['ie', 'Irlanda'],
    Czech: ['cz', 'Tchéquia'], Malaysian: ['my', 'Malásia'], Rhodesian: ['zw', 'Rodésia'], Uruguayan: ['uy', 'Uruguai'], Chilean: ['cl', 'Chile'],
    Liechtensteiner: ['li', 'Liechtenstein'], Estonian: ['ee', 'Estônia'], Israeli: ['il', 'Israel'], Moroccan: ['ma', 'Marrocos']
  };
  const PAIS = {
    Bahrain: ['bh', 'Bahrein'], 'Saudi Arabia': ['sa', 'Arábia Saudita'], Australia: ['au', 'Austrália'], Japan: ['jp', 'Japão'], China: ['cn', 'China'],
    USA: ['us', 'EUA'], 'United States': ['us', 'EUA'], Italy: ['it', 'Itália'], Monaco: ['mc', 'Mônaco'], Canada: ['ca', 'Canadá'], Spain: ['es', 'Espanha'],
    Austria: ['at', 'Áustria'], UK: ['gb', 'Reino Unido'], 'United Kingdom': ['gb', 'Reino Unido'], Hungary: ['hu', 'Hungria'], Belgium: ['be', 'Bélgica'],
    Netherlands: ['nl', 'Holanda'], Azerbaijan: ['az', 'Azerbaijão'], Singapore: ['sg', 'Singapura'], Mexico: ['mx', 'México'], Brazil: ['br', 'Brasil'],
    Qatar: ['qa', 'Catar'], UAE: ['ae', 'Emirados Árabes'], 'United Arab Emirates': ['ae', 'Emirados Árabes'], France: ['fr', 'França'], Germany: ['de', 'Alemanha'],
    Portugal: ['pt', 'Portugal'], Russia: ['ru', 'Rússia'], Turkey: ['tr', 'Turquia'], Malaysia: ['my', 'Malásia'], Korea: ['kr', 'Coreia do Sul'],
    India: ['in', 'Índia'], Argentina: ['ar', 'Argentina'], 'South Africa': ['za', 'África do Sul'], Sweden: ['se', 'Suécia'], Switzerland: ['ch', 'Suíça'],
    Morocco: ['ma', 'Marrocos'], Vietnam: ['vn', 'Vietnã'], Madrid: ['es', 'Espanha']
  };
  F1.nac = (n) => NAC[n] || ['', n || '—'];
  F1.pais = (n) => PAIS[n] || ['', n || '—'];
  F1.bandeira = (iso, w) => (iso ? `<img class='f1-flag' src='https://flagcdn.com/w${w || 40}/${iso}.png' alt='' onerror='this.remove()'>` : '');
  F1.bandeiraNac = (n) => F1.bandeira(F1.nac(n)[0]);
  F1.bandeiraPais = (n) => F1.bandeira(F1.pais(n)[0]);

  // ---------- formatacao ----------
  F1.esc = (s) => String(s == null ? '' : s).replace(/[&<>'`]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\'': '&#39;', '`': '&#96;' }[c]));
  F1.fmt = (n, dec) => (n == null || isNaN(n) ? '—' : Number(n).toLocaleString('pt-BR', { minimumFractionDigits: dec || 0, maximumFractionDigits: dec || 0 }));
  F1.pts = (n) => F1.fmt(n, n % 1 ? 1 : 0);
  F1.pct = (n, dec) => (isNaN(n) ? '—' : F1.fmt(n * 100, dec == null ? 0 : dec) + '%');
  F1.idade = (nasc, ref) => {
    if (!nasc) return null;
    const d = new Date(nasc + 'T00:00:00'), h = ref ? new Date(ref + 'T00:00:00') : new Date();
    let a = h.getFullYear() - d.getFullYear();
    if (h.getMonth() < d.getMonth() || (h.getMonth() === d.getMonth() && h.getDate() < d.getDate())) a--;
    return a;
  };
  F1.data = (iso) => (iso ? iso.slice(8, 10) + '/' + iso.slice(5, 7) + '/' + iso.slice(0, 4) : '');
  F1.dataCurta = (iso) => {
    if (!iso) return '';
    const m = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'][+iso.slice(5, 7) - 1];
    return +iso.slice(8, 10) + ' ' + m;
  };
  F1.gpNome = (c) => { const r = corridas.get(c); return r ? 'GP ' + (GP_PT[r.gp] || r.gp) : ''; };
  const GP_PT = {
    Bahrain: 'do Bahrein', 'Saudi Arabian': 'da Arábia Saudita', Australian: 'da Austrália', Japanese: 'do Japão', Chinese: 'da China', Miami: 'de Miami',
    'Emilia Romagna': 'da Emília-Romanha', Monaco: 'de Mônaco', Canadian: 'do Canadá', Spanish: 'da Espanha', Austrian: 'da Áustria', British: 'da Inglaterra',
    Hungarian: 'da Hungria', Belgian: 'da Bélgica', Dutch: 'da Holanda', Italian: 'da Itália', Azerbaijan: 'do Azerbaijão', Singapore: 'de Singapura',
    'United States': 'dos EUA', 'Mexico City': 'da Cidade do México', Mexican: 'do México', 'São Paulo': 'de São Paulo', Brazilian: 'do Brasil',
    'Las Vegas': 'de Las Vegas', Qatar: 'do Catar', 'Abu Dhabi': 'de Abu Dhabi', French: 'da França', German: 'da Alemanha', Portuguese: 'de Portugal',
    Russian: 'da Rússia', Turkish: 'da Turquia', Malaysian: 'da Malásia', Korean: 'da Coreia', Indian: 'da Índia', European: 'da Europa',
    Styrian: 'da Estíria', Tuscan: 'da Toscana', Eifel: 'de Eifel', Sakhir: 'de Sakhir', '70th Anniversary': 'dos 70 Anos', Argentine: 'da Argentina',
    'South African': 'da África do Sul', Swedish: 'da Suécia', Swiss: 'da Suíça', Moroccan: 'do Marrocos', 'San Marino': 'de San Marino',
    Pacific: 'do Pacífico', Luxembourg: 'de Luxemburgo', 'Caesars Palace': 'de Caesars Palace', Detroit: 'de Detroit', Dallas: 'de Dallas',
    'United States West': 'dos EUA-Oeste', 'Indianapolis 500': 'Indy 500', Madrid: 'de Madri', Spain: 'da Espanha'
  };
  F1.gpCurto = (c) => { const r = corridas.get(c); return r ? r.gp : ''; };

  // ---------- componentes ----------
  F1.iniciais = (p) => { const pi = F1.p(p); return ((pi.nome[0] || '') + (pi.sobrenome[0] || '')).toUpperCase(); };
  F1.avatar = (p, cls, ano) => {
    const pi = F1.p(p), cor = F1.corPiloto(p, ano);
    const img = pi.foto ? `<img src='${F1.esc(pi.foto)}' alt='' loading='lazy' onerror='this.remove()'>` : '';
    return `<div class='f1-av ${cls || ''}' style='--c:${cor}'><span>${F1.esc(F1.iniciais(p))}</span>${img}</div>`;
  };

  // contador animado
  F1.contar = (el, valor, dec, dur) => {
    if (!el) return;
    const ini = performance.now(), d = dur || 700, alvo = +valor || 0;
    if (!alvo) { el.textContent = F1.fmt(0, dec); return; }
    F1.anim((t) => {
      const k = Math.min(1, (t - ini) / d), e = 1 - Math.pow(1 - k, 3);
      el.textContent = F1.fmt(alvo * e, dec);
      return k < 1;
    });
  };

  // tooltip
  let tip = null;
  F1.tip = (html, ev) => {
    if (!tip) return;
    tip.innerHTML = html;
    tip.style.display = 'block';
    const w = W.innerWidth, h = W.innerHeight, r = tip.getBoundingClientRect();
    let x = ev.clientX + 14, y = ev.clientY + 14;
    if (x + r.width > w - 4) x = ev.clientX - r.width - 12;
    if (y + r.height > h - 4) y = ev.clientY - r.height - 12;
    tip.style.left = Math.max(4, x) + 'px';
    tip.style.top = Math.max(4, y) + 'px';
  };
  F1.tipOcultar = () => { if (tip) tip.style.display = 'none'; };
  // qualquer elemento com data-tip mostra o texto
  F1.ligarDicas = (raiz) => {
    F1.ouvir(raiz, 'mousemove', (ev) => {
      const alvo = ev.target.closest ? ev.target.closest('[data-tip]') : null;
      if (alvo) F1.tip(alvo.getAttribute('data-tip'), ev); else F1.tipOcultar();
    });
    F1.ouvir(raiz, 'mouseleave', F1.tipOcultar);
  };

  // palco 1280x720 escalado para o tamanho do visual
  F1.palco = (titulo, sub) => {
    let raiz = document.getElementById('app-raiz');
    if (!raiz) { raiz = document.createElement('div'); raiz.id = 'app-raiz'; document.body.appendChild(raiz); }
    raiz.innerHTML = `<div class='f1-fundo'></div><div class='f1-palco'><header class='f1-topo'>` +
      `<div class='f1-titulo'><span class='f1-tit'>${F1.esc(titulo)}</span><span class='f1-sub'>${F1.esc(sub || '')}</span></div>` +
      `<div class='f1-marca'><i></i><b>F1</b><span>ANALYTICS</span></div></header></div><div class='f1-tip'></div>`;
    tip = raiz.querySelector('.f1-tip');
    const palco = raiz.querySelector('.f1-palco');
    const ajustar = () => {
      const w = raiz.clientWidth || W.innerWidth || 1280, h = raiz.clientHeight || W.innerHeight || 720;
      const s = Math.min(w / 1280, h / 720);
      F1.escala = s;
      palco.style.transform = `translate(${(w - 1280 * s) / 2}px, ${(h - 720 * s) / 2}px) scale(${s})`;
    };
    ajustar();
    F1.ouvir(W, 'resize', ajustar);
    F1.ligarDicas(palco);
    if (!resultados.length) palco.insertAdjacentHTML('beforeend', `<div class='f1-vazio'><b>Sem dados</b>Atualize o modelo no Power BI Desktop (Página Inicial › Atualizar).</div>`);
    F1.raiz = raiz;
    return palco;
  };

  // seletor com busca (lista suspensa propria, funciona dentro do palco escalado)
  F1.seletor = (alvo, opc) => {
    const estado = { valor: opc.valor, itens: opc.itens || [] };
    alvo.classList.add('f1-sel');
    const desenhar = () => {
      const it = estado.itens.find((i) => i.v === estado.valor) || { txt: opc.vazio || 'Selecionar…' };
      alvo.innerHTML = `<button class='f1-sel-btn' style='--c:${it.cor || 'var(--borda)'}'>${it.img || ''}<span class='f1-sel-txt'><b>${F1.esc(it.txt)}</b>` +
        `${it.sub ? `<small>${F1.esc(it.sub)}</small>` : ''}</span><i class='f1-sel-seta'></i></button>`;
    };
    const fechar = () => { const p = alvo.querySelector('.f1-sel-pop'); if (p) p.remove(); alvo.classList.remove('aberto'); };
    const abrir = () => {
      fechar();
      alvo.classList.add('aberto');
      alvo.insertAdjacentHTML('beforeend', `<div class='f1-sel-pop'><input class='f1-busca' placeholder='${F1.esc(opc.placeholder || 'Buscar…')}' spellcheck='false'><div class='f1-sel-lista f1-scroll'></div></div>`);
      const inp = alvo.querySelector('.f1-sel-pop input'), lista = alvo.querySelector('.f1-sel-lista');
      const filtrar = () => {
        const q = F1.norm(inp.value);
        const vis = estado.itens.filter((i) => !q || F1.norm(i.txt + ' ' + (i.sub || '') + ' ' + (i.busca || '')).includes(q)).slice(0, 200);
        lista.innerHTML = vis.map((i) => `<div class='f1-sel-it${i.v === estado.valor ? ' on' : ''}' data-v='${F1.esc(i.v)}' style='--c:${i.cor || 'transparent'}'>` +
          `${i.img || ''}<span><b>${F1.esc(i.txt)}</b>${i.sub ? `<small>${F1.esc(i.sub)}</small>` : ''}</span>${i.dir ? `<em>${i.dir}</em>` : ''}</div>`).join('') ||
          `<div class='f1-sel-nada'>Nada encontrado</div>`;
      };
      filtrar();
      inp.addEventListener('input', filtrar);
      inp.addEventListener('keydown', (ev) => {
        if (ev.key === 'Escape') fechar();
        if (ev.key === 'Enter') { const pri = lista.querySelector('.f1-sel-it'); if (pri) pri.click(); }
      });
      lista.addEventListener('click', (ev) => {
        const it = ev.target.closest('.f1-sel-it');
        if (!it) return;
        const v = estado.itens.find((i) => String(i.v) === it.getAttribute('data-v'));
        fechar();
        if (v) { estado.valor = v.v; desenhar(); if (opc.aoMudar) opc.aoMudar(v.v); }
      });
      setTimeout(() => inp.focus(), 10);
    };
    alvo.addEventListener('click', (ev) => { if (ev.target.closest('.f1-sel-btn')) { if (alvo.classList.contains('aberto')) fechar(); else abrir(); } });
    F1.ouvir(document, 'mousedown', (ev) => { if (!alvo.contains(ev.target)) fechar(); });
    desenhar();
    return {
      definir: (v, silencioso) => { estado.valor = v; desenhar(); if (!silencioso && opc.aoMudar) opc.aoMudar(v); },
      itens: (lista, v) => { estado.itens = lista; if (v !== undefined) estado.valor = v; desenhar(); },
      valor: () => estado.valor
    };
  };

  F1.itemPiloto = (p, ano, dir) => {
    const pi = F1.p(p), e = F1.e(F1.equipeDoPiloto(p, ano));
    return { v: p, txt: pi.completo, sub: e.nome, cor: e.cor, img: F1.avatar(p, 'mini', ano), dir: dir, busca: pi.cod };
  };

  // gerador pseudoaleatorio com semente (mulberry32)
  F1.rng = (semente) => {
    let a = semente >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  F1.hash = (txt) => { let h = 2166136261; for (const ch of String(txt)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  F1.embaralhar = (arr, r) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor((r || Math.random)() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
})();
