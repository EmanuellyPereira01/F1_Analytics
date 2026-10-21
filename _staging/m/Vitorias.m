// Vencedor de cada GP desde 1950 (base das estatísticas históricas: vitórias na carreira, circuitos).
let
    MapaP = Record.FromList(Pilotos[PilotoKey], Pilotos[PilotoId]),
    MapaE = Record.FromList(Equipes[EquipeKey], Equipes[EquipeId]),
    Linhas = List.Combine(List.Transform(RawVitorias, (c) =>
        let
            Ano = Number.From(c[season]),
            Rod = Number.From(c[round])
        in
            List.Transform(c[Results], (x) =>
                [
                    CorridaKey = Ano * 100 + Rod,
                    Temporada = Ano,
                    Rodada = Rod,
                    PilotoKey = Record.Field(MapaP, x[Driver][driverId]),
                    EquipeKey = Record.Field(MapaE, x[Constructor][constructorId]),
                    Grid = Number.From(Record.FieldOrDefault(x, "grid", "0"))
                ])
    )),
    Tipo = type table [CorridaKey = Int64.Type, Temporada = Int64.Type, Rodada = Int64.Type, PilotoKey = Int64.Type, EquipeKey = Int64.Type, Grid = Int64.Type],
    Tabela = Value.ReplaceType(Table.FromRecords(Linhas, Table.ColumnNames(#table(Tipo, {}))), Tipo)
in
    Tabela
