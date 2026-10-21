// Equipes (construtores) + cor de identificação (cores aproximadas; as que faltarem são geradas no JavaScript).
let
    De = List.Combine({
        List.Combine(List.Transform(RawResultados, (c) => List.Transform(c[Results], (x) => x[Constructor]))),
        List.Combine(List.Transform(RawSprints, (c) => List.Transform(c[SprintResults], (x) => x[Constructor]))),
        List.Combine(List.Transform(RawVitorias, (c) => List.Transform(c[Results], (x) => x[Constructor]))),
        List.Combine(List.Transform(RawClassifPilotos, (s) => List.Combine(List.Transform(s[DriverStandings], (x) => Record.FieldOrDefault(x, "Constructors", {}))))),
        List.Combine(List.Transform(RawClassifEquipes, (s) => List.Transform(s[ConstructorStandings], (x) => x[Constructor])))
    }),
    Paleta = {
        {"mercedes", "#27F4D2"}, {"red_bull", "#3671C6"}, {"ferrari", "#E8002D"}, {"mclaren", "#FF8000"}, {"aston_martin", "#229971"},
        {"alpine", "#0093CC"}, {"williams", "#64C4FF"}, {"rb", "#6692FF"}, {"sauber", "#52E252"}, {"haas", "#B6BABD"},
        {"audi", "#BB0A30"}, {"cadillac", "#C6A15B"}, {"alphatauri", "#5E8FAA"}, {"toro_rosso", "#469BFF"}, {"racing_point", "#F596C8"},
        {"force_india", "#FF5F0F"}, {"renault", "#FFF500"}, {"lotus_f1", "#FFB800"}, {"alfa", "#C92D4B"}, {"manor", "#ED1C24"},
        {"marussia", "#6E0000"}, {"caterham", "#048646"}, {"brawn", "#B8FD6E"}, {"toyota", "#E30613"}, {"honda", "#EDEDED"},
        {"bmw_sauber", "#6CD3BF"}, {"super_aguri", "#B32222"}, {"spyker", "#FF6600"}, {"jordan", "#FFD800"}, {"minardi", "#7A7A7A"},
        {"jaguar", "#0B6E3B"}, {"bar", "#C9C9C9"}, {"benetton", "#00A7E1"}, {"ligier", "#0055A4"}, {"tyrrell", "#2F5FD0"},
        {"team_lotus", "#FFB800"}, {"lotus", "#FFB800"}, {"brabham", "#3456B8"}, {"cooper", "#2E7D32"}, {"brm", "#7E8B4E"},
        {"vanwall", "#1B7F3A"}, {"maserati", "#A01A1A"}, {"matra", "#1565C0"}, {"march", "#E65100"}, {"prost", "#2A4FBF"},
        {"stewart", "#FFFFFF"}, {"arrows", "#FF8F00"}
    },
    Cores = Record.FromList(List.Transform(Paleta, each _{1}), List.Transform(Paleta, each _{0})),
    Linhas = List.Transform(De, (e) =>
        [
            EquipeId = e[constructorId],
            Equipe = e[name],
            Nacionalidade = Record.FieldOrDefault(e, "nationality", ""),
            Cor = Record.FieldOrDefault(Cores, e[constructorId], ""),
            UrlWiki = Record.FieldOrDefault(e, "url", "")
        ]),
    Tipo = type table [EquipeId = text, Equipe = text, Nacionalidade = text, Cor = text, UrlWiki = text],
    Tabela = Table.Distinct(Value.ReplaceType(Table.FromRecords(Linhas, Table.ColumnNames(#table(Tipo, {}))), Tipo), {"EquipeId"}),
    Ordenado = Table.Sort(Tabela, {{"EquipeId", Order.Ascending}}),
    ComChave = Table.AddIndexColumn(Ordenado, "EquipeKey", 1, 1, Int64.Type)
in
    ComChave
