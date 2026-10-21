// Classificação final (ou atual) do campeonato de construtores de cada temporada do período.
let
    MapaE = Record.FromList(Equipes[EquipeKey], Equipes[EquipeId]),
    Linhas = List.Combine(List.Transform(RawClassifEquipes, (s) =>
        let
            Ano = Number.From(s[season]),
            Rod = Number.From(s[round])
        in
            List.Transform(s[ConstructorStandings], (x) =>
                let
                    Pos = Record.FieldOrDefault(x, "position", null)
                in
                    [
                        Temporada = Ano,
                        Rodada = Rod,
                        Posicao = if Pos = null then null else Number.From(Pos),
                        EquipeKey = Record.Field(MapaE, x[Constructor][constructorId]),
                        Pontos = Number.From(Record.FieldOrDefault(x, "points", "0"), "en-US"),
                        NumVitorias = Number.From(Record.FieldOrDefault(x, "wins", "0"))
                    ])
    )),
    Tipo = type table [Temporada = Int64.Type, Rodada = Int64.Type, Posicao = Int64.Type, EquipeKey = Int64.Type, Pontos = number, NumVitorias = Int64.Type],
    Tabela = Value.ReplaceType(Table.FromRecords(Linhas, Table.ColumnNames(#table(Tipo, {}))), Tipo)
in
    Tabela
