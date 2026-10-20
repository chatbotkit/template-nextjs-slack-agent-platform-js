import { ChatBotKit } from '@chatbotkit/sdk'

import 'server-only'

let client = null

export function getChatBotKitClient() {
  if (!process.env.CHATBOTKIT_API_TOKEN) {
    throw new Error('Missing CHATBOTKIT_API_TOKEN')
  }

  if (!client) {
    client = new ChatBotKit({
      secret: process.env.CHATBOTKIT_API_TOKEN,
    })
  }

  return client
}
