# F1 Analytics em Power BI

Relatório Power BI (formato **PBIP**: PBIR + TMDL) que transforma os dados públicos da Fórmula 1 em um painel interativo e animado. Ele usa o visual **HTML Content**, com medidas DAX que geram HTML, CSS e JavaScript.

6 páginas: **Pilotos · Duelo · Temporada · Circuitos · Simulador · Quiz**.

## Destaques

- **Dados ao vivo via API**: a [Jolpica F1](https://github.com/jolpica/jolpica-f1) (sucessora da Ergast) traz calendário e vencedores desde 1950, mais resultados, sprints e classificações do período escolhido (padrão: 2014–2026, a era híbrida). Paginação automática, pausa entre chamadas e novas tentativas em caso de HTTP 429.
- **Pilotos**: ficha com foto (Wikipédia), número, nacionalidade, títulos e KPIs (largadas, vitórias, pódios, poles, pontos, voltas rápidas, abandonos). Inclui radar de 6 atributos calculados por percentil (40–99, estilo "overall"), equipes e companheiros mais frequentes, e campeonato temporada a temporada com clique para filtrar.
- **Duelo**: dois pilotos lado a lado em 10 métricas, com placar de métricas vencidas. Quando foram companheiros, mostra o confronto direto (quem largou e chegou à frente, pontos), a curva de pontos por temporada e uma lista dos duelos internos mais frequentes.
- **Temporada**: *bar chart race* do campeonato rodada a rodada (pilotos ou equipes, corrida + sprint), com reprodução, controle deslizante e velocidade. Tem ainda o campeão ou líder atual, o calendário com vencedores e o pódio de cada GP.
- **Circuitos**: mapa-múndi (Natural Earth) com todos os circuitos da história, zoom animado por região e busca. Linha do tempo de 1950 até hoje colorida pela equipe vencedora, maiores vencedores, conversão pole→vitória e "de onde larga quem vence".
- **Simulador**: corrida volta a volta em *canvas*, numa pista procedural (uma forma fixa por circuito). O ritmo, a regularidade e a confiabilidade de cada piloto vêm do desempenho real dele na temporada. Simula pneus com desgaste, paradas nos boxes, safety car, erros, abandonos, ar sujo e ultrapassagens. Tem semáforo de largada, direção de prova, placar ao vivo, comparação com o resultado real e **Monte Carlo de 1.000 corridas** com chance de vitória e de pódio.
- **Quiz**: "Quem é esse piloto?" (silhueta e pistas reveladas aos poucos), "Quem venceu?", "Qual equipe?" e "Campeões desde 1950". Tem cronômetro, bônus de tempo, sequência, recorde e atalhos de teclado.
- **Modelo estrela** com 11 tabelas, 15 relações e KPIs em DAX (taxa de vitória, pontos por corrida, posições ganhas, conversão de pole etc.), prontos para visuais nativos.

## Estrutura

| Pasta / arquivo | Conteúdo |
|---|---|
| `_staging/m/` | Consultas Power Query (M). Arquivos com `_` são auxiliares (não carregam no modelo): `_Jolpica.m` é a função de paginação e os `_Raw*.m` são as respostas brutas da API |
| `_staging/dax/medidas.dax` | `[JS Dados]` (serializa o modelo para o JavaScript) e os KPIs |
| `_staging/js/` | `comum.js/.css` (dados, estatísticas, componentes), uma dupla `.js/.css` por página, `sim.js` (motor do simulador), `mapa.js` (contorno dos continentes) e `teste_sim.js` |
| `_staging/teste/` | Teste visual fora do Power BI: gera dados fictícios no mesmo formato e renderiza as 6 páginas num Chromium headless |
| `_staging/build.py` | Grava parâmetros, consultas, tabelas, relações e medidas no `*.SemanticModel` (TMDL) |
| `_staging/build_report.py` | Monta as 6 páginas e os visuais no `*.Report` (PBIR) |

## Como montar

1. **Power BI Desktop** › Arquivo › Opções › Recursos de visualização: ative *Opção de salvamento do Projeto do Power BI (.pbip)*, *Armazenar modelo semântico usando o formato TMDL* e *Armazenar relatórios usando o formato de metadados avançado (PBIR)*. Reinicie o Desktop.
2. Crie um relatório em branco e **salve como `.pbip`** nesta pasta (ex.: `F1.pbip`). Feche o Desktop.
3. Rode os dois scripts (Python 3.9 ou superior, sem dependências):
   ```
   python _staging/build.py
   python _staging/build_report.py
   ```
4. Abra o `.pbip`. O visual **HTML Content** (AppSource) é carregado automaticamente; se o Desktop pedir, permita.
5. Arquivo › Opções › **Arquivo atual › Privacidade › "Ignorar os níveis de privacidade"**. A consulta de fotos combina a Jolpica com a Wikipédia, e sem essa opção o Power Query pode bloquear a combinação.
6. Clique em **Atualizar**. Credenciais: *Anônimo* para `api.jolpi.ca` e `en.wikipedia.org`.

Para alterar: edite os arquivos em `_staging/`, feche o Desktop e rode os dois scripts de novo. Cada execução salva um backup em `_staging/backup/`.

### Parâmetros (Transformar dados › Gerenciar parâmetros)

| Parâmetro | Padrão | Efeito |
|---|---|---|
| `AnoInicial` / `AnoFinal` | 2014 / 2026 | Temporadas carregadas em detalhe (resultados, sprints, classificações) |
| `IncluirFotos` | `true` | Busca a foto de cada piloto na Wikipédia. Use `false` se a consulta de fotos der erro; as páginas mostram as iniciais no lugar |

**Orçamento da API**: a Jolpica permite 500 requisições por hora sem token. Uma atualização completa com o período padrão faz cerca de 150 chamadas à Jolpica (mais ~90 à Wikipédia), então dá para atualizar umas 3 vezes por hora. Para períodos maiores, carregue menos temporadas enquanto desenvolve.

## Testes

```
node _staging/js/teste_sim.js                                   # motor do simulador
node _staging/teste/dados_ficticios.js > _staging/teste/dados.js
npm i playwright && node _staging/teste/renderizar.js saida/    # screenshots das 6 páginas + checagem de erros JS
```

## Regras do código JavaScript

- Os arquivos `.js` **não podem ter aspas duplas** (o JavaScript vira literal de texto DAX). Use aspas simples ou crases; o `build.py` recusa o arquivo se encontrar uma.
- O visual re-executa o script a cada atualização. Por isso timers e eventos passam por `F1.intervalo`, `F1.espera` e `F1.ouvir`, que são limpos automaticamente.
- Todas as páginas desenham num palco fixo de 1280×720, escalado para o tamanho do visual.

---

Dados: [Jolpica F1](https://github.com/jolpica/jolpica-f1) (Ergast), fotos da Wikipédia/Wikimedia Commons (licenças CC), bandeiras de [flagcdn](https://flagcdn.com) e contorno dos continentes do [Natural Earth](https://www.naturalearthdata.com) (domínio público) via [world-atlas](https://github.com/topojson/world-atlas). Fórmula 1, F1 e as marcas relacionadas pertencem à Formula One Licensing B.V.; projeto sem fins comerciais, inspirado no [BI_Pokemon](https://github.com/kelven-cardoso/BI_Pokemon).
