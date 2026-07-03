'use server'

import { getChatBotKitClient } from '@/lib/chatbotkit'
import { requireSession } from '@/lib/session'

const cbk = getChatBotKitClient()

function getChatBotKitApiUrl() {
  const baseUrl = (
    process.env.CHATBOTKIT_API_URL || 'https://api.chatbotkit.com/v1'
  )
    .replace(/\/$/, '')
    .replace(/\/api\/v1$/, '/v1')

  return baseUrl.endsWith('/v1') ? baseUrl : `${baseUrl}/v1`
}

function getSlackUrls(slackIntegrationId) {
  const baseUrl = getChatBotKitApiUrl()

  return {
    eventUrl: `${baseUrl}/integration/slack/${slackIntegrationId}/event`,
    commandUrl: `${baseUrl}/integration/slack/${slackIntegrationId}/command`,
    interactionUrl: `${baseUrl}/integration/slack/${slackIntegrationId}/interaction`,
  }
}

async function fetchAgentConfig(agentId) {
  const agent = await cbk.bot.fetch(agentId)

  return {
    id: agent.id,
    name: agent.name || 'Slack Agent',
    description: agent.description || '',
    blueprintId: agent.blueprintId,
  }
}

function normalizeCredential(value) {
  if (value === undefined) {
    return undefined
  }

  const credential = String(value)

  if (!credential.trim()) {
    return null
  }

  return credential
}

function mapSlackIntegration(integration) {
  return {
    id: integration.id,
    name: integration.name || 'Slack Agent',
    description: integration.description || '',
    blueprintId: integration.blueprintId,
    botId: integration.botId,
    signingSecret: integration.signingSecret || '',
    botToken: integration.botToken || '',
    userToken: integration.userToken || '',
    contactCollection: Boolean(integration.contactCollection),
    sessionDuration: integration.sessionDuration || 0,
    references: Boolean(integration.references),
    ratings: Boolean(integration.ratings),
    visibleMessages: integration.visibleMessages ?? 5,
    autoRespond: integration.autoRespond || '',
    allowFrom: integration.allowFrom || '*',
    urls: getSlackUrls(integration.id),
    createdAt: integration.createdAt,
    updatedAt: integration.updatedAt,
  }
}

export async function listAgentSlackIntegrations(agentId) {
  await requireSession()

  const agent = await fetchAgentConfig(agentId)
  const { items } = await cbk.integration.slack.list({
    blueprintId: agent.blueprintId,
    take: 100,
    order: 'desc',
  })

  return items
    .filter((integration) => integration.botId === agent.id)
    .map(mapSlackIntegration)
}

/**
 * @param {{
 *   agentId: string,
 *   name?: string,
 *   description?: string,
 *   signingSecret?: string,
 *   botToken?: string,
 *   userToken?: string,
 *   contactCollection?: boolean,
 *   sessionDuration?: number,
 *   references?: boolean,
 *   ratings?: boolean,
 *   visibleMessages?: number,
 *   autoRespond?: string,
 *   allowFrom?: string,
 * }} params
 */
export async function createAgentSlackIntegration(params) {
  await requireSession()

  const agent = await fetchAgentConfig(params.agentId)
  const name = params.name?.trim() || `${agent.name} Slack`
  const description =
    params.description?.trim() ||
    `Slack workspace connection for ${agent.name}.`

  const integration = await cbk.integration.slack.create({
    blueprintId: agent.blueprintId,
    botId: agent.id,
    name,
    description,
    signingSecret: normalizeCredential(params.signingSecret),
    botToken: normalizeCredential(params.botToken),
    userToken: normalizeCredential(params.userToken),
    contactCollection: Boolean(params.contactCollection),
    sessionDuration: Number(params.sessionDuration || 0),
    attachments: false,
    references: Boolean(params.references),
    ratings: Boolean(params.ratings),
    visibleMessages: Number(params.visibleMessages ?? 5),
    autoRespond: params.autoRespond || '',
    allowFrom: params.allowFrom || '*',
    meta: {
      agentId: agent.id,
      managedBy: 'slack-agent-platform-template',
    },
  })

  return {
    id: integration.id,
    name,
    description,
    botId: agent.id,
    blueprintId: agent.blueprintId,
    urls: getSlackUrls(integration.id),
  }
}

/**
 * @param {string} slackIntegrationId
 * @param {{
 *   agentId: string,
 *   name?: string,
 *   description?: string,
 *   signingSecret?: string,
 *   botToken?: string,
 *   userToken?: string,
 *   contactCollection?: boolean,
 *   sessionDuration?: number,
 *   references?: boolean,
 *   ratings?: boolean,
 *   visibleMessages?: number,
 *   autoRespond?: string,
 *   allowFrom?: string,
 * }} params
 */
export async function updateAgentSlackIntegration(slackIntegrationId, params) {
  await requireSession()

  const agent = await fetchAgentConfig(params.agentId)

  await cbk.integration.slack.update(slackIntegrationId, {
    blueprintId: agent.blueprintId,
    botId: agent.id,
    name: params.name?.trim() || `${agent.name} Slack`,
    description:
      params.description?.trim() ||
      `Slack workspace connection for ${agent.name}.`,
    signingSecret: normalizeCredential(params.signingSecret),
    botToken: normalizeCredential(params.botToken),
    userToken: normalizeCredential(params.userToken),
    contactCollection: Boolean(params.contactCollection),
    sessionDuration: Number(params.sessionDuration || 0),
    attachments: false,
    references: Boolean(params.references),
    ratings: Boolean(params.ratings),
    visibleMessages: Number(params.visibleMessages ?? 5),
    autoRespond: params.autoRespond || '',
    allowFrom: params.allowFrom || '*',
    meta: {
      agentId: agent.id,
      managedBy: 'slack-agent-platform-template',
    },
  })

  return { id: slackIntegrationId, urls: getSlackUrls(slackIntegrationId) }
}

export async function setupAgentSlackIntegration(slackIntegrationId) {
  await requireSession()

  await cbk.integration.slack.setup(slackIntegrationId)

  return { id: slackIntegrationId }
}

export async function deleteAgentSlackIntegration(slackIntegrationId) {
  await requireSession()

  await cbk.integration.slack.delete(slackIntegrationId)

  return { id: slackIntegrationId }
}
