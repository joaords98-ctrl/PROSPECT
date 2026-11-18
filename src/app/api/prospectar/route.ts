import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function normalizarTelefoneBR(telefone?: string) {
  if (!telefone) return { digitos: "", ehCelular: false };
  const apenasDigitos = telefone.replace(/\D/g, "");
  const semDDI =
    apenasDigitos.startsWith("55") && (apenasDigitos.length === 12 || apenasDigitos.length === 13)
      ? apenasDigitos.slice(2)
      : apenasDigitos;

  const ehCelular = semDDI.length === 11 && semDDI[2] === "9";
  const whatsappNumero =
    semDDI.length === 10 || semDDI.length === 11 ? `55${semDDI}` : apenasDigitos;

  return { digitos: whatsappNumero, ehCelular };
}

export async function POST(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: "Variáveis do Supabase não configuradas na Vercel." },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { query, servico = "geral", apenasSemSite = false, maxPaginas = 1 } = await req.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Informe o termo de busca." }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Variável GOOGLE_PLACES_API_KEY não configurada na Vercel." },
        { status: 500 }
      );
    }

    const fieldMask = [
      "places.id",
      "places.displayName",
      "places.formattedAddress",
      "places.nationalPhoneNumber",
      "places.internationalPhoneNumber",
      "places.websiteUri",
      "places.googleMapsUri",
      "places.rating",
      "places.userRatingCount",
      "places.primaryTypeDisplayName",
      "nextPageToken",
    ].join(",");

    const todosLugares: Record<string, any>[] = [];
    let pageToken: string | undefined = undefined;
    const limitePaginas = Math.min(Math.max(Number(maxPaginas) || 1, 1), 3);

    for (let pagina = 0; pagina < limitePaginas; pagina++) {
      const body: Record<string, any> = {
        textQuery: query,
        languageCode: "pt-BR",
        regionCode: "BR",
        pageSize: 20,
      };
      if (pageToken) body.pageToken = pageToken;

      const resp = await fetch("https://places.googleapis.com/v1/places:searchText", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": fieldMask,
        },
        body: JSON.stringify(body),
      });

      const data = await resp.json();
      if (!resp.ok) {
        return NextResponse.json(
          { error: data?.error?.message || "Erro na Google Places API." },
          { status: resp.status }
        );
      }

      if (Array.isArray(data.places)) {
        todosLugares.push(...data.places);
      }

      pageToken = data.nextPageToken;
      if (!pageToken) break;
    }

    const registros = todosLugares
      .filter((p) => (apenasSemSite ? !p.websiteUri : true))
      .map((p) => {
        const telefone = p.nationalPhoneNumber || p.internationalPhoneNumber || "";
        const { digitos, ehCelular } = normalizarTelefoneBR(
          p.internationalPhoneNumber || p.nationalPhoneNumber
        );

        return {
          place_id: p.id,
          nome: p.displayName?.text || "Sem nome",
          categoria: p.primaryTypeDisplayName?.text || "",
          telefone,
          whatsapp_numero: digitos,
          eh_celular: ehCelular,
          tem_site: Boolean(p.websiteUri),
          site_url: p.websiteUri || null,
          endereco: p.formattedAddress || "",
          nota: p.rating || null,
          total_avaliacoes: p.userRatingCount || null,
          maps_url: p.googleMapsUri || null,
          nicho_busca: query,
          servico_alvo: servico,
          atualizado_em: new Date().toISOString(),
        };
      });

    if (registros.length > 0) {
      const { error } = await supabase
        .from("leads")
        .upsert(registros, { onConflict: "place_id", ignoreDuplicates: false });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({
      totalEncontrados: todosLugares.length,
      totalSalvos: registros.length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Erro interno." }, { status: 500 });
  }
}
