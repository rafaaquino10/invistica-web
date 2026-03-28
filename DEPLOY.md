# Deploy InvestIQ

## Arquitetura

```
investiq.com.br (Vercel) ──→ investiq-api.up.railway.app (Railway)
       ↓                              ↓
  Supabase Auth ←──────────────── Supabase DB
       ↓
  Upstash Redis (rate limiting + cache)
```

## 1. Criar repo GitHub (frontend)

```bash
# No GitHub: criar repo privado "investiq-web"
# Depois:
cd /c/workspace/investiq-web
git remote add origin https://github.com/rafaaquino10/investiq-web.git
git push -u origin master
```

## 2. Deploy Backend — Railway

O backend ja tem `railway.toml` configurado no repo `investiq`.

1. Acessar [railway.app](https://railway.app)
2. New Project → Deploy from GitHub → selecionar `rafaaquino10/investiq`
3. Branch: `feature/v2` (ou merge para master primeiro)
4. Railway detecta `railway.toml` automaticamente
5. Configurar env vars no dashboard:

```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...
BRAPI_TOKEN=xxx
ENV=production
UPSTASH_REDIS_URL=https://xxx.upstash.io
UPSTASH_REDIS_TOKEN=xxx
CORS_ORIGINS=https://investiq.com.br,https://www.investiq.com.br
```

6. Deploy → verificar healthcheck em `https://xxx.up.railway.app/health`

## 3. Deploy Frontend — Vercel

1. Acessar [vercel.com](https://vercel.com)
2. Import Project → selecionar `rafaaquino10/investiq-web`
3. Framework: Next.js (auto-detected)
4. Root Directory: `.` (default)
5. Configurar env vars:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_API_URL=https://investiq-api.up.railway.app
NEXT_PUBLIC_APP_URL=https://investiq.com.br
NODE_ENV=production
```

6. Deploy

## 4. DNS

No registrador do dominio `investiq.com.br`:

| Tipo  | Nome | Valor                          |
|-------|------|--------------------------------|
| CNAME | @    | cname.vercel-dns.com           |
| CNAME | www  | cname.vercel-dns.com           |

Depois, no Vercel: Settings → Domains → Add `investiq.com.br` e `www.investiq.com.br`.

## 5. Upstash Redis (rate limiting)

1. Acessar [upstash.com](https://upstash.com)
2. Criar database Redis (regiao: South America)
3. Copiar `1` e `UPSTASH_REDIS_REST_TOKEN`
4. Adicionar nas env vars do Railway (backend)

## 6. Supabase

O projeto Supabase ja deve existir com as migrations rodadas.
Verificar que a tabela `user_profiles` existe (usada pelo auth middleware).

SQL necessario (se ainda nao existe):
```sql
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  plan TEXT NOT NULL DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## 7. Verificacao pos-deploy

- [ ] `https://investiq.com.br` carrega a home
- [ ] `https://investiq-api.up.railway.app/health` retorna `{"status": "ok"}`
- [ ] Login com Supabase funciona
- [ ] Endpoints Free retornam dados (ex: `/tickers`)
- [ ] Endpoints Pro retornam 401 sem token
- [ ] Rate limiting retorna headers `X-RateLimit-*`
