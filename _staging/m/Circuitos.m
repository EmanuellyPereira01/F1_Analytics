// Circuitos: extraídos do calendário completo (todos os circuitos que já receberam um GP).
let
    Linhas = List.Transform(RawCorridas, (r) =>
        let
            C = r[Circuit],
            L = Record.FieldOrDefault(C, "Location", [])
        in
            [
                CircuitoId = C[circuitId],
                Circuito = C[circuitName],
                Cidade = Record.FieldOrDefault(L, "locality", ""),
                Pais = Record.FieldOrDefault(L, "country", ""),
                Latitude = Number.From(Record.FieldOrDefault(L, "lat", "0"), "en-US"),
                Longitude = Number.From(Record.FieldOrDefault(L, "long", "0"), "en-US"),
                UrlWiki = Record.FieldOrDefault(C, "url", "")
            ]),
    Tipo = type table [CircuitoId = text, Circuito = text, Cidade = text, Pais = text, Latitude = number, Longitude = number, UrlWiki = text],
    Tabela = Table.Distinct(Value.ReplaceType(Table.FromRecords(Linhas, Table.ColumnNames(#table(Tipo, {}))), Tipo), {"CircuitoId"}),
    Ordenado = Table.Sort(Tabela, {{"CircuitoId", Order.Ascending}}),
    ComChave = Table.AddIndexColumn(Ordenado, "CircuitoKey", 1, 1, Int64.Type)
in
    ComChave
