# Deploy para Produção — Helo Santana Nail Designer

Guia passo a passo para subir a plataforma na Vercel (free tier) com PostgreSQL grátis no Neon.

**Tempo estimado:** 20-30 minutos  
**Custo:** R$ 0 (tudo no free tier)

---

## Pré-requisitos

- Conta no [GitHub](https://github.com) (grátis)
- Conta na [Vercel](https://vercel.com) (grátis, pode logar com GitHub)
- Conta no [Neon](https://neon.tech) (grátis, 0.5GB Postgres)
- Código subido em um repositório Git

---

## Passo 1 — Subir o código para o GitHub

```bash
git init
git add .
git commit -m "feat: plataforma helo santana nail designer"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/helo-santana.git
git push -u origin main
```

> O `.gitignore` já exclui `node_modules`, `.next/`, `db/*.db`, `public/uploads/`, `.env*` e logs.

---

## Passo 2 — Criar banco PostgreSQL no Neon (grátis)

1. Acesse [neon.tech](https://neon.tech) e crie uma conta
2. **New Project** → nome: `helo-santana`
3. Região: **AWS São Paulo (sa-east-1)**
4. **Create project**
5. Copie a connection string:
   ```
   postgresql://helo:AbCdEf12345@ep-xxx.sa-east-1.aws.neon.tech/helo-santana?sslmode=require
   ```

---

## Passo 3 — Configurar o schema para PostgreSQL

```bash
# Substitui o schema SQLite pelo PostgreSQL
cp prisma/schema.postgres.prisma prisma/schema.prisma

# Cria as tabelas no Neon
DATABASE_URL="sua-connection-string-do-neon" bun run db:push

# Cria a conta da manicure + serviços + cores + grade
DATABASE_URL="sua-connection-string-do-neon" bun run scripts/seed-prod.ts
```

Faça commit da mudança:
```bash
git add prisma/schema.prisma
git commit -m "chore: schema postgresql para producao"
git push
```

> ⚠️ **Troque a senha da manicure após o primeiro login** (perfil → aba Senha)

---

## Passo 4 — Deploy na Vercel

1. Acesse [vercel.com/new](https://vercel.com/new)
2. **Import Project** → selecione o repositório
3. Framework preset: **Next.js** (auto-detectado)
4. **NÃO clique em Deploy ainda** — configure as variáveis primeiro

### Variáveis de ambiente

| Nome | Valor | Onde |
|------|-------|------|
| `DATABASE_URL` | Connection string do Neon | Production + Preview + Development |
| `SESSION_SECRET` | Gere com `openssl rand -hex 32` | Production + Preview |
| `CRON_SECRET` | Gere com `openssl rand -hex 32` | Production |
| `NEXT_PUBLIC_WS_URL` | (deixe vazio) | — |
| `BLOB_READ_WRITE_TOKEN` | (opcional, para imagens) | — |

5. Clique em **Deploy**
6. Aguarde 2-3 minutos
7. Acesse a URL gerada (`helo-santana.vercel.app`)

---

## Passo 5 — Persistência de imagens (Vercel Blob)

Por padrão, uploads de fotos (perfil e galeria) são salvos em `public/uploads/` que é efêmero na Vercel. Para persistir:

1. Na Vercel: **Storage → Create → Blob**
2. Copie o `BLOB_READ_WRITE_TOKEN`
3. Adicione como env var
4. Instale: `bun add @vercel/blob`
5. Edite `src/app/api/upload/route.ts`:

```ts
import { put } from '@vercel/blob'

export async function POST(req: NextRequest) {
  // ... auth check ...
  const formData = await req.formData()
  const file = formData.get('file') as File
  const blob = await put(`uploads/${crypto.randomUUID()}.${file.type.split('/')[1]}`, file, {
    access: 'public',
    token: process.env.BLOB_READ_WRITE_TOKEN,
  })
  return Response.json({ url: blob.url })
}
```

---

## Passo 6 — Lembrete automático (Vercel Cron)

Já configurado no `vercel.json`:
```json
"crons": [{ "path": "/api/cron/lembrete", "schedule": "0 12 * * *" }]
```

Diariamente às 9h BRT (12h UTC), cria notificações de lembrete para clientes com agendamento confirmado no dia seguinte.

> O `CRON_SECRET` protege o endpoint. A Vercel envia o header `Authorization: Bearer <CRON_SECRET>` automaticamente.

---

## Passo 7 — Notificações em tempo real (opcional)

Por padrão, as notificações funcionam via **polling** (a cada 30s). Para tempo real:

### Opção A: Pusher (recomendado, grátis)
1. Crie conta no [pusher.com](https://pusher.com)
2. Substitua `src/hooks/use-notificacoes-ws.ts` para usar Pusher
3. Env vars: `NEXT_PUBLIC_PUSHER_KEY`, `NEXT_PUBLIC_PUSHER_CLUSTER`, `PUSHER_SECRET`

### Opção B: Mini-serviço no Railway (~$5/mês)
1. Deploy de `mini-services/notify-service` no Railway
2. Env var: `NEXT_PUBLIC_WS_URL` = URL do Railway

---

## Passo 8 — Domínio custom (opcional)

1. Vercel: **Settings → Domains**
2. Adicione `helosantana.com`
3. Aponte DNS (CNAME) no seu registrador
4. SSL é automático (Let's Encrypt)

---

## Variáveis de ambiente — resumo

| Variável | Obrigatório | Descrição |
|----------|-------------|-----------|
| `DATABASE_URL` | ✅ | URL do Postgres (Neon) |
| `SESSION_SECRET` | ✅ | Secret HMAC para cookies (32+ chars) |
| `CRON_SECRET` | ✅ | Protege o endpoint do cron |
| `BLOB_READ_WRITE_TOKEN` | ❌ | Token do Vercel Blob (imagens) |
| `NEXT_PUBLIC_WS_URL` | ❌ | URL do WebSocket (tempo real) |

---

## Custos (free tier)

| Serviço | Free tier |
|---------|-----------|
| Vercel (Hobby) | 100GB bandwidth, 100h build |
| Neon | 0.5GB, 1 projeto |
| Vercel Blob | 1GB storage |
| **Total** | **R$ 0/mês** |

---

## Troubleshooting

### "Sessão expirada" ao gerar horários
- O `SESSION_SECRET` mudou? Os cookies antigos são auto-destruídos. Faça login novamente.
- Verifique se `SESSION_SECRET` está configurado na Vercel.

### Imagens não persistem
- Configure o Vercel Blob (Passo 5).

### Notificações não chegam
- Sem `NEXT_PUBLIC_WS_URL`, o app usa polling (30s). Aguarde ou configure Pusher.

### Build falha
- Verifique os logs no dashboard da Vercel
- Confirme que `bun run build` passa localmente
- O `vercel.json` já configura o build com bun

---

## Checklist pré-deploy

- [ ] Código no GitHub
- [ ] Banco Postgres criado no Neon
- [ ] Schema trocado para `postgresql` + `db:push` + `seed-prod.ts`
- [ ] Variáveis de ambiente configuradas na Vercel
- [ ] Deploy realizado
- [ ] Login como manicure + trocar senha
- [ ] Testar fluxo completo (agendar → aprovar → concluir)
- [ ] Configurar Vercel Blob (imagens)
- [ ] Configurar domínio custom (opcional)

---

**Boa sorte com o deploy! 💅**
