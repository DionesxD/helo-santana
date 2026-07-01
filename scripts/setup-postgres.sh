#!/bin/bash
# ============================================================
# Setup PostgreSQL para produção (Vercel + Neon)
# ============================================================
# Este script troca o schema Prisma de SQLite para PostgreSQL,
# roda db:push e cria a conta da manicure.
#
# Uso:
#   DATABASE_URL="postgresql://..." bash scripts/setup-postgres.sh
# ============================================================

set -e

if [ -z "$DATABASE_URL" ]; then
  echo "❌ Defina DATABASE_URL antes de rodar:"
  echo "   DATABASE_URL=\"postgresql://...\" bash scripts/setup-postgres.sh"
  exit 1
fi

echo "📦 Trocando schema para PostgreSQL..."
cp prisma/schema.postgres.prisma prisma/schema.prisma

echo "🗄️  Sincronizando schema com o banco..."
bun run db:push

echo "🌱 Criando conta da manicure (Helo Santana)..."
bun run scripts/seed-prod.ts

echo ""
echo "✅ Pronto! Banco PostgreSQL configurado."
echo "   Faça commit do schema atualizado e deploy na Vercel."
echo ""
echo "   Credenciais da manicure:"
echo "   email: helo@naildesigner.app"
echo "   senha: 123456  (TROQUE APÓS O PRIMEIRO LOGIN)"
