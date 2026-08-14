# valdez-site

Landing page pública + painel de administrador do bot Valdez.

- `/` — landing (história, como funciona, planos)
- `/privacidade` e `/termos` — obrigatórios para bot público que captura voz
- `/admin` — painel: MRR, servidores, clipes, feedback, estabilidade

## Deploy (Vercel)

```bash
vercel login          # precisa da sua conta
vercel link
vercel --prod
```

`vercel.json` já reescreve tudo para `index.html` (SPA).

## Variáveis de ambiente (Vercel → Settings → Environment Variables)

| Variável | Para quê | Obrigatória |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | painel lê os dados | só para `/admin` |
| `VITE_SUPABASE_ANON_KEY` | idem | só para `/admin` |
| `VITE_INVITE_URL` | sobrescreve o convite padrão do bot | não |
| `VITE_SUPPORT_URL` | link do servidor de suporte no rodapé | não |
| `VITE_CONTACT_EMAIL` | e-mail nas páginas legais | não |

Nunca colocar a `service_role` aqui — ela vive só no bot. O painel usa a chave
anon e depende da RLS: quem não estiver em `valdez.admins` faz login e não lê
nada.

## Antes do painel funcionar

1. Expor o schema `valdez` na API do projeto Supabase (Settings → API → Exposed schemas).
2. Inserir seu `auth.uid()` em `valdez.admins`.
3. Adicionar a URL do site em Authentication → URL Configuration (redirect do magic link).
