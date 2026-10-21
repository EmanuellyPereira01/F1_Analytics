// Resultados de corrida (uma linha por piloto por GP) no período AnoInicial-AnoFinal.
// StatusCodigo: 0 terminou na volta do líder | 1 terminou com voltas de atraso | 2 abandonou | 3 desclassificado | 4 não largou
let
    MapaP = Record.FromList(Pilotos[PilotoKey], Pilotos[PilotoId]),
    MapaE = Record.FromList(Equipes[EquipeKey], Equipes[EquipeId]),
    Codigo = (pt as text, st as text) as number =>
        if List.Contains({"R", "N"}, pt) then 2
        else if List.Contains({"D", "E"}, pt) then 3
        else if List.Contains({"W", "F"}, pt) then 4
        else if st = "Finished" then 0
        else if Text.StartsWith(st, "+") or Text.Contains(st, "Lap") then 1
        else 2,
    Linhas = List.Combine(List.Transform(RawResultados, (c) =>
        let
            Ano = Number.From(c[season]),
            Rod = Number.From(c[round])
        in
            List.Transform(c[Results], (x) =>
                let
                    PT = Record.FieldOrDefault(x, "positionText", ""),
                    ST = Record.FieldOrDefault(x, "status", ""),
                    VR = Record.FieldOrDefault(x, "FastestLap", null),
                    Cod = Codigo(PT, ST)
                in
                    [
                        CorridaKey = Ano * 100 + Rod,
                        Temporada = Ano,
                        Rodada = Rod,
                        PilotoKey = Record.Field(MapaP, x[Driver][driverId]),
                        EquipeKey = Record.Field(MapaE, x[Constructor][constructorId]),
                        PilotoId = x[Driver][driverId],
                        EquipeId = x[Constructor][constructorId],
                        NumeroCarro = Record.FieldOrDefault(x, "number", ""),
                        Grid = Number.From(Record.FieldOrDefault(x, "grid", "0")),
                        Posicao = Number.From(Record.FieldOrDefault(x, "position", "0")),
                        PosicaoTexto = PT,
                        Pontos = Number.From(Record.FieldOrDefault(x, "points", "0"), "en-US"),
                        Voltas = Number.From(Record.FieldOrDefault(x, "laps", "0")),
                        Status = ST,
                        StatusCodigo = Cod,
                        Classificado = Cod <= 1,
                        VoltaRapida = if VR is record and Record.FieldOrDefault(VR, "rank", "") = "1" then 1 else 0,
                        TempoMs = try Number.From(x[Time][millis]) otherwise null
                    ])
    )),
    Tipo = type table [
        CorridaKey = Int64.Type, Temporada = Int64.Type, Rodada = Int64.Type, PilotoKey = Int64.Type, EquipeKey = Int64.Type,
        PilotoId = text, EquipeId = text, NumeroCarro = text, Grid = Int64.Type, Posicao = Int64.Type, PosicaoTexto = text,
        Pontos = number, Voltas = Int64.Type, Status = text, StatusCodigo = Int64.Type, Classificado = logical,
        VoltaRapida = Int64.Type, TempoMs = Int64.Type
    ],
    Tabela = Value.ReplaceType(Table.FromRecords(Linhas, Table.ColumnNames(#table(Tipo, {}))), Tipo)
in
    Tabela
