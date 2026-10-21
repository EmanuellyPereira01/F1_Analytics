/* Pagina Pilotos: lista com busca, ficha do piloto, atributos em radar e carreira por temporada. */
(function () {
  'use strict';
  const F1 = window.F1;
  const palco = F1.palco('Pilotos', 'Ficha técnica · ' + F1.periodoTexto);
  const anosOpt = F1.anos.slice().reverse().map((a) => `<option value='${a}'>${a}</option>`).join('');
  palco.insertAdjacentHTML('beforeend', `
<aside class='pl-lado f1-cartao'>
  <input class='f1-busca pl-busca' placeholder='Buscar piloto, sigla ou equipe…' spellcheck='false'>
  <div class='pl-filtros'>
    <select class='f1-select pl-ano'><option value='0'>Todas</option>${anosOpt}</select>
    <div class='f1-seg pl-ord'><button data-o='vit' class='on'>Vitórias</button><button data-o='pts'>Pontos</button><button data-o='az'>A–Z</button></div>
  </div>
  <div class='pl-lista f1-scroll'></div>
  <div class='pl-cont'></div>
</aside>
<section class='pl-hero'></section>
<section class='pl-kpis'></section>
<section class='pl-radar f1-cartao'>
  <div class='f1-rot'>Atributos <span class='f1-dica' data-tip='<b>Como é calculado</b><small>Percentil entre os pilotos com 10+ largadas no período, convertido para a escala 40–99. O carro pesa: é o desempenho do conjunto piloto + equipe.</small>'>?</span></div>
  <div class='pl-radar-svg'></div>
</section>
<section class='pl-equipes f1-cartao'><div class='f1-rot'>Equipes e companheiros</div><div class='pl-eq-corpo'></div></section>
<section class='pl-carreira f1-cartao'><div class='f1-rot'>Campeonato por temporada <span class='pl-car-leg'>altura = pontos · rótulo = posição final · clique para filtrar</span></div><div class='pl-car-svg'></div></section>`);

  const $ = (s) => palco.querySelector(s);
  const est = { ano: 0, ordem: 'vit', busca: '', sel: F1.ler('pl.sel', 0), radarAnt: null };

  // ---------- lista ----------
  const listaPilotos = () => {
    const q = F1.norm(est.busca);
    const base = F1.pilotosDoPeriodo(est.ano).map((p) => {
      const s = F1.estat(p, est.ano), pi = F1.p(p), e = F1.e(F1.equipeDoPiloto(p, est.ano));
      return { p, s, pi, e };
    }).filter((x) => !q || F1.norm(x.pi.completo + ' ' + x.pi.cod + ' ' + x.e.nome).includes(q));
    const ord = {
      vit: (a, b) => b.s.vit - a.s.vit || b.s.pod - a.s.pod || b.s.pts - a.s.pts,
      pts: (a, b) => b.s.pts - a.s.pts,
      az: (a, b) => a.pi.sobrenome.localeCompare(b.pi.sobrenome, 'pt')
    }[est.ordem];
    return base.sort(ord);
  };

  const desenharLista = () => {
    const l = listaPilotos();
    if (!l.find((x) => x.p === est.sel) && !est.busca) est.sel = l.length ? l[0].p : 0;
    $('.pl-lista').innerHTML = l.map((x, i) => {
      const val = est.ordem === 'pts' ? F1.pts(x.s.pts) + '<small>pts</small>' : est.ordem === 'vit' ? x.s.vit + '<small>vit</small>' : x.pi.cod;
      return `<div class='pl-it${x.p === est.sel ? ' on' : ''}' data-p='${x.p}' style='--c:${x.e.cor}'>` +
        `<em>${i + 1}</em>${F1.avatar(x.p, 'mini', est.ano)}<span><b>${F1.esc(x.pi.completo)}</b><small>${F1.esc(x.e.nome)}</small></span><strong>${val}</strong></div>`;
    }).join('') || `<div class='pl-nada'>Nenhum piloto encontrado</div>`;
    $('.pl-cont').textContent = l.length + (l.length === 1 ? ' piloto' : ' pilotos') + (est.ano ? ' em ' + est.ano : ' no período');
    const on = $('.pl-it.on');
    if (on) on.scrollIntoView({ block: 'nearest' });
  };

  // ---------- ficha ----------
  const desenharHero = () => {
    const p = est.sel, pi = F1.p(p), e = F1.e(F1.equipeDoPiloto(p, est.ano)), cor = e.cor;
    const tit = F1.titulos(p), idade = F1.idade(pi.nasc), nac = F1.nac(pi.nac);
    const hero = $('.pl-hero');
    hero.style.setProperty('--c', cor);
    hero.style.setProperty('--c2', F1.alfa(cor, 0.0));
    const linhas = Array.from({ length: 9 }, (_, i) => `<i style='top:${12 + i * 31}px;animation-delay:${(-i * 0.37).toFixed(2)}s;width:${120 + ((i * 53) % 180)}px'></i>`).join('');
    hero.innerHTML = `
<div class='pl-h-bg'></div><div class='pl-h-linhas'>${linhas}</div>
<div class='pl-h-num'>${F1.esc(pi.num || pi.cod)}</div>
<div class='pl-h-foto'>${F1.avatar(p, 'grande', est.ano)}</div>
<div class='pl-h-info f1-entra'>
  <div class='pl-h-cod'>${F1.esc(pi.cod)}${pi.num ? `<span>#${F1.esc(pi.num)}</span>` : ''}</div>
  <div class='pl-h-nome'><span>${F1.esc(pi.nome)}</span><b>${F1.esc(pi.sobrenome)}</b></div>
  <div class='pl-h-meta'>${F1.bandeira(nac[0])} ${F1.esc(nac[1])}${idade != null ? ` · ${idade} anos` : ''}${pi.nasc ? ` <small>(${F1.data(pi.nasc)})</small>` : ''}</div>
  <div class='pl-h-eq'><i></i>${F1.esc(e.nome)}${est.ano ? ` <small>${est.ano}</small>` : ''}</div>
  <div class='pl-h-tit'>${tit.length ? `<span class='estrelas'>${'★'.repeat(Math.min(tit.length, 8))}</span> ${tit.length}× campeão mundial <small>${tit.join(', ')}</small>` : `<small>Sem títulos mundiais</small>`}</div>
</div>`;
  };

  const desenharKpis = () => {
    const p = est.sel, s = F1.estat(p, est.ano);
    const fim = est.ano ? (F1.finalP.get(est.ano) || []).find((x) => x.p === p) : null;
    const vc = F1.vitoriasCarreira(p);
    const tiles = [
      ['Largadas', s.largadas, 0, s.anos.length + (s.anos.length === 1 ? ' temporada' : ' temporadas')],
      ['Vitórias', s.vit, 0, F1.pct(s.largadas ? s.vit / s.largadas : NaN, 1) + ' das corridas'],
      ['Pódios', s.pod, 0, F1.pct(s.largadas ? s.pod / s.largadas : NaN, 1) + ' das corridas'],
      ['Poles', s.pol, 0, 'largou em 1º'],
      ['Pontos', s.pts, s.pts % 1 ? 1 : 0, F1.fmt(s.largadas ? s.pts / s.largadas : 0, 1) + ' por corrida'],
      ['Voltas rápidas', s.vr, 0, 'melhor volta da prova'],
      ['Abandonos', s.dnf + s.dsq, 0, F1.pct(s.largadas ? (s.dnf + s.dsq) / s.largadas : NaN, 0) + ' das largadas'],
      est.ano
        ? ['Campeonato', fim && fim.pos ? fim.pos : 0, 0, fim ? (F1.temporadaCompleta(est.ano) ? 'posição final' : 'posição atual') : 'sem classificação', 'P']
        : ['Vitórias na F1', vc, 0, 'carreira inteira']
    ];
    $('.pl-kpis').innerHTML = tiles.map((t, i) => `<div class='pl-kpi f1-cartao f1-entra' style='animation-delay:${i * 30}ms'>` +
      `<small>${t[0]}</small><b>${t[4] || ''}<span data-v='${t[1]}' data-d='${t[2]}'>0</span></b><em>${F1.esc(t[3])}</em></div>`).join('');
    palco.querySelectorAll('.pl-kpi b span').forEach((el) => F1.contar(el, +el.getAttribute('data-v'), +el.getAttribute('data-d')));
  };

  // ---------- radar ----------
  const desenharRadar = () => {
    const a = F1.atributos(est.sel), cor = F1.corPiloto(est.sel, est.ano);
    const alvo = $('.pl-radar-svg');
    if (!a) { alvo.innerHTML = `<div class='pl-sem'>Poucas corridas no período para calcular atributos.</div>`; est.radarAnt = null; return; }
    const N = F1.ATRIBUTOS.length, cx = 182, cy = 150, R = 86;
    const ponto = (i, v) => { const ang = -Math.PI / 2 + (i * 2 * Math.PI) / N, r = (R * (v - 20)) / 79; return [cx + r * Math.cos(ang), cy + r * Math.sin(ang)]; };
    const aneis = [40, 60, 80, 99].map((v) => `<polygon class='anel' points='${F1.ATRIBUTOS.map((_, i) => ponto(i, v).join(',')).join(' ')}'/>`).join('');
    const eixos = F1.ATRIBUTOS.map((_, i) => { const [x, y] = ponto(i, 99); return `<line class='eixo' x1='${cx}' y1='${cy}' x2='${x}' y2='${y}'/>`; }).join('');
    const rot = F1.ATRIBUTOS.map(([k, nome, dica], i) => {
      const [x, y] = ponto(i, 117), anc = Math.abs(x - cx) < 8 ? 'middle' : x > cx ? 'start' : 'end';
      return `<g data-tip='<b>${nome}: ${a[k]}</b><small>${dica}</small>'><text class='rot' x='${x}' y='${y - 4}' text-anchor='${anc}'>${nome}</text>` +
        `<text class='val' x='${x}' y='${y + 12}' text-anchor='${anc}'>${a[k]}</text></g>`;
    }).join('');
    alvo.innerHTML = `<svg viewBox='0 0 364 280' width='364' height='280'>${aneis}${eixos}
      <polygon class='forma' style='fill:${F1.alfa(cor, 0.28)};stroke:${cor}' points=''/>${rot}</svg>
      <div class='pl-geral' style='--c:${cor}'><b>${a.geral}</b><small>GERAL</small></div>`;
    const poli = alvo.querySelector('.forma');
    const de = est.radarAnt || F1.ATRIBUTOS.map(() => 20), para = F1.ATRIBUTOS.map(([k]) => a[k]);
    est.radarAnt = para;
    const ini = performance.now();
    F1.anim((t) => {
      const k = Math.min(1, (t - ini) / 600), e = 1 - Math.pow(1 - k, 3);
      poli.setAttribute('points', para.map((v, i) => ponto(i, de[i] + (v - de[i]) * e).join(',')).join(' '));
      return k < 1;
    });
  };

  // ---------- equipes ----------
  const desenharEquipes = () => {
    const p = est.sel, s = F1.estat(p, est.ano);
    const comp = new Map();
    (F1.resPorPiloto.get(p) || []).forEach((r) => {
      if (est.ano && r.ano !== est.ano) return;
      (F1.resPorCorrida.get(r.c) || []).forEach((o) => { if (o.p !== p && o.e === r.e) comp.set(o.p, (comp.get(o.p) || 0) + 1); });
    });
    const top = [...comp.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
    const faixa = (l) => (l.length === 1 ? l[0] : l[0] + '–' + l[l.length - 1]);
    $('.pl-eq-corpo').innerHTML = `<div class='pl-eqs'>${s.equipes.map((x) => { const e = F1.e(x.e); return `<span class='pl-eq' style='--c:${e.cor}'><i></i>${F1.esc(e.nome)}<small>${faixa(x.anos)}</small></span>`; }).join('') || '<small>—</small>'}</div>` +
      `<div class='pl-comp'>${top.map(([q, n]) => `<div class='pl-comp-it' data-p='${q}' data-tip='Abrir ficha de ${F1.esc(F1.p(q).completo)}'>${F1.avatar(q, 'mini')}<span>${F1.esc(F1.p(q).completo)}</span><em>${n} corridas</em></div>`).join('') || `<small class='pl-sem'>Sem companheiros no período</small>`}</div>`;
  };

  // ---------- carreira ----------
  const desenharCarreira = () => {
    const p = est.sel, W = 920, H = 112, anos = F1.anos;
    const dados = anos.map((ano) => {
      const f = (F1.finalP.get(ano) || []).find((x) => x.p === p);
      return { ano, f, e: f ? f.e : F1.equipeDoPiloto(p, ano) };
    });
    const max = Math.max(1, ...dados.map((d) => (d.f ? d.f.pts : 0)));
    const bw = Math.min(84, (W - 20) / Math.max(1, anos.length)), gap = bw * 0.22;
    const barras = dados.map((d, i) => {
      const x = 10 + i * bw, h = d.f ? Math.max(3, (d.f.pts / max) * (H - 34)) : 0, y = H - 16 - h;
      const cor = d.f ? F1.e(d.e).cor : '#2A303C';
      const sel = est.ano === d.ano ? ' sel' : '';
      const camp = F1.campeoes.get(d.ano);
      const ehCamp = camp && camp.p === p;
      const tip = d.f ? `<b>${d.ano} · P${d.f.pos || '—'}</b><small>${F1.pts(d.f.pts)} pts · ${d.f.vit} vitórias · ${F1.esc(F1.e(d.e).nome)}</small>${ehCamp ? '<small>★ Campeão</small>' : ''}` : `<b>${d.ano}</b><small>Não correu</small>`;
      return `<g class='pl-bar${sel}' data-ano='${d.ano}' data-tip='${tip}'><rect class='hit' x='${x}' y='0' width='${bw}' height='${H}'/>` +
        (d.f ? `<rect x='${x + gap / 2}' y='${y}' width='${bw - gap}' height='${h}' rx='3' style='fill:${cor}'/><text class='pos${ehCamp ? ' camp' : ''}' x='${x + bw / 2}' y='${y - 4}'>${ehCamp ? '★' : 'P' + (d.f.pos || '–')}</text>` :
          `<rect x='${x + gap / 2}' y='${H - 19}' width='${bw - gap}' height='3' rx='1.5' style='fill:#2A303C'/>`) +
        `<text class='ano' x='${x + bw / 2}' y='${H - 2}'>${String(d.ano).slice(2)}</text></g>`;
    }).join('');
    $('.pl-car-svg').innerHTML = `<svg viewBox='0 0 ${W} ${H}' width='${W}' height='${H}'>${barras}</svg>`;
  };

  const desenharTudo = () => {
    desenharLista();
    if (!est.sel) return;
    F1.gravar('pl.sel', est.sel);
    desenharHero(); desenharKpis(); desenharRadar(); desenharEquipes(); desenharCarreira();
  };

  // ---------- eventos ----------
  $('.pl-busca').addEventListener('input', (ev) => { est.busca = ev.target.value; desenharLista(); });
  $('.pl-ano').addEventListener('change', (ev) => { est.ano = +ev.target.value; desenharTudo(); });
  $('.pl-ord').addEventListener('click', (ev) => {
    const b = ev.target.closest('button'); if (!b) return;
    est.ordem = b.getAttribute('data-o');
    palco.querySelectorAll('.pl-ord button').forEach((x) => x.classList.toggle('on', x === b));
    desenharLista();
  });
  $('.pl-lista').addEventListener('click', (ev) => {
    const it = ev.target.closest('.pl-it'); if (!it) return;
    est.sel = +it.getAttribute('data-p'); desenharTudo();
  });
  $('.pl-eq-corpo').addEventListener('click', (ev) => {
    const it = ev.target.closest('.pl-comp-it'); if (!it) return;
    est.sel = +it.getAttribute('data-p'); est.busca = ''; $('.pl-busca').value = ''; F1.tipOcultar(); desenharTudo();
  });
  $('.pl-car-svg').addEventListener('click', (ev) => {
    const g = ev.target.closest('.pl-bar'); if (!g) return;
    const ano = +g.getAttribute('data-ano');
    est.ano = est.ano === ano ? 0 : ano;
    $('.pl-ano').value = String(est.ano);
    desenharTudo();
  });
  F1.ouvir(document, 'keydown', (ev) => {
    if (ev.target && ev.target.tagName === 'INPUT') return;
    if (ev.key !== 'ArrowDown' && ev.key !== 'ArrowUp') return;
    const l = listaPilotos(), i = l.findIndex((x) => x.p === est.sel);
    const n = l[Math.max(0, Math.min(l.length - 1, i + (ev.key === 'ArrowDown' ? 1 : -1)))];
    if (n) { est.sel = n.p; desenharTudo(); ev.preventDefault(); }
  });

  desenharTudo();
})();
