"""Monta as páginas do relatório (PBIR): cada página = um visual HTML Content em tela cheia + navegador nativo.

Uso:  python _staging/build_report.py
Feche o Power BI Desktop antes. Páginas e visuais usam nomes fixos com o prefixo PREFIXO;
rodar de novo apaga e recria só esses. A página em branco criada pelo Desktop é removida.
"""
import json
import shutil
import sys
from datetime import datetime
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
STAGING = RAIZ / "_staging"
HTML_VISUAL = "htmlContent443BE3AD55E043BF878BED274D3A6855"  # HTML Content (AppSource, edição padrão)
SCHEMA_VISUAL = "https://developer.microsoft.com/json-schemas/fabric/item/report/definition/visualContainer/2.4.0/schema.json"
SCHEMA_PAGINA = "https://developer.microsoft.com/json-schemas/fabric/item/report/definition/page/2.1.0/schema.json"
PREFIXO = "f1a1b2c3d4e5"
# (id da página, nome exibido, sufixo das medidas <HTML>/<CSS>) — mesma ordem do navegador
PAGINAS = [
    (PREFIXO + "aaaa0001", "Pilotos", "Pilotos"),
    (PREFIXO + "aaaa0002", "Duelo", "Duelo"),
    (PREFIXO + "aaaa0003", "Temporada", "Temporada"),
    (PREFIXO + "aaaa0004", "Circuitos", "Circuitos"),
    (PREFIXO + "aaaa0005", "Simulador", "Simulador"),
    (PREFIXO + "aaaa0006", "Quiz", "Quiz"),
]
LARGURA, ALTURA = 1280, 720
FUNDO = "#0A0C10"
DESTAQUE = "#E10600"


# ---------- helpers de expressão ----------
def lit(v):
    return {"expr": {"Literal": {"Value": v}}}


def cor(hexa):
    return {"solid": {"color": lit(f"'{hexa}'")}}


def medida(nome, tabela="_Medidas"):
    return {"Measure": {"Expression": {"SourceRef": {"Entity": tabela}}, "Property": nome}}


def container():
    return {
        "title": [{"properties": {"show": lit("false")}}],
        "dropShadow": [{"properties": {"show": lit("false")}}],
        "visualHeader": [{"properties": {"show": lit("false")}}],
        "padding": [{"properties": {k: lit("0D") for k in ("top", "bottom", "left", "right")}}],
        "background": [{"properties": {"show": lit("false")}}],
        "border": [{"properties": {"show": lit("false")}}],
    }


def pos(x, y, w, h, z):
    return {"x": x, "y": y, "z": z, "width": w, "height": h, "tabOrder": z}


def html_visual(html, css):
    objects = {
        "stylesheet": [{"properties": {"stylesheet": {"expr": medida(css)}}}],
        "contentFormatting": [{"properties": {"showRawHtml": lit("false")}}],
        "crossFilter": [{"properties": {"enabled": lit("false"), "useTransparency": lit("false")}}],
        # o próprio visual grava isto ao abrir (modo de renderização usado pelo CSS)
        "compatibility": [{"properties": {"legacyRendering": lit("true")}}],
    }
    query = {"queryState": {"content": {"projections": [{
        "field": medida(html), "queryRef": f"_Medidas.{html}", "nativeQueryRef": html}]}}}
    return {"visualType": HTML_VISUAL, "query": query, "objects": objects,
            "visualContainerObjects": container(), "drillFilterOtherVisuals": True}


def navegador():
    """Navegador de páginas nativo (pageNavigator) em pílulas, no canto superior esquerdo."""
    def est(padrao, hover, sel):
        return [{"properties": padrao, "selector": {"id": "default"}},
                {"properties": hover, "selector": {"id": "hover"}},
                {"properties": sel, "selector": {"id": "selected"}}]
    objects = {
        "layout": [{"properties": {"cellPadding": lit("4L")}}],
        "shape": [{"properties": {"tileShape": lit("'pill'")}}],
        "fill": est({"show": lit("true"), "fillColor": cor("#181D28"), "transparency": lit("0D")},
                    {"fillColor": cor("#262D3C")}, {"fillColor": cor(DESTAQUE)}),
        "text": est({"show": lit("true"), "fontColor": cor("#C9CFDA"), "fontSize": lit("9D"), "bold": lit("true"),
                     "leftMargin": lit("2L"), "rightMargin": lit("2L")},
                    {"fontColor": cor("#FFFFFF")}, {"fontColor": cor("#FFFFFF")}),
        "outline": est({"show": lit("true"), "lineColor": cor("#2A3141"), "weight": lit("1D")},
                       {"lineColor": cor("#FFFFFF")}, {"lineColor": cor(DESTAQUE)}),
    }
    return {"visualType": "pageNavigator", "objects": objects,
            "visualContainerObjects": container(), "drillFilterOtherVisuals": True}


def ler(caminho: Path):
    return json.loads(caminho.read_text(encoding="utf-8"))


def escrever(caminho: Path, dados):
    caminho.parent.mkdir(parents=True, exist_ok=True)
    caminho.write_text(json.dumps(dados, ensure_ascii=False, indent=2), encoding="utf-8", newline="\n")


def main():
    relatorios = list(RAIZ.glob("*.Report/definition"))
    if not relatorios:
        sys.exit("Nenhum *.Report/definition encontrado. Salve o relatório como .pbip com o formato PBIR ativado.")
    defn = relatorios[0]
    backup = STAGING / "backup" / ("report-" + datetime.now().strftime("%Y%m%d-%H%M%S"))
    shutil.copytree(defn, backup, dirs_exist_ok=True)
    print("backup:", backup.relative_to(RAIZ))

    # visual personalizado HTML Content (AppSource) registrado no relatório
    rj = ler(defn / "report.json")
    pcv = rj.setdefault("publicCustomVisuals", [])
    if HTML_VISUAL not in pcv:
        pcv.append(HTML_VISUAL)
    escrever(defn / "report.json", rj)

    pdir = defn / "pages"
    pj_path = pdir / "pages.json"
    pages = ler(pj_path) if pj_path.exists() else {"$schema": "https://developer.microsoft.com/json-schemas/fabric/item/report/definition/pagesMetadata/1.0.0/schema.json", "pageOrder": []}

    # remove páginas vazias que não são nossas (a página em branco do Desktop)
    outras = []
    for pid in pages.get("pageOrder", []):
        if pid.startswith(PREFIXO):
            continue
        vis = pdir / pid / "visuals"
        if not vis.exists() or not any(vis.iterdir()):
            if (pdir / pid).exists():
                shutil.rmtree(pdir / pid)
            print("removida página vazia:", pid)
        else:
            outras.append(pid)

    for pid, titulo, sufixo in PAGINAS:
        adir = pdir / pid
        if adir.exists():
            shutil.rmtree(adir)
        escrever(adir / "page.json", {
            "$schema": SCHEMA_PAGINA, "name": pid, "displayName": titulo,
            "displayOption": "FitToPage", "height": ALTURA, "width": LARGURA,
            "objects": {
                "background": [{"properties": {"color": cor(FUNDO), "transparency": lit("0D")}}],
                "outspace": [{"properties": {"color": cor(FUNDO), "transparency": lit("0D")}}],
            },
        })
        itens = [
            (pid[-4:] + "0101", pos(0, 0, LARGURA, ALTURA, 0), html_visual(f"<HTML> {sufixo}", f"<CSS> {sufixo}")),
            (pid[-4:] + "0199", pos(16, 12, 600, 34, 1000), navegador()),
        ]
        for sufixo_v, posicao, visual in itens:
            nome = PREFIXO + sufixo_v
            escrever(adir / "visuals" / nome / "visual.json",
                     {"$schema": SCHEMA_VISUAL, "name": nome, "position": posicao, "visual": visual})
        print(f"página {titulo} gravada em", adir.relative_to(RAIZ))

    pages["pageOrder"] = [p[0] for p in PAGINAS] + outras
    pages["activePageName"] = PAGINAS[0][0]
    escrever(pj_path, pages)
    print("\nPronto. Abra o .pbip no Power BI Desktop.")


if __name__ == "__main__":
    main()
