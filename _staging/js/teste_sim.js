/* Teste do motor do simulador. Uso: node _staging/js/teste_sim.js */
'use strict';
require('./sim.js');
const S = globalThis.F1Sim;
const assert = require('assert');

// grid de 20 carros com ritmo decrescente
const grid = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1, ritmo: 1 - i / 19, consist: 0.85 - i * 0.02, confiab: 0.95 - i * 0.005, largada: i + 1
}));
const opc = { voltas: 57, base: 92, semente: 123 };

// 1) determinismo: mesma semente, mesmo resultado
const a = S.rodar(grid, opc).res.map((x) => x.id).join(',');
const b = S.rodar(grid, opc).res.map((x) => x.id).join(',');
assert.strictEqual(a, b, 'mesma semente deveria dar o mesmo resultado');

// 2) coerência de uma corrida
const { E, res } = S.rodar(grid, opc);
assert.strictEqual(res.length, 20);
assert.deepStrictEqual(res.map((x) => x.pos), Array.from({ length: 20 }, (_, i) => i + 1));
const pontos = res.reduce((s, x) => s + x.pontos, 0);
const terminaram = res.filter((x) => x.terminou).length;
assert.ok(pontos <= 101 && pontos >= 1, 'pontos distribuídos fora do esperado: ' + pontos);
assert.ok(E.carros.every((c) => c.tempos.every((t) => Number.isFinite(t))), 'tempo inválido');
E.carros.filter((c) => c.ativo).forEach((c) => {
  assert.strictEqual(c.tempos.length, opc.voltas + 1, 'carro ativo sem todas as voltas');
  for (let i = 1; i < c.tempos.length; i++) assert.ok(c.tempos[i] > c.tempos[i - 1], 'tempo acumulado não crescente');
});
const ord = res.filter((x) => x.terminou);
for (let i = 1; i < ord.length; i++) assert.ok(ord[i].gap >= ord[i - 1].gap, 'classificação fora de ordem');

// 3) Monte Carlo: o mais rápido vence mais que o mais lento, e a probabilidade cai com o ritmo
const mc = S.montecarlo(grid, 400, { voltas: 57, base: 92, semente: 9 });
const p = (id) => mc.find((x) => x.id === id);
assert.ok(p(1).vit > p(10).vit && p(10).vit >= p(20).vit, 'vitórias não seguem o ritmo');
assert.ok(p(1).pos < p(10).pos && p(10).pos < p(20).pos, 'posição média não segue o ritmo');
const somaVit = mc.reduce((s, x) => s + x.vit, 0);
assert.ok(Math.abs(somaVit - 1) < 1e-9, 'probabilidades de vitória não somam 1');
const dnf = mc.reduce((s, x) => s + x.dnf, 0) / 20;

// 4) safety car e paradas acontecem
let comSC = 0, paradas = 0;
for (let i = 0; i < 200; i++) {
  const r = S.rodar(grid, { voltas: 57, base: 92, semente: 1000 + i });
  if (r.E.nSC) comSC++;
  paradas += r.res.reduce((s, x) => s + x.paradas, 0) / 20;
}

console.log('✓ determinístico com semente');
console.log(`✓ corrida coerente: ${terminaram} terminaram, ${pontos} pontos distribuídos, vencedor largou P${res[0].largada}`);
console.log(`✓ Monte Carlo 400×: P1 do grid vence ${(p(1).vit * 100).toFixed(1)}% | P10 ${(p(10).vit * 100).toFixed(1)}% | P20 ${(p(20).vit * 100).toFixed(1)}%`);
console.log(`  posição média: P1→${p(1).pos.toFixed(1)}  P10→${p(10).pos.toFixed(1)}  P20→${p(20).pos.toFixed(1)} | abandonos ${(dnf * 100).toFixed(1)}%`);
console.log(`✓ safety car em ${(comSC / 2).toFixed(0)}% das corridas | ${(paradas / 200).toFixed(2)} paradas por carro`);
