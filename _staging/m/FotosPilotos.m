// Foto (miniatura da Wikipédia) dos pilotos do período. Consulta isolada: se falhar, o resto do modelo carrega.
// Para não baixar fotos, mude o parâmetro IncluirFotos para false.
let
    Hex = "0123456789ABCDEF",
    HexVal = (ch as text) as number => Text.PositionOf(Hex, Text.Upper(ch)),
    // decodifica %C3%A9 -> é (os links da API vêm codificados)
    Decodificar = (s as text) as text =>
        let
            Partes = Text.Split(s, "%"),
            Bytes = List.Combine(
                {Binary.ToList(Text.ToBinary(Partes{0}, TextEncoding.Utf8))}
                & List.Transform(List.Skip(Partes, 1), (p) =>
                    if Text.Length(p) >= 2 and HexVal(Text.At(p, 0)) >= 0 and HexVal(Text.At(p, 1)) >= 0
                    then {16 * HexVal(Text.At(p, 0)) + HexVal(Text.At(p, 1))} & Binary.ToList(Text.ToBinary(Text.Middle(p, 2), TextEncoding.Utf8))
                    else {37} & Binary.ToList(Text.ToBinary(p, TextEncoding.Utf8)))
            )
        in
            Text.FromBinary(Binary.FromList(Bytes), TextEncoding.Utf8),
    Resumo = (titulo as text) as text =>
        let
            Resp = try Json.Document(Web.Contents("https://en.wikipedia.org", [
                RelativePath = "api/rest_v1/page/summary/" & titulo,
                Headers = [#"User-Agent" = "F1-Analytics-PowerBI/1.0 (projeto de portfolio)"],
                ManualStatusHandling = {400, 403, 404, 429}
            ])) otherwise null,
            Mini = if Resp is record then Record.FieldOrDefault(Resp, "thumbnail", null) else null
        in
            if Mini is record then Record.FieldOrDefault(Mini, "source", "") else "",
    Foto = (url as text) as text =>
        if not Text.Contains(url, "/wiki/") then ""
        else
            let
                Bruto = List.Last(Text.Split(url, "/wiki/")),
                Limpo = Decodificar(Bruto),
                Tentativa = Resumo(Limpo)
            in
                if Tentativa <> "" then Tentativa else if Limpo <> Bruto then Resumo(Bruto) else "",
    // lista própria de pilotos do período (consulta independente das demais)
    Lista = if IncluirFotos
        then List.Combine(List.Transform({AnoInicial..AnoFinal}, (ano) => Jolpica(Text.From(ano) & "/drivers", "DriverTable", "Drivers")))
        else {},
    Base = Table.Distinct(Value.ReplaceType(Table.FromRecords(List.Transform(Lista, (d) => [PilotoId = d[driverId], UrlWiki = Record.FieldOrDefault(d, "url", "")]), Table.ColumnNames(#table(type table [PilotoId = text, UrlWiki = text], {}))), type table [PilotoId = text, UrlWiki = text]), {"PilotoId"}),
    ComFoto = Table.AddColumn(Base, "Foto", (r) => try Foto(r[UrlWiki]) otherwise "", type text),
    Final = Table.SelectColumns(ComFoto, {"PilotoId", "Foto"})
in
    Final
