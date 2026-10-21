// Corridas: calendário completo desde 1950 + voltas e tempo do vencedor (temporadas carregadas em detalhe).
let
    MapaCirc = Record.FromList(Circuitos[CircuitoKey], Circuitos[CircuitoId]),
    InfoVencedor = List.Combine(List.Transform(RawResultados, (c) =>
        List.Transform(List.Select(c[Results], (x) => Record.FieldOrDefault(x, "position", "") = "1"), (w) =>
            [
                K = Text.From(Number.From(c[season]) * 100 + Number.From(c[round])),
                V = Number.From(Record.FieldOrDefault(w, "laps", "0")),
                T = try Number.From(w[Time][millis]) otherwise 0
            ]))),
    TabInfo = Table.Distinct(Value.ReplaceType(Table.FromRecords(InfoVencedor, Table.ColumnNames(#table(type table [K = text, V = number, T = number], {}))), type table [K = text, V = number, T = number]), {"K"}),
    MapaInfo = Record.FromList(Table.ToRecords(TabInfo), TabInfo[K]),
    Linhas = List.Transform(RawCorridas, (r) =>
        let
            Ano = Number.From(r[season]),
            Rod = Number.From(r[round]),
            Chave = Ano * 100 + Rod,
            Extra = Record.FieldOrDefault(MapaInfo, Text.From(Chave), [V = 0, T = 0])
        in
            [
                CorridaKey = Chave,
                Temporada = Ano,
                Rodada = Rod,
                NomeCorrida = r[raceName],
                GP = Text.Trim(Text.Replace(r[raceName], "Grand Prix", "")),
                Data = r[date],
                DataCorrida = Date.FromText(r[date], [Format = "yyyy-MM-dd", Culture = "en-US"]),
                CircuitoId = r[Circuit][circuitId],
                CircuitoKey = Record.Field(MapaCirc, r[Circuit][circuitId]),
                Voltas = Extra[V],
                TempoVencedorMs = Extra[T],
                UrlWiki = Record.FieldOrDefault(r, "url", "")
            ]),
    Tipo = type table [
        CorridaKey = Int64.Type, Temporada = Int64.Type, Rodada = Int64.Type, NomeCorrida = text, GP = text, Data = text,
        DataCorrida = date, CircuitoId = text, CircuitoKey = Int64.Type, Voltas = Int64.Type, TempoVencedorMs = Int64.Type, UrlWiki = text
    ],
    Tabela = Table.Distinct(Value.ReplaceType(Table.FromRecords(Linhas, Table.ColumnNames(#table(Tipo, {}))), Tipo), {"CorridaKey"})
in
    Tabela
