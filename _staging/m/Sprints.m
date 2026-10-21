// Corridas sprint (desde 2021): os pontos entram no campeonato junto com os da corrida principal.
let
    MapaP = Record.FromList(Pilotos[PilotoKey], Pilotos[PilotoId]),
    MapaE = Record.FromList(Equipes[EquipeKey], Equipes[EquipeId]),
    Linhas = List.Combine(List.Transform(RawSprints, (c) =>
        let
            Ano = Number.From(c[season]),
            Rod = Number.From(c[round])
        in
            List.Transform(Record.FieldOrDefault(c, "SprintResults", {}), (x) =>
                let
                    PT = Record.FieldOrDefault(x, "positionText", "")
                in
                    [
                        CorridaKey = Ano * 100 + Rod,
                        Temporada = Ano,
                        Rodada = Rod,
                        PilotoKey = Record.Field(MapaP, x[Driver][driverId]),
                        EquipeKey = Record.Field(MapaE, x[Constructor][constructorId]),
                        Grid = Number.From(Record.FieldOrDefault(x, "grid", "0")),
                        Posicao = Number.From(Record.FieldOrDefault(x, "position", "0")),
                        Pontos = Number.From(Record.FieldOrDefault(x, "points", "0"), "en-US"),
                        StatusCodigo = if List.Contains({"R", "N"}, PT) then 2 else if List.Contains({"D", "E"}, PT) then 3 else if List.Contains({"W", "F"}, PT) then 4 else 0
                    ])
    )),
    Tipo = type table [
        CorridaKey = Int64.Type, Temporada = Int64.Type, Rodada = Int64.Type, PilotoKey = Int64.Type, EquipeKey = Int64.Type,
        Grid = Int64.Type, Posicao = Int64.Type, Pontos = number, StatusCodigo = Int64.Type
    ],
    Tabela = Value.ReplaceType(Table.FromRecords(Linhas, Table.ColumnNames(#table(Tipo, {}))), Tipo)
in
    Tabela
