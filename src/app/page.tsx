// Salve este arquivo em: src/app/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

type Lead = {
  id: string;
  place_id: string;
  nome: string;
  categoria: string | null;
  telefone: string | null;
  whatsapp_numero: string | null;
  eh_celular: boolean;
  tem_site: boolean;
  site_url: string | null;
  endereco: string | null;
  nota: number | null;
  total_avaliacoes: number | null;
  maps_url: string | null;
  nicho_busca: string | null;
  servico_alvo: string;
  status: "pendente" | "enviado" | "respondeu" | "fechado" | "descartado";
};

const MENSAGENS_PADRAO: Record<string, string> = {
  fotografia:
    "Olá, equipe da {nome}! Tudo bem? Sou fotógrafo e produtor audiovisual aqui em Curitiba e trabalho com cobertura de eventos escolares, apresentações e formaturas. Posso enviar meu portfólio por aqui?",
  sites:
    "Olá, pessoal da {nome}! Tudo bem? Encontrei vocês no Google Maps aqui em Curitiba e notei que ainda não há um site cadastrado no perfil. Trabalho com criação de sites profissionais para negócios locais atraírem mais clientes. Posso mostrar alguns modelos sem compromisso?",
  geral:
    "Olá, equipe da {nome}! Tudo bem? Sou fotógrafo, designer e produtor de conteúdo aqui em Curitiba. Ajudo negócios locais a se destacarem com fotos profissionais, Reels e design. Posso enviar meu portfólio?",
};

const SUGESTOES_CURITIBA = [
  { label: "Salões de beleza (Curitiba)", query: "salões de beleza em Curitiba", servico: "geral" },
  { label: "Escolas particulares (Curitiba)", query: "escolas particulares em Curitiba", servico: "fotografia" },
  { label: "Clínicas de estética (Curitiba)", query: "clínicas de estética em Curitiba", servico: "sites" },
];

export default function ProspeccaoPage() {
  const [query, setQuery] = useState("salões de beleza em Curitiba");
  const [servico, setServico] = useState("geral");
  const [apenasSemSite, setApenasSemSite] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  const [leads, setLeads] = useState<Lead[]>([]);
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [filtroSite, setFiltroSite] = useState<string>("todos");
  const [textoFiltro, setTextoFiltro] = useState("");
  const [mensagemCustom, setMensagemCustom] = useState(MENSAGENS_PADRAO.geral);

  async function carregarLeads() {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("criado_em", { ascending: false })
      .limit(200);

    if (!error && data) {
      setLeads(data as Lead[]);
    }
  }

  useEffect(() => {
    carregarLeads();
  }, []);

  useEffect(() => {
    setMensagemCustom(MENSAGENS_PADRAO[servico] || MENSAGENS_PADRAO.geral);
  }, [servico]);

  async function handleBuscar(e: React.FormEvent) {
    e.preventDefault();
    setBuscando(true);
    setAviso(null);

    try {
      const res = await fetch("/api/prospectar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, servico, apenasSemSite, maxPaginas: 1 }),
      });
      const json = await res.json();
      if (!res.ok) {
        setAviso(`Erro: ${json.error || "Falha na busca"}`);
      } else {
        setAviso(`Busca concluída: ${json.totalSalvos} leads salvos/atualizados no Supabase.`);
        await carregarLeads();
      }
    } catch {
      setAviso("Erro de conexão ao buscar leads.");
    } finally {
      setBuscando(false);
    }
  }

  async function atualizarStatus(id: string, novoStatus: Lead["status"]) {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status: novoStatus } : l)));
    const supabase = getSupabaseClient();
    if (!supabase) return;
    await supabase
      .from("leads")
      .update({ status: novoStatus, atualizado_em: new Date().toISOString() })
      .eq("id", id);
  }

  function montarLinkWhatsApp(lead: Lead) {
    if (!lead.whatsapp_numero) return null;
    const texto = mensagemCustom.replaceAll("{nome}", lead.nome);
    return `https://wa.me/${lead.whatsapp_numero}?text=${encodeURIComponent(texto)}`;
  }

  const leadsFiltrados = useMemo(() => {
    return leads.filter((l) => {
      if (filtroStatus !== "todos" && l.status !== filtroStatus) return false;
      if (filtroSite === "sem_site" && l.tem_site) return false;
      if (filtroSite === "com_site" && !l.tem_site) return false;
      if (
        textoFiltro &&
        !l.nome.toLowerCase().includes(textoFiltro.toLowerCase()) &&
        !(l.nicho_busca || "").toLowerCase().includes(textoFiltro.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [leads, filtroStatus, filtroSite, textoFiltro]);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">Prospecção Curitiba</h1>
          <p className="text-sm text-slate-400">
            Capture empresas do Google Maps, filtre quem não tem site e envie mensagens no WhatsApp de qualquer dispositivo.
          </p>
        </header>

        {/* Formulário de Busca */}
        <section className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            {SUGESTOES_CURITIBA.map((s) => (
              <button
                key={s.label}
                type="button"
                onClick={() => {
                  setQuery(s.query);
                  setServico(s.servico);
                }}
                className="text-xs px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
              >
                {s.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleBuscar} className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ex: escolas particulares em Curitiba"
              className="md:col-span-2 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm"
              required
            />

            <select
              value={servico}
              onChange={(e) => setServico(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm"
            >
              <option value="fotografia">Fotografia de Eventos</option>
              <option value="sites">Criação de Sites</option>
              <option value="geral">Fotos / Reels / Geral</option>
            </select>

            <button
              type="submit"
              disabled={buscando}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium rounded-lg px-4 py-2 text-sm transition"
            >
              {buscando ? "Buscando..." : "Capturar Leads"}
            </button>
          </form>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <label className="inline-flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={apenasSemSite}
                onChange={(e) => setApenasSemSite(e.target.checked)}
                className="rounded"
              />
              Salvar apenas empresas SEM site
            </label>
            {aviso && <span className="text-sm text-emerald-400">{aviso}</span>}
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">
              Modelo de mensagem (use {"{nome}"} para o nome da empresa):
            </label>
            <textarea
              rows={2}
              value={mensagemCustom}
              onChange={(e) => setMensagemCustom(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </section>

        {/* Filtros da Lista */}
        <section className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              value={textoFiltro}
              onChange={(e) => setTextoFiltro(e.target.value)}
              placeholder="Filtrar por nome ou nicho..."
              className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-sm"
            />
            <select
              value={filtroSite}
              onChange={(e) => setFiltroSite(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-sm"
            >
              <option value="todos">Site: Todos</option>
              <option value="sem_site">Apenas Sem Site</option>
              <option value="com_site">Apenas Com Site</option>
            </select>
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-sm"
            >
              <option value="todos">Status: Todos</option>
              <option value="pendente">Pendente</option>
              <option value="enviado">Enviado</option>
              <option value="respondeu">Respondeu</option>
              <option value="fechado">Fechado</option>
            </select>
          </div>
          <span className="text-xs text-slate-400">{leadsFiltrados.length} leads exibidos</span>
        </section>

        {/* Cards de Leads (ideal para celular e desktop) */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {leadsFiltrados.map((lead) => {
            const waLink = montarLinkWhatsApp(lead);
            return (
              <div
                key={lead.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between gap-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-semibold text-base leading-snug">{lead.nome}</h2>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                        lead.tem_site
                          ? "bg-sky-950 text-sky-300 border border-sky-800"
                          : "bg-amber-950 text-amber-300 border border-amber-800"
                      }`}
                    >
                      {lead.tem_site ? "Tem Site" : "Sem Site"}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400">
                    {lead.categoria || "Empresa"} • {lead.nota ? `★ ${lead.nota}` : "Sem nota"}
                  </p>
                  <p className="text-xs text-slate-400">{lead.endereco}</p>
                  <p className="text-sm text-slate-200">
                    {lead.telefone || "Sem telefone"}{" "}
                    {lead.eh_celular && (
                      <span className="text-xs text-emerald-400">(Celular/WhatsApp)</span>
                    )}
                  </p>
                  {lead.site_url && (
                    <a
                      href={lead.site_url}
                      target="_blank"
                      rel="noreferrer"
                      className="block text-xs text-sky-400 truncate hover:underline"
                    >
                      {lead.site_url}
                    </a>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
                  <select
                    value={lead.status}
                    onChange={(e) => atualizarStatus(lead.id, e.target.value as Lead["status"])}
                    className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs"
                  >
                    <option value="pendente">Pendente</option>
                    <option value="enviado">Enviado</option>
                    <option value="respondeu">Respondeu</option>
                    <option value="fechado">Fechado</option>
                    <option value="descartado">Descartado</option>
                  </select>

                  {waLink ? (
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => atualizarStatus(lead.id, "enviado")}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium px-3 py-2 rounded-lg transition"
                    >
                      Enviar WhatsApp
                    </a>
                  ) : (
                    <span className="text-xs text-slate-500">Sem WhatsApp</span>
                  )}
                </div>
              </div>
            );
          })}
        </section>
      </div>
    </main>
  );
}
