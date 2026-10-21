// Pilotos: todos os que aparecem nos resultados do período, nos vencedores de GP e nas classificações.
let
    DeResultados = List.Combine(List.Transform(RawResultados, (c) => List.Transform(c[Results], (x) => x[Driver]))),
    DeSprints = List.Combine(List.Transform(RawSprints, (c) => List.Transform(c[SprintResults], (x) => x[Driver]))),
    DeVitorias = List.Combine(List.Transform(RawVitorias, (c) => List.Transform(c[Results], (x) => x[Driver]))),
    DeClassif = List.Combine(List.Transform(RawClassifPilotos, (s) => List.Transform(s[DriverStandings], (x) => x[Driver]))),
    Todos = DeResultados & DeSprints & DeVitorias & DeClassif,
    Linhas = List.Transform(Todos, (d) =>
        [
            PilotoId = d[driverId],
            Codigo = Record.FieldOrDefault(d, "code", ""),
            Numero = Record.FieldOrDefault(d, "permanentNumber", ""),
            Nome = d[givenName],
            Sobrenome = d[familyName],
            NomeCompleto = d[givenName] & " " & d[familyName],
            Nascimento = Record.FieldOrDefault(d, "dateOfBirth", ""),
            Nacionalidade = Record.FieldOrDefault(d, "nationality", ""),
            UrlWiki = Record.FieldOrDefault(d, "url", "")
        ]),
    Tipo = type table [PilotoId = text, Codigo = text, Numero = text, Nome = text, Sobrenome = text, NomeCompleto = text, Nascimento = text, Nacionalidade = text, UrlWiki = text],
    Tabela = Table.Distinct(Value.ReplaceType(Table.FromRecords(Linhas, Table.ColumnNames(#table(Tipo, {}))), Tipo), {"PilotoId"}),
    Limpa = Table.ReplaceValue(Tabela, null, "", Replacer.ReplaceValue, {"Codigo", "Numero", "Nascimento", "Nacionalidade", "UrlWiki"}),
    Ordenado = Table.Sort(Limpa, {{"PilotoId", Order.Ascending}}),
    ComChave = Table.AddIndexColumn(Ordenado, "PilotoKey", 1, 1, Int64.Type)
in
    ComChave
