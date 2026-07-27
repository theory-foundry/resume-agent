This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
|---|---|---|
| `OPENAI_API_KEY` | ✅ Yes | Your OpenAI API key (used by the `/chat` AI feature) |
| `OPENAI_MODEL` | No | OpenAI model to use (defaults to `gpt-4o-mini`) |

> **Note:** The `/chat` page will show an error if `OPENAI_API_KEY` is not set.

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

The AI chat is available at [http://localhost:3000/chat](http://localhost:3000/chat).

## AI Chat Feature

The portfolio includes an embedded LLM chat powered by:

- **Frontend:** [Vercel AI SDK](https://sdk.vercel.ai/) (`ai` / `@ai-sdk/react`) — `useChat` hook with streaming support
- **Backend:** [LangChain.js](https://js.langchain.com/) (`@langchain/openai`) — API route at `/api/chat`

The chat streams token-by-token responses and maintains conversation history in the UI session.

## Deploy on Vercel

The easiest way to deploy is with the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

**Required Vercel environment variables:**

1. Go to your project in the Vercel dashboard → **Settings → Environment Variables**
2. Add `OPENAI_API_KEY` with your OpenAI API key
3. Optionally add `OPENAI_MODEL` to override the default model

Check out the [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel AI SDK Documentation](https://sdk.vercel.ai/docs)
- [LangChain.js Documentation](https://js.langchain.com/docs)
