"""Grava o modelo semântico (TMDL) do PBIP: parâmetros, consultas M, tabelas, relações e medidas.

Uso:  python _staging/build.py
Feche o Power BI Desktop antes de rodar; reabra o .pbip depois e clique em Atualizar.
Um backup da pasta definition é salvo em _staging/backup/ a cada execução.
"""
import re
import shutil
import sys
import uuid
from datetime import datetime
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
STAGING = RAIZ / "_staging"
M_DIR = STAGING / "m"
JS_DIR = STAGING / "js"
DAX_FILE = STAGING / "dax" / "medidas.dax"
T = "\t"

# parâmetros do Power Query: (nome, valor M, tipo)
PARAMETROS = [
    ("AnoInicial", "2014", "Number"),
    ("AnoFinal", "2026", "Number"),
    ("IncluirFotos", "true", "Logical"),
]

# consultas auxiliares (não carregadas no modelo): arquivo m/_<nome>.m -> tipo do resultado
EXPRESSOES = {
    "Jolpica": "Function",
    "RawCorridas": "List",
    "RawResultados": "List",
    "RawSprints": "List",
    "RawVitorias": "List",
    "RawClassifPilotos": "List",
    "RawClassifEquipes": "List",
}

URL = {"dataCategory": "WebUrl"}
IMG = {"dataCategory": "ImageUrl"}
OCULTA = {"isHidden": None}

# (coluna, tipo TMDL, extras) — a ordem das tabelas aqui é a ordem das consultas no Power Query
COLUNAS = {
    "Circuitos": [
        ("CircuitoKey", "int64", OCULTA), ("CircuitoId", "string", {}), ("Circuito", "string", {}),
        ("Cidade", "string", {}), ("Pais", "string", {"dataCategory": "Country"}),
        ("Latitude", "double", {"dataCategory": "Latitude"}), ("Longitude", "double", {"dataCategory": "Longitude"}),
        ("UrlWiki", "string", URL),
    ],
    "Corridas": [
        ("CorridaKey", "int64", OCULTA), ("Temporada", "int64", {}), ("Rodada", "int64", {}),
        ("NomeCorrida", "string", {"sortByColumn": "CorridaKey"}), ("GP", "string", {}), ("Data", "string", OCULTA),
        ("DataCorrida", "dateTime", {"formatString": "dd/mm/yyyy"}), ("CircuitoId", "string", OCULTA),
        ("CircuitoKey", "int64", OCULTA), ("Voltas", "int64", {}), ("TempoVencedorMs", "int64", {}), ("UrlWiki", "string", URL),
    ],
    "Pilotos": [
        ("PilotoId", "string", {}), ("Codigo", "string", {}), ("Numero", "string", {}), ("Nome", "string", {}),
        ("Sobrenome", "string", {}), ("NomeCompleto", "string", {}), ("Nascimento", "string", {}),
        ("Nacionalidade", "string", {}), ("UrlWiki", "string", URL), ("PilotoKey", "int64", OCULTA),
    ],
    "FotosPilotos": [("PilotoId", "string", {}), ("Foto", "string", IMG)],
    "Equipes": [
        ("EquipeId", "string", {}), ("Equipe", "string", {}), ("Nacionalidade", "string", {}),
        ("Cor", "string", {}), ("UrlWiki", "string", URL), ("EquipeKey", "int64", OCULTA),
    ],
    "Resultados": [
        ("CorridaKey", "int64", OCULTA), ("Temporada", "int64", {}), ("Rodada", "int64", {}),
        ("PilotoKey", "int64", OCULTA), ("EquipeKey", "int64", OCULTA), ("PilotoId", "string", OCULTA),
        ("EquipeId", "string", OCULTA), ("NumeroCarro", "string", {}), ("Grid", "int64", {}), ("Posicao", "int64", {}),
        ("PosicaoTexto", "string", {}), ("Pontos", "double", {"formatString": "#,0.#"}), ("Voltas", "int64", {}),
        ("Status", "string", {}), ("StatusCodigo", "int64", {}), ("Classificado", "boolean", {}),
        ("VoltaRapida", "int64", {}), ("TempoMs", "int64", {}),
    ],
    "Sprints": [
        ("CorridaKey", "int64", OCULTA), ("Temporada", "int64", {}), ("Rodada", "int64", {}),
        ("PilotoKey", "int64", OCULTA), ("EquipeKey", "int64", OCULTA), ("Grid", "int64", {}), ("Posicao", "int64", {}),
        ("Pontos", "double", {"formatString": "#,0.#"}), ("StatusCodigo", "int64", {}),
    ],
    "Vitorias": [
        ("CorridaKey", "int64", OCULTA), ("Temporada", "int64", {}), ("Rodada", "int64", {}),
        ("PilotoKey", "int64", OCULTA), ("EquipeKey", "int64", OCULTA), ("Grid", "int64", {}),
    ],
    "ClassifPilotos": [
        ("Temporada", "int64", {}), ("Rodada", "int64", {}), ("Posicao", "int64", {}), ("PilotoKey", "int64", OCULTA),
        ("EquipeKey", "int64", OCULTA), ("Pontos", "double", {"formatString": "#,0.#"}), ("NumVitorias", "int64", {}),
    ],
    "ClassifEquipes": [
        ("Temporada", "int64", {}), ("Rodada", "int64", {}), ("Posicao", "int64", {}), ("EquipeKey", "int64", OCULTA),
        ("Pontos", "double", {"formatString": "#,0.#"}), ("NumVitorias", "int64", {}),
    ],
    "CampeoesHistoricos": [
        ("Ano", "int64", {}), ("Piloto", "string", {}), ("Equipe", "string", {}), ("PilotoKey", "int64", OCULTA),
    ],
}

# (de, para) — muitos-para-um, filtro em direção única
RELACOES = [
    ("Corridas.CircuitoKey", "Circuitos.CircuitoKey"),
    ("Resultados.CorridaKey", "Corridas.CorridaKey"),
    ("Resultados.PilotoKey", "Pilotos.PilotoKey"),
    ("Resultados.EquipeKey", "Equipes.EquipeKey"),
    ("Sprints.CorridaKey", "Corridas.CorridaKey"),
    ("Sprints.PilotoKey", "Pilotos.PilotoKey"),
    ("Sprints.EquipeKey", "Equipes.EquipeKey"),
    ("Vitorias.CorridaKey", "Corridas.CorridaKey"),
    ("Vitorias.PilotoKey", "Pilotos.PilotoKey"),
    ("Vitorias.EquipeKey", "Equipes.EquipeKey"),
    ("ClassifPilotos.PilotoKey", "Pilotos.PilotoKey"),
    ("ClassifPilotos.EquipeKey", "Equipes.EquipeKey"),
    ("ClassifEquipes.EquipeKey", "Equipes.EquipeKey"),
    ("CampeoesHistoricos.PilotoKey", "Pilotos.PilotoKey"),
    ("FotosPilotos.PilotoId", "Pilotos.PilotoId"),
]

# páginas em JavaScript: nome da medida -> arquivos em js/ (comum.js entra antes; o CSS é o do último arquivo)
PAGINAS_JS = {
    "Pilotos": ["pilotos"],
    "Duelo": ["duelo"],
    "Temporada": ["temporada"],
    "Circuitos": ["mapa", "circuitos"],
    "Simulador": ["sim", "corrida"],
    "Quiz": ["quiz"],
}


def q(nome: str) -> str:
    """Nome TMDL entre aspas simples quando necessário."""
    return f"'{nome}'" if re.search(r"[^A-Za-z0-9_]", nome) else nome


def bloco(codigo: str, nivel: int) -> str:
    pre = T * nivel
    return "\n".join((pre + l) if l.strip() else "" for l in codigo.strip("\n").splitlines())


def ler_m(nome: str) -> str:
    """Lê m/<nome>.m sem os comentários de cabeçalho (ficam só no arquivo-fonte)."""
    linhas = (M_DIR / f"{nome}.m").read_text(encoding="utf-8").splitlines()
    while linhas and (linhas[0].strip().startswith("//") or not linhas[0].strip()):
        linhas.pop(0)
    return "\n".join(linhas)


def tabela_tmdl(nome: str) -> str:
    out = [f"table {q(nome)}", ""]
    for col, tipo, extra in COLUNAS[nome]:
        out.append(f"{T}column {q(col)}")
        out.append(f"{T*2}dataType: {tipo}")
        if tipo == "int64" and "formatString" not in extra:
            out.append(f"{T*2}formatString: 0")
        for k, v in extra.items():
            out.append(f"{T*2}{k}" if v is None else f"{T*2}{k}: {v}")
        out.append(f"{T*2}summarizeBy: none")
        out.append(f"{T*2}sourceColumn: {col}")
        out.append("")
    out.append(f"{T}partition {q(nome)} = m")
    out.append(f"{T*2}mode: import")
    out.append(f"{T*2}source =")
    out.append(bloco(ler_m(nome), 4))
    out.append("")
    return "\n".join(out) + "\n"


# ---------- medidas ----------
def literal_dax(texto: str, tamanho: int = 4000) -> str:
    """Texto -> literais DAX concatenados (pedaços curtos, aspas duplas dobradas)."""
    texto = texto.replace('"', '""')
    partes = [texto[i:i + tamanho] for i in range(0, len(texto), tamanho)] or [""]
    return "\n& ".join(f'"{p}"' for p in partes)


def ler_js(nome: str) -> str:
    texto = (JS_DIR / nome).read_text(encoding="utf-8")
    if nome.endswith(".js") and '"' in texto:
        sys.exit(f"{nome} não pode ter aspas duplas (use aspas simples ou crases).")
    if "```" in texto:
        sys.exit(f"{nome} não pode ter três crases seguidas (quebra o bloco da medida no TMDL).")
    return texto


def medidas_paginas():
    comum_js, comum_css = ler_js("comum.js"), ler_js("comum.css")
    out = []
    for nome, arquivos in PAGINAS_JS.items():
        js = comum_js + "\n" + "\n".join(ler_js(a + ".js") for a in arquivos)
        html = ("VAR _dados = [JS Dados]\nVAR _motor =\n" + literal_dax(js) + "\nRETURN\n"
                "    \"<div id='app-raiz'></div><script>\" & _dados & \"</script><script>\" & _motor & \"</script>\"")
        out.append((f"<HTML> {nome}", "<HTML>", html, None))
        out.append((f"<CSS> {nome}", "<HTML>\\CSS", literal_dax(comum_css + "\n" + ler_js(arquivos[-1] + ".css")), None))
    return out


def ler_medidas():
    texto = DAX_FILE.read_text(encoding="utf-8")
    partes = re.split(r"^-- @measure (.+?)\s*$", texto, flags=re.M)
    medidas = []
    for i in range(1, len(partes), 2):
        cab = [c.strip() for c in partes[i].split("|")]
        nome, pasta = cab[0], cab[1] if len(cab) > 1 else ""
        formato = cab[2] if len(cab) > 2 and cab[2] else None
        medidas.append((nome, pasta, partes[i + 1].strip(), formato))
    return medidas + medidas_paginas()


def medidas_tmdl() -> str:
    out = ["table _Medidas", ""]
    for nome, pasta, corpo, formato in ler_medidas():
        out.append(f"{T}measure {q(nome)} = ```")
        out.append("")
        out.append(bloco(corpo, 3))
        out.append(f"{T*3}```")
        if formato:
            out.append(f"{T*2}formatString: {formato}")
        if pasta:
            out.append(f"{T*2}displayFolder: {pasta}")
        out.append("")
    out += [
        f"{T}column Coluna", f"{T*2}dataType: string", f"{T*2}isHidden", f"{T*2}summarizeBy: none",
        f"{T*2}sourceColumn: Coluna", "",
        f"{T}partition _Medidas = m", f"{T*2}mode: import", f"{T*2}source =",
        bloco("let\n\tFonte = #table(type table [Coluna = text], {})\nin\n\tFonte", 4), "",
    ]
    return "\n".join(out) + "\n"


# ---------- expressões compartilhadas ----------
def expressoes_tmdl(existente: str) -> str:
    nossas = [p[0] for p in PARAMETROS] + list(EXPRESSOES)
    # remove versões anteriores das nossas expressões e preserva as demais
    blocos = re.split(r"(?=^expression )", existente, flags=re.M)
    mantidos = [b for b in blocos if b.strip() and not any(re.match(rf"expression {re.escape(n)}\s*=", b) for n in nossas)]
    out = "".join(b.rstrip("\n") + "\n\n" for b in mantidos)
    for nome, valor, tipo in PARAMETROS:
        out += (f'expression {nome} = {valor} meta [IsParameterQuery=true, Type="{tipo}", IsParameterQueryRequired=true]\n'
                f"{T}annotation PBI_ResultType = {tipo}\n\n")
    for nome, tipo in EXPRESSOES.items():
        out += f"expression {nome} =\n{bloco(ler_m('_' + nome), 2)}\n{T}annotation PBI_ResultType = {tipo}\n\n"
    return out


def relacoes_tmdl(existente: str) -> str:
    out = existente.rstrip("\n") + "\n\n" if existente.strip() else ""
    for de, para in RELACOES:
        if f"fromColumn: {de}\n" in existente:
            continue
        out += f"relationship {uuid.uuid4()}\n{T}fromColumn: {de}\n{T}toColumn: {para}\n\n"
    return out


def gravar(caminho: Path, texto: str):
    caminho.parent.mkdir(parents=True, exist_ok=True)
    caminho.write_text(texto, encoding="utf-8", newline="\n")
    print("gravado:", caminho.relative_to(RAIZ))


def main():
    modelos = list(RAIZ.glob("*.SemanticModel/definition"))
    if not modelos:
        sys.exit("Nenhum *.SemanticModel/definition encontrado. Salve o relatório como .pbip com o formato TMDL ativado.")
    defn = modelos[0]

    backup = STAGING / "backup" / datetime.now().strftime("%Y%m%d-%H%M%S")
    shutil.copytree(defn, backup / "definition", dirs_exist_ok=True)
    print("backup:", backup.relative_to(RAIZ))

    tabelas = list(COLUNAS)
    for t in tabelas:
        gravar(defn / "tables" / f"{t}.tmdl", tabela_tmdl(t))
    gravar(defn / "tables" / "_Medidas.tmdl", medidas_tmdl())

    exp = defn / "expressions.tmdl"
    gravar(exp, expressoes_tmdl(exp.read_text(encoding="utf-8") if exp.exists() else ""))

    rel = defn / "relationships.tmdl"
    gravar(rel, relacoes_tmdl(rel.read_text(encoding="utf-8") if rel.exists() else ""))

    # model.tmdl: referências das tabelas, ordem das consultas e sem tabelas automáticas de data
    model = defn / "model.tmdl"
    texto = model.read_text(encoding="utf-8")
    ordem = "[" + ",".join(f'"{n}"' for n in [p[0] for p in PARAMETROS] + list(EXPRESSOES) + tabelas + ["_Medidas"]) + "]"
    if "PBI_QueryOrder" in texto:
        texto = re.sub(r"annotation PBI_QueryOrder = .*", f"annotation PBI_QueryOrder = {ordem}", texto)
    elif re.search(r"^annotation ", texto, flags=re.M):
        # junto das demais anotações do modelo (depois da última), como o Desktop grava
        texto = re.sub(r"(\nannotation [^\n]*\n)(?!.*\nannotation )",
                       lambda mt: mt.group(1) + f"\nannotation PBI_QueryOrder = {ordem}\n", texto, count=1, flags=re.S)
    else:
        texto = texto.rstrip("\n") + f"\n\nannotation PBI_QueryOrder = {ordem}\n"
    for t in tabelas + ["_Medidas"]:
        if not re.search(rf"^ref table {re.escape(q(t))}\s*$", texto, flags=re.M):
            texto = texto.rstrip("\n") + f"\n\nref table {q(t)}"
    texto = texto.replace("annotation __PBI_TimeIntelligenceEnabled = 1", "annotation __PBI_TimeIntelligenceEnabled = 0")
    gravar(model, texto.rstrip("\n") + "\n")
    print("\nPronto. Abra o .pbip no Power BI Desktop e clique em Atualizar.")


if __name__ == "__main__":
    main()
