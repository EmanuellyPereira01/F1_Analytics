// Classificação final (ou atual) do campeonato de pilotos de cada temporada do período.
// Rodada = rodada da classificação: se for menor que a última do calendário, a temporada está em andamento.
let
    MapaP = Record.FromList(Pilotos[PilotoKey], Pilotos[PilotoId]),
    MapaE = Record.FromList(Equipes[EquipeKey], Equipes[EquipeId]),
    Linhas = List.Combine(List.Transform(RawClassifPilotos, (s) =>
        let
            Ano = Number.From(s[season]),
            Rod = Number.From(s[round])
        in
            List.Transform(s[DriverStandings], (x) =>
                let
                    Eqs = Record.FieldOrDefault(x, "Constructors", {}),
                    Pos = Record.FieldOrDefault(x, "position", null)
                in
                    [
                        Temporada = Ano,
                        Rodada = Rod,
                        Posicao = if Pos = null then null else Number.From(Pos),
                        PilotoKey = Record.Field(MapaP, x[Driver][driverId]),
                        EquipeKey = if List.IsEmpty(Eqs) then null else Record.Field(MapaE, List.Last(Eqs)[constructorId]),
                        Pontos = Number.From(Record.FieldOrDefault(x, "points", "0"), "en-US"),
                        NumVitorias = Number.From(Record.FieldOrDefault(x, "wins", "0"))
                    ])
    )),
    Tipo = type table [Temporada = Int64.Type, Rodada = Int64.Type, Posicao = Int64.Type, PilotoKey = Int64.Type, EquipeKey = Int64.Type, Pontos = number, NumVitorias = Int64.Type],
    Tabela = Value.ReplaceType(Table.FromRecords(Linhas, Table.ColumnNames(#table(Tipo, {}))), Tipo)
in
    Tabela
