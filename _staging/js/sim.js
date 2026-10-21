/* Motor do simulador de corrida (sem DOM, testavel no Node: node _staging/js/teste_sim.js).
   Modelo por volta: ritmo do conjunto piloto+carro, pneus (macio/medio/duro) com desgaste,
   combustivel, erros, abandonos pela confiabilidade real, safety car, ar sujo e ultrapassagens. */
(function (G) {
  'use strict';
  const rng = (semente) => {
    let a = semente >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  const normal = (r) => { let u = 0; while (u === 0) u = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r()); };
  const PNEUS = {
    S: { nome: 'Macio', delta: -0.7, deg: 0.075, vida: 20, cor: '#FF3B30' },
    M: { nome: 'Médio', delta: 0, deg: 0.045, vida: 32, cor: '#FFD24A' },
    H: { nome: 'Duro', delta: 0.5, deg: 0.028, vida: 46, cor: '#F2F2F2' }
  };
  const PONTOS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];

  const estrategia = (r, voltas) => {
    if (r() < 0.62) {
      const ini = r() < 0.7 ? 'M' : 'S';
      const pit = Math.round(voltas * (ini === 'S' ? 0.3 + r() * 0.1 : 0.42 + r() * 0.14));
      return [{ c: ini, ate: pit }, { c: 'H', ate: voltas + 1 }];
    }
    const p1 = Math.round(voltas * (0.25 + r() * 0.08)), p2 = Math.round(voltas * (0.6 + r() * 0.1));
    return [{ c: 'S', ate: p1 }, { c: 'M', ate: p2 }, { c: r() < 0.5 ? 'M' : 'H', ate: voltas + 1 }];
  };

  /* participantes: [{ id, ritmo 0..1, consist 0..1, confiab 0..1 (prob. de terminar), largada 1..n }] */
  const criar = (participantes, opc) => {
    opc = opc || {};
    const r = rng(opc.semente || 1), voltas = Math.max(5, opc.voltas || 57), base = opc.base || 90;
    const carros = participantes.slice().sort((a, b) => a.largada - b.largada).map((p, i) => {
      const plano = estrategia(r, voltas);
      const c = {
        id: p.id, ritmo: p.ritmo, consist: p.consist == null ? 0.7 : p.consist, confiab: p.confiab == null ? 0.9 : p.confiab,
        largada: i + 1, t: i * 0.22, volta: 0, ativo: true, pneu: plano[0].c, idade: 0, plano: plano, paradas: 0,
        melhor: Infinity, tempos: [i * 0.22], abandono: 0, abandonoNa: 0, erros: 0
      };
      if (r() > c.confiab) c.abandonoNa = 1 + Math.floor(r() * voltas);
      return c;
    });
    return { r, voltas, base, carros, volta: 0, sc: 0, nSC: 0, probSC: opc.probSC == null ? 0.011 : opc.probSC, melhorVolta: { t: Infinity, id: null, volta: 0 }, fim: false, eventos: [] };
  };

  const ordemPista = (E) => E.carros.filter((c) => c.ativo).sort((a, b) => a.t - b.t);

  const passo = (E) => {
    if (E.fim) return [];
    const ev = [], n = ++E.volta, r = E.r;
    if (E.sc > 0) { E.sc--; if (E.sc === 0) ev.push({ tipo: 'scfim', volta: n }); }
    else if (n > 2 && n < E.voltas - 3 && r() < E.probSC) { E.sc = 3 + Math.floor(r() * 3); E.nSC++; ev.push({ tipo: 'sc', volta: n }); }
    const emSC = E.sc > 0;
    let frente = null;
    ordemPista(E).forEach((c) => {
      if (c.abandonoNa === n) { c.ativo = false; c.abandono = n; ev.push({ tipo: 'dnf', id: c.id, volta: n }); return; }
      const pn = PNEUS[c.pneu];
      const gasto = c.idade > pn.vida ? pn.deg * c.idade + (c.idade - pn.vida) * 0.12 : pn.deg * c.idade;
      let lt = E.base * (1 + 0.017 * (1 - c.ritmo)) + pn.delta + gasto - 0.03 * n + normal(r) * (0.16 + 0.3 * (1 - c.consist));
      if (n === 1) lt += 3 + c.largada * 0.12;
      if (!emSC && r() < 0.008 * (1.6 - c.consist)) { lt += 1.2 + r() * 3.5; c.erros++; ev.push({ tipo: 'erro', id: c.id, volta: n }); }
      // parada nos boxes: no planejado, ou antecipada quando o safety car entra
      const stint = c.plano[c.paradas];
      let pit = false;
      if (stint && n < E.voltas && (n >= stint.ate || (emSC && n >= stint.ate - 5 && c.plano[c.paradas + 1]))) pit = true;
      if (pit && c.plano[c.paradas + 1]) {
        c.paradas++; c.pneu = c.plano[c.paradas].c; c.idade = 0;
        lt += emSC ? 10.5 + r() : 21 + r() * 1.8;
        ev.push({ tipo: 'pit', id: c.id, volta: n, pneu: c.pneu });
      } else pit = false;
      let novo = c.t + lt;
      if (emSC) novo = Math.max(c.t + E.base * 1.05 + (pit ? 10.5 : 0), frente ? frente.t + 0.7 : c.t + E.base * 1.35);
      else if (frente) {
        const gapMin = 0.3;
        if (novo < frente.t + gapMin) {
          const vant = frente.t + gapMin - novo;
          const chance = pit ? 0 : Math.max(0, Math.min(0.8, vant * 0.5 + (c.ritmo - frente.ritmo) * 0.9 - 0.08));
          if (r() < chance) ev.push({ tipo: 'ult', id: c.id, sobre: frente.id, volta: n });
          else novo = frente.t + gapMin + r() * 0.25;
        }
      }
      const lap = novo - c.t;
      c.t = novo; c.idade++; c.volta = n; c.tempos.push(novo);
      if (!pit && !emSC && n > 1) {
        if (lap < c.melhor) c.melhor = lap;
        if (lap < E.melhorVolta.t) {
          E.melhorVolta = { t: lap, id: c.id, volta: n };
          if (n > E.voltas * 0.25) ev.push({ tipo: 'vr', id: c.id, volta: n, t: lap });
        }
      }
      if (!frente || novo > frente.t) frente = c;
    });
    if (n >= E.voltas) { E.fim = true; ev.push({ tipo: 'fim', volta: n }); }
    E.eventos.push(...ev);
    return ev;
  };

  const classificacao = (E) => {
    const ativos = E.carros.filter((c) => c.ativo).sort((a, b) => b.volta - a.volta || a.t - b.t);
    const fora = E.carros.filter((c) => !c.ativo).sort((a, b) => b.abandono - a.abandono);
    return ativos.concat(fora).map((c, i) => ({
      id: c.id, pos: i + 1, terminou: c.ativo, gap: c.ativo && ativos[0] ? c.t - ativos[0].t : null, voltas: c.volta,
      pontos: c.ativo && i < 10 ? PONTOS[i] : 0, paradas: c.paradas, largada: c.largada, melhor: c.melhor
    }));
  };

  const rodar = (participantes, opc) => {
    const E = criar(participantes, opc);
    while (!E.fim) passo(E);
    return { E, res: classificacao(E) };
  };

  const montecarlo = (participantes, n, opc) => {
    const cont = new Map(participantes.map((p) => [p.id, { id: p.id, vit: 0, pod: 0, pts: 0, somaPos: 0, dnf: 0 }]));
    const base = (opc && opc.semente) || 7;
    for (let i = 0; i < n; i++) {
      const { res } = rodar(participantes, Object.assign({}, opc, { semente: base + i * 7919 }));
      res.forEach((x) => {
        const c = cont.get(x.id);
        if (x.pos === 1) c.vit++;
        if (x.pos <= 3) c.pod++;
        if (!x.terminou) c.dnf++;
        c.pts += x.pontos; c.somaPos += x.pos;
      });
    }
    return [...cont.values()].map((c) => ({ id: c.id, vit: c.vit / n, pod: c.pod / n, pts: c.pts / n, pos: c.somaPos / n, dnf: c.dnf / n })).sort((a, b) => b.vit - a.vit || a.pos - b.pos);
  };

  G.F1Sim = { rng, PNEUS, PONTOS, criar, passo, classificacao, rodar, montecarlo };
})(typeof window !== 'undefined' ? window : globalThis);
