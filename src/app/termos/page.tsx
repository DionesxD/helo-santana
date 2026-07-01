import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-background p-6 max-w-md mx-auto">
      <div className="prose prose-sm dark:prose-invert">
        <h1 className="text-2xl font-bold text-foreground">Termos de Uso</h1>
        <p className="text-xs text-muted-foreground">Última atualização: {new Date().getFullYear()}</p>

        <div className="space-y-4 mt-6 text-sm text-muted-foreground">
          <section>
            <h2 className="font-semibold text-foreground mb-1">1. Aceitação</h2>
            <p>Ao usar a plataforma Helo Santana — Nail Designer, você concorda com estes termos. Se não concordar, não use o serviço.</p>
          </section>
          <section>
            <h2 className="font-semibold text-foreground mb-1">2. Agendamentos</h2>
            <p>Os agendamentos estão sujeitos à confirmação da nail designer. Clientes de confiança têm confirmação automática. Cancelamentos com menos de 4 horas de antecedência podem gerar alerta.</p>
          </section>
          <section>
            <h2 className="font-semibold text-foreground mb-1">3. Conta do usuário</h2>
            <p>Você é responsável pela precisão dos dados fornecidos e pela segurança da sua senha.</p>
          </section>
          <section>
            <h2 className="font-semibold text-foreground mb-1">4. Uso aceitável</h2>
            <p>Não use a plataforma para fins ilegais, spam ou assédio.</p>
          </section>
          <section>
            <h2 className="font-semibold text-foreground mb-1">5. Alterações</h2>
            <p>Podemos atualizar estes termos periodicamente. Continuar usando o serviço após mudanças constitui aceitação.</p>
          </section>
        </div>

        <Link href="/">
          <Button variant="outline" className="mt-8">← Voltar</Button>
        </Link>
      </div>
    </div>
  )
}
