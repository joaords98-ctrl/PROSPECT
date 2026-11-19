// Salve este arquivo em: src/app/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

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
  fotografia: `Olá, tudo bem?

Meu nome é João, sou fotógrafo em Curitiba e gostaria de apresentar meu trabalho e oferecer meus serviços de fotografia para os eventos de encerramento deste ano.

Gostaria de saber se a escola já está organizando as comemorações e se há interesse em contar com cobertura fotográfica para essas ocasiões.

Fico à disposição para encaminhar meu portfólio e apresentar meu trabalho.

Agradeço pela atenção!`,
  sites: `Olá, pessoal da {nome}! Tudo bem?

Encontrei vocês no Google Maps e notei que ainda não há um site cadastrado no perfil. Trabalho com criação de sites profissionais para negócios locais atraírem mais clientes pelo Google.

Posso mostrar alguns modelos sem compromisso?`,
  geral: `Olá, equipe da {nome}! Tudo bem?

Sou fotógrafo, designer e produtor de conteúdo em Curitiba e região. Ajudo negócios locais a se destacarem com fotos profissionais, Reels e presença digital.

Posso enviar meu portfólio para vocês conhecerem?`,
};

const SUGESTOES_NICHO = [
  { label: "Escolas particulares", nicho: "escolas particulares", servico: "fotografia" },
  { label: "Salões de beleza", nicho: "salões de beleza", servico: "geral" },
  { label: "Clínicas de estética", nicho: "clínicas de estética", servico: "sites" },
];

const REGIOES_CURITIBA_RMC = [
  "Curitiba",
  "Centro, Curitiba",
  "Batel, Curitiba",
  "Água Verde, Curitiba",
  "Portão, Curitiba",
  "Bigorrilho, Curitiba",
  "Santa Felicidade, Curitiba",
  "Cabral, Curitiba",
  "Juvevê, Curitiba",
  "Bairro Alto, Curitiba",
  "Boqueirão, Curitiba",
  "Cajuru, Curitiba",
  "Pinheirinho, Curitiba",
  "Sítio Cercado, Curitiba",
  "CIC, Curitiba",
  "São José dos Pinhais",
  "Pinhais",
  "Colombo",
  "Araucária",
  "Fazenda Rio Grande",
  "Campo Largo",
  "Almirante Tamandaré",
];

export default function ProspeccaoPage() {
  const [nicho, setNicho] = useState("escolas particulares");
  const [regioesSelecionadas, setRegioesSelecionadas] = useState<string[]>([
    "Curitiba",
  ]);
  const [maxPaginas, setMaxPaginas] = useState<number>(3);
  const [servico, setServico] = useState("fotografia");
  const [apenasSemSite, setApenasSemSite] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [aviso, setAviso] = useState<string | null>(null);
  const [modoVisao, setModoVisao] = useState<"lista" | "cards">("lista");

  const [leads, setLeads] = useState<Lead[]>([]);
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [filtroSite, setFiltroSite] = useState<string>("todos");
  const [textoFiltro, setTextoFiltro] = useState("");
  const [mensagemCustom, setMensagemCustom] = useState(MENSAGENS_PADRAO.fotografia);

  async function carregarLeads() {
    setCarregando(true);
    try {
      const res = await fetch("/api/leads", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) {
        setAviso(`Erro ao carregar lista: ${json.error || "Falha no Supabase"}`);
      } else {
        setLeads(json.leads || []);
      }
    } catch {
      setAviso("Erro de conexão ao carregar leads.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarLeads();
  }, []);

  useEffect(() => {
    setMensagemCustom(MENSAGENS_PADRAO[servico] || MENSAGENS_PADRAO.geral);
  }, [servico]);

  function toggleRegiao(regiao: string) {
    setRegioesSelecionadas((prev) =>
      prev.includes(regiao) ? prev.filter((r) => r !== regiao) : [...prev, regiao]
    );
  }

  async function handleBuscar(e: React.FormEvent) {
    e.preventDefault();
    if (!nicho.trim()) return;
    const alvos = regioesSelecionadas.length > 0 ? regioesSelecionadas : ["Curitiba"];

    setBuscando(true);
    setAviso(null);
    let totalAcumulado = 0;

    try {
      for (let i = 0; i < alvos.length; i++) {
        const regiao = alvos[i];
        const query = `${nicho.trim()} em ${regiao}`;
        setAviso(`Buscando (${i + 1}/${alvos.length}): ${regiao}...`);

        const res = await fetch("/api/prospectar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query, servico, apenasSemSite, maxPaginas }),
        });
        const json = await res.json();
        if (!res.ok) {
          setAviso(`Erro em ${regiao}: ${json.error || "Falha na busca"}`);
          break;
        }
        totalAcumulado += Number(json.totalSalvos || 0);
      }

      setAviso(
        `Busca concluída em ${alvos.length} região(ões): ${totalAcumulado} leads processados/atualizados no Supabase.`
      );
      await carregarLeads();
    } catch {
      setAviso("Erro de conexão ao buscar leads.");
    } finally {
      setBuscando(false);
    }
  }

  async function atualizarStatus(id: string, novoStatus: Lead["status"]) {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status: novoStatus } : l)));
    await fetch("/api/leads", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: novoStatus }),
    });
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
        !(l.nicho_busca || "").toLowerCase().includes(textoFiltro.toLowerCase()) &&
        !(l.endereco || "").toLowerCase().includes(textoFiltro.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [leads, filtroStatus, filtroSite, textoFiltro]);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">Prospecção Curitiba & RMC</h1>
          <p className="text-sm text-slate-400">
            Busque por bairros de Curitiba e Região Metropolitana, filtre quem não tem site e abra o WhatsApp com 1 clique.
          </p>
        </header>

        {/* Formulário de Busca */}
        <section className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-slate-400 mr-1">Nichos rápidos:</span>
            {SUGESTOES_NICHO.map((s) => (
              <button
                key={s.label}
                type="button"
                onClick={() => {
                  setNicho(s.nicho);
                  setServico(s.servico);
                }}
                className="text-xs px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
              >
                {s.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleBuscar} className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <input
              type="text"
              value={nicho}
              onChange={(e) => setNicho(e.target.value)}
              placeholder="Ex: escolas particulares, salões de beleza"
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

            <select
              value={maxPaginas}
              onChange={(e) => setMaxPaginas(Number(e.target.value))}
              className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm"
            >
              <option value={1}>Até 20 por região</option>
              <option value={2}>Até 40 por região</option>
              <option value={3}>Até 60 por região</option>
            </select>

            <button
              type="submit"
              disabled={buscando}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium rounded-lg px-4 py-2 text-sm transition"
            >
              {buscando ? "Buscando..." : "Capturar Leads"}
            </button>
          </form>

          {/* Seletor de Bairros e Região Metropolitana */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-slate-400">
                Bairros de Curitiba e Região Metropolitana ({regioesSelecionadas.length} selecionado(s)):
              </span>
              <div className="flex gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setRegioesSelecionadas(REGIOES_CURITIBA_RMC)}
                  className="text-sky-400 hover:underline"
                >
                  Selecionar todos
                </button>
                <button
                  type="button"
                  onClick={() => setRegioesSelecionadas(["Curitiba"])}
                  className="text-slate-400 hover:underline"
                >
                  Só Curitiba
                </button>
                <button
                  type="button"
                  onClick={() => setRegioesSelecionadas([])}
                  className="text-slate-400 hover:underline"
                >
                  Limpar
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {REGIOES_CURITIBA_RMC.map((regiao) => {
                const ativo = regioesSelecionadas.includes(regiao);
                return (
                  <button
                    key={regiao}
                    type="button"
                    onClick={() => toggleRegiao(regiao)}
                    className={`text-xs px-2.5 py-1 rounded-md border transition ${
                      ativo
                        ? "bg-emerald-950 border-emerald-600 text-emerald-200"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {regiao}
                  </button>
                );
              })}
            </div>
          </div>

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
              Mensagem de abordagem (opcional usar {"{nome}"} para inserir o nome da empresa):
            </label>
            <textarea
              rows={5}
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
              placeholder="Filtrar por nome, bairro ou nicho..."
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

          <div className="flex items-center gap-3">
            <div className="inline-flex rounded-lg border border-slate-800 bg-slate-900 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setModoVisao("lista")}
                className={`px-2.5 py-1 rounded-md transition ${
                  modoVisao === "lista" ? "bg-slate-700 text-white" : "text-slate-400"
                }`}
              >
                Lista
              </button>
              <button
                type="button"
                onClick={() => setModoVisao("cards")}
                className={`px-2.5 py-1 rounded-md transition ${
                  modoVisao === "cards" ? "bg-slate-700 text-white" : "text-slate-400"
                }`}
              >
                Cards
              </button>
            </div>
            <span className="text-xs text-slate-400">
              {carregando ? "Carregando..." : `${leadsFiltrados.length} leads exibidos`}
            </span>
          </div>
        </section>

        {/* Visualização em Lista (Tabela) */}
        {modoVisao === "lista" ? (
          <section className="bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950/60 text-xs uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Empresa</th>
                  <th className="px-4 py-3">Telefone / WhatsApp</th>
                  <th className="px-4 py-3">Site</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {leadsFiltrados.map((lead) => {
                  const waLink = montarLinkWhatsApp(lead);
                  return (
                    <tr key={lead.id} className="hover:bg-slate-800/40">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-100">{lead.nome}</div>
                        <div className="text-xs text-slate-400">
                          {lead.categoria || "Empresa"} {lead.nota ? `• ★ ${lead.nota}` : ""}
                        </div>
                        {lead.endereco && (
                          <div className="text-xs text-slate-500 mt-0.5">{lead.endereco}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div>{lead.telefone || "Sem telefone"}</div>
                        {lead.eh_celular && (
                          <span className="text-xs text-emerald-400">Celular/WhatsApp</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {lead.tem_site && lead.site_url ? (
                          <a
                            href={lead.site_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-block text-xs px-2 py-0.5 rounded-full bg-sky-950 text-sky-300 border border-sky-800 hover:underline"
                          >
                            Ver Site
                          </a>
                        ) : (
                          <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800">
                            Sem Site
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={lead.status}
                          onChange={(e) =>
                            atualizarStatus(lead.id, e.target.value as Lead["status"])
                          }
                          className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs"
                        >
                          <option value="pendente">Pendente</option>
                          <option value="enviado">Enviado</option>
                          <option value="respondeu">Respondeu</option>
                          <option value="fechado">Fechado</option>
                          <option value="descartado">Descartado</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {waLink ? (
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noreferrer"
                            onClick={() => atualizarStatus(lead.id, "enviado")}
                            className="inline-block bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition"
                          >
                            Enviar WhatsApp
                          </a>
                        ) : (
                          <span className="text-xs text-slate-500">Sem WhatsApp</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        ) : (
          /* Visualização em Cards */
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
                      onChange={(e) =>
                        atualizarStatus(lead.id, e.target.value as Lead["status"])
                      }
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
        )}
      </div>
    </main>
  );
}
