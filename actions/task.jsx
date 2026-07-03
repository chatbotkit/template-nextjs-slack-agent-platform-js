'use server'

import { getChatBotKitClient } from '@/lib/chatbotkit'
import { requireSession } from '@/lib/session'

import { streamComplete } from '@chatbotkit/react/actions/complete'

const cbk = getChatBotKitClient()

/**
 * Dispatches a one-off task to an agent. Uses the streaming complete API to
 * send the task description as a user message and stream the agent's response.
 *
 * @param {{ botId: string, task: string }} params
 */
export async function dispatchTask({ botId, task }) {
  await requireSession()

  return streamComplete({
    client: cbk.conversation,

    botId,

    messages: [{ type: 'user', text: task }],

    functions: [
      {
        name: 'getCurrentTime',
        description: 'Gets the current date and time',
        parameters: {},
        handler: async () => {
          return {
            result: {
              time: new Date().toISOString(),
            },
          }
        },
      },
    ],
  })
}
