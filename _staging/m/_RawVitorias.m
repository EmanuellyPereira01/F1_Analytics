// Só o vencedor de cada GP da história (filtro de posição 1). ~12 requisições.
let
    Lista = Jolpica("results/1", "RaceTable", "Races")
in
    Lista
