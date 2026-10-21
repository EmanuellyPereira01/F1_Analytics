/* Pagina Simulador: corrida animada volta a volta com o motor F1Sim e simulacao de Monte Carlo.
   O ritmo de cada piloto vem do desempenho real dele naquela temporada (chegada, largada, abandonos). */
(function () {
  'use strict';
  const F1 = window.F1, S = window.F1Sim;
  const palco = F1.palco('Simulador', 'Corrida volta a volta com dados reais');
  palco.insertAdjacentHTML('beforeend', `
<aside class='si-ctrl f1-cartao'>
  <div class='f1-rot'>Escolha a corrida</div>
  <div class='si-linha'><select class='f1-select si-ano'></select><div class='si-gp'></div></div>
  <div class='si-info'></div>
  <div class='si-botoes'>
    <button class='f1-btn prim si-largar'>▶ Largar</button>
    <button class='f1-btn si-pular' data-tip='Calcula o resto da corrida na hora'>⏭ Fim</button>
    <button class='f1-btn si-reset' data-tip='Novo sorteio com o mesmo grid'>↻</button>
  </div>
  <div class='si-vel-l'><span>Velocidade</span><div class='f1-seg si-vel'><button data-v='1'>1×</button><button data-v='4' class='on'>4×</button><button data-v='12'>12×</button></div></div>
  <div class='f1-rot si-mc-rot'>Monte Carlo</div>
  <button class='f1-btn si-mc'>Simular 1.000 corridas</button>
  <div class='si-mc-prog'><i></i></div>
  <div class='si-mc-res f1-scroll'><div class='si-mc-vazio'>Roda a mesma corrida 1.000 vezes e mostra a chance de vitória e pódio de cada piloto.</div></div>
</aside>
<section class='si-pista f1-cartao'>
  <div class='si-topo'><div class='si-volta'><small>VOLTA</small><b>0/0</b></div><div class='si-flag'></div><div class='si-luzes'><i></i><i></i><i></i><i></i><i></i></div></div>
  <canvas class='si-canvas'></canvas>
  <div class='si-final'></div>
</section>
<section class='si-feed f1-cartao'><div class='f1-rot'>Direção de prova</div><div class='si-feed-lista f1-scroll'></div></section>
<section class='si-placar f1-cartao'><div class='si-placar-cab'><span>POS</span><span>PILOTO</span><span>INTERVALO</span><span>PNEU</span></div><div class='si-placar-lista'></div></section>`);
  const $ = (s) => palco.querySelector(s);
  const CW = 584, CH = 386;

  // ---------- escolha da corrida ----------
  const anos = F1.anos.slice().reverse();
  $('.si-ano').innerHTML = anos.map((a) => `<option value='${a}'>${a}</option>`).join('');
  const est = { ano: F1.ler('si.ano', anos[0]), c: F1.ler('si.c', 0), vel: 4, E: null, part: [], tau: 0, rodando: false, fase: 'pronto', pista: null, evs: [], feitos: 0, ultimoQuadro: 0, mostrados: 0, fimEm: 0 };
  if (!anos.includes(est.ano)) est.ano = anos[0];
  $('.si-ano').value = String(est.ano);

  const corridasDoAno = (ano) => (F1.corridasPorAno.get(ano) || []);
  const itensGP = (ano) => corridasDoAno(ano).map((c) => {
    const ci = F1.circuitos.get(c.circ), feita = F1.corridaRealizada(c.k);
    return { v: c.k, txt: F1.gpNome(c.k), sub: (ci ? ci.nome : '') + (feita ? '' : ' · a disputar'), img: ci ? F1.bandeiraPais(ci.pais) : '', dir: 'R' + c.rod, cor: feita ? '#E10600' : '#4A5468' };
  });
  const gpPadrao = (ano) => { const l = corridasDoAno(ano).filter((c) => F1.corridaRealizada(c.k)); return (l[l.length - 1] || corridasDoAno(ano)[0] || { k: 0 }).k; };
  if (!corridasDoAno(est.ano).find((c) => c.k === est.c)) est.c = gpPadrao(est.ano);
  const selGP = F1.seletor($('.si-gp'), { itens: itensGP(est.ano), valor: est.c, placeholder: 'Buscar GP…', aoMudar: (v) => { est.c = v; preparar(); } });

  // ---------- participantes a partir dos dados reais ----------
  const montarParticipantes = (c) => {
    const ano = Math.floor(c / 100);
    let rs = F1.resPorCorrida.get(c);
    const real = !!rs;
    if (!rs) {
      const feitas = corridasDoAno(ano).filter((x) => F1.corridaRealizada(x.k));
      const ref = feitas.length ? feitas[feitas.length - 1] : null;
      rs = ref ? F1.resPorCorrida.get(ref.k) : [];
    }
    const lista = rs.filter((r) => r.st !== 4).map((r) => {
      const doAno = (F1.resPorPiloto.get(r.p) || []).filter((x) => x.ano === ano && x.st !== 4);
      const cls = doAno.filter((x) => x.st <= 1);
      const mp = cls.length ? cls.reduce((a, x) => a + x.pos, 0) / cls.length : 18;
      const gs = doAno.filter((x) => x.grid > 0);
      const mg = gs.length ? gs.reduce((a, x) => a + x.grid, 0) / gs.length : 18;
      const dp = cls.length > 1 ? Math.sqrt(cls.reduce((a, x) => a + (x.pos - mp) * (x.pos - mp), 0) / cls.length) : 5;
      const fora = doAno.filter((x) => x.st >= 2).length;
      return { r, nota: 0.62 * mp + 0.38 * mg, dp, confiab: Math.max(0.72, Math.min(0.985, (doAno.length - fora + 8 * 0.9) / (doAno.length + 8))) };
    });
    const notas = lista.map((x) => x.nota), mn = Math.min(...notas), mx = Math.max(...notas);
    const rr = F1.rng(F1.hash('grid' + c));
    const part = lista.map((x) => ({
      id: x.r.p, e: x.r.e, ritmo: mx > mn ? 1 - (x.nota - mn) / (mx - mn) : 0.5, consist: Math.max(0.2, Math.min(0.95, 1 - x.dp / 7)),
      confiab: x.confiab, largada: real ? (x.r.grid > 0 ? x.r.grid : 40 + x.r.pos) : 0, real: real ? x.r : null
    }));
    if (!real) part.forEach((p) => { p.largada = (1 - p.ritmo) * 20 + rr() * 4; });
    part.sort((a, b) => a.largada - b.largada).forEach((p, i) => { p.largada = i + 1; });
    return { part, real };
  };

  // ---------- pista procedural (uma forma fixa por circuito) ----------
  const gerarPista = (semente) => {
    const r = F1.rng(semente), N = 13, ctrl = [];
    for (let i = 0; i < N; i++) {
      const ang = (i / N) * Math.PI * 2 + (r() - 0.5) * 0.3;
      let rad = 0.58 + r() * 0.42;
      if (r() < 0.2) rad *= 0.62;
      ctrl.push([Math.cos(ang) * rad * 1.45, Math.sin(ang) * rad]);
    }
    const pts = [], M = 720;
    for (let i = 0; i < M; i++) {
      const u = (i / M) * N, k = Math.floor(u), t = u - k;
      const p0 = ctrl[(k - 1 + N) % N], p1 = ctrl[k % N], p2 = ctrl[(k + 1) % N], p3 = ctrl[(k + 2) % N];
      const cr = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t);
      pts.push([cr(p0[0], p1[0], p2[0], p3[0]), cr(p0[1], p1[1], p2[1], p3[1])]);
    }
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const esc = Math.min((CW - 70) / (x1 - x0), (CH - 70) / (y1 - y0));
    const ox = (CW - (x1 - x0) * esc) / 2 - x0 * esc, oy = (CH - (y1 - y0) * esc) / 2 - y0 * esc;
    const P = pts.map(([x, y]) => [x * esc + ox, y * esc + oy]);
    const acum = [0];
    for (let i = 1; i <= M; i++) { const a = P[i - 1], b = P[i % M]; acum.push(acum[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1])); }
    const total = acum[M];
    const ponto = (f) => {
      f = ((f % 1) + 1) % 1;
      const alvo = f * total;
      let lo = 0, hi = M;
      while (hi - lo > 1) { const m = (lo + hi) >> 1; if (acum[m] <= alvo) lo = m; else hi = m; }
      const a = P[lo], b = P[(lo + 1) % M], k = (alvo - acum[lo]) / (acum[lo + 1] - acum[lo] || 1);
      const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
      return { x: a[0] + dx * k, y: a[1] + dy * k, nx: -dy / L, ny: dx / L, ang: Math.atan2(dy, dx) };
    };
    return { P, ponto };
  };

  // ---------- canvas ----------
  const cv = $('.si-canvas'), ctx = cv.getContext('2d');
  let fundo = null, dpr = 1;
  const prepararCanvas = () => {
    dpr = Math.min(3, (window.devicePixelRatio || 1) * Math.max(1, F1.escala || 1));
    cv.width = CW * dpr; cv.height = CH * dpr; cv.style.width = CW + 'px'; cv.style.height = CH + 'px';
    fundo = document.createElement('canvas'); fundo.width = cv.width; fundo.height = cv.height;
    const g = fundo.getContext('2d'); g.scale(dpr, dpr);
    const P = est.pista.P, caminho = () => { g.beginPath(); P.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); };
    g.lineJoin = 'round'; g.lineCap = 'round';
    caminho(); g.strokeStyle = 'rgba(225,6,0,.10)'; g.lineWidth = 46; g.stroke();
    caminho(); g.strokeStyle = '#3B414D'; g.lineWidth = 24; g.stroke();
    caminho(); g.strokeStyle = '#E9ECF1'; g.lineWidth = 21; g.stroke();
    caminho(); g.strokeStyle = '#1D2129'; g.lineWidth = 18; g.stroke();
    caminho(); g.setLineDash([6, 10]); g.strokeStyle = 'rgba(255,255,255,.08)'; g.lineWidth = 1; g.stroke(); g.setLineDash([]);
    // zebras nas curvas mais fechadas
    for (let i = 0; i < P.length; i += 3) {
      const a = P[(i - 6 + P.length) % P.length], b = P[i], c = P[(i + 6) % P.length];
      const v1 = Math.atan2(b[1] - a[1], b[0] - a[0]), v2 = Math.atan2(c[1] - b[1], c[0] - b[0]);
      let d = Math.abs(v2 - v1); if (d > Math.PI) d = 2 * Math.PI - d;
      if (d > 0.16) { g.fillStyle = (i / 3) % 2 ? '#E10600' : '#F2F2F2'; g.beginPath(); g.arc(b[0], b[1], 2.2, 0, Math.PI * 2); g.fill(); }
    }
    // linha de chegada quadriculada
    const s0 = est.pista.ponto(0);
    g.save(); g.translate(s0.x, s0.y); g.rotate(s0.ang + Math.PI / 2);
    for (let i = -5; i < 5; i++) for (let j = 0; j < 2; j++) { g.fillStyle = (i + j) % 2 ? '#fff' : '#111'; g.fillRect(i * 1.9, j * 2.6 - 2.6, 1.9, 2.6); }
    g.restore();
  };

  const progresso = (c) => {
    const T = c.tempos, tau = est.tau;
    if (tau <= T[0]) return { v: -0.001 * c.largada, k: 0 };
    let k = c._k || 0;
    while (k + 1 < T.length && T[k + 1] <= tau) k++;
    c._k = k;
    if (k + 1 >= T.length) {
      if (c.ativo && c.volta >= est.E.voltas) return { v: est.E.voltas, k, fim: true };
      if (!c.ativo) return { v: k + 0.45, k, fora: true };
      return { v: k + 0.999, k };
    }
    return { v: k + (tau - T[k]) / (T[k + 1] - T[k]), k };
  };

  const desenhar = () => {
    if (!fundo) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.drawImage(fundo, 0, 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const E = est.E; if (!E) return;
    const lista = E.carros.map((c) => ({ c, pr: progresso(c) })).sort((a, b) => a.pr.v - b.pr.v);
    lista.forEach(({ c, pr }, i) => {
      if (pr.fora && est.tau - (c.tempos[c.tempos.length - 1] || 0) > E.base * 2.2) return;
      const pt = est.pista.ponto(pr.v < 0 ? pr.v * 3 : pr.v);
      const lado = ((c.largada % 2) ? 1 : -1) * (pr.v < 1 ? 4 : 2.2);
      const x = pt.x + pt.nx * lado, y = pt.y + pt.ny * lado;
      const cor = pr.fora ? '#555B66' : F1.e(est.cores.get(c.id)).cor;
      ctx.save(); ctx.translate(x, y); ctx.rotate(pt.ang);
      ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(-6, -2.6, 12, 6.4);
      ctx.fillStyle = cor; ctx.fillRect(-6.5, -3.2, 13, 6.4);
      ctx.fillStyle = '#0B0D12'; ctx.fillRect(1.5, -1.4, 3, 2.8);
      ctx.restore();
    });
    // rotulos dos 3 primeiros
    const top = lista.filter((x) => !x.pr.fora).sort((a, b) => b.pr.v - a.pr.v).slice(0, 3);
    top.forEach(({ c, pr }, i) => {
      const pt = est.pista.ponto(pr.v < 0 ? pr.v * 3 : pr.v);
      const txt = F1.p(c.id).cod;
      ctx.font = '700 10px Titillium Web, Segoe UI, sans-serif';
      const w = ctx.measureText(txt).width + 14;
      const x = pt.x + 10, y = pt.y - 18 - i * 0;
      ctx.fillStyle = 'rgba(11,13,18,.85)'; ctx.fillRect(x, y, w, 15);
      ctx.fillStyle = ['#FFD24A', '#C9CFDA', '#D9935B'][i]; ctx.fillRect(x, y, 3, 15);
      ctx.fillStyle = '#fff'; ctx.fillText(txt, x + 8, y + 11);
    });
  };

  // ---------- placar ----------
  const desenharPlacar = () => {
    const E = est.E; if (!E) { $('.si-placar-lista').innerHTML = ''; return; }
    const lista = E.carros.map((c) => ({ c, pr: progresso(c) }));
    lista.sort((a, b) => (a.pr.fora ? 1 : 0) - (b.pr.fora ? 1 : 0) || b.pr.v - a.pr.v || a.c.t - b.c.t);
    const lider = lista[0];
    $('.si-placar-lista').innerHTML = lista.map(({ c, pr }, i) => {
      const e = F1.e(est.cores.get(c.id));
      let gap = '';
      if (pr.fora) gap = `<span class='abd'>ABD</span>`;
      else if (i === 0) gap = pr.fim ? 'Vencedor' : 'Líder';
      else {
        const m = Math.min(Math.floor(pr.v), Math.floor(lider.pr.v));
        if (lider.pr.v - pr.v >= 1 && !lider.pr.fim) gap = '+' + Math.floor(lider.pr.v - pr.v) + ' V';
        else if (m >= 1 && c.tempos[m] != null && lider.c.tempos[m] != null) gap = '+' + (c.tempos[m] - lider.c.tempos[m]).toFixed(3);
        else gap = '—';
      }
      const pn = S.PNEUS[c.pneu];
      const ganho = c.largada - (i + 1);
      return `<div class='si-lin${pr.fora ? ' fora' : ''}' style='--c:${e.cor}'><em>${i + 1}</em><i></i><b>${F1.esc(F1.p(c.id).cod)}</b>` +
        `<small class='${ganho > 0 ? 'sobe' : ganho < 0 ? 'desce' : ''}'>${ganho > 0 ? '▲' + ganho : ganho < 0 ? '▼' + -ganho : ''}</small><span>${gap}</span>` +
        `<u style='--p:${pn.cor}' data-tip='${pn.nome} · ${c.idade} voltas · ${c.paradas} parada(s)'>${c.pneu}</u></div>`;
    }).join('');
  };

  // ---------- feed ----------
  const feed = (html, cls) => {
    const l = $('.si-feed-lista');
    l.insertAdjacentHTML('afterbegin', `<div class='si-ev ${cls || ''}'>${html}</div>`);
    while (l.children.length > 40) l.lastChild.remove();
  };
  const liberarEventos = (voltaVis) => {
    while (est.mostrados < est.E.eventos.length && est.E.eventos[est.mostrados].volta <= voltaVis) {
      const ev = est.E.eventos[est.mostrados++];
      const cod = ev.id != null ? `<b>${F1.esc(F1.p(ev.id).cod)}</b>` : '';
      const v = `<em>V${ev.volta}</em>`;
      if (ev.tipo === 'sc') { feed(`${v}<span class='tag sc'>SC</span>Safety car na pista`, 'sc'); est.scVis = true; }
      else if (ev.tipo === 'scfim') { feed(`${v}<span class='tag ok'>VERDE</span>Safety car recolhido`); est.scVis = false; }
      else if (ev.tipo === 'pit') feed(`${v}<span class='tag box'>BOX</span>${cod} troca para ${S.PNEUS[ev.pneu].nome.toLowerCase()}`);
      else if (ev.tipo === 'dnf') feed(`${v}<span class='tag abd'>ABD</span>${cod} abandona`, 'dnf');
      else if (ev.tipo === 'erro') feed(`${v}<span class='tag er'>ERRO</span>${cod} escapa da pista`);
      else if (ev.tipo === 'vr') feed(`${v}<span class='tag vr'>VR</span>${cod} volta mais rápida (${fmtVolta(ev.t)})`);
      else if (ev.tipo === 'ult' && est.posVis && (est.posVis.get(ev.sobre) || 99) <= 6) feed(`${v}<span class='tag ul'>ULT</span>${cod} passa <b>${F1.esc(F1.p(ev.sobre).cod)}</b>`);
    }
    $('.si-flag').innerHTML = est.scVis ? `<span class='sc'>SAFETY CAR</span>` : '';
  };
  const fmtVolta = (t) => { const m = Math.floor(t / 60), s = t - m * 60; return m + ':' + (s < 10 ? '0' : '') + s.toFixed(3); };

  // ---------- ciclo ----------
  const preparar = () => {
    pararTudo();
    F1.gravar('si.ano', est.ano); F1.gravar('si.c', est.c);
    const cor = F1.corridas.get(est.c);
    if (!cor) { $('.si-info').innerHTML = `<div class='si-sem'>Sem corridas nesta temporada.</div>`; return; }
    const { part, real } = montarParticipantes(est.c);
    est.part = part; est.real = real;
    est.cores = new Map(part.map((p) => [p.id, p.e]));
    const ci = F1.circuitos.get(cor.circ);
    est.voltas = cor.voltas || 57;
    est.base = cor.tempo && cor.voltas ? Math.max(62, Math.min(118, (cor.tempo / cor.voltas / 1000) * 0.975)) : 90;
    est.pista = gerarPista(F1.hash(ci ? ci.id : String(est.c)));
    prepararCanvas();
    const rs = F1.resPorCorrida.get(est.c);
    $('.si-info').innerHTML = `<div class='si-ci'>${ci ? F1.bandeiraPais(ci.pais) : ''}<span><b>${F1.esc(ci ? ci.nome : '')}</b><small>${F1.esc(ci ? ci.cidade : '')} · ${est.voltas} voltas · ${part.length} carros</small></span></div>` +
      (rs ? `<div class='si-real'>Resultado real: ${rs.slice(0, 3).map((r, i) => `<span style='--c:${F1.e(r.e).cor}'>${i + 1}. ${F1.esc(F1.p(r.p).cod)}</span>`).join('')}</div>`
        : `<div class='si-real'>Corrida ainda não disputada: grid estimado pelo desempenho da temporada.</div>`) +
      `<div class='si-nota'>Grid ${real ? 'real da corrida' : 'estimado'} · ritmo pelo desempenho em ${est.ano}</div>`;
    novaCorrida(F1.hash('c' + est.c));
    $('.si-mc-res').innerHTML = `<div class='si-mc-vazio'>Roda a mesma corrida 1.000 vezes e mostra a chance de vitória e pódio de cada piloto.</div>`;
    $('.si-mc-prog i').style.width = '0';
  };

  const novaCorrida = (semente) => {
    est.E = S.criar(est.part, { voltas: est.voltas, base: est.base, semente: semente });
    est.tau = 0; est.mostrados = 0; est.scVis = false; est.fase = 'pronto'; est.fimEm = 0;
    est.E.carros.forEach((c) => { c._k = 0; });
    $('.si-feed-lista').innerHTML = '';
    $('.si-final').classList.remove('on');
    $('.si-volta b').textContent = `0/${est.voltas}`;
    $('.si-largar').innerHTML = '▶ Largar';
    palco.querySelectorAll('.si-luzes i').forEach((l) => l.classList.remove('on'));
    feed(`<em>—</em>Grid formado. ${F1.esc(F1.p(est.E.carros[0].id).completo)} larga na pole.`);
    desenharPlacar(); desenhar();
  };

  const garantirSim = () => {
    const E = est.E;
    while (!E.fim) {
      const ativos = E.carros.filter((c) => c.ativo);
      if (!ativos.length) break;
      if (Math.min(...ativos.map((c) => c.t)) > est.tau + E.base * 1.5) break;
      S.passo(E);
    }
  };

  let ultimoPlacar = 0;
  const loop = (t) => {
    if (est.fase !== 'correndo') return false;
    const dt = Math.min(0.1, (t - (est.ultimoQuadro || t)) / 1000);
    est.ultimoQuadro = t;
    const E = est.E;
    est.tau += dt * est.vel * (E.base / 2.6);
    garantirSim();
    // volta exibida = volta do lider
    const lider = E.carros.filter((c) => c.ativo || c.tempos.length > 1).map((c) => progresso(c)).reduce((m, p) => (p.v > m ? p.v : m), 0);
    const voltaVis = Math.min(E.voltas, Math.floor(lider) + 1);
    $('.si-volta b').textContent = `${Math.min(voltaVis, E.voltas)}/${E.voltas}`;
    if (t - ultimoPlacar > 220) {
      ultimoPlacar = t;
      desenharPlacar();
      const ordem = E.carros.map((c) => ({ c, v: progresso(c).v })).sort((a, b) => b.v - a.v);
      est.posVis = new Map(ordem.map((x, i) => [x.c.id, i + 1]));
      liberarEventos(voltaVis);
    }
    desenhar();
    if (E.fim) {
      const ativos = E.carros.filter((c) => c.ativo);
      const ultimo = Math.max(...ativos.map((c) => c.tempos[c.tempos.length - 1]));
      if (est.tau > ultimo + 1) { terminar(); return false; }
    }
    return true;
  };

  const largar = () => {
    if (est.fase === 'correndo') { est.fase = 'pausado'; $('.si-largar').innerHTML = '▶ Continuar'; return; }
    if (est.fase === 'pausado') { est.fase = 'correndo'; est.ultimoQuadro = 0; $('.si-largar').innerHTML = '⏸ Pausar'; F1.anim(loop); return; }
    if (est.fase === 'fim') novaCorrida(F1.hash('c' + est.c + Date.now()));
    if (est.fase !== 'pronto') return;
    est.fase = 'luzes';
    $('.si-largar').innerHTML = '⏸ Pausar';
    const luzes = palco.querySelectorAll('.si-luzes i');
    luzes.forEach((l, i) => F1.espera(() => l.classList.add('on'), 350 + i * 450));
    F1.espera(() => {
      luzes.forEach((l) => l.classList.remove('on'));
      feed(`<em>V1</em><span class='tag ok'>LARGADA</span>Apagam-se as luzes!`);
      est.fase = 'correndo'; est.ultimoQuadro = 0; F1.anim(loop);
    }, 350 + 5 * 450 + 400 + Math.random() * 700);
  };

  const terminar = () => {
    est.fase = 'fim';
    const E = est.E;
    est.tau = Infinity;
    liberarEventos(E.voltas + 1);
    desenharPlacar(); desenhar();
    $('.si-largar').innerHTML = '↻ Correr de novo';
    const res = S.classificacao(E);
    const rs = F1.resPorCorrida.get(est.c);
    const pod = [res[1], res[0], res[2]].filter(Boolean);
    const venc = res[0], mv = E.melhorVolta;
    const posReal = (id) => { const x = rs ? rs.find((r) => r.p === id) : null; return x ? x.pos : null; };
    $('.si-final').innerHTML = `<div class='si-fin-tit'>🏁 Bandeira quadriculada</div>
      <div class='si-pod'>${pod.map((x) => `<div class='si-deg p${x.pos}' style='--c:${F1.e(est.cores.get(x.id)).cor}'>${F1.avatar(x.id, 'medio', est.ano)}<b>${F1.esc(F1.p(x.id).cod)}</b><small>${x.pos === 1 ? 'largou P' + x.largada : x.gap != null ? '+' + x.gap.toFixed(3) + 's' : ''}</small><div class='si-bloco'>${x.pos}</div></div>`).join('')}</div>
      <div class='si-fin-txt'>${F1.esc(F1.p(venc.id).completo)} vence${venc.largada > 1 ? ` saindo de P${venc.largada}` : ' de ponta a ponta'}.
      ${mv.id != null ? ` Volta mais rápida: <b>${F1.esc(F1.p(mv.id).cod)}</b> ${fmtVolta(mv.t)}.` : ''} ${E.nSC ? E.nSC + ' safety car(s).' : 'Sem safety car.'}
      ${rs ? `<br>Na vida real ${F1.esc(F1.p(venc.id).cod)} terminou em ${posReal(venc.id) ? 'P' + posReal(venc.id) : '—'}; quem venceu foi <b>${F1.esc(F1.p(rs[0].p).completo)}</b>.` : ''}</div>
      <button class='f1-btn si-fechar'>Ver pista</button>`;
    $('.si-final').classList.add('on');
    feed(`<em>V${E.voltas}</em><span class='tag ok'>FIM</span><b>${F1.esc(F1.p(venc.id).cod)}</b> recebe a bandeira quadriculada`);
  };

  const pularFim = () => {
    if (!est.E) return;
    if (est.fase === 'luzes') return;
    while (!est.E.fim) S.passo(est.E);
    terminar();
  };

  const pararTudo = () => { est.fase = 'pronto'; };

  // ---------- Monte Carlo ----------
  const rodarMC = () => {
    const btn = $('.si-mc'); if (btn.disabled) return;
    btn.disabled = true;
    const N = 1000, lote = 50, base = F1.hash('mc' + est.c), acum = new Map(est.part.map((p) => [p.id, { id: p.id, vit: 0, pod: 0, pts: 0, pos: 0 }]));
    let feitos = 0;
    const barra = $('.si-mc-prog i');
    const passoMC = () => {
      if (!F1.vivo) return;
      const parcial = S.montecarlo(est.part, lote, { voltas: est.voltas, base: est.base, semente: base + feitos * 13 });
      parcial.forEach((x) => { const a = acum.get(x.id); a.vit += x.vit * lote; a.pod += x.pod * lote; a.pts += x.pts * lote; a.pos += x.pos * lote; });
      feitos += lote;
      barra.style.width = (feitos / N) * 100 + '%';
      if (feitos < N) { F1.espera(passoMC, 0); return; }
      btn.disabled = false;
      const lista = [...acum.values()].map((a) => ({ id: a.id, vit: a.vit / N, pod: a.pod / N, pts: a.pts / N, pos: a.pos / N })).sort((a, b) => b.vit - a.vit || a.pos - b.pos);
      const rs = F1.resPorCorrida.get(est.c);
      const max = lista[0] ? Math.max(0.01, lista[0].vit) : 1;
      $('.si-mc-res').innerHTML = (rs ? `<div class='si-mc-real'>Vencedor real <b>${F1.esc(F1.p(rs[0].p).cod)}</b>: ${F1.pct((lista.find((x) => x.id === rs[0].p) || { vit: 0 }).vit, 1)} de chance na simulação</div>` : '') +
        `<div class='si-mc-cab'><span></span><span>vitória</span><span>pódio</span></div>` +
        lista.slice(0, 12).map((x) => `<div class='si-mc-lin' style='--c:${F1.e(est.cores.get(x.id)).cor}' data-tip='<b>${F1.esc(F1.p(x.id).completo)}</b><small>Posição média ${F1.fmt(x.pos, 1)} · ${F1.fmt(x.pts, 1)} pts/corrida</small>'>` +
          `<b>${F1.esc(F1.p(x.id).cod)}</b><div class='si-mc-bar'><i style='width:${(x.vit / max) * 100}%'></i><span>${F1.pct(x.vit, 1)}</span></div><em>${F1.pct(x.pod, 0)}</em></div>`).join('');
    };
    $('.si-mc-res').innerHTML = `<div class='si-mc-vazio'>Simulando…</div>`;
    F1.espera(passoMC, 30);
  };

  // ---------- eventos ----------
  $('.si-ano').addEventListener('change', (ev) => { est.ano = +ev.target.value; est.c = gpPadrao(est.ano); selGP.itens(itensGP(est.ano), est.c); preparar(); });
  $('.si-largar').addEventListener('click', largar);
  $('.si-pular').addEventListener('click', pularFim);
  $('.si-reset').addEventListener('click', () => novaCorrida(F1.hash('c' + est.c + Date.now())));
  $('.si-vel').addEventListener('click', (ev) => {
    const b = ev.target.closest('button'); if (!b) return;
    est.vel = +b.getAttribute('data-v');
    palco.querySelectorAll('.si-vel button').forEach((x) => x.classList.toggle('on', x === b));
  });
  $('.si-mc').addEventListener('click', rodarMC);
  $('.si-final').addEventListener('click', (ev) => { if (ev.target.closest('.si-fechar')) $('.si-final').classList.remove('on'); });

  if (est.c) preparar();
})();
