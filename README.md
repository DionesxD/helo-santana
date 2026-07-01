# Helo Santana — Plataforma de Agendamento para Nail Designer

Plataforma web mobile-first (PWA) para gestão de agendamentos de manicure/nail designer, com dois perfis: **cliente** e **manicure (admin)**.

## Visão geral

A manicure define sua grade de horários semanal. As clientes solicitam agendamentos dentro dessa grade. Toda solicitação entra como **pendente** até a manicure aprovar — exceto para **clientes de confiança**, cujos agendamentos são confirmados automaticamente.

### Funcionalidades

**Cliente:**
- Cadastro/login (e-mail ou telefone)
- Visualiza horários disponíveis na semana
- Solicita agendamento (serviço + data + horário + cor de esmalte)
- Provador de cores: modelo de mão com 69 cores + código hex personalizado
- Acompanha status: pendente, confirmado, recusado, concluído, cancelado
- Recebe notificações (confirmação, recusa, lembrete 24h)
- Vê histórico de atendimentos
- Cancela agendamento (política de 4h)
- Edita perfil (foto, nome, telefone, senha)
- Favorita cores e vê histórico de cores usadas

**Manicure (admin):**
- Editor manual de grade (grid semanal 8h-17h + horários customizados)
- Aprova ou recus solicitações pendentes
- Marca clientes como "de confiança" (auto-confirmação)
- Visualiza agenda (dia/semana)
- Gerencia caixa: totais por dia/semana/mês, gráfico, gorjetas, serviços extras
- Histórico de atendimento por cliente (com observações/notas)
- Gerencia galeria de modelos (upload + editar + excluir)
- CRUD de serviços e preços
- Exclui clientes pela interface
- Redefine senha de clientes
- Edita próprio perfil

## Tecnologias

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 16 (App Router) |
| Linguagem | TypeScript 5 |
| Estilo | Tailwind CSS 4 + shadcn/ui |
| Banco | Prisma ORM (SQLite dev / Postgres prod) |
| Estado | Zustand (cliente) + TanStack Query (servidor) |
| Tema | next-themes (claro/noturno, padrão noturno) |
| Animações | framer-motion |
| Tempo real | socket.io (mini-serviço, opcional) |
| Auth | Sessão HMAC cookie http-only |
| Runtime | Bun |

## Estrutura de pastas

```
src/
├── app/
│   ├── api/              # API routes REST
│   │   ├── auth/         # login, register, logout, me, perfil, senha
│   │   ├── servicos/     # CRUD de serviços
│   │   ├── cores/        # Lista de cores de esmalte
│   │   ├── galeria/      # CRUD da galeria (GET, POST, PATCH, DELETE)
│   │   ├── horarios/     # Grade de horários (GET, POST, PATCH, DELETE)
│   │   ├── agendamentos/ # Agendamentos + aprovar/recusar/concluir/cancelar
│   │   ├── clientes/     # Lista, confiança, notas, histórico, senha, excluir
│   │   ├── caixa/        # Relatório financeiro + transações avulsas
│   │   ├── notificacoes/ # Lista e marcar como lidas
│   │   ├── upload/       # Upload de imagens
│   │   └── cron/         # Lembrete automático 24h (Vercel Cron)
│   ├── termos/           # Página de Termos de Uso
│   ├── privacidade/      # Página de Política de Privacidade
│   ├── layout.tsx        # Layout raiz
│   ├── page.tsx          # Única rota visível → AppShell
│   └── globals.css       # Tema (claro + escuro) + animações
├── components/
│   ├── ui/               # shadcn/ui + custom-toast (sistema próprio)
│   ├── client/           # Telas do cliente
│   ├── admin/            # Telas da manicure
│   └── ...               # shared (auth, shell, etc.)
├── hooks/                # use-gestures, use-notificacoes-ws, etc.
├── lib/                  # auth, db, format, constants, feedback, etc.
mini-services/
└── notify-service/       # WebSocket de notificações (porta 3003, opcional)
prisma/
├── schema.prisma         # Schema SQLite (dev)
└── schema.postgres.prisma# Schema PostgreSQL (produção)
public/
├── hand-model/           # PNGs do provador de cores (base + mask)
├── logo.png              # Logo da marca
├── favicon*.png          # Favicons
└── manifest.webmanifest  # PWA manifest
```

## Credenciais demo

| Perfil | E-mail | Senha |
|--------|--------|-------|
| Manicure | helo@naildesigner.app | 123456 |
| Cliente (confiança) | ana@exemplo.com | 123456 |
| Cliente (normal) | dani@exemplo.com | 123456 |

## Scripts

```bash
bun run dev          # Servidor de desenvolvimento
bun run lint         # ESLint
bun run build        # Build de produção
bun run db:push      # Sincroniza schema com banco
bun run scripts/seed.ts  # Popula banco com dados demo
```

## Deploy

Veja `docs/deploy-vercel.md` para o passo a passo completo de deploy na Vercel.
