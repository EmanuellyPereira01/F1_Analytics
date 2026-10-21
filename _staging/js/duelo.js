/* Pagina Duelo: compara dois pilotos lado a lado e mostra o confronto como companheiros de equipe. */
(function () {
  'use strict';
  const F1 = window.F1;
  const palco = F1.palco('Duelo', 'Piloto × piloto · ' + F1.periodoTexto);
  palco.insertAdjacentHTML('beforeend', `
<aside class='du-lado du-a f1-cartao'><div class='du-sel'></div><div class='du-perfil'></div></aside>
<aside class='du-lado du-b f1-cartao'><div class='du-sel'></div><div class='du-perfil'></div></aside>
<section class='du-centro f1-cartao'><div class='du-vs'>VS</div><div class='du-linhas'></div></section>
<section class='du-comp f1-cartao'><div class='f1-rot'>Como companheiros de equipe</div><div class='du-comp-corpo'></div></section>
<section class='du-graf f1-cartao'><div class='f1-rot'>Pontos por temporada</div><div class='du-graf-corpo'></div></section>
<section class='du-rivais f1-cartao'><div class='f1-rot'>Duelos internos mais frequentes</div><div class='du-rivais-corpo f1-scroll'></div></section>`);
  const $ = (s) => palco.querySelector(s);

  // pilotos do periodo ordenados por vitorias
  const lista = F1.pilotosDoPeriodo().map((p) => ({ p, s: F1.estat(p) })).sort((a, b) => b.s.vit - a.s.vit || b.s.pts - a.s.pts);
  const itens = lista.map((x) => F1.itemPiloto(x.p, 0, x.s.vit + ' vit'));

  // pares de companheiros com mais corridas juntos
  const pares = new Map();
  F1.resPorCorrida.forEach((rs) => {
    const porEq = F1.agrupar(rs, (r) => r.e);
    porEq.forEach((l) => {
      if (l.length < 2) return;
      const [a, b] = [l[0].p, l[1].p].sort((x, y) => x - y), k = a + '-' + b;
      pares.set(k, (pares.get(k) || 0) + 1);
    });
  });
  const topPares = [...pares.entries()].sort((a, b) => b[1] - a[1]).slice(0, 14).map(([k, n]) => { const [a, b] = k.split('-').map(Number); return { a, b, n }; });

  const salvo = F1.ler('du.par', null);
  const est = {
    a: salvo && F1.pilotos.has(salvo[0]) ? salvo[0] : topPares[0] ? topPares[0].a : lista[0] ? lista[0].p : 0,
    b: salvo && F1.pilotos.has(salvo[1]) ? salvo[1] : topPares[0] ? topPares[0].b : lista[1] ? lista[1].p : 0
  };

  const selA = F1.seletor($('.du-a .du-sel'), { itens, valor: est.a, placeholder: 'Buscar piloto…', aoMudar: (v) => { est.a = v; desenhar(); } });
  const selB = F1.seletor($('.du-b .du-sel'), { itens, valor: est.b, placeholder: 'Buscar piloto…', aoMudar: (v) => { est.b = v; desenhar(); } });

  // cores: se as duas forem parecidas, o lado B usa branco
  const cores = () => {
    const ca = F1.corPiloto(est.a), cb0 = F1.corPiloto(est.b);
    return [ca, F1.distCor(ca, cb0) < 130 ? '#E8EBF0' : cb0];
  };

  const perfil = (lado, p, cor) => {
    const pi = F1.p(p), s = F1.estat(p), nac = F1.nac(pi.nac), a = F1.atributos(p), tit = F1.titulos(p);
    $(`.du-${lado} .du-perfil`).innerHTML = `<div class='du-foto' style='--c:${cor}'>${F1.avatar(p, 'grande')}</div>
      <div class='du-nome f1-entra'><span>${F1.esc(pi.nome)}</span><b>${F1.esc(pi.sobrenome)}</b></div>
      <div class='du-meta'>${F1.bandeira(nac[0])} ${F1.esc(nac[1])}${pi.num ? ' · #' + F1.esc(pi.num) : ''}</div>
      <div class='du-eqs'>${s.equipes.slice(-3).map((x) => `<span class='f1-chip' style='--c:${F1.e(x.e).cor}'><i></i>${F1.esc(F1.e(x.e).nome)}</span>`).join('')}</div>
      <div class='du-ger' style='--c:${cor}'><b>${a ? a.geral : '—'}</b><small>GERAL</small></div>
      <div class='du-tit'>${tit.length ? `<span>★</span> ${tit.length}× campeão` : 'Sem títulos'} · ${F1.vitoriasCarreira(p)} vitórias na carreira</div>
      <div class='du-atr'>${a ? F1.ATRIBUTOS.map(([k, nome]) => `<div><span>${nome}</span><i><b style='width:${((a[k] - 40) / 59) * 100}%;background:${cor}'></b></i><em>${a[k]}</em></div>`).join('') : ''}</div>`;
  };

  const METRICAS = [
    ['Largadas', (s) => s.largadas, 0, 1],
    ['Vitórias', (s) => s.vit, 0, 1],
    ['Pódios', (s) => s.pod, 0, 1],
    ['Poles', (s) => s.pol, 0, 1],
    ['Pontos por corrida', (s) => (s.largadas ? s.pts / s.largadas : 0), 2, 1],
    ['Taxa de vitória', (s) => (s.largadas ? s.vit / s.largadas : 0), 'pct', 1],
    ['Chegada média', (s) => s.mediaPos, 1, -1],
    ['Largada média', (s) => s.mediaGrid, 1, -1],
    ['Posições ganhas/corrida', (s) => s.ganho, 2, 1],
    ['Abandonos', (s) => (s.largadas ? (s.dnf + s.dsq) / s.largadas : 0), 'pct', -1]
  ];

  const desenharLinhas = (ca, cb) => {
    const sa = F1.estat(est.a), sb = F1.estat(est.b);
    let ga = 0, gb = 0;
    const linhas = METRICAS.map(([nome, f, dec, sentido], i) => {
      const va = f(sa), vb = f(sb);
      const fm = (v) => (dec === 'pct' ? F1.pct(v, 1) : F1.fmt(v, dec));
      const na = isNaN(va) ? 0 : va, nb = isNaN(vb) ? 0 : vb;
      // proporcao da barra: para metricas em que menor e melhor, inverte
      let pa, pb;
      if (sentido > 0) { const t = na + nb || 1; pa = na / t; pb = nb / t; } else { const t = na + nb || 1; pa = nb / t; pb = na / t; }
      const venceA = sentido > 0 ? na > nb : na < nb && na > 0, venceB = sentido > 0 ? nb > na : nb < na && nb > 0;
      if (venceA) ga++; if (venceB) gb++;
      return `<div class='du-lin f1-entra' style='animation-delay:${i * 25}ms'>
        <b class='${venceA ? 'ven' : ''}' style='--c:${ca}'>${fm(va)}</b>
        <div class='du-bar e'><i style='width:${(pa * 100).toFixed(1)}%;background:${ca}'></i></div>
        <span>${nome}</span>
        <div class='du-bar d'><i style='width:${(pb * 100).toFixed(1)}%;background:${cb}'></i></div>
        <b class='${venceB ? 'ven' : ''}' style='--c:${cb}'>${fm(vb)}</b></div>`;
    }).join('');
    $('.du-linhas').innerHTML = `<div class='du-placar'><b style='color:${ca}'>${ga}</b><small>métricas vencidas</small><b style='color:${cb}'>${gb}</b></div>` + linhas;
  };

  const desenharComp = (ca, cb) => {
    let n = 0, qa = 0, qb = 0, ra = 0, rb = 0, pa = 0, pb = 0, difGrid = 0, nGrid = 0;
    const equipesJuntos = new Set();
    (F1.resPorPiloto.get(est.a) || []).forEach((x) => {
      const y = (F1.resPorCorrida.get(x.c) || []).find((r) => r.p === est.b && r.e === x.e);
      if (!y) return;
      n++; equipesJuntos.add(x.e);
      pa += x.pts; pb += y.pts;
      if (x.grid > 0 && y.grid > 0) { if (x.grid < y.grid) qa++; else if (y.grid < x.grid) qb++; difGrid += y.grid - x.grid; nGrid++; }
      const cx = x.st <= 1, cy = y.st <= 1;
      if (cx && cy) { if (x.pos < y.pos) ra++; else rb++; } else if (cx && !cy) ra++; else if (cy && !cx) rb++;
    });
    const corpo = $('.du-comp-corpo');
    if (!n || est.a === est.b) {
      corpo.innerHTML = `<div class='du-nunca'>${est.a === est.b ? 'Escolha dois pilotos diferentes.' : 'Nunca foram companheiros de equipe no período carregado.'}<small>Dica: escolha um par em Duelos internos.</small></div>`;
      return;
    }
    const barra = (rot, a, b) => {
      const t = a + b || 1;
      return `<div class='du-h2h'><div class='du-h2h-top'><b style='color:${ca}'>${F1.pts(a)}</b><span>${rot}</span><b style='color:${cb}'>${F1.pts(b)}</b></div>` +
        `<div class='du-h2h-bar'><i style='width:${(a / t) * 100}%;background:${ca}'></i><i style='width:${(b / t) * 100}%;background:${cb}'></i></div></div>`;
    };
    corpo.innerHTML = `<div class='du-comp-info'>${n} corridas juntos · ${[...equipesJuntos].map((e) => `<span class='f1-chip' style='--c:${F1.e(e).cor}'><i></i>${F1.esc(F1.e(e).nome)}</span>`).join(' ')}</div>` +
      barra('Classificação (largou à frente)', qa, qb) + barra('Corrida (chegou à frente)', ra, rb) + barra('Pontos somados', pa, pb) +
      `<div class='du-comp-rod'>Diferença média de largada: <b>${nGrid ? (difGrid / nGrid > 0 ? F1.p(est.a).cod + ' ' : F1.p(est.b).cod + ' ') + F1.fmt(Math.abs(difGrid / nGrid), 2) + ' posições à frente' : '—'}</b></div>`;
  };

  const desenharGraf = (ca, cb) => {
    const W = 392, H = 122, L = 30, R = 20, T = 10, B = 18, anos = F1.anos;
    const serie = (p) => anos.map((ano) => { const f = (F1.finalP.get(ano) || []).find((x) => x.p === p); return f ? f.pts : null; });
    const A = serie(est.a), Bs = serie(est.b), max = Math.max(10, ...A.filter((v) => v != null), ...Bs.filter((v) => v != null));
    const x = (i) => L + (anos.length < 2 ? (W - L - R) / 2 : (i * (W - L - R)) / (anos.length - 1)), y = (v) => T + (1 - v / max) * (H - T - B);
    const caminho = (s) => { let d = '', ok = false; s.forEach((v, i) => { if (v == null) { ok = false; return; } d += (ok ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1); ok = true; }); return d; };
    const pontos = (s, cor, p) => s.map((v, i) => (v == null ? '' : `<circle cx='${x(i)}' cy='${y(v)}' r='3.2' style='fill:${cor}' data-tip='<b>${F1.esc(F1.p(p).cod)} · ${anos[i]}</b><small>${F1.pts(v)} pts</small>'/>`)).join('');
    const grade = [0, 0.5, 1].map((k) => `<line x1='${L}' x2='${W - R}' y1='${y(max * k)}' y2='${y(max * k)}' class='g'/><text x='${L - 5}' y='${y(max * k) + 3}' class='gt'>${Math.round(max * k)}</text>`).join('');
    const passo = Math.ceil(anos.length / 7);
    const eixo = anos.map((a, i) => (i % passo === 0 || i === anos.length - 1 ? `<text x='${x(i)}' y='${H - 4}' class='ax'>${a}</text>` : '')).join('');
    $('.du-graf-corpo').innerHTML = `<svg viewBox='0 0 ${W} ${H}' width='${W}' height='${H}'>${grade}${eixo}` +
      `<path d='${caminho(A)}' style='stroke:${ca}' class='ln'/><path d='${caminho(Bs)}' style='stroke:${cb}' class='ln'/>${pontos(A, ca, est.a)}${pontos(Bs, cb, est.b)}</svg>`;
  };

  const desenharRivais = () => {
    $('.du-rivais-corpo').innerHTML = topPares.map((x) => {
      const on = (x.a === est.a && x.b === est.b) || (x.a === est.b && x.b === est.a);
      return `<div class='du-par${on ? ' on' : ''}' data-a='${x.a}' data-b='${x.b}'>${F1.avatar(x.a, 'mini')}${F1.avatar(x.b, 'mini')}` +
        `<span>${F1.esc(F1.p(x.a).sobrenome)} × ${F1.esc(F1.p(x.b).sobrenome)}</span><em>${x.n}</em></div>`;
    }).join('');
  };

  const desenhar = () => {
    F1.gravar('du.par', [est.a, est.b]);
    const [ca, cb] = cores();
    perfil('a', est.a, ca); perfil('b', est.b, cb);
    $('.du-a').style.setProperty('--c', ca); $('.du-b').style.setProperty('--c', cb);
    desenharLinhas(ca, cb); desenharComp(ca, cb); desenharGraf(ca, cb); desenharRivais();
  };

  $('.du-rivais-corpo').addEventListener('click', (ev) => {
    const it = ev.target.closest('.du-par'); if (!it) return;
    est.a = +it.getAttribute('data-a'); est.b = +it.getAttribute('data-b');
    selA.definir(est.a, true); selB.definir(est.b, true); desenhar();
  });
  $('.du-vs').addEventListener('click', () => { [est.a, est.b] = [est.b, est.a]; selA.definir(est.a, true); selB.definir(est.b, true); desenhar(); });

  if (est.a && est.b) desenhar();
})();
