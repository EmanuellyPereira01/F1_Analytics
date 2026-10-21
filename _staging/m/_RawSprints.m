// Resultados das corridas sprint (existem desde 2021). 1 a 2 requisições por temporada.
let
    Lista = List.Combine(List.Transform({AnoInicial..AnoFinal}, (ano) => Jolpica(Text.From(ano) & "/sprint", "RaceTable", "Races")))
in
    Lista
