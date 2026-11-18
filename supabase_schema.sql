-- Execute este SQL no SQL Editor do seu projeto no Supabase

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  place_id text unique not null,
  nome text not null,
  categoria text,
  telefone text,
  whatsapp_numero text,
  eh_celular boolean default false,
  tem_site boolean default false,
  site_url text,
  endereco text,
  nota numeric,
  total_avaliacoes integer,
  maps_url text,
  nicho_busca text,
  servico_alvo text default 'geral',
  status text default 'pendente' check (status in ('pendente', 'enviado', 'respondeu', 'fechado', 'descartado')),
  notas text,
  criado_em timestamptz default now(),
  atualizado_em timestamptz default now()
);

create index if not exists idx_leads_status on public.leads(status);
create index if not exists idx_leads_tem_site on public.leads(tem_site);
create index if not exists idx_leads_servico on public.leads(servico_alvo);

-- Tabela opcional para editar seus textos de abordagem pelo banco
create table if not exists public.modelos_mensagem (
  slug text primary key,
  titulo text not null,
  template text not null
);

insert into public.modelos_mensagem (slug, titulo, template)
values
  (
    'fotografia',
    'Fotografia Escolar / Eventos',
    'Olá, equipe da {nome}! Tudo bem? Sou fotógrafo e produtor audiovisual aqui em Curitiba e trabalho com cobertura de eventos escolares, apresentações e formaturas. Posso enviar meu portfólio por aqui?'
  ),
  (
    'sites',
    'Criação de Sites (Sem Site)',
    'Olá, pessoal da {nome}! Tudo bem? Encontrei vocês no Google Maps aqui em Curitiba e notei que ainda não há um site cadastrado no perfil. Trabalho com criação de sites profissionais para negócios locais atraírem mais clientes. Posso mostrar alguns modelos sem compromisso?'
  ),
  (
    'geral',
    'Fotos, Reels e Presença Digital',
    'Olá, equipe da {nome}! Tudo bem? Sou fotógrafo, designer e produtor de conteúdo aqui em Curitiba. Ajudo negócios locais a se destacarem com fotos profissionais, Reels e design. Posso enviar meu portfólio?'
  )
on conflict (slug) do nothing;

-- Para uso pessoal rápido (sem login).
-- Se quiser restringir acesso, ative RLS e configure Supabase Auth.
alter table public.leads disable row level security;
alter table public.modelos_mensagem disable row level security;
