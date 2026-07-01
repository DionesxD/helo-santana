import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-background p-6 max-w-md mx-auto">
      <div className="prose prose-sm dark:prose-invert">
        <h1 className="text-2xl font-bold text-foreground">Política de Privacidade</h1>
        <p className="text-xs text-muted-foreground">Última atualização: {new Date().getFullYear()}</p>

        <div className="space-y-4 mt-6 text-sm text-muted-foreground">
          <section>
            <h2 className="font-semibold text-foreground mb-1">1. Dados que coletamos</h2>
            <p>Coletamos nome, telefone e/ou e-mail para criar sua conta e gerenciar agendamentos. Também armazenamos seu histórico de atendimentos e observações da nail designer.</p>
          </section>
          <section>
            <h2 className="font-semibold text-foreground mb-1">2. Uso dos dados</h2>
            <p>Usamos seus dados exclusivamente para: gerenciar agendamentos, enviar notificações (confirmação, recusa, lembretes) e manter o histórico de atendimentos.</p>
          </section>
          <section>
            <h2 className="font-semibold text-foreground mb-1">3. Fotos do provador</h2>
            <p>No provador de cores, nenhuma foto sua é enviada para a internet — todo o processamento acontece no seu dispositivo.</p>
          </section>
          <section>
            <h2 className="font-semibold text-foreground mb-1">4. Compartilhamento</h2>
            <p>Não compartilhamos seus dados com terceiros. Apenas a nail designer tem acesso aos seus agendamentos e histórico.</p>
          </section>
          <section>
            <h2 className="font-semibold text-foreground mb-1">5. Segurança</h2>
            <p>Senhas são armazenadas com hash (nunca em texto puro). A sessão usa cookies http-only assinados.</p>
          </section>
          <section>
            <h2 className="font-semibold text-foreground mb-1">6. Seus direitos</h2>
            <p>Você pode solicitar acesso, correção ou exclusão dos seus dados a qualquer momento entrando em contato com a nail designer.</p>
          </section>
        </div>

        <Link href="/">
          <Button variant="outline" className="mt-8">← Voltar</Button>
        </Link>
      </div>
    </div>
  )
}
