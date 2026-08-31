# AyanaExpress — projeto pronto para publicar

Este é o site completo (loja em `/` e dashboard admin em `/admin`),
já ligado ao seu projeto Supabase. Ao contrário da versão em artifact
do Claude, este projeto corre num site normal — sem bloqueios de rede —
por isso a ligação à base de dados vai funcionar de verdade.

## Publicar em 5 minutos (Vercel — grátis)

1. Vá a **vercel.com** e crie uma conta grátis (pode usar GitHub, Google
   ou e-mail).
2. Clique em **"Add New… → Project"**.
3. Se lhe pedir um repositório GitHub e você não tiver um: a forma mais
   rápida é ir a **github.com → New repository**, e arrastar todos os
   ficheiros desta pasta para lá (botão "uploading an existing file").
   Depois volte à Vercel e importe esse repositório.
4. A Vercel deteta automaticamente que é um projeto Vite. Não precisa
   de mudar nenhuma definição — clique em **"Deploy"**.
5. Em 1–2 minutos, terá um link do tipo `https://ayanaexpress.vercel.app`
   já no ar, com a loja em `/` e o dashboard em `/admin`.

### Alternativa ainda mais simples (sem GitHub): Netlify Drop
1. Na sua própria máquina (não é possível fazer isto direto do telemóvel
   sem instalar Node.js), corra:
   ```
   npm install
   npm run build
   ```
   Isto cria uma pasta `dist/`.
2. Vá a **app.netlify.com/drop** e arraste a pasta `dist/` para lá.
3. Pronto — link ao vivo imediatamente.

## Variáveis de ambiente (opcional mas recomendado)
As chaves do Supabase já estão no código como valores por omissão, por
isso o site funciona mesmo sem configurar nada. Mas se preferir a forma
mais limpa (por exemplo, para não expor as chaves no código-fonte no
GitHub), configure na Vercel/Netlify:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

(valores de exemplo em `.env.example`)

## Correr localmente (se tiver Node.js instalado)
```
npm install
npm run dev
```
Abre em `http://localhost:5173` (loja) e `http://localhost:5173/admin`.

## Estrutura
```
src/
  Storefront.jsx   → a loja (página inicial, boutique, carrinho, checkout…)
  Admin.jsx        → o dashboard administrador
  main.jsx         → liga as duas com rotas ("/" e "/admin")
```

## Próximos passos de segurança antes de anunciar a loja
Ver as notas no fim de `Storefront.jsx`, `Admin.jsx` e no `schema.sql`
do projeto Supabase — em especial, restringir a escrita no dashboard
admin a um utilizador autenticado antes de partilhar o link publicamente.
