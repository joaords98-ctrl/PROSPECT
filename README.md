# Como colocar seu Sistema de Prospecção no ar (GitHub + Vercel + Supabase)

## 1. Configurar o Supabase

1. Acesse seu projeto no [Supabase](https://supabase.com/).

2. Vá em **SQL Editor**, cole o conteúdo de `supabase_schema.sql` e clique em **Run**.

3. Em **Project Settings > API**, copie:

   * `Project URL` (`NEXT_PUBLIC_SUPABASE_URL`)

   * `anon public` key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)

   * `service_role` key (`SUPABASE_SERVICE_ROLE_KEY`)

## 2. Gerar a chave da Google Places API (New)

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/).

2. Ative a API **Places API (New)** (`places.googleapis.com`).

3. Em **Credenciais**, crie uma **API Key** (se quiser, restrinja a chave apenas para a **Places API (New)**).

## 3. Criar o projeto Next.js e subir no GitHub

No terminal do seu computador:

```
npx create-next-app@latest prospeccao-curitiba --typescript --tailwind --eslint --app --src-dir
cd prospeccao-curitiba
npm install @supabase/supabase-js

```

Depois, copie os arquivos gerados para dentro do projeto:

* `app_api_prospectar_route.ts` -> `src/app/api/prospectar/route.ts`

* `app_page.tsx` -> `src/app/page.tsx`

Suba para um repositório no seu **GitHub** (recomendado deixar o repositório como **Privado**).

## 4. Publicar na Vercel

1. Acesse a [Vercel](https://vercel.com/), clique em **Add New > Project** e importe o repositório do GitHub.

2. Em **Environment Variables**, adicione as 4 variáveis:

   * `NEXT_PUBLIC_SUPABASE_URL`

   * `NEXT_PUBLIC_SUPABASE_ANON_KEY`

   * `SUPABASE_SERVICE_ROLE_KEY`

   * `GOOGLE_PLACES_API_KEY`

3. Clique em **Deploy**.

Pronto! Você terá uma URL própria (ex.: `https://prospeccao-curitiba.vercel.app`) para abrir no celular ou em qualquer computador.