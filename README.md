# Portal Guiman News

Blog de notícias automático com RSS, otimizado para mobile.
Desenvolvido por **Guiman System** — guimansystem.com.br

---

## Stack

- Next.js 14 (App Router)
- Tailwind CSS — UI mobile-first
- libsql — SQLite leve, sem servidor externo
- rss-parser — consome feeds RSS automaticamente

---

## Setup local

```bash
git clone <repo>
cd portal-guiman-news
npm install
cp .env.example .env
npm run dev
```

Acesse http://localhost:3000

---

## Buscar notícias (primeira vez)

Acesse no browser:
  http://localhost:3000/api/fetch-news?secret=guiman2024

Isso popula o banco com notícias dos feeds RSS configurados.

---

## Automatizar no Vercel (cron)

Crie o arquivo vercel.json na raiz:

```json
{
  "crons": [
    {
      "path": "/api/fetch-news?secret=SEU_SECRET",
      "schedule": "0 * * * *"
    }
  ]
}
```

---

## Deploy no Vercel

1. Push para GitHub
2. Importe o projeto em vercel.com
3. Adicione as variáveis de ambiente (veja .env.example)
4. Deploy!

IMPORTANTE: O SQLite no Vercel é efêmero.
Para banco persistente em produção, use Turso (gratuito):
  https://turso.tech

Com Turso, altere DATABASE_URL para:
  libsql://guiman-news-xxxxx.turso.io
E adicione:
  TURSO_AUTH_TOKEN=seu_token

---

## Adicionar novos feeds RSS

Edite lib/db.ts e adicione na array feeds:
  { id: "f16", url: "https://site.com/rss.xml", category: "Tecnologia", name: "Nome do Feed" }

---

## QR Code para o carro

Gere em: qr-code-generator.com
Aponte para a URL do seu blog em produção.
Imprima em 10x10cm e cole no carro.
