'use server'

import { getChatBotKitClient } from '@/lib/chatbotkit'
import { requireSession } from '@/lib/session'
import { getToolTemplate } from '@/lib/tool-templates'

const cbk = getChatBotKitClient()

async function fetchAgentConfig(agentId) {
  const agent = await cbk.bot.fetch(agentId)

  return {
    id: agent.id,
    name: agent.name || 'Agent',
    description: agent.description || '',
    blueprintId: agent.blueprintId,
    skillsetId: agent.skillsetId,
  }
}

async function ensureAgentSkillset(agent) {
  if (agent.skillsetId) {
    return agent.skillsetId
  }

  const skillset = await cbk.skillset.create({
    blueprintId: agent.blueprintId,
    name: `${agent.name} Tools`,
    description: `Tools available to ${agent.name}.`,
    visibility: 'private',
    state: 'enabled',
    meta: {
      agentId: agent.id,
      managedBy: 'slack-agent-platform-template',
    },
  })

  await cbk.bot.update(agent.id, {
    skillsetId: skillset.id,
  })

  return skillset.id
}

export async function listAgentTools(agentId) {
  await requireSession()

  const agent = await fetchAgentConfig(agentId)

  if (!agent.skillsetId) {
    return []
  }

  const { items } = await cbk.skillset.ability.list(agent.skillsetId, {
    take: 100,
    order: 'desc',
  })

  return items.map(
    ({ id, name, description, instruction, state, createdAt, updatedAt }) => ({
      id,
      name: name || 'Untitled Tool',
      description: description || '',
      instruction: instruction || '',
      state,
      createdAt,
      updatedAt,
    })
  )
}

/**
 * @param {{
 *   agentId: string,
 *   name?: string,
 *   description?: string,
 *   instruction?: string,
 *   templateKey?: string,
 *   slackIntegrationId?: string,
 * }} params
 */
export async function createAgentTool({
  agentId,
  name,
  description,
  instruction,
  templateKey,
  slackIntegrationId,
}) {
  await requireSession()

  const agent = await fetchAgentConfig(agentId)
  const skillsetId = await ensureAgentSkillset(agent)

  let toolName = name
  let toolDescription = description
  let toolInstruction = instruction

  if (templateKey) {
    const template = getToolTemplate(templateKey)

    if (!template) {
      throw new Error(`Unknown tool template "${templateKey}"`)
    }

    if (template.requiresSlackIntegration && !slackIntegrationId) {
      throw new Error('Slack integration required for this tool template')
    }

    toolName = toolName || template.name
    toolDescription = toolDescription || template.description
    toolInstruction = template.buildInstruction({ slackIntegrationId })
  }

  if (
    !toolName?.trim() ||
    !toolDescription?.trim() ||
    !toolInstruction?.trim()
  ) {
    throw new Error('Tool name, description, and instruction are required')
  }

  const ability = await cbk.skillset.ability.create(skillsetId, {
    blueprintId: agent.blueprintId,
    botId: agent.id,
    name: toolName,
    description: toolDescription,
    instruction: toolInstruction,
    state: 'enabled',
    meta: {
      agentId: agent.id,
      templateKey: templateKey || 'custom',
      slackIntegrationId: slackIntegrationId || '',
    },
  })

  return {
    id: ability.id,
    name: toolName,
    description: toolDescription,
    instruction: toolInstruction,
    state: 'enabled',
  }
}

export async function deleteAgentTool(agentId, abilityId) {
  await requireSession()

  const agent = await fetchAgentConfig(agentId)

  if (!agent.skillsetId) {
    throw new Error('Agent has no skillset')
  }

  await cbk.skillset.ability.delete(agent.skillsetId, abilityId)

  return { id: abilityId }
}
