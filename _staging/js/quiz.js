/* Pagina Quiz: quatro tipos de pergunta gerados a partir dos dados, cronometro, sequencia e recorde. */
(function () {
  'use strict';
  const F1 = window.F1;
  const palco = F1.palco('Quiz', 'Quanto você sabe de F1?');
  palco.insertAdjacentHTML('beforeend', `<section class='qz-caixa f1-cartao'></section><aside class='qz-lado f1-cartao'></aside>`);
  const $ = (s) => palco.querySelector(s);
  const TOTAL = 10, TEMPO = 15;
  const MODOS = [
    ['misto', 'Misto', 'Um pouco de tudo'],
    ['piloto', 'Quem é esse piloto?', 'Pistas reveladas aos poucos'],
    ['vencedor', 'Quem venceu?', 'Vencedores de GPs do período'],
    ['equipe', 'Qual equipe?', 'Por quem o piloto correu'],
    ['campeao', 'Campeões', 'Todos os campeões desde 1950']
  ];
  const est = { modo: F1.ler('qz.modo', 'misto'), ano: 0, q: null, n: 0, pontos: 0, acertos: 0, seq: 0, maxSeq: 0, t0: 0, timer: null, respondido: false, hist: [] };

  const elegiveis = (ano) => F1.pilotosDoPeriodo(ano).filter((p) => F1.estat(p, ano).largadas >= (ano ? 3 : 15));
  const sortear = (arr, r) => arr[Math.floor(r() * arr.length)];
  const r = Math.random;

  // ---------- geradores de pergunta ----------
  const G = {
    piloto: () => {
      const pool = elegiveis(est.ano);
      if (pool.length < 4) return null;
      const p = sortear(pool, r), pi = F1.p(p), s = F1.estat(p, est.ano), e = F1.e(F1.equipeDoPiloto(p, est.ano)), nac = F1.nac(pi.nac);
      const outros = F1.embaralhar(pool.filter((x) => x !== p), r).slice(0, 3);
      const pistas = [
        `${F1.bandeira(nac[0])} Nacionalidade: <b>${F1.esc(nac[1])}</b>`,
        pi.nasc ? `Nasceu em <b>${pi.nasc.slice(0, 4)}</b>` : `Sigla com <b>${pi.cod.length}</b> letras`,
        `Correu pela <b style='color:${e.cor}'>${F1.esc(e.nome)}</b>${est.ano ? ' em ' + est.ano : ''}`,
        `<b>${s.vit}</b> vitórias e <b>${s.pod}</b> pódios ${est.ano ? 'em ' + est.ano : 'no período'}`,
        pi.num ? `Número permanente <b>#${F1.esc(pi.num)}</b>` : `Sigla: <b>${F1.esc(pi.cod)}</b>`
      ];
      return { tipo: 'piloto', enun: 'Quem é esse piloto?', certo: p, opcoes: F1.embaralhar([p, ...outros], r), pistas, foto: pi.foto, cor: e.cor };
    },
    vencedor: () => {
      const corr = [...F1.resPorCorrida.keys()].filter((c) => !est.ano || Math.floor(c / 100) === est.ano);
      if (!corr.length) return null;
      const c = sortear(corr, r), rs = F1.resPorCorrida.get(c), v = rs[0].p;
      const outros = F1.embaralhar(rs.slice(1, 8).map((x) => x.p), r).slice(0, 3);
      if (outros.length < 3) return null;
      const ci = F1.circuitos.get(F1.corridas.get(c).circ);
      return {
        tipo: 'vencedor', enun: `Quem venceu o ${F1.gpNome(c)} de ${Math.floor(c / 100)}?`, certo: v, opcoes: F1.embaralhar([v, ...outros], r),
        pistas: [`${ci ? F1.bandeiraPais(ci.pais) : ''} ${F1.esc(ci ? ci.nome : '')}`, `Largou em <b>P${rs[0].grid || '—'}</b>`], cor: F1.e(rs[0].e).cor
      };
    },
    equipe: () => {
      const pool = elegiveis(est.ano);
      if (!pool.length) return null;
      const p = sortear(pool, r), anos = F1.estat(p, est.ano).anos, ano = est.ano || sortear(anos, r);
      const e = F1.equipeDoPiloto(p, ano);
      const doAno = [...new Set(F1.resultados.filter((x) => x.ano === ano).map((x) => x.e))].filter((x) => x !== e);
      if (doAno.length < 3) return null;
      const outras = F1.embaralhar(doAno, r).slice(0, 3);
      return { tipo: 'equipe', enun: `Por qual equipe ${F1.p(p).completo} correu em ${ano}?`, certo: e, opcoes: F1.embaralhar([e, ...outras], r), piloto: p, ano, pistas: [], cor: F1.e(e).cor };
    },
    campeao: () => {
      const anos = [...F1.campeoes.keys()].filter((a) => F1.campeoes.get(a).nome);
      if (anos.length < 4) return null;
      const a = sortear(anos, r), c = F1.campeoes.get(a);
      const perto = F1.embaralhar(anos.filter((x) => F1.campeoes.get(x).nome !== c.nome).sort((x, y) => Math.abs(x - a) - Math.abs(y - a)).slice(0, 10), r);
      const nomes = [];
      perto.forEach((x) => { const n = F1.campeoes.get(x).nome; if (!nomes.includes(n) && nomes.length < 3) nomes.push(n); });
      return { tipo: 'campeao', enun: `Quem foi o campeão mundial de ${a}?`, certo: c.nome, opcoes: F1.embaralhar([c.nome, ...nomes], r), pistas: [`Pela <b>${F1.esc(c.equipe)}</b>`], cor: '#FFD24A', campeao: c };
    }
  };
  const gerar = () => {
    for (let i = 0; i < 30; i++) {
      const tipo = est.modo === 'misto' ? sortear(['piloto', 'vencedor', 'equipe', 'campeao', 'vencedor', 'piloto'], r) : est.modo;
      const q = G[tipo]();
      if (q && !est.hist.includes(q.enun + q.certo)) { est.hist.push(q.enun + q.certo); return q; }
    }
    return G.campeao() || G.vencedor();
  };

  // ---------- telas ----------
  const recorde = () => F1.ler('qz.rec.' + est.modo, 0);
  const lado = () => {
    $('.qz-lado').innerHTML = `<div class='f1-rot'>Placar</div>
      <div class='qz-pl'><small>PONTOS</small><b>${est.pontos}</b></div>
      <div class='qz-pl'><small>ACERTOS</small><b>${est.acertos}<span>/${Math.max(est.n - (est.respondido ? 0 : 1), 0)}</span></b></div>
      <div class='qz-pl'><small>SEQUÊNCIA</small><b>${est.seq}${est.seq >= 3 ? ' 🔥' : ''}</b></div>
      <div class='qz-pl rec'><small>RECORDE (${F1.esc(MODOS.find((m) => m[0] === est.modo)[1])})</small><b>${recorde()}</b></div>
      <div class='qz-regras'>Acerto vale 100 + bônus de tempo (até 50). Sequências de 3+ acertos dobram o bônus. Atalho: teclas 1 a 4.</div>`;
  };

  const inicio = () => {
    F1.parar(est.timer);
    const anos = F1.anos.slice().reverse().map((a) => `<option value='${a}'${a === est.ano ? ' selected' : ''}>${a}</option>`).join('');
    $('.qz-caixa').innerHTML = `<div class='qz-ini f1-entra'>
      <div class='qz-logo'><b>?</b></div><h2>Quiz de Fórmula 1</h2><p>${TOTAL} perguntas · ${TEMPO} segundos cada</p>
      <div class='qz-modos'>${MODOS.map(([k, n, d]) => `<button class='qz-modo${k === est.modo ? ' on' : ''}' data-m='${k}'><b>${n}</b><small>${d}</small><em>Recorde ${F1.ler('qz.rec.' + k, 0)}</em></button>`).join('')}</div>
      <div class='qz-cfg'><span>Temporada</span><select class='f1-select qz-ano'><option value='0'>Período ${F1.periodoTexto}</option>${anos}</select></div>
      <button class='f1-btn prim qz-go'>Começar ▶</button></div>`;
    est.n = 0; est.pontos = 0; est.acertos = 0; est.seq = 0; est.maxSeq = 0; est.hist = []; est.respondido = true;
    lado();
  };

  const opcaoHtml = (q, o, i) => {
    if (q.tipo === 'equipe') { const e = F1.e(o); return `<button class='qz-op' data-i='${i}' style='--c:${e.cor}'><kbd>${i + 1}</kbd><i class='qz-eq'></i><b>${F1.esc(e.nome)}</b></button>`; }
    if (q.tipo === 'campeao') return `<button class='qz-op' data-i='${i}' style='--c:#3A4253'><kbd>${i + 1}</kbd><b>${F1.esc(o)}</b></button>`;
    const pi = F1.p(o);
    return `<button class='qz-op' data-i='${i}' style='--c:${F1.corPiloto(o, q.ano || est.ano)}'><kbd>${i + 1}</kbd>${F1.avatar(o, 'mini', q.ano || est.ano)}<b>${F1.esc(pi.completo)}</b></button>`;
  };

  const pergunta = () => {
    const q = gerar();
    if (!q) { $('.qz-caixa').innerHTML = `<div class='qz-ini'><h2>Dados insuficientes</h2><p>Carregue mais temporadas para jogar.</p></div>`; return; }
    est.q = q; est.n++; est.respondido = false; est.t0 = performance.now();
    let visual = '';
    if (q.tipo === 'piloto') visual = `<div class='qz-sil' style='--c:${q.cor}'>${q.foto ? `<img src='${F1.esc(q.foto)}' alt='' onerror='this.remove()'>` : ''}<span>?</span></div>`;
    else if (q.tipo === 'equipe') visual = `<div class='qz-sil cl'>${F1.avatar(q.piloto, 'grande', q.ano)}</div>`;
    else if (q.tipo === 'vencedor') visual = `<div class='qz-trofeu'>🏆</div>`;
    else visual = `<div class='qz-trofeu'>★</div>`;
    $('.qz-caixa').innerHTML = `<div class='qz-top'><span>Pergunta <b>${est.n}</b>/${TOTAL}</span><div class='qz-tempo'><i></i></div><span class='qz-seg'>${TEMPO}s</span></div>
      <div class='qz-corpo f1-entra'>${visual}<div class='qz-enun'><h3>${F1.esc(q.enun)}</h3><div class='qz-pistas'>${q.pistas.map((p, i) => `<div class='qz-pista${q.tipo === 'piloto' && i > 0 ? ' oculta' : ''}'>${p}</div>`).join('')}</div></div></div>
      <div class='qz-ops'>${q.opcoes.map((o, i) => opcaoHtml(q, o, i)).join('')}</div><div class='qz-fb'></div>`;
    lado();
    const barra = $('.qz-tempo i'), seg = $('.qz-seg');
    F1.parar(est.timer);
    est.timer = F1.intervalo(() => {
      const t = (performance.now() - est.t0) / 1000, resto = Math.max(0, TEMPO - t);
      barra.style.width = (resto / TEMPO) * 100 + '%';
      barra.classList.toggle('alerta', resto < 5);
      seg.textContent = Math.ceil(resto) + 's';
      if (q.tipo === 'piloto') palco.querySelectorAll('.qz-pista').forEach((el, i) => { if (t > i * 2.6) el.classList.remove('oculta'); });
      if (resto <= 0) responder(-1);
    }, 100);
  };

  const responder = (i) => {
    if (est.respondido) return;
    est.respondido = true;
    F1.parar(est.timer);
    const q = est.q, t = (performance.now() - est.t0) / 1000;
    const certoIdx = q.opcoes.findIndex((o) => o === q.certo), ok = i === certoIdx;
    let ganho = 0;
    if (ok) {
      est.acertos++; est.seq++; est.maxSeq = Math.max(est.maxSeq, est.seq);
      const bonus = Math.round(50 * Math.max(0, 1 - t / TEMPO));
      ganho = 100 + (est.seq >= 3 ? bonus * 2 : bonus);
      est.pontos += ganho;
    } else est.seq = 0;
    palco.querySelectorAll('.qz-op').forEach((b, k) => { b.disabled = true; if (k === certoIdx) b.classList.add('certo'); else if (k === i) b.classList.add('errado'); });
    palco.querySelectorAll('.qz-pista').forEach((el) => el.classList.remove('oculta'));
    const sil = $('.qz-sil'); if (sil) sil.classList.add('revela');
    let extra = '';
    if (q.tipo === 'piloto') extra = F1.esc(F1.p(q.certo).completo);
    else if (q.tipo === 'equipe') extra = F1.esc(F1.e(q.certo).nome);
    else if (q.tipo === 'campeao') extra = F1.esc(q.certo) + ' · ' + F1.esc(q.campeao.equipe);
    else extra = F1.esc(F1.p(q.certo).completo);
    $('.qz-fb').innerHTML = `<div class='${ok ? 'ok' : 'nok'}'>${ok ? `Certo! +${ganho}` : i < 0 ? 'Tempo esgotado!' : 'Errou!'} <span>${extra}</span></div>` +
      `<button class='f1-btn prim qz-prox'>${est.n >= TOTAL ? 'Ver resultado' : 'Próxima ▶'}</button>`;
    lado();
  };

  const fim = () => {
    const rec = recorde(), novo = est.pontos > rec;
    if (novo) F1.gravar('qz.rec.' + est.modo, est.pontos);
    const pct = est.acertos / TOTAL;
    const titulo = pct >= 0.9 ? 'Campeão mundial! 🏆' : pct >= 0.7 ? 'Pódio garantido!' : pct >= 0.5 ? 'Nos pontos' : pct >= 0.3 ? 'Fora dos pontos' : 'Abandono na volta 1';
    $('.qz-caixa').innerHTML = `<div class='qz-ini f1-entra'><div class='qz-logo fim'><b>${est.acertos}</b></div><h2>${titulo}</h2>
      <p>${est.acertos} de ${TOTAL} acertos · ${est.pontos} pontos · melhor sequência ${est.maxSeq}</p>
      ${novo ? `<div class='qz-novo'>★ Novo recorde!</div>` : `<p class='qz-rec'>Recorde: ${rec}</p>`}
      <div class='qz-fim-bts'><button class='f1-btn prim qz-go'>Jogar de novo</button><button class='f1-btn qz-menu'>Trocar modo</button></div></div>`;
    lado();
  };

  $('.qz-caixa').addEventListener('click', (ev) => {
    const m = ev.target.closest('.qz-modo');
    if (m) { est.modo = m.getAttribute('data-m'); F1.gravar('qz.modo', est.modo); palco.querySelectorAll('.qz-modo').forEach((x) => x.classList.toggle('on', x === m)); lado(); return; }
    if (ev.target.closest('.qz-go')) { const s = $('.qz-ano'); if (s) est.ano = +s.value; est.n = 0; est.pontos = 0; est.acertos = 0; est.seq = 0; est.maxSeq = 0; est.hist = []; pergunta(); return; }
    if (ev.target.closest('.qz-menu')) { inicio(); return; }
    const op = ev.target.closest('.qz-op');
    if (op) { responder(+op.getAttribute('data-i')); return; }
    if (ev.target.closest('.qz-prox')) { if (est.n >= TOTAL) fim(); else pergunta(); }
  });
  F1.ouvir(document, 'keydown', (ev) => {
    if (ev.target && (ev.target.tagName === 'INPUT' || ev.target.tagName === 'SELECT')) return;
    if (!est.respondido && ev.key >= '1' && ev.key <= '4') responder(+ev.key - 1);
    else if (est.respondido && ev.key === 'Enter') { const b = $('.qz-prox') || $('.qz-go'); if (b) b.click(); }
  });

  inicio();
})();
