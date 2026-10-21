// Resultados de corrida, temporada a temporada, entre AnoInicial e AnoFinal. ~5 requisições por temporada.
let
    Lista = List.Combine(List.Transform({AnoInicial..AnoFinal}, (ano) => Jolpica(Text.From(ano) & "/results", "RaceTable", "Races")))
in
    Lista
