import { ChatBotKit } from '@chatbotkit/sdk'

import 'server-only'

let client = null

export function getChatBotKitClient() {
  if (!process.env.CHATBOTKIT_API_SECRET) {
    throw new Error('Missing CHATBOTKIT_API_SECRET')
  }

  if (!client) {
    client = new ChatBotKit({
      secret: process.env.CHATBOTKIT_API_SECRET,
    })
  }

  return client
}
