/* Pagina Temporada: corrida de barras do campeonato rodada a rodada, campeao e calendario com resultados. */
(function () {
  'use strict';
  const F1 = window.F1;
  const palco = F1.palco('Temporada', 'Campeonato rodada a rodada');
  palco.insertAdjacentHTML('beforeend', `
<div class='te-anos f1-scroll'></div>
<section class='te-corrida f1-cartao'>
  <div class='te-cab'>
    <div class='te-rodada'><small>RODADA</small><b>–</b></div>
    <div class='te-gp'><b></b><small></small></div>
    <div class='f1-seg te-modo'><button data-m='p' class='on'>Pilotos</button><button data-m='e'>Equipes</button></div>
  </div>
  <div class='te-barras'></div>
  <div class='te-ctrl'>
    <button class='f1-btn te-ini' data-tip='Primeira rodada'>⏮</button>
    <button class='f1-btn prim te-play'>▶ Reproduzir</button>
    <button class='f1-btn te-fim' data-tip='Última rodada'>⏭</button>
    <input type='range' class='te-slider' min='0' max='0' value='0'>
    <div class='f1-seg te-vel'><button data-v='1' class='on'>1×</button><button data-v='2'>2×</button><button data-v='4'>4×</button></div>
  </div>
  <div class='te-nota'>Pontos de corridas e sprints somados por rodada.</div>
</section>
<section class='te-campeao f1-cartao'></section>
<section class='te-cal f1-cartao'><div class='f1-rot'>Calendário <span class='te-cal-n'></span></div><div class='te-cal-lista f1-scroll'></div><div class='te-det'></div></section>`);
  const $ = (s) => palco.querySelector(s);
  const LINHAS = 10, ALT = 44;
  const est = { ano: F1.ler('te.ano', 0), modo: 'p', quadros: [], i: 0, play: null, vel: 1, rows: new Map(), valores: new Map() };
  if (!F1.anos.includes(est.ano)) est.ano = F1.anos.filter((a) => F1.temporadaCompleta(a)).pop() || F1.anos[F1.anos.length - 1] || 0;

  // ---------- seletor de anos ----------
  const desenharAnos = () => {
    $('.te-anos').innerHTML = F1.anos.map((a) => {
      const c = F1.campeoes.get(a);
      const cor = c && c.p ? F1.corPiloto(c.p, a) : '#3A4253';
      return `<button class='te-ano${a === est.ano ? ' on' : ''}' data-a='${a}' style='--c:${cor}'>${a}${F1.temporadaCompleta(a) ? '' : '<i>•</i>'}</button>`;
    }).join('');
    const on = $('.te-ano.on'); if (on) on.scrollIntoView({ inline: 'center', block: 'nearest' });
  };

  // ---------- barras ----------
  const chave = (k) => est.modo + k;
  const montarBarras = () => {
    est.quadros = F1.pontosAcumulados(est.ano, est.modo === 'e');
    est.rows.clear(); est.valores.clear();
    const caixa = $('.te-barras');
    caixa.innerHTML = '';
    const todos = new Set();
    est.quadros.forEach((q) => q.pts.forEach((_, k) => todos.add(k)));
    todos.forEach((k) => {
      const el = document.createElement('div');
      el.className = 'te-row';
      const ehP = est.modo === 'p';
      const cor = ehP ? F1.corPiloto(k, est.ano) : F1.e(k).cor;
      const nome = ehP ? F1.p(k).completo : F1.e(k).nome;
      const sub = ehP ? F1.e(F1.equipeDoPiloto(k, est.ano)).nome : '';
      el.style.setProperty('--c', cor);
      el.innerHTML = `<div class='te-pos'></div>${ehP ? F1.avatar(k, 'mini', est.ano) : `<div class='te-eqi' style='background:${cor}'></div>`}` +
        `<div class='te-nome'><b>${F1.esc(nome)}</b><small>${F1.esc(sub)}</small></div>` +
        `<div class='te-trilho'><div class='te-barra'><span class='te-vit'></span></div></div><div class='te-val'>0</div>`;
      el.style.transform = `translateY(${(LINHAS + 1) * ALT}px)`;
      el.style.opacity = '0';
      caixa.appendChild(el);
      est.rows.set(chave(k), el);
    });
    const sl = $('.te-slider');
    sl.max = String(Math.max(0, est.quadros.length - 1));
    est.i = est.quadros.length - 1;
    sl.value = String(est.i);
    mostrar(est.i, true);
  };

  const mostrar = (i, instantaneo) => {
    const q = est.quadros[i];
    const cab = $('.te-cab');
    if (!q) { cab.querySelector('.te-rodada b').textContent = '–'; cab.querySelector('.te-gp b').textContent = 'Sem corridas nesta temporada'; return; }
    const total = F1.ultimaRodada(est.ano);
    cab.querySelector('.te-rodada b').innerHTML = `${q.corrida.rod}<small>/${total}</small>`;
    const ci = F1.circuitos.get(q.corrida.circ);
    cab.querySelector('.te-gp b').innerHTML = `${ci ? F1.bandeiraPais(ci.pais) : ''} ${F1.esc(F1.gpNome(q.corrida.k))}`;
    cab.querySelector('.te-gp small').textContent = (ci ? ci.nome + ' · ' : '') + F1.data(q.corrida.data);
    const ordem = [...q.pts.entries()].sort((a, b) => b[1] - a[1] || (q.vit.get(b[0]) || 0) - (q.vit.get(a[0]) || 0));
    const max = Math.max(1, ordem.length ? ordem[0][1] : 1);
    const lider = ordem.length ? ordem[0][1] : 0;
    const vistos = new Set();
    ordem.forEach(([k, v], pos) => {
      const el = est.rows.get(chave(k)); if (!el) return;
      vistos.add(el);
      el.classList.toggle('inst', !!instantaneo);
      el.style.transform = `translateY(${Math.min(pos, LINHAS) * ALT}px)`;
      el.style.opacity = pos < LINHAS ? '1' : '0';
      el.style.zIndex = String(100 - pos);
      el.classList.toggle('lider', pos === 0);
      el.querySelector('.te-pos').textContent = pos + 1;
      el.querySelector('.te-barra').style.width = `${Math.max(0.6, (v / max) * 100)}%`;
      const nv = q.vit.get(k) || 0;
      el.querySelector('.te-vit').textContent = nv ? `${nv} ${nv === 1 ? 'vitória' : 'vitórias'}` : '';
      animarValor(el.querySelector('.te-val'), k, v, instantaneo, pos === 0 ? '' : '−' + F1.pts(lider - v));
    });
    est.rows.forEach((el) => { if (!vistos.has(el)) el.style.opacity = '0'; });
    $('.te-slider').value = String(i);
    marcarCalendario(q.corrida.k);
  };

  const animarValor = (el, k, v, inst, dif) => {
    const de = est.valores.has(chave(k)) ? est.valores.get(chave(k)) : 0;
    est.valores.set(chave(k), v);
    const fim = () => { el.innerHTML = `${F1.pts(v)}${dif ? `<small>${dif}</small>` : ''}`; };
    if (inst || de === v) { fim(); return; }
    const ini = performance.now(), dur = 520 / est.vel;
    F1.anim((t) => {
      const kk = Math.min(1, (t - ini) / dur);
      el.textContent = F1.fmt(de + (v - de) * kk, 0);
      if (kk >= 1) fim();
      return kk < 1;
    });
  };

  // ---------- reproducao ----------
  const pararPlay = () => { if (est.play) { F1.parar(est.play); est.play = null; } $('.te-play').innerHTML = '▶ Reproduzir'; };
  const iniciarPlay = () => {
    if (!est.quadros.length) return;
    if (est.i >= est.quadros.length - 1) { est.i = 0; mostrar(0, true); }
    $('.te-play').innerHTML = '⏸ Pausar';
    const passo = () => {
      if (est.i >= est.quadros.length - 1) { pararPlay(); return; }
      est.i++; mostrar(est.i);
      est.play = F1.espera(passo, 1100 / est.vel);
    };
    est.play = F1.espera(passo, 500 / est.vel);
  };

  // ---------- campeao ----------
  const desenharCampeao = () => {
    const box = $('.te-campeao');
    const fim = F1.finalP.get(est.ano) || [], fimE = F1.finalE.get(est.ano) || [];
    const completa = F1.temporadaCompleta(est.ano);
    const l = fim[0];
    if (!l) { box.innerHTML = `<div class='te-camp-vazio'>Sem classificação para ${est.ano}.</div>`; return; }
    const pi = F1.p(l.p), e = F1.e(l.e), le = fimE[0] ? F1.e(fimE[0].e) : null;
    const vice = fim[1];
    box.style.setProperty('--c', e.cor);
    box.innerHTML = `<div class='te-camp-bg'></div>${F1.avatar(l.p, 'medio', est.ano)}
      <div class='te-camp-txt'><small>${completa ? `★ CAMPEÃO ${est.ano}` : `LÍDER APÓS A RODADA ${l.rod} DE ${F1.ultimaRodada(est.ano)}`}</small>
      <b>${F1.esc(pi.completo)}</b><span>${F1.esc(e.nome)} · ${F1.pts(l.pts)} pts · ${l.vit} vitórias</span>
      ${vice ? `<em>${completa ? 'Vice' : '2º'}: ${F1.esc(F1.p(vice.p).completo)} (−${F1.pts(l.pts - vice.pts)})</em>` : ''}</div>
      ${le ? `<div class='te-camp-eq' style='--c2:${le.cor}'><small>${completa ? 'Construtores' : 'Líder construtores'}</small><b>${F1.esc(le.nome)}</b><span>${F1.pts(fimE[0].pts)} pts</span></div>` : ''}`;
  };

  // ---------- calendario ----------
  const desenharCalendario = () => {
    const lista = F1.corridasPorAno.get(est.ano) || [];
    $('.te-cal-n').textContent = `${lista.filter((c) => F1.corridaRealizada(c.k)).length}/${lista.length} corridas`;
    $('.te-cal-lista').innerHTML = lista.map((c) => {
      const ci = F1.circuitos.get(c.circ), rs = F1.resPorCorrida.get(c.k);
      const v = rs ? rs[0] : null;
      const temSprint = F1.spPorCorrida.has(c.k);
      return `<div class='te-gp-it${rs ? '' : ' fut'}' data-c='${c.k}'><em>${c.rod}</em>${ci ? F1.bandeiraPais(ci.pais) : ''}` +
        `<span><b>${F1.esc(F1.gpNome(c.k))}${temSprint ? ` <i class='te-spr'>SPRINT</i>` : ''}</b><small>${F1.esc(F1.dataCurta(c.data))}${ci ? ' · ' + F1.esc(ci.cidade) : ''}</small></span>` +
        (v ? `<strong style='--c:${F1.e(v.e).cor}'>${F1.esc(F1.p(v.p).cod)}</strong>` : `<strong class='nd'>—</strong>`) + `</div>`;
    }).join('') || `<div class='te-camp-vazio'>Sem calendário.</div>`;
  };
  const marcarCalendario = (c) => {
    palco.querySelectorAll('.te-gp-it').forEach((el) => el.classList.toggle('on', +el.getAttribute('data-c') === c));
    const on = $('.te-gp-it.on'); if (on && !est.play) on.scrollIntoView({ block: 'nearest' });
  };

  const detalhe = (c) => {
    const rs = F1.resPorCorrida.get(c), det = $('.te-det');
    if (!rs) { det.classList.remove('aberto'); return; }
    const ci = F1.circuitos.get(F1.corridas.get(c).circ);
    const pod = [rs[1], rs[0], rs[2]].filter(Boolean);
    const pole = rs.find((r) => r.grid === 1), vr = rs.find((r) => r.vr), dnf = rs.filter((r) => r.st >= 2 && r.st <= 3).length;
    det.innerHTML = `<button class='f1-btn te-volta'>← Calendário</button>
      <div class='te-det-tit'>${ci ? F1.bandeiraPais(ci.pais) : ''}<b>${F1.esc(F1.gpNome(c))} ${Math.floor(c / 100)}</b><small>${ci ? F1.esc(ci.nome) : ''}</small></div>
      <div class='te-podio'>${pod.map((r) => `<div class='te-deg p${r.pos}' style='--c:${F1.e(r.e).cor}'>${F1.avatar(r.p, 'medio', Math.floor(c / 100))}<b>${F1.esc(F1.p(r.p).cod)}</b><div class='te-bloco'>${r.pos}</div></div>`).join('')}</div>
      <div class='te-det-lista'>${rs.slice(3, 10).map((r) => `<div><em>${r.pos}</em><i style='background:${F1.e(r.e).cor}'></i><span>${F1.esc(F1.p(r.p).completo)}</span><small>${r.pts ? '+' + F1.pts(r.pts) : ''}</small></div>`).join('')}</div>
      <div class='te-det-rod'>${pole ? `Pole: <b>${F1.esc(F1.p(pole.p).cod)}</b>` : ''}${vr ? ` · Volta rápida: <b>${F1.esc(F1.p(vr.p).cod)}</b>` : ''} · Abandonos: <b>${dnf}</b></div>`;
    det.classList.add('aberto');
  };

  // ---------- eventos ----------
  const trocarAno = (a) => {
    pararPlay();
    est.ano = a; F1.gravar('te.ano', a);
    desenharAnos(); desenharCampeao(); desenharCalendario(); montarBarras();
    $('.te-det').classList.remove('aberto');
  };
  $('.te-anos').addEventListener('click', (ev) => { const b = ev.target.closest('.te-ano'); if (b) trocarAno(+b.getAttribute('data-a')); });
  $('.te-modo').addEventListener('click', (ev) => {
    const b = ev.target.closest('button'); if (!b) return;
    est.modo = b.getAttribute('data-m');
    palco.querySelectorAll('.te-modo button').forEach((x) => x.classList.toggle('on', x === b));
    const i = est.i; pararPlay(); montarBarras(); est.i = Math.min(i, est.quadros.length - 1); mostrar(est.i, true);
  });
  $('.te-play').addEventListener('click', () => (est.play ? pararPlay() : iniciarPlay()));
  $('.te-ini').addEventListener('click', () => { pararPlay(); est.i = 0; mostrar(0); });
  $('.te-fim').addEventListener('click', () => { pararPlay(); est.i = est.quadros.length - 1; mostrar(est.i); });
  $('.te-slider').addEventListener('input', (ev) => { pararPlay(); est.i = +ev.target.value; mostrar(est.i); });
  $('.te-vel').addEventListener('click', (ev) => {
    const b = ev.target.closest('button'); if (!b) return;
    est.vel = +b.getAttribute('data-v');
    palco.querySelectorAll('.te-vel button').forEach((x) => x.classList.toggle('on', x === b));
    $('.te-barras').style.setProperty('--dur', (0.6 / est.vel).toFixed(2) + 's');
  });
  $('.te-cal-lista').addEventListener('click', (ev) => {
    const it = ev.target.closest('.te-gp-it'); if (!it) return;
    const c = +it.getAttribute('data-c');
    const idx = est.quadros.findIndex((q) => q.corrida.k === c);
    if (idx >= 0) { pararPlay(); est.i = idx; mostrar(idx); }
    detalhe(c);
  });
  $('.te-det').addEventListener('click', (ev) => { if (ev.target.closest('.te-volta')) $('.te-det').classList.remove('aberto'); });

  trocarAno(est.ano);
})();
