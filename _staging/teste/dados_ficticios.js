/* Gera window.F1_DADOS fictício (mesmo formato da medida [JS Dados]) para testar as páginas fora do Power BI.
   Uso: node _staging/teste/dados_ficticios.js > _staging/teste/dados.js */
const rng = (s) => () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const r = rng(42);
const pick = (a) => a[Math.floor(r() * a.length)];

const CIRC = [
  ['bahrain', 'Bahrain International Circuit', 'Sakhir', 'Bahrain', 26.03, 50.51], ['jeddah', 'Jeddah Corniche Circuit', 'Jeddah', 'Saudi Arabia', 21.63, 39.10],
  ['albert_park', 'Albert Park Grand Prix Circuit', 'Melbourne', 'Australia', -37.85, 144.97], ['suzuka', 'Suzuka Circuit', 'Suzuka', 'Japan', 34.84, 136.54],
  ['shanghai', 'Shanghai International Circuit', 'Shanghai', 'China', 31.34, 121.22], ['miami', 'Miami International Autodrome', 'Miami', 'USA', 25.96, -80.24],
  ['imola', 'Autodromo Enzo e Dino Ferrari', 'Imola', 'Italy', 44.34, 11.72], ['monaco', 'Circuit de Monaco', 'Monte-Carlo', 'Monaco', 43.73, 7.42],
  ['villeneuve', 'Circuit Gilles Villeneuve', 'Montreal', 'Canada', 45.50, -73.52], ['catalunya', 'Circuit de Barcelona-Catalunya', 'Montmeló', 'Spain', 41.57, 2.26],
  ['red_bull_ring', 'Red Bull Ring', 'Spielberg', 'Austria', 47.22, 14.76], ['silverstone', 'Silverstone Circuit', 'Silverstone', 'UK', 52.07, -1.01],
  ['hungaroring', 'Hungaroring', 'Budapest', 'Hungary', 47.58, 19.25], ['spa', 'Circuit de Spa-Francorchamps', 'Spa', 'Belgium', 50.44, 5.97],
  ['zandvoort', 'Circuit Park Zandvoort', 'Zandvoort', 'Netherlands', 52.39, 4.54], ['monza', 'Autodromo Nazionale di Monza', 'Monza', 'Italy', 45.62, 9.28],
  ['baku', 'Baku City Circuit', 'Baku', 'Azerbaijan', 40.37, 49.85], ['marina_bay', 'Marina Bay Street Circuit', 'Marina Bay', 'Singapore', 1.29, 103.86],
  ['americas', 'Circuit of the Americas', 'Austin', 'USA', 30.13, -97.64], ['rodriguez', 'Autódromo Hermanos Rodríguez', 'Mexico City', 'Mexico', 19.40, -99.09],
  ['interlagos', 'Autódromo José Carlos Pace', 'São Paulo', 'Brazil', -23.70, -46.70], ['vegas', 'Las Vegas Strip Street Circuit', 'Las Vegas', 'USA', 36.11, -115.17],
  ['losail', 'Losail International Circuit', 'Al Daayen', 'Qatar', 25.49, 51.45], ['yas_marina', 'Yas Marina Circuit', 'Abu Dhabi', 'UAE', 24.47, 54.60],
  ['sochi', 'Sochi Autodrom', 'Sochi', 'Russia', 43.41, 39.96], ['hockenheimring', 'Hockenheimring', 'Hockenheim', 'Germany', 49.33, 8.57],
  ['ricard', 'Circuit Paul Ricard', 'Le Castellet', 'France', 43.25, 5.79], ['sepang', 'Sepang International Circuit', 'Kuala Lumpur', 'Malaysia', 2.76, 101.74],
  ['istanbul', 'Istanbul Park', 'Istanbul', 'Turkey', 40.95, 29.41], ['portimao', 'Autódromo Internacional do Algarve', 'Portimão', 'Portugal', 37.23, -8.63],
  ['reims', 'Reims-Gueux', 'Reims', 'France', 49.25, 3.93], ['kyalami', 'Kyalami', 'Midrand', 'South Africa', -25.99, 28.07],
  ['galvez', 'Autódromo Juan y Oscar Gálvez', 'Buenos Aires', 'Argentina', -34.69, -58.46], ['nurburgring', 'Nürburgring', 'Nürburg', 'Germany', 50.33, 6.94],
  ['adelaide', 'Adelaide Street Circuit', 'Adelaide', 'Australia', -34.93, 138.62], ['watkins_glen', 'Watkins Glen', 'New York State', 'USA', 42.34, -76.92]
];
const GP = { bahrain: 'Bahrain', jeddah: 'Saudi Arabian', albert_park: 'Australian', suzuka: 'Japanese', shanghai: 'Chinese', miami: 'Miami', imola: 'Emilia Romagna', monaco: 'Monaco', villeneuve: 'Canadian', catalunya: 'Spanish', red_bull_ring: 'Austrian', silverstone: 'British', hungaroring: 'Hungarian', spa: 'Belgian', zandvoort: 'Dutch', monza: 'Italian', baku: 'Azerbaijan', marina_bay: 'Singapore', americas: 'United States', rodriguez: 'Mexico City', interlagos: 'São Paulo', vegas: 'Las Vegas', losail: 'Qatar', yas_marina: 'Abu Dhabi', sochi: 'Russian', hockenheimring: 'German', ricard: 'French', sepang: 'Malaysian', istanbul: 'Turkish', portimao: 'Portuguese', reims: 'French', kyalami: 'South African', galvez: 'Argentine', nurburgring: 'German', adelaide: 'Australian', watkins_glen: 'United States' };
const EQ = [
  ['mercedes', 'Mercedes', 'German', '#27F4D2'], ['red_bull', 'Red Bull', 'Austrian', '#3671C6'], ['ferrari', 'Ferrari', 'Italian', '#E8002D'],
  ['mclaren', 'McLaren', 'British', '#FF8000'], ['williams', 'Williams', 'British', '#64C4FF'], ['aston_martin', 'Aston Martin', 'British', '#229971'],
  ['alpine', 'Alpine F1 Team', 'French', '#0093CC'], ['rb', 'RB F1 Team', 'Italian', '#6692FF'], ['sauber', 'Sauber', 'Swiss', '#52E252'],
  ['haas', 'Haas F1 Team', 'American', '#B6BABD'], ['audi', 'Audi', 'German', '#BB0A30'], ['cadillac', 'Cadillac F1 Team', 'American', '#C6A15B'],
  ['lotus', 'Team Lotus', 'British', '#FFB800'], ['brabham', 'Brabham', 'British', '#1E3A8A'], ['tyrrell', 'Tyrrell', 'British', '#0033A0']
];
const PIL = [
  ['hamilton', 'HAM', '44', 'Lewis', 'Hamilton', '1985-01-07', 'British', 0.95], ['max_verstappen', 'VER', '3', 'Max', 'Verstappen', '1997-09-30', 'Dutch', 0.97],
  ['leclerc', 'LEC', '16', 'Charles', 'Leclerc', '1997-10-16', 'Monegasque', 0.85], ['norris', 'NOR', '4', 'Lando', 'Norris', '1999-11-13', 'British', 0.86],
  ['piastri', 'PIA', '81', 'Oscar', 'Piastri', '2001-04-06', 'Australian', 0.82], ['russell', 'RUS', '63', 'George', 'Russell', '1998-02-15', 'British', 0.8],
  ['sainz', 'SAI', '55', 'Carlos', 'Sainz', '1994-09-01', 'Spanish', 0.76], ['alonso', 'ALO', '14', 'Fernando', 'Alonso', '1981-07-29', 'Spanish', 0.8],
  ['vettel', 'VET', '5', 'Sebastian', 'Vettel', '1987-07-03', 'German', 0.82], ['rosberg', 'ROS', '6', 'Nico', 'Rosberg', '1985-06-27', 'German', 0.86],
  ['bottas', 'BOT', '77', 'Valtteri', 'Bottas', '1989-08-28', 'Finnish', 0.74], ['ricciardo', 'RIC', '3', 'Daniel', 'Ricciardo', '1989-07-01', 'Australian', 0.72],
  ['perez', 'PER', '11', 'Sergio', 'Pérez', '1990-01-26', 'Mexican', 0.68], ['raikkonen', 'RAI', '7', 'Kimi', 'Räikkönen', '1979-10-17', 'Finnish', 0.7],
  ['ocon', 'OCO', '31', 'Esteban', 'Ocon', '1996-09-17', 'French', 0.55], ['gasly', 'GAS', '10', 'Pierre', 'Gasly', '1996-02-07', 'French', 0.55],
  ['albon', 'ALB', '23', 'Alexander', 'Albon', '1996-03-23', 'Thai', 0.5], ['stroll', 'STR', '18', 'Lance', 'Stroll', '1998-10-29', 'Canadian', 0.42],
  ['hulkenberg', 'HUL', '27', 'Nico', 'Hülkenberg', '1987-08-19', 'German', 0.5], ['magnussen', 'MAG', '20', 'Kevin', 'Magnussen', '1992-10-05', 'Danish', 0.42],
  ['tsunoda', 'TSU', '22', 'Yuki', 'Tsunoda', '2000-05-11', 'Japanese', 0.45], ['zhou', 'ZHO', '24', 'Guanyu', 'Zhou', '1999-05-30', 'Chinese', 0.35],
  ['antonelli', 'ANT', '12', 'Andrea Kimi', 'Antonelli', '2006-08-25', 'Italian', 0.66], ['bortoleto', 'BOR', '5', 'Gabriel', 'Bortoleto', '2004-10-14', 'Brazilian', 0.45],
  ['hadjar', 'HAD', '6', 'Isack', 'Hadjar', '2004-09-28', 'French', 0.5], ['bearman', 'BEA', '87', 'Oliver', 'Bearman', '2005-05-08', 'British', 0.45],
  ['lawson', 'LAW', '30', 'Liam', 'Lawson', '2002-02-11', 'New Zealander', 0.44], ['massa', 'MAS', '19', 'Felipe', 'Massa', '1981-04-25', 'Brazilian', 0.6],
  ['button', 'BUT', '22', 'Jenson', 'Button', '1980-01-19', 'British', 0.6], ['grosjean', 'GRO', '8', 'Romain', 'Grosjean', '1986-04-17', 'French', 0.45],
  ['kvyat', 'KVY', '26', 'Daniil', 'Kvyat', '1994-04-26', 'Russian', 0.4], ['nasr', 'NAS', '12', 'Felipe', 'Nasr', '1992-08-21', 'Brazilian', 0.38],
  ['colapinto', 'COL', '43', 'Franco', 'Colapinto', '2003-05-27', 'Argentine', 0.38], ['arvid_lindblad', 'LIN', '41', 'Arvid', 'Lindblad', '2007-08-08', 'British', 0.4],
  ['dambrosio', 'DAM', '', 'Jérôme', 'd\'Ambrosio', '1985-12-27', 'Belgian', 0.2]
];
const HISTP = [['michael_schumacher', 'Michael', 'Schumacher', 'German'], ['senna', 'Ayrton', 'Senna', 'Brazilian'], ['prost', 'Alain', 'Prost', 'French'],
  ['lauda', 'Niki', 'Lauda', 'Austrian'], ['clark', 'Jim', 'Clark', 'British'], ['fangio', 'Juan', 'Fangio', 'Argentine'], ['piquet', 'Nelson', 'Piquet', 'Brazilian'],
  ['fittipaldi', 'Emerson', 'Fittipaldi', 'Brazilian'], ['stewart', 'Jackie', 'Stewart', 'British'], ['hakkinen', 'Mika', 'Häkkinen', 'Finnish'], ['mansell', 'Nigel', 'Mansell', 'British']];
const HIST = [[1950, 'Nino Farina', 'Alfa Romeo'], [1957, 'Juan Fangio', 'Maserati'], [1963, 'Jim Clark', 'Lotus'], [1972, 'Emerson Fittipaldi', 'Lotus'], [1973, 'Jackie Stewart', 'Tyrrell'],
  [1975, 'Niki Lauda', 'Ferrari'], [1981, 'Nelson Piquet', 'Brabham'], [1988, 'Ayrton Senna', 'McLaren'], [1989, 'Alain Prost', 'McLaren'], [1990, 'Ayrton Senna', 'McLaren'],
  [1991, 'Ayrton Senna', 'McLaren'], [1992, 'Nigel Mansell', 'Williams'], [1994, 'Michael Schumacher', 'Benetton'], [1998, 'Mika Häkkinen', 'McLaren'], [2000, 'Michael Schumacher', 'Ferrari'],
  [2005, 'Fernando Alonso', 'Renault'], [2007, 'Kimi Räikkönen', 'Ferrari'], [2008, 'Lewis Hamilton', 'McLaren'], [2009, 'Jenson Button', 'Brawn'], [2010, 'Sebastian Vettel', 'Red Bull'],
  [2014, 'Lewis Hamilton', 'Mercedes'], [2016, 'Nico Rosberg', 'Mercedes'], [2021, 'Max Verstappen', 'Red Bull'], [2025, 'Lando Norris', 'McLaren']];

const pl = [], eq = [], ci = [], co = [], rs = [], sp = [], vi = [], cp = [], ce = [], ch = [];
const pk = new Map(), ek = new Map(), ck = new Map();
PIL.forEach((p, i) => { pk.set(p[0], i + 1); pl.push([i + 1, p[0], p[1], p[2], p[3], p[4], p[5], p[6], '']); });
HISTP.forEach((p) => { const k = pl.length + 1; pk.set(p[0], k); pl.push([k, p[0], '', '', p[1], p[2], '1960-01-01', p[3], '']); });
EQ.forEach((e, i) => { ek.set(e[0], i + 1); eq.push([i + 1, e[0], e[1], e[2], e[3]]); });
CIRC.forEach((c, i) => { ck.set(c[0], i + 1); ci.push([i + 1, c[0], c[1], c[2], c[3], c[4], c[5]]); });
const forca = new Map(PIL.map((p) => [p[0], p[7]]));
const PTS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
const moderno = CIRC.slice(0, 30).map((c) => c[0]);
// historico 1950-2013: calendario e vencedores
for (let ano = 1950; ano <= 2013; ano++) {
  const n = 7 + Math.floor((ano - 1950) / 4);
  const cs = [...CIRC.map((c) => c[0])].sort(() => r() - 0.5).slice(0, Math.min(n, 30));
  cs.forEach((c, i) => {
    const key = ano * 100 + i + 1;
    co.push([key, ck.get(c), GP[c], `${ano}-${String(3 + Math.floor(i / 2)).padStart(2, '0')}-10`, 60, 5400000]);
    const v = ano < 2007 ? pick(HISTP)[0] : pick(['hamilton', 'vettel', 'alonso', 'raikkonen', 'button', 'massa', 'rosberg']);
    vi.push([key, pk.get(v), ek.get(pick(['ferrari', 'mclaren', 'williams', 'lotus', 'brabham', 'tyrrell', 'red_bull'])), 1 + Math.floor(r() * 4)]);
  });
}
// periodo 2014-2026
const elencos = {
  2014: ['hamilton', 'rosberg', 'ricciardo', 'vettel', 'alonso', 'raikkonen', 'bottas', 'massa', 'button', 'magnussen', 'hulkenberg', 'perez', 'kvyat', 'grosjean', 'albon', 'stroll', 'ocon', 'gasly', 'nasr', 'dambrosio'],
  2019: ['hamilton', 'bottas', 'max_verstappen', 'albon', 'vettel', 'leclerc', 'norris', 'sainz', 'ricciardo', 'hulkenberg', 'perez', 'stroll', 'kvyat', 'gasly', 'raikkonen', 'magnussen', 'grosjean', 'russell', 'ocon', 'massa'],
  2022: ['hamilton', 'russell', 'max_verstappen', 'perez', 'leclerc', 'sainz', 'norris', 'ricciardo', 'alonso', 'ocon', 'gasly', 'tsunoda', 'vettel', 'stroll', 'bottas', 'zhou', 'magnussen', 'hulkenberg', 'albon', 'lawson'],
  2025: ['norris', 'piastri', 'max_verstappen', 'tsunoda', 'leclerc', 'hamilton', 'russell', 'antonelli', 'alonso', 'stroll', 'gasly', 'colapinto', 'albon', 'sainz', 'hadjar', 'lawson', 'hulkenberg', 'bortoleto', 'ocon', 'bearman'],
  2026: ['norris', 'piastri', 'max_verstappen', 'hadjar', 'leclerc', 'hamilton', 'russell', 'antonelli', 'alonso', 'stroll', 'gasly', 'colapinto', 'albon', 'sainz', 'arvid_lindblad', 'lawson', 'hulkenberg', 'bortoleto', 'ocon', 'bearman', 'perez', 'bottas']
};
const equipesAno = (ano) => (ano >= 2026 ? ['mclaren', 'red_bull', 'ferrari', 'mercedes', 'aston_martin', 'alpine', 'williams', 'rb', 'audi', 'haas', 'cadillac'] : ['mercedes', 'red_bull', 'ferrari', 'mclaren', 'aston_martin', 'alpine', 'williams', 'rb', 'sauber', 'haas']);
for (let ano = 2014; ano <= 2026; ano++) {
  const base = ano >= 2026 ? 2026 : ano >= 2025 ? 2025 : ano >= 2022 ? 2022 : ano >= 2019 ? 2019 : 2014;
  const el = elencos[base], eqs = equipesAno(ano);
  const carro = new Map(eqs.map((e, i) => [e, ano < 2021 ? (e === 'mercedes' ? 1 : 0.9 - i * 0.07) : ano < 2024 ? (e === 'red_bull' ? 1 : 0.88 - i * 0.06) : (e === 'mclaren' ? 1 : 0.9 - i * 0.05)]));
  const eqDe = new Map(el.map((p, i) => [p, eqs[Math.floor(i / 2) % eqs.length]]));
  const cal = moderno.slice().sort(() => r() - 0.5).slice(0, ano >= 2023 ? 23 : 21);
  const feitas = ano === 2026 ? 19 : cal.length;
  const totP = new Map(), totE = new Map(), vitP = new Map(), vitE = new Map();
  cal.forEach((c, i) => {
    const key = ano * 100 + i + 1;
    const real = i < feitas;
    co.push([key, ck.get(c), GP[c], `${ano}-${String(3 + Math.floor(i / 2.4)).padStart(2, '0')}-${String(5 + (i % 3) * 7).padStart(2, '0')}`, real ? 50 + Math.floor(r() * 20) : 0, real ? 5400000 + Math.floor(r() * 600000) : 0]);
    if (!real) return;
    const ordem = el.map((p) => ({ p, v: forca.get(p) * 0.5 + carro.get(eqDe.get(p)) * 0.7 + r() * 0.45 })).sort((a, b) => b.v - a.v);
    const grid = el.map((p) => ({ p, v: forca.get(p) * 0.5 + carro.get(eqDe.get(p)) * 0.7 + r() * 0.3 })).sort((a, b) => b.v - a.v).map((x) => x.p);
    const vr = ordem[Math.floor(r() * 5)].p;
    ordem.forEach((x, j) => {
      const dnf = r() < 0.07, st = dnf ? 2 : j > 12 ? 1 : 0;
      const pts = !dnf && j < 10 ? PTS[j] : 0;
      rs.push([key, pk.get(x.p), ek.get(eqDe.get(x.p)), grid.indexOf(x.p) + 1, j + 1, pts, st, x.p === vr ? 1 : 0]);
      totP.set(x.p, (totP.get(x.p) || 0) + pts); totE.set(eqDe.get(x.p), (totE.get(eqDe.get(x.p)) || 0) + pts);
      if (j === 0) { vitP.set(x.p, (vitP.get(x.p) || 0) + 1); vitE.set(eqDe.get(x.p), (vitE.get(eqDe.get(x.p)) || 0) + 1); vi.push([key, pk.get(x.p), ek.get(eqDe.get(x.p)), grid.indexOf(x.p) + 1]); }
    });
    if (ano >= 2021 && i % 4 === 2) {
      ordem.slice(0, 8).forEach((x, j) => { const pts = 8 - j; sp.push([key, pk.get(x.p), ek.get(eqDe.get(x.p)), j + 1, pts]); totP.set(x.p, totP.get(x.p) + pts); totE.set(eqDe.get(x.p), totE.get(eqDe.get(x.p)) + pts); });
    }
  });
  [...totP.entries()].sort((a, b) => b[1] - a[1]).forEach(([p, v], i) => cp.push([ano, feitas, i + 1, pk.get(p), ek.get(eqDe.get(p)), v, vitP.get(p) || 0]));
  [...totE.entries()].sort((a, b) => b[1] - a[1]).forEach(([e, v], i) => ce.push([ano, feitas, i + 1, ek.get(e), v, vitE.get(e) || 0]));
}
HIST.forEach((h) => { const k = pl.find((p) => (p[4] + ' ' + p[5]) === h[1]); ch.push([h[0], h[1], h[2], k ? k[0] : -1]); });

const dados = { v: rs.length, pl, eq, ci, co, rs, sp, vi, cp, ce, ch };
process.stdout.write('window.F1_DADOS=' + JSON.stringify(dados).replace(/'/g, '\\\'').replace(/"/g, '\'') + ';');
