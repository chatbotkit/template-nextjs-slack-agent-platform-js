# Slack Agent Platform Template for Next.js / ChatBotKit / JS

A subscription-based Slack agent platform built with Next.js, NextAuth, Stripe, shadcn/ui, and ChatBotKit. Users sign in, start a subscription, create workspaces backed by ChatBotKit blueprints, deploy one or more Slack-connected AI agents, and add tools to each agent through ChatBotKit skillsets.

> **Note:** This template is deliberately bare-bones. It provides the minimal structure and wiring needed to get a working app, intentionally leaving styling, layout, and architectural choices open so you can build on top without fighting existing opinions.

## Why ChatBotKit?

Building a Slack agent platform usually means stitching together Slack webhook verification, thread routing, conversation state, model calls, tool execution, user identity, billing, and admin screens. ChatBotKit provides the agent, blueprint, skillset, conversation, and Slack integration primitives through one API.

This template is the control plane for those resources. Your app manages users and billing, while ChatBotKit hosts the Slack integration endpoints and runs the agent conversations.

## Features

- **Google OAuth** via NextAuth for authentication
- **Stripe Billing** for subscriptions, trials, checkout, and billing portal access
- **Subscription Gate** before users can create workspaces, agents, tools, or tasks
- **Workspaces** backed by ChatBotKit Blueprints
- **Agents** backed by ChatBotKit Bots
- **Per-Agent Tools** backed by ChatBotKit Skillsets and Abilities
- **Slack Connections** backed by ChatBotKit Slack Integrations
- **Slack Setup URLs** for events, slash commands, and interactivity
- **Agent Chat** for testing each bot outside Slack
- **Tasks** for one-off agent execution from the dashboard
- **shadcn/ui** components with Tailwind CSS

## Getting Started

1. Copy `.env.example` to `.env` and fill in the values:

   ```bash
   cp .env.example .env
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Run the development server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

| Variable                | Required | Description                                                 |
| ----------------------- | -------- | ----------------------------------------------------------- |
| `CHATBOTKIT_API_SECRET` | Yes      | ChatBotKit API token from https://chatbotkit.com/tokens     |
| `CHATBOTKIT_API_URL`    | No       | ChatBotKit public API base for Slack webhook URLs           |
| `NEXTAUTH_SECRET`       | Yes      | Random secret for NextAuth JWT encryption                   |
| `NEXTAUTH_URL`          | Yes      | Your app URL, such as `http://localhost:3000`               |
| `GOOGLE_CLIENT_ID`      | Yes      | Google OAuth client ID                                      |
| `GOOGLE_CLIENT_SECRET`  | Yes      | Google OAuth client secret                                  |
| `STRIPE_SECRET_KEY`     | Yes      | Stripe secret API key                                       |
| `STRIPE_PRICE_MONTHLY`  | Yes      | Stripe Price ID for the monthly subscription                |
| `STRIPE_PRICE_YEARLY`   | No       | Stripe Price ID for the yearly subscription                 |
| `STRIPE_TRIAL_DAYS`     | No       | Trial length in days for new subscriptions                  |
| `BILLING_REQUIRED`      | No       | Set to `true` to block access when Stripe is not configured |
| `STRIPE_WEBHOOK_SECRET` | No       | Stripe webhook signing secret for `/api/stripe/webhook`     |
| `AGENT_MODELS`          | No       | Comma-separated model options for the agent model picker    |

## Setting Up ChatBotKit

1. Sign up or log in at [chatbotkit.com](https://chatbotkit.com)
2. Create an API token at [chatbotkit.com/tokens](https://chatbotkit.com/tokens)
3. Copy the API token to `CHATBOTKIT_API_SECRET`

No pre-configured bots are needed. The app creates blueprints, bots, skillsets, abilities, and Slack integrations dynamically.

## Setting Up Stripe

1. Create a subscription product and price in Stripe
2. Copy the price ID to `STRIPE_PRICE_MONTHLY`
3. Add `STRIPE_SECRET_KEY`
4. Optional: add `STRIPE_PRICE_YEARLY` and `STRIPE_TRIAL_DAYS`
5. Optional: create a webhook endpoint at `https://your-domain.com/api/stripe/webhook`

Recommended Stripe webhook events:

- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`
- `checkout.session.completed`

## Setting Up Slack

After creating an agent, open the agent detail page and go to the **Slack** tab.

1. Create a Slack app in your Slack workspace
2. Add the Slack app signing secret and bot token to the Slack connection form
3. Save the connection
4. Copy the generated ChatBotKit URLs into your Slack app:
   - Event URL
   - Slash Command URL
   - Interactivity URL
5. Click **Validate** to confirm credentials

The Slack integration supports direct messages, mentions, thread replies, slash commands, allow-listing, visible message context, references, ratings, and contact collection through ChatBotKit.

## How It Works

1. User signs in with Google
2. User starts a Stripe subscription
3. User creates a workspace, which creates a ChatBotKit Blueprint
4. User creates an agent inside the workspace
5. Agent creation creates:
   - ChatBotKit Skillset for the agent tools
   - ChatBotKit Bot attached to the workspace blueprint and skillset
   - Starter triage ability inside the skillset
6. User creates a Slack connection for the agent
7. Slack events are delivered to ChatBotKit-hosted integration endpoints
8. The agent responds in Slack using the bot, blueprint, skillset, and integration resources connected together

## Project Structure

```text
├── actions/
│   ├── agent.js          # Agent CRUD and skillset creation
│   ├── billing.js        # Stripe checkout and billing portal actions
│   ├── company.js        # Workspace/blueprint CRUD
│   ├── conversation.jsx  # Dashboard chat streaming
│   ├── slack.js          # Slack integration CRUD and setup
│   ├── task.jsx          # One-off task execution
│   └── tool.js           # Skillset ability CRUD
├── app/
│   ├── agents/           # Agent dashboard and detail pages
│   ├── billing/          # Subscription management page
│   ├── companies/        # Workspace settings
│   ├── tasks/            # Task runner
│   ├── api/auth/         # NextAuth route
│   └── api/stripe/       # Stripe webhook route
├── components/
│   ├── agents/           # Agent forms, chat, Slack, and tools UI
│   ├── ui/               # shadcn/ui primitives
│   └── providers.jsx     # NextAuth session provider
├── lib/
│   ├── billing.js        # Stripe status helpers
│   ├── chatbotkit.js     # ChatBotKit SDK singleton
│   ├── session.js        # Auth + subscription guard
│   ├── stripe.js         # Stripe SDK singleton
│   └── tool-templates.js # Starter tool templates
└── middleware.ts          # Auth middleware for protected routes
```

## Learn More

- [ChatBotKit Documentation](https://chatbotkit.com/docs)
- [ChatBotKit SDK](https://github.com/chatbotkit/node-sdk)
- [Slack API Documentation](https://api.slack.com/docs)
- [Stripe Documentation](https://docs.stripe.com)
- [Next.js Documentation](https://nextjs.org/docs)
- [next-auth Documentation](https://next-auth.js.org)

## License

MIT - see [LICENSE](./LICENSE)
