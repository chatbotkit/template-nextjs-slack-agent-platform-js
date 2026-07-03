export const TOOL_TEMPLATES = [
  {
    key: 'slackMessage',
    name: 'Send Slack Message',
    description: 'Send a message to a Slack channel or direct message.',
    requiresSlackIntegration: true,
    buildInstruction({ slackIntegrationId = '' } = {}) {
      return `template: slack/message/send
params:
  slackIntegrationId: '${slackIntegrationId}'
  channel: ''
  text: ''`
    },
  },
  {
    key: 'startSlackConversation',
    name: 'Start Slack Conversation',
    description:
      'Start a new Slack thread, channel message, or direct message.',
    requiresSlackIntegration: true,
    buildInstruction({ slackIntegrationId = '' } = {}) {
      return `template: slack/conversation/start[by-id]
params:
  slackIntegrationId: '${slackIntegrationId}'
  channel: ''
  text: ''`
    },
  },
  {
    key: 'triage',
    name: 'Triage Request',
    description: 'Classify Slack requests by urgency, owner, and next action.',
    requiresSlackIntegration: false,
    buildInstruction() {
      return `When a Slack request needs triage, classify it into urgency, owner, summary, blockers, and next action. Return a concise structured result that the agent can use before replying.`
    },
  },
]

export function getToolTemplate(templateKey) {
  return TOOL_TEMPLATES.find((template) => template.key === templateKey)
}
