'use server'

import { getChatBotKitClient } from '@/lib/chatbotkit'
import { requireSession } from '@/lib/session'
import { getToolTemplate } from '@/lib/tool-templates'

const cbk = getChatBotKitClient()

/**
 * Lists all agents (bots) for a given company (blueprint).
 *
 * @param {string} companyId - The blueprint ID
 */
export async function listAgents(companyId) {
  await requireSession()

  const { items } = await cbk.bot.list()

  // Filter bots that belong to this blueprint
  const agents = items.filter((bot) => bot.blueprintId === companyId)

  return agents.map(
    ({ id, name, description, backstory, skillsetId, createdAt }) => ({
      id,
      name: name || 'Unnamed Agent',
      description: description || '',
      backstory: backstory || '',
      skillsetId,
      createdAt,
    })
  )
}

/**
 * Creates a new agent (bot) inside a company (blueprint).
 *
 * @param {{ companyId: string, name: string, description: string, backstory: string, model: string }} params
 */
export async function createAgent({
  companyId,
  name,
  description,
  backstory,
  model,
}) {
  await requireSession()

  const skillset = await cbk.skillset.create({
    blueprintId: companyId,
    name: `${name} Tools`,
    description: `Tools available to ${name} in Slack and dashboard chats.`,
    visibility: 'private',
    state: 'enabled',
    meta: {
      managedBy: 'slack-agent-platform-template',
    },
  })

  const bot = await cbk.bot.create({
    blueprintId: companyId,
    skillsetId: skillset.id,
    name,
    description,
    backstory:
      backstory ||
      `You are ${name}, a Slack-native AI agent. You help teammates from direct messages, mentions, and threads. Keep replies concise, preserve thread context, and use your configured tools when action is needed.`,
    model: model || 'gpt-5.4-mini',
  })

  const triageTool = getToolTemplate('triage')

  await cbk.skillset.ability.create(skillset.id, {
    blueprintId: companyId,
    botId: bot.id,
    name: triageTool.name,
    description: triageTool.description,
    instruction: triageTool.buildInstruction(),
    state: 'enabled',
    meta: {
      agentId: bot.id,
      templateKey: triageTool.key,
      managedBy: 'slack-agent-platform-template',
    },
  })

  await cbk.skillset.update(skillset.id, {
    meta: {
      agentId: bot.id,
      managedBy: 'slack-agent-platform-template',
    },
  })

  return {
    id: bot.id,
    name,
    description,
    backstory,
    skillsetId: skillset.id,
  }
}

/**
 * Fetches a single agent (bot) by ID.
 *
 * @param {string} agentId
 */
export async function fetchAgent(agentId) {
  await requireSession()

  const bot = await cbk.bot.fetch(agentId)

  return {
    id: bot.id,
    name: bot.name || 'Unnamed Agent',
    description: bot.description || '',
    backstory: bot.backstory || '',
    model: bot.model || '',
    blueprintId: bot.blueprintId,
    skillsetId: bot.skillsetId,
    createdAt: bot.createdAt,
  }
}

/**
 * Updates an agent's name and/or backstory.
 *
 * @param {string} agentId
 * @param {{ name?: string, description?: string, backstory?: string, model?: string }} updates
 */
export async function updateAgent(
  agentId,
  { name, description, backstory, model }
) {
  await requireSession()

  await cbk.bot.update(agentId, {
    ...(name !== undefined ? { name } : {}),
    ...(description !== undefined ? { description } : {}),
    ...(backstory !== undefined ? { backstory } : {}),
    ...(model !== undefined ? { model } : {}),
  })
}

/**
 * Deletes an agent (bot) by ID.
 *
 * @param {string} agentId
 */
export async function deleteAgent(agentId) {
  await requireSession()

  const bot = await cbk.bot.fetch(agentId)
  const { items: slackIntegrations } = await cbk.integration.slack.list({
    blueprintId: bot.blueprintId,
    take: 100,
  })

  await Promise.all(
    slackIntegrations
      .filter((integration) => integration.botId === agentId)
      .map((integration) => cbk.integration.slack.delete(integration.id))
  )

  await cbk.bot.delete(agentId)

  if (bot.skillsetId) {
    await cbk.skillset.delete(bot.skillsetId)
  }
}
