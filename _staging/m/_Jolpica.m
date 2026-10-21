// Busca TODAS as páginas de um endpoint da Jolpica F1 (sucessora da Ergast) e devolve a lista de itens.
// caminho: ex. "2024/results" | tabela/lista: onde ficam os itens dentro de MRData (ex. "RaceTable", "Races").
// Limite da API sem token: 4 req/s e 500 req/h. Por isso: pausa entre chamadas, 100 itens por página
// (máximo permitido) e novas tentativas com espera crescente em caso de HTTP 429 ou 5xx.
(caminho as text, tabela as text, lista as text) as list =>
let
    Pagina = (offset as number, tentativa as number) as record =>
        let
            Resposta = Function.InvokeAfter(
                () =>
                    let
                        Bruto = Web.Contents(
                            "https://api.jolpi.ca",
                            [
                                RelativePath = "ergast/f1/" & caminho & ".json",
                                Query = [limit = "100", offset = Text.From(offset)],
                                Headers = [#"User-Agent" = "F1-Analytics-PowerBI/1.0"],
                                ManualStatusHandling = {429, 500, 502, 503, 504},
                                IsRetry = tentativa > 0,
                                Timeout = #duration(0, 0, 2, 0)
                            ]
                        ),
                        CodigoHttp = Value.Metadata(Bruto)[#"Response.Status"]
                    in
                        [St = CodigoHttp, Corpo = if CodigoHttp = 200 then Binary.Buffer(Bruto) else null],
                #duration(0, 0, 0, if tentativa = 0 then 0.3 else 4 * tentativa)
            ),
            Saida =
                if Resposta[St] = 200 then Json.Document(Resposta[Corpo])[MRData]
                else if tentativa < 4 then @Pagina(offset, tentativa + 1)
                else error Error.Record("Jolpica", "HTTP " & Text.From(Resposta[St]) & " em " & caminho)
        in
            Saida,
    Primeira = Pagina(0, 0),
    Total = Number.From(Primeira[total]),
    Offsets = List.Numbers(100, List.Max({0, Number.RoundUp(Total / 100) - 1}), 100),
    Paginas = {Primeira} & List.Transform(Offsets, (o) => Pagina(o, 0)),
    Itens = List.Combine(List.Transform(Paginas, (p) => Record.Field(Record.Field(p, tabela), lista)))
in
    Itens
