// Classificação do campeonato de pilotos ao fim de cada temporada (ou atual, se em andamento).
let
    Lista = List.Combine(List.Transform({AnoInicial..AnoFinal}, (ano) => Jolpica(Text.From(ano) & "/driverstandings", "StandingsTable", "StandingsLists")))
in
    Lista
