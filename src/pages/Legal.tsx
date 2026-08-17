import { Link } from 'react-router-dom'

const CONTACT = (import.meta.env.VITE_CONTACT_EMAIL as string | undefined) ?? 'samuelstefanodocarmo@gmail.com'
const UPDATED = '14 de agosto de 2026'

function Page({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <Link to="/" className="text-sm text-white/50 hover:text-white">
        ← Voltar
      </Link>
      <h1 className="mt-6 text-3xl font-bold">{title}</h1>
      <p className="mt-2 text-sm text-white/40">Última atualização: {UPDATED}</p>
      <div className="mt-8 space-y-6 leading-relaxed text-white/70 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-white [&_li]:ml-5 [&_li]:list-disc">
        {children}
      </div>
    </div>
  )
}

export function Privacidade() {
  return (
    <Page title="Política de Privacidade">
      <section>
        <h2>O que o Valdez guarda</h2>
        <p>
          Enquanto o bot está num canal de voz, ele mantém em memória os últimos minutos de áudio de quem
          está falando — 1min30, 15 ou 30 minutos, conforme o plano do servidor. Esse áudio existe apenas na
          memória do servidor onde o bot roda e é descartado continuamente: passou da janela, sumiu.
        </p>
        <p>
          Áudio só vira arquivo quando alguém do servidor usa <code>/clip</code> ou <code>/replay</code>. O
          arquivo é enviado ao canal do Discord escolhido pelo servidor e apagado da nossa máquina em
          seguida. A partir daí ele pertence ao servidor, não a nós.
        </p>
      </section>

      <section>
        <h2>Dados que ficam salvos</h2>
        <ul>
          <li>ID e nome do servidor, canais configurados e contagem de membros.</li>
          <li>Tempo de call por membro (ID e apelido do Discord), para o ranking de horas.</li>
          <li>Lista de quem pediu opt-out de gravação.</li>
          <li>Contadores de uso: quantos clipes, quantas músicas, quando o bot ficou fora do ar.</li>
          <li>Mensagens enviadas por <code>/feedback</code>, com o ID de quem escreveu.</li>
        </ul>
        <p>Nunca lemos mensagens de texto do servidor nem gravamos áudio fora do canal configurado.</p>
      </section>

      <section>
        <h2>Consentimento</h2>
        <p>
          Sempre que está capturando áudio, o bot mantém <strong>[REC]</strong> no próprio apelido dentro do
          servidor. Se ele não conseguir mudar o apelido, ele não liga a captura.
        </p>
        <p>
          Qualquer membro pode se remover com <code>/privacidade optout</code>. A partir daí a voz dessa
          pessoa não entra no buffer nem por um instante, e o que já estava guardado dela é descartado na
          hora.
        </p>
      </section>

      <section>
        <h2>Seus direitos (LGPD)</h2>
        <p>
          Você pode pedir acesso, correção ou exclusão dos seus dados escrevendo para{' '}
          <a href={`mailto:${CONTACT}`} className="text-accent hover:underline">
            {CONTACT}
          </a>
          . Atendemos em até 15 dias. Quando o bot é removido de um servidor, apagamos as configurações e o
          histórico daquele servidor.
        </p>
        <p>
          Clipes já publicados ficam no canal do Discord de vocês — para apagá-los, basta apagar a mensagem.
        </p>
      </section>

      <section>
        <h2>Terceiros</h2>
        <p>
          Usamos o Discord (para funcionar) e o Supabase (para guardar as informações listadas acima). Não
          vendemos, alugamos nem compartilhamos dados com anunciantes.
        </p>
      </section>
    </Page>
  )
}

export function Termos() {
  return (
    <Page title="Termos de Uso">
      <section>
        <h2>O serviço</h2>
        <p>
          O Valdez é um bot de Discord que grava trechos curtos de conversa em call e toca música. Ele é
          contratado pelo dono ou administrador de um servidor, e todos os membros daquele servidor podem
          usá-lo sem custo adicional.
        </p>
      </section>

      <section>
        <h2>Plano grátis e assinatura</h2>
        <ul>
          <li>
            Todo servidor novo entra no plano grátis, sem cartão e sem prazo. Nele o bot fica na call e
            guarda os últimos 30 segundos.
          </li>
          <li>Não existe período de teste dos planos pagos: o que é pago só liga depois do pagamento.</li>
          <li>A assinatura é mensal, por servidor, e pode ser cancelada a qualquer momento.</li>
          <li>
            Servidores que assinaram dentro da promoção de fundador mantêm o preço promocional enquanto a
            assinatura não for cancelada.
          </li>
          <li>
            Cancelou, o bot para no fim do período já pago e o servidor volta pro grátis. Não há reembolso
            proporcional.
          </li>
        </ul>
      </section>

      <section>
        <h2>Uso aceitável</h2>
        <p>
          Você concorda em não usar o Valdez para gravar pessoas em contexto onde isso seja ilegal, para
          assediar alguém, ou para distribuir o áudio de terceiros fora do servidor sem consentimento. O bot
          sinaliza a gravação e oferece opt-out justamente para isso — usar por cima desses avisos é
          responsabilidade de quem usa.
        </p>
        <p>Podemos suspender um servidor que viole esta seção, sem reembolso.</p>
      </section>

      <section>
        <h2>Disponibilidade</h2>
        <p>
          O serviço é fornecido "como está". Fazemos o possível para manter o bot no ar, mas ele depende do
          Discord e da infraestrutura de terceiros. Não garantimos disponibilidade ininterrupta nem nos
          responsabilizamos por áudio que não tenha sido capturado por indisponibilidade.
        </p>
      </section>

      <section>
        <h2>Contato</h2>
        <p>
          Dúvidas, cancelamento ou problemas:{' '}
          <a href={`mailto:${CONTACT}`} className="text-accent hover:underline">
            {CONTACT}
          </a>
          .
        </p>
      </section>
    </Page>
  )
}
