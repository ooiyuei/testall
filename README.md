This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## 環境変数

| 変数名 | 用途 | 必須 |
|---|---|---|
| `ANTHROPIC_API_KEY` | Claude Vision による答案画像の自動解析（画像入力機能） | 画像入力を使う場合は必須 |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 接続 | 認証・DB機能 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 接続 | 認証・DB機能 |

`ANTHROPIC_API_KEY` が未設定の場合、テキスト診断（`/api/diagnose`）はフォールバックで動作しますが、写真入力（`/api/diagnose-from-image`）は「準備中」表示になります。本番環境では Vercel の Environment Variables に設定してください。
