# Segurança — aQ-Invest

## Credenciais Expostas no Histórico Git

O repositório contém histórico de commits com credenciais hardcoded nos arquivos `.env` e `.env.local`. As seguintes credenciais **DEVEM ser rotacionadas imediatamente**:

### Credenciais para Rotacionar

| Credencial | Arquivo | Ação |
|---|---|---|
| DATABASE_URL (senha PostgreSQL/Supabase) | `.env`, `.env.local` | Alterar senha no painel Supabase |
| NEXTAUTH_SECRET | `.env`, `.env.local` | Gerar novo: `openssl rand -base64 32` |
| GOOGLE_CLIENT_SECRET | `.env.local` | Regenerar no Google Cloud Console |
| GOOGLE_CLIENT_ID | `.env.local` | Verificar se exposto é problemático |
| MERCADOPAGO_ACCESS_TOKEN | `.env.local` | Regenerar no painel Mercado Pago |
| BRAPI_TOKEN | `gateway/.env` | Regenerar no painel brapi.dev |

### Passos para Rotação

1. **Supabase (DATABASE_URL)**:
   - Acesse o painel do projeto Supabase → Settings → Database
   - Altere a senha do banco de dados
   - Atualize `DATABASE_URL` e `DIRECT_URL` nos ambientes de deploy

2. **AUTH_SECRET**:
   - Gere um novo segredo: `openssl rand -base64 32`
   - Atualize em todos os ambientes (dev, staging, produção)
   - Nota: todos os JWTs existentes serão invalidados (usuários terão que fazer login novamente)

3. **Google OAuth**:
   - Google Cloud Console → APIs & Services → Credentials
   - Regenere o Client Secret do OAuth 2.0
   - Atualize nos ambientes de deploy

4. **Mercado Pago**:
   - Painel Mercado Pago → Aplicações → Credenciais
   - Regenere o Access Token
   - Atualize nos ambientes de deploy

5. **brapi.dev**:
   - Acesse brapi.dev → painel → API Token
   - Regenere o token
   - Atualize no `gateway/.env` dos ambientes de deploy

### Prevenção

- **`.gitignore`** agora bloqueia todos os arquivos `.env*` (exceto `.env.example`)
- **Validação Zod** em `src/lib/env.ts` garante que variáveis obrigatórias estejam definidas
- **AUTH_SECRET** não possui mais fallback — a aplicação falha ao iniciar sem ela
- Use **variáveis de ambiente do provedor** (Vercel, Railway, etc.) em vez de arquivos `.env` em produção

### Limpeza do Histórico (Opcional)

Para remover credenciais do histórico git completamente:

```bash
# ATENÇÃO: Isso reescreve o histórico — requer force push
# Use BFG Repo-Cleaner (mais seguro que git filter-branch)
bfg --replace-text passwords.txt .
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force
```

> **Nota**: Force push em repositório compartilhado requer coordenação com todos os colaboradores.
