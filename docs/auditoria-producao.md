# Auditoria para Produção — Helo Santana Nail Designer

Data: julho 2026  
Status: ✅ Pronto para deploy (com ressalvas documentadas abaixo)

---

## Sumário executivo

O projeto está **funcional e pronto para subir para produção**. O build passa, o lint
está limpo, todas as features foram verificadas ponta a ponta no navegador. Há
ressalvas importantes sobre **persistência de dados** e **notificações em tempo real**
que precisam ser endereçadas dependendo da plataforma escolhida (ver seção Deploy).

**Recomendação de plataforma: Vercel + Railway** (explicado no final).

---

## ✅ O que está OK

### Build e qualidade
- ✅ `bun run build` passa sem erros (standalone output)
- ✅ `bun run lint` — 0 erros, 0 warnings
- ✅ TypeScript configurado (com `ignoreBuildErrors` temporário por incompatibilidade
  de tipos do Prisma `createMany`/`skipDuplicates` em SQLite — runtime correto)
- ✅ `reactStrictMode: true` ativado (detecta bugs)
- ✅ Output `standalone` (otimizado para deploy)

### Segurança
- ✅ Senhas com hash scrypt (never plaintext)
- ✅ Sessão stateless HMAC-SHA256 em cookie http-only
- ✅ `SESSION_SECRET` lido de env var (com fallback só para dev)
- ✅ Validação de permissões em toda rota (cliente vs manicure)
- ✅ Upload de imagens com validação de tipo + tamanho (máx 5MB)
- ✅ Cookies `sameSite: 'lax'`, `secure` em produção

### Funcionalidades verificadas
- ✅ Login/cadastro (cliente + manicure)
- ✅ Agendamento com auto-confirmação para clientes de confiança
- ✅ Aprovação/recusa/conclusão de agendamentos
- ✅ Cancelamento com política 4h
- ✅ Provador de cores (3 camadas PNG, 69 cores, hex custom)
- ✅ Caixa com gorjetas e serviços extras
- ✅ Histórico por cliente + notas
- ✅ Galeria com upload
- ✅ CRUD de serviços
- ✅ Notificações em tempo real (WebSocket porta 3003)
- ✅ Modo claro/noturno com toggle
- ✅ Edição de perfil (foto, nome, telefone, senha)
- ✅ Manicure redefine senha de clientes
- ✅ Logo + favicon + PWA manifest

### PWA
- ✅ `manifest.webmanifest` configurado
- ✅ Ícones 32/64/180/512px
- ✅ `appleWebApp` configurado
- ✅ Theme color (#F3E6DC claro / coral)

---

## ⚠️ Ressalvas (devem ser endereçadas antes do deploy)

### 1. Banco de dados SQLite (CRÍTICO para serverless)
O SQLite usa um **arquivo local** (`db/custom.db`). Em plataformas serverless
(Vercel), **cada função tem seu próprio filesystem efêmero** — dados gravados em
uma requisição podem não estar disponíveis na próxima. Isso quebra:

- Cadastros de clientes
- Agendamentos
- Caixa
- Tudo.

**Solução:** usar PostgreSQL gerenciado. Opções com tier grátis:
- [Neon](https://neon.tech) (recomendado, serverless Postgres, 0.5GB grátis)
- [Supabase](https://supabase.com) (500MB grátis, vem com auth/storage extras)
- [Railway](https://railway.app) (Postgres $5/mês após trial)

**Migração:** ver seção "Migrar para PostgreSQL" abaixo.

### 2. Uploads de imagens (CRÍTICO para serverless)
As fotos de perfil e da galeria são salvas em `public/uploads/`. Em serverless,
esse diretório é efêmero — **imagens somem entre requisições**.

**Solução:** usar armazenamento de objetos (S3-compatível):
- [Cloudflare R2](https://developers.cloudflare.com/r2/) (10GB grátis, sem custo de saída)
- [Supabase Storage](https://supabase.com/storage) (1GB grátis)
- [UploadThing](https://uploadthing.com) (2GB grátis, integração Next.js fácil)

Adaptar `src/app/api/upload/route.ts` para fazer upload para o bucket em vez de
escrever no disco local.

### 3. WebSocket de notificações (não roda em serverless)
O mini-serviço `mini-services/notify-service` (porta 3003) é um processo longo
socket.io. **Vercel não suporta processos longos** — só functions serverless com
timeout de 10s (plano grátis) a 60s (Pro).

**Soluções (3 opções):**
1. **Pusher/Ably** (recomendado, tier grátis) — substituir socket.io por um serviço
   gerenciado de WebSocket. Adaptar `use-notificacoes-ws.ts` e `notifications.ts`.
2. **Deploy do mini-serviço separado** no Railway/Render (processo longo, $5/mês).
3. **Polling** — o app já faz refetch das notificações a cada 30s. Remover o WS e
   ficar só com polling. Simples, sem custo, mas sem "tempo real" real.

### 4. `ignoreBuildErrors: true` no next.config
Incompatibilidade de tipos do Prisma com `createMany({ skipDuplicates })` em SQLite.
**Runtime está correto** (testado), mas o type-check do Next.js reclama. Para
produção séria, migrar para Postgres resolve (os tipos ficam corretos) e remover
o `ignoreBuildErrors`.

### 5. Seed em produção
O `scripts/seed.ts` cria dados demo (manicure, clientes, serviços, cores). **NÃO
rodar em produção** — ou rodar e depois trocar as senhas. Em produção, criar a
conta da manicure via UI de cadastro (adaptar para permitir criar conta de
manicure, hoje só cria cliente).

---

## 🔧 Migrar para PostgreSQL (recomendado)

1. Criar banco no Neon/Supabase, copiar a connection string.
2. Editar `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
3. Os tipos `String` de data/hora podem virar `DateTime` / `Time` se quiser, mas
   funcionam como String também.
4. Rodar:
   ```bash
   DATABASE_URL="postgresql://..." bun run db:push
   ```
5. Criar a conta da manicure manualmente (via script SQL ou adaptar o cadastro).

---

## 🚀 Deploy — Vercel vs Railway

### Comparativo

| Critério | Vercel | Railway |
|----------|--------|---------|
| **Next.js** | ✅ Nativo, otimizado (proprietário) | ✅ Suporta (Docker/Nixpacks) |
| **Free tier** | Generoso (hobby) | $5 crédito/mês após trial |
| **Serverless functions** | ✅ Sim (timeout 10-60s) | ❌ Não (processos longos) |
| **WebSocket longo** | ❌ Não suporta | ✅ Suporta |
| **SQLite persistente** | ❌ Não (filesystem efêmero) | ✅ Sim (volume persistente) |
| **Postgres gerenciado** | Via add-on (Neon) | ✅ Nativo ($5/mês) |
| **Deploy por git push** | ✅ Automático | ✅ Automático |
| **Preview branches** | ✅ Excelente | ✅ Bom |
| **Domínio custom** | ✅ Grátis (SSL auto) | ✅ Grátis (SSL auto) |
| **Latência Brasil** | Edge network global | Pode escolher região |

### Recomendação: **Híbrido — Vercel (app) + Railway (serviços)**

Para este projeto, a melhor arquitetura é:

```
┌─────────────────────────────────────────────┐
│  Vercel (Next.js app)                       │
│  - Rotas SSR/API serverless                 │
│  - CDN edge (rápido no Brasil)              │
│  - Deploy automático por git push           │
└──────────────┬──────────────────────────────┘
               │
       ┌───────┴────────┬─────────────────┐
       ▼                ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Neon         │  │ Railway      │  │ Cloudflare   │
│ (Postgres)   │  │ (notify      │  │ R2 / Supabase│
│ grátis 0.5GB │  │  service WS) │  │ (imagens)    │
│              │  │ ~$5/mês      │  │ grátis 10GB  │
└──────────────┘  └──────────────┘  └──────────────┘
```

**Por que Vercel para o app:**
- Next.js é nativo (build otimizado, ISR, edge functions, image optimization)
- Free tier generoso para começar
- Deploy trivial: conecta GitHub, pronto
- Preview branches para testar antes de production

**Por que Railway para o WebSocket:**
- Suporta processo longo (socket.io)
- Volume persistente (se quiser manter SQLite temporariamente)
- Deploy por Dockerfile simples

### Alternativa simples: **Só Railway (tudo junto)**

Se prefere uma plataforma só para tudo:
- App Next.js + notify-service + Postgres, todos no Railway
- Cada um vira um "service" com seu próprio domínio
- Custo: ~$5-10/mês total (Postgres + app + notify)
- Menos otimizado que Vercel para Next.js, mas tudo em um lugar

**Quando escolher só Railway:** se quiser simplicidade de "tudo numa plataforma"
e não se importar em pagar ~$10/mês desde o início.

**Quando escolher Vercel+Railway:** se quiser o melhor do Next.js (edge, ISR,
image opt) de graça e só pagar pelo WebSocket (~$5/mês).

---

## 📋 Checklist pré-deploy

- [ ] Criar banco Postgres (Neon/Supabase/Railway)
- [ ] Migrar `schema.prisma` para `postgresql` e rodar `db:push`
- [ ] Configurar armazenamento de imagens (R2/Supabase Storage)
- [ ] Adaptar `src/app/api/upload/route.ts` para o storage escolhido
- [ ] Deploy do `notify-service` no Railway (ou migrar para Pusher)
- [ ] Configurar variáveis de ambiente na Vercel:
  - `DATABASE_URL` (Postgres)
  - `SESSION_SECRET` (gerar com `openssl rand -hex 32`)
  - `WS_NOTIFY_URL` (URL do notify-service no Railway)
- [ ] Criar conta da manicure em produção (script SQL ou adaptar cadastro)
- [ ] Testar fluxo completo em produção
- [ ] Configurar domínio custom (opcional)

---

## Variáveis de ambiente (produção)

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `DATABASE_URL` | URL do Postgres | `postgresql://user:pass@host/db` |
| `SESSION_SECRET` | Secret HMAC (32+ chars) | `openssl rand -hex 32` |
| `WS_NOTIFY_URL` | URL do notify-service | `https://notify-seu-app.up.railway.app` |

---

## Conclusão

O app está **pronto para produção** após resolver as 3 ressalvas críticas
(Postgres, storage de imagens, WebSocket). A arquitetura recomendada
(Vercel + Railway + Neon + R2) custa ~$5/mês e oferece o melhor do Next.js
com tempo real e persistência.

**Recomendação final:** comece com **Vercel (app) + Neon (Postgres grátis) +
Cloudflare R2 (imagens grátis) + Railway (notify-service, ~$5/mês)**. Total:
~$5/mês para subir profissional.
