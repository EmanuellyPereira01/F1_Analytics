// Classificação do campeonato de construtores ao fim de cada temporada.
let
    Lista = List.Combine(List.Transform({AnoInicial..AnoFinal}, (ano) => Jolpica(Text.From(ano) & "/constructorstandings", "StandingsTable", "StandingsLists")))
in
    Lista
