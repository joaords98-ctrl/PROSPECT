// Salve este arquivo em: src/app/api/leads/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function GET() {
  const supabase = getServerSupabase();
  if (!supabase) {
    return NextResponse.json(
      { error: "Variáveis do Supabase não configuradas." },
      { status: 500 }
    );
  }

  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .order("criado_em", { ascending: false })
    .limit(300);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ leads: data || [] });
}

export async function PATCH(req: NextRequest) {
  const supabase = getServerSupabase();
  if (!supabase) {
    return NextResponse.json(
      { error: "Variáveis do Supabase não configuradas." },
      { status: 500 }
    );
  }

  const { id, status } = await req.json();
  if (!id || !status) {
    return NextResponse.json({ error: "Informe id e status." }, { status: 400 });
  }

  const { error } = await supabase
    .from("leads")
    .update({ status, atualizado_em: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
