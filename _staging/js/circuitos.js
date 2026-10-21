/* Pagina Circuitos: mapa-mundi com todos os circuitos da historia, ficha e linha do tempo do circuito. */
(function () {
  'use strict';
  const F1 = window.F1;
  const palco = F1.palco('Circuitos', 'Onde a F1 já correu · desde 1950');
  palco.insertAdjacentHTML('beforeend', `
<section class='ci-mapa f1-cartao'>
  <div class='ci-barra'>
    <div class='f1-seg ci-reg'><button data-r='mundo' class='on'>Mundo</button><button data-r='europa'>Europa</button><button data-r='americas'>Américas</button><button data-r='asia'>Ásia e Oceania</button></div>
    <div class='f1-seg ci-filtro'><button data-f='todos' class='on'>Todos</button><button data-f='periodo'>Usados em ${F1.periodoTexto}</button></div>
    <div class='ci-busca'></div>
  </div>
  <svg class='ci-svg' viewBox='0 40 1000 380' preserveAspectRatio='xMidYMid meet'>
    <defs><radialGradient id='ci-glow'><stop offset='0' stop-color='#E10600' stop-opacity='.55'/><stop offset='1' stop-color='#E10600' stop-opacity='0'/></radialGradient></defs>
    <g class='ci-grade'></g><path class='ci-terra' d=''/><g class='ci-pontos'></g>
  </svg>
  <div class='ci-leg'><span><i class='a'></i>Usado no período</span><span><i class='h'></i>Só histórico</span><span>tamanho = nº de GPs</span></div>
</section>
<section class='ci-tempo f1-cartao'><div class='f1-rot'>Linha do tempo <span class='ci-tempo-sub'></span></div><div class='ci-tempo-svg'></div></section>
<section class='ci-ficha f1-cartao'></section>`);
  const $ = (s) => palco.querySelector(s);
  $('.ci-terra').setAttribute('d', typeof MAPA_TERRA === 'string' ? MAPA_TERRA : '');

  const REGIOES = { mundo: [0, 40, 1000, 380], europa: [458, 70, 152, 74], americas: [60, 100, 500, 286], asia: [560, 120, 450, 258] };
  const proj = (c) => [((c.lng + 180) / 360) * 1000, ((90 - c.lat) / 180) * 500];
  const [ini, fim] = F1.periodo;

  // estatisticas por circuito
  const dados = [...F1.circuitos.values()].map((c) => {
    const lista = (F1.corridasPorCircuito.get(c.k) || []).slice().sort((a, b) => a.k - b.k);
    const realizadas = lista.filter((r) => r.data <= hoje() || F1.corridaRealizada(r.k) || F1.vitPorCorrida.has(r.k));
    const noPeriodo = lista.filter((r) => F1.corridaRealizada(r.k));
    return { c, lista, realizadas, noPeriodo, n: realizadas.length, prim: realizadas.length ? realizadas[0].ano : null, ult: lista.length ? lista[lista.length - 1].ano : null };
  }).filter((d) => d.lista.length);
  function hoje() { return new Date().toISOString().slice(0, 10); }
  const porK = new Map(dados.map((d) => [d.c.k, d]));
  const maxN = Math.max(1, ...dados.map((d) => d.n));

  const est = { sel: F1.ler('ci.sel', 0), reg: 'mundo', filtro: 'todos', vb: REGIOES.mundo.slice() };
  if (!porK.has(est.sel)) {
    const mais = dados.filter((d) => d.noPeriodo.length).sort((a, b) => b.n - a.n)[0] || dados[0];
    est.sel = mais ? mais.c.k : 0;
  }

  // grade de latitude/longitude
  let grade = '';
  for (let lng = -150; lng <= 180; lng += 30) { const x = ((lng + 180) / 360) * 1000; grade += `<line x1='${x}' x2='${x}' y1='0' y2='500'/>`; }
  for (let lat = -60; lat <= 80; lat += 20) { const y = ((90 - lat) / 180) * 500; grade += `<line x1='0' x2='1000' y1='${y}' y2='${y}'/>`; }
  $('.ci-grade').innerHTML = grade;

  const raio = (d) => (2.2 + Math.sqrt(d.n / maxN) * 7.5) * (est.vb[2] / 1000);
  const desenharPontos = () => {
    const vis = dados.filter((d) => est.filtro === 'todos' || d.noPeriodo.length).sort((a, b) => b.n - a.n);
    $('.ci-pontos').innerHTML = vis.map((d) => {
      const [x, y] = proj(d.c), r = raio(d), at = d.noPeriodo.length > 0, sel = d.c.k === est.sel;
      const pais = F1.pais(d.c.pais);
      const tip = `<b>${F1.esc(d.c.nome)}</b><small>${F1.esc(d.c.cidade)}, ${F1.esc(pais[1])}</small><small>${d.n} GPs · ${d.prim || '—'}–${d.ult || '—'}</small>`;
      return `<g class='ci-pt${at ? ' at' : ''}${sel ? ' sel' : ''}' data-k='${d.c.k}' data-tip='${tip}'>` +
        (sel ? `<circle class='halo' cx='${x}' cy='${y}' r='${r * 3.2}' fill='url(#ci-glow)'/><circle class='anel' cx='${x}' cy='${y}' r='${r * 1.9}'/>` : '') +
        `<circle class='bola' cx='${x}' cy='${y}' r='${r}'/></g>`;
    }).join('');
  };

  const irPara = (alvo) => {
    const de = est.vb.slice(), ini0 = performance.now();
    F1.anim((t) => {
      const k = Math.min(1, (t - ini0) / 650), e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      est.vb = de.map((v, i) => v + (alvo[i] - v) * e);
      $('.ci-svg').setAttribute('viewBox', est.vb.map((v) => v.toFixed(2)).join(' '));
      desenharPontos();
      return k < 1;
    });
  };

  // ---------- ficha ----------
  const desenharFicha = () => {
    const d = porK.get(est.sel), box = $('.ci-ficha');
    if (!d) { box.innerHTML = ''; return; }
    F1.gravar('ci.sel', est.sel);
    const c = d.c, pais = F1.pais(c.pais);
    // vencedores (historico completo vindo de Vitorias)
    const venc = new Map();
    d.lista.forEach((r) => (F1.vitPorCorrida.get(r.k) || []).forEach((v) => venc.set(v.p, (venc.get(v.p) || 0) + 1)));
    const topV = [...venc.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    const maxV = topV.length ? topV[0][1] : 1;
    // equipes vencedoras
    const vencE = new Map();
    d.lista.forEach((r) => (F1.vitPorCorrida.get(r.k) || []).forEach((v) => vencE.set(v.e, (vencE.get(v.e) || 0) + 1)));
    const topE = [...vencE.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
    // no periodo
    let poleVence = 0, nP = 0, somaGridV = 0, dnf = 0, larg = 0, ganho = 0, nG = 0;
    d.noPeriodo.forEach((r) => {
      const rs = F1.resPorCorrida.get(r.k) || [];
      if (!rs.length) return;
      nP++;
      if (rs[0].grid === 1) poleVence++;
      somaGridV += rs[0].grid || 20;
      rs.forEach((x) => {
        if (x.st === 4) return;
        larg++;
        if (x.st >= 2) dnf++;
        if (x.st <= 1 && x.grid > 0) { ganho += Math.abs(x.grid - x.pos); nG++; }
      });
    });
    const ultimos = d.realizadas.slice(-6).reverse().map((r) => ({ r, v: (F1.vitPorCorrida.get(r.k) || [])[0] })).filter((x) => x.v);
    box.innerHTML = `<div class='ci-f-cab f1-entra'>${F1.bandeira(pais[0], 80)}<div><b>${F1.esc(c.nome)}</b><small>${F1.esc(c.cidade)} · ${F1.esc(pais[1])}</small></div></div>
      <div class='ci-kpis'>
        <div><b>${d.n}</b><small>GPs disputados</small></div>
        <div><b>${d.prim || '—'}</b><small>Primeiro GP</small></div>
        <div><b>${d.ult || '—'}</b><small>${d.ult && d.ult >= new Date().getFullYear() ? 'No calendário' : 'Último GP'}</small></div>
      </div>
      <div class='f1-rot'>Maiores vencedores</div>
      <div class='ci-venc'>${topV.map(([p, n]) => `<div class='ci-v' style='--c:${F1.corPiloto(p)}'>${F1.avatar(p, 'mini')}<span>${F1.esc(F1.p(p).completo)}</span><div class='ci-v-bar'><i style='width:${(n / maxV) * 100}%'></i></div><b>${n}</b></div>`).join('') || `<small class='ci-sem'>Sem vencedores registrados</small>`}</div>
      <div class='ci-eqv'>${topE.map(([e, n]) => `<span class='f1-chip' style='--c:${F1.e(e).cor}'><i></i>${F1.esc(F1.e(e).nome)} <b>${n}</b></span>`).join('')}</div>
      <div class='f1-rot'>No período ${F1.periodoTexto} <span class='ci-np'>${nP} corridas</span></div>
      ${nP ? `<div class='ci-per'>
        <div data-tip='Corridas vencidas por quem largou na pole'><b>${F1.pct(poleVence / nP)}</b><small>pole → vitória</small></div>
        <div data-tip='Posição média de largada do vencedor'><b>P${F1.fmt(somaGridV / nP, 1)}</b><small>largada do vencedor</small></div>
        <div data-tip='Média de |largada − chegada| dos classificados'><b>${F1.fmt(nG ? ganho / nG : 0, 1)}</b><small>trocas de posição</small></div>
        <div data-tip='Abandonos / largadas'><b>${F1.pct(larg ? dnf / larg : 0)}</b><small>abandonos</small></div>
      </div>` : `<div class='ci-sem'>Circuito fora do período carregado.</div>`}
      <div class='f1-rot'>De onde larga quem vence aqui <span class='ci-np'>histórico</span></div>
      <div class='ci-grid'>${gradeVencedores(d)}</div>
      <div class='ci-ult'>${ultimos.map((x) => `<span style='--c:${F1.e(x.v.e).cor}' data-tip='<b>${x.r.ano}</b><small>${F1.esc(F1.p(x.v.p).completo)} · ${F1.esc(F1.e(x.v.e).nome)}</small>'><em>${x.r.ano}</em>${F1.esc(F1.p(x.v.p).cod)}</span>`).join('')}</div>`;
  };

  const gradeVencedores = (d) => {
    const cont = new Array(11).fill(0);
    let n = 0;
    d.lista.forEach((r) => (F1.vitPorCorrida.get(r.k) || []).forEach((v) => { if (v.grid > 0) { cont[Math.min(v.grid, 11) - 1]++; n++; } }));
    if (!n) return `<small class='ci-sem'>Sem dados de largada</small>`;
    const max = Math.max(...cont);
    return cont.map((q, i) => `<div data-tip='<b>${i < 10 ? 'P' + (i + 1) : 'P11 ou pior'}</b><small>${q} vitórias (${F1.pct(q / n)})</small>'><i style='height:${max ? (q / max) * 100 : 0}%'></i><span>${i < 10 ? i + 1 : '11+'}</span></div>`).join('');
  };

  // ---------- linha do tempo (1950 ate o ano atual) ----------
  const desenharTempo = () => {
    const d = porK.get(est.sel); if (!d) return;
    const a0 = 1950, a1 = Math.max(fim || 0, new Date().getFullYear()), W = 812, H = 70, n = a1 - a0 + 1, w = W / n;
    const porAno = new Map(d.lista.map((r) => [r.ano, r]));
    let s = '';
    for (let a = a0; a <= a1; a++) {
      const x = (a - a0) * w, r = porAno.get(a);
      if (r) {
        const v = (F1.vitPorCorrida.get(r.k) || [])[0];
        const cor = v ? F1.e(v.e).cor : '#4A5468';
        const tip = `<b>${a} · ${F1.esc(F1.gpNome(r.k))}</b><small>${v ? F1.esc(F1.p(v.p).completo) + ' · ' + F1.esc(F1.e(v.e).nome) : 'A disputar'}</small>`;
        s += `<rect x='${x + 0.6}' y='10' width='${Math.max(1, w - 1.2)}' height='34' rx='1.5' style='fill:${cor}' data-tip='${tip}'${v ? '' : ` class='fut'`}/>`;
      } else s += `<rect x='${x + 0.6}' y='24' width='${Math.max(1, w - 1.2)}' height='6' rx='1' class='vazio'/>`;
      if (a % 10 === 0) s += `<text x='${x}' y='62'>${a}</text>`;
    }
    if (ini) s += `<rect x='${(ini - a0) * w}' y='4' width='${(fim - ini + 1) * w}' height='46' class='per' rx='3'/>`;
    $('.ci-tempo-sub').textContent = `${d.n} edições · cor = equipe vencedora · contorno = período carregado`;
    $('.ci-tempo-svg').innerHTML = `<svg viewBox='0 0 ${W} ${H}' width='${W}' height='${H}'>${s}</svg>`;
  };

  // ---------- busca ----------
  const itens = dados.slice().sort((a, b) => a.c.nome.localeCompare(b.c.nome, 'pt')).map((d) => ({
    v: d.c.k, txt: d.c.nome, sub: d.c.cidade + ' · ' + F1.pais(d.c.pais)[1], dir: d.n + ' GPs', img: F1.bandeiraPais(d.c.pais), cor: d.noPeriodo.length ? '#E10600' : '#4A5468'
  }));
  const busca = F1.seletor($('.ci-busca'), { itens, valor: est.sel, placeholder: 'Buscar circuito ou país…', aoMudar: (v) => selecionar(v, true) });

  const selecionar = (k, voar) => {
    est.sel = k; busca.definir(k, true);
    desenharPontos(); desenharFicha(); desenharTempo();
    if (voar) {
      const d = porK.get(k), [x, y] = proj(d.c);
      const reg = Object.keys(REGIOES).find((r) => r !== 'mundo' && x >= REGIOES[r][0] && x <= REGIOES[r][0] + REGIOES[r][2] && y >= REGIOES[r][1] && y <= REGIOES[r][1] + REGIOES[r][3]) || 'mundo';
      marcarReg(reg); irPara(REGIOES[reg]);
    }
  };
  const marcarReg = (r) => { est.reg = r; palco.querySelectorAll('.ci-reg button').forEach((b) => b.classList.toggle('on', b.getAttribute('data-r') === r)); };

  $('.ci-pontos').addEventListener('click', (ev) => { const g = ev.target.closest('.ci-pt'); if (g) selecionar(+g.getAttribute('data-k')); });
  $('.ci-reg').addEventListener('click', (ev) => { const b = ev.target.closest('button'); if (!b) return; marcarReg(b.getAttribute('data-r')); irPara(REGIOES[est.reg]); });
  $('.ci-filtro').addEventListener('click', (ev) => {
    const b = ev.target.closest('button'); if (!b) return;
    est.filtro = b.getAttribute('data-f');
    palco.querySelectorAll('.ci-filtro button').forEach((x) => x.classList.toggle('on', x === b));
    desenharPontos();
  });

  selecionar(est.sel);
})();
